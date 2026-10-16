const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_cdp_profile_eval');
const targetUrl = 'file:///e:/my%20games/slots_rpg/index.html';
const artifactSlots = 'C:\\Users\\baish\\.gemini\\antigravity\\brain\\01f29278-40ce-4787-9d2d-2408e9039bf0\\unified_slots_banner.png';
const artifactChar = 'C:\\Users\\baish\\.gemini\\antigravity\\brain\\01f29278-40ce-4787-9d2d-2408e9039bf0\\unified_character_radar.png';

async function main() {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const port = 9334;
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

  // Set up gameManager state: joined Wanjian sect, Stage 6, 274 power
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        if (window.SlotsRPG && window.SlotsRPG.StoryManager) {
          window.SlotsRPG.StoryManager.closeStoryDialog(true);
        }
        const modalStory = document.getElementById('modal-story-dialog');
        if (modalStory) modalStory.classList.add('hidden');
        const proSec = document.getElementById('prologue-section');
        if (proSec) proSec.classList.add('hidden');

        const gm = window.SlotsRPG.GameManager;
        gm.isPrologueComplete = true;
        gm.prologueStep = 4;
        gm.player.promoteToCultivator('wanjian');
        gm.sectTrialStage = 6;
        // Mock getTotalStats to equal exact user state: 274 combat power
        gm.player.getTotalStats = () => ({ hp: 500, atk: 70, def: 23 });
        gm.emitStateChange();
      })()
    `
  });

  await new Promise(r => setTimeout(r, 600));

  // 1. Explicitly switch to Slots view (sect-trial-banner)
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const tab = document.getElementById('tab-slots');
        if (tab) tab.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 400));

  const snapSlots = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  if (snapSlots.result && snapSlots.result.data) {
    fs.writeFileSync(artifactSlots, Buffer.from(snapSlots.result.data, 'base64'));
    console.log('Saved slots view screenshot:', artifactSlots);
  }

  // 2. Switch to Character view (boss-radar-panel)
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const tab = document.getElementById('tab-character');
        if (tab) tab.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));

  const snapChar = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  if (snapChar.result && snapChar.result.data) {
    fs.writeFileSync(artifactChar, Buffer.from(snapChar.result.data, 'base64'));
    console.log('Saved character view screenshot:', artifactChar);
  }

  // Inspect the DOM text in both places
  const evalResult = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const slotsBadge = document.getElementById('trial-stage-badge')?.innerText;
        const slotsName = document.getElementById('trial-target-name')?.innerText;
        const slotsReq = document.getElementById('trial-rec-power')?.innerText;
        const slotsStatus = document.getElementById('trial-power-status')?.innerText;

        const charLabel = document.getElementById('boss-radar-label')?.innerText;
        const charName = document.getElementById('boss-radar-name')?.innerText;
        const charReq = document.getElementById('boss-radar-req-power')?.innerText;
        const charProg = document.getElementById('boss-radar-progress-text')?.innerText;
        const charStatus = document.getElementById('boss-radar-status')?.innerText;
        const charBtn = document.getElementById('btn-boss-radar-challenge')?.innerText;
        const charHint = document.getElementById('boss-radar-hint')?.innerText;

        return {
          slots: { badge: slotsBadge, name: slotsName, req: slotsReq, status: slotsStatus },
          character: { label: charLabel, name: charName, req: charReq, progress: charProg, status: charStatus, btn: charBtn, hint: charHint }
        };
      })()
    `,
    returnByValue: true
  });

  const val = (evalResult.result && evalResult.result.result) ? evalResult.result.result.value : evalResult;
  console.log('DOM Evaluation Result:', JSON.stringify(val, null, 2));

  chromeProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
