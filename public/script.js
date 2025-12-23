// -----------------------------
// Config
// -----------------------------
// Set this to your Render backend URL when deployed
// Example: https://your-backend.onrender.com
const API_BASE_URL = ""; // empty = same-origin (local dev)

// -----------------------------
// DOM Elements
// -----------------------------
const form = document.getElementById("calc-form");
const resultBox = document.getElementById("result");
const errorBox = document.getElementById("error");
const locationInput = document.getElementById("location");
const roofAreaInput = document.getElementById("roofArea");
const dwellersInput = document.getElementById("dwellers");

// Autocomplete container
let autocompleteBox = document.createElement("div");
autocompleteBox.className = "autocomplete-box";
locationInput.parentNode.appendChild(autocompleteBox);

let locationsCache = [];

// -----------------------------
// Helpers
// -----------------------------
function showError(message) {
  errorBox.textContent = message;
  errorBox.style.display = "block";
}

function clearError() {
  errorBox.textContent = "";
  errorBox.style.display = "none";
}

function showResult(data) {
  resultBox.innerHTML = `
    <h3>Results for ${data.location}</h3>
    <p><strong>Annual Rainfall:</strong> ${data.annualRainfall} mm</p>
    <p><strong>Roof Area:</strong> ${data.roofArea} m²</p>
    <p><strong>Estimated Harvestable Water:</strong> ${data.harvestableWater} litres/year</p>
    <p><strong>Recommendation:</strong> ${data.recommendation}</p>
  `;
  resultBox.style.display = "block";
}

// -----------------------------
// Fetch Locations (for autocomplete)
// -----------------------------
async function loadLocations() {
  try {
    const res = await fetch("data/locations_data.json");
    locationsCache = await res.json();
  } catch (err) {
    console.warn("Could not load locations for autocomplete");
  }
}

function updateAutocomplete(query) {
  autocompleteBox.innerHTML = "";
  if (!query) return;

  const matches = locationsCache
    .filter((l) => l.city.toLowerCase().startsWith(query.toLowerCase()))
    .slice(0, 5);

  matches.forEach((match) => {
    const item = document.createElement("div");
    item.textContent = match.city;
    item.className = "autocomplete-item";
    item.onclick = () => {
      locationInput.value = match.city;
      autocompleteBox.innerHTML = "";
    };
    autocompleteBox.appendChild(item);
  });
}

// -----------------------------
// Form Submission
// -----------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const location = locationInput.value.trim();
  const roofArea = Number(roofAreaInput.value);
  const dwellers = Number(dwellersInput.value);

  if (!location || roofArea <= 0 || dwellers <= 0) {
    showError("Please enter valid inputs for all fields.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, roofArea, dwellers }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.error || "Calculation failed");
      return;
    }

    showResult(data);
  } catch (err) {
    showError("Could not connect to the server.");
  }
});

// -----------------------------
// Event Listeners
// -----------------------------
locationInput.addEventListener("input", (e) => {
  updateAutocomplete(e.target.value);
});

// -----------------------------
// Init
// -----------------------------
loadLocations();
