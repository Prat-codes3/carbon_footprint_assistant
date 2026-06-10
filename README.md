# 🌱 Carbon Footprint Assistant

> An AI-powered full-stack web application that helps individuals track, understand, and reduce their personal carbon footprint through intelligent insights, real-time analytics, and personalized recommendations.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://carbon-footprint-assistant.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)

---

## 🎯 Chosen Vertical

**Climate & Sustainability** — Personal Carbon Footprint Tracking & Reduction Assistant

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧮 **Carbon Calculator** | Track emissions across Transport, Energy, Food & Shopping |
| 📊 **Live Dashboard** | Real-time charts, trends, and comparison to global averages |
| 🤖 **AI Assistant** | Gemini-powered chatbot with full knowledge of your carbon data |
| 🏆 **Gamification** | Badges, levels, streaks, and weekly eco-challenges |
| 🌍 **Recommendations** | Prioritized action list ranked by CO₂ impact |
| 👤 **Auth + Guest Mode** | Full-featured guest mode + persistent accounts via MongoDB |

---

## 🏗️ Architecture

```
carbon_footprint_assistant/
├── backend/               # Node.js + Express REST API
│   ├── src/
│   │   ├── config/        # Database & environment config
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic (AI, calculations, gamification)
│   │   └── utils/         # Carbon emission factors & helpers
│   ├── tests/             # Jest unit & integration tests
│   ├── .env.example       # Environment variable template
│   ├── package.json
│   └── server.js
├── frontend/              # Vanilla HTML/CSS/JS (SPA)
│   ├── index.html
│   ├── css/styles.css     # Custom dark glassmorphism design system
│   ├── js/
│   │   ├── app.js         # SPA router & main logic
│   │   ├── api.js         # Backend API client
│   │   ├── charts.js      # Chart.js visualizations
│   │   ├── assistant.js   # AI chat interface
│   │   └── calculator.js  # Carbon calculator UI
│   └── assets/
└── README.md
```

---

## 🧠 Approach & Logic

### Carbon Calculation
Activities are logged by the user and multiplied by scientifically-backed emission factors (sourced from IPCC, Our World in Data, and EPA):

```
CO₂ (kg) = Activity Quantity × Emission Factor (kg CO₂ per unit)
```

**Example factors used:**
- Car (petrol): `0.192 kg CO₂/km`
- Electricity (grid avg): `0.233 kg CO₂/kWh`
- Beef: `27 kg CO₂/kg`
- Flight (long-haul): `0.195 kg CO₂/km/passenger`

### AI Assistant Logic
1. User sends a message to the AI chat
2. Backend fetches the user's **real carbon data** (last 30 days of activities, category totals, worst offenders)
3. This data is injected into a structured **system prompt** for Gemini
4. Gemini returns a **contextual, personalized** response — not generic advice
5. If Gemini is unavailable, a **rule-based fallback engine** provides curated tips based on the user's highest-emission categories

### Recommendations Engine (Hybrid)
- **Rule-based layer**: Maps each category's emission level to a priority-ranked set of actionable tips
- **AI layer**: Gemini re-ranks and personalizes tips based on user's full context
- Tips are sorted by **CO₂ impact (tonnes/year saved)** so users tackle the highest-impact changes first

### Gamification
- **Green Score**: Points earned per kg CO₂ saved vs. previous week
- **Badges**: Unlocked by milestones (e.g., "First Plant-Based Week", "30-Day Streak")
- **Levels**: Carbon Novice → Eco Warrior → Carbon Hero
- **Weekly Challenges**: Auto-generated based on user's worst category

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free) — [cloud.mongodb.com](https://cloud.mongodb.com)
- Google Gemini API Key (free) — [aistudio.google.com](https://aistudio.google.com)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/carbon_footprint_assistant.git
cd carbon_footprint_assistant
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and Gemini API key
npm run dev
```

### 3. Open Frontend
```bash
# Simply open frontend/index.html in your browser
# OR use a local server:
npx serve frontend -p 3000
```

> **Guest Mode**: No account needed — click "Continue as Guest" on the landing page to explore all features immediately.

---

## 🌐 Deployment

| Service | Platform | URL |
|---|---|---|
| Backend API | Render.com (free) | `https://carbon-api.onrender.com` |
| Frontend | Vercel (free) | `https://carbon-footprint-assistant.vercel.app` |

### Environment Variables (Render Dashboard)
Set these in Render's environment variable settings (never in code):
- `MONGODB_URI` — Your MongoDB Atlas connection string
- `JWT_SECRET` — A long random secret string
- `GEMINI_API_KEY` — Your Google Gemini API key
- `FRONTEND_URL` — Your Vercel frontend URL

---

## 🔒 Security

- Passwords hashed with **bcrypt** (salt rounds: 12)
- **JWT** tokens with expiry (30 days, configurable)
- **Helmet.js** for HTTP security headers
- **Rate limiting** on API routes (100 req/15min, 5 req/15min on auth)
- **Input validation** with express-validator on all routes
- API keys stored only in environment variables — never in code or repo
- CORS restricted to frontend domain only

---

## ♿ Accessibility

- Semantic HTML5 elements throughout
- ARIA labels on all interactive elements
- Keyboard navigation support
- WCAG AA color contrast ratios
- Responsive design (mobile-first)
- Screen reader friendly chart descriptions

---

## 🧪 Testing

```bash
cd backend
npm test
```

Tests cover:
- Carbon emission calculation accuracy
- API endpoint validation
- Authentication flow
- Recommendation engine logic

---

## 📊 Assumptions

1. Emission factors are global averages — location-specific factors can be added via future enhancement
2. Guest mode data is stored in `localStorage` — cleared on browser data wipe
3. The global average carbon footprint used for comparison is **4.7 tonnes CO₂/year** (World Bank 2023)
4. Electricity emission factor defaults to global average `0.233 kg CO₂/kWh` (can be customized by region)

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas (Mongoose ODM)
- **AI**: Google Gemini 1.5 Flash API
- **Charts**: Chart.js
- **Auth**: JWT + bcryptjs
- **Security**: Helmet, express-rate-limit, express-validator
- **Testing**: Jest + Supertest
- **Deployment**: Render (backend), Vercel (frontend)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
