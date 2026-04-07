// 石头剪刀布游戏
const GameScene = require('../scenes/GameScene.js');

function RockPaperScissorsGame(canvas) {
  GameScene.call(this, canvas, { id: 'rock_paper_scissors', name: '石头剪刀布', duration: 10 });
  this.choices = ['rock', 'paper', 'scissors'];
  this.playerChoice = null;
  this.computerChoice = null;
  this.roundResult = null;
  this.winCount = 0;
  this.needWins = 3;
}

RockPaperScissorsGame.prototype = Object.create(GameScene.prototype);
RockPaperScissorsGame.prototype.constructor = RockPaperScissorsGame;

RockPaperScissorsGame.prototype.init = function() {
  this.choiceButtons = [
    { id: 'rock', x: this.width / 4, y: this.height - 150, emoji: '✊', label: '石头' },
    { id: 'paper', x: this.width / 2, y: this.height - 150, emoji: '✋', label: '布' },
    { id: 'scissors', x: this.width * 3 / 4, y: this.height - 150, emoji: '✌️', label: '剪刀' }
  ];
};

RockPaperScissorsGame.prototype.onEnter = function() {
  GameScene.prototype.onEnter.call(this);
  this.init();
};

RockPaperScissorsGame.prototype.onChoice = function(choice) {
  if (this.playerChoice || this.isGameOver) return;
  
  this.playerChoice = choice;
  this.computerChoice = this.choices[Math.floor(Math.random() * 3)];
  this.roundResult = this.getResult(choice, this.computerChoice);
  
  if (this.roundResult === 'win') {
    this.winCount++;
  }

  const self = this;
  if (this.winCount >= this.needWins) {
    setTimeout(function() { self.gameOver(true); }, 500);
  } else if (this.roundResult === 'lose') {
    setTimeout(function() { self.gameOver(false); }, 500);
  } else {
    setTimeout(function() {
      self.playerChoice = null;
      self.computerChoice = null;
      self.roundResult = null;
    }, 1000);
  }
};

RockPaperScissorsGame.prototype.getResult = function(player, computer) {
  if (player === computer) return 'draw';
  if (
    (player === 'rock' && computer === 'scissors') ||
    (player === 'paper' && computer === 'rock') ||
    (player === 'scissors' && computer === 'paper')
  ) {
    return 'win';
  }
  return 'lose';
};

RockPaperScissorsGame.prototype.render = function(ctx) {
  ctx.fillStyle = '#1A1A2E';
  ctx.fillRect(0, 0, this.width, this.height);
  
  this.renderTopBar(ctx, '石头剪刀布');
  this.renderScore(ctx);
  this.renderChoices(ctx);
  this.renderSkipButton(ctx);
};

RockPaperScissorsGame.prototype.renderScore = function(ctx) {
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText('需要赢 ' + this.needWins + ' 局 | 当前 ' + this.winCount + ' 胜', this.width / 2, 100);
};

RockPaperScissorsGame.prototype.renderChoices = function(ctx) {
  const choiceAreaY = this.height / 2 - 50;
  
  ctx.font = '16px Arial';
  ctx.fillStyle = '#AAAAAA';
  ctx.textAlign = 'center';
  ctx.fillText('电脑', this.width / 2, choiceAreaY - 80);
  ctx.fillText('VS', this.width / 2, choiceAreaY);
  
  const computerEmoji = this.computerChoice ? this.getEmoji(this.computerChoice) : '❓';
  ctx.font = '60px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(computerEmoji, this.width / 2, choiceAreaY - 20);

  if (this.roundResult) {
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = this.roundResult === 'win' ? '#4CAF50' : this.roundResult === 'lose' ? '#F44336' : '#FF9800';
    ctx.fillText(
      this.roundResult === 'win' ? '胜利!' : this.roundResult === 'lose' ? '失败!' : '平局!',
      this.width / 2,
      choiceAreaY + 30
    );
  }

  ctx.font = '16px Arial';
  ctx.fillStyle = '#AAAAAA';
  ctx.fillText('你', this.width / 2, choiceAreaY + 70);
  
  const playerEmoji = this.playerChoice ? this.getEmoji(this.playerChoice) : '❓';
  ctx.font = '60px Arial';
  ctx.fillText(playerEmoji, this.width / 2, choiceAreaY + 130);

  if (!this.playerChoice) {
    for (let i = 0; i < this.choiceButtons.length; i++) {
      const btn = this.choiceButtons[i];
      ctx.font = '40px Arial';
      ctx.fillText(btn.emoji, btn.x, btn.y);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(btn.x - 30, btn.y + 10, 60, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px Arial';
      ctx.fillText(btn.label, btn.x, btn.y + 30);
    }
  }
};

RockPaperScissorsGame.prototype.getEmoji = function(choice) {
  return { rock: '✊', paper: '✋', scissors: '✌️' }[choice];
};

RockPaperScissorsGame.prototype.onTouchStart = function(e) {
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
  
  if (this.isPaused) return;
  
  if (!this.playerChoice && !this.isGameOver) {
    for (let i = 0; i < this.choiceButtons.length; i++) {
      const btn = this.choiceButtons[i];
      if (x >= btn.x - 30 && x <= btn.x + 30 &&
          y >= btn.y - 40 && y <= btn.y + 40) {
        this.onChoice(btn.id);
        return;
      }
    }
  }

  const skipBtn = this.renderSkipButton(this.ctx);
  if (x >= skipBtn.x && x <= skipBtn.x + skipBtn.width &&
      y >= skipBtn.y && y <= skipBtn.y + skipBtn.height) {
    this.gameOver(false);
  }
};

module.exports = RockPaperScissorsGame;
