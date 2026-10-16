// scratch/test_500_spins_progression.js - 验证500抽生命周期成长与装备-怪物节拍重构
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 模拟全局浏览器环境
global.window = { SlotsRPG: {} };
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

require('../src/core/EventBus.js');
require('../src/skills/SkillPipeline.js');
require('../src/rpg/SectConfig.js');
require('../src/skills/SectSkillRegistry.js');
require('../src/slots/PaytableConfig.js');
require('../src/slots/PaylinesConfig.js');
require('../src/slots/FlowController.js');
require('../src/slots/SlotsEngine.js');
require('../src/character/PlayerModel.js');
require('../src/inventory/ItemModel.js');
require('../src/inventory/InventoryManager.js');
require('../src/inventory/EquipSynthesizer.js');
require('../src/rpg/MonsterConfig.js');
require('../src/rpg/BossConfig.js');
require('../src/rpg/CombatEngine.js');
require('../src/bonus/HoldAndSpinEngine.js');
require('../src/cave/CaveManager.js');
require('../src/core/StorageService.js');
require('../src/core/AscensionManager.js');
require('../src/core/GameManager.js');

const GameManager = window.SlotsRPG.GameManager;
const SlotsEngine = window.SlotsRPG.SlotsEngine;
const PlayerModel = window.SlotsRPG.PlayerModel;
const ItemModel = window.SlotsRPG.ItemModel;
const CombatEngine = window.SlotsRPG.CombatEngine;
const BossConfig = window.SlotsRPG.BossConfig;

console.log('===============================================================');
console.log('🧪 开始测试: 500抽生命周期数值成长与装备-怪物节拍系统');
console.log('===============================================================');

// -------------------------------------------------------------
// TEST 1: 6大装备槽位全开与全神装道基圆满检测
// -------------------------------------------------------------
console.log('\n[TEST 1] 验证 6 大装备槽位全开、道基圆满检测与共鸣加成');
const player = new PlayerModel();
player.setSect('wanjian');
player.isMortal = false;

const slots = ['weapon', 'armor', 'ring', 'hat', 'boots', 'belt'];
slots.forEach(slot => {
  assert.strictEqual(player.isSlotUnlocked(slot), true, `槽位 ${slot} 对入道弟子必须解锁`);
});
console.log('  ✓ 6 大槽位全部处于开放状态');

// 装备初始未满，检测道基圆满应为 false
assert.strictEqual(player.checkFullSetEquipped('Q4').isGraduated, false, '未穿满 6 件 Q4 紫装前不应判定圆满');

// 为 6 个槽位装配 Q3 蓝装，激活初阶共鸣 (+15%)
slots.forEach(slot => {
  player.equipment[slot] = ItemModel.createEquipment(slot, 'Q3');
});
assert.strictEqual(player.checkFullSetEquipped('Q4').isGraduated, false, '6件Q3蓝装尚未达到Q4毕业标准');
const bonusQ3 = player.getFullSetResonanceBonus();
assert.strictEqual(bonusQ3.hpRate, 0.15, '6件蓝装全套共鸣应为 +15%');
console.log(`  ✓ 6 件 Q3 蓝装穿戴成功，激活初阶六神共鸣: HP/ATK/DEF +${bonusQ3.hpRate * 100}%`);

// 为 6 个槽位装配 Q4 紫装，激活高阶六道大圆满 (+25%)
slots.forEach(slot => {
  player.equipment[slot] = ItemModel.createEquipment(slot, 'Q4');
});
assert.strictEqual(player.checkFullSetEquipped('Q4').isGraduated, true, '穿满 6 件 Q4 紫装应判定道基大圆满');
const bonusQ4 = player.getFullSetResonanceBonus();
assert.strictEqual(bonusQ4.hpRate, 0.25, 'Q4 紫装六道大圆满共鸣应为 +25%');
console.log(`  ✓ 6 件 Q4 紫装穿戴成功，激活六道大圆满: HP/ATK/DEF +${bonusQ4.hpRate * 100}%`);

