// ===== START DEMO =====
function startDemo() {
    const overlay = document.getElementById('demoOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// ===== THEME TOGGLE =====
function toggleTheme() {
    const body = document.body;
    const icon = document.querySelector('.theme-toggle i');
    
    body.classList.toggle('dark-mode');
    
    // Save preference to localStorage
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        localStorage.setItem('theme', 'light');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// Load theme preference on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.querySelector('.theme-toggle i').classList.remove('fa-moon');
        document.querySelector('.theme-toggle i').classList.add('fa-sun');
    }
    
    // Update date display
    updateDateDisplay();
});

// ===== DATE DISPLAY =====
function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    const dateStr = today.toLocaleDateString('sk-SK', options);
    const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    
    const dateElements = document.querySelectorAll('#todayDate');
    dateElements.forEach(el => {
        el.textContent = capitalizedDate;
    });
}

// ===== MOBILE MENU =====
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('active');
}

// Close mobile menu when clicking on a link
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const navMenu = document.querySelector('.nav-menu');
            navMenu.classList.remove('active');
        });
    });
});

// ===== SMOOTH SCROLLING =====
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const navbar = document.querySelector('.navbar');
        const offset = (navbar ? navbar.offsetHeight : 0) + 12;
        const top = section.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({
            top: Math.max(top, 0),
            behavior: 'smooth'
        });
    }
}

// ===== AUTH MODALS =====
function showSection(sectionName) {
    if (sectionName === 'login') {
        showModal('loginModal');
    } else if (sectionName === 'register') {
        showModal('registerModal');
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function switchAuthMode(mode) {
    if (mode === 'login') {
        closeModal('registerModal');
        showModal('loginModal');
    } else if (mode === 'register') {
        closeModal('loginModal');
        showModal('registerModal');
    }
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', function() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(event) {
            if (event.target === this) {
                const modalId = this.id;
                closeModal(modalId);
            }
        });
    });
});

// ===== FORM HANDLING =====
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (email && password) {
        alert(`Prihlasovanie: ${email}\n\nV reálnej aplikácii by sa tu vyslalo na server.`);
        closeModal('loginModal');
        // Simulate successful login
        setTimeout(() => {
            alert('Prihlásenie úspešné! Vitaj v BitewiseFit Dashboard!');
        }, 300);
    }
}

function handleRegister(event) {
    event.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const nick = document.getElementById('registerNick').value;
    const password = document.getElementById('registerPassword').value;
    const password2 = document.getElementById('registerPassword2').value;
    
    if (password !== password2) {
        alert('Heslá sa nezhodujú!');
        return;
    }
    
    if (email && nick && password) {
        alert(`Registrácia úspešná!\n\nEmail: ${email}\nPrezývka: ${nick}\n\nTeraz sa môžeš prihlásiť.`);
        closeModal('registerModal');
        setTimeout(() => {
            showModal('loginModal');
        }, 300);
    }
}

// ===== DASHBOARD TAB SWITCHING =====
let currentDashTab = 0;

function switchDashTab(tabIndex) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.dashboard-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.bottom-nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    // Show selected tab
    const tabIds = ['tab-overview', 'tab-pantry', 'tab-recipes', 'tab-settings'];
    const selectedTab = document.getElementById(tabIds[tabIndex]);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked nav item
    // Map tab index to nav item index: 0->0, 1->3, 2->1, 3->4
    const navIndexMap = [0, 3, 1, 4];
    if (navItems[navIndexMap[tabIndex]]) {
        navItems[navIndexMap[tabIndex]].classList.add('active');
    }
    
    currentDashTab = tabIndex;
}

// ===== RECIPE DETAIL =====
function showRecipeDetail(recipeName) {
    const recipeDetailTitle = document.getElementById('recipeDetailTitle');
    if (recipeDetailTitle) {
        recipeDetailTitle.textContent = recipeName;
    }
    showModal('recipeDetailModal');
}

