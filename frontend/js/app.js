/**
 * Carbon Footprint Assistant - Main App
 * SPA Router, UI Logic, Chart Management
 */

// ─── State ────────────────────────────────────────────────────────
let state = {
  user: null,
  isGuest: false,
  currentPage: 'dashboard',
  activitiesPage: 1,
  activitiesCategory: '',
  chatHistory: [],
  trendDays: 30,
  activityTypes: null,
  currentCategory: 'transport',
  trendChart: null,
  categoryChart: null
};

const FUN_FACTS = [
  "A return flight from New York to London emits ~1.8 tonnes CO₂ — 3 months of average home electricity.",
  "Beef produces 20x more CO₂ per gram of protein than tofu.",
  "Switching one car journey per week to cycling saves ~0.5 tonnes CO₂/year.",
  "The fashion industry is responsible for 10% of global annual carbon emissions.",
  "Working from home just 1 day/week can cut your commute emissions by 20%.",
  "Streaming video for 1 hour produces ~0.036 kg CO₂ — about the same as boiling a kettle.",
  "A plant-based diet saves an average of 1.5 tonnes CO₂/year vs a meat-heavy diet.",
  "LED bulbs use 75% less energy than traditional incandescent bulbs.",
];

const ALL_BADGES = [
  { id: 'first_log', name: 'First Step', description: 'Logged your first activity', icon: '🌱' },
  { id: 'week_streak', name: '7-Day Streak', description: '7 days logged in a row', icon: '🔥' },
  { id: 'month_streak', name: '30-Day Streak', description: '30 days logged in a row', icon: '💎' },
  { id: 'plant_week', name: 'Plant Powered', description: 'Chose plant-based meals', icon: '🥗' },
  { id: 'green_commuter', name: 'Green Commuter', description: 'Used public transport', icon: '🚆' },
  { id: 'cyclist', name: 'Cyclist', description: 'Cycled or walked', icon: '🚴' },
  { id: 'energy_saver', name: 'Energy Saver', description: 'Reduced energy use', icon: '💡' },
  { id: 'carbon_tracker', name: 'Carbon Tracker', description: 'Logged 50 activities', icon: '📊' },
  { id: 'eco_warrior', name: 'Eco Warrior', description: 'Reached Level 7', icon: '🌍' },
  { id: 'below_average', name: 'Below Average', description: 'Below global average', icon: '⭐' }
];

// ─── Initialization ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set today's date as default in calculator
  document.getElementById('activity-date').value = new Date().toISOString().split('T')[0];

  // Set random fun fact
  document.getElementById('fun-fact').textContent = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];

  // Apply saved theme preference
  const savedTheme = localStorage.getItem('cfa_theme') || 'dark';
  applyTheme(savedTheme);

  // Check if already logged in
  const savedUser = localStorage.getItem('cfa_user');
  const token = localStorage.getItem('cfa_token');

  if (savedUser && token) {
    state.user = JSON.parse(savedUser);
    state.isGuest = false;
    showApp();
  } else if (localStorage.getItem('cfa_guest_activities') !== null || localStorage.getItem('cfa_guest_user')) {
    // Returning guest
    state.user = window.guestManager.getUser();
    state.isGuest = true;
    showApp();
  }

  // Auth form event listeners
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
  document.getElementById('activity-form').addEventListener('submit', handleLogActivity);

  // Load activity types for calculator
  loadActivityTypes();
});

// ─── Theme Toggle ────────────────────────────────────────────
function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    const label = document.getElementById('theme-toggle-label');
    if (label) label.textContent = '☀️ Light Mode';
  } else {
    document.documentElement.removeAttribute('data-theme');
    const label = document.getElementById('theme-toggle-label');
    if (label) label.textContent = '🌙 Dark Mode';
  }
  localStorage.setItem('cfa_theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'light' ? 'dark' : 'light');
}

