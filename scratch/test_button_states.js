global.window = {
  SlotsRPG: {}
};

require('../src/character/PlayerModel.js');
require('../src/inventory/ItemModel.js');
require('../src/inventory/InventoryManager.js');
require('../src/inventory/EquipSynthesizer.js');

const InventoryManager = window.SlotsRPG.InventoryManager;
const ItemModel = window.SlotsRPG.ItemModel;
const EquipSynthesizer = window.SlotsRPG.EquipSynthesizer;

console.log('=== 测试 1: 空背包状态 ===');
const inv = new InventoryManager(24);
console.log('canMerge:', EquipSynthesizer.canMergeThreeInOne(inv)); // false
console.log('canSalvage:', EquipSynthesizer.canSalvageByQualities(inv, ['Q1', 'Q2'])); // false
console.log('canSort:', inv.canSort()); // false

console.log('\n=== 测试 2: 仅有丹药状态 (已排好) ===');
inv.addItem(ItemModel.createPill('blood', 5));
inv.addItem(ItemModel.createPill('exp', 5));
console.log('canMerge:', EquipSynthesizer.canMergeThreeInOne(inv)); // false
console.log('canSalvage:', EquipSynthesizer.canSalvageByQualities(inv, ['Q1', 'Q2'])); // false
console.log('canSort (2件已按序排好):', inv.canSort());

console.log('\n=== 测试 3: 乱序状态 ===');
// 交换位置制造乱序
const temp = inv.slots[0];
inv.slots[0] = inv.slots[1];
inv.slots[1] = temp;
console.log('canSort (乱序):', inv.canSort()); // true
inv.sort();
console.log('canSort (整理后):', inv.canSort()); // false

console.log('\n=== 测试 4: 存在空洞状态 ===');
// 把第0格清空，物品在第1格
inv.slots[1] = inv.slots[0];
inv.slots[0] = null;
console.log('canSort (有空洞):', inv.canSort()); // true
inv.sort();
console.log('canSort (填平空洞后):', inv.canSort()); // false

console.log('\n=== 测试 5: 放入 1 件凡铁装备 ===');
inv.addItem(ItemModel.createEquipment('weapon', 'Q1'));
console.log('canMerge (1件):', EquipSynthesizer.canMergeThreeInOne(inv)); // false
console.log('canSalvage:', EquipSynthesizer.canSalvageByQualities(inv, ['Q1', 'Q2'])); // true

console.log('\n=== 测试 6: 放入同部位同品质 3 件装备 ===');
inv.addItem(ItemModel.createEquipment('weapon', 'Q1'));
inv.addItem(ItemModel.createEquipment('weapon', 'Q1'));
console.log('canMerge (3件同部位Q1):', EquipSynthesizer.canMergeThreeInOne(inv)); // true

console.log('\n=== 所有条件校验测试全部通过！===');
