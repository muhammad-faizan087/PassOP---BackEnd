import express from "express";
import { MongoClient } from "mongodb";
import bodyParser from "body-parser";
import cors from "cors";
import users from "../routes/users.js";
import login from "../routes/login.js";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import "dotenv/config";

const url = process.env.MONGO_URI;
const client = new MongoClient(url);

const dbName = "PassOP";
await client.connect();

const db = client.db(dbName);
const passwordsCollection = db.collection("passwords");

const app = express();
const port = 3000;

app.use("/users", users);
app.use("/login", login);

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.json());

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, "yeah yeah OP");
    req.userID = decoded.userID;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid token" });
  }
};

app.get("/", async (req, res) => {
  try {
    res.send("Backend Running");
  } catch (error) {
    res.status(500).json({ error: "Error running server" });
  }
});
app.get("/passwords", verifyToken, async (req, res) => {
  try {
    const passwords = await passwordsCollection
      .find({ userID: req.userID })
      .toArray();
    res.json(passwords);
  } catch (error) {
    res.status(500).json({ error: "Error fetching passwords" });
  }
});

app.post("/passwords", verifyToken, async (req, res) => {
  try {
    const passwordData = { ...req.body, userID: req.userID };
    const insertResult = await passwordsCollection.insertOne(passwordData);

    const insertedPassword = await passwordsCollection.findOne({
      _id: insertResult.insertedId,
    });

    res.status(201).json(insertedPassword);
  } catch (error) {
    res.status(500).json({ error: "Error saving password" });
  }
});

app.delete("/passwords", verifyToken, async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing password ID" });
    }

    // const objectId = new ObjectId(id);

    const deleteResult = await passwordsCollection.deleteOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : id,
      userID: req.userID,
    });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: "Password not found" });
    }
    res.json({ message: "Password deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error deleting password", details: error.message });
  }
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
