document.addEventListener('DOMContentLoaded', () => {

    let dashboardContext = null;
    // --- DOM Selections ---
    const harvestForm = document.getElementById('harvest-form');
    const dashboard = document.getElementById('dashboard');
    const feasibilityCard = document.querySelector('.feasibility-card');
    const feasibilityText = document.getElementById('feasibility-text');
    const litersRechargedText = document.getElementById('liters-recharged');
    const subsidyInfoText = document.getElementById('subsidy-info');
    
    const rtrwhTypeIcon = document.getElementById('rtrwh-type-icon');
    const rtrwhTypeText = document.getElementById('rtrwh-type-text');
    const rtrwhTypeDescription = document.getElementById('rtrwh-type-description');

    const chatbotToggler = document.querySelector('.chatbot-toggler');
    const chatbotWindow = document.querySelector('.chatbot-window');
    const closeBtn = document.querySelector('.close-btn');
    const chatbotBody = document.querySelector('.chatbot-body');
    const chatbotInput = chatbotWindow.querySelector('input');
    const chatbotSendBtn = chatbotWindow.querySelector('button');

    const hiddenElements = document.querySelectorAll('.hidden');

    // --- Form Submission Logic (NOW CALLS BACKEND) ---
    harvestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const location = document.getElementById('location').value;
        const roofArea = parseInt(document.getElementById('roof-area').value);
        const dwellers = parseInt(document.getElementById('dwellers').value);

        if (!location || isNaN(roofArea) || isNaN(dwellers)) {
            alert("Please fill all fields with valid data.");
            return;
        }

        const submitButton = harvestForm.querySelector('.cta-button');
        submitButton.querySelector('span').textContent = 'Analyzing...';
        submitButton.disabled = true;

        try {
            const response = await fetch('/api/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location, roofArea, dwellers })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Calculation failed.');
            }

            const results = await response.json();
            updateDashboard(results);

        } catch (error) {
            alert(error.message); // Display error to the user
        } finally {
            submitButton.querySelector('span').textContent = 'Calculate Now';
            submitButton.disabled = false;
        }
    });

    // --- Chatbot Logic (NOW CALLS BACKEND) ---
    const handleChat = async () => {
        const userMessage = chatbotInput.value.trim();
        if (!userMessage) return;

        addMessageToChat(userMessage, 'user');
        chatbotInput.value = '';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, context: dashboardContext })
            });
            const data = await response.json();
            addMessageToChat(data.reply, 'bot');
        } catch (error) {
            addMessageToChat('Sorry, I seem to be having trouble connecting. Please try again later.', 'bot');
        }
    };

    chatbotSendBtn.addEventListener('click', handleChat);
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChat();
    });

    function addMessageToChat(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        const p = document.createElement('p');
        p.textContent = message;
        messageDiv.appendChild(p);
        chatbotBody.appendChild(messageDiv);
        chatbotBody.scrollTop = chatbotBody.scrollHeight; // Auto-scroll to latest message
    }
    
    // --- Dashboard Update Functions (No change in logic) ---
 // updateDashboard function in script.js (Updated)
function updateDashboard(results) {
    // --- Update Feasibility and Liters (No change here) ---
    feasibilityText.textContent = results.feasibility;
    animateCounter(litersRechargedText, results.litersRecharged); // removed duration, let's simplify
    feasibilityCard.className = 'card feasibility-card'; // Reset classes
    feasibilityCard.classList.add(results.feasibility.toLowerCase());
    
    // --- Update Subsidy Info (Now dynamic) ---
    subsidyInfoText.textContent = results.subsidyInfo;

    // --- Update Recommended System (Directly from backend) ---
    const { name, icon, description } = results.recommendedStructure;
    rtrwhTypeIcon.className = icon; // Set the whole class string from backend
    rtrwhTypeText.textContent = name;
    rtrwhTypeDescription.textContent = description;

    // --- NEW: Select and update the Water Savings card ---
    const demandMetPercent = document.getElementById('demand-met-percent');
    const demandMetText = document.getElementById('demand-met-text');
    
    // Animate the percentage
    animateCounter(demandMetPercent, results.percentDemandMet, false); // false means don't add "L"
    
    // Update the description text
    demandMetText.innerHTML = `of your annual demand of <strong>${results.annualDemand.toLocaleString('en-IN')} L</strong> can be met.`;

    // --- Show the dashboard ---
    dashboard.style.display = 'grid'; // Use 'grid' to match CSS
    
    // Animate the dashboard appearance
    setTimeout(() => {
        dashboard.classList.add('visible');
    }, 100);

    dashboardContext = results; // Save the entire results object
}


// A slightly cleaner animateCounter function
function animateCounter(element, targetValue, addLiters = true) {
    let start = 0;
    const duration = 1500; // ms
    const stepTime = 20; // ms
    const steps = duration / stepTime;
    const increment = targetValue / steps;

    const counter = setInterval(() => {
        start += increment;
        if (start >= targetValue) {
            element.textContent = targetValue.toLocaleString('en-IN');
            if(addLiters) element.textContent += ' L'; // Add "L" only if needed
            clearInterval(counter);
        } else {
            element.textContent = Math.floor(start).toLocaleString('en-IN');
        }
    }, stepTime);
}

    
    // --- Toggler & Observer Logic (No changes) ---
    chatbotToggler.addEventListener('click', () => chatbotWindow.classList.toggle('active'));
    closeBtn.addEventListener('click', () => chatbotWindow.classList.remove('active'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    hiddenElements.forEach((el) => observer.observe(el));
});
