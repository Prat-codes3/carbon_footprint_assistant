const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

/**
 * @route   POST /api/assistant/chat
 * @desc    Send a message to the AI assistant
 * @access  Private
 */
router.post('/chat', protect, [
  body('message').trim().notEmpty().withMessage('Message cannot be empty')
    .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
  body('history').optional().isArray().withMessage('History must be an array')
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const { message, history = [] } = req.body;
    const response = await aiService.chat(req.user._id, message, history);

    res.json({
      success: true,
      data: {
        reply: response.message,
        source: response.source,
        context: response.context,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/assistant/scan
 * @desc Scan a receipt or bill using Gemini Vision
 * @access Public (Available to guests)
 */
router.post('/scan', async (req, res, next) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    // Strip data prefix if present (e.g., data:image/jpeg;base64,...)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const items = await aiService.analyzeReceipt(base64Data, mimeType);
    
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/assistant/estimate-flight
 * @desc Estimate flight distance using Gemini
 * @access Public
 */
router.post('/estimate-flight', async (req, res, next) => {
  try {
    const { fromCity, toCity } = req.body;
    if (!fromCity || !toCity) {
      return res.status(400).json({ success: false, message: 'fromCity and toCity are required' });
    }

    const data = await aiService.estimateFlightDistance(fromCity, toCity);
    res.json({ success: true, distance_km: data.distance_km });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
