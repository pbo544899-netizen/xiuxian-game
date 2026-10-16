const { execSync } = require('child_process');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlFile = path.resolve('E:/my games/slots_rpg/index.html');
const outImage = path.resolve(__dirname, 'preview_slots.png');

// 简单测试页面或通过带脚本的预览
const cmd = `"${edgePath}" --headless --disable-gpu --screenshot="${outImage}" --window-size=430,932 "file:///${htmlFile.replace(/\\/g, '/')}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('Screenshot saved to:', outImage);
} catch (e) {
  console.error('Failed to take screenshot:', e);
}
