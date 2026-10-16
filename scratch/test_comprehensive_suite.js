// test_comprehensive_suite.js
global.window = { SlotsRPG: {} };
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} };

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
require('../src/slots/GameBalanceConfig.js');

const PlayerModel = window.SlotsRPG.PlayerModel;
const MonsterConfig = window.SlotsRPG.MonsterConfig;
const BossConfig = window.SlotsRPG.BossConfig;
const CombatEngine = window.SlotsRPG.CombatEngine;
const InventoryManager = window.SlotsRPG.InventoryManager;
const ItemModel = window.SlotsRPG.ItemModel;
const GameBalanceConfig = window.SlotsRPG.GameBalanceConfig;

let allPassed = true;
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    allPassed = false;
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log("=====================================================================");
console.log("🏆 STARTING COMPREHENSIVE NUMERICAL SUITE VERIFICATION 🏆");
console.log("=====================================================================");

// TEST 1: FTUE Spin 5 Mortal Battle
console.log("\n[TEST 1] FTUE Spin 5 凡人试剑幼兽伏妖战");
const mortal = new PlayerModel();
mortal.setupMortalState();
const ftueCfg = GameBalanceConfig.FTUESequence.scriptedSpins[5].forceBattle;
let mortalWins = 0;
for (let i = 0; i < 50; i++) {
  const enc = MonsterConfig.createEncounter(ftueCfg, 1, 0, mortal);
  const res = CombatEngine.simulateEncounter(mortal, enc, null);
  if (res.isVictory) mortalWins++;
}
assert(mortalWins === 50, `FTUE Spin 5 胜率必须为 100% (当前: ${(mortalWins/50*100)}%)`);

// TEST 2: All 5 Sects at Lv 1 Normal Encounter
console.log("\n[TEST 2] 五大宗门入门新手 (Lv 1) 普通遇妖胜率与回合数");
const sects = ['wanjian', 'taiyi', 'yushou', 'tianji', 'fen_tian'];
sects.forEach(sectId => {
  const p = new PlayerModel();
  p.promoteToCultivator(sectId);
  let wins = 0;
  for (let i = 0; i < 50; i++) {
    const enc = MonsterConfig.createEncounter(3, 1, 0, p);
    const res = CombatEngine.simulateEncounter(p, enc, null);
    if (res.isVictory) wins++;
  }
  assert(wins >= 48, `[${sectId}] Lv 1 胜率达到 96% 以上 (实测: ${(wins/50*100)}%)`);
});

// TEST 3: All 5 Sects at Lv 3 Normal Encounter
console.log("\n[TEST 3] 五大宗门练气三层 (Lv 3) 普通遇妖胜率");
sects.forEach(sectId => {
  const p = new PlayerModel();
  p.promoteToCultivator(sectId);
  p.addExp(p.maxExp);
  p.addExp(p.maxExp); // Lv 3
  let wins = 0;
  for (let i = 0; i < 50; i++) {
    const enc = MonsterConfig.createEncounter(3, 1, 0, p);
    const res = CombatEngine.simulateEncounter(p, enc, null);
    if (res.isVictory) wins++;
  }
  assert(wins >= 47, `[${sectId}] Lv 3 胜率保持 94% 以上 (实测: ${(wins/50*100)}%)`);
});

// TEST 4: All 5 Sects at Lv 10 vs PotLevel 1 Boss
console.log("\n[TEST 4] 五大宗门练气大圆满 (Lv 10) 对决各自关卡妖王 Boss (带常规丹药)");
sects.forEach(sectId => {
  const p = new PlayerModel();
  p.promoteToCultivator(sectId);
  for (let l = 1; l < 10; l++) p.addExp(p.maxExp);
  p.equip(ItemModel.createEquipment('weapon', 'Q2'));
  p.equip(ItemModel.createEquipment('armor', 'Q2'));
  p.equip(ItemModel.createEquipment('ring', 'Q2'));

  let wins = 0;
  let totalRounds = 0;
  for (let i = 0; i < 50; i++) {
    const inv = new InventoryManager();
    inv.addItem(ItemModel.createPill('hp', 2));
    inv.addItem(ItemModel.createTalisman('SYM_03', 1));
    const boss = BossConfig.getBoss(1, 0, sectId, 1);
    const enc = {
      tier: 'boss',
      isBoss: true,
      scatterCount: 5,
      potLevel: 1,
      monsters: [boss],
      totalCount: 1,
      rewards: boss.rewards
    };
    const res = CombatEngine.simulateEncounter(p, enc, inv);
    if (res.isVictory) wins++;
    totalRounds += res.finalRound;
  }
  assert(wins >= 47, `[${sectId}] Lv 10 vs 关卡妖王【${BossConfig.getBoss(1, 0, sectId, 1).name}】胜率 >= 94% (实测: ${(wins/50*100)}%, 平均回合: ${(totalRounds/50).toFixed(1)})`);
});

// TEST 5: Newbie Safety Net Protection Trigger
console.log("\n[TEST 5] 验证新手期天道庇护锁血机制 (Hero Safety Floor)");
const weakMortal = new PlayerModel();
weakMortal.setupMortalState();
// Put weak mortal against a strong monster to force lethal damage
const strongMon = { id: 'strong', name: '致命妖狼', hp: 200, atk: 150, def: 10, currentHp: 200, maxHp: 200 };
const lethalEnc = { tier: 'normal', scatterCount: 3, potLevel: 1, monsters: [strongMon], totalCount: 1, rewards: {} };
const session = CombatEngine.createSession(weakMortal, lethalEnc, null);
session.executeRound('attack');
const gritEvents = session.timeline.filter(e => e.type === 'newbie_protection');
assert(gritEvents.length === 1, `新手遭遇致命伤必须触发 1 次【天道眷顾 · 锁血护脉】`);
assert(session.playerHp > 0, `触发锁血后生命值必须大于 0 (当前: ${session.playerHp})`);

// TEST 6: Defeat Streak DDA Weakening
console.log("\n[TEST 6] 验证全局连败动态降难补偿 (DDA Weakening)");
const normalBoss = BossConfig.getBoss(1, 0, 'wanjian', 1);
const weakenedBoss1 = BossConfig.getBoss(1, 1, 'wanjian', 1);
const weakenedBoss2 = BossConfig.getBoss(1, 2, 'wanjian', 1);
assert(weakenedBoss1.hp < normalBoss.hp, `1连败后 Boss HP 必须下调 (初始: ${normalBoss.hp} -> 1连败: ${weakenedBoss1.hp})`);
assert(weakenedBoss2.hp < weakenedBoss1.hp, `2连败后 Boss HP 进一步下调 (2连败: ${weakenedBoss2.hp})`);

console.log("\n=====================================================================");
if (allPassed) {
  console.log("🎉 ALL NUMERICAL & COMBAT FLOW TESTS PASSED 100%! 🎉");
} else {
  console.log("❌ SOME TESTS FAILED! CHECK OUTPUT ABOVE.");
}
console.log("=====================================================================");
