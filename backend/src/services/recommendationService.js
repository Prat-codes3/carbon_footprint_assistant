const Activity = require('../models/Activity');

// Rule-based recommendations ranked by CO2 impact (tonnes saved/year)
const RECOMMENDATIONS = {
  transport: [
    {
      id: 'switch_ev',
      title: 'Switch to an Electric Vehicle',
      description: 'Switching from a petrol car to an EV can save up to 1.5 tonnes CO₂/year.',
      impact_tonnes_per_year: 1.5,
      difficulty: 'hard',
      icon: '⚡',
      category: 'transport',
      tips: ['Look for government EV subsidies', 'Consider leasing before buying', 'Check local EV charging infrastructure']
    },
    {
      id: 'public_transport',
      title: 'Use Public Transport',
      description: 'Taking the train instead of driving once a week saves ~0.5 tonnes CO₂/year.',
      impact_tonnes_per_year: 0.5,
      difficulty: 'easy',
      icon: '🚆',
      category: 'transport',
      tips: ['Use transit apps to plan routes', 'Get a monthly pass for savings', 'Try park-and-ride options']
    },
    {
      id: 'cycle_walk',
      title: 'Cycle or Walk Short Trips',
      description: 'Replace car trips under 5km with cycling or walking — saves ~0.3 tonnes/year.',
      impact_tonnes_per_year: 0.3,
      difficulty: 'easy',
      icon: '🚴',
      category: 'transport',
      tips: ['Get a quality bike for commuting', 'Join a bike-share scheme', 'Plan safe cycling routes']
    },
    {
      id: 'reduce_flights',
      title: 'Replace One Flight with Train',
      description: 'A return flight London-Madrid emits 10x more than the same train journey.',
      impact_tonnes_per_year: 0.8,
      difficulty: 'medium',
      icon: '🚂',
      category: 'transport',
      tips: ['Use rail passes for European travel', 'Book train well in advance for best prices', 'Consider overnight sleeper trains']
    },
    {
      id: 'carpool',
      title: 'Carpool to Work',
      description: 'Sharing a ride with just one colleague halves your commute emissions.',
      impact_tonnes_per_year: 0.4,
      difficulty: 'easy',
      icon: '🤝',
      category: 'transport',
      tips: ['Use carpooling apps', 'Set up a work carpool scheme', 'Offer to drive alternate weeks']
    }
  ],

  energy: [
    {
      id: 'switch_renewable',
      title: 'Switch to Renewable Energy',
      description: 'Moving to a green energy tariff can eliminate your home electricity emissions.',
      impact_tonnes_per_year: 1.2,
      difficulty: 'easy',
      icon: '☀️',
      category: 'energy',
      tips: ['Compare green energy tariffs online', 'Look for 100% renewable certified suppliers', 'Consider community solar schemes']
    },
    {
      id: 'reduce_heating',
      title: 'Lower Your Heating by 1°C',
      description: 'Reducing your thermostat by just 1°C saves ~10% on heating bills and emissions.',
      impact_tonnes_per_year: 0.3,
      difficulty: 'easy',
      icon: '🌡️',
      category: 'energy',
      tips: ['Use a smart thermostat', 'Improve home insulation', 'Wear warmer clothing indoors']
    },
    {
      id: 'led_lighting',
      title: 'Switch to LED Lighting',
      description: 'LED bulbs use 75% less energy than traditional bulbs.',
      impact_tonnes_per_year: 0.1,
      difficulty: 'easy',
      icon: '💡',
      category: 'energy',
      tips: ['Replace bulbs as they fail', 'Install smart LED strips', 'Use motion sensors in low-traffic areas']
    },
    {
      id: 'solar_panels',
      title: 'Install Solar Panels',
      description: 'Home solar can cover 40-80% of your electricity needs.',
      impact_tonnes_per_year: 1.5,
      difficulty: 'hard',
      icon: '🔆',
      category: 'energy',
      tips: ['Get multiple installation quotes', 'Check government incentives', 'Consider solar + battery storage']
    }
  ],

  food: [
    {
      id: 'reduce_beef',
      title: 'Cut Beef Consumption by Half',
      description: 'Beef has the highest emissions of any food. Halving intake saves ~0.6 tonnes/year.',
      impact_tonnes_per_year: 0.6,
      difficulty: 'medium',
      icon: '🥦',
      category: 'food',
      tips: ['Try plant-based burgers (Beyond Meat, etc.)', 'Replace beef with chicken or legumes', 'Have at least 3 meat-free days/week']
    },
    {
      id: 'plant_based_diet',
      title: 'Adopt a Plant-Based Diet',
      description: 'A vegan diet reduces food-related emissions by up to 70% (~1.5 tonnes/year).',
      impact_tonnes_per_year: 1.5,
      difficulty: 'hard',
      icon: '🌱',
      category: 'food',
      tips: ['Start with Meatless Mondays', 'Explore diverse plant proteins (lentils, tofu, tempeh)', 'Find good vegan recipe resources']
    },
    {
      id: 'reduce_food_waste',
      title: 'Reduce Food Waste',
      description: 'The average household wastes ~30% of food bought. Planning meals saves money and emissions.',
      impact_tonnes_per_year: 0.4,
      difficulty: 'easy',
      icon: '♻️',
      category: 'food',
      tips: ['Plan weekly meals in advance', 'Use a shopping list', 'Compost unavoidable waste', 'Use apps like Too Good To Go']
    },
    {
      id: 'local_seasonal',
      title: 'Buy Local & Seasonal Produce',
      description: 'Local, seasonal food can have up to 50% lower transport emissions.',
      impact_tonnes_per_year: 0.2,
      difficulty: 'easy',
      icon: '🌾',
      category: 'food',
      tips: ['Shop at farmers markets', 'Join a local veg box scheme', 'Grow your own herbs and vegetables']
    }
  ],

  shopping: [
    {
      id: 'buy_secondhand',
      title: 'Buy Secondhand Clothing',
      description: 'The fashion industry produces 10% of global CO₂. Secondhand shopping cuts this.',
      impact_tonnes_per_year: 0.3,
      difficulty: 'easy',
      icon: '👗',
      category: 'shopping',
      tips: ['Use apps like Vinted, Depop, ThredUp', 'Organize clothes swaps with friends', 'Repair clothing instead of replacing']
    },
    {
      id: 'extend_device_life',
      title: 'Extend Device Lifespan',
      description: 'Using a smartphone 1 year longer reduces its carbon footprint by ~30%.',
      impact_tonnes_per_year: 0.2,
      difficulty: 'easy',
      icon: '📱',
      category: 'shopping',
      tips: ['Use a protective case', 'Replace batteries instead of devices', 'Buy certified refurbished devices']
    },
    {
      id: 'reduce_streaming',
      title: 'Reduce Video Streaming Quality',
      description: 'Streaming in HD instead of 4K reduces data center energy use.',
      impact_tonnes_per_year: 0.05,
      difficulty: 'easy',
      icon: '📺',
      category: 'shopping',
      tips: ['Download content for offline viewing', 'Lower default streaming resolution', 'Turn off autoplay']
    }
  ]
};

