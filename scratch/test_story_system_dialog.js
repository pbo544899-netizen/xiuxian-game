const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_verify_story');
const targetUrl = 'file:///e:/my%20games/slots_rpg/index.html';

async function main() {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const port = 9350;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--no-sandbox',
    '--disable-gpu',
    '--user-data-dir=' + userDataDir,
    '--window-size=430,932'
  ]);

  await new Promise(r => setTimeout(r, 1200));

  const versionJson = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:' + port + '/json/version', (res) => {
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

  console.log('1. Testing prologue mortal intro dialogue (the user reported scene)...');
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const sm = window.SlotsRPG.StoryManager;
        sm.triggerChapter('prologue_mortal_intro');
      })()
    `
  });

  await new Promise(r => setTimeout(r, 800));

  // Check bounding boxes of speech bubble vs avatar
  const checkBoxes = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const bubble = document.getElementById('player-speech-bubble');
        const avatar = document.querySelector('#story-actor-player .actor-portrait-frame');
        const cheatAvatar = document.querySelector('#story-actor-cheat .actor-portrait-frame img');
        const cheatActor = document.getElementById('story-actor-cheat');
        const bRect = bubble.getBoundingClientRect();
        const aRect = avatar.getBoundingClientRect();
        return {
          bubbleBottom: bRect.bottom,
          avatarTop: aRect.top,
          isOverlapping: bRect.bottom > aRect.top,
          gap: aRect.top - bRect.bottom,
          cheatAvatarSrc: cheatAvatar ? cheatAvatar.src : null,
          cheatDormant: cheatActor ? cheatActor.classList.contains('actor-dormant') : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Bounding Box & Overlap Check:', JSON.stringify(checkBoxes.result.result.value));

  let shot1 = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/verify_story_bubble_fixed.png', Buffer.from(shot1.result.data, 'base64'));

  // Test advancing dialogue line
  console.log('2. Advancing dialogue line...');
  await sendSessionCmd('Runtime.evaluate', {
    expression: `window.SlotsRPG.StoryManager.advanceStoryLine();`
  });
  await new Promise(r => setTimeout(r, 400));

  // Close story dialog and switch to slots tab
  console.log('3. Closing story dialog and checking main screen Cheat System button...');
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        window.SlotsRPG.StoryManager.closeStoryDialog(true);
        const gm = window.SlotsRPG.GameManager;
        gm.isPrologueComplete = true;
        gm.prologueStep = 4;
        gm.player.promoteToCultivator('wanjian');
        gm.currentBet = 25;
        gm.emitStateChange();
        const tabSlots = document.getElementById('tab-slots');
        if (tabSlots) tabSlots.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 500));

  // Click the new Cheat System button on main screen
  console.log('4. Clicking btn-cheat-system-ai on main screen...');
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.getElementById('btn-cheat-system-ai');
        if (btn) btn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));

  let shot2 = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/verify_system_entry_toast.png', Buffer.from(shot2.result.data, 'base64'));

  // Now test prologue awaken scene where system speaks
  console.log('5. Testing prologue awaken scene where Cheat System activates...');
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        window.SlotsRPG.StoryManager.triggerChapter('prologue_awaken');
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));

  // Advance to system line
  await sendSessionCmd('Runtime.evaluate', {
    expression: `window.SlotsRPG.StoryManager.advanceStoryLine();`
  });
  await new Promise(r => setTimeout(r, 600));

  let shot3 = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/verify_system_awakened.png', Buffer.from(shot3.result.data, 'base64'));

  const checkBoxes2 = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const bubble = document.getElementById('system-speech-bubble');
        const avatar = document.querySelector('#story-actor-cheat .actor-portrait-frame');
        const bRect = bubble.getBoundingClientRect();
        const aRect = avatar.getBoundingClientRect();
        return {
          systemBubbleBottom: bRect.bottom,
          systemAvatarTop: aRect.top,
          isOverlapping: bRect.bottom > aRect.top,
          gap: aRect.top - bRect.bottom
        };
      })()
    `,
    returnByValue: true
  });
  console.log('System Bubble Bounding Box Check:', JSON.stringify(checkBoxes2.result.result.value));

  chromeProc.kill();
  console.log('TEST COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