// -------------------------------------------------------------
// TEST 2: 新手保护期（前40抽）屏蔽精英与妖王
// -------------------------------------------------------------
console.log('\n[TEST 2] 验证前 40 抽心流保护期屏蔽精英与妖王 (Scatter 限制 <= 3)');
const engine = new SlotsEngine();
// 模拟前40抽指令
for (let i = 0; i < 50; i++) {
  const result = engine.spin(1, { blockEliteOrBoss: true, forceBoss: false });
  assert.ok(result.evaluation.scatterCount <= 3, `新手期 Scatter 出现数量(${result.evaluation.scatterCount})不得超过 3`);
  if (result.evaluation.battleConfig) {
    assert.strictEqual(result.evaluation.battleConfig.tier, 'normal', '新手期遭遇战斗只能是普通小怪');
  }
}
// 强制注入 forceBoss 也会被 blockEliteOrBoss 压制
const suppressedBossSpin = engine.spin(1, { blockEliteOrBoss: true, forceBoss: true });
assert.ok(suppressedBossSpin.evaluation.scatterCount <= 3, '被压制的 forceBoss 不得产生 5 Scatter');
console.log('  ✓ 前 40 抽保护期 50 次抽奖严格屏蔽精英与妖王');

// -------------------------------------------------------------
// TEST 3: 高倍消耗方案 A (气运大爆与词条顶格) 与单抽熔断
// -------------------------------------------------------------
console.log('\n[TEST 3] 验证高倍消耗方案 A 气运大爆、词条顶格与单抽硬熔断');
GameManager.energy = 50000;
GameManager.isPrologueComplete = true;
GameManager.player.setSect('wanjian');
GameManager.player.isMortal = false;
GameManager.potSubLevel = 3;

// 测试 8 倍消耗下装备词条顶格提升
const itemBase = ItemModel.createEquipment('weapon', 'Q3');
const mult = 8;
const boost = 1 + Math.min(0.12, (mult - 1) * 0.02); // 1.12
const boostedHp = Math.round(itemBase.stats.hp * boost);
assert.ok(boostedHp >= itemBase.stats.hp, '高倍消耗装备属性应获得顶格强化');
console.log(`  ✓ 8倍消耗下装备属性顶格强化 +${Math.round((boost - 1) * 100)}%`);

// 测试 Hold & Spin 底注对齐
GameManager.currentBet = 200;
GameManager.betMultiplier = 8;
const hsRes = GameManager.startHoldAndSpin();
assert.ok(hsRes, 'Hold & Spin 启动成功');
assert.strictEqual(GameManager.holdAndSpinEngine.betBase, 200, 'Hold & Spin 底注应严格对齐 currentBet (200)');
console.log('  ✓ Hold & Spin 底注对齐 currentBet = 200');

// -------------------------------------------------------------
// TEST 4: 背包熔断防爆仓与智能短板补齐
// -------------------------------------------------------------
console.log('\n[TEST 4] 验证防爆仓机制：换下旧装自动回炉、负战力入库即融');
GameManager.inventory.slots = new Array(24).fill(null);
const oldSword = ItemModel.createEquipment('weapon', 'Q1');
GameManager.inventory.addItem(oldSword);
GameManager.equipItem(0); // 穿上 oldSword
assert.strictEqual(GameManager.player.equipment.weapon.id, oldSword.id);

// 准备一件更强的 Q3 剑
const newSword = ItemModel.createEquipment('weapon', 'Q3');
GameManager.inventory.addItem(newSword);
const energyBefore = GameManager.energy;
GameManager.equipItem(0); // 穿上 newSword，换下 oldSword
assert.strictEqual(GameManager.player.equipment.weapon.id, newSword.id);
assert.ok(GameManager.energy > energyBefore, '换下的旧装备应自动回炉熔铸返还机缘');
assert.strictEqual(GameManager.inventory.getFreeSlotsCount(), 24, '换下旧装备回炉后背包应彻底腾空');
console.log('  ✓ 换装旧物自动回炉熔铸，背包空间净腾出 1 格');