/**
 * Get personalized recommendations based on user's highest-emission categories
 */
const getRecommendations = async (userId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const categoryTotals = await Activity.aggregate([
    { $match: { userId, date: { $gte: thirtyDaysAgo } } },
    { $group: { _id: '$category', total: { $sum: '$co2Kg' } } },
    { $sort: { total: -1 } }
  ]);

  // Build prioritized recommendations based on worst categories
  const prioritized = [];
  const categoriesUsed = new Set();

  // First pass: recommendations for worst categories (in order)
  for (const cat of categoryTotals) {
    if (RECOMMENDATIONS[cat._id]) {
      RECOMMENDATIONS[cat._id].forEach(rec => {
        prioritized.push({ ...rec, priorityScore: cat.total * rec.impact_tonnes_per_year });
      });
      categoriesUsed.add(cat._id);
    }
  }

  // Second pass: add recommendations for categories with no activity (general tips)
  for (const cat of Object.keys(RECOMMENDATIONS)) {
    if (!categoriesUsed.has(cat)) {
      RECOMMENDATIONS[cat].slice(0, 2).forEach(rec => {
        prioritized.push({ ...rec, priorityScore: rec.impact_tonnes_per_year });
      });
    }
  }

  // Sort by priority score (highest impact for worst categories first)
  prioritized.sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    recommendations: prioritized.slice(0, 8),
    categoryProfile: categoryTotals.map(c => ({ category: c._id, kg30days: parseFloat(c.total.toFixed(2)) }))
  };
};

module.exports = { getRecommendations, RECOMMENDATIONS };
