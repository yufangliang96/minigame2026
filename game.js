// game.js - 仅保留 3D 入口
require('./src/games/WebGL3DFullDemo.js').run();

module.exports = {
  game: null,
  gameManager: require('./gameManager.js'),
  audioManager: null
};
