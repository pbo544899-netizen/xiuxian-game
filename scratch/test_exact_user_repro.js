const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_exact_user_repro');
const targetUrl = 'file:///e:/my%20games/slots_rpg/index.html';

async function main() {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const port = 9343;
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

  console.log('Setting exact state from user screenshot into localStorage...');

  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const gm = window.SlotsRPG.GameManager;
        gm.isPrologueComplete = true;
        gm.prologueStep = 4;
        gm.player.promoteToCultivator('wanjian');
        gm.player.realmName = '练气七层';
        gm.energy = 6039;
        gm.level = 1;
        gm.potSubLevel = 3;
        gm.potExp = 211;
        gm.potSubExp = 31;
        gm.sectTrialStage = 8;
        gm.currentBet = 25;
        gm.betMultiplier = 1;
        gm.emitStateChange();

        // Close any prologue dialog if open
        const storyModal = document.getElementById('modal-story-dialog');
        if (storyModal) storyModal.classList.add('hidden');

        // Let's hook slotsEngine.spin to inject the EXACT grid from the screenshot
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

        // Click the spin button naturally!
        console.log('Clicking btnSpin...');
        document.getElementById('btn-spin').click();
      })()
    `
  });

  for (let s = 1; s <= 10; s++) {
    await new Promise(r => setTimeout(r, 1000));
    const info = await sendSessionCmd('Runtime.evaluate', {
      expression: `
        (() => {
          const marqueeModal = document.getElementById('modal-secret-realm-marquee');
          const settlementModal = document.getElementById('modal-holdspin-settlement');
          const announcement = document.getElementById('reel-announcement');
          const btnSpin = document.getElementById('btn-spin');
          const gm = window.SlotsRPG.GameManager;
          return {
            sec: ${s},
            isSpinning: gm.renderer ? gm.renderer.isSpinning : null,
            marqueeHidden: marqueeModal ? marqueeModal.classList.contains('hidden') : null,
            settlementHidden: settlementModal ? settlementModal.classList.contains('hidden') : null,
            announcementShow: announcement ? announcement.classList.contains('show') : null,
            announcementText: announcement ? announcement.innerText.trim() : null,
            btnSpinDisabled: btnSpin ? btnSpin.classList.contains('disabled') : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Sec ' + s + ':', JSON.stringify(info.result.result.value));
    const shot = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`scratch/exact_repro_${s}s.png`, Buffer.from(shot.result.data, 'base64'));
  }

  chromeProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
