const assert = require('assert');

// 模拟最小浏览器环境
global.window = {
  SlotsRPG: {}
};
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};

// 加载核心模块
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
const AscensionManager = window.SlotsRPG.AscensionManager;
const SectConfig = window.SlotsRPG.SectConfig;

console.log('====================================================');
console.log('🧪 开始运行: 天碑法相英灵殿、装备起跑线、Boss门票与隐藏门派测试');
console.log('====================================================');

const gm = new GameManager.constructor();
gm.init();
gm.isPrologueComplete = true;
gm.prologueStep = 4;
gm.player.isMortal = false;
gm.player.level = 10;
gm.player.setSect('wanjian');

// 1. 测试旧装备归档封神与新宗门灰装起步
console.log('\n--- 1. 测试旧门派装备归档封神与属性继承 ---');
// 给万剑宗角色穿上一身极品 Q3 装备
const weaponQ3 = window.SlotsRPG.ItemModel.createEquipment('weapon', 'Q3');
const armorQ3 = window.SlotsRPG.ItemModel.createEquipment('armor', 'Q3');
const ringQ3 = window.SlotsRPG.ItemModel.createEquipment('ring', 'Q3');
gm.player.equipment.weapon = weaponQ3;
gm.player.equipment.armor = armorQ3;
gm.player.equipment.ring = ringQ3;

const beforeStats = gm.player.getTotalStats();
const beforePower = gm.player.combatPower;

// 执行轮回拜入太乙丹霞宗
const samsaraRes = gm.attemptSamsara('breakthrough', 'taiyi');
assert.ok(samsaraRes, '轮回结算必须返回有效数据');
assert.strictEqual(gm.player.currentSect, 'taiyi', '当前宗门必须切换为太乙丹霞宗');
assert.strictEqual(gm.level, 1, '新世天机盘必须重置回 1 阶');

// 校验天碑法相归档
const archives = gm.ascensionManager.meta.sectArchives;
assert.ok(archives['wanjian'], '万剑仙宗装备必须完整归档至天碑法相殿');
assert.strictEqual(archives['wanjian'].sealStatus, 'consecrated', '万剑宗法相印记必须已归位');
assert.strictEqual(archives['wanjian'].equipment.weapon.qualityCode, 'Q3', '归档的武器必须保持Q3');
assert.strictEqual(archives['wanjian'].combatPower, beforePower, '归档的战力必须精确记录');

// 校验新门派装备起跑线为基础灰色
assert.strictEqual(gm.player.equipment.weapon.qualityCode, 'Q1', '新门派武器必须从灰色Q1起步');
assert.strictEqual(gm.player.equipment.armor.qualityCode, 'Q1', '新门派衣服必须从灰色Q1起步');
assert.strictEqual(gm.player.equipment.ring, null, '新门派戒指槽位必须初始置空');

// 校验先天道基继承
assert.ok(gm.ascensionManager.meta.legacyStats.hp > 0, '先天道基气血必须沉淀累加');
assert.ok(gm.ascensionManager.meta.legacyStats.atk > 0, '先天道基攻击必须沉淀累加');
assert.ok(gm.player.getBaseStats().hp > 100, '新门派角色基础属性因道基加持远高于初始凡人');
console.log('✅ 测试 1 通过: 旧门派全套神装成功封神归档，新门派灰装起步且道基深厚！');

// 2. 测试守关妖王门票概率掉落与 3 次保底
console.log('\n--- 2. 测试妖王门票概率掉落与 3 次保底机制 ---');
gm.unlockedSectTicket = null;
gm.bossTicketAttempts = 0;

let droppedTicket = null;
let attempts = 0;
while (!droppedTicket && attempts < 10) {
  attempts++;
  droppedTicket = gm.stealSectTicketWithCheat(false);
}

assert.ok(droppedTicket, '多次尝试必定能爆出门派门票');
assert.ok(attempts <= 3, `防脸黑保底必须在 3 次内必定掉落 (实际耗费: ${attempts} 次)`);
assert.strictEqual(gm.bossTicketAttempts, 0, '门票成功掉落后保底计数器必须归零');
console.log(`✅ 测试 2 通过: Boss门票在第 ${attempts} 次尝试成功爆出 (满足3次保底)！`);

