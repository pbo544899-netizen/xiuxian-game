const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:/Users/baish/.gemini/antigravity/brain/01f29278-40ce-4787-9d2d-2408e9039bf0';
const htmlSrc = fs.readFileSync('E:/my games/slots_rpg/index.html', 'utf8');

function generateHtmlWithAction(actionCode) {
  const injectScript = `
    <script>
      window.addEventListener('load', () => {
        setTimeout(() => {
          const modalStory = document.getElementById('modal-story-dialog');
          if (modalStory) modalStory.classList.add('hidden');
          if (window.gameManager) window.gameManager.prologueStep = 2;
          ${actionCode}
        }, 300);
      });
    </script>
  `;
  return htmlSrc.replace('</body>', injectScript + '</body>');
}

const rootDir = 'E:/my games/slots_rpg';

// 场景 1: 过场加载中 (Phase Loading - 灵识感知与敌阵锁定推演)
const htmlLoading = generateHtmlWithAction(`
  const mockResult = {
    encounter: {
      tier: 'normal',
      monsters: [
        { id: 'norm_fox_1', name: '赤狐大妖', maxHp: 180, hp: 180, atk: 22, avatar: 'assets/monsters/monster_fox_vivid.png', tier: 'normal' },
        { id: 'norm_toad_1', name: '玄毒蟾蜍', maxHp: 160, hp: 160, atk: 18, avatar: 'assets/monsters/monster_toad_vivid.png', tier: 'normal' }
      ]
    },
    itemsUsed: []
  };
  window.showBattleTransitionCutscene(mockResult, () => {});
`);
const tempHtmlLoading = path.resolve(rootDir, 'temp_battle_loading.html');
fs.writeFileSync(tempHtmlLoading, htmlLoading, 'utf8');

// 场景 2: 对决画卷展示 (Phase Versus - 双方卡片对撞与金光 VS 剑芒)
const htmlVersus = generateHtmlWithAction(`
  const mockResult = {
    encounter: {
      tier: 'normal',
      monsters: [
        { id: 'norm_fox_1', name: '赤狐大妖', maxHp: 180, hp: 180, atk: 22, avatar: 'assets/monsters/monster_fox_vivid.png', tier: 'normal' },
        { id: 'norm_toad_1', name: '玄毒蟾蜍', maxHp: 160, hp: 160, atk: 18, avatar: 'assets/monsters/monster_toad_vivid.png', tier: 'normal' }
      ]
    },
    itemsUsed: []
  };
  window.showBattleTransitionCutscene(mockResult, () => {});
  // 在 100ms 快速切至 versus 阶段便于长久取景
  setTimeout(() => {
    const modal = document.getElementById('modal-battle-transition');
    if (modal) {
      modal.classList.remove('phase-loading');
      modal.classList.add('phase-versus');
    }
  }, 100);
`);
const tempHtmlVersus = path.resolve(rootDir, 'temp_battle_versus.html');
fs.writeFileSync(tempHtmlVersus, htmlVersus, 'utf8');

// 场景 3: 战斗场景与回合节奏 (Battle Arena - 敌阵陈列、回合节奏与对峙)
const htmlArena = generateHtmlWithAction(`
  const mockResult = {
    encounter: {
      tier: 'normal',
      monsters: [
        { id: 'norm_fox_1', name: '赤狐大妖', maxHp: 180, hp: 180, atk: 22, avatar: 'assets/monsters/monster_fox_vivid.png', tier: 'normal' },
        { id: 'norm_toad_1', name: '玄毒蟾蜍', maxHp: 160, hp: 160, atk: 18, avatar: 'assets/monsters/monster_toad_vivid.png', tier: 'normal' }
      ]
    },
    itemsUsed: []
  };
  const sim = window.SlotsRPG.CombatEngine.simulateEncounter(window.gameManager.player, mockResult.encounter, window.gameManager.inventory, 1);
  sim.encounter = mockResult.encounter;
  window.playBattleSequence(sim);
  // 50ms 快速关闭过场，进入战场并经历0.5秒延迟后开始交锋
  setTimeout(() => {
    const trans = document.getElementById('modal-battle-transition');
    if (trans) {
      trans.classList.add('hidden');
      trans.classList.remove('phase-loading', 'phase-versus');
    }
    const arena = document.getElementById('modal-battle-arena');
    if (arena) arena.classList.remove('hidden');
  }, 50);
`);
const tempHtmlArena = path.resolve(rootDir, 'temp_battle_arena.html');
fs.writeFileSync(tempHtmlArena, htmlArena, 'utf8');

// 执行截图 (不同 virtual-time-budget 捕获对应生命周期)
const captures = [
  { file: tempHtmlLoading, out: 'verify_1_battle_trans_loading.png', desc: '战斗切入界面加载中效果(灵识感知/八卦阵雷达/进度条)', budget: 500 },
  { file: tempHtmlVersus, out: 'verify_2_battle_trans_versus.png', desc: '加载完成后对决画卷展示(仙魔对峙与VS剑芒)', budget: 800 },
  { file: tempHtmlArena, out: 'verify_3_battle_arena_pacing.png', desc: '界面关闭后0.5s进入战场交锋(回合节奏与锁定目标)', budget: 2200 }
];

captures.forEach(c => {
  const userDir = path.resolve(__dirname, 'edge_user_' + Date.now() + Math.floor(Math.random()*1000));
  fs.mkdirSync(userDir, { recursive: true });
  const outPath = path.resolve(artifactDir, c.out);
  const cmd = `"${edgePath}" --headless --disable-gpu --virtual-time-budget=${c.budget} --user-data-dir="${userDir}" --screenshot="${outPath}" --window-size=430,860 "file:///${c.file.replace(/\\/g, '/')}"`;
  try {
    execSync(cmd, { stdio: 'ignore' });
    console.log(`📸 [${c.desc}] 截图成功:`, c.out);
  } catch (err) {
    console.error(`截图失败 [${c.desc}]:`, err.message);
  }
});
