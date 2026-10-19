/**
 * DragonCabinetManager.js - 乾坤双柜展示与即时换装决策管理器
 * 负责左柜（造化玄兵）与右柜（天道灵材）的状态呈现、装备属性雷达对比、
 * 【一键穿戴 (旧装回炉)】与【熔炼换灵】的极爽即时操作闭环
 */
window.SlotsRPG = window.SlotsRPG || {};

(function() {
  class DragonCabinetManager {
    constructor(gameManager) {
      this.gameManager = gameManager;
      this.leftData = null;
      this.rightData = null;

      // 挂机自动筛选偏好
      this.autoSettings = {
        pauseOnPowerIncrease: false, // 战力提升时暂停自动推演 (供玩家手动欣赏/核对)
        autoEquipBetter: true,       // 战力提升时自动穿戴并回炉旧装
        autoSmeltLesser: true,       // 战力无提升时自动熔炼换取机缘
        autoFightMonsters: true      // 遭遇妖兽自动拔剑迎击
      };

      this.pendingEquip = null;
      this.comparisonData = null;
    }

    /**
     * 更新双柜数据并评估装备对比
     */
    setLoot(leftResult, rightResult) {
      this.leftData = leftResult;
      this.rightData = rightResult;
      this.pendingEquip = null;
      this.comparisonData = null;

      if (leftResult && leftResult.type === 'equip' && leftResult.item) {
        this.pendingEquip = leftResult.item;
        this.comparisonData = this._calculateComparison(leftResult.item);
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
     * 清理当前暂存
     */
    clear() {
      this.leftData = null;
      this.rightData = null;
      this.pendingEquip = null;
      this.comparisonData = null;
    }
  }

  window.SlotsRPG.DragonCabinetManager = DragonCabinetManager;
})();
