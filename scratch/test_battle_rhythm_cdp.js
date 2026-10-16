const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:/Users/baish/.gemini/antigravity/brain/01f29278-40ce-4787-9d2d-2408e9039bf0';

(async () => {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      executablePath: edgePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=430,932']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });

    const htmlPath = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
    console.log('Navigating to:', htmlPath);
    await page.goto(htmlPath, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 1. 触发战斗过场转场，测试加载效果 (Phase Loading)
    console.log('Triggering battle transition cutscene...');
    await page.evaluate(() => {
      const mockResult = {
        encounter: {
          tier: 'normal',
          monsters: [
            { id: 'norm_cock', name: '赤冠铁羽鸡妖', maxHp: 180, hp: 180, atk: 22, avatar: 'assets/monster/monster_cock_iron_claw.png', tier: 'normal' },
            { id: 'norm_fox', name: '九命狡狐妖', maxHp: 160, hp: 160, atk: 18, avatar: 'assets/monster/monster_fox_fire_spirit.png', tier: 'normal' },
            { id: 'norm_wolf', name: '嗜血赤目狼妖', maxHp: 178, hp: 178, atk: 25, avatar: 'assets/monster/monster_wolf_blood_fang.png', tier: 'normal' }
          ]
        },
        itemsUsed: []
      };
      window.testBattleResult = mockResult;
      // 开启过场
      window.showBattleTransitionCutscene(mockResult, () => {
        console.log('Cutscene finished callback called!');
      });
    });

    // 等待 150ms 拍摄【加载中阶段】(Phase Loading)
    await page.waitForTimeout(150);
    const loadingState = await page.evaluate(() => {
      const modal = document.getElementById('modal-battle-transition');
      const loader = document.getElementById('trans-loader');
      const fill = document.getElementById('trans-loader-fill');
      const percent = document.getElementById('trans-loader-percent');
      return {
        modalClasses: modal.className,
        loaderVisible: loader && !modal.classList.contains('hidden') && modal.classList.contains('phase-loading'),
        percentText: percent ? percent.innerText : '',
        fillWidth: fill ? fill.style.width : ''
      };
    });
    console.log('Phase Loading State:', loadingState);

    const shotLoading = path.join(artifactDir, 'verify_trans_phase_loading.png');
    await page.screenshot({ path: shotLoading });
    console.log('Saved loading screenshot to:', shotLoading);

    // 等待加载推演结束进入【对决展示阶段】(Phase Versus, 约 450ms + 200ms = 650ms)
    await page.waitForTimeout(600);
    const versusState = await page.evaluate(() => {
      const modal = document.getElementById('modal-battle-transition');
      const content = document.getElementById('battle-trans-content');
      return {
        modalClasses: modal.className,
        isVersus: modal.classList.contains('phase-versus'),
        contentVisible: !content.classList.contains('hidden')
      };
    });
    console.log('Phase Versus State:', versusState);

    const shotVersus = path.join(artifactDir, 'verify_trans_phase_versus.png');
    await page.screenshot({ path: shotVersus });
    console.log('Saved versus screenshot to:', shotVersus);

    // 2. 测试对决界面关闭后，0.5秒延迟开战与每回合0.5秒间隔
    console.log('Testing 0.5s battle delay and round interval timing...');
    const timingTestResult = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const events = [];
        const originalSetTimeout = window.setTimeout;

        // 模拟真实战斗序列
        const battleResult = window.SlotsRPG.CombatEngine.simulateEncounter(
          window.gameManager.player,
          window.testBattleResult.encounter,
          window.gameManager.inventory,
          1
        );
        battleResult.encounter = window.testBattleResult.encounter;

        const startTime = performance.now();
        let arenaOpenedTime = null;
        let firstStepTime = null;
        const roundStepTimes = [];

        // 监听战场 DOM 显示
        const observer = new MutationObserver(() => {
          const arena = document.getElementById('modal-battle-arena');
          if (arena && !arena.classList.contains('hidden') && !arenaOpenedTime) {
            arenaOpenedTime = performance.now();
            events.push({ type: 'arena_opened', time: arenaOpenedTime - startTime });
          }
        });
        observer.observe(document.getElementById('modal-battle-arena'), { attributes: true, attributeFilter: ['class'] });

        // 启动战斗
        window.playBattleSequence(battleResult);

        // 立即点击跳过转场过场，进入战场关闭时刻
        setTimeout(() => {
          const trans = document.getElementById('modal-battle-transition');
          if (trans && trans.onclick) trans.onclick();
        }, 100);

        // 轮询检测回合进展与时间
        let lastRound = 0;
        const checkInterval = setInterval(() => {
          const roundEl = document.getElementById('battle-round-badge');
          if (roundEl) {
            const match = roundEl.innerText.match(/回合\s*(\d+)/);
            if (match) {
              const curRound = parseInt(match[1]);
              if (curRound !== lastRound) {
                lastRound = curRound;
                roundStepTimes.push({ round: curRound, time: performance.now() - startTime });
              }
            }
          }
          if (roundStepTimes.length >= 3 || performance.now() - startTime > 4500) {
            clearInterval(checkInterval);
            observer.disconnect();
            resolve({
              events,
              roundStepTimes,
              totalTime: performance.now() - startTime
            });
          }
        }, 30);
      });
    });

    console.log('Timing Test Result:', JSON.stringify(timingTestResult, null, 2));

    await page.waitForTimeout(500);
    const shotBattle = path.join(artifactDir, 'verify_battle_rhythm_arena.png');
    await page.screenshot({ path: shotBattle });
    console.log('Saved battle arena screenshot to:', shotBattle);

    console.log('All tests completed successfully!');
  } catch (err) {
    console.error('Error in test:', err);
  } finally {
    if (browser) await browser.close();
  }
})();
