const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_cdp_profile_sound_test');
const htmlSource = path.join(__dirname, '../index.html');

const brainDir = 'C:\\Users\\baish\\.gemini\\antigravity\\brain\\01f29278-40ce-4787-9d2d-2408e9039bf0';
const shotSectShowcase = path.join(brainDir, 'sect_ticket_showcase_live.png');
const shotSectModal = path.join(brainDir, 'sect_induction_modal_live.png');

async function main() {
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch(e){}
  }

  const port = 9338;
  const chromeProcess = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=430,932'
  ]);

  await new Promise(r => setTimeout(r, 1500));

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

  const targetUrl = 'file:///' + htmlSource.replace(/\\/g, '/');
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

  console.log("Browser attached and page loaded.");
  await new Promise(r => setTimeout(r, 1200));

  // 1. Verify sound objects and sound toggle button
  const evalSoundObjects = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      ({
        hasSoundEngine: !!window.SlotsRPG.BattleSoundEngine,
        hasSoundEffects: !!window.SlotsRPG.SoundEffects,
        hasSoundManager: !!window.SlotsRPG.SoundManager,
        hasBGMPlayer: !!window.SlotsRPG.BGMPlayer,
        btnToggleText: document.getElementById('btn-sound-toggle')?.innerText,
        isMuted: window.SlotsRPG.BattleSoundEngine.isSoundMuted()
      })
    `,
    returnByValue: true
  });
  console.log("Sound suite objects check:", evalSoundObjects.result.value);

  // 2. Click sound toggle button to test mute / unmute
  const evalToggleClick = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.getElementById('btn-sound-toggle');
        btn.click();
        const stateAfterFirst = {
          text: btn.innerText,
          isMuted: window.SlotsRPG.BattleSoundEngine.isSoundMuted()
        };
        btn.click();
        const stateAfterSecond = {
          text: btn.innerText,
          isMuted: window.SlotsRPG.BattleSoundEngine.isSoundMuted()
        };
        return { stateAfterFirst, stateAfterSecond };
      })()
    `,
    returnByValue: true
  });
  console.log("Sound toggle click test:", evalToggleClick.result.value);

  // 3. Test Phase 1-4 Sect Induction Sequence
  console.log("Triggering Sect Induction Sequence...");
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const gm = window.SlotsRPG.GameManager;
        const renderer = gm.renderer;
        // Trigger sect induction sequence
        window.SlotsRPG.EventBus.emit('TRIGGER_SECT_INDUCTION_SEQUENCE', {
          spinData: {
            isSectInductionSpin: true,
            grid: [
              ['SYM_01', 'SYM_02', 'SYM_03', 'SYM_04', 'SYM_05'],
              ['SYM_11', 'SYM_11', 'SYM_11', 'SYM_01', 'SYM_02'],
              ['SYM_03', 'SYM_04', 'SYM_05', 'SYM_01', 'SYM_02']
            ],
            evaluation: {
              winningLines: [{ lineIndex: 0, coords: [{r:1, c:0}, {r:1, c:1}, {r:1, c:2}] }]
            }
          },
          ticketCoords: [{r:1, c:0}, {r:1, c:1}, {r:1, c:2}],
          options: gm.getRandomSectOptions()
        });
      })()
    `
  });

  // Wait 1600ms to be well inside Phase 3 (Showcase Active: 1200ms delay + showcase runs for 2000ms)
  await new Promise(r => setTimeout(r, 1600));

  const showcaseCheck = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      ({
        isShowcaseActive: window.SlotsRPG.GameManager.renderer.isSectTicketShowcase,
        particleCount: window.SlotsRPG.GameManager.renderer.sectTicketParticles.length,
        announcementText: document.getElementById('announcement-text')?.innerText,
        isJoinModalHidden: document.getElementById('modal-sect-induction')?.classList.contains('hidden')
      })
    `,
    returnByValue: true
  });
  console.log("Phase 3 Showcase Status:", showcaseCheck.result.value);

  // Take screenshot of Phase 3 Showcase
  const shot1Res = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(shotSectShowcase, Buffer.from(shot1Res.result.data, 'base64'));
  console.log("Screenshot 1 saved to:", shotSectShowcase);

  // Wait for Phase 4 (another 1800ms) when Join Modal opens
  await new Promise(r => setTimeout(r, 2000));

  const modalCheck = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      ({
        isShowcaseActive: window.SlotsRPG.GameManager.renderer.isSectTicketShowcase,
        isJoinModalVisible: !document.getElementById('modal-sect-induction')?.classList.contains('hidden'),
        cardCount: document.querySelectorAll('.induction-sect-card').length
      })
    `,
    returnByValue: true
  });
  console.log("Phase 4 Join Modal Status:", modalCheck.result.value);

  // Take screenshot of Phase 4 Join Modal
  const shot2Res = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(shotSectModal, Buffer.from(shot2Res.result.data, 'base64'));
  console.log("Screenshot 2 saved to:", shotSectModal);

  ws.close();
  chromeProcess.kill();
  console.log("Live browser verification completed successfully!");
}

main().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
