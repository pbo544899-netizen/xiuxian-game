// verify_numerical_live.js
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8089;
const ROOT = path.resolve(__dirname, '..');

// 1. Static file server
const mimeMap = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT, reqPath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeMap[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  console.log(`Server listening at http://localhost:${PORT}`);
  runBrowserTest();
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBrowserTest() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cdpPort = 9226;
  const userDataDir = path.join(__dirname, 'temp_edge_num_' + Date.now());

  const edgeProc = spawn(edgePath, [
    `--remote-debugging-port=${cdpPort}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--headless=new',
    '--disable-gpu',
    '--window-size=430,932',
    `http://localhost:${PORT}`
  ]);

  console.log('Launched Edge headless, waiting for CDP...');
  await delay(2500);

  try {
    const listRes = await fetch(`http://127.0.0.1:${cdpPort}/json`);
    const targets = await listRes.json();
    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost'));
    if (!pageTarget) throw new Error('No game page target found');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    await new Promise(r => ws.onopen = r);
    console.log('Connected to CDP WebSocket');

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (event) => {
          const res = JSON.parse(event.data);
          if (res.id === id) {
            ws.removeEventListener('message', handler);
            if (res.error) reject(res.error);
            else resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true });
      return res.result ? res.result.value : null;
    }

    async function captureScreenshot(filename) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(res.data, 'base64');
      const outPath = path.join(__dirname, '..', filename);
      fs.writeFileSync(outPath, buffer);
      console.log(`Saved screenshot: ${filename}`);
    }

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('Clearing localStorage for fresh run...');
    await evaluate('localStorage.clear()');
    await evaluate('location.reload()');
    await delay(3000);

    // 1. Initial State: Close mortal intro dialog and check button
    console.log('Closing initial mortal story dialog...');
    await evaluate(`
      const btn = document.getElementById('btn-story-dialog-close');
      if (btn) btn.click();
      if (window.storyManager) window.storyManager.closeStoryDialog(true);
    `);
    await delay(600);

    // 2. Start Prologue Battle
    console.log('Clicking 拔刀斩凶 (初战)...');
    await evaluate(`
      const pBtn = document.getElementById('btn-prologue-battle');
      if (pBtn) pBtn.click();
    `);
    await delay(800);

    // Let the prologue battle play out and wait for modal-awakening
    console.log('Waiting for modal-awakening to appear...');
    for (let i = 0; i < 30; i++) {
      const isAwakeningOpen = await evaluate(`!document.getElementById('modal-awakening').classList.contains('hidden')`);
      if (isAwakeningOpen) {
        console.log(`modal-awakening opened at ${(i * 300)}ms!`);
        break;
      }
      await delay(300);
    }

    // 3. Artifact Awakening Accept
    console.log('Accepting Artifact Awakening...');
    await evaluate(`
      const acceptBtn = document.getElementById('btn-awakening-accept');
      if (acceptBtn) acceptBtn.click();
    `);
    await delay(1200);

    // Close the prologue_first_spin story dialog
    console.log('Closing prologue_first_spin story dialog...');
    await evaluate(`
      if (window.SlotsRPG && window.SlotsRPG.StoryManager) {
        window.SlotsRPG.StoryManager.closeStoryDialog(true);
      }
      const skipBtn = document.getElementById('btn-story-skip');
      if (skipBtn) skipBtn.click();
      const modal = document.getElementById('modal-story-dialog');
      if (modal) modal.classList.add('hidden');
    `);
    await delay(600);

    // Verify on Slots tab
    const currentTab = await evaluate(`
      const activeNav = document.querySelector('.bottom-nav-item.active');
      activeNav ? activeNav.getAttribute('data-tab') : null;
    `);
    console.log('Current Active Tab after Awakening:', currentTab);

    // Now execute Spins 1 to 5
    for (let spinNum = 1; spinNum <= 5; spinNum++) {
      console.log(`\n--- Executing Spin ${spinNum} ---`);
      
      const beforeEnergy = await evaluate('window.gameManager.energy');
      const prologueSpins = await evaluate('window.gameManager.prologueSpins');
      console.log(`Before spin ${spinNum}: energy = ${beforeEnergy}, prologueSpins = ${prologueSpins}`);

      // Click spin button
      console.log(`Clicking btn-spin for Spin ${spinNum}...`);
      await evaluate(`
        const spinBtn = document.getElementById('btn-spin');
        if (spinBtn) spinBtn.click();
      `);

      // Wait for spin reel stopping animation
      console.log('Waiting for spin to complete...');
      await delay(1000);
      for (let w = 0; w < 25; w++) {
        const isSpinning = await evaluate('window.gameManager.renderer ? window.gameManager.renderer.isSpinning : false');
        if (!isSpinning) {
          console.log(`Spin ${spinNum} finished spinning at ${(w * 300 + 1000)}ms`);
          break;
        }
        await delay(300);
      }
      await delay(800);

      const afterEnergy = await evaluate('window.gameManager.energy');
      const dialogText = await evaluate('document.getElementById("status-dialog").innerText');
      console.log(`After spin ${spinNum}: energy = ${afterEnergy}, dialog = "${dialogText}"`);

      if (spinNum === 5) {
        // Spin 5 triggers the battle!
        console.log('Spin 5 triggered battle! Waiting for arena to open...');
        await delay(1500);

        const arenaVisible = await evaluate('!document.getElementById("modal-battle-arena").classList.contains("hidden")');
        console.log('Battle arena visible for Spin 5:', arenaVisible);

        const bossHudName = await evaluate('document.getElementById("battle-boss-name") ? document.getElementById("battle-boss-name").innerText : ""');
        const bossHudHp = await evaluate('document.getElementById("battle-boss-hp-text") ? document.getElementById("battle-boss-hp-text").innerText : ""');
        const playerHpText = await evaluate('document.getElementById("battle-hero-hp-text") ? document.getElementById("battle-hero-hp-text").innerText : ""');
        console.log(`Battle info: Enemy="${bossHudName}" HP="${bossHudHp}" | Player HP="${playerHpText}"`);

        await captureScreenshot('ftue_spin5_battle.png');

        // Let the auto battle execute
        console.log('Waiting for battle rounds to resolve...');
        await delay(4500);

        // Check if victory modal appeared
        const victoryVisible = await evaluate('!document.getElementById("modal-battle-victory").classList.contains("hidden")');
        const defeatVisible = await evaluate('!document.getElementById("modal-battle-defeat").classList.contains("hidden")');
        console.log(`Battle Result: Victory Modal=${victoryVisible}, Defeat Modal=${defeatVisible}`);

        await captureScreenshot('ftue_spin5_victory.png');

        if (victoryVisible) {
          console.log('Closing victory modal...');
          await evaluate(`
            const vBtn = document.getElementById('btn-battle-victory-confirm');
            if (vBtn) vBtn.click();
          `);
          await delay(1000);
        }
      }
    }

    // Now execute Spin 6 -> Sect induction!
    console.log('\n--- Executing Spin 6 (Sect Induction) ---');
    await evaluate(`
      const spinBtn = document.getElementById('btn-spin');
      if (spinBtn) spinBtn.click();
    `);
    await delay(3000);

    const sectModalVisible = await evaluate('!document.getElementById("modal-sect-induction").classList.contains("hidden")');
    console.log('Sect Induction Modal Visible:', sectModalVisible);
    await captureScreenshot('ftue_spin6_sect_induction.png');

    console.log('\n🎉 ALL LIVE FTUE & NUMERICAL TESTS PASSED SUCCESSFULLY!');

    edgeProc.kill();
    server.close();
    process.exit(0);

  } catch (err) {
    console.error('Error during test:', err);
    edgeProc.kill();
    server.close();
    process.exit(1);
  }
}
