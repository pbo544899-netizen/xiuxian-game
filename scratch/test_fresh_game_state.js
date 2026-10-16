const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const indexPath = path.resolve('E:/my games/slots_rpg/index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const logFile = path.resolve('E:/my games/slots_rpg/scratch/browser_debug.log');
const outImage = path.resolve('E:/my games/slots_rpg/scratch/fresh_initial_preview.png');

// 注入测试脚本：首先清除 localStorage，然后收集 window.onerror 和生命周期信息
const testScript = `
<script>
  window.__capturedErrors = [];
  window.onerror = function(msg, url, line, col, error) {
    window.__capturedErrors.push({ msg, url, line, col, stack: error ? error.stack : '' });
  };

  // 强制确保凡人新档
  try {
    localStorage.clear();
  } catch(e){}

  window.addEventListener('load', () => {
    setTimeout(() => {
      const gm = window.SlotsRPG && window.SlotsRPG.GameManager;
      const pSection = document.getElementById('prologue-section');
      const debugInfo = {
        errors: window.__capturedErrors,
        gmExists: !!gm,
        isPrologueComplete: gm ? gm.isPrologueComplete : null,
        prologueStep: gm ? gm.prologueStep : null,
        energy: gm ? gm.energy : null,
        isMortal: gm && gm.player ? gm.player.isMortal : null,
        realm: gm && gm.player ? gm.player.realmName : null,
        pSectionClasses: pSection ? pSection.className : null,
        pSectionOffsetHeight: pSection ? pSection.offsetHeight : null,
        activeTab: document.querySelector('.nav-item.active') ? document.querySelector('.nav-item.active').id : null,
        activeView: document.querySelector('.view-panel.active') ? document.querySelector('.view-panel.active').id : null,
      };

      const marker = document.createElement('div');
      marker.id = '__debug_marker';
      marker.style.position = 'fixed';
      marker.style.top = '0';
      marker.style.left = '0';
      marker.style.background = 'black';
      marker.style.color = 'yellow';
      marker.style.zIndex = '999999';
      marker.style.fontSize = '12px';
      marker.style.padding = '8px';
      marker.innerText = JSON.stringify(debugInfo, null, 2);
      document.body.appendChild(marker);
    }, 500);
  });
</script>
`;

html = html.replace('</head>', `${testScript}</head>`);
const runnerHtmlPath = path.resolve('E:/my games/slots_rpg/temp_fresh_runner.html');
fs.writeFileSync(runnerHtmlPath, html, 'utf8');

const cmd = `"${edge}" --headless --disable-gpu --screenshot="${outImage}" --window-size=430,932 "file:///${runnerHtmlPath.replace(/\\/g, '/')}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('Saved screenshot to:', outImage);
} catch(e) {
  console.error('Error:', e);
}
