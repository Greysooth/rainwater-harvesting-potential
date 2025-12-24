# Rainwater Harvesting Potential Assessment System 🌧️💧

A web-based decision-support system developed as part of **Smart India Hackathon (SIH)** to estimate the **rainwater harvesting potential** of residential buildings using location-specific rainfall data, rooftop area, and household parameters.

The project aims to promote **sustainable water management** through transparent, data-driven insights and explainable recommendations.

---

## 🚀 Key Features

- 📍 **Location-based rainfall analysis**
- 🏠 **Rooftop-area-based water harvesting estimation**
- 📊 **Annual harvestable water calculation (litres)**
- 🧠 **Feasibility classification (Low / Medium / High)**
- 🛠️ **Rainwater harvesting system recommendation**
- 💰 **Indicative subsidy / incentive insights**
- 🤖 **Context-aware AI assistant** (explains results, not guesses)
- 🗄️ **MongoDB Atlas with automatic JSON fallback**

---

## 🧩 Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript  
- **Backend:** Node.js, Express  
- **Database:** MongoDB Atlas  
- **AI (optional):** OpenAI API  
- **Hosting:**  
  - Frontend → GitHub Pages  
  - Backend → Render  

---

## 🏗️ Project Structure

```
├── src/              # Backend server & database seeder
├── data/             # Fallback datasets (JSON)
├── docs/             # SIH problem statement
├── screenshots/      # Demo images
├── index.html        # Frontend entry (GitHub Pages)
├── style.css         # Frontend styling
├── script.js         # Frontend logic
```

---

## 🌐 Deployment Architecture

- **Frontend:** GitHub Pages (static hosting)
- **Backend API:** Render (Node.js service)
- **Database:** MongoDB Atlas

The frontend communicates with the backend exclusively through REST APIs.  
All calculations are performed server-side for consistency and reproducibility.

---

## ⚙️ Local Setup (Backend)

### Clone the repository
```bash
git clone https://github.com/greysooth/rainwater-harvesting-potential.git
cd rainwater-harvesting-potential
```

### Install dependencies
```bash
npm install
```

### Environment variables
Create a `.env` file using the template:
```bash
cp .env.example .env
```

Fill in the following:
```env
PORT=3000
DATABASE_URL=your_mongodb_atlas_uri
OPENAI_API_KEY=your_openai_api_key
```

---

## ▶️ Running the Backend Locally

```bash
node src/server.js
```

The API will be available at:
```
http://localhost:3000
```

---

## 🗄️ Database Seeding (Optional)

To populate MongoDB with sample location data:
```bash
node src/seed.js
```

Seeder uses:
```
data/locations_data.json
```

---

## 📴 Running Without MongoDB

If MongoDB Atlas is not configured or unavailable, the backend **automatically falls back** to:

```
data/locations_data.json
```

This ensures the system remains usable in offline or demo environments.

---

## 🤖 Context-Aware AI Assistant

The integrated AI assistant:
- Uses **only the calculated results** as context
- Explains feasibility, recommendations, and trade-offs
- Refuses unrelated or speculative questions
- Never overrides or fabricates core calculations

The AI acts strictly as an **explanatory layer**, not a prediction engine.

---

## 🌍 Frontend (GitHub Pages)

The frontend is served directly from the repository root via **GitHub Pages**.

To connect it to a deployed backend:
- Update the API base URL in `script.js`
- No build step is required

---

## 📄 Problem Statement

The original SIH problem statement is available at:
```
docs/SIH-Problem-Statement.pdf
```

---

## 🔮 Future Scope

- GIS-based rooftop area estimation
- Real-time rainfall API integration
- State-wise policy & subsidy configuration
- IoT-based tank level monitoring
- Mobile application support

---

## ✅ Project Status

### **v1.0 — Stable Release**

This version represents a **fully deployed, end-to-end functional prototype** with:

- Deterministic, explainable calculations  
- Live backend and frontend deployments  
- Context-aware AI assistant grounded in computed data  
- Secure configuration handling  
- Clear separation of data, logic, and presentation  

The project prioritizes **clarity, transparency, and auditability**, making it suitable for demonstrations, reviews, and future extensions.

---

## 👤 Author

**Mukund Kushwaha**  
Team **Synapse Overflow**  
Smart India Hackathon (SIH) 2025

---

## 📜 License

This project is licensed under the **MIT License**.
