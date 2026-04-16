Page({
  onLoad() {
    console.log('游戏首页加载完成');
  },
  
  startGame() {
    console.log('开始游戏');
    wx.showToast({
      title: '游戏启动中...',
      icon: 'loading',
      duration: 1500
    });
    
    // 延迟启动游戏，让用户看到提示
    setTimeout(() => {
      // 这里可以添加游戏启动逻辑
      this.launchGame();
    }, 1500);
  },
  
  launchGame() {
    try {
      // 如果有游戏管理器，使用它来启动游戏
      if (getApp().gameManager) {
        getApp().gameManager.startGame();
      } else {
        // 否则直接跳转到游戏页面
        wx.navigateTo({
          url: '/pages/game/game'
        });
      }
    } catch (error) {
      console.error('游戏启动失败:', error);
      wx.showToast({
        title: '游戏启动失败',
        icon: 'none',
        duration: 2000
      });
    }
  }
});