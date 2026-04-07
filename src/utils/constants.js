// 常量配置
const GAME_CONFIG = {
  APP_NAME: '万花筒·游境',
  APP_NAME_EN: 'Kaleido·Play',
  INITIAL_LEVEL: 1,
  TOTAL_GAMES: 1,
};

const GAME_TYPES = {
  COMPETITIVE: 'competitive'
};

const GAME_LIST = [
  { id: 'simple_shooting', name: '星际战机', type: GAME_TYPES.COMPETITIVE, difficulty: 1, duration: 40 },
];

const ACHIEVEMENTS = {
  FIRST_CLEAR: { id: 'first_clear', name: '玩法收藏家', description: '首次通关每种玩法' },
  WIN_STREAK_5: { id: 'win_streak_5', name: '连胜达人', description: '连续通关5关' },
  WIN_STREAK_10: { id: 'win_streak_10', name: '连胜达人', description: '连续通关10关' },
  WIN_STREAK_20: { id: 'win_streak_20', name: '连胜达人', description: '连续通关20关' },
  LUCKY_CHILD: { id: 'lucky_child', name: '幸运之子', description: '一天内遇到3次同一种玩法' }
};

const STORAGE_KEYS = {
  CURRENT_LEVEL: 'current_level',
  UNLOCKED_GAMES: 'unlocked_games',
  WIN_STREAK: 'win_streak',
  ACHIEVEMENTS: 'achievements',
  GAME_SEED: 'game_seed',
  TODAY_GAMES: 'today_games',
  FRIEND_HELP: 'friend_help'
};

module.exports = {
  GAME_CONFIG,
  GAME_TYPES,
  GAME_LIST,
  ACHIEVEMENTS,
  STORAGE_KEYS
};
