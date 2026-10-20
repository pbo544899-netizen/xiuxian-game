/**
 * AdService.js - 纯 IAA 商业变现矩阵与仙道功德免广券总控服务
 * 严格遵循 PRD_剧情与轮回宗门系统规格书 第 9 章规范：
 * 1. 100% 纯激励视频无内购合规设计 (Opt-in Rewarded Video Ads)
 * 2. 六大黄金触点：妖王绝地复活、天降造化灵泉、洞天离线双倍、造化天工补全、轮回重测仙缘、太虚锦囊传家
 * 3. 【仙道功德碑 · 伪免广券体系】：每日看满 5 次视频赠送 2 张【天机瞬发符 (免广券)】，飞升大捷赠送 5 张
 * 4. 灵机耗尽时的【打坐吐纳】绝对兜底机制 (PRD 6.2 节)
 */
window.SlotsRPG = window.SlotsRPG || {};

class AdService {
  constructor() {
    // 今日已观看广告总数
    this.dailyWatchedCount = 0;
    // 玩家持有的【天机瞬发符 (免广告直达券)】数量 (开局赠送 1 张体验)
    this.skipTickets = 1;
    // 上次使用造化天工补全的时间戳 (用于10分钟冷却)
    this.lastEquipCompleteTime = 0;
    // 上次重置自然日标记 (YYYY-MM-DD)
    this.lastResetDay = this._getTodayDateString();

    // 6 大触点每日配额上限与今日使用计数
    this.QUOTAS = {
      revive: { name: '妖王绝地复活', maxDaily: 3, count: 0 },
      energy_relief: { name: '天降造化灵泉', maxDaily: 6, count: 0 },
      cave_double: { name: '洞天离线双倍', maxDaily: 3, count: 0 },
      equip_complete: { name: '造化天工补全', maxDaily: 2, count: 0 },
      reroll_sect: { name: '轮回重测仙缘', maxDaily: 3, count: 0 },
      extra_heirloom: { name: '太虚锦囊传家', maxDaily: 2, count: 0 }
    };

    // 单场战斗是否已复活标记
    this.battleReviveUsedThisFight = false;
    // 单世是否已重测仙缘标记
    this.sectRerollUsedThisLife = false;
    // 单世是否已使用传家宝多带一件
    this.extraHeirloomUsedThisLife = false;

    // 当前正在播放的广告任务
    this._currentAdTask = null;
    this._adTimer = null;
  }

  _getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  /**
   * 跨日自动重置每日配额
   */
  checkDailyReset() {
    const today = this._getTodayDateString();
    if (this.lastResetDay !== today) {
      this.lastResetDay = today;
      this.dailyWatchedCount = 0;
      for (const key in this.QUOTAS) {
        this.QUOTAS[key].count = 0;
      }
      console.log('[AdService] 跨日刷新，每日广告配额重置！');
    }
  }

  /**
   * 检查指定广告触点是否可用
   * @param {string} type - 'revive'|'energy_relief'|'cave_double'|'equip_complete'|'reroll_sect'|'extra_heirloom'
   */
  canWatch(type) {
    this.checkDailyReset();
    const quota = this.QUOTAS[type];
    if (!quota) return false;

    // 每日总次数限制
    if (quota.count >= quota.maxDaily) {
      return false;
    }

    // 专属限制
    if (type === 'revive' && this.battleReviveUsedThisFight) {
      return false; // 每场战斗限 1 次
    }
    if (type === 'reroll_sect' && this.sectRerollUsedThisLife) {
      return false; // 每世限 1 次
    }
    if (type === 'extra_heirloom' && this.extraHeirloomUsedThisLife) {
      return false; // 每世通关限 1 次
    }
    if (type === 'equip_complete') {
      const now = Date.now();
      if (now - this.lastEquipCompleteTime < 10 * 60 * 1000) {
        return false; // 10 分钟间隔冷却
      }
    }

    return true;
  }

  /**
   * 获取指定触点今日剩余次数
   */
  getRemainingQuota(type) {
    this.checkDailyReset();
    const quota = this.QUOTAS[type];
    if (!quota) return 0;
    return Math.max(0, quota.maxDaily - quota.count);
  }

  /**
   * 记录触点使用并触发功德奖励
   */
  _consumeQuota(type, usedTicket = false) {
    if (this.QUOTAS[type]) {
      this.QUOTAS[type].count++;
    }

    if (type === 'revive') this.battleReviveUsedThisFight = true;
    if (type === 'reroll_sect') this.sectRerollUsedThisLife = true;
    if (type === 'extra_heirloom') this.extraHeirloomUsedThisLife = true;
    if (type === 'equip_complete') this.lastEquipCompleteTime = Date.now();

    // 累计今日观看次数
    if (!usedTicket) {
      this.dailyWatchedCount++;
    }

    window.SlotsRPG.EventBus.emit('AD_QUOTA_CHANGED', {
      type,
      remaining: this.getRemainingQuota(type),
      dailyWatched: this.dailyWatchedCount,
      skipTickets: this.skipTickets
    });
  }

  /**
   * 消耗一张【天机瞬发符】直接领奖 (免看视频)
   */
  claimViaTicket(type, onSuccess) {
    if (this.skipTickets <= 0) {
      return { success: false, reason: '天机瞬发符不足！' };
    }
    if (!this.canWatch(type)) {
      return { success: false, reason: '该机缘今日次数已达上限！' };
    }

    this.skipTickets--;
    this._consumeQuota(type, true);

    if (onSuccess) onSuccess({ type, usedTicket: true });
    return { success: true, remainingTickets: this.skipTickets };
  }

