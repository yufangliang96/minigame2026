// 游戏工厂 - 根据类型创建游戏实例
const RockPaperScissorsGame = require('./RockPaperScissorsGame.js');
const CatchDropsGame = require('./CatchDropsGame.js');
const Mini2048Game = require('./Mini2048Game.js');

let _gameManager = null;
function getGameManager() {
  if (_gameManager) return _gameManager;
  try {
    _gameManager = require('../../gameManager.js');
    return _gameManager;
  } catch (e) {
    return null;
  }
}

function safeRoundRect(ctx, x, y, w, h, r) {
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
}

const GameFactory = {
  createGame: function(gameId, canvas) {
    switch (gameId) {
      case 'rock_paper_scissors':
        return new RockPaperScissorsGame(canvas);
      case 'catch_drops':
        return new CatchDropsGame(canvas);
      case 'quick_tap':
        return new QuickTapGame(canvas);
      case 'mini_2048':
        return new Mini2048Game(canvas);
      case 'lottery_battle':
        return new LotteryBattleGame(canvas);
      case 'dodge_obstacle':
        return new DodgeObstacleGame(canvas);
      case 'ball_hole':
        return new BallHoleGame(canvas);
      case 'number_puzzle':
        return new NumberPuzzleGame(canvas);
      case 'simple_shooting':
        return new SimpleShootingGame(canvas);
      default:
        return new RockPaperScissorsGame(canvas);
    }
  }
};

// 快速点击游戏
function QuickTapGame(canvas) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.width = canvas.width;
  this.height = canvas.height;
  this.timeLeft = 15;
  this.targetCount = 20;
  this.tapped = 0;
  this.targets = [];
  this.isGameOver = false;
  this.isPaused = false;
  this.timer = null;
  this.onGameEnd = null;
  this.onPause = null;
  this.game = { id: 'quick_tap', name: '快速点击', duration: 15 };
}

QuickTapGame.prototype.pause = function() {
  this.isPaused = true;
  if (this.onPause) this.onPause();
};

QuickTapGame.prototype.onEnter = function() {
  this.startTimer();
  this.spawnTarget();
};

QuickTapGame.prototype.onExit = function() {
  if (this.timer) clearInterval(this.timer);
};

QuickTapGame.prototype.startTimer = function() {
  const self = this;
  this.timer = setInterval(function() {
    self.timeLeft -= 1;
    if (self.timeLeft <= 0) {
      self.timeLeft = 0;
      self.gameOver(self.tapped >= self.targetCount);
    }
  }, 1000);
};

QuickTapGame.prototype.spawnTarget = function() {
  if (this.isGameOver) return;
  this.targets = [];
  for (let i = 0; i < 5; i++) {
    this.targets.push({
      x: Math.random() * (this.width - 60) + 30,
      y: Math.random() * (this.height - 300) + 120,
      size: 50,
      id: Date.now() + i
    });
  }
};

QuickTapGame.prototype.gameOver = function(win) {
  if (this.isGameOver) return;
  this.isGameOver = true;
  if (this.timer) clearInterval(this.timer);
  if (this.onGameEnd) this.onGameEnd(win);
};

QuickTapGame.prototype.onTap = function(x, y) {
  if (this.isGameOver) return;
  for (let i = this.targets.length - 1; i >= 0; i--) {
    const t = this.targets[i];
    const dx = x - t.x;
    const dy = y - t.y;
    if (Math.sqrt(dx * dx + dy * dy) < t.size) {
      this.targets.splice(i, 1);
      this.tapped++;
      if (this.tapped >= this.targetCount) {
        this.gameOver(true);
      } else if (this.targets.length === 0) {
        this.spawnTarget();
      }
      break;
    }
  }
};

QuickTapGame.prototype.update = function(dt) {};
QuickTapGame.prototype.onTouchMove = function(e) {};
QuickTapGame.prototype.onTouchEnd = function(e) {};

QuickTapGame.prototype.onTouchStart = function(e) {
  if (!e.touches || e.touches.length === 0) return;
  const touch = e.touches[0];
  const tx = touch.clientX || touch.x;
  const ty = touch.clientY || touch.y;
  
  if (tx === undefined || ty === undefined) return;
  
  const pauseBtn = { x: 10, y: 10, width: 60, height: 40 };
  if (tx >= pauseBtn.x && tx <= pauseBtn.x + pauseBtn.width &&
      ty >= pauseBtn.y && ty <= pauseBtn.y + pauseBtn.height) {
    this.pause();
    return;
  }
  
  const backBtn = { x: this.width - 70, y: 10, width: 60, height: 40 };
  if (tx >= backBtn.x && tx <= backBtn.x + backBtn.width &&
      ty >= backBtn.y && ty <= backBtn.y + backBtn.height) {
    if (this.onExit) this.onExit();
    return;
  }
  
  if (this.isPaused || this.isGameOver) return;
  this.onTap(tx, ty);
};

QuickTapGame.prototype.render = function() {
  this.ctx.fillStyle = '#1A1A2E';
  this.ctx.fillRect(0, 0, this.width, this.height);

  this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
  this.ctx.fillRect(0, 0, 180, 50);
  this.ctx.fillRect(this.width - 180, 0, 180, 50);
  this.ctx.font = 'bold 18px Arial';
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.textAlign = 'left';
  this.ctx.fillText('快速点击', 20, 32);
  this.ctx.textAlign = 'right';
  this.ctx.fillText('⏱ 00:' + this.timeLeft.toString().padStart(2, '0'), this.width - 20, 32);

  this.ctx.font = 'bold 20px Arial';
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.textAlign = 'center';
  this.ctx.fillText('点击 ' + this.tapped + '/' + this.targetCount, this.width / 2, 100);

  for (let i = 0; i < this.targets.length; i++) {
    const t = this.targets[i];
    this.ctx.font = '40px Arial';
    this.ctx.fillText('🎯', t.x, t.y);
  }

  if (this.isGameOver && this.tapped >= this.targetCount) {
    this.ctx.font = 'bold 40px Arial';
    this.ctx.fillStyle = '#4CAF50';
    this.ctx.fillText('胜利!', this.width / 2, this.height / 2);
  }
};

// 抽签对决游戏
function LotteryBattleGame(canvas) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.width = canvas.width;
  this.height = canvas.height;
  this.timeLeft = 10;
  this.playerChoice = null;
  this.computerChoice = null;
  this.result = null;
  this.isGameOver = false;
  this.isPaused = false;
  this.timer = null;
  this.onGameEnd = null;
  this.onPause = null;
  this.game = { id: 'lottery_battle', name: '抽签对决', duration: 10 };
}

LotteryBattleGame.prototype.pause = function() {
  this.isPaused = true;
  if (this.onPause) this.onPause();
};

LotteryBattleGame.prototype.onEnter = function() {
  this.startTimer();
};

LotteryBattleGame.prototype.onExit = function() {
  if (this.timer) clearInterval(this.timer);
};

LotteryBattleGame.prototype.startTimer = function() {
  const self = this;
  this.timer = setInterval(function() {
    self.timeLeft -= 1;
    if (self.timeLeft <= 0) {
      self.timeLeft = 0;
      if (!self.playerChoice) self.gameOver(false);
    }
  }, 1000);
};

LotteryBattleGame.prototype.makeChoice = function(choice) {
  this.playerChoice = choice;
  const fortunes = ['大吉', '中吉', '小吉', '吉', '凶', '大凶'];
  this.computerChoice = fortunes[Math.floor(Math.random() * fortunes.length)];
  
  const ranks = { '大凶': 0, '凶': 1, '吉': 3, '小吉': 4, '中吉': 5, '大吉': 6 };
  const p = ranks[choice];
  const c = ranks[this.computerChoice];
  
  this.result = p > c ? 'win' : p < c ? 'lose' : 'draw';
  const self = this;
  setTimeout(function() { self.gameOver(self.result === 'win'); }, 500);
};

LotteryBattleGame.prototype.gameOver = function(win) {
  if (this.isGameOver) return;
  this.isGameOver = true;
  if (this.timer) clearInterval(this.timer);
  if (this.onGameEnd) this.onGameEnd(win);
};

LotteryBattleGame.prototype.update = function(dt) {};
LotteryBattleGame.prototype.onTouchMove = function(e) {};
LotteryBattleGame.prototype.onTouchEnd = function(e) {};

LotteryBattleGame.prototype.render = function() {
  this.ctx.fillStyle = '#1A1A2E';
  this.ctx.fillRect(0, 0, this.width, this.height);

  this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
  this.ctx.fillRect(0, 0, this.width, 50);

  this.ctx.fillStyle = '#666666';
  this.ctx.beginPath();
  safeRoundRect(this.ctx,8, 8, 50, 34, 6);
  this.ctx.fill();
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.font = 'bold 12px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.fillText('暂停', 33, 30);

  this.ctx.font = 'bold 16px Arial';
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.textAlign = 'center';
  this.ctx.fillText('抽签对决', this.width / 2, 20);

  this.ctx.font = '12px Arial';
  this.ctx.fillStyle = '#AAAAAA';
  this.ctx.fillText('⏱ 00:' + this.timeLeft.toString().padStart(2, '0'), this.width / 2, 38);

  this.ctx.fillStyle = '#666666';
  this.ctx.beginPath();
  safeRoundRect(this.ctx,this.width - 58, 8, 50, 34, 6);
  this.ctx.fill();
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.font = 'bold 16px Arial';
  this.ctx.fillText('←', this.width - 33, 31);

  if (!this.playerChoice) {
    const fortunes = ['大吉', '中吉', '小吉', '吉', '凶', '大凶'];
    const colors = { '大吉': '#FFD700', '中吉': '#FFA500', '小吉': '#90EE90', '吉': '#87CEEB', '凶': '#FF6B6B', '大凶': '#8B0000' };
    
    for (let i = 0; i < fortunes.length; i++) {
      const f = fortunes[i];
      const y = 140 + i * 50;
      this.ctx.fillStyle = colors[f];
      this.ctx.fillRect(this.width / 2 - 60, y, 120, 40);
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.strokeRect(this.width / 2 - 60, y, 120, 40);
      this.ctx.font = 'bold 18px Arial';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText(f, this.width / 2, y + 26);
    }
  } else {
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillStyle = '#AAAAAA';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('你的签', this.width / 2, 160);
    this.ctx.font = 'bold 36px Arial';
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText(this.playerChoice, this.width / 2, 210);

    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillStyle = '#AAAAAA';
    this.ctx.fillText('对手的签', this.width / 2, 280);
    this.ctx.font = 'bold 36px Arial';
    this.ctx.fillStyle = '#FF6B6B';
    this.ctx.fillText(this.computerChoice, this.width / 2, 330);

    if (this.result) {
      this.ctx.font = 'bold 32px Arial';
      this.ctx.fillStyle = this.result === 'win' ? '#4CAF50' : this.result === 'lose' ? '#F44336' : '#FF9800';
      this.ctx.fillText(
        this.result === 'win' ? '你赢了!' : this.result === 'lose' ? '你输了!' : '平局!',
        this.width / 2, 450
      );
    }
  }
};

LotteryBattleGame.prototype.onTouchStart = function(e) {
  if (!e.touches || e.touches.length === 0) return;
  const touch = e.touches[0];
  const tx = touch.clientX || touch.x;
  const ty = touch.clientY || touch.y;
  if (tx === undefined || ty === undefined) return;
  
  if (tx >= 8 && tx <= 58 && ty >= 8 && ty <= 42) {
    this.pause();
    return;
  }
  
  if (tx >= this.width - 58 && tx <= this.width - 8 && ty >= 8 && ty <= 42) {
    if (this.onExit) this.onExit();
    return;
  }
  
  if (this.isPaused || this.playerChoice || this.isGameOver) return;
  
  const fortunes = ['大吉', '中吉', '小吉', '吉', '凶', '大凶'];
  for (let i = 0; i < fortunes.length; i++) {
    const y = 140 + i * 50;
    if (tx >= this.width / 2 - 60 && tx <= this.width / 2 + 60 &&
        ty >= y && ty <= y + 40) {
      this.makeChoice(fortunes[i]);
    }
  }
};

// 躲避障碍游戏
function DodgeObstacleGame(canvas) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.width = canvas.width;
  this.height = canvas.height;
  this.game = { id: 'dodge_obstacle', name: '躲避障碍', duration: 25 };
  this.timeLeft = this.game.duration;
  this.isGameOver = false;
  this.isPaused = false;
  this.player = { x: 0, y: 0, width: 30, height: 30 };
  this.obstacles = [];
  this.score = 0;
  this.needScore = 10;
  this.obstacleTimer = 0;
  this.timer = null;
  this.onGameEnd = null;
  this.onPause = null;
}

DodgeObstacleGame.prototype.pause = function() {
  this.isPaused = true;
  if (this.onPause) this.onPause();
};

DodgeObstacleGame.prototype.onEnter = function() {
  this.player.x = this.width / 2 - this.player.width / 2;
  this.player.y = this.height - 100;
  this.obstacles = [];
  this.score = 0;
  this.obstacleTimer = 0;
  this.startTimer();
};

DodgeObstacleGame.prototype.onExit = function() {
  if (this.timer) clearInterval(this.timer);
};

DodgeObstacleGame.prototype.startTimer = function() {
  const self = this;
  this.timer = setInterval(function() {
    if (self.isPaused) return;
    self.timeLeft -= 1;
    if (self.timeLeft <= 0) {
      self.timeLeft = 0;
      self.gameOver(self.score >= self.needScore);
    }
  }, 1000);
};

DodgeObstacleGame.prototype.update = function(dt) {
  if (this.isPaused || this.isGameOver) return;
  this.obstacleTimer += dt * 1000;
  if (this.obstacleTimer > 800) {
    this.obstacleTimer = 0;
    this.obstacles.push({
      x: Math.random() * (this.width - 40),
      y: -40,
      width: 30 + Math.random() * 30,
      height: 30,
      speed: 180 + Math.random() * 80
    });
  }

  for (let i = 0; i < this.obstacles.length; i++) {
    this.obstacles[i].y += this.obstacles[i].speed * dt;
  }
  
  this.obstacles = this.obstacles.filter((function(o) {
    if (o.y > this.height) {
      this.score++;
      if (this.score >= this.needScore) {
        this.gameOver(true);
      }
      return false;
    }
    if (this.checkCollision(o)) {
      this.gameOver(false);
      return true;
    }
    return true;
  }).bind(this));
};

