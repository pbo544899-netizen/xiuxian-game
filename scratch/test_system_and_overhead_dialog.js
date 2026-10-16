// scratch/test_system_and_overhead_dialog.js
// 验证“系统”角色设计、头顶聊天泡泡舞台以及战斗力不足等事件提示
const assert = require('assert');

// 1. 模拟 DOM
const domNodes = {};
function getOrCreateMockElement(id, className = '') {
  if (domNodes[id]) return domNodes[id];
  const el = {
    id,
    className,
    innerText: '',
    innerHTML: '',
    style: {},
    children: [],
    appendChild(child) { this.children.push(child); },
    classList: {
      classes: new Set(className ? className.split(' ') : []),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); },
      toggle(c, force) {
        if (force !== undefined) {
          if (force) this.classes.add(c); else this.classes.delete(c);
        } else {
          if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c);
        }
      }
    },
    addEventListener(evt, fn) {
      this._listeners = this._listeners || {};
      this._listeners[evt] = fn;
    },
    click() {
      if (this._listeners && this._listeners['click']) this._listeners['click']();
    }
  };
  domNodes[id] = el;
  return el;
}

global.document = {
  getElementById(id) {
    return getOrCreateMockElement(id);
  },
  querySelector(sel) {
    if (sel.startsWith('#')) return getOrCreateMockElement(sel.slice(1));
    if (sel === '.cheat-bubble') return getOrCreateMockElement('mock-cheat-bubble', 'cheat-bubble');
    if (sel === '.cheat-avatar') return getOrCreateMockElement('mock-cheat-avatar', 'cheat-avatar');
    if (sel === '.story-theatre-card') return getOrCreateMockElement('story-overhead-theatre', 'story-overhead-theatre');
    return null;
  },
  querySelectorAll() { return []; },
  createElement(tag) { return getOrCreateMockElement(`mock-${tag}-${Math.random()}`); }
};

global.SlotsRPG = {};
global.window = {
  SlotsRPG: global.SlotsRPG,
  addEventListener() {}
};

// 引入模块
require('../src/core/EventBus.js');
const StoryConfig = require('../src/rpg/StoryConfig.js');
const StoryManager = require('../src/rpg/StoryManager.js');

console.log('====================================================');
console.log('🧪 开始执行“系统”角色与头顶聊天气泡剧情系统专项检验');
console.log('====================================================');

// [TEST 1] 校验 StoryConfig 中的“系统”角色设定与全量章节对白
console.log('\n[TEST 1] 验证 StoryConfig 角色配置与网文对白设定');
assert.ok(StoryConfig.ROLES.system, 'ROLES 必须包含 system');
assert.strictEqual(StoryConfig.ROLES.system.name, '系统', '系统角色名称必须为“系统”');
assert.ok(StoryConfig.ROLES.system.avatar.includes('cheat_system_spirit.png'), '系统头像必须为灵识图片');
assert.ok(StoryConfig.SYSTEM_TIPS.power_low, '必须配置战斗力不足警示语料');
assert.ok(StoryConfig.SYSTEM_TIPS.stage_clear, '必须配置通关大捷语料');
assert.ok(StoryConfig.SYSTEM_TIPS.boss_defeated, '必须配置妖王诛灭语料');
console.log('✅ StoryConfig 系统角色与专属提示语料库校验通过！');

// [TEST 2] 验证 StoryManager 初始化与 DOM 挂载
console.log('\n[TEST 2] 验证 StoryManager 初始化与头顶气泡节点缓存');
StoryManager.init({ isPrologueComplete: true });
assert.ok(StoryManager.dom.modalStoryDialog, '必须成功缓存 modalStoryDialog');
assert.ok(StoryManager.dom.playerBubble, '必须成功缓存林凡头顶气泡');
assert.ok(StoryManager.dom.systemBubble, '必须成功缓存系统头顶气泡');
assert.ok(StoryManager.dom.playerBubbleText, '必须成功缓存林凡气泡文本节点');
assert.ok(StoryManager.dom.systemBubbleText, '必须成功缓存系统气泡文本节点');
assert.ok(StoryManager.dom.systemTipToast, '必须成功缓存系统灵犀提示浮窗');
console.log('✅ StoryManager 节点缓存完整无遗漏！');

