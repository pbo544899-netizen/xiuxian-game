/**
 * CaveManager.js - 洞天灵脉挂机放置与产出系统
 * 遵循 PRD 6.1 节规范：
 * 1. 聚灵阵：每分钟产出机缘，离线存储上限默认 120 分钟 (2小时)
 * 2. 百草园：定时产出九转修为丹
 * 3. 灵脉升阶：消耗机缘提升产率与容量上限
 * 4. 离线收益结算与防作弊时间戳比对
 */
window.SlotsRPG = window.SlotsRPG || {};

class CaveManager {
  constructor() {
    // 聚灵阵等级与配置 (品阶1~5)
    this.worldTier = 1; // 1: 人界洞天福地, 2: 灵界鸿蒙浮岛·星天仙阙
    this.spiritArrayLevel = 1;

    // 人界洞天福地配置 (Tier 1) - 正统放置挂机产出调优
    this.ARRAY_CONFIGS = {
      1: { name: '一阶·凡木聚灵阵', ratePerMin: 5, maxCapacity: 300, upgradeCost: 300 },
      2: { name: '二阶·玄铁聚灵阵', ratePerMin: 12, maxCapacity: 720, upgradeCost: 800 },
      3: { name: '三阶·紫铜聚灵阵', ratePerMin: 25, maxCapacity: 1500, upgradeCost: 2000 },
      4: { name: '四阶·赤阳聚灵阵', ratePerMin: 50, maxCapacity: 3000, upgradeCost: 5000 },
      5: { name: '五阶·造化通天阵', ratePerMin: 100, maxCapacity: 6000, upgradeCost: null }
    };

    // 灵界鸿蒙浮岛·星天仙阙配置 (Tier 2, PRD 4.3 节)
    this.ARRAY_CONFIGS_TIER2 = {
      1: { name: '一阶·星元聚灵阙', ratePerMin: 60, maxCapacity: 8000, upgradeCost: 4000 },
      2: { name: '二阶·紫薇玄枢阵', ratePerMin: 120, maxCapacity: 16000, upgradeCost: 10000 },
      3: { name: '三阶·太虚混元阵', ratePerMin: 200, maxCapacity: 25000, upgradeCost: 25000 },
      4: { name: '四阶·鸿蒙造化台', ratePerMin: 320, maxCapacity: 40000, upgradeCost: 60000 },
      5: { name: '五阶·万界极道宫', ratePerMin: 500, maxCapacity: 60000, upgradeCost: null }
    };

    // 百草园配置
    this.herbGardenLevel = 1;
    this.herbAccumulatedMinutes = 0; // 每 30 分钟凝聚 1 颗九转修为丹
    this.MINUTES_PER_PILL = 30;

    // 当前已蓄积的待领取收益
    this.accumulatedEnergy = 0;
    this.accumulatedPills = 0;

    // 时间戳记 (毫秒)
    this.lastTickTimestamp = Date.now();
    this.lastLogoutTimestamp = Date.now();

    // 在线心跳定时器
    this._heartbeatTimer = null;
  }

  init() {
    this.lastTickTimestamp = Date.now();
    this.startOnlineHeartbeat();
  }

  /**
   * 洞天主标题
   */
  get caveTitle() {
    return this.worldTier === 2 ? '鸿蒙浮岛 · 星天仙阙' : '太上灵脉 · 洞天福地';
  }

  getCurrentArrayConfig() {
    const cfgs = this.worldTier === 2 ? this.ARRAY_CONFIGS_TIER2 : this.ARRAY_CONFIGS;
    return cfgs[this.spiritArrayLevel] || cfgs[1];
  }

  getNextArrayConfig() {
    const cfgs = this.worldTier === 2 ? this.ARRAY_CONFIGS_TIER2 : this.ARRAY_CONFIGS;
    return cfgs[this.spiritArrayLevel + 1] || null;
  }

  /**
   * 转盘界面【洞天灵气浮泡】一键提取机缘 (PRD 10.4 节)
   */
  collectEnergyOnly() {
    this.tick();
    const energyToClaim = Math.floor(this.accumulatedEnergy);
    if (energyToClaim <= 0) return 0;
    this.accumulatedEnergy -= energyToClaim;
    return energyToClaim;
  }

  /**
   * 启动在线挂机心跳 (每 10 秒微量结算一次)
   */
  startOnlineHeartbeat() {
    if (this._heartbeatTimer) clearInterval(this._heartbeatTimer);
    this._heartbeatTimer = setInterval(() => {
      this.tick();
    }, 10000);
  }

  stopOnlineHeartbeat() {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
  }

