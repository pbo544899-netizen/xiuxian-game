const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_test_bonus_flow');
const targetUrl = 'file:///e:/my%20games/slots_rpg/index.html';

async function main() {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const port = 9337;
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

  console.log('Setting up state and triggering bonus spin...');

  const setupRes = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        try {
          const gm = window.SlotsRPG.GameManager;
          gm.isPrologueComplete = true;
          gm.prologueStep = 4;
          gm.player.promoteToCultivator('wanjian');
          gm.energy = 5000;

          ['TRIGGER_BONUS', 'SPIN_STOP', 'SPIN_START', 'SPIN_COMPLETE'].forEach(evt => {
            window.SlotsRPG.EventBus.on(evt, (d) => {
              console.log('EVENT BUS FIRED:', evt, JSON.stringify(d));
            });
          });

          const origSpin = gm.slotsEngine.spin.bind(gm.slotsEngine);
          gm.slotsEngine.spin = function(lvl, mult, directives) {
            const res = origSpin(lvl, mult, directives);
            res.grid = [
              ['SYM_13', 'SYM_01', 'SYM_02', 'SYM_13', 'SYM_13'],
              ['SYM_13', 'SYM_13', 'SYM_13', 'SYM_13', 'SYM_13'],
              ['SYM_04', 'SYM_13', 'SYM_13', 'SYM_13', 'SYM_05']
            ];
            res.evaluation = gm.slotsEngine.evaluateGrid(res.grid, mult || 1);
            res.nearMiss = gm.slotsEngine.flowController.evaluateNearMiss(res.grid);
            return res;
          };

          console.log('Executing spin with 10 SYM_13...');

          const modal = document.getElementById('modal-secret-realm-marquee');
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
              console.log('MODAL MUTATION:', m.attributeName, 'classList:', modal.className, 'display:', window.getComputedStyle(modal).display);
            });
          });
          observer.observe(modal, { attributes: true, attributeFilter: ['class', 'style'] });

          gm.executeSpin();
          return { ok: true };
        } catch (e) {
          return { error: e.stack || e.message };
        }
      })()
    `,
    returnByValue: true
  });
  console.log('Setup result:', setupRes.result);

  console.log('Waiting 10 seconds for spin and marquee to trigger...');
  for (let i = 1; i <= 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const chk = await sendSessionCmd('Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.getElementById('modal-secret-realm-marquee');
          return {
            sec: ${i},
            classList: Array.from(modal.classList),
            display: window.getComputedStyle(modal).display
          };
        })()
      `,
      returnByValue: true
    });
    console.log('At ' + i + 's:', chk.result.result.value);
  }

  chromeProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