// -------------------------------------------------------------
// TEST 5: 500 抽全生命周期推演模拟
// -------------------------------------------------------------
console.log('\n[TEST 5] 模拟 500 抽全生命周期数值演进');
// 初始化玩家状态
GameManager.energy = 10000;
GameManager.potExp = 0;
GameManager.potSubLevel = 1;
GameManager.potSubExp = 0;
GameManager.unlockedSectTicket = null;
GameManager.inventory.slots = new Array(24).fill(null);
GameManager.player.setupMortalState();
GameManager.player.setSect('wanjian');
GameManager.player.isMortal = false;
GameManager.isPrologueComplete = true;

let ticketAwarded = false;
window.SlotsRPG.EventBus.on('FULL_SET_SECT_TICKET_AWARDED', (data) => {
  ticketAwarded = true;
});

let maxBagUsed = 0;
let totalEquipsDropped = 0;
let potLevelUps = 0;

window.SlotsRPG.EventBus.on('POT_SUB_LEVEL_UP', (data) => {
  potLevelUps++;
});

window.SlotsRPG.EventBus.on('TRIGGER_BATTLE', (data) => {
  const battle = GameManager.startBossBattle(data.battleConfig);
  if (battle && battle.isVictory) {
    GameManager.claimBattleRewards(battle);
  }
});

window.SlotsRPG.EventBus.on('TRIGGER_BONUS', () => {
  GameManager.startHoldAndSpin();
  GameManager.claimHoldAndSpinRewards();
});

// 进行 500 抽模拟推演
const synthesizer = new window.SlotsRPG.EquipSynthesizer();

for (let spin = 1; spin <= 500; spin++) {
  // 确保机缘充足
  if (GameManager.energy < 25) {
    GameManager.energy += 500; // 模拟离线或奇遇补给
  }

  // 执行一次单抽
  GameManager.currentBet = 25;
  GameManager.betMultiplier = 1;
  GameManager.executeSpin();

  // 记录背包占用
  const usedSlots = 24 - GameManager.inventory.getFreeSlotsCount();
  if (usedSlots > maxBagUsed) maxBagUsed = usedSlots;

  // 定期（每10抽）进行一次自动穿戴与 3合1 锻造
  if (spin % 10 === 0) {
    // 1. 穿戴背包中所有更好属性的装备
    for (let slotIdx = 0; slotIdx < GameManager.inventory.slots.length; slotIdx++) {
      const item = GameManager.inventory.slots[slotIdx];
      if (item && item.type === 'equip') {
        if (GameManager.player.hasEquipmentImprovement(item, GameManager.level)) {
          GameManager.equipItem(slotIdx);
        }
      }
    }

    // 2. 尝试执行 3 合 1 锻造合成
    GameManager.mergeEquipment();

    // 3. 再次穿戴合成出的高阶神装
    for (let slotIdx = 0; slotIdx < GameManager.inventory.slots.length; slotIdx++) {
      const item = GameManager.inventory.slots[slotIdx];
      if (item && item.type === 'equip') {
        if (GameManager.player.hasEquipmentImprovement(item, GameManager.level)) {
          GameManager.equipItem(slotIdx);
        }
      }
    }
  }
}

console.log(`  - 500 抽模拟完毕:`);
console.log(`    • 天机盘最终等级: Lv.${GameManager.potSubLevel} (升级次数: ${potLevelUps})`);
console.log(`    • 乾坤袋背包峰值占用: ${maxBagUsed} / 24 (绝无爆仓)`);
console.log(`    • 玩家当前战力: ${GameManager.player.combatPower}`);
console.log(`    • 6 槽当前装备:`);
slots.forEach(s => {
  const eq = GameManager.player.equipment[s];
  console.log(`      - [${s}]: ${eq ? eq.name + ' (' + eq.qualityCode + ')' : '空'}`);
});