  /**
   * 在线心跳产出计算
   */
  tick() {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - this.lastTickTimestamp) / 1000);
    if (elapsedSeconds <= 0) return;

    const cfg = this.getCurrentArrayConfig();
    const energyPerSec = cfg.ratePerMin / 60;
    const gainedEnergy = elapsedSeconds * energyPerSec;

    // 在线状态累加，但受容量上限约束
    this.accumulatedEnergy = Math.min(cfg.maxCapacity, this.accumulatedEnergy + gainedEnergy);

    // 百草园累计
    this.herbAccumulatedMinutes += elapsedSeconds / 60;
    while (this.herbAccumulatedMinutes >= this.MINUTES_PER_PILL) {
      this.herbAccumulatedMinutes -= this.MINUTES_PER_PILL;
      this.accumulatedPills = Math.min(20, this.accumulatedPills + 1); // 丹药池上限20颗
    }

    this.lastTickTimestamp = now;
  }

  /**
   * 结算离线挂机收益 (PRD 6.1: 离线上限 120 分钟)
   * @param {number} logoutTimestamp - 上次退出时间戳
   * @returns {Object|null} 离线收益详情
   */
  calculateOfflineEarnings(logoutTimestamp = this.lastLogoutTimestamp) {
    const now = Date.now();
    if (!logoutTimestamp || logoutTimestamp >= now) return null;

    const elapsedSeconds = Math.floor((now - logoutTimestamp) / 1000);
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    if (elapsedMinutes < 1) return null; // 离线不足 1 分钟不弹窗

    // 离线保护时限上限 240 分钟 (4小时)
    const effectiveMinutes = Math.min(240, elapsedMinutes);
    const cfg = this.getCurrentArrayConfig();

    // 计算离线产出机缘
    const offlineEnergyGained = Math.min(
      cfg.maxCapacity - Math.floor(this.accumulatedEnergy),
      Math.floor(effectiveMinutes * cfg.ratePerMin)
    );

    // 计算离线产出修为丹
    const totalHerbMins = this.herbAccumulatedMinutes + effectiveMinutes;
    const offlinePillsGained = Math.min(10, Math.floor(totalHerbMins / this.MINUTES_PER_PILL));

    this.accumulatedEnergy = Math.min(cfg.maxCapacity, this.accumulatedEnergy + Math.max(0, offlineEnergyGained));
    this.accumulatedPills = Math.min(20, this.accumulatedPills + offlinePillsGained);
    this.herbAccumulatedMinutes = totalHerbMins % this.MINUTES_PER_PILL;

    this.lastTickTimestamp = now;
    this.lastLogoutTimestamp = now;

    return {
      offlineMinutes: elapsedMinutes,
      effectiveMinutes: effectiveMinutes,
      isCapped: elapsedMinutes > 240,
      energyGained: Math.max(0, offlineEnergyGained),
      pillsGained: offlinePillsGained
    };
  }

  /**
   * 一键引灵收取所有待领收益
   */
  collectAll() {
    this.tick(); // 先冲账最新增量
    const energyToClaim = Math.floor(this.accumulatedEnergy);
    const pillsToClaim = this.accumulatedPills;

    if (energyToClaim <= 0 && pillsToClaim <= 0) {
      return null;
    }

    this.accumulatedEnergy -= energyToClaim;
    this.accumulatedPills -= pillsToClaim;

    return {
      energy: energyToClaim,
      pills: pillsToClaim
    };
  }

  /**
   * 升级聚灵阵品阶
   * @param {number} playerEnergy - 玩家当前可用机缘
   */
  upgradeSpiritArray(playerEnergy) {
    const nextCfg = this.getNextArrayConfig();
    if (!nextCfg) {
      return { success: false, reason: '聚灵阵已达最高品阶！' };
    }

    const cost = this.getCurrentArrayConfig().upgradeCost;
    if (playerEnergy < cost) {
      return { success: false, reason: `机缘不足，升级需要 ${cost} 机缘！` };
    }

    this.spiritArrayLevel++;
    return {
      success: true,
      cost,
      newLevel: this.spiritArrayLevel,
      newConfig: this.getCurrentArrayConfig()
    };
  }

  serialize() {
    this.tick();
    return {
      worldTier: this.worldTier || 1,
      spiritArrayLevel: this.spiritArrayLevel,
      herbGardenLevel: this.herbGardenLevel,
      herbAccumulatedMinutes: this.herbAccumulatedMinutes,
      accumulatedEnergy: this.accumulatedEnergy,
      accumulatedPills: this.accumulatedPills,
      lastLogoutTimestamp: Date.now()
    };
  }

  deserialize(data) {
    if (!data) return;
    if (typeof data.worldTier === 'number') this.worldTier = data.worldTier;
    if (typeof data.spiritArrayLevel === 'number') this.spiritArrayLevel = data.spiritArrayLevel;
    if (typeof data.herbGardenLevel === 'number') this.herbGardenLevel = data.herbGardenLevel;
    if (typeof data.herbAccumulatedMinutes === 'number') this.herbAccumulatedMinutes = data.herbAccumulatedMinutes;
    if (typeof data.accumulatedEnergy === 'number') this.accumulatedEnergy = data.accumulatedEnergy;
    if (typeof data.accumulatedPills === 'number') this.accumulatedPills = data.accumulatedPills;
    if (typeof data.lastLogoutTimestamp === 'number') this.lastLogoutTimestamp = data.lastLogoutTimestamp;
  }
}

window.SlotsRPG.CaveManager = CaveManager;
