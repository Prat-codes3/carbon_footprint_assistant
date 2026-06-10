/**
 * Guest Mode Manager
 * Handles all carbon data in localStorage for guest users
 */

class GuestManager {
  constructor() {
    this.STORAGE_KEY = 'cfa_guest_activities';
    this.USER_KEY = 'cfa_guest_user';
  }

  getUser() {
    const stored = localStorage.getItem(this.USER_KEY);
    if (stored) return JSON.parse(stored);
    const guest = {
      id: 'guest_' + Date.now(),
      username: 'Guest',
      email: '',
      isGuest: true,
      profile: { displayName: 'Guest User', targetReduction: 20 },
      gamification: { level: 1, greenScore: 0, badges: [], currentStreak: 0, longestStreak: 0 }
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(guest));
    return guest;
  }

  getActivities() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  saveActivities(activities) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(activities));
  }

  logActivity(activityData) {
    const { EMISSION_FACTORS } = window.carbonData || {};
    const activities = this.getActivities();
    const id = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const activity = {
      _id: id,
      ...activityData,
      date: activityData.date || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    activities.unshift(activity);
    this.saveActivities(activities);
    return { success: true, data: activity, gamification: { pointsEarned: 5, newBadges: [] } };
  }

  deleteActivity(id) {
    const activities = this.getActivities().filter(a => a._id !== id);
    this.saveActivities(activities);
    return { success: true };
  }

  getDashboardSummary() {
    const activities = this.getActivities();
    const now = new Date();
    const GLOBAL_AVG_PER_DAY = 12.88;

    const filterByDays = (days) => {
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      return activities.filter(a => new Date(a.date) >= cutoff);
    };

    const sum = (arr) => arr.reduce((s, a) => s + (a.co2Kg || 0), 0);

    const todayActivities = filterByDays(1);
    const weekActivities = filterByDays(7);
    const monthActivities = filterByDays(30);

    const monthKg = sum(monthActivities);
    const annualizedKg = monthKg * 12;

    const categoryBreakdown = ['transport', 'energy', 'food', 'shopping'].map(cat => {
      const catActivities = monthActivities.filter(a => a.category === cat);
      const total = sum(catActivities);
      return { category: cat, kg: parseFloat(total.toFixed(2)), count: catActivities.length, percentage: monthKg > 0 ? parseFloat((total / monthKg * 100).toFixed(1)) : 0 };
    }).filter(c => c.count > 0).sort((a, b) => b.kg - a.kg);

    // Simple gamification stats
    const user = this.getUser();

    return {
      success: true,
      data: {
        today: { kg: parseFloat(sum(todayActivities).toFixed(2)), vs_global: parseFloat((sum(todayActivities) / GLOBAL_AVG_PER_DAY * 100).toFixed(1)) },
        week: { kg: parseFloat(sum(weekActivities).toFixed(2)), vs_global: parseFloat((sum(weekActivities) / (GLOBAL_AVG_PER_DAY * 7) * 100).toFixed(1)) },
        month: { kg: parseFloat(monthKg.toFixed(2)), vs_global: parseFloat((monthKg / (GLOBAL_AVG_PER_DAY * 30) * 100).toFixed(1)) },
        annualized: {
          kg: parseFloat(annualizedKg.toFixed(2)),
          tonnes: parseFloat((annualizedKg / 1000).toFixed(3)),
          vs_global_tonnes: 4.7,
          percentage_of_global: parseFloat((annualizedKg / 4700 * 100).toFixed(1))
        },
        categoryBreakdown,
        gamification: {
          level: user.gamification.level,
          levelInfo: { name: 'Carbon Novice', icon: '🌱' },
          greenScore: user.gamification.greenScore,
          currentStreak: user.gamification.currentStreak,
          longestStreak: user.gamification.longestStreak,
          badges: [],
          progress: 10
        }
      }
    };
  }

  getTrends(days = 30) {
    const activities = this.getActivities();
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    const dateMap = {};
    const categories = ['transport', 'energy', 'food', 'shopping'];

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dateMap[key] = { date: key, transport: 0, energy: 0, food: 0, shopping: 0, total: 0 };
    }

    activities.filter(a => new Date(a.date) >= startDate).forEach(a => {
      const key = new Date(a.date).toISOString().split('T')[0];
      if (dateMap[key] && categories.includes(a.category)) {
        dateMap[key][a.category] = parseFloat((dateMap[key][a.category] + a.co2Kg).toFixed(2));
        dateMap[key].total = parseFloat((dateMap[key].total + a.co2Kg).toFixed(2));
      }
    });

    return {
      success: true,
      data: {
        labels: Object.keys(dateMap),
        datasets: categories.map(cat => ({ category: cat, values: Object.values(dateMap).map(d => d[cat]) })),
        dailyTotals: Object.values(dateMap).map(d => d.total),
        globalAverageLine: 12.88
      }
    };
  }

  getRecommendations() {
    const activities = this.getActivities();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recent = activities.filter(a => new Date(a.date) >= thirtyDaysAgo);

    const categoryTotals = {};
    recent.forEach(a => {
      categoryTotals[a.category] = (categoryTotals[a.category] || 0) + a.co2Kg;
    });

    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    const defaultRecs = [
      { id: 'public_transport', title: 'Use Public Transport', description: 'Taking the train instead of driving once a week saves ~0.5 tonnes CO₂/year.', impact_tonnes_per_year: 0.5, difficulty: 'easy', icon: '🚆', category: 'transport', tips: ['Use transit apps to plan routes', 'Get a monthly pass for savings'] },
      { id: 'reduce_beef', title: 'Cut Beef Consumption', description: 'Beef has the highest emissions of any food. Halving intake saves ~0.6 tonnes/year.', impact_tonnes_per_year: 0.6, difficulty: 'medium', icon: '🥦', category: 'food', tips: ['Try plant-based burgers', 'Replace beef with chicken or legumes'] },
      { id: 'switch_renewable', title: 'Switch to Renewable Energy', description: 'Moving to a green energy tariff can eliminate your home electricity emissions.', impact_tonnes_per_year: 1.2, difficulty: 'easy', icon: '☀️', category: 'energy', tips: ['Compare green energy tariffs online', 'Look for 100% renewable certified suppliers'] },
      { id: 'buy_secondhand', title: 'Buy Secondhand Clothing', description: 'The fashion industry produces 10% of global CO₂. Secondhand shopping cuts this.', impact_tonnes_per_year: 0.3, difficulty: 'easy', icon: '👗', category: 'shopping', tips: ['Use apps like Vinted, Depop', 'Organize clothes swaps with friends'] }
    ];

    return {
      success: true,
      data: {
        recommendations: defaultRecs,
        categoryProfile: sortedCategories.map(([category, kg]) => ({ category, kg30days: parseFloat(kg.toFixed(2)) }))
      }
    };
  }

  getRuleBasedResponse(message) {
    const msg = message.toLowerCase();
    const responses = {
      transport: "🚆 **Switch to public transport** for your commute. Trains produce ~70% less CO₂ than petrol cars per km. For trips under 5km, consider cycling or walking — it's zero emissions!",
      energy: "☀️ **Switch to a renewable energy tariff** — this can eliminate your electricity emissions overnight. Also try lowering your thermostat by 1°C to save ~10% on heating.",
      food: "🥦 **Replacing beef with chicken** cuts food emissions by 4x. Better yet, try plant-based meals — even one meatless day per week makes a real difference!",
      shopping: "👗 **Buy secondhand clothing** on apps like Vinted or Depop. The fashion industry accounts for 10% of global CO₂. Also, keep your phone one extra year to reduce e-waste.",
      general: "🌍 The global average carbon footprint is **4.7 tonnes CO₂/year**. Your biggest wins come from transport and food — these two categories typically account for 60% of a personal footprint. Track daily to stay on target!"
    };

    if (msg.includes('transport') || msg.includes('car') || msg.includes('driv') || msg.includes('flight')) return responses.transport;
    if (msg.includes('energy') || msg.includes('electric') || msg.includes('heat')) return responses.energy;
    if (msg.includes('food') || msg.includes('eat') || msg.includes('meat') || msg.includes('diet')) return responses.food;
    if (msg.includes('shop') || msg.includes('buy') || msg.includes('cloth')) return responses.shopping;
    return responses.general;
  }

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}

window.guestManager = new GuestManager();