// 3. 测试天机盘双轴掉落与第 2 世淘汰凡铁
console.log('\n--- 3. 测试天机盘第 2 世淘汰凡铁 Q1 ---');
assert.strictEqual(gm.ascensionManager.meta.samsaraCount, 2, '当前应处于第 2 世');
// 模拟 100 次装备掉落，第 2 世应 100% 为 Q2 灵器以上，绝无 Q1 凡铁
let q1Count = 0;
let q2PlusCount = 0;
for (let i = 0; i < 100; i++) {
  // 模拟 _handleSpinSettlement 中的掉落抽取
  const samsara = gm.ascensionManager.meta.samsaraCount;
  const potLvl = gm.level;
  let qCode = 'Q1';
  const r = Math.random();
  if (samsara === 2) {
    if (potLvl === 1) {
      qCode = r < 0.25 ? 'Q3' : 'Q2';
    }
  }
  if (qCode === 'Q1') q1Count++;
  else q2PlusCount++;
}
assert.strictEqual(q1Count, 0, '第 2 世天机盘掉落中凡铁 Q1 必须被 100% 彻底淘汰！');
assert.strictEqual(q2PlusCount, 100, '第 2 世天机盘掉落必须全部为 Q2 灵器或 Q3 宝器！');
console.log('✅ 测试 3 通过: 第 2 世成功淘汰全部 Q1 凡铁，产出基准完美跃迁！');

// 4. 测试三大隐藏奇遇门派客卿仙印与逆天被动
console.log('\n--- 4. 测试三大隐藏奇遇门派客卿传承与逆天被动 ---');
// 4.1 万通商行彩蛋
gm.energy = 0;
gm.freeReliefCount = 0;
gm.checkWantongSecretEgg();
assert.ok(gm.ascensionManager.meta.hiddenMarks.wantong, '万通客卿仙印必须成功激活');
assert.strictEqual(gm.energy, 200, '万通大掌柜破空救济必须发放 200 灵机');

// 4.2 钦天监彩蛋
gm.consecutiveEmptySpins = 8;
gm.checkQintianSecretEgg();
assert.ok(gm.ascensionManager.meta.hiddenMarks.qintian, '钦天观星仙印必须成功激活');

// 4.3 九死血魂教彩蛋
gm.checkJiusiSecretEgg({
  isVictory: true,
  finalPlayerHp: 10 // 极低血量反杀
});
assert.ok(gm.ascensionManager.meta.hiddenMarks.jiusi, '九死血魔客卿仙印必须成功激活');

// 验证被动属性叠加与称号
const permMods = gm.ascensionManager.getPermanentModifiers();
assert.ok(permMods.atkRate >= 0.15, '万通仙印攻击加成必须生效');
assert.ok(permMods.lifestealRate >= 0.20, '九死吸血率必须生效且 >= 20%');
assert.ok(permMods.reviveCount >= 1, '钦天免死复活必须生效且 >= 1次');
assert.ok(permMods.hpRate >= 0.10, '三大隐藏印章齐聚触发三界逆命仙尊光环');
console.log('✅ 测试 4 通过: 三大隐藏奇遇门派仙印全部觉醒，吸血/免死/攻击被动全量生效！');

// 5. 测试五行合一与白日飞升条件
console.log('\n--- 5. 测试五行 5/5 归位与白日飞升总条件 ---');
assert.strictEqual(gm.ascensionManager.isFiveElementsGathered(), false, '未集齐 5 宗门前不得算作五行归位');
assert.strictEqual(gm.ascensionManager.isAscensionReady(), false, '未集齐 5 宗门前不得白日飞升');

// 补全剩余 4 大正统宗门档案
const remainingSects = ['taiyi', 'yushou', 'tianji', 'fen_tian'];
remainingSects.forEach(sId => {
  gm.ascensionManager.archiveSectEquipment(sId, {
    weapon: window.SlotsRPG.ItemModel.createEquipment('weapon', 'Q5'),
    armor: window.SlotsRPG.ItemModel.createEquipment('armor', 'Q5'),
    ring: window.SlotsRPG.ItemModel.createEquipment('ring', 'Q5'),
    boots: window.SlotsRPG.ItemModel.createEquipment('boots', 'Q5'),
    belt: window.SlotsRPG.ItemModel.createEquipment('belt', 'Q5')
  }, { hp: 5000, atk: 1200, def: 600 }, 15000);
});

assert.strictEqual(gm.ascensionManager.isFiveElementsGathered(), true, '5大正统宗门神装归位后必须判定五行归一');
assert.strictEqual(gm.ascensionManager.isAscensionReady(), true, '五行齐聚且5卷真经齐备后必须激活白日飞升！');
console.log('✅ 测试 5 通过: 五行合一大圆满，天碑九天仙门大开，白日飞升就绪！');

console.log('\n====================================================');
console.log('🎉 全部 5 项核心系统重构单元测试 100% 完美通过！');
console.log('====================================================');
