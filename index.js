// index.js - 万花筒·游境 (保留引用)
const gameModule = require('./game.js');
module.exports = gameModule;

if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (typeof r === 'number') {
      r = { tl: r, tr: r, br: r, bl: r };
    }
    this.moveTo(x + r.tl, y);
    this.lineTo(x + w - r.tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    this.lineTo(x + w, y + h - r.br);
    this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    this.lineTo(x + r.bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    this.lineTo(x, y + r.tl);
    this.quadraticCurveTo(x, y, x + r.tl, y);
    this.closePath();
  };
}

class Game {
  constructor() {
    try {
      console.log('[Game] 初始化中...');
      this.canvas = wx.createCanvas();
      console.log('[Game] Canvas创建成功:', this.canvas.width, 'x', this.canvas.height);
      this.ctx = this.canvas.getContext('2d');
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.currentScene = null;
      this.modal = new Modal(this.width / 2 - 100, this.height / 2 - 80, 200, 160);
      this.pauseModal = null;
      this.isPaused = false;
      this.lastTime = 0;
      console.log('[Game] 准备初始化...');
      this.init();
      console.log('[Game] 初始化完成!');
    } catch (e) {
      console.error('[Game] 初始化错误:', e);
    }
  }

  init() {
    try {
      console.log('[Game] 显示主场景...');
      this.showMainScene();
      console.log('[Game] 绑定事件...');
      this.bindEvents();
      console.log('[Game] 启动游戏循环...');
      this.gameLoop(0);
    } catch (e) {
      console.error('[Game] init错误:', e);
    }
  }

  bindEvents() {
    const self = this;
    wx.onTouchStart(function(e) {
      try {
        if (self.modal.visible) {
          self.modal.onTouchStart(e);
        } else if (self.pauseModal && self.pauseModal.visible) {
          self.pauseModal.onTouchStart(e);
        } else if (self.currentScene && self.currentScene.onTouchStart) {
          self.currentScene.onTouchStart(e);
        }
      } catch (err) {
        console.error('[Game] TouchStart错误:', err);
      }
    });

    wx.onTouchMove(function(e) {
      try {
        if (self.currentScene && self.currentScene.onTouchMove) {
          self.currentScene.onTouchMove(e);
        }
      } catch (err) {
        console.error('[Game] TouchMove错误:', err);
      }
    });

    wx.onTouchEnd(function(e) {
      try {
        if (self.modal.visible) {
          self.modal.onTouchEnd(e);
        } else if (self.pauseModal && self.pauseModal.visible) {
          self.pauseModal.onTouchEnd(e);
        } else if (self.currentScene && self.currentScene.onTouchEnd) {
          self.currentScene.onTouchEnd(e);
        }
      } catch (err) {
        console.error('[Game] TouchEnd错误:', err);
      }
    });
  }

  showMainScene() {
    this.isPaused = false;
    const self = this;
    this.currentScene = new MainScene(this.canvas, this);
    this.currentScene.on('startGame', function(game) { self.startGame(game); });
    this.currentScene.on('showAchievements', function() { self.showAchievements(); });
    this.currentScene.on('showRank', function() { self.showRank(); });
    this.currentScene.onEnter();
  }

  startGame(gameData) {
    this.isPaused = false;
    const self = this;
    const GameClass = GameFactory.createGame(gameData.id, this.canvas);
    GameClass.onGameEnd = function(win) { self.onGameEnd(win, gameData); };
    GameClass.onExit = function() { self.showMainScene(); };
    GameClass.onPause = function() { self.showPauseMenu(); };
    this.currentScene = GameClass;
    this.currentScene.onEnter();
  }

  showPauseMenu() {
    if (this.isPaused) return;
    this.isPaused = true;
    const self = this;
    const mx = this.width / 2 - 90;
    const my = this.height / 2 - 70;
    this.pauseModal = new Modal(mx, my, 180, 140);
    this.pauseModal.show(
      { title: '暂停' },
      [
        new Button(mx + 15, my + 70, 150, 35, '#4CAF50', '继续'),
        new Button(mx + 15, my + 110, 150, 35, '#FF9800', '返回主页')
      ]
    );
    this.pauseModal.buttons[0].onClick = function() { self.resumeGame(); };
    this.pauseModal.buttons[1].onClick = function() {
      self.pauseModal.visible = false;
      self.pauseModal = null;
      self.showMainScene();
    };
  }

  resumeGame() {
    if (!this.isPaused) return;
    this.isPaused = false;
    if (this.pauseModal) {
      this.pauseModal.visible = false;
      this.pauseModal = null;
    }
    if (this.currentScene && this.currentScene.onResume) {
      this.currentScene.onResume();
    }
    this.lastTime = Date.now();
  }

  onGameEnd(win, gameData) {
    const progress = gameManager.getProgress();
    const self = this;
    const mx = this.width / 2 - 100;
    const my = this.height / 2 - 100;
    this.modal = new Modal(mx, my, 200, 200);
    this.modal.show(
      {
        title: win ? '胜利!' : '失败',
        icon: win ? '🏆' : '😢',
        message: '第' + progress.level + '关'
      },
      [
        new Button(mx + 15, my + 130, 80, 40, '#4CAF50', '下一关'),
        new Button(mx + 105, my + 130, 80, 40, '#FF9800', '重玩')
      ]
    );
    this.modal.buttons[0].onClick = function() {
      self.modal.visible = false;
      self.startGame(gameData);
    };
    this.modal.buttons[1].onClick = function() {
      self.modal.visible = false;
      self.showMainScene();
    };
  }

  showAchievements() {
    const achievements = Array.from(gameManager.achievements);
    let msg = achievements.length > 0 ? '已获得 ' + achievements.length + ' 个成就' : '暂无成就';
    wx.showModal({
      title: '成就',
      content: msg,
      showCancel: true,
      cancelText: '返回',
      confirmText: '查看'
    });
  }

  showRank() {
    wx.showToast({ title: '排行榜开发中', icon: 'none' });
  }

  gameLoop(timestamp) {
    try {
      if (!this.lastTime) this.lastTime = timestamp;
      const deltaTime = (timestamp - this.lastTime) / 1000;
      this.lastTime = timestamp;

      if (!this.isPaused && this.currentScene) {
        this.currentScene.update(deltaTime);
        this.currentScene.render(this.ctx);
      }

      if (this.pauseModal && this.pauseModal.visible) {
        this.pauseModal.render(this.ctx);
      }

      if (this.modal.visible) {
        this.modal.render(this.ctx);
      }
    } catch (e) {
      console.error('[Game] render错误:', e);
    }

    const self = this;
    requestAnimationFrame(function(t) { self.gameLoop(t); });
  }
}

const game = new Game();
module.exports = game;
