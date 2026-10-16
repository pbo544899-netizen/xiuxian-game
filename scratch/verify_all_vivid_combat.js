const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_cdp_profile_vivid_monsters');
const htmlSource = path.join(__dirname, '../index.html');
const testHtml = path.join(__dirname, '../test_vivid_monsters_runner.html');

const brainDir = 'C:\\Users\\baish\\.gemini\\antigravity\\brain\\01f29278-40ce-4787-9d2d-2408e9039bf0';
const shotEliteRhinoLeopard = path.join(brainDir, 'vivid_combat_rhino_leopard.png');
const shotBossChimera = path.join(brainDir, 'vivid_combat_boss_chimera.png');
const shotBossPuppet = path.join(brainDir, 'vivid_combat_boss_puppet.png');

async function main() {
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch(e){}
  }

  let html = fs.readFileSync(htmlSource, 'utf8');
  const injectScript = `
    <script>
      window.__showRhinoLeopard = function() {
        const modal = document.getElementById('modal-battle-arena');
        if (!modal) return;
        modal.classList.remove('hidden');
        document.querySelectorAll('.modal').forEach(m => {
          if (m.id !== 'modal-battle-arena') m.classList.add('hidden');
        });
        const rhino = window.SlotsRPG.MonsterConfig.MONSTERS.elite[1][1];
        const leopard = window.SlotsRPG.MonsterConfig.MONSTERS.elite[1][0];
        window.playBattleSequence({
          encounter: {
            tier: 'elite',
            monsters: [
              Object.assign({}, rhino, { index: 1, total: 2 }),
              Object.assign({}, leopard, { index: 2, total: 2 })
            ]
          },
          rounds: []
        });
      };

      window.__showBossChimera = function() {
        const modal = document.getElementById('modal-battle-arena');
        if (!modal) return;
        modal.classList.remove('hidden');
        const boss = window.SlotsRPG.BossConfig.BOSS_DEFS[2];
        window.playBattleSequence({
          encounter: {
            tier: 'boss',
            monsters: [boss]
          },
          boss: boss,
          rounds: []
        });
      };

      window.__showBossPuppet = function() {
        const modal = document.getElementById('modal-battle-arena');
        if (!modal) return;
        modal.classList.remove('hidden');
        const boss = window.SlotsRPG.BossConfig.BOSS_DEFS[4];
        window.playBattleSequence({
          encounter: {
            tier: 'boss',
            monsters: [boss]
          },
          boss: boss,
          rounds: []
        });
      };
    </script>
  `;
  html = html.replace('</body>', `${injectScript}</body>`);
  fs.writeFileSync(testHtml, html, 'utf8');

  const port = 9336;
  const chromeProcess = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
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

  const WebSocketClass = global.WebSocket;
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

  const targetUrl = 'file:///' + testHtml.replace(/\\/g, '/');
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

  console.log('Navigated, waiting 1500ms...');
  await new Promise(r => setTimeout(r, 1500));

  // 1. Show Elite Rhino + Leopard
  console.log('Showing Elite Rhino + Leopard battle...');
  await sendSessionCmd('Runtime.evaluate', { expression: 'window.__showRhinoLeopard();' });
  await new Promise(r => setTimeout(r, 500));

  const shot1 = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(shotEliteRhinoLeopard, Buffer.from(shot1.result.data, 'base64'));
  console.log('✅ Captured Rhino + Leopard:', shotEliteRhinoLeopard);

  // 2. Show Boss Chimera
  console.log('Showing Boss Chimera battle...');
  await sendSessionCmd('Runtime.evaluate', { expression: 'window.__showBossChimera();' });
  await new Promise(r => setTimeout(r, 500));

  const shot2 = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(shotBossChimera, Buffer.from(shot2.result.data, 'base64'));
  console.log('✅ Captured Boss Chimera:', shotBossChimera);

  // 3. Show Boss Puppet
  console.log('Showing Boss Puppet battle...');
  await sendSessionCmd('Runtime.evaluate', { expression: 'window.__showBossPuppet();' });
  await new Promise(r => setTimeout(r, 500));

  const shot3 = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(shotBossPuppet, Buffer.from(shot3.result.data, 'base64'));
  console.log('✅ Captured Boss Puppet:', shotBossPuppet);

  ws.close();
  chromeProcess.kill();
  if (fs.existsSync(testHtml)) fs.unlinkSync(testHtml);

  console.log('ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
