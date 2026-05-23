// server/index.js
// Hlavný backend pre aplikáciu Bitewise
// - Express API
// - MongoDB databáza
// - Reset hesla cez e‑mail
// - Generovanie receptov cez OpenAI
import express from "express"; // web framework pre API
import cors from "cors"; // povolenie CORS pre klienta
import { MongoClient } from "mongodb"; // MongoDB klient
import bcrypt from "bcryptjs"; // hashovanie hesiel
import dotenv from "dotenv"; // načítanie .env súboru
import { Resend } from "resend"; // odosielanie emailov
import crypto from "crypto"; // generovanie tokenov
import path from "path"; // práca s cestami
import OpenAI from "openai"; // OpenAI SDK

// Načítanie .env (kľúče, heslá, URL)
dotenv.config({ path: path.resolve("../server/.env") }); // načítanie env premenných
// Rýchla kontrola, či .env premenné existujú
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM = process.env.RESEND_FROM || "support.bitewise@gmail.com";
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
console.log("RESEND_API_KEY:", RESEND_API_KEY ? "SET" : "MISSING"); // kontrola API kluca
console.log("RESEND_FROM:", RESEND_FROM); // kontrola odosielatela
console.log("FRONTEND_URL:", process.env.FRONTEND_URL); // kontrola FE URL



// Express aplikácia + základné middleware
const app = express(); // vytvorenie Express aplikácie
app.use(cors()); // povolí volania z mobilného klienta
app.use(express.json()); // parsovanie JSON v requestoch (body -> objekt)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`,
    );
  });
  next();
});

// Konfigurácia servera a MongoDB klienta
const PORT = process.env.PORT || 3000; // port, kde server počúva
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017"; // MongoDB URL
const client = new MongoClient(MONGO_URI); // MongoDB klient
const FRONTEND_URL = String(process.env.FRONTEND_URL || "").replace(/\/+$/, "");
const WEB_ROOT = path.join(path.resolve(), "Web");
const OPEN_FOOD_FACTS_SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";
const OPEN_FOOD_FACTS_SEARCH_FIELDS =
  "code,product_name,brands,quantity,product_quantity,image_url,nutriments";
const OPEN_FOOD_FACTS_USER_AGENT =
  process.env.OPEN_FOOD_FACTS_USER_AGENT ||
  (FRONTEND_URL ? `Bitewise/1.0 (${FRONTEND_URL})` : "Bitewise/1.0");
const FOOD_FACTS_SEARCH_CACHE_MS = 10 * 60 * 1000;
const foodFactsSearchCache = new Map();
const GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";
const GOOGLE_ALLOWED_CLIENT_IDS = (
  process.env.GOOGLE_CLIENT_IDS ||
  process.env.GOOGLE_WEB_CLIENT_ID ||
  ""
)
  .split(",")
  .map((clientId) => clientId.trim())
  .filter(Boolean);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function createGoogleNick(profile) {
  return (
    profile.name ||
    profile.given_name ||
    normalizeEmail(profile.email).split("@")[0] ||
    "Používateľ"
  );
}

function normalizeTextForSearch(value) {
  if (!value) return "";
  try {
    return String(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, " ")
      .trim();
  } catch (e) {
    return String(value).toLowerCase().trim();
  }
}

function levenshtein(a, b) {
  const A = String(a || "");
  const B = String(b || "");
  const matrix = [];
  for (let i = 0; i <= B.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= A.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= B.length; i++) {
    for (let j = 1; j <= A.length; j++) {
      if (B.charAt(i - 1) === A.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1),
        );
      }
    }
  }
  return matrix[B.length][A.length];
}

function countSharedLetters(input, name) {
  const inputChars = Array.from(normalizeTextForSearch(input).replace(/\s+/g, ""));
  const nameChars = Array.from(normalizeTextForSearch(name).replace(/\s+/g, ""));
  const nameCounts = new Map();

  for (const char of nameChars) {
    nameCounts.set(char, (nameCounts.get(char) || 0) + 1);
  }

  let shared = 0;
  for (const char of inputChars) {
    const count = nameCounts.get(char) || 0;
    if (count > 0) {
      shared += 1;
      nameCounts.set(char, count - 1);
    }
  }

  return shared;
}

function countOrderedLetters(input, name) {
  const inputChars = Array.from(normalizeTextForSearch(input).replace(/\s+/g, ""));
  const nameChars = Array.from(normalizeTextForSearch(name).replace(/\s+/g, ""));
  let nameIndex = 0;
  let ordered = 0;

  for (const char of inputChars) {
    while (nameIndex < nameChars.length && nameChars[nameIndex] !== char) {
      nameIndex += 1;
    }
    if (nameIndex < nameChars.length) {
      ordered += 1;
      nameIndex += 1;
    }
  }

  return ordered;
}

function toFiniteOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function createUniqueProductId(prefix = "product") {
  const randomId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${randomId}`;
}

function getProductSourcePriority(source) {
  return source === "database" || source === "ai" ? 1 : 0;
}

function buildProductSearchKey(product, index = 0) {
  const source = product?.source || "database";
  const sourceId =
    product?.code || product?.productId || product?.id || product?._id || normalizeTextForSearch(product?.name);
  return `${source}-${String(sourceId || "product")}-${index}`;
}

function scoreProductMatch(product, query) {
  const normalizedQuery = normalizeTextForSearch(query);
  const normalizedName = normalizeTextForSearch(
    product?.name || product?.product_name || product?.brands || "",
  );

  if (!normalizedQuery || !normalizedName) return 0;

  if (normalizedName === normalizedQuery) {
    return 2000 + (getProductSourcePriority(product?.source) ? 20 : 0);
  }

  const exactWithoutSpaces =
    normalizedName.replace(/\s+/g, "") === normalizedQuery.replace(/\s+/g, "");
  const startsWithScore = normalizedName.startsWith(normalizedQuery) ? 250 : 0;
  const substringScore = normalizedName.includes(normalizedQuery) ? 180 : 0;
  const sharedLetters = countSharedLetters(normalizedQuery, normalizedName);
  const orderedLetters = countOrderedLetters(normalizedQuery, normalizedName);
  const levenshteinDistance = levenshtein(normalizedName, normalizedQuery);
  const maxLength = Math.max(normalizedName.length, normalizedQuery.length, 1);
  const levenshteinScore = Math.max(0, Math.round((1 - levenshteinDistance / maxLength) * 220));
  const firstLetterScore = normalizedName[0] === normalizedQuery[0] ? 25 : 0;
  const orderedRatioBonus = orderedLetters === normalizedQuery.replace(/\s+/g, "").length ? 140 : Math.round((orderedLetters / Math.max(normalizedQuery.replace(/\s+/g, "").length, 1)) * 140);
  const sharedLettersScore = Math.round((sharedLetters / Math.max(normalizedQuery.replace(/\s+/g, "").length, 1)) * 120);

  let score =
    (exactWithoutSpaces ? 1500 : 0) +
    startsWithScore +
    substringScore +
    orderedRatioBonus +
    sharedLettersScore +
    levenshteinScore +
    firstLetterScore;

  const sourceBoost = getProductSourcePriority(product?.source) ? 18 : 0;
  if (score < 50) return 0;
  return score + sourceBoost;
}

function normalizeOffFoodProduct(product) {
  const n = product?.nutriments || {};
  const weight = toFiniteOrNull(product?.product_quantity) || 0;

  return {
    productId: String(product?.code || product?.id || normalizeTextForSearch(product?.product_name) || createUniqueProductId("off")),
    id: String(product?.code || product?.id || normalizeTextForSearch(product?.product_name) || createUniqueProductId("off")),
    code: product?.code || null,
    name: product?.product_name || product?.generic_name || product?.brands || "Neznámy produkt",
    brand: product?.brands || "",
    image: product?.image_url || product?.image_front_url || null,
    category: product?.category || "",
    source: "openfoodfacts",
    isCustom: false,
    expirationDate: null,
    quantity: weight || 0,
    originalQuantity: weight || 0,
    remainingQuantity: weight || 0,
    totalCalories: null,
    totalProteins: null,
    totalCarbs: null,
    totalFat: null,
    totalFiber: null,
    totalSalt: null,
    totalSugar: null,
    calories: toFiniteOrNull(n?.["energy-kcal_100g"]) ?? 0,
    proteins: toFiniteOrNull(n?.proteins_100g) ?? 0,
    carbs: toFiniteOrNull(n?.carbohydrates_100g) ?? 0,
    fat: toFiniteOrNull(n?.fat_100g) ?? 0,
    fiber: toFiniteOrNull(n?.fiber_100g) ?? 0,
    salt: toFiniteOrNull(n?.salt_100g) ?? 0,
    sugar: toFiniteOrNull(n?.sugars_100g) ?? 0,
    searchName: normalizeTextForSearch(product?.product_name || product?.generic_name || product?.brands || ""),
    createdAt: null,
  };
}

function normalizeStoredProduct(product) {
  const normalizedName = normalizeTextForSearch(product?.name || product?.product_name || "");
  return {
    productId: String(product?.productId || product?._id || createUniqueProductId(product?.source || "database")),
    id: String(product?.id || product?._id || product?.productId || ""),
    _id: product?._id ? String(product._id) : undefined,
    code: product?.code || product?.product_code || null,
    name: product?.name || product?.product_name || "Neznámy produkt",
    brand: product?.brand || product?.brands || "",
    image: product?.image || null,
    category: product?.category || "",
    source: product?.source || "database",
    isCustom: Boolean(product?.isCustom),
    expirationDate: product?.expirationDate ?? null,
    quantity: toFiniteOrNull(product?.quantity) ?? 0,
    originalQuantity: toFiniteOrNull(product?.originalQuantity) ?? toFiniteOrNull(product?.quantity) ?? 0,
    remainingQuantity: toFiniteOrNull(product?.remainingQuantity) ?? toFiniteOrNull(product?.quantity) ?? 0,
    totalCalories: product?.totalCalories ?? null,
    totalProteins: product?.totalProteins ?? null,
    totalCarbs: product?.totalCarbs ?? null,
    totalFat: product?.totalFat ?? null,
    totalFiber: product?.totalFiber ?? null,
    totalSalt: product?.totalSalt ?? null,
    totalSugar: product?.totalSugar ?? null,
    calories: product?.calories ?? null,
    proteins: product?.proteins ?? null,
    carbs: product?.carbs ?? null,
    fat: product?.fat ?? null,
    fiber: product?.fiber ?? null,
    salt: product?.salt ?? null,
    sugar: product?.sugar ?? null,
    searchName: product?.searchName || normalizedName,
    createdAt: product?.createdAt || null,
    product_code: product?.product_code || "",
  };
}

function buildSortedSearchResults(query, offProducts, dbProducts) {
  const ranked = [...offProducts, ...dbProducts]
    .map((product) => ({
      ...product,
      matchScore: scoreProductMatch(product, query),
    }))
    .filter((product) => product.matchScore > 0);

  if (!ranked.length) return [];

  ranked.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    const sourceDiff = getProductSourcePriority(b.source) - getProductSourcePriority(a.source);
    if (sourceDiff !== 0) return sourceDiff;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });

  const [top, ...rest] = ranked;
  rest.sort((a, b) => {
    const sourceDiff = getProductSourcePriority(b.source) - getProductSourcePriority(a.source);
    if (sourceDiff !== 0) return sourceDiff;
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });

  // Ponechaj všetky relevantné produkty bez deduplikácie
  // Produkty s rovnakým názvom ale iným ID, značkou alebo zdrojom sú legitímne rôzne produkty
  const allResults = [top, ...rest];

  return allResults.map((product, index) => ({
    ...product,
    searchKey: buildProductSearchKey(product, index),
  }));
}

async function verifyGoogleIdToken(idToken) {
  if (!GOOGLE_ALLOWED_CLIENT_IDS.length) {
    const error = new Error("Google login is not configured on the server");
    error.status = 503;
    throw error;
  }

  const response = await fetch(
    `${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`,
  );
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error_description || "Invalid Google token");
    error.status = 401;
    throw error;
  }

  if (!GOOGLE_ALLOWED_CLIENT_IDS.includes(payload.aud)) {
    const error = new Error("Google token audience is not allowed");
    error.status = 401;
    throw error;
  }

  if (payload.email_verified !== true && payload.email_verified !== "true") {
    const error = new Error("Google email is not verified");
    error.status = 401;
    throw error;
  }

  if (!payload.sub || !payload.email) {
    const error = new Error("Google token is missing required identity data");
    error.status = 401;
    throw error;
  }

  return {
    googleId: payload.sub,
    email: normalizeEmail(payload.email),
    name: createGoogleNick(payload),
    picture: payload.picture || null,
  };
}

// Servovanie .well-known (Android app links / assetlinks)
app.use(
  "/.well-known", // URL prefix pre assetlinks
  express.static(path.join(path.resolve(), ".well-known")) // statické súbory
);
// Servovanie webu (landing stránka)
app.use(express.static(WEB_ROOT));
app.get("/", (req, res) => res.sendFile(path.join(WEB_ROOT, "index.html")));

// ------------------- GPT CONFIG -------------------
// OpenAI klient + jednoduchý limit requestov
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // kľúč pre OpenAI API
});

// Jednoduchý limit volaní na generovanie receptov (ochrana pred spamom)
const GPT_REQUEST_LIMIT = 50; // max počet GPT requestov
let gptRequestCount = 0; // aktuálny počet requestov
// Hlavný štart servera: pripojenie k DB a definícia endpointov
async function start() {
  await client.connect(); // pripojenie k DB
  console.log("✅ Connected to MongoDB"); // log úspechu

  const db = client.db("userdb"); // vybraná databáza
  const users = db.collection("users"); // kolekcia používateľov
  const productsCollection = db.collection("products"); // kolekcia verejných produktov

  // Unikátny index pre email (bez duplicitných účtov)
  await users.createIndex({ email: 1 }, { unique: true }); // index pre email
  // Index pre rýchle fulltext / prefix vyhľadávanie na normalized name
  try {
    await productsCollection.createIndex({ searchName: 1 });
  } catch (e) {
    console.warn("Could not create index on products.searchName", e);
  }

  // ------------------- HEALTH CHECK -------------------
  // Rýchla kontrola dostupnosti DB
  app.get("/health", async (req, res) => {
    try {
      await client.db("admin").command({ ping: 1 });
      return res.json({ ok: true, db: "ok" });
    } catch (err) {
      console.error("Health check DB error:", err);
      return res.status(500).json({ ok: false, db: "error" });
    }
  });

  // ------------------- REGISTER -------------------
  // Vytvorí nového používateľa:
  // - validuje vstupy
  // - kontroluje GDPR súhlas
  // - hashne heslo
  // - uloží do DB
  app.post("/api/register", async (req, res) => { // POST /register
  try {
    const { email, password, nick, gdprConsent, gdprConsentAt, gdprPolicyVersion } = req.body; // údaje z klienta

    if (!email || !password || !nick) { // základná validácia
      return res.status(400).json({ error: "Missing fields" }); // chyba vstupov
    }

    // GDPR kontrola
    if (!gdprConsent) { // GDPR je povinný
      return res.status(400).json({ error: "GDPR súhlas je povinný." }); // odmietnutie
    }

    // Hash hesla pred uložením
    const hashedPassword = await bcrypt.hash(password, 10); // hash hesla

    const result = await users.insertOne({ // vloží nový dokument do DB
      email,
      password: hashedPassword,
      nick,
      createdAt: new Date(),
      gdprConsent: Boolean(gdprConsent),
      gdprConsentAt: new Date(gdprConsentAt),
      gdprPolicyVersion: gdprPolicyVersion || "1.0",
    });

    return res.status(201).json({ ok: true, id: result.insertedId }); // úspech
  } catch (err) {
    if (err.code === 11000) { // duplicitný email
      return res.status(409).json({ error: "Email already exists" }); // konflikt
    }
    console.error("Register error:", err); // log chyby
    return res.status(500).json({ error: "Server error" }); // serverová chyba
  }
});

  // ------------------- LOGIN -------------------
  // Overenie prihlásenia pomocou emailu a hesla
  app.post("/api/login", async (req, res) => { // POST /login
    try {
      const { email, password } = req.body; // prihlásovacie údaje

      if (!email || !password) { // validácia vstupov
        return res.status(400).json({ error: "Missing fields" }); // chyba
      }

      const user = await users.findOne({ email }); // nájde používateľa podľa emailu
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" }); // neexistuje
      }
      if (!user.password) {
        return res.status(401).json({ error: "Invalid email or password" }); // Google účet bez hesla
      }

      // Porovnanie hesla s hashom v DB
      const isMatch = await bcrypt.compare(password, user.password); // porovná heslo s hashom
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password" }); // zlé heslo
      }

      // Do klienta posielame len základné info
      return res.json({ // odpoveď pre klienta
        ok: true,
        message: "Login successful",
        user: { email: user.email, nick: user.nick },
      });
    } catch (err) {
      console.error("Login error:", err); // log chyby
      res.status(500).json({ error: "Server error" }); // serverová chyba
    }
  });

  // ------------------- GOOGLE LOGIN -------------------
  // Overí Google idToken a prihlási alebo vytvorí používateľa.
  app.post("/api/google-login", async (req, res) => {
    try {
      const {
        idToken,
        gdprConsent,
        gdprConsentAt,
        gdprPolicyVersion,
      } = req.body;

      if (!idToken || typeof idToken !== "string") {
        return res.status(400).json({ error: "Missing Google token" });
      }

      const googleProfile = await verifyGoogleIdToken(idToken);
      const now = new Date();
      const existingUser = await users.findOne({ email: googleProfile.email });

      if (existingUser) {
        const updates = {
          googleId: googleProfile.googleId,
          googlePicture: googleProfile.picture,
          googleEmailVerified: true,
          lastGoogleLoginAt: now,
          updatedAt: now,
        };

        if (!existingUser.nick) {
          updates.nick = googleProfile.name;
        }

        await users.updateOne(
          { _id: existingUser._id },
          {
            $set: updates,
            $addToSet: { authProviders: "google" },
          },
        );

        return res.json({
          ok: true,
          message: "Google login successful",
          isNewUser: false,
          user: {
            email: existingUser.email,
            nick: existingUser.nick || googleProfile.name,
          },
        });
      }

      if (!gdprConsent) {
        return res.status(409).json({
          error: "GDPR súhlas je povinný pre vytvorenie Google účtu.",
          code: "GOOGLE_GDPR_REQUIRED",
        });
      }

      await users.insertOne({
        email: googleProfile.email,
        password: null,
        nick: googleProfile.name,
        createdAt: now,
        authProvider: "google",
        authProviders: ["google"],
        googleId: googleProfile.googleId,
        googlePicture: googleProfile.picture,
        googleEmailVerified: true,
        lastGoogleLoginAt: now,
        gdprConsent: true,
        gdprConsentAt: gdprConsentAt ? new Date(gdprConsentAt) : now,
        gdprPolicyVersion: gdprPolicyVersion || "1.0",
      });

      return res.status(201).json({
        ok: true,
        message: "Google account created",
        isNewUser: true,
        user: {
          email: googleProfile.email,
          nick: googleProfile.name,
        },
      });
    } catch (err) {
      const status = err.status || 500;
      console.error("Google login error:", err);
      return res.status(status).json({
        error: status === 500 ? "Server error" : err.message,
      });
    }
  });

  // ------------------- UPDATE NICK -------------------
  // Zmena prezývky používateľa
  app.post("/api/updateNick", async (req, res) => { // POST /updateNick
    try {
      const { email, nick } = req.body; // nové hodnoty z klienta

      if (!email || typeof nick !== "string") { // validácia vstupov
        return res.status(400).json({ error: "Missing fields" }); // chyba
      }

      const trimmedNick = nick.trim(); // odstráni medzery
      if (!trimmedNick) {
        return res.status(400).json({ error: "Nick cannot be empty" }); // prázdny nick
      }
      if (trimmedNick.length > 40) {
        return res.status(400).json({ error: "Nick is too long" }); // príliš dlhý nick
      }

      // Uloženie novej prezývky
      const result = await users.updateOne( // uloží novú prezývku
        { email },
        {
          $set: {
            nick: trimmedNick,
            nickUpdatedAt: new Date(),
          },
        },
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "User not found" }); // nenájdený user
      }

      return res.json({ ok: true, nick: trimmedNick }); // úspech
    } catch (err) {
      console.error("Update nick error:", err); // log chyby
      return res.status(500).json({ error: "Server error" }); // serverová chyba
    }
  });

  // ------------------- UPDATE PROFILE -------------------
  // Uloží profilové údaje (váha, výška, vek, cieľ, aktivita)
  app.post("/api/updateProfile", async (req, res) => { // POST /updateProfile
    console.log("REQ BODY:", req.body); // debug vstupy
    try {
      const { email, weight, height, age, gender, activityLevel, goal } =
        req.body;

      if (!email || isNaN(weight) || isNaN(height) || isNaN(age) || !gender) {
        return res.status(400).json({ error: "Invalid or missing fields" }); // chyba vstupov
      }

      // Kolekcia používateľov
      const db = client.db("userdb");
      const users = db.collection("users");

      const result = await users.updateOne( // uloží profilové údaje
        { email },
        {
          $set: {
            weight: Number(weight),
            height: Number(height),
            age: Number(age),
            gender: gender,
            activityLevel: activityLevel,
            goal: goal,
            updatedAt: new Date(),
          },
        },
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "User not found" }); // user neexistuje
      }

      return res.json({ ok: true, message: "Profile updated" }); // úspech
    } catch (err) {
      console.error("Update profile error >>>", err); // log chyby
      return res.status(500).json({ error: "Server error" }); // serverová chyba
    }
  });

  // Načíta uložený profil používateľa
  app.get("/api/userProfile", async (req, res) => { // GET /userProfile
    try {
      const { email } = req.query; // email z query stringu
      if (!email) return res.status(400).json({ error: "Missing email" }); // povinný parameter

      const db = client.db("userdb");
      const users = db.collection("users");

      const user = await users.findOne({ email }); // vyhľadanie používateľa
      if (!user) return res.status(404).json({ error: "User not found" }); // neexistuje

      res.json({ // návrat profilu
        age: user.age,
        weight: user.weight,
        height: user.height,
        gender: user.gender,
        goal: user.goal,
        activityLevel: user.activityLevel,
      });
    } catch (err) {
      console.error(err); // log chyby
      res.status(500).json({ error: "Server error" }); // serverová chyba
    }
  });

   // ------------------ APP LINK DUMMY ROUTE ------------------
  // Endpoint pre app‑linking (overenie, že link existuje)
  app.get("/reset-password", (req, res) => {
    res.status(200).send("OK"); // jednoduchá odpoveď pre app link
  });

  // ------------------ FORGOT PASSWORD ------------------
  // Vytvorí reset token a pošle ho e‑mailom
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body; // email používateľa
      if (!email) {
        return res.status(400).json({ error: "Email required!" }); // email je povinný
      }

      const user = await users.findOne({ email }); // hľadanie používateľa
      if (!user) {
        return res.status(404).json({ error: "User not found!" }); // neexistuje
      }

      // Generovanie reset tokenu (platnosť 15 min)
      const token = crypto.randomBytes(32).toString("hex"); // náhodný reset token
      const expiresAt = Date.now() + 15 * 60 * 1000; // expirácia tokenu

      // Uloženie tokenu do DB
      await users.updateOne( // uloženie tokenu a expirácie
        { email },
        { $set: { resetToken: token, resetTokenExpires: expiresAt } },
      );

      if (!resend) {
        return res
          .status(500)
          .json({ error: "RESEND_API_KEY is not configured" });
      }

      // Reset link (otvorí appku s tokenom)
      if (!FRONTEND_URL) {
        return res
          .status(500)
          .json({ error: "FRONTEND_URL is not configured" });
      }
      const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

      // Odoslanie e‑mailu
      await resend.emails.send({
        from: RESEND_FROM,
        to: email,
        subject: "Požiadavka na resetovanie",
        html: `
          <p>Požiadali ste o reset hesla.</p>
          <p>Kliknite na odkaz nižšie (platí 15 minút):</p>
          <a href="${resetLink}" style="color: blue; text-decoration: underline;">
            Resetovať heslo
          </a>
        `,
      });

      res.json({ ok: true, message: "Reset link sent to email. " }); // odpoveď pre klienta
    } catch (err) {
      console.error("Forgot password error: ", err); // log chyby
      res.status(500).json({ error: "Server error " }); // serverová chyba
    }
  });

  // ------------------ RESET PASSWORD ------------------
  // Overí token a uloží nové heslo
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body; // token + nové heslo

      console.log("🔹 Reset Password Request Body:", req.body); // debug

      if (!token || !newPassword) {
        console.warn("⚠️ Missing token or password"); // chýbajú údaje
        return res.status(400).json({ error: "Missing token or password " });
      }

      // Nájde používateľa s platným tokenom
      const user = await users.findOne({ // používateľ s platným tokenom
        resetToken: token,
        resetTokenExpires: { $gt: Date.now() },
      });

      console.log("🔹 User found with token:", user); // debug
      if (!user) {
        console.warn("⚠️ Invalid or expired token"); // token neplatný
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      // Hash nového hesla
      const hashedPassword = await bcrypt.hash(newPassword, 10); // hash hesla

      await users.updateOne( // uloží nové heslo a zmaže token
        { email: user.email },
        {
          $set: { password: hashedPassword },
          $unset: { resetToken: "", resetTokenExpires: "" },
        },
      );
      console.log("✅ Password reset successful for user:", user.email); // log úspechu
      res.json({ ok: true, message: "Password reset succesful." }); // odpoveď
    } catch (err) {
      console.error("Reset password error: ", err); // log chyby
      res.status(500).json({ error: "Server error " }); // serverová chyba
    }
  });

  //----------------- SEND PRODUCTS TO DATABASE ---------------
  // Pridanie produktu do špajze (skener)
  app.post("/api/addProduct", async (req, res) => { // POST /addProduct
    console.log("📩 Incoming /api/addProduct request:", req.body); // debug
    const {
      email,
      image,
      product,
      category,
      source,
      sourceProductId,
      expirationDate,
      totalCalories,
      totalProteins,
      totalCarbs,
      totalFat,
      totalFiber,
      totalSalt,
      totalSugar,
      calories,
      proteins,
      carbs,
      fat,
      fiber,
      salt,
      sugar,
      originalQuantity,
      remainingQuantity,
    } = req.body; // údaje o produkte zo skenera

    try {
      const user = await users.findOne({ email }); // používateľ v DB
      console.log("👤 Found user:", user ? user.email : "NOT FOUND");
      if (!user) {
        return res.status(404).json({ error: "User not found" }); // neexistuje
      }

      // Bezpečné parsovanie dátumu spotreby
      let expirationDateValue = null;
      if (expirationDate) { // ak prišiel dátum spotreby
        const parsed = new Date(expirationDate);
        if (!Number.isNaN(parsed.getTime())) {
          expirationDateValue = parsed;
        }
      }

      // Objekt produktu, ktorý sa uloží do DB
      const parsedOriginalQuantity = Number(originalQuantity);
      const parsedRemainingQuantity = Number(remainingQuantity);
      const safeRemainingQuantity =
        Number.isFinite(parsedRemainingQuantity) && parsedRemainingQuantity > 0
          ? parsedRemainingQuantity
          : null;
      const safeOriginalQuantity =
        Number.isFinite(parsedOriginalQuantity) && parsedOriginalQuantity > 0
          ? parsedOriginalQuantity
          : safeRemainingQuantity;

      const productObj = { // objekt produktu uložený do DB
        productId: createUniqueProductId(source || "product"),
        source: source || "database",
        sourceProductId: sourceProductId || null,
        name: product,
        image: image ?? null,
        isCustom: false,
        expirationDate: expirationDateValue,
        quantity: safeRemainingQuantity,
        originalQuantity: safeOriginalQuantity,
        remainingQuantity: safeRemainingQuantity,
        totalCalories: totalCalories ?? null,
        totalProteins: totalProteins ?? null,
        totalCarbs: totalCarbs ?? null,
        totalFat: totalFat ?? null,
        totalFiber: totalFiber ?? null,
        totalSalt: totalSalt ?? null,
        totalSugar: totalSugar ?? null,
        calories: calories ?? null,
        proteins: proteins ?? null,
        carbs: carbs ?? null,
        fat: fat ?? null,
        fiber: fiber ?? null,
        salt: salt ?? null,
        sugar: sugar ?? null,
        category: category || "",
        searchName: normalizeTextForSearch(product),
      };

      // Prvý produkt -> vytvorí nové pole
      if (!user.products || user.products.length === 0) { // prvý produkt
        console.log(" Creating first product array");
        await users.updateOne({ email }, { $set: { products: [productObj] } });
      } else if (user.products.length >= 100) {
        console.log(" Too many products");
        return res.status(400).json({ error: "Too many products" });
      } else {
        console.log(" Pushing product to existing array");
        await users.updateOne({ email }, { $push: { products: productObj } });
      }

      const updatedUser = await users.findOne({ email }); // načítanie nového stavu
      console.log("✅ Updated user products:", updatedUser.products);
      res.json({ success: true, products: updatedUser.products });
    } catch (err) {
      console.error("❌ Add product error:", err); // log chyby
      res.status(500).json({ error: "Server error" }); // serverová chyba
    }
  });

  // REMOVE PRODUCTS FROM DB
  // Vymazanie produktu podľa productId
  app.post("/api/removeProduct", async (req, res) => { // POST /removeProduct
    try {
      const { email, productId } = req.body; // identifikátory

      if (!email || !productId) {
        return res.status(400).json({ error: "Missing email or product ID" }); // validácia
      }

      const result = await users.updateOne( // odstráni produkt z poľa
        { email },
        { $pull: { products: { productId: productId } } },
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: "Product not found" }); // nič neodstránené
      }

      const updatedUser = await users.findOne({ email }); // nové produkty

      res.json({
        succes: true, // úspech
        products: updatedUser.products, // vrátené produkty
      });
    } catch (err) {
      console.error("❌ Remove product error:", err); // log chyby
      res.status(500).json({ error: "Server error" }); // serverová chyba
    }
  });

  // UPDATE PRODUCT QUANTITY
  // Upraví zostatok produktu v špajzi po zjedení iba časti balenia
  app.post("/api/updateProductQuantity", async (req, res) => {
    try {
      const { email, productId, product } = req.body;

      if (!email || !productId || !product) {
        return res.status(400).json({ error: "Missing email, product ID or product" });
      }

      const user = await users.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const products = Array.isArray(user.products) ? user.products : [];
      const index = products.findIndex((item) => item.productId === productId);

      if (index === -1) {
        return res.status(404).json({ error: "Product not found" });
      }

      const remainingQuantity = Number(product.remainingQuantity ?? product.quantity);
      if (!Number.isFinite(remainingQuantity) || remainingQuantity <= 0) {
        return res.status(400).json({ error: "Invalid remaining quantity" });
      }

      const nextProducts = [...products];
      nextProducts[index] = {
        ...nextProducts[index],
        ...product,
        productId,
        isCustom: false,
        quantity: remainingQuantity,
        remainingQuantity,
      };

      await users.updateOne({ email }, { $set: { products: nextProducts } });

      res.json({ success: true, products: nextProducts, product: nextProducts[index] });
    } catch (err) {
      console.error("❌ Update product quantity error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // ADD CUSTOM PRODUCT TO DB
  // Vlastný produkt bez nutričných dát
  app.post("/api/addCustomProduct", async (req, res) => { // POST /addCustomProduct
    try {
      const { email, name } = req.body; // vstupy

      if (!email || !name) {
        return res.status(400).json({ error: "Missing email or name" }); // validácia
      }

      const user = await users.findOne({ email }); // nájdi používateľa
      if (!user) {
        return res.status(404).json({ error: "User not found" }); // neexistuje
      }

      const customProduct = { // vlastný produkt
        productId: createUniqueProductId("custom"),
        name: String(name).trim(),
        isCustom: true,
        image: null,
        source: "custom",
        createdAt: new Date(),
        category: "",
        searchName: normalizeTextForSearch(name),
      };

      if (!user.products || user.products.length === 0) { // prvý produkt
        await users.updateOne({ email }, { $set: { products: [customProduct] } });
      } else if (user.products.length >= 200) {
        return res.status(400).json({ error: "Too many products" });
      } else {
        await users.updateOne({ email }, { $push: { products: customProduct } });
      }

      const updatedUser = await users.findOne({ email }); // nové produkty

      res.json({ success: true, product: customProduct, products: updatedUser.products || [] }); // odpoveď
    } catch (err) {
      console.error("❌ Add custom product error:", err); // log chyby
      res.status(500).json({ error: "Server error" }); // serverová chyba
    }
  });

  // PULL from DB
  // Načítanie všetkých produktov používateľa
  app.get("/api/getProducts", async (req, res) => { // GET /getProducts
    console.log("📥 Incoming /api/getProducts request:", req.query); // debug

    const { email } = req.query; // email z query

    try {
      const user = await users.findOne({ email }); // nájdi používateľa
      console.log("👤 Found user:", user ? user.email : "NOT FOUND");

      if (!user) {
        return res.status(404).json({ error: "User not found" }); // neexistuje
      }

      const products = user.products || []; // všetky produkty

      console.log("📤 Returning products:", products); // debug
      res.json({ success: true, products }); // odpoveď
    } catch (err) {
      console.error("❌ Get products error:", err); // log chyby
      res.status(500).json({ error: "Server error" }); // serverová chyba
    }
  });

  // Vyhľadanie produktov v Open Food Facts podľa textu.
  app.get("/api/searchFoodFacts", async (req, res) => {
    const query = String(req.query.q || "").trim();
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(
      20,
      Math.max(1, Number.parseInt(req.query.pageSize, 10) || 10),
    );

    if (query.length < 2) {
      return res.status(400).json({ error: "Search query is too short" });
    }

    const cacheKey = `${query.toLowerCase()}::${page}::${pageSize}`;
    const cached = foodFactsSearchCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.payload);
    }

    try {
      const searchParams = new URLSearchParams({
        search_terms: query,
        search_simple: "1",
        action: "process",
        json: "1",
        page_size: String(pageSize),
        page: String(page),
        sort_by: "unique_scans_n",
        fields: OPEN_FOOD_FACTS_SEARCH_FIELDS,
      });
      const response = await fetch(
        `${OPEN_FOOD_FACTS_SEARCH_URL}?${searchParams.toString()}`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": OPEN_FOOD_FACTS_USER_AGENT,
          },
        },
      );

      if (!response.ok) {
        return res.status(response.status).json({
          error: "Open Food Facts search failed",
        });
      }

      const data = await response.json();
      const products = Array.isArray(data.products) ? data.products : [];
      const payload = {
        success: true,
        count: data.count ?? products.length,
        products,
      };

      foodFactsSearchCache.set(cacheKey, {
        expiresAt: Date.now() + FOOD_FACTS_SEARCH_CACHE_MS,
        payload,
      });

      if (foodFactsSearchCache.size > 100) {
        const oldestKey = foodFactsSearchCache.keys().next().value;
        foodFactsSearchCache.delete(oldestKey);
      }

      return res.json(payload);
    } catch (err) {
      console.error("Open Food Facts search error:", err);
      return res.status(500).json({ error: "Open Food Facts search error" });
    }
  });

  // ------------------ COMBINED SEARCH (OpenFoodFacts then products collection) ------------------
  app.get("/api/searchCombined", async (req, res) => {
    const query = String(req.query.q || "").trim();
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(30, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 20));

    if (query.length < 2) {
      return res.status(400).json({ error: "Search query is too short" });
    }

    try {
      // 1) OpenFoodFacts (reuse existing logic)
      const searchParams = new URLSearchParams({
        search_terms: query,
        search_simple: "1",
        action: "process",
        json: "1",
        page_size: String(pageSize),
        page: String(page),
        sort_by: "unique_scans_n",
        fields: OPEN_FOOD_FACTS_SEARCH_FIELDS,
      });

      const offResponse = await fetch(`${OPEN_FOOD_FACTS_SEARCH_URL}?${searchParams.toString()}`, {
        headers: { Accept: "application/json", "User-Agent": OPEN_FOOD_FACTS_USER_AGENT },
      });

      let offProducts = [];
      if (offResponse.ok) {
        const offData = await offResponse.json().catch(() => ({}));
        offProducts = Array.isArray(offData.products)
          ? offData.products.map(normalizeOffFoodProduct)
          : [];
      }

      // 2) Our products collection (fuzzy matching)
      const normalizedQuery = normalizeTextForSearch(query);

      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapeRegex(normalizedQuery), "i");

      const searchFragments = Array.from(
        new Set([
          normalizedQuery,
          normalizedQuery.slice(0, 3),
          normalizedQuery.slice(0, 2),
          normalizedQuery.slice(0, 1),
        ].filter((fragment) => fragment.length >= 1)),
      );

      const dbCandidates = await productsCollection
        .find({
          $or: searchFragments.map((fragment) => ({
            searchName: { $regex: new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
          })),
        })
        .limit(50)
        .toArray();

      const dbResults = dbCandidates.map((product) =>
        normalizeStoredProduct(product),
      );

      const combined = buildSortedSearchResults(query, offProducts, dbResults);

      return res.json({ success: true, count: combined.length, products: combined });
    } catch (err) {
      console.error("Combined search error:", err);
      return res.status(500).json({ error: "Combined search error" });
    }
  });

  // ------------------ GENERATE PRODUCT VIA AI + SAVE TO products collection ------------------
  app.post("/api/generateProductAI", async (req, res) => {
    try {
      const { name, category } = req.body || {};
      if (!name || String(name).trim().length < 1) {
        return res.status(400).json({ error: "Missing product name" });
      }

      if (gptRequestCount >= GPT_REQUEST_LIMIT) {
        return res.status(429).json({ error: "GPT request limit reached on server" });
      }
      gptRequestCount++;

      // Presný prompt s kompletnou štruktúrou produktu a striktnými pokynmi
      const systemPrompt = `You are a food nutrition expert. Your task is to return a VALID JSON object with exact product information. Return ONLY raw JSON - no markdown, no code blocks, no explanations, no text before or after. The response must be parseable with JSON.parse().`;
      
      const userPrompt = `Generate nutritional information for: ${name}${category ? ` (${category})` : ""}

Return a JSON object with EXACTLY these fields:
{
  "name": "<string - product name>",
  "category": "<string - one of: pastry, meat, vegetables, fruits, unknown>",
  "quantity": <number - grams or null>,
  "calories": <number - per 100g or 0>,
  "proteins": <number - per 100g or 0>,
  "carbs": <number - per 100g or 0>,
  "fat": <number - per 100g or 0>,
  "fiber": <number - per 100g or 0>,
  "salt": <number - per 100g or 0>,
  "sugar": <number - per 100g or 0>
}

RULES:
- Return ONLY the JSON object, nothing else
- No markdown code blocks
- No explanations before or after
- All numeric values must be numbers, not strings
- If a value is unknown, use 0 (for numbers) or empty string (for strings)
- Do not include extra fields
- Category must be exactly one of: pastry, meat, vegetables, fruits, unknown`;

      let parsed = null;
      let attempts = 0;
      while (!parsed && attempts < 3) {
        attempts++;
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_tokens: 500,
            temperature: 0.7,
          });

          let raw = completion.choices?.[0]?.message?.content || "";
          
          // Robustný JSON parsing s odsúvom code fences a markdown
          raw = raw.trim();
          
          // Odstráň markdown code blocks ak sú
          if (raw.startsWith("```json")) {
            raw = raw.substring(7);
          } else if (raw.startsWith("```")) {
            raw = raw.substring(3);
          }
          
          if (raw.endsWith("```")) {
            raw = raw.substring(0, raw.length - 3);
          }
          
          raw = raw.trim();
          
          // Skúsi extrahovať JSON objekt ak je v texte
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            raw = jsonMatch[0];
          }
          
          parsed = JSON.parse(raw);
        } catch (e) {
          parsed = null;
          if (attempts === 3) {
            console.error(`AI JSON parse failed after ${attempts} attempts:`, e);
          }
        }
      }

      if (!parsed) {
        return res.status(500).json({ error: "AI did not return valid product JSON after multiple attempts" });
      }

      // Normalizuj kategóriu na jednu z povolených
      let normalizedCategory = String(parsed.category || "").toLowerCase().trim();
      if (!["pastry", "meat", "vegetables", "fruits", "unknown"].includes(normalizedCategory)) {
        normalizedCategory = "unknown";
      }

      // Bezpečná konverzia čísel
      const safeNumber = (value) => {
        const num = Number(value);
        return Number.isFinite(num) && num >= 0 ? num : 0;
      };

      const productDoc = {
        productId: createUniqueProductId("ai"),
        name: String(parsed.name || name).trim(),
        image: null,
        category: normalizedCategory,
        source: "ai",
        isCustom: false,
        expirationDate: null,
        quantity: safeNumber(parsed.quantity),
        originalQuantity: safeNumber(parsed.quantity),
        remainingQuantity: safeNumber(parsed.quantity),
        // Per 100g nutrition
        calories: safeNumber(parsed.calories),
        proteins: safeNumber(parsed.proteins),
        carbs: safeNumber(parsed.carbs),
        fat: safeNumber(parsed.fat),
        fiber: safeNumber(parsed.fiber),
        salt: safeNumber(parsed.salt),
        sugar: safeNumber(parsed.sugar),
        // Total nutrition (nie sú známe bez hmotnosti)
        totalCalories: null,
        totalProteins: null,
        totalCarbs: null,
        totalFat: null,
        totalFiber: null,
        totalSalt: null,
        totalSugar: null,
        createdAt: new Date(),
        searchName: normalizeTextForSearch(parsed.name || name),
        product_code: "",
      };

      const insertResult = await productsCollection.insertOne(productDoc);
      const responseProduct = {
        ...productDoc,
        _id: insertResult.insertedId ? String(insertResult.insertedId) : undefined,
        id: insertResult.insertedId ? String(insertResult.insertedId) : undefined,
      };

      return res.json({
        success: true,
        product: responseProduct,
        warning: "Nutričné hodnoty vygenerované umelou inteligenciou nemusia byť presné. Prosím, skontrolujte ich.",
      });
    } catch (err) {
      console.error("Generate product AI error:", err);
      return res.status(500).json({ error: "Generate product AI error" });
    }
  });

  //-------------- CONSUMED PUSH --------------------------
  // Uloží denný súhrn (kalórie + makrá) pod kľúčom dátumu
  const parseDateKey = (value) => {
    const [yyyy, mm, dd] = String(value).split("-").map(Number);
    if (!yyyy || !mm || !dd) return null;
    return new Date(yyyy, mm - 1, dd);
  };

  const formatDateKey = (dateObj) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const calculateDailyGoal = (user) => {
    const weight = Number(user?.weight);
    const height = Number(user?.height);
    const age = Number(user?.age);
    const activityLevel = Number(user?.activityLevel);
    const gender = user?.gender;

    if (!weight || !height || !age || !activityLevel || !gender) return null;

    let cal =
      gender === "male"
        ? (10 * weight + 6.25 * height - 5 * age + 5) * activityLevel
        : (10 * weight + 6.25 * height - 5 * age - 161) * activityLevel;

    if (user.goal === "lose") cal -= 500;
    if (user.goal === "gain") cal += 500;

    return Math.round(cal);
  };

  const getGoalMet = (totals, goal) => {
    if (!totals || !Number.isFinite(goal)) return null;
    const calories = Number(totals.calories) || 0;
    return calories >= goal;
  };

  const pruneOldDailyTotals = async (
    user,
    dailyGoal,
    recentTotals = {},
    recentGoalStatus = {},
  ) => {
    if (!dailyGoal) return;
    const dailyConsumption = {
      ...(user.dailyConsumption || {}),
      ...(recentTotals || {}),
    };
    const dailyGoalStatus = {
      ...(user.dailyGoalStatus || {}),
      ...(recentGoalStatus || {}),
    };

    const todayKey = formatDateKey(new Date());
    const cutoff = parseDateKey(todayKey);
    if (!cutoff) return;
    cutoff.setDate(cutoff.getDate() - 6);

    let changed = false;
    for (const [dateKey, totals] of Object.entries(dailyConsumption)) {
      const dateObj = parseDateKey(dateKey);
      if (!dateObj) continue;

      if (dateObj < cutoff) {
        if (typeof dailyGoalStatus[dateKey] !== "boolean") {
          const goalMet = getGoalMet(totals, dailyGoal);
          if (typeof goalMet === "boolean") {
            dailyGoalStatus[dateKey] = goalMet;
          }
        }
        delete dailyConsumption[dateKey];
        changed = true;
      }
    }

    if (changed) {
      await users.updateOne(
        { email: user.email },
        { $set: { dailyConsumption, dailyGoalStatus } },
      );
    }
  };

  app.post("/api/updateDailyConsumption", async (req, res) => {
    const { email, date, totals } = req.body; // email + dátum + súhrn
    if (!email || !date || !totals)
      return res.status(400).json({ error: "Missing fields" });

    try {
      const user = await users.findOne({ email }); // nájdi používateľa
      if (!user) return res.status(404).json({ error: "User not found" }); // neexistuje

      const dailyGoal = calculateDailyGoal(user);
      const goalMet = getGoalMet(totals, dailyGoal);
      const updateFields = {
        [`dailyConsumption.${date}`]: totals,
      };

      if (typeof goalMet === "boolean") {
        updateFields[`dailyGoalStatus.${date}`] = goalMet;
      }

      // Uloženie do DB (každý deň pod vlastným kľúčom)
      await users.updateOne( // uloženie súhrnov do DB
        { email },
        { $set: updateFields }, // každý deň pod vlastným kľúčom
      );

      await pruneOldDailyTotals(
        user,
        dailyGoal,
        { [date]: totals },
        typeof goalMet === "boolean" ? { [date]: goalMet } : {},
      );

      res.json({ ok: true, message: "Daily consumption updated" }); // odpoveď
    } catch (err) {
      console.error("❌ Update daily consumption error:", err); // log chyby
      res.status(500).json({ error: "Server error" }); // serverová chyba
    }
  });

  //-------------- CONSUMED PULL --------------------------
  // Vráti súhrn pre konkrétny deň
  app.get("/api/getDailyConsumption", async (req, res) => {
    const { email, date } = req.query; // email + dátum z query

    if (!email || !date)
      return res.status(400).json({ error: "Missing email or date" }); // validácia

    try {
      const user = await users.findOne({ email }); // nájdi používateľa
      if (!user) return res.status(404).json({ error: "User not found" }); // neexistuje

      const totals = user.dailyConsumption?.[date] || null; // súhrn pre daný deň

      if (!totals) { // žiadne dáta pre deň
        return res
          .status(404)
          .json({ error: "No daily consumption found for this date" });
      }

      res.json({ totals }); // odpoveď
    } catch (err) {
      console.error("❌ Get daily consumption error:", err); // log chyby
      res.status(500).json({ error: "Server error" }); // serverová chyba
    }
  });

  //-------------- CONSUMED RANGE PULL --------------------------
  // Vráti súhrny pre interval dní (inclusive)
  app.get("/api/getDailyConsumptionRange", async (req, res) => {
    const { email, start, end } = req.query;

    if (!email || !start || !end) {
      return res.status(400).json({ error: "Missing email or date range" });
    }

    const startDate = parseDateKey(start);
    const endDate = parseDateKey(end);

    if (!startDate || !endDate || startDate > endDate) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    try {
      const user = await users.findOne({ email });
      if (!user) return res.status(404).json({ error: "User not found" });

      const range = [];
      const cursor = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
      );
      const last = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
      );

      while (cursor <= last) {
        const key = formatDateKey(cursor);
        range.push({
          date: key,
          totals: user.dailyConsumption?.[key] || null,
          goalMet: user.dailyGoalStatus?.[key] ?? null,
        });
        cursor.setDate(cursor.getDate() + 1);
      }

      res.json({ range });
    } catch (err) {
      console.error("❌ Get daily consumption range error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  //------------ FIND PRODUCT INFO BY NAME ------------------
  // Pomocný endpoint pre vyhľadanie produktu podľa názvu
  app.get("/api/getProductByName", async (req, res) => {
    console.log("📥 Incoming /api/getProductByName request:", req.query);

    const { email, name } = req.query;

    try {
      if (!email || !name) {
        return res.status(400).json({ error: "Missing email or product name" });
      }

      const user = await users.findOne({ email });
      console.log("👤 Found user:", user ? user.email : "NOT FOUND");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const products = user.products || [];
      const product = products.find((p) => p.name === name);

      if (!product) {
        console.log("❌ Product not found:", name);
        return res.status(404).json({ error: "Product not found" });
      }

      console.log("📤 Returning product:", product);
      res.json({ success: true, product });
    } catch (err) {
      console.error("❌ Get product by name error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  //------------ CONSUME RECIPE (add to daily consumption) ------------------
  // Pripočíta nutričné hodnoty receptu do dnešných súhrnov
  app.post("/api/consumeRecipe", async (req, res) => {
    console.log("📩 Incoming /api/consumeRecipe request:", req.body); // debug
    
    const { email, nutrition, date } = req.body; // email + výživové hodnoty receptu

    if (!email || !nutrition) {
      return res.status(400).json({ error: "Missing email or nutrition data" }); // validácia
    }

    try {
      const user = await users.findOne({ email }); // nájdi používateľa
      console.log("👤 Found user:", user ? user.email : "NOT FOUND");

      if (!user) {
        return res.status(404).json({ error: "User not found" }); // neexistuje
      }

      // Dátum pre uloženie (preferujeme klienta, fallback na server)
      const dateKey =
        typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
          ? date
          : new Date().toISOString().slice(0, 10);

      // Aktuálne súhrny pre dnešný deň
      const currentTotals = user.dailyConsumption?.[dateKey] || {
        calories: 0,
        proteins: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        salt: 0,
        drunkWater: 0,
      };

      // Pripočítanie nutričných hodnôt
      const updatedTotals = { // nové súhrny po pripočítaní receptu
        calories: (currentTotals.calories || 0) + (nutrition.calories || 0),
        proteins: (currentTotals.proteins || 0) + (nutrition.proteins || 0),
        carbs: (currentTotals.carbs || 0) + (nutrition.carbohydrates || 0),
        fat: (currentTotals.fat || 0) + (nutrition.fats || 0),
        fiber: (currentTotals.fiber || 0) + (nutrition.fiber || 0),
        sugar: (currentTotals.sugar || 0) + (nutrition.sugars || 0),
        salt: (currentTotals.salt || 0) + (nutrition.salt || 0),
        drunkWater: currentTotals.drunkWater || 0,
      };

      const dailyGoal = calculateDailyGoal(user);
      const goalMet = getGoalMet(updatedTotals, dailyGoal);
      const updateFields = {
        [`dailyConsumption.${dateKey}`]: updatedTotals,
      };

      if (typeof goalMet === "boolean") {
        updateFields[`dailyGoalStatus.${dateKey}`] = goalMet;
      }

      // Uloženie späť do DB
      await users.updateOne( // uloženie súhrnov
        { email },
        { $set: updateFields },
      );

      await pruneOldDailyTotals(
        user,
        dailyGoal,
        { [dateKey]: updatedTotals },
        typeof goalMet === "boolean" ? { [dateKey]: goalMet } : {},
      );

      console.log("✅ Recipe consumed, totals updated:", updatedTotals); // log úspechu
      res.json({ ok: true, message: "Recipe consumed", totals: updatedTotals }); // odpoveď
    } catch (err) {
      console.error("❌ Consume recipe error:", err); // log chyby
      res.status(500).json({ error: "Server error" }); // serverová chyba
    }
  });

  // ------------------ GENERATE RECIPE (OpenAI) ------------------
  // Vygeneruje recept podľa preferencií a cieľov
  app.post("/api/generateRecipe", async (req, res) => {
    try {
      // Ochrana pred príliš veľa požiadavkami
      if (gptRequestCount >= GPT_REQUEST_LIMIT) {
        return res
          .status(429)
          .json({ error: "GPT request limit reached on server" });
      }

      gptRequestCount++;

      const {
        userPrompt,
        email,
        pantryItems,
        useFitnessGoal,
        maxCookingTime,
      } = req.body;
      if (!userPrompt) return res.status(400).json({ error: "Missing prompt" }); // prompt je povinný
      if (!email) return res.status(400).json({ error: "Missing user email" }); // email je povinný

      const user = await users.findOne({ email }); // načítanie používateľa
      if (!user) return res.status(404).json({ error: "User not found" });

      // --- Získaj produkty zo špajze ---
      let pantryText = ""; // text s ingredienciami zo špajze
      if (Array.isArray(pantryItems) && pantryItems.length > 0) {
        const pantryItemText = pantryItems
          .map((item) => {
            if (typeof item === "string") return item;
            const name = item?.name || "potravina";
            const grams = Number(item?.availableGrams);
            return Number.isFinite(grams) && grams > 0
              ? `${name} (max ${Math.round(grams)} g)`
              : name;
          })
          .join(", ");
  pantryText = `
Použi tieto ingrediencie zo špajze:
${pantryItemText}
Ak je pri ingrediencii uvedené maximum v gramoch, amountGrams v JSON nesmie byť vyššie než toto maximum.
`;
}

      // --- Získaj fitness cieľ používateľa ---
      let goalText = ""; // text s fitness cieľom
      let calorieGuideline = ""; // kalorické pravidlo
      if (useFitnessGoal && user.goal) {
        goalText = `Zohľadni fitness cieľ používateľa: ${user.goal}.`;

        if (user.goal === "lose") {
          calorieGuideline =
            "Celkové kalórie receptu MUSIA byť nižšie (200-400), vhodné pre chudnutie.";
        } else if (user.goal === "maintain") {
          calorieGuideline =
            "Celkové kalórie receptu MUSIA byť priemerné (401-600), vhodné pre udržanie váhy.";
        } else if (user.goal === "gain") {
          calorieGuideline =
            "Celkové kalórie receptu MUSIA byť vyššie (601-800), vhodné pre priberanie.";
        }
      }

      // --- SYSTEM PROMPT (pravidlá pre AI) ---
      const systemPrompt = `
Si profesionálny AI šéfkuchár a nutričný analytik.

PRAVIDLÁ:
1. Odpovedaj výhradne po slovensky.
2. Recepty nemusia byť len slovenské, možeš použiť aj exotickejšie recepty.
3. Recept MUSÍ byť reálny, overiteľný a prakticky vykonateľný.
4. Ingrediencie musia byť bežne dostupné v obchodoch.
5. Názov receptu musí byť dlhý maximálne 31 znakov vrátane medzier.
6. Kroky musia byť jasné, očíslované a zrozumiteľné.
7. Čas prípravy musí byť realistický pre daný recept.
8. Recept musí byť originálny, neopakuj predchádzajúce recepty.
9. Dodrž všetky používateľské preferencie (sladké, štipľavé, mäsité, vegánske, bezmäsité, atď.).
10. Ak je zvolená preferencia "Morské plody", použite rôzne druhy morských plodov a neobmedzujte sa len na jeden.
11. Použi produkty zo špajze, ak sú dostupné a zmysluplné.
11a. Pri produktoch zo špajze nikdy nepouži viac gramov, než je uvedené ako dostupné maximum.
12. Zohľadni fitness cieľ používateľa, ak je k dispozícii.
13. Priraď každému receptu jednu z vymenovaných kategóriu: mäsité, bezmäsité, vegánske, sladké, štipľavé. Žiadna iná kategória nesmie byť použitá
14. Nutričné hodnoty musia byť realistické a vypočítané z ingrediencií - kalórie, bielkoviny, sacharidy, tuky, vláknina, soľ, cukry.
15. Nepoužívaj odhady typu "cca" alebo "približne".
16. Ak nevieš presnú hodnotu, použi databázový priemer.
17. Celkové kalórie musia korešpondovať so súčtom makroživín.
18. Hodnoty sú pre celú porciu (celý recept), čísla nie stringy.
19. Nezvyšuj ani neznižuj hodnoty kvôli preferenciám, zachovaj realitu.
20. Celkový čas varenia nesmie byť viac ako {maxCookingTime} minút.
21. Čas musí zahŕňať prípravu surovín aj samotné varenie/pečenie.
22. Odhadni čas každého kroku a výsledok urči ako ich súčet, zaokrúhlený na 5 minút.
23. Skontroluj, že JSON je validný.
24. Odpoveď MUSÍ začínať { a končiť }.
25. Vráť **LEN validný JSON** - žiadny text mimo JSON, žiadne vysvetlenia, žiadne komentáre.

JSON ŠTRUKTÚRA:
{
  "name": "Názov receptu",
  "category": "mäsité | bezmäsité | vegánske | sladké | štipľavé",
  "estimatedCookingTime": "25 minút",
  "nutrition": {
    "calories": 520,
    "proteins": 38,
    "carbohydrates": 45,
    "fats": 18,
    "fiber": 7,
    "salt": 2.1,
    "sugars": 6
  },
  "ingredients": [
    { "name": "Názov ingrediencie", "amountGrams": 100 }
  ],
  "steps": [
    "1. Prvý krok",
    "2. Druhý krok"
  ]
}

**Pravidlá formátu JSON:**
- Ingrediencie len v gramoch (čísla, žiadne texty ako 'približne').  
- Kroky jasné, realistické a očíslované.  
- Recept pre 1 osobu.  
}
`;

      // --- Finálny prompt pre AI ---
      const finalPrompt = `${userPrompt}
${pantryText ? pantryText : ""}
${goalText ? goalText : ""}
${calorieGuideline ? calorieGuideline : ""}
${maxCookingTime ? `Celkový čas varenia nesmie byť viac ako ${maxCookingTime} minút.` : ""}`;

      // --- Retry ak AI vráti nevalidný JSON ---
      let parsedJSON = null; // sem sa uloží výsledok
      let attempts = 0; // počítadlo pokusov
      const MAX_ATTEMPTS = 3; // max počet pokusov

      while (!parsedJSON && attempts < MAX_ATTEMPTS) {
        attempts++;
        const completion = await openai.chat.completions.create({ // volanie OpenAI
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: finalPrompt },
          ],
          max_tokens: 700, // zvýšené tokeny
          temperature: 0.9,
        });

        const rawResponse = completion.choices[0].message.content; // text odpovede

        try {
          parsedJSON = JSON.parse(rawResponse); // pokus o JSON parse

          const isPlainObject =
            parsedJSON &&
            typeof parsedJSON === "object" &&
            !Array.isArray(parsedJSON);
          const isEmptyObject = isPlainObject && !Object.keys(parsedJSON).length;

          const hasText = (value) =>
            typeof value === "string" && value.trim().length > 0;

          const hasIngredients = Array.isArray(parsedJSON?.ingredients)
            ? parsedJSON.ingredients.some(
                (item) =>
                  item &&
                  hasText(item.name) &&
                  Number.isFinite(Number(item.amountGrams)) &&
                  Number(item.amountGrams) > 0,
              )
            : false;

          const hasSteps = Array.isArray(parsedJSON?.steps)
            ? parsedJSON.steps.some((step) => hasText(step))
            : false;

          const isRecipeShapeValid =
            isPlainObject &&
            hasText(parsedJSON?.name) &&
            hasText(parsedJSON?.category) &&
            hasText(parsedJSON?.estimatedCookingTime) &&
            hasIngredients &&
            hasSteps;
          const normalizeIngredientName = (value) =>
            String(value || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .trim();
          const selectedPantryLimits = Array.isArray(pantryItems)
            ? pantryItems
                .filter((item) => item && typeof item === "object")
                .map((item) => ({
                  name: normalizeIngredientName(item.name),
                  availableGrams: Number(item.availableGrams),
                }))
                .filter((item) => item.name && Number.isFinite(item.availableGrams))
            : [];
          const exceedsPantryLimit =
            isRecipeShapeValid &&
            selectedPantryLimits.some((limit) =>
              parsedJSON.ingredients.some((ingredient) => {
                const ingredientName = normalizeIngredientName(ingredient?.name);
                const amountGrams = Number(ingredient?.amountGrams);
                const namesMatch =
                  ingredientName.includes(limit.name) ||
                  limit.name.includes(ingredientName);
                return namesMatch && amountGrams > limit.availableGrams;
              }),
            );

          if (isEmptyObject || !isRecipeShapeValid || exceedsPantryLimit) {
            parsedJSON = null;
            console.warn(
              `⚠️ GPT vrátil prázdny, neplatný alebo množstvom nedostupný recept, retry ${attempts}...`,
            );
          }
        } catch (err) {
          console.warn(`⚠️ GPT vrátil nevalidný JSON, retry ${attempts}...`);
        }
      }

      if (!parsedJSON) {
        return res
          .status(500)
          .json({ error: "GPT vrátil nevalidný JSON aj po retry" });
      }

      return res.json({ success: true, recipe: parsedJSON });
    } catch (err) {
      console.error("❌ GPT error:", err);
      res.status(500).json({ error: "Failed to generate recipe" });
    }
  });

  // ------------------ SAVE RECIPE TO DB ------------------
  // Uloženie receptu do používateľského profilu
  app.post("/api/addRecipe", async (req, res) => { // POST /addRecipe
    console.log("📩 Incoming /api/addRecipe request:", req.body);

    const { email, recipe } = req.body; // email + recept z klienta

    if (!email || !recipe) {
      return res.status(400).json({ error: "Missing email or recipe" }); // validácia
    }

    try {
      const user = await users.findOne({ email }); // používateľ v DB
      console.log("👤 Found user:", user ? user.email : "NOT FOUND");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const recipeObj = { // objekt receptu uložený do DB
        recipeId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: recipe.name,
        estimatedCookingTime: recipe.estimatedCookingTime,
        category: recipe.category,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        nutrition: recipe.nutrition || {},
        createdAt: new Date(),
      };

      if (!user.recipes || user.recipes.length === 0) { // prvý recept
        console.log("🍳 Creating first recipes array");
        await users.updateOne({ email }, { $set: { recipes: [recipeObj] } });
      } else if (user.recipes.length >= 100) {
        console.log("⚠️ Too many recipes");
        return res.status(400).json({ error: "Too many saved recipes" });
      } else {
        console.log("🍳 Pushing recipe to existing array");
        await users.updateOne({ email }, { $push: { recipes: recipeObj } });
      }

      const updatedUser = await users.findOne({ email }); // nové recepty
      console.log("✅ Updated user recipes:", updatedUser.recipes);

      res.json({
        success: true,
        recipes: updatedUser.recipes,
      }); // odpoveď
    } catch (err) {
      console.error("❌ Add recipe error:", err); // log chyby
      res.status(500).json({ error: "Server error" }); // serverová chyba
    }
  });

  // ------------------ GET USER RECIPES ------------------
  // Načítanie uložených receptov
  app.get("/api/getRecipes", async (req, res) => { // GET /getRecipes
    const { email } = req.query; // email z query stringu

    if (!email) {
      return res.status(400).json({ error: "Missing email" }); // validácia
    }

    try {
      const user = await users.findOne({ email }); // nájdi používateľa

      if (!user) {
        return res.status(404).json({ error: "User not found" }); // neexistuje
      }

      res.json({
        success: true,
        recipes: user.recipes || [],
      }); // odpoveď
    } catch (err) {
      console.error("❌ Get recipes error:", err); // log chyby
      res.status(500).json({ error: "Server error" }); // serverová chyba
    }
  });

  //DELETE RECIPE FROM SERVER//
  // Vymazanie receptu podľa recipeId
  app.delete("/api/deleteRecipe", async (req, res) => { // DELETE /deleteRecipe
    const { email, recipeId } = req.body; // email + id receptu

    if (!email || !recipeId) {
      return res.status(400).json({ success: false }); // validácia
    }

    try {
      const result = await users.updateOne( // vymaže recept z poľa
        { email },
        { $pull: { recipes: { recipeId } } },
      );

      if (result.modifiedCount === 0) {
        return res.json({ success: false }); // nič sa nezmazalo
      }

      res.json({ success: true }); // odpoveď
    } catch (err) {
      console.error("❌ Delete recipe error:", err); // log chyby
      res.status(500).json({ success: false }); // serverová chyba
    }
  });

  // ------------------- START SERVER -------------------
  // Spustenie HTTP servera
  app.listen(PORT, () => // server začne počúvať
    console.log(`🚀 Server listening on port ${PORT}`),
  );
}

// Štart servera + bezpečné ukončenie pri chybe
start().catch((e) => {
  console.error("Failed to start server:", e);
  process.exit(1);
});
