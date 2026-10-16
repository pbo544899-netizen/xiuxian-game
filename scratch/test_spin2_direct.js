// test_spin2_direct.js
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8092;
const ROOT = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT, reqPath);
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
  const ext = path.extname(filePath).toLowerCase();
  const mime = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg' }[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cdpPort = 9228;
  const edgeProc = spawn(edgePath, [
    `--remote-debugging-port=${cdpPort}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--headless=new',
    '--disable-gpu',
    '--window-size=430,932',
    `http://localhost:${PORT}`
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const listRes = await fetch(`http://127.0.0.1:${cdpPort}/json`);
  const targets = await listRes.json();
  const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost'));
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
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

  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return r.result ? r.result.value : null;
  };

  await send('Page.enable');
  await send('Runtime.enable');

  await evaluate('localStorage.clear()');
  await evaluate('location.reload()');
  await new Promise(r => setTimeout(r, 2000));

  // Skip mortal story & start prologue battle
  await evaluate(`
    if (window.SlotsRPG && window.SlotsRPG.StoryManager) window.SlotsRPG.StoryManager.closeStoryDialog(true);
    document.getElementById('btn-prologue-battle').click();
  `);
  console.log('Started prologue battle, waiting 6s...');
  await new Promise(r => setTimeout(r, 6000));

  // Accept awakening
  await evaluate(`
    document.getElementById('btn-awakening-accept').click();
    if (window.SlotsRPG && window.SlotsRPG.StoryManager) window.SlotsRPG.StoryManager.closeStoryDialog(true);
  `);
  await new Promise(r => setTimeout(r, 1000));

  console.log('State after awakening:');
  console.log(await evaluate('({ step: window.gameManager.prologueStep, energy: window.gameManager.energy, spins: window.gameManager.prologueSpins })'));

  // Spin 1
  console.log('\nTriggering Spin 1:');
  await evaluate('document.getElementById("btn-spin").click()');
  await new Promise(r => setTimeout(r, 3000));
  console.log('State after spin 1:');
  console.log(await evaluate('({ step: window.gameManager.prologueStep, energy: window.gameManager.energy, spins: window.gameManager.prologueSpins, spinning: window.gameManager.renderer.isSpinning })'));

  // Spin 2
  console.log('\nTriggering Spin 2:');
  const spin2Res = await evaluate(`
    (() => {
      const gm = window.gameManager;
      const isSpinning = gm.renderer ? gm.renderer.isSpinning : false;
      const cost = gm.currentBet;
      const energy = gm.energy;
      document.getElementById('btn-spin').click();
      return { isSpinning, cost, energy, spinsBefore: gm.prologueSpins };
    })()
  `);
  console.log('Spin 2 pre-check:', spin2Res);

  await new Promise(r => setTimeout(r, 3000));
  console.log('State after spin 2:');
  console.log(await evaluate('({ step: window.gameManager.prologueStep, energy: window.gameManager.energy, spins: window.gameManager.prologueSpins, spinning: window.gameManager.renderer.isSpinning })'));

  edgeProc.kill();
  server.close();
  process.exit(0);
});
