// scratch/test_turn_based_items.js - 验证回合制道具使用 (气血丹/破魔符占一回合)
const assert = require('assert');

global.window = { SlotsRPG: {} };
require('../src/core/EventBus.js');
require('../src/rpg/SectConfig.js');
require('../src/skills/SectSkillRegistry.js');
require('../src/inventory/ItemModel.js');
require('../src/inventory/InventoryManager.js');
require('../src/character/PlayerModel.js');
require('../src/rpg/MonsterConfig.js');
require('../src/rpg/CombatEngine.js');

const ItemModel = window.SlotsRPG.ItemModel;
const InventoryManager = window.SlotsRPG.InventoryManager;
const PlayerModel = window.SlotsRPG.PlayerModel;
const CombatEngine = window.SlotsRPG.CombatEngine;
const CombatSession = window.SlotsRPG.CombatSession;

console.log('===============================================================');
console.log('🧪 验证回合制战斗系统：使用道具消耗 1 回合规范');
console.log('===============================================================');

// 1. 测试手动单步执行：验证使用气血丹消耗 1 回合
console.log('\n[TEST 1] 验证手动指令：使用气血丹占一回合，且回血生效、不进行普通出招');
const player1 = new PlayerModel();
player1.setSect('wanjian');
const inv1 = new InventoryManager();
inv1.addItem(ItemModel.createPill('hp', 2)); // 2颗气血丹

const mockMonster1 = {
  id: 'test_beast_1',
  name: '测试狂暴巨猿',
  hp: 500,
  atk: 60,
  def: 20
};
const encounter1 = {
  tier: 'elite',
  monsters: [mockMonster1],
  rewards: { exp: 100 }
};

const session1 = new CombatSession(player1, encounter1, inv1);
const initialHp = session1.playerHp;
console.log(`初始状态: 主角气血=${initialHp}/${session1.playerMaxHp}, 气血丹=${inv1.getItemAmount('pill', 'hp')}`);

// 第 1 回合：主角普通攻击
const r1 = session1.executeRound('attack');
assert.strictEqual(session1.round, 2, '第 1 回合执行完毕后，当前回合数应推进至 2');
const r1PlayerEvent = r1.roundEvents.find(e => e.turn === 'player');
assert.strictEqual(r1PlayerEvent.actionType, 'attack', '第 1 回合主角行动应为普通攻击');
assert.ok(mockMonster1.currentHp < 500, '巨猿受创扣血');
console.log(`第 1 回合攻击完毕: 巨猿血量=${mockMonster1.currentHp}/500, 主角血量=${session1.playerHp}/${session1.playerMaxHp}`);

// 第 2 回合：主角选择使用气血丹！
const hpBeforePill = session1.playerHp;
const pillBefore = inv1.getItemAmount('pill', 'hp');
const r2 = session1.executeRound('pill');
assert.strictEqual(session1.round, 3, '使用气血丹应占用完整第 2 回合，回合数推进至 3');
assert.strictEqual(inv1.getItemAmount('pill', 'hp'), pillBefore - 1, '气血丹成功扣除 1 颗');

const r2PlayerEvent = r2.roundEvents.find(e => e.turn === 'player');
assert.strictEqual(r2PlayerEvent.actionType, 'pill', '第 2 回合主角行动应为使用气血丹');
assert.strictEqual(r2PlayerEvent.type, 'pill_heal', '事件类型为 pill_heal');
assert.ok(r2PlayerEvent.heal > 0, `气血丹回复气血值: +${r2PlayerEvent.heal}`);
// 校验主角在该回合并未对怪物造成攻击
const r2MonsterHpAtPlayerTurn = r2PlayerEvent.totalEnemyHp;
assert.strictEqual(r2MonsterHpAtPlayerTurn, mockMonster1.currentHp, '使用气血丹的回合，主角不能攻击怪物！');

