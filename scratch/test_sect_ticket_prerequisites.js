/**
 * test_sect_ticket_prerequisites.js
 * 验证宗门门票发放的充要条件：
 * 充要条件：【击败当前守关妖王】 且 【全身 6 槽法宝均为 Q4 紫品法器及以上（六道道基大圆满）】
 */
const assert = require('assert');

// 构造模拟环境
global.window = global;
window.SlotsRPG = {};

// 模拟 EventBus
const listeners = {};
window.SlotsRPG.EventBus = {
  on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
  },
  emit(event, data) {
    if (listeners[event]) {
      listeners[event].forEach(fn => fn(data));
    }
  }
};

// 模拟 localStorage
const localStorageStore = {};
global.localStorage = {
  getItem(k) { return localStorageStore[k] || null; },
  setItem(k, v) { localStorageStore[k] = String(v); },
  removeItem(k) { delete localStorageStore[k]; },
  clear() { for (const k in localStorageStore) delete localStorageStore[k]; }
};

// 加载核心模块
require('../src/character/PlayerModel.js');
require('../src/inventory/ItemModel.js');
require('../src/inventory/InventoryManager.js');
require('../src/inventory/EquipSynthesizer.js');
require('../src/rpg/SectConfig.js');
require('../src/rpg/BossConfig.js');
require('../src/rpg/MonsterConfig.js');
require('../src/slots/GameBalanceConfig.js');
require('../src/core/AscensionManager.js');
require('../src/core/StorageService.js');
require('../src/slots/FlowController.js');
require('../src/slots/SlotsEngine.js');
require('../src/cave/CaveManager.js');
require('../src/bonus/HoldAndSpinEngine.js');
require('../src/core/GameManager.js');

const ItemModel = window.SlotsRPG.ItemModel;
const GameManager = window.SlotsRPG.GameManager.constructor;
const StorageService = window.SlotsRPG.StorageService;

console.log('=====================================================================');
console.log('🧪 开始测试宗门门票双重硬性约束（击败妖王 + 全身紫装神装） 🧪');
console.log('=====================================================================\n');

function createSixPieces(qualityCode = 'Q4') {
  const parts = ['weapon', 'armor', 'ring', 'hat', 'boots', 'belt'];
  return parts.map(p => ItemModel.createEquipment(p, qualityCode));
}