DodgeObstacleGame.prototype.checkCollision = function(o) {
  return this.player.x < o.x + o.width &&
         this.player.x + this.player.width > o.x &&
         this.player.y < o.y + o.height &&
         this.player.y + this.player.height > o.y;
};

DodgeObstacleGame.prototype.gameOver = function(win) {
  if (this.isGameOver) return;
  this.isGameOver = true;
  if (this.timer) clearInterval(this.timer);
  if (this.onGameEnd) this.onGameEnd(win);
};

DodgeObstacleGame.prototype.onTouchEnd = function(e) {};

DodgeObstacleGame.prototype.onTouchStart = function(e) {
  if (!e.touches || e.touches.length === 0) return;
  const touch = e.touches[0];
  const tx = touch.clientX || touch.x;
  const ty = touch.clientY || touch.y;
  if (tx === undefined || ty === undefined) return;
  
  if (tx >= 8 && tx <= 58 && ty >= 8 && ty <= 42) {
    this.pause();
    return;
  }
  
  if (tx >= this.width - 58 && tx <= this.width - 8 && ty >= 8 && ty <= 42) {
    if (this.onExit) this.onExit();
    return;
  }
  
  if (this.isPaused) return;
  this.player.x = tx - this.player.width / 2;
  this.player.x = Math.max(0, Math.min(this.width - this.player.width, this.player.x));
};

DodgeObstacleGame.prototype.render = function() {
  this.ctx.fillStyle = '#1A1A2E';
  this.ctx.fillRect(0, 0, this.width, this.height);

  this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
  this.ctx.fillRect(0, 0, this.width, 50);

  this.ctx.fillStyle = '#666666';
  this.ctx.beginPath();
  safeRoundRect(this.ctx,8, 8, 50, 34, 6);
  this.ctx.fill();
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.font = 'bold 12px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.fillText('暂停', 33, 30);

  this.ctx.font = 'bold 16px Arial';
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.textAlign = 'center';
  this.ctx.fillText('躲避障碍', this.width / 2, 20);

  this.ctx.font = '12px Arial';
  this.ctx.fillStyle = '#AAAAAA';
  this.ctx.fillText('⏱ ' + Math.floor(this.timeLeft / 60) + ':' + (this.timeLeft % 60).toString().padStart(2, '0'), this.width / 2, 38);

  this.ctx.fillStyle = '#666666';
  this.ctx.beginPath();
  safeRoundRect(this.ctx,this.width - 58, 8, 50, 34, 6);
  this.ctx.fill();
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.font = 'bold 16px Arial';
  this.ctx.fillText('←', this.width - 33, 31);

  this.ctx.font = 'bold 18px Arial';
  this.ctx.fillStyle = '#FFD700';
  this.ctx.textAlign = 'center';
  this.ctx.fillText('目标: 躲避 ' + this.score + ' 个', this.width / 2, 75);

  this.ctx.fillStyle = '#4CAF50';
  this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

  this.ctx.fillStyle = '#F44336';
  for (let i = 0; i < this.obstacles.length; i++) {
    const o = this.obstacles[i];
    this.ctx.fillRect(o.x, o.y, o.width, o.height);
  }
};

DodgeObstacleGame.prototype.onTouchMove = function(e) {
  if (this.isPaused) return;
  const touch = e.touches[0];
  this.player.x = touch.x - this.player.width / 2;
  this.player.x = Math.max(0, Math.min(this.width - this.player.width, this.player.x));
};

// 弹球入洞游戏
function BallHoleGame(canvas) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.width = canvas.width;
  this.height = canvas.height;
  this.timeLeft = 25;
  this.isGameOver = false;
  this.isPaused = false;
  this.ball = { x: 0, y: 0, radius: 15, vx: 0, vy: 0 };
  this.hole = { x: 0, y: 0, radius: 25 };
  this.hitCount = 0;
  this.needHits = 3;
  this.timer = null;
  this.onGameEnd = null;
  this.onPause = null;
  this.game = { id: 'ball_hole', name: '弹球入洞', duration: 25 };
}

BallHoleGame.prototype.pause = function() {
  this.isPaused = true;
  if (this.onPause) this.onPause();
};

BallHoleGame.prototype.onEnter = function() {
  this.resetBall();
  this.hole.x = this.width / 2 + (Math.random() - 0.5) * 100;
  this.hole.y = 150;
  this.startTimer();
};

BallHoleGame.prototype.onExit = function() {
  if (this.timer) clearInterval(this.timer);
};

BallHoleGame.prototype.startTimer = function() {
  const self = this;
  this.timer = setInterval(function() {
    self.timeLeft -= 1;
    if (self.timeLeft <= 0) {
      self.timeLeft = 0;
      self.gameOver(self.hitCount >= self.needHits);
    }
  }, 1000);
};

BallHoleGame.prototype.resetBall = function() {
  this.ball.x = this.width / 2;
  this.ball.y = this.height - 150;
  this.ball.vx = 0;
  this.ball.vy = 0;
};

BallHoleGame.prototype.shoot = function(power, angle) {
  if (this.isGameOver || (this.ball.vx !== 0 || this.ball.vy !== 0)) return;
  this.ball.vx = Math.cos(angle) * power;
  this.ball.vy = Math.sin(angle) * power;
};

BallHoleGame.prototype.update = function(dt) {
  if (this.isPaused || this.isGameOver) return;
  if (this.ball.vx === 0 && this.ball.vy === 0) return;

  this.ball.x += this.ball.vx * dt;
  this.ball.y += this.ball.vy * dt;
  this.ball.vy += 500 * dt;

  if (this.ball.x < this.ball.radius || this.ball.x > this.width - this.ball.radius) {
    this.ball.vx *= -0.8;
    this.ball.x = Math.max(this.ball.radius, Math.min(this.width - this.ball.radius, this.ball.x));
  }
  if (this.ball.y > this.height - this.ball.radius) {
    this.ball.vy *= -0.6;
    this.ball.vx *= 0.9;
    this.ball.y = this.height - this.ball.radius;
  }

  const dx = this.ball.x - this.hole.x;
  const dy = this.ball.y - this.hole.y;
  if (Math.sqrt(dx * dx + dy * dy) < this.hole.radius - 5) {
    this.hitCount++;
    if (this.hitCount >= this.needHits) {
      this.gameOver(true);
    } else {
      this.resetBall();
    }
  }

  if (this.ball.y < -100 || this.ball.y > this.height + 100) {
    this.resetBall();
  }
};

BallHoleGame.prototype.gameOver = function(win) {
  if (this.isGameOver) return;
  this.isGameOver = true;
  if (this.timer) clearInterval(this.timer);
  if (this.onGameEnd) this.onGameEnd(win);
};

BallHoleGame.prototype.onTouchEnd = function(e) {};

BallHoleGame.prototype.render = function() {
  this.ctx.fillStyle = '#1A1A2E';
  this.ctx.fillRect(0, 0, this.width, this.height);

  this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
  this.ctx.fillRect(0, 0, this.width, 50);

  this.ctx.fillStyle = '#666666';
  this.ctx.beginPath();
  safeRoundRect(this.ctx,8, 8, 50, 34, 6);
  this.ctx.fill();
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.font = 'bold 12px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.fillText('暂停', 33, 30);

  this.ctx.font = 'bold 16px Arial';
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.textAlign = 'center';
  this.ctx.fillText('弹球入洞', this.width / 2, 20);

  this.ctx.font = '12px Arial';
  this.ctx.fillStyle = '#AAAAAA';
  this.ctx.fillText('⏱ ' + Math.floor(this.timeLeft / 60) + ':' + (this.timeLeft % 60).toString().padStart(2, '0'), this.width / 2, 38);

  this.ctx.fillStyle = '#666666';
  this.ctx.beginPath();
  safeRoundRect(this.ctx,this.width - 58, 8, 50, 34, 6);
  this.ctx.fill();
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.font = 'bold 16px Arial';
  this.ctx.fillText('←', this.width - 33, 31);

  this.ctx.textAlign = 'center';
  this.ctx.fillText('入洞 ' + this.hitCount + '/' + this.needHits, this.width / 2, 75);

  this.ctx.fillStyle = '#333';
  this.ctx.beginPath();
  this.ctx.arc(this.hole.x, this.hole.y, this.hole.radius, 0, Math.PI * 2);
  this.ctx.fill();

  this.ctx.fillStyle = '#4CAF50';
  this.ctx.beginPath();
  this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
  this.ctx.fill();

  if (this.ball.vx === 0 && this.ball.vy === 0) {
    this.ctx.font = '14px Arial';
    this.ctx.fillStyle = '#AAAAAA';
    this.ctx.fillText('点击屏幕瞄准发射', this.width / 2, this.height - 50);
  }
};

BallHoleGame.prototype.onTouchStart = function(e) {
  if (!e.touches || e.touches.length === 0) return;
  const touch = e.touches[0];
  const tx = touch.clientX || touch.x;
  const ty = touch.clientY || touch.y;
  if (tx === undefined || ty === undefined) return;
  
  if (tx >= 8 && tx <= 58 && ty >= 8 && ty <= 42) {
    this.pause();
    return;
  }
  
  if (tx >= this.width - 58 && tx <= this.width - 8 && ty >= 8 && ty <= 42) {
    if (this.onExit) this.onExit();
    return;
  }
  
  if (this.isPaused || this.isGameOver || (this.ball.vx !== 0 || this.ball.vy !== 0)) return;
  const dx = tx - this.ball.x;
  const dy = ty - this.ball.y;
  const angle = Math.atan2(dy, dx);
  const power = Math.min(Math.sqrt(dx * dx + dy * dy) * 0.5, 400);
  this.shoot(power, angle);
};

// 数字华容道游戏
function NumberPuzzleGame(canvas) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.width = canvas.width;
  this.height = canvas.height;
  this.timeLeft = 30;
  this.isGameOver = false;
  this.isPaused = false;
  this.gridSize = 3;
  this.tileSize = 80;
  this.grid = [];
  this.emptyPos = { r: 2, c: 2 };
  this.moves = 0;
  this.timer = null;
  this.offsetX = 0;
  this.offsetY = 0;
  this.onGameEnd = null;
  this.onPause = null;
  this.game = { id: 'number_puzzle', name: '数字华容道', duration: 30 };
}

NumberPuzzleGame.prototype.pause = function() {
  this.isPaused = true;
  if (this.onPause) this.onPause();
};

NumberPuzzleGame.prototype.onEnter = function() {
  this.offsetX = (this.width - this.tileSize * this.gridSize) / 2;
  this.offsetY = 150;
  this.initGrid();
  this.startTimer();
};

NumberPuzzleGame.prototype.onExit = function() {
  if (this.timer) clearInterval(this.timer);
};

NumberPuzzleGame.prototype.startTimer = function() {
  const self = this;
  this.timer = setInterval(function() {
    self.timeLeft -= 1;
    if (self.timeLeft <= 0) {
      self.timeLeft = 0;
      self.gameOver(false);
    }
  }, 1000);
};

NumberPuzzleGame.prototype.initGrid = function() {
  this.grid = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  this.emptyPos = { r: 2, c: 2 };
  const moves = 100;
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (let i = 0; i < moves; i++) {
    const validMoves = directions.filter((function(dir) {
      const nr = this.emptyPos.r + dir[0];
      const nc = this.emptyPos.c + dir[1];
      return nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize;
    }).bind(this));
    const dir = validMoves[Math.floor(Math.random() * validMoves.length)];
    const nr = this.emptyPos.r + dir[0];
    const nc = this.emptyPos.c + dir[1];
    const emptyIdx = this.emptyPos.r * this.gridSize + this.emptyPos.c;
    const targetIdx = nr * this.gridSize + nc;
    this.grid[emptyIdx] = this.grid[targetIdx];
    this.grid[targetIdx] = 0;
    this.emptyPos.r = nr;
    this.emptyPos.c = nc;
  }
  this.moves = 0;
};

NumberPuzzleGame.prototype.updateEmptyPos = function() {
  const idx = this.grid.indexOf(0);
  this.emptyPos.r = Math.floor(idx / this.gridSize);
  this.emptyPos.c = idx % this.gridSize;
};

NumberPuzzleGame.prototype.isSolved = function() {
  for (let i = 0; i < 8; i++) {
    if (this.grid[i] !== i + 1) return false;
  }
  return this.grid[8] === 0;
};

NumberPuzzleGame.prototype.tap = function(r, c) {
  if (this.isGameOver) return;
  const dr = Math.abs(r - this.emptyPos.r);
  const dc = Math.abs(c - this.emptyPos.c);
  if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
    const emptyIdx = this.emptyPos.r * this.gridSize + this.emptyPos.c;
    const tapIdx = r * this.gridSize + c;
    const tmp = this.grid[emptyIdx];
    this.grid[emptyIdx] = this.grid[tapIdx];
    this.grid[tapIdx] = tmp;
    this.updateEmptyPos();
    this.moves++;
    if (this.isSolved()) {
      this.gameOver(true);
    }
  }
};

NumberPuzzleGame.prototype.gameOver = function(win) {
  if (this.isGameOver) return;
  this.isGameOver = true;
  if (this.timer) clearInterval(this.timer);
  if (this.onGameEnd) this.onGameEnd(win);
};

NumberPuzzleGame.prototype.update = function(dt) {};
NumberPuzzleGame.prototype.onTouchMove = function(e) {};
NumberPuzzleGame.prototype.onTouchEnd = function(e) {};

NumberPuzzleGame.prototype.render = function() {
  this.ctx.fillStyle = '#1A1A2E';
  this.ctx.fillRect(0, 0, this.width, this.height);

  this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
  this.ctx.fillRect(0, 0, this.width, 50);

  this.ctx.fillStyle = '#666666';
  this.ctx.beginPath();
  safeRoundRect(this.ctx,8, 8, 50, 34, 6);
  this.ctx.fill();
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.font = 'bold 12px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.fillText('暂停', 33, 30);

  this.ctx.font = 'bold 16px Arial';
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.textAlign = 'center';
  this.ctx.fillText('数字华容道', this.width / 2, 20);

  this.ctx.font = '12px Arial';
  this.ctx.fillStyle = '#AAAAAA';
  this.ctx.fillText('⏱ ' + Math.floor(this.timeLeft / 60) + ':' + (this.timeLeft % 60).toString().padStart(2, '0'), this.width / 2, 38);

  this.ctx.fillStyle = '#666666';
  this.ctx.beginPath();
  safeRoundRect(this.ctx,this.width - 58, 8, 50, 34, 6);
  this.ctx.fill();
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.font = 'bold 16px Arial';
  this.ctx.fillText('←', this.width - 33, 31);

  this.ctx.font = 'bold 18px Arial';
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.textAlign = 'center';
  this.ctx.fillText('移动 ' + this.moves + ' 次', this.width / 2, 75);

  for (let r = 0; r < this.gridSize; r++) {
    for (let c = 0; c < this.gridSize; c++) {
      const x = this.offsetX + c * this.tileSize;
      const y = this.offsetY + r * this.tileSize;
      const value = this.grid[r * this.gridSize + c];

      this.ctx.fillStyle = value ? '#4A4A7E' : '#2A2A4E';
      this.ctx.fillRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);

      if (value) {
        this.ctx.font = 'bold 32px Arial';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(value.toString(), x + this.tileSize / 2, y + this.tileSize / 2);
      }
    }
  }

  this.ctx.font = '14px Arial';
  this.ctx.fillStyle = '#AAAAAA';
  this.ctx.fillText('点击数字旁边的空格移动', this.width / 2, this.height - 30);
};

