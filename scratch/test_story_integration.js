// test_story_integration.js - 全面验证作弊器剧情主线大纲、网文动态弹幕与方案 A 闭环
const path = require('path');
const assert = require('assert');

// 模拟浏览器与 Storage 运行环境
const storageMap = {};
global.localStorage = {
  getItem(key) { return storageMap[key] || null; },
  setItem(key, val) { storageMap[key] = String(val); },
  removeItem(key) { delete storageMap[key]; },
  clear() { for (let k in storageMap) delete storageMap[k]; }
};

// 模拟 DOM 环境
function createMockElement(id = '', className = '') {
  return {
    id,
    className,
    innerText: '',
    innerHTML: '',
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
  'btn-story-skip': createMockElement('btn-story-skip')
};

global.document = {
  getElementById(id) {
    return mockDomElements[id] || createMockElement(id);
  },
  querySelector(sel) {
    if (sel === '.cheat-bubble') return createMockElement('', 'cheat-bubble');
    if (sel === '.cheat-avatar') return createMockElement('', 'cheat-avatar');
    return null;
  },
  createElement(tag) {
    return createMockElement('', tag);
  }
};

global.window = {
  SlotsRPG: {}
};

// 依序载入核心模块
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
require('../src/rpg/StoryConfig.js');
require('../src/rpg/StoryManager.js');
require('../src/core/GameManager.js');

const StoryConfig = window.SlotsRPG.StoryConfig;
const StoryManager = window.SlotsRPG.StoryManager;
const GameManager = window.SlotsRPG.GameManager;
const EventBus = window.SlotsRPG.EventBus;

console.log('===============================================================');
console.log('🧪 开始执行修仙作弊器剧情大纲与网文弹幕系统专项测试');
console.log('===============================================================');

// -------------------------------------------------------------
// 1. 测试 StoryConfig 语料库完整性
// -------------------------------------------------------------
console.log('\n[TEST 1] 校验 StoryConfig 配置项与网文语料');
assert.ok(StoryConfig, 'StoryConfig 必须存在');

// 校验 7 大主线剧情章节
const expectedChapters = [
  'prologue_intro',
  'prologue_awaken',
  'prologue_first_spin',
  'pot_promoted_ticket',
  'samsara_confirm',
  'ascension_ready',
  'ascension_complete'
];
expectedChapters.forEach(id => {
  const ch = StoryConfig.CHAPTERS[id];
  assert.ok(ch, `章节 ${id} 必须存在`);
  assert.ok(ch.title && ch.title.length > 0, `${id} 必须有标题`);
  assert.ok(ch.lines && ch.lines.length >= 2, `${id} 必须包含至少 2 行对白`);
});
console.log(`✅ 7 大主线核心章节结构完备，剧情文本详实！`);

// 校验 8 大宗门专属作弊器嘴炮吐槽
const sects = window.SlotsRPG.SectConfig.getAllSects();
sects.forEach(s => {
  const quote = StoryConfig.SECT_JOIN_REACTIONS[s.id];
  assert.ok(quote && quote.length > 5, `宗门 ${s.name}(${s.id}) 必须有专属作弊器吐槽`);
});
console.log(`✅ 8 大宗门专属入宗嘴炮语料齐全！`);

// 校验 11 大场景网文弹幕库
const chatterKeys = [
  'idle', 'spin_win', 'spin_big_win', 'spin_all_wild', 'spin_empty',
  'battle_crit', 'battle_danger', 'energy_empty', 'equip_merge', 'hold_spin', 'sect_ticket'
];
chatterKeys.forEach(k => {
  const list = StoryConfig.CHATTER[k];
  assert.ok(Array.isArray(list) && list.length >= 2, `语料库 [${k}] 必须存在且至少有 2 条文本`);
});
console.log(`✅ 11 大高频情境动态网文弹幕库 100% 覆盖！`);

// -------------------------------------------------------------
// 2. 测试 StoryManager 初始化与神念气泡更新
// -------------------------------------------------------------
console.log('\n[TEST 2] 验证 StoryManager 引擎绑定与顶栏气泡更新');
const gm = new GameManager.constructor();
gm.init();
StoryManager.init(gm);

assert.ok(StoryManager.gameManager, 'StoryManager 必须成功挂载 GameManager');
assert.ok(StoryManager.dom.cheatDialog, '必须成功获取 cheat-dialog 引用');

StoryManager.setCheatDialog('【天机作弊器】：“测试气泡吐纳。”');
assert.strictEqual(mockDomElements['cheat-dialog'].innerText, '【天机作弊器】：“测试气泡吐纳。”');
assert.ok(mockDomElements['cheat-dialog'].classList.contains('cheat-text-fade'), '必须包含淡入动画类');
console.log('✅ 作弊器神念气泡文字渲染与平滑动画无误！');

// -------------------------------------------------------------
// 3. 测试多步剧情对话弹窗演出 (Step-through & Skip)
// -------------------------------------------------------------
console.log('\n[TEST 3] 验证水墨剧情对话弹窗多步推进与跳过逻辑');
let storyCompleted = false;

StoryManager.showStoryDialog({
  title: '测试对白',
  speaker: '天机作弊器',
  speakerTitle: '造化灵识',
  lines: ['第一句对白：天地玄黄。', '第二句对白：宇宙洪荒。']
}, () => {
  storyCompleted = true;
});

assert.strictEqual(StoryManager.activeStory.isOpen, true, '剧情弹窗处于打开状态');
assert.strictEqual(mockDomElements['modal-story-dialog'].classList.contains('hidden'), false, '弹窗移除了 hidden');
assert.strictEqual(mockDomElements['story-dialog-text'].innerText, '第一句对白：天地玄黄。');
assert.strictEqual(mockDomElements['btn-story-next'].innerText, '下一步 ➔');

// 点击下一步
mockDomElements['btn-story-next'].click();
assert.strictEqual(StoryManager.activeStory.currentIndex, 1, '步进到第 2 句');
assert.strictEqual(mockDomElements['story-dialog-text'].innerText, '第二句对白：宇宙洪荒。');
assert.strictEqual(mockDomElements['btn-story-next'].innerText, '知 悉 (继续)');

// 再次点击完成剧情
mockDomElements['btn-story-next'].click();
assert.strictEqual(StoryManager.activeStory.isOpen, false, '剧情弹窗关闭');
assert.strictEqual(mockDomElements['modal-story-dialog'].classList.contains('hidden'), true, '弹窗重新添加 hidden');
assert.strictEqual(storyCompleted, true, '剧情完成回调必须被执行');
console.log('✅ 剧情弹窗分步推进与完成闭环完全正常！');

// -------------------------------------------------------------
// 4. 测试方案 A：升阶窃取门票与作弊器专属剧情
// -------------------------------------------------------------
console.log('\n[TEST 4] 验证方案 A：聚宝盆升阶 100% 窃取门票并触发作弊器专属破壁剧情');
gm.player.setSect('wanjian');

// 模拟击败赤炼蟒升阶
const mockBattleResult = {
  isVictory: true,
  boss: { id: 'boss_1', tier: 'boss', rewards: { exp: 500, energy: 500 } }
};

let summary = gm.claimBattleRewards(mockBattleResult);
assert.ok(summary.potPromoted, '聚宝盆必须升阶');
while (!gm.unlockedSectTicket) {
  summary = gm.claimBattleRewards(mockBattleResult);
}
assert.ok(gm.unlockedSectTicket, '必须成功截获新门票');

const stolenSectName = gm.unlockedSectTicket.sectName;
console.log(`截获门票宗门: 【${stolenSectName}】`);

// 验证弹窗是否被 StoryManager 自动唤起并格式化了门派名
assert.strictEqual(StoryManager.activeStory.isOpen, true, '作弊器破壁剧情必须被自动唤起');
assert.strictEqual(mockDomElements['story-dialog-title'].innerText, '主线 · 窃夺天机');
const firstLine = StoryManager.activeStory.lines[0];
assert.ok(firstLine.includes('天道防火墙刚才被本座强行撕开了一道大窟窿'), '必须呈现作弊器嚣张独白');
const secondLine = StoryManager.activeStory.lines[1];
assert.ok(secondLine.includes(stolenSectName), `第二句必须正确替换占位符包含宗门名【${stolenSectName}】`);
console.log(`✅ 作弊器破壁窃取门票剧情对白成功渲染: \n   ${secondLine}`);

// 点击跳过
mockDomElements['btn-story-skip'].click();
assert.strictEqual(StoryManager.activeStory.isOpen, false, '跳过按钮能正常关闭');

// -------------------------------------------------------------
// 5. 测试转盘与战斗事件自动驱动弹幕
// -------------------------------------------------------------
console.log('\n[TEST 5] 验证各种事件下顶栏气泡神念自动响应');

// 1. 气运之子大满贯
EventBus.emit('SPIN_COMPLETED', { totalWin: 5000, isAllWild: true, winMultiplier: 10 });
assert.ok(mockDomElements['cheat-dialog'].innerText.includes('天道') || mockDomElements['cheat-dialog'].innerText.includes('气运'), 'All Wild 语料触发');

// 2. 连线大奖
EventBus.emit('SPIN_COMPLETED', { totalWin: 800, isBigWin: true, winMultiplier: 4 });
assert.ok(mockDomElements['cheat-dialog'].innerText.length > 5, '大奖语料触发');

// 3. 空转
EventBus.emit('SPIN_COMPLETED', { totalWin: 0 });
assert.ok(mockDomElements['cheat-dialog'].innerText.length > 5, '空转语料触发');

// 4. 境界突破
EventBus.emit('LEVEL_UP', { newLevel: 3 });
assert.ok(mockDomElements['cheat-dialog'].innerText.includes('同门师妹') || mockDomElements['cheat-dialog'].innerText.includes('恐怖如斯'), '练气三层同门震惊语料触发');

// 5. 拜入门派
EventBus.emit('PROLOGUE_COMPLETED', { sectId: 'wanjian' });
assert.strictEqual(mockDomElements['cheat-dialog'].innerText, StoryConfig.SECT_JOIN_REACTIONS['wanjian']);

// 6. 兵解轮回
EventBus.emit('SAMSARA_COMPLETED', { sectName: '太乙丹霞宗' });
assert.ok(mockDomElements['cheat-dialog'].innerText.includes('太乙丹霞宗') && mockDomElements['cheat-dialog'].innerText.includes('20%先天道基'), '转生神念语料触发');

console.log('✅ 全部核心事件驱动弹幕语料分发 100% 验证通过！');

// 停止定时器防挂起
StoryManager.stopIdleChatterTimer();

console.log('\n===============================================================');
console.log('🎉 恭喜！剧情大纲与网文弹幕系统全部单元测试 100% 通过！');
console.log('===============================================================');
