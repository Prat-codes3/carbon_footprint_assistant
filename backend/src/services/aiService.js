const { GoogleGenerativeAI } = require('@google/generative-ai');
const Activity = require('../models/Activity');
const { EMISSION_FACTORS, GLOBAL_AVERAGE_KG_PER_YEAR } = require('../utils/emissionFactors');

let genAI = null;

const initGemini = () => {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('✅ Gemini AI initialized');
  } else {
    console.warn('⚠️  Gemini API key not set — using rule-based fallback');
  }
};

// Rule-based fallback responses
const RULE_BASED_RESPONSES = {
  transport: [
    "🚆 **Switch to public transport** for your commute. Trains produce ~70% less CO₂ than petrol cars per km.",
    "🚴 For trips under 5km, consider cycling or walking. It's zero emissions and great for your health!",
    "⚡ If you drive regularly, an electric vehicle could cut your transport emissions by up to 70%.",
    "🤝 **Carpooling** just 2 days a week can halve your commute's carbon impact."
  ],
  energy: [
    "☀️ **Switch to a renewable energy tariff** — this can eliminate your electricity emissions overnight.",
    "🌡️ Lowering your thermostat by just 1°C saves ~10% on heating bills AND emissions.",
    "💡 Replace remaining incandescent bulbs with LEDs — they use 75% less energy.",
    "🔌 Unplug devices on standby. Standby power accounts for 10% of home electricity use."
  ],
  food: [
    "🥦 **Replacing beef with chicken** cuts food emissions by 4x for that meal. Legumes are even better!",
    "🌱 Try **Meatless Mondays** — if everyone did this, it would have the impact of taking 50 million cars off the road.",
    "🥗 A plant-based diet can reduce your food footprint by up to 70% — start with one meal a day.",
    "🛒 Plan your meals to reduce food waste — wasted food accounts for 8% of global emissions."
  ],
  shopping: [
    "👗 **Buy secondhand** clothing on apps like Vinted or Depop — fashion accounts for 10% of global CO₂.",
    "📱 Keep your smartphone for one extra year — it reduces its lifetime footprint by ~30%.",
    "♻️ Repair before replacing. Most electronics can be repaired cheaply.",
    "📦 Batch online orders to reduce delivery emissions."
  ],
  general: [
    "🌍 The global average carbon footprint is **4.7 tonnes CO₂/year**. The target to stay within 1.5°C warming is **2.5 tonnes**.",
    "📊 Your **biggest wins** come from transport and food — these two categories typically account for 60% of a personal footprint.",
    "🎯 Set a monthly carbon budget and track daily to stay on target. Small consistent choices add up!",
    "💪 You're already taking a great step by tracking your footprint. Awareness is the first step to change."
  ]
};

/**
 * Build system prompt with user's real carbon data
 */
const buildSystemPrompt = (userData) => {
  const { totalKg30Days, categoryBreakdown, topCategory, annualizedTonnes } = userData;
  const globalAvgTonnes = GLOBAL_AVERAGE_KG_PER_YEAR / 1000;
  const percentOfGlobal = ((annualizedTonnes / globalAvgTonnes) * 100).toFixed(0);

  return `You are CarbonBot, an expert, friendly, and encouraging AI assistant specializing in personal carbon footprint reduction. You are embedded in the Carbon Footprint Assistant app.

## User's Current Carbon Data (Last 30 Days):
- **Total emissions**: ${totalKg30Days.toFixed(1)} kg CO₂ in the last 30 days
- **Annualized estimate**: ${annualizedTonnes.toFixed(2)} tonnes CO₂/year
- **vs Global Average**: ${percentOfGlobal}% of global average (${globalAvgTonnes} tonnes/year)
- **Highest emission category**: ${topCategory || 'not yet tracked'}
- **Category breakdown (30 days)**:
${categoryBreakdown.map(c => `  - ${c.category}: ${c.total.toFixed(1)} kg CO₂`).join('\n')}

## Your Behavior:
1. Always be **specific to this user's data** — reference their actual numbers
2. Prioritize advice based on their **highest emission categories**
3. Be **encouraging and positive** — celebrate progress, not guilt
4. Give **practical, actionable** advice with specific steps
5. When suggesting changes, always mention the **CO₂ impact** (e.g., "saves 0.5 tonnes/year")
6. Keep responses **concise** (2-4 paragraphs max) unless the user asks for detail
7. Use emojis sparingly for readability
8. If asked about facts, cite sources (IPCC, Our World in Data, EPA)

Respond to the user's message in a helpful, personalized way based on their data above.`;
};

/**
 * Get rule-based response when Gemini is unavailable
 */
