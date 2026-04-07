// 单独导出gameManager避免循环依赖
const GameManager = require('./src/utils/GameManager.js');
const gameManager = new GameManager();

module.exports = gameManager;
