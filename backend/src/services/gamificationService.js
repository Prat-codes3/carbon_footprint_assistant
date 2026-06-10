const User = require('../models/User');

// Badge definitions
const BADGES = {
  first_log: { id: 'first_log', name: 'First Step', description: 'Logged your first activity', icon: '🌱', points: 10 },
  week_streak: { id: 'week_streak', name: '7-Day Streak', description: 'Logged activities 7 days in a row', icon: '🔥', points: 50 },
  month_streak: { id: 'month_streak', name: '30-Day Streak', description: 'Logged activities 30 days in a row', icon: '💎', points: 200 },
  plant_week: { id: 'plant_week', name: 'Plant Powered', description: 'Ate plant-based meals for a week', icon: '🥗', points: 75 },
  green_commuter: { id: 'green_commuter', name: 'Green Commuter', description: 'Used public transport 10 times', icon: '🚆', points: 60 },
  cyclist: { id: 'cyclist', name: 'Cyclist', description: 'Cycled or walked 50km total', icon: '🚴', points: 80 },
  energy_saver: { id: 'energy_saver', name: 'Energy Saver', description: 'Reduced energy use 3 weeks in a row', icon: '💡', points: 90 },
  carbon_tracker: { id: 'carbon_tracker', name: 'Carbon Tracker', description: 'Logged 50 activities', icon: '📊', points: 100 },
  eco_warrior: { id: 'eco_warrior', name: 'Eco Warrior', description: 'Reached Level 7', icon: '🌍', points: 150 },
  below_average: { id: 'below_average', name: 'Below Average', description: 'Stayed below global average for a week', icon: '⭐', points: 120 }
};

// Level thresholds (points required to reach each level)
const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250, 2750];

const getLevelFromScore = (score) => {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (score >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  return Math.min(level, 16);
};

/**
 * Process a new activity and update gamification state
 */
const processActivity = async (user, activity) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newBadges = [];
  let pointsEarned = 5; // Base points per log

  // Update streak
  const lastDate = user.gamification.lastActivityDate;
  if (lastDate) {
    const last = new Date(lastDate);
    last.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      user.gamification.currentStreak += 1;
    } else if (diffDays > 1) {
      user.gamification.currentStreak = 1;
    }
  } else {
    user.gamification.currentStreak = 1;
  }

  if (user.gamification.currentStreak > user.gamification.longestStreak) {
    user.gamification.longestStreak = user.gamification.currentStreak;
  }
  user.gamification.lastActivityDate = new Date();

  // Bonus points for low-carbon activities
  if (activity.co2Kg < 0.5) pointsEarned += 10;
  if (activity.co2Kg === 0) pointsEarned += 15; // Cycling/walking

  // Check badges
  const existingBadges = new Set(user.gamification.badges);

  const checkAndAward = (badgeId) => {
    if (!existingBadges.has(badgeId)) {
      newBadges.push(BADGES[badgeId]);
      user.gamification.badges.push(badgeId);
      pointsEarned += BADGES[badgeId].points;
    }
  };

  // First log badge
  checkAndAward('first_log');

  // Streak badges
  if (user.gamification.currentStreak >= 7) checkAndAward('week_streak');
  if (user.gamification.currentStreak >= 30) checkAndAward('month_streak');

  // Green commuter (using public transport)
  if (['train', 'subway', 'bus'].includes(activity.activityType)) {
    checkAndAward('green_commuter');
  }

  // Cyclist badge
  if (activity.activityType === 'cycling') {
    checkAndAward('cyclist');
  }

  // Plant-based badge
  if (activity.activityType === 'plant_based_meal') {
    checkAndAward('plant_week');
  }

  // Update total score and level
  user.gamification.greenScore += pointsEarned;
  const newLevel = getLevelFromScore(user.gamification.greenScore);
  const leveledUp = newLevel > user.gamification.level;
  user.gamification.level = newLevel;

  if (leveledUp && newLevel >= 7) checkAndAward('eco_warrior');

  await User.findByIdAndUpdate(user._id, { gamification: user.gamification });

  return {
    pointsEarned,
    totalScore: user.gamification.greenScore,
    level: user.gamification.level,
    streak: user.gamification.currentStreak,
    newBadges,
    leveledUp
  };
};

/**
 * Get full gamification stats for a user
 */
const getStats = async (userId) => {
  const user = await User.findById(userId);
  const levelInfo = user.getLevelName();
  const nextLevelThreshold = LEVEL_THRESHOLDS[Math.min(user.gamification.level, LEVEL_THRESHOLDS.length - 1)] || null;
  const currentThreshold = LEVEL_THRESHOLDS[user.gamification.level - 1] || 0;

  return {
    level: user.gamification.level,
    levelInfo,
    greenScore: user.gamification.greenScore,
    currentStreak: user.gamification.currentStreak,
    longestStreak: user.gamification.longestStreak,
    badges: user.gamification.badges.map(id => BADGES[id]).filter(Boolean),
    progress: nextLevelThreshold
      ? Math.round(((user.gamification.greenScore - currentThreshold) / (nextLevelThreshold - currentThreshold)) * 100)
      : 100,
    nextLevelAt: nextLevelThreshold
  };
};

module.exports = { processActivity, getStats, BADGES, getLevelFromScore };