// ─── Auth Functions ───────────────────────────────────────────────
function switchAuthTab(tab) {
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('tab-login').setAttribute('aria-selected', tab === 'login');
  document.getElementById('tab-register').setAttribute('aria-selected', tab === 'register');
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-login');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  errorEl.textContent = '';
  btn.disabled = true;
  btn.classList.add('btn-loading');

  try {
    const data = await window.api.login(email, password);
    state.user = data.user;
    state.isGuest = false;
    localStorage.setItem('cfa_user', JSON.stringify(data.user));
    showApp();
  } catch (err) {
    errorEl.textContent = err.message;
    document.getElementById('login-form').querySelector('.form-group:last-of-type').classList.add('has-error');
  } finally {
    btn.disabled = false;
    btn.classList.remove('btn-loading');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-register');
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errorEl = document.getElementById('reg-error');

  errorEl.textContent = '';
  btn.disabled = true;
  btn.classList.add('btn-loading');

  try {
    const data = await window.api.register(username, email, password);
    state.user = data.user;
    state.isGuest = false;
    localStorage.setItem('cfa_user', JSON.stringify(data.user));
    showApp();
    showToast('🎉 Account created! Welcome to Carbon Footprint Assistant!', 'success');
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.classList.remove('btn-loading');
  }
}

function enterGuestMode() {
  state.user = window.guestManager.getUser();
  state.isGuest = true;
  showApp();
}

function logout() {
  if (!confirm('Sign out?')) return;
  if (!state.isGuest) {
    window.api.logout();
    localStorage.removeItem('cfa_user');
  }
  state.user = null;
  state.isGuest = false;
  state.chatHistory = [];
  destroyCharts();
  document.getElementById('app-layout').classList.add('hidden');
  document.getElementById('auth-page').style.display = 'flex';
  showToast('Signed out successfully', 'info');
}

// ─── App Display ──────────────────────────────────────────────────
function showApp() {
  document.getElementById('auth-page').style.display = 'none';
  document.getElementById('app-layout').classList.remove('hidden');

  // Update sidebar user info
  const user = state.user;
  document.getElementById('sidebar-username').textContent = user.username || 'Guest';
  document.getElementById('sidebar-user-type').textContent = state.isGuest ? 'Guest Mode' : user.email || '';
  document.getElementById('sidebar-avatar').textContent = state.isGuest ? '👤' : (user.username?.[0]?.toUpperCase() || '👤');

  navigateTo('dashboard');
  addWelcomeMessage();
}

// ─── Router ───────────────────────────────────────────────────────
function navigateTo(page) {
  // Hide all pages
  document.querySelectorAll('.page-view').forEach(p => {
    p.classList.remove('active');
    p.setAttribute('aria-hidden', 'true');
  });

  // Remove active from all nav items
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.remove('active');
    n.removeAttribute('aria-current');
  });

  // Show target page
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) {
    pageEl.classList.add('active');
    pageEl.removeAttribute('aria-hidden');
  }

  const navEl = document.getElementById(`nav-${page}`);
  if (navEl) {
    navEl.classList.add('active');
    navEl.setAttribute('aria-current', 'page');
  }

  state.currentPage = page;
  closeSidebar();

  // Load page-specific data
  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'activities': loadActivities(); break;
    case 'recommendations': loadRecommendations(); break;
    case 'profile': loadProfile(); break;
    case 'assistant': scrollChatToBottom(); break;
  }

  // Scroll main content to top
  window.scrollTo(0, 0);
}

// ─── Dashboard ────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    let summary, trends;

    if (state.isGuest) {
      summary = window.guestManager.getDashboardSummary();
      trends = window.guestManager.getTrends(state.trendDays);
    } else {
      [summary, trends] = await Promise.all([
        window.api.getDashboardSummary(),
        window.api.getTrends(state.trendDays)
      ]);
    }

    renderStats(summary.data);
    renderTrendChart(trends.data);
    renderCategoryChart(summary.data.categoryBreakdown);
    renderDashboardActivities();
    renderLevelCard(summary.data.gamification);
  } catch (err) {
    showToast('Error loading dashboard: ' + err.message, 'error');
  }
}

function renderStats(data) {
  const { today, week, month, annualized } = data;
  const grid = document.getElementById('stats-grid');

  const getClass = (pct) => pct < 80 ? 'good' : pct < 120 ? 'warn' : 'bad';
  const getEmoji = (pct) => pct < 80 ? '✅' : pct < 120 ? '⚠️' : '🔴';

  grid.innerHTML = `
    <div class="card stat-card animate-fade-up">
      <div class="card-title">Today</div>
      <div class="stat-value">${today.kg.toFixed(1)}<span style="font-size:1rem; font-weight:400"> kg</span></div>
      <div class="stat-label">CO₂ emissions</div>
      <div class="stat-badge ${getClass(today.vs_global)} mt-sm">${getEmoji(today.vs_global)} ${today.vs_global}% of avg</div>
    </div>
    <div class="card stat-card animate-fade-up" style="animation-delay:0.05s">
      <div class="card-title">This Week</div>
      <div class="stat-value">${week.kg.toFixed(1)}<span style="font-size:1rem; font-weight:400"> kg</span></div>
      <div class="stat-label">CO₂ emissions</div>
      <div class="stat-badge ${getClass(week.vs_global)} mt-sm">${getEmoji(week.vs_global)} ${week.vs_global}% of avg</div>
    </div>
    <div class="card stat-card animate-fade-up" style="animation-delay:0.1s">
      <div class="card-title">This Month</div>
      <div class="stat-value">${month.kg.toFixed(1)}<span style="font-size:1rem; font-weight:400"> kg</span></div>
      <div class="stat-label">CO₂ emissions</div>
      <div class="stat-badge ${getClass(month.vs_global)} mt-sm">${getEmoji(month.vs_global)} ${month.vs_global}% of avg</div>
    </div>
    <div class="card stat-card animate-fade-up" style="animation-delay:0.15s">
      <div class="card-title">Annualized</div>
      <div class="stat-value">${annualized.tonnes.toFixed(2)}<span style="font-size:1rem; font-weight:400"> t</span></div>
      <div class="stat-label">CO₂/year (estimated)</div>
      <div class="stat-badge ${getClass(annualized.percentage_of_global)} mt-sm">${getEmoji(annualized.percentage_of_global)} vs ${annualized.vs_global_tonnes}t global avg</div>
    </div>
  `;
}