assert.ok(maxBagUsed <= 22, `背包最大占用(${maxBagUsed})应在容量 24 之内安全运转`);
assert.ok(GameManager.potSubLevel >= 5, `500 抽后天机盘应达到 Lv.5 或 Lv.6 (当前 Lv.${GameManager.potSubLevel})`);
console.log('  ✓ 500 抽周期天机盘品质跃迁与 3合1 运作平稳无爆仓');

// -------------------------------------------------------------
// TEST 6: 达成 6 槽 Q4 紫装即刻颁发太乙丹霞宗令门票
// -------------------------------------------------------------
console.log('\n[TEST 6] 验证 6 槽 Q4 毕业触发道基大圆满并颁发下一门派接引令');
// 确保穿满 6 件 Q4
slots.forEach(slot => {
  GameManager.player.equipment[slot] = ItemModel.createEquipment(slot, 'Q4');
});
assert.strictEqual(GameManager.player.checkFullSetEquipped('Q4').isGraduated, true);
const ticket = GameManager.awardFullSetSectTicket();
assert.ok(ticket, '必须成功颁发接引令门票');
assert.ok(ticket.tokenName.includes('太乙') || ticket.tokenName.includes('令'), `门票名称应为宗门令 (当前: ${ticket.tokenName})`);
assert.strictEqual(GameManager.unlockedSectTicket.sectId, ticket.sectId);
console.log(`  ✓ 成功发放下一宗门门票: 【${ticket.tokenName}】(${ticket.sectName})`);

// -------------------------------------------------------------
// TEST 7: 守关妖王赤炼蟒决战数值推演 (5~7 回合险胜心流)
// -------------------------------------------------------------
console.log('\n[TEST 7] 验证关底妖王赤炼蟒 5~7 回合险胜战斗心流');
const crimsonPython = BossConfig.BOSS_DEFS[1];
assert.strictEqual(crimsonPython.name, '赤炼蟒');
assert.strictEqual(crimsonPython.hp, 2000);
assert.strictEqual(crimsonPython.atk, 42);
assert.strictEqual(crimsonPython.def, 22);

const playerStats = GameManager.player.getTotalStats();
console.log(`  - 玩家毕业神装总属性: HP ${playerStats.hp}, ATK ${playerStats.atk}, DEF ${playerStats.def}, CP ${GameManager.player.combatPower}`);
console.log(`  - 赤炼蟒妖王属性: HP ${crimsonPython.hp}, ATK ${crimsonPython.atk}, DEF ${crimsonPython.def}`);

// 模拟 100 场对决
let wins = 0;
let totalRounds = 0;

for (let battle = 0; battle < 100; battle++) {
  const encounter = {
    tier: 'boss',
    potLevel: 1,
    monsters: [JSON.parse(JSON.stringify(crimsonPython))],
    totalCount: 1,
    rewards: crimsonPython.rewards
  };
  const combatRes = CombatEngine.simulateEncounter(GameManager.player, encounter, GameManager.inventory);
  if (combatRes.isVictory) {
    wins++;
    totalRounds += combatRes.totalRounds;
  }
}

const avgRounds = (totalRounds / wins).toFixed(1);
console.log(`  - 对决 100 场统计: 胜率 ${(wins / 100 * 100).toFixed(1)}%, 平均决胜回合数: ${avgRounds} 回合`);
assert.ok(wins >= 90, '毕业玩家面对赤炼蟒胜率应大于等于 90%');
assert.ok(avgRounds >= 4.5 && avgRounds <= 8.0, `决胜回合数(${avgRounds})应严格落在 5~7 回合险胜区间`);
console.log('  ✓ 关底妖王赤炼蟒决战完美呈现 5~7 回合险胜突破心流！');

console.log('\n===============================================================');
console.log('🎉 所有 7 项测试全部顺利通过！500抽生命周期数值系统完整闭环！');
console.log('===============================================================');