NumberPuzzleGame.prototype.onTouchStart = function(e) {
  if (!e.touches || e.touches.length === 0) return;
  const touch = e.touches[0];
  const tx = touch.clientX || touch.x;
  const ty = touch.clientY || touch.y;
  if (tx === undefined || ty === undefined) return;
  
  if (tx >= 8 && tx <= 58 && ty >= 8 && ty <= 42) {
    this.pause();
    return;
  }
  
  if (tx >= this.width - 58 && tx <= this.width - 8 && ty >= 8 && ty <= 42) {
    if (this.onExit) this.onExit();
    return;
  }
  
  if (this.isPaused) return;
  
  const c = Math.floor((tx - this.offsetX) / this.tileSize);
  const r = Math.floor((ty - this.offsetY) / this.tileSize);
  if (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize) {
    this.tap(r, c);
  }
};

// 星际战机 - 参考战机666
function SimpleShootingGame(canvas) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.width = canvas.width;
  this.height = canvas.height;
  this.game = { id: 'simple_shooting', name: '星际战机', duration: 40 };
  this.timeLeft = this.game.duration;
  this.isGameOver = false;
  this.player = { x: 0, y: 0, width: 72, height: 72, targetX: 0, targetY: 0, speed: 0.15, hp: 10, maxHp: 10 };
  // ---- 让战机「竖起来」：机头尽量朝屏幕正上方，和子弹一条竖线 ----
  // 只改 playerSpriteRotationDeg（度）。负数 = 逆时针旋转整张图。
  // 机头还朝「右上」→ 把数再调负一点（如 -58、-62）；机头朝「左上」了→ 往 0 收（如 -48、-44）。
  // 说明：player.png 是斜透视 3D 渲染，再怎么转也像「歪着拍照的飞机」，不可能和矢量机一样完全竖直；
  //      若要观感完全竖直，请换「机头已朝上」的 2D 立绘/顶视透明 PNG，并把下面改成 0。
  this.playerSpriteRotationDeg = -45;
  // 机身「左右不平衡」：斜透视素材常见一侧机翼显低。旋转后做轻微错切 y += k*x（Canvas transform(1,k,0,1)）
  // 负值抬右侧、压左侧，一般试 -0.06～-0.14；过狠会畸形；0 关闭。无法替代换对称立绘。
  this.playerSpriteShearV = -0.1;
  this.bullets = [];
  this.enemies = [];
  this.enemyBullets = [];
  this.powerups = [];
  this.score = 0;
  this.needScore = 500;
  this.enemyTimer = 0;
  this.enemyShootTimer = 0;
  this.autoShootTimer = 0;
  this.timer = null;
  this.onGameEnd = null;
  this.bulletLevel = 1;
  this.shootInterval = 200;
  this.hasTripleShot = false;
  this.hasRapidFire = false;
  this.hasShield = false;
  this.shieldTime = 0;
  this.moveTouchId = -1;
  this.isPaused = false;
  this.onPause = null;
  this.explosionEffects = [];
  this.audioManager = null;
  this.stars = [];
  this.nebulas = [];
  this.powerupTimeouts = [];
  this.shakeTime = 0;
  this.shakeIntensity = 0;
  this.wingmen = [];
  this.hasSupportTurret = false;
  this.turretTimer = 0;
  this.skillPickIndex = 0;
  this.engineFlame = 0;
  this.shootingStars = [];
  this.shootingStarTimer = 0;
  this.finalBossWarning = 0;
  this.finalBossWarningTime = 0;
  this.finalBoss = null;
  this.finalBossSpawned = false;
  this.finalBossDefeated = false;
  this.bossBulletTimer = 0;
  this.bossPatternTimer = 0;
  this.bossPattern = 0;
  this.shootingImages = [];
  this.enemyImages = {};
  this.bulletImages = {};
  this.powerupImages = {};
  this.loadImages();
  this.loadBackgrounds();
}

SimpleShootingGame.prototype.loadBackgrounds = function() {
  var self = this;
  // 星际战机滚动背景：换图时改下列路径即可（相对小游戏根目录）
  var bgSrcs = [
    'assets/background/01.png',
    'assets/background/02.png',
    'assets/background/03.png',
    'assets/background/04.png'
  ];
  this.bgImages = [];
  this.bgImagesLoaded = 0;
  this.bgCount = bgSrcs.length;
  this.bgScrollY = 0;
  this.bgSpeed = 30;
  for (var i = 0; i < bgSrcs.length; i++) {
    var img = wx.createImage();
    img.loaded = false;
    img.index = i;
    img.onload = function() {
      this.loaded = true;
      self.bgImagesLoaded++;
    };
    img.src = bgSrcs[i];
    this.bgImages.push(img);
  }
};

SimpleShootingGame.prototype.loadImages = function() {
  var self = this;
  
  this.playerImg = wx.createImage();
  this.playerImgLoaded = false;
  this.playerImg.onload = function() { self.playerImgLoaded = true; };
  this.playerImg.onerror = function() {
    self.playerImgLoaded = false;
    console.warn('[SimpleShooting] 战机图加载失败，使用矢量绘制。路径: assets/player/player.png');
  };
  this.playerImg.src = 'assets/player/player.png';
  
  this.enemyImgNormal = wx.createImage();
  this.enemyImgNormalLoaded = false;
  this.enemyImgNormal.onload = function() { self.enemyImgNormalLoaded = true; };
  this.enemyImgNormal.src = 'assets/images/enemy_normal.png';
  
  this.enemyImgFast = wx.createImage();
  this.enemyImgFastLoaded = false;
  this.enemyImgFast.onload = function() { self.enemyImgFastLoaded = true; };
  this.enemyImgFast.src = 'assets/images/enemy_fast.png';
  
  this.enemyImgZigzag = wx.createImage();
  this.enemyImgZigzagLoaded = false;
  this.enemyImgZigzag.onload = function() { self.enemyImgZigzagLoaded = true; };
  this.enemyImgZigzag.src = 'assets/images/enemy_zigzag.png';
  
  this.enemyImgTough = wx.createImage();
  this.enemyImgToughLoaded = false;
  this.enemyImgTough.onload = function() { self.enemyImgToughLoaded = true; };
  this.enemyImgTough.src = 'assets/images/enemy_tough.png';
  
  this.enemyImgBoss = wx.createImage();
  this.enemyImgBossLoaded = false;
  this.enemyImgBoss.onload = function() { self.enemyImgBossLoaded = true; };
  this.enemyImgBoss.src = 'assets/images/enemy_boss.png';
  
  this.bulletImgPlayer = wx.createImage();
  this.bulletImgPlayerLoaded = false;
  this.bulletImgPlayer.onload = function() { self.bulletImgPlayerLoaded = true; };
  this.bulletImgPlayer.src = 'assets/images/bullet_player.png';
  
  this.bulletImgEnemy = wx.createImage();
  this.bulletImgEnemyLoaded = false;
  this.bulletImgEnemy.onload = function() { self.bulletImgEnemyLoaded = true; };
  this.bulletImgEnemy.src = 'assets/images/bullet_enemy.png';
  
  this.powerupImgHeal = wx.createImage();
  this.powerupImgHealLoaded = false;
  this.powerupImgHeal.onload = function() { self.powerupImgHealLoaded = true; };
  this.powerupImgHeal.src = 'assets/images/powerup_heal.png';
  
  this.powerupImgPower = wx.createImage();
  this.powerupImgPowerLoaded = false;
  this.powerupImgPower.onload = function() { self.powerupImgPowerLoaded = true; };
  this.powerupImgPower.src = 'assets/images/powerup_power.png';
  
  this.powerupImgShield = wx.createImage();
  this.powerupImgShieldLoaded = false;
  this.powerupImgShield.onload = function() { self.powerupImgShieldLoaded = true; };
  this.powerupImgShield.src = 'assets/images/powerup_shield.png';
};

SimpleShootingGame.prototype.generateAsteroidVertices = function(size, variation) {
  var verts = [];
  var numVerts = Math.floor(Math.random() * 4) + 6;
  for (var i = 0; i < numVerts; i++) {
    var angle = (Math.PI * 2 / numVerts) * i;
    var r = size + (Math.random() - 0.5) * variation;
    verts.push({ angle: angle, r: r });
  }
  return verts;
};

SimpleShootingGame.prototype.pause = function() {
  this.isPaused = true;
  this.shakeTime = 0;
  this.shakeIntensity = 0;
  if (this.onPause) this.onPause();
};

SimpleShootingGame.prototype.onResume = function() {
  this.isPaused = false;
  this.lastTime = Date.now();
};

SimpleShootingGame.prototype.onEnter = function() {
  this.player.x = this.width / 2 - this.player.width / 2;
  this.player.y = this.height - 180;
  this.player.targetX = this.player.x;
  this.player.targetY = this.player.y;
  this.player.hp = this.player.maxHp;
  this.bullets = [];
  this.enemies = [];
  this.enemyBullets = [];
  this.powerups = [];
  this.score = 0;
  this.bulletLevel = 1;
  this.shootInterval = 200;
  this.hasTripleShot = false;
  this.hasRapidFire = false;
  this.hasShield = false;
  this.hasSupportTurret = false;
  this.shieldTime = 0;
  this.moveTouchId = -1;
  this.enemyTimer = 0;
  this.enemyShootTimer = 0;
  this.autoShootTimer = 0;
  this.turretTimer = 0;
  this.explosionEffects = [];
  this.shakeTime = 0;
  this.skillPickIndex = 0;
  this.wingmen = [];
  this.stars = [];
  for (let i = 0; i < 150; i++) {
    var layer = Math.random() < 0.3 ? 0 : Math.random() < 0.6 ? 1 : 2;
    var starConfig = [
      { sizeMin: 0.5, sizeMax: 1.2, speedMin: 40, speedMax: 80, alphaMin: 0.3, alphaMax: 0.5 },
      { sizeMin: 1.0, sizeMax: 2.0, speedMin: 80, speedMax: 160, alphaMin: 0.5, alphaMax: 0.8 },
      { sizeMin: 1.5, sizeMax: 3.0, speedMin: 140, speedMax: 250, alphaMin: 0.7, alphaMax: 1.0 }
    ][layer];
    this.stars.push({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      size: Math.random() * (starConfig.sizeMax - starConfig.sizeMin) + starConfig.sizeMin,
      speed: Math.random() * (starConfig.speedMax - starConfig.speedMin) + starConfig.speedMin,
      alpha: Math.random() * (starConfig.alphaMax - starConfig.alphaMin) + starConfig.alphaMin,
      layer: layer,
      twinkleSpeed: Math.random() * 3 + 1,
      twinkleOffset: Math.random() * Math.PI * 2
    });
  }
  this.nebulas = [];
  for (let i = 0; i < 8; i++) {
    var nebulaColors = [
      { r: 26, g: 10, b: 62 },
      { r: 10, g: 26, b: 62 },
      { r: 26, g: 10, b: 46 },
      { r: 10, g: 42, b: 62 },
      { r: 42, g: 10, b: 62 },
      { r: 10, g: 58, b: 46 },
      { r: 62, g: 10, b: 30 },
      { r: 10, g: 30, b: 58 }
    ];
    var nc = nebulaColors[i % nebulaColors.length];
    this.nebulas.push({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      radius: Math.random() * 150 + 60,
      color: 'rgb(' + nc.r + ',' + nc.g + ',' + nc.b + ')',
      alpha: Math.random() * 0.15 + 0.03,
      speed: Math.random() * 30 + 10,
      innerColor: 'rgba(' + (nc.r + 40) + ',' + (nc.g + 20) + ',' + (nc.b + 30) + ',0.3)'
    });
  }
  this.shootingStars = [];
  this.shootingStarTimer = 0;
  this.planets = [];
  for (let i = 0; i < 3; i++) {
    this.planets.push({
      x: Math.random() * this.width,
      y: -Math.random() * this.height * 2,
      radius: Math.random() * 40 + 20,
      speed: Math.random() * 10 + 5,
      color: ['#2A1A3E', '#1A2A3E', '#2A1A2E'][i],
      ringColor: ['#4A3A5E', '#3A4A5E', '#4A3A4E'][i],
      hasRing: Math.random() > 0.5
    });
  }
  this.asteroids = [];
  for (let i = 0; i < 8; i++) {
    this.asteroids.push({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      size: Math.random() * 8 + 3,
      speed: Math.random() * 30 + 15,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      vertices: this.generateAsteroidVertices(Math.random() * 8 + 3, Math.random() * 3 + 2)
    });
  }
  this.dustParticles = [];
  for (let i = 0; i < 40; i++) {
    this.dustParticles.push({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 20 + 10,
      alpha: Math.random() * 0.3 + 0.1,
      drift: (Math.random() - 0.5) * 0.5
    });
  }
  this.engineParticles = [];
  this.finalBossWarning = 0;
  this.finalBossWarningTime = 0;
  this.finalBoss = null;
  this.finalBossSpawned = false;
  this.finalBossDefeated = false;
  this.bossBulletTimer = 0;
  this.bossPatternTimer = 0;
  this.bossPattern = 0;
  this.bossSpawnTimer = 0;
  this.bossSpawnInterval = 10;
  this.planets = [];
  for (let i = 0; i < 3; i++) {
    this.planets.push({
      x: Math.random() * this.width,
      y: -Math.random() * this.height * 2,
      radius: Math.random() * 40 + 20,
      speed: Math.random() * 10 + 5,
      color: ['#2A1A3E', '#1A2A3E', '#2A1A2E'][i],
      ringColor: ['#4A3A5E', '#3A4A5E', '#4A3A4E'][i],
      hasRing: Math.random() > 0.5
    });
  }
  this.asteroids = [];
  for (let i = 0; i < 8; i++) {
    this.asteroids.push({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      size: Math.random() * 8 + 3,
      speed: Math.random() * 30 + 15,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      vertices: this.generateAsteroidVertices(Math.random() * 8 + 3, Math.random() * 3 + 2)
    });
  }
  this.dustParticles = [];
  for (let i = 0; i < 40; i++) {
    this.dustParticles.push({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 20 + 10,
      alpha: Math.random() * 0.3 + 0.1,
      drift: (Math.random() - 0.5) * 0.5
    });
  }
  this.engineParticles = [];
  this.startTimer();
};

