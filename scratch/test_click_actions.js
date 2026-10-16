const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_cdp_profile_click');
const targetUrl = 'file:///e:/my%20games/slots_rpg/preview_character_ui.html';
const artifactPath = 'C:\\\\Users\\\\baish\\\\.gemini\\\\antigravity\\\\brain\\\\01f29278-40ce-4787-9d2d-2408e9039bf0\\\\character_view_after_equip_and_merge.png';

async function main() {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=480,853'
  ]);

  let versionData = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9224/json/version');
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

  // 1. Click #btn-quick-equip
  console.log('Clicking 一键装备...');
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.getElementById('btn-quick-equip');
        if (btn) btn.click();
      })()
    `
  });

  await new Promise(r => setTimeout(r, 1000));

  // 2. Dismiss modal if notice opened
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.getElementById('modal-game-notice');
        if (modal) modal.classList.add('hidden');
      })()
    `
  });

  // 3. Click #btn-floating-merge (3合1 synthesis)
  console.log('Clicking 一键升阶...');
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.getElementById('btn-floating-merge');
        if (btn) btn.click();
      })()
    `
  });

  await new Promise(r => setTimeout(r, 1000));

  // Dismiss modal if notice opened
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.getElementById('modal-game-notice');
        if (modal) modal.classList.add('hidden');
      })()
    `
  });

  await new Promise(r => setTimeout(r, 500));

  console.log('Capturing screenshot after equip & merge...');
  const shotRes = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(shotRes.result.data, 'base64');
  fs.writeFileSync(artifactPath, buffer);
  console.log('Screenshot saved to:', artifactPath);

  ws.close();
  chromeProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
