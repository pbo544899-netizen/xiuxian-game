const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_verify_autospin');
const targetUrl = 'file:///e:/my%20games/slots_rpg/index.html';

async function main() {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const port = 9349;
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

  console.log('1. Setting up state and starting Auto-Spin...');
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const gm = window.SlotsRPG.GameManager;
        gm.isPrologueComplete = true;
        gm.prologueStep = 4;
        gm.player.promoteToCultivator('wanjian');
        gm.player.realmName = '练气七层';
        gm.energy = 10000;
        gm.currentBet = 25;
        gm.betMultiplier = 1;
        gm.emitStateChange();

        const storyModal = document.getElementById('modal-story-dialog');
        if (storyModal) storyModal.classList.add('hidden');

        // Inject bonus on 1st spin
        let spinCount = 0;
        const origSpin = gm.slotsEngine.spin.bind(gm.slotsEngine);
        gm.slotsEngine.spin = function(lvl, mult, directives) {
          spinCount++;
          const res = origSpin(lvl, mult, directives);
          if (spinCount === 1) {
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

        // Start auto-spin
        document.getElementById('btn-auto').click();
      })()
    `
  });

  // Wait for spin to finish and marquee to open
  console.log('Waiting for spin to complete and marquee modal to open...');
  await new Promise(r => setTimeout(r, 5200));

  const check1 = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const gm = window.SlotsRPG.GameManager;
        const marquee = document.getElementById('modal-secret-realm-marquee');
        return {
          isAutoSpinning: gm.isAutoSpinning,
          wasAutoSpinningBeforeBonus: gm.wasAutoSpinningBeforeBonus,
          marqueeHidden: marquee ? marquee.classList.contains('hidden') : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Check 1 (Marquee open during auto-spin):', JSON.stringify(check1.result.result.value));

  // Click start marquee
  console.log('Clicking btnStartMarquee...');
  await sendSessionCmd('Runtime.evaluate', {
    expression: `document.getElementById('btn-start-marquee').click();`
  });

  // Wait for marquee spin to finish and settlement modal to show
  await new Promise(r => setTimeout(r, 5500));

  // Click claim button to close settlement
  console.log('Clicking btnHoldspinClaim to return to slots...');
  await sendSessionCmd('Runtime.evaluate', {
    expression: `document.getElementById('btn-holdspin-claim').click();`
  });

  // Wait 1200ms to observe auto-spin resume
  await new Promise(r => setTimeout(r, 1200));

  const check2 = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const gm = window.SlotsRPG.GameManager;
        return {
          isAutoSpinning: gm.isAutoSpinning,
          isSpinning: gm.renderer ? gm.renderer.isSpinning : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Check 2 (Auto-spin resumed):', JSON.stringify(check2.result.result.value));

  chromeProc.kill();
  console.log('AUTO-SPIN RESUME TEST COMPLETED!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
