// test_comprehensive_fix.js
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

const PlayerModel = window.SlotsRPG.PlayerModel;
const MonsterConfig = window.SlotsRPG.MonsterConfig;
const BossConfig = window.SlotsRPG.BossConfig;
const CombatEngine = window.SlotsRPG.CombatEngine;
const InventoryManager = window.SlotsRPG.InventoryManager;
const ItemModel = window.SlotsRPG.ItemModel;

console.log("=== COMPREHENSIVE NUMERICAL FIX TEST ===");

// Check BossConfig fix:
// When potLevel = 1, regardless of sect, boss tier must be Tier 1!
function getFixedBoss(potLevel = 1, defeatStreak = 0, sectId = null, samsaraCount = 1) {
  // potLevel / samsara determines the power tier (1 = 练气, 2 = 筑基初期, etc.)
  const tier = Math.min(5, Math.max(1, potLevel || samsaraCount || 1));
  const raw = BossConfig.BOSS_DEFS[tier] || BossConfig.BOSS_DEFS[1];
  const boss = JSON.parse(JSON.stringify(raw));
  
  // Custom sect theming if requested, but keep tier stats!
  if (sectId && BossConfig.SECT_BOSS_MAP[sectId]) {
    const sectBossIdx = BossConfig.SECT_BOSS_MAP[sectId];
    const sectTemplate = BossConfig.BOSS_DEFS[sectBossIdx];
    if (sectTemplate) {
      boss.name = sectTemplate.name;
      boss.title = `${raw.realm} · ${sectTemplate.name}`;
      boss.avatar = sectTemplate.avatar;
      boss.battleBg = sectTemplate.battleBg;
      boss.skillName = sectTemplate.skillName;
    }
  }

  if (defeatStreak >= 1) {
    const weakFactor = Math.max(0.55, 1 - defeatStreak * 0.15);
    boss.hp = Math.round(boss.hp * weakFactor);
    boss.maxHp = boss.hp;
    boss.atk = Math.round(boss.atk * weakFactor);
    boss.isWeakened = true;
  }

  return boss;
}

const sects = ['wanjian', 'taiyi', 'yushou', 'tianji', 'fen_tian'];

// Test Lv 10 Cultivator vs Fixed Boss for ALL 5 sects:
console.log("\n--- Testing All 5 Sects at Lv 10 vs Fixed PotLevel 1 Boss ---");
sects.forEach(sectId => {
  const p = new PlayerModel();
  p.promoteToCultivator(sectId);
  for (let l = 1; l < 10; l++) p.addExp(p.maxExp);
  p.equip(ItemModel.createEquipment('weapon', 'Q2'));
  p.equip(ItemModel.createEquipment('armor', 'Q2'));
  p.equip(ItemModel.createEquipment('ring', 'Q2'));

  let wins = 0;
  let totalRounds = 0;
  for (let i = 0; i < 100; i++) {
    const inv = new InventoryManager();
    inv.addItem(ItemModel.createPill('hp', 2));
    inv.addItem(ItemModel.createTalisman('SYM_03', 1));
    const boss = getFixedBoss(1, 0, sectId, 1);
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
  console.log(`[${sectId}] Lv 10 vs PotLevel 1 Boss (${getFixedBoss(1,0,sectId,1).name}): Win Rate = ${wins}%, Avg Rounds = ${(totalRounds/100).toFixed(1)}`);
});
