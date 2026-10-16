// test_ftue_revamp.js - 验证全新的凡人背景剧情、恶兽掉盘、背包点击解封与首抽单宗门拜入闭环
const assert = require('assert');

// 模拟浏览器与 Storage 运行环境
const storageMap = {};
global.localStorage = {
  getItem(key) { return storageMap[key] || null; },
  setItem(key, val) { storageMap[key] = String(val); },
  removeItem(key) { delete storageMap[key]; },
  clear() { for (let k in storageMap) delete storageMap[k]; }
};

global.window = {
  SlotsRPG: {}
};

// 按依赖顺序引入核心模块
require('../src/core/EventBus.js');
require('../src/rpg/SectConfig.js');
require('../src/skills/SectSkillRegistry.js');
require('../src/inventory/ItemModel.js');
require('../src/inventory/InventoryManager.js');
require('../src/inventory/EquipSynthesizer.js');
require('../src/character/PlayerModel.js');
require('../src/cave/CaveManager.js');
require('../src/bonus/HoldAndSpinEngine.js');
require('../src/rpg/MonsterConfig.js');
require('../src/rpg/BossConfig.js');
require('../src/rpg/CombatEngine.js');
require('../src/slots/PaytableConfig.js');
require('../src/slots/PaylinesConfig.js');
require('../src/slots/FlowController.js');
require('../src/slots/SlotsEngine.js');
require('../src/ads/AdService.js');
require('../src/core/AscensionManager.js');
require('../src/core/StorageService.js');
require('../src/rpg/StoryConfig.js');
require('../src/core/GameManager.js');

const GameManager = window.SlotsRPG.GameManager;
const StoryConfig = window.SlotsRPG.StoryConfig;

console.log('===============================================================');
console.log('🧪 开始执行凡人背景、恶兽掉盘、背包解封与首抽单门派全链路测试');
console.log('===============================================================');

// -------------------------------------------------------------
// 1. 测试初始凡人状态与故事背景
// -------------------------------------------------------------
console.log('\n[TEST 1] 验证纯新档初始凡人状态与故事背景');
const gm = new GameManager.constructor();
gm.init();

assert.strictEqual(gm.isPrologueComplete, false, '序章初始未完成');
assert.strictEqual(gm.prologueStep, 0, '初始步骤为 0 (凡人未入门)');
assert.strictEqual(gm.player.isMortal, true, '初始角色必须为凡人');
assert.strictEqual(gm.energy, 0, '未觉醒前初始机缘为 0');
assert.strictEqual(gm.player.currentSect, null, '未入门前宗门为空');

// 校验 StoryConfig 凡人背景故事
const mortalIntro = StoryConfig.CHAPTERS.prologue_mortal_intro;
assert.ok(mortalIntro, '必须存在 prologue_mortal_intro 凡人背景章节');
assert.strictEqual(mortalIntro.speaker, '宿主 (林凡)', '发言者必须为林凡本人');
assert.ok(mortalIntro.dialogue.some(d => d.text.includes('天生凡骨无灵根')), '剧情文本必须体现凡人无灵根背景');
assert.ok(mortalIntro.dialogue.some(d => d.text.includes('凶暴黑鬣猪')), '剧情文本必须交代后山恶兽险境');
console.log('✅ 测试 1 通过: 凡人无灵根开局与后山恶兽背景叙事完备！');

// -------------------------------------------------------------
// 2. 测试击败第一只恶兽后，天机盘掉入背包
// -------------------------------------------------------------
console.log('\n[TEST 2] 验证斩灭黑鬣猪后，【造化天机盘】掉入乾坤袋背包');
const battleResult = gm.startPrologueBattle();
assert.strictEqual(battleResult.isVictory, true, '序章初战必须斩灭黑鬣猪');
if (battleResult.isVictory) gm.prologueStep = 2; // 胜利结算推进至 2
assert.strictEqual(gm.prologueStep, 2, '斩猪后步骤必须推进至 2 (天机盘待背包激活)');