function renderLevelCard(gamification) {
  if (!gamification) return;
  const { level, levelInfo, greenScore, currentStreak, progress, nextLevelAt } = gamification;

  document.getElementById('level-icon').textContent = levelInfo?.icon || '🌱';
  document.getElementById('level-name').textContent = levelInfo?.name || 'Carbon Novice';
  document.getElementById('level-number').textContent = `Level ${level}`;
  document.getElementById('score-current').textContent = `${greenScore} pts`;
  document.getElementById('score-next').textContent = nextLevelAt ? `Next: ${nextLevelAt} pts` : 'Max Level!';
  document.getElementById('progress-bar-fill').style.width = `${progress || 0}%`;
  document.getElementById('progress-bar-wrapper').setAttribute('aria-valuenow', progress || 0);
  document.getElementById('streak-count').textContent = currentStreak || 0;
  document.getElementById('green-score').textContent = greenScore || 0;
}

// ─── Charts ───────────────────────────────────────────────────────
function destroyCharts() {
  if (state.trendChart) { state.trendChart.destroy(); state.trendChart = null; }
  if (state.categoryChart) { state.categoryChart.destroy(); state.categoryChart = null; }
}

function renderTrendChart(data) {
  const canvas = document.getElementById('trend-chart');
  if (!canvas) return;

  if (state.trendChart) state.trendChart.destroy();

  const labels = data.labels.map(d => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const catColors = {
    transport: 'rgba(77, 159, 255, 0.7)',
    energy: 'rgba(255, 184, 77, 0.7)',
    food: 'rgba(0, 212, 170, 0.7)',
    shopping: 'rgba(212, 77, 255, 0.7)'
  };

  state.trendChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        ...data.datasets.map(d => ({
          label: d.category.charAt(0).toUpperCase() + d.category.slice(1),
          data: d.values,
          backgroundColor: catColors[d.category] || 'rgba(0, 212, 170, 0.7)',
          borderRadius: 4,
          borderSkipped: false
        })),
        {
          label: 'Global Average',
          data: new Array(data.labels.length).fill(data.globalAverageLine),
          type: 'line',
          borderColor: 'rgba(255, 90, 90, 0.7)',
          backgroundColor: 'transparent',
          borderDash: [6, 4],
          borderWidth: 2,
          pointRadius: 0,
          tension: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: 'rgba(240, 255, 248, 0.7)', font: { size: 11 }, boxWidth: 12 }
        },
        tooltip: {
          backgroundColor: 'rgba(10, 26, 18, 0.95)',
          titleColor: '#00D4AA',
          bodyColor: '#F0FFF8',
          borderColor: 'rgba(0, 212, 170, 0.3)',
          borderWidth: 1,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} kg CO₂`
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: { color: 'rgba(0, 212, 170, 0.05)' },
          ticks: { color: 'rgba(240, 255, 248, 0.5)', font: { size: 10 }, maxTicksLimit: 10 }
        },
        y: {
          stacked: true,
          grid: { color: 'rgba(0, 212, 170, 0.08)' },
          ticks: { color: 'rgba(240, 255, 248, 0.5)', font: { size: 10 }, callback: v => v + ' kg' }
        }
      }
    }
  });
}

function renderCategoryChart(breakdown) {
  const canvas = document.getElementById('category-chart');
  if (!canvas) return;

  if (state.categoryChart) state.categoryChart.destroy();

  if (!breakdown || breakdown.length === 0) {
    document.getElementById('category-legend').innerHTML = '<p style="font-size:0.8rem; color:var(--text-muted); text-align:center;">No data yet</p>';
    return;
  }

  const catColors = ['#4D9FFF', '#FFB84D', '#00D4AA', '#D44DFF'];
  const catIcons = { transport: '🚗', energy: '💡', food: '🍽️', shopping: '🛍️' };

  state.categoryChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: breakdown.map(c => c.category.charAt(0).toUpperCase() + c.category.slice(1)),
      datasets: [{
        data: breakdown.map(c => c.kg),
        backgroundColor: breakdown.map((_, i) => catColors[i % catColors.length]),
        borderColor: 'rgba(5, 14, 10, 0.5)',
        borderWidth: 3,
        hoverBorderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10, 26, 18, 0.95)',
          titleColor: '#00D4AA',
          bodyColor: '#F0FFF8',
          borderColor: 'rgba(0, 212, 170, 0.3)',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${ctx.parsed.toFixed(2)} kg CO₂ (${breakdown[ctx.dataIndex]?.percentage}%)`
          }
        }
      }
    }
  });

  // Legend
  const legendEl = document.getElementById('category-legend');
  legendEl.innerHTML = breakdown.map((c, i) => `
    <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.78rem;">
      <div style="display:flex; align-items:center; gap:6px;">
        <div style="width:10px; height:10px; border-radius:3px; background:${catColors[i % catColors.length]};"></div>
        <span style="color:var(--text-secondary)">${catIcons[c.category] || ''} ${c.category.charAt(0).toUpperCase() + c.category.slice(1)}</span>
      </div>
      <span style="color:var(--text-primary); font-weight:600;">${c.kg} kg</span>
    </div>
  `).join('');
}

