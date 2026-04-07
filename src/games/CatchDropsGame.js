// 接住掉落物游戏
const GameScene = require('../scenes/GameScene.js');

function CatchDropsGame(canvas) {
  GameScene.call(this, canvas, { id: 'catch_drops', name: '接住掉落物', duration: 15 });
  this.catcher = { x: 0, y: 0, width: 80, height: 30 };
  this.drops = [];
  this.caught = 0;
  this.needCatch = 10;
  this.dropTimer = 0;
  this.dropInterval = 800;
}

CatchDropsGame.prototype = Object.create(GameScene.prototype);
CatchDropsGame.prototype.constructor = CatchDropsGame;

CatchDropsGame.prototype.onEnter = function() {
  GameScene.prototype.onEnter.call(this);
  this.catcher.x = this.width / 2 - this.catcher.width / 2;
  this.catcher.y = this.height - 100;
  this.drops = [];
  this.caught = 0;
  this.dropTimer = 0;
};

CatchDropsGame.prototype.update = function(deltaTime) {
  GameScene.prototype.update.call(this, deltaTime);
  if (this.isGameOver || this.isPaused) return;

  this.dropTimer += deltaTime * 1000;
  if (this.dropTimer >= this.dropInterval) {
    this.dropTimer = 0;
    this.spawnDrop();
  }

  for (let i = 0; i < this.drops.length; i++) {
    this.drops[i].y += this.drops[i].speed * deltaTime;
  }

  this.drops = this.drops.filter((function(drop) {
    if (this.checkCollision(drop)) {
      this.caught++;
      if (this.caught >= this.needCatch) {
        this.gameOver(true);
      }
      return false;
    }
    return drop.y < this.height + 50;
  }).bind(this));
};

CatchDropsGame.prototype.spawnDrop = function() {
  this.drops.push({
    x: Math.random() * (this.width - 40) + 20,
    y: -30,
    size: 30,
    speed: 200 + Math.random() * 100,
    type: Math.random() > 0.8 ? 'bonus' : 'normal'
  });
};

CatchDropsGame.prototype.checkCollision = function(drop) {
  return drop.y + drop.size > this.catcher.y &&
         drop.y < this.catcher.y + this.catcher.height &&
         drop.x > this.catcher.x &&
         drop.x < this.catcher.x + this.catcher.width;
};

CatchDropsGame.prototype.render = function(ctx) {
  ctx.fillStyle = '#1A1A2E';
  ctx.fillRect(0, 0, this.width, this.height);
  
  this.renderTopBar(ctx, '接住掉落物');
  this.renderScore(ctx);
  this.renderDrops(ctx);
  this.renderCatcher(ctx);
  
  // 操作提示
  ctx.font = '14px Arial';
  ctx.fillStyle = '#888888';
  ctx.textAlign = 'center';
  ctx.fillText('拖动屏幕移动碗接住物品', this.width / 2, this.height - 50);
  
  this.renderSkipButton(ctx);
};

CatchDropsGame.prototype.renderScore = function(ctx) {
  ctx.font = 'bold 18px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText('接住 ' + this.caught + '/' + this.needCatch, this.width / 2, 100);
};

CatchDropsGame.prototype.renderDrops = function(ctx) {
  for (let i = 0; i < this.drops.length; i++) {
    const drop = this.drops[i];
    ctx.font = '30px Arial';
    ctx.fillText(drop.type === 'bonus' ? '⭐' : '💧', drop.x, drop.y);
  }
};

CatchDropsGame.prototype.renderCatcher = function(ctx) {
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.moveTo(this.catcher.x, this.catcher.y + this.catcher.height);
  ctx.lineTo(this.catcher.x + this.catcher.width / 2, this.catcher.y);
  ctx.lineTo(this.catcher.x + this.catcher.width, this.catcher.y + this.catcher.height);
  ctx.closePath();
  ctx.fill();
};

CatchDropsGame.prototype.onTouchMove = function(e) {
  if (this.isGameOver || this.isPaused) return;
  const touch = e.touches[0];
  const x = touch.clientX || touch.x;
  const targetX = x - this.catcher.width / 2;
  this.catcher.x += (targetX - this.catcher.x) * 0.2;
  this.catcher.x = Math.max(0, Math.min(this.width - this.catcher.width, this.catcher.x));
};

CatchDropsGame.prototype.onTouchStart = function(e) {
  const touch = e.touches[0];
  const x = touch.clientX || touch.x;
  const y = touch.clientY || touch.y;
  
  if (x >= 8 && x <= 58 && y >= 8 && y <= 42) {
    this.pause();
    return;
  }
  
  if (x >= this.width - 58 && x <= this.width - 8 && y >= 8 && y <= 42) {
    if (this.onExit) this.onExit();
    return;
  }
};

CatchDropsGame.prototype.onTouchEnd = function(e) {};

module.exports = CatchDropsGame;