// -------------------------------------------------------------
// [CASE 1] 先打败守关妖王（此时装备全是白/绿），门票绝不提前掉落！
//          后续凑齐 6 件紫装后，在穿戴完成时立即触发门票发放！
// -------------------------------------------------------------
console.log('[TEST 1] 测试：先击杀妖王（白绿装未圆满）-> 不发门票；随后凑齐全套紫装 -> 立即发放门票');
{
  const gm = new GameManager();
  gm.player.setSect('wanjian');
  gm.level = 1;

  // 玩家穿戴两件白装
  gm.player.equipment.weapon = ItemModel.createEquipment('weapon', 'Q1');
  gm.player.equipment.armor = ItemModel.createEquipment('armor', 'Q2');

  assert.strictEqual(gm.hasDefeatedSectBoss, false, '初始状态尚未击败妖王');
  assert.strictEqual(gm.unlockedSectTicket, null, '初始状态无门票');

  // 模拟打赢第一关妖王 Boss (赤炼蟒)
  const battleResult = {
    isVictory: true,
    encounter: { tier: 'boss', isBoss: true },
    boss: { id: 'boss_1', tier: 'boss', name: '赤炼蟒' },
    rewardItems: []
  };

  let ticketEventFired = false;
  const ticketHandler = () => { ticketEventFired = true; };
  window.SlotsRPG.EventBus.on('FULL_SET_SECT_TICKET_AWARDED', ticketHandler);

  gm.claimBattleRewards(battleResult);

  assert.strictEqual(gm.hasDefeatedSectBoss, true, '战斗胜利后已记录斩灭妖王');
  assert.strictEqual(gm.unlockedSectTicket, null, '白绿装未满Q4，绝不提前发放门票！');
  assert.strictEqual(ticketEventFired, false, '未触发门票发放事件');
  console.log('  ✅ 妖王伏诛后，由于装备未达成六道紫装大圆满，门票成功被安全拦截！');

  // 玩家逐渐获得并穿戴 6 件 Q4 紫装
  const purpleItems = createSixPieces('Q4');
  // 放入背包
  purpleItems.forEach(it => gm.inventory.addItem(it));

  // 穿上第 1 ~ 5 件
  for (let i = 0; i < 5; i++) {
    const slotIdx = gm.inventory.slots.findIndex(s => s && s.qualityCode === 'Q4');
    gm.equipItem(slotIdx);
    assert.strictEqual(gm.unlockedSectTicket, null, `穿戴第 ${i + 1} 件紫装时仍未满6件，不发门票`);
  }

  // 穿上第 6 件（达成全身6槽全满 Q4 法器神装！）
  const lastSlotIdx = gm.inventory.slots.findIndex(s => s && s.qualityCode === 'Q4');
  assert(lastSlotIdx !== -1, '背包中必须有第6件紫装');
  gm.equipItem(lastSlotIdx);

  assert.strictEqual(gm.player.checkFullSetEquipped('Q4').isGraduated, true, '玩家已达成六道大圆满');
  assert(gm.unlockedSectTicket !== null, '妖王已灭 + 6槽紫装集齐，必须立即发放门票！');
  assert(ticketEventFired, '必须触发 FULL_SET_SECT_TICKET_AWARDED 事件');
  assert(gm.unlockedSectTicket.badge, '发放的门票必须包含宗门徽章属性');
  console.log(`  ✅ 穿齐第6件紫装瞬间，引动天道异象，成功发放下一门派门票【${gm.unlockedSectTicket.tokenName}】！\n`);
}

// -------------------------------------------------------------
// [CASE 2] 先凑齐 6 件紫装，但尚未击败妖王 -> 不发门票！
//          随后挑战并斩杀守关妖王 -> 战斗结算时立即触发门票发放！
// -------------------------------------------------------------
console.log('[TEST 2] 测试：先凑齐6件紫装（未打妖王）-> 不发门票；随后斩杀守关妖王 -> 战斗结算立即发放门票');
{
  const gm = new GameManager();
  gm.player.setSect('taiyi');
  gm.level = 1;

  // 给予 6 件紫装
  const purpleItems = createSixPieces('Q4');
  purpleItems.forEach(it => gm.inventory.addItem(it));

  // 穿戴全部 6 件紫装
  for (let i = 0; i < 6; i++) {
    const slotIdx = gm.inventory.slots.findIndex(s => s && s.qualityCode === 'Q4');
    gm.equipItem(slotIdx);
  }

  assert.strictEqual(gm.player.checkFullSetEquipped('Q4').isGraduated, true, '已穿满6件紫装');
  assert.strictEqual(gm.hasDefeatedSectBoss, false, '尚未击败妖王');
  assert.strictEqual(gm.unlockedSectTicket, null, '未杀妖王前绝不发放门票！');
  console.log('  ✅ 6件紫装虽已达成，但因妖王未灭，门票成功被安全拦截！');

  // 现在去击败当前关卡守关妖王
  const battleResult = {
    isVictory: true,
    encounter: { tier: 'boss', isBoss: true },
    boss: { id: 'boss_2', tier: 'boss', name: '丹霞金顶兽' },
    rewardItems: []
  };

  const summary = gm.claimBattleRewards(battleResult);

  assert.strictEqual(gm.hasDefeatedSectBoss, true, '妖王已灭');
  assert(gm.unlockedSectTicket !== null, '妖王伏诛 + 六道圆满，战斗结算必须发放门票！');
  assert(summary.cheatTicket !== null, '战斗结算汇总必须包含门票');
  console.log(`  ✅ 斩杀妖王瞬间，双重充要条件齐备，成功掉落门票【${gm.unlockedSectTicket.tokenName}】！\n`);
}

