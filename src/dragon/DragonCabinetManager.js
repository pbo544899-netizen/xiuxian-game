/**
 * DragonCabinetManager.js - 天机宝萃 (6x2 奖励展示区) 与品阶自动归序管理器
 * 
 * 核心逻辑规范：
 * 1. 12个槽位 (6列 x 2行)，位于天工神龙正下方 (截图2区域)。
 * 2. 奖励一个个或分类喷吐落地，落地后按照品阶自动排序：
 *    - 品阶：Q6(神品·红) > battle(妖兽现世) > bonus(秘境) > Q5(仙品·金) > Q4(极品·紫) > Q3(灵品·蓝) > Q2(宝品·绿) > Q1(凡品·灰)
 *    - 后面掉落的高品阶奖励，自动插入到低品前方，其他物品平滑后移
 *    - 若品阶相同，按时间先后 (先得居前) 自动排列
 * 3. 插入时触发 .slot-inserted-burst 闪耀动效，强化高品插到前列的爽快感
 * 4. 内嵌式真龙威势光环与微型能量槽管理 (随龙威演化碧蓝/金辉/炽焰/暴怒)
 * 5. 移出主界面的装备对比框，支持槽位点击直观查看与挂机自动决策
 */
window.SlotsRPG = window.SlotsRPG || {};

