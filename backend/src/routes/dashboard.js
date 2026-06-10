const express = require('express');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { GLOBAL_AVERAGE_KG_PER_DAY, GLOBAL_AVERAGE_KG_PER_YEAR } = require('../utils/emissionFactors');
const gamificationService = require('../services/gamificationService');
const recommendationService = require('../services/recommendationService');

const router = express.Router();
router.use(protect);

/**
 * @route   GET /api/dashboard/summary
 * @desc    Get aggregated carbon stats for the dashboard
 * @access  Private
 */
router.get('/summary', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Date ranges
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now); startOfMonth.setDate(now.getDate() - 30);
    const startOfYear = new Date(now); startOfYear.setFullYear(now.getFullYear() - 1);

    // Aggregate queries
    const [todayStats, weekStats, monthStats, yearStats, categoryBreakdown] = await Promise.all([
      Activity.aggregate([
        { $match: { userId, date: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$co2Kg' }, count: { $sum: 1 } } }
      ]),
      Activity.aggregate([
        { $match: { userId, date: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$co2Kg' }, count: { $sum: 1 } } }
      ]),
      Activity.aggregate([
        { $match: { userId, date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$co2Kg' }, count: { $sum: 1 } } }
      ]),
      Activity.aggregate([
        { $match: { userId, date: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$co2Kg' }, count: { $sum: 1 } } }
      ]),
      Activity.aggregate([
        { $match: { userId, date: { $gte: startOfMonth } } },
        { $group: { _id: '$category', total: { $sum: '$co2Kg' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ])
    ]);

    const todayKg = todayStats[0]?.total || 0;
    const weekKg = weekStats[0]?.total || 0;
    const monthKg = monthStats[0]?.total || 0;
    const yearKg = yearStats[0]?.total || 0;

    // Annualized estimate based on 30-day data
    const annualizedKg = monthKg * 12;

    const gamification = await gamificationService.getStats(userId);

    res.json({
      success: true,
      data: {
        today: { kg: parseFloat(todayKg.toFixed(2)), vs_global: parseFloat((todayKg / GLOBAL_AVERAGE_KG_PER_DAY * 100).toFixed(1)) },
        week: { kg: parseFloat(weekKg.toFixed(2)), vs_global: parseFloat((weekKg / (GLOBAL_AVERAGE_KG_PER_DAY * 7) * 100).toFixed(1)) },
        month: { kg: parseFloat(monthKg.toFixed(2)), vs_global: parseFloat((monthKg / (GLOBAL_AVERAGE_KG_PER_DAY * 30) * 100).toFixed(1)) },
        annualized: {
          kg: parseFloat(annualizedKg.toFixed(2)),
          tonnes: parseFloat((annualizedKg / 1000).toFixed(3)),
          vs_global_tonnes: GLOBAL_AVERAGE_KG_PER_YEAR / 1000,
          percentage_of_global: parseFloat((annualizedKg / GLOBAL_AVERAGE_KG_PER_YEAR * 100).toFixed(1))
        },
        categoryBreakdown: categoryBreakdown.map(c => ({
          category: c._id,
          kg: parseFloat(c.total.toFixed(2)),
          count: c.count,
          percentage: parseFloat((c.total / (monthKg || 1) * 100).toFixed(1))
        })),
        gamification
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/dashboard/trends
 * @desc    Get time-series data for charts (last 30 days by day)
 * @access  Private
 */
router.get('/trends', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const trends = await Activity.aggregate([
      { $match: { userId, date: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            category: '$category'
          },
          total: { $sum: '$co2Kg' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Build complete date range with zeros for missing days
    const dateMap = {};
    const categories = ['transport', 'energy', 'food', 'shopping'];

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dateMap[key] = { date: key, transport: 0, energy: 0, food: 0, shopping: 0, total: 0 };
    }

    trends.forEach(t => {
      const { date, category } = t._id;
      if (dateMap[date]) {
        dateMap[date][category] = parseFloat(t.total.toFixed(2));
        dateMap[date].total = parseFloat((dateMap[date].total + t.total).toFixed(2));
      }
    });

    res.json({
      success: true,
      data: {
        labels: Object.keys(dateMap),
        datasets: categories.map(cat => ({
          category: cat,
          values: Object.values(dateMap).map(d => d[cat])
        })),
        dailyTotals: Object.values(dateMap).map(d => d.total),
        globalAverageLine: GLOBAL_AVERAGE_KG_PER_DAY
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/dashboard/recommendations
 * @desc    Get personalized recommendations
 * @access  Private
 */
router.get('/recommendations', async (req, res, next) => {
  try {
    const recommendations = await recommendationService.getRecommendations(req.user._id);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/dashboard/leaderboard
 * @desc    Get top users by greenScore
 * @access  Public
 */
router.get('/leaderboard', async (req, res, next) => {
  try {
    const topUsers = await User.find({})
      .select('username greenScore level')
      .sort({ greenScore: -1 })
      .limit(10);
      
    res.json({
      success: true,
      data: topUsers
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
