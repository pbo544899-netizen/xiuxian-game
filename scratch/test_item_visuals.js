const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_cdp_profile_item_test');
const targetUrl = 'file:///e:/my%20games/slots_rpg/index.html';
const artifactDir = 'C:\\Users\\baish\\.gemini\\antigravity\\brain\\01f29278-40ce-4787-9d2d-2408e9039bf0';
const shotPath390 = path.join(artifactDir, 'item_display_optimized_390.png');
const shotPath360 = path.join(artifactDir, 'item_display_optimized_360.png');

async function main() {
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=430,932'
  ]);

  let versionData = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch('http://127.0.0.1:9227/json/version');
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

  console.log('Waiting 1.5s for initial page load...');
  await new Promise(r => setTimeout(r, 1500));

  const evalRes = await sendSessionCmd('Runtime.evaluate', {
    expression: `
      (() => {
        try {
          const modalStory = document.getElementById('modal-story-dialog');
          if (modalStory) modalStory.classList.add('hidden');
          const proSec = document.getElementById('prologue-section');
          if (proSec) proSec.classList.add('hidden');

          const gm = window.gameManager;
          const ItemModel = window.SlotsRPG.ItemModel;
          
          gm.completeSectInduction('wanjian');
          gm.player.realmLevel = 4;

          const w = ItemModel.createEquipment('weapon', 'Q2');
          w.name = '灵器-极道飞剑';
          gm.player.equipment.weapon = w;

          const a = ItemModel.createEquipment('armor', 'Q1');
          a.name = '粗布道袍';
          gm.player.equipment.armor = a;

          const r = ItemModel.createEquipment('ring', 'Q2');
          r.name = '灵器-紫金戒';
          gm.player.equipment.ring = r;

          const h = ItemModel.createEquipment('hat', 'Q1');
          h.name = '凡铁-问道冠';
          gm.player.equipment.hat = h;

          gm.player.equipment.shoes = null;

          const b = ItemModel.createEquipment('belt', 'Q1');
          b.name = '凡铁-极道剑穗带';
          gm.player.equipment.belt = b;

          gm.inventory.slots = new Array(gm.inventory.capacity).fill(null);
          gm.inventory.addItem(ItemModel.createPill('exp', 5));
          gm.inventory.addItem(ItemModel.createPill('hp', 13));

          const swordQ2 = ItemModel.createEquipment('weapon', 'Q2');
          swordQ2.name = '灵器-玄铁剑';
          gm.inventory.addItem(swordQ2);

          const swordQ1_1 = ItemModel.createEquipment('weapon', 'Q1');
          swordQ1_1.name = '凡铁-极道飞剑';
          gm.inventory.addItem(swordQ1_1);

          const swordQ1_2 = ItemModel.createEquipment('weapon', 'Q1');
          swordQ1_2.name = '凡铁-极道飞剑';
          gm.inventory.addItem(swordQ1_2);

          const armorQ1 = ItemModel.createEquipment('armor', 'Q1');
          armorQ1.name = '凡铁-青云甲';
          gm.inventory.addItem(armorQ1);

          const ringQ1 = ItemModel.createEquipment('ring', 'Q1');
          ringQ1.name = '凡铁-剑意灵戒';
          gm.inventory.addItem(ringQ1);

          gm.inventory.addItem(ItemModel.createTalisman('SYM_03', 5));
          gm.inventory.addItem(ItemModel.createTalisman('SYM_02', 11));
          gm.inventory.addItem(ItemModel.createTalisman('SYM_01', 11));

        // Add items of various qualities: Q3 Blue, Q4 Purple, Q5 Orange, Q7 Gold
        const swordQ3 = ItemModel.createEquipment('weapon', 'Q3');
        swordQ3.name = '宝器·斩龙剑';
        gm.inventory.addItem(swordQ3);

        const armorQ4 = ItemModel.createEquipment('armor', 'Q4');
        armorQ4.name = '法器·天蚕宝衣';
        gm.inventory.addItem(armorQ4);

        const ringQ5 = ItemModel.createEquipment('ring', 'Q5');
        ringQ5.name = '道器·太虚灵戒';
        gm.inventory.addItem(ringQ5);

        const beltQ7 = ItemModel.createEquipment('belt', 'Q7');
        beltQ7.name = '神品·诛仙缚龙索';
        gm.inventory.addItem(beltQ7);

        gm.emitStateChange();
        window.switchTab('character');

        const toRect = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { width: Math.round(r.width), height: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) };
        };

        const sampleCell = document.querySelector('.bag-cell.occupied');
        const sampleIcon = sampleCell ? sampleCell.querySelector('.cell-icon') : null;
        const sampleName = sampleCell ? sampleCell.querySelector('.cell-name') : null;
        const sampleSlot = document.querySelector('.equip-slot.occupied');
        const sampleSlotIcon = sampleSlot ? sampleSlot.querySelector('.slot-equip-icon') : null;
        const sampleSlotName = sampleSlot ? sampleSlot.querySelector('.slot-equip-name') : null;

        return {
          success: true,
          count: gm.inventory.slots.filter(x => !!x).length,
          cell: toRect(sampleCell),
          icon: toRect(sampleIcon),
          name: toRect(sampleName),
          slot: toRect(sampleSlot),
          slotIcon: toRect(sampleSlotIcon),
          slotName: toRect(sampleSlotName),
        };
        } catch (e) {
          return { error: e.message, stack: e.stack };
        }
      })()
    `,
    returnByValue: true
  });
  console.log('Evaluate result:', evalRes.result.result.value);

  await new Promise(r => setTimeout(r, 600));

  // Capture at 390x844
  await sendSessionCmd('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 400));
  const shot390 = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(shotPath390, Buffer.from(shot390.result.data, 'base64'));
  console.log('Saved 390 screenshot to:', shotPath390);

  // Capture at 360x780
  await sendSessionCmd('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 780,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 400));
  const shot360 = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(shotPath360, Buffer.from(shot360.result.data, 'base64'));
  console.log('Saved 360 screenshot to:', shotPath360);

  ws.close();
  chromeProc.kill();
}

main().catch(console.error);
