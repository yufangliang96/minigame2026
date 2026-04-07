// 简易版2048游戏
const GameScene = require('../scenes/GameScene.js');

function Mini2048Game(canvas) {
  GameScene.call(this, canvas, { id: 'mini_2048', name: '简易版2048', duration: 30 });
  this.gridSize = 4;
  this.tileSize = 70;
  this.tileGap = 10;
  this.grid = [];
  this.score = 0;
  this.needScore = 2048;
  this.offsetX = 0;
  this.offsetY = 0;
}

Mini2048Game.prototype = Object.create(GameScene.prototype);
Mini2048Game.prototype.constructor = Mini2048Game;

Mini2048Game.prototype.onEnter = function() {
  GameScene.prototype.onEnter.call(this);
  this.offsetX = (this.width - (this.tileSize * this.gridSize + this.tileGap * (this.gridSize - 1))) / 2;
  this.offsetY = 150;
  this.initGrid();
};

Mini2048Game.prototype.initGrid = function() {
  this.grid = [];
  for (let i = 0; i < this.gridSize; i++) {
    this.grid.push(new Array(this.gridSize).fill(0));
  }
  this.score = 0;
  this.addRandomTile();
  this.addRandomTile();
};

Mini2048Game.prototype.addRandomTile = function() {
  const empty = [];
  for (let r = 0; r < this.gridSize; r++) {
    for (let c = 0; c < this.gridSize; c++) {
      if (this.grid[r][c] === 0) empty.push({ r: r, c: c });
    }
  }
  if (empty.length > 0) {
    const pos = empty[Math.floor(Math.random() * empty.length)];
    this.grid[pos.r][pos.c] = Math.random() > 0.7 ? 4 : 2;
  }
};

Mini2048Game.prototype.move = function(direction) {
  if (this.isGameOver) return;

  let moved = false;
  const oldGrid = JSON.stringify(this.grid);

  if (direction === 'left' || direction === 'right') {
    for (let r = 0; r < this.gridSize; r++) {
      let row = this.grid[r].filter(function(v) { return v !== 0; });
      if (direction === 'right') row.reverse();
      
      for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i + 1]) {
          row[i] *= 2;
          this.score += row[i];
          row.splice(i + 1, 1);
        }
      }
      
      while (row.length < this.gridSize) row.push(0);
      if (direction === 'right') row.reverse();
      
      this.grid[r] = row;
    }
  } else {
    for (let c = 0; c < this.gridSize; c++) {
      let col = [];
      for (let r = 0; r < this.gridSize; r++) col.push(this.grid[r][c]);
      col = col.filter(function(v) { return v !== 0; });
      if (direction === 'down') col.reverse();
      
      for (let i = 0; i < col.length - 1; i++) {
        if (col[i] === col[i + 1]) {
          col[i] *= 2;
          this.score += col[i];
          col.splice(i + 1, 1);
        }
      }
      
      while (col.length < this.gridSize) col.push(0);
      if (direction === 'down') col.reverse();
      
      for (let r = 0; r < this.gridSize; r++) this.grid[r][c] = col[r];
    }
  }

  moved = oldGrid !== JSON.stringify(this.grid);
  
  if (moved) {
    this.addRandomTile();
    if (this.score >= this.needScore) {
      this.gameOver(true);
    } else if (!this.canMove()) {
      this.gameOver(false);
    }
  }
};

Mini2048Game.prototype.canMove = function() {
  for (let r = 0; r < this.gridSize; r++) {
    for (let c = 0; c < this.gridSize; c++) {
      if (this.grid[r][c] === 0) return true;
      if (c < this.gridSize - 1 && this.grid[r][c] === this.grid[r][c + 1]) return true;
      if (r < this.gridSize - 1 && this.grid[r][c] === this.grid[r + 1][c]) return true;
    }
  }
  return false;
};

