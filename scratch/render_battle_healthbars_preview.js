// scratch/render_battle_healthbars_preview.js - 生成Boss战与普通群怪战血条优化实机截图
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:\\Users\\baish\\.gemini\\antigravity\\brain\\f5e80861-4372-436a-b5df-1b61c7c22a68';

// 1. 生成 Boss 战截图 (顶部血条保留，下方血条取消)
const bossBattleHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Boss 战血条优化预览</title>
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
    #modal-battle-arena {
      display: flex !important; position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.92); align-items: center; justify-content: center;
      z-index: 100;
    }
  </style>
</head>
<body>
  <div id="app-container">
    <div id="modal-battle-arena" class="modal-overlay">
      <div class="battle-arena-container">
        <!-- 对局状态条 -->
        <div class="battle-top-bar">
          <span id="battle-round-badge" class="battle-round-badge">回合 2/20</span>
          <span id="battle-wave-badge" class="battle-wave-badge hidden">第 1/3 波</span>
          <span id="battle-boss-title" class="battle-boss-title">妖王·赤炼蟒</span>
          <button id="btn-battle-speed" class="btn-battle-speed">⚡ 快速</button>
        </div>

        <!-- 上方 Boss HUD (保留顶部血条) -->
        <div class="battle-boss-section" id="battle-boss-section">
          <div class="battle-unit-hud" id="battle-boss-hud">
            <div class="battle-unit-name-row">
              <span id="battle-boss-name" class="unit-name">赤炼蟒</span>
              <span id="battle-boss-hp-text" class="unit-hp-text">524 / 1200</span>
            </div>
            <div class="battle-hp-bar">
              <div id="battle-boss-hp-fill" class="battle-hp-fill boss-hp" style="width: 43.6%;"></div>
            </div>
          </div>
          <!-- 怪物卡片：Boss 下方取消血条，只展示头像与阴影 -->
          <div class="battle-monsters-container" id="battle-monsters-container">
            <div class="monster-unit-card tier-boss is-targeted" id="monster-card-0">
              <div class="monster-target-marker" id="target-marker-0">▼</div>
              <div class="monster-card-header">
                <span class="monster-card-name" title="赤炼蟒">赤炼蟒</span>
                <span class="monster-card-atk" title="固定攻击力: 36">攻:36</span>
              </div>
              <div class="monster-avatar-wrap">
                <img class="monster-unit-avatar" id="monster-avatar-0" src="../assets/boss/boss_red_python.png" alt="赤炼蟒" />
                <div class="monster-ground-shadow"></div>
              </div>
              <!-- 下方血条被隐藏 (hidden + CSS display: none !important) -->
              <div class="monster-mini-hp-bar hidden">
                <div class="monster-mini-hp-fill" style="width: 43.6%;"></div>
              </div>
              <div class="monster-mini-hp-text hidden">524 / 1200</div>
            </div>
          </div>
        </div>

        <!-- 中间浮动伤害 -->
        <div id="battle-clash-zone" class="battle-clash-zone" style="min-height: 120px;">
          <div style="font-size: 28px; font-weight: 900; color: #ffffff; text-shadow: 0 0 12px rgba(255,255,255,0.6);">-256</div>
        </div>

        <!-- 下方主角 HUD -->
        <div class="battle-hero-section">
          <div class="battle-hero-avatar-wrapper">
            <img id="battle-hero-img" class="battle-hero-avatar" src="../assets/character/hero_cultivator.png" alt="主角" />
          </div>
          <div class="battle-unit-hud">
            <div class="battle-unit-name-row">
              <span id="battle-hero-name" class="unit-name">凌云修仙者</span>
              <span id="battle-hero-hp-text" class="unit-hp-text">990 / 992</span>
            </div>
            <div class="battle-hp-bar">
              <div id="battle-hero-hp-fill" class="battle-hp-fill hero-hp" style="width: 99.8%;"></div>
            </div>
            <div class="battle-hero-subinfo">
              <span id="battle-hero-power">战力: 936</span>
              <span class="battle-prep-tag used">破魔符: 已祭出</span>
              <span class="battle-prep-tag used">气血丹: 无</span>
            </div>
          </div>
        </div>

        <!-- 操作栏 -->
        <div class="battle-action-bar">
          <button class="btn-battle-item">
            <span class="battle-item-info">💊 气血丹 (28)</span>
            <span class="battle-item-hint">+40%血</span>
          </button>
          <button class="btn-battle-item disabled">
            <span class="battle-item-info">📜 破魔符 (0)</span>
            <span class="battle-item-hint">天雷暴击</span>
          </button>
          <button class="btn-battle-action">⚔️ 御剑攻击</button>
          <button class="btn-battle-toggle active">自动: 开启</button>
        </div>

        <div class="battle-log-bar">
          <div class="battle-log-text">⚔️ 第 2 回合: 飞剑贯日！主角斩击【赤炼蟒】 -256!</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

