/**
 * SpotlightGuide.js
 * 全局通用新手引导聚光灯遮罩引擎 (Universal FTUE Spotlight Mask Engine)
 * 
 * 核心机制：
 * 1. 全屏聚光灯暗色遮罩 (rgba(3, 7, 18, 0.82) + backdrop blur)
 * 2. 目标元素高亮提权 (z-index: 9995 + 仙道金光脉冲动画)
 * 3. 动态手势手指与金色文本气泡 (支持 上/下/左/右 四向精准指向与弹性呼吸)
 * 4. 遮罩层吸收全屏误触，仅允许点击高亮目标
 * 5. 全局自动化 FTUE 状态机调度：
 *    - 步骤 1: 凡人遇兽 · 拔刀斩凶 (#btn-prologue-battle)
 *    - 步骤 2: 恶兽已斩 · 唤醒天机古宝 (.bag-cell 造化天机盘)
 *    - 步骤 3: 作弊器认主 · 执掌神物 (#btn-awakening-accept)
 *    - 步骤 4: 散修初探 · 首次引龙吐宝 (#btn-spin)
 *    - 步骤 5: 首抽爆神兵 · 一键穿戴换装 (#btn-quick-equip)
 *    - 步骤 6: 散修探寻 · 蓄力推演 (#btn-spin)
 *    - 步骤 7: 叩问仙门 · 拜入万剑宗 (.btn-join-sect)
 *    - 步骤 8: 仙门初立 · 首次妖王试炼 (#sect-trial-banner)
 *    - 步骤 9: 洞天福地 · 首次一键引灵 (#btn-cave-collect)
 */
