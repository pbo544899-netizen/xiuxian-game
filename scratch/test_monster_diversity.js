// scratch/test_monster_diversity.js - 验证多怪物遭遇阵列形象异化与绝不重复
const assert = require('assert');

global.window = { SlotsRPG: {} };
require('../src/rpg/MonsterConfig.js');

const MonsterConfig = window.SlotsRPG.MonsterConfig;

console.log('===============================================================');
console.log('🧪 验证多怪物遭遇阵列异形异态与头像去重机制');
console.log('===============================================================');

// 1. 测试 5 只普通小怪遭遇战
console.log('\n[TEST 1] 验证 5 只普通群怪阵列物种绝对互不相同');
const encounterNormal = MonsterConfig.createEncounter({ tier: 'normal', count: 5 });
assert.strictEqual(encounterNormal.monsters.length, 5, '应该生成 5 只怪兽');

const avatars = encounterNormal.monsters.map(m => m.avatar);
const uniqueAvatars = new Set(avatars);
console.log('生成的怪兽阵容:');
encounterNormal.monsters.forEach((m, idx) => {
  console.log(`  第 ${idx + 1} 位: 【${m.name}】 -> ${m.avatar}`);
});

assert.strictEqual(uniqueAvatars.size, 5, '5 只怪兽的头像与物种立绘必须完全互不相同！');
console.log('✅ 测试 1 通过: 5 只普通怪兽物种完全异化，头像绝无重复！');

// 2. 测试 2 只精英大妖遭遇战
console.log('\n[TEST 2] 验证 2 只精英怪阵列物种互不相同');
const encounterElite = MonsterConfig.createEncounter({ tier: 'elite', count: 2 });
assert.strictEqual(encounterElite.monsters.length, 2, '应该生成 2 只精英怪');

const eliteAvatars = encounterElite.monsters.map(m => m.avatar);
console.log('生成的精英阵容:');
encounterElite.monsters.forEach((m, idx) => {
  console.log(`  第 ${idx + 1} 位: 【${m.name}】 -> ${m.avatar}`);
});
assert.strictEqual(new Set(eliteAvatars).size, 2, '2 只精英大妖的头像必须互不相同！');
console.log('✅ 测试 2 通过: 精英怪兽阵容异化成功！');

console.log('\n===============================================================');
console.log('🎉 多怪兽阵容异构去重专项测试 100% 通过！');
console.log('===============================================================');
