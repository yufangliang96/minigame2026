// 主场景 - 游戏主界面
const BaseScene = require('./BaseScene.js');
const Button = require('../components/Button.js');

function getGameManager() {
  try {
    return require('../../gameManager.js');
  } catch (e) {
    console.error('[MainScene] gameManager加载失败:', e);
    return null;
  }
}

function MainScene(canvas, game) {
  BaseScene.call(this, canvas);
  this.gameInstance = game;
  this.init();
}

MainScene.prototype = Object.create(BaseScene.prototype);
MainScene.prototype.constructor = MainScene;

MainScene.prototype.init = function() {
  const centerX = this.width / 2;
  const self = this;

  this.startButton = new Button(centerX - 70, 380, 140, 55, '#4CAF50', '开始游戏');
  this.startButton.onClick = function() { self.onStartGame(); };

  this.replayButton = new Button(centerX - 70, 445, 140, 45, '#FF9800', '已通关游戏');
  this.replayButton.onClick = function() { self.onShowUnlocked(); };

  this.helpButton = new Button(centerX - 70, 500, 140, 40, '#607D8B', '游戏说明');
  this.helpButton.onClick = function() { self.onShowHelp(); };

  this.achievementButton = new Button(10, 10, 65, 30, '#9C27B0', '成就');
  this.achievementButton.onClick = function() { self.onShowAchievements(); };

  this.rankButton = new Button(this.width - 75, 10, 65, 30, '#2196F3', '排行');
  this.rankButton.onClick = function() { self.onShowRank(); };

  this.addChild(this.startButton);
  this.addChild(this.replayButton);
  this.addChild(this.helpButton);
  this.addChild(this.achievementButton);
  this.addChild(this.rankButton);
};

MainScene.prototype.onStartGame = function() {
  const gm = getGameManager();
  if (!gm) return;
  const game = gm.startLevel();
  this.emit('startGame', game);
};

MainScene.prototype.onShowUnlocked = function() {
  const gm = getGameManager();
  if (!gm) return;
  const unlocked = gm.getUnlockedGames();
  if (unlocked.length === 0) {
    wx.showToast({ title: '还没有通关的游戏', icon: 'none' });
    return;
  }
  var self = this;
  var items = unlocked.map(function(g) { return g.name; });
  wx.showActionSheet({
    itemList: items,
    success: function(res) {
      var game = unlocked[res.tapIndex];
      self.emit('startGame', game);
    }
  });
};

MainScene.prototype.onShowHelp = function() {
  wx.showModal({
    title: '游戏说明',
    content: '太空射击游戏，消灭敌人获得分数！\n\n拖动战机移动，自动射击。\n击落敌人获得分数，收集道具增强火力。',
    showCancel: false,
    confirmText: '知道了'
  });
};

MainScene.prototype.onShowAchievements = function() {
  const gm = getGameManager();
  if (!gm) return;
  const achievements = Array.from(gm.achievements);
  let msg = achievements.length > 0 ? '已获得 ' + achievements.length + ' 个成就' : '暂无成就，快去收集吧！';
  wx.showModal({
    title: '成就',
    content: msg,
    showCancel: true,
    cancelText: '返回',
    confirmText: '查看'
  });
};

MainScene.prototype.onShowRank = function() {
  wx.showToast({ title: '排行榜开发中', icon: 'none' });
};

MainScene.prototype.onTouchStart = function(e) {
  let x, y;
  if (e.touches && e.touches.length > 0) {
    x = e.touches[0].clientX || e.touches[0].x;
    y = e.touches[0].clientY || e.touches[0].y;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    x = e.changedTouches[0].clientX || e.changedTouches[0].x;
    y = e.changedTouches[0].clientY || e.changedTouches[0].y;
  }
  if (x === undefined || y === undefined) return;

  for (let i = 0; i < this.children.length; i++) {
    const child = this.children[i];
    if (child.contains && child.contains(x, y)) {
      child.onPress();
    }
  }
};

MainScene.prototype.onTouchEnd = function(e) {
  for (let i = 0; i < this.children.length; i++) {
    const child = this.children[i];
    if (child.onRelease) child.onRelease();
  }
};

MainScene.prototype.render = function(ctx) {
  const centerX = this.width / 2;
  const gm = getGameManager();
  
  ctx.fillStyle = '#1A1A2E';
  ctx.fillRect(0, 0, this.width, this.height);

  if (!gm) {
    ctx.fillStyle = '#FF0000';
    ctx.fillText('gameManager未加载', centerX, this.height / 2);
    return;
  }
  
  const progress = gm.getProgress();

  const gradient = ctx.createLinearGradient(0, 0, 0, 350);
  gradient.addColorStop(0, '#16213E');
  gradient.addColorStop(0.5, '#1A1A2E');
  gradient.addColorStop(1, '#0F3460');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, this.width, 350);

  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = '#FFD700';
  ctx.textAlign = 'center';
  ctx.fillText('万花筒', centerX, 80);
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#E94560';
  ctx.fillText('· 游境', centerX, 115);

  ctx.font = '14px Arial';
  ctx.fillStyle = '#888888';
  ctx.fillText('一局一玩法，关关不重样', centerX, 145);

  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, 220, 55, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('累计通关', centerX, 210);
  ctx.font = 'bold 32px Arial';
  ctx.fillStyle = '#FFD700';
  ctx.fillText(progress.totalWins, centerX, 248);
  ctx.font = '14px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('次', centerX, 268);

  ctx.fillStyle = '#2A2A4E';
  ctx.fillRect(30, 300, this.width - 60, 60);
  ctx.strokeStyle = '#444466';
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 300, this.width - 60, 60);

  ctx.font = '12px Arial';
  ctx.fillStyle = '#888888';
  ctx.textAlign = 'left';
  ctx.fillText('已解锁玩法', 45, 320);

  ctx.fillStyle = '#333355';
  ctx.fillRect(45, 335, this.width - 90, 10);
  const barWidth = (this.width - 90) * (progress.unlockedCount / progress.totalCount);
  const barGradient = ctx.createLinearGradient(45, 0, 45 + barWidth, 0);
  barGradient.addColorStop(0, '#4CAF50');
  barGradient.addColorStop(1, '#8BC34A');
  ctx.fillStyle = barGradient;
  ctx.fillRect(45, 335, barWidth, 10);

  ctx.font = '12px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'right';
  ctx.fillText(progress.unlockedCount + '/' + progress.totalCount, this.width - 45, 320);

  if (progress.winStreak > 0) {
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#FF9800';
    ctx.textAlign = 'center';
    ctx.fillText('🔥 连胜 ' + progress.winStreak + ' 关', centerX, 365);
  }

  BaseScene.prototype.render.call(this, ctx);

  ctx.font = '10px Arial';
  ctx.fillStyle = '#555555';
  ctx.textAlign = 'center';
  ctx.fillText('v1.0.0', centerX, this.height - 15);
};

module.exports = MainScene;
