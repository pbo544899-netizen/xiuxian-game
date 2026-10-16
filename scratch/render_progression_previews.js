// scratch/render_progression_previews.js - 生成500抽战力雷达标尺与门票发放弹窗实机截图
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\baish\\.gemini\\antigravity\\brain\\f5e80861-4372-436a-b5df-1b61c7c22a68';

// 1. 战力雷达标尺与6装备槽位实机展示
const characterRadarHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>500抽战力雷达标尺与6槽装备展示</title>
  <link rel="stylesheet" href="../css/style.css" />
  <style>
    html, body {
      margin: 0; padding: 0; width: 100%; height: 100%;
      background: #05070a; overflow: hidden;
      display: flex; justify-content: center; align-items: flex-start;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #app-container {
      width: 480px; height: 920px; position: relative;
      background: #0d1117; margin: 0 auto; overflow-y: auto; padding: 12px;
      box-sizing: border-box;
    }
    .view-panel {
      display: block !important;
    }
  </style>
</head>
<body>
  <div id="app-container">
    <!-- 天机盘顶栏进度 -->
    <div class="pot-exp-container" style="margin-bottom: 12px;">
      <div class="pot-exp-header">
        <span class="pot-tier-title"><span class="pot-sub-badge">Lv.3</span> <span class="pot-title-name">天机盘·【百炼天机】</span></span>
        <span class="pot-exp-text">总蕴灵: 245/500 <span class="pot-sub-hint">(进阶 45/100)</span></span>
      </div>
      <div class="pot-exp-bar-track">
        <div class="pot-exp-bar-fill" style="width: 49%;"></div>
      </div>
    </div>

    <!-- 角色修真道相卡片 -->
    <section id="view-character" class="view-panel">
      <div class="char-hero-profile-unified">
        <div class="char-hero-hud-bar">
          <div class="char-hud-item energy">
            <span class="char-hud-icon">✨</span>
            <span class="char-hud-label">机缘:</span>
            <b class="char-hud-val energy">1,850</b>
          </div>
          <div class="char-hud-item pot">
            <span class="char-hud-icon">🏺</span>
            <span class="char-hud-label">聚宝盆:</span>
            <b class="char-hud-val pot">1 阶</b>
          </div>
          <div class="char-hud-item power">
            <span class="char-hud-icon">⚡</span>
            <span class="char-hud-label">战力:</span>
            <b class="char-hud-val power">428</b>
          </div>
        </div>

        <div class="hero-main-row">
          <div class="hero-avatar-box">
            <img src="../assets/character/hero_cultivator.png" class="hero-avatar-svg" alt="修真者立绘" />
          </div>

          <div class="hero-middle-box">
            <div class="hero-status-title">
              <span class="hero-realm-tag">练气境八层</span>
              <span class="hero-title-sub">万剑仙宗真传</span>
            </div>
          </div>

          <div class="hero-stats-right">
            <div class="stat-col-item hp">
              <span class="stat-col-label">气血</span>
              <b class="stat-col-val hp-val">1,480</b>
            </div>
            <div class="stat-col-item atk">
              <span class="stat-col-label">攻击</span>
              <b class="stat-col-val atk-val">218</b>
            </div>
            <div class="stat-col-item def">
              <span class="stat-col-label">防御</span>
              <b class="stat-col-val def-val">192</b>
            </div>
          </div>
        </div>

        <div class="char-exp-bar-row">
          <div class="char-exp-info-row">
            <span class="exp-title"><span class="exp-icon">☯</span> 修为进度</span>
            <span class="exp-val">680 / 1200 (56%)</span>
          </div>
          <div class="exp-bar-compact-track">
            <div class="exp-bar-compact-fill" style="width: 56%;"></div>
          </div>
        </div>
      </div>

      <!-- 关卡守关妖王战力雷达标尺 -->
      <div class="boss-radar-panel" id="boss-radar-panel">
        <div class="boss-radar-header">
          <div class="boss-radar-target">
            <span class="boss-radar-icon">🐍</span>
            <span class="boss-radar-label">守关妖王:</span>
            <b class="boss-radar-name">赤炼蟒</b>
            <span class="boss-radar-req-badge">推荐战力 517</span>
          </div>
          <div class="boss-radar-status warning">势均力敌 (还差 89 战力)</div>
        </div>
        <div class="boss-radar-track">
          <div class="boss-radar-fill" style="width: 83%;"></div>
        </div>
        <div class="boss-radar-footer">
          <span id="boss-radar-progress-text">战力达成度: 83% (428 / 517)</span>
          <span class="boss-radar-hint">⚔️ 战力接近斩妖门槛，建议再合成1~2件法宝确保稳操胜券！</span>
        </div>
      </div>

      <!-- 6大装备槽位区 -->
      <div class="equip-section">
        <div class="equip-section-title">法宝佩戴 (6槽全开 · 道基圆满触发共鸣)</div>
        <div class="equip-slots-grid">
          <!-- 槽位1: 武器 -->
          <div class="equip-slot occupied" data-slot="weapon" style="border-color: #a855f7; box-shadow: 0 0 10px #a855f740;">
            <span class="slot-quality-badge" style="background:#a855f7">法器</span>
            <img class="slot-equip-icon" src="../assets/symbols/SYM_06.png" alt="极道飞剑" />
            <div class="slot-equip-name" style="color:#c084fc">极道飞剑</div>
          </div>
          <!-- 槽位2: 衣服 -->
          <div class="equip-slot occupied" data-slot="armor" style="border-color: #a855f7; box-shadow: 0 0 10px #a855f740;">
            <span class="slot-quality-badge" style="background:#a855f7">法器</span>
            <img class="slot-equip-icon" src="../assets/symbols/SYM_07.png" alt="天剑法袍" />
            <div class="slot-equip-name" style="color:#c084fc">天剑法袍</div>
          </div>
          <!-- 槽位3: 戒指 -->
          <div class="equip-slot occupied" data-slot="ring" style="border-color: #3b82f6; box-shadow: 0 0 10px #3b82f640;">
            <span class="slot-quality-badge" style="background:#3b82f6">宝器</span>
            <img class="slot-equip-icon" src="../assets/symbols/SYM_08.png" alt="剑意灵戒" />
            <div class="slot-equip-name" style="color:#60a5fa">剑意灵戒</div>
          </div>
          <!-- 槽位4: 帽子 -->
          <div class="equip-slot occupied" data-slot="hat" style="border-color: #3b82f6; box-shadow: 0 0 10px #3b82f640;">
            <span class="slot-quality-badge" style="background:#3b82f6">宝器</span>
            <img class="slot-equip-icon" src="../assets/symbols/SYM_11.png" alt="纯阳巾" />
            <div class="slot-equip-name" style="color:#60a5fa">纯阳巾</div>
          </div>
          <!-- 槽位5: 鞋子 -->
          <div class="equip-slot occupied" data-slot="boots" style="border-color: #a855f7; box-shadow: 0 0 10px #a855f740;">
            <span class="slot-quality-badge" style="background:#a855f7">法器</span>
            <img class="slot-equip-icon" src="../assets/symbols/SYM_09.png" alt="御剑踏云履" />
            <div class="slot-equip-name" style="color:#c084fc">御剑踏云履</div>
          </div>
          <!-- 槽位6: 腰带 -->
          <div class="equip-slot occupied" data-slot="belt" style="border-color: #3b82f6; box-shadow: 0 0 10px #3b82f640;">
            <span class="slot-quality-badge" style="background:#3b82f6">宝器</span>
            <img class="slot-equip-icon" src="../assets/symbols/SYM_10.png" alt="极道剑穗带" />
            <div class="slot-equip-name" style="color:#60a5fa">极道剑穗带</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</body>
