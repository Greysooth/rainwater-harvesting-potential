import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { MongoClient } from "mongodb";
import cors from "cors";
import OpenAI from "openai";


dotenv.config();

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

// --- Path helpers ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// --------------------------------------------------
// MongoDB setup (optional)
// --------------------------------------------------
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

// --------------------------------------------------
// Fallback dataset loader
// --------------------------------------------------
let fallbackLocations = null;

async function loadFallbackLocations() {
  if (fallbackLocations) return fallbackLocations;

  const filePath = path.join(__dirname, "../data/locations_data.json");
  const raw = await fs.readFile(filePath, "utf-8");
  fallbackLocations = JSON.parse(raw);
  return fallbackLocations;
}

// --------------------------------------------------
// API: Calculate Rainwater Harvesting Potential
// --------------------------------------------------
app.post("/api/calculate", async (req, res) => {
  try {
    const { location, roofArea, dwellers } = req.body;

    if (!location || !roofArea || !dwellers) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    let locationData = null;

    // --- Try MongoDB first ---
    if (db) {
      locationData = await db.collection("locations").findOne({
        city: { $regex: new RegExp(`^${location}$`, "i") }
      });
    }

    // --- Fallback to JSON ---
    if (!locationData) {
      const fallback = await loadFallbackLocations();
      locationData = fallback.find(
        (l) => l.city.toLowerCase() === location.toLowerCase()
      );
    }

    if (!locationData) {
      return res.status(404).json({
        error: "Location not found"
      });
    }

    // --------------------------------------------------
    // ✅ CORRECT DATA EXTRACTION (MATCHES YOUR DATASET)
    // --------------------------------------------------
    const rainfall = Number(locationData.avg_rainfall_mm); // mm/year
    const rechargeEfficiency =
      Number(locationData.recharge_efficiency_percent) / 100;

    if (!Number.isFinite(rainfall) || !Number.isFinite(rechargeEfficiency)) {
      return res.status(500).json({
        error: "Invalid rainfall or recharge data for selected location"
      });
    }

    // --------------------------------------------------
    // ✅ SCIENTIFICALLY CORRECT CALCULATION
    // 1 mm rain on 1 m² = 1 litre
    // --------------------------------------------------
    const harvestableWater = rainfall * roofArea * rechargeEfficiency;

    if (!Number.isFinite(harvestableWater)) {
      return res.status(500).json({
        error: "Harvesting calculation failed"
      });
    }

    // --------------------------------------------------
    // Response
    // --------------------------------------------------
    res.json({
      location: locationData.city,
      roofArea,
      dwellers,
      harvestableWater: Math.round(harvestableWater),
      recommendation:
        harvestableWater < 30000
          ? "Low Feasibility"
          : harvestableWater < 70000
          ? "Moderately Feasible"
          : "Highly Feasible"
    });

  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({
      error: "Internal server error"
    });
  }
});

// --------------------------------------------------
// API: Chatbot 
// --------------------------------------------------

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, context } = req.body;

    // Guard: missing API key
    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        reply:
          "AI assistant is currently unavailable. Please configure the API key."
      });
    }

    // Guard: no calculation context yet
    if (!context) {
      return res.json({
        reply:
          "Please calculate your rainwater harvesting potential first, then ask questions."
      });
    }

    const systemPrompt = `
You are a helpful assistant for a rainwater harvesting assessment tool.

You MUST answer strictly using the following context.
Do NOT invent numbers or policies.
If a question is unrelated, politely refuse.

Context:
- Annual harvestable water: ${context.water} litres
- Feasibility: ${context.feasibility}
- Percent demand met: ${context.percentDemandMet}%
- Annual household demand: ${context.annualDemand} litres
- Recommended system: ${context.recommendedStructure.name}
- Subsidy info: ${context.subsidyInfo}

Explain clearly, in simple language, suitable for a general user.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.4,
      max_tokens: 150
    });

    res.json({
      reply: completion.choices[0].message.content
    });

  } catch (error) {
    console.error("Chatbot error:", error);
    res.json({
      reply:
        "Sorry, I ran into an issue while answering. Please try again later."
    });
  }
});

// --------------------------------------------------
// Start server
// --------------------------------------------------
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
