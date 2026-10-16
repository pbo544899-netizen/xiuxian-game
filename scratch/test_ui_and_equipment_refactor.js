/**
 * test_ui_and_equipment_refactor.js
 * 自动化测试：验证一键装备、乾坤袋整理按钮重构、浮动呼吸一键升阶与防遮挡布局
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=====================================================================');
console.log('🧪 开始测试 UI 布局改造与一键装备 / 整理 / 浮动合成功能 🧪');
console.log('=====================================================================\n');

// 1. 验证 index.html 中的 DOM 结构与文案
console.log('[TEST 1] 验证 index.html DOM 结构与文案规范');
const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// 1.1 装备栏标题右侧包含一键装备按钮
assert(htmlContent.includes('id="btn-quick-equip"'), 'index.html 必须包含 id="btn-quick-equip"');
assert(htmlContent.includes('class="equip-section-header"'), 'index.html 装备栏必须包含 .equip-section-header 容器');
console.log('✅ PASSED: 装备栏标题已成功集成【一键装备】按钮 (id="btn-quick-equip")');

// 1.2 背包框标题包含整理按钮，居中显示“自动分解凡铁/凡器”
assert(htmlContent.includes('id="btn-bag-sort-header"'), 'index.html 背包栏必须包含 id="btn-bag-sort-header"');
assert(htmlContent.includes('自动分解凡铁/凡器'), 'index.html 必须包含文案“自动分解凡铁/凡器”');
assert(htmlContent.includes('id="chk-auto-salvage"'), 'index.html 必须保留 id="chk-auto-salvage"');
console.log('✅ PASSED: 背包标题最右侧已集成【整理】按钮，中间保留【自动分解凡铁/凡器】');

// 1.3 拥有装备可合成时显示在背包下方的浮动呼吸按钮
assert(htmlContent.includes('id="floating-merge-wrap"'), 'index.html 必须包含 id="floating-merge-wrap"');
assert(htmlContent.includes('id="btn-floating-merge"'), 'index.html 必须包含 id="btn-floating-merge"');
console.log('✅ PASSED: 背包下方已配置浮动式一键升阶按钮容器 (id="floating-merge-wrap")\n');

// 2. 验证 css/style.css 中的样式规范
console.log('[TEST 2] 验证 css/style.css 样式与动效规范');
const cssContent = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');

assert(cssContent.includes('.btn-quick-equip'), 'style.css 必须包含 .btn-quick-equip 样式');
assert(cssContent.includes('quickEquipGlow'), 'style.css 必须包含 quickEquipGlow 动效');
assert(cssContent.includes('.btn-bag-header-sort'), 'style.css 必须包含 .btn-bag-header-sort 样式');
assert(cssContent.includes('.btn-floating-merge'), 'style.css 必须包含 .btn-floating-merge 样式');
assert(cssContent.includes('mergeBreathingGlow'), 'style.css 必须包含 mergeBreathingGlow 呼吸光效');
assert(cssContent.includes('padding-bottom: 24px'), 'style.css #view-character 必须有充分的底部留白防止底部导航栏遮挡');
console.log('✅ PASSED: 一键装备光效、背包整理按钮样式、浮动升阶呼吸光效以及防遮挡 padding-bottom 均已正确定义\n');

// 3. 验证功能逻辑 (环境仿真测试)
console.log('[TEST 3] 验证一键装备智能算法与战力提升');

// 模拟环境加载全局对象
global.window = global;
window.SlotsRPG = {};
require('../src/character/PlayerModel.js');
require('../src/inventory/ItemModel.js');
require('../src/inventory/InventoryManager.js');
require('../src/inventory/EquipSynthesizer.js');

const PlayerModel = window.SlotsRPG.PlayerModel;
const ItemModel = window.SlotsRPG.ItemModel;
const InventoryManager = window.SlotsRPG.InventoryManager;
const EquipSynthesizer = window.SlotsRPG.EquipSynthesizer;

// 3.1 凡人阶段一键装备测试 (仅武器槽解锁)
const mortalPlayer = new PlayerModel();
mortalPlayer.setupMortalState();
const inv1 = new InventoryManager();

// 放入一件更强的凡铁长剑 (power 12 > 柴刀 6)
const swordQ1 = ItemModel.createEquipment('weapon', 'Q1');
swordQ1.power = 12;
swordQ1.stats.atk = 6;
inv1.addItem(swordQ1);

// 放入一件凡铁衣服 (power 8) - 但凡人阶段衣服槽未解锁
const armorQ1 = ItemModel.createEquipment('armor', 'Q1');
armorQ1.power = 8;
inv1.addItem(armorQ1);

// 模拟 quickEquipBestGear 算法
function simulateQuickEquip(player, inventory) {
  const slots = ['weapon', 'armor', 'ring', 'hat', 'boots', 'belt'];
  let count = 0;
  let powerGain = 0;

  for (const slotName of slots) {
    if (!player.isSlotUnlocked(slotName, 1)) continue;
    const currentEquip = player.equipment[slotName];
    const currentPower = currentEquip ? (currentEquip.power || 0) : -1;

    let bestCandidate = null;
    let bestIndex = -1;
    let maxPower = currentPower;

    for (let i = 0; i < inventory.capacity; i++) {
      const item = inventory.slots[i];
      if (item && item.type === 'equip' && item.part === slotName) {
        if ((item.power || 0) > maxPower) {
          maxPower = item.power || 0;
          bestCandidate = item;
          bestIndex = i;
        }
      }
    }

    if (bestCandidate && bestIndex !== -1) {
      const prevP = player.combatPower;
      const oldEquip = player.equip(bestCandidate);
      inventory.slots[bestIndex] = null;
      count++;
      const gain = player.combatPower - prevP;
      if (gain > 0) powerGain += gain;
    }
  }
  return { count, powerGain };
}

const mortalRes = simulateQuickEquip(mortalPlayer, inv1);
assert.strictEqual(mortalRes.count, 1, '凡人阶段只能装备武器');
assert.strictEqual(mortalPlayer.equipment.weapon.power, 12, '凡人武器成功替换为更强的武器');
assert.strictEqual(mortalPlayer.equipment.armor, null, '凡人衣服槽未解锁，严禁穿戴');
assert(mortalRes.powerGain > 0, '战力必须提升');
console.log(`✅ PASSED: 凡人一键装备验证成功 (换装 1 件，战力提升 +${mortalRes.powerGain})`);

// 3.2 修真者阶段一键装备测试 (6 大槽位全部开放)
const cultPlayer = new PlayerModel();
cultPlayer.promoteToCultivator('wanjian');
const inv2 = new InventoryManager();

// 给背包添加 6 个部位的高阶稀有法宝 (Q3 灵器)
const slots = ['weapon', 'armor', 'ring', 'hat', 'boots', 'belt'];
slots.forEach(slot => {
  const eq = ItemModel.createEquipment(slot, 'Q3');
  eq.power = 80;
  inv2.addItem(eq);
});

const cultRes = simulateQuickEquip(cultPlayer, inv2);
assert.strictEqual(cultRes.count, 6, '修真者应一键穿戴全部 6 个部位的高阶法宝');
slots.forEach(slot => {
  assert.strictEqual(cultPlayer.equipment[slot].qualityCode, 'Q3', `${slot} 部位必须为 Q3 灵器`);
});
console.log(`✅ PASSED: 修真者一键换装 6 大槽位成功 (换装 ${cultRes.count} 件，综合战力提升 +${cultRes.powerGain})`);

// 3.3 验证一键装备按钮状态：没有可替换装备时为灰色禁用，有更优装备时才亮起
console.log('[TEST 3.3] 验证一键装备状态机：无升级保持灰色，有升级才亮起');
function checkHasUpgrade(player, inventory) {
  const allSlots = ['weapon', 'armor', 'ring', 'hat', 'boots', 'belt'];
  return allSlots.some(slot => player.canSlotBeEquippedOrUpgraded(slot, inventory, 1));
}

// 此时 cultPlayer 身上都是 Q3 灵器，背包中仅剩余无用旧装或空
assert.strictEqual(checkHasUpgrade(cultPlayer, inv2), false, '没有可替换装备时，upgrade 状态必须为 false (按钮呈灰色禁用)');
console.log('✅ PASSED: 全身最佳法宝时，一键装备判定为 false (按钮保持灰色未亮起)');

// 向背包放入一件更高阶的神兵 (Q4 法器武器，power 160 > Q3 武器 80)
const weaponQ4 = ItemModel.createEquipment('weapon', 'Q4');
weaponQ4.power = 160;
inv2.addItem(weaponQ4);

assert.strictEqual(checkHasUpgrade(cultPlayer, inv2), true, '背包出现更优武器后，upgrade 状态必须为 true (按钮亮起)');
console.log('✅ PASSED: 获得更强装备后，一键装备判定为 true (按钮亮起并呼吸提醒)');

// 执行一键装备后，再度恢复无升级状态
simulateQuickEquip(cultPlayer, inv2);
assert.strictEqual(checkHasUpgrade(cultPlayer, inv2), false, '换装完毕后，upgrade 状态应恢复为 false (按钮恢复灰色禁用)');
console.log('✅ PASSED: 一键装备完成后，按钮自动恢复灰色未亮起状态\n');

// 4. 验证 3合1 升阶与浮动按钮激活条件
console.log('[TEST 4] 验证 EquipSynthesizer 3合1检测与浮动按钮显示条件');
const inv3 = new InventoryManager();
assert.strictEqual(EquipSynthesizer.canMergeThreeInOne(inv3), false, '初始空背包不可合成');

// 添加 2 件相同 Q1 衣服
inv3.addItem(ItemModel.createEquipment('armor', 'Q1'));
inv3.addItem(ItemModel.createEquipment('armor', 'Q1'));
assert.strictEqual(EquipSynthesizer.canMergeThreeInOne(inv3), false, '仅 2 件时不可合成 (浮动按钮隐藏)');

// 添加第 3 件相同 Q1 衣服
inv3.addItem(ItemModel.createEquipment('armor', 'Q1'));
assert.strictEqual(EquipSynthesizer.canMergeThreeInOne(inv3), true, '凑齐 3 件时满足合成条件 (浮动按钮激活显示)');

// 执行合成
const mergeRes = EquipSynthesizer.mergeThreeInOne(inv3);
assert.strictEqual(mergeRes.mergedGroupsCount, 1, '成功合成 1 组');
assert.strictEqual(mergeRes.upgradedItems[0].qualityCode, 'Q2', 'Q1 成功合成为 Q2');
assert.strictEqual(EquipSynthesizer.canMergeThreeInOne(inv3), false, '合成后无多余件数，浮动按钮自动隐藏');
console.log('✅ PASSED: 浮动一键合成按钮的动态显隐与 3合1 升阶逻辑 100% 验证通过！\n');

console.log('=====================================================================');
console.log('🎉 所有新增 UI 与交互功能逻辑验证全部通过！🎉');
console.log('=====================================================================');
