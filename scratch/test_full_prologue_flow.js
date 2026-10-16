const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlFile = path.resolve('E:/my games/slots_rpg/index.html');
const tempUserDataDir = path.resolve(__dirname, 'temp_edge_profile_' + Date.now());
fs.mkdirSync(tempUserDataDir, { recursive: true });

const outImage1 = path.resolve(__dirname, 'flow_step1_initial.png');

console.log('1. Capturing clean fresh initial state (empty localStorage)...');
const cmd1 = `"${edgePath}" --headless --disable-gpu --user-data-dir="${tempUserDataDir}" --screenshot="${outImage1}" --window-size=430,932 "file:///${htmlFile.replace(/\\/g, '/')}"`;

try {
  execSync(cmd1, { stdio: 'inherit' });
  console.log('Step 1 screenshot saved to:', outImage1);
} catch (e) {
  console.error('Failed step 1:', e);
}