(function() {
  'use strict';

  window.SlotsRPG = window.SlotsRPG || {};
  window.SlotsRPG.UI = window.SlotsRPG.UI || {};

  const SpotlightGuide = {
    currentTargetEl: null,
    currentConfig: null,
    maskEl: null,
    indicatorEl: null,
    targetClickListener: null,
    isInitialized: false,
    pendingTimer: null,
    lastGuideDismissTime: 0,
    minStepInterval: 1200, // 引导步骤之间的缓冲时间 (毫秒)，给玩家充分的视觉留白和操作反馈时间

    /**
     * 调度下一次 FTUE 检查 (内置防抖与步进冷却缓冲)
     * @param {number} delay 建议延迟 (毫秒)
     */
    scheduleCheck(delay = 1200) {
      if (this.pendingTimer) {
        clearTimeout(this.pendingTimer);
        this.pendingTimer = null;
      }
      const timeSinceDismiss = Date.now() - this.lastGuideDismissTime;
      const remainingCooldown = Math.max(0, this.minStepInterval - timeSinceDismiss);
      const effectiveDelay = Math.max(delay, remainingCooldown);

      this.pendingTimer = setTimeout(() => {
        this.pendingTimer = null;
        this.checkAndTriggerFTUE();
      }, effectiveDelay);
    },

    /**
     * 初始化引擎与 DOM 节点
     */
    init() {
      if (this.isInitialized) return;

      this.ensureDOM();
      this.bindGlobalEvents();
      this.isInitialized = true;
    },

    /**
     * 确保遮罩层与手势指示器存在于 DOM 中
     */
    ensureDOM() {
      let mask = document.getElementById('ftue-spotlight-mask');
      if (!mask) {
        mask = document.createElement('div');
        mask.id = 'ftue-spotlight-mask';
        mask.className = 'ftue-spotlight-mask hidden';
        document.body.appendChild(mask);
      }
      this.maskEl = mask;

      // 点击遮罩空白区域：拦截误触并轻微晃动手势以提醒玩家
      this.maskEl.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.shakeIndicator();
      });

      let indicator = document.getElementById('spotlight-guide-indicator');
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'spotlight-guide-indicator';
        indicator.className = 'spotlight-guide-indicator hidden';
        indicator.innerHTML = `
          <div class="spotlight-bounce-container">
            <span class="spotlight-text-pill" id="spotlight-guide-text">请遵照指引操作</span>
            <span class="spotlight-finger-icon" id="spotlight-guide-finger">👇</span>
          </div>
        `;
        document.body.appendChild(indicator);
      }
      this.indicatorEl = indicator;

      // 允许点击指示器手势与文字气泡直接触发目标操作 (极大增强触控手感与容错)
      this.indicatorEl.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.currentTargetEl && typeof this.currentTargetEl.click === 'function') {
          this.currentTargetEl.click();
        }
      });
    },

    /**
     * 绑定全局事件监听以自适应刷新高亮
     */
    bindGlobalEvents() {
      // 窗口尺寸或滚动发生变化时重新矫正指示器绝对视口位置
      window.addEventListener('resize', () => {
        if (this.isActive()) this.reposition();
      }, { passive: true });

      window.addEventListener('scroll', () => {
        if (this.isActive()) this.reposition();
      }, { passive: true });

      // 监听全局状态变更与核心驱动事件 (统一采用调度器 scheduleCheck 缓冲防抖)
      if (window.SlotsRPG && window.SlotsRPG.EventBus) {
        window.SlotsRPG.EventBus.on('STATE_CHANGE', () => this.scheduleCheck(1000));
        window.SlotsRPG.EventBus.on('SPIN_STOP', () => this.scheduleCheck(1200));
        window.SlotsRPG.EventBus.on('DRAGON_SPOUT_ALL_REVEALED', () => this.scheduleCheck(1200));
        window.SlotsRPG.EventBus.on('TAB_CHANGED', (data) => {
          if (data && data.tab === 'character') {
            this.characterTabEnterTime = Date.now();
          }
          this.scheduleCheck(1000);
        });
        window.SlotsRPG.EventBus.on('PROLOGUE_COMPLETED', () => this.scheduleCheck(1200));
        window.SlotsRPG.EventBus.on('SECT_JOINED', () => this.scheduleCheck(1200));
        window.SlotsRPG.EventBus.on('SHOW_SECT_INDUCTION', () => this.scheduleCheck(1000));
        window.SlotsRPG.EventBus.on('STORY_DIALOG_END', () => {
          this.lastGuideDismissTime = Date.now();
          this.scheduleCheck(1200);
        });
      }
    },

    /**
     * 是否当前正处于引导高亮状态
     */
    isActive() {
      return !!(this.currentTargetEl && this.indicatorEl && !this.indicatorEl.classList.contains('hidden'));
    },

    get currentTarget() {
      return this.currentTargetEl;
    },
    get currentStepId() {
      return this.currentConfig ? this.currentConfig.id : null;
    },
    get currentStep() {
      return this.currentConfig;
    },

    /**
     * 晃动手势与文字气泡（用于玩家点击遮罩阻断时的趣味反馈）
     */
    shakeIndicator() {
      if (!this.indicatorEl || this.indicatorEl.classList.contains('hidden')) return;
      this.indicatorEl.classList.remove('spotlight-shake-anim');
      void this.indicatorEl.offsetWidth; // 触发 reflow
      this.indicatorEl.classList.add('spotlight-shake-anim');
    },

    /**
     * 显示聚光灯并高亮目标
     * @param {Object} options
     * @param {HTMLElement|string} options.target 目标元素或选择器
     * @param {string} options.text 气泡引导提示词
     * @param {'down'|'up'|'left'|'right'} [options.direction='down'] 指向方位
     * @param {string} [options.id=''] 引导步骤唯一标识
     * @param {Function} [options.onClick=null] 目标被点击时的回调
     * @param {number} [options.offset=10] 手指与目标间距(px)
     */
    show(options) {
      this.ensureDOM();
      if (!options || !options.target) {
        this.hide();
        return false;
      }

      let target = null;
      if (typeof options.target === 'string') {
        target = document.querySelector(options.target);
      } else if (options.target instanceof HTMLElement) {
        target = options.target;
      }

      if (!target) {
        this.hide();
        return false;
      }

      // 若目标元素不可见 (display: none 或 offsetParent === null)
      if (target.offsetParent === null && target.style.display === 'none') {
        this.hide();
        return false;
      }

      // 如果当前正在高亮同一个目标且引导 ID 一致，仅矫正位置
      if (this.currentTargetEl === target && this.currentConfig && this.currentConfig.id === options.id) {
        this.positionIndicator(target, options.direction || 'down', options.offset || 10);
        return true;
      }

      // 清理前一个目标的监听与样式
      this.cleanupCurrentTarget();

      this.currentTargetEl = target;
      this.currentConfig = Object.assign({}, options);

      // 1. 给目标元素赋予高亮提权类
      target.classList.add('spotlight-active-target');

      // 检查目标是否有 modal-overlay 祖先，若有则提升祖先弹窗层级
      const modalAncestor = target.closest('.modal-overlay');
      if (modalAncestor) {
        modalAncestor.classList.add('spotlight-elevated-modal');
      }

      // 检查目标是否有 bottom-nav 祖先，若有则提升底部导航栏层级
      const navAncestor = target.closest('.bottom-nav');
      if (navAncestor) {
        navAncestor.classList.add('spotlight-elevated-nav');
      }

      // 遍历目标的所有祖先容器，对具有独立局部层叠上下文 (z-index 或 sticky/fixed) 的祖先动态提权，击穿遮罩层级隔离
      let ancestor = target.parentElement;
      while (ancestor && ancestor !== document.body && ancestor !== document.documentElement) {
        const cs = window.getComputedStyle(ancestor);
        const hasZIndex = cs.zIndex !== 'auto' && parseInt(cs.zIndex, 10) < 9990;
        const isStickyOrFixed = cs.position === 'sticky' || cs.position === 'fixed';
        const isShowcase = ancestor.id === 'dragon-rewards-showcase' || ancestor.classList.contains('dragon-rewards-showcase');
        if (hasZIndex || isStickyOrFixed || isShowcase) {
          ancestor.classList.add('spotlight-elevated-ancestor');
        }
        ancestor = ancestor.parentElement;
      }

      // 确保目标在可见视口区内
      if (typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }

      // 2. 唤醒聚光灯遮罩
      document.body.classList.add('ftue-spotlight-active');
      if (this.maskEl) {
        this.maskEl.classList.remove('hidden');
      }

      // 3. 填充指示器文字与手势
      const textEl = this.indicatorEl.querySelector('#spotlight-guide-text');
      const fingerEl = this.indicatorEl.querySelector('#spotlight-guide-finger');
      if (textEl) textEl.innerText = options.text || '请点击此处';

      const dir = options.direction || 'down';
      if (fingerEl) {
        if (dir === 'down') fingerEl.innerText = '👇';
        else if (dir === 'up') fingerEl.innerText = '👆';
        else if (dir === 'left') fingerEl.innerText = '👈';
        else if (dir === 'right') fingerEl.innerText = '👉';
      }

      // 4. 定位指示器
      this.indicatorEl.classList.remove('hidden');
      this.positionIndicator(target, dir, options.offset || 10);

      // 5. 绑定目标点击事件 (点击后自动收束引导，并调度下一步检查)
      this.targetClickListener = (e) => {
        if (typeof options.onClick === 'function') {
          options.onClick(e);
        }
        this.lastGuideDismissTime = Date.now();
        this.hide();
        // 战斗发起或推演启动时无需调度，由战斗结束或停轮事件 (DRAGON_SPOUT_ALL_REVEALED) 驱动
        if (target.id !== 'btn-spin' && target.id !== 'btn-prologue-battle' && target.id !== 'btn-quick-equip') {
          this.scheduleCheck(1200);
        }
      };
      target.addEventListener('click', this.targetClickListener, { once: true });

      return true;
    },

    /**
     * 隐藏聚光灯与指示手势
     */
    hide() {
      this.cleanupCurrentTarget();

      if (this.maskEl) {
        this.maskEl.classList.add('hidden');
      }
      if (this.indicatorEl) {
        this.indicatorEl.classList.add('hidden');
      }
      document.body.classList.remove('ftue-spotlight-active');

      document.querySelectorAll('.spotlight-elevated-modal').forEach(m => {
        m.classList.remove('spotlight-elevated-modal');
      });
      document.querySelectorAll('.spotlight-elevated-nav').forEach(n => {
        n.classList.remove('spotlight-elevated-nav');
      });
      document.querySelectorAll('.spotlight-elevated-ancestor').forEach(a => {
        a.classList.remove('spotlight-elevated-ancestor');
      });

      this.currentTargetEl = null;
      this.currentConfig = null;
    },

    /**
     * 清理当前高亮目标相关的样式与点击事件
     */
    cleanupCurrentTarget() {
      if (this.currentTargetEl) {
        this.currentTargetEl.classList.remove('spotlight-active-target');
        if (this.targetClickListener) {
          this.currentTargetEl.removeEventListener('click', this.targetClickListener);
          this.targetClickListener = null;
        }
      }
      if (this.indicatorEl) {
        const fingerEl = this.indicatorEl.querySelector('#spotlight-guide-finger');
        if (fingerEl) fingerEl.style.transform = '';
      }
      document.querySelectorAll('.spotlight-elevated-nav').forEach(n => {
        n.classList.remove('spotlight-elevated-nav');
      });
      document.querySelectorAll('.spotlight-elevated-modal').forEach(m => {
        m.classList.remove('spotlight-elevated-modal');
      });
      document.querySelectorAll('.spotlight-elevated-ancestor').forEach(a => {
        a.classList.remove('spotlight-elevated-ancestor');
      });
    },

    /**
     * 矫正当前指示器坐标
     */
    reposition() {
      if (!this.currentTargetEl || !this.currentConfig) return;
      this.positionIndicator(
        this.currentTargetEl,
        this.currentConfig.direction || 'down',
        this.currentConfig.offset || 10
      );
    },

    /**
     * 计算并设置指示手势的绝对视口坐标
     */
    positionIndicator(targetEl, direction = 'down', offset = 10) {
      if (!targetEl || !this.indicatorEl) return;

      const rect = targetEl.getBoundingClientRect();
      const indRect = this.indicatorEl.getBoundingClientRect();
      const indWidth = indRect.width || 180;
      const indHeight = indRect.height || 60;

      let top = 0;
      let left = 0;
      let resolvedDir = direction;

      // 移除原有的方向指示类
      this.indicatorEl.classList.remove(
        'spotlight-dir-down',
        'spotlight-dir-up',
        'spotlight-dir-left',
        'spotlight-dir-right'
      );

      if (direction === 'down') {
        // 指示器位于目标上方，手指指下 👇
        top = rect.top - indHeight - offset;
        left = rect.left + (rect.width / 2) - (indWidth / 2);
        if (top < 12) {
          // 顶部空间不足，自适应翻转至下方
          resolvedDir = 'up';
          top = rect.bottom + offset;
        }
      } else if (direction === 'up') {
        // 指示器位于目标下方，手指指上 👆
        top = rect.bottom + offset;
        left = rect.left + (rect.width / 2) - (indWidth / 2);
        if (top + indHeight > window.innerHeight - 12) {
          // 底部空间不足，自适应翻转至上方
          resolvedDir = 'down';
          top = rect.top - indHeight - offset;
        }
      } else if (direction === 'left') {
        // 指示器位于目标右侧，手指指左 👈
        top = rect.top + (rect.height / 2) - (indHeight / 2);
        left = rect.right + offset;
      } else if (direction === 'right') {
        // 指示器位于目标左侧，手指指右 👉
        top = rect.top + (rect.height / 2) - (indHeight / 2);
        left = rect.left - indWidth - offset;
      }

      // 限制在屏幕可见视口范围之内 (留 8px 安全边距)
      left = Math.max(8, Math.min(window.innerWidth - indWidth - 8, left));
      top = Math.max(8, Math.min(window.innerHeight - indHeight - 8, top));

      this.indicatorEl.classList.add(`spotlight-dir-${resolvedDir}`);
      this.indicatorEl.style.top = `${Math.round(top)}px`;
      this.indicatorEl.style.left = `${Math.round(left)}px`;

      const fingerEl = this.indicatorEl.querySelector('#spotlight-guide-finger');
      if (fingerEl) {
        if (resolvedDir === 'down') fingerEl.innerText = '👇';
        else if (resolvedDir === 'up') fingerEl.innerText = '👆';
        else if (resolvedDir === 'left') fingerEl.innerText = '👈';
        else if (resolvedDir === 'right') fingerEl.innerText = '👉';

        // 视口边缘夹取时，动态偏移手指，确保手指指尖恒久精准正对目标中心
        if (resolvedDir === 'down' || resolvedDir === 'up') {
          const targetCenterX = rect.left + (rect.width / 2);
          const indicatorCenterX = left + (indWidth / 2);
          const fingerDiffX = targetCenterX - indicatorCenterX;
          const maxFingerOffset = Math.max(0, (indWidth / 2) - 20);
          const clampedOffset = Math.max(-maxFingerOffset, Math.min(maxFingerOffset, fingerDiffX));
          fingerEl.style.transform = `translateX(${Math.round(clampedOffset)}px)`;
        } else {
          fingerEl.style.transform = '';
        }
      }
    },

    /**
     * 全局 FTUE 状态机智能判定并触发聚光灯
     * 按时序闭环严格判定当前玩家处于哪一个新手指引阶段
     */
    checkAndTriggerFTUE(forceImmediate = false) {
      const gm = window.SlotsRPG && window.SlotsRPG.GameManager;
      if (!gm) return;

      // 0. 安全防御：推演旋转中、战斗交锋中、剧情对话展示中，严禁打断沉浸感
      if (gm.renderer && gm.renderer.isSpinning) {
        this.hide();
        return;
      }
      const arenaModal = document.getElementById('modal-battle-arena');
      if (arenaModal && !arenaModal.classList.contains('hidden')) {
        this.hide();
        return;
      }
      const transModal = document.getElementById('modal-battle-transition');
      if (transModal && !transModal.classList.contains('hidden')) {
        this.hide();
        return;
      }
      const modalStoryDialog = document.getElementById('modal-story-dialog') || document.getElementById('modal-story');
      const isStoryActive = (modalStoryDialog && !modalStoryDialog.classList.contains('hidden')) ||
                            (window.storyManager && (window.storyManager.isDialogActive || (window.storyManager.activeStory && window.storyManager.activeStory.isOpen)));
      if (isStoryActive) {
        this.hide();
        return;
      }

      // 0.1 步进缓冲间隔检测：确保上一个操作完成到下一个引导展现之间有充足视觉留白 (>= minStepInterval)
      const timeSinceDismiss = Date.now() - this.lastGuideDismissTime;
      if (!forceImmediate && timeSinceDismiss < this.minStepInterval) {
        this.scheduleCheck(this.minStepInterval - timeSinceDismiss);
        return;
      }

      // ========================================================
      // 弹窗最高优先级队列 (只要任意交互弹窗处于展现状态，聚光灯强制吸附并指引其核心操作按键)
      // ========================================================

      // 1. 作弊器认主弹窗
      const modalAwakening = document.getElementById('modal-awakening');
      if (modalAwakening && !modalAwakening.classList.contains('hidden')) {
        const btnAwakeningAccept = document.getElementById('btn-awakening-accept');
        if (btnAwakeningAccept) {
          this.show({
            id: 'ftue-awakening-accept',
            target: btnAwakeningAccept,
            text: '点击执掌神物 · 前往初测仙缘！',
            direction: 'down'
          });
          return;
        }
      }

      // 1.5 战力暴涨庆典展示弹窗 (常规游戏流程展示，无需用新手引导呈现，弹窗期间保持隐藏)
      const modalPowerGain = document.getElementById('modal-power-gain');
      if (modalPowerGain && !modalPowerGain.classList.contains('hidden')) {
        this.hide();
        return;
      }

      // 2. 叩问仙门弹窗 · 拜入宗门 (仅在未完成序章时引导，防止回切时残留)
      const modalSectInduction = document.getElementById('modal-sect-induction');
      if (!gm.isPrologueComplete && modalSectInduction && !modalSectInduction.classList.contains('hidden')) {
        const firstJoinBtn = modalSectInduction.querySelector('.btn-join-sect');
        if (firstJoinBtn) {
          this.show({
            id: 'ftue-join-sect-btn',
            target: firstJoinBtn,
            text: '点击叩问仙门 · 拜入正统万剑仙宗！',
            direction: 'down'
          });
          return;
        }
      }

      // 3. 伏妖大捷胜利结算弹窗
      const modalBattleVictory = document.getElementById('modal-battle-victory');
      if (modalBattleVictory && !modalBattleVictory.classList.contains('hidden')) {
        const btnVictoryClaim = document.getElementById('btn-victory-claim');
        if (btnVictoryClaim && btnVictoryClaim.offsetParent !== null) {
          this.show({
            id: 'ftue-battle-victory-claim',
            target: btnVictoryClaim,
            text: '伏妖大捷！点击知悉并纳宝入囊！',
            direction: 'up'
          });
          return;
        }
      }

      // 4. 伏妖惜败整备弹窗
      const modalBattleDefeat = document.getElementById('modal-battle-defeat');
      if (modalBattleDefeat && !modalBattleDefeat.classList.contains('hidden')) {
        const btnDefeatConfirm = document.getElementById('btn-defeat-confirm');
        if (btnDefeatConfirm && btnDefeatConfirm.offsetParent !== null) {
          this.show({
            id: 'ftue-battle-defeat-confirm',
            target: btnDefeatConfirm,
            text: '暂避锋芒！点击凝神整备，强化后再战！',
            direction: 'up'
          });
          return;
        }
      }

      // 5. 乾坤袋爆仓报警弹窗
      const modalOverflowAlert = document.getElementById('modal-overflow-alert');
      if (modalOverflowAlert && !modalOverflowAlert.classList.contains('hidden')) {
        const btnOverflowMerge = document.getElementById('btn-overflow-merge');
        if (btnOverflowMerge) {
          this.show({
            id: 'ftue-overflow-merge',
            target: btnOverflowMerge,
            text: '背包爆满！点击一键升阶腾出空格！',
            direction: 'down'
          });
          return;
        }
      }

      // 6. 离线挂机收益结算弹窗
      const modalOfflineExp = document.getElementById('modal-offline-reward') || document.getElementById('modal-offline-exp');
      if (modalOfflineExp && !modalOfflineExp.classList.contains('hidden')) {
        const btnClaimOffline = document.getElementById('btn-claim-offline');
        if (btnClaimOffline && btnClaimOffline.offsetParent !== null) {
          this.show({
            id: 'ftue-claim-offline',
            target: btnClaimOffline,
            text: '离线修炼大有所成！点击一键收纳进账！',
            direction: 'down'
          });
          return;
        }
      }

      // 7. 境界突破喜报弹窗
      const modalLevelUp = document.getElementById('modal-level-up');
      if (modalLevelUp && !modalLevelUp.classList.contains('hidden')) {
        const btnLevelupConfirm = document.getElementById('btn-levelup-confirm');
        if (btnLevelupConfirm && btnLevelupConfirm.offsetParent !== null) {
          this.show({
            id: 'ftue-levelup-confirm',
            target: btnLevelupConfirm,
            text: '境界突破！点击凝心聚气，纳气入体！',
            direction: 'down'
          });
          return;
        }
      }

      // 8. 斩灭宗门守关妖王法牒掉落弹窗
      const modalSectTicketDrop = document.getElementById('modal-sect-ticket-awarded') || document.getElementById('modal-sect-ticket-drop');
      if (modalSectTicketDrop && !modalSectTicketDrop.classList.contains('hidden')) {
        const btnClaimSectTicket = document.getElementById('btn-claim-sect-ticket');
        if (btnClaimSectTicket && btnClaimSectTicket.offsetParent !== null) {
          this.show({
            id: 'ftue-claim-sect-ticket',
            target: btnClaimSectTicket,
            text: '守关妖王伏诛！点击执掌仙门法牒！',
            direction: 'down'
          });
          return;
        }
      }

      // 9. 灵机枯竭天道救济弹窗
      const modalRelief = document.getElementById('modal-relief');
      if (modalRelief && !modalRelief.classList.contains('hidden')) {
        const btnClaimRelief = document.getElementById('btn-claim-relief');
        if (btnClaimRelief && btnClaimRelief.offsetParent !== null) {
          this.show({
            id: 'ftue-claim-relief',
            target: btnClaimRelief,
            text: '灵机告罄！点击天道纳灵获取机缘！',
            direction: 'down'
          });
          return;
        }
      }

      // 10. 锁妖天关挑战弹窗
      const modalDemonTower = document.getElementById('modal-demon-tower');
      if (modalDemonTower && !modalDemonTower.classList.contains('hidden')) {
        const btnTowerFight = document.getElementById('btn-start-tower-battle');
        if (btnTowerFight && btnTowerFight.offsetParent !== null) {
          this.show({
            id: 'ftue-tower-battle-start',
            target: btnTowerFight,
            text: '锁妖天关！点击破关激战迎击更高层！',
            direction: 'down'
          });
          return;
        }
      }

      // 11. 升仙天碑白日飞升弹窗
      const modalAscensionStele = document.getElementById('modal-ascension-stele');
      if (modalAscensionStele && !modalAscensionStele.classList.contains('hidden')) {
        const btnAscendHeaven = document.getElementById('btn-ascend-heaven');
        if (btnAscendHeaven && !btnAscendHeaven.disabled && btnAscendHeaven.offsetParent !== null) {
          this.show({
            id: 'ftue-ascend-heaven',
            target: btnAscendHeaven,
            text: '五卷归一！点击白日飞升，位列仙班！',
            direction: 'down'
          });
          return;
        }
      }

      // 12. 九转轮回结算弹窗
      const modalSamsaraSummary = document.getElementById('modal-samsara-settlement') || document.getElementById('modal-samsara-summary');
      if (modalSamsaraSummary && !modalSamsaraSummary.classList.contains('hidden')) {
        const btnSamsaraConfirm = document.getElementById('btn-samsara-confirm');
        if (btnSamsaraConfirm && btnSamsaraConfirm.offsetParent !== null) {
          this.show({
            id: 'ftue-samsara-confirm',
            target: btnSamsaraConfirm,
            text: '一世功德圆满！点击破入轮回，开启新世！',
            direction: 'down'
          });
          return;
        }
      }

      // 13. 起死回生复活抉择弹窗
      const modalRevive = document.getElementById('modal-revive-prompt');
      if (modalRevive && !modalRevive.classList.contains('hidden')) {
        const btnReviveWatchAd = document.getElementById('btn-revive-watch-ad');
        const btnReviveGiveUp = document.getElementById('btn-revive-give-up');
        const targetRevive = (btnReviveWatchAd && btnReviveWatchAd.offsetParent !== null) ? btnReviveWatchAd : btnReviveGiveUp;
        if (targetRevive && targetRevive.offsetParent !== null) {
          this.show({
            id: 'ftue-revive-prompt',
            target: targetRevive,
            text: '机缘未尽！点击引动造化起死回生！',
            direction: 'down'
          });
          return;
        }
      }

      // 获取当前激活的标签页
      const activeTabEl = document.querySelector('.bottom-nav .nav-item.active');
      const currentTab = activeTabEl ? activeTabEl.id.replace('tab-', '') : 'character';

      // ========================================================
      // 步骤 1: 序章剧情首战 · 拔刀斩凶 (prologueStep 0 ~ 1)
      // ========================================================
      if (!gm.isPrologueComplete && (gm.prologueStep === 0 || gm.prologueStep === 1)) {
        if (currentTab !== 'character') {
          const tabChar = document.getElementById('tab-character');
          if (tabChar) {
            this.show({
              id: 'ftue-nav-char-prologue',
              target: tabChar,
              text: '后山惊现恶兽！点击前往角色面板',
              direction: 'down'
            });
            return;
          }
        } else {
          const btnPrologue = document.getElementById('btn-prologue-battle');
          if (btnPrologue && btnPrologue.offsetParent !== null) {
            this.show({
              id: 'ftue-prologue-battle',
              target: btnPrologue,
              text: '点击拔刀斩凶，迎击恶兽！',
              direction: 'down'
            });
            return;
          }
        }
      }

      // ========================================================
      // 步骤 2: 恶兽已斩 · 唤醒造化古宝 (prologueStep 2)
      // ========================================================
      const isAwakeningModalVisible = modalAwakening && !modalAwakening.classList.contains('hidden');

      if (!gm.isPrologueComplete && gm.prologueStep === 2 && !isAwakeningModalVisible) {
        if (currentTab !== 'character') {
          const tabChar = document.getElementById('tab-character');
          if (tabChar) {
            this.show({
              id: 'ftue-nav-char-awaken',
              target: tabChar,
              text: '斩获神秘古物！点击前往乾坤袋',
              direction: 'down'
            });
            return;
          }
        } else {
          // 在乾坤袋背包网格中寻找【造化天机盘】
          let plateCell = document.getElementById('item-tianji-pan') || document.querySelector('.artifact-plate-slot');
          if (!plateCell) {
            const bagCells = document.querySelectorAll('.bag-cell');
            bagCells.forEach(cell => {
              const txt = cell.innerText || '';
              if (txt.includes('造化天机盘') || txt.includes('天机盘')) {
                plateCell = cell;
              }
            });
          }
          if (plateCell) {
            this.show({
              id: 'ftue-awaken-plate',
              target: plateCell,
              text: '点击造化天机盘，唤醒古宝！',
              direction: 'down'
            });
            return;
          }
        }
      }

      // (步骤 3 作弊器认主已在顶部最高优先级处理)

      // ========================================================
      // 步骤 4: 散修初探 · 首次引龙吐宝 (prologueStep 3 && spins === 0)
      // ========================================================
      if (!gm.isPrologueComplete && gm.prologueStep === 3 && (gm.prologueSpins || 0) === 0 && !gm.hasCompletedFirstDragonSpoutFTUE) {
        if (currentTab !== 'slots') {
          const tabSlots = document.getElementById('tab-slots');
          if (tabSlots) {
            this.show({
              id: 'ftue-nav-slots-spout',
              target: tabSlots,
              text: '天机已启！点击进入神龙吐宝',
              direction: 'down'
            });
            return;
          }
        } else {
          const btnSpin = document.getElementById('btn-spin');
          if (btnSpin) {
            this.show({
              id: 'ftue-first-dragon-spin',
              target: btnSpin,
              text: '点击引龙吐宝，爆天道机缘！',
              direction: 'down'
            });
            return;
          }
        }
      }

      // ========================================================
      // 步骤 4.5: 首抽掉落神兵 · 引导一键收纳 (spins === 1 && !hasCompletedCollectFTUE)
      // ========================================================
      if (!gm.isPrologueComplete && gm.prologueStep === 3 && gm.prologueSpins === 1 && !gm.hasCompletedCollectFTUE) {
        // 自动判定：若临时背包已无物品且背包已有神兵，则标记完成
        const hasTemporaryItems = gm.dragonCabinetManager && gm.dragonCabinetManager.slots.length > 0;
        if (!hasTemporaryItems) {
          gm.hasCompletedCollectFTUE = true;
          this.scheduleCheck(400);
          return;
        }

        if (currentTab !== 'slots') {
          const tabSlots = document.getElementById('tab-slots');
          if (tabSlots) {
            this.show({
              id: 'ftue-nav-slots-spout',
              target: tabSlots,
              text: '天机已启！点击进入神龙吐宝',
              direction: 'down'
            });
            return;
          }
        } else {
          const btnCollect = document.getElementById('btn-collect-all-slots');
          if (btnCollect) {
            this.show({
              id: 'ftue-collect-all-slots',
              target: btnCollect,
              text: '天降神物！点击【一键收纳】存入乾坤袋',
              direction: 'down',
              onClick: () => {
                gm.hasCompletedCollectFTUE = true;
                if (window.SlotsRPG.StorageService) {
                  window.SlotsRPG.StorageService.saveGame(gm, true);
                }
              }
            });
            return;
          }
        }
      }

      // ========================================================
      // 步骤 5: 神兵已入袋 · 引导前往角色修真与一键换装 (spins === 1 && hasCompletedCollectFTUE)
      // ========================================================
      if (!gm.isPrologueComplete && gm.prologueStep === 3 && gm.prologueSpins === 1 && gm.hasCompletedCollectFTUE && !gm.hasCompletedEquipFTUE) {
        // 自动判定：如果玩家已经穿戴上了新爆出的神兵 (非初始凡铁柴刀)，标记完成并推进
        const equippedWeapon = gm.player && gm.player.equipment && gm.player.equipment.weapon;
        const hasEquippedNewWeapon = equippedWeapon && equippedWeapon.id !== 'MORTAL_WEAPON';
        if (hasEquippedNewWeapon) {
          gm.hasCompletedEquipFTUE = true;
          if (window.SlotsRPG.StorageService) {
            window.SlotsRPG.StorageService.saveGame(gm, true);
          }
          this.scheduleCheck(800);
          return;
        }

        if (currentTab !== 'character') {
          this.characterTabEnterTime = 0;
          const tabChar = document.getElementById('tab-character');
          if (tabChar) {
            this.show({
              id: 'ftue-nav-char-equip',
              target: tabChar,
              text: '神兵已入袋！点击底部的【角色修真】前往佩戴',
              direction: 'down',
              onClick: () => {
                this.characterTabEnterTime = Date.now();
                this.lastGuideDismissTime = Date.now();
                this.hide();
                this.scheduleCheck(1200);
              }
            });
            return;
          }
        } else {
          // 已经处于角色修真界面：给玩家一定的反应时间 (1000ms)，让玩家了解角色界面
          if (!this.characterTabEnterTime) {
            this.characterTabEnterTime = Date.now();
          }
          const timeOnCharTab = Date.now() - this.characterTabEnterTime;
          if (timeOnCharTab < 1000) {
            this.hide();
            this.scheduleCheck(1000 - timeOnCharTab + 50);
            return;
          }

          const btnQuickEquip = document.getElementById('btn-quick-equip');
          if (btnQuickEquip) {
            btnQuickEquip.disabled = false;
            btnQuickEquip.classList.remove('disabled');
            this.show({
              id: 'ftue-quick-equip',
              target: btnQuickEquip,
              text: '点击【一键装备】，神兵入鞘！',
              direction: 'down',
              onClick: () => {
                gm.hasCompletedEquipFTUE = true;
                this.hide();
                if (window.SlotsRPG.StorageService) {
                  window.SlotsRPG.StorageService.saveGame(gm, true);
                }
              }
            });
            return;
          }
        }
      }

      // ========================================================
      // 步骤 6: 散修探寻中 · 引导切回神龙推演 (绝对单次引导：玩家点击或切回后永久锁死不再弹出)
      // ========================================================
      if (!gm.isPrologueComplete && gm.prologueStep === 3 && gm.prologueSpins >= 1 && gm.prologueSpins < 6 && gm.hasCompletedEquipFTUE && !gm.hasCompletedSlotsReturnFTUE) {
        // 安全前置：若战力暴涨弹窗仍处于展现状态，必须等待动画与弹窗彻底关闭后再行引导
        const isPowerGainActive = modalPowerGain && !modalPowerGain.classList.contains('hidden');
        if (isPowerGainActive) {
          this.hide();
          return;
        }
        if (currentTab !== 'slots') {
          const tabSlots = document.getElementById('tab-slots');
          if (tabSlots) {
            this.show({
              id: 'ftue-nav-slots-continue',
              target: tabSlots,
              text: '神兵已佩，实力大增！点击前往【神龙吐宝】继续推演',
              direction: 'down',
              onClick: () => {
                gm.hasCompletedSlotsReturnFTUE = true;
                if (window.SlotsRPG.StorageService) {
                  window.SlotsRPG.StorageService.saveGame(gm, true);
                }
              }
            });
            return;
          }
        }
      }

      // (步骤 7 叩问仙门已在顶部最高优先级处理)

      // ========================================================
      // 步骤 8: 拜入仙门后 · 首次妖王试炼 (sectTrialStage === 1)
      // ========================================================
      if (gm.isPrologueComplete && gm.sectTrialStage === 1 && !gm.hasCompletedTrialFTUE) {
        if (currentTab !== 'slots') {
          const tabSlots = document.getElementById('tab-slots');
          if (tabSlots) {
            this.show({
              id: 'ftue-nav-slots-trial',
              target: tabSlots,
              text: '仙门已立！点击前往神龙试炼',
              direction: 'down'
            });
            return;
          }
        } else {
          const trialBanner = document.getElementById('sect-trial-banner');
          if (trialBanner && !trialBanner.classList.contains('hidden') && trialBanner.offsetParent !== null) {
            this.show({
              id: 'ftue-sect-trial-banner',
              target: trialBanner,
              text: '点击妖王试炼，检验道法战力！',
              direction: 'down'
            });
            return;
          }
        }
      }

      // ========================================================
      // 步骤 9: 洞天福地开启 · 首次一键引灵
      // ========================================================
      const tabCave = document.getElementById('tab-cave');
      const isCaveUnlocked = tabCave && !tabCave.classList.contains('tab-locked');
      if (gm.isPrologueComplete && isCaveUnlocked && !gm.hasCompletedCaveFTUE) {
        if (currentTab !== 'cave') {
          this.show({
            id: 'ftue-nav-cave-collect',
            target: tabCave,
            text: '洞天灵脉充盈！点击前往引灵',
            direction: 'down'
          });
          return;
        } else {
          const btnCaveCollect = document.getElementById('btn-cave-collect');
          if (btnCaveCollect && btnCaveCollect.offsetParent !== null) {
            this.show({
              id: 'ftue-cave-collect-btn',
              target: btnCaveCollect,
              text: '点击一键引灵，吸纳天地灵机！',
              direction: 'down'
            });
            return;
          }
        }
      }

      // ========================================================
      // 步骤 10: 伏妖遭遇战就绪 · 拔剑迎战提示
      // ========================================================
      // 若有待决突袭战斗且横幅处于战斗触发态
      if (gm.pendingBattleData) {
        const sectTrialBanner = document.getElementById('sect-trial-banner');
        if (sectTrialBanner && !sectTrialBanner.classList.contains('hidden') && sectTrialBanner.offsetParent !== null) {
          this.show({
            id: 'ftue-pending-battle-engage',
            target: sectTrialBanner,
            text: '妖兽突袭现世！点击横幅拔剑迎战！',
            direction: 'up'
          });
          return;
        }
      }

      // ========================================================
      // 步骤 11: 角色面板法宝可 3合1 升阶
      // ========================================================
      if (currentTab === 'character' && !gm.hasCompletedMergeFTUE) {
        const floatingMergeWrap = document.getElementById('floating-merge-wrap');
        if (floatingMergeWrap && !floatingMergeWrap.classList.contains('hidden')) {
          const btnFloatingMerge = document.getElementById('btn-floating-merge');
          if (btnFloatingMerge && btnFloatingMerge.offsetParent !== null) {
            this.show({
              id: 'ftue-floating-merge',
              target: btnFloatingMerge,
              text: '发现可合成法宝！点击一键升阶(3合1)！',
              direction: 'down',
              onClick: () => {
                gm.hasCompletedMergeFTUE = true;
                if (window.SlotsRPG.StorageService) {
                  window.SlotsRPG.StorageService.saveGame(gm, true);
                }
              }
            });
            return;
          }
        }
      }


      // ========================================================
      // 步骤 13: 每日灵泉秘境可采撷
      // ========================================================
      if (currentTab === 'cave' && !gm.hasCompletedSecretRealmFTUE) {
        const btnSecretRealm = document.getElementById('btn-cave-secret-realm');
        if (btnSecretRealm && btnSecretRealm.classList.contains('ready') && !btnSecretRealm.classList.contains('exhausted') && btnSecretRealm.offsetParent !== null) {
          this.show({
            id: 'ftue-cave-secret-realm',
            target: btnSecretRealm,
            text: '每日造化已备！点击采撷灵泉秘境机缘！',
            direction: 'down',
            onClick: () => {
              gm.hasCompletedSecretRealmFTUE = true;
              if (window.SlotsRPG.StorageService) {
                window.SlotsRPG.StorageService.saveGame(gm, true);
              }
            }
          });
          return;
        }
      }

      // 所有引导条件均不符合，平滑关闭聚光灯
      this.hide();
    }
  };

  // 绑定至全局单例与向后兼容接口
  window.SlotsRPG.SpotlightGuide = SpotlightGuide;
  window.SpotlightGuide = SpotlightGuide;
  window.updateFTUESpotlight = () => SpotlightGuide.checkAndTriggerFTUE();

  // DOM 就绪后自启动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SpotlightGuide.init());
  } else {
    SpotlightGuide.init();
  }
})();