SimpleShootingGame.prototype.onExit = function() {
  if (this.timer) clearInterval(this.timer);
};

SimpleShootingGame.prototype.startTimer = function() {
  const self = this;
  this.timer = setInterval(function() {
    if (self.isPaused) return;
    self.timeLeft -= 1;
    if (self.timeLeft <= 0) {
      self.timeLeft = 0;
      self.gameOver(self.score >= self.needScore);
    }
  }, 1000);
};

SimpleShootingGame.prototype.update = function(dt) {
  if (this.isPaused) return;
  
  this.bgScrollY += this.bgSpeed * dt;
  
  this.player.x += (this.player.targetX - this.player.x) * this.player.speed;
  this.player.y += (this.player.targetY - this.player.y) * this.player.speed;
  
  // Y轴仅限制不低于顶部状态栏
  this.player.y = Math.max(60, this.player.y);
  
  this.engineFlame += dt * 15;
  
  for (let i = 0; i < this.stars.length; i++) {
    this.stars[i].y += this.stars[i].speed * dt;
    this.stars[i].x += this.stars[i].speed * 0.15 * dt;
    if (this.stars[i].y > this.height) {
      this.stars[i].y = 0;
      this.stars[i].x = Math.random() * this.width;
    }
    if (this.stars[i].x > this.width) {
      this.stars[i].x = 0;
    }
  }
  
  for (let i = 0; i < this.nebulas.length; i++) {
    this.nebulas[i].y += this.nebulas[i].speed * dt;
    this.nebulas[i].x += this.nebulas[i].speed * 0.12 * dt;
    if (this.nebulas[i].y - this.nebulas[i].radius > this.height) {
      this.nebulas[i].y = -this.nebulas[i].radius;
      this.nebulas[i].x = Math.random() * this.width;
    }
    if (this.nebulas[i].x - this.nebulas[i].radius > this.width) {
      this.nebulas[i].x = -this.nebulas[i].radius;
    }
  }
  
  for (let i = 0; i < this.planets.length; i++) {
    this.planets[i].y += this.planets[i].speed * dt;
    if (this.planets[i].y - this.planets[i].radius > this.height) {
      this.planets[i].y = -this.planets[i].radius - Math.random() * 200;
      this.planets[i].x = Math.random() * this.width;
    }
  }
  
  for (let i = 0; i < this.asteroids.length; i++) {
    this.asteroids[i].y += this.asteroids[i].speed * dt;
    this.asteroids[i].rotation += this.asteroids[i].rotSpeed;
    if (this.asteroids[i].y > this.height + 20) {
      this.asteroids[i].y = -20;
      this.asteroids[i].x = Math.random() * this.width;
    }
  }
  
  for (let i = 0; i < this.dustParticles.length; i++) {
    this.dustParticles[i].y += this.dustParticles[i].speed * dt;
    this.dustParticles[i].x += this.dustParticles[i].drift;
    if (this.dustParticles[i].y > this.height) {
      this.dustParticles[i].y = 0;
      this.dustParticles[i].x = Math.random() * this.width;
    }
  }
  
  for (let i = this.engineParticles.length - 1; i >= 0; i--) {
    const p = this.engineParticles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) {
      this.engineParticles.splice(i, 1);
    }
  }
  
  if (Math.random() < 0.6) {
    var pcx = this.player.x + this.player.width / 2;
    this.engineParticles.push({
      x: pcx + (Math.random() - 0.5) * 8,
      y: this.player.y + this.player.height,
      vx: (Math.random() - 0.5) * 20,
      vy: Math.random() * 60 + 40,
      life: Math.random() * 0.3 + 0.2,
      maxLife: 0.5,
      size: Math.random() * 3 + 1
    });
  }
  
  this.autoShootTimer += dt * 1000;
  if (this.autoShootTimer >= this.shootInterval) {
    this.autoShootTimer = 0;
    this.autoShoot();
  }

  this.enemyTimer += dt * 1000;
  if (this.enemyTimer > 800) {
    this.enemyTimer = 0;
    this.spawnEnemy();
  }

  this.enemyShootTimer += dt * 1000;
  if (this.enemyShootTimer > 1200) {
    this.enemyShootTimer = 0;
    this.enemyShoot();
  }

  if (this.hasSupportTurret) {
    this.turretTimer += dt * 1000;
    if (this.turretTimer >= 300) {
      this.turretTimer = 0;
      this.turretShoot();
    }
  }

  for (let i = 0; i < this.wingmen.length; i++) {
    this.wingmen[i].shootTimer += dt * 1000;
    if (this.wingmen[i].shootTimer >= 400) {
      this.wingmen[i].shootTimer = 0;
      this.bullets.push({ x: this.wingmen[i].x, y: this.player.y + 10 });
    }
  }

  for (let i = this.bullets.length - 1; i >= 0; i--) {
    this.bullets[i].y -= 700 * dt;
    if (this.bullets[i].y < -20) {
      this.bullets.splice(i, 1);
    }
  }

  for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
    const b = this.enemyBullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.y > this.height + 20 || b.y < -20 || b.x < -20 || b.x > this.width + 20) {
      this.enemyBullets.splice(i, 1);
      continue;
    }
    if (this.enemyBullets[i] && this.checkEnemyBulletHitPlayer(this.enemyBullets[i])) {
      this.enemyBullets.splice(i, 1);
      if (!this.hasShield) {
        this.player.hp--;
        this.shakeTime = 0.25;
        this.shakeIntensity = 8;
        if (this.audioManager) this.audioManager.playHit();
        if (this.player.hp <= 0) {
          this.gameOver(false);
        }
      }
    }
  }

  for (let i = this.enemies.length - 1; i >= 0; i--) {
    const enemy = this.enemies[i];
    if (!enemy) continue;
    enemy.y += enemy.speed * dt;
    if (enemy.behavior === 'zigzag') {
      enemy.x += Math.sin(enemy.y * 0.015) * 3;
    } else if (enemy.behavior === 'sine') {
      enemy.x += Math.cos(enemy.y * 0.01) * 2;
    }
    enemy.x = Math.max(0, Math.min(this.width - enemy.width, enemy.x));

    for (let j = this.bullets.length - 1; j >= 0; j--) {
      const bullet = this.bullets[j];
      if (this.checkBulletHit(bullet, enemy)) {
        enemy.hp--;
        enemy.hitFlash = 0.1;
        this.bullets.splice(j, 1);
        if (enemy.hp <= 0) {
          this.addExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
          this.enemies.splice(i, 1);
          this.onEnemyDestroyed(enemy);
        }
        break;
      }
    }

    if (this.enemies[i] && this.enemies[i].y > this.height + 50) {
      this.enemies.splice(i, 1);
    }
  }

  for (let i = this.enemies.length - 1; i >= 0; i--) {
    const enemy = this.enemies[i];
    if (!enemy) continue;
    if (this.checkPlayerEnemyCollision(enemy)) {
      if (!this.hasShield) {
        this.player.hp -= 2;
        this.shakeTime = 0.25;
        this.shakeIntensity = 8;
        if (this.audioManager) this.audioManager.playHit();
        this.addExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        this.enemies.splice(i, 1);
        if (this.player.hp <= 0) {
          this.gameOver(false);
        }
      } else {
        this.addExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        this.enemies.splice(i, 1);
      }
    }
  }

  if (this.finalBoss) {
    var boss = this.finalBoss;
    boss.x += boss.vx * dt;
    if (boss.x < 10 || boss.x + boss.width > this.width - 10) {
      boss.vx *= -1;
      boss.x = Math.max(10, Math.min(this.width - boss.width - 10, boss.x));
    }
    if (boss.y < 80 && boss.phase === 'entering') {
      boss.y += 60 * dt;
      if (boss.y >= 80) {
        boss.y = 80;
        boss.phase = 'fighting';
      }
    }
    
    this.bossBulletTimer += dt * 1000;
    this.bossPatternTimer += dt * 1000;
    
    if (this.bossPatternTimer > 5000) {
      this.bossPatternTimer = 0;
      this.bossPattern = (this.bossPattern + 1) % 3;
    }
    
    if (this.bossBulletTimer > 400) {
      this.bossBulletTimer = 0;
      this.bossShoot();
    }
    
    for (let j = this.bullets.length - 1; j >= 0; j--) {
      const bullet = this.bullets[j];
      if (bullet.x > boss.x && bullet.x < boss.x + boss.width &&
          bullet.y > boss.y && bullet.y < boss.y + boss.height) {
        boss.hp--;
        boss.hitFlash = 0.1;
        this.bullets.splice(j, 1);
        if (boss.hp <= 0) {
          this.score += 100;
          this.addExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2);
          this.addExplosion(boss.x + boss.width / 4, boss.y + boss.height / 3);
          this.addExplosion(boss.x + boss.width * 3 / 4, boss.y + boss.height / 3);
          this.finalBoss = null;
          this.finalBossDefeated = true;
          if (this.score >= this.needScore) {
            this.gameOver(true);
          }
        }
        break;
      }
    }
  }
  
  this.bossSpawnTimer += dt;
  if (this.bossSpawnTimer >= this.bossSpawnInterval && !this.finalBoss) {
    this.bossSpawnTimer = 0;
    this.finalBossWarning = 1.5;
    this.enemies = [];
    var fbTaunts = [
      '受死吧打工人', '福报球降临', 'KPI清零炮', '末班地铁你也赶不上',
      '年终奖充公啦', '述职报告写了没', '终极甲方降临'
    ];
    var fbEmojis = ['😈', '👿', '🔥', '💀', '👹'];
    this.finalBoss = {
      x: this.width / 2 - 65,
      y: -120,
      width: 130,
      height: 130,
      hp: 80,
      maxHp: 80,
      vx: 80,
      phase: 'entering',
      hitFlash: 0,
      type: 'finalBoss',
      taunt: fbTaunts[Math.floor(Math.random() * fbTaunts.length)],
      emoji: fbEmojis[Math.floor(Math.random() * fbEmojis.length)]
    };
  }
  
  if (this.finalBossWarning > 0) {
    this.finalBossWarning -= dt;
  }

  for (let i = this.powerups.length - 1; i >= 0; i--) {
    const p = this.powerups[i];
    p.y += p.speed * dt;
    if (this.checkPowerupCollision(p)) {
      this.collectPowerup(p);
      this.powerups.splice(i, 1);
    } else if (p.y > this.height + 30) {
      this.powerups.splice(i, 1);
    }
  }

  if (this.hasShield) {
    this.shieldTime -= dt;
    if (this.shieldTime <= 0) {
      this.hasShield = false;
    }
  }
  
  if (this.shakeTime > 0) {
    this.shakeTime -= dt;
  }
  
  for (let i = this.explosionEffects.length - 1; i >= 0; i--) {
    const exp = this.explosionEffects[i];
    exp.radius += exp.speed * dt;
    exp.alpha -= dt * 2.5;
    if (exp.alpha <= 0) {
      this.explosionEffects.splice(i, 1);
    }
  }
};

SimpleShootingGame.prototype.spawnEnemy = function() {
  var wave = Math.floor(this.score / 50);
  var types = ['normal', 'normal', 'normal', 'fast', 'zigzag'];
  if (wave >= 1) types.push('tough');
  if (wave >= 3) types.push('tough', 'zigzag');
  if (wave >= 6) types.push('boss');
  var type = types[Math.floor(Math.random() * types.length)];
  var configs = {
    normal: { width: 56, height: 56, speed: 100 + Math.random() * 50, hp: 1, behavior: 'straight' },
    fast: { width: 44, height: 44, speed: 180 + Math.random() * 60, hp: 1, behavior: 'straight' },
    zigzag: { width: 64, height: 64, speed: 80 + Math.random() * 40, hp: 2, behavior: 'zigzag' },
    tough: { width: 88, height: 88, speed: 60 + Math.random() * 30, hp: 4, behavior: 'sine' },
    boss: { width: 120, height: 120, speed: 40, hp: 8, behavior: 'sine' }
  };
  var cfg = configs[type];
  var normalTaunts = [
    '来打我呀', '打不到~', '就这？', '太菜了', '哈哈哈',
    '上班狗别玩了', '老板在后面', '工资涨了吗', 'PPT写完了吗',
    '打卡了吗', '摸鱼呢', '周报交了吗', 'KPI完成了吗',
    '今天又加班？', '房贷还了吗', '相亲失败了吧', '头发还好吗',
    '打工人打工魂', '打工是不可能打工的', '你妈催婚了吗',
    '手残别勉强', '子弹喂鸟呢', '我血条都不掉',
    '菜是原罪', '回家种田吧', '人机都比你准'
  ];
  var fastTaunts = [
    '追不上', '太快了~', '溜了溜了',
    '下班跑这么快', '抢红包手速', '外卖要迟到了',
    '赶地铁呢', '迟到扣全勤', '老板追不上我',
    '略略略', '气不气', '吃尾气吧'
  ];
  var zigzagTaunts = [
    '你猜我往哪走', '左右横跳', '来抓我呀',
    '走位走位', '蛇皮走位', '你预判不了我',
    '像极了爱情', '反复横跳', '人生就像我这样',
    '抖腿都没你能晃', 'FPS白玩了'
  ];
  var toughTaunts = [
    '就这伤害？', '给我挠痒？', '再来！', '不够看',
    '我房贷比你命硬', '我脸皮比这还厚',
    '加班都没怕过你', '甲方都骂不动我',
    '被生活毒打惯了', '你这伤害不如老板的嘴',
    '刮痧师傅你好', '没吃饭吗', '护盾留着过年？'
  ];
  var bossTaunts = [
    '来打我呀！', '废物！', '就这点本事？', '哈哈哈来啊',
    '你的KPI我包了', '我是你老板', '今天加班！',
    '周末也别想跑', '你的年假我批了',
    '你写的bug我来看', '月薪三千还想赢？',
    '你连我PPT都打不过', '你的头发还好吗',
    '打工人也敢挑战甲方',
    '终极考核开始', '述职报告写了吗', '年终奖没了'
  ];
  var tauntPool = { normal: normalTaunts, fast: fastTaunts, zigzag: zigzagTaunts, tough: toughTaunts, boss: bossTaunts };
  var pool = tauntPool[type] || normalTaunts;
  var taunt = pool[Math.floor(Math.random() * pool.length)];
  var emojis = {
    normal: ['😏', '🤪', '😜', '🙃', '😤', '😎', '🤡', '👎'],
    fast: ['😝', '🤭', '😒', '💨', '🏃'],
    zigzag: ['💀', '👻', '👽', '🌀', '🦎'],
    tough: ['🤡', '😈', '🛡️', '🧱', '🦏'],
    boss: ['👿', '💀', '🔥', '👹', '😈']
  };
  var emojiPool = emojis[type] || emojis.normal;
  var emoji = emojiPool[Math.floor(Math.random() * emojiPool.length)];
  this.enemies.push({
    x: Math.random() * (this.width - cfg.width - 40) + 20,
    y: -cfg.height,
    width: cfg.width,
    height: cfg.height,
    speed: cfg.speed,
    hp: cfg.hp,
    maxHp: cfg.hp,
    type: type,
    behavior: cfg.behavior,
    hasPowerup: Math.random() < 0.25,
    hitFlash: 0,
    taunt: taunt,
    emoji: emoji
  });
};

