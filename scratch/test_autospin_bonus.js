const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_test_autospin_bonus');
const targetUrl = 'file:///e:/my%20games/slots_rpg/index.html';

async function main() {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const port = 9340;
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

  console.log('Setting up state and autoSpin with bonus...');

  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const gm = window.SlotsRPG.GameManager;
        gm.isPrologueComplete = true;
        gm.prologueStep = 4;
        gm.player.promoteToCultivator('wanjian');
        gm.energy = 6039;
        const storyModal = document.getElementById('modal-story-dialog');
        if (storyModal) storyModal.classList.add('hidden');

        // Mock next spin to be 10 SYM_13
        const origSpin = gm.slotsEngine.spin.bind(gm.slotsEngine);
        let bonusTriggered = false;
        gm.slotsEngine.spin = function(lvl, mult, directives) {
          const res = origSpin(lvl, mult, directives);
          if (!bonusTriggered) {
            bonusTriggered = true;
            res.grid = [
              ['SYM_13', 'SYM_01', 'SYM_02', 'SYM_13', 'SYM_13'],
              ['SYM_13', 'SYM_13', 'SYM_13', 'SYM_13', 'SYM_13'],
              ['SYM_04', 'SYM_13', 'SYM_13', 'SYM_13', 'SYM_05']
            ];
            res.evaluation = gm.slotsEngine.evaluateGrid(res.grid, mult || 1);
            res.nearMiss = gm.slotsEngine.flowController.evaluateNearMiss(res.grid);
          }
          return res;
        };

        // Start auto-spin via UI button click
        const btnAuto = document.getElementById('btn-auto');
        console.log('Clicking btnAuto...');
        btnAuto.click();
      })()
    `
  });

  for (let s = 1; s <= 8; s++) {
    await new Promise(r => setTimeout(r, 1000));
    const info = await sendSessionCmd('Runtime.evaluate', {
      expression: `
        (() => {
          const marqueeModal = document.getElementById('modal-secret-realm-marquee');
          const settlementModal = document.getElementById('modal-holdspin-settlement');
          const announcement = document.getElementById('reel-announcement');
          const btnSpin = document.getElementById('btn-spin');
          const btnAuto = document.getElementById('btn-auto');
          const gm = window.SlotsRPG.GameManager;
          return {
            sec: ${s},
            isAutoSpinning: gm.isAutoSpinning,
            isSpinning: gm.renderer ? gm.renderer.isSpinning : null,
            marqueeHidden: marqueeModal ? marqueeModal.classList.contains('hidden') : null,
            settlementHidden: settlementModal ? settlementModal.classList.contains('hidden') : null,
            announcementShow: announcement ? announcement.classList.contains('show') : null,
            announcementText: announcement ? announcement.innerText : null,
            btnSpinDisabled: btnSpin ? btnSpin.classList.contains('disabled') : null,
            btnAutoText: btnAuto ? btnAuto.innerText : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('State at ' + s + 's:', JSON.stringify(info.result.result.value));
    if (s === 5) {
      const shot = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('scratch/autospin_bonus_at_5s.png', Buffer.from(shot.result.data, 'base64'));
    }
  }

  chromeProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
