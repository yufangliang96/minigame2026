// 按钮组件
function Button(x, y, width, height, color, text) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.color = color;
  this.text = text;
  this.isPressed = false;
  this.onClick = null;
  this.scale = 1;
  this.targetScale = 1;
}

Button.prototype.contains = function(px, py) {
  return px >= this.x && px <= this.x + this.width &&
         py >= this.y && py <= this.y + this.height;
};

Button.prototype.onPress = function() {
  this.isPressed = true;
  this.targetScale = 0.95;
};

Button.prototype.onRelease = function() {
  if (this.isPressed && this.onClick) {
    this.onClick();
  }
  this.isPressed = false;
  this.targetScale = 1;
};

Button.prototype.update = function(deltaTime) {
  this.scale += (this.targetScale - this.scale) * 0.2;
};

Button.prototype.render = function(ctx) {
  const centerX = this.x + this.width / 2;
  const centerY = this.y + this.height / 2;
  
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(this.scale, this.scale);
  ctx.translate(-centerX, -centerY);

  const actualColor = this.isPressed ? this.darkenColor(this.color, 20) : this.color;
  ctx.fillStyle = actualColor;
  ctx.beginPath();
  this.roundRect(ctx, this.x, this.y, this.width, this.height, 8);
  ctx.fill();

  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(this.text, centerX, centerY);

  ctx.restore();
};

Button.prototype.roundRect = function(ctx, x, y, width, height, radius) {
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

Button.prototype.darkenColor = function(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
  const B = Math.max((num & 0x0000FF) - amt, 0);
  return '#' + (1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1);
};

module.exports = Button;
