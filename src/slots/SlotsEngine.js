/**
 * SlotsEngine - 聚宝天机阵核心数学与判定引擎
 * 负责 3x5 滚轮生成、分层加权抽取、WILD百搭替换、25线全开判定及奖励装配
 */
window.SlotsRPG = window.SlotsRPG || {};

class SlotsEngine {
  constructor() {
    this.paytable = window.SlotsRPG.PaytableConfig;
    this.paylines = window.SlotsRPG.PaylinesConfig;
    this.flowController = new window.SlotsRPG.FlowController();
  }

  /**
   * 获取当前聚宝盆等级开放的符号列表及权重
   * @param {number} level - 聚宝盆等级 (1, 2, ...)
   * @param {Object} directives - 心流保底指令
   */
  getSymbolWeights(level, directives = {}) {
    const weights = {};
    const symbols = this.paytable.SYMBOLS;

    for (let id in symbols) {
      const sym = symbols[id];
      if (sym.unlockLevel > level) continue; // 未解锁跳过

      let baseWeight = 100;

      // 从 GameBalanceConfig 读取差异化基础权重配置 (带优雅降级回退)
      const rWeights = (window.SlotsRPG && window.SlotsRPG.GameBalanceConfig && window.SlotsRPG.GameBalanceConfig.ReelWeights) || {
        rune_basic: 220, rune_medium: 160, rune_high: 110,
        pill: 110, equip: 80, wild: 35,
        scatter_normal: 35, scatter_forced: 1500,
        bonus_normal: 20, bonus_forced: 1500
      };

      switch (sym.type) {
        case 'rune':
          baseWeight = sym.subType === 'basic' ? rWeights.rune_basic : (sym.subType === 'medium' ? rWeights.rune_medium : rWeights.rune_high);
          if (directives.weightMultiplier) baseWeight *= directives.weightMultiplier;
          break;
        case 'pill':
          baseWeight = rWeights.pill;
          break;
        case 'equip':
          baseWeight = rWeights.equip;
          break;
        case 'wild':
          baseWeight = rWeights.wild; // 适度百搭，保持连线惊喜但不滥发
          break;
        case 'scatter':
          baseWeight = directives.forceMonster ? rWeights.scatter_forced : rWeights.scatter_normal;
          break;
        case 'bonus':
          baseWeight = directives.forceBonus ? rWeights.bonus_forced : rWeights.bonus_normal;
          break;
      }

      weights[id] = baseWeight;
    }

    const pipeline = window.SlotsRPG && window.SlotsRPG.SkillPipeline;
    if (pipeline) {
      pipeline.trigger('ON_REEL_WEIGHT_CALC', { level, directives, weights });
    }

    return weights;
  }

  /**
   * 根据权重池随机抽取单个符号
   */
  pickRandomSymbol(weights, colIndex) {
    const eligible = [];
    let totalWeight = 0;

    for (let id in weights) {
      // 规则：WILD 严禁出现在第 0 列
      if (id === 'SYM_11' && colIndex === 0) continue;
      // 规则：战斗符号 SYM_12 仅在第 2、3、4 滚轮 (colIndex 1, 2, 3) 出现，第 1 与第 5 滚轮 (colIndex 0, 4) 绝不出现
      if (id === 'SYM_12' && (colIndex === 0 || colIndex === 4)) continue;

      eligible.push({ id, weight: weights[id] });
      totalWeight += weights[id];
    }

    let rnd = Math.random() * totalWeight;
    for (let item of eligible) {
      if (rnd < item.weight) return item.id;
      rnd -= item.weight;
    }
    return eligible[0].id;
  }

