const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlFile = path.resolve('E:/my games/slots_rpg/index.html');

// 我们通过启动 edge 开启 remote-debugging 并用 cdp 或者注入 console 捕获错误
const wrapperHtmlPath = path.resolve(__dirname, 'debug_console.html');
const wrapperHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<div id="errors"></div>
<script>
window.onerror = function(msg, url, line, col, error) {
  var errDiv = document.getElementById('errors');
  errDiv.innerHTML += '<p style="color:red;font-size:20px;">[ERROR] ' + msg + ' at ' + url + ':' + line + ':' + col + '<br>' + (error && error.stack ? error.stack : '') + '</p>';
};
</script>
<iframe id="game-frame" src="file:///${htmlFile.replace(/\\/g, '/')}" style="width:430px; height:932px; border:none;"></iframe>
<script>
var frame = document.getElementById('game-frame');
frame.onload = function() {
  try {
    frame.contentWindow.onerror = window.onerror;
  } catch(e) {
    document.getElementById('errors').innerHTML += '<p>[IFRAME ERROR] ' + e + '</p>';
  }
};
</script>
</body>
</html>
`;

fs.writeFileSync(wrapperHtmlPath, wrapperHtml, 'utf8');

const outImage = path.resolve(__dirname, 'console_debug.png');
const cmd = `"${edgePath}" --headless --disable-gpu --screenshot="${outImage}" --window-size=800,1000 "file:///${wrapperHtmlPath.replace(/\\/g, '/')}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('Console debug screenshot saved');
} catch (e) {
  console.error('Failed:', e);
}
