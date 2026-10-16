const assert = require('assert');

// 模拟 DOM 与 Storage
const storageMap = {};
global.localStorage = {
  getItem(k) { return storageMap[k] || null; },
  setItem(k, v) { storageMap[k] = String(v); },
  removeItem(k) { delete storageMap[k]; },
  clear() { for (let k in storageMap) delete storageMap[k]; }
};

global.window = { SlotsRPG: {} };

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
require('../src/rpg/StoryManager.js');
require('../src/core/GameManager.js');

const GameManager = window.SlotsRPG.GameManager;
const ItemModel = window.SlotsRPG.ItemModel;

console.log('🧪 开始测试【九转修为丹】服用功能与境界突破体系');

const gm = new GameManager.constructor();
gm.init();

// 1. 测试凡人状态无法服用
console.log('\n[TEST 1] 凡人状态下无法服用仙丹');
gm.player.setupMortalState();
gm.inventory.addItem(ItemModel.createPill('exp', 5));
const mortalRes = gm.usePill('exp', 1);
assert.strictEqual(mortalRes.success, false);
assert.ok(mortalRes.message.includes('凡人'));
console.log('✅ 凡人状态受到灵根未显法则约束，不可提前炼化仙丹');

// 2. 入道后测试单颗服用
console.log('\n[TEST 2] 拜入门派后单颗服用 +100 经验');
gm.player.promoteToCultivator('wanjian'); // 成为万剑门练气一层 (Lv 1, Exp 0/150)
assert.strictEqual(gm.player.level, 1);
assert.strictEqual(gm.player.exp, 0);

const pillCountBefore = gm.inventory.getItemAmount('pill', 'exp');
const useRes1 = gm.usePill('exp', 1);
assert.strictEqual(useRes1.success, true);
assert.strictEqual(useRes1.consumed, 1);
assert.strictEqual(useRes1.expGained, 100);
assert.strictEqual(gm.player.exp, 100);
assert.strictEqual(gm.inventory.getItemAmount('pill', 'exp'), pillCountBefore - 1);
console.log(`✅ 成功服用 1 颗九转修为丹，经验变为 ${gm.player.exp}/${gm.player.maxExp}`);

// 3. 再次服用，测试升级判定
console.log('\n[TEST 3] 再次服用突破升级至练气二层');
const useRes2 = gm.usePill('exp', 1); // +100 经验，总共 200 经验，升级需要 150，余 50
assert.strictEqual(useRes2.success, true);
assert.strictEqual(gm.player.level, 2);
assert.strictEqual(gm.player.realmName, '练气二层');
assert.strictEqual(useRes2.levelUps.length, 1);
assert.strictEqual(useRes2.levelUps[0].newRealm, '练气二层');
console.log(`✅ 经验充足顺利突破至【${gm.player.realmName}】！`);

// 4. 测试全部批量服用
console.log('\n[TEST 4] 批量服用多颗丹药');
gm.inventory.addItem(ItemModel.createPill('exp', 10));
const beforeCount = gm.inventory.getItemAmount('pill', 'exp');
const batchRes = gm.usePill('exp', 5);
assert.strictEqual(batchRes.success, true);
assert.strictEqual(batchRes.consumed, 5);
assert.strictEqual(batchRes.expGained, 500);
assert.strictEqual(gm.inventory.getItemAmount('pill', 'exp'), beforeCount - 5);
console.log(`✅ 批量服用 5 颗修为丹，获得 +500 经验，当前境界【${gm.player.realmName}】(Lv ${gm.player.level})`);

console.log('\n===============================================================');
console.log('🎉 恭喜！【九转修为丹】服用、升级与背包扣减测试全部 100% 通过！');
console.log('===============================================================');
