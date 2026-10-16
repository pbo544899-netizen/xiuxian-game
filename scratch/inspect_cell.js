const { spawn } = require('child_process');
const fs = require('fs');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = 'scratch/chrome_cdp_profile_inspect';

async function test() {
  const chromeProc = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9228', '--disable-gpu', '--user-data-dir=' + userDataDir]);
  await new Promise(r => setTimeout(r, 1000));
  const ver = await (await fetch('http://127.0.0.1:9228/json/version')).json();
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const cbs = new Map();
  ws.onmessage = e => {
    const d = JSON.parse(e.data);
    if (d.id && cbs.has(d.id)) {
      cbs.get(d.id)(d);
      cbs.delete(d.id);
    }
  };
  function send(m, p={}) {
    return new Promise(r => {
      const cid = id++;
      cbs.set(cid, r);
      ws.send(JSON.stringify({id: cid, method: m, params: p}));
    });
  }
  const t = await send('Target.createTarget', {url: 'file:///e:/my%20games/slots_rpg/preview_item_display.html'});
  const a = await send('Target.attachToTarget', {targetId: t.result.targetId, flatten: true});
  const sid = a.result.sessionId;
  function sendS(m, p={}) {
    return new Promise(r => {
      const cid = id++;
      cbs.set(cid, r);
      ws.send(JSON.stringify({id: cid, sessionId: sid, method: m, params: p}));
    });
  }
  await sendS('Runtime.enable');
  await new Promise(r => setTimeout(r, 2000));
  const res = await sendS('Runtime.evaluate', {
    expression: `
      (() => {
        const cn = document.querySelector('.cell-name');
        if (!cn) return 'no cell-name';
        const cs = window.getComputedStyle(cn);
        return {
          text: cn.innerText,
          textDecoration: cs.textDecoration,
          border: cs.border,
          boxShadow: cs.boxShadow,
          background: cs.background,
          parentHTML: cn.parentElement.innerHTML
        };
      })()
    `,
    returnByValue: true
  });
  console.log(JSON.stringify(res.result.result.value, null, 2));
  ws.close();
  chromeProc.kill();
}
test().catch(console.error);
