// server/index.js (ES modules)
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";   // <-- HASHING COMMENTED OUT FOR TESTING

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

      // ----- HASHING RELATED LINES (COMMENTED OUT) -----
       const hashed = await bcrypt.hash(password, 10);
      // --------------------------------------------------
      // For testing we directly use the plain password (so DB will contain the raw password).
      // Remember to restore hashing after testing.
      
      // --------------------------------------------------

      const result = await users.insertOne({ email, password: hashed, createdAt: new Date() });
      return res.status(201).json({ ok: true, id: result.insertedId });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ error: "Email already exists" });
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  });
  // LOGIN endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const user = await users.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare passwords (currently plain text for testing)
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Optional: Generate token later, for now just confirm success
    return res.json({ ok: true, message: "Login successful", user: { email } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


  /* optional: simple list endpoint for testing (do NOT expose in production)
  app.get("/api/users", async (req, res) => {
    const list = await users.find({}, { projection: { password: 0 } }).toArray();
    res.json(list);
  });*/

  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

start().catch((e) => {
  console.error("Failed to start server:", e);
  process.exit(1);
});
