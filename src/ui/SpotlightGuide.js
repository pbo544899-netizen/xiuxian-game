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

      // 监听全局状态变更与核心驱动事件
      if (window.SlotsRPG && window.SlotsRPG.EventBus) {
        window.SlotsRPG.EventBus.on('STATE_CHANGE', () => this.checkAndTriggerFTUE());
        window.SlotsRPG.EventBus.on('SPIN_STOP', () => {
          setTimeout(() => this.checkAndTriggerFTUE(), 400);
        });
        window.SlotsRPG.EventBus.on('DRAGON_SPOUT_ALL_REVEALED', () => {
          setTimeout(() => this.checkAndTriggerFTUE(), 500);
        });
        window.SlotsRPG.EventBus.on('TAB_CHANGED', () => {
          setTimeout(() => this.checkAndTriggerFTUE(), 180);
        });
        window.SlotsRPG.EventBus.on('PROLOGUE_COMPLETED', () => {
          setTimeout(() => this.checkAndTriggerFTUE(), 450);
        });
        window.SlotsRPG.EventBus.on('SECT_JOINED', () => {
          setTimeout(() => this.checkAndTriggerFTUE(), 550);
        });
        window.SlotsRPG.EventBus.on('SHOW_SECT_INDUCTION', () => {
          setTimeout(() => this.checkAndTriggerFTUE(), 300);
        });
      }
    },

    /**
     * 是否当前正处于引导高亮状态
     */
    isActive() {
      return !!(this.currentTargetEl && this.indicatorEl && !this.indicatorEl.classList.contains('hidden'));
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
        this.hide();
        // 战斗发起或推演启动时无需 450ms 盲查，由战斗结束或停轮事件 (DRAGON_SPOUT_ALL_REVEALED) 驱动
        if (target.id !== 'btn-spin' && target.id !== 'btn-prologue-battle') {
          setTimeout(() => {
            this.checkAndTriggerFTUE();
          }, 450);
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
      }
    },

    /**
     * 全局 FTUE 状态机智能判定并触发聚光灯
     * 按时序闭环严格判定当前玩家处于哪一个新手指引阶段
     */
    checkAndTriggerFTUE() {
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
      const victoryModal = document.getElementById('modal-battle-victory');
      if (victoryModal && !victoryModal.classList.contains('hidden')) {
        this.hide();
        return;
      }
      const defeatModal = document.getElementById('modal-battle-defeat');
      if (defeatModal && !defeatModal.classList.contains('hidden')) {
        this.hide();
        return;
      }
      const modalStory = document.getElementById('modal-story');
      if (modalStory && !modalStory.classList.contains('hidden')) {
        this.hide();
        return;
      }

      // ========================================================
      // 弹窗最高优先级 1: 作弊器认主弹窗 · 执掌神物
      // ========================================================
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

      // ========================================================
      // 弹窗最高优先级 2: 叩问仙门弹窗 · 拜入宗门
      // ========================================================
      const modalSectInduction = document.getElementById('modal-sect-induction');
      if (modalSectInduction && !modalSectInduction.classList.contains('hidden')) {
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
              direction: 'up'
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
              direction: 'up'
            });
            return;
          }
        } else {
          // 在乾坤袋背包网格中寻找【造化天机盘】
          const bagCells = document.querySelectorAll('.bag-cell');
          let plateCell = null;
          bagCells.forEach(cell => {
            const txt = cell.innerText || '';
            if (txt.includes('造化天机盘') || txt.includes('天机盘')) {
              plateCell = cell;
            }
          });
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
              direction: 'up'
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
      // 步骤 5: 首抽爆神兵 · 一键穿戴换装 (spins === 1)
      // ========================================================
      if (!gm.isPrologueComplete && gm.prologueStep === 3 && gm.prologueSpins === 1 && !gm.hasCompletedEquipFTUE) {
        // 自动判定：如果玩家已经穿戴上了新爆出的神兵 (非初始凡铁柴刀)，标记完成并推进
        const equippedWeapon = gm.player && gm.player.equipment && gm.player.equipment.weapon;
        const hasEquippedNewWeapon = equippedWeapon && equippedWeapon.id !== 'MORTAL_WEAPON';
        if (hasEquippedNewWeapon) {
          gm.hasCompletedEquipFTUE = true;
          if (window.SlotsRPG.StorageService) {
            window.SlotsRPG.StorageService.saveGame(gm, true);
          }
          this.checkAndTriggerFTUE();
          return;
        }

        if (currentTab !== 'character') {
          const tabChar = document.getElementById('tab-character');
          if (tabChar) {
            this.show({
              id: 'ftue-nav-char-equip',
              target: tabChar,
              text: '爆出绝世神兵！点击前往角色换装',
              direction: 'up'
            });
            return;
          }
        } else {
          const btnQuickEquip = document.getElementById('btn-quick-equip');
          if (btnQuickEquip) {
            this.show({
              id: 'ftue-quick-equip',
              target: btnQuickEquip,
              text: '点击一键装备，战力立涨！',
              direction: 'down'
            });
            return;
          }
        }
      }

      // ========================================================
      // 步骤 6: 散修探寻中 · 继续引龙推演 (spins 1 ~ 5 && hasCompletedEquipFTUE)
      // ========================================================
      if (!gm.isPrologueComplete && gm.prologueStep === 3 && gm.prologueSpins >= 1 && gm.prologueSpins < 6 && gm.hasCompletedEquipFTUE) {
        if (currentTab !== 'slots') {
          const tabSlots = document.getElementById('tab-slots');
          if (tabSlots) {
            this.show({
              id: 'ftue-nav-slots-continue',
              target: tabSlots,
              text: '神兵已佩！点击前往神龙继续推演',
              direction: 'up'
            });
            return;
          }
        } else {
          const btnSpin = document.getElementById('btn-spin');
          if (btnSpin) {
            this.show({
              id: 'ftue-dragon-spin-continue',
              target: btnSpin,
              text: '点击引龙吐宝，探寻周天机缘！',
              direction: 'down'
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
              direction: 'up'
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
            direction: 'up'
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
