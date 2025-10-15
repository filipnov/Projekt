import { emailDB } from "./test.js";



// index.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017"; // local default
const client = new MongoClient(uri, { useUnifiedTopology: true });

async function main() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("userdb"); // same name you created in Compass
    const users = db.collection("users");

    // Ensure unique username (safe to run multiple times)
    await users.createIndex({ username: 1 }, { unique: true });

    // INSERT - add a username
    try {
      const insertResult = await users.insertOne({
        username: { emailDB },
        password: "321",
      });
      console.log("Inserted user id:", insertResult.insertedId);
    } catch (err) {
      if (err.code === 11000) {
        console.log("Username already exists (duplicate).");
      } else {
        throw err;
      }
    }

    /*// FIND ONE
    const found = await users.findOne({ username: 'alice', password: "123" });
    console.log('Found user:', found);*/

    // LIST ALL USERS
    const all = await users
      .find({}, { projection: { _id: 0, username: 1 } })
      .toArray();
    console.log(
      "All usernames:",
      all.map((u) => u.username)
    );

    // OPTIONAL: remove a username (cleanup example)
    // await users.deleteOne({ username: 'alice' });
  } finally {
    await client.close();
    console.log("Disconnected");
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