const getRuleBasedResponse = (message, categoryProfile) => {
  const msg = message.toLowerCase();
  let responses = [];

  // Check for category keywords
  if (msg.includes('transport') || msg.includes('car') || msg.includes('driv') || msg.includes('flight') || msg.includes('travel')) {
    responses = RULE_BASED_RESPONSES.transport;
  } else if (msg.includes('energy') || msg.includes('electric') || msg.includes('heat') || msg.includes('power')) {
    responses = RULE_BASED_RESPONSES.energy;
  } else if (msg.includes('food') || msg.includes('eat') || msg.includes('meat') || msg.includes('diet') || msg.includes('veg')) {
    responses = RULE_BASED_RESPONSES.food;
  } else if (msg.includes('shop') || msg.includes('buy') || msg.includes('cloth') || msg.includes('phone') || msg.includes('device')) {
    responses = RULE_BASED_RESPONSES.shopping;
  } else {
    // Use worst category responses if no keyword match
    if (categoryProfile && categoryProfile.length > 0) {
      const worst = categoryProfile[0].category;
      responses = RULE_BASED_RESPONSES[worst] || RULE_BASED_RESPONSES.general;
    } else {
      responses = RULE_BASED_RESPONSES.general;
    }
  }

  // Pick a response (cycle through them)
  const response = responses[Math.floor(Math.random() * responses.length)];

  return `${response}\n\n---\n*Note: AI assistant is in offline mode. Connect your Gemini API key for personalized responses.*`;
};

/**
 * Main chat function
 */
const chat = async (userId, message, chatHistory = []) => {
  // Get user's carbon data for context
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [activityAgg, categoryBreakdown] = await Promise.all([
    Activity.aggregate([
      { $match: { userId, date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$co2Kg' } } }
    ]),
    Activity.aggregate([
      { $match: { userId, date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$category', total: { $sum: '$co2Kg' } } },
      { $sort: { total: -1 } }
    ])
  ]);

  const totalKg30Days = activityAgg[0]?.total || 0;
  const annualizedTonnes = (totalKg30Days * 12) / 1000;
  const topCategory = categoryBreakdown[0]?._id || null;

  // Try Gemini first
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const systemPrompt = buildSystemPrompt({ totalKg30Days, categoryBreakdown, topCategory, annualizedTonnes });

      // Build conversation history for Gemini
      const history = chatHistory.slice(-10).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));

      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Understood! I\'m CarbonBot, ready to help with personalized carbon reduction advice based on your data.' }] },
          ...history
        ],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7
        }
      });

      const result = await chat.sendMessage(message);
      const response = result.response.text();

      return {
        message: response,
        source: 'gemini',
        context: { totalKg30Days: parseFloat(totalKg30Days.toFixed(2)), annualizedTonnes: parseFloat(annualizedTonnes.toFixed(3)), topCategory }
      };
    } catch (error) {
      console.error('Gemini error, falling back to rule-based:', error.message);
    }
  }

  // Fallback to rule-based
  return {
    message: getRuleBasedResponse(message, categoryBreakdown),
    source: 'rule-based',
    context: { totalKg30Days: parseFloat(totalKg30Days.toFixed(2)), annualizedTonnes: parseFloat(annualizedTonnes.toFixed(3)), topCategory }
  };
};

/**
 * Analyze a receipt/bill image using Gemini Vision
 */
const analyzeReceipt = async (base64Image, mimeType) => {
  if (!genAI) throw new Error('Gemini AI not initialized. Provide API key.');
  
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  // Build a list of valid activities to force Gemini to map to our schema
  const validActivities = [];
  for (const [cat, items] of Object.entries(EMISSION_FACTORS)) {
    for (const [key, details] of Object.entries(items)) {
      validActivities.push(`Category: "${cat}", Key: "${key}", Name: "${details.label}", Unit: "${details.unit}"`);
    }
  }

  const prompt = `You are a receipt and utility bill parser for a Carbon Footprint Assistant app.
Analyze the attached image (receipt, bill, or ticket) and extract items that cause carbon emissions.
Map the items strictly to the following allowed categories and keys:
${validActivities.join('\n')}

Rules:
1. Try to find the most relevant items (e.g. if it's a grocery receipt, look for beef, chicken, dairy).
2. If it's an electricity bill, look for kWh usage.
3. If it's a flight ticket, estimate distance in km.
4. If it's gas/fuel, extract litres.
5. Return ONLY a valid JSON array. No markdown, no \`\`\`json wrappers. 

Output format:
[
  {
    "category": "food",
    "activityType": "beef",
    "quantity": 1.5,
    "note": "Grocery store receipt"
  }
]`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType || 'image/jpeg'
        }
      }
    ]);
    
    let text = result.response.text().trim();
    if (text.startsWith('\`\`\`json')) text = text.replace(/\`\`\`json/g, '');
    if (text.endsWith('\`\`\`')) text = text.replace(/\`\`\`/g, '');
    
    return JSON.parse(text);
  } catch (err) {
    console.error('Vision API Error:', err);
    throw new Error('Failed to parse image: ' + err.message);
  }
};

/**
 * Estimate flight distance between two cities
 */
const estimateFlightDistance = async (fromCity, toCity) => {
  if (!genAI) throw new Error('Gemini AI not initialized.');
  
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `Calculate the direct flight distance (great circle) between "${fromCity}" and "${toCity}" in kilometers. 
Return ONLY a valid JSON object with a single key "distance_km" containing the number. Do not include markdown or explanations.
Example: {"distance_km": 5500}`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith('\`\`\`json')) text = text.replace(/\`\`\`json/g, '');
    if (text.endsWith('\`\`\`')) text = text.replace(/\`\`\`/g, '');
    
    return JSON.parse(text);
  } catch (err) {
    console.error('Flight estimation error:', err);
    throw new Error('Failed to estimate distance.');
  }
};

module.exports = { chat, initGemini, analyzeReceipt, estimateFlightDistance };