(function() {
  const QUALITY_RANK = {
    'Q6': 6,
    'q6': 6,
    'red': 6,
    'battle': 5.5,
    'bonus': 5.2,
    'Q5': 5,
    'q5': 5,
    'orange': 5,
    'gold': 5,
    'Q4': 4,
    'q4': 4,
    'purple': 4,
    'Q3': 3,
    'q3': 3,
    'blue': 3,
    'Q2': 2,
    'q2': 2,
    'green': 2,
    'Q1': 1,
    'q1': 1,
    'white': 1,
    'gray': 1
  };

  class DragonCabinetManager {
    constructor(gameManager) {
      this.gameManager = gameManager;

      // 12个宝萃展示槽位数据
      this.slots = [];
      this.maxSlots = 12;
      this.dropCounter = 0;

      // 准备喷出的奖励队列 (供弹道分步落地触发)
      this.incomingQueue = [];

      // 挂机自动筛选设置
      this.autoSettings = {
        pauseOnPowerIncrease: false,
        autoEquipBetter: false,
        autoSmeltLesser: false,
        autoFightMonsters: true
      };

      this.pendingEquip = null;
      this.pendingBattle = null;
      this.pendingBonus = null;
      this.comparisonData = null;

      this._initSlotClicks();
    }

    /**
     * 绑定 12 个宝萃槽位点击交互
     */
    _initSlotClicks() {
      setTimeout(() => {
        for (let i = 0; i < this.maxSlots; i++) {
          const slotEl = document.getElementById(`dragon-slot-${i}`);
          if (slotEl) {
            slotEl.addEventListener('click', () => this._handleSlotClick(i));
          }
        }
      }, 100);
    }

    _handleSlotClick(index) {
      const slotData = this.slots[index];
      if (!slotData) return;

      if (slotData.type === 'equip' && slotData.item) {
        // 触发系统通用装备详情与穿戴弹窗
        window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('ITEM_CLICKED', { item: slotData.item });
      } else if (slotData.type === 'battle') {
        // 点击妖兽槽位直接进入战斗
        if (this.gameManager && this.gameManager.executePendingBattle) {
          this.gameManager.executePendingBattle();
        }
      } else if (slotData.item) {
        // 点击灵药或机缘物品
        window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('ITEM_CLICKED', { item: slotData.item });
      }
    }

    /**
     * 龙吐宝前准备：解析本次掉落包
     */
    prepareSpout(leftResult, rightResult) {
      this.incomingQueue = [];

      if (leftResult) {
        this.incomingQueue.push({ side: 'left', data: leftResult });
      }
      if (rightResult) {
        this.incomingQueue.push({ side: 'right', data: rightResult });
      }
    }

    /**
     * 判定装备是否应被【天道造化熔炉】智能即时熔炼以抽养抽
     * 核心规则：
     * 1. 必须已达成【全身全紫 Q4+】大圆满解锁条件 (hasUnlockedAutoSmelt === true)
     * 2. 战力提升装备绝不熔炼！
     * 3. 凡铁(Q1)、灵器(Q2)、宝器(Q3) 默认即时回炉返还灵机，永动以抽养抽
     */
    shouldAutoSmeltItem(item) {
      if (!item) return false;
      if (!this.gameManager || !this.gameManager.hasUnlockedAutoSmelt) return false;

      // 战力提升装备绝不熔炼
      const comp = this._calculateComparison(item);
      if (comp && comp.isUpgrade) return false;

      const qCode = (item.qualityCode || item.quality || 'Q1').toUpperCase();
      const autoQualities = (this.gameManager.inventory && this.gameManager.inventory.autoSalvageQualities && this.gameManager.inventory.autoSalvageQualities.length > 0)
        ? this.gameManager.inventory.autoSalvageQualities
        : ['Q1', 'Q2', 'Q3'];

      if (autoQualities.includes(qCode)) {
        return true;
      }

      if (this.autoSettings && this.autoSettings.autoSmeltLesser && ['Q1', 'Q2', 'Q3', 'Q4'].includes(qCode)) {
        return true;
      }

      return false;
    }

    /**
     * 预测奖励飞向的目标槽位索引 (在实际落地插入前用于弹道计算，避免提前修改 DOM 槽位)
     * @param {'left'|'right'|Object} target
     * @returns {number} 0 ~ 11
     */
    predictTargetSlotIndex(target) {
      let rawData = target;
      if (typeof target === 'string') {
        const queueItem = this.incomingQueue.find(item => item.side === target);
        rawData = queueItem ? queueItem.data : null;
      }
      if (!rawData) return Math.min(11, this.slots.length);

      if (rawData.type === 'equip' && rawData.item && this.shouldAutoSmeltItem(rawData.item)) {
        return -1; // 熔炉炼化目标 (指向下方灵机/控制台)
      }

      let stackKey = null;
      if (rawData.type === 'energy') stackKey = 'energy';
      else if (rawData.type === 'pill') stackKey = `pill_${rawData.subType || (rawData.item && rawData.item.subType) || 'exp'}`;
      else if (rawData.type === 'rune') stackKey = `rune_${rawData.symbolId || (rawData.item && rawData.item.symbolId) || 'SYM_01'}`;
      else if (rawData.type === 'battle') stackKey = 'battle';
      else if (rawData.type === 'bonus') stackKey = 'bonus';

      if (stackKey) {
        const existingIdx = this.slots.findIndex(s => s.stackKey === stackKey);
        if (existingIdx !== -1) return existingIdx;
      }
      return Math.min(11, this.slots.length);
    }

    /**
     * 兼容既有弹道落点调用：单发落地揭晓
     * @param {'left'|'right'} side 
     * @param {Object} [options={}] 可选参数 { visuallyPending: boolean, isEpic: boolean }
     * @returns {number} 插入后的槽位索引
     */
    revealSlot(side, options = {}) {
      const idx = this.incomingQueue.findIndex(item => item.side === side);
      if (idx === -1) return 0;

      const queueItem = this.incomingQueue.splice(idx, 1)[0];
      return this.addItemFromSpout(queueItem.data, options);
    }

    /**
     * 将喷出的奖励插入展示区并执行同品类堆叠与品阶自动归序
     * 规则：
     * 1. 相同品类（如天道灵石、同种丹药、道符、妖兽）强制合并占 1 格，累加数值与数量 (xN)，不散落多格
     * 2. 装备及新种类独立占格，按品阶自动前插高品，相同品阶先进居前 (FIFO)
     * @param {Object} rawData 
     * @param {Object} [options={}]
     * @returns {number} 插入或堆叠后的最终槽位索引 (用于高光动效)
     */
    addItemFromSpout(rawData, options = {}) {
      if (!rawData) return 0;

      // 1. 判断是否属于可单格堆叠品类并生成堆叠唯一键 (stackKey)
      let stackKey = null;
      let isStackable = false;

      if (rawData.type === 'energy') {
        stackKey = 'energy';
        isStackable = true;
      } else if (rawData.type === 'pill') {
        const subType = rawData.subType || (rawData.item && rawData.item.subType) || 'exp';
        stackKey = `pill_${subType}`;
        isStackable = true;
      } else if (rawData.type === 'rune') {
        const sym = rawData.symbolId || (rawData.item && rawData.item.symbolId) || 'SYM_01';
        stackKey = `rune_${sym}`;
        isStackable = true;
      } else if (rawData.type === 'battle') {
        stackKey = 'battle';
        isStackable = true;
      } else if (rawData.type === 'bonus') {
        stackKey = 'bonus';
        isStackable = true;
      }

      // 2. 检查临时背包是否已有该品类，若有则原地增量堆叠，绝不散落到不同格子
      if (isStackable && stackKey) {
        const existingSlot = this.slots.find(s => s.stackKey === stackKey);
        if (existingSlot) {
          existingSlot.count = (existingSlot.count || 1) + (rawData.amount || (rawData.item && rawData.item.amount) || 1);
          existingSlot.dropTimestamp = ++this.dropCounter;

          if (stackKey === 'energy') {
            const gain = rawData.energyGain || rawData.payout || 25;
            existingSlot.totalEnergy = (existingSlot.totalEnergy || existingSlot.singleGain || gain) + gain;
            existingSlot.gainText = `+${existingSlot.totalEnergy}机缘 (x${existingSlot.count})`;
          } else if (stackKey.startsWith('pill')) {
            const exp = rawData.expGain || 50;
            existingSlot.totalExp = (existingSlot.totalExp || existingSlot.singleExp || exp) + exp;
            existingSlot.gainText = `+${existingSlot.totalExp}道行 (x${existingSlot.count})`;
          } else if (stackKey.startsWith('rune')) {
            existingSlot.gainText = `x${existingSlot.count} 符宝`;
          } else if (stackKey === 'battle') {
            this.pendingBattle = rawData;
            existingSlot.name = rawData.name || '妖兽现世';
            existingSlot.battleConfig = rawData.battleConfig;
            existingSlot.gainText = '⚔️ 迎战';
          } else if (stackKey === 'bonus') {
            this.pendingBonus = rawData;
            existingSlot.name = rawData.name || '造化秘境';
            existingSlot.bonusCount = (existingSlot.bonusCount || 6) + (rawData.bonusCount || 0);
            existingSlot.gainText = `✨ 秘境 x${existingSlot.count}`;
          }

          this._sortSlots();
          const targetIndex = this.slots.indexOf(existingSlot);
          this.renderSlots(targetIndex, { ...options, isBump: true });
          return targetIndex;
        }
      }

      // 3. 全新物品构建并放入临时背包槽位
      let normalized = null;

      if (rawData.type === 'equip' && rawData.item) {
        const item = rawData.item;

        // 判定是否激活天道造化熔炉即时以抽养抽
        if (this.shouldAutoSmeltItem(item)) {
          const mult = (this.gameManager && this.gameManager.betMultiplier) || 1;
          const qCode = (item.qualityCode || item.quality || 'Q1').toUpperCase();
          let refundEnergy = (item.salvageEnergy || 5) * mult;
          if (qCode === 'Q1') refundEnergy = 5 * mult;
          else if (qCode === 'Q2') refundEnergy = 15 * mult;
          else if (qCode === 'Q3') refundEnergy = 25 * mult;
          else if (qCode === 'Q4') refundEnergy = 50 * mult;

          this.gameManager.energy += refundEnergy;

          const elLingji = document.getElementById('current-lingji-val');
          if (elLingji) {
            elLingji.innerText = this.gameManager.energy;
            elLingji.classList.remove('lingji-gain-pulse');
            void elLingji.offsetWidth;
            elLingji.classList.add('lingji-gain-pulse');
          }

          if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
            window.SlotsRPG.SoundEffects.play('SALVAGE');
          }

          const renderer = this.gameManager ? this.gameManager.renderer : null;
          if (renderer && renderer.addFloatingText && !options.silentFloating) {
            renderer.addFloatingText(`♻️【造化熔炼】${item.name} 炼化为 +${refundEnergy} 灵机！`, '#ffd700');
          }

          window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('ITEM_SALVAGED', {
            item: item,
            energy: refundEnergy,
            autoSmelt: true
          });

          this.gameManager.emitStateChange();
          return -1; // 不占 12 格宝萃展架
        }

        this.pendingEquip = item;
        this.comparisonData = this._calculateComparison(item);

        const isUpgrade = this.comparisonData ? this.comparisonData.isUpgrade : false;
        const diff = this.comparisonData ? this.comparisonData.powerDiff : 0;
        const gainText = isUpgrade 
          ? (diff >= 0 ? `+${diff} ⬆` : `战力 ${item.power}`)
          : `战力 ${item.power || 0}`;

        normalized = {
          type: 'equip',
          stackKey: `equip_${item.id || item.name}`,
          item: item,
          name: item.name,
          icon: item.icon || 'assets/symbols/SYM_06.png',
          quality: (item.quality || item.qualityCode || 'Q1').toUpperCase(),
          qualityRank: QUALITY_RANK[(item.quality || item.qualityCode || 'Q1').toUpperCase()] || 1,
          qualityColor: item.qualityColor || '#94a3b8',
          qualityName: item.qualityName || (window.SlotsRPG.ItemModel.getQualityName && window.SlotsRPG.ItemModel.getQualityName(item.qualityCode)) || '宝器',
          gainText: gainText,
          isUpgrade: isUpgrade,
          powerDiff: diff,
          count: 1,
          dropTimestamp: ++this.dropCounter,
          isLuckyBurst: !!rawData.isLuckyBurst,
          prevQualityCode: rawData.prevQualityCode || null,
          prevQualityName: rawData.prevQualityName || null,
          prevQualityColor: rawData.prevQualityColor || null
        };

        if (!options.silentFloating && isUpgrade && diff > 0 && this.gameManager && this.gameManager.renderer && this.gameManager.renderer.addFloatingText) {
          this.gameManager.renderer.addFloatingText(`⚡ 战力提升 +${diff} ⬆`, '#38ef7d');
        }
      } else if (rawData.type === 'battle') {
        this.pendingBattle = rawData;
        normalized = {
          type: 'battle',
          stackKey: 'battle',
          name: rawData.name || '妖兽现世',
          icon: 'assets/symbols/SYM_12.png',
          quality: 'battle',
          qualityRank: QUALITY_RANK['battle'],
          qualityColor: '#ff4d4f',
          battleConfig: rawData.battleConfig,
          gainText: '⚔️ 迎战',
          count: 1,
          dropTimestamp: ++this.dropCounter
        };
      } else if (rawData.type === 'bonus') {
        this.pendingBonus = rawData;
        normalized = {
          type: 'bonus',
          stackKey: 'bonus',
          name: rawData.name || '造化秘境',
          icon: 'assets/symbols/SYM_13.png',
          quality: 'Q5',
          qualityRank: QUALITY_RANK['bonus'],
          qualityColor: '#ffd700',
          gainText: '✨ 秘境',
          bonusCount: rawData.bonusCount || 6,
          count: 1,
          dropTimestamp: ++this.dropCounter
        };
      } else {
        // 灵药 / 天道灵石 / 符文
        const isEnergy = rawData.type === 'energy';
        const isPill = rawData.type === 'pill';
        const isRune = rawData.type === 'rune';

        let name = isEnergy ? '天道灵石' : (isRune ? '道门真符' : '上品灵药');
        let icon = isEnergy ? 'assets/symbols/SYM_05.png' : (isRune ? 'assets/symbols/SYM_01.png' : 'assets/symbols/SYM_05.png');
        if (rawData.item) {
          name = rawData.item.name || name;
          icon = rawData.item.icon || icon;
        }

        const energyVal = rawData.energyGain || 25;
        const expVal = rawData.expGain || 50;
        const gainText = isEnergy 
          ? `+${energyVal}机缘`
          : (isRune ? 'x1 符宝' : (rawData.desc ? (rawData.desc.length > 8 ? rawData.desc.substring(0, 7) + '..' : rawData.desc) : `+${expVal}道行`));

        const q = (rawData.quality || (isEnergy ? 'Q2' : (isPill ? 'Q3' : 'Q2'))).toUpperCase();

        normalized = {
          type: rawData.type || (isEnergy ? 'energy' : 'pill'),
          stackKey: stackKey || (isEnergy ? 'energy' : 'pill_exp'),
          item: rawData.item || null,
          name: name,
          icon: icon,
          quality: q,
          qualityRank: QUALITY_RANK[q] || 2,
          qualityColor: rawData.qualityColor || (isEnergy ? '#52c41a' : '#1890ff'),
          gainText: gainText,
          isCrit: rawData.isCrit || false,
          count: rawData.amount || 1,
          totalEnergy: isEnergy ? energyVal : 0,
          totalExp: isPill ? expVal : 0,
          singleGain: energyVal,
          singleExp: expVal,
          dropTimestamp: ++this.dropCounter
        };
      }

      this.slots.push(normalized);
      this._sortSlots();

      const insertIndex = this.slots.indexOf(normalized);

      while (this.slots.length > this.maxSlots) {
        const overflow = this.slots.pop();
        const success = this._handleOverflow(overflow);
        if (success === false) {
          this.slots.push(overflow);
          break;
        }
      }

      const isEpic = options.isEpic !== undefined ? options.isEpic : !!(normalized && (
        normalized.type === 'battle' ||
        normalized.type === 'bonus' ||
        ['Q4', 'Q5', 'Q6', 'Q7', 'Q8'].includes((normalized.quality || '').toUpperCase()) ||
        normalized.isUpgrade
      ));
      this.renderSlots(insertIndex, { ...options, isEpic });
      return insertIndex;
    }

    _sortSlots() {
      this.slots.sort((a, b) => {
        if (b.qualityRank !== a.qualityRank) {
          return b.qualityRank - a.qualityRank;
        }
        return a.dropTimestamp - b.dropTimestamp;
      });
    }

    _handleOverflow(overflowItem) {
      if (!overflowItem) return true;
      const gm = this.gameManager;
      if (!gm) return true;

      const itemName = overflowItem.name || (overflowItem.item && overflowItem.item.name) || '天机宝萃';

      // 1. 真实物品转存入乾坤袋 (方案1: 背包满时安全拦截，不丢件不黑盒)
      if (overflowItem.type === 'equip' && overflowItem.item) {
        if (gm.inventory) {
          const res = gm.inventory.addItem(overflowItem.item);
          if (!res.success) {
            return false;
          }
        }
      } else if (overflowItem.type === 'pill' || (overflowItem.item && overflowItem.item.type === 'pill')) {
        const item = overflowItem.item || (window.SlotsRPG && window.SlotsRPG.ItemModel && window.SlotsRPG.ItemModel.createPill(overflowItem.subType || 'exp', overflowItem.count || 1));
        if (item && gm.inventory) {
          const res = gm.inventory.addItem(item);
          if (!res.success) return false;
        }
      } else if (overflowItem.type === 'rune' || (overflowItem.item && overflowItem.item.type === 'rune')) {
        const item = overflowItem.item || (window.SlotsRPG && window.SlotsRPG.ItemModel && window.SlotsRPG.ItemModel.createTalisman(overflowItem.symbolId || 'SYM_01', overflowItem.count || 1));
        if (item && gm.inventory) {
          const res = gm.inventory.addItem(item);
          if (!res.success) return false;
        }
      } else if (overflowItem.type === 'energy') {
        const energyGain = overflowItem.totalEnergy || overflowItem.singleGain || (overflowItem.count ? overflowItem.count * 25 : 25);
        gm.energy += energyGain;
        gm.emitStateChange();
      }

      // 2. 贴心浮字提示
      if (gm.renderer && gm.renderer.addFloatingText) {
        gm.renderer.addFloatingText(`📦 宝萃已满，【${itemName}】已自动存入乾坤袋`, '#38ef7d');
      }

      // 3. 触发背包红点增加与全局通知
      window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('INVENTORY_CHANGE');
      window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('REWARD_OVERFLOW_SAVED', { item: overflowItem });
      return true;
    }

    /**
     * 刷新 12 个宝萃槽位 DOM
     * @param {number} [highlightIndex=-1] 新插入并高亮的槽位索引
     * @param {Object} [options={}] { isBump: boolean, isEpic: boolean }
     */
    renderSlots(highlightIndex = -1, options = {}) {
      for (let i = 0; i < this.maxSlots; i++) {
        const slotEl = document.getElementById(`dragon-slot-${i}`);
        if (!slotEl) continue;

        const data = this.slots[i];
        const emptyState = slotEl.querySelector('.slot-empty-state');
        const contentEl = slotEl.querySelector('.slot-content');
        const iconEl = slotEl.querySelector('.slot-item-icon');
        const nameEl = slotEl.querySelector('.slot-item-name');
        const badgeEl = slotEl.querySelector('.slot-item-badge');

        // 清理旧的品质与特效类
        slotEl.className = 'dragon-reward-slot';

        if (!data) {
          if (emptyState) emptyState.classList.remove('hidden');
          if (contentEl) contentEl.classList.add('hidden');
        } else {
          if (emptyState) emptyState.classList.add('hidden');
          if (contentEl) contentEl.classList.remove('hidden');

          if (iconEl) iconEl.src = data.icon || 'assets/symbols/SYM_06.png';
          if (nameEl) {
            nameEl.innerText = data.name || '宝萃';
            nameEl.style.color = data.qualityColor || (data.type === 'battle' ? '#ff4d4f' : '#e2e8f0');
          }
          if (badgeEl) {
            // 临时背包只显示图标 + 数量 + 道具名字，不显示“+200道行...”等使用说明
            const count = data.count || 1;
            badgeEl.innerText = `x${count}`;
            badgeEl.style.color = '#ffd700';

            // 连续抽奖同类堆叠数字跳动果冻动效
            if (i === highlightIndex && options.isBump) {
              badgeEl.classList.remove('bump-active');
              void badgeEl.offsetWidth;
              badgeEl.classList.add('bump-active');
            }
          }

          // 添加品阶外光边
          if (data.type === 'battle') {
            slotEl.classList.add('quality-border-battle');
          } else {
            const q = (data.quality || 'Q1').toLowerCase();
            slotEl.classList.add(`quality-border-${q}`);
          }

          // 若指定视觉延迟显现（等待龙嘴吐出的宝物粒子飞抵），先隐藏格子内容 (仅在天机推演面板展示)
          const isSlotsActive = document.getElementById('view-slots')?.classList.contains('active');
          if (options.visuallyPending && i === highlightIndex && isSlotsActive) {
            slotEl.classList.add('slot-pending-flyer');
          } else {
            slotEl.classList.remove('slot-pending-flyer');
          }

          // 若为新插入的槽位且非延迟显现，触发爆破插入高光动效
          if (i === highlightIndex && !options.visuallyPending) {
            if (options.isEpic) {
              slotEl.classList.remove('slot-epic-burst', 'slot-inserted-burst');
              void slotEl.offsetWidth;
              slotEl.classList.add('slot-epic-burst');
            } else {
              slotEl.classList.remove('slot-inserted-burst');
              void slotEl.offsetWidth;
              slotEl.classList.add('slot-inserted-burst');
            }
          }
        }
      }
    }

    /**
     * 宝物飞抵槽位时触发揭示爆破动效
     * @param {number} slotIndex 槽位索引
     * @param {boolean} isEpic 是否极品
     */
    revealSlotImpact(slotIndex, isEpic = false, options = {}) {
      const slotEl = document.getElementById(`dragon-slot-${slotIndex}`);
      if (!slotEl) return;
      slotEl.classList.remove('slot-pending-flyer');
      slotEl.classList.remove('slot-epic-burst', 'slot-inserted-burst', 'slot-fission-cracking', 'slot-fission-burst');

      const data = this.slots[slotIndex];
      const isLucky = options.isLuckyBurst || (data && data.isLuckyBurst);
      if (isLucky) {
        this._playLuckyBurstFission(slotIndex, data);
        return;
      }

      void slotEl.offsetWidth;
      slotEl.classList.add(isEpic ? 'slot-epic-burst' : 'slot-inserted-burst');
      const badgeEl = slotEl.querySelector('.slot-item-badge');
      if (badgeEl) {
        badgeEl.classList.remove('bump-active');
        void badgeEl.offsetWidth;
        badgeEl.classList.add('bump-active');
      }
    }

    /**
     * 播放气运升阶裂变逆转演出 (Lucky Burst Fission)
     * 1. 槽位卡片进入剧烈高频震颤与裂变光痕 (slot-fission-cracking, 240ms)
     * 2. 悬念音效迸发，并在 240ms 处如天雷破壳般轰然炸裂 (slot-fission-burst)
     * 3. 释放 360 度环形绚烂星火粒子，震屏，飘字与悬浮徽章，多巴胺达到顶峰！
     */
    _playLuckyBurstFission(slotIndex, data) {
      const slotEl = document.getElementById(`dragon-slot-${slotIndex}`);
      if (!slotEl) return;

      // 阶段 1：天机裂变蓄势 (悬念震颤)
      slotEl.classList.remove('slot-pending-flyer', 'slot-epic-burst', 'slot-inserted-burst', 'slot-fission-burst');
      void slotEl.offsetWidth;
      slotEl.classList.add('slot-fission-cracking');

      if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('NEAR_MISS', 1);
      }

      // 阶段 2：破壳蜕变大爆
      setTimeout(() => {
        slotEl.classList.remove('slot-fission-cracking');
        void slotEl.offsetWidth;
        slotEl.classList.add('slot-fission-burst');

        // 音效升级
        if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
          window.SlotsRPG.SoundEffects.play('BREAKTHROUGH');
        }

        // 视窗微震
        const viewSlots = document.getElementById('view-slots');
        if (viewSlots) {
          viewSlots.classList.remove('view-slots-shake');
          void viewSlots.offsetWidth;
          viewSlots.classList.add('view-slots-shake');
          setTimeout(() => viewSlots.classList.remove('view-slots-shake'), 300);
        }

        // 粒子迸发
        const renderer = this.gameManager ? this.gameManager.renderer : null;
        if (renderer && renderer.spawnFissionParticles) {
          renderer.spawnFissionParticles(`dragon-slot-${slotIndex}`, data.qualityColor || '#ffd700');
        }

        // 浮字宣告
        const origName = data.prevQualityName || '凡宝';
        const newName = data.qualityName || (data.item && data.item.qualityName) || '灵品';
        if (renderer && renderer.addFloatingText) {
          renderer.addFloatingText(`⚡【天道顿悟 · 气运升阶！】${origName} ➜ 突破升级 ➜ ${newName}！`, '#ffd700');
        }

        // 槽位正上方悬浮徽章弹出动效
        let fissionBadge = slotEl.querySelector('.slot-fission-badge');
        if (!fissionBadge) {
          fissionBadge = document.createElement('div');
          fissionBadge.className = 'slot-fission-badge';
          slotEl.appendChild(fissionBadge);
        }
        fissionBadge.innerText = '⚡ 气运升阶！';
        fissionBadge.classList.remove('badge-animate');
        void fissionBadge.offsetWidth;
        fissionBadge.classList.add('badge-animate');
        setTimeout(() => {
          if (fissionBadge && fissionBadge.parentNode) {
            fissionBadge.remove();
          }
        }, 1200);

        const badgeEl = slotEl.querySelector('.slot-item-badge');
        if (badgeEl) {
          badgeEl.classList.remove('bump-active');
          void badgeEl.offsetWidth;
          badgeEl.classList.add('bump-active');
        }
      }, 240);
    }

    /**
     * 更新龙头内嵌式龙威气场与能量细槽
     * @param {number} rage 龙威值 0~100
     */
    updateRage(rage) {
      const safeRage = Math.min(100, Math.max(0, rage || 0));

      // 1. 更新内嵌能量细槽
      const gaugeFill = document.getElementById('dragon-rage-gauge-fill');
      if (gaugeFill) {
        gaugeFill.style.width = `${safeRage}%`;
        if (safeRage < 25) {
          gaugeFill.style.background = 'linear-gradient(90deg, #00e5ff 0%, #00b4d8 100%)';
          gaugeFill.style.boxShadow = '0 0 6px rgba(0, 229, 255, 0.8)';
        } else if (safeRage < 60) {
          gaugeFill.style.background = 'linear-gradient(90deg, #00e5ff 0%, #ffd700 100%)';
          gaugeFill.style.boxShadow = '0 0 8px rgba(255, 215, 0, 0.8)';
        } else if (safeRage < 100) {
          gaugeFill.style.background = 'linear-gradient(90deg, #ffd700 0%, #ff8c00 70%, #ff3d00 100%)';
          gaugeFill.style.boxShadow = '0 0 10px rgba(255, 61, 0, 0.9)';
        } else {
          gaugeFill.style.background = 'linear-gradient(90deg, #ff0055 0%, #ffd700 50%, #ff0055 100%)';
          gaugeFill.style.boxShadow = '0 0 14px #ff0055';
        }
      }

      // 2. 更新龙头背景光晕气场颜色流转
      const aura = document.getElementById('dragon-rage-aura');
      if (aura) {
        aura.classList.remove('rage-calm', 'rage-warm', 'rage-blazing', 'rage-frenzy');
        if (safeRage < 25) {
          aura.classList.add('rage-calm');
        } else if (safeRage < 60) {
          aura.classList.add('rage-warm');
        } else if (safeRage < 100) {
          aura.classList.add('rage-blazing');
        } else {
          aura.classList.add('rage-frenzy');
        }
      }

      // 3. 兼容更新旧引用 (若存在)
      const oldFill = document.getElementById('dragon-rage-bar-fill');
      const oldText = document.getElementById('dragon-rage-text');
      if (oldFill) oldFill.style.width = `${safeRage}%`;
      if (oldText) oldText.innerText = `${safeRage} / 100`;
    }

    /**
     * 计算装备差异对比
     */
    _calculateComparison(newEquip) {
      const player = this.gameManager ? this.gameManager.player : null;
      if (!player) return null;

      const part = newEquip.part;
      const currentEquip = player.equipment ? player.equipment[part] : null;

      const newStats = newEquip.stats || { hp: 0, atk: 0, def: 0 };
      const curStats = currentEquip ? (currentEquip.stats || { hp: 0, atk: 0, def: 0 }) : { hp: 0, atk: 0, def: 0 };

      const curPower = currentEquip ? (currentEquip.power || 0) : 0;
      const newPower = newEquip.power || 0;
      const powerDiff = newPower - curPower;

      return {
        part: part,
        slotName: newEquip.slotName || '法宝',
        currentEquip: currentEquip,
        newEquip: newEquip,
        isUpgrade: powerDiff > 0 || !currentEquip,
        powerDiff: powerDiff,
        hpDiff: (newStats.hp || 0) - (curStats.hp || 0),
        atkDiff: (newStats.atk || 0) - (curStats.atk || 0),
        defDiff: (newStats.def || 0) - (curStats.def || 0)
      };
    }

    /**
     * 自动穿戴新装备
     */
    equipNewItem() {
      if (!this.pendingEquip || !this.gameManager) return null;

      const player = this.gameManager.player;
      const newEquip = this.pendingEquip;
      const oldEquip = player.equip(newEquip);

      let refundEnergy = 0;
      if (oldEquip) {
        refundEnergy = oldEquip.salvageEnergy || 10;
        this.gameManager.energy += refundEnergy;
      }

      // 标记列表中该装备为已穿戴
      const slotItem = this.slots.find(s => s.item === newEquip);
      if (slotItem) {
        slotItem.isEquipped = true;
        slotItem.gainText = '✅ 已穿戴';
        this.renderSlots();
      }

      window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('PLAYER_EQUIPMENT_CHANGED', {
        slot: newEquip.part,
        newEquip: newEquip,
        oldEquip: oldEquip,
        refundEnergy: refundEnergy
      });

      this.gameManager.emitStateChange();

      if (this.gameManager && this.gameManager.checkAutoSmeltUnlock) {
        this.gameManager.checkAutoSmeltUnlock();
      }

      const powerDiff = this.comparisonData ? this.comparisonData.powerDiff : 0;
      this.pendingEquip = null;
      this.comparisonData = null;

      return {
        success: true,
        powerDiff,
        refundEnergy,
        item: newEquip
      };
    }

    /**
     * 自动熔炼装备
     */
    smeltNewItem() {
      if (!this.pendingEquip || !this.gameManager) return null;

      const mult = (this.gameManager && this.gameManager.betMultiplier) || 1;
      const salvageEnergy = (this.pendingEquip.salvageEnergy || 10) * mult;
      this.gameManager.energy += salvageEnergy;

      if (this.gameManager.addPotExp) {
        this.gameManager.addPotExp(5 * mult);
      }

      const slotItem = this.slots.find(s => s.item === this.pendingEquip);
      if (slotItem) {
        slotItem.isSmelted = true;
        slotItem.gainText = '♻️ 已熔炼';
        this.renderSlots();
      }

      window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('ITEM_SALVAGED', {
        item: this.pendingEquip,
        energy: salvageEnergy
      });

      this.gameManager.emitStateChange();

      const salvagedItem = this.pendingEquip;
      this.pendingEquip = null;
      this.comparisonData = null;

      return {
        success: true,
        energy: salvageEnergy,
        item: salvagedItem
      };
    }

    /**
     * 将当前 12 格宝萃的所有奖励一键转存入背包与机缘池并清空槽位 (用于十连或神龙顿悟)
     * @param {Array<number>} [targetIndices=null] 指定收纳的槽位索引列表；若为 null 则收纳全部
     * @returns {Object} { collectedCount, remainingCount, collectedIndices }
     */
    collectAllToInventory(targetIndices = null) {
      if (!this.slots || this.slots.length === 0) {
        return { collectedCount: 0, remainingCount: 0, collectedIndices: [] };
      }
      const remainingSlots = [];
      const collectedIndices = [];
      let collectedCount = 0;

      for (let i = 0; i < this.slots.length; i++) {
        const s = this.slots[i];
        const shouldCollect = targetIndices === null || targetIndices.includes(i);
        if (shouldCollect) {
          const success = this._handleOverflow(s);
          if (success !== false) {
            collectedCount++;
            collectedIndices.push(i);
            continue;
          }
        }
        remainingSlots.push(s);
      }

      this.slots = remainingSlots;
      this.renderSlots();

      const gm = this.gameManager;
      if (remainingSlots.length > 0) {
        if (gm && gm.renderer && gm.renderer.addFloatingText) {
          gm.renderer.addFloatingText(`⚠️ 乾坤袋已满，未能收纳的 ${remainingSlots.length} 件法宝保留在展架上！`, '#ff9800');
        }
      } else {
        if (gm && gm.renderer && gm.renderer.addFloatingText) {
          gm.renderer.addFloatingText('📦 天机宝萃已全数收纳归仓！', '#38ef7d');
        }
      }

      window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('TEMPORARY_SLOTS_COLLECTED', {
        collectedCount,
        remainingCount: remainingSlots.length
      });

      return {
        collectedCount,
        remainingCount: remainingSlots.length,
        collectedIndices
      };
    }

    clear() {
      if (this.incomingQueue && this.incomingQueue.length > 0) {
        this.incomingQueue.forEach(qItem => {
          if (qItem && qItem.data) {
            this._handleOverflow(qItem.data);
          }
        });
        this.incomingQueue = [];
      }
      this.slots = [];
      this.pendingEquip = null;
      this.pendingBattle = null;
      this.pendingBonus = null;
      this.comparisonData = null;
      this.renderSlots();
    }
  }

  window.SlotsRPG.DragonCabinetManager = DragonCabinetManager;
})();
