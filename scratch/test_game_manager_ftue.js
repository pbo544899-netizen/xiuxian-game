// test_game_manager_ftue.js
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
require('../src/cave/CaveManager.js');
require('../src/bonus/HoldAndSpinEngine.js');
require('../src/slots/PaytableConfig.js');
require('../src/slots/PaylinesConfig.js');
require('../src/slots/FlowController.js');
require('../src/slots/SlotsEngine.js');
require('../src/ads/AdService.js');
require('../src/core/AscensionManager.js');
require('../src/core/StorageService.js');
require('../src/rpg/StoryConfig.js');
require('../src/slots/GameBalanceConfig.js');
require('../src/core/GameManager.js');

const gm = window.SlotsRPG.GameManager;
gm.init();

console.log("=== SIMULATING GM FTUE SPINS 1 TO 6 ===");
console.log("Initial state: step =", gm.prologueStep, "complete =", gm.isPrologueComplete);

// Prologue battle:
const battleRes = gm.startPrologueBattle();
console.log("Prologue battle victory =", battleRes.isVictory);
gm.prologueStep = 2;

// Awaken:
gm.triggerArtifactAwakening();
console.log("After awaken: step =", gm.prologueStep, "energy =", gm.energy, "prologueSpins =", gm.prologueSpins);

// Spin 1 to 6:
for (let i = 1; i <= 6; i++) {
  console.log(`\n--- Spin ${i} ---`);
  console.log(`Before: energy = ${gm.energy}, prologueSpins = ${gm.prologueSpins}`);
  gm.executeSpin();
  console.log(`After: energy = ${gm.energy}, prologueSpins = ${gm.prologueSpins}, lastBattle = ${gm.currentBattle ? gm.currentBattle.isVictory : 'none'}`);
  if (gm.currentBattle) {
    console.log(`Battle Tier: ${gm.currentBattle.encounter.tier}, Monsters: ${gm.currentBattle.encounter.monsters.map(m=>m.name).join(', ')}, Victory: ${gm.currentBattle.isVictory}`);
  }
}
