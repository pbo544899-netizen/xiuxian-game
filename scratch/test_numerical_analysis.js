// test_numerical_analysis.js
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

console.log("=== NUMERICAL ANALYSIS FOR ALL SECTS (Lv 1) ===");

const sects = ['wanjian', 'taiyi', 'yushou', 'tianji', 'fen_tian'];

sects.forEach(sectId => {
  const p = new PlayerModel();
  p.promoteToCultivator(sectId);
  const stats = p.getTotalStats();
  
  let wins = 0;
  let avgRounds = 0;
  for (let i = 0; i < 100; i++) {
    const enc = MonsterConfig.createEncounter(3, 1, 0, p);
    const res = CombatEngine.simulateEncounter(p, enc, null);
    if (res.isVictory) wins++;
    avgRounds += res.finalRound;
  }
  console.log(`[${sectId}] Lv 1 stats: HP=${stats.hp}, ATK=${stats.atk}, DEF=${stats.def}, Power=${p.combatPower} | Win Rate: ${wins}%, Avg Rounds: ${(avgRounds/100).toFixed(1)}`);
});
