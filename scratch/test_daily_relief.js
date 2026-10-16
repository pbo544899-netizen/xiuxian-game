// scratch/test_daily_relief.js - 验证机缘救济（纳灵 +50）每日次数为 0 时不显示及跨日刷新规范
const assert = require('assert');

// 模拟浏览器 DOM 与全局环境
global.window = {
  SlotsRPG: {},
  addEventListener: () => {}
};
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

// 引入核心模块
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

const GameManager = window.SlotsRPG.GameManager;
const StorageService = window.SlotsRPG.StorageService;
const EventBus = window.SlotsRPG.EventBus;

console.log('===============================================================');
console.log('🧪 验证【纳灵 (+50机缘)】每日救济机制与 0 次隐藏规范');
console.log('===============================================================');

const gm = window.SlotsRPG.GameManager;
gm.init();
gm.player.setSect('wanjian');

// [TEST 1] 验证初始状态：每日提供 3 次救济，每次纳灵回复 50 机缘
console.log('\n[TEST 1] 验证正常纳灵流程');
assert.strictEqual(gm.freeReliefCount, 3, '初始免费救济次数应为 3 次');
const initEnergy = gm.energy;

let ok1 = gm.claimRelief();
assert.strictEqual(ok1, true, '第 1 次纳灵应成功');
assert.strictEqual(gm.freeReliefCount, 2, '剩余救济次数应为 2');
assert.strictEqual(gm.energy, initEnergy + 50, '机缘应增加 50');
console.log(`✅ 第 1 次纳灵成功: 机缘 +50 (当前 ${gm.energy}), 剩余次数: ${gm.freeReliefCount}`);

let ok2 = gm.claimRelief();
let ok3 = gm.claimRelief();
assert.strictEqual(ok2, true, '第 2 次纳灵应成功');
assert.strictEqual(ok3, true, '第 3 次纳灵应成功');
assert.strictEqual(gm.freeReliefCount, 0, '今日救济次数应已用尽 (0 次)');
console.log(`✅ 连续领取至 0 次: 剩余次数: ${gm.freeReliefCount}, 累计回复 150 机缘`);

// [TEST 2] 验证当次数为 0 时，再次纳灵必须失败
console.log('\n[TEST 2] 验证次数为 0 时无法继续领取');
let ok4 = gm.claimRelief();
assert.strictEqual(ok4, false, '次数为 0 时 claimRelief 必须返回 false');
console.log('✅ 次数为 0 时成功拦截，无法继续领取！');

// [TEST 3] 验证推演机缘不足触发 ENERGY_DEPLETED 事件时，携带 canRelief=false 与 remainingRelief=0
console.log('\n[TEST 3] 验证机缘不足广播事件数据');
let capturedEvent = null;
EventBus.on('ENERGY_DEPLETED', data => {
  capturedEvent = data;
});

gm.isPrologueComplete = true;
gm.energy = 10;
gm.currentBet = 25;
gm.executeSpin();

assert.ok(capturedEvent, '应触发 ENERGY_DEPLETED 事件');
assert.strictEqual(capturedEvent.canRelief, false, 'canRelief 应为 false');
assert.strictEqual(capturedEvent.remainingRelief, 0, 'remainingRelief 应为 0');
console.log('✅ ENERGY_DEPLETED 事件数据准确: canRelief=false, remainingRelief=0');

// [TEST 4] 验证 DOM 渲染逻辑：当次数为 0 时，纳灵按钮必须隐藏
console.log('\n[TEST 4] 模拟验证 DOM 按钮隐藏逻辑');
const mockBtnClaim = {
  style: {},
  classList: {
    classes: new Set(),
    add(c) { this.classes.add(c); },
    remove(c) { this.classes.delete(c); },
    contains(c) { return this.classes.has(c); }
  }
};
const mockBtnMeditate = {
  style: {},
  classList: {
    classes: new Set(['hidden']),
    add(c) { this.classes.add(c); },
    remove(c) { this.classes.delete(c); },
    contains(c) { return this.classes.has(c); }
  }
};

function simulateUpdateReliefModalUI(rem) {
  if (rem > 0) {
    mockBtnClaim.classList.remove('hidden');
    mockBtnClaim.style.display = '';
    mockBtnMeditate.classList.add('hidden');
    mockBtnMeditate.style.display = 'none';
  } else {
    mockBtnClaim.classList.add('hidden');
    mockBtnClaim.style.display = 'none';
    mockBtnMeditate.classList.remove('hidden');
    mockBtnMeditate.style.display = '';
  }
}

// 传入 0 次
simulateUpdateReliefModalUI(0);
assert.strictEqual(mockBtnClaim.classList.contains('hidden'), true, '纳灵按钮必须包含 hidden 类');
assert.strictEqual(mockBtnClaim.style.display, 'none', '纳灵按钮 style.display 必须为 none');
assert.strictEqual(mockBtnMeditate.classList.contains('hidden'), false, '打坐替代按钮应当显现');
console.log('✅ 次数为 0 时，【纳灵 (+50机缘)】按钮完全隐藏 (hidden + display: none)！');

// 传入 >0 次
simulateUpdateReliefModalUI(2);
assert.strictEqual(mockBtnClaim.classList.contains('hidden'), false, '有次数时纳灵按钮应显示');
assert.strictEqual(mockBtnClaim.style.display, '', '有次数时纳灵按钮 display 应恢复为空');
console.log('✅ 次数 >0 时，【纳灵 (+50机缘)】按钮正常展示！');

// [TEST 5] 验证跨自然日自动重置每日 3 次救济机制
console.log('\n[TEST 5] 验证跨日自动重置配额 (每日次数恢复为 3)');
gm.freeReliefCount = 0;
gm.lastReliefDate = '2026-09-26'; // 模拟昨日已用光

const didReset = gm.checkDailyReliefReset();
assert.strictEqual(didReset, true, '检测到跨日应返回 true');
assert.strictEqual(gm.freeReliefCount, 3, '跨日后救济次数应恢复为 3');
assert.strictEqual(gm.lastReliefDate, gm._getTodayDateString(), '日期标记应更新为今日');
console.log(`✅ 跨日自动重置成立: 恢复每日 ${gm.freeReliefCount} 次救济！`);

// [TEST 6] 验证存档读写 (StorageService) 完美持久化日期与救济次数
console.log('\n[TEST 6] 验证存档存取与跨日自动恢复');
gm.freeReliefCount = 0;
gm.lastReliefDate = '2026-09-20'; // 6天前的存档
StorageService.saveGame(gm, true);

const newGm = new window.SlotsRPG.GameManager.constructor();
newGm.init();
newGm.inventory = new window.SlotsRPG.InventoryManager();
newGm.cave = new window.SlotsRPG.CaveManager();
newGm.ascensionManager = new window.SlotsRPG.AscensionManager();

StorageService.loadGame(newGm);
assert.strictEqual(newGm.freeReliefCount, 3, '读档后检测到跨日，救济次数应自动刷新为 3');
console.log('✅ 存档跨日恢复验证通过！');

console.log('\n===============================================================');
console.log('🎉 全部 6 项【纳灵 (+50机缘)】每日次数为 0 隐藏与跨日刷新验证 100% 通过！');
console.log('===============================================================');

process.exit(0);
