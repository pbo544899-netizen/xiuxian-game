const assert = require('assert');

// 模拟 DOM
function createMockElement(id = '', className = '') {
  return {
    id,
    className,
    innerText: '',
    innerHTML: '',
    src: '',
    style: {},
    children: [],
    appendChild(child) { this.children = this.children || []; this.children.push(child); },
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
    addEventListener(evt, fn) { this._listeners = this._listeners || {}; this._listeners[evt] = fn; },
    click() { if (this._listeners && this._listeners['click']) this._listeners['click'](); }
  };
}

const mockDomElements = {
  'cheat-dialog': createMockElement('cheat-dialog'),
  'modal-story-dialog': createMockElement('modal-story-dialog', 'modal-overlay hidden'),
  'story-dialog-title': createMockElement('story-dialog-title'),
  'story-dialog-speaker': createMockElement('story-dialog-speaker'),
  'story-dialog-avatar': createMockElement('story-dialog-avatar'),
  'story-dialog-text': createMockElement('story-dialog-text'),
  'story-chat-stream': createMockElement('story-chat-stream'),
  'chat-input-preview': createMockElement('chat-input-preview'),
  'btn-story-next-text': createMockElement('btn-story-next-text'),
  'btn-story-next': createMockElement('btn-story-next'),
  'btn-story-skip': createMockElement('btn-story-skip'),
  'story-actor-player': createMockElement('story-actor-player', 'stage-actor actor-player'),
  'story-actor-cheat': createMockElement('story-actor-cheat', 'stage-actor actor-cheat active-speaker'),
  'actor-avatar-player-img': createMockElement('actor-avatar-player-img'),
  'actor-avatar-cheat-img': createMockElement('actor-avatar-cheat-img'),
  'actor-player-name': createMockElement('actor-player-name'),
  'actor-cheat-name': createMockElement('actor-cheat-name')
};

global.document = {
  getElementById(id) {
    return mockDomElements[id] || createMockElement(id);
  },
  querySelector(sel) {
    if (sel === '.cheat-bubble') return createMockElement('', 'cheat-bubble');
    if (sel === '.cheat-avatar') return createMockElement('', 'cheat-avatar');
    if (sel === '.story-theatre-card') return createMockElement('', 'story-theatre-card');
    return null;
  },
  createElement(tag) {
    return createMockElement('', tag);
  }
};

global.window = {
  SlotsRPG: {}
};

require('../src/core/EventBus.js');
require('../src/rpg/StoryConfig.js');
require('../src/rpg/StoryManager.js');

const StoryManager = window.SlotsRPG.StoryManager;
const StoryConfig = window.SlotsRPG.StoryConfig;

StoryManager.init();

console.log('--- 开始测试气泡舞台对话步进与聚光灯切换 ---');
let finished = false;
StoryManager.triggerChapter('prologue_intro', () => {
  finished = true;
});

// Line 0: cheat speaks
assert.strictEqual(StoryManager.activeStory.currentIndex, 0);
assert.strictEqual(mockDomElements['story-actor-cheat'].classList.contains('active-speaker'), true, 'Line 0: 作弊器聚光灯激活');
assert.strictEqual(mockDomElements['story-actor-player'].classList.contains('active-speaker'), false, 'Line 0: 宿主暗淡');
assert.strictEqual(mockDomElements['btn-story-next'].innerText, '下一步 ➔');

// Click next -> Line 1: player speaks
mockDomElements['btn-story-next'].click();
assert.strictEqual(StoryManager.activeStory.currentIndex, 1);
assert.strictEqual(mockDomElements['story-actor-player'].classList.contains('active-speaker'), true, 'Line 1: 宿主聚光灯激活');
assert.strictEqual(mockDomElements['story-actor-cheat'].classList.contains('active-speaker'), false, 'Line 1: 作弊器暗淡');

// Click next -> Line 2: cheat speaks
mockDomElements['btn-story-next'].click();
assert.strictEqual(StoryManager.activeStory.currentIndex, 2);
assert.strictEqual(mockDomElements['story-actor-cheat'].classList.contains('active-speaker'), true, 'Line 2: 作弊器聚光灯激活');
assert.strictEqual(mockDomElements['story-actor-player'].classList.contains('active-speaker'), false, 'Line 2: 宿主暗淡');

// Click next -> Line 3: player speaks (last line)
mockDomElements['btn-story-next'].click();
assert.strictEqual(StoryManager.activeStory.currentIndex, 3);
assert.strictEqual(mockDomElements['story-actor-player'].classList.contains('active-speaker'), true, 'Line 3: 宿主聚光灯激活');
assert.strictEqual(mockDomElements['story-actor-cheat'].classList.contains('active-speaker'), false, 'Line 3: 作弊器暗淡');
assert.strictEqual(mockDomElements['btn-story-next'].innerText, '知 悉 (继续)', '最后一句变为知悉继续');

// Click next -> finished
mockDomElements['btn-story-next'].click();
assert.strictEqual(StoryManager.activeStory.isOpen, false);
assert.strictEqual(finished, true, '完成回调顺利执行');

console.log('✅ 全部对白步进、双角色聚光灯高亮切换与闭环完全正确！');
StoryManager.stopIdleChatterTimer();
process.exit(0);