async function updateTrend(days) {
  state.trendDays = days;
  document.getElementById('btn-trend-14').style.color = days === 14 ? 'var(--green-primary)' : '';
  document.getElementById('btn-trend-30').style.color = days === 30 ? 'var(--green-primary)' : '';
  document.getElementById('btn-trend-14').setAttribute('aria-pressed', days === 14);
  document.getElementById('btn-trend-30').setAttribute('aria-pressed', days === 30);

  try {
    const trends = state.isGuest
      ? window.guestManager.getTrends(days)
      : await window.api.getTrends(days);
    renderTrendChart(trends.data);
  } catch (err) {
    showToast('Error loading trends', 'error');
  }
}

// ─── Calculator ───────────────────────────────────────────────────
const EMISSION_FACTORS_LOCAL = {
  transport: { car_petrol: 0.192, car_diesel: 0.171, car_electric: 0.053, motorcycle: 0.114, bus: 0.089, train: 0.041, subway: 0.028, flight_domestic: 0.255, flight_international: 0.195, cycling: 0 },
  energy: { electricity: 0.233, natural_gas: 2.04, heating_oil: 2.68, lpg: 1.56, solar: 0.041 },
  food: { beef: 27, lamb: 39.2, pork: 12.1, chicken: 6.9, fish: 6.1, dairy: 3.2, eggs: 4.8, plant_based_meal: 0.5, meat_meal: 2.5 },
  shopping: { clothing: 33.4, electronics_smartphone: 70, electronics_laptop: 422, electronics_tv: 350, streaming: 0.036, online_shopping: 0.5 }
};

async function loadActivityTypes() {
  try {
    if (!state.isGuest) {
      const data = await window.api.getActivityTypes();
      state.activityTypes = data.data;
    } else {
      // Build from local emission factors for guest
      state.activityTypes = buildLocalActivityTypes();
    }
    populateActivitySelect('transport');
  } catch (err) {
    state.activityTypes = buildLocalActivityTypes();
    populateActivitySelect('transport');
  }
}

