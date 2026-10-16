const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlSrc = fs.readFileSync('E:/my games/slots_rpg/index.html', 'utf8');

// 修改 html 使得 modal-story-dialog 默认处于展示状态，便于视觉走查
const modifiedHtml = htmlSrc.replace(
  'id="modal-story-dialog" class="modal-overlay hidden"',
  'id="modal-story-dialog" class="modal-overlay"'
).replace(
  '“检测到宿主凡躯无灵根，面临后山凶兽撕咬，濒死危机判定中...”',
  '“桀桀桀！守关妖王已被斩灭，天道防火墙刚才被本座强行撕开了一道大窟窿！\n不仅如此，本座刚才趁天道不备，从灵网深处顺手截获了一枚【太乙丹霞宗】的真传引荐法牒！宿主可随时在角色面板兵解转世！”'
);

const tempHtmlPath = path.resolve(__dirname, 'test_story_modal.html');
const fixedHtml = modifiedHtml
  .replace('href="css/style.css"', 'href="../css/style.css"')
  .replace(/src="assets\//g, 'src="../assets/')
  .replace(/src="src\//g, 'src="../src/');
fs.writeFileSync(tempHtmlPath, fixedHtml, 'utf8');

const outImage = path.resolve(__dirname, 'story_modal_preview.png');
const cmd = `"${edgePath}" --headless --disable-gpu --screenshot="${outImage}" --window-size=430,932 "file:///${tempHtmlPath.replace(/\\/g, '/')}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('Story modal screenshot saved to:', outImage);
} catch (e) {
  console.error('Failed to take screenshot:', e);
}