Mini2048Game.prototype.render = function(ctx) {
  ctx.fillStyle = '#1A1A2E';
  ctx.fillRect(0, 0, this.width, this.height);
  
  this.renderTopBar(ctx, '简易版2048');
  this.renderScore(ctx);
  this.renderGrid(ctx);
  this.renderControls(ctx);
  this.renderSkipButton(ctx);
};

Mini2048Game.prototype.renderScore = function(ctx) {
  ctx.font = 'bold 18px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText('得分: ' + this.score + ' / ' + this.needScore, this.width / 2, 100);
};

Mini2048Game.prototype.renderGrid = function(ctx) {
  for (let r = 0; r < this.gridSize; r++) {
    for (let c = 0; c < this.gridSize; c++) {
      const x = this.offsetX + c * (this.tileSize + this.tileGap);
      const y = this.offsetY + r * (this.tileSize + this.tileGap);
      
      const value = this.grid[r][c];
      ctx.fillStyle = value ? this.getTileColor(value) : '#3A3A5E';
      ctx.beginPath();
      this.roundRect(ctx, x, y, this.tileSize, this.tileSize, 8);
      ctx.fill();
      
      if (value) {
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = value > 4 ? '#FFFFFF' : '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toString(), x + this.tileSize / 2, y + this.tileSize / 2);
      }
    }
  }
};

Mini2048Game.prototype.getTileColor = function(value) {
  const colors = {
    2: '#EEE4DA', 4: '#EDE0C8', 8: '#F2B179', 16: '#F59563',
    32: '#F67C5F', 64: '#F65E3B', 128: '#EDCF72', 256: '#EDCC61',
    512: '#EDC850', 1024: '#EDC53F', 2048: '#EDC22E'
  };
  return colors[value] || '#3A3A5E';
};

Mini2048Game.prototype.renderControls = function(ctx) {
  const btnY = this.offsetY + this.gridSize * (this.tileSize + this.tileGap) + 40;
  const btnSize = 50;
  const spacing = 70;
  const centerX = this.width / 2;

  const controls = [
    { dir: 'up', x: centerX, y: btnY - spacing, symbol: '▲' },
    { dir: 'left', x: centerX - spacing, y: btnY, symbol: '◀' },
    { dir: 'down', x: centerX, y: btnY + spacing, symbol: '▼' },
    { dir: 'right', x: centerX + spacing, y: btnY, symbol: '▶' }
  ];

  for (let i = 0; i < controls.length; i++) {
    const btn = controls[i];
    ctx.fillStyle = '#4A4A7E';
    ctx.beginPath();
    ctx.arc(btn.x, btn.y, btnSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.font = '24px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.symbol, btn.x, btn.y);
  }
};

Mini2048Game.prototype.roundRect = function(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

Mini2048Game.prototype.onTouchStart = function(e) {
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
  
  const btnY = this.offsetY + this.gridSize * (this.tileSize + this.tileGap) + 40;
  const btnSize = 50;
  const spacing = 70;
  const centerX = this.width / 2;

  const controls = [
    { dir: 'up', x: centerX, y: btnY - spacing },
    { dir: 'left', x: centerX - spacing, y: btnY },
    { dir: 'down', x: centerX, y: btnY + spacing },
    { dir: 'right', x: centerX + spacing, y: btnY }
  ];

  for (let i = 0; i < controls.length; i++) {
    const ctrl = controls[i];
    const dx = x - ctrl.x;
    const dy = y - ctrl.y;
    if (Math.sqrt(dx * dx + dy * dy) < btnSize / 2) {
      this.move(ctrl.dir);
      return;
    }
  }

  const skipBtn = { x: centerX - 35, y: this.height - 75, width: 70, height: 32 };
  if (x >= skipBtn.x && x <= skipBtn.x + skipBtn.width &&
      y >= skipBtn.y && y <= skipBtn.y + skipBtn.height) {
    this.gameOver(false);
  }
};

Mini2048Game.prototype.onTouchMove = function(e) {};
Mini2048Game.prototype.onTouchEnd = function(e) {};

module.exports = Mini2048Game;
