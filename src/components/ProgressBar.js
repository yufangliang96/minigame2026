// 进度条组件
function ProgressBar(x, y, width, height, current, total) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.current = current;
  this.total = total;
  this.displayProgress = current / total;
}

ProgressBar.prototype.update = function(deltaTime) {
  const targetProgress = this.current / this.total;
  this.displayProgress += (targetProgress - this.displayProgress) * 0.1;
};

ProgressBar.prototype.render = function(ctx) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  this.roundRect(ctx, this.x, this.y, this.width, this.height, this.height / 2);
  ctx.fill();

  const progressWidth = this.width * this.displayProgress;
  if (progressWidth > 0) {
    const gradient = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(1, '#FFA500');
    ctx.fillStyle = gradient;
    this.roundRect(ctx, this.x, this.y, progressWidth, this.height, this.height / 2);
    ctx.fill();
  }
};

ProgressBar.prototype.roundRect = function(ctx, x, y, width, height, radius) {
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

module.exports = ProgressBar;