function buildLocalActivityTypes() {
  const labels = {
    transport: { car_petrol: { label: 'Car (Petrol)', unit: 'km', icon: '🚗' }, car_diesel: { label: 'Car (Diesel)', unit: 'km', icon: '🚗' }, car_electric: { label: 'Car (Electric)', unit: 'km', icon: '⚡' }, motorcycle: { label: 'Motorcycle', unit: 'km', icon: '🏍️' }, bus: { label: 'Bus', unit: 'km', icon: '🚌' }, train: { label: 'Train', unit: 'km', icon: '🚆' }, subway: { label: 'Subway/Metro', unit: 'km', icon: '🚇' }, flight_domestic: { label: 'Flight (Domestic)', unit: 'km', icon: '✈️' }, flight_international: { label: 'Flight (International)', unit: 'km', icon: '✈️' }, cycling: { label: 'Cycling / Walking', unit: 'km', icon: '🚴' } },
    energy: { electricity: { label: 'Electricity', unit: 'kWh', icon: '💡' }, natural_gas: { label: 'Natural Gas', unit: 'm³', icon: '🔥' }, heating_oil: { label: 'Heating Oil', unit: 'litres', icon: '🛢️' }, lpg: { label: 'LPG', unit: 'litres', icon: '⛽' }, solar: { label: 'Solar Energy', unit: 'kWh', icon: '☀️' } },
    food: { beef: { label: 'Beef', unit: 'kg', icon: '🥩' }, lamb: { label: 'Lamb / Mutton', unit: 'kg', icon: '🍖' }, pork: { label: 'Pork', unit: 'kg', icon: '🥩' }, chicken: { label: 'Chicken', unit: 'kg', icon: '🍗' }, fish: { label: 'Fish / Seafood', unit: 'kg', icon: '🐟' }, dairy: { label: 'Dairy', unit: 'kg', icon: '🥛' }, eggs: { label: 'Eggs', unit: 'kg', icon: '🥚' }, plant_based_meal: { label: 'Plant-Based Meal', unit: 'meals', icon: '🥗' }, meat_meal: { label: 'Meat Meal', unit: 'meals', icon: '🍔' } },
    shopping: { clothing: { label: 'New Clothing (per item)', unit: 'items', icon: '👕' }, electronics_smartphone: { label: 'Smartphone', unit: 'items', icon: '📱' }, electronics_laptop: { label: 'Laptop', unit: 'items', icon: '💻' }, electronics_tv: { label: 'Television', unit: 'items', icon: '📺' }, streaming: { label: 'Video Streaming', unit: 'hours', icon: '📺' }, online_shopping: { label: 'Online Shopping Delivery', unit: 'packages', icon: '📦' } }
  };
  const result = {};
  for (const [cat, activities] of Object.entries(labels)) {
    result[cat] = Object.entries(activities).map(([key, data]) => ({
      key, ...data, factor: EMISSION_FACTORS_LOCAL[cat][key] || 0
    }));
  }
  return result;
}

function selectCategory(category) {
  state.currentCategory = category;

  document.querySelectorAll('.category-tab').forEach(t => {
    t.classList.remove('active', 'transport', 'energy', 'food', 'shopping');
    t.setAttribute('aria-selected', 'false');
  });

  const tab = document.getElementById(`cat-tab-${category}`);
  tab.classList.add('active', category);
  tab.setAttribute('aria-selected', 'true');

  populateActivitySelect(category);
  updateCO2Preview();
}

function populateActivitySelect(category) {
  const select = document.getElementById('activity-type');
  const types = state.activityTypes?.[category] || [];

  select.innerHTML = '<option value="">Select activity...</option>';
  types.forEach(t => {
    const option = document.createElement('option');
    option.value = t.key;
    option.dataset.unit = t.unit;
    option.dataset.factor = t.factor;
    option.textContent = `${t.icon} ${t.label}`;
    select.appendChild(option);
  });
}

function updateCO2Preview() {
  const select = document.getElementById('activity-type');
  const qty = parseFloat(document.getElementById('activity-quantity').value);
  const previewEl = document.getElementById('co2-preview-value');
  const unitEl = document.getElementById('unit-label');

  const selectedOption = select.options[select.selectedIndex];

  if (selectedOption && selectedOption.dataset.unit) {
    unitEl.textContent = selectedOption.dataset.unit;
  }

  if (!isNaN(qty) && qty >= 0 && selectedOption?.value) {
    const factor = parseFloat(selectedOption.dataset.factor || 0);
    const co2 = (factor * qty).toFixed(3);
    previewEl.textContent = `${co2} kg`;
  } else {
    previewEl.textContent = '—';
  }
}

