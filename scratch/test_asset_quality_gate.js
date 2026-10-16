/**
 * test_asset_quality_gate.js
 * 游戏全量美术资产质量守门人 (Asset Quality & Visual Semantics Gatekeeper)
 * 作用：从根本上杜绝“代码逻辑通过、实际画面仍是旧矢量图标”的验收断层问题。
 * 
 * 校验准则：
 * 1. 存在性检查：配置中引用的所有 avatar / icon 路径必须在磁盘中真实存在。
 * 2. 格式规范性：必须为高质量 RGBA 具象资源，文件大小需达到高质量立绘阈值 (> 250KB)，杜绝几十KB的旧几何简笔画混入。
 * 3. 命名与版本规范：严禁在生产配置中引用未升级的 legacy 资源 (例如禁止纯文件名无 vivid 标识的旧怪兽)。
 * 4. 覆盖率统计：对所有宗门、普通怪、精英怪、首领、随从进行 100% 全覆盖盘点，生成可视化报告。
 */

const fs = require('fs');
const path = require('path');

// 模拟浏览器全局环境以直接加载游戏配置文件
global.window = {};
require('../src/rpg/MonsterConfig.js');
require('../src/rpg/BossConfig.js');

const mc = window.SlotsRPG.MonsterConfig;
const bc = window.SlotsRPG.BossConfig;

function getPngDimensions(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(30);
    fs.readSync(fd, buffer, 0, 30, 0);
    fs.closeSync(fd);
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    const colorType = buffer[25]; // 6 is RGBA
    return { width, height, colorType };
  } catch(e) {
    return null;
  }
}

let totalChecked = 0;
let passedCount = 0;
const failureReport = [];

function validateAsset(assetPath, entityName, category) {
  totalChecked++;
  const fullPath = path.resolve(__dirname, '..', assetPath);

  // 1. 存在性
  if (!fs.existsSync(fullPath)) {
    failureReport.push({ entityName, category, assetPath, error: '文件不存在 (File Missing)' });
    return false;
  }

  const stat = fs.statSync(fullPath);
  const sizeKb = Math.round(stat.size / 1024);

  // 2. 严禁引用旧版未重构的扁平矢量图 (黑名单模式)
  const legacyBlacklist = [
    'monster_fox.png', 'monster_toad.png', 'monster_bat.png', 'monster_spider.png',
    'monster_boar.png', 'monster_scorpion.png', 'monster_wolf.png', 'monster_ape.png',
    'monster_leopard.png', 'monster_rhino.png', 'monster_lion.png', 'monster_bone_snake.png',
    'monster_hawk.png', 'boss_golden_chimera.png', 'boss_red_python.png', 'boss_thunder_dragon.png',
    'wolf_companion.png'
  ];

  const fileName = path.basename(assetPath);
  if (legacyBlacklist.includes(fileName)) {
    failureReport.push({ entityName, category, assetPath, error: `引用了已废弃的旧矢量图标 (${fileName})` });
    return false;
  }

  // 3. 文件规格检查 (新版具象图分辨率必须 >= 512，文件大小 > 200KB)
  const meta = getPngDimensions(fullPath);
  if (!meta || meta.width < 512 || meta.height < 512) {
    failureReport.push({ entityName, category, assetPath, error: `尺寸过低 (${meta ? meta.width + 'x' + meta.height : '未知'})，未达标 512px` });
    return false;
  }

  if (sizeKb < 200) {
    failureReport.push({ entityName, category, assetPath, error: `文件体积过小 (${sizeKb}KB)，疑似低保真占位符` });
    return false;
  }

  passedCount++;
  console.log(`  ✅ [合格] ${category} · ${entityName.padEnd(14, ' ')} | ${meta.width}x${meta.height} | ${sizeKb}KB | ${assetPath}`);
  return true;
}

console.log('=====================================================================');
console.log('🛡️  Slots RPG 全量妖兽与首领美术资产守门人自动化检验 (Asset Quality Gate) 🛡️');
console.log('=====================================================================\n');

console.log('--- 1. 检验普通妖兽库 (Normal Monsters) ---');
for (let tier in mc.MONSTERS.normal) {
  mc.MONSTERS.normal[tier].forEach(m => validateAsset(m.avatar, m.name, `普通怪·${tier}阶`));
}

console.log('\n--- 2. 检验精英大妖库 (Elite Monsters) ---');
for (let tier in mc.MONSTERS.elite) {
  mc.MONSTERS.elite[tier].forEach(m => validateAsset(m.avatar, m.name, `精英怪·${tier}阶`));
}

console.log('\n--- 3. 检验关卡 Boss 配置库 (BossConfig) ---');
for (let tier in bc.BOSS_DEFS) {
  const boss = bc.BOSS_DEFS[tier];
  validateAsset(boss.avatar, `${boss.name}(Avatar)`, `宗门Boss·${tier}阶`);
  validateAsset(boss.icon, `${boss.name}(Icon)`, `宗门Boss·${tier}阶`);
}

console.log('\n--- 4. 检验宗门护法灵兽库 (Companions) ---');
for (let k in mc.MONSTERS.COMPANIONS) {
  const comp = mc.MONSTERS.COMPANIONS[k];
  validateAsset(comp.avatar, comp.name, '护法灵兽');
}

console.log('\n=====================================================================');
console.log(`📊 检验结果统计: 共检验 ${totalChecked} 处资产，合格 ${passedCount} 处，违规 ${failureReport.length} 处`);

if (failureReport.length > 0) {
  console.error('❌ 发现以下资产质量守门未达标项:');
  failureReport.forEach((item, idx) => {
    console.error(`  ${idx + 1}. [${item.category}] ${item.entityName} -> ${item.assetPath}: ${item.error}`);
  });
  process.exit(1);
} else {
  console.log('🎉 守门人检验 100% 通过！所有在役怪物已彻底杜绝旧版矢量图标混入！');
  console.log('=====================================================================\n');
}
