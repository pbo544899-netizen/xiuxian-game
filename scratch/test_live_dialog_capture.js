const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlSrc = fs.readFileSync('E:/my games/slots_rpg/index.html', 'utf8');

// 在页面注入自启动脚本：页面加载后自动点击 #btn-mortal-action 唤起 prologue_intro
const injectScript = `
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        const btnMortal = document.getElementById('btn-mortal-action');
        if (btnMortal) {
          console.log('Triggering mortal action button...');
          btnMortal.click();
        }
      }, 500);
    });
  </script>
`;

const modifiedHtml = htmlSrc.replace('</body>', injectScript + '</body>');
const tempHtmlPath = path.resolve(__dirname, 'test_live_mortal.html');
fs.writeFileSync(tempHtmlPath, modifiedHtml, 'utf8');

const tempUserDataDir = path.resolve(__dirname, 'temp_edge_mortal_' + Date.now());
fs.mkdirSync(tempUserDataDir, { recursive: true });

const artifactDir = 'C:/Users/baish/.gemini/antigravity/brain/f5e80861-4372-436a-b5df-1b61c7c22a68';
const outImage = path.resolve(artifactDir, 'live_game_bubble_dialog.png');

// 延时 1.5 秒截图确保弹窗已唤起
const cmd = `"${edgePath}" --headless --disable-gpu --virtual-time-budget=2000 --user-data-dir="${tempUserDataDir}" --screenshot="${outImage}" --window-size=430,932 "file:///${tempHtmlPath.replace(/\\/g, '/')}"`;

try {
  // 使用简单的 setTimeout 机制或者执行命令
  execSync(cmd, { stdio: 'inherit' });
  console.log('Live game bubble dialog screenshot saved to:', outImage);
} catch (e) {
  console.error('Failed to capture:', e);
}