function showInstallPrompt(contextName) {
    const promptText = document.getElementById('installPromptText');
    if (promptText) {
        promptText.textContent = contextName
            ? `Recept "${contextName}" je dostupný v plnej verzii aplikácie BiteWise spolu s postupom, nákupným zoznamom a presnými nutričnými hodnotami.`
            : 'Tento obsah je len ochutnávka. Plné recepty, skenovanie a personalizované odporúčania nájdeš v aplikácii.';
    }
    showModal('installPromptModal');
}

function switchRecipeTab(tabIndex) {
    // Hide all recipe tabs
    const tabs = document.querySelectorAll('.recipe-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.recipe-tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const tabId = `recipeTab${tabIndex}`;
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked button
    tabButtons[tabIndex].classList.add('active');
}

// ===== RECIPE SHOWCASE =====
function expandRecipe(element) {
    const recipeName = element.querySelector('.recipe-showcase-info h3').textContent;
    showInstallPrompt(recipeName);
}

// ===== PANTRY MANAGEMENT =====
function showRecipeIdeas(ingredient) {
    alert(`Receptácie s ingredienciou: ${ingredient}\n\nV reálnej aplikácii by sa tu zobrazili podobné recepty.`);
}

function removePantryItem() {
    if (confirm('Chceš naozaj odstrániť tento produkt zo špajzy?')) {
        alert('Produkt bol odstránigraný.');
        // In a real app, this would update the pantry list
    }
}

// ===== SEARCH RECIPES =====
function filterRecipes(searchTerm) {
    const recipeCards = document.querySelectorAll('.recipe-card');
    const term = searchTerm.toLowerCase();
    
    recipeCards.forEach(card => {
        const recipeName = card.querySelector('h4').textContent.toLowerCase();
        const recipeDesc = card.querySelector('.recipe-desc').textContent.toLowerCase();
        
        if (recipeName.includes(term) || recipeDesc.includes(term)) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.3s ease';
        } else {
            card.style.display = 'none';
        }
    });
}

// ===== WATER INTAKE TRACKING =====
let waterIntake = 1500; // in ml

function addWater(amount) {
    waterIntake += amount;
    updateWaterDisplay();
    alert(`Pridané ${amount}ml vody! Celkovo: ${waterIntake}ml`);
}

function updateWaterDisplay() {
    // In a real app, this would update the water stat card
    console.log(`Water intake updated to: ${waterIntake}ml`);
}

// ===== ANIMATIONS ON SCROLL =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'slideUp 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', function() {
    const animateElements = document.querySelectorAll('.feature-card, .recipe-card, .pantry-item, .stat-card');
    animateElements.forEach(el => {
        observer.observe(el);
    });
});

// ===== STATS UPDATE =====
function updateStats() {
    // Simulate real-time stats updates
    const stats = {
        calories: Math.floor(Math.random() * 2500),
        proteins: Math.floor(Math.random() * 150),
        carbs: Math.floor(Math.random() * 400),
        fat: Math.floor(Math.random() * 100),
        water: Math.floor(Math.random() * 3000),
        salt: Math.floor(Math.random() * 3)
    };
    
    console.log('Updated stats:', stats);
}

// Update stats every 30 seconds (for demo purposes)
setInterval(updateStats, 30000);

// ===== KEYBOARD NAVIGATION =====
document.addEventListener('keydown', function(event) {
    // Close modal with Escape key
    if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => {
            closeModal(modal.id);
        });
    }
});

// ===== LOCAL STORAGE FOR USER DATA =====
function saveUserPreferences(preferences) {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
}

function getUserPreferences() {
    const saved = localStorage.getItem('userPreferences');
    return saved ? JSON.parse(saved) : null;
}

// ===== NOTIFICATION SIMULATION =====
function showNotification(message, type = 'info') {
    // In a real app, this would show a toast notification
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// ===== UTILITY FUNCTIONS =====
function formatDate(date) {
    return date.toLocaleDateString('sk-SK', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function calculateBMI(weight, height) {
    // height in cm
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
}

function estimateCalories(weight, height, age, gender, activityLevel) {
    let bmr = 0;
    
    if (gender === 'male') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
    
    const activityMultipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'very_active': 1.725,
        'extremely_active': 1.9
    };
    
    return Math.round(bmr * (activityMultipliers[activityLevel] || 1.55));
}

// ===== PAGE INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('BitewiseFit Web Application Loaded');
    
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize tooltips or other UI elements
    initializeUI();
});

