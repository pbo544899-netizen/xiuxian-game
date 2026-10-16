// test_unified_trial_evaluation.js
global.window = {
  SlotsRPG: {},
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} }
};
global.localStorage = global.window.localStorage;

require('../src/core/EventBus.js');
require('../src/skills/SkillPipeline.js');
require('../src/rpg/SectConfig.js');
require('../src/skills/SectSkillRegistry.js');
require('../src/slots/GameBalanceConfig.js');
require('../src/slots/PaytableConfig.js');
require('../src/slots/PaylinesConfig.js');
require('../src/slots/FlowController.js');
require('../src/slots/SlotsEngine.js');
require('../src/character/PlayerModel.js');
require('../src/inventory/ItemModel.js');
require('../src/inventory/InventoryManager.js');
require('../src/inventory/EquipSynthesizer.js');
require('../src/rpg/MonsterConfig.js');
require('../src/rpg/BossConfig.js');
require('../src/rpg/CombatEngine.js');
require('../src/bonus/HoldAndSpinEngine.js');
require('../src/cave/CaveManager.js');
require('../src/core/StorageService.js');
require('../src/core/AscensionManager.js');
require('../src/ads/AdService.js');
require('../src/rpg/StoryConfig.js');
require('../src/rpg/StoryManager.js');
require('../src/skills/SkillVisualConfig.js');
require('../src/skills/SkillStateMachine.js');
require('../src/core/GameManager.js');

const gm = window.SlotsRPG.GameManager;
const BossConfig = window.SlotsRPG.BossConfig;

console.log("=== TEST UNIFIED TRIAL COMBAT POWER EVALUATION ===");

// Setup player in Wanjian Sect with 274 combat power at Stage 6 (User's exact situation)
gm.isPrologueComplete = true;
gm.player.promoteToCultivator('wanjian');
// Base at level 1: hp: 100, atk: 20, def: 10
// With wanjian modifiers (atkRate: +0.10, defRate: -0.05):
// We can override player's getTotalStats for the test or equip gear:
gm.player.getTotalStats = () => ({ hp: 500, atk: 70, def: 23 });
// combatPower = 500 * 0.2 + 70 * 2.0 + 23 * 1.5 = 100 + 140 + 34 = 274
gm.sectTrialStage = 6;

// Test 1: Stage 6 evaluation
console.log("\n[Test 1] Testing Stage 6 evaluation (巡山雷豹, reqPower: 430)...");
const info6 = gm.getCurrentTrialStageInfo();
console.log("Stage 6 Info:", {
  stageIndex: info6.stageIndex,
  title: info6.title,
  reqPower: info6.reqPower,
  playerPower: info6.playerPower,
  isPowerReady: info6.isPowerReady
});

console.assert(info6.stageIndex === 6, "Must be stage 6");
console.assert(info6.reqPower === 430, "Stage 6 reqPower must be 430");
console.assert(info6.playerPower === 274, "Player power must be 274");
console.assert(info6.isPowerReady === false, "274 power must NOT be ready for 430 reqPower");

const pct = Math.min(100, Math.max(5, Math.floor((info6.playerPower / info6.reqPower) * 100)));
console.assert(pct === 63, `Percentage must be 63% (got ${pct}%)`);
console.assert(info6.playerPower < info6.reqPower * 0.85, "Must be in danger tier (< 85%)");
console.log("Test 1 PASS: Stage 6 evaluation is 63% and danger (insufficient power)!");

// Test 2: Invalidation of corrupted 168 snapshot
console.log("\n[Test 2] Testing invalidation of corrupted 168 snapshot...");
gm.lockedSectBossSnapshot = {
  sectId: 'wanjian',
  name: '赤炼蟒',
  hp: 600,
  combatPower: 168
};

const boss = BossConfig.getBoss(1, 0, 'wanjian', 1, gm.player, gm.lockedSectBossSnapshot);
console.log("Boss power after recalibration:", boss.combatPower);
console.assert(boss.combatPower >= 1355, `Boss power must be >= 1355 baseline (got ${boss.combatPower})`);
console.log("Test 2 PASS: Premature 168 snapshot discarded, boss power recalibrated to baseline >= 1355!");

// Test 3: Stage 13 Boss evaluation
console.log("\n[Test 3] Testing Stage 13 Boss evaluation...");
gm.sectTrialStage = 13;
gm.hasDefeatedSectBoss = false;
const info13 = gm.getCurrentTrialStageInfo();
console.log("Stage 13 Info:", {
  stageIndex: info13.stageIndex,
  isFinalBoss: info13.isFinalBoss,
  title: info13.title,
  reqPower: info13.reqPower
});
console.assert(info13.isFinalBoss === true, "Stage 13 must be final boss");
console.assert(info13.reqPower >= 1355, "Boss reqPower must be >= 1355");
console.log("Test 3 PASS: Stage 13 properly targets守关妖王with proper power!");

console.log("\nALL UNIFIED TRIAL EVALUATION TESTS PASSED! ✨");
