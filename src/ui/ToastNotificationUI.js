/**
 * ToastNotificationUI.js
 * 游戏通用通知、战力飘字特效、属性增减提示与徽标组件
 */
(function() {
  window.SlotsRPG = window.SlotsRPG || {};
  window.SlotsRPG.UI = window.SlotsRPG.UI || {};

  let pendingNotificationCount = 0;

  const ToastNotificationUI = {
    _currentNoticeOnConfirm: null,

    // 仙道操作通告弹窗统一展示函数 (取缔浏览器系统弹窗)
    showGameNotice(title, htmlContent, badge = '✨ 仙道显化', onConfirm = null) {
      const actionNoticeBadge = document.getElementById('action-notice-badge');
      const actionNoticeTitle = document.getElementById('action-notice-title');
      const actionNoticeContent = document.getElementById('action-notice-content');
      const modalActionNotice = document.getElementById('modal-action-notice');

      if (actionNoticeBadge) actionNoticeBadge.innerText = badge;
      if (actionNoticeTitle) actionNoticeTitle.innerText = title;
      if (actionNoticeContent) actionNoticeContent.innerHTML = htmlContent;

      ToastNotificationUI._currentNoticeOnConfirm = (typeof onConfirm === 'function') ? onConfirm : null;

      if (modalActionNotice) modalActionNotice.classList.remove('hidden');
    },

    // 换装属性增减浮动大字 (绿增、红减)
    showFloatingAttrBurst(statDiff) {
      if (!statDiff) return;
      const viewCharacter = document.getElementById('view-character');
      const container = viewCharacter || document.getElementById('app-container');
      if (!container) return;

      const lines = [];
      if (statDiff.power !== 0 && statDiff.power !== undefined) {
        lines.push({ text: `⚡ 战力 ${statDiff.power > 0 ? '+' : ''}${statDiff.power}`, isInc: statDiff.power > 0 });
      }
      if (statDiff.atk !== 0 && statDiff.atk !== undefined) {
        lines.push({ text: `⚔️ 攻击 ${statDiff.atk > 0 ? '+' : ''}${statDiff.atk}`, isInc: statDiff.atk > 0 });
      }
      if (statDiff.def !== 0 && statDiff.def !== undefined) {
        lines.push({ text: `🛡️ 防御 ${statDiff.def > 0 ? '+' : ''}${statDiff.def}`, isInc: statDiff.def > 0 });
      }
      if (statDiff.hp !== 0 && statDiff.hp !== undefined) {
        lines.push({ text: `💚 气血 ${statDiff.hp > 0 ? '+' : ''}${statDiff.hp}`, isInc: statDiff.hp > 0 });
      }

      if (lines.length === 0) return;

      lines.forEach((line, idx) => {
        setTimeout(() => {
          const burst = document.createElement('div');
          burst.className = `floating-attr-burst ${line.isInc ? 'inc' : 'dec'}`;
          burst.innerText = line.text;
          burst.style.left = '50%';
          burst.style.top = `${150 + idx * 28}px`;
          container.appendChild(burst);
          setTimeout(() => {
            if (burst.parentNode) burst.remove();
          }, 1500);
        }, idx * 160);
      });
    },

    // 一键换装战力直接提示 (取缔阻断式弹窗，直接动效呈现暴涨战力)
    showCombatPowerGainNotice(powerGain, count = 1) {
      const viewCharacter = document.getElementById('view-character');
      const container = (viewCharacter && viewCharacter.classList.contains('active'))
        ? viewCharacter
        : (document.getElementById('app-container') || document.body);
      if (!container) return;

      // 1. 战力数值脉冲高光 (角色界面与顶部 HUD 战力数值同步呼吸跳动)
      const powerEls = [
        document.getElementById('hero-profile-power'),
        document.getElementById('val-power')
      ];
      powerEls.forEach(el => {
        if (!el) return;
        el.classList.remove('power-burst-pulse');
        void el.offsetWidth;
        el.classList.add('power-burst-pulse');
        setTimeout(() => el.classList.remove('power-burst-pulse'), 1500);
      });

      // 2. 悬浮战力暴涨特效胶囊 (无弹窗，居中暴击跃升)
      // 若已有旧的战力提示正在播放，立即移除，防止多重重叠
      const existing = container.querySelector('.quick-equip-power-gain');
      if (existing) existing.remove();

      const burst = document.createElement('div');
      burst.className = 'quick-equip-power-gain';
      const textGain = powerGain > 0 ? `+${powerGain}` : `+0`;
      const numClass = powerGain >= 1000 ? 'quick-equip-gain-num large' : 'quick-equip-gain-num';
      const countTag = count > 1 ? `<span class="quick-equip-count-tag">换装 ${count} 件</span>` : '';
      burst.innerHTML = `
        <div class="quick-equip-gain-content">
          <span class="quick-equip-gain-icon">⚡</span>
          <span class="quick-equip-gain-label">战力</span>
          <span class="${numClass}">${textGain}</span>
          ${countTag}
        </div>
      `;

      container.appendChild(burst);
      setTimeout(() => {
        if (burst.parentNode) burst.remove();
      }, 2200);
    },

    // 消息提示计数器
    updateNotificationBadge(count) {
      if (typeof count === 'number') {
        pendingNotificationCount = count;
      }
      const tabBadgeCharacter = document.getElementById('tab-badge-character');
      if (!tabBadgeCharacter) return;
      if (pendingNotificationCount > 0) {
        tabBadgeCharacter.innerText = pendingNotificationCount > 999 ? '999+' : pendingNotificationCount;
        tabBadgeCharacter.classList.remove('hidden');
        tabBadgeCharacter.classList.remove('pop');
        void tabBadgeCharacter.offsetWidth;
        tabBadgeCharacter.classList.add('pop');
      } else {
        tabBadgeCharacter.classList.add('hidden');
      }
    },

    getPendingNotificationCount() {
      return pendingNotificationCount;
    },

    setPendingNotificationCount(cnt) {
      pendingNotificationCount = cnt;
      this.updateNotificationBadge();
    },

    incrementNotificationCount(delta = 1) {
      pendingNotificationCount += delta;
      this.updateNotificationBadge();
    },

    // 浮动轻提示
    showFloatingNotice(text, color = '#f87171') {
      const viewSlots = document.getElementById('view-slots');
      const viewCharacter = document.getElementById('view-character');
      const renderer = window.gameManager ? window.gameManager.renderer : null;

      if (viewSlots && viewSlots.classList.contains('active')) {
        if (renderer && renderer.addFloatingText) {
          renderer.addFloatingText(text, color);
          return;
        }
      }
      const container = (viewCharacter && viewCharacter.classList.contains('active'))
        ? viewCharacter
        : (document.getElementById('app-container') || document.body);
      const el = document.createElement('div');
      el.className = 'floating-attr-burst';
      el.style.borderColor = color;
      el.style.color = color;
      el.style.left = '50%';
      el.style.top = '45%';
      el.innerText = text;
      container.appendChild(el);
      setTimeout(() => {
        if (el.parentNode) el.remove();
      }, 2000);
    },

    getAutoBtnTitleText(count) {
      if (count === 10) return '推演十次';
      if (count === 1) return '推演一次';
      if (count === Infinity) return '无限推演';
      return '推演一次';
    },

    init() {
      const btnActionNoticeConfirm = document.getElementById('btn-action-notice-confirm');
      const btnCloseActionNoticeX = document.getElementById('btn-close-action-notice-x');
      const modalActionNotice = document.getElementById('modal-action-notice');
      const actionNoticeTitle = document.getElementById('action-notice-title');

      const handleClose = () => {
        if (modalActionNotice) modalActionNotice.classList.add('hidden');
        const cb = ToastNotificationUI._currentNoticeOnConfirm;
        ToastNotificationUI._currentNoticeOnConfirm = null;
        if (typeof cb === 'function') {
          try { cb(); } catch (err) { console.error('[ToastNotificationUI] notice callback error:', err); }
        }
        if (window.SlotsRPG && window.SlotsRPG.EventBus) {
          window.SlotsRPG.EventBus.emit('ACTION_NOTICE_CLOSED', {
            title: actionNoticeTitle ? actionNoticeTitle.innerText : ''
          });
        }
      };

      if (btnActionNoticeConfirm) {
        btnActionNoticeConfirm.addEventListener('click', handleClose);
      }
      if (btnCloseActionNoticeX) {
        btnCloseActionNoticeX.addEventListener('click', handleClose);
      }
    }
  };

  // 挂载与全局暴露
  window.SlotsRPG.UI.ToastNotificationUI = ToastNotificationUI;
  window.showGameNotice = ToastNotificationUI.showGameNotice;
  window.showFloatingAttrBurst = ToastNotificationUI.showFloatingAttrBurst;
  window.showCombatPowerGainNotice = ToastNotificationUI.showCombatPowerGainNotice;
  window.showFloatingNotice = ToastNotificationUI.showFloatingNotice;
  window.updateNotificationBadge = ToastNotificationUI.updateNotificationBadge.bind(ToastNotificationUI);
  window.incrementNotificationBadge = (delta = 1) => ToastNotificationUI.incrementNotificationCount(delta);
  window.getAutoBtnTitleText = ToastNotificationUI.getAutoBtnTitleText;
})();
