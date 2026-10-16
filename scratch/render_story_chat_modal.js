const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlSrc = fs.readFileSync('E:/my games/slots_rpg/index.html', 'utf8');

// 注入展示状态及示例左、右双向对话流
const chatStreamHtml = `
  <div class="chat-msg-row chat-msg-left">
    <div class="chat-avatar-wrap">
      <img class="chat-avatar-img" src="../assets/sects/tokens/token_array.png" alt="天机作弊器" />
    </div>
    <div class="chat-msg-body">
      <div class="chat-sender-name">【天机作弊器】造化灵识</div>
      <div class="chat-bubble">“桀桀桀！守关妖王已被斩灭，天道防火墙刚才被本座强行撕开了一道大窟窿！”</div>
    </div>
  </div>

  <div class="chat-msg-row chat-msg-left">
    <div class="chat-avatar-wrap">
      <img class="chat-avatar-img" src="../assets/sects/tokens/token_array.png" alt="天机作弊器" />
    </div>
    <div class="chat-msg-body">
      <div class="chat-sender-name">【天机作弊器】造化灵识</div>
      <div class="chat-bubble">“聚宝盆已晋升至更高阶位！不仅如此，本座趁天道不备，从灵网深处顺手截获了一枚【太乙丹霞宗】的真传引荐法牒！”</div>
    </div>
  </div>

  <div class="chat-msg-row chat-msg-right">
    <div class="chat-avatar-wrap">
      <img class="chat-avatar-img" src="../assets/character/hero_cultivator.png" alt="宿主" />
    </div>
    <div class="chat-msg-body">
      <div class="chat-sender-name">【宿主】林凡</div>
      <div class="chat-bubble">“【太乙丹霞宗】的真传令？还能换宗门？那我现在的这一身修为你和装备怎么办？”</div>
    </div>
  </div>

  <div class="chat-msg-row chat-msg-left">
    <div class="chat-avatar-wrap">
      <img class="chat-avatar-img" src="../assets/sects/tokens/token_array.png" alt="天机作弊器" />
    </div>
    <div class="chat-msg-body">
      <div class="chat-sender-name">【天机作弊器】造化灵识</div>
      <div class="chat-bubble">“有本座护体，随时激活【兵解转世】！保留 20% 先天道基，装备原地转化为新宗门专属神装，下山当祖师爷！”</div>
    </div>
  </div>

  <div class="chat-msg-row chat-msg-right">
    <div class="chat-avatar-wrap">
      <img class="chat-avatar-img" src="../assets/character/hero_cultivator.png" alt="宿主" />
    </div>
    <div class="chat-msg-body">
      <div class="chat-sender-name">【宿主】林凡</div>
      <div class="chat-bubble">“带道基和神装无损转世？不愧是作弊器，这波羊毛必须薅！”</div>
    </div>
  </div>
`;

const modifiedHtml = htmlSrc
  .replace('id="modal-story-dialog" class="modal-overlay hidden"', 'id="modal-story-dialog" class="modal-overlay"')
  .replace('<!-- 动态消息流由 StoryManager 渲染 -->', chatStreamHtml)
  .replace('href="css/style.css"', 'href="../css/style.css"')
  .replace(/src="assets\//g, 'src="../assets/')
  .replace(/src="src\//g, 'src="../src/');

const tempHtmlPath = path.resolve(__dirname, 'test_chat_modal.html');
fs.writeFileSync(tempHtmlPath, modifiedHtml, 'utf8');

const outImage = path.resolve(__dirname, 'story_chat_modal_preview.png');
const cmd = `"${edgePath}" --headless --disable-gpu --screenshot="${outImage}" --window-size=480,950 "file:///${tempHtmlPath.replace(/\\/g, '/')}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('Story chat modal screenshot saved to:', outImage);
} catch (e) {
  console.error('Failed to take screenshot:', e);
}
