const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlSrc = fs.readFileSync('E:/my games/slots_rpg/index.html', 'utf8');

// 注入展示状态及游戏对白剧情气泡流
const bubbleStreamHtml = `
  <div class="game-bubble-row bubble-right bubble-cheat">
    <div class="game-bubble-card">
      <div class="bubble-header-bar">
        <span class="bubble-sender-badge">天道作弊器</span>
        <span class="bubble-intent-tag">⚡ 阵灵法相</span>
      </div>
      <div class="bubble-content-text">“桀桀桀！守关妖王已被斩灭，天道防火墙刚才被本座强行撕开了一道大窟窿！”</div>
      <div class="bubble-tail"></div>
    </div>
  </div>

  <div class="game-bubble-row bubble-right bubble-cheat">
    <div class="game-bubble-card">
      <div class="bubble-header-bar">
        <span class="bubble-sender-badge">天道作弊器</span>
        <span class="bubble-intent-tag">⚡ 阵灵法相</span>
      </div>
      <div class="bubble-content-text">“聚宝盆已晋升至更高阶位！不仅如此，本座刚才趁天道不备，从灵网深处顺手截获了一枚【太乙丹霞宗】的真传引荐法牒！”</div>
      <div class="bubble-tail"></div>
    </div>
  </div>

  <div class="game-bubble-row bubble-left bubble-player">
    <div class="game-bubble-card">
      <div class="bubble-header-bar">
        <span class="bubble-sender-badge">宿主 (林凡)</span>
        <span class="bubble-intent-tag">🗡️ 宿主直言</span>
      </div>
      <div class="bubble-content-text">“【太乙丹霞宗】的真传令？还能换宗门？那我现在的这一身修为你和装备怎么办？”</div>
      <div class="bubble-tail"></div>
    </div>
  </div>

  <div class="game-bubble-row bubble-right bubble-cheat">
    <div class="game-bubble-card">
      <div class="bubble-header-bar">
        <span class="bubble-sender-badge">天道作弊器</span>
        <span class="bubble-intent-tag">⚡ 阵灵法相</span>
      </div>
      <div class="bubble-content-text">“有本座护体，随时在角色面板激活【兵解转世】！保留 20% 先天道基，装备原地转化为新宗门专属神装，下山当祖师爷！”</div>
      <div class="bubble-tail"></div>
    </div>
  </div>

  <div class="game-bubble-row bubble-left bubble-player">
    <div class="game-bubble-card">
      <div class="bubble-header-bar">
        <span class="bubble-sender-badge">宿主 (林凡)</span>
        <span class="bubble-intent-tag">🗡️ 宿主直言</span>
      </div>
      <div class="bubble-content-text">“带道基和神装无损转世？不愧是天道作弊器，这波羊毛必须薅！”</div>
      <div class="bubble-tail"></div>
    </div>
  </div>
`;

const modifiedHtml = htmlSrc
  .replace('id="modal-story-dialog" class="modal-overlay hidden"', 'id="modal-story-dialog" class="modal-overlay"')
  .replace('<!-- 动态游戏对话气泡由 StoryManager 渲染 -->', bubbleStreamHtml)
  .replace('href="css/style.css"', 'href="../css/style.css"')
  .replace(/src="assets\//g, 'src="../assets/')
  .replace(/src="src\//g, 'src="../src/');

const tempHtmlPath = path.resolve(__dirname, 'test_bubble_modal.html');
fs.writeFileSync(tempHtmlPath, modifiedHtml, 'utf8');

const artifactDir = 'C:/Users/baish/.gemini/antigravity/brain/f5e80861-4372-436a-b5df-1b61c7c22a68';
const outImage = path.resolve(artifactDir, 'story_bubble_modal_preview.png');
const cmd = `"${edgePath}" --headless --disable-gpu --screenshot="${outImage}" --window-size=480,950 "file:///${tempHtmlPath.replace(/\\/g, '/')}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('Story bubble modal screenshot saved to:', outImage);
} catch (e) {
  console.error('Failed to take screenshot:', e);
}
