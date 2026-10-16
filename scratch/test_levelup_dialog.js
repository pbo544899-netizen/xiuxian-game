global.window = {
  SlotsRPG: {}
};

require('../src/character/PlayerModel.js');
const PlayerModel = window.SlotsRPG.PlayerModel;

const player = new PlayerModel();
console.log('--- 初始属性 ---');
console.log('Level:', player.level, player.realmName);
console.log('Stats:', player.getTotalStats());
console.log('Power:', player.combatPower);

const levelUps = player.addExp(150);
console.log('\n--- 触发升级后的 levelUps ---');
console.log(JSON.stringify(levelUps, null, 2));

if (levelUps.length > 0) {
  const first = levelUps[0];
  const latest = levelUps[levelUps.length - 1];

  const oldRealm = first.oldRealm;
  const newRealm = latest.newRealm;
  const oldPower = first.oldPower;
  const newPower = latest.newPower;
  const powerDiff = newPower - oldPower;

  const oldStats = first.oldStats;
  const newStats = latest.newStats;
  const hpDiff = newStats.hp - oldStats.hp;
  const atkDiff = newStats.atk - oldStats.atk;
  const defDiff = newStats.def - oldStats.def;

  console.log('\n--- 对比计算验证 ---');
  console.log(`境界跃迁: ${oldRealm} ➔ ${newRealm}`);
  console.log(`综合战力: ${oldPower} ➔ ${newPower} (+${powerDiff})`);
  console.log(`气血上限: ${oldStats.hp} ➔ ${newStats.hp} (+${hpDiff})`);
  console.log(`基础攻击: ${oldStats.atk} ➔ ${newStats.atk} (+${atkDiff})`);
  console.log(`基础防御: ${oldStats.def} ➔ ${newStats.def} (+${defDiff})`);

  if (oldPower === 75 && newPower === 82 && powerDiff === 7 && hpDiff === 12 && atkDiff === 2 && defDiff === 1) {
    console.log('\n✅ 升级对比数据与预期完全一致！');
  } else {
    console.error('❌ 数据不符合预期');
    process.exit(1);
  }
}
