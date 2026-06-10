/**
 * Carbon Emission Factors
 * Sources: IPCC AR6, Our World in Data, EPA, DEFRA 2023
 * All values in kg CO2e per unit
 */

const EMISSION_FACTORS = {
  transport: {
    car_petrol: {
      factor: 0.192,       // kg CO2 per km
      unit: 'km',
      label: 'Car (Petrol)',
      icon: '🚗'
    },
    car_diesel: {
      factor: 0.171,       // kg CO2 per km
      unit: 'km',
      label: 'Car (Diesel)',
      icon: '🚗'
    },
    car_electric: {
      factor: 0.053,       // kg CO2 per km (global grid avg)
      unit: 'km',
      label: 'Car (Electric)',
      icon: '⚡'
    },
    motorcycle: {
      factor: 0.114,       // kg CO2 per km
      unit: 'km',
      label: 'Motorcycle',
      icon: '🏍️'
    },
    bus: {
      factor: 0.089,       // kg CO2 per km
      unit: 'km',
      label: 'Bus',
      icon: '🚌'
    },
    train: {
      factor: 0.041,       // kg CO2 per km
      unit: 'km',
      label: 'Train',
      icon: '🚆'
    },
    subway: {
      factor: 0.028,       // kg CO2 per km
      unit: 'km',
      label: 'Subway/Metro',
      icon: '🚇'
    },
    flight_domestic: {
      factor: 0.255,       // kg CO2 per km (incl. radiative forcing)
      unit: 'km',
      label: 'Flight (Domestic)',
      icon: '✈️'
    },
    flight_international: {
      factor: 0.195,       // kg CO2 per km per passenger
      unit: 'km',
      label: 'Flight (International)',
      icon: '✈️'
    },
    cycling: {
      factor: 0.0,         // Zero emissions
      unit: 'km',
      label: 'Cycling / Walking',
      icon: '🚴'
    }
  },

  energy: {
    electricity: {
      factor: 0.233,       // kg CO2 per kWh (global avg)
      unit: 'kWh',
      label: 'Electricity',
      icon: '💡'
    },
    natural_gas: {
      factor: 2.04,        // kg CO2 per cubic meter
      unit: 'm³',
      label: 'Natural Gas',
      icon: '🔥'
    },
    heating_oil: {
      factor: 2.68,        // kg CO2 per litre
      unit: 'litres',
      label: 'Heating Oil',
      icon: '🛢️'
    },
    lpg: {
      factor: 1.56,        // kg CO2 per litre
      unit: 'litres',
      label: 'LPG',
      icon: '⛽'
    },
    solar: {
      factor: 0.041,       // kg CO2 per kWh (lifecycle)
      unit: 'kWh',
      label: 'Solar Energy',
      icon: '☀️'
    }
  },

  food: {
    beef: {
      factor: 27.0,        // kg CO2 per kg of food
      unit: 'kg',
      label: 'Beef',
      icon: '🥩'
    },
    lamb: {
      factor: 39.2,        // kg CO2 per kg
      unit: 'kg',
      label: 'Lamb / Mutton',
      icon: '🍖'
    },
    pork: {
      factor: 12.1,        // kg CO2 per kg
      unit: 'kg',
      label: 'Pork',
      icon: '🥩'
    },
    chicken: {
      factor: 6.9,         // kg CO2 per kg
      unit: 'kg',
      label: 'Chicken / Poultry',
      icon: '🍗'
    },
    fish: {
      factor: 6.1,         // kg CO2 per kg
      unit: 'kg',
      label: 'Fish / Seafood',
      icon: '🐟'
    },
    dairy: {
      factor: 3.2,         // kg CO2 per kg (cheese ~13.5)
      unit: 'kg',
      label: 'Dairy (Milk/Yogurt)',
      icon: '🥛'
    },
    eggs: {
      factor: 4.8,         // kg CO2 per kg
      unit: 'kg',
      label: 'Eggs',
      icon: '🥚'
    },
    plant_based_meal: {
      factor: 0.5,         // kg CO2 per meal
      unit: 'meals',
      label: 'Plant-Based Meal',
      icon: '🥗'
    },
    meat_meal: {
      factor: 2.5,         // kg CO2 per meal (avg meat)
      unit: 'meals',
      label: 'Meat Meal',
      icon: '🍔'
    }
  },

  shopping: {
    clothing: {
      factor: 33.4,        // kg CO2 per kg of clothing
      unit: 'items',
      label: 'New Clothing (per item)',
      icon: '👕'
    },
    electronics_smartphone: {
      factor: 70.0,        // kg CO2 per device
      unit: 'items',
      label: 'Smartphone',
      icon: '📱'
    },
    electronics_laptop: {
      factor: 422.0,       // kg CO2 per device
      unit: 'items',
      label: 'Laptop',
      icon: '💻'
    },
    electronics_tv: {
      factor: 350.0,       // kg CO2 per device
      unit: 'items',
      label: 'Television',
      icon: '📺'
    },
    streaming: {
      factor: 0.036,       // kg CO2 per hour
      unit: 'hours',
      label: 'Video Streaming',
      icon: '📺'
    },
    online_shopping: {
      factor: 0.5,         // kg CO2 per package delivered
      unit: 'packages',
      label: 'Online Shopping Delivery',
      icon: '📦'
    }
  }
};

/**
 * Global average for comparison: 4.7 tonnes CO2/year (World Bank 2023)
 * Per day: 4700 / 365 = 12.88 kg CO2/day
 */
const GLOBAL_AVERAGE_KG_PER_DAY = 12.88;
const GLOBAL_AVERAGE_KG_PER_YEAR = 4700;

/**
 * Calculate CO2 emissions for an activity
 * @param {string} category - Main category (transport, energy, food, shopping)
 * @param {string} activityType - Specific activity key
 * @param {number} quantity - Amount of activity
 * @returns {number} CO2 in kg
 */
const calculateEmissions = (category, activityType, quantity) => {
  if (!EMISSION_FACTORS[category] || !EMISSION_FACTORS[category][activityType]) {
    throw new Error(`Unknown activity: ${category}/${activityType}`);
  }
  const factor = EMISSION_FACTORS[category][activityType].factor;
  return parseFloat((factor * quantity).toFixed(4));
};

/**
 * Get all available activities grouped by category
 */
const getAvailableActivities = () => {
  const result = {};
  for (const [category, activities] of Object.entries(EMISSION_FACTORS)) {
    result[category] = Object.entries(activities).map(([key, data]) => ({
      key,
      ...data
    }));
  }
  return result;
};

module.exports = {
  EMISSION_FACTORS,
  GLOBAL_AVERAGE_KG_PER_DAY,
  GLOBAL_AVERAGE_KG_PER_YEAR,
  calculateEmissions,
  getAvailableActivities
};
