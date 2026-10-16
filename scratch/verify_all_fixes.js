const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome_cdp_profile_verify_all');
const htmlSource = path.join(__dirname, '../index.html');
const brainDir = 'C:\\Users\\baish\\.gemini\\antigravity\\brain\\01f29278-40ce-4787-9d2d-2408e9039bf0';

async function run() {
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch(e){}
  }

  const port = 9345;
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
  const browserExceptions = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      browserExceptions.push(msg.params.exceptionDetails);
    }
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
  await sendSessionCmd('Log.enable');

  console.log("Browser attached and page loaded.");
  await new Promise(r => setTimeout(r, 1500));

  // TEST 1: Top bar button isolation
  const topBarTest = await sendSessionCmd('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const btnRules = document.getElementById('btn-rules-toggle');
      const btnSound = document.getElementById('btn-sound-toggle');
      return {
        rulesText: btnRules ? btnRules.innerText : null,
        soundText: btnSound ? btnSound.innerText : null,
        rulesHasSoundClass: btnRules ? btnRules.classList.contains('btn-sound-toggle') : false,
        rulesHasRulesClass: btnRules ? btnRules.classList.contains('btn-rules-toggle') : false
      };
    })()`
  });
  console.log("Top bar test result:", JSON.stringify(topBarTest.result.result.value, null, 2));

  // TEST 2: Numerical Gate Verification for Sect Tickets (Unit tests in live engine)
  const numericalGateTest = await sendSessionCmd('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const gm = window.SlotsRPG.GameManager;
      const results = {};

      // Reset test state
      gm.unlockedSectTicket = null;
      gm.hasDefeatedSectBoss = false;

      // Case A: 0 purple items, has NOT defeated boss
      const ticketA = gm.stealSectTicketWithCheat(false);
      results.caseA_noBoss_noGear = {
        awarded: !!ticketA,
        expected: false,
        pass: ticketA === null
      };

      // Case B: Boss defeated with Q1 items (0 purple items)
      gm.hasDefeatedSectBoss = true;
      const ticketB = gm.stealSectTicketWithCheat(false);
      results.caseB_bossOnly_noPurpleGear = {
        awarded: !!ticketB,
        expected: false,
        pass: ticketB === null
      };

      // Case C: 5 purple items + 1 blue item (incomplete 6-slot set) with boss defeated
      const ItemModel = window.SlotsRPG.ItemModel;
      gm.player.equipment.weapon = ItemModel.createEquipment('weapon', 'Q4');
      gm.player.equipment.armor  = ItemModel.createEquipment('armor', 'Q4');
      gm.player.equipment.ring   = ItemModel.createEquipment('ring', 'Q4');
      gm.player.equipment.hat    = ItemModel.createEquipment('hat', 'Q4');
      gm.player.equipment.boots  = ItemModel.createEquipment('boots', 'Q4');
      gm.player.equipment.belt   = ItemModel.createEquipment('belt', 'Q3'); // blue
      
      const status5 = gm.player.checkFullSetEquipped('Q4');
      const ticketC = gm.stealSectTicketWithCheat(false);
      results.caseC_5purple_1blue = {
        isGraduated: status5.isGraduated,
        awarded: !!ticketC,
        expected: false,
        pass: ticketC === null && !status5.isGraduated
      };

      // Case D: Full 6/6 purple items BUT boss not defeated
      gm.player.equipment.belt = ItemModel.createEquipment('belt', 'Q4'); // 6/6 purple!
      gm.hasDefeatedSectBoss = false;
      const status6 = gm.player.checkFullSetEquipped('Q4');
      const ticketD = gm.stealSectTicketWithCheat(false);
      results.caseD_full6Purple_noBoss = {
        isGraduated: status6.isGraduated,
        awarded: !!ticketD,
        expected: false,
        pass: ticketD === null && status6.isGraduated
      };

      // Case E: Full 6/6 purple items AND boss defeated
      gm.hasDefeatedSectBoss = true;
      const ticketE = gm.stealSectTicketWithCheat(false);
      results.caseE_full6Purple_andBoss = {
        isGraduated: status6.isGraduated,
        hasDefeatedSectBoss: gm.hasDefeatedSectBoss,
        awarded: !!ticketE,
        ticketSect: ticketE ? ticketE.sectName : null,
        expected: true,
        pass: ticketE !== null && !!ticketE.sectName
      };

      return results;
    })()`
  });
  console.log("Numerical gate test results:", JSON.stringify(numericalGateTest.result.result.value, null, 2));

  // TEST 3: FTUE Flow, Sect Induction, and Live Spin Animation with Reel Movement Verification
  const spinAnimationTest = await sendSessionCmd('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      const gm = window.SlotsRPG.GameManager;

      function dismissStory() {
        const btnSkip = document.getElementById('btn-story-skip');
        if (btnSkip) btnSkip.click();
        const storyModal = document.getElementById('modal-story-dialog');
        if (storyModal) storyModal.classList.add('hidden');
      }

      dismissStory();
      
      // Step 0: Prologue intro battle
      const btnProBattle = document.getElementById('btn-prologue-battle');
      if (btnProBattle && !btnProBattle.classList.contains('hidden')) {
        btnProBattle.click();
      }
      while (gm.prologueStep === 1) {
        await new Promise(r => setTimeout(r, 80));
      }

      // Step 1: Awakening
      dismissStory();
      const btnAccept = document.getElementById('btn-awakening-accept');
      if (btnAccept) btnAccept.click();
      await new Promise(r => setTimeout(r, 200));

      const btnSpin = document.getElementById('btn-spin');

      // Execute spins 1 to 6
      for (let s = 1; s <= 6; s++) {
        dismissStory();
        while (gm.renderer && gm.renderer.isSpinning) {
          await new Promise(r => setTimeout(r, 100));
        }
        btnSpin.click();
        await new Promise(r => setTimeout(r, 2700));
      }

      // Wait for induction modal to open
      const modalInduction = document.getElementById('modal-sect-induction');
      let waited = 0;
      while (modalInduction.classList.contains('hidden') && waited < 8000) {
        dismissStory();
        await new Promise(r => setTimeout(r, 200));
        waited += 200;
      }

      const joinBtn = modalInduction.querySelector('.btn-join-sect');
      if (joinBtn) {
        joinBtn.click();
      }
      await new Promise(r => setTimeout(r, 400));

      // Dismiss game notice
      const btnNotice = document.getElementById('btn-action-notice-confirm');
      if (btnNotice) btnNotice.click();
      await new Promise(r => setTimeout(r, 300));
      dismissStory();

      // Switch to slots tab
      const tabSlots = document.querySelector('[data-tab="slots"]');
      if (tabSlots) tabSlots.click();
      await new Promise(r => setTimeout(r, 400));

      const sectJoined = gm.player.currentSect;
      const isPrologueComplete = gm.isPrologueComplete;

      // Ensure enough energy
      gm.energy = 500;

      // NOW: Click spin after joining sect!
      btnSpin.click();
      
      // Sample 3 consecutive frames during spin to verify active motion
      await new Promise(r => setTimeout(r, 150));
      const frame1Offsets = gm.renderer.reels.map(r => Math.round(r.offsetY));
      const frame1State = gm.renderer.reels.map(r => r.state);

      await new Promise(r => setTimeout(r, 100));
      const frame2Offsets = gm.renderer.reels.map(r => Math.round(r.offsetY));

      await new Promise(r => setTimeout(r, 100));
      const frame3Offsets = gm.renderer.reels.map(r => Math.round(r.offsetY));

      // Wait for spin to complete
      while (gm.renderer.isSpinning) {
        await new Promise(r => setTimeout(r, 100));
      }
      await new Promise(r => setTimeout(r, 600));

      const finalState = {
        reelsState: gm.renderer.reels.map(r => r.state),
        isSpinning: gm.renderer.isSpinning,
        energy: gm.energy,
        nonWinningAlpha: gm.renderer.nonWinningAlpha
      };

      return {
        sectJoined,
        isPrologueComplete,
        frame1State,
        frame1Offsets,
        frame2Offsets,
        frame3Offsets,
        finalState,
        isMotionObserved: frame1Offsets.some((off, idx) => off !== frame2Offsets[idx] || frame2Offsets[idx] !== frame3Offsets[idx])
      };
    })()`
  });
  console.log("Spin animation test result:", JSON.stringify(spinAnimationTest.result.result.value, null, 2));

  // Take screenshot of slots after post-induction spin
  const shot1 = await sendSessionCmd('Page.captureScreenshot', { format: 'png' });
  const shot1Path = path.join(brainDir, 'spin_post_sect_live.png');
  fs.writeFileSync(shot1Path, Buffer.from(shot1.result.data, 'base64'));
  console.log("Screenshot saved to", shot1Path);

  console.log("Browser exceptions during test:", browserExceptions.length);
  if (browserExceptions.length > 0) {
    console.error(JSON.stringify(browserExceptions, null, 2));
  }

  chromeProcess.kill();
}

run().catch(console.error);
