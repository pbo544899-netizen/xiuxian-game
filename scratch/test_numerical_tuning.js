// test_numerical_tuning.js
global.window = { SlotsRPG: {} };
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};

require('../src/core/EventBus.js');
require('../src/rpg/SectConfig.js');
require('../src/skills/SectSkillRegistry.js');
require('../src/skills/SkillVisualConfig.js');
require('../src/skills/SkillStateMachine.js');
require('../src/skills/SkillPipeline.js');
require('../src/inventory/ItemModel.js');
require('../src/inventory/InventoryManager.js');
require('../src/rpg/MonsterConfig.js');
require('../src/rpg/BossConfig.js');
require('../src/character/PlayerModel.js');
require('../src/rpg/CombatEngine.js');

const PlayerModel = window.SlotsRPG.PlayerModel;
const MonsterConfig = window.SlotsRPG.MonsterConfig;
const CombatEngine = window.SlotsRPG.CombatEngine;

console.log("=== TESTING PROPOSED NUMERICAL ADJUSTMENTS ===");

// Let us test the new createEncounter logic
function createTunedEncounter(scatterCountOrConfig, potLevel = 1, defeatStreak = 0, player = null) {
  const enc = MonsterConfig.createEncounter(scatterCountOrConfig, potLevel, defeatStreak, player);
  
  // Apply our proposed scaling:
  const isMortal = player && player.isMortal;
  const pLevel = player ? (isMortal ? 0 : player.level) : 1;
  const pStats = player ? player.getTotalStats() : { hp: 100, atk: 20, def: 10 };

  // 1. Count calibration if not exact
  if (enc.tier === 'normal') {
    let targetCount = enc.monsters.length;
    if (isMortal) {
      targetCount = 1;
    } else if (pLevel <= 2) {
      targetCount = Math.min(2, Math.max(1, enc.monsters.length));
    } else if (pLevel <= 4) {
      targetCount = Math.min(3, Math.max(2, enc.monsters.length));
    }
    enc.monsters = enc.monsters.slice(0, targetCount);
    enc.totalCount = enc.monsters.length;
  }

  // 2. Stat scaling based on player stage
  enc.monsters.forEach(m => {
    if (isMortal) {
      // FTUE Spin 5 Mortal opponent: 30 HP, 4 ATK, 0 DEF
      m.hp = 32;
      m.maxHp = 32;
      m.currentHp = 32;
      m.atk = 4;
      m.def = 0;
    } else if (pLevel <= 2) {
      // Lv 1 ~ 2 Cultivator (Target 95~100% win rate)
      // Player HP: ~180, ATK: ~40, DEF: ~18
      m.hp = Math.round(m.hp * 0.45); // ~50-65 HP
      m.maxHp = m.hp;
      m.currentHp = m.hp;
      m.atk = Math.round(m.atk * 0.55); // ~6-9 ATK
      m.def = Math.round(m.def * 0.4);  // ~1-3 DEF
    } else if (pLevel <= 4) {
      // Lv 3 ~ 4 Cultivator (Target 90~95% win rate)
      m.hp = Math.round(m.hp * 0.70);
      m.maxHp = m.hp;
      m.currentHp = m.hp;
      m.atk = Math.round(m.atk * 0.75);
      m.def = Math.round(m.def * 0.6);
    }

    // Defeat streak weakening
    if (defeatStreak > 0) {
      const weakFactor = Math.max(0.5, 1 - defeatStreak * 0.15);
      m.hp = Math.max(10, Math.round(m.hp * weakFactor));
      m.maxHp = m.hp;
      m.currentHp = m.hp;
      m.atk = Math.max(2, Math.round(m.atk * weakFactor));
    }
  });

  return enc;
}

// 1. Mortal Spin 5 test
const mortal = new PlayerModel();
mortal.setupMortalState();
let mortalWins = 0;
for (let i = 0; i < 100; i++) {
  const enc = createTunedEncounter({ tier: 'normal', count: 1, scatterCount: 3 }, 1, 0, mortal);
  const res = CombatEngine.simulateEncounter(mortal, enc, null);
  if (res.isVictory) mortalWins++;
}
console.log("1. Tuned Mortal Win Rate (Spin 5):", mortalWins, "% (Expected: 100%)");