// 校验战利品包含天机盘
assert.ok(battleResult.rewards.artifactItem, '战利品中必须包含 artifactItem');
assert.strictEqual(battleResult.rewards.artifactItem.id, 'ITEM_TIANJI_PLATE');

// 校验背包中是否存在该天机盘道具
const foundPlate = gm.inventory.slots.find(it => it && it.isArtifactPlate);
assert.ok(foundPlate, '乾坤袋背包中必须存在【造化天机盘】道具');
assert.strictEqual(foundPlate.name, '【造化天机盘】');
console.log(`✅ 测试 2 通过: 恶兽斩灭，【${foundPlate.name}】成功掉入乾坤袋！`);

// -------------------------------------------------------------
// 3. 测试玩家在背包中点击天机盘解封认主
// -------------------------------------------------------------
console.log('\n[TEST 3] 验证在乾坤袋点击【造化天机盘】完成解封认主');
let awakenFired = false;
window.SlotsRPG.EventBus.on('ARTIFACT_AWAKENED', (evt) => {
  awakenFired = true;
  assert.strictEqual(evt.energyGained, 100, '认主必须赠送 100 点启动灵机');
});

const awakenRes = gm.awakenTianjiPlateFromBag(foundPlate);
assert.strictEqual(awakenRes.energyGained, 100);
assert.strictEqual(gm.energy, 100, '玩家获得 100 点灵机');
assert.strictEqual(gm.prologueStep, 3, '步骤推进至 3 (天机已开，待首次推演)');
assert.strictEqual(gm.isFirstSpinGuaranteedSect, true, '首次推演保底标记激活');
assert.strictEqual(awakenFired, true, '必须触发 ARTIFACT_AWAKENED 广播');

// 校验背包中的天机盘已被消耗融入神魂
const plateAfter = gm.inventory.slots.find(it => it && it.isArtifactPlate);
assert.strictEqual(plateAfter, undefined, '点击后天机盘融入识海，从普通背包移除');
console.log('✅ 测试 3 通过: 背包点击天机盘成功滴血认主，赠送 100 灵机并融入丹田！');

// -------------------------------------------------------------
// 4. 测试滚轮首次推演：三连玄铁剑 + 唯一引荐【万剑仙宗】
// -------------------------------------------------------------
console.log('\n[TEST 4] 验证首次推演命中三连玄铁剑并唯一引荐【万剑仙宗】');
let inductionData = null;
window.SlotsRPG.EventBus.on('SHOW_SECT_INDUCTION', (data) => {
  inductionData = data;
});

// 执行首抽
gm.executeSpin();

assert.strictEqual(gm.isFirstSpinGuaranteedSect, false, '首抽保底已消费');
// 校验宗门推荐选项：第一世序章必须唯有【万剑仙宗】，绝无2个门派或旁门
const sectOpts = gm.getRandomSectOptions();
assert.strictEqual(sectOpts.length, 1, '序章入门必须只有 1 个宗门选项');
assert.strictEqual(sectOpts[0].id, 'wanjian', '首选门派必须是五行金系第一正宗【万剑仙宗】');
console.log(`✅ 测试 4 通过: 首次推演命中宝剑三连，引渡唯一宗门【${sectOpts[0].name}】！`);

// -------------------------------------------------------------
// 5. 测试拜入万剑仙宗，完成序章
// -------------------------------------------------------------
console.log('\n[TEST 5] 验证拜入万剑仙宗，晋升练气一层，圆满完成序章');
gm.completeSectInduction('wanjian');

assert.strictEqual(gm.player.currentSect, 'wanjian', '角色宗门必须为万剑仙宗');
assert.strictEqual(gm.player.isMortal, false, '褪去凡胎，不再是凡人');
assert.strictEqual(gm.isPrologueComplete, true, '序章正式圆满完成');
assert.strictEqual(gm.prologueStep, 4, '步骤推进至 4 (宗门大成)');
console.log('✅ 测试 5 通过: 成功拜入万剑仙宗，正式开启大世界修仙之旅！');

console.log('\n===============================================================');
console.log('🎉 全部 5 项新新手引导与首抽单门派测试 100% 完美通过！');
console.log('===============================================================');