// 2. 生成 普通怪 战截图 (顶部血条隐藏，下方每只怪拥有各自的底部血条)
const normalBattleHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>普通群怪战血条优化预览</title>
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
    #modal-battle-arena {
      display: flex !important; position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.92); align-items: center; justify-content: center;
      z-index: 100;
    }
  </style>
</head>
<body>
  <div id="app-container">
    <div id="modal-battle-arena" class="modal-overlay">
      <div class="battle-arena-container">
        <!-- 对局状态条 -->
        <div class="battle-top-bar">
          <span id="battle-round-badge" class="battle-round-badge">回合 1/20</span>
          <span id="battle-wave-badge" class="battle-wave-badge">敌方阵列·共 3 头妖兽</span>
          <span id="battle-boss-title" class="battle-boss-title">凶兽群围攻 (共3头)</span>
          <button id="btn-battle-speed" class="btn-battle-speed">⚡ 快速</button>
        </div>

        <!-- 上方 Boss HUD (普通怪战顶部血条隐藏) -->
        <div class="battle-boss-section" id="battle-boss-section">
          <div class="battle-unit-hud hidden" id="battle-boss-hud">
            <div class="battle-unit-name-row">
              <span id="battle-boss-name" class="unit-name">普通妖兽群</span>
              <span id="battle-boss-hp-text" class="unit-hp-text">300 / 300</span>
            </div>
            <div class="battle-hp-bar">
              <div id="battle-boss-hp-fill" class="battle-hp-fill boss-hp" style="width: 100%;"></div>
            </div>
          </div>
          <!-- 怪物卡片：3 只普通小怪并排，血条在卡片底部位置 -->
          <div class="battle-monsters-container" id="battle-monsters-container">
            <!-- 怪 1 -->
            <div class="monster-unit-card tier-normal is-targeted" id="monster-card-0">
              <div class="monster-target-marker" id="target-marker-0">▼</div>
              <div class="monster-card-header">
                <span class="monster-card-name" title="狂暴獠猪">狂暴獠猪</span>
                <span class="monster-card-atk" title="攻:15">攻:15</span>
              </div>
              <div class="monster-avatar-wrap">
                <img class="monster-unit-avatar" id="monster-avatar-0" src="../assets/monsters/monster_boar.png" alt="狂暴獠猪" />
                <div class="monster-ground-shadow"></div>
              </div>
              <!-- 底部血条 -->
              <div class="monster-mini-hp-bar">
                <div class="monster-mini-hp-fill" style="width: 65%;"></div>
              </div>
              <div class="monster-mini-hp-text">65 / 100</div>
            </div>
            <!-- 怪 2 -->
            <div class="monster-unit-card tier-normal" id="monster-card-1">
              <div class="monster-target-marker hidden" id="target-marker-1">▼</div>
              <div class="monster-card-header">
                <span class="monster-card-name" title="赤灵妖狐">赤灵妖狐</span>
                <span class="monster-card-atk" title="攻:18">攻:18</span>
              </div>
              <div class="monster-avatar-wrap">
                <img class="monster-unit-avatar" id="monster-avatar-1" src="../assets/monsters/monster_fox.png" alt="赤灵妖狐" />
                <div class="monster-ground-shadow"></div>
              </div>
              <!-- 底部血条 -->
              <div class="monster-mini-hp-bar">
                <div class="monster-mini-hp-fill" style="width: 100%;"></div>
              </div>
              <div class="monster-mini-hp-text">120 / 120</div>
            </div>
            <!-- 怪 3 -->
            <div class="monster-unit-card tier-normal" id="monster-card-2">
              <div class="monster-target-marker hidden" id="target-marker-2">▼</div>
              <div class="monster-card-header">
                <span class="monster-card-name" title="幽冥鬼蛛">幽冥鬼蛛</span>
                <span class="monster-card-atk" title="攻:14">攻:14</span>
              </div>
              <div class="monster-avatar-wrap">
                <img class="monster-unit-avatar" id="monster-avatar-2" src="../assets/monsters/monster_spider.png" alt="幽冥鬼蛛" />
                <div class="monster-ground-shadow"></div>
              </div>
              <!-- 底部血条 -->
              <div class="monster-mini-hp-bar">
                <div class="monster-mini-hp-fill" style="width: 100%;"></div>
              </div>
              <div class="monster-mini-hp-text">95 / 95</div>
            </div>
          </div>
        </div>

        <!-- 中间区域 -->
        <div id="battle-clash-zone" class="battle-clash-zone" style="min-height: 120px;"></div>

        <!-- 下方主角 HUD -->
        <div class="battle-hero-section">
          <div class="battle-hero-avatar-wrapper">
            <img id="battle-hero-img" class="battle-hero-avatar" src="../assets/character/hero_cultivator.png" alt="主角" />
          </div>
          <div class="battle-unit-hud">
            <div class="battle-unit-name-row">
              <span id="battle-hero-name" class="unit-name">凌云修仙者</span>
              <span id="battle-hero-hp-text" class="unit-hp-text">992 / 992</span>
            </div>
            <div class="battle-hp-bar">
              <div id="battle-hero-hp-fill" class="battle-hp-fill hero-hp" style="width: 100%;"></div>
            </div>
            <div class="battle-hero-subinfo">
              <span id="battle-hero-power">战力: 936</span>
              <span class="battle-prep-tag">破魔符: 就绪</span>
              <span class="battle-prep-tag">气血丹: 就绪</span>
            </div>
          </div>
        </div>

        <!-- 操作栏 -->
        <div class="battle-action-bar">
          <button class="btn-battle-item">
            <span class="battle-item-info">💊 气血丹 (28)</span>
            <span class="battle-item-hint">+40%血</span>
          </button>
          <button class="btn-battle-item">
            <span class="battle-item-info">📜 破魔符 (2)</span>
            <span class="battle-item-hint">天雷暴击</span>
          </button>
          <button class="btn-battle-action">⚔️ 御剑攻击</button>
          <button class="btn-battle-toggle active">自动: 开启</button>
        </div>

        <div class="battle-log-bar">
          <div class="battle-log-text">⚠️ 妖气冲天！3 头凶煞妖兽并排逼近，大战一触即发！</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

