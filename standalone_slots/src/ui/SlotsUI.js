/**
 * SlotsUI.js
 * 独立老虎机界面控制器 (Standalone Slots UI Controller)
 */
window.SlotsRPG = window.SlotsRPG || {};

(function() {
  class SlotsUI {
    constructor() {
      this.gm = window.SlotsRPG.GameManager;
      this.initDOMElements();
      this.bindEvents();
      this.renderPaytable();
    }

    initDOMElements() {
      // 顶栏数值
      this.elBalance = document.getElementById('val-balance');
      this.elBet = document.getElementById('val-bet');
      this.elMultiplier = document.getElementById('val-multiplier');
      this.elLastWin = document.getElementById('val-last-win');
      this.elRtp = document.getElementById('val-rtp');
      this.elTotalSpins = document.getElementById('val-total-spins');

      // 交互按钮
      this.btnSpin = document.getElementById('btn-spin');
      this.btnTenPull = document.getElementById('btn-10pull');
      this.btnBetMinus = document.getElementById('btn-bet-minus');
      this.btnBetPlus = document.getElementById('btn-bet-plus');
      this.btnModeToggle = document.getElementById('btn-mode-toggle');
      this.btnAuto = document.getElementById('btn-auto');
      this.btnSound = document.getElementById('btn-sound');
      this.btnPaytable = document.getElementById('btn-paytable');
      this.btnResetBalance = document.getElementById('btn-reset-balance');

      // 弹窗
      this.modalPaytable = document.getElementById('modal-paytable');
      this.btnClosePaytable = document.getElementById('btn-close-paytable');
      this.paytableGrid = document.getElementById('paytable-symbols-grid');
      this.autoPopover = document.getElementById('auto-spin-popover');
    }

    bindEvents() {
      // 1. 单抽
      if (this.btnSpin) {
        this.btnSpin.addEventListener('click', () => {
          if (this.gm.isAutoSpinning) {
            this.gm.stopAutoSpin();
          } else {
            this.gm.executeSpin();
          }
        });
      }

      // 2. 十连推演
      if (this.btnTenPull) {
        this.btnTenPull.addEventListener('click', () => {
          if (this.gm.isAutoSpinning) this.gm.stopAutoSpin();
          this.gm.executeTenPull();
        });
      }

      // 3. 档位调节
      if (this.btnBetMinus) {
        this.btnBetMinus.addEventListener('click', () => this.gm.stepBet(-1));
      }
      if (this.btnBetPlus) {
        this.btnBetPlus.addEventListener('click', () => this.gm.stepBet(1));
      }

      // 4. 模式切换 (传统轮盘 vs 神龙吐宝)
      if (this.btnModeToggle) {
        this.btnModeToggle.addEventListener('click', () => {
          const nextMode = this.gm.mode === 'dragon' ? 'reels' : 'dragon';
          this.gm.setMode(nextMode);
          this.updateModeDisplay(nextMode);
        });
      }

      // 5. 自动推演菜单
      if (this.btnAuto) {
        this.btnAuto.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.gm.isAutoSpinning) {
            this.gm.stopAutoSpin();
          } else if (this.autoPopover) {
            this.autoPopover.classList.toggle('hidden');
          }
        });
      }

      // 自动推演选项按钮
      const autoOptionBtns = document.querySelectorAll('.auto-option-btn');
      autoOptionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const count = e.target.getAttribute('data-count');
          if (this.autoPopover) this.autoPopover.classList.add('hidden');
          this.gm.startAutoSpin(count === 'Infinity' ? Infinity : parseInt(count, 10));
        });
      });

      document.addEventListener('click', (e) => {
        if (this.autoPopover && !this.autoPopover.classList.contains('hidden') && !e.target.closest('#btn-auto, #auto-spin-popover')) {
          this.autoPopover.classList.add('hidden');
        }
      });

      // 6. 音效开关
      if (this.btnSound) {
        this.btnSound.addEventListener('click', () => {
          if (window.SlotsRPG.SoundEngine) {
            const isMuted = window.SlotsRPG.SoundEngine.toggleMute();
            this.btnSound.innerText = isMuted ? '🔇' : '🔊';
          }
        });
      }

      // 7. 充能机缘
      if (this.btnResetBalance) {
        this.btnResetBalance.addEventListener('click', () => {
          this.gm.resetBalance(10000);
          if (window.SlotsRPG.SoundEffects) window.SlotsRPG.SoundEffects.play('CLICK');
        });
      }

      // 8. 图谱弹窗
      if (this.btnPaytable) {
        this.btnPaytable.addEventListener('click', () => {
          if (this.modalPaytable) this.modalPaytable.classList.remove('hidden');
        });
      }
      if (this.btnClosePaytable) {
        this.btnClosePaytable.addEventListener('click', () => {
          if (this.modalPaytable) this.modalPaytable.classList.add('hidden');
        });
      }
      if (this.modalPaytable) {
        this.modalPaytable.addEventListener('click', (e) => {
          if (e.target === this.modalPaytable) {
            this.modalPaytable.classList.add('hidden');
          }
        });
      }

      // 监听全局状态变化刷新
      if (window.SlotsRPG.EventBus) {
        window.SlotsRPG.EventBus.on('STATE_CHANGE', (state) => this.renderHUD(state));
      }
    }

    updateModeDisplay(mode) {
      const container = document.getElementById('slots-stage-container');
      const modeLabel = document.getElementById('mode-label-text');
      if (container) {
        container.setAttribute('data-mode', mode);
      }
      if (modeLabel) {
        modeLabel.innerText = mode === 'dragon' ? '🐲 神龙吐宝' : '☯️ 天机轮盘';
      }
    }

    renderHUD(state) {
      if (!state) state = this.gm.getState();

      if (this.elBalance) this.elBalance.innerText = state.balance.toLocaleString();
      if (this.elBet) this.elBet.innerText = state.currentCost.toLocaleString();
      if (this.elMultiplier) this.elMultiplier.innerText = `x${state.betMultiplier}`;
      if (this.elLastWin) this.elLastWin.innerText = (state.stats.biggestWin || 0).toLocaleString();
      if (this.elRtp) this.elRtp.innerText = `${state.stats.rtp}%`;
      if (this.elTotalSpins) this.elTotalSpins.innerText = state.stats.totalSpins.toLocaleString();

      if (this.btnSpin) {
        if (state.isAutoSpinning) {
          const countText = state.autoSpinRemaining === Infinity ? '∞' : state.autoSpinRemaining;
          this.btnSpin.innerText = `停止巡航 (${countText})`;
          this.btnSpin.classList.add('btn-auto-active');
        } else {
          this.btnSpin.innerText = state.isSpinning ? '推演中...' : '天机推演';
          this.btnSpin.classList.remove('btn-auto-active');
        }
        this.btnSpin.disabled = state.isSpinning && !state.isAutoSpinning;
      }

      if (this.btnTenPull) {
        this.btnTenPull.disabled = state.isSpinning;
      }
    }

    renderPaytable() {
      if (!this.paytableGrid || !window.SlotsRPG.PaytableConfig) return;
      const symbols = window.SlotsRPG.PaytableConfig.SYMBOLS;
      let html = '';

      for (const [key, sym] of Object.entries(symbols)) {
        let rewardText = '';
        if (sym.multipliers && Object.keys(sym.multipliers).length > 0) {
          rewardText = Object.entries(sym.multipliers)
            .map(([count, mult]) => `${count}连: x${mult}`)
            .join(' · ');
        } else if (sym.type === 'wild') {
          rewardText = '百搭替用 (第2~5列)';
        } else if (sym.type === 'scatter') {
          rewardText = '3个以上触发妖兽逆鳞连击';
        } else if (sym.type === 'bonus') {
          rewardText = '5个以上触发洞天造化秘境';
        }

        html += `
          <div class="paytable-item">
            <div class="symbol-badge" style="background: linear-gradient(135deg, ${sym.bgGrad ? sym.bgGrad[0] : '#333'}, ${sym.bgGrad ? sym.bgGrad[1] : '#666'}); color: ${sym.color};">
              ${sym.name.substring(0, 2)}
            </div>
            <div class="symbol-info">
              <div class="symbol-name" style="color: ${sym.color};">${sym.name}</div>
              <div class="symbol-desc">${sym.desc || ''}</div>
              <div class="symbol-payout">${rewardText}</div>
            </div>
          </div>
        `;
      }

      this.paytableGrid.innerHTML = html;
    }
  }

  window.SlotsRPG.SlotsUI = SlotsUI;
})();