</html>`;

// 2. 门票发放弹窗实机展示
const ticketModalHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>六道大圆满门票发放弹窗</title>
  <link rel="stylesheet" href="../css/style.css" />
  <style>
    html, body {
      margin: 0; padding: 0; width: 100%; height: 100%;
      background: #05070a; overflow: hidden;
      display: flex; justify-content: center; align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #app-container {
      width: 480px; height: 853px; position: relative;
      background: #0d1117; margin: 0 auto;
    }
    #modal-sect-ticket-awarded {
      display: flex !important; position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); align-items: center; justify-content: center;
      z-index: 100;
    }
  </style>
</head>
<body>
  <div id="app-container">
    <div id="modal-sect-ticket-awarded" class="modal-overlay">
      <div class="modal-card sect-ticket-modal-card">
        <div class="sect-ticket-header">
          <div class="sect-ticket-badge">🌟 六道圆满 · 宗门真传</div>
          <h2 class="sect-ticket-title">获得宗门接引信物！</h2>
          <p class="sect-ticket-subtitle">道友六槽纯阳神装大成，引动宗门天降祥瑞！特赐下一宗门真传接引信物：</p>
        </div>

        <div class="sect-ticket-token-display">
          <div class="token-glow-ring"></div>
          <div class="token-icon" id="ticket-modal-icon">🎫</div>
          <div class="token-info">
            <h3 id="ticket-modal-name" class="token-title">太乙丹霞宗令</h3>
            <div id="ticket-modal-sect" class="token-sect-tag">太乙丹霞宗 · 真传法牒</div>
            <p id="ticket-modal-desc" class="token-description">持此令牌可在本门毕业或飞升时直接拜入太乙丹霞宗，参悟炼丹与离火真诀！</p>
          </div>
        </div>

        <div class="sect-ticket-perks">
          <div class="ticket-perk-item">
            <span class="perk-icon">✨</span>
            <span class="perk-text"><b>六道神装共鸣：</b> 全属性额外提升 +15%！</span>
          </div>
          <div class="ticket-perk-item">
            <span class="perk-icon">⛩️</span>
            <span class="perk-text"><b>下一仙途就绪：</b> 已解锁前往下一宗门试炼通道！</span>
          </div>
        </div>

        <div class="modal-actions">
          <button id="btn-claim-sect-ticket" class="btn-primary-action pulse-anim">执令谢恩</button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

const tempRadarFile = path.resolve(__dirname, 'temp_radar_preview.html');
const tempTicketFile = path.resolve(__dirname, 'temp_ticket_preview.html');

fs.writeFileSync(tempRadarFile, characterRadarHtml, 'utf8');
fs.writeFileSync(tempTicketFile, ticketModalHtml, 'utf8');

const outRadarImg = path.resolve(artifactDir, 'progression_radar_6slots_preview.png');
const outTicketImg = path.resolve(artifactDir, 'progression_ticket_modal_preview.png');

console.log('📸 渲染战力雷达标尺与 6 槽装备实机截图...');
try {
  execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${outRadarImg}" --window-size=480,920 "file:///${tempRadarFile.replace(/\\/g, '/')}"`);
  console.log('✅ 战力雷达标尺截图完成:', outRadarImg);
} catch (e) {
  console.error('战力雷达截图失败:', e);
}

console.log('📸 渲染宗门门票发放弹窗实机截图...');
try {
  execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${outTicketImg}" --window-size=480,853 "file:///${tempTicketFile.replace(/\\/g, '/')}"`);
  console.log('✅ 宗门门票弹窗截图完成:', outTicketImg);
} catch (e) {
  console.error('门票弹窗截图失败:', e);
}

// 清理临时 html
fs.unlinkSync(tempRadarFile);
fs.unlinkSync(tempTicketFile);
console.log('🎉 实机截图全部完成！');
