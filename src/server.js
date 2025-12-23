import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { MongoClient } from "mongodb";

// -----------------------------
// Environment & App Setup
// -----------------------------
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// -----------------------------
// MongoDB Setup
// -----------------------------
const DATABASE_URL = process.env.DATABASE_URL;
let db = null;

async function connectToDatabase() {
  if (!DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL not provided. Using JSON fallback.");
    return;
  }

  try {
    const client = new MongoClient(DATABASE_URL);
    await client.connect();
    db = client.db();
    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.error("❌ MongoDB connection failed. Using JSON fallback.");
    db = null;
  }
}

// -----------------------------
// Fallback Loader
// -----------------------------
let fallbackLocations = null;

async function loadFallbackLocations() {
  if (fallbackLocations) return fallbackLocations;

  const filePath = path.join(__dirname, "../data/locations_data.json");
  const raw = await fs.readFile(filePath, "utf-8");
  fallbackLocations = JSON.parse(raw);
  return fallbackLocations;
}

// -----------------------------
// API: Calculate Harvesting
// -----------------------------
app.post("/api/calculate", async (req, res) => {
  try {
    const { location, roofArea, dwellers } = req.body;

    if (!location || !roofArea || !dwellers) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let locationData = null;

    if (db) {
      locationData = await db.collection("locations").findOne({
        city: { $regex: new RegExp(`^${location}$`, "i") },
      });
    }

    if (!locationData) {
      const fallback = await loadFallbackLocations();
      locationData = fallback.find(
        (l) => l.city.toLowerCase() === location.toLowerCase()
      );
    }

    if (!locationData) {
      return res.status(404).json({ error: "Location not found" });
    }

    const rainfall = locationData.avgAnnualRainfall; // mm
    const runoff = locationData.runoffCoefficient || 0.8;

    const harvestableWater = rainfall * roofArea * runoff; // litres

    res.json({
      location: locationData.city,
      annualRainfall: rainfall,
      roofArea,
      dwellers,
      harvestableWater: Math.round(harvestableWater),
      recommendation: harvestableWater > 50000 ? "Highly Feasible" : "Moderately Feasible",
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// -----------------------------
// API: Chatbot (Optional)
// -----------------------------
app.post("/api/chat", async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.json({ reply: "AI assistant is not configured." });
  }

  return res.json({ reply: "Chatbot integration placeholder." });
});

// -----------------------------
// Start Server
// -----------------------------
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
