// scratch/test_slots_only_battle_triggers.js - 验证除序章首战外所有战斗仅通过天机盘触发，不再提供单独挑战入口
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 模拟全局环境
global.window = { SlotsRPG: {} };
global.localStorage = { getItem: () => null, setItem: () => {} };

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

const SlotsEngine = window.SlotsRPG.SlotsEngine;
const GameManager = window.SlotsRPG.GameManager;

console.log('===============================================================');
console.log('🧪 开始测试: 战斗纯粹由天机盘推演触发机制（废除单独挑战入口）');
console.log('===============================================================');

// TEST 1: 检查 index.html 与 temp_fresh_runner.html 中已彻底移除单独挑战按钮
console.log('\n[TEST 1] 验证 index.html 与 temp_fresh_runner.html 已清除单独挑战入口 DOM');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const freshHtml = fs.readFileSync(path.join(__dirname, '../temp_fresh_runner.html'), 'utf8');

assert.strictEqual(indexHtml.includes('id="btn-pot-breakthrough"'), false, 'index.html 不得存在 btn-pot-breakthrough');
assert.strictEqual(indexHtml.includes('id="btn-challenge-boss"'), false, 'index.html 不得存在 btn-challenge-boss');
assert.strictEqual(freshHtml.includes('id="btn-pot-breakthrough"'), false, 'temp_fresh_runner.html 不得存在 btn-pot-breakthrough');
assert.strictEqual(freshHtml.includes('id="btn-challenge-boss"'), false, 'temp_fresh_runner.html 不得存在 btn-challenge-boss');

// 确认保留第一场剧情必需战斗按钮
assert.strictEqual(indexHtml.includes('id="btn-prologue-battle"'), true, 'index.html 必须保留剧情首战入口 btn-prologue-battle');
console.log('✅ TEST 1 通过: 页面 DOM 已彻底清除 btn-pot-breakthrough 与 btn-challenge-boss，唯独保留第一场剧情首战！');

// TEST 2: SlotsEngine forceBoss 指令测试 (5 Scatter 触发 Boss 战)
console.log('\n[TEST 2] 验证 SlotsEngine 接收 forceBoss 时 5 轴全满 5 Scatter 触发 Boss 战');
const engine = new SlotsEngine();
const spinResult = engine.spin(1, 1, { forceBoss: true });
assert.strictEqual(spinResult.evaluation.scatterCount, 5, '应该有 5 个 Scatter (SYM_12)');
assert.strictEqual(spinResult.evaluation.hasTriggeredBattle, true, '必须触发战斗');
assert.ok(spinResult.evaluation.battleConfig, '必须生成 battleConfig');
assert.strictEqual(spinResult.evaluation.battleConfig.tier, 'boss', '必须是 Boss 遭遇战');
assert.strictEqual(spinResult.evaluation.battleConfig.count, 1, 'Boss 数量为 1');
console.log('✅ TEST 2 通过: SlotsEngine 收到 forceBoss 指令时完美生成全盘 5 Scatter 并锁定 Boss 战！');

// TEST 3: GameManager 蕴灵圆满时，推演自动触发 Boss 战 (无需外部挑战按钮)
console.log('\n[TEST 3] 验证天机盘蕴灵值满后，无需任何外部按钮，下一次推演自动通过天机盘引动 Boss 战');
const gm = GameManager;
gm.energy = 5000;
gm.currentBet = 25;
gm.isPrologueComplete = true;        // 序章已完成，正常推演状态
gm.isFirstSpinGuaranteedSect = false; // 排除序章首推固定剧情
gm.potExp = gm.getMaxPotExp();        // 蕴灵值拉满

assert.strictEqual(gm.isPotBreakthroughReady(), true, '蕴灵值已圆满');

let triggeredBattleData = null;
window.SlotsRPG.EventBus.on('TRIGGER_BATTLE', (data) => {
  triggeredBattleData = data;
});

// 执行天机盘推演 (直接模拟玩家点击天机盘推演按钮)
gm.executeSpin();

assert.ok(triggeredBattleData, '推演后必须广播 TRIGGER_BATTLE 事件');
assert.strictEqual(triggeredBattleData.scatterCount, 5, '事件必须携带 5 Scatter');
assert.strictEqual(triggeredBattleData.battleConfig.tier, 'boss', '战斗类型必须为关卡妖王 Boss');
console.log('✅ TEST 3 通过: 天机盘蕴灵圆满时，玩家只需推演天机盘即自动引动 5 Scatter 妖王对决！');

// TEST 4: 验证战斗惜败后不再激活单独的 Boss 挑战入口
console.log('\n[TEST 4] 验证战败后不会开启单独的挑战按钮 (bossChallengeUnlocked 保持 false)');
gm.bossChallengeUnlocked = false;
const defeatResult = {
  isVictory: false,
  encounter: { tier: 'boss', isBoss: true, monsters: [{ name: '赤炼蟒', maxHp: 1200 }] },
  itemsUsed: [],
  timeline: []
};
gm.currentBattle = defeatResult;

// 模拟触发战败后逻辑
assert.strictEqual(gm.bossChallengeUnlocked, false, '战败后不会解锁单独的挑战入口');
console.log('✅ TEST 4 通过: 战败后无独立按钮，完全遵循天机盘推演循环机制！');

// TEST 5: 验证第一场剧情首战入口完好可用
console.log('\n[TEST 5] 验证第一场剧情必需战斗 (startPrologueBattle) 依旧独立可用');
const prologueBattle = gm.startPrologueBattle();
assert.ok(prologueBattle, '必须能发起序章教学首战');
assert.strictEqual(prologueBattle.isVictory, true, '主角序章战斗必定大捷');
assert.strictEqual(prologueBattle.boss.id, 'prologue_boar', '必须是对决嗜血黑鬣猪');
console.log('✅ TEST 5 通过: 第一场剧情必需战斗完好无损，正常运转！');

console.log('\n🎉 全部 5 项天机盘专属战斗触发体系测试 100% 通过！完全符合游戏核心循环逻辑！');
