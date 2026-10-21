/**
 * DropAnimator.js - 奖励掉落飞入动效管理器
 * 负责将转轮上中奖奖励（装备/丹药/道符）以优美抛物线从阵盘坐标飞落至底部【角色修真】按钮
 * 并伴随图片缩小、多重光晕、金色尾迹与落点果冻回弹震颤
 */
window.SlotsRPG = window.SlotsRPG || {};

class DropAnimator {
  /**
   * 启动单组/多组奖励掉落飞行动画
   * @param {Array<Object>} rewards - 奖励列表 [{ icon, row, col, name }]
   * @param {HTMLCanvasElement} canvas - 阵盘画布
   * @param {HTMLElement} targetBtn - 目标按钮 (#tab-character)
   * @param {Function} onEachArrival - 每个物品抵达时的回调函数
   */
  static playDropAnimation(rewards, canvas, targetBtn, onEachArrival) {
    if (!rewards || rewards.length === 0 || !canvas || !targetBtn) return;

    // 界面守卫：若当前不在天机推演面板，静默结算抵达回调，不展示飞行动画
    const viewSlots = document.getElementById('view-slots');
    if (viewSlots && !viewSlots.classList.contains('active')) {
      if (typeof onEachArrival === 'function') {
        rewards.forEach(() => onEachArrival());
      }
      return;
    }

    const canvasRect = canvas.getBoundingClientRect();
    const targetRect = targetBtn.getBoundingClientRect();

    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    // 逻辑坐标转屏幕绝对坐标 (680 x 420)
    const scaleX = canvasRect.width / 680;
    const scaleY = canvasRect.height / 420;
    const colWidth = 680 / 5;
    const rowHeight = 420 / 3;

    rewards.forEach((reward, index) => {
      // 错开 120ms 形成连击喷涌感
      setTimeout(() => {
        const r = reward.row !== undefined ? reward.row : 1;
        const c = reward.col !== undefined ? reward.col : 2;

        const startX = canvasRect.left + (c + 0.5) * colWidth * scaleX;
        const startY = canvasRect.top + (r + 0.5) * rowHeight * scaleY;

        this._animateSingleItem(reward.icon, startX, startY, targetX, targetY, targetBtn, onEachArrival);
      }, index * 120);
    });
  }

  /**
   * 从指定 DOM 元素或绝对坐标飞向目标按钮 (用于战胜弹窗/事件纳宝入囊飞向乾坤袋)
   * @param {Array<{ icon: string, element?: HTMLElement, startX?: number, startY?: number }>} items
   * @param {HTMLElement} targetBtn
   * @param {Function} onEachArrival
   */
  static playDropAnimationFromElements(items, targetBtn, onEachArrival) {
    if (!items || items.length === 0 || !targetBtn) return;

    // 界面守卫：若当前不在天机推演面板，静默结算抵达回调，不展示飞行动画
    const viewSlots = document.getElementById('view-slots');
    if (viewSlots && !viewSlots.classList.contains('active')) {
      if (typeof onEachArrival === 'function') {
        items.forEach(() => onEachArrival());
      }
      return;
    }

    const targetRect = targetBtn.getBoundingClientRect();
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;

    items.forEach((item, index) => {
      setTimeout(() => {
        let startX = window.innerWidth / 2;
        let startY = window.innerHeight / 2;
        if (item.element) {
          const rect = item.element.getBoundingClientRect();
          startX = rect.left + rect.width / 2;
          startY = rect.top + rect.height / 2;
        } else if (item.startX !== undefined && item.startY !== undefined) {
          startX = item.startX;
          startY = item.startY;
        }

        this._animateSingleItem(item.icon, startX, startY, endX, endY, targetBtn, onEachArrival);
      }, index * 140);
    });
  }

  static _animateSingleItem(iconUrl, startX, startY, endX, endY, targetBtn, onArrival) {
    const flyer = document.createElement('div');
    flyer.className = 'drop-flyer';
    flyer.innerHTML = `<img src="${iconUrl}" alt="reward" />`;
    document.body.appendChild(flyer);

    const startTime = performance.now();
    const duration = 600; // 600ms 优雅抛物线下坠

    // 控制点 (向上拱起抛物线)
    const controlY = startY - 80;

    function frame(now) {
      // 若飞行动画中途用户切出推演面板，立即销毁动画并执行回调，绝不污染角色修真界面
      const viewSlots = document.getElementById('view-slots');
      if (viewSlots && !viewSlots.classList.contains('active')) {
        flyer.remove();
        if (typeof onArrival === 'function') {
          onArrival();
        }
        return;
      }

      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);

      // 二次贝塞尔曲线: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
      const curX = Math.pow(1 - t, 2) * startX + 2 * (1 - t) * t * ((startX + endX) / 2) + Math.pow(t, 2) * endX;
      const curY = Math.pow(1 - t, 2) * startY + 2 * (1 - t) * t * controlY + Math.pow(t, 2) * endY;

      // 缩放由 1.15 -> 0.35
      const scale = 1.15 - t * 0.8;
      const opacity = t > 0.9 ? (1 - t) / 0.1 : 1;

      flyer.style.transform = `translate3d(${curX - 28}px, ${curY - 28}px, 0) scale(${scale})`;
      flyer.style.opacity = opacity;

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        flyer.remove();

        // 目标按钮欢快果冻抖动
        if (targetBtn) {
          targetBtn.classList.remove('jelly-bounce');
          void targetBtn.offsetWidth;
          targetBtn.classList.add('jelly-bounce');
        }

        if (typeof onArrival === 'function') {
          onArrival();
        }
      }
    }

    requestAnimationFrame(frame);
  }
}

window.SlotsRPG.DropAnimator = DropAnimator;
