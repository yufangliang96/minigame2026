// game.js - 万花筒·游境 主入口
const AudioManager = require('./src/utils/AudioManager.js');
const MainScene = require('./src/scenes/MainScene.js');
const Modal = require('./src/components/Modal.js');
const Button = require('./src/components/Button.js');
const GameFactory = require('./src/games/GameFactory.js');
const gameManager = require('./gameManager.js');

const audioManager = new AudioManager();
audioManager.init();

if (typeof CanvasRenderingContext2D !== 'undefined') {
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
      r = typeof r === 'number' ? r : 5;
      this.beginPath();
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.arcTo(x + w, y, x + w, y + r, r);
      this.lineTo(x + w, y + h - r);
      this.arcTo(x + w, y + h, x + w - r, y + h, r);
      this.lineTo(x + r, y + h);
      this.arcTo(x, y + h, x, y + h - r, r);
      this.lineTo(x, y + r);
      this.arcTo(x, y, x + r, y, r);
      this.closePath();
    };
  }
}

wx.onShareAppMessage(function() {
  return {
    title: '万花筒·游境 - 一局一玩法，关关不重样',
    imageUrl: 'assets/images/share.png'
  };
});

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
    
    if (typeof wx !== 'undefined') {
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
    GameClass.audioManager = audioManager;
    GameClass.onGameEnd = function(win) { 
      if (win) audioManager.playWin();
      self.onGameEnd(win, gameData); 
    };
    GameClass.onExit = function() { 
      audioManager.stopBGM();
      self.showMainScene(); 
    };
    GameClass.onPause = function() { 
      audioManager.stopBGM();
      self.showPauseMenu(); 
    };
    this.currentScene = GameClass;
    this.currentScene.onEnter();
    audioManager.playBGM();
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
    audioManager.playBGM();
    this.lastTime = 0;
  }

  onGameEnd(win, gameData) {
    const self = this;
    var finalScore = this.currentScene ? this.currentScene.score : 0;
    var targetReached = finalScore >= (this.currentScene ? this.currentScene.needScore : 0);
    const mx = this.width / 2 - 120;
    const my = this.height / 2 - 120;
    this.modal = new Modal(mx, my, 240, 240);
    var btnContinue = new Button(mx + 15, my + 100, 210, 38, '#4CAF50', '继续挑战');
    var btnNext = new Button(mx + 15, my + 145, 100, 35, '#2196F3', '下一关');
    var btnReplay = new Button(mx + 125, my + 145, 100, 35, '#FF9800', '重玩');
    var btnHome = new Button(mx + 15, my + 188, 210, 35, '#9E9E9E', '返回主页');
    this.modal.show(
      {
        title: targetReached ? '目标达成!' : '战机坠毁',
        icon: targetReached ? '🏆' : '💥',
        message: '得分: ' + finalScore
      },
      [btnContinue, btnNext, btnReplay, btnHome]
    );
    btnContinue.onClick = function() {
      self.modal.visible = false;
      self.isPaused = false;
      if (self.currentScene) {
        self.currentScene.isGameOver = false;
        self.currentScene.isPaused = false;
        self.currentScene.player.hp = self.currentScene.player.maxHp;
        self.currentScene.score = 0;
        self.currentScene.enemies = [];
        self.currentScene.enemyBullets = [];
        self.currentScene.bullets = [];
        self.currentScene.powerups = [];
        self.currentScene.finalBoss = null;
        self.currentScene.finalBossSpawned = false;
        self.currentScene.finalBossDefeated = false;
        self.currentScene.finalBossWarning = 0;
      }
      self.lastTime = 0;
    };
    btnNext.onClick = function() {
      self.modal.visible = false;
      if (self.currentScene && self.currentScene.onExit) {
        self.currentScene.onExit();
      }
      self.currentScene = null;
      self.isPaused = false;
      const newGameData = gameManager.startLevel();
      self.startGame(newGameData);
    };
    btnReplay.onClick = function() {
      self.modal.visible = false;
      if (self.currentScene && self.currentScene.onExit) {
        self.currentScene.onExit();
      }
      self.currentScene = null;
      self.isPaused = false;
      self.startGame(gameData);
    };
    btnHome.onClick = function() {
      self.modal.visible = false;
      if (self.currentScene && self.currentScene.onExit) {
        self.currentScene.onExit();
      }
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

      // 如果弹窗显示，只渲染弹窗
      if (this.modal.visible) {
        if (this.currentScene) {
          this.currentScene.render(this.ctx);
        }
        this.modal.render(this.ctx);
      } else if (this.pauseModal && this.pauseModal.visible) {
        if (this.currentScene) {
          this.currentScene.render(this.ctx);
        }
        this.pauseModal.render(this.ctx);
      } else if (!this.isPaused && this.currentScene) {
        this.currentScene.update(deltaTime);
        this.currentScene.render(this.ctx);
      }
    } catch (e) {
      console.error('[Game] render错误:', e);
    }

    const self = this;
    requestAnimationFrame(function(t) { self.gameLoop(t); });
  }
}

const game = new Game();

module.exports = {
  game,
  gameManager,
  audioManager
};
