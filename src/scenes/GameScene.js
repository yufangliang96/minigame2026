// 游戏场景 - 通用游戏界面
const BaseScene = require('./BaseScene.js');

function getGameManager() {
  try {
    return require('../../gameManager.js');
  } catch (e) {
    console.error('[GameScene] gameManager加载失败:', e);
    return null;
  }
}

function GameScene(canvas, gameData) {
  BaseScene.call(this, canvas);
  this.gameData = gameData;
  this.timeLeft = gameData.duration;
  this.score = 0;
  this.isGameOver = false;
  this.isPaused = false;
  this.timer = null;
  this.onGameEnd = null;
  this.onExit = null;
  this.onPause = null;
}

GameScene.prototype = Object.create(BaseScene.prototype);
GameScene.prototype.constructor = GameScene;

GameScene.prototype.onEnter = function() {
  BaseScene.prototype.onEnter.call(this);
  this.startTimer();
};

GameScene.prototype.onExit = function() {
  BaseScene.prototype.onExit.call(this);
  if (this.timer) {
    clearInterval(this.timer);
    this.timer = null;
  }
};

GameScene.prototype.onResume = function() {
  this.isPaused = false;
  if (this.timer) {
    clearInterval(this.timer);
    this.timer = null;
  }
  this.startTimer();
};

GameScene.prototype.startTimer = function() {
  const self = this;
  this.timer = setInterval(function() {
    if (self.isPaused) return;
    self.timeLeft -= 1;
    if (self.timeLeft <= 0) {
      self.timeLeft = 0;
      self.onTimeUp();
    }
  }, 1000);
};

GameScene.prototype.onTimeUp = function() {
  this.gameOver(false);
};

GameScene.prototype.pause = function() {
  this.isPaused = true;
  if (this.onPause) this.onPause();
};

GameScene.prototype.gameOver = function(win) {
  if (this.isGameOver) return;
  this.isGameOver = true;
  
  if (this.timer) {
    clearInterval(this.timer);
    this.timer = null;
  }

  if (win) {
    const gm = getGameManager();
    if (gm) gm.winLevel();
  } else {
    const gm = getGameManager();
    if (gm) gm.loseLevel();
  }
  
  if (this.onGameEnd) {
    this.onGameEnd(win);
  }
};

GameScene.prototype.formatTime = function(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
};

GameScene.prototype.safeRoundRect = function(ctx, x, y, w, h, r) {
  r = typeof r === 'number' ? r : 5;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
};

GameScene.prototype.renderTopBar = function(ctx, title) {
  const centerX = this.width / 2;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 0, this.width, 50);

  ctx.fillStyle = '#666666';
  this.safeRoundRect(ctx, 8, 8, 50, 34, 6);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('暂停', 33, 30);

  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText(title || this.gameData.name, centerX, 20);

  ctx.font = '12px Arial';
  ctx.fillStyle = '#AAAAAA';
  ctx.fillText('⏱ ' + this.formatTime(this.timeLeft), centerX, 38);

  ctx.fillStyle = '#666666';
  this.safeRoundRect(ctx, this.width - 58, 8, 50, 34, 6);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('←', this.width - 33, 31);
};

GameScene.prototype.renderSkipButton = function(ctx) {
  const centerX = this.width / 2;
  const skipBtn = {
    x: centerX - 35,
    y: this.height - 70,
    width: 70,
    height: 32
  };

  ctx.fillStyle = 'rgba(128, 128, 128, 0.7)';
  this.safeRoundRect(ctx, skipBtn.x, skipBtn.y, skipBtn.width, skipBtn.height, 6);
  ctx.fill();

  ctx.font = '12px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText('跳过', centerX, skipBtn.y + 20);
  
  return skipBtn;
};

GameScene.prototype.roundRect = function(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

GameScene.prototype.onTouchStart = function(e) {
  if (this.isPaused) return;
  
  const touch = e.touches[0];
  const x = touch.clientX || touch.x;
  const y = touch.clientY || touch.y;
  
  if (x >= 8 && x <= 58 && y >= 8 && y <= 42) {
    this.pause();
    return;
  }
  
  if (x >= this.width - 58 && x <= this.width - 8 && y >= 8 && y <= 42) {
    if (this.onExit) {
      this.onExit();
    }
    return;
  }
};

module.exports = GameScene;
