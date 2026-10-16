const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_cdp_profile_responsive');
const targetUrl = 'file:///e:/my%20games/slots_rpg/index.html';
const artifactDir = 'C:\\Users\\baish\\.gemini\\antigravity\\brain\\01f29278-40ce-4787-9d2d-2408e9039bf0';

async function main() {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=600,1000'
  ]);

  let versionData = null;
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch (e) {}
  }

  if (!versionData) {
    console.error('Failed to connect to Chrome debug port');
    chromeProc.kill();
    process.exit(1);
  }

  console.log('Connected to Chrome DevTools Protocol');
  const ws = new WebSocket(versionData.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

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

  await sendSessionCmd('Page.enable');
  await sendSessionCmd('DOM.enable');

  console.log('Page loading, waiting 1.5s for audio/game setup...');
  await new Promise(r => setTimeout(r, 1500));

  // 跳过或关闭开场剧情弹窗并解锁序章
  await evalCode(`
    const skipBtn = document.getElementById('btn-story-skip');
    if (skipBtn) skipBtn.click();
    const storyModal = document.getElementById('modal-story');
    if (storyModal) storyModal.classList.add('hidden');
    if (window.gameManager) {
      window.gameManager.isPrologueComplete = true;
      window.gameManager.prologueStep = 3;
      window.SlotsRPG.EventBus.emit('STATE_CHANGE', window.gameManager.getState());
    }
  `);
  await new Promise(r => setTimeout(r, 500));

  async function setViewport(width, height, dpr = 2) {
    await sendSessionCmd('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: dpr,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 200));
  }

  async function evalCode(expression) {
    return await sendSessionCmd('Runtime.evaluate', {
      expression,
      returnByValue: true
    });
  }

  async function takeScreenshot(fileName) {
    const shotRes = await sendSessionCmd('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false
    });
    const buffer = Buffer.from(shotRes.result.data, 'base64');
    const outPath = path.join(artifactDir, fileName);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${fileName} (${buffer.length} bytes)`);
  }

  // --- 1. iPhone SE (375 x 667) 测试 ---
  console.log('\n=== Testing iPhone SE (375 x 667) ===');
  await setViewport(375, 667);

  // 1A. Slots 主界面
  console.log('Capturing Slots view at 375x667...');
  await evalCode(`window.switchTab('slots')`);
  await new Promise(r => setTimeout(r, 400));
  await takeScreenshot('responsive_iphonese_slots.png');

  // 1B. Character 角色修真界面 (顶部)
  console.log('Capturing Character view (top) at 375x667...');
  await evalCode(`
    window.switchTab('character');
    const charView = document.getElementById('view-character');
    if (charView) charView.scrollTop = 0;
  `);
  await new Promise(r => setTimeout(r, 400));
  await takeScreenshot('responsive_iphonese_character_top.png');

  // 1C. Character 角色修真界面 (滚到底部，查看背包网格)
  console.log('Capturing Character view (scrolled to bottom) at 375x667...');
  await evalCode(`
    const charView = document.getElementById('view-character');
    if (charView) charView.scrollTop = 9999;
  `);
  await new Promise(r => setTimeout(r, 400));
  await takeScreenshot('responsive_iphonese_character_bottom.png');

  // 1D. Cave 洞天福地界面
  console.log('Capturing Cave view at 375x667...');
  await evalCode(`window.switchTab('cave')`);
  await new Promise(r => setTimeout(r, 400));
  await takeScreenshot('responsive_iphonese_cave.png');

  // 1E. 秘卷图谱弹窗
  console.log('Capturing Paytable Modal at 375x667...');
  await evalCode(`
    window.switchTab('slots');
    const btnRules = document.getElementById('btn-paytable-rules') || document.querySelector('.btn-rules-toggle');
    if (btnRules) btnRules.click();
  `);
  await new Promise(r => setTimeout(r, 400));
  await takeScreenshot('responsive_iphonese_modal_rules.png');
  // 关闭秘卷弹窗
  await evalCode(`
    const closeBtn = document.getElementById('btn-close-paytable') || document.getElementById('btn-close-rules');
    if (closeBtn) closeBtn.click();
    const modal = document.getElementById('modal-paytable-rules') || document.getElementById('modal-rules');
    if (modal) modal.classList.add('hidden');
  `);
  await new Promise(r => setTimeout(r, 200));

  // --- 2. iPhone 16 / 15 (393 x 852) 测试 ---
  console.log('\n=== Testing iPhone 16 (393 x 852) ===');
  await setViewport(393, 852);

  console.log('Capturing Slots view at 393x852...');
  await evalCode(`window.switchTab('slots')`);
  await new Promise(r => setTimeout(r, 400));
  await takeScreenshot('responsive_iphone16_slots.png');

  console.log('Capturing Character view at 393x852...');
  const switchRes = await evalCode(`
    (function() {
      if (window.gameManager) window.gameManager.isPrologueComplete = true;
      window.switchTab('character');
      const charView = document.getElementById('view-character');
      if (charView) charView.scrollTop = 0;
      return {
        slots: document.getElementById('view-slots').classList.contains('active'),
        char: document.getElementById('view-character').classList.contains('active')
      };
    })()
  `);
  console.log('Switch result (iPhone 16 Character):', JSON.stringify(switchRes.result.result.value));
  await new Promise(r => setTimeout(r, 400));
  await takeScreenshot('responsive_iphone16_character.png');

  // --- 3. 极小屏 Android (360 x 640) 测试 ---
  console.log('\n=== Testing Android Small Screen (360 x 640) ===');
  await setViewport(360, 640);

  console.log('Capturing Character view at 360x640...');
  await evalCode(`
    window.switchTab('character');
    const charView = document.getElementById('view-character');
    if (charView) charView.scrollTop = 0;
  `);
  await new Promise(r => setTimeout(r, 400));
  await takeScreenshot('responsive_android_small_character.png');

  console.log('Capturing Slots view at 360x640...');
  await evalCode(`window.switchTab('slots')`);
  await new Promise(r => setTimeout(r, 400));
  await takeScreenshot('responsive_android_small_slots.png');

  // --- 4. 战斗竞技场在 iPhone SE (375 x 667) 矮屏下的全景测试 ---
  console.log('\n=== Testing Battle Arena at 375x667 ===');
  await setViewport(375, 667);
  await evalCode(`
    window.switchTab('character');
    const battleBtn = document.getElementById('btn-prologue-battle');
    if (battleBtn) battleBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));
  await takeScreenshot('responsive_iphonese_battle.png');

  console.log('\nAll responsive viewport verification screenshots generated successfully!');

  ws.close();
  chromeProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('Error during responsive test:', err);
  process.exit(1);
});
