/**
 * SkillPipeline.js - 核心声明式生命周期钩子管线
 * 负责分发和调度所有宗门心法、战斗事件与转盘概率异变
 * 彻底消除业务引擎中与具体宗门相关的硬编码分支判断
 */
window.SlotsRPG = window.SlotsRPG || {};

class SkillPipeline {
  constructor() {
    this.handlers = {
      // 战斗生命周期钩子
      ON_BATTLE_START: [],       // 战斗开局触发 (护盾施加、宠物召唤、削弱光环)
      BEFORE_PLAYER_ATTACK: [],  // 玩家攻击结算前 (残血增伤、扣血增伤、暴击修正)
      AFTER_PLAYER_ATTACK: [],   // 玩家攻击结算后 (连环追击、灵宠扑咬、溅射魔火)
      ON_TAKE_DAMAGE: [],        // 玩家受击结算 (护盾抵消、致命伤免死草人)
      ON_ENEMY_KILLED: [],       // 击破单只敌人 (战力临时叠加、掉落加成)
      ON_BATTLE_VICTORY: [],     // 战胜结算 (机缘返还、额外战利品)
      
      // 转盘生命周期钩子
      ON_REEL_WEIGHT_CALC: [],   // 计算滚轮符号基础权重时微调
      ON_SPIN_EVALUATED: [],     // 转盘连线结算后 (机缘倍增、大奖爆发)
      ON_SPIN_NO_WIN: []         // 转盘空转未中奖时 (草木回灵凝聚仙丹)
    };
  }

  /**
   * 注册钩子处理器
   * @param {string} hookName - 钩子名称
   * @param {Function} handler - 处理函数
   * @param {number} priority - 优先级 (默认 10，越小越先执行)
   * @param {string} id - 唯一标识，方便检索或卸载
   */
  register(hookName, handler, priority = 10, id = '') {
    if (!this.handlers[hookName]) {
      this.handlers[hookName] = [];
    }
    this.handlers[hookName].push({ handler, priority, id });
    // 按优先级升序排序
    this.handlers[hookName].sort((a, b) => a.priority - b.priority);
  }

  /**
   * 卸载特定 ID 的钩子处理器
   */
  unregister(id) {
    if (!id) return;
    for (const hookName in this.handlers) {
      this.handlers[hookName] = this.handlers[hookName].filter(item => item.id !== id);
    }
  }

  /**
   * 清除所有动态注册的处理器
   */
  clear() {
    for (const hookName in this.handlers) {
      this.handlers[hookName] = [];
    }
  }

  /**
   * 触发钩子，顺序执行所有已注册的处理函数
   * @param {string} hookName - 钩子名称
   * @param {Object} context - 上下文负载
   * @returns {Object} 经过处理后的上下文
   */
  trigger(hookName, context = {}) {
    const list = this.handlers[hookName];
    if (!list || list.length === 0) {
      return context;
    }

    for (let i = 0; i < list.length; i++) {
      try {
        list[i].handler(context);
        // 如果处理函数设置了 stopPropagation 标志，则中止后续处理
        if (context.stopPropagation) {
          break;
        }
      } catch (err) {
        console.error(`[SkillPipeline] Error executing hook ${hookName} (${list[i].id}):`, err);
      }
    }

    return context;
  }
}

window.SlotsRPG.SkillPipeline = new SkillPipeline();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.SlotsRPG.SkillPipeline;
}
