# 周天奇门阵盘 · 独立老虎机纯享版 (Standalone Slots)

这是一个从修仙 RPG 中完全抽离出来的**纯净单机版老虎机推演核心**。它将核心 Slots 算法、数学模型、Canvas 动态渲染与神龙吐宝机制封装在一个自包含的独立文件夹中。

---

## 🌟 核心特色

1. **双重表现模式实时切换**：
   - **☯️ 天机轮盘**：5 轴 x 3 行标准轮盘，支持动态金纹连线绘制、粒子光效、顿帧阻尼减速与弹次回弹。
   - **🐲 神龙吐宝**：神龙法相吐息飞弹轨迹，宝物依次喷入左右宝匣槽位。
2. **纯代码国风矢量符号**：
   - 无任何外部切图依赖，`SymbolPainter` 实时通过 HTML5 Canvas 绘制 13 类新国风道门修仙阵纹符号（聚灵符、凝神符、破魔符、气血丹、修为丹、玄铁剑、青云甲、紫金戒、混元履、捆仙索、万应灵珠 WILD、妖兽逆鳞 SCATTER、造化秘印 BONUS）。
3. **数学模型与高精度 RTP 体系**：
   - 25 条标准共鸣线（`PaylinesConfig.js`）。
   - 包含 WILD 替用、三连/四连/五连阶梯倍率（`PaytableConfig.js`）。
   - 实时统计流水、派彩与动态会话 RTP%。
4. **功能完整**：
   - 倍率调节：`x1`、`x2`、`x5`、`x10`、`x20`。
   - 单抽、一键爆发 10 连推演、自动巡航（10次、50次、无限循环）。
   - 纯 Web Audio API 实时音频合成（无需外置 mp3 资源）。
   - 完整的阵纹图谱与赔率速查弹窗。

---

## 📁 目录结构

```
standalone_slots/
├── index.html                  # 独立启动网页
├── README.md                   # 本说明文件
├── css/
│   └── slots.css               # 专属纯享版样式表 (移动端+桌面端自适应)
├── assets/
│   └── dragon/                 # 神龙吐宝专属美术切图
└── src/
    ├── audio/
    │   └── SlotsSoundEngine.js # 纯 Web Audio API 独立音效引擎
    ├── bonus/
    │   └── HoldAndSpinEngine.js# 锁盘重转/奖励算法
    ├── core/
    │   ├── EventBus.js         # 全局事件解耦总线 (公共模块复本)
    │   ├── StorageService.js   # 独立持久化存储 (公共模块复本)
    │   └── SlotsGameManager.js # 独立游戏状态、筹码与统计调度器
    ├── dragon/
    │   ├── DragonCabinetManager.js # 左右宝物槽位管理
    │   ├── DragonLootEngine.js     # 吐宝掉落池与爆率判定
    │   └── DragonSpoutRenderer.js  # 神龙吐宝飞弹轨迹渲染
    ├── render/
    │   ├── AssetManager.js     # 资源预加载管理
    │   ├── CanvasRenderer.js   # 5x3 轮盘主渲染器
    │   ├── DropAnimator.js     # 掉落下落动画
    │   └── SymbolPainter.js    # 纯矢量符号 Canvas 绘制器
    ├── slots/
    │   ├── FlowController.js   # 推演生命周期状态机
    │   ├── GameBalanceConfig.js# 数值平衡、权重与 RTP 配置
    │   ├── PaylinesConfig.js   # 25 条支付线几何定义
    │   ├── PaytableConfig.js   # 13 类符号赔率表
    │   └── SlotsEngine.js      # 核心算法与中奖结算判定
    ├── ui/
    │   └── SlotsUI.js          # 交互按键、弹窗与 HUD 响应
    └── main.js                 # 独立入口启动程序
```

---

## 🚀 启动与体验方式

直接在浏览器中打开 `standalone_slots/index.html`，或者通过任意 Web 服务器访问：

```bash
# 启动本地测试服务
python -m http.server 8085

# 访问独立老虎机纯享版
http://localhost:8085/standalone_slots/index.html
```
