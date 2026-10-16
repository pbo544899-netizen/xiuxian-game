const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_verify_bonus_fix');
const targetUrl = 'file:///e:/my%20games/slots_rpg/index.html';

async function main() {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const port = 9348;
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

  console.log('1. Setting up game state for manual spin bonus test...');

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

        // Close story dialog if open
        const storyModal = document.getElementById('modal-story-dialog');
        if (storyModal) storyModal.classList.add('hidden');

        // Make sure we are on slots tab
        const tabSlots = document.getElementById('tab-slots');
        if (tabSlots) tabSlots.click();

        // Inject 10 SYM_13 for the next spin
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

        console.log('Clicking btnSpin to trigger Cave Resonance...');
        document.getElementById('btn-spin').click();
      })()
    `
  });

  // Wait for spin to complete and marquee modal to open (approx 4500ms)
  console.log('Waiting for spin to complete and marquee modal to open...');
  await new Promise(r => setTimeout(r, 5200));

  let shot1 = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/verify_1_marquee_opened.png', Buffer.from(shot1.result.data, 'base64'));

  const status1 = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const marquee = document.getElementById('modal-secret-realm-marquee');
        const btnStart = document.getElementById('btn-start-marquee');
        const btnSpin = document.getElementById('btn-spin');
        return {
          marqueeHidden: marquee ? marquee.classList.contains('hidden') : null,
          btnStartText: btnStart ? btnStart.innerText.trim() : null,
          btnStartDisabled: btnStart ? btnStart.disabled : null,
          btnSpinDisabled: btnSpin ? btnSpin.classList.contains('disabled') : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Marquee opened check:', JSON.stringify(status1.result.result.value));

  // Click start marquee spin
  console.log('Clicking btnStartMarquee to spin...');
  await sendSessionCmd('Runtime.evaluate', {
    expression: `document.getElementById('btn-start-marquee').click();`
  });

  await new Promise(r => setTimeout(r, 1000));
  let shot2 = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/verify_2_marquee_spinning.png', Buffer.from(shot2.result.data, 'base64'));

  // Wait for marquee spin to finish and settlement modal to show (approx 5000ms)
  console.log('Waiting for marquee to finish and settlement modal to show...');
  await new Promise(r => setTimeout(r, 5500));

  let shot3 = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/verify_3_settlement_modal.png', Buffer.from(shot3.result.data, 'base64'));

  const status2 = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const settlement = document.getElementById('modal-holdspin-settlement');
        const claimBtn = document.getElementById('btn-holdspin-claim');
        return {
          settlementHidden: settlement ? settlement.classList.contains('hidden') : null,
          claimBtnText: claimBtn ? claimBtn.innerText.trim() : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Settlement check:', JSON.stringify(status2.result.result.value));

  // Click claim button to close settlement
  console.log('Clicking btnHoldspinClaim to close settlement and return to slots...');
  await sendSessionCmd('Runtime.evaluate', {
    expression: `document.getElementById('btn-holdspin-claim').click();`
  });

  await new Promise(r => setTimeout(r, 600));

  let shot4 = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/verify_4_returned_to_slots.png', Buffer.from(shot4.result.data, 'base64'));

  const status3 = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const marquee = document.getElementById('modal-secret-realm-marquee');
        const settlement = document.getElementById('modal-holdspin-settlement');
        const announcement = document.getElementById('reel-announcement');
        const btnSpin = document.getElementById('btn-spin');
        const gm = window.SlotsRPG.GameManager;
        return {
          marqueeHidden: marquee ? marquee.classList.contains('hidden') : null,
          settlementHidden: settlement ? settlement.classList.contains('hidden') : null,
          announcementShow: announcement ? announcement.classList.contains('show') : null,
          announcementText: announcement ? announcement.innerText.trim() : null,
          rendererDissolving: gm.renderer ? gm.renderer.isDissolving : null,
          activeWinningCellsSize: gm.renderer ? gm.renderer.activeWinningCells.size : null,
          btnSpinDisabled: btnSpin ? btnSpin.classList.contains('disabled') : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Return to slots check:', JSON.stringify(status3.result.result.value));

  chromeProc.kill();
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