SimpleShootingGame.prototype.enemyShoot = function() {
  if (this.enemies.length === 0) return;
  var shooters = this.enemies.filter(function(e) { return e.type === 'tough' || e.type === 'boss' || e.type === 'zigzag'; });
  if (shooters.length === 0) return;
  var shooter = shooters[Math.floor(Math.random() * shooters.length)];
  var dx = this.player.x + this.player.width / 2 - (shooter.x + shooter.width / 2);
  var dy = this.player.y + this.player.height / 2 - (shooter.y + shooter.height / 2);
  var dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;
  var speed = 250;
  this.enemyBullets.push({
    x: shooter.x + shooter.width / 2,
    y: shooter.y + shooter.height,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    size: shooter.type === 'boss' ? 6 : 4
  });
  if (shooter.type === 'boss') {
    var angle = Math.atan2(dy, dx);
    this.enemyBullets.push({
      x: shooter.x + shooter.width / 2,
      y: shooter.y + shooter.height,
      vx: Math.cos(angle - 0.3) * speed,
      vy: Math.sin(angle - 0.3) * speed,
      size: 5
    });
    this.enemyBullets.push({
      x: shooter.x + shooter.width / 2,
      y: shooter.y + shooter.height,
      vx: Math.cos(angle + 0.3) * speed,
      vy: Math.sin(angle + 0.3) * speed,
      size: 5
    });
  }
};

SimpleShootingGame.prototype.turretShoot = function() {
  if (this.enemies.length === 0) return;
  var closest = null;
  var minDist = Infinity;
  for (var i = 0; i < this.enemies.length; i++) {
    var e = this.enemies[i];
    var d = e.y;
    if (d < minDist) { minDist = d; closest = e; }
  }
  if (closest) {
    this.bullets.push({ x: this.player.x + this.player.width / 2, y: this.player.y - 10, isTurret: true });
  }
};

SimpleShootingGame.prototype.bossShoot = function() {
  if (!this.finalBoss) return;
  var boss = this.finalBoss;
  var px = this.player.x + this.player.width / 2;
  var py = this.player.y + this.player.height / 2;
  var bx = boss.x + boss.width / 2;
  var by = boss.y + boss.height;
  var dx = px - bx;
  var dy = py - by;
  var dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;
  var angle = Math.atan2(dy, dx);
  var speed = 180;
  
  if (this.bossPattern === 0) {
    // 扇形弹幕：3发，留有间隙
    for (var i = -1; i <= 1; i++) {
      var a = angle + i * 0.35;
      this.enemyBullets.push({
        x: bx, y: by,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        size: 5
      });
    }
  } else if (this.bossPattern === 1) {
    // 环形弹幕：6发均匀分布，速度慢
    for (var i = 0; i < 6; i++) {
      var a = (Math.PI * 2 / 6) * i + Date.now() * 0.001;
      this.enemyBullets.push({
        x: bx, y: by,
        vx: Math.cos(a) * speed * 0.6,
        vy: Math.sin(a) * speed * 0.6,
        size: 4
      });
    }
  } else {
    // 左右弹幕：留中间安全通道
    this.enemyBullets.push({ x: bx - 25, y: by, vx: -speed * 0.4, vy: speed * 0.7, size: 4 });
    this.enemyBullets.push({ x: bx + 25, y: by, vx: speed * 0.4, vy: speed * 0.7, size: 4 });
    this.enemyBullets.push({ x: bx - 40, y: by, vx: -speed * 0.6, vy: speed * 0.5, size: 4 });
    this.enemyBullets.push({ x: bx + 40, y: by, vx: speed * 0.6, vy: speed * 0.5, size: 4 });
  }
};

SimpleShootingGame.prototype.onEnemyDestroyed = function(enemy) {
  this.score += enemy.type === 'boss' ? 10 : enemy.type === 'tough' ? 5 : enemy.type === 'fast' ? 2 : 1;
  
  var dropChance = enemy.type === 'boss' ? 0.8 : enemy.type === 'tough' ? 0.5 : enemy.type === 'fast' ? 0.25 : 0.12;
  if (Math.random() < dropChance) {
    var types = ['heal', 'power', 'shield'];
    var type = types[Math.floor(Math.random() * types.length)];
    this.powerups.push({
      x: enemy.x + enemy.width / 2,
      y: enemy.y,
      type: type,
      speed: 80
    });
  }
};

SimpleShootingGame.prototype.collectPowerup = function(powerup) {
  var self = this;
  switch (powerup.type) {
    case 'heal':
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 3);
      break;
    case 'power':
      this.bulletLevel = Math.min(5, this.bulletLevel + 1);
      break;
    case 'shield':
      this.hasShield = true;
      this.shieldTime = 5;
      break;
  }
};

SimpleShootingGame.prototype.checkPowerupCollision = function(powerup) {
  return powerup.x > this.player.x - 20 && 
         powerup.x < this.player.x + this.player.width + 20 &&
         powerup.y > this.player.y - 20 && 
         powerup.y < this.player.y + this.player.height + 20;
};

SimpleShootingGame.prototype.autoShoot = function() {
  if (this.isGameOver) return;
  var cx = this.player.x + this.player.width / 2;
  this.bullets.push({ x: cx, y: this.player.y, width: 4 + this.bulletLevel * 2, height: 12 + this.bulletLevel * 4 });
  if (this.bulletLevel >= 2) {
    this.bullets.push({ x: cx - 10, y: this.player.y + 5, width: 4 + this.bulletLevel * 2, height: 12 + this.bulletLevel * 4 });
    this.bullets.push({ x: cx + 10, y: this.player.y + 5, width: 4 + this.bulletLevel * 2, height: 12 + this.bulletLevel * 4 });
  }
  if (this.bulletLevel >= 4) {
    this.bullets.push({ x: cx - 18, y: this.player.y + 10, width: 4 + this.bulletLevel * 2, height: 12 + this.bulletLevel * 4 });
    this.bullets.push({ x: cx + 18, y: this.player.y + 10, width: 4 + this.bulletLevel * 2, height: 12 + this.bulletLevel * 4 });
  }
  if (this.audioManager) {
    this.audioManager.playShoot();
  }
};

SimpleShootingGame.prototype.checkBulletHit = function(bullet, enemy) {
  return bullet.x > enemy.x && bullet.x < enemy.x + enemy.width &&
         bullet.y > enemy.y && bullet.y < enemy.y + enemy.height;
};

SimpleShootingGame.prototype.checkEnemyBulletHitPlayer = function(bullet) {
  var px = this.player.x + this.player.width / 2;
  var py = this.player.y + this.player.height / 2;
  var dx = bullet.x - px;
  var dy = bullet.y - py;
  return Math.sqrt(dx * dx + dy * dy) < this.player.width / 2 + bullet.size;
};

SimpleShootingGame.prototype.checkPlayerEnemyCollision = function(enemy) {
  return this.player.x < enemy.x + enemy.width &&
         this.player.x + this.player.width > enemy.x &&
         this.player.y < enemy.y + enemy.height &&
         this.player.y + this.player.height > enemy.y;
};

SimpleShootingGame.prototype.gameOver = function(win) {
  if (this.isGameOver) return;
  this.isGameOver = true;
  this.shakeTime = 0;
  this.shakeIntensity = 0;
  if (this.timer) clearInterval(this.timer);
  if (this.onGameEnd) this.onGameEnd(win);
};

SimpleShootingGame.prototype.onTouchStart = function(e) {
  if (this.isPaused) return;
  for (let i = 0; i < e.touches.length; i++) {
    const touch = e.touches[i];
    const tx = touch.clientX || touch.x;
    const ty = touch.clientY || touch.y;
    if (tx === undefined || ty === undefined) continue;
    if (tx >= this.width - 40 && tx <= this.width - 10 && ty >= 10 && ty <= 40) {
      this.pause();
      return;
    }
    this.player.targetX = tx - this.player.width / 2;
    this.player.targetY = ty - 60;
    this.moveTouchId = touch.identifier || i;
  }
};

SimpleShootingGame.prototype.onTouchMove = function(e) {
  if (this.isPaused) return;
  for (let i = 0; i < e.touches.length; i++) {
    const touch = e.touches[i];
    const tx = touch.clientX || touch.x;
    const ty = touch.clientY || touch.y;
    const touchId = touch.identifier || i;
    if (touchId === this.moveTouchId && tx !== undefined && ty !== undefined) {
      this.player.targetX = tx - this.player.width / 2;
      this.player.targetY = ty - 60;
    }
  }
};

SimpleShootingGame.prototype.onTouchEnd = function(e) {
  const changedTouches = e.changedTouches || [];
  for (let i = 0; i < changedTouches.length; i++) {
    const touchId = changedTouches[i].identifier || i;
    if (touchId === this.moveTouchId) {
      this.moveTouchId = -1;
    }
  }
};

SimpleShootingGame.prototype.addExplosion = function(x, y) {
  this.explosionEffects.push({
    x: x, y: y, radius: 5, maxRadius: 35, speed: 120, alpha: 1
  });
  if (this.audioManager) this.audioManager.playExplosion();
};

