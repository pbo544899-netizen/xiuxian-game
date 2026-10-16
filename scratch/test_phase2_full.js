// 全局集成模拟测试 (Node.js)
global.window = {
  SlotsRPG: {},
  addEventListener: () => {}
};

// 模拟 EventBus
require('../src/core/EventBus.js');
require('../src/slots/PaytableConfig.js');
require('../src/slots/PaylinesConfig.js');
require('../src/slots/FlowController.js');
require('../src/slots/SlotsEngine.js');
require('../src/character/PlayerModel.js');
require('../src/inventory/ItemModel.js');
require('../src/inventory/InventoryManager.js');
require('../src/inventory/EquipSynthesizer.js');
require('../src/core/GameManager.js');

const gameManager = window.SlotsRPG.GameManager;

console.log('=== 1. 初始化校验 ===');
console.log(`初始机缘: ${gameManager.energy}`);
console.log(`初始境界: ${gameManager.player.realmName}, 初始战力: ${gameManager.player.combatPower}`);
console.log(`初始装备: 武器=${gameManager.player.equipment.weapon?.name}, 衣服=${gameManager.player.equipment.armor?.name}`);

console.log('\n=== 2. 模拟 10 次推演流程 ===');
let spinSuccessCount = 0;
let levelUpEventTriggered = false;

window.SlotsRPG.EventBus.on('PLAYER_LEVEL_UP', (ups) => {
  levelUpEventTriggered = true;
  console.log(`[事件监听] 触发境界突破！晋升至: ${ups[ups.length-1].newRealm}`);
});

for (let i = 1; i <= 10; i++) {
  gameManager.executeSpin();
  spinSuccessCount++;
}

console.log(`完成推演 10 次`);
console.log(`当前机缘: ${gameManager.energy}`);
console.log(`当前角色: ${gameManager.player.realmName}, 经验: ${gameManager.player.exp}/${gameManager.player.maxExp}`);
console.log(`乾坤袋物品数量: ${24 - gameManager.inventory.getFreeSlotsCount()}`);

console.log('\n=== 3. 模拟 3合1 升阶与批量分解测试 ===');
// 手动向背包塞入 3 把青云甲 (Q1)
gameManager.inventory.addItem(window.SlotsRPG.ItemModel.createEquipment('armor', 'Q1'));
gameManager.inventory.addItem(window.SlotsRPG.ItemModel.createEquipment('armor', 'Q1'));
gameManager.inventory.addItem(window.SlotsRPG.ItemModel.createEquipment('armor', 'Q1'));

const mergeResult = gameManager.mergeEquipment();
console.log(`执行一键升阶: 融合了 ${mergeResult.mergedGroupsCount} 组, 释放了 ${mergeResult.freedSlots} 个空格`);

const salvageResult = gameManager.bulkSalvageEquipment(['Q1']);
console.log(`执行一键分解: 分解了 ${salvageResult.count} 件, 回收机缘 +${salvageResult.totalEnergy}`);

console.log('\n=== 4. 模拟装备穿戴与替换测试 ===');
console.log('\n=== 5. 测试 REWARDS_DROPPED 事件与未读红点计数 ===');
let droppedRewardsCount = 0;
window.SlotsRPG.EventBus.on('REWARDS_DROPPED', (data) => {
  droppedRewardsCount += data.rewards.length;
  console.log(`[事件监听] REWARDS_DROPPED 触发: 掉落 ${data.rewards.length} 件奖励: ${data.rewards.map(r => r.name).join('、')}`);
});

// 手动塞入一件新装备
const sword = window.SlotsRPG.ItemModel.createEquipment('weapon', 'Q2');
const addSwordRes = gameManager.inventory.addItem(sword);
console.log(`添加新装备后未读红点数: ${gameManager.inventory.getUnreadCount()}`);

// 点击阅读，消除红点
gameManager.markItemRead(addSwordRes.slotIndex);
console.log(`阅读消除红点后未读数: ${gameManager.inventory.getUnreadCount()}`);

console.log('\n所有集成测试无异常！');
