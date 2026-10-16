const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_cdp_profile_bonus');
const targetUrl = 'file:///e:/my%20games/slots_rpg/index.html';

async function main() {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const port = 9335;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=430,932'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  const versionJson = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json/version`, (res) => {
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
      console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
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

  console.log('Testing real executeSpin with 10 SYM_13 in live browser...');

  const res = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        try {
          const gm = window.SlotsRPG.GameManager;
          gm.isPrologueComplete = true;
          gm.prologueStep = 4;
          gm.player.promoteToCultivator('wanjian');
          gm.energy = 1000;

          // Mock slotsEngine.spin to return 10 SYM_13 symbols
          const origSpin = gm.slotsEngine.spin;
          gm.slotsEngine.spin = function() {
            const grid = [
              ['SYM_13', 'SYM_01', 'SYM_02', 'SYM_13', 'SYM_13'],
              ['SYM_13', 'SYM_03', 'SYM_04', 'SYM_05', 'SYM_13'],
              ['SYM_06', 'SYM_13', 'SYM_13', 'SYM_13', 'SYM_07']
            ];
            const evalData = gm.slotsEngine.evaluateGrid(grid, gm.betMultiplier || 1);
            return {
              grid,
              evaluation: evalData,
              betMultiplier: gm.betMultiplier || 1
            };
          };

          gm.executeSpin();
          return { success: true };
        } catch (e) {
          return { error: e.stack || e.message };
        }
      })()
    `,
    returnByValue: true
  });

  console.log('Spin initiation result:', res.result);

  // Wait 4 seconds for spin animation, stop, and settlement
  await new Promise(r => setTimeout(r, 4500));

  const checkModal = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.getElementById('modal-secret-realm-marquee');
        const computed = modal ? window.getComputedStyle(modal) : null;
        return {
          exists: !!modal,
          classList: modal ? Array.from(modal.classList) : null,
          display: computed ? computed.display : null,
          visibility: computed ? computed.visibility : null,
          opacity: computed ? computed.opacity : null,
          zIndex: computed ? computed.zIndex : null
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Modal state:', JSON.stringify(checkModal.result.result.value, null, 2));

  chromeProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