SimpleShootingGame.prototype.renderExplosions = function() {
  for (let i = 0; i < this.explosionEffects.length; i++) {
    const exp = this.explosionEffects[i];
    this.ctx.globalAlpha = exp.alpha;
    var grad = this.ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.3, '#FFD700');
    grad.addColorStop(0.6, '#FF6600');
    grad.addColorStop(1, 'rgba(255,50,0,0)');
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    for (let j = 0; j < 6; j++) {
      var angle = (Math.PI * 2 / 6) * j + Math.random() * 0.5;
      var dist = exp.radius * 0.6;
      var sx = exp.x + Math.cos(angle) * dist;
      var sy = exp.y + Math.sin(angle) * dist;
      this.ctx.fillStyle = 'rgba(255,200,50,' + (exp.alpha * 0.6) + ')';
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  this.ctx.globalAlpha = 1;
};

SimpleShootingGame.prototype.renderPlanet = function(p) {
  var grad = this.ctx.createRadialGradient(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.1, p.x, p.y, p.radius);
  grad.addColorStop(0, '#3A2A4E');
  grad.addColorStop(0.5, p.color);
  grad.addColorStop(1, '#0A0A15');
  this.ctx.fillStyle = grad;
  this.ctx.beginPath();
  this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  this.ctx.fill();
  
  if (p.hasRing) {
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.scale(1, 0.3);
    this.ctx.strokeStyle = p.ringColor;
    this.ctx.lineWidth = 3;
    this.ctx.globalAlpha = 0.4;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, p.radius * 1.6, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }
};

SimpleShootingGame.prototype.renderAsteroid = function(a) {
  this.ctx.save();
  this.ctx.translate(a.x, a.y);
  this.ctx.rotate(a.rotation);
  this.ctx.fillStyle = '#4A4A5E';
  this.ctx.strokeStyle = '#6A6A7E';
  this.ctx.lineWidth = 1;
  this.ctx.beginPath();
  for (var i = 0; i < a.vertices.length; i++) {
    var v = a.vertices[i];
    var px = Math.cos(v.angle) * v.r;
    var py = Math.sin(v.angle) * v.r;
    if (i === 0) this.ctx.moveTo(px, py);
    else this.ctx.lineTo(px, py);
  }
  this.ctx.closePath();
  this.ctx.fill();
  this.ctx.stroke();
  this.ctx.restore();
};

SimpleShootingGame.prototype.renderEngineParticles = function() {
  for (let i = 0; i < this.engineParticles.length; i++) {
    const p = this.engineParticles[i];
    var ratio = p.life / p.maxLife;
    var grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    grad.addColorStop(0, 'rgba(100,180,255,' + (ratio * 0.8) + ')');
    grad.addColorStop(0.5, 'rgba(50,100,255,' + (ratio * 0.4) + ')');
    grad.addColorStop(1, 'rgba(30,50,200,0)');
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    this.ctx.fill();
  }
};

SimpleShootingGame.prototype.renderBackground = function() {
  if (this.bgImagesLoaded > 0) {
    var img = this.bgImages[0];
    for (var i = 0; i < this.bgImages.length; i++) {
      if (this.bgImages[i].loaded) {
        img = this.bgImages[i];
        break;
      }
    }
    var imgW = img.width;
    var imgH = img.height;
    var scaleX = this.width / imgW;
    var scaleY = this.height / imgH;
    var scale = Math.max(scaleX, scaleY);
    var drawW = imgW * scale;
    var drawH = imgH * scale;
    
    var offsetX = 0;
    var offsetY = -(this.bgScrollY % drawH);
    
    for (var row = -1; row <= Math.ceil(this.height / drawH) + 1; row++) {
      for (var col = -1; col <= Math.ceil(this.width / drawW) + 1; col++) {
        var x = offsetX + col * drawW;
        var y = offsetY + row * drawH;
        this.ctx.drawImage(img, x, y, drawW, drawH);
      }
    }
  } else {
    this.ctx.fillStyle = '#050510';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
};

SimpleShootingGame.prototype.render = function() {
  this.ctx.save();
  // 受击抖动：仅在进行中的战斗里生效。暂停/结算弹窗时不跑 update，shakeTime 不会衰减，
  // 若仍每帧随机 translate 会造成整屏抖动。
  if (this.shakeTime > 0 && !this.isPaused && !this.isGameOver) {
    var sx = (Math.random() - 0.5) * this.shakeIntensity;
    var sy = (Math.random() - 0.5) * this.shakeIntensity;
    this.ctx.translate(sx, sy);
  }
  
  // === 底层：滚动背景 ===
  this.renderBackground();
  
  // === 顶层：顶部状态栏 ===
  this.ctx.fillStyle = 'rgba(5,5,16,0.88)';
  this.ctx.fillRect(0, 0, this.width, 50);
  
  this.ctx.fillStyle = 'rgba(40,40,80,0.6)';
  this.ctx.fillRect(0, 49, this.width, 1);

  this.ctx.font = 'bold 14px Arial';
  this.ctx.fillStyle = '#FFD700';
  this.ctx.textAlign = 'center';
  this.ctx.textBaseline = 'middle';
  this.ctx.fillText('万花筒·游境', this.width / 2 + 10, 18);
  this.ctx.textBaseline = 'alphabetic';
  
  var scoreColor = this.score >= this.needScore ? '#4CAF50' : '#FFD700';
  this.ctx.font = 'bold 16px Arial';
  this.ctx.fillStyle = scoreColor;
  this.ctx.textAlign = 'center';
  this.ctx.fillText(this.score, this.width / 2 + 10, 38);
  this.ctx.font = '9px Arial';
  this.ctx.fillStyle = '#666';
  this.ctx.textAlign = 'left';
  this.ctx.fillText('/ ' + this.needScore, this.width / 2 + 10 + this.ctx.measureText(this.score.toString()).width / 2 + 3, 36);

  var hpW = 65;
  var hpH = 8;
  var hpX = this.width - hpW - 48;
  var hpY = 16;
  this.ctx.fillStyle = 'rgba(50,50,50,0.8)';
  this.ctx.beginPath();
  safeRoundRect(this.ctx, hpX, hpY, hpW, hpH, 4);
  this.ctx.fill();
  var hpRatio = this.player.hp / this.player.maxHp;
  var hpColor = hpRatio > 0.5 ? '#4CAF50' : hpRatio > 0.25 ? '#FF9800' : '#F44336';
  this.ctx.fillStyle = hpColor;
  this.ctx.beginPath();
  safeRoundRect(this.ctx, hpX, hpY, Math.max(hpW * hpRatio, 6), hpH, 4);
  this.ctx.fill();

  this.ctx.fillStyle = 'rgba(255,255,255,0.12)';
  this.ctx.beginPath();
  safeRoundRect(this.ctx, this.width - 40, 10, 30, 30, 6);
  this.ctx.fill();
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.font = 'bold 13px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.fillText('||', this.width - 25, 29);

  // === 中层：战斗元素 ===
  this.renderBullets();
  this.renderEnemies();
  this.renderExplosions();
  this.renderPowerups();
  this.renderEngineParticles();
  this.renderPlayer();
  this.renderWingmen();
  this.renderTurret();
  this.renderShield();
  this.renderFinalBoss();

  // === 顶层：提示语 ===
  if (this.finalBossWarning > 0) {
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillStyle = '#FF4444';
    this.ctx.textAlign = 'center';
    this.ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.01) * 0.4;
    this.ctx.fillText('⚠ 最终BOSS即将降临 ⚠', this.width / 2, this.height / 2);
    this.ctx.globalAlpha = 1;
  }
  
  if (this.finalBossDefeated && !this.isGameOver) {
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillStyle = '#4CAF50';
    this.ctx.textAlign = 'center';
    this.ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
    this.ctx.fillText('BOSS已击败！继续挑战', this.width / 2, this.height / 2 - 80);
    this.ctx.globalAlpha = 1;
  }

  if (this.isGameOver) {
    this.ctx.font = 'bold 36px Arial';
    this.ctx.fillStyle = '#F44336';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('战机坠毁!', this.width / 2, this.height / 2 - 20);
    this.ctx.font = 'bold 22px Arial';
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText('总分: ' + this.score, this.width / 2, this.height / 2 + 20);
  }
  
  this.ctx.restore();
};

SimpleShootingGame.prototype.renderPowerups = function() {
  for (let i = 0; i < this.powerups.length; i++) {
    const p = this.powerups[i];
    
    // 发光背景
    this.ctx.fillStyle = p.type === 'heal' ? 'rgba(255,50,50,0.2)' : p.type === 'power' ? 'rgba(255,200,0,0.2)' : 'rgba(100,150,255,0.2)';
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y + 8, 16, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 优先使用图片
    if (p.type === 'heal' && this.powerupImgHealLoaded && this.powerupImgHeal) {
      this.ctx.drawImage(this.powerupImgHeal, p.x - 12, p.y - 4, 24, 24);
    } else if (p.type === 'power' && this.powerupImgPowerLoaded && this.powerupImgPower) {
      this.ctx.drawImage(this.powerupImgPower, p.x - 12, p.y - 4, 24, 24);
    } else if (p.type === 'shield' && this.powerupImgShieldLoaded && this.powerupImgShield) {
      this.ctx.drawImage(this.powerupImgShield, p.x - 12, p.y - 4, 24, 24);
    } else {
      // 回退到emoji
      this.ctx.textAlign = 'center';
      this.ctx.font = '24px Arial';
      this.ctx.fillText(p.type === 'heal' ? '❤️' : p.type === 'power' ? '⚔️' : '🛡️', p.x, p.y + 8);
    }
    
    // 文字标签
    this.ctx.font = 'bold 10px Arial';
    this.ctx.fillStyle = p.type === 'heal' ? '#FF6B6B' : p.type === 'power' ? '#FFD700' : '#64B5F6';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(p.type === 'heal' ? '回血' : p.type === 'power' ? '加攻' : '护盾', p.x, p.y + 26);
  }
  
  // 底部状态指示
  var ix = 10;
  this.ctx.font = '11px Arial';
  this.ctx.textAlign = 'left';
  if (this.hasShield) {
    this.ctx.fillStyle = '#64B5F6';
    this.ctx.fillText('🛡️护盾', ix, this.height - 25);
    ix += 50;
  }
  if (this.bulletLevel > 1) {
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText('⚔️Lv.' + this.bulletLevel, ix, this.height - 25);
    ix += 55;
  }
};

SimpleShootingGame.prototype.renderPlayer = function() {
  var cx = this.player.x + this.player.width / 2;
  var cy = this.player.y + this.player.height / 2;
  var w = this.player.width;
  var h = this.player.height;
  
  if (this.damageCooldown > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
    this.ctx.globalAlpha = 0.4;
  }
  
  // 战机光晕
  var glowGrad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, 50);
  glowGrad.addColorStop(0, 'rgba(0,180,255,0.15)');
  glowGrad.addColorStop(0.5, 'rgba(0,120,255,0.06)');
  glowGrad.addColorStop(1, 'rgba(0,80,200,0)');
  this.ctx.fillStyle = glowGrad;
  this.ctx.beginPath();
  this.ctx.arc(cx, cy, 50, 0, Math.PI * 2);
  this.ctx.fill();
  
  // 位图战机：角度见构造函数 playerSpriteRotationDeg（逆时针，度）
  if (this.playerImgLoaded && this.playerImg && this.playerImg.width > 0) {
    this.ctx.save();
    this.ctx.translate(cx, cy);
    var deg = typeof this.playerSpriteRotationDeg === 'number' ? this.playerSpriteRotationDeg : -56;
    this.ctx.rotate((deg * Math.PI) / 180);
    var sv = typeof this.playerSpriteShearV === 'number' ? this.playerSpriteShearV : 0;
    if (sv !== 0) {
      this.ctx.transform(1, sv, 0, 1, 0, 0);
    }
    var iw = this.playerImg.width;
    var ih = this.playerImg.height;
    var scale = Math.min(w / iw, h / ih);
    var dw = iw * scale;
    var dh = ih * scale;
    this.ctx.drawImage(this.playerImg, -dw / 2, -dh / 2, dw, dh);
    this.ctx.restore();
  } else {
    // 回退到Canvas绘制
    this.renderPlayerFallback(cx, cy, w, h);
  }
  
  this.ctx.globalAlpha = 1;
};

SimpleShootingGame.prototype.renderPlayerFallback = function(cx, cy, w, h) {
  var flameH = 18 + Math.sin(this.engineFlame) * 8;
  var flameH2 = 12 + Math.sin(this.engineFlame * 1.3) * 5;
  
  this.ctx.save();
  this.ctx.shadowColor = '#00AAFF';
  this.ctx.shadowBlur = 15;
  
  var flameGrad = this.ctx.createLinearGradient(cx, this.player.y + h, cx, this.player.y + h + flameH);
  flameGrad.addColorStop(0, 'rgba(0,180,255,1)');
  flameGrad.addColorStop(0.3, 'rgba(100,220,255,0.8)');
  flameGrad.addColorStop(0.6, 'rgba(200,240,255,0.4)');
  flameGrad.addColorStop(1, 'transparent');
  this.ctx.fillStyle = flameGrad;
  this.ctx.beginPath();
  this.ctx.moveTo(cx - 8, this.player.y + h - 3);
  this.ctx.quadraticCurveTo(cx, this.player.y + h + flameH + 8, cx + 8, this.player.y + h - 3);
  this.ctx.closePath();
  this.ctx.fill();
  
  var flameGrad2 = this.ctx.createLinearGradient(cx - 20, this.player.y + h, cx - 20, this.player.y + h + flameH2);
  flameGrad2.addColorStop(0, 'rgba(0,150,255,0.8)');
  flameGrad2.addColorStop(0.5, 'rgba(100,200,255,0.4)');
  flameGrad2.addColorStop(1, 'transparent');
  this.ctx.fillStyle = flameGrad2;
  this.ctx.beginPath();
  this.ctx.moveTo(cx - 22, this.player.y + h - 2);
  this.ctx.quadraticCurveTo(cx - 20, this.player.y + h + flameH2, cx - 18, this.player.y + h - 2);
  this.ctx.closePath();
  this.ctx.fill();
  
  var flameGrad3 = this.ctx.createLinearGradient(cx + 20, this.player.y + h, cx + 20, this.player.y + h + flameH2);
  flameGrad3.addColorStop(0, 'rgba(0,150,255,0.8)');
  flameGrad3.addColorStop(0.5, 'rgba(100,200,255,0.4)');
  flameGrad3.addColorStop(1, 'transparent');
  this.ctx.fillStyle = flameGrad3;
  this.ctx.beginPath();
  this.ctx.moveTo(cx + 18, this.player.y + h - 2);
  this.ctx.quadraticCurveTo(cx + 20, this.player.y + h + flameH2, cx + 22, this.player.y + h - 2);
  this.ctx.closePath();
  this.ctx.fill();
  this.ctx.restore();
  
  this.ctx.save();
  this.ctx.shadowColor = '#0088FF';
  this.ctx.shadowBlur = 10;
  
  this.ctx.fillStyle = '#0A1628';
  this.ctx.strokeStyle = '#00AAFF';
  this.ctx.lineWidth = 1.5;
  this.ctx.beginPath();
  this.ctx.moveTo(cx, this.player.y - 2);
  this.ctx.quadraticCurveTo(cx + 5, this.player.y + 10, cx + 8, this.player.y + 20);
  this.ctx.lineTo(cx + 30, this.player.y + 38);
  this.ctx.lineTo(cx + 32, this.player.y + 44);
  this.ctx.lineTo(cx + 28, this.player.y + 48);
  this.ctx.lineTo(cx + 12, this.player.y + 44);
  this.ctx.lineTo(cx + 8, this.player.y + h);
  this.ctx.lineTo(cx - 8, this.player.y + h);
  this.ctx.lineTo(cx - 12, this.player.y + 44);
  this.ctx.lineTo(cx - 28, this.player.y + 48);
  this.ctx.lineTo(cx - 32, this.player.y + 44);
  this.ctx.lineTo(cx - 30, this.player.y + 38);
  this.ctx.lineTo(cx - 8, this.player.y + 20);
  this.ctx.quadraticCurveTo(cx - 5, this.player.y + 10, cx, this.player.y - 2);
  this.ctx.closePath();
  this.ctx.fill();
  this.ctx.stroke();
  this.ctx.restore();
  
  var bodyGrad = this.ctx.createLinearGradient(cx - 30, 0, cx + 30, 0);
  bodyGrad.addColorStop(0, '#0A1A2E');
  bodyGrad.addColorStop(0.2, '#1A3A5E');
  bodyGrad.addColorStop(0.5, '#2A5A8E');
  bodyGrad.addColorStop(0.8, '#1A3A5E');
  bodyGrad.addColorStop(1, '#0A1A2E');
  this.ctx.fillStyle = bodyGrad;
  this.ctx.beginPath();
  this.ctx.moveTo(cx, this.player.y + 2);
  this.ctx.quadraticCurveTo(cx + 4, this.player.y + 12, cx + 6, this.player.y + 22);
  this.ctx.lineTo(cx + 26, this.player.y + 36);
  this.ctx.lineTo(cx + 28, this.player.y + 42);
  this.ctx.lineTo(cx + 24, this.player.y + 46);
  this.ctx.lineTo(cx + 10, this.player.y + 42);
  this.ctx.lineTo(cx + 6, this.player.y + h - 4);
  this.ctx.lineTo(cx - 6, this.player.y + h - 4);
  this.ctx.lineTo(cx - 10, this.player.y + 42);
  this.ctx.lineTo(cx - 24, this.player.y + 46);
  this.ctx.lineTo(cx - 28, this.player.y + 42);
  this.ctx.lineTo(cx - 26, this.player.y + 36);
  this.ctx.lineTo(cx - 6, this.player.y + 22);
  this.ctx.quadraticCurveTo(cx - 4, this.player.y + 12, cx, this.player.y + 2);
  this.ctx.closePath();
  this.ctx.fill();
  
  this.ctx.strokeStyle = '#00CCFF';
  this.ctx.lineWidth = 1;
  this.ctx.beginPath();
  this.ctx.moveTo(cx, this.player.y + 5);
  this.ctx.lineTo(cx, this.player.y + h - 8);
  this.ctx.stroke();
  
  this.ctx.strokeStyle = 'rgba(0,200,255,0.4)';
  this.ctx.lineWidth = 0.5;
  for (var i = 0; i < 5; i++) {
    var ly = this.player.y + 15 + i * 7;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - 15, ly);
    this.ctx.lineTo(cx + 15, ly);
    this.ctx.stroke();
  }
  
  this.ctx.fillStyle = '#0A1A2E';
  this.ctx.beginPath();
  this.ctx.moveTo(cx, this.player.y + 10);
  this.ctx.quadraticCurveTo(cx + 4, this.player.y + 16, cx + 5, this.player.y + 24);
  this.ctx.lineTo(cx - 5, this.player.y + 24);
  this.ctx.quadraticCurveTo(cx - 4, this.player.y + 16, cx, this.player.y + 10);
  this.ctx.closePath();
  this.ctx.fill();
  
  this.ctx.save();
  this.ctx.shadowColor = '#00FFFF';
  this.ctx.shadowBlur = 8;
  var cockpitGrad = this.ctx.createRadialGradient(cx - 1, this.player.y + 16, 1, cx, this.player.y + 18, 7);
  cockpitGrad.addColorStop(0, '#AAFFFF');
  cockpitGrad.addColorStop(0.3, '#40DDFF');
  cockpitGrad.addColorStop(0.7, '#00AAFF');
  cockpitGrad.addColorStop(1, '#0066AA');
  this.ctx.fillStyle = cockpitGrad;
  this.ctx.beginPath();
  this.ctx.ellipse(cx, this.player.y + 18, 5, 8, 0, 0, Math.PI * 2);
  this.ctx.fill();
  this.ctx.restore();
  
  this.ctx.fillStyle = 'rgba(200,240,255,0.5)';
  this.ctx.beginPath();
  this.ctx.ellipse(cx - 2, this.player.y + 14, 2, 3.5, -0.2, 0, Math.PI * 2);
  this.ctx.fill();
  
  this.ctx.save();
  this.ctx.shadowColor = '#FF0044';
  this.ctx.shadowBlur = 6;
  this.ctx.fillStyle = '#FF0044';
  this.ctx.beginPath();
  this.ctx.arc(cx - 28, this.player.y + 46, 2.5, 0, Math.PI * 2);
  this.ctx.fill();
  this.ctx.beginPath();
  this.ctx.arc(cx + 28, this.player.y + 46, 2.5, 0, Math.PI * 2);
  this.ctx.fill();
  this.ctx.restore();
  
  this.ctx.fillStyle = '#00AAFF';
  this.ctx.beginPath();
  this.ctx.arc(cx - 28, this.player.y + 46, 1, 0, Math.PI * 2);
  this.ctx.fill();
  this.ctx.beginPath();
  this.ctx.arc(cx + 28, this.player.y + 46, 1, 0, Math.PI * 2);
  this.ctx.fill();
  
  var hpRatio = this.player.hp / this.player.maxHp;
  var hpBarW = 36;
  var hpBarH = 4;
  var hpBarX = cx - hpBarW / 2;
  var hpBarY = this.player.y + this.player.height + 4;
  this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
  this.ctx.fillRect(hpBarX - 1, hpBarY - 1, hpBarW + 2, hpBarH + 2);
  this.ctx.fillStyle = '#333';
  this.ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
  var hpColor = hpRatio > 0.5 ? '#4CAF50' : hpRatio > 0.25 ? '#FF9800' : '#F44336';
  this.ctx.fillStyle = hpColor;
  this.ctx.fillRect(hpBarX, hpBarY, hpBarW * hpRatio, hpBarH);
};

