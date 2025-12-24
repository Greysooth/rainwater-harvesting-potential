const API_BASE_URL = "https://rainwater-harvesting-potential.onrender.com/";
document.addEventListener("DOMContentLoaded", () => {

  let dashboardContext = null;

  // --------------------------------------------------
  // DOM SELECTIONS
  // --------------------------------------------------
  const harvestForm = document.getElementById("harvest-form");
  const dashboard = document.getElementById("dashboard");

  const feasibilityText = document.getElementById("feasibility-text");
  const litersRechargedText = document.getElementById("liters-recharged");
  const subsidyInfoText = document.getElementById("subsidy-info");

  const rtrwhTypeIcon = document.getElementById("rtrwh-type-icon");
  const rtrwhTypeText = document.getElementById("rtrwh-type-text");
  const rtrwhTypeDescription = document.getElementById("rtrwh-type-description");

  const chatbotToggler = document.querySelector(".chatbot-toggler");
  const chatbotWindow = document.querySelector(".chatbot-window");
  const closeBtn = document.querySelector(".close-btn");
  const chatbotBody = document.querySelector(".chatbot-body");
  const chatbotInput = chatbotWindow.querySelector("input");
  const chatbotSendBtn = chatbotWindow.querySelector("button");

  const hiddenElements = document.querySelectorAll(".hidden");

  // --------------------------------------------------
  // FORM SUBMISSION
  // --------------------------------------------------
  harvestForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const location = document.getElementById("location").value.trim();
    const roofArea = Number(document.getElementById("roof-area").value);
    const dwellers = Number(document.getElementById("dwellers").value);

    if (!location || roofArea <= 0 || dwellers <= 0) {
      alert("Please enter valid values.");
      return;
    }

    const submitButton = harvestForm.querySelector(".cta-button");
    submitButton.querySelector("span").textContent = "Analyzing...";
    submitButton.disabled = true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, roofArea, dwellers })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Calculation failed");
      }

      const raw = await response.json();

      // --------------------------------------------------
      // FRONTEND ADAPTER (RAW → UI DATA)
      // --------------------------------------------------
      const water = Number(raw.harvestableWater);
      const annualDemand = dwellers * 135 * 365;

      // Feasibility
      let feasibility;
      if (water < 30000) feasibility = "Low";
      else if (water < 70000) feasibility = "Medium";
      else feasibility = "High";

      // % demand met
      const percentDemandMet = Math.min(
        100,
        Math.round((water / annualDemand) * 100)
      );

      // Recommended system (dynamic)
      let recommendedStructure;
      if (water < 20000) {
        recommendedStructure = {
          name: "Basic Recharge Pit",
          icon: "fas fa-tint",
          description:
            "Suitable for small rooftops with low rainfall. Low-cost groundwater recharge solution."
        };
      } else if (water < 60000) {
        recommendedStructure = {
          name: "Recharge Pit + Filter Unit",
          icon: "fas fa-filter",
          description:
            "Recommended for moderate rainfall areas to improve recharge efficiency."
        };
      } else {
        recommendedStructure = {
          name: "Recharge Pit + Storage Tank",
          icon: "fas fa-tools",
          description:
            "Best for large rooftops and high rainfall regions with significant reuse potential."
        };
      }

      // Subsidy logic (dynamic)
      let subsidyInfo;
      if (water < 20000) {
        subsidyInfo =
          "No direct subsidy available for small-scale rainwater harvesting systems.";
      } else if (water < 60000) {
        subsidyInfo =
          "Eligible for municipal incentive schemes (₹10,000–₹25,000 range, subject to local policy).";
      } else {
        subsidyInfo =
          "Eligible for high-capacity rainwater harvesting subsidy (up to ₹50,000, subject to approval).";
      }

      const adaptedResults = {
        water,
        feasibility,
        percentDemandMet,
        annualDemand,
        recommendedStructure,
        subsidyInfo
      };

      updateDashboard(adaptedResults);

    } catch (error) {
      alert(error.message);
    } finally {
      submitButton.querySelector("span").textContent = "Calculate Now";
      submitButton.disabled = false;
    }
  });

  // --------------------------------------------------
  // DASHBOARD UPDATE
  // --------------------------------------------------
  function updateDashboard(results) {

    // Feasibility text
    feasibilityText.textContent = results.feasibility;

    // Gauge animation
    const gauge = document.querySelector(".feasibility-gauge");
    gauge.classList.remove("low", "medium", "high");
    gauge.classList.add(results.feasibility.toLowerCase());

    // Annual water recharged
    animateCounter(litersRechargedText, results.water);

    // Recommended system
    rtrwhTypeIcon.className = results.recommendedStructure.icon;
    rtrwhTypeText.textContent = results.recommendedStructure.name;
    rtrwhTypeDescription.textContent =
      results.recommendedStructure.description;

    // Subsidy info
    subsidyInfoText.textContent = results.subsidyInfo;

    // Water savings
    const demandMetPercent = document.getElementById("demand-met-percent");
    const demandMetText = document.getElementById("demand-met-text");

    animateCounter(demandMetPercent, results.percentDemandMet, false);
    demandMetText.innerHTML =
      `of your annual demand of <strong>${results.annualDemand.toLocaleString(
        "en-IN"
      )} L</strong> can be met.`;

    // Reveal dashboard & cards
    dashboard.classList.add("visible");
    dashboard.querySelectorAll(".hidden").forEach((el) => {
      el.classList.add("visible");
    });

    dashboardContext = results;
  }

  // --------------------------------------------------
  // COUNTER ANIMATION
  // --------------------------------------------------
  function animateCounter(element, target, addLiters = true) {
    let current = 0;
    const step = target / 75;

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        element.textContent = target.toLocaleString("en-IN");
        if (addLiters) element.textContent += " L";
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current).toLocaleString("en-IN");
      }
    }, 20);
  }

  // --------------------------------------------------
  // CHATBOT
  // --------------------------------------------------
  const handleChat = async () => {
    const userMessage = chatbotInput.value.trim();
    if (!userMessage) return;

    addMessageToChat(userMessage, "user");
    chatbotInput.value = "";

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          context: dashboardContext
        })
      });

      const data = await response.json();
      addMessageToChat(data.reply, "bot");
    } catch {
      addMessageToChat(
        "Sorry, I’m having trouble connecting right now.",
        "bot"
      );
    }
  };

  chatbotSendBtn.addEventListener("click", handleChat);
  chatbotInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleChat();
  });

  function addMessageToChat(message, sender) {
    const div = document.createElement("div");
    div.className = `chat-message ${sender}`;
    const p = document.createElement("p");
    p.textContent = message;
    div.appendChild(p);
    chatbotBody.appendChild(div);
    chatbotBody.scrollTop = chatbotBody.scrollHeight;
  }

  // --------------------------------------------------
  // CHATBOT TOGGLE & INTERSECTION OBSERVER
  // --------------------------------------------------
  chatbotToggler.addEventListener("click", () =>
    chatbotWindow.classList.toggle("active")
  );
  closeBtn.addEventListener("click", () =>
    chatbotWindow.classList.remove("active")
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.1 }
  );

  hiddenElements.forEach((el) => observer.observe(el));
});
