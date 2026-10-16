const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_cdp_profile_win_shot');
const htmlSource = path.join(__dirname, '../index.html');
const brainDir = 'C:\\Users\\baish\\.gemini\\antigravity\\brain\\01f29278-40ce-4787-9d2d-2408e9039bf0';

async function run() {
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch(e){}
  }

  const port = 9355;
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

  const ws = new global.WebSocket(versionJson.webSocketDebuggerUrl);
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
  await sendSessionCmd('Emulation.setDeviceMetricsOverride', {
    width: 430,
    height: 932,
    deviceScaleFactor: 2,
    mobile: true
  });

  await new Promise(r => setTimeout(r, 1200));

  await sendSessionCmd('Runtime.evaluate', {
    awaitPromise: true,
    expression: `(async () => {
      const gm = window.SlotsRPG.GameManager;
      gm.isPrologueComplete = true;
      gm.prologueStep = 4;
      gm.player.promoteToCultivator('wanjian');
      gm.energy = 888;
      
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
      const tabSlots = document.getElementById('tab-slots');
      if (tabSlots) tabSlots.click();
      await new Promise(r => setTimeout(r, 200));

      // Force a winning spin (3x SYM_06 飞剑)
      const fakeSpinData = gm.slotsEngine.spin(gm.level, 1, { forceHit: true });
      fakeSpinData.grid[1][0] = 'SYM_06';
      fakeSpinData.grid[1][1] = 'SYM_06';
      fakeSpinData.grid[1][2] = 'SYM_06';
      fakeSpinData.evaluation = gm.slotsEngine.evaluateGrid(fakeSpinData.grid, 1);

      gm.renderer.startSpin();
      gm.renderer.stopSpin(fakeSpinData, (result) => {
        gm._handleSpinSettlement(result);
      });

      // Wait 1200ms to be right in the winning glow phase
      await new Promise(r => setTimeout(r, 1200));
    })()`
  });

  const shot = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  const shotPath = path.join(brainDir, 'winning_slots_glow_live.png');
  fs.writeFileSync(shotPath, Buffer.from(shot.result.data, 'base64'));
  console.log("Winning screenshot saved to", shotPath);

  chromeProcess.kill();
}

run().catch(console.error);
