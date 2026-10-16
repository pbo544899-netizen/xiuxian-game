const { spawn } = require('child_process');
const http = require('http');

async function test() {
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9351',
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=430,932'
  ]);
  await new Promise(r => setTimeout(r, 1200));

  const versionJson = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9351/json/version', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const ws = new (global.WebSocket || WebSocket)(versionJson.webSocketDebuggerUrl);
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

  const targetRes = await sendCmd('Target.createTarget', { url: 'file:///e:/my%20games/slots_rpg/index.html' });
  const sessionId = (await sendCmd('Target.attachToTarget', { targetId: targetRes.result.targetId, flatten: true })).result.sessionId;

  function sendSessionCmd(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pendingRequests.set(id, resolve);
      ws.send(JSON.stringify({ id, sessionId, method, params }));
    });
  }

  await sendSessionCmd('Runtime.enable');
  await new Promise(r => setTimeout(r, 1000));

  await sendSessionCmd('Page.enable');
  const inspectRes = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const story = document.getElementById('modal-story-dialog');
        if (story) story.classList.add('hidden');
        openSecretRealmMarquee(true);
        const modal = document.getElementById('modal-secret-realm-marquee');
        const card = modal.querySelector('.marquee-modal-card');
        const style = window.getComputedStyle(modal);
        const cardStyle = window.getComputedStyle(card);
        const rect = modal.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        return {
          modal: {
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            zIndex: style.zIndex,
            position: style.position,
            rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
          },
          card: {
            display: cardStyle.display,
            rect: { top: cardRect.top, left: cardRect.left, width: cardRect.width, height: cardRect.height }
          }
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Inspect result:', JSON.stringify(inspectRes.result.result.value, null, 2));

  const fs = require('fs');
  const shot = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/inspect_modal_shot.png', Buffer.from(shot.result.data, 'base64'));
  console.log('Saved scratch/inspect_modal_shot.png');

  chromeProc.kill();
  process.exit(0);
}
test().catch(err => {
  console.error(err);
  process.exit(1);
});
