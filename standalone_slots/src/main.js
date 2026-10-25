/**
 * main.js - 独立老虎机主启动脚本
 */
window.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化主轮盘渲染器
  const canvas = document.getElementById('slots-canvas');
  let canvasRenderer = null;
  if (canvas && window.SlotsRPG.CanvasRenderer) {
    canvasRenderer = new window.SlotsRPG.CanvasRenderer(canvas);
  }

  // 2. 初始化神龙吐宝渲染器
  const dragonCanvas = document.getElementById('dragon-canvas');
  let dragonRenderer = null;
  if (dragonCanvas && window.SlotsRPG.DragonSpoutRenderer) {
    dragonRenderer = new window.SlotsRPG.DragonSpoutRenderer(dragonCanvas);
  }

  // 3. 注入渲染器到核心协调器
  const gm = window.SlotsRPG.GameManager;
  if (gm) {
    gm.init(canvasRenderer, dragonRenderer);
  }

  // 4. 挂载 UI 控制器
  if (window.SlotsRPG.SlotsUI) {
    new window.SlotsRPG.SlotsUI();
  }

  console.log('☯️ 独立天机轮盘 · 神龙吐宝单机版已就绪！');
});
