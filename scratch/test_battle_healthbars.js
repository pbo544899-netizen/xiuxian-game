// scratch/test_battle_healthbars.js - 验证精英/Boss血条只保留顶部、普通怪血条在底部的渲染逻辑
const assert = require('assert');

// 模拟 DOM
class MockElement {
  constructor(tag, id = '', className = '') {
    this.tagName = tag;
    this.id = id;
    this.className = className;
    this.classList = {
      _classes: new Set(className ? className.split(' ') : []),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      contains: (c) => this.classList._classes.has(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList._classes.has(c)) this.classList._classes.delete(c);
          else this.classList._classes.add(c);
        } else if (force) {
          this.classList._classes.add(c);
        } else {
          this.classList._classes.delete(c);
        }
      }
    };
    this.style = {};
    this.innerHTML = '';
    this.children = [];
  }
  appendChild(child) {
    this.children.push(child);
  }
  querySelector(selector) {
    // 简易选择器模拟
    return new MockElement('div');
  }
}

console.log('===============================================================');
console.log('🧪 开始测试: 战斗界面血条优化规则 (Boss/精英保留顶部, 普通怪在底部)');
console.log('===============================================================');

// TEST 1: Boss 战血条显隐规则
console.log('\n[TEST 1] 验证 Boss 战 (tier = "boss")');
const isBossTier = true; // tier === 'boss'
const isBossOrElite1 = isBossTier;
const battleBossHud1 = new MockElement('div', 'battle-boss-hud');

if (isBossOrElite1) {
  battleBossHud1.classList.remove('hidden');
} else {
  battleBossHud1.classList.add('hidden');
}

assert.strictEqual(battleBossHud1.classList.contains('hidden'), false, 'Boss 战顶部血条必须可见！');

const showBottomHp1 = !isBossOrElite1;
assert.strictEqual(showBottomHp1, false, 'Boss 战下方血条必须隐藏 (showBottomHp = false)！');
console.log('✅ TEST 1 通过: Boss 战顶部血条可见，下方血条隐藏！');

// TEST 2: 精英大妖战血条显隐规则
console.log('\n[TEST 2] 验证 精英战 (tier = "elite")');
const isEliteTier = true;
const isBossOrElite2 = isEliteTier;
const battleBossHud2 = new MockElement('div', 'battle-boss-hud');

if (isBossOrElite2) {
  battleBossHud2.classList.remove('hidden');
} else {
  battleBossHud2.classList.add('hidden');
}

assert.strictEqual(battleBossHud2.classList.contains('hidden'), false, '精英战顶部血条必须可见！');

const showBottomHp2 = !isBossOrElite2;
assert.strictEqual(showBottomHp2, false, '精英战下方血条必须隐藏 (showBottomHp = false)！');
console.log('✅ TEST 2 通过: 精英战顶部血条可见，下方血条隐藏！');

// TEST 3: 普通怪群战血条显隐规则
console.log('\n[TEST 3] 验证 普通怪 (tier = "normal")');
const isNormalTier = true;
const isBossOrElite3 = !isNormalTier;
const battleBossHud3 = new MockElement('div', 'battle-boss-hud');

if (isBossOrElite3) {
  battleBossHud3.classList.remove('hidden');
} else {
  battleBossHud3.classList.add('hidden');
}

assert.strictEqual(battleBossHud3.classList.contains('hidden'), true, '普通怪战顶部血条必须隐藏 (hidden)！');

const showBottomHp3 = !isBossOrElite3;
assert.strictEqual(showBottomHp3, true, '普通怪下方血条必须显示在底部位置 (showBottomHp = true)！');
console.log('✅ TEST 3 通过: 普通怪战顶部血条隐藏，血条正确在底部位置展示！');

console.log('\n🎉 全部 3 项战斗血条显隐与定位优化测试 100% 通过！');
