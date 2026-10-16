const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_cdp_profile_monster_anim');
const htmlSource = path.join(__dirname, '../index.html');
const testHtml = path.join(__dirname, '../test_monster_anim_runner.html');

const brainDir = 'C:\\Users\\baish\\.gemini\\antigravity\\brain\\01f29278-40ce-4787-9d2d-2408e9039bf0';
const shotIdle = path.join(brainDir, 'monster_combat_idle.png');
const shotHit = path.join(brainDir, 'monster_combat_hit.png');
const shotLunge = path.join(brainDir, 'monster_combat_lunge.png');

async function main() {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  // 1. Prepare HTML injecting combat trigger
  let html = fs.readFileSync(htmlSource, 'utf8');
  const injectScript = `
    <script>
      window.addEventListener('load', () => {
        setTimeout(() => {
          const modalStory = document.getElementById('modal-story-dialog');
          if (modalStory) modalStory.classList.add('hidden');
          const proSec = document.getElementById('prologue-section');
          if (proSec) proSec.classList.add('hidden');

          if (window.gameManager && window.SlotsRPG) {
            const gm = window.gameManager;
            gm.player.promoteToCultivator('wanjian');
            gm.isPrologueComplete = true;

            // Trigger a boss battle directly
            const boss = window.SlotsRPG.BossConfig.getBoss(1, 0, 'wanjian', 1);
            const enc = {
              tier: 'boss',
              isBoss: true,
              monsters: [boss],
              player: gm.player,
              scatterCount: 5,
              betMultiplier: 1
            };
            const battleResult = window.SlotsRPG.CombatEngine.simulateEncounter(gm.player, enc, null);
            battleResult.encounter = enc;
            battleResult.boss = boss;
            window.SlotsRPG.EventBus.emit('TRIGGER_BATTLE', { battleResult, encounter: enc });
          }
        }, 300);
      });
    </script>
  `;
  html = html.replace('</body>', `${injectScript}</body>`);
  fs.writeFileSync(testHtml, html, 'utf8');

  const port = 9333;
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

  console.log('Waiting for combat arena to load and render...');
  await new Promise(r => setTimeout(r, 1500));

  // 1. Capture Idle State
  const idleShot = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(shotIdle, Buffer.from(idleShot.result.data, 'base64'));
  console.log('✅ Captured monster combat idle screenshot:', shotIdle);

  // 2. Trigger Monster Hurt Feedback
  console.log('Triggering monster hurt feedback...');
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const avatar = document.querySelector('.monster-unit-avatar');
        if (avatar && window.SlotsRPG && window.SlotsRPG.BattleJuiceEngine) {
          window.SlotsRPG.BattleJuiceEngine.triggerMonsterHurtFeedback(avatar, true);
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 60)); // Capture in mid-flinch
  const hitShot = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(shotHit, Buffer.from(hitShot.result.data, 'base64'));
  console.log('✅ Captured monster combat hit reaction screenshot:', shotHit);

  // 3. Trigger Monster Lunge Feedback
  await new Promise(r => setTimeout(r, 500));
  console.log('Triggering monster lunge attack...');
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const avatar = document.querySelector('.monster-unit-avatar');
        if (avatar && window.SlotsRPG && window.SlotsRPG.BattleJuiceEngine) {
          window.SlotsRPG.BattleJuiceEngine.triggerMonsterLunge(avatar, true);
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 180)); // Capture in mid-lunge
  const lungeShot = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(shotLunge, Buffer.from(lungeShot.result.data, 'base64'));
  console.log('✅ Captured monster combat lunge attack screenshot:', shotLunge);

  ws.close();
  chromeProcess.kill();
  try { if (fs.existsSync(testHtml)) fs.unlinkSync(testHtml); } catch (e) {}
  setTimeout(() => {
    try { if (fs.existsSync(userDataDir)) fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }, 1000);
  console.log('🎉 Visual captures completed successfully!');
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
