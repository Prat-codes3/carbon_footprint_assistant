const { calculateEmissions, getAvailableActivities, EMISSION_FACTORS } = require('../src/utils/emissionFactors');

describe('Carbon Emission Calculations', () => {
  describe('calculateEmissions()', () => {
    test('calculates petrol car emissions correctly', () => {
      // 100km in a petrol car = 100 * 0.192 = 19.2 kg CO2
      const result = calculateEmissions('transport', 'car_petrol', 100);
      expect(result).toBeCloseTo(19.2, 2);
    });

    test('calculates electricity emissions correctly', () => {
      // 10 kWh * 0.233 = 2.33 kg CO2
      const result = calculateEmissions('energy', 'electricity', 10);
      expect(result).toBeCloseTo(2.33, 2);
    });

    test('calculates beef emissions correctly', () => {
      // 1kg beef * 27 = 27 kg CO2
      const result = calculateEmissions('food', 'beef', 1);
      expect(result).toBeCloseTo(27.0, 1);
    });

    test('cycling produces zero emissions', () => {
      const result = calculateEmissions('transport', 'cycling', 50);
      expect(result).toBe(0);
    });

    test('plant-based meal has much lower emissions than meat meal', () => {
      const plantBased = calculateEmissions('food', 'plant_based_meal', 1);
      const meatMeal = calculateEmissions('food', 'meat_meal', 1);
      expect(plantBased).toBeLessThan(meatMeal);
      expect(meatMeal / plantBased).toBeGreaterThan(3); // At least 3x higher
    });

    test('electric car has lower emissions than petrol car', () => {
      const ev = calculateEmissions('transport', 'car_electric', 100);
      const petrol = calculateEmissions('transport', 'car_petrol', 100);
      expect(ev).toBeLessThan(petrol);
    });

    test('throws error for unknown activity', () => {
      expect(() => calculateEmissions('transport', 'invalid_vehicle', 100)).toThrow();
    });

    test('handles zero quantity', () => {
      const result = calculateEmissions('transport', 'car_petrol', 0);
      expect(result).toBe(0);
    });

    test('returns number type', () => {
      const result = calculateEmissions('transport', 'car_petrol', 50);
      expect(typeof result).toBe('number');
    });
  });

  describe('getAvailableActivities()', () => {
    test('returns all four categories', () => {
      const activities = getAvailableActivities();
      expect(activities).toHaveProperty('transport');
      expect(activities).toHaveProperty('energy');
      expect(activities).toHaveProperty('food');
      expect(activities).toHaveProperty('shopping');
    });

    test('each activity has required fields', () => {
      const activities = getAvailableActivities();
      for (const category of Object.values(activities)) {
        for (const activity of category) {
          expect(activity).toHaveProperty('key');
          expect(activity).toHaveProperty('factor');
          expect(activity).toHaveProperty('unit');
          expect(activity).toHaveProperty('label');
          expect(activity).toHaveProperty('icon');
          expect(typeof activity.factor).toBe('number');
          expect(activity.factor).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('Emission factor sanity checks', () => {
    test('beef has higher emissions than chicken', () => {
      expect(EMISSION_FACTORS.food.beef.factor).toBeGreaterThan(EMISSION_FACTORS.food.chicken.factor);
    });

    test('petrol car has higher emissions than electric car', () => {
      expect(EMISSION_FACTORS.transport.car_petrol.factor).toBeGreaterThan(EMISSION_FACTORS.transport.car_electric.factor);
    });

    test('flights have higher emissions per km than trains', () => {
      expect(EMISSION_FACTORS.transport.flight_domestic.factor).toBeGreaterThan(EMISSION_FACTORS.transport.train.factor);
    });
  });
});
