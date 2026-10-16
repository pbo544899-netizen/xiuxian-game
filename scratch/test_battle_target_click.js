const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_cdp_profile_click_test');
const targetUrl = 'file:///e:/my%20games/slots_rpg/index.html';
const shotPath1 = path.join(__dirname, 'battle_switch_target_lion.png');
const shotPath2 = path.join(__dirname, 'battle_single_boss.png');

async function main() {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9230',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=390,844'
  ]);

  let versionData = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9230/json/version');
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

  // Test 1: Multi-monster battle and click target 1 (Lion)
  console.log('Testing Test 1: Click target to switch monster...');
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const modalStory = document.getElementById('modal-story-dialog');
        if (modalStory) modalStory.classList.add('hidden');
        const proSec = document.getElementById('prologue-section');
        if (proSec) proSec.classList.add('hidden');

        const gm = window.gameManager;
        gm.completeSectInduction('wanjian');

        const encounter = window.SlotsRPG.MonsterConfig.createEncounter({ tier: 'elite', count: 2, scatterCount: 4 }, 2, 0, gm.player);
        const battleResult = window.SlotsRPG.CombatEngine.simulateEncounter(gm.player, encounter, gm.inventory);

        window.playBattleSequence(battleResult);
        const trans = document.getElementById('modal-battle-transition');
        if (trans) trans.click();

        // Pause auto
        const toggle = document.getElementById('btn-battle-auto-toggle');
        if (toggle && toggle.innerText.includes('开启')) {
          toggle.click();
        }
      })()
    `
  });

  await new Promise(r => setTimeout(r, 600));

  // Click monster card 1 (Lion)
  const clickRes = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const card1 = document.getElementById('monster-card-1');
        if (card1) {
          card1.click();
          const bossName = document.getElementById('battle-boss-name');
          const bossHp = document.getElementById('battle-boss-hp-text');
          return { clicked: true, name: bossName ? bossName.innerText : '', hp: bossHp ? bossHp.innerText : '' };
        }
        return { clicked: false };
      })()
    `,
    returnByValue: true
  });
  console.log('Click result:', clickRes.result.result.value);

  await new Promise(r => setTimeout(r, 300));
  const shot1 = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(shotPath1, Buffer.from(shot1.result.data, 'base64'));
  console.log('Saved Test 1 shot to:', shotPath1);

  // Test 2: Single Boss battle (赤炼蟒)
  console.log('Testing Test 2: Single Boss (赤炼蟒)...');
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const gm = window.gameManager;
        const encounter = window.SlotsRPG.MonsterConfig.createEncounter({ tier: 'boss', scatterCount: 5 }, 2, 0, gm.player);
        const battleResult = window.SlotsRPG.CombatEngine.simulateEncounter(gm.player, encounter, gm.inventory);

        window.playBattleSequence(battleResult);
        const trans = document.getElementById('modal-battle-transition');
        if (trans) trans.click();

        const toggle = document.getElementById('btn-battle-auto-toggle');
        if (toggle && toggle.innerText.includes('开启')) {
          toggle.click();
        }

        const bossName = document.getElementById('battle-boss-name');
        const bossHp = document.getElementById('battle-boss-hp-text');
        const card0 = document.getElementById('monster-card-0');
        const miniBar = card0 ? card0.querySelector('.monster-mini-hp-bar') : null;
        const miniBarDisplay = miniBar ? window.getComputedStyle(miniBar).display : 'null';

        return {
          bossName: bossName ? bossName.innerText : '',
          bossHp: bossHp ? bossHp.innerText : '',
          miniBarDisplay
        };
      })()
    `,
    returnByValue: true
  });

  await new Promise(r => setTimeout(r, 600));
  const shot2 = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(shotPath2, Buffer.from(shot2.result.data, 'base64'));
  console.log('Saved Test 2 shot to:', shotPath2);

  ws.close();
  chromeProc.kill();
}

main().catch(console.error);
