const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_test_emit_bonus');
const targetUrl = 'file:///e:/my%20games/slots_rpg/index.html';

async function main() {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const port = 9338;
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
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
    } else if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', JSON.stringify(msg.params.exceptionDetails));
    }
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

  console.log('Directly emitting TRIGGER_BONUS...');
  const res = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        try {
          const modal = document.getElementById('modal-secret-realm-marquee');
          console.log('Before emit, modal classList:', Array.from(modal.classList));
          window.SlotsRPG.EventBus.emit('TRIGGER_BONUS', { bonusCount: 10 });
          return { ok: true };
        } catch (e) {
          return { error: e.stack || e.message };
        }
      })()
    `,
    returnByValue: true
  });
  console.log('Emit result:', res.result);

  // Check modal at 500ms, 1000ms, 1500ms, 2500ms
  for (const delay of [500, 1000, 1500, 2500]) {
    await new Promise(r => setTimeout(r, delay));
    const chk = await sendSessionCmd('Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.getElementById('modal-secret-realm-marquee');
          return {
            delay: ${delay},
            classList: Array.from(modal.classList),
            display: window.getComputedStyle(modal).display
          };
        })()
      `,
      returnByValue: true
    });
    console.log('At +' + delay + 'ms:', chk.result.result.value);
  }

  chromeProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
