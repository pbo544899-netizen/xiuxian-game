// scratch/test_bet_multiplier_rewards.js - 验证消耗倍数(如200消耗/8倍)下击败怪物的经验、机缘及丹药奖励同比例放大
const assert = require('assert');

// 模拟浏览器全局环境
global.window = {
  SlotsRPG: {}
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

// 加载核心依赖模块
require('../src/core/EventBus.js');
require('../src/skills/SkillPipeline.js');
require('../src/rpg/SectConfig.js');
require('../src/skills/SectSkillRegistry.js');
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
require('../src/core/GameManager.js');

const MonsterConfig = window.SlotsRPG.MonsterConfig;
const SlotsEngine = window.SlotsRPG.SlotsEngine;
const GameManager = window.SlotsRPG.GameManager;

console.log('===============================================================');
console.log('🧪 开始测试: 抽奖消耗倍数(betMultiplier)与战斗击杀奖励同比例放大机制');
console.log('===============================================================');

// TEST 1: SlotsEngine 评估结果在多倍投放下生成携带 betMultiplier 的 battleConfig
console.log('\n[TEST 1] SlotsEngine 在 200 消耗(8倍)下触发战斗，battleConfig 正确携带 betMultiplier');
const engine = new SlotsEngine();
// 构造一个全盘含有 5 个 SYM_12 (Scatter) 的网格
const grid5Scatter = [
  ['SYM_12', 'SYM_12', 'SYM_12', 'SYM_01', 'SYM_02'],
  ['SYM_12', 'SYM_12', 'SYM_03', 'SYM_04', 'SYM_05'],
  ['SYM_01', 'SYM_02', 'SYM_03', 'SYM_04', 'SYM_05']
];
const evalResult = engine.evaluateGrid(grid5Scatter, 8);
assert.strictEqual(evalResult.hasTriggeredBattle, true, '应触发战斗');
assert.strictEqual(evalResult.scatterCount, 5, '应该有 5 个 Scatter');
assert.ok(evalResult.battleConfig, 'battleConfig 应该存在');
assert.strictEqual(evalResult.battleConfig.tier, 'boss', '应该是 Boss 战');
assert.strictEqual(evalResult.battleConfig.betMultiplier, 8, 'battleConfig.betMultiplier 必须为 8');
console.log('✅ TEST 1 通过: battleConfig 正确携带 8 倍倍率参数');

// TEST 2: MonsterConfig 在 1 倍(基准25消耗)与 8 倍(200消耗)下生成 Boss 战奖励对比
console.log('\n[TEST 2] 验证 Boss 战奖励在 8 倍消耗下的乘倍效果 (基准 vs 8倍)');
// 1倍基准
const enc1x = MonsterConfig.createEncounter({ tier: 'boss', scatterCount: 5, betMultiplier: 1 }, 1, 0);
console.log('1 倍基准奖励:', {
  exp: enc1x.rewards.exp,
  energy: enc1x.rewards.energy,
  pillAmount: enc1x.rewards.rewardPill ? enc1x.rewards.rewardPill.amount : 0
});
assert.strictEqual(enc1x.rewards.exp, 800, '1倍下赤炼蟒经验应为 800');
assert.strictEqual(enc1x.rewards.energy, 800, '1倍下赤炼蟒机缘应为 800');
assert.strictEqual(enc1x.rewards.rewardPill.amount, 8, '1倍下修为丹应为 8 颗');

// 8倍 (200消耗)
const enc8x = MonsterConfig.createEncounter({ tier: 'boss', scatterCount: 5, betMultiplier: 8 }, 1, 0);
console.log('8 倍(200消耗)奖励:', {
  exp: enc8x.rewards.exp,
  energy: enc8x.rewards.energy,
  pillAmount: enc8x.rewards.rewardPill ? enc8x.rewards.rewardPill.amount : 0
});
assert.strictEqual(enc8x.rewards.exp, 6400, '8倍下赤炼蟒经验应为 800 * 8 = 6400');
assert.strictEqual(enc8x.rewards.energy, 6400, '8倍下赤炼蟒机缘应为 800 * 8 = 6400');
assert.strictEqual(enc8x.rewards.rewardPill.amount, 64, '8倍下修为丹应为 8 * 8 = 64 颗');
assert.strictEqual(enc8x.monsters[0].rewards.exp, 6400, 'boss.rewards.exp 也必须同步为 6400');
assert.strictEqual(enc8x.monsters[0].rewards.energy, 6400, 'boss.rewards.energy 也必须同步为 6400');
assert.strictEqual(enc8x.monsters[0].rewards.rewardPill.amount, 64, 'boss.rewards.rewardPill.amount 也必须同步为 64 颗');
console.log('✅ TEST 2 通过: Boss 击杀奖励完美同比例放大 8 倍 (4800修为经验, 4800机缘, 40颗修为丹)');

// TEST 3: 精英怪与普通怪遭遇战奖励乘倍
console.log('\n[TEST 3] 验证精英大妖与普通群怪遭遇战在 8 倍消耗下的乘倍效果');
const encElite8x = MonsterConfig.createEncounter({ tier: 'elite', count: 2, betMultiplier: 8 }, 1, 0);
console.log('8 倍精英战奖励:', {
  exp: encElite8x.rewards.exp,
  energy: encElite8x.rewards.energy,
  pillAmount: encElite8x.rewards.rewardPill.amount
});
// 验证是 8 的整倍数
assert.strictEqual(encElite8x.rewards.exp % 8, 0, '精英怪经验总和必须是 8 的整倍数');
assert.strictEqual(encElite8x.rewards.energy % 8, 0, '精英怪机缘总和必须是 8 的整倍数');
assert.strictEqual(encElite8x.rewards.rewardPill.amount % 8, 0, '精英怪丹药数量必须是 8 的整倍数');

const encNormal8x = MonsterConfig.createEncounter({ tier: 'normal', count: 3, betMultiplier: 8 }, 1, 0);
console.log('8 倍普通怪战奖励:', {
  exp: encNormal8x.rewards.exp,
  energy: encNormal8x.rewards.energy,
  pillAmount: encNormal8x.rewards.rewardPill.amount
});
assert.strictEqual(encNormal8x.rewards.exp % 8, 0, '普通群怪经验总和必须是 8 的整倍数');
assert.strictEqual(encNormal8x.rewards.energy % 8, 0, '普通群怪机缘总和必须是 8 的整倍数');
assert.strictEqual(encNormal8x.rewards.rewardPill.amount, 8, '普通群怪基础丹药 1 * 8 = 8 颗');
console.log('✅ TEST 3 通过: 精英与普通群怪遭遇战奖励均随 8 倍倍率同比例放大');

// TEST 4: GameManager 全链路结算发放测试
console.log('\n[TEST 4] 验证 GameManager 设定 currentBet = 200 时，打死 Boss 获得的背包丹药和修为、机缘实际入账');
const gm = GameManager;

// 设定投注为 200
gm.currentBet = 200;
assert.strictEqual(gm.betMultiplier, 8, 'currentBet 为 200 时 betMultiplier 必须是 8');

// 记录玩家初始状态
const initialEnergy = gm.energy;

// 触发 Boss 遭遇战
const battleResult = gm.startBossBattle({ tier: 'boss', count: 1, scatterCount: 5, betMultiplier: gm.betMultiplier });
assert.ok(battleResult.rewards, 'battleResult 必须包含 rewards');
assert.strictEqual(battleResult.rewards.exp, 6400, '战斗结果中的经验奖励必须是 6400');
assert.strictEqual(battleResult.rewards.energy, 6400, '战斗结果中的机缘奖励必须是 6400');
assert.strictEqual(battleResult.rewards.rewardPill.amount, 64, '战斗结果中的丹药必须是 64 颗');

// 模拟获胜并领奖 (claimBattleRewards)
battleResult.isVictory = true;
const summary = gm.claimBattleRewards(battleResult);

assert.strictEqual(summary.expGained, 6400, '结算摘要经验应为 6400');
assert.strictEqual(summary.energyGained, 6400, '结算摘要机缘应为 6400');
assert.strictEqual(gm.energy, initialEnergy + 6400, '游戏管理器中机缘增加量应为 6400');

// 检查背包里的丹药数量
const expPill = gm.inventory.slots.find(i => i && i.subType === 'exp');
assert.ok(expPill, '背包里应有九转修为丹');
assert.strictEqual(expPill.amount, 64, '背包中九转修为丹数量应为 64 颗');
console.log(`背包丹药: 【${expPill.name}】 x${expPill.amount}`);

console.log('✅ TEST 4 通过: GameManager 胜利结算全链路数值入库验证完美通过！');

console.log('\n🎉 所有测试均 100% 通过！倍率机制完全符合玩家预期！');