// [TEST 3] 验证沉浸式头顶聊天气泡舞台：交替发言与焦点高亮
console.log('\n[TEST 3] 验证林凡与系统交替对白、头顶气泡与角色焦点切换');
const testDialog = {
  title: '序章 · 神盘认主',
  speaker: '系统',
  dialogue: [
    { sender: 'player', name: '宿主 (林凡)', text: '我乃一介凡夫，真能逆天改命？' },
    { sender: 'system', name: '系统', text: '叮！本系统已苏醒，今日助宿主踏碎九重天！' },
    { sender: 'player', name: '宿主 (林凡)', text: '太好了，有系统在，仙路何愁！' }
  ]
};

let completeCalled = false;
StoryManager.showStoryDialog(testDialog, () => {
  completeCalled = true;
});

// 第 1 句：林凡发言
assert.strictEqual(StoryManager.activeStory.isOpen, true, '剧情舞台处于开启状态');
assert.strictEqual(StoryManager.dom.actorPlayer.classList.contains('active-speaker'), true, '林凡立绘为 active-speaker');
assert.strictEqual(StoryManager.dom.actorCheat.classList.contains('active-speaker'), false, '系统立绘非 active-speaker');
assert.strictEqual(StoryManager.dom.playerBubbleText.innerText, '我乃一介凡夫，真能逆天改命？', '林凡头顶气泡文本正确');
assert.strictEqual(StoryManager.dom.actorPlayerName.innerText, '宿主 (林凡)', '林凡名牌正确');

// 点击推进到第 2 句：系统发言
StoryManager.advanceStoryLine();
assert.strictEqual(StoryManager.dom.actorCheat.classList.contains('active-speaker'), true, '系统立绘切换为 active-speaker');
assert.strictEqual(StoryManager.dom.actorPlayer.classList.contains('active-speaker'), false, '林凡立绘取消 active-speaker');
assert.strictEqual(StoryManager.dom.systemBubbleText.innerText, '叮！本系统已苏醒，今日助宿主踏碎九重天！', '系统头顶气泡文本正确');
assert.strictEqual(StoryManager.dom.actorCheatName.innerText, '系统', '系统名牌正确');

// 点击推进到第 3 句：林凡再次发言
StoryManager.advanceStoryLine();
assert.strictEqual(StoryManager.dom.actorPlayer.classList.contains('active-speaker'), true, '林凡立绘重新变为 active-speaker');
assert.strictEqual(StoryManager.dom.playerBubbleText.innerText, '太好了，有系统在，仙路何愁！');

// 点击推进完结
StoryManager.advanceStoryLine();
assert.strictEqual(StoryManager.activeStory.isOpen, false, '剧情舞台顺利关闭');
assert.strictEqual(completeCalled, true, '完成回调顺利执行');
console.log('✅ 头顶聊天气泡轮流弹入与立绘聚光灯联动正常！');

// [TEST 4] 验证系统灵犀提示浮窗 (#system-tip-toast) 与战力不足等事件触发
console.log('\n[TEST 4] 验证系统灵犀提示浮窗与战力预警触发');
StoryManager.showSystemTip('power_low', { playerPower: 1200, recPower: 1800 });
assert.strictEqual(StoryManager.dom.systemTipToast.classList.contains('hidden'), false, '系统浮窗移除 hidden 显示');
assert.ok(StoryManager.dom.systemTipText.innerText.includes('1200') && StoryManager.dom.systemTipText.innerText.includes('1800'), '战力预警包含正确数值');
assert.strictEqual(StoryManager.dom.systemTipBadge.innerText, '⚠️【系统警示】', '战力预警勋章正确');

// 触发通关大捷提示
StoryManager.showSystemTip('stage_clear', { stage: 5 });
assert.ok(StoryManager.dom.systemTipText.innerText.includes('第 5 关'), '通关贺报包含关卡信息');
assert.strictEqual(StoryManager.dom.systemTipBadge.innerText, '🎉【系统贺报】', '大捷勋章正确');

// 关闭提示
StoryManager.hideSystemTip();
assert.strictEqual(StoryManager.dom.systemTipToast.classList.contains('hidden'), true, '隐藏提示正常生效');
console.log('✅ 系统实时灵犀提示浮窗与动态格式化运作完美！');

console.log('\n🎉 所有测试均 100% 通过！“系统”角色设计与角色头顶聊天泡泡舞台全部就绪！\n');
