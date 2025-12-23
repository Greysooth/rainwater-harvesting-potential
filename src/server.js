import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { MongoClient } from 'mongodb';
import { fileURLToPath } from "url";

// --- Basic Setup ---
dotenv.config();
const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// --- Database Connection ---
const uri = process.env.DATABASE_URL;
if (!uri) {
    throw new Error('DATABASE_URL not found in .env file. Please check your configuration.');
}
const client = new MongoClient(uri);
let db;

async function connectToDatabase() {
    try {
        console.log("⏳ Connecting to MongoDB Atlas...");
        await client.connect({ serverSelectionTimeoutMS: 5000 });
        db = client.db();
        console.log("✅ Successfully connected to MongoDB Atlas!");
    } catch (err) {
        console.error("❌ Failed to connect to MongoDB", err);
        process.exit(1);
    }
}

// --- Helper Functions ---
function determineStructure(locationInfo, potentialLiters, annualDemand) {
    const soil_type = locationInfo.soil_type.toLowerCase();
    const depth_to_water = locationInfo.avg_depth_to_water_table_meters;

    if (potentialLiters > 50000 && annualDemand > (potentialLiters * 0.8)) {
        return {
            name: 'Storage Tank',
            icon: 'fas fa-tank-water',
            description: `Your household's water demand is high compared to your harvest potential. A storage tank is ideal for saving on bills.`
        };
    }
    if (soil_type.includes('clay')) {
        return {
            name: 'Storage Tank',
            icon: 'fas fa-tank-water',
            description: 'Your area contains clayey soil with poor absorption. A storage tank is best for collecting water for direct use.'
        };
    }
    if (depth_to_water < 15) {
        return {
            name: 'Recharge Pit / Trench',
            icon: 'fas fa-faucet-drip',
            description: `With favorable soil and a shallow water table (${depth_to_water}m), a recharge pit or trench is highly effective for replenishing groundwater.`
        };
    }
    if (depth_to_water >= 15) {
        return {
            name: 'Recharge Shaft',
            icon: 'fas fa-arrow-down-to-line',
            description: `The water table is deep (${depth_to_water}m). A recharge shaft is needed to ensure the harvested water reaches the aquifer.`
        };
    }
    return {
        name: 'Consult an Expert',
        icon: 'fas fa-user-tie',
        description: 'Your location has unique conditions. We recommend consulting a local expert for the best solution.'
    };
}


// --- API Router Setup ---
const apiRouter = express.Router();

// 1. CHATBOT API ENDPOINT (CORRECTED)
apiRouter.post("/chat", async (req, res) => {
    const { message, context } = req.body;
    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    let systemPrompt = `You are AquaBot, a helpful assistant for a rainwater harvesting calculator in India. Be friendly, encouraging, and provide fun, relatable facts.`;

    if (context) {
        // **FIX**: The variable is now correctly declared as `let contextDetails` before being used.
        let contextDetails = `
        The user has just received the following results for their city:
        - Feasibility: ${context.feasibility}
        - Annual Water Harvested: ${context.litersRecharged.toLocaleString('en-IN')} Liters
        - Recommended System: ${context.recommendedStructure.name}
        - Percentage of Demand Met: ${context.percentDemandMet}% of their family's annual water needs.
        `;

        if (context.subsidyDetails && context.subsidyDetails.available) {
            contextDetails += `
            Subsidy Information:
            - Summary: ${context.subsidyDetails.summary}
            - Details: ${context.subsidyDetails.details}
            `;
        } else {
            contextDetails += `
            Subsidy Information: No specific subsidy details are available for this location.
            `;
        }
        
        systemPrompt += contextDetails;
        systemPrompt += `
        Your primary goal is to answer the user's questions based on this data.
        - If they ask "am I eligible for the subsidy?", use the 'Details' section to help them understand the criteria (e.g., roof size, building type).
        - If they ask about their system, explain it simply.
        - Relate the liter amount to something tangible (e.g., "That's enough to fill 200 standard water tankers!").
        - Weave in fun facts about water conservation in India.
        - If their question is unrelated, answer it normally.
        `;
    } else {
        systemPrompt += ` The user has not run a calculation yet. Encourage them to use the calculator to see their home's potential.`;
    }

    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
        });
        res.json({ reply: completion.choices[0].message.content });
    } catch (err) {
        console.error("Error calling OpenAI:", err);
        res.status(500).json({ error: "Failed to fetch AI reply." });
    }
});

// 2. CALCULATION API ENDPOINT
apiRouter.post("/calculate", async (req, res) => {
    const { location, roofArea, dwellers } = req.body;
    if (!location || !roofArea || !dwellers) {
        return res.status(400).json({ error: "All fields are required." });
    }
    try {
        const locationInfo = await db.collection('locations').findOne({
            city: { $regex: new RegExp(`^${location}$`, 'i') }
        });
        if (!locationInfo) {
            return res.status(404).json({ error: `Sorry, data for '${location}' is not available yet.` });
        }

        const efficiency = locationInfo.recharge_efficiency_percent / 100;
        const potentialLiters = Math.floor(roofArea * locationInfo.avg_rainfall_mm * efficiency);
        
        let feasibility = 'Low';
        if (potentialLiters > 150000) feasibility = 'High';
        else if (potentialLiters > 70000) feasibility = 'Medium';
        
        const dailyDemand = dwellers * 135;
        const annualDemand = Math.floor(dailyDemand * 365);
        const waterSaved = Math.min(potentialLiters, annualDemand);
        const percentDemandMet = annualDemand > 0 ? Math.round((waterSaved / annualDemand) * 100) : 0;

        const recommendedStructure = determineStructure(locationInfo, potentialLiters, annualDemand);

        const subsidyInfo = locationInfo.subsidy_details ? locationInfo.subsidy_details.summary : "No specific subsidy info found.";
        const subsidyDetails = locationInfo.subsidy_details || null;

        res.json({
            feasibility,
            litersRecharged: potentialLiters,
            subsidyInfo,
            subsidyDetails,
            recommendedStructure,
            annualDemand,
            percentDemandMet
        });

    } catch (err) {
        console.error("Calculation API Error:", err);
        res.status(500).json({ error: "Server error during calculation." });
    }
});


// --- Use the Routers ---
app.use('/api', apiRouter);

// --- Frontend Hosting ---
app.use(express.static('public'));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start the Server ---
async function startServer() {
    await connectToDatabase();
    app.listen(PORT, () => {
        console.log(`✅ AquaSave server running at http://localhost:${PORT}`);
    });
}

startServer();