  /**
   * 执行一次推演生成 3x5 阵盘
   * @param {number} level - 聚宝盆等级
   * @param {number} betMultiplier - 快速消耗倍率
   */
  spin(level = 1, betMultiplier = 1, overrideDirectives = null) {
    if (typeof level === 'object' && level !== null) {
      overrideDirectives = level;
      level = 1;
      betMultiplier = 1;
    } else if (typeof betMultiplier === 'object' && betMultiplier !== null) {
      overrideDirectives = betMultiplier;
      betMultiplier = 1;
    }
    const directives = Object.assign({}, this.flowController.getPreSpinDirectives(), overrideDirectives || {});
    if (overrideDirectives && overrideDirectives.forceBoss && overrideDirectives.blockEliteOrBoss === undefined) {
      directives.blockEliteOrBoss = false;
    }
    const weights = this.getSymbolWeights(level, directives);

    // 生成 3行 x 5列 矩阵 [row][col]
    const grid = [
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', '']
    ];

    for (let c = 0; c < 5; c++) {
      let colHasScatter = false;
      for (let r = 0; r < 3; r++) {
        let sym = this.pickRandomSymbol(weights, c);
        // 规则：每个滚轴只出现 1 个怪物符号 (SYM_12)，且仅限第 2、3、4 滚轮 (c === 1, 2, 3)
        if (sym === 'SYM_12') {
          if (colHasScatter || c === 0 || c === 4) {
            const safeWeights = Object.assign({}, weights);
            delete safeWeights['SYM_12'];
            sym = this.pickRandomSymbol(safeWeights, c);
          } else {
            colHasScatter = true;
          }
        }
        grid[r][c] = sym;
      }
    }

    // 保底强制注入（如果达到周期硬保底或引动妖王，仅注入第 2-3-4 滚轮）
    if (directives.forceBoss && !directives.blockEliteOrBoss) {
      this._injectSymbol(grid, 'SYM_12', 3);
    } else if (directives.forceMonster) {
      this._injectSymbol(grid, 'SYM_12', 3);
    } else if (directives.forceBonus) {
      // 确保全盘随机位置出现 5 个 BONUS
      this._injectSymbol(grid, 'SYM_13', 5);
    } else if (directives.forceHit) {
      // 连败保底：随机选一条主要连线注入 3 连中奖符号
      const targetLine = this.paylines[Math.floor(Math.random() * 3)];
      const targetSym = Math.random() < 0.6 ? 'SYM_02' : 'SYM_03';
      for (let col = 0; col < 3; col++) {
        grid[targetLine.coords[col]][col] = targetSym;
      }
    }

    // 评估 25 线中奖与特殊符号 (附带倍率放大与指令上下文)
    const evaluation = this.evaluateGrid(grid, betMultiplier, directives);
    const nearMiss = this.flowController.evaluateNearMiss(grid);

    // 触发宗门心法钩子 (结算加成 / 空转掉丹)
    const pipeline = window.SlotsRPG && window.SlotsRPG.SkillPipeline;
    if (pipeline) {
      if (evaluation.totalPayout > 0) {
        pipeline.trigger('ON_SPIN_EVALUATED', evaluation);
      } else {
        pipeline.trigger('ON_SPIN_NO_WIN', evaluation);
      }
    }

    // 记录结果更新保底
    this.flowController.recordSpinResult({
      hasWin: evaluation.winningLines.length > 0,
      hasMonster: evaluation.scatterCount >= 3,
      hasBonus: evaluation.bonusCount >= 5
    });

    return {
      grid,
      evaluation,
      nearMiss,
      directives,
      betMultiplier
    };
  }

