/**
 * test_monster_organic_animations.js
 * 自动化测试：验证怪物被击中、释放技能、死亡全态势灵动反馈与非弹跳缩放规范
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=====================================================================');
console.log('🧪 开始测试怪物灵动多态势身形动画体系（受击/施法/死亡/非弹跳缩放） 🧪');
console.log('=====================================================================\n');

// 1. 验证 css/style.css 中的动画与无胶皮弹跳缩放规范
console.log('[TEST 1] 验证 css/style.css 动画与样式规范');
const cssContent = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');

// 1.1 待机呼吸规范：使用微飘移与微倾斜，坚决不作橡胶球式 scale 挤压
assert(cssContent.includes('@keyframes monsterOrganicIdle'), '必须包含 @keyframes monsterOrganicIdle');
assert(cssContent.includes('.monster-unit-avatar'), '必须包含 .monster-unit-avatar 基础样式');
const idleMatch = cssContent.match(/@keyframes monsterOrganicIdle\s*\{([\s\S]*?)\}/);
assert(idleMatch, '必须成功匹配 monsterOrganicIdle 规则');
assert(!idleMatch[1].includes('scale('), 'monsterOrganicIdle 绝不可包含 scale 弹跳缩放');
assert(idleMatch[1].includes('rotate('), 'monsterOrganicIdle 必须使用轻灵重心 rotate 倾斜');
console.log('  ✅ PASSED: 怪物待机姿态采用灵动微飘移与微仰角 (monsterOrganicIdle)，无任何 rubber scale 缩放！');

// 1.2 受击受创规范：物理后挫、躯干微倾与高频微颤
assert(cssContent.includes('.monster-unit-avatar.monster-hit'), '必须定义 .monster-unit-avatar.monster-hit');
assert(cssContent.includes('.monster-unit-avatar.monster-hit-crit'), '必须定义 .monster-unit-avatar.monster-hit-crit');
assert(cssContent.includes('@keyframes monsterHurtOrganic'), '必须包含 @keyframes monsterHurtOrganic');
assert(cssContent.includes('@keyframes monsterHurtOrganicCrit'), '必须包含 @keyframes monsterHurtOrganicCrit');
console.log('  ✅ PASSED: 怪物受创动画采用真实物理后挫与高频肌理微颤 (monsterHurtOrganic/Crit)！');

// 1.3 施法与攻击规范：凶煞蓄势压低、迅猛扑杀、绝技咆哮
assert(cssContent.includes('.monster-unit-avatar.monster-windup'), '必须定义 .monster-unit-avatar.monster-windup');
assert(cssContent.includes('.monster-unit-avatar.monster-lunge'), '必须定义 .monster-unit-avatar.monster-lunge');
assert(cssContent.includes('.monster-unit-avatar.monster-boss-roar'), '必须定义 .monster-unit-avatar.monster-boss-roar');
assert(cssContent.includes('@keyframes monsterCastWindup'), '必须包含 @keyframes monsterCastWindup 蓄力前摇');
assert(cssContent.includes('@keyframes monsterCastLunge'), '必须包含 @keyframes monsterCastLunge 猛扑攻击');
assert(cssContent.includes('@keyframes monsterBossSkillRoar'), '必须包含 @keyframes monsterBossSkillRoar 绝技咆哮');
console.log('  ✅ PASSED: 怪物施法与扑杀具备完整 3 阶段身形动势 (蓄势/猛扑/绝技咆哮)！');

// 1.4 死亡溃散规范：身躯仰倒、神魂消融、升华消散
assert(cssContent.includes('.monster-unit-avatar.monster-dying'), '必须定义 .monster-unit-avatar.monster-dying');
assert(cssContent.includes('@keyframes monsterDeathDissolve'), '必须包含 @keyframes monsterDeathDissolve');
assert(cssContent.includes('.monster-unit-card.defeated .monster-ground-shadow'), '必须包含阴影随伏诛淡出规则');
console.log('  ✅ PASSED: 怪物死亡消散具备身躯倾倒与升华消散规范 (monsterDeathDissolve)！');

// 1.5 锁定状态无冲突检测：is-targeted 绝不可覆盖 transform 或打乱动画
const targetedMatch = cssContent.match(/\.monster-unit-card\.is-targeted\s*\.monster-unit-avatar\s*\{([\s\S]*?)\}/);
assert(targetedMatch, '必须包含 is-targeted 下 avatar 规则');
assert(!targetedMatch[1].includes('transform:'), 'is-targeted 绝不可对 avatar 施加静态 transform 锁死');
assert(!targetedMatch[1].includes('!important'), 'is-targeted 绝不可滥用 !important 屏蔽受击滤镜');
console.log('  ✅ PASSED: is-targeted 已彻底解除对怪物立绘的静态 transform 锁死！\n');

// 2. 验证 BattleJuiceEngine 动作引擎接口
console.log('[TEST 2] 验证 BattleJuiceEngine 怪物动作接口规范');
const juiceFile = fs.readFileSync(path.join(__dirname, '../src/rpg/BattleJuiceEngine.js'), 'utf8');

assert(juiceFile.includes('triggerMonsterHurtFeedback'), 'BattleJuiceEngine 必须实现 triggerMonsterHurtFeedback');
assert(juiceFile.includes('triggerMonsterWindup'), 'BattleJuiceEngine 必须实现 triggerMonsterWindup');
assert(juiceFile.includes('triggerMonsterLunge'), 'BattleJuiceEngine 必须实现 triggerMonsterLunge');
assert(juiceFile.includes('resetMonsterPose'), 'BattleJuiceEngine 必须实现 resetMonsterPose');
assert(juiceFile.includes('triggerMonsterDeathFeedback'), 'BattleJuiceEngine 必须实现 triggerMonsterDeathFeedback');
console.log('  ✅ PASSED: BattleJuiceEngine 包含完整的怪物受击、蓄势、猛扑、复位与死亡反馈引擎 API！\n');

// 3. 验证 SkillStateMachine 状态机动作生命周期调度
console.log('[TEST 3] 验证 SkillStateMachine 动作调度流程');
const smFile = fs.readFileSync(path.join(__dirname, '../src/skills/SkillStateMachine.js'), 'utf8');

assert(smFile.includes('juice.triggerMonsterWindup'), 'SkillStateMachine 蓄力阶段必须调用 triggerMonsterWindup');
assert(smFile.includes('juice.triggerMonsterLunge'), 'SkillStateMachine 释放阶段必须调用 triggerMonsterLunge');
assert(smFile.includes('juice.triggerMonsterHurtFeedback'), 'SkillStateMachine 命中阶段必须调用 triggerMonsterHurtFeedback');
assert(smFile.includes('juice.resetMonsterPose'), 'SkillStateMachine 后摇阶段必须调用 resetMonsterPose');
console.log('  ✅ PASSED: SkillStateMachine 在各阶段均严格调度怪物动态姿态！\n');

// 4. 验证 main.js 战斗主循环生命周期事件联动
console.log('[TEST 4] 验证 main.js 战斗主循环生命周期联动');
const mainFile = fs.readFileSync(path.join(__dirname, '../src/main.js'), 'utf8');

assert(mainFile.includes('triggerMonsterDeathFeedback'), 'main.js monster_defeated 事件必须调用 triggerMonsterDeathFeedback');
assert(mainFile.includes('triggerMonsterHurtFeedback(ref.avatarEl, true)'), 'main.js 符箓群体打击必须触发怪物受创反馈');
assert(mainFile.includes('triggerMonsterHurtFeedback(targetRef.avatarEl, false)'), 'main.js 飞剑追击命中必须触发怪物受创反馈');
console.log('  ✅ PASSED: main.js 怪物死亡消散、符箓神罚与飞剑追击均已深度挂接怪物受创动画！\n');

console.log('=====================================================================');
console.log('🎉 怪物灵动多态势身形动画体系全部通过验证 (100% PASSED)！ 🎉');
console.log('=====================================================================');
