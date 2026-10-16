const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_cdp_profile_battle_test');
const targetUrl = 'file:///e:/my%20games/slots_rpg/index.html';
const shotPath = path.join(__dirname, 'battle_multimonster_current.png');

async function main() {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9229',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=390,844'
  ]);

  let versionData = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9229/json/version');
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch (e) {}
  }

  const ws = new WebSocket(versionData.webSocketDebuggerUrl);
  await new Promise((resolve) => { ws.onopen = resolve; });

  let msgId = 1;
  const pendingRequests = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pendingRequests.has(data.id)) {
      const cb = pendingRequests.get(data.id);
      pendingRequests.delete(data.id);
      cb(data);
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

  // Trigger a 2-elite monster battle
  const evalRes = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        try {
          const modalStory = document.getElementById('modal-story-dialog');
          if (modalStory) modalStory.classList.add('hidden');
          const proSec = document.getElementById('prologue-section');
          if (proSec) proSec.classList.add('hidden');

          const gm = window.gameManager;
          gm.completeSectInduction('wanjian');

          // Generate an elite encounter (2 elite monsters)
          const encounter = window.SlotsRPG.MonsterConfig.createEncounter({ tier: 'elite', count: 2, scatterCount: 4 }, 2, 0, gm.player);
          const battleResult = window.SlotsRPG.CombatEngine.simulateEncounter(gm.player, encounter, gm.inventory);

          // Launch battle arena UI directly
          window.playBattleSequence(battleResult);
          
          // Skip transition immediately
          const trans = document.getElementById('modal-battle-transition');
          if (trans) trans.click();

          return { success: true, tier: encounter.tier, count: encounter.monsters.length, monsters: encounter.monsters.map(m => ({ name: m.name, hp: m.hp })) };
        } catch (e) {
          return { error: e.message, stack: e.stack };
        }
      })()
    `,
    returnByValue: true
  });
  console.log('Evaluate result:', evalRes.result.result.value);

  // Wait for battle arena to open and settle
  await new Promise(r => setTimeout(r, 600));

  // Pause battle auto-step so we see round 1
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const toggle = document.getElementById('btn-battle-auto-toggle');
        // click toggle if it's auto to pause it
        if (toggle && toggle.innerText.includes('开启')) {
          toggle.click();
        }
      })()
    `
  });

  await new Promise(r => setTimeout(r, 400));

  const shotRes = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(shotPath, Buffer.from(shotRes.result.data, 'base64'));
  console.log('Screenshot saved to:', shotPath);

  ws.close();
  chromeProc.kill();
}

main().catch(console.error);
