// scratch/render_item_detail_preview.js - 生成聚灵符、装备、丹药详情弹窗在手机视口下的渲染截图
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\baish\\.gemini\\antigravity\\brain\\f5e80861-4372-436a-b5df-1b61c7c22a68';

// 创建临时测试 HTML
const testHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>道具详情响应式预览</title>
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
          <div id="modal-item-icon-frame" class="item-icon-frame" style="border-color: #38bdf8;">
            <img id="modal-item-icon" src="../assets/symbols/SYM_01.png" alt="聚灵符" />
          </div>
          <div class="item-meta">
            <h3 id="modal-item-name" class="item-title" style="color: #38bdf8;">聚灵符</h3>
            <div class="item-tags">
              <span id="modal-item-quality" class="item-quality-tag" style="color: #38bdf8;">储量: 55</span>
              <span id="modal-item-part" class="item-part-tag">道家符箓</span>
            </div>
          </div>
        </div>

        <div class="item-stats-box">
          <div class="stats-box-title" id="modal-stats-box-title">道家真符效用</div>
          <div id="modal-item-stats" class="stats-box-list">
            <div class="stat-line"><span class="stat-label">道符品名:</span><span class="stat-value" style="color:#38bdf8; font-weight:bold;">聚灵符</span></div>
            <div class="stat-line stat-line-desc">
              <span class="stat-label">道符效用:</span>
              <span class="stat-value desc-text">内蕴道家真灵灵机，可直接炼化吸收转化为 <b>+20 机缘</b>！</span>
            </div>
            <div class="stat-line"><span class="stat-label">乾坤储量:</span><span class="stat-value stat-val-highlight">55 张</span></div>
          </div>
          <div id="modal-item-compare" class="item-compare-tip">
            <span style="color:#38bdf8;">● 天地造化信物：点击下方按钮即可炼化为滚轮推演机缘！</span>
          </div>
        </div>

        <div class="modal-actions modal-item-actions has-three-buttons" id="modal-item-actions">
          <button id="btn-item-primary" class="btn-primary">炼化 1 张 (+20机缘)</button>
          <button id="btn-item-salvage" class="btn-secondary">全部炼化 (+1100机缘)</button>
          <button id="btn-item-close" class="btn-secondary">关闭</button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

const tempHtmlPath = path.resolve(__dirname, 'preview_item_detail.html');
fs.writeFileSync(tempHtmlPath, testHtml, 'utf8');

const outImage = path.resolve(artifactDir, 'responsive_item_detail_preview.png');
const cmd = `"${edgePath}" --headless --disable-gpu --hide-scrollbars --screenshot="${outImage}" --window-size=480,853 "file:///${tempHtmlPath.replace(/\\/g, '/')}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('✅ Screenshot saved to:', outImage);
} catch (e) {
  console.error('❌ Failed to take screenshot:', e);
}