// 2. All 5 sects at Lv 1
console.log("\n2. Tuned Cultivator Lv 1 for all 5 sects:");
const sects = ['wanjian', 'taiyi', 'yushou', 'tianji', 'fen_tian'];
sects.forEach(sectId => {
  const p = new PlayerModel();
  p.promoteToCultivator(sectId);
  let wins = 0;
  let totalRounds = 0;
  for (let i = 0; i < 100; i++) {
    const enc = createTunedEncounter(3, 1, 0, p);
    const res = CombatEngine.simulateEncounter(p, enc, null);
    if (res.isVictory) wins++;
    totalRounds += res.finalRound;
  }
  console.log(`[${sectId}] Lv 1 Tuned Win Rate: ${wins}%, Avg Rounds: ${(totalRounds/100).toFixed(1)}`);
});

// 3. All 5 sects at Lv 2
console.log("\n3. Tuned Cultivator Lv 2 for all 5 sects:");
sects.forEach(sectId => {
  const p = new PlayerModel();
  p.promoteToCultivator(sectId);
  p.addExp(p.maxExp); // Level 2
  let wins = 0;
  let totalRounds = 0;
  for (let i = 0; i < 100; i++) {
    const enc = createTunedEncounter(3, 1, 0, p);
    const res = CombatEngine.simulateEncounter(p, enc, null);
    if (res.isVictory) wins++;
    totalRounds += res.finalRound;
  }
  console.log(`[${sectId}] Lv 2 Tuned Win Rate: ${wins}%, Avg Rounds: ${(totalRounds/100).toFixed(1)}`);
});

// 4. All 5 sects at Lv 3 vs Normal
console.log("\n4. Tuned Cultivator Lv 3 for all 5 sects:");
sects.forEach(sectId => {
  const p = new PlayerModel();
  p.promoteToCultivator(sectId);
  p.addExp(p.maxExp);
  p.addExp(p.maxExp); // Level 3
  let wins = 0;
  let totalRounds = 0;
  for (let i = 0; i < 100; i++) {
    const enc = createTunedEncounter(3, 1, 0, p);
    const res = CombatEngine.simulateEncounter(p, enc, null);
    if (res.isVictory) wins++;
    totalRounds += res.finalRound;
  }
  console.log(`[${sectId}] Lv 3 Tuned Win Rate: ${wins}%, Avg Rounds: ${(totalRounds/100).toFixed(1)}`);
});

// 5. Test Elite Monsters (4 scatters) for Lv 3 and Lv 5
console.log("\n5. Tuned Elite Monsters for Lv 3 and Lv 5:");
[3, 5].forEach(level => {
  sects.forEach(sectId => {
    const p = new PlayerModel();
    p.promoteToCultivator(sectId);
    for (let l = 1; l < level; l++) p.addExp(p.maxExp);
    let wins = 0;
    let totalRounds = 0;
    for (let i = 0; i < 100; i++) {
      const enc = createTunedEncounter(4, 1, 0, p);
      const res = CombatEngine.simulateEncounter(p, enc, null);
      if (res.isVictory) wins++;
      totalRounds += res.finalRound;
    }
    console.log(`[${sectId}] Lv ${level} vs Elite Tuned Win Rate: ${wins}%, Avg Rounds: ${(totalRounds/100).toFixed(1)}`);
  });
});

// 6. Test Lv 5 vs Elite WITH Inventory (2 HP pills + 1 Talisman)
console.log("\n6. Lv 5 vs Elite WITH Inventory (2 pills + 1 talisman):");
const InventoryManager = window.SlotsRPG.InventoryManager;
const ItemModel = window.SlotsRPG.ItemModel;

sects.forEach(sectId => {
  const p = new PlayerModel();
  p.promoteToCultivator(sectId);
  for (let l = 1; l < 5; l++) p.addExp(p.maxExp); // Lv 5
  
  let wins = 0;
  let totalRounds = 0;
  for (let i = 0; i < 100; i++) {
    const inv = new InventoryManager();
    inv.addItem(ItemModel.createPill('hp', 2));
    inv.addItem(ItemModel.createTalisman('SYM_03', 1));
    const enc = createTunedEncounter(4, 1, 0, p);
    const res = CombatEngine.simulateEncounter(p, enc, inv);
    if (res.isVictory) wins++;
    totalRounds += res.finalRound;
  }
  console.log(`[${sectId}] Lv 5 with Items vs Elite Win Rate: ${wins}%, Avg Rounds: ${(totalRounds/100).toFixed(1)}`);
});