SimpleShootingGame.prototype.renderWingmen = function() {
  for (let i = 0; i < this.wingmen.length; i++) {
    var w = this.wingmen[i];
    w.x = this.player.x + this.player.width / 2 + w.side * w.offset;
    var wy = this.player.y + 20;
    
    this.ctx.fillStyle = '#4FC3F7';
    this.ctx.beginPath();
    this.ctx.moveTo(w.x, wy - 8);
    this.ctx.lineTo(w.x + 8, wy + 8);
    this.ctx.lineTo(w.x - 8, wy + 8);
    this.ctx.closePath();
    this.ctx.fill();
    
    var wf = 6 + Math.sin(this.engineFlame + i) * 3;
    this.ctx.fillStyle = '#FF9800';
    this.ctx.beginPath();
    this.ctx.moveTo(w.x - 3, wy + 8);
    this.ctx.lineTo(w.x, wy + 8 + wf);
    this.ctx.lineTo(w.x + 3, wy + 8);
    this.ctx.closePath();
    this.ctx.fill();
  }
};

SimpleShootingGame.prototype.renderTurret = function() {
  if (!this.hasSupportTurret) return;
  var tx = this.player.x + this.player.width / 2;
  var ty = this.player.y - 20;
  
  this.ctx.fillStyle = '#FF5722';
  this.ctx.fillRect(tx - 4, ty - 10, 8, 15);
  this.ctx.fillStyle = '#BF360C';
  this.ctx.beginPath();
  this.ctx.arc(tx, ty + 5, 8, 0, Math.PI * 2);
  this.ctx.fill();
  this.ctx.fillStyle = '#FF8A65';
  this.ctx.beginPath();
  this.ctx.arc(tx, ty + 5, 4, 0, Math.PI * 2);
  this.ctx.fill();
};

SimpleShootingGame.prototype.renderBullets = function() {
  for (let i = 0; i < this.bullets.length; i++) {
    const b = this.bullets[i];
    if (b.isTurret) {
      this.ctx.fillStyle = '#FF5722';
      this.ctx.fillRect(b.x - 3, b.y, 6, 14);
    } else {
      var lvl = this.bulletLevel;
      var bColor = lvl >= 4 ? '#E040FB' : lvl >= 3 ? '#FF5722' : lvl >= 2 ? '#FF9800' : '#FFD700';
      var bWidth = b.width || 4;
      var bHeight = b.height || 12 + lvl * 2;
      
      if (this.bulletImgPlayerLoaded && this.bulletImgPlayer) {
        this.ctx.drawImage(this.bulletImgPlayer, b.x - bWidth / 2, b.y, bWidth, bHeight);
      } else {
        var glow = this.ctx.createRadialGradient(b.x, b.y + bHeight / 2, 0, b.x, b.y + bHeight / 2, bWidth * 2);
        glow.addColorStop(0, bColor.replace(')', ',0.3)').replace('rgb', 'rgba'));
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = glow;
        this.ctx.beginPath();
        this.ctx.arc(b.x, b.y + bHeight / 2, bWidth * 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        var bulletGrad = this.ctx.createLinearGradient(b.x, b.y, b.x, b.y + bHeight);
        bulletGrad.addColorStop(0, '#FFFFFF');
        bulletGrad.addColorStop(0.3, bColor);
        bulletGrad.addColorStop(1, bColor);
        this.ctx.fillStyle = bulletGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(b.x, b.y);
        this.ctx.lineTo(b.x + bWidth / 2, b.y + bHeight);
        this.ctx.lineTo(b.x - bWidth / 2, b.y + bHeight);
        this.ctx.closePath();
        this.ctx.fill();
      }
    }
  }
  
  for (let i = 0; i < this.enemyBullets.length; i++) {
    const b = this.enemyBullets[i];
    if (this.bulletImgEnemyLoaded && this.bulletImgEnemy) {
      this.ctx.drawImage(this.bulletImgEnemy, b.x - b.size, b.y - b.size, b.size * 2, b.size * 2);
    } else {
      var glow = this.ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 2.5);
      glow.addColorStop(0, 'rgba(255,50,50,0.4)');
      glow.addColorStop(0.5, 'rgba(255,20,20,0.15)');
      glow.addColorStop(1, 'rgba(255,0,0,0)');
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.size * 2.5, 0, Math.PI * 2);
      this.ctx.fill();
      
      var bulletGrad = this.ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size);
      bulletGrad.addColorStop(0, '#FFFFFF');
      bulletGrad.addColorStop(0.4, '#FF4444');
      bulletGrad.addColorStop(1, '#CC0000');
      this.ctx.fillStyle = bulletGrad;
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
};

SimpleShootingGame.prototype.renderEnemies = function() {
  for (let i = 0; i < this.enemies.length; i++) {
    const e = this.enemies[i];
    const ecx = e.x + e.width / 2;
    const ecy = e.y + e.height / 2;
    
    if (e.hitFlash > 0) {
      e.hitFlash -= 0.016;
      this.ctx.globalAlpha = 0.5;
    }
    
    if (e.type === 'normal') {
      this.renderEnemyNormal(ecx, ecy, e.width);
    } else if (e.type === 'fast') {
      this.renderEnemyFast(ecx, ecy, e.width);
    } else if (e.type === 'zigzag') {
      this.renderEnemyZigzag(ecx, ecy, e.width);
    } else if (e.type === 'tough') {
      this.renderEnemyTough(ecx, ecy, e.width);
    } else if (e.type === 'boss') {
      this.renderEnemyBoss(ecx, ecy, e.width);
    }
    
    if (e.maxHp > 1) {
      var hpW = e.width;
      var hpH = 3;
      var hpX = e.x;
      var hpY = e.y - 6;
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(hpX, hpY, hpW, hpH);
      this.ctx.fillStyle = '#F44336';
      this.ctx.fillRect(hpX, hpY, hpW * (e.hp / e.maxHp), hpH);
    }

    if (e.taunt || e.emoji) {
      this.ctx.save();
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'bottom';
      var labelBottom = e.maxHp > 1 ? e.y - 11 : e.y - 5;
      var maxTextW = Math.min(this.width - 24, Math.max(140, e.width + 72));
      if (e.emoji) {
        this.ctx.font = '20px Arial';
        this.ctx.strokeStyle = 'rgba(0,0,0,0.88)';
        this.ctx.lineWidth = 3;
        this.ctx.lineJoin = 'round';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeText(e.emoji, ecx, labelBottom);
        this.ctx.fillText(e.emoji, ecx, labelBottom);
        labelBottom -= 22;
      }
      if (e.taunt) {
        this.ctx.font = 'bold 11px Arial';
        var t = e.taunt;
        while (t.length > 1 && this.ctx.measureText(t + '…').width > maxTextW) {
          t = t.slice(0, -1);
        }
        if (t !== e.taunt) {
          t += '…';
        }
        this.ctx.strokeStyle = 'rgba(0,0,0,0.92)';
        this.ctx.lineWidth = 3.5;
        this.ctx.fillStyle = '#FFEB3B';
        this.ctx.strokeText(t, ecx, labelBottom);
        this.ctx.fillText(t, ecx, labelBottom);
      }
      this.ctx.restore();
    }
    
    this.ctx.globalAlpha = 1;
  }
};

SimpleShootingGame.prototype.renderEnemyNormal = function(cx, cy, size) {
  var r = size / 2;
  this.ctx.save();
  this.ctx.shadowColor = '#4FC3F7';
  this.ctx.shadowBlur = 12;
  var grad = this.ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  grad.addColorStop(0, '#B3E5FC');
  grad.addColorStop(0.5, '#4FC3F7');
  grad.addColorStop(1, '#0288D1');
  this.ctx.fillStyle = grad;
  this.ctx.beginPath();
  this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
  this.ctx.fill();
  this.ctx.shadowBlur = 0;
  this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  this.ctx.lineWidth = 1.5;
  this.ctx.beginPath();
  this.ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.3, 0, Math.PI * 2);
  this.ctx.stroke();
  this.ctx.restore();
  return;
  this.ctx.save();
  this.ctx.shadowColor = '#FF0044';
  this.ctx.shadowBlur = 12;
  
  this.ctx.fillStyle = '#2A0A1A';
  this.ctx.strokeStyle = '#FF0044';
  this.ctx.lineWidth = 2;
  this.ctx.beginPath();
  this.ctx.moveTo(cx, cy + half);
  this.ctx.lineTo(cx + half, cy - half * 0.3);
  this.ctx.lineTo(cx + half * 0.6, cy - half);
  this.ctx.lineTo(cx - half * 0.6, cy - half);
  this.ctx.lineTo(cx - half, cy - half * 0.3);
  this.ctx.closePath();
  this.ctx.fill();
  this.ctx.stroke();
  
  this.ctx.shadowBlur = 0;
  this.ctx.fillStyle = '#FF0044';
  this.ctx.beginPath();
  this.ctx.moveTo(cx, cy + half * 0.4);
  this.ctx.lineTo(cx + half * 0.4, cy - half * 0.1);
  this.ctx.lineTo(cx - half * 0.4, cy - half * 0.1);
  this.ctx.closePath();
  this.ctx.fill();
  
  this.ctx.fillStyle = '#FF4488';
  this.ctx.beginPath();
  this.ctx.arc(cx, cy - half * 0.1, 3, 0, Math.PI * 2);
  this.ctx.fill();
  
  this.ctx.restore();
};

SimpleShootingGame.prototype.renderEnemyFast = function(cx, cy, size) {
  var r = size / 2;
  this.ctx.save();
  this.ctx.shadowColor = '#FF9800';
  this.ctx.shadowBlur = 12;
  var grad = this.ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  grad.addColorStop(0, '#FFE0B2');
  grad.addColorStop(0.5, '#FF9800');
  grad.addColorStop(1, '#E65100');
  this.ctx.fillStyle = grad;
  this.ctx.beginPath();
  this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
  this.ctx.fill();
  this.ctx.shadowBlur = 0;
  this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  this.ctx.lineWidth = 1.5;
  this.ctx.beginPath();
  this.ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.3, 0, Math.PI * 2);
  this.ctx.stroke();
  this.ctx.restore();
  return;
  var half = size / 2;
  if (this.enemyImgFastLoaded && this.enemyImgFast) {
    this.ctx.drawImage(this.enemyImgFast, cx - half, cy - half, size, size);
    return;
  }
  this.ctx.save();
  this.ctx.shadowColor = '#FF6600';
  this.ctx.shadowBlur = 10;
  
  this.ctx.fillStyle = '#1A0A00';
  this.ctx.strokeStyle = '#FF6600';
  this.ctx.lineWidth = 2;
  this.ctx.beginPath();
  this.ctx.moveTo(cx, cy + half);
  this.ctx.lineTo(cx + half * 0.8, cy);
  this.ctx.lineTo(cx + half * 0.5, cy - half);
  this.ctx.lineTo(cx - half * 0.5, cy - half);
  this.ctx.lineTo(cx - half * 0.8, cy);
  this.ctx.closePath();
  this.ctx.fill();
  this.ctx.stroke();
  
  this.ctx.shadowBlur = 0;
  this.ctx.fillStyle = '#FF8800';
  this.ctx.beginPath();
  this.ctx.moveTo(cx, cy + half * 0.5);
  this.ctx.lineTo(cx + half * 0.3, cy - half * 0.2);
  this.ctx.lineTo(cx - half * 0.3, cy - half * 0.2);
  this.ctx.closePath();
  this.ctx.fill();
  
  this.ctx.restore();
};

