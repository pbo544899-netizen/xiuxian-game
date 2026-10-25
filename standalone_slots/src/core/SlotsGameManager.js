/**
 * SlotsGameManager.js
 * 独立老虎机纯享版核心游戏协调器 (Decoupled Pure Slots Manager)
 * 职责：
 * 1. 负责筹码机缘余额、下注档位、倍率管理
 * 2. 调度 SlotsEngine 与 CanvasRenderer / DragonSpoutRenderer 推演停轮与结算
 * 3. 统计胜率、总流水、总派彩与实时 RTP
 * 4. 支持单抽、十连抽与智能自动巡航推演
 */
window.SlotsRPG = window.SlotsRPG || {};

(function() {
  class SlotsGameManager {
    constructor() {
      this.balance = 10000;
      this.betMultiplier = 1;
      this.availableBetMultipliers = [1, 2, 5, 10, 20];
      this.mode = 'reels'; // 'reels' (传统天机轮盘) | 'dragon' (神龙吐宝)
      this.isSpinning = false;

      // 统计面板
      this.stats = {
        totalSpins: 0,
        totalBet: 0,
        totalWon: 0,
        biggestWin: 0,
        bonusCount: 0
      };

      // 自动推演状态
      this.isAutoSpinning = false;
      this.autoSpinRemaining = 0;
      this.autoSpinTargetCount = 10;
      this.autoTimer = null;

      // 模块引用
      this.renderer = null;
      this.dragonRenderer = null;
      this.dragonCabinetManager = null;
      this.slotsEngine = null;

      this._loadStorage();
    }

    _loadStorage() {
      try {
        const savedBalance = localStorage.getItem('standalone_slots_balance');
        if (savedBalance !== null) {
          this.balance = Math.max(0, parseInt(savedBalance, 10));
        }
        const savedStats = localStorage.getItem('standalone_slots_stats');
        if (savedStats) {
          this.stats = Object.assign(this.stats, JSON.parse(savedStats));
        }
      } catch (e) {
        console.warn('Failed to load slots storage', e);
      }
    }

    _saveStorage() {
      try {
        localStorage.setItem('standalone_slots_balance', String(this.balance));
        localStorage.setItem('standalone_slots_stats', JSON.stringify(this.stats));
      } catch (e) {
        console.warn('Failed to save slots storage', e);
      }
    }

    init(canvasRenderer, dragonRenderer) {
      this.renderer = canvasRenderer;
      this.dragonRenderer = dragonRenderer;
      if (typeof window.SlotsRPG.SlotsEngine === 'function') {
        this.slotsEngine = new window.SlotsRPG.SlotsEngine();
      } else {
        this.slotsEngine = window.SlotsRPG.SlotsEngine;
      }
      if (window.SlotsRPG.DragonCabinetManager) {
        this.dragonCabinetManager = new window.SlotsRPG.DragonCabinetManager();
      }

      this.emitStateChange();
    }

    emitStateChange() {
      if (window.SlotsRPG && window.SlotsRPG.EventBus) {
        window.SlotsRPG.EventBus.emit('STATE_CHANGE', this.getState());
      }
    }

    getState() {
      const baseCost = (window.SlotsRPG.PaytableConfig && window.SlotsRPG.PaytableConfig.SPIN_COST) || 25;
      const currentCost = baseCost * this.betMultiplier;
      const rtp = this.stats.totalBet > 0
        ? ((this.stats.totalWon / this.stats.totalBet) * 100).toFixed(1)
        : '100.0';

      return {
        balance: this.balance,
        betMultiplier: this.betMultiplier,
        currentCost,
        mode: this.mode,
        isSpinning: this.isSpinning,
        isAutoSpinning: this.isAutoSpinning,
        autoSpinRemaining: this.autoSpinRemaining,
        stats: { ...this.stats, rtp }
      };
    }

    setMode(newMode) {
      if (this.isSpinning) return;
      this.mode = newMode === 'dragon' ? 'dragon' : 'reels';
      this.emitStateChange();
    }

    stepBet(direction = 1) {
      if (this.isSpinning) return;
      const idx = this.availableBetMultipliers.indexOf(this.betMultiplier);
      let nextIdx = idx + direction;
      if (nextIdx < 0) nextIdx = this.availableBetMultipliers.length - 1;
      if (nextIdx >= this.availableBetMultipliers.length) nextIdx = 0;
      this.betMultiplier = this.availableBetMultipliers[nextIdx];
      if (window.SlotsRPG.SoundEffects) window.SlotsRPG.SoundEffects.play('CLICK');
      this.emitStateChange();
    }

    resetBalance(amount = 10000) {
      this.balance = amount;
      this._saveStorage();
      this.emitStateChange();
    }

    canAffordSpin(multiplier = this.betMultiplier) {
      const baseCost = (window.SlotsRPG.PaytableConfig && window.SlotsRPG.PaytableConfig.SPIN_COST) || 25;
      return this.balance >= (baseCost * multiplier);
    }

    executeSpin() {
      if (this.isSpinning) return false;

      const baseCost = (window.SlotsRPG.PaytableConfig && window.SlotsRPG.PaytableConfig.SPIN_COST) || 25;
      const spinCost = baseCost * this.betMultiplier;

      if (!this.canAffordSpin()) {
        if (this.isAutoSpinning) this.stopAutoSpin();
        alert('机缘灵石已耗尽！已自动为您注灵补给 5,000 机缘！');
        this.resetBalance(5000);
        return false;
      }

      this.balance -= spinCost;
      this.stats.totalSpins++;
      this.stats.totalBet += spinCost;
      this.isSpinning = true;

      if (window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play(this.mode === 'dragon' ? 'DRAGON_FIRE' : 'SPIN_START');
      }

      this.emitStateChange();

      // 1. 生成推演停轮结果
      const spinResult = this.slotsEngine.spin(1, this.betMultiplier);
      const { grid, evaluation } = spinResult;

      // 2. 驱动视觉渲染器
      if (this.mode === 'dragon' && this.dragonRenderer) {
        // 神龙吐宝模式
        if (this.renderer) this.renderer.startSpin();
        setTimeout(() => {
          if (this.renderer) {
            this.renderer.stopSpin(spinResult, () => this._handleSpinSettlement(spinResult));
          } else {
            this._handleSpinSettlement(spinResult);
          }
        }, 1000);
      } else {
        // 传统天机轮盘模式
        if (this.renderer) {
          this.renderer.startSpin();
          setTimeout(() => {
            this.renderer.stopSpin(spinResult, () => this._handleSpinSettlement(spinResult));
          }, 1000);
        } else {
          setTimeout(() => {
            this._handleSpinSettlement(spinResult);
          }, 1200);
        }
      }

      return true;
    }

    executeTenPull() {
      if (this.isSpinning) return false;
      const baseCost = (window.SlotsRPG.PaytableConfig && window.SlotsRPG.PaytableConfig.SPIN_COST) || 25;
      const totalCost = baseCost * this.betMultiplier * 10;

      if (this.balance < totalCost) {
        alert('机缘不足以开启十连推演！');
        return false;
      }

      this.balance -= totalCost;
      this.stats.totalSpins += 10;
      this.stats.totalBet += totalCost;
      this.isSpinning = true;

      if (window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('BIG_WIN');
      }

      this.emitStateChange();

      // 执行10次推演聚合
      let totalWon = 0;
      let lastResult = null;
      for (let i = 0; i < 10; i++) {
        const res = this.slotsEngine.spin(1, this.betMultiplier);
        totalWon += (res.evaluation ? res.evaluation.totalPayout : 0);
        lastResult = res;
      }

      if (this.renderer) {
        this.renderer.startSpin();
        if (this.renderer.startTenPullBurst) this.renderer.startTenPullBurst();
        setTimeout(() => {
          this.renderer.stopSpin(lastResult, () => {
            this.balance += totalWon;
            this.stats.totalWon += totalWon;
            if (totalWon > this.stats.biggestWin) this.stats.biggestWin = totalWon;
            this.isSpinning = false;
            this._saveStorage();
            this.emitStateChange();

            if (this.renderer && this.renderer.addFloatingText) {
              this.renderer.addFloatingText(`十连总纳彩: +${totalWon} 机缘！`, '#ffd700');
            }
          });
        }, 1000);
      }

      return true;
    }

    _handleSpinSettlement(spinResult) {
      const { evaluation } = spinResult;
      const payout = (evaluation && evaluation.totalPayout) || 0;

      if (payout > 0) {
        this.balance += payout;
        this.stats.totalWon += payout;
        if (payout > this.stats.biggestWin) {
          this.stats.biggestWin = payout;
        }

        if (window.SlotsRPG.SoundEffects) {
          if (payout >= (window.SlotsRPG.PaytableConfig.SPIN_COST * this.betMultiplier * 10)) {
            window.SlotsRPG.SoundEffects.play('BIG_WIN');
          } else {
            window.SlotsRPG.SoundEffects.play('WIN_LINE');
          }
        }

        if (this.renderer && this.renderer.addFloatingText) {
          this.renderer.addFloatingText(`+${payout} 机缘`, '#ffd700');
        }
      }

      this.isSpinning = false;
      this._saveStorage();
      this.emitStateChange();

      // 自动推演下一步循环
      if (this.isAutoSpinning) {
        if (this.autoSpinRemaining !== Infinity) {
          this.autoSpinRemaining--;
        }
        if (this.autoSpinRemaining <= 0) {
          this.stopAutoSpin();
        } else {
          this.autoTimer = setTimeout(() => {
            if (this.isAutoSpinning) this.executeSpin();
          }, 600);
        }
      }
    }

    startAutoSpin(count = 10) {
      if (this.isAutoSpinning) return;
      this.autoSpinTargetCount = count;
      this.autoSpinRemaining = count;
      this.isAutoSpinning = true;
      this.emitStateChange();
      this.executeSpin();
    }

    stopAutoSpin() {
      this.isAutoSpinning = false;
      this.autoSpinRemaining = 0;
      if (this.autoTimer) {
        clearTimeout(this.autoTimer);
        this.autoTimer = null;
      }
      this.emitStateChange();
    }
  }

  window.SlotsRPG.GameManager = new SlotsGameManager();
})();
