// server/index.js (ES modules)
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

  // unique index on email
  await users.createIndex({ email: 1 }, { unique: true });

  // register endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Missing fields" });

      // hash password before saving (do not store plaintext in prod)
      const hashed = await bcrypt.hash(password, 10);

      const result = await users.insertOne({ email, password: hashed, createdAt: new Date() });
      return res.status(201).json({ ok: true, id: result.insertedId });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ error: "Email already exists" });
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // optional: simple list endpoint for testing (do NOT expose in production)
  app.get("/api/users", async (req, res) => {
    const list = await users.find({}, { projection: { password: 0 } }).toArray();
    res.json(list);
  });

  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

start().catch((e) => {
  console.error("Failed to start server:", e);
  process.exit(1);
});