SimpleShootingGame.prototype.renderEnemyZigzag = function(cx, cy, size) {
  var r = size / 2;
  this.ctx.save();
  this.ctx.shadowColor = '#CE93D8';
  this.ctx.shadowBlur = 12;
  var grad = this.ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  grad.addColorStop(0, '#F3E5F5');
  grad.addColorStop(0.5, '#CE93D8');
  grad.addColorStop(1, '#7B1FA2');
  this.ctx.fillStyle = grad;
  this.ctx.beginPath();
  this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
  this.ctx.fill();
  this.ctx.shadowBlur = 0;
  this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  this.ctx.lineWidth = 1.5;
  this.ctx.beginPath();
  this.ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.3, 0, Math.PI * 2);
  this.ctx.stroke();
  this.ctx.restore();
  return;
  var half = size / 2;
  if (this.enemyImgZigzagLoaded && this.enemyImgZigzag) {
    this.ctx.drawImage(this.enemyImgZigzag, cx - half, cy - half, size, size);
    return;
  }
  this.ctx.save();
  this.ctx.shadowColor = '#AA00FF';
  this.ctx.shadowBlur = 12;
  
  this.ctx.fillStyle = '#0A002A';
  this.ctx.strokeStyle = '#AA00FF';
  this.ctx.lineWidth = 2;
  this.ctx.beginPath();
  for (var i = 0; i < 6; i++) {
    var angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
    var r = i % 2 === 0 ? half : half * 0.6;
    var px = cx + Math.cos(angle) * r;
    var py = cy + Math.sin(angle) * r;
    if (i === 0) this.ctx.moveTo(px, py);
    else this.ctx.lineTo(px, py);
  }
  this.ctx.closePath();
  this.ctx.fill();
  this.ctx.stroke();
  
  this.ctx.shadowBlur = 0;
  this.ctx.fillStyle = '#CC44FF';
  this.ctx.beginPath();
  this.ctx.arc(cx, cy, half * 0.35, 0, Math.PI * 2);
  this.ctx.fill();
  
  this.ctx.restore();
};

SimpleShootingGame.prototype.renderEnemyTough = function(cx, cy, size) {
  var r = size / 2;
  this.ctx.save();
  this.ctx.shadowColor = '#EF6C00';
  this.ctx.shadowBlur = 15;
  var grad = this.ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  grad.addColorStop(0, '#FFE0B2');
  grad.addColorStop(0.5, '#EF6C00');
  grad.addColorStop(1, '#BF360C');
  this.ctx.fillStyle = grad;
  this.ctx.beginPath();
  this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
  this.ctx.fill();
  this.ctx.shadowBlur = 0;
  this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  this.ctx.lineWidth = 1.5;
  this.ctx.beginPath();
  this.ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.3, 0, Math.PI * 2);
  this.ctx.stroke();
  this.ctx.restore();
  return;
  var half = size / 2;
  if (this.enemyImgToughLoaded && this.enemyImgTough) {
    this.ctx.drawImage(this.enemyImgTough, cx - half, cy - half, size, size);
    return;
  }
  this.ctx.save();
  this.ctx.shadowColor = '#FF4400';
  this.ctx.shadowBlur = 15;
  
  this.ctx.fillStyle = '#1A0A00';
  this.ctx.strokeStyle = '#FF4400';
  this.ctx.lineWidth = 2;
  this.ctx.beginPath();
  this.ctx.arc(cx, cy, half, 0, Math.PI * 2);
  this.ctx.fill();
  this.ctx.stroke();
  
  this.ctx.shadowBlur = 0;
  this.ctx.fillStyle = '#2A1A0A';
  this.ctx.strokeStyle = '#FF6600';
  this.ctx.lineWidth = 1;
  this.ctx.beginPath();
  this.ctx.arc(cx, cy, half * 0.7, 0, Math.PI * 2);
  this.ctx.fill();
  this.ctx.stroke();
  
  this.ctx.fillStyle = '#FF6600';
  this.ctx.beginPath();
  this.ctx.arc(cx, cy, half * 0.4, 0, Math.PI * 2);
  this.ctx.fill();
  
  this.ctx.fillStyle = '#FFAA44';
  this.ctx.beginPath();
  this.ctx.arc(cx - half * 0.3, cy - half * 0.2, 3, 0, Math.PI * 2);
  this.ctx.fill();
  this.ctx.beginPath();
  this.ctx.arc(cx + half * 0.3, cy - half * 0.2, 3, 0, Math.PI * 2);
  this.ctx.fill();
  
  this.ctx.strokeStyle = '#FF4400';
  this.ctx.lineWidth = 1;
  for (var i = 0; i < 8; i++) {
    var angle = (Math.PI * 2 / 8) * i;
    this.ctx.beginPath();
    this.ctx.moveTo(cx + Math.cos(angle) * half * 0.7, cy + Math.sin(angle) * half * 0.7);
    this.ctx.lineTo(cx + Math.cos(angle) * half, cy + Math.sin(angle) * half);
    this.ctx.stroke();
  }
  
  this.ctx.restore();
};

SimpleShootingGame.prototype.renderEnemyBoss = function(cx, cy, size) {
  var r = size / 2;
  this.ctx.save();
  this.ctx.shadowColor = '#D32F2F';
  this.ctx.shadowBlur = 25;
  var grad = this.ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  grad.addColorStop(0, '#FFCDD2');
  grad.addColorStop(0.4, '#EF5350');
  grad.addColorStop(0.8, '#C62828');
  grad.addColorStop(1, '#8E0000');
  this.ctx.fillStyle = grad;
  this.ctx.beginPath();
  this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
  this.ctx.fill();
  this.ctx.shadowBlur = 0;
  this.ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  this.ctx.lineWidth = 2;
  this.ctx.beginPath();
  this.ctx.arc(cx - r * 0.15, cy - r * 0.15, r * 0.35, 0, Math.PI * 2);
  this.ctx.stroke();
  this.ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  this.ctx.lineWidth = 1;
  this.ctx.beginPath();
  this.ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
  this.ctx.stroke();
  this.ctx.restore();
  return;
  var half = size / 2;
  if (this.enemyImgBossLoaded && this.enemyImgBoss) {
    this.ctx.drawImage(this.enemyImgBoss, cx - half, cy - half, size, size);
    return;
  }
  this.ctx.save();
  this.ctx.shadowColor = '#FF0000';
  this.ctx.shadowBlur = 20;
  
  this.ctx.fillStyle = '#2A0000';
  this.ctx.strokeStyle = '#FF0000';
  this.ctx.lineWidth = 2;
  this.ctx.beginPath();
  this.ctx.moveTo(cx, cy + half);
  this.ctx.lineTo(cx + half, cy + half * 0.3);
  this.ctx.lineTo(cx + half, cy - half * 0.5);
  this.ctx.lineTo(cx + half * 0.5, cy - half);
  this.ctx.lineTo(cx - half * 0.5, cy - half);
  this.ctx.lineTo(cx - half, cy - half * 0.5);
  this.ctx.lineTo(cx - half, cy + half * 0.3);
  this.ctx.closePath();
  this.ctx.fill();
  this.ctx.stroke();
  
  this.ctx.shadowBlur = 0;
  this.ctx.fillStyle = '#3A0000';
  this.ctx.strokeStyle = '#FF4444';
  this.ctx.lineWidth = 1;
  this.ctx.beginPath();
  this.ctx.moveTo(cx, cy + half * 0.5);
  this.ctx.lineTo(cx + half * 0.6, cy);
  this.ctx.lineTo(cx + half * 0.3, cy - half * 0.5);
  this.ctx.lineTo(cx - half * 0.3, cy - half * 0.5);
  this.ctx.lineTo(cx - half * 0.6, cy);
  this.ctx.closePath();
  this.ctx.fill();
  this.ctx.stroke();
  
  this.ctx.fillStyle = '#FF0000';
  this.ctx.shadowColor = '#FF0000';
  this.ctx.shadowBlur = 10;
  this.ctx.beginPath();
  this.ctx.arc(cx, cy - half * 0.1, half * 0.2, 0, Math.PI * 2);
  this.ctx.fill();
  
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.shadowBlur = 0;
  this.ctx.beginPath();
  this.ctx.arc(cx, cy - half * 0.1, half * 0.08, 0, Math.PI * 2);
  this.ctx.fill();
  
  this.ctx.strokeStyle = '#FF0000';
  this.ctx.lineWidth = 1;
  for (var i = 0; i < 12; i++) {
    var angle = (Math.PI * 2 / 12) * i;
    this.ctx.beginPath();
    this.ctx.moveTo(cx + Math.cos(angle) * half * 0.5, cy + Math.sin(angle) * half * 0.5);
    this.ctx.lineTo(cx + Math.cos(angle) * half * 0.8, cy + Math.sin(angle) * half * 0.8);
    this.ctx.stroke();
  }
  
  this.ctx.restore();
};

SimpleShootingGame.prototype.renderFinalBoss = function() {
  if (!this.finalBoss) return;
  var boss = this.finalBoss;
  var cx = boss.x + boss.width / 2;
  var cy = boss.y + boss.height / 2;
  var r = Math.max(boss.width, boss.height) / 2;
  
  if (boss.hitFlash > 0) {
    boss.hitFlash -= 0.016;
    this.ctx.globalAlpha = 0.5;
  }
  
  // 大球体 Boss（球球大作战风格）
  this.ctx.save();
  this.ctx.shadowColor = '#FF1744';
  this.ctx.shadowBlur = 40;
  var grad = this.ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.05, cx, cy, r);
  grad.addColorStop(0, '#FFEBEE');
  grad.addColorStop(0.2, '#FF8A80');
  grad.addColorStop(0.5, '#FF1744');
  grad.addColorStop(0.8, '#C62828');
  grad.addColorStop(1, '#7F0000');
  this.ctx.fillStyle = grad;
  this.ctx.beginPath();
  this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
  this.ctx.fill();
  
  // 外层光环
  this.ctx.shadowBlur = 0;
  this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  this.ctx.lineWidth = 3;
  this.ctx.beginPath();
  this.ctx.arc(cx - r * 0.1, cy - r * 0.1, r * 0.5, 0, Math.PI * 2);
  this.ctx.stroke();
  
  // 内部纹理
  this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  this.ctx.lineWidth = 2;
  this.ctx.beginPath();
  this.ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
  this.ctx.stroke();
  this.ctx.beginPath();
  this.ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
  this.ctx.stroke();
  
  // Boss 眼睛（大球上的可爱表情）
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.beginPath();
  this.ctx.arc(cx - r * 0.2, cy - r * 0.1, r * 0.12, 0, Math.PI * 2);
  this.ctx.fill();
  this.ctx.beginPath();
  this.ctx.arc(cx + r * 0.2, cy - r * 0.1, r * 0.12, 0, Math.PI * 2);
  this.ctx.fill();
  this.ctx.fillStyle = '#000000';
  this.ctx.beginPath();
  this.ctx.arc(cx - r * 0.18, cy - r * 0.08, r * 0.06, 0, Math.PI * 2);
  this.ctx.fill();
  this.ctx.beginPath();
  this.ctx.arc(cx + r * 0.22, cy - r * 0.08, r * 0.06, 0, Math.PI * 2);
  this.ctx.fill();
  
  // 嘴巴
  this.ctx.strokeStyle = '#000000';
  this.ctx.lineWidth = 2;
  this.ctx.beginPath();
  this.ctx.arc(cx, cy + r * 0.15, r * 0.15, 0, Math.PI);
  this.ctx.stroke();
  
  this.ctx.restore();
  
  // Boss HP bar
  var hpW = boss.width + 20;
  var hpH = 8;
  var hpX = boss.x - 10;
  var hpY = boss.y - 18;
  this.ctx.fillStyle = '#333';
  this.ctx.fillRect(hpX, hpY, hpW, hpH);
  this.ctx.fillStyle = '#FF1744';
  this.ctx.fillRect(hpX, hpY, hpW * (boss.hp / boss.maxHp), hpH);
  this.ctx.strokeStyle = '#FF4444';
  this.ctx.lineWidth = 1;
  this.ctx.strokeRect(hpX, hpY, hpW, hpH);
  
  this.ctx.textAlign = 'center';
  this.ctx.textBaseline = 'bottom';
  var titleY = hpY - 4;
  if (boss.taunt || boss.emoji) {
    var bubbleW = Math.min(this.width - 20, 220);
    if (boss.emoji) {
      this.ctx.font = '22px Arial';
      this.ctx.strokeStyle = 'rgba(0,0,0,0.9)';
      this.ctx.lineWidth = 3;
      this.ctx.fillStyle = '#FFF';
      this.ctx.strokeText(boss.emoji, cx, titleY);
      this.ctx.fillText(boss.emoji, cx, titleY);
      titleY -= 24;
    }
    if (boss.taunt) {
      this.ctx.font = 'bold 12px Arial';
      var bt = boss.taunt;
      while (bt.length > 1 && this.ctx.measureText(bt + '…').width > bubbleW) {
        bt = bt.slice(0, -1);
      }
      if (bt !== boss.taunt) {
        bt += '…';
      }
      this.ctx.strokeStyle = 'rgba(0,0,0,0.92)';
      this.ctx.lineWidth = 3.5;
      this.ctx.fillStyle = '#FFEB3B';
      this.ctx.strokeText(bt, cx, titleY);
      this.ctx.fillText(bt, cx, titleY);
      titleY -= 16;
    }
  }
  this.ctx.font = 'bold 12px Arial';
  this.ctx.fillStyle = '#FFF';
  this.ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  this.ctx.lineWidth = 2.5;
  this.ctx.strokeText('最终BOSS', cx, titleY);
  this.ctx.fillText('最终BOSS', cx, titleY);
  this.ctx.textBaseline = 'alphabetic';
  
  this.ctx.globalAlpha = 1;
};

SimpleShootingGame.prototype.renderShield = function() {
  if (!this.hasShield) return;
  var cx = this.player.x + this.player.width / 2;
  var cy = this.player.y + this.player.height / 2;
  this.ctx.strokeStyle = 'rgba(156,39,176,0.6)';
  this.ctx.lineWidth = 3;
  this.ctx.beginPath();
  this.ctx.arc(cx, cy, 35, 0, Math.PI * 2);
  this.ctx.stroke();
  this.ctx.fillStyle = 'rgba(156,39,176,0.1)';
  this.ctx.beginPath();
  this.ctx.arc(cx, cy, 35, 0, Math.PI * 2);
  this.ctx.fill();
};

module.exports = GameFactory;
