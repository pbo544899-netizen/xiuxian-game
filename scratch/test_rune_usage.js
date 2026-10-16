// scratch/test_rune_usage.js - 验证真符炼化为机缘功能
const assert = require('assert');
const storageMap = {};
global.localStorage = {
  getItem(key) { return storageMap[key] || null; },
  setItem(key, val) { storageMap[key] = String(val); },
  removeItem(key) { delete storageMap[key]; },
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
require('../src/core/GameManager.js');

const ItemModel = window.SlotsRPG.ItemModel;
const GameManager = window.SlotsRPG.GameManager;

console.log('===============================================================');
console.log('🧪 验证真符 (聚灵符/凝神符/破魔符) 炼化为机缘功能');
console.log('===============================================================');

const gm = new GameManager.constructor();
gm.init();

// 添加聚灵符、凝神符、破魔符
gm.inventory.addItem(ItemModel.createTalisman('SYM_01', 3)); // 聚灵符 x3 (20机缘/张)
gm.inventory.addItem(ItemModel.createTalisman('SYM_02', 2)); // 凝神符 x2 (50机缘/张)
gm.inventory.addItem(ItemModel.createTalisman('SYM_03', 1)); // 破魔符 x1 (100机缘/张)

const initialEnergy = gm.energy;

// 1. 炼化 1 张聚灵符
const res1 = gm.useRune('SYM_01', 1);
assert.strictEqual(res1.success, true);
assert.strictEqual(res1.energyGained, 20);
assert.strictEqual(gm.energy, initialEnergy + 20);
assert.strictEqual(gm.inventory.getItemAmount('rune', 'SYM_01'), 2);
console.log('✅ 聚灵符单张炼化成功: +20 机缘');

// 2. 批量炼化剩余 2 张聚灵符
const res2 = gm.useRune('SYM_01', 2);
assert.strictEqual(res2.success, true);
assert.strictEqual(res2.energyGained, 40);
assert.strictEqual(gm.inventory.getItemAmount('rune', 'SYM_01'), 0);
console.log('✅ 聚灵符全部炼化成功: +40 机缘');

// 3. 批量炼化 2 张凝神符
const res3 = gm.useRune('SYM_02', 2);
assert.strictEqual(res3.success, true);
assert.strictEqual(res3.energyGained, 100);
assert.strictEqual(gm.inventory.getItemAmount('rune', 'SYM_02'), 0);
console.log('✅ 凝神符批量炼化成功: +100 机缘');

// 4. 炼化 1 张破魔符
const res4 = gm.useRune('SYM_03', 1);
assert.strictEqual(res4.success, true);
assert.strictEqual(res4.energyGained, 100);
assert.strictEqual(gm.inventory.getItemAmount('rune', 'SYM_03'), 0);
console.log('✅ 破魔符炼化成功: +100 机缘');

console.log('\n===============================================================');
console.log('🎉 聚灵符/凝神符/破魔符炼化功能全部验证通过！不再是占包死物！');
console.log('===============================================================');
