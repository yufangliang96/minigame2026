# 万花筒·游境 (Kaleido·Play)

一款融合多重随机玩法的微信小游戏

## 项目结构

```
mygame/
├── game.js              # 入口文件
├── index.js             # 游戏主逻辑
├── game.json            # 游戏配置
├── project.config.json  # 项目配置
├── src/
│   ├── scenes/          # 场景
│   │   ├── BaseScene.js
│   │   ├── MainScene.js
│   │   └── GameScene.js
│   ├── components/      # UI组件
│   │   ├── Button.js
│   │   ├── ProgressBar.js
│   │   └── Modal.js
│   ├── games/           # 游戏玩法
│   │   ├── GameFactory.js
│   │   ├── RockPaperScissorsGame.js
│   │   ├── CatchDropsGame.js
│   │   └── Mini2048Game.js
│   └── utils/           # 工具类
│       ├── constants.js
│       ├── GameManager.js
│       └── AudioManager.js
└── assets/              # 资源文件
    └── images/
```

## 功能特性

- **随机玩法系统**: 8种不同的游戏玩法
  - 运气类: 石头剪刀布、抽签对决
  - 反应类: 接住掉落物、快速点击
  - 策略类: 简易版2048、数字华容道
  - 操作类: 弹球入洞、躲避障碍

- **成就系统**: 玩法收藏家、连胜达人、幸运之子

- **社交功能**: 分享、求助好友、排行榜

## 开发

1. 使用微信开发者工具导入项目
2. 选择 game 类型项目
3. 设置 AppID 或使用测试号

## 玩法池 (v1.0)

| 类型 | 游戏 | 时长 |
|------|------|------|
| 运气 | 石头剪刀布 | 10秒 |
| 运气 | 抽签对决 | 10秒 |
| 反应 | 接住掉落物 | 15秒 |
| 反应 | 快速点击 | 15秒 |
| 策略 | 简易版2048 | 30秒 |
| 策略 | 数字华容道 | 30秒 |
| 操作 | 弹球入洞 | 25秒 |
| 操作 | 躲避障碍 | 25秒 |

## 技术要求

- 首次加载 < 3秒
- 关卡切换 < 1秒
- 主包 < 2MB
- 支持 iOS 12+, Android 8+, 微信 8.0+
