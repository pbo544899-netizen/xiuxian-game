// scratch/render_item_detail_preview_2btn.js - 验证 2 个按钮时的自适应并排效果
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
  <title>装备2按钮响应式预览</title>
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
    #modal-item-detail {
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
    <div id="modal-item-detail" class="modal-overlay">
      <div class="modal-card modal-item-card">
        <button id="btn-item-close-x" class="modal-close-x" aria-label="关闭详情">&times;</button>
        <div class="item-card-header">
          <div id="modal-item-icon-frame" class="item-icon-frame" style="border-color: #ffd700;">
            <img id="modal-item-icon" src="../assets/symbols/SYM_06.png" alt="法宝" />
          </div>
          <div class="item-meta">
            <h3 id="modal-item-name" class="item-title" style="color: #ffd700;">紫霄玄青剑</h3>
            <div class="item-tags">
              <span id="modal-item-quality" class="item-quality-tag" style="color: #ffd700;">宝器 (Q2)</span>
              <span id="modal-item-part" class="item-part-tag">武器</span>
            </div>
          </div>
        </div>

        <div class="item-stats-box">
          <div class="stats-box-title" id="modal-stats-box-title">法宝属性加成</div>
          <div id="modal-item-stats" class="stats-box-list">
            <div class="stat-line"><span class="stat-label">攻击力:</span><span class="stat-value stat-val-highlight">+180</span></div>
            <div class="stat-line"><span class="stat-label">气血值:</span><span class="stat-value stat-val-highlight">+500</span></div>
            <div class="stat-line"><span class="stat-label">防御力:</span><span class="stat-value stat-val-highlight">+60</span></div>
            <div class="stat-line" style="border-top:1px dashed rgba(255,255,255,0.1); padding-top:6px; margin-top:6px;">
              <span class="stat-label">法宝估值战力:</span><span class="stat-value" style="color:#ffaa00; font-weight:bold;">860</span>
            </div>
          </div>
          <div id="modal-item-compare" class="item-compare-tip">
            <span style="color:#34e89e;">● 正在佩戴中，属性已计入角色战力与属性</span>
          </div>
        </div>

        <div class="modal-actions modal-item-actions" id="modal-item-actions">
          <button id="btn-item-primary" class="btn-primary">卸下入包</button>
          <button id="btn-item-close" class="btn-secondary">关闭</button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

const tempHtmlPath = path.resolve(__dirname, 'preview_item_detail_2btn.html');
fs.writeFileSync(tempHtmlPath, testHtml, 'utf8');

const outImage = path.resolve(artifactDir, 'responsive_item_detail_2btn_preview.png');
const cmd = `"${edgePath}" --headless --disable-gpu --hide-scrollbars --screenshot="${outImage}" --window-size=480,853 "file:///${tempHtmlPath.replace(/\\/g, '/')}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('✅ Screenshot saved to:', outImage);
} catch (e) {
  console.error('❌ Failed to take screenshot:', e);
}
