// debug_boss_timeline.js
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

const p = new window.SlotsRPG.PlayerModel();
p.promoteToCultivator('fen_tian');
for (let l = 1; l < 10; l++) p.addExp(p.maxExp);
p.equip(window.SlotsRPG.ItemModel.createEquipment('weapon', 'Q2'));
p.equip(window.SlotsRPG.ItemModel.createEquipment('armor', 'Q2'));
p.equip(window.SlotsRPG.ItemModel.createEquipment('ring', 'Q2'));

const inv = new window.SlotsRPG.InventoryManager();
inv.addItem(window.SlotsRPG.ItemModel.createPill('hp', 3));
inv.addItem(window.SlotsRPG.ItemModel.createTalisman('SYM_03', 1));

const boss = window.SlotsRPG.BossConfig.getBoss(1, 0, 'fen_tian', 1);
console.log("Boss stats for fen_tian:", boss);
const enc = { tier: 'boss', isBoss: true, scatterCount: 5, potLevel: 1, monsters: [boss], totalCount: 1, rewards: boss.rewards };

const res = window.SlotsRPG.CombatEngine.simulateEncounter(p, enc, inv);
console.log("\nVictory:", res.isVictory, "Rounds:", res.finalRound);
res.timeline.forEach(e => console.log(e.text));
