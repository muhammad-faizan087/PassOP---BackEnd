import express from "express";
const router = express.Router();
import { MongoClient } from "mongodb";
import bodyParser from "body-parser";
import cors from "cors";
import "dotenv/config";

const url = process.env.MONGO_URI;
const client = new MongoClient(url);

const dbName = "PassOP";
await client.connect();

const db = client.db(dbName);
const collection = db.collection("users");

const port = 3000;
router.use(cors());
router.use(bodyParser.json());

router.post("/", async (req, res) => {
  try {
    let user = req.body;
    let username = user.username;

    const existingUser = await collection.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const insertResult = await collection.insertOne(user);
    res.status(201).json({ message: "User added successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const findResult = await collection.find({}).toArray();
    res.json(findResult);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