// -------------------------------------------------------------
// [CASE 3] 存档安全与历史脏数据自动纠偏测试
// -------------------------------------------------------------
console.log('[TEST 3] 测试：StorageService 存档持久化与未达标门票自动纠偏');
{
  const gm = new GameManager();
  gm.player.setSect('wanjian');
  gm.hasDefeatedSectBoss = true;
  // 故意制造历史脏数据：虽然击败了妖王，但身上只有 1 件白装，却拥有了门票
  gm.player.equipment.weapon = ItemModel.createEquipment('weapon', 'Q1');
  gm.unlockedSectTicket = {
    sectId: 'taiyi',
    sectName: '太乙丹霞宗',
    tokenName: '太乙令'
  };

  // 保存到 storage
  StorageService.saveGame(gm, true);

  // 重新加载到新实例中
  const newGm = new GameManager();
  StorageService.loadGame(newGm);

  assert.strictEqual(newGm.hasDefeatedSectBoss, true, '已恢复 hasDefeatedSectBoss 标记');
  assert.strictEqual(newGm.unlockedSectTicket, null, '纠偏机制成功清空了不合规的历史脏门票！');
  console.log('  ✅ 存档读取自动纠偏成功：未满足全身紫装的非法门票已被安全清空！\n');
}

// -------------------------------------------------------------
// [CASE 4] 轮回转世后的状态重置与天碑神装归位
// -------------------------------------------------------------
console.log('[TEST 4] 测试：轮回转世后重置妖王击杀标记与天碑神装封神归位');
{
  const gm = new GameManager();
  gm.player.setSect('wanjian');
  gm.hasDefeatedSectBoss = true;

  // 穿戴 6 件紫装
  const purpleItems = createSixPieces('Q4');
  purpleItems.forEach(it => gm.inventory.addItem(it));
  for (let i = 0; i < 6; i++) {
    const slotIdx = gm.inventory.slots.findIndex(s => s && s.qualityCode === 'Q4');
    gm.equipItem(slotIdx);
  }

  assert(gm.unlockedSectTicket !== null, '应已获得门票');
  const ticketSectId = gm.unlockedSectTicket.sectId;

  // 兵解转生进入新宗门
  const result = gm.attemptSamsara('nirvana', ticketSectId);
  assert(result.success, '转世必须成功');

  // 验证天碑归档
  const wanjianArchive = gm.ascensionManager.meta.sectArchives['wanjian'];
  assert(wanjianArchive, '万剑仙宗法相必须已归档入天碑');
  assert.strictEqual(wanjianArchive.sealStatus, 'consecrated', '法相必须已封神归位');
  assert.strictEqual(Object.keys(wanjianArchive.equipment).length, 6, '归档的必须是完整的6件神装');
  for (const part in wanjianArchive.equipment) {
    assert.strictEqual(wanjianArchive.equipment[part].qualityCode, 'Q4', `天碑 ${part} 必须是 Q4 紫装`);
  }
  console.log('  ✅ 天碑英灵殿法相成功收录万剑仙宗全套 Q4 极品神装！');

  // 验证新一世状态重置
  assert.strictEqual(gm.hasDefeatedSectBoss, false, '新一世必须重置 hasDefeatedSectBoss 为 false');
  assert.strictEqual(gm.unlockedSectTicket, null, '新一世门票已消耗重置');
  assert.strictEqual(gm.player.currentSect, ticketSectId, '新一世已拜入新宗门');
  console.log('  ✅ 新一世状态重置正确，守关妖王标记与门票已清空，成功开启新宗门！\n');
}

console.log('=====================================================================');
console.log('🎉 所有宗门门票双重硬性约束测试全部通过 (100% PASSED)！ 🎉');
console.log('=====================================================================');
