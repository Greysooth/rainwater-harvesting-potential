import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

// This script will connect to your database and upload the city data.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uri = process.env.DATABASE_URL;
if (!uri) {
    console.error('❌ ERROR: DATABASE_URL not found in .env file.');
    process.exit(1);
}

const client = new MongoClient(uri);

async function seedDatabase() {
    try {
        console.log("⏳ Connecting to MongoDB...");
        await client.connect({ serverSelectionTimeoutMS: 5000 });
        console.log("✅ Step 1/4: Connected successfully to MongoDB Atlas.");

        const db = client.db(); // DB name is in the connection string
        const locationsCollection = db.collection('locations');
        console.log("✅ Step 2/4: Accessed the 'locations' collection.");

        const locationsData = JSON.parse(await fs.readFile(path.join(__dirname, 'locations_data.json'), 'utf-8'));
        console.log("✅ Step 3/4: Successfully read the locations_data.json file.");

        await locationsCollection.deleteMany({});
        const result = await locationsCollection.insertMany(locationsData);
        console.log(`✅ Step 4/4: Inserted ${result.insertedCount} documents.`);

        console.log("\n🎉 SUCCESS: Your database has been populated (seeded)!");
        console.log("You can now safely delete this 'seed.js' file and run your main server with 'npm start'.");

    } catch (err) {
        console.error("\n❌ FAILED: Could not connect to MongoDB or seed data.");
        console.error("---------------------------------------------------------");
        console.error("TROUBLESHOOTING:");
        console.error("1. Is your IP Address Access in MongoDB Atlas set to '0.0.0.0/0' (Allow Access from Anywhere)?");
        console.error("2. Are you using the correct username and password in the DATABASE_URL?");
        console.error("3. Double-check that your cluster URI matches Atlas → Connect → Drivers.");
        console.error("---------------------------------------------------------");
        console.error("Original Error Message:", err.message);
    } finally {
        await client.close();
        console.log("\n🚪 Connection to MongoDB closed.");
    }
}

seedDatabase();