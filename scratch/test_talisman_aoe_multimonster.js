global.window = { SlotsRPG: {} };
require('../src/core/EventBus.js');
require('../src/rpg/SectConfig.js');
require('../src/skills/SectSkillRegistry.js');
require('../src/inventory/ItemModel.js');
require('../src/inventory/InventoryManager.js');
require('../src/character/PlayerModel.js');
require('../src/rpg/MonsterConfig.js');
require('../src/rpg/CombatEngine.js');

const CombatEngine = window.SlotsRPG.CombatEngine;
const CombatSession = window.SlotsRPG.CombatSession;

class MockInventory {
  constructor(initial = {}) {
    this.items = {
      pill: { hp: initial.pill || 0 },
      rune: { SYM_01: 0, SYM_02: 0, SYM_03: initial.talisman || 0 }
    };
  }
  getItemAmount(type, id) {
    return (this.items[type] && this.items[type][id]) || 0;
  }
  consumeItem(type, id, count = 1) {
    if (this.getItemAmount(type, id) >= count) {
      this.items[type][id] -= count;
      return true;
    }
    return false;
  }
}

console.log('===============================================================');
console.log('⚡ 验证破魔符【方案 A：九天雷劫 · 全场 AOE 雷轰】专项测试');
console.log('===============================================================');

const PlayerModel = window.SlotsRPG.PlayerModel;

// 场景 1: 面对 3 只不同血量的群怪（如 噬血蝠 100 HP, 赤灵狐 120 HP, 狂暴野猪 200 HP）
const player = new PlayerModel();
player.setSect('wanjian');

const monstersGroup = [
  { id: 'bat', name: '噬血蝠', hp: 100, maxHp: 100, atk: 15, def: 5, exp: 20 },
  { id: 'fox', name: '赤灵狐', hp: 120, maxHp: 120, atk: 18, def: 6, exp: 25 },
  { id: 'boar', name: '狂暴野猪', hp: 200, maxHp: 200, atk: 25, def: 10, exp: 40 }
];

const invGroup = new MockInventory({ talisman: 2, pill: 1 });
const sessionGroup = new CombatSession(player, { monsters: monstersGroup, tier: 'mob' }, invGroup);

console.log('\n[TEST 1] 群怪场景（3 只怪存活）：使用破魔符');
console.log(`初始群妖状态:`);
monstersGroup.forEach((m, idx) => console.log(`  怪[${idx}] ${m.name}: ${m.hp}/${m.maxHp}`));

const round1Result = sessionGroup.executeRound('talisman');

// 查找破魔符事件
const talEv = round1Result.roundEvents.find(e => e.type === 'talisman_strike');
if (!talEv) {
  console.error('❌ 未找到 talisman_strike 事件！');
  process.exit(1);
}

console.log(`\n破魔符事件: isAOE=${talEv.isAOE}, targetCount=${talEv.targetCount}, 总伤害=${talEv.damage}`);
console.log(`文字描述: ${talEv.text}`);

// 校验每只怪物的伤害: 30% maxHp
// 噬血蝠: 100 * 0.30 = 30 -> 保底 35
// 赤灵狐: 120 * 0.30 = 36
// 狂暴野猪: 200 * 0.30 = 60
// 总伤害 = 35 + 36 + 60 = 131
let passAoeDmg = true;
talEv.targets.forEach(t => {
  console.log(`  目标 [${t.targetIndex}] ${t.monster.name}: 受到 -${t.damage} 天雷伤害, 剩余气血 ${t.remainingHp}/${t.maxHp}`);
  if (t.targetIndex === 0 && t.damage !== 35) {
    console.error(`❌ 噬血蝠伤害期望 35 (保底)，实际为 ${t.damage}`);
    passAoeDmg = false;
  }
  if (t.targetIndex === 1 && t.damage !== 36) {
    console.error(`❌ 赤灵狐伤害期望 36，实际为 ${t.damage}`);
    passAoeDmg = false;
  }
  if (t.targetIndex === 2 && t.damage !== 60) {
    console.error(`❌ 狂暴野猪伤害期望 60，实际为 ${t.damage}`);
    passAoeDmg = false;
  }
});

if (!passAoeDmg || talEv.damage !== 131) {
  console.error('❌ AOE 数值计算不符合预期！');
  process.exit(1);
}
console.log('✅ 群怪 AOE 每只怪 30%（保底 35）真实全场命中！');

// 校验使用破魔符后是否占了一回合（即当前回合为 1，主角本回合未进行普攻剑斩）
const hasPlayerAttack = round1Result.roundEvents.some(e => e.type === 'normal' && e.turn === 'player');
if (hasPlayerAttack) {
  console.error('❌ 破魔符回合不应再产生普通攻击！');
  process.exit(1);
}
console.log('✅ 使用破魔符占用 1 回合规范成立（无普通剑招叠加）！');

// 校验妖兽反击：3 只怪均未阵亡，因此 3 只怪在同回合反击
const monsterHits = round1Result.roundEvents.filter(e => e.turn === 'monster');
console.log(`妖兽反击段数: ${monsterHits.length} (期望 3 段)`);
if (monsterHits.length !== 3) {
  console.error(`❌ 妖兽反击段数异常！期望 3，实际 ${monsterHits.length}`);
  process.exit(1);
}
console.log('✅ 存活妖兽正常进行回合反击！');


// 场景 2: 敌怪濒死时，AOE 击杀判定
console.log('\n[TEST 2] 验证 AOE 击杀即刻判定 monster_defeated 与大捷');
// 将噬血蝠和赤灵狐血量调低至 20
monstersGroup[0].currentHp = 20;
monstersGroup[1].currentHp = 20;
monstersGroup[2].currentHp = 50; // 野猪 50 HP，受 60 伤害也将被秒杀！

const round2Result = sessionGroup.executeRound('talisman');
const defeatedEvs = round2Result.roundEvents.filter(e => e.type === 'monster_defeated');
console.log(`雷劫击杀怪物数量: ${defeatedEvs.length} 只`);
defeatedEvs.forEach(d => console.log(`  ${d.text}`));

if (defeatedEvs.length !== 3) {
  console.error(`❌ 期望击杀 3 只，实际击杀 ${defeatedEvs.length}`);
  process.exit(1);
}
if (!round2Result.isOver || !round2Result.isVictory) {
  console.error('❌ 全灭后应立即结算伏妖大捷！');
  process.exit(1);
}
console.log('✅ AOE 神雷全灭群妖即刻判定胜利！');


// 场景 3: 单体 Boss 场景（单怪时 35% 最大气血）
console.log('\n[TEST 3] 验证单体 Boss 场景（保留 35% 最大气血重创）');
const singleBoss = [{ id: 'boss_dragon', name: '万年毒蛟', hp: 1000, maxHp: 1000, atk: 40, def: 20 }];
const singleInv = new MockInventory({ talisman: 1 });
const sessionBoss = new CombatSession(player, { monsters: singleBoss, tier: 'boss' }, singleInv);

const bossRound = sessionBoss.executeRound('talisman');
const bossTalEv = bossRound.roundEvents.find(e => e.type === 'talisman_strike');

console.log(`单体 Boss 破魔符伤害: ${bossTalEv.damage} (期望 1000 * 0.35 = 350)`);
if (bossTalEv.damage !== 350 || bossTalEv.isAOE !== false) {
  console.error('❌ 单体 Boss 伤害计算不符合预期！');
  process.exit(1);
}
console.log('✅ 单体 Boss 35% 轰顶计算正确！');

console.log('\n===============================================================');
console.log('🎉 破魔符【方案 A：九天雷劫 · 全场 AOE 雷轰】全场景验证 100% 通过！');
console.log('===============================================================');
