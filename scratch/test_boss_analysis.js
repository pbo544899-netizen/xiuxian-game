// test_boss_analysis.js
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
const BossConfig = window.SlotsRPG.BossConfig;
const CombatEngine = window.SlotsRPG.CombatEngine;
const InventoryManager = window.SlotsRPG.InventoryManager;
const ItemModel = window.SlotsRPG.ItemModel;

console.log("=== LEVEL 10 CULTIVATOR VS BOSS 1 (赤炼蟒) ===");

const sects = ['wanjian', 'taiyi', 'yushou', 'tianji', 'fen_tian'];

sects.forEach(sectId => {
  const p = new PlayerModel();
  p.promoteToCultivator(sectId);
  // Level up to 10
  for (let l = 1; l < 10; l++) {
    p.addExp(p.maxExp);
  }

  // Equip Q2 gear (expected by Lv 10)
  p.equip(ItemModel.createEquipment('weapon', 'Q2'));
  p.equip(ItemModel.createEquipment('armor', 'Q2'));
  p.equip(ItemModel.createEquipment('ring', 'Q2'));

  const stats = p.getTotalStats();

  // Test with inventory (3 pills, 1 talisman)
  let wins = 0;
  let totalRounds = 0;
  for (let i = 0; i < 100; i++) {
    const inv = new InventoryManager();
    inv.addItem(ItemModel.createPill('hp', 3));
    inv.addItem(ItemModel.createTalisman('SYM_03', 1));
    const boss = BossConfig.getBoss(1, 0, sectId, 1);
    const encounter = {
      tier: 'boss',
      isBoss: true,
      scatterCount: 5,
      potLevel: 1,
      monsters: [boss],
      totalCount: 1,
      rewards: boss.rewards
    };
    const res = CombatEngine.simulateEncounter(p, encounter, inv);
    if (res.isVictory) wins++;
    totalRounds += res.finalRound;
  }
  console.log(`[${sectId}] Lv 10 vs Boss 1 (赤炼蟒): HP=${stats.hp}, ATK=${stats.atk}, DEF=${stats.def}, Power=${p.combatPower} | Win Rate: ${wins}%, Avg Rounds: ${(totalRounds/100).toFixed(1)}`);
});
