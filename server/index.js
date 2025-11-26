// server/index.js
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";
import path from "path";

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

async function start() {
  await client.connect();
  console.log("✅ Connected to MongoDB");

  const db = client.db("userdb");
  const users = db.collection("users");

  // Ensure email uniqueness
  await users.createIndex({ email: 1 }, { unique: true });

  // ------------------- REGISTER -------------------
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, nick } = req.body;

      if (!email || !password || !nick) {
        return res.status(400).json({ error: "Missing fields" });
      }

      // Hash the password before saving
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

      // Return user data (without password)
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
    console.log("REQ BODY:", req.body); // debug log
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

  //--------------------------------------------------------------
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

      console.log("🔹 Reset Password Request Body:", req.body); // debug

      if (!token || !newPassword) {
        console.warn("⚠️ Missing token or password");
        return res.status(400).json({ error: "Missing token or password " });
      }

      const user = await users.findOne({
        resetToken: token,
        resetTokenExpires: { $gt: Date.now() },
      });

      console.log("🔹 User found with token:", user); // debug
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
      console.log("✅ Password reset successful for user:", user.email); // debug
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
      product,
      totalCalories,
      totalProteins,
      totalCarbs,
      totalFat,
      totalFiber,
      totalSalt,
      totalSugar,
    } = req.body; // pridáme totalCalories

    try {
      const user = await users.findOne({ email });
      console.log("👤 Found user:", user ? user.email : "NOT FOUND");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const productObj = {
        name: product, // názov produktu
        totalCalories: totalCalories ?? null, // pridáme kalórie
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

      // Ak používateľ nemá produkty, vrátime prázdne pole
      const products = user.products || [];

      console.log("📤 Returning products:", products);
      res.json({ success: true, products });
    } catch (err) {
      console.error("❌ Get products error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  //-----------------------------------------------------

  // ------------------- START SERVER -------------------
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );
}

start().catch((e) => {
  console.error("Failed to start server:", e);
  process.exit(1);
});
