/**
 * DragonCabinetManager.js - 乾坤双宝匣 (类似背包的宝物列表展示) 与即时换装决策管理器
 * 负责管理龙头下方左侧【造化玄兵宝匣】与右侧【天道灵材宝匣】的多槽位背包列表、
 * 装备数值对比、战力提升高亮提示以及【一键穿戴 (旧装回炉)】与【熔炼换灵】的极爽即时操作闭环
 */
window.SlotsRPG = window.SlotsRPG || {};

(function() {
  class DragonCabinetManager {
    constructor(gameManager) {
      this.gameManager = gameManager;

      // 左右双背包格子列表 (每侧 4 个格子: 2x2 网格)
      this.leftSlots = [null, null, null, null];
      this.rightSlots = [null, null, null, null];

      // 暂存准备吐入的奖励 (等待弹道依次落地 reveal)
      this.incomingLeft = null;
      this.incomingRight = null;

      // 挂机自动筛选偏好
      this.autoSettings = {
        pauseOnPowerIncrease: false, // 战力提升时暂停自动推演 (供玩家手动欣赏/核对)
        autoEquipBetter: false,      // 默认手动决策体验爽感，挂机时可勾选
        autoSmeltLesser: false,      // 默认手动决策，挂机时可勾选
        autoFightMonsters: true      // 遭遇妖兽自动迎战
      };

      this.pendingEquip = null;
      this.pendingBattle = null;
      this.pendingBonus = null;
      this.comparisonData = null;

      this._initSlotClicks();
    }

    /**
     * 绑定背包槽位点击查看详情/操作
     */
    _initSlotClicks() {
      // 延迟到 DOM 就绪后绑定
      setTimeout(() => {
        for (let i = 0; i < 4; i++) {
          const leftEl = document.getElementById(`bag-left-slot-${i}`);
          if (leftEl) {
            leftEl.addEventListener('click', () => this._handleSlotClick('left', i));
          }
          const rightEl = document.getElementById(`bag-right-slot-${i}`);
          if (rightEl) {
            rightEl.addEventListener('click', () => this._handleSlotClick('right', i));
          }
        }
      }, 100);
    }

    _handleSlotClick(side, index) {
      const slotData = (side === 'left' ? this.leftSlots : this.rightSlots)[index];
      if (!slotData) return;

      if (side === 'left') {
        if (slotData.type === 'equip' && slotData.item) {
          // 若为第 0 格且有未决断对比，唤醒即时决策条
          if (index === 0 && this.comparisonData) {
            const bar = document.getElementById('dragon-gear-compare-bar');
            if (bar) bar.classList.remove('hidden');
          }
          // 触发系统通用物品详情弹窗
          window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('ITEM_CLICKED', { item: slotData.item });
        } else if (slotData.type === 'battle') {
          // 点击妖兽槽位进入战斗
          if (this.gameManager && this.gameManager.executePendingBattle) {
            this.gameManager.executePendingBattle();
          }
        }
      } else {
        // 右侧灵材点击
        if (slotData.item) {
          window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('ITEM_CLICKED', { item: slotData.item });
        }
      }
    }

    /**
     * 引龙喷吐前准备：暂存即将喷出的奖励
     */
    prepareSpout(leftResult, rightResult) {
      this.incomingLeft = leftResult;
      this.incomingRight = rightResult;

      // 高亮左侧和右侧的 0 号主槽位等待喷吐落点
      const leftSlot0 = document.getElementById('bag-left-slot-0');
      const rightSlot0 = document.getElementById('bag-right-slot-0');
      if (leftSlot0) leftSlot0.classList.add('anticipating');
      if (rightSlot0) rightSlot0.classList.add('anticipating');
    }

    /**
     * 单侧槽位揭晓 (当弹道飞抵槽位并爆炸时被触发，节奏分明)
     * @param {'left'|'right'} side 
     */
    revealSlot(side) {
      if (side === 'left') {
        const leftResult = this.incomingLeft;
        this.incomingLeft = null;
        const leftSlot0 = document.getElementById('bag-left-slot-0');
        if (leftSlot0) leftSlot0.classList.remove('anticipating');

        if (leftResult) {
          if (leftResult.type === 'equip' && leftResult.item) {
            const item = leftResult.item;
            this.pendingEquip = item;
            this.comparisonData = this._calculateComparison(item);

            // 推进格子历史 (新宝物置顶于第 0 格)
            this.leftSlots.pop();
            this.leftSlots.unshift({
              type: 'equip',
              item: item,
              name: item.name,
              icon: item.icon || 'assets/symbols/SYM_06.png',
              quality: item.quality || 'Q1',
              qualityColor: item.qualityColor || '#94a3b8',
              isNew: true,
              isUpgrade: this.comparisonData ? this.comparisonData.isUpgrade : false,
              powerDiff: this.comparisonData ? this.comparisonData.powerDiff : 0,
              gainText: this.comparisonData ? (this.comparisonData.powerDiff >= 0 ? `+${this.comparisonData.powerDiff} ⬆` : `战力 ${item.power}`) : `战力 ${item.power}`
            });
          } else if (leftResult.type === 'battle') {
            this.pendingBattle = leftResult;
            this.leftSlots.pop();
            this.leftSlots.unshift({
              type: 'battle',
              name: leftResult.name || '妖兽现世',
              icon: 'assets/symbols/SYM_12.png',
              quality: 'battle',
              qualityColor: '#ff4d4f',
              battleConfig: leftResult.battleConfig,
              gainText: '⚔️ 拔剑迎战',
              isNew: true
            });
          } else if (leftResult.type === 'bonus') {
            this.pendingBonus = leftResult;
            this.leftSlots.pop();
            this.leftSlots.unshift({
              type: 'bonus',
              name: leftResult.name || '造化秘境',
              icon: 'assets/symbols/SYM_13.png',
              quality: 'Q5',
              qualityColor: '#ffd700',
              gainText: '✨ 秘境空间',
              bonusCount: leftResult.bonusCount || 6,
              isNew: true
            });
          }
        }
        this.renderSlots('left');
      } else if (side === 'right') {
        const rightResult = this.incomingRight;
        this.incomingRight = null;
        const rightSlot0 = document.getElementById('bag-right-slot-0');
        if (rightSlot0) rightSlot0.classList.remove('anticipating');

        if (rightResult) {
          const itemObj = rightResult.item || {
            name: '天道灵石',
            icon: 'assets/symbols/SYM_05.png',
            desc: rightResult.desc || `机缘 +${rightResult.energyGain || 25}`
          };
          const gainText = rightResult.desc || (rightResult.energyGain ? `+${rightResult.energyGain} 机缘` : `+${rightResult.expGain || 50} 道行`);

          this.rightSlots.pop();
          this.rightSlots.unshift({
            type: rightResult.type || 'pill',
            item: itemObj,
            name: itemObj.name,
            icon: itemObj.icon,
            quality: rightResult.quality || 'Q2',
            desc: rightResult.desc,
            gainText: gainText,
            isCrit: rightResult.isCrit || false,
            isNew: true
          });
        }
        this.renderSlots('right');
      }
    }

    /**
     * 刷新左右背包槽位的 DOM 显示
     * @param {'left'|'right'} side 
     */
    renderSlots(side) {
      const slots = side === 'left' ? this.leftSlots : this.rightSlots;

      for (let i = 0; i < 4; i++) {
        const slotEl = document.getElementById(`bag-${side}-slot-${i}`);
        if (!slotEl) continue;

        const data = slots[i];
        const emptyMark = slotEl.querySelector('.slot-empty-mark');
        const itemView = slotEl.querySelector('.slot-item-view');
        const iconEl = slotEl.querySelector('.slot-item-icon');
        const nameEl = slotEl.querySelector('.slot-item-name');
        const badgeEl = slotEl.querySelector('.slot-item-badge');

        // 清理旧的品质与特效类
        slotEl.className = `treasure-slot ${i === 0 ? 'primary-slot' : 'history-slot'}`;

        if (!data) {
          if (emptyMark) emptyMark.classList.remove('hidden');
          if (itemView) itemView.classList.add('hidden');
        } else {
          if (emptyMark) emptyMark.classList.add('hidden');
          if (itemView) itemView.classList.remove('hidden');

          // 装填图标、名称与徽标
          if (iconEl) iconEl.src = data.icon || 'assets/symbols/SYM_06.png';
          if (nameEl) {
            nameEl.innerText = data.name || '未知宝物';
            nameEl.style.color = data.qualityColor || (data.type === 'battle' ? '#ff4d4f' : '#e2e8f0');
          }
          if (badgeEl) {
            badgeEl.innerText = data.gainText || '';
            if (data.isUpgrade) {
              badgeEl.style.color = '#52c41a';
            } else if (data.type === 'battle') {
              badgeEl.style.color = '#ff4d4f';
            } else {
              badgeEl.style.color = '#38ef7d';
            }
          }

          // 添加品质外边框与高亮
          if (data.type === 'battle') {
            slotEl.classList.add('quality-border-battle');
          } else {
            const q = (data.quality || 'Q1').toLowerCase();
            slotEl.classList.add(`quality-border-${q}`);
          }

          // 若为刚刚揭晓的第 0 格，触发弹出动效
          if (i === 0 && data.isNew) {
            data.isNew = false;
            if (itemView) {
              itemView.classList.remove('slot-reveal-pop');
              void itemView.offsetWidth; // 触发 reflow
              itemView.classList.add('slot-reveal-pop');
            }
          }
        }
      }
    }

    /**
     * 计算掉落装备与当前在身装备的差异
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
     * 一键穿戴新装备 (旧装备自动回炉折算机缘与蕴灵)
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

      // 标记左侧列表中对应槽位为已穿戴
      if (this.leftSlots[0] && this.leftSlots[0].item === newEquip) {
        this.leftSlots[0].isEquipped = true;
        this.leftSlots[0].gainText = '✅ 已穿戴';
        this.renderSlots('left');
      }

      // 触发战力与装备更新事件
      window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('PLAYER_EQUIPMENT_CHANGED', {
        slot: newEquip.part,
        newEquip: newEquip,
        oldEquip: oldEquip,
        refundEnergy: refundEnergy
      });

      this.gameManager.emitStateChange();

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
     * 熔炼弃用新装备 (直接兑换为机缘与蕴灵)
     */
    smeltNewItem() {
      if (!this.pendingEquip || !this.gameManager) return null;

      const mult = (this.gameManager && this.gameManager.betMultiplier) || 1;
      const salvageEnergy = (this.pendingEquip.salvageEnergy || 10) * mult;
      this.gameManager.energy += salvageEnergy;

      // 额外为天机盘增加少量蕴灵
      if (this.gameManager.addPotExp) {
        this.gameManager.addPotExp(5 * mult);
      }

      // 标记左侧列表中对应槽位为已回炉
      if (this.leftSlots[0] && this.leftSlots[0].item === this.pendingEquip) {
        this.leftSlots[0].isSmelted = true;
        this.leftSlots[0].gainText = '♻️ 已熔炼';
        this.renderSlots('left');
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

    clear() {
      this.leftSlots = [null, null, null, null];
      this.rightSlots = [null, null, null, null];
      this.pendingEquip = null;
      this.pendingBattle = null;
      this.pendingBonus = null;
      this.comparisonData = null;
      this.renderSlots('left');
      this.renderSlots('right');
    }
  }

  window.SlotsRPG.DragonCabinetManager = DragonCabinetManager;
})();
