const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu'
  ]);

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9223/json/version');
      if (res.ok) break;
    } catch (e) {}
  }

  const verRes = await fetch('http://127.0.0.1:9223/json/version');
  const ver = await verRes.json();
  const ws = new WebSocket(ver.webSocketDebuggerUrl);

  await new Promise(r => ws.onopen = r);

  let id = 1;
  const cbs = new Map();
  ws.onmessage = (e) => {
    const d = JSON.parse(e.data);
    if (d.id && cbs.has(d.id)) {
      const cb = cbs.get(d.id);
      cbs.delete(d.id);
      cb(d);
    }
  };

  function send(method, params = {}) {
    return new Promise(r => {
      const curId = id++;
      cbs.set(curId, r);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  const tRes = await send('Target.createTarget', { url: 'file:///e:/my%20games/slots_rpg/index.html' });
  const aRes = await send('Target.attachToTarget', { targetId: tRes.result.targetId, flatten: true });
  const sid = aRes.result.sessionId;

  function sendS(method, params = {}) {
    return new Promise(r => {
      const curId = id++;
      cbs.set(curId, r);
      ws.send(JSON.stringify({ id: curId, sessionId: sid, method, params }));
    });
  }

  await sendS('Runtime.enable');
  await new Promise(r => setTimeout(r, 1500));

  const res1 = await sendS('Runtime.evaluate', {
    expression: `
      (function() {
        const skip = document.getElementById('btn-story-skip');
        if (skip) skip.click();
        const m = document.getElementById('modal-story');
        if (m) m.classList.add('hidden');
        window.switchTab('slots');
        const s1 = {
          slotsActive: document.getElementById('view-slots').classList.contains('active'),
          charActive: document.getElementById('view-character').classList.contains('active'),
          slotsDisplay: window.getComputedStyle(document.getElementById('view-slots')).display,
          charDisplay: window.getComputedStyle(document.getElementById('view-character')).display
        };
        window.switchTab('character');
        const s2 = {
          slotsActive: document.getElementById('view-slots').classList.contains('active'),
          charActive: document.getElementById('view-character').classList.contains('active'),
          slotsDisplay: window.getComputedStyle(document.getElementById('view-slots')).display,
          charDisplay: window.getComputedStyle(document.getElementById('view-character')).display
        };
        return { before: s1, after: s2 };
      })()
    `,
    returnByValue: true
  });

  console.log('Result:', JSON.stringify(res1.result.result.value, null, 2));

  ws.close();
  chromeProc.kill();
  process.exit(0);
}

main().catch(console.error);
