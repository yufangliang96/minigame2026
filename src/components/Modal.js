// 模态框组件
function Modal(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.visible = false;
  this.buttons = [];
  this.content = null;
}

Modal.prototype.show = function(content, buttons) {
  this.content = content;
  this.buttons = buttons || [];
  this.visible = true;
};

Modal.prototype.hide = function() {
  this.visible = false;
  this.content = null;
  this.buttons = [];
};

Modal.prototype.contains = function(px, py) {
  if (!this.visible) return false;
  for (let i = 0; i < this.buttons.length; i++) {
    if (this.buttons[i].contains(px, py)) return true;
  }
  return false;
};

Modal.prototype.onTouchStart = function(e) {
  if (!this.visible) return;
  let x, y;
  if (e.touches && e.touches.length > 0) {
    x = e.touches[0].clientX || e.touches[0].x || e.touches[0].pageX;
    y = e.touches[0].clientY || e.touches[0].y || e.touches[0].pageY;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    x = e.changedTouches[0].clientX || e.changedTouches[0].x;
    y = e.changedTouches[0].clientY || e.changedTouches[0].y;
  }
  if (x === undefined || y === undefined) return;
  
  for (let i = 0; i < this.buttons.length; i++) {
    if (this.buttons[i].contains(x, y)) {
      this.buttons[i].onPress();
      break;
    }
  }
};

Modal.prototype.onTouchEnd = function(e) {
  if (!this.visible) return;
  for (let i = 0; i < this.buttons.length; i++) {
    this.buttons[i].onRelease();
  }
};

Modal.prototype.render = function(ctx) {
  if (!this.visible) return;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fillStyle = '#2A2A4E';
  ctx.beginPath();
  this.roundRect(ctx, this.x, this.y, this.width, this.height, 16);
  ctx.fill();

  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.beginPath();
  this.roundRect(ctx, this.x, this.y, this.width, this.height, 16);
  ctx.stroke();

  if (this.content) {
    this.renderContent(ctx);
  }

  for (let i = 0; i < this.buttons.length; i++) {
    this.buttons[i].render(ctx);
  }
};

Modal.prototype.renderContent = function(ctx) {
  if (this.content.title) {
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText(this.content.title, this.x + this.width / 2, this.y + 50);
  }

  if (this.content.message) {
    ctx.font = '16px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(this.content.message, this.x + this.width / 2, this.y + 90);
  }

  if (this.content.icon) {
    ctx.font = '60px Arial';
    ctx.fillText(this.content.icon, this.x + this.width / 2, this.y + 140);
  }
};

Modal.prototype.roundRect = function(ctx, x, y, width, height, radius) {
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

module.exports = Modal;