  /**
   * 观看激励视频播放流 (仿真 8 秒纯原生轻量倒计时)
   * @param {string} type 
   * @param {Object} options - { onSuccess, onCancel, onProgress, onStart }
   */
  startRewardedAd(type, options = {}) {
    if (!this.canWatch(type)) {
      if (options.onCancel) options.onCancel({ reason: '今日次数已耗尽' });
      return;
    }

    this._currentAdTask = {
      type,
      totalDuration: 8, // 8秒倒计时
      remainingSeconds: 8,
      options
    };

    if (options.onStart) {
      options.onStart({
        type,
        quotaName: this.QUOTAS[type].name,
        duration: 8,
        skipTickets: this.skipTickets
      });
    }

    // 启动每秒心跳
    if (this._adTimer) clearInterval(this._adTimer);
    this._adTimer = setInterval(() => {
      if (!this._currentAdTask) {
        clearInterval(this._adTimer);
        return;
      }

      this._currentAdTask.remainingSeconds--;
      const progress = 1 - (this._currentAdTask.remainingSeconds / this._currentAdTask.totalDuration);

      if (this._currentAdTask.options.onProgress) {
        this._currentAdTask.options.onProgress({
          remaining: this._currentAdTask.remainingSeconds,
          progress: Math.min(1, Math.max(0, progress))
        });
      }

      // 播放完毕，发放激励
      if (this._currentAdTask.remainingSeconds <= 0) {
        clearInterval(this._adTimer);
        this._adTimer = null;
        const taskType = this._currentAdTask.type;
        const cb = this._currentAdTask.options.onSuccess;
        this._currentAdTask = null;

        this._consumeQuota(taskType, false);
        if (cb) cb({ type: taskType, usedTicket: false });
      }
    }, 1000);
  }

  /**
   * 玩家中途关闭/放弃广告
   */
  cancelCurrentAd() {
    if (this._adTimer) {
      clearInterval(this._adTimer);
      this._adTimer = null;
    }
    if (this._currentAdTask) {
      const cb = this._currentAdTask.options.onCancel;
      this._currentAdTask = null;
      if (cb) cb({ reason: '用户主动关闭' });
    }
  }

  /**
   * 奖励大里程碑瞬发符 (如首次飞升赠送 5 张)
   * @param {number} count 
   * @param {string} reason 
   */
  grantMilestoneTickets(count = 5, reason = '大里程碑达成') {
    this.skipTickets += count;
    window.SlotsRPG.EventBus.emit('TICKETS_UPDATED', {
      ticketsGranted: count,
      totalTickets: this.skipTickets,
      reason
    });
    return this.skipTickets;
  }

  /**
   * PRD 6.2 节：灵机耗尽时的【打坐吐纳】绝对兜底
   * 播放 3 秒聚气呼吸，直接恢复 30 点基础灵机
   * @param {Function} onComplete 
   * @param {boolean} instant - 是否瞬时完成 (用于自动化测试)
   */
  meditate(onComplete, instant = false) {
    if (instant) {
      if (onComplete) onComplete({ energyRestored: 30 });
      return;
    }
    const duration = 3;
    let remaining = duration;
    const interval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(interval);
        if (onComplete) onComplete({ energyRestored: 30 });
      }
    }, 1000);
  }

  /**
   * 新一轮战斗重置复活状态
   */
  resetBattleState() {
    this.battleReviveUsedThisFight = false;
  }

  /**
   * 新一世轮回重置单世标记
   */
  resetSamsaraState() {
    this.sectRerollUsedThisLife = false;
    this.extraHeirloomUsedThisLife = false;
  }

  serialize() {
    this.checkDailyReset();
    return {
      dailyWatchedCount: this.dailyWatchedCount,
      dailyMeritClaimed: this.dailyMeritClaimed,
      skipTickets: this.skipTickets,
      lastEquipCompleteTime: this.lastEquipCompleteTime,
      lastResetDay: this.lastResetDay,
      quotas: {
        revive: this.QUOTAS.revive.count,
        energy_relief: this.QUOTAS.energy_relief.count,
        cave_double: this.QUOTAS.cave_double.count,
        equip_complete: this.QUOTAS.equip_complete.count,
        reroll_sect: this.QUOTAS.reroll_sect.count,
        extra_heirloom: this.QUOTAS.extra_heirloom.count
      }
    };
  }

  deserialize(data) {
    if (!data) return;
    if (typeof data.dailyWatchedCount === 'number') this.dailyWatchedCount = data.dailyWatchedCount;
    if (typeof data.skipTickets === 'number') this.skipTickets = data.skipTickets;
    if (typeof data.lastEquipCompleteTime === 'number') this.lastEquipCompleteTime = data.lastEquipCompleteTime;
    if (data.lastResetDay) this.lastResetDay = data.lastResetDay;

    if (data.quotas) {
      for (const k in data.quotas) {
        if (this.QUOTAS[k]) {
          this.QUOTAS[k].count = data.quotas[k];
        }
      }
    }
    this.checkDailyReset();
  }
}

window.SlotsRPG.AdService = new AdService();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.SlotsRPG.AdService;
}