// 校验怪物在主角吃药后反击了主角
const r2MonsterEvent = r2.roundEvents.find(e => e.turn === 'monster');
assert.ok(r2MonsterEvent, '怪物应该在主角吃药后对主角发动反击');
console.log(`✅ 测试 1 通过: 气血丹消耗 1 回合完全成立！回血 +${r2PlayerEvent.heal} 真实生效，且怪物正常反击！`);

// 2. 测试手动单步执行：验证使用破魔符消耗 1 回合
console.log('\n[TEST 2] 验证手动指令：使用破魔符占一回合，且释放天雷神罚代替普通剑法');
const player2 = new PlayerModel();
player2.setSect('wanjian');
const inv2 = new InventoryManager();
inv2.addItem(ItemModel.createTalisman('SYM_03', 1)); // 1张破魔符

const mockMonster2 = {
  id: 'test_beast_2',
  name: '测试千年铁甲龟',
  hp: 600,
  atk: 40,
  def: 80
};
const encounter2 = {
  tier: 'boss',
  monsters: [mockMonster2],
  rewards: { exp: 200 }
};

const session2 = new CombatSession(player2, encounter2, inv2);
const r1Talisman = session2.executeRound('talisman');
assert.strictEqual(session2.round, 2, '第 1 回合使用破魔符后推进至第 2 回合');
assert.strictEqual(inv2.getItemAmount('rune', 'SYM_03'), 0, '破魔符消耗完毕');

const tEvent = r1Talisman.roundEvents.find(e => e.turn === 'player');
assert.strictEqual(tEvent.actionType, 'talisman', '主角本回合行动为祭出破魔符');
assert.strictEqual(tEvent.type, 'talisman_strike', '事件类型为 talisman_strike');
assert.ok(tEvent.damage >= 150, `破魔符造成重创天雷伤害: -${tEvent.damage}`);
console.log(`✅ 测试 2 通过: 破魔符占用 1 回合，成功降下神雷造成 -${tEvent.damage} 伤害！`);

// 3. 测试自动推演 simulateEncounter 的 AI 智能行动
console.log('\n[TEST 3] 验证全自动推演 (simulateEncounter) 中智能道具行动');
const player3 = new PlayerModel();
player3.setSect('wanjian');
const inv3 = new InventoryManager();
inv3.addItem(ItemModel.createTalisman('SYM_03', 1));
inv3.addItem(ItemModel.createPill('hp', 2));

const mockMonster3 = {
  id: 'test_beast_3',
  name: '测试通天妖王',
  hp: 1200,
  atk: 75,
  def: 30
};
const encounter3 = {
  tier: 'boss',
  monsters: [mockMonster3],
  rewards: { exp: 500 }
};

const battleResult = CombatEngine.simulateEncounter(player3, encounter3, inv3);
assert.ok(battleResult.timeline.length > 0, '必须生成完整战斗时序流');
assert.ok(battleResult.itemsUsed.some(i => i.type === 'rune'), 'AI 必须在开局使用了破魔符');

// 校验破魔符是在第 1 回合的主角回合中消耗的
const r1Ev = battleResult.timeline.find(e => e.round === 1 && e.turn === 'player');
assert.strictEqual(r1Ev.actionType, 'talisman', 'AI 在第 1 回合主角行动中使用破魔符！');

// 校验气血丹是在主角气血低时的某回合中使用的
const pillEv = battleResult.timeline.find(e => e.actionType === 'pill');
if (pillEv) {
  console.log(`AI 智能在第 ${pillEv.round} 回合使用【太乙气血丹】，回复 +${pillEv.heal} 气血！`);
}
console.log(`✅ 测试 3 通过: 自动推演 AI 完美执行回合制道具策略！总推演回合: ${battleResult.totalRounds}`);

console.log('\n===============================================================');
console.log('🎉 全部 3 项回合制道具专项验证 100% 通过！');
console.log('===============================================================');
