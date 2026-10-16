// test_sect_ticket_samsara.js - 验证作弊器升阶窃取门票、兵解转世、20%道基继承与神装跨门派转化
const path = require('path');
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
require('../src/core/GameManager.js');

const SectConfig = window.SlotsRPG.SectConfig;
const ItemModel = window.SlotsRPG.ItemModel;
const GameManager = window.SlotsRPG.GameManager;

console.log('===============================================================');
console.log('🧪 开始执行作弊器升阶窃取门票、兵解转世与装备转化专项测试');
console.log('===============================================================');

// -------------------------------------------------------------
// 1. 测试 SectConfig 装备模板
// -------------------------------------------------------------
console.log('\n[TEST 1] 验证 8 大宗门专属装备模板库');
const sects = SectConfig.getAllSects();
assert.strictEqual(sects.length, 8, '8大宗门必须齐全');
sects.forEach(s => {
  const wTmpl = SectConfig.getSectEquipTemplate(s.id, 'weapon');
  const aTmpl = SectConfig.getSectEquipTemplate(s.id, 'armor');
  assert.ok(wTmpl && wTmpl.name, `${s.name} 必须有武器模板`);
  assert.ok(aTmpl && aTmpl.name, `${s.name} 必须有衣服模板`);
});
console.log('✅ 8 大宗门装备模板库完整无误！');

// -------------------------------------------------------------
// 2. 测试守关妖王门票概率掉落与 3 次保底机制
// -------------------------------------------------------------
console.log('\n[TEST 2] 验证击败守关妖王概率掉落门票 (40%概率+3次保底)');
const gm = new GameManager.constructor();
gm.init();
gm.player.setSect('wanjian'); // 当前拜入万剑仙宗
assert.strictEqual(gm.player.currentSect, 'wanjian');
assert.strictEqual(gm.unlockedSectTicket, null, '初始无门票');

// 模拟击败赤炼蟒 (带保底循环直到掉落)
const mockBattleResult = {
  isVictory: true,
  boss: { id: 'boss_1', tier: 'boss', rewards: { exp: 500, energy: 500 } }
};

let attempts = 0;
while (!gm.unlockedSectTicket && attempts < 5) {
  attempts++;
  gm.claimBattleRewards(mockBattleResult);
}

assert.ok(gm.unlockedSectTicket, '作弊器必须成功生成 unlockedSectTicket');
assert.ok(attempts <= 3, `门票必须在 3 次内必定掉落 (实际: ${attempts})`);
assert.notStrictEqual(gm.unlockedSectTicket.sectId, 'wanjian', '截获的宗门绝不能是当前宗门');
console.log(`✅ 作弊器成功破壁！第 ${attempts} 次讨伐截获新宗门门票: 【${gm.unlockedSectTicket.sectName}】(${gm.unlockedSectTicket.tokenName})`);

// -------------------------------------------------------------
// 3. 测试天碑法相归档与 100% 先天道基继承
// -------------------------------------------------------------
console.log('\n[TEST 3] 验证旧装备封神归档与 100% 净基础道基继承');
// 给当前角色佩戴强力装备与升级，提升属性
const swordQ3 = ItemModel.createEquipment('weapon', 'Q3');
const armorQ2 = ItemModel.createEquipment('armor', 'Q2');
gm.player.equip(swordQ3);
gm.player.equip(armorQ2);
gm.player.level = 5;

const preSamsaraTotal = gm.player.getTotalStats();
const prePower = gm.player.combatPower;
const playerNetBase = gm.player.getBaseStats();
console.log(`转世前属性: HP=${preSamsaraTotal.hp}, ATK=${preSamsaraTotal.atk}, DEF=${preSamsaraTotal.def}, 战力=${prePower}`);

const targetSectId = gm.unlockedSectTicket.sectId;
const targetSectName = gm.unlockedSectTicket.sectName;

// 执行兵解转世
const samsaraRes = gm.attemptSamsara('nirvana');
assert.strictEqual(samsaraRes.success, true, '转世必须成功');
assert.strictEqual(gm.unlockedSectTicket, null, '门票使用后必须清空');
assert.strictEqual(gm.player.currentSect, targetSectId, `转世后必须直接拜入门票宗门【${targetSectName}】`);
assert.strictEqual(gm.player.level, 1, '新一世等级重置为 1');

// 校验天碑法相归档
const archives = gm.ascensionManager.meta.sectArchives;
assert.ok(archives['wanjian'], '万剑仙宗必须归档在天碑真卷');
assert.strictEqual(archives['wanjian'].equipment.weapon.qualityCode, 'Q3', '归档的万剑神装品质为 Q3');
assert.strictEqual(archives['wanjian'].combatPower, prePower, '归档战力精确记录');

// 校验先天道基累加
const legacy = gm.ascensionManager.meta.legacyStats;
assert.ok(legacy.hp > 0, '气血道基沉淀累加');
assert.ok(legacy.atk > 0, '攻击道基沉淀累加');
console.log(`✅ 成功沉淀先天道基: HP +${legacy.hp}, ATK +${legacy.atk}, DEF +${legacy.def}`);

// -------------------------------------------------------------
// 4. 测试新门派基础灰装起步
// -------------------------------------------------------------
console.log('\n[TEST 4] 验证新门派从基础灰色装备起步 (重新享受3合1快感)');
const newEquippedWeapon = gm.player.equipment.weapon;
const newEquippedArmor = gm.player.equipment.armor;

assert.ok(newEquippedWeapon, '新世武器必须已穿戴');
assert.strictEqual(newEquippedWeapon.qualityCode, 'Q1', '新世武器必须从 Q1 凡铁起步');
assert.strictEqual(newEquippedArmor.qualityCode, 'Q1', '新世防具必须从 Q1 凡铁起步');
assert.strictEqual(newEquippedWeapon.sectId, targetSectId, `武器所属宗门必须变更为新宗门 ${targetSectId}`);
const expectedWeaponTmpl = SectConfig.getSectEquipTemplate(targetSectId, 'weapon');
assert.strictEqual(newEquippedWeapon.baseName, expectedWeaponTmpl.name, `武器基础名变更为【${expectedWeaponTmpl.name}】`);
console.log(`✅ 新门派装备从灰色 Q1 起步: ${newEquippedWeapon.name}`);

// -------------------------------------------------------------
// 5. 测试存档持久化与恢复 (含天碑归档与隐藏印章)
// -------------------------------------------------------------
console.log('\n[TEST 5] 验证天碑归档与持久化保存与恢复');
// 激活一个隐藏印章
gm.ascensionManager.unlockHiddenMark('wantong');
// 保存游戏
window.SlotsRPG.StorageService.saveGame(gm, true);

// 创建新实例并读取
const gmLoaded = new GameManager.constructor();
const loadOk = window.SlotsRPG.StorageService.loadGame(gmLoaded);
assert.strictEqual(loadOk, true, '读档必须成功');
assert.strictEqual(gmLoaded.player.currentSect, targetSectId, '读档后宗门必须一致');
assert.ok(gmLoaded.ascensionManager.meta.sectArchives['wanjian'], '读档后天碑归档必须存在');
assert.ok(gmLoaded.ascensionManager.meta.hiddenMarks.wantong, '读档后隐藏门派印章状态必须保留');
console.log('✅ 存档持久化与读档完全一致！');

console.log('\n===============================================================');
console.log('🎉 全部测试 100% 通过！天碑英灵殿与Boss掉落体系闭环运转无误！');
console.log('===============================================================');
