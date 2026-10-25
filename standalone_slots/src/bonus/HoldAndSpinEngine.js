/**
 * HoldAndSpinEngine.js - 洞天造化秘境 Hold & Spin 玩法引擎
 * 3x5 (15格) 独立锁盘、3步引灵循环重置、多重倍数与大圆满天道大奖
 * 纯前端零外部依赖
 */
window.SlotsRPG = window.SlotsRPG || {};

class HoldAndSpinEngine {
  constructor() {
    this.TOTAL_CELLS = 15;
    this.grid = new Array(this.TOTAL_CELLS).fill(null);
    this.respinsLeft = 3;
    this.isFinished = false;
    this.isGrandJackpot = false;
    this.betBase = 25;
    this.historyHits = [];
  }

  /**
   * 初始化秘境：将触发推演盘面的秘印导入锁盘
   * @param {Array} initialHits - [{ row, col, reward }] 或索引数组
   * @param {number} betBase - 基础下注机缘 (默认 25)
   */
  startChamber(initialHits = [], betBase = 25) {
    this.betBase = betBase;
    this.grid = new Array(this.TOTAL_CELLS).fill(null);
    this.respinsLeft = 3;
    this.isFinished = false;
    this.isGrandJackpot = false;
    this.historyHits = [];

    // 处理触发入场秘印
    if (Array.isArray(initialHits) && initialHits.length > 0) {
      initialHits.forEach(hit => {
        const index = typeof hit === 'number' ? hit : (hit.row * 5 + hit.col);
        if (index >= 0 && index < this.TOTAL_CELLS) {
          const reward = hit.reward || this._generateCellReward();
          this.grid[index] = reward;
        }
      });
    }

    // 若传入数量不足 5 个，随机补齐到至少 5 个锁定秘印
    let currentLocked = this.grid.filter(Boolean).length;
    while (currentLocked < 5) {
      const emptyIndices = this.getEmptyIndices();
      if (emptyIndices.length === 0) break;
      const pick = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      this.grid[pick] = this._generateCellReward();
      currentLocked++;
    }

    return this.getState();
  }

  getEmptyIndices() {
    const list = [];
    for (let i = 0; i < this.TOTAL_CELLS; i++) {
      if (!this.grid[i]) list.push(i);
    }
    return list;
  }

  getLockedCount() {
    return this.grid.filter(Boolean).length;
  }

  /**
   * 随机生成单个秘印的奖励数值
   */
  _generateCellReward() {
    const r = Math.random();
    if (r < 0.005) {
      return { type: 'jackpot', tag: 'MAJOR', name: '九天真灵印', value: 1500, label: 'Major (+1500)', color: '#ff416c' };
    } else if (r < 0.03) {
      return { type: 'jackpot', tag: 'MINOR', name: '玄黄乾坤印', value: 600, label: 'Minor (+600)', color: '#a855f7' };
    } else if (r < 0.10) {
      return { type: 'jackpot', tag: 'MINI', name: '太微福地印', value: 250, label: 'Mini (+250)', color: '#38bdf8' };
    } else if (r < 0.30) {
      const mul = Math.floor(12 + Math.random() * 14); // 12x ~ 25x
      const val = mul * this.betBase;
      return { type: 'multiplier', mul, value: val, label: `+${val}`, color: '#ffd700' };
    } else {
      const mul = Math.floor(2 + Math.random() * 9); // 2x ~ 10x
      const val = mul * this.betBase;
      return { type: 'multiplier', mul, value: val, label: `+${val}`, color: '#34e89e' };
    }
  }

  /**
   * 执行一次引灵旋转（Respin）
   */
  executeRespin() {
    if (this.isFinished) {
      return Object.assign({ isFinished: true }, this.getState());
    }

    const emptyIndices = this.getEmptyIndices();
    if (emptyIndices.length === 0) {
      this.isFinished = true;
      this.isGrandJackpot = true;
      return Object.assign({ isFinished: true, isGrandJackpot: true }, this.getState());
    }

    const newHits = [];

    // 每个空格独立判定是否凝聚出新秘印 (单格几率约 18%)
    emptyIndices.forEach(idx => {
      if (Math.random() < 0.18) {
        const reward = this._generateCellReward();
        this.grid[idx] = reward;
        newHits.push({ index: idx, reward });
      }
    });

    // 核心心流机制：只要凝聚出新秘印，剩余引灵步数立刻重置为 3 次！
    if (newHits.length > 0) {
      this.respinsLeft = 3;
    } else {
      this.respinsLeft--;
    }

    // 检查是否全盘 15 格填满 (Grand Jackpot)
    if (this.getLockedCount() === this.TOTAL_CELLS) {
      this.isGrandJackpot = true;
      this.isFinished = true;
    } else if (this.respinsLeft <= 0) {
      this.isFinished = true;
    }

    return Object.assign({
      newHits,
      isReset: newHits.length > 0,
      isFinished: this.isFinished,
      isGrandJackpot: this.isGrandJackpot
    }, this.getState());
  }

  /**
   * 结算秘境全部产出
   */
  calculateSettlement(potLevel = 1) {
    let totalEnergy = 0;
    const hitDetails = [];

    for (let i = 0; i < this.TOTAL_CELLS; i++) {
      const cell = this.grid[i];
      if (cell) {
        totalEnergy += cell.value;
        hitDetails.push(Object.assign({ index: i }, cell));
      }
    }

    let extraPills = 0;
    let extraEquip = null;

    // 若达成 15 格全满：派发 Grand Jackpot 天道大圆满奖
    if (this.isGrandJackpot) {
      const grandBonus = 3888; // 额外机缘
      totalEnergy += grandBonus;
      extraPills = 10; // 10 颗九转修为丹
      extraEquip = window.SlotsRPG.ItemModel.createEquipment(
        potLevel >= 2 ? 'boots' : 'ring',
        potLevel >= 2 ? 'Q4' : 'Q3'
      );
    } else if (this.getLockedCount() >= 10) {
      // 达到 10 格以上额外赠送 5 颗九转修为丹
      extraPills = 5;
    }

    return {
      totalEnergy,
      lockedCount: this.getLockedCount(),
      isGrandJackpot: this.isGrandJackpot,
      extraPills,
      extraEquip,
      hitDetails
    };
  }

  getState() {
    return {
      grid: [...this.grid],
      lockedCount: this.getLockedCount(),
      emptyCount: this.getEmptyIndices().length,
      respinsLeft: this.respinsLeft,
      isFinished: this.isFinished,
      isGrandJackpot: this.isGrandJackpot
    };
  }
}

window.SlotsRPG.HoldAndSpinEngine = HoldAndSpinEngine;
