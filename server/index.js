// server/index.js
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

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
    console.log("REQ BODY:", req.body); // ✅ debug log
    try {
      const { email, weight, height, age } = req.body;

      if (!email || isNaN(weight) || isNaN(height) || isNaN(age)) {
        return res.status(400).json({ error: "Invalid or missing fields" });
      }

      if (!client.topology || !client.topology.isConnected()) {
        return res.status(500).json({ error: "DB not connected" });
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
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({ ok: true, message: "Profile updated" });
    } catch (err) {
      console.error("Update profile error >>>", err); // ✅ debug log
      console.error("Update profile error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  //--------------------------------------------------------------
  app.get("/api/userProfile", async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Missing email" });

    const user = await db.collection("users").findOne({ email });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      age: user.age,
      weight: user.weight,
      height: user.height,
    });
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