// 生成 Boss 截图
const tempBossPath = path.join(__dirname, 'temp_boss_preview.html');
fs.writeFileSync(tempBossPath, bossBattleHtml, 'utf8');
const outputBossPng = path.join(artifactDir, 'battle_boss_healthbar_optimized.png');

// 生成 普通怪 截图
const tempNormalPath = path.join(__dirname, 'temp_normal_preview.html');
fs.writeFileSync(tempNormalPath, normalBattleHtml, 'utf8');
const outputNormalPng = path.join(artifactDir, 'battle_normal_monsters_healthbar_optimized.png');

try {
  console.log('Rendering Boss battle screenshot...');
  execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${outputBossPng}" --window-size=480,853 "${tempBossPath}"`);
  console.log('✅ Boss 战截图生成成功:', outputBossPng);

  console.log('Rendering Normal monsters battle screenshot...');
  execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${outputNormalPng}" --window-size=480,853 "${tempNormalPath}"`);
  console.log('✅ 普通怪战截图生成成功:', outputNormalPng);
} catch (err) {
  console.error('截图渲染失败:', err);
} finally {
  if (fs.existsSync(tempBossPath)) fs.unlinkSync(tempBossPath);
  if (fs.existsSync(tempNormalPath)) fs.unlinkSync(tempNormalPath);
}
