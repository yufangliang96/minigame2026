// 音频管理器 - Web Audio API 生成音效
function AudioManager() {
  this.volume = 0.3;
  this.muted = false;
  this.lastShootTime = 0;
  this.ctx = null;
  this.bgmOsc = null;
  this.bgmGain = null;
  this._bgmInterval = null;
}

AudioManager.prototype.init = function() {
  try {
    this.ctx = wx.createWebAudioContext();
    console.log('[Audio] WebAudioContext创建成功');
  } catch (e) {
    console.error('[Audio] WebAudioContext创建失败:', e);
  }
};

AudioManager.prototype._ensureContext = function() {
  if (!this.ctx) {
    this.init();
  }
  return this.ctx;
};

AudioManager.prototype.playBGM = function() {
  if (this.muted) return;
  const ctx = this._ensureContext();
  if (!ctx) return;
  if (this.bgmOsc) return;

  this.bgmGain = ctx.createGain();
  this.bgmGain.gain.value = this.volume * 0.12;
  this.bgmGain.connect(ctx.destination);

  var self = this;
  this.bgmOsc = ctx.createOscillator();
  this.bgmOsc.type = 'sawtooth';
  this.bgmOsc.frequency.value = 110;
  this.bgmOsc.connect(this.bgmGain);
  this.bgmOsc.start();

  var filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  this.bgmOsc.disconnect();
  this.bgmOsc.connect(filter);
  filter.connect(this.bgmGain);

  this._playBgmLoop();
};

AudioManager.prototype._playBgmLoop = function() {
  if (!this.ctx || !this.bgmOsc || this.muted) return;
  var self = this;
  var bassNotes = [110, 110, 130.8, 130.8, 146.8, 146.8, 164.8, 164.8];
  var idx = 0;
  this._bgmInterval = setInterval(function() {
    if (self.bgmOsc) {
      self.bgmOsc.frequency.value = bassNotes[idx % bassNotes.length];
      idx++;
    }
  }, 250);
};

AudioManager.prototype.stopBGM = function() {
  if (this.bgmOsc) {
    try { this.bgmOsc.stop(); } catch (e) {}
    this.bgmOsc = null;
  }
  if (this._bgmInterval) {
    clearInterval(this._bgmInterval);
    this._bgmInterval = null;
  }
  this.bgmGain = null;
};

AudioManager.prototype.playShoot = function() {
  if (this.muted) return;
  const ctx = this._ensureContext();
  if (!ctx) return;
  const now = Date.now();
  if (now - this.lastShootTime < 80) return;
  this.lastShootTime = now;

  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.06);
  gain.gain.setValueAtTime(this.volume * 0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.06);
};

AudioManager.prototype.playExplosion = function() {
  if (this.muted) return;
  const ctx = this._ensureContext();
  if (!ctx) return;

  var bufferSize = ctx.sampleRate * 0.3;
  var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  var data = buffer.getChannelData(0);
  for (var i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }

  var source = ctx.createBufferSource();
  source.buffer = buffer;
  var gain = ctx.createGain();
  gain.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(ctx.currentTime);
};

AudioManager.prototype.playWin = function() {
  if (this.muted) return;
  const ctx = this._ensureContext();
  if (!ctx) return;

  var self = this;
  var notes = [523.3, 659.3, 784, 1046.5];
  notes.forEach(function(freq, i) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    var t = ctx.currentTime + i * 0.12;
    gain.gain.setValueAtTime(self.volume * 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  });
};

AudioManager.prototype.playHit = function() {
  if (this.muted) return;
  const ctx = this._ensureContext();
  if (!ctx) return;

  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
};

AudioManager.prototype.setVolume = function(vol) {
  this.volume = vol;
  if (this.bgmGain) {
    this.bgmGain.gain.value = this.volume * 0.12;
  }
};

AudioManager.prototype.toggleMute = function() {
  this.muted = !this.muted;
  if (this.muted) {
    this.stopBGM();
  } else {
    this.playBGM();
  }
  return this.muted;
};

module.exports = AudioManager;
