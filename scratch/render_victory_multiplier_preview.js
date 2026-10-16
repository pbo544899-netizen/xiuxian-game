// scratch/render_victory_multiplier_preview.js - 生成200消耗(8倍加持)击杀赤炼蟒胜利结算弹窗截图
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\baish\\.gemini\\antigravity\\brain\\f5e80861-4372-436a-b5df-1b61c7c22a68';

const testHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>8倍消耗 Boss 战胜利结算预览</title>
  <link rel="stylesheet" href="../css/style.css" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #05070a;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #app-container {
      width: 480px;
      height: 853px;
      position: relative;
      background: #0d1117;
      margin: 0 auto;
    }
    #modal-battle-victory {
      display: flex !important;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.85);
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
  </style>
</head>
<body>
  <div id="app-container">
    <div id="modal-battle-victory" class="modal-overlay">
      <div class="modal-card victory-card">
        <div class="victory-banner">
          <span class="victory-badge">⚔️ 降妖大捷</span>
          <h2 class="victory-title">伏 魔 功 成</h2>
          <p id="victory-subtitle" class="victory-subtitle">赤炼蟒诛灭，天道甘霖倾泻！（8倍机缘加持）</p>
        </div>

        <!-- 战利品展示 -->
        <div class="victory-rewards-list">
          <div class="reward-pill-badge">
            <span>修为经验:</span><b id="victory-reward-exp" style="color:#f9d423;">+4800</b>
          </div>
          <div class="reward-pill-badge">
            <span>返还机缘:</span><b id="victory-reward-energy" style="color:#34e89e;">+4800</b>
          </div>
        </div>

        <div id="victory-items-grid" class="victory-items-grid">
          <!-- 装备 -->
          <div class="victory-item-cell" style="border-color: #38bdf8; box-shadow: 0 0 12px #38bdf845, inset 0 0 6px #38bdf820;">
            <span class="victory-item-tag" style="background:#38bdf825; color:#38bdf8;">灵器</span>
            <img src="../assets/symbols/SYM_06.png" class="victory-item-icon" alt="下品灵器·寒铁剑" />
            <div class="victory-item-name" style="color:#38bdf8;">下品灵器·寒铁剑</div>
          </div>
          <!-- 丹药 (8倍 = 40颗) -->
          <div class="victory-item-cell" style="border-color: #f9d423; box-shadow: 0 0 12px #f9d42345, inset 0 0 6px #f9d42320;">
            <span class="victory-item-count">x40</span>
            <img src="../assets/symbols/SYM_05.png" class="victory-item-icon" alt="九转修为丹" />
            <div class="victory-item-name" style="color:#f9d423;">九转修为丹</div>
          </div>
        </div>

        <div class="modal-actions" style="margin-top: 24px;">
          <button id="btn-victory-claim" class="btn-action primary pulse" style="width: 100%; height: 48px; font-size: 16px;">
            纳 宝 入 囊 (8倍收益)
          </button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

const tempHtmlPath = path.join(__dirname, 'temp_victory_preview.html');
fs.writeFileSync(tempHtmlPath, testHtml, 'utf8');

const outputPng = path.join(artifactDir, 'battle_victory_8x_rewards_preview.png');

try {
  const cmd = `"${edgePath}" --headless --disable-gpu --screenshot="${outputPng}" --window-size=480,853 "${tempHtmlPath}"`;
  console.log('Running Edge headless screenshot...');
  execSync(cmd);
  console.log('✅ 截图生成成功:', outputPng);
} catch (err) {
  console.error('截图生成失败:', err);
} finally {
  if (fs.existsSync(tempHtmlPath)) {
    fs.unlinkSync(tempHtmlPath);
  }
}
