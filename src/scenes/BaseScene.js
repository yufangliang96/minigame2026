// 场景基类
function BaseScene(canvas) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.width = canvas.width;
  this.height = canvas.height;
  this.children = [];
  this.isActive = false;
  this.listeners = {};
}

BaseScene.prototype.addChild = function(node) {
  this.children.push(node);
};

BaseScene.prototype.removeChild = function(node) {
  const index = this.children.indexOf(node);
  if (index > -1) {
    this.children.splice(index, 1);
  }
};

BaseScene.prototype.onEnter = function() {
  this.isActive = true;
};

BaseScene.prototype.onExit = function() {
  this.isActive = false;
};

BaseScene.prototype.update = function(deltaTime) {
  for (let i = 0; i < this.children.length; i++) {
    const child = this.children[i];
    if (child.update) child.update(deltaTime);
  }
};

BaseScene.prototype.render = function(ctx) {
  for (let i = 0; i < this.children.length; i++) {
    const child = this.children[i];
    if (child.render) child.render(ctx);
  }
};

BaseScene.prototype.on = function(event, callback) {
  if (!this.listeners[event]) {
    this.listeners[event] = [];
  }
  this.listeners[event].push(callback);
};

BaseScene.prototype.emit = function(event, data) {
  const callbacks = this.listeners[event] || [];
  for (let i = 0; i < callbacks.length; i++) {
    callbacks[i](data);
  }
};

BaseScene.prototype.onTouchStart = function(e) {};
BaseScene.prototype.onTouchMove = function(e) {};
BaseScene.prototype.onTouchEnd = function(e) {};

module.exports = BaseScene;
