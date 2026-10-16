const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_cdp_profile_spin_bug');
const htmlSource = path.join(__dirname, '../index.html');

async function run() {
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch(e){}
  }

  const port = 9340;
  const chromeProcess = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=430,932'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const versionJson = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json/version`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const WebSocketClass = global.WebSocket;
  const ws = new WebSocketClass(versionJson.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });

  let msgId = 1;
  const pendingRequests = new Map();
  const consoleLogs = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      consoleLogs.push({ type: msg.params.type, args: msg.params.args.map(a => a.value || a.description) });
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('EXCEPTION THROWN IN BROWSER:', JSON.stringify(msg.params.exceptionDetails));
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

  const targetUrl = 'file:///' + htmlSource.replace(/\\/g, '/');
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
  await sendSessionCmd('Log.enable');

  console.log("Browser attached. Waiting for game init...");
  await new Promise(r => setTimeout(r, 1200));

  // Run the sequence to reach FTUE spin 6 and sect join
  const result = await sendSessionCmd('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      const gm = window.SlotsRPG.GameManager;
      console.log('Init state: isPrologueComplete =', gm.isPrologueComplete, 'prologueStep =', gm.prologueStep);
      
      // Step 0: click prologue battle
      const btnProBattle = document.getElementById('btn-prologue-battle');
      if (btnProBattle && !btnProBattle.classList.contains('hidden')) {
        btnProBattle.click();
      }
      
      // Complete battle fast
      while (gm.prologueStep === 1) {
        await new Promise(r => setTimeout(r, 100));
      }
      console.log('After battle, prologueStep =', gm.prologueStep);

      // Awakening modal: click accept
      const btnAccept = document.getElementById('btn-awakening-accept');
      if (btnAccept) btnAccept.click();
      await new Promise(r => setTimeout(r, 200));
      console.log('After awakening, prologueStep =', gm.prologueStep);

      // Now prologueStep is 3 (FTUE spins 1 to 6)
      const btnSpin = document.getElementById('btn-spin');
      
      // We need to do 6 spins
      for (let s = 1; s <= 6; s++) {
        console.log('--- Executing Spin ' + s + ' ---');
        // Wait until renderer is not spinning
        while (gm.renderer && gm.renderer.isSpinning) {
          await new Promise(r => setTimeout(r, 100));
        }
        btnSpin.click();
        // Wait for spin to complete
        await new Promise(r => setTimeout(r, 2500));
      }

      console.log('After 6 spins, prologueSpins =', gm.prologueSpins);
      // Wait for induction sequence to trigger and show modal
      await new Promise(r => setTimeout(r, 4000));

      const modalInduction = document.getElementById('modal-sect-induction');
      console.log('modalInduction hidden?', modalInduction.classList.contains('hidden'));

      // Find first join button
      const joinBtn = modalInduction.querySelector('.btn-join-sect');
      console.log('joinBtn found?', !!joinBtn);
      if (joinBtn) {
        joinBtn.click();
      }
      await new Promise(r => setTimeout(r, 500));

      // Close notice modal if open
      const btnNotice = document.getElementById('btn-action-notice-confirm');
      if (btnNotice) btnNotice.click();
      await new Promise(r => setTimeout(r, 300));

      // Switch back to slots tab
      const tabSlots = document.querySelector('[data-tab="slots"]');
      if (tabSlots) tabSlots.click();
      await new Promise(r => setTimeout(r, 500));

      console.log('Joined sect! Current sect =', gm.player.currentSect, 'isPrologueComplete =', gm.isPrologueComplete);
      console.log('Now clicking SPIN after joining sect...');

      const preSpinState = {
        isSpinning: gm.renderer.isSpinning,
        reelsState: gm.renderer.reels.map(r => r.state),
        btnDisabled: btnSpin.classList.contains('disabled'),
        energy: gm.energy,
        cost: gm.currentBet
      };

      btnSpin.click();
      await new Promise(r => setTimeout(r, 300));

      const duringSpinState = {
        isSpinning: gm.renderer.isSpinning,
        reelsState: gm.renderer.reels.map(r => r.state),
        reelsSpeed: gm.renderer.reels.map(r => r.speed),
        reelsOffsetY: gm.renderer.reels.map(r => r.offsetY),
        nonWinningAlpha: gm.renderer.nonWinningAlpha,
        isDissolving: gm.renderer.isDissolving,
        activeWinningCellsSize: gm.renderer.activeWinningCells.size
      };

      // Wait a bit more
      await new Promise(r => setTimeout(r, 1000));
      const postSpinState = {
        reelsOffsetY2: gm.renderer.reels.map(r => r.offsetY),
        reelsState2: gm.renderer.reels.map(r => r.state),
        isSpinning2: gm.renderer.isSpinning
      };

      return { preSpinState, duringSpinState, postSpinState };
    })()`
  });

  console.log('Evaluation result:', JSON.stringify(result, null, 2));

  // Take screenshot
  const shotRes = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  const shotPath = path.join(__dirname, 'reproduce_spin_shot.png');
  fs.writeFileSync(shotPath, Buffer.from(shotRes.result.data, 'base64'));
  console.log('Screenshot saved to', shotPath);

  console.log('Console logs:');
  consoleLogs.forEach(l => console.log(`[${l.type}]`, ...l.args));

  chromeProcess.kill();
}

run().catch(console.error);
