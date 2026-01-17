// server/index.js
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";
import path from "path";
import OpenAI from "openai";

dotenv.config({ path: path.resolve("./server/.env") });
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "SET" : "MISSING");
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const client = new MongoClient(MONGO_URI);

// ------------------- GPT CONFIG -------------------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


const GPT_REQUEST_LIMIT = 50;
let gptRequestCount = 0;
async function start() {
  await client.connect();
  console.log("✅ Connected to MongoDB");

  const db = client.db("userdb");
  const users = db.collection("users");

  await users.createIndex({ email: 1 }, { unique: true });

  // ------------------- REGISTER -------------------
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, nick } = req.body;

      if (!email || !password || !nick) {
        return res.status(400).json({ error: "Missing fields" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await users.insertOne({
        email,
        password: hashedPassword,
        nick,
        createdAt: new Date(),
      });

      return res.status(201).json({ ok: true, id: result.insertedId });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "Email already exists" });
      }
      console.error("Register error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // ------------------- LOGIN -------------------
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Missing fields" });
      }

      const user = await users.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Compare hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Return user data
      return res.json({
        ok: true,
        message: "Login successful",
        user: { email: user.email, nick: user.nick },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // ------------------- UPDATE PROFILE -------------------
  app.post("/api/updateProfile", async (req, res) => {
    console.log("REQ BODY:", req.body);
    try {
      const { email, weight, height, age, gender, activityLevel, goal } =
        req.body;

      if (!email || isNaN(weight) || isNaN(height) || isNaN(age) || !gender) {
        return res.status(400).json({ error: "Invalid or missing fields" });
      }

      const db = client.db("userdb");
      const users = db.collection("users");

      const result = await users.updateOne(
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
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({ ok: true, message: "Profile updated" });
    } catch (err) {
      console.error("Update profile error >>>", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  
  app.get("/api/userProfile", async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) return res.status(400).json({ error: "Missing email" });

      const db = client.db("userdb");
      const users = db.collection("users");

      const user = await users.findOne({ email });
      if (!user) return res.status(404).json({ error: "User not found" });

      res.json({
        age: user.age,
        weight: user.weight,
        height: user.height,
        gender: user.gender,
        goal: user.goal,
        activityLevel: user.activityLevel,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // ------------------FORGOT PASSWORD ------------------
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email required!" });
      }

      const user = await users.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: "User not found!" });
      }

      //Generate reset token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 15 * 60 * 1000;

      //Save token to user document
      await users.updateOne(
        { email },
        { $set: { resetToken: token, resetTokenExpires: expiresAt } }
      );

      console.log("EMAIL_USER:", process.env.EMAIL_USER);
      console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "SET" : "MISSING");
      //Setup nodemailer
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      //Build reset link
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

      //Send email
      await transporter.sendMail({
        from: `"Socka" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Password Reset Request",
        html: `
          <p> You requestet to reset your password </p>
          <p>Click the link below to reset password (expires in 15 minutes):</p>
          <a href="${resetLink}">${resetLink}</a>
          `,
      });

      res.json({ ok: true, message: "Reset link sent to email. " });
    } catch (err) {
      console.error("Forgot password error: ", err);
      res.status(500).json({ error: "Server error " });
    }
  });

  // ------------------RESET PASSWORD ------------------
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      console.log("🔹 Reset Password Request Body:", req.body);

      if (!token || !newPassword) {
        console.warn("⚠️ Missing token or password");
        return res.status(400).json({ error: "Missing token or password " });
      }

      const user = await users.findOne({
        resetToken: token,
        resetTokenExpires: { $gt: Date.now() },
      });

      console.log("🔹 User found with token:", user);
      if (!user) {
        console.warn("⚠️ Invalid or expired token");
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await users.updateOne(
        { email: user.email },
        {
          $set: { password: hashedPassword },
          $unset: { resetToken: "", resetTokenExpires: "" },
        }
      );
      console.log("✅ Password reset successful for user:", user.email);
      res.json({ ok: true, message: "Password reset succesful." });
    } catch (err) {
      console.error("Reset password error: ", err);
      res.status(500).json({ error: "Server error " });
    }
  });

  //-----------------SEND PRODUCTS TO DATABASE ---------------
  app.post("/api/addProduct", async (req, res) => {
    console.log("📩 Incoming /api/addProduct request:", req.body);
    const {
      email,
      image,
      product,
      totalCalories,
      totalProteins,
      totalCarbs,
      totalFat,
      totalFiber,
      totalSalt,
      totalSugar,
    } = req.body; 

    try {
      const user = await users.findOne({ email });
      console.log("👤 Found user:", user ? user.email : "NOT FOUND");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const productObj = {
        productId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: product,
        image: image ?? null,
        totalCalories: totalCalories ?? null,
        totalProteins: totalProteins ?? null,
        totalCarbs: totalCarbs ?? null,
        totalFat: totalFat ?? null,
        totalFiber: totalFiber ?? null,
        totalSalt: totalSalt ?? null,
        totalSugar: totalSugar ?? null,
      };

      if (!user.products || user.products.length === 0) {
        console.log(" Creating first product array");
        await users.updateOne({ email }, { $set: { products: [productObj] } });
      } else if (user.products.length >= 100) {
        console.log(" Too many products");
        return res.status(400).json({ error: "Too many products" });
      } else {
        console.log(" Pushing product to existing array");
        await users.updateOne({ email }, { $push: { products: productObj } });
      }

      const updatedUser = await users.findOne({ email });
      console.log("✅ Updated user products:", updatedUser.products);
      res.json({ success: true, products: updatedUser.products });
    } catch (err) {
      console.error("❌ Add product error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  //REMOVE PRODUCTS FROM DB
  app.post("/api/removeProduct", async (req, res) => {
    try {
      const { email, productId } = req.body;

      if (!email || !productId) {
        return res.status(400).json({ error: "Missing email or product ID" });
      }

      const result = await users.updateOne(
        { email },
        { $pull: { products: { productId: productId } } }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      const updatedUser = await users.findOne({ email });

      res.json({
        succes: true,
        products: updatedUser.products,
      });
    } catch (err) {
      console.error("❌ Remove product error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  //PULL from DB
  app.get("/api/getProducts", async (req, res) => {
    console.log("📥 Incoming /api/getProducts request:", req.query);

    const { email } = req.query;

    try {
      const user = await users.findOne({ email });
      console.log("👤 Found user:", user ? user.email : "NOT FOUND");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const products = user.products || [];

      console.log("📤 Returning products:", products);
      res.json({ success: true, products });
    } catch (err) {
      console.error("❌ Get products error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  //------------ FIND PRODUCT INFO BY NAME ------------------

  app.post("/api/generateRecipe", async (req, res) => {
  try {
    if (gptRequestCount >= GPT_REQUEST_LIMIT) {
      return res.status(429).json({ error: "GPT request limit reached on server" });
    }

    gptRequestCount++;

    const { userPrompt, email, usePantryItems, useFitnessGoal, maxCookingTime  } = req.body;
    if (!userPrompt) return res.status(400).json({ error: "Missing prompt" });
    if (!email) return res.status(400).json({ error: "Missing user email" });

    const user = await users.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    // --- Získaj produkty zo špajze ---
    let pantryText = "";
    if (usePantryItems && user.products && user.products.length > 0) {
      const productNames = user.products.map(p => p.name).join(", ");
      pantryText = `Použi tieto produkty zo špajze: ${productNames}.`;
    }

    // --- Získaj fitness cieľ používateľa ---
    let goalText = "";
    let calorieGuideline = "";
    if (useFitnessGoal && user.goal) {
      goalText = `Zohľadni fitness cieľ používateľa: ${user.goal}.`;

        if (user.goal === "lose") {
        calorieGuideline = "Celkové kalórie receptu MUSIA byť nižšie (200-400), vhodné pre chudnutie.";
      } else if (user.goal === "maintain") {
        calorieGuideline = "Celkové kalórie receptu MUSIA byť priemerné (401-600), vhodné pre udržanie váhy.";
      } else if (user.goal === "gain") {
        calorieGuideline = "Celkové kalórie receptu MUSIA byť vyššie (601-800), vhodné pre priberanie.";
      }
    }

    // --- SYSTEM PROMPT (nový kompletný) ---
    const systemPrompt = `
Si profesionálny AI šéfkuchár a nutričný analytik.

PRAVIDLÁ:
1. Odpovedaj výhradne po slovensky.
2. Recepty nemusia byť len slovenské, možeš použiť aj exotickejšie recepty.
3. Recept MUSÍ byť reálny, overiteľný a prakticky vykonateľný.
4. Ingrediencie musia byť bežne dostupné v obchodoch.
5. Kroky musia byť jasné, očíslované a zrozumiteľné.
6. Čas prípravy musí byť realistický pre daný recept.
7. Recept musí byť originálny, neopakuj predchádzajúce recepty.
8. Dodrž všetky používateľské preferencie (sladké, štipľavé, mäsité, vegánske, bezmäsité, atď.).
9. Ak je zvolená preferencia "Morské plody", použite rôzne druhy morských plodov a neobmedzujte sa len na jeden.
10. Použi produkty zo špajze, ak sú dostupné a zmysluplné.
11. Zohľadni fitness cieľ používateľa, ak je k dispozícii.
12. Priraď každému receptu jednu kategóriu: mäsité, bezmäsité, vegánske, sladké, štipľavé.
13. Nutričné hodnoty musia byť realistické a vypočítané z ingrediencií – kalórie, bielkoviny, sacharidy, tuky, vláknina, soľ, cukry.
14. Nepoužívaj odhady typu "cca" alebo "približne".
15. Ak nevieš presnú hodnotu, použi databázový priemer.
16. Celkové kalórie musia korešpondovať so súčtom makroživín.
17. Hodnoty sú pre celú porciu (celý recept), čísla nie stringy.
18. Nezvyšuj ani neznižuj hodnoty kvôli preferenciám, zachovaj realitu.
19. Celkový čas varenia nesmie byť viac ako {maxCookingTime} minút.
20. Čas musí zahŕňať prípravu surovín aj samotné varenie/pečenie.
21. Odhadni čas každého kroku a výsledok urči ako ich súčet, zaokrúhlený na 5 minút.
22. Skontroluj, že JSON je validný.
23. Odpoveď MUSÍ začínať { a končiť }.
24. Vráť **LEN validný JSON** – žiadny text mimo JSON, žiadne vysvetlenia, žiadne komentáre.

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
`;

     // --- Skombinuj userPrompt s pantryText, goalText a calorieGuideline ---
    const finalPrompt = `${userPrompt}
${pantryText ? pantryText : ""}
${goalText ? goalText : ""}
${calorieGuideline ? calorieGuideline : ""}
${maxCookingTime ? `Celkový čas varenia nesmie byť viac ako ${maxCookingTime} minút.` : ""}`;

    // --- RETRY pri nevalidnom JSON ---
    let parsedJSON = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 3;

    while (!parsedJSON && attempts < MAX_ATTEMPTS) {
      attempts++;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: finalPrompt }
        ],
        max_tokens: 700,       // zvýšené tokeny
        temperature: 0.8
      });

      const rawResponse = completion.choices[0].message.content;

      try {
        parsedJSON = JSON.parse(rawResponse);
      } catch (err) {
        console.warn(`⚠️ GPT vrátil nevalidný JSON, retry ${attempts}...`);
      }
    }

    if (!parsedJSON) {
      return res.status(500).json({ error: "GPT vrátil nevalidný JSON aj po retry" });
    }

    return res.json({ success: true, recipe: parsedJSON });

  } catch (err) {
    console.error("❌ GPT error:", err);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
});


  // ------------------ SAVE RECIPE TO DB ------------------
  app.post("/api/addRecipe", async (req, res) => {
    console.log("📩 Incoming /api/addRecipe request:", req.body);

    const { email, recipe } = req.body;

    if (!email || !recipe) {
      return res.status(400).json({ error: "Missing email or recipe" });
    }

    try {
      const user = await users.findOne({ email });
      console.log("👤 Found user:", user ? user.email : "NOT FOUND");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

      const recipeObj = {
        recipeId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: recipe.name,
        estimatedCookingTime: recipe.estimatedCookingTime,
        category: recipe.category,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        nutrition: recipe.nutrition || {},
        createdAt: new Date(),
      };

      if (!user.recipes || user.recipes.length === 0) {
        console.log("🍳 Creating first recipes array");
        await users.updateOne({ email }, { $set: { recipes: [recipeObj] } });
      } else if (user.recipes.length >= 100) {
        console.log("⚠️ Too many recipes");
        return res.status(400).json({ error: "Too many saved recipes" });
      } else {
        console.log("🍳 Pushing recipe to existing array");
        await users.updateOne({ email }, { $push: { recipes: recipeObj } });
      }

      const updatedUser = await users.findOne({ email });
      console.log("✅ Updated user recipes:", updatedUser.recipes);

      res.json({
        success: true,
        recipes: updatedUser.recipes,
      });
    } catch (err) {
      console.error("❌ Add recipe error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // ------------------ GET USER RECIPES ------------------
app.get("/api/getRecipes", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  try {
    const user = await users.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      recipes: user.recipes || [],
    });
  } catch (err) {
    console.error("❌ Get recipes error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//DELETE RECIPE FROM SERVER//
app.delete("/api/deleteRecipe", async (req, res) => {
  const { email, recipeId } = req.body;

  if (!email || !recipeId) {
    return res.status(400).json({ success: false });
  }

  try {
    const result = await users.updateOne(
      { email },
      { $pull: { recipes: { recipeId } } }
    );

    if (result.modifiedCount === 0) {
      return res.json({ success: false });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete recipe error:", err);
    res.status(500).json({ success: false });
  }
});

  // ------------------- START SERVER -------------------
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );
}

start().catch((e) => {
  console.error("Failed to start server:", e);
  process.exit(1);
});
