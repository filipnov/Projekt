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

  app.get("/api/getProductByName", async (req, res) => {
    try {
      const { email, name } = req.query;
      if (!email || !name)
        return res.status(400).json({ error: "Missing email or product name" });

      const user = await users.findOne({ email });
      if (!user) return res.status(404).json({ error: "User not found" });

      const product = (user.products || []).find((p) => p.name === name);
      if (!product) return res.status(404).json({ error: "Product not found" });

      res.json({ success: true, product });
    } catch (err) {
      console.error("❌ Get product by name error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // ------------------- AI RECIPE GENERATOR -------------------
  app.post("/api/generateRecipe", async (req, res) => {
    try {
      if (gptRequestCount >= GPT_REQUEST_LIMIT) {
        return res.status(429).json({
          error: "GPT request limit reached on server",
        });
      }

      gptRequestCount++;

    const systemPrompt = `
    Si ten najdokonalejší AI šéfkuchár na planéte.
 *Dôležité pravidlá*
1. Odpovedaj **VÝHRADNE po slovensky**. Nevysvetľuj nič, nevypisuj text v inom jazyku
2. Vráť *len platný JSON* podľa presnej štruktúry. Žiadny text mimo JSON 
3. Recept MUSÍ byť *skutočný a overiteľný*. Nevymýšľaj ingrediencie ani jedlá
4. Ingrediencie MUSIA byť reálne potraviny, ktoré sa dajú kúpiť
5. Kroky MUSIA byť jasné, presné a očíslované
6. Čas prípravy MUSÍ byť realistický pre daný recept
7. Buď kreatívny, vytváraj normálne, slané, štiplavé, exotické recepty a nezabudni aj na sladké dezerty
8. Recepty nemusia byť slovenské, používaj recepty z celého sveta pokiaľ sú dodržané ostatné pravidlá.
9. Každému receptu priradíš jednu z týchto kategórií: mäsité, bezmäsité, vegánske, sladké, štipľavé
10. Názov kategórie musí byť so správnou diakritikou
11. Ak nemôžeš vytvoriť skutočný recept, vráť *prázdny JSON objekt so správnou štruktúrou*
12. Čo najviac obmedz opakovanie receptov a surovín, chceme aby každy nový recept bol fresh a originálny.

*Štruktúra JSON, ktorú MUSÍŠ vrátiť*

{
  "name": "Názov receptu",
  "estimatedCookingTime": "Čas prípravy v minútach, napr. '25 minút'",
  "category": Názov kategórie,
  "ingredients": [
    { "name": "Názov ingrediencie", "amountGrams": 100 }
  ],
  "steps": [
    "Krok 1",
    "Krok 2",
    "Krok 3"
  ]
}

*Pravidlá formátu JSON*
- Ingrediencie len v gramoch - čísla, žiadne texty ako 'približne'  
- Kroky jasné, realistické a VŽDY očíslované
- Recept MUSÍ mať pridelenú kategóriu
- Recept pre 1 osobu
}
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate a random recipe." },
        ],
        max_tokens: 610,
        temperature: 0.8,
      });

    const rawResponse = completion.choices[0].message.content;

    let parsedJSON;
    try {
      parsedJSON = JSON.parse(rawResponse);
    } catch (jsonErr) {
      console.error("❌ Invalid JSON from GPT:", rawResponse);
      return res.status(500).json({
        error: "Invalid JSON received from AI",
      });
    }

      return res.json({
        success: true,
        recipe: parsedJSON,
      });
    } catch (err) {
      console.error("❌ GPT error:", err);

      if (err.code === "insufficient_quota") {
        return res.status(429).json({
          error: "Monthly AI quota reached",
        });
      }

      res.status(500).json({
        error: "Failed to generate recipe",
      });
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
