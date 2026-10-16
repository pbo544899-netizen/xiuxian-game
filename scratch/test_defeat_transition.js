const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const targetUrl = 'file:///e:/my%20games/slots_rpg/index.html';

async function test() {
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9234', '--no-sandbox', '--disable-gpu',
    '--user-data-dir=' + path.join(__dirname, 'cdp_test_defeat'), '--window-size=390,844'
  ]);
  await new Promise(r => setTimeout(r, 800));
  const ver = await (await fetch('http://127.0.0.1:9234/json/version')).json();
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  let id = 1;
  const reqs = new Map();
  ws.onmessage = (e) => { const d = JSON.parse(e.data); if (d.id && reqs.has(d.id)) { reqs.get(d.id)(d); reqs.delete(d.id); } };
  const cmd = (method, params = {}) => new Promise(r => { const i = id++; reqs.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const t = await cmd('Target.createTarget', { url: targetUrl });
  const a = await cmd('Target.attachToTarget', { targetId: t.result.targetId, flatten: true });
  const sid = a.result.sessionId;
  const scmd = (method, params = {}) => new Promise(r => { const i = id++; reqs.set(i, r); ws.send(JSON.stringify({ id: i, sessionId: sid, method, params })); });
  await scmd('Runtime.enable');
  await scmd('Page.enable');
  await new Promise(r => setTimeout(r, 1200));

  await scmd('Runtime.evaluate', { expression: `
    (() => {
      document.getElementById('modal-story-dialog')?.classList.add('hidden');
      document.getElementById('prologue-section')?.classList.add('hidden');
      const gm = window.gameManager;
      gm.completeSectInduction('wanjian');
      // Give high attack to kill the first monster quickly
      gm.player.atk = 800;

      const encounter = window.SlotsRPG.MonsterConfig.createEncounter({ tier: 'elite', count: 2, scatterCount: 4 }, 2, 0, gm.player);
      const battleResult = window.SlotsRPG.CombatEngine.simulateEncounter(gm.player, encounter, gm.inventory);
      window.playBattleSequence(battleResult);
      document.getElementById('modal-battle-transition')?.click();
    })()
  ` });

  // Let battle auto-play for 1.8s (first monster should be killed and second targeted)
  await new Promise(r => setTimeout(r, 1800));

  // Pause battle
  await scmd('Runtime.evaluate', { expression: `
    (() => {
      const toggle = document.getElementById('btn-battle-auto-toggle');
      if (toggle && toggle.innerText.includes('开启')) toggle.click();
    })()
  ` });

  await new Promise(r => setTimeout(r, 500));

  const stateInfo = await scmd('Runtime.evaluate', { expression: `
    (() => {
      const bossName = document.getElementById('battle-boss-name');
      const bossHp = document.getElementById('battle-boss-hp-text');
      const card0Defeated = document.getElementById('monster-defeated-0');
      const card0DefeatedVisible = card0Defeated && !card0Defeated.classList.contains('hidden');
      const marker0 = document.getElementById('target-marker-0');
      const marker1 = document.getElementById('target-marker-1');
      return {
        topName: bossName ? bossName.innerText : '',
        topHp: bossHp ? bossHp.innerText : '',
        monster0Defeated: card0DefeatedVisible,
        marker0Hidden: marker0 ? marker0.classList.contains('hidden') : null,
        marker1Hidden: marker1 ? marker1.classList.contains('hidden') : null
      };
    })()
  `, returnByValue: true });
  console.log('Battle state info after 1st monster killed:', stateInfo.result.result.value);

  const shot = await scmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(__dirname, 'battle_defeat_and_autotarget.png'), Buffer.from(shot.result.data, 'base64'));
  console.log('Saved defeat and auto-target shot');
  ws.close();
  chromeProc.kill();
}
test().catch(console.error);
