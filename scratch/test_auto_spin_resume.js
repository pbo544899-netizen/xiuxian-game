// test_auto_spin_resume.js
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
gm.energy = 500;
gm.currentBet = 25;

// Test 1: suspendAutoSpinForBattle sets wasAutoSpinningBeforeBattle and clears isAutoSpinning
console.log("\n[Test 1] Starting auto spin and suspending for battle...");
gm.isAutoSpinning = true;
gm.suspendAutoSpinForBattle();
console.assert(gm.isAutoSpinning === false, "isAutoSpinning must be false during battle");
console.assert(gm.wasAutoSpinningBeforeBattle === true, "wasAutoSpinningBeforeBattle must be true");
console.log("Test 1 PASS: Auto-spin properly suspended!");

// Test 2: resumeAutoSpinAfterBattle restores auto spin if energy is sufficient
console.log("\n[Test 2] Resuming auto spin after battle with sufficient energy...");
const resumed = gm.resumeAutoSpinAfterBattle();
console.assert(resumed === true, "resumeAutoSpinAfterBattle should return true");
console.assert(gm.isAutoSpinning === true, "isAutoSpinning should be restored to true");
console.assert(gm.wasAutoSpinningBeforeBattle === false, "wasAutoSpinningBeforeBattle should be reset to false");
console.assert(gm.autoSpinTimer !== null, "autoSpinTimer should be scheduled");
console.log("Test 2 PASS: Auto-spin properly resumed!");

// Clear timer
gm.stopAutoSpin();

// Test 3: Manual stopAutoSpin clears wasAutoSpinningBeforeBattle
console.log("\n[Test 3] Verifying manual stop clears resumption flag...");
gm.isAutoSpinning = true;
gm.suspendAutoSpinForBattle();
gm.stopAutoSpin(); // player clicks stop
console.assert(gm.wasAutoSpinningBeforeBattle === false, "wasAutoSpinningBeforeBattle must be cleared on manual stop");
const noResume = gm.resumeAutoSpinAfterBattle();
console.assert(noResume === false, "Should not resume after manual stop");
console.assert(gm.isAutoSpinning === false, "isAutoSpinning must remain false");
console.log("Test 3 PASS: Manual stop prevents unwanted resumption!");

// Test 4: Energy depleted graceful stop on resume
console.log("\n[Test 4] Resuming with zero energy...");
gm.energy = 10; // Less than minimum tier 25
gm.isAutoSpinning = true;
gm.suspendAutoSpinForBattle();
let energyDepletedFired = false;
window.SlotsRPG.EventBus.on('ENERGY_DEPLETED', () => { energyDepletedFired = true; });
const lowEnergyResumed = gm.resumeAutoSpinAfterBattle();
console.assert(lowEnergyResumed === false, "Should not resume when energy is depleted");
console.assert(gm.isAutoSpinning === false, "isAutoSpinning must be false when energy depleted");
console.assert(energyDepletedFired === true, "ENERGY_DEPLETED event should fire");
console.log("Test 4 PASS: Graceful energy exhaustion stop!");

// Test 5: Verify executeSpin battle trigger suspends auto spin
console.log("\n[Test 5] Simulating executeSpin with battle scatter trigger...");
gm.isPrologueComplete = true;
gm.energy = 500;
gm.isAutoSpinning = true;
// Mock slotsEngine.spin to trigger battle
gm.slotsEngine = {
  spin: () => ({
    grid: [['SYM_08','SYM_08','SYM_08'],['SYM_08','SYM_08','SYM_08'],['SYM_08','SYM_08','SYM_08']],
    evaluation: {
      hasTriggeredBattle: true,
      scatterCount: 3,
      battleConfig: { tier: 'normal', count: 3 },
      totalPayout: 0,
      itemsWon: []
    }
  }),
  evaluateGrid: () => ({})
};
gm.renderer = null;

let battleEventTriggered = false;
window.SlotsRPG.EventBus.on('TRIGGER_BATTLE', () => { battleEventTriggered = true; });

gm.executeSpin();

console.assert(battleEventTriggered === true, "TRIGGER_BATTLE event should fire");
console.assert(gm.isAutoSpinning === false, "isAutoSpinning must be suspended");
console.assert(gm.wasAutoSpinningBeforeBattle === true, "wasAutoSpinningBeforeBattle must be preserved by executeSpin");
console.log("Test 5 PASS: executeSpin properly suspends auto-spin without destroying resumption intent!");

console.log("\nALL AUTO-SPIN RESUME TESTS PASSED SUCCESSFULLY! ✨");
