const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_cdp_profile_eval');
const targetUrl = 'file:///e:/my%20games/slots_rpg/preview_character_ui.html';

async function main() {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=480,853'
  ]);

  let versionData = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9223/json/version');
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
  await new Promise(r => setTimeout(r, 1500));

  const evalRes = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const wrap = document.getElementById('floating-merge-wrap');
        const btn = document.getElementById('btn-floating-merge');
        const viewChar = document.getElementById('view-character');
        const bagSection = document.querySelector('.bag-section');
        return {
          wrapExists: !!wrap,
          wrapClass: wrap ? wrap.className : null,
          btnExists: !!btn,
          btnDisabled: btn ? btn.disabled : null,
          canMerge: window.gameManager ? window.gameManager.canMergeEquipment() : null,
          viewScrollHeight: viewChar ? viewChar.scrollHeight : null,
          viewClientHeight: viewChar ? viewChar.clientHeight : null,
          wrapOffsetTop: wrap ? wrap.offsetTop : null,
          bagSectionOffsetTop: bagSection ? bagSection.offsetTop : null,
          bagSectionHeight: bagSection ? bagSection.offsetHeight : null
        };
      })()
    `,
    returnByValue: true
  });

  console.log('EVAL RESULT:', JSON.stringify(evalRes.result));

  ws.close();
  chromeProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
