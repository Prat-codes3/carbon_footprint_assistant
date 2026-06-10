const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();
router.use(protect);

/**
 * @route   POST /api/assistant/chat
 * @desc    Send a message to the AI assistant
 * @access  Private
 */
router.post('/chat', [
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

module.exports = router;