async function handleLogActivity(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-log-activity');
  const errorEl = document.getElementById('activity-error');

  const activityType = document.getElementById('activity-type').value;
  const quantity = parseFloat(document.getElementById('activity-quantity').value);
  const date = document.getElementById('activity-date').value;
  const note = document.getElementById('activity-note').value;

  if (!activityType) { errorEl.textContent = 'Please select an activity type'; return; }
  if (isNaN(quantity) || quantity < 0) { errorEl.textContent = 'Please enter a valid quantity'; return; }
  errorEl.textContent = '';

  const select = document.getElementById('activity-type');
  const selectedOption = select.options[select.selectedIndex];
  const unit = selectedOption?.dataset.unit || 'unit';
  const factor = parseFloat(selectedOption?.dataset.factor || 0);
  const co2Kg = parseFloat((factor * quantity).toFixed(4));

  const activityData = {
    category: state.currentCategory,
    activityType,
    quantity,
    unit,
    co2Kg,
    label: selectedOption?.textContent?.trim() || activityType,
    date,
    note
  };

  btn.disabled = true;
  btn.classList.add('btn-loading');
  btn.textContent = '';

  try {
    let result;
    if (state.isGuest) {
      result = window.guestManager.logActivity(activityData);
    } else {
      result = await window.api.logActivity(activityData);
    }

    showToast(`✅ Logged! +${result.gamification?.pointsEarned || 5} Green Points`, 'success');

    // Show new badges
    if (result.gamification?.newBadges?.length > 0) {
      result.gamification.newBadges.forEach(badge => {
        setTimeout(() => showToast(`🎖️ Badge earned: ${badge.name} ${badge.icon}!`, 'success'), 1000);
      });
    }

    resetCalculator();
    document.getElementById('fun-fact').textContent = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
  } catch (err) {
    showToast('Error logging activity: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.classList.remove('btn-loading');
    btn.textContent = 'Save Entry';
  }
}

function resetCalculator() {
  document.getElementById('activity-type').value = '';
  document.getElementById('activity-quantity').value = '';
  document.getElementById('activity-note').value = '';
  document.getElementById('activity-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('co2-preview-value').textContent = '—';
  document.getElementById('activity-error').textContent = '';
}

// ─── Activities Log ───────────────────────────────────────────────
async function loadActivities() {
  const category = document.getElementById('filter-category').value;
  const listEl = document.getElementById('activities-list');

  listEl.innerHTML = '<div class="empty-state"><div class="spinner" style="margin:auto;"></div></div>';

  try {
    let activities, pagination;

    if (state.isGuest) {
      let all = window.guestManager.getActivities();
      if (category) all = all.filter(a => a.category === category);
      const total = all.length;
      const limit = 15;
      const skip = (state.activitiesPage - 1) * limit;
      activities = all.slice(skip, skip + limit);
      pagination = { page: state.activitiesPage, limit, total, pages: Math.ceil(total / limit) };
    } else {
      const params = { limit: 15, page: state.activitiesPage };
      if (category) params.category = category;
      const data = await window.api.getActivities(params);
      activities = data.data;
      pagination = data.pagination;
    }

    renderActivitiesList(activities, listEl);
    renderPagination(pagination);
  } catch (err) {
    listEl.innerHTML = `<div class="empty-state"><p style="color:var(--color-danger)">Error: ${err.message}</p></div>`;
  }
}

function renderActivitiesList(activities, containerEl) {
  if (!activities || activities.length === 0) {
    containerEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon" aria-hidden="true">📋</div>
        <h3>No entries yet</h3>
        <p>Start tracking by adding your first emission entry.</p>
        <button class="btn btn-primary mt-md" onclick="navigateTo('calculator')">Add Your First Entry</button>
      </div>`;
    return;
  }

  const catIcons = { transport: '🚗', energy: '💡', food: '🍽️', shopping: '🛍️' };
  const catBg = { transport: 'rgba(77,159,255,0.12)', energy: 'rgba(255,184,77,0.12)', food: 'rgba(0,212,170,0.12)', shopping: 'rgba(212,77,255,0.12)' };

  containerEl.innerHTML = activities.map(a => `
    <div class="activity-item" data-id="${a._id}">
      <div class="activity-icon" style="background:${catBg[a.category] || 'var(--bg-glass)'}">
        ${catIcons[a.category] || '📌'}
      </div>
      <div class="activity-info">
        <div class="activity-name">${a.label || a.activityType}</div>
        <div class="activity-meta">
          ${a.quantity} ${a.unit} · ${formatDate(a.date)}
          ${a.note ? ` · <em>${a.note}</em>` : ''}
        </div>
      </div>
      <div class="activity-co2">
        <div class="activity-co2-value" style="color:${a.co2Kg === 0 ? 'var(--green-primary)' : 'var(--text-primary)'}">
          ${a.co2Kg === 0 ? '✓ 0' : a.co2Kg.toFixed(2)}
        </div>
        <div class="activity-co2-unit">kg CO₂</div>
      </div>
      <div class="cat-badge ${a.category}">${a.category}</div>
      <button class="btn-delete-activity" onclick="deleteActivity('${a._id}')" aria-label="Delete ${a.label || a.activityType} activity">🗑️</button>
    </div>
  `).join('');
}

async function renderDashboardActivities() {
  const listEl = document.getElementById('dashboard-activity-list');
  try {
    let activities;
    if (state.isGuest) {
      activities = window.guestManager.getActivities().slice(0, 5);
    } else {
      const data = await window.api.getActivities({ limit: 5 });
      activities = data.data;
    }
    renderActivitiesList(activities, listEl);
  } catch (err) {
    listEl.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:1rem;">Could not load activities</p>';
  }
}

async function deleteActivity(id) {
  if (!confirm('Delete this activity?')) return;
  try {
    if (state.isGuest) {
      window.guestManager.deleteActivity(id);
    } else {
      await window.api.deleteActivity(id);
    }
    showToast('Activity deleted', 'info');
    if (state.currentPage === 'activities') loadActivities();
    if (state.currentPage === 'dashboard') loadDashboard();
  } catch (err) {
    showToast('Error deleting activity', 'error');
  }
}

function renderPagination(pagination) {
  const paginationEl = document.getElementById('activities-pagination');
  if (!pagination || pagination.pages <= 1) {
    paginationEl.classList.add('hidden');
    return;
  }

  paginationEl.classList.remove('hidden');
  document.getElementById('page-info').textContent = `Page ${pagination.page} of ${pagination.pages} (${pagination.total} total)`;
  document.getElementById('btn-prev-page').disabled = pagination.page <= 1;
  document.getElementById('btn-next-page').disabled = pagination.page >= pagination.pages;
}

function changePage(direction) {
  state.activitiesPage += direction;
  loadActivities();
}

// ─── AI Assistant ─────────────────────────────────────────────────
function addWelcomeMessage() {
  const chatEl = document.getElementById('chat-messages');
  const welcomeMsg = `👋 Hi, I'm **CarbonBot**! I'm your personal sustainability assistant.

I have access to your carbon footprint data and can help you:
- 📊 Understand your biggest emission sources
- 💡 Get personalized reduction tips
- 🌍 Compare your footprint to global averages
- 🎯 Set and track reduction goals

What would you like to know?`;

  chatEl.innerHTML = renderMessage('assistant', welcomeMsg);
}

function renderMessage(role, content) {
  const avatarText = role === 'assistant' ? '🤖' : '👤';
  const formattedContent = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  return `
    <div class="chat-message ${role}" role="listitem">
      <div class="chat-avatar" aria-hidden="true">${avatarText}</div>
      <div class="chat-bubble">${formattedContent}</div>
    </div>
  `;
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;

  const chatEl = document.getElementById('chat-messages');
  const sendBtn = document.getElementById('chat-send-btn');

  // Add user message
  chatEl.insertAdjacentHTML('beforeend', renderMessage('user', message));
  state.chatHistory.push({ role: 'user', content: message });
  input.value = '';
  input.style.height = 'auto';

  // Add typing indicator
  const typingId = 'typing-' + Date.now();
  chatEl.insertAdjacentHTML('beforeend', `
    <div class="chat-message assistant" id="${typingId}" role="listitem" aria-label="Assistant is typing">
      <div class="chat-avatar" aria-hidden="true">🤖</div>
      <div class="chat-bubble chat-typing">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `);

  scrollChatToBottom();
  sendBtn.disabled = true;

  try {
    let reply;

    if (state.isGuest) {
      await new Promise(r => setTimeout(r, 800)); // Simulate thinking
      reply = window.guestManager.getRuleBasedResponse(message);
    } else {
      const data = await window.api.chat(message, state.chatHistory.slice(-10));
      reply = data.data.reply;

      if (data.data.source === 'rule-based') {
        document.getElementById('assistant-subtitle').textContent = 'Offline mode · Rule-based responses';
      } else {
        document.getElementById('assistant-subtitle').textContent = 'Powered by Gemini AI · Knows your carbon data';
      }
    }

    state.chatHistory.push({ role: 'model', content: reply });

    // Remove typing indicator and add response
    document.getElementById(typingId)?.remove();
    chatEl.insertAdjacentHTML('beforeend', renderMessage('assistant', reply));
    scrollChatToBottom();
  } catch (err) {
    document.getElementById(typingId)?.remove();
    chatEl.insertAdjacentHTML('beforeend', renderMessage('assistant', `Sorry, I encountered an error: ${err.message}. Please try again.`));
    scrollChatToBottom();
  } finally {
    sendBtn.disabled = false;
  }
}

function sendQuickPrompt(prompt) {
  document.getElementById('chat-input').value = prompt;
  sendChatMessage();
}

function handleChatKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
}

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function scrollChatToBottom() {
  const chatEl = document.getElementById('chat-messages');
  if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
}

function clearChat() {
  state.chatHistory = [];
  addWelcomeMessage();
}

// ─── Recommendations ──────────────────────────────────────────────
async function loadRecommendations() {
  const listEl = document.getElementById('recommendations-list');
  listEl.innerHTML = '<div class="empty-state"><div class="spinner" style="margin:auto;"></div></div>';

  try {
    let data;
    if (state.isGuest) {
      data = window.guestManager.getRecommendations();
    } else {
      data = await window.api.getRecommendations();
    }

    const { recommendations } = data.data;
    if (!recommendations || recommendations.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💡</div><h3>Log some activities first!</h3><p>We\'ll personalize tips based on your data.</p></div>';
      return;
    }

    listEl.innerHTML = `<div class="grid-2 stagger">
      ${recommendations.map(rec => `
        <div class="recommendation-card animate-fade-up">
          <div class="rec-header">
            <div class="rec-icon" aria-hidden="true">${rec.icon}</div>
            <div>
              <div class="rec-title">${rec.title}</div>
              <div class="rec-desc">${rec.description}</div>
            </div>
          </div>
          <div>
            <span class="rec-impact">💚 Saves ~${rec.impact_tonnes_per_year}t CO₂/year</span>
            <span class="rec-difficulty ${rec.difficulty}">${rec.difficulty}</span>
          </div>
          <button class="btn btn-ghost btn-sm mt-sm" onclick="toggleRecTips(this)" aria-expanded="false">
            Show Tips ▼
          </button>
          <div class="rec-tips">
            <ul>${rec.tips.map(tip => `<li>${tip}</li>`).join('')}</ul>
          </div>
        </div>
      `).join('')}
    </div>`;
  } catch (err) {
    listEl.innerHTML = `<div class="empty-state"><p style="color:var(--color-danger)">Error: ${err.message}</p></div>`;
  }
}

function toggleRecTips(btn) {
  const tips = btn.nextElementSibling;
  const isOpen = tips.classList.toggle('open');
  btn.textContent = isOpen ? 'Hide Tips ▲' : 'Show Tips ▼';
  btn.setAttribute('aria-expanded', isOpen);
}

// ─── Profile / Badges ─────────────────────────────────────────────
async function loadProfile() {
  try {
    let gamification;
    if (state.isGuest) {
      const summary = window.guestManager.getDashboardSummary();
      gamification = summary.data.gamification;
    } else {
      const data = await window.api.getDashboardSummary();
      gamification = data.data.gamification;
    }

    if (!gamification) return;

    const { level, levelInfo, greenScore, currentStreak, badges, progress, nextLevelAt } = gamification;

    document.getElementById('profile-level-icon').textContent = levelInfo?.icon || '🌱';
    document.getElementById('profile-level-name').textContent = levelInfo?.name || 'Carbon Novice';
    document.getElementById('profile-level-number').textContent = `Level ${level}`;
    document.getElementById('profile-streak').textContent = currentStreak || 0;
    document.getElementById('profile-score').textContent = greenScore || 0;
    document.getElementById('profile-progress-bar').style.width = `${progress || 0}%`;
    document.getElementById('profile-progress-bar-wrapper').setAttribute('aria-valuenow', progress || 0);

    // Render all badges (earned + locked)
    const earnedIds = new Set((badges || []).map(b => b.id || b));
    const badgesGrid = document.getElementById('badges-grid');
    badgesGrid.innerHTML = ALL_BADGES.map(badge => {
      const earned = earnedIds.has(badge.id);
      return `
        <div class="badge-item ${earned ? '' : 'locked'}" title="${badge.description}" role="listitem" aria-label="${badge.name}: ${earned ? 'Earned' : 'Locked'}">
          <div class="badge-icon" aria-hidden="true">${badge.icon}</div>
          <div class="badge-name">${badge.name}</div>
          <div class="badge-desc">${earned ? '✅ Earned' : '🔒 Locked'}</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    showToast('Error loading profile', 'error');
  }
}

// ─── Mobile Sidebar ───────────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const btn = document.getElementById('hamburger-btn');
  const isOpen = sidebar.classList.toggle('open');
  overlay.classList.toggle('active', isOpen);
  btn.classList.toggle('open', isOpen);
  btn.setAttribute('aria-expanded', isOpen);
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
  const btn = document.getElementById('hamburger-btn');
  if (btn) {
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }
}

// ─── Toast Notifications ──────────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `<span class="toast-icon" aria-hidden="true">${icons[type]}</span><span class="toast-message">${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── Utilities ────────────────────────────────────────────────────
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
