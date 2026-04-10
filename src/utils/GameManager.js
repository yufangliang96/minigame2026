// 游戏管理器 - 核心游戏逻辑
const { GAME_CONFIG, GAME_LIST, GAME_TYPES, STORAGE_KEYS, ACHIEVEMENTS } = require('./constants.js');

function GameManager() {
  this.currentLevel = 1;
  this.unlockedGames = new Set();
  this.winStreak = 0;
  this.totalWins = 0;
  this.achievements = new Set();
  this.currentGame = null;
  this.todayGames = [];
  this.gameSeed = null;
  this.loadData();
}

GameManager.prototype.loadData = function() {
  try {
    const level = wx.getStorageSync(STORAGE_KEYS.CURRENT_LEVEL);
    const unlocked = wx.getStorageSync(STORAGE_KEYS.UNLOCKED_GAMES);
    const streak = wx.getStorageSync(STORAGE_KEYS.WIN_STREAK);
    const achieve = wx.getStorageSync(STORAGE_KEYS.ACHIEVEMENTS);
    
    this.currentLevel = level || GAME_CONFIG.INITIAL_LEVEL;
    this.unlockedGames = new Set(unlocked || []);
    this.winStreak = streak || 0;
    this.achievements = new Set(achieve || []);

    const today = new Date().toDateString();
    const todayStored = wx.getStorageSync(STORAGE_KEYS.TODAY_GAMES) || { date: '', games: [] };
    this.todayGames = todayStored.date === today && Array.isArray(todayStored.games) ? todayStored.games.slice() : [];
  } catch (e) {
    console.error('加载数据失败:', e);
  }
};

GameManager.prototype.saveData = function() {
  try {
    wx.setStorageSync(STORAGE_KEYS.CURRENT_LEVEL, this.currentLevel);
    wx.setStorageSync(STORAGE_KEYS.UNLOCKED_GAMES, Array.from(this.unlockedGames));
    wx.setStorageSync(STORAGE_KEYS.WIN_STREAK, this.winStreak);
    wx.setStorageSync(STORAGE_KEYS.ACHIEVEMENTS, Array.from(this.achievements));
  } catch (e) {
    console.error('保存数据失败:', e);
  }
};

GameManager.prototype.getRandomGame = function(forceType) {
  let availableGames = GAME_LIST.slice();
  
  if (forceType) {
    availableGames = availableGames.filter(function(g) { return g.type === forceType; });
  }
  
  if (this.gameSeed !== null) {
    const seedIndex = this.gameSeed % availableGames.length;
    this.gameSeed = null;
    return availableGames[seedIndex];
  }
  
  const randomIndex = Math.floor(Math.random() * availableGames.length);
  return availableGames[randomIndex];
};

GameManager.prototype.useGameSeed = function() {
  if (this.unlockedGames.size >= 2) {
    this.gameSeed = Math.floor(Math.random() * GAME_LIST.length);
    return true;
  }
  return false;
};

GameManager.prototype.startLevel = function() {
  // 第一关固定为简易射击
  if (this.currentLevel === 1) {
    this.currentGame = GAME_LIST.find(function(g) { return g.id === 'simple_shooting'; });
  } else {
    this.currentGame = this.getRandomGame();
  }
  this.recordTodayGame(this.currentGame.id);
  console.log('[GameManager] 开始关卡' + this.currentLevel + ':', this.currentGame.name);
  return this.currentGame;
};

GameManager.prototype.recordTodayGame = function(gameId) {
  const today = new Date().toDateString();
  let stored = wx.getStorageSync(STORAGE_KEYS.TODAY_GAMES) || { date: '', games: [] };
  
  if (stored.date !== today) {
    this.todayGames = [];
    stored.date = today;
    stored.games = [];
  }
  
  this.todayGames.push(gameId);
  stored.games = this.todayGames;
  wx.setStorageSync(STORAGE_KEYS.TODAY_GAMES, stored);
};

GameManager.prototype.checkLuckyChildAchievement = function() {
  const gameCounts = {};
  const self = this;
  this.todayGames.forEach(function(id) {
    gameCounts[id] = (gameCounts[id] || 0) + 1;
  });
  
  for (const gameId in gameCounts) {
    if (gameCounts[gameId] >= 3) {
      this.unlockAchievement(ACHIEVEMENTS.LUCKY_CHILD.id);
      return true;
    }
  }
  return false;
};

GameManager.prototype.winLevel = function() {
  this.currentLevel++;
  this.winStreak++;
  this.totalWins++;
  this.unlockedGames.add(this.currentGame.id);
  this.checkWinStreakAchievement();
  this.checkLuckyChildAchievement();
  this.saveData();
};

GameManager.prototype.loseLevel = function() {
  this.winStreak = 0;
  this.saveData();
};

GameManager.prototype.checkWinStreakAchievement = function() {
  if (this.winStreak >= 20) {
    this.unlockAchievement(ACHIEVEMENTS.WIN_STREAK_20.id);
  } else if (this.winStreak >= 10) {
    this.unlockAchievement(ACHIEVEMENTS.WIN_STREAK_10.id);
  } else if (this.winStreak >= 5) {
    this.unlockAchievement(ACHIEVEMENTS.WIN_STREAK_5.id);
  }
};

GameManager.prototype.unlockAchievement = function(achievementId) {
  if (!this.achievements.has(achievementId)) {
    this.achievements.add(achievementId);
    this.saveData();
    return true;
  }
  return false;
};

GameManager.prototype.getProgress = function() {
  return {
    level: this.currentLevel,
    unlockedCount: this.unlockedGames.size,
    totalCount: GAME_LIST.length,
    winStreak: this.winStreak,
    totalWins: this.totalWins || 0
  };
};

GameManager.prototype.getUnlockedGames = function() {
  var self = this;
  return GAME_LIST.filter(function(g) {
    return self.unlockedGames.has(g.id);
  });
};

GameManager.prototype.reset = function() {
  this.currentLevel = GAME_CONFIG.INITIAL_LEVEL;
  this.winStreak = 0;
  this.saveData();
};

module.exports = GameManager;
