const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const targetUrl = 'file:///e:/my%20games/slots_rpg/index.html';

async function test() {
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9233', '--no-sandbox', '--disable-gpu',
    '--user-data-dir=' + path.join(__dirname, 'cdp_test_normal'), '--window-size=390,844'
  ]);
  await new Promise(r => setTimeout(r, 800));
  const ver = await (await fetch('http://127.0.0.1:9233/json/version')).json();
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
      const encounter = window.SlotsRPG.MonsterConfig.createEncounter({ tier: 'normal', count: 3, scatterCount: 3 }, 2, 0, gm.player);
      const battleResult = window.SlotsRPG.CombatEngine.simulateEncounter(gm.player, encounter, gm.inventory);
      window.playBattleSequence(battleResult);
      document.getElementById('modal-battle-transition')?.click();
      const toggle = document.getElementById('btn-battle-auto-toggle');
      if (toggle) toggle.click();
    })()
  ` });

  await new Promise(r => setTimeout(r, 1200));

  const shot = await scmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(__dirname, 'battle_3_normal_monsters.png'), Buffer.from(shot.result.data, 'base64'));
  console.log('Saved 3 normal monsters shot');
  ws.close();
  chromeProc.kill();
}
test().catch(console.error);
