const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { calculateEmissions, getAvailableActivities, EMISSION_FACTORS } = require('../utils/emissionFactors');
const gamificationService = require('../services/gamificationService');

const router = express.Router();

// All activity routes require authentication
router.use(protect);

/**
 * @route   GET /api/activities/types
 * @desc    Get all available activity types with emission factors
 * @access  Private
 */
router.get('/types', (req, res) => {
  res.json({ success: true, data: getAvailableActivities() });
});

/**
 * @route   GET /api/activities
 * @desc    Get user's activities with optional filters
 * @access  Private
 */
router.get('/', [
  query('category').optional().isIn(['transport', 'energy', 'food', 'shopping']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res, next) => {
  try {
    const { category, limit = 20, page = 1, startDate, endDate } = req.query;
    const filter = { userId: req.user._id };

    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [activities, total] = await Promise.all([
      Activity.find(filter).sort({ date: -1 }).limit(parseInt(limit)).skip(skip),
      Activity.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: activities,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/activities
 * @desc    Log a new carbon activity
 * @access  Private
 */
router.post('/', [
  body('category').isIn(['transport', 'energy', 'food', 'shopping']).withMessage('Invalid category'),
  body('activityType').notEmpty().withMessage('Activity type is required'),
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('note').optional().isLength({ max: 200 }).withMessage('Note cannot exceed 200 characters')
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const { category, activityType, quantity, date, note } = req.body;

    // Validate activity type exists
    if (!EMISSION_FACTORS[category] || !EMISSION_FACTORS[category][activityType]) {
      return res.status(400).json({ success: false, message: 'Invalid activity type for this category' });
    }

    const activityInfo = EMISSION_FACTORS[category][activityType];
    const co2Kg = calculateEmissions(category, activityType, parseFloat(quantity));

    const activity = await Activity.create({
      userId: req.user._id,
      category,
      activityType,
      quantity: parseFloat(quantity),
      unit: activityInfo.unit,
      co2Kg,
      label: activityInfo.label,
      note: note || '',
      date: date ? new Date(date) : new Date()
    });

    // Update gamification (streaks, badges, score)
    const gamificationUpdate = await gamificationService.processActivity(req.user, activity);

    res.status(201).json({
      success: true,
      message: 'Activity logged successfully!',
      data: activity,
      gamification: gamificationUpdate
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/activities/:id
 * @desc    Delete an activity
 * @access  Private
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const activity = await Activity.findOne({ _id: req.params.id, userId: req.user._id });
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }
    await activity.deleteOne();
    res.json({ success: true, message: 'Activity deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
