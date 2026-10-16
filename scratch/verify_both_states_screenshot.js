const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_cdp_profile_two_states');
const targetUrl = 'file:///e:/my%20games/slots_rpg/preview_character_ui.html';
const greyShotPath = 'C:\\Users\\baish\\.gemini\\antigravity\\brain\\01f29278-40ce-4787-9d2d-2408e9039bf0\\quick_equip_grey_state.png';
const litShotPath = 'C:\\Users\\baish\\.gemini\\antigravity\\brain\\01f29278-40ce-4787-9d2d-2408e9039bf0\\quick_equip_lit_state.png';

async function main() {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  // 1. Prepare preview HTML replicating user's scenario:
  // Cultivator with equipped weapon, armor, belt, and only pills/runes in bag (NO upgrades)
  let html = fs.readFileSync('index.html', 'utf8');
  const injectScript = `
    <script>
      window.addEventListener('load', () => {
        setTimeout(() => {
          const modalStory = document.getElementById('modal-story-dialog');
          if (modalStory) modalStory.classList.add('hidden');
          const proSec = document.getElementById('prologue-section');
          if (proSec) proSec.classList.add('hidden');

          if (window.gameManager && window.SlotsRPG && window.SlotsRPG.ItemModel) {
            const gm = window.gameManager;
            const ItemModel = window.SlotsRPG.ItemModel;
            gm.player.promoteToCultivator('wanjian');

            // Set up equipped: weapon Q2, armor Q1, belt Q2
            gm.player.equipment.weapon = ItemModel.createEquipment('weapon', 'Q2');
            gm.player.equipment.weapon.power = 40;
            gm.player.equipment.armor = ItemModel.createEquipment('armor', 'Q1');
            gm.player.equipment.armor.power = 15;
            gm.player.equipment.belt = ItemModel.createEquipment('belt', 'Q2');
            gm.player.equipment.belt.power = 40;

            // Clear inventory and add pills and a WEAKER armor (power 8 < 15) so NO upgrade exists
            gm.inventory.clear();
            gm.inventory.addItem(ItemModel.createItem('DAN_EXP_9', 9));
            gm.inventory.addItem(ItemModel.createItem('DAN_HP_1', 4));
            const weakArmor = ItemModel.createEquipment('armor', 'Q1');
            weakArmor.power = 8;
            gm.inventory.addItem(weakArmor);
            gm.inventory.addItem(ItemModel.createItem('RUNE_ENERGY', 6));
            gm.inventory.addItem(ItemModel.createItem('RUNE_ATK', 15));
            gm.inventory.addItem(ItemModel.createItem('RUNE_DEF', 12));

            gm.emitStateChange();
          }

          const tabChar = document.getElementById('tab-character');
          if (tabChar) tabChar.click();
        }, 500);
      });
    </script>
  `;
  html = html.replace('</body>', injectScript + '</body>');
  fs.writeFileSync('preview_character_ui.html', html, 'utf8');

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=480,853'
  ]);

  let versionData = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9225/json/version');
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

  console.log('Waiting 1.5s for initial render without upgrades...');
  await new Promise(r => setTimeout(r, 1500));

  // Capture State 1: Grey / Disabled
  const state1Info = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.getElementById('btn-quick-equip');
        return {
          disabled: btn.disabled,
          className: btn.className,
          title: btn.title
        };
      })()
    `,
    returnByValue: true
  });
  console.log('State 1 (No upgrades):', state1Info.result.value);

  const shot1 = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(greyShotPath, Buffer.from(shot1.result.data, 'base64'));
  console.log('Saved grey state screenshot to:', greyShotPath);

  // Now inject a superior weapon (Q3, power 80 > 40)
  console.log('Adding superior weapon to inventory...');
  await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const gm = window.gameManager;
        const ItemModel = window.SlotsRPG.ItemModel;
        const betterWeapon = ItemModel.createEquipment('weapon', 'Q3');
        betterWeapon.power = 95;
        gm.inventory.addItem(betterWeapon);
        gm.emitStateChange();
      })()
    `
  });

  await new Promise(r => setTimeout(r, 500));

  // Capture State 2: Lit up / Enabled
  const state2Info = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.getElementById('btn-quick-equip');
        return {
          disabled: btn.disabled,
          className: btn.className,
          title: btn.title
        };
      })()
    `,
    returnByValue: true
  });
  console.log('State 2 (Has upgrade):', state2Info.result.value);

  const shot2 = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(litShotPath, Buffer.from(shot2.result.data, 'base64'));
  console.log('Saved lit state screenshot to:', litShotPath);

  ws.close();
  chromeProc.kill();
  fs.rmSync('preview_character_ui.html', { force: true });
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
