/**
 * FlowController - 动态心流调控与保底系统
 * 依据博彩心理学与 PRD 4 节实现连败保底、Near-Miss期待减速与周期硬保底
 */
window.SlotsRPG = window.SlotsRPG || {};

class FlowController {
  constructor() {
    this.totalSpins = 0;           // 全局推演总次数
    this.lossStreak = 0;           // 连续未中奖次数
    this.spinsSinceMonster = 0;    // 距离上次妖兽挑战的旋转次数
    this.spinsSinceBonus = 0;      // 距离上次秘境大奖的旋转次数
    
    // 从 GameBalanceConfig 读取心流保底阈值 (带优雅降级回退)
    const cfg = (window.SlotsRPG && window.SlotsRPG.GameBalanceConfig && window.SlotsRPG.GameBalanceConfig.FlowPity) || {};
    this.LOSS_STREAK_SOFT = cfg.lossStreakSoft || 4;         // 4连败提升基础中奖权重
    this.LOSS_STREAK_HARD = cfg.lossStreakHard || 8;         // 8连败必中回血大奖
    this.SOFT_WEIGHT_MULT = cfg.softWeightMultiplier || 1.8; // 软保底权重放大倍数
    this.MONSTER_PITY_LIMIT = cfg.monsterPityLimit || 45;    // 45次未出妖兽必出挑战
    this.BONUS_PITY_LIMIT = cfg.bonusPityLimit || 180;       // 180次未出秘境必出大奖
    this.NEWBIE_PROTECT_SPINS = cfg.newbieProtectionSpins || 40; // 前40抽锁定新手期
  }

  /**
   * 在生成转盘结果前获取当前的保底干预策略
   */
  getPreSpinDirectives() {
    const directives = {
      forceHit: false,
      forceMonster: false,
      forceBonus: false,
      blockEliteOrBoss: this.totalSpins < this.NEWBIE_PROTECT_SPINS, // 前40抽锁定新手期，屏蔽精英与妖王，防猝死
      weightMultiplier: 1.0
    };

    if (this.spinsSinceMonster >= this.MONSTER_PITY_LIMIT) {
      directives.forceMonster = true;
    } else if (this.spinsSinceBonus >= this.BONUS_PITY_LIMIT) {
      directives.forceBonus = true;
    } else if (this.lossStreak >= this.LOSS_STREAK_HARD) {
      directives.forceHit = true;
    } else if (this.lossStreak >= this.LOSS_STREAK_SOFT) {
      directives.weightMultiplier = this.SOFT_WEIGHT_MULT;
    }

    return directives;
  }

  /**
   * 旋转结算后更新计数器
   */
  recordSpinResult({ hasWin, hasMonster, hasBonus }) {
    this.totalSpins++;
    if (hasWin) {
      this.lossStreak = 0;
    } else {
      this.lossStreak++;
    }

    if (hasMonster) {
      this.spinsSinceMonster = 0;
    } else {
      this.spinsSinceMonster++;
    }

    if (hasBonus) {
      this.spinsSinceBonus = 0;
    } else {
      this.spinsSinceBonus++;
    }

    return {
      lossStreak: this.lossStreak,
      spinsSinceMonster: this.spinsSinceMonster,
      spinsSinceBonus: this.spinsSinceBonus
    };
  }

  /**
   * 评估前两列是否达成 Near-Miss（差一点就中）
   * @param {Array<Array<string>>} grid - 3x5 符号矩阵 [row][col]
   * @returns {Object} { isNearMissMonster, isNearMissBonus }
   */
  evaluateNearMiss(grid) {
    let monsterCountInEarlyCols = 0;
    let bonusCountInCol01 = 0;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (grid[r][c] === 'SYM_12') monsterCountInEarlyCols++;
        if (c < 2 && grid[r][c] === 'SYM_13') bonusCountInCol01++;
      }
    }

    return {
      isNearMissMonster: monsterCountInEarlyCols >= 2,
      isNearMissBonus: bonusCountInCol01 >= 2
    };
  }
}

window.SlotsRPG.FlowController = FlowController;
