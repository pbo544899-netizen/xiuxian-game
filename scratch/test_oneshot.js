const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const targetUrl = 'file:///e:/my%20games/slots_rpg/index.html';

async function test() {
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9235', '--no-sandbox', '--disable-gpu',
    '--user-data-dir=' + path.join(__dirname, 'cdp_test_oneshot'), '--window-size=390,844'
  ]);
  await new Promise(r => setTimeout(r, 800));
  const ver = await (await fetch('http://127.0.0.1:9235/json/version')).json();
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

      // 2 elite monsters, but monster 0 has very low hp so it dies in round 1
      const encounter = window.SlotsRPG.MonsterConfig.createEncounter({ tier: 'elite', count: 2, scatterCount: 4 }, 2, 0, gm.player);
      encounter.monsters[0].hp = 20;
      encounter.monsters[0].maxHp = 20;
      encounter.monsters[1].hp = 1000;
      encounter.monsters[1].maxHp = 1000;

      const battleResult = window.SlotsRPG.CombatEngine.simulateEncounter(gm.player, encounter, gm.inventory);
      window.playBattleSequence(battleResult);
      const trans = document.getElementById('modal-battle-transition');
      if (trans) trans.click();
      // Keep in auto mode so step 1 (monster_defeated) executes automatically
    })()
  ` });

  // Let round 1 play out (player kills monster 0, monster_defeated triggers, target switches to monster 1)
  await new Promise(r => setTimeout(r, 2600));

  const info = await scmd('Runtime.evaluate', { expression: `
    (() => {
      const bossName = document.getElementById('battle-boss-name');
      const bossHp = document.getElementById('battle-boss-hp-text');
      const m0Def = document.getElementById('monster-defeated-0');
      const m0Hp = document.getElementById('monster-hp-text-0');
      const m1Hp = document.getElementById('monster-hp-text-1');
      const marker0 = document.getElementById('target-marker-0');
      const marker1 = document.getElementById('target-marker-1');
      return {
        topName: bossName ? bossName.innerText : '',
        topHp: bossHp ? bossHp.innerText : '',
        m0DefeatedVisible: m0Def ? !m0Def.classList.contains('hidden') : null,
        m0HpText: m0Hp ? m0Hp.innerText : '',
        m1HpText: m1Hp ? m1Hp.innerText : '',
        marker0Hidden: marker0 ? marker0.classList.contains('hidden') : null,
        marker1Hidden: marker1 ? marker1.classList.contains('hidden') : null
      };
    })()
  `, returnByValue: true });
  console.log('Kill switch result:', info.result.result.value);

  const shot = await scmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(__dirname, 'battle_monster0_killed_target_switched.png'), Buffer.from(shot.result.data, 'base64'));
  console.log('Saved monster0 killed shot');
  ws.close();
  chromeProc.kill();
}
test().catch(console.error);
