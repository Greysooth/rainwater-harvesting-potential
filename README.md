# Rainwater Harvesting Potential Assessment System 🌧️💧

A web-based prototype developed for **Smart India Hackathon (SIH)** to estimate the **rainwater harvesting potential** of residential buildings using location-specific rainfall data, roof area, and household parameters.

The project focuses on promoting **sustainable water management** through simple, data-driven insights.

---

## 🚀 Features
- 📍 Location-based rainfall analysis
- 🏠 Roof-area-based rainwater harvesting estimation
- 📊 Annual harvestable water calculation (litres)
- 🧠 Feasibility assessment & system recommendation
- 🤖 Optional AI assistant (backend-supported)
- 🗄️ MongoDB Atlas with JSON fallback support

---

## 🧩 Tech Stack
- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas
- **AI (optional):** OpenAI API

---

## 🏗️ Project Structure
```
├── src/              # Backend server & seeder
├                     # Frontend source (for GitHub Pages)
├── data/             # Fallback datasets
├── docs/             # SIH problem statement
├── screenshots/      # Demo images
```

---

## 🌐 Deployment Architecture
- **Frontend:** GitHub Pages (static hosting)
- **Backend API:** Render (Node.js service)
- **Database:** MongoDB Atlas

The frontend communicates with the backend via REST APIs.

---

## ⚙️ Local Setup (Backend)

### Clone the repository
```
git clone https://github.com/greysooth/rainwater-harvesting-potential.git
cd rainwater-harvesting-potential
```

### Install dependencies
```
npm install
```

### Environment variables
Create a `.env` file from the template:
```
cp .env.example .env
```

Fill in:
```
PORT=3000
DATABASE_URL=your_mongodb_atlas_uri
OPENAI_API_KEY=your_openai_api_key
```

---

## ▶️ Running the Backend Locally
```
node src/server.js
```

API available at:
```
http://localhost:3000
```

---

## 🗄️ Database Seeding (Optional)
```
node src/seed.js
```

Uses:
```
data/locations_data.json
```

---

## 📴 Running Without MongoDB
If MongoDB is not configured, the backend automatically falls back to:
```
data/locations_data.json
```

---

## 🌍 Frontend (GitHub Pages)
The frontend is located in:
```
public/
```

Deploy it via **GitHub Pages** and update the backend API base URL in `public/script.js`.

---

## 📄 Problem Statement
```
docs/SIH-Problem-Statement.pdf
```

---

## 🔮 Future Scope
- GIS-based rooftop area detection
- Real-time rainfall API integration
- IoT-based tank level monitoring
- Government subsidy integration
- Mobile application support

---

## 👤 Author
**Mukund Kushwaha**  
Team **Synapse Overflow** (SIH 2025)

---

## 📜 License
MIT License
