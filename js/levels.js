// =========================
// CONFIGURATION & CUSTOMIZATION
// =========================

export const LEVELS = {
  1: {
    hearts: 12,
    thorns: 8,
    timeLimit: 40, // seconds
    playerSpeed: 285, // px/s
    thornSpeed: 130, // px/s
    invuln: 0.85, // seconds after hit
    levelTitle: "Level 1: Getting Started",
  },
  2: {
    hearts: 16,
    thorns: 12,
    timeLimit: 50, // seconds
    playerSpeed: 285, // px/s
    thornSpeed: 160, // px/s (faster!)
    invuln: 0.85,
    levelTitle: "Level 2: Challenge!",
  },
};

export default {
  // Personalize these
  WIN_MESSAGE:
    "Happy Valentine's Day! 💘\n\nIf you're reading this, you collected every heart — just like you collect the best parts of my day.",
  SIGNATURE: "— From: [Your Name]",
  SHARE_TEXT: "I just beat Valentine Dash 💘",

  // Win celebration timing
  winFxTimer: 1.4,
  winFxDelayMs: 30,
  
  // Levels
  LEVELS,
};
