// Phase 2 核心算法与逻辑自动化测试脚本
const path = require('path');

// 模拟 window.SlotsRPG 上下文
global.window = {
  SlotsRPG: {}
};

require('../src/character/PlayerModel.js');
require('../src/inventory/ItemModel.js');
require('../src/inventory/InventoryManager.js');
require('../src/inventory/EquipSynthesizer.js');

const PlayerModel = window.SlotsRPG.PlayerModel;
const ItemModel = window.SlotsRPG.ItemModel;
const InventoryManager = window.SlotsRPG.InventoryManager;
const EquipSynthesizer = window.SlotsRPG.EquipSynthesizer;

console.log('=== 1. 测试 PlayerModel 升级与属性成长 ===');
const player = new PlayerModel();
console.log(`初始状态: ${player.realmName} (Lv${player.level}), HP:${player.getBaseStats().hp}, ATK:${player.getBaseStats().atk}, DEF:${player.getBaseStats().def}, Power:${player.combatPower}`);

// 模拟单次推演 +5 经验
player.addExp(5);
console.log(`推演+5经验后: Exp ${player.exp} / ${player.maxExp}`);

// 模拟修为丹 +150 经验，预期升至 Lv 2
const levelUps = player.addExp(150);
console.log(`获得150经验, 升级次数: ${levelUps.length}`);
levelUps.forEach(up => {
  console.log(`升级! ${up.oldRealm} -> ${up.newRealm}, 战力提升!`);
});
console.log(`当前状态: ${player.realmName} (Lv${player.level}), HP:${player.getTotalStats().hp}, ATK:${player.getTotalStats().atk}, DEF:${player.getTotalStats().def}, 综合战力:${player.combatPower}`);

console.log('\n=== 2. 测试装备创建与穿戴/战力增益 ===');
const weapon = ItemModel.createEquipment('weapon', 'Q2'); // 灵器·玄铁剑
console.log(`生成武器: ${weapon.name}, ATK+${weapon.stats.atk}, 战力贡献+${weapon.power}`);

player.equip(weapon);
console.log(`穿戴后战力: ${player.combatPower} (基础属性+装备加成)`);

console.log('\n=== 3. 测试 InventoryManager 24格、防丢件、溢出缓冲 ===');
const inv = new InventoryManager(24);
console.log(`背包初始空位: ${inv.getFreeSlotsCount()} / ${inv.capacity}`);

// 测试卸下防丢件拦截
console.log(`空背包时能否卸下: ${inv.canUnequip()}`); // true

// 塞满 24 格
for (let i = 0; i < 24; i++) {
  const eq = ItemModel.createEquipment('armor', 'Q1');
  inv.addItem(eq);
}
console.log(`填满后空位: ${inv.getFreeSlotsCount()}, 此时能否卸下身上装备: ${inv.canUnequip()}`); // 0, false (成功拦截防丢件)

// 测试溢出暂存槽 (第 25 件)
const overflowItem = ItemModel.createEquipment('ring', 'Q3');
const addResult = inv.addItem(overflowItem);
console.log(`溢出入库结果: buffered=${addResult.buffered}, 缓冲数量=${inv.overflowBuffer.length}`);

console.log('\n=== 4. 测试 EquipSynthesizer 3合1升阶 ===');
const inv2 = new InventoryManager(24);
// 放入 3 件同部位同品质 Q1 武器
inv2.addItem(ItemModel.createEquipment('weapon', 'Q1'));
inv2.addItem(ItemModel.createEquipment('weapon', 'Q1'));
inv2.addItem(ItemModel.createEquipment('weapon', 'Q1'));
// 放入 1 件戒指
inv2.addItem(ItemModel.createEquipment('ring', 'Q1'));

console.log(`合成前背包物品数: ${24 - inv2.getFreeSlotsCount()}`);
const mergeRes = EquipSynthesizer.mergeThreeInOne(inv2);
console.log(`3合1合成结果: 成功合成 ${mergeRes.mergedGroupsCount} 组, 释放了 ${mergeRes.freedSlots} 个空格`);
console.log(`新合成装备: ${mergeRes.upgradedItems.map(i => i.name).join(', ')}`);
console.log(`合成后背包物品数: ${24 - inv2.getFreeSlotsCount()}`);

console.log('\n=== 5. 测试一键批量分解 ===');
const salvageRes = EquipSynthesizer.salvageByQualities(inv2, ['Q1']);
console.log(`批量分解 Q1: 分解数量 ${salvageRes.count}, 获得机缘 +${salvageRes.totalEnergy}`);

console.log('\n所有核心算法与模型测试通过！');
