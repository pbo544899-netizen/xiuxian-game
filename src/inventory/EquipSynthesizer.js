/**
 * EquipSynthesizer.js - 装备锻造与回收算法系统
 * 负责 3 合 1 升阶锻造算法、一键批量分解机缘计算与智能合成调度
 * 严格遵循 PRD 5.4 节装备品质与合成规则
 */
window.SlotsRPG = window.SlotsRPG || {};

class EquipSynthesizer {
  /**
   * 执行一键 3 合 1 升阶锻造
   * @param {InventoryManager} inventory - 背包管理器
   * @returns {Object} 锻造结果摘要 { mergedGroupsCount, upgradedItems, freedSlots }
   */
  static mergeThreeInOne(inventory) {
    const ItemModel = window.SlotsRPG.ItemModel;
    const upgradedItems = [];
    let mergedGroupsCount = 0;

    // 持续循环合成，直到没有可 3 合 1 的组合
    let hasMoreMerges = true;
    while (hasMoreMerges) {
      hasMoreMerges = false;

      // 1. 分组统计背包中可合成的装备 (按 部位_品质 分组)
      const groups = {};
      for (let i = 0; i < inventory.capacity; i++) {
        const item = inventory.slots[i];
        if (item && item.type === 'equip' && item.qualityCode !== 'Q8') {
          const key = `${item.part}_${item.qualityCode}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(i); // 记录槽位索引
        }
      }

      // 2. 查找首个达到 3 件的分组
      for (let key in groups) {
        const slotIndices = groups[key];
        if (slotIndices.length >= 3) {
          const [idx1, idx2, idx3] = slotIndices;
          const baseItem = inventory.slots[idx1];
          const nextQuality = ItemModel.getNextQuality(baseItem.qualityCode);

          if (nextQuality) {
            // 移除 3 件旧装备
            inventory.slots[idx1] = null;
            inventory.slots[idx2] = null;
            inventory.slots[idx3] = null;

            // 生成 1 件高一阶全新装备 (继承当前大世界阶位)
            const curWorldTier = (inventory.gameManager && inventory.gameManager.currentWorldTier) || 1;
            const newItem = ItemModel.createEquipment(baseItem.part, nextQuality, curWorldTier);
            
            // 放入第一个空格
            inventory.slots[idx1] = newItem;

            upgradedItems.push(newItem);
            mergedGroupsCount++;
            hasMoreMerges = true;
            break; // 触发一次后重新扫描，以支持连续递进合成 (如 3件Q1->Q2, 刚好又凑齐3件Q2)
          }
        }
      }
    }

    if (mergedGroupsCount > 0) {
      inventory.flushOverflowBuffer();
    }

    return {
      mergedGroupsCount,
      upgradedItems,
      freedSlots: mergedGroupsCount * 2 // 每次 3 合 1 净释放 2 个空格
    };
  }

  /**
   * 一键批量分解指定品质的装备
   * @param {InventoryManager} inventory - 背包管理器
   * @param {Array<string>} targetQualities - 要分解的品质数组，默认 ['Q1', 'Q2'] (凡铁/灵器)
   * @returns {Object} 分解结果 { count, totalEnergy, items }
   */
  static salvageByQualities(inventory, targetQualities = ['Q1', 'Q2']) {
    let count = 0;
    let totalEnergy = 0;
    const salvagedItems = [];

    for (let i = 0; i < inventory.capacity; i++) {
      const item = inventory.slots[i];
      if (item && item.type === 'equip' && !item.isLocked) {
        if (targetQualities.includes(item.qualityCode)) {
          const energy = item.salvageEnergy || 5;
          totalEnergy += energy;
          salvagedItems.push(item);
          inventory.slots[i] = null;
          count++;
        }
      }
    }

    if (count > 0) {
      inventory.flushOverflowBuffer();
    }

    return {
      count,
      totalEnergy,
      salvagedItems
    };
  }

  /**
   * 判断当前背包是否满足 3 合 1 升阶条件 (是否存在至少一组 3 件同部位同品质未满阶装备)
   * @param {InventoryManager} inventory
   * @returns {boolean}
   */
  static canMergeThreeInOne(inventory) {
    if (!inventory || !inventory.slots) return false;
    const groups = {};
    for (let i = 0; i < inventory.capacity; i++) {
      const item = inventory.slots[i];
      if (item && item.type === 'equip' && item.qualityCode !== 'Q8') {
        const key = `${item.part}_${item.qualityCode}`;
        groups[key] = (groups[key] || 0) + 1;
        if (groups[key] >= 3) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 判断当前背包是否有可分解的装备
   * @param {InventoryManager} inventory
   * @param {Array<string>} targetQualities - 目标品质
   * @returns {boolean}
   */
  static canSalvageByQualities(inventory, targetQualities = ['Q1', 'Q2']) {
    if (!inventory || !inventory.slots) return false;
    for (let i = 0; i < inventory.capacity; i++) {
      const item = inventory.slots[i];
      if (item && item.type === 'equip' && !item.isLocked) {
        if (targetQualities.includes(item.qualityCode)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * PRD 9.2 节: 查找“3 缺 1”的分组 (恰好有 2 件同部位同品质装备)
   * @param {InventoryManager} inventory
   * @returns {Array<Object>}
   */
  static findNearCompleteGroups(inventory) {
    if (!inventory || !inventory.slots) return [];
    const groups = {};
    for (let i = 0; i < inventory.capacity; i++) {
      const item = inventory.slots[i];
      if (item && item.type === 'equip' && item.qualityCode !== 'Q8') {
        const key = `${item.part}_${item.qualityCode}`;
        if (!groups[key]) {
          groups[key] = {
            key,
            part: item.part,
            qualityCode: item.qualityCode,
            sampleItem: item,
            slotIndices: []
          };
        }
        groups[key].slotIndices.push(i);
      }
    }

    const nearComplete = [];
    for (const key in groups) {
      if (groups[key].slotIndices.length === 2) {
        nearComplete.push(groups[key]);
      }
    }
    return nearComplete;
  }

  /**
   * PRD 9.2 节: 执行【造化天工补全】3合1升阶 (凭空凝聚第 3 件同名同品质法宝)
   * @param {InventoryManager} inventory 
   * @param {string} targetKey - 如 'weapon_Q2'
   * @returns {Object} { success, upgradedItem }
   */
  static completeAndMergeViaAd(inventory, targetKey) {
    const ItemModel = window.SlotsRPG.ItemModel;
    if (!ItemModel) return { success: false, reason: 'ItemModel 未就绪' };

    const candidates = this.findNearCompleteGroups(inventory);
    const targetGroup = candidates.find(g => g.key === targetKey) || candidates[0];
    if (!targetGroup || targetGroup.slotIndices.length !== 2) {
      return { success: false, reason: '未找到符合 3 缺 1 条件的法宝！' };
    }

    const [idx1, idx2] = targetGroup.slotIndices;
    const baseItem = inventory.slots[idx1];
    const nextQuality = ItemModel.getNextQuality(baseItem.qualityCode);
    if (!nextQuality) {
      return { success: false, reason: '已达最高神品品质，无法继续进阶！' };
    }

    // 移除 2 件旧装备
    inventory.slots[idx1] = null;
    inventory.slots[idx2] = null;

    // 凭空合成升华为全新更高阶法宝
    const upgradedItem = ItemModel.createEquipment(baseItem.part, nextQuality);
    inventory.slots[idx1] = upgradedItem;
    inventory.flushOverflowBuffer();

    return {
      success: true,
      upgradedItem,
      freedSlots: 1
    };
  }
}

window.SlotsRPG.EquipSynthesizer = EquipSynthesizer;