function setupEventListeners() {
    // Add any global event listeners here
    document.addEventListener('click', function(e) {
        // Close mobile menu when clicking outside
        if (!e.target.closest('.navbar')) {
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
            }
        }
    });
}

function initializeUI() {
    // Initialize any dynamic UI elements
    updateDateDisplay();
    
    // Set default active tab
    switchDashTab(0);
    
    // Set default recipe tab
    switchRecipeTab(0);
}

// ===== RESPONSIVE TABLE HANDLING =====
function makeTablesResponsive() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        if (window.innerWidth < 768) {
            // Add scrolling for smaller screens
            const wrapper = document.createElement('div');
            wrapper.style.overflowX = 'auto';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
}

window.addEventListener('resize', makeTablesResponsive);
document.addEventListener('DOMContentLoaded', makeTablesResponsive);

// ===== PERFORMANCE OPTIMIZATION =====
// Debounce function for resize events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== PRINT OPTIMIZATION =====
function printRecipe(recipeName) {
    window.print();
}

// Hide non-essential elements during print
window.addEventListener('beforeprint', function() {
    document.querySelector('.navbar').style.display = 'none';
    document.querySelector('.footer').style.display = 'none';
});

window.addEventListener('afterprint', function() {
    document.querySelector('.navbar').style.display = 'block';
    document.querySelector('.footer').style.display = 'block';
});

// ===== ACCESSIBILITY ENHANCEMENTS =====
// Add ARIA labels to interactive elements
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('button:not([aria-label])');
    buttons.forEach(btn => {
        if (btn.textContent.trim()) {
            btn.setAttribute('aria-label', btn.textContent.trim());
        }
    });
});

// ===== EXPORT FUNCTIONS =====
function exportDailyStats() {
    const stats = {
        date: new Date().toLocaleDateString('sk-SK'),
        calories: 1850,
        proteins: 65,
        carbs: 210,
        fat: 48,
        water: 1500
    };
    
    const csv = Object.keys(stats).join(',') + '\n' + Object.values(stats).join(',');
    
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = `stats_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// ===== SEARCH FUNCTIONALITY =====
function globalSearch(query) {
    if (query.length < 2) return;
    
    const results = [];
    
    // Search in recipes
    const recipeCards = document.querySelectorAll('.recipe-card, .recipe-showcase-card');
    recipeCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(query.toLowerCase())) {
            results.push({
                type: 'recipe',
                name: card.querySelector('h3, h4').textContent,
                element: card
            });
        }
    });
    
    // Search in pantry items
    const pantryItems = document.querySelectorAll('.pantry-item');
    pantryItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(query.toLowerCase())) {
            results.push({
                type: 'product',
                name: item.querySelector('h4').textContent,
                element: item
            });
        }
    });
    
    return results;
}

// ===== DATA VALIDATION =====
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    // At least 8 characters, one uppercase, one number
    const re = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    return re.test(password);
}

// ===== MEAL PLANNING =====
const weeklyMealPlan = {
    monday: ['Kuracie filé s ryžou', 'Ovocie'],
    tuesday: ['Bryndzové halušky', 'Zelená saláta'],
    wednesday: ['Pečená ryba s zeleninou', 'Jogurt'],
    thursday: ['Pasta s rajčinami', 'Ovocie'],
    friday: ['Grilované kuracie prsia', 'Zeleninový smoothie'],
    saturday: ['Kapustnica', 'Chlieb'],
    sunday: ['Zdravá pizza', 'Ovocie']
};

function getMealPlan(day) {
    return weeklyMealPlan[day.toLowerCase()] || [];
}

// Console welcome message
console.log('%cBitewiseFit Web Application', 'font-size: 20px; font-weight: bold; color: #6366f1;');
console.log('%cJedz múdrejšie, míňaj menej jedla!', 'font-size: 14px; color: #ec4899;');
console.log('Version: 1.0.0');
