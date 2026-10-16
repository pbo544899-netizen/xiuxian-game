const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_test_bbox');
const targetUrl = 'file:///e:/my%20games/slots_rpg/index.html';

async function main() {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const port = 9341;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--no-sandbox',
    '--disable-gpu',
    '--user-data-dir=' + userDataDir,
    '--window-size=430,932'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  const versionJson = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:' + port + '/json/version', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const WebSocketClass = global.WebSocket || WebSocket;
  const ws = new WebSocketClass(versionJson.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });

  let msgId = 1;
  const pendingRequests = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pendingRequests.has(msg.id)) {
      const cb = pendingRequests.get(msg.id);
      pendingRequests.delete(msg.id);
      cb(msg);
    }
  };

  function sendCmd(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pendingRequests.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const targetRes = await sendCmd('Target.createTarget', { url: targetUrl });
  const targetId = targetRes.result.targetId;
  const attachRes = await sendCmd('Target.attachToTarget', { targetId, flatten: true });
  const sessionId = attachRes.result.sessionId;

  function sendSessionCmd(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pendingRequests.set(id, resolve);
      ws.send(JSON.stringify({ id, sessionId, method, params }));
    });
  }

  await sendSessionCmd('Runtime.enable');
  await sendSessionCmd('Page.enable');
  await new Promise(r => setTimeout(r, 1500));

  const info = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const gm = window.SlotsRPG.GameManager;
        gm.isPrologueComplete = true;
        gm.prologueStep = 4;
        gm.player.promoteToCultivator('wanjian');
        document.getElementById('modal-story-dialog').classList.add('hidden');

        const modal = document.getElementById('modal-secret-realm-marquee');
        modal.classList.remove('hidden');
        const card = modal.querySelector('.marquee-modal-card');
        const rModal = modal.getBoundingClientRect();
        const rCard = card.getBoundingClientRect();

        return {
          window: { innerWidth: window.innerWidth, innerHeight: window.innerHeight },
          modal: { top: rModal.top, left: rModal.left, width: rModal.width, height: rModal.height },
          card: { top: rCard.top, left: rCard.left, width: rCard.width, height: rCard.height },
          zIndex: window.getComputedStyle(modal).zIndex
        };
      })()
    `,
    returnByValue: true
  });

  console.log(JSON.stringify(info.result.result.value, null, 2));

  chromeProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