  /**
   * 强制在矩阵随机不同位置注入指定符号 (怪物符号严格仅注入第 2-3-4 滚轮即 col 1, 2, 3)
   */
  _injectSymbol(grid, symbolId, count) {
    if (symbolId === 'SYM_12') {
      // 确保第 0 列与第 4 列绝无 SYM_12
      for (let r = 0; r < 3; r++) {
        if (grid[r][0] === 'SYM_12') grid[r][0] = 'SYM_01';
        if (grid[r][4] === 'SYM_12') grid[r][4] = 'SYM_01';
      }
      const availableCols = [1, 2, 3].sort(() => Math.random() - 0.5);
      const targetCount = Math.min(count, availableCols.length);
      for (let i = 0; i < targetCount; i++) {
        const c = availableCols[i];
        // 清理当前列旧的 SYM_12 避免重复
        for (let r = 0; r < 3; r++) {
          if (grid[r][c] === 'SYM_12') grid[r][c] = 'SYM_01';
        }
        const targetRow = Math.floor(Math.random() * 3);
        grid[targetRow][c] = symbolId;
      }
      return;
    }

    const positions = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        positions.push({ r, c });
      }
    }
    positions.sort(() => Math.random() - 0.5);
    for (let i = 0; i < count && i < positions.length; i++) {
      grid[positions[i].r][positions[i].c] = symbolId;
    }
  }

  /**
   * 严格评估 3x5 阵盘：25 线判定 + WILD 替代 + SCATTER/BONUS 统计 (支持倍率放大)
   */
  evaluateGrid(grid, betMultiplier = 1, directives = null) {
    const winningLines = [];
    let totalPayout = 0;
    const itemsWon = []; // 产出的具体实物道具清单

    // 1. 遍历 25 条中奖折线
    this.paylines.forEach(line => {
      const lineSymbols = [];
      for (let col = 0; col < 5; col++) {
        const row = line.coords[col];
        lineSymbols.push(grid[row][col]);
      }

      const matchResult = this._evaluateSingleLine(lineSymbols);
      if (matchResult.matchCount >= 3) {
        const symConfig = this.paytable.SYMBOLS[matchResult.symbolId];
        if (symConfig && symConfig.multipliers && symConfig.multipliers[matchResult.matchCount]) {
          const mult = symConfig.multipliers[matchResult.matchCount];
          const linePayout = mult * this.paytable.BASE_BET_PER_LINE * betMultiplier;
          totalPayout += linePayout;

          winningLines.push({
            lineId: line.id,
            lineName: line.name,
            symbolId: matchResult.symbolId,
            symbolName: symConfig.name,
            matchCount: matchResult.matchCount,
            coords: line.coords.slice(0, matchResult.matchCount), // 仅高亮命中部分
            fullCoords: line.coords,
            payout: linePayout,
            color: line.color
          });

          // 产出实物判定 (道符/丹药/装备)
          const originRow = line.coords[0];
          const originCol = 0;
          const symbolIcon = `assets/symbols/${matchResult.symbolId}.png`;

          if (symConfig.type === 'equip') {
            itemsWon.push({
              type: 'equip',
              part: symConfig.part,
              name: symConfig.name,
              symbolId: symConfig.id,
              matchCount: matchResult.matchCount,
              icon: symbolIcon,
              row: originRow,
              col: originCol
            });
          } else if (symConfig.type === 'pill') {
            const expGained = (symConfig.subType === 'exp'
              ? (matchResult.matchCount === 5 ? 500 : (matchResult.matchCount === 4 ? 150 : 50))
              : 0) * betMultiplier;

            itemsWon.push({
              type: 'pill',
              subType: symConfig.subType,
              name: symConfig.name,
              symbolId: symConfig.id,
              matchCount: matchResult.matchCount,
              amount: (matchResult.matchCount === 5 ? 5 : (matchResult.matchCount === 4 ? 2 : 1)) * betMultiplier,
              expReward: expGained,
              icon: symbolIcon,
              row: originRow,
              col: originCol
            });
          } else if (symConfig.type === 'rune') {
            itemsWon.push({
              type: 'rune',
              symbolId: symConfig.id,
              name: symConfig.name,
              matchCount: matchResult.matchCount,
              amount: 1 * betMultiplier,
              icon: symbolIcon,
              row: originRow,
              col: originCol
            });
          }
        }
      }
    });

    // 2. 统计全盘 Scatter 与 Bonus
    let scatterCount = 0;
    let bonusCount = 0;
    const scatterCoords = [];
    const bonusCoords = [];

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const id = grid[r][c];
        if (id === 'SYM_12') {
          scatterCount++;
          scatterCoords.push({ r, c });
        } else if (id === 'SYM_13') {
          bonusCount++;
          bonusCoords.push({ r, c });
        }
      }
    }

    let battleConfig = null;
    if (scatterCount >= 5 || (scatterCount >= 3 && directives && directives.forceBoss && !directives.blockEliteOrBoss)) {
      battleConfig = { tier: 'boss', count: 1, scatterCount, betMultiplier, isReelEncounter: true };
    } else if (scatterCount === 4) {
      battleConfig = { tier: 'elite', count: Math.floor(Math.random() * 2) + 1, scatterCount, betMultiplier, isReelEncounter: true };
    } else if (scatterCount === 3) {
      // 2-3-4 滚轮集齐 3 个战斗符号：仅触发【精英妖兽】或【1.1~1.2x 动态 BOSS】（普通怪物归入12关主动挑战）
      const canTriggerBoss = !(directives && directives.blockEliteOrBoss);
      if (canTriggerBoss && Math.random() < 0.25) {
        battleConfig = { tier: 'boss', count: 1, scatterCount, betMultiplier, isReelEncounter: true };
      } else {
        battleConfig = { tier: 'elite', count: Math.floor(Math.random() * 2) + 1, scatterCount, betMultiplier, isReelEncounter: true };
      }
    }

    return {
      winningLines,
      totalPayout,
      itemsWon,
      scatterCount,
      scatterCoords,
      bonusCount,
      bonusCoords,
      hasTriggeredBattle: scatterCount >= 3,
      battleConfig,
      hasTriggeredBonus: bonusCount >= 5,
      betMultiplier
    };
  }

  /**
   * 评估单条线由左至右的连续匹配数（含 WILD 百搭替换）
   */
  _evaluateSingleLine(symbols) {
    // 寻找从第 0 格开始的基准符号
    let baseSymbol = null;
    let matchCount = 0;

    for (let i = 0; i < 5; i++) {
      const current = symbols[i];

      // Scatter 与 Bonus 不走常规 25 连线
      if (current === 'SYM_12' || current === 'SYM_13') break;

      if (!baseSymbol) {
        if (current === 'SYM_11') {
          // 若第 0 列即为 WILD（理论已被限制禁止出现在第0列，此为防御性容错）
          continue;
        } else {
          baseSymbol = current;
          matchCount = i + 1;
        }
      } else {
        if (current === baseSymbol || current === 'SYM_11') {
          matchCount++;
        } else {
          break; // 不连续则中断
        }
      }
    }

    return {
      symbolId: baseSymbol || 'SYM_01',
      matchCount: matchCount
    };
  }
}

window.SlotsRPG.SlotsEngine = SlotsEngine;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.SlotsRPG.SlotsEngine;
}
