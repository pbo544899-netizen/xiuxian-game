/**
 * InventoryManager.js - 乾坤袋背包管理系统
 * 负责 24 格容器网格管理、999 物品堆叠、智能自动分解、防爆仓溢出缓冲槽与防丢件约束
 * 严格遵循 PRD 5.6 节规范
 */
window.SlotsRPG = window.SlotsRPG || {};

class InventoryManager {
  constructor(initialCapacity = 24) {
    this.capacity = initialCapacity; // 基础 24 格
    this.maxCapacity = 64;           // 扩容上限 64 格
    this.slots = new Array(this.capacity).fill(null); // 24 格槽位
    this.overflowBuffer = [];        // 6 格溢出造化暂存槽
    this.maxOverflow = 6;

    // 自动分解开关 (默认开启凡铁/灵器自动分解，保障连推心流)
    this.autoSalvageEnabled = false; 
    this.autoSalvageQualities = ['Q1', 'Q2']; 

    // 历史已获得物品集合 (用于判断是否是首次获得的新物品图鉴)
    this.discoveredItemKeys = new Set();
  }

  /**
   * 生成道具的唯一类型键名 (用于判断是否曾经获得过/首次图鉴)
   */
  getItemKey(item) {
    if (!item) return '';
    if (item.type === 'rune') return `rune_${item.symbolId}`;
    if (item.type === 'pill') return `pill_${item.subType}`;
    if (item.type === 'equip') return `equip_${item.part}_${item.qualityCode}`;
    return item.id || item.name || '';
  }

  /**
   * 记录物品为已发现/已获得
   */
  recordItemDiscovered(keyOrItem) {
    const key = typeof keyOrItem === 'string' ? keyOrItem : this.getItemKey(keyOrItem);
    if (key) this.discoveredItemKeys.add(key);
  }

  /**
   * 判定物品是否曾获得过
   */
  isItemDiscovered(keyOrItem) {
    const key = typeof keyOrItem === 'string' ? keyOrItem : this.getItemKey(keyOrItem);
    return this.discoveredItemKeys.has(key);
  }

  /**
   * 获取当前空格子数量
   */
  getFreeSlotsCount() {
    return this.slots.filter(item => item === null).length;
  }

  /**
   * 扩容乾坤袋容量
   * @param {number} count - 扩容格数 (默认 +4)
   * @returns {number} 扩容后的新容量
   */
  expandCapacity(count = 4) {
    const newCap = Math.min(this.maxCapacity, this.capacity + count);
    const added = newCap - this.capacity;
    for (let i = 0; i < added; i++) {
      this.slots.push(null);
    }
    this.capacity = newCap;
    this.flushOverflowBuffer();
    return this.capacity;
  }

  /**
   * 查询指定消耗品在背包中的总数量
   * @param {string} type - 'pill' | 'rune'
   * @param {string} subTypeOrSymbolId - 'exp'|'hp' 或 'SYM_01'|'SYM_02'|'SYM_03'
   */
  getItemAmount(type, subTypeOrSymbolId) {
    let total = 0;
    for (let i = 0; i < this.capacity; i++) {
      const item = this.slots[i];
      if (item && item.type === type) {
        if ((type === 'pill' && item.subType === subTypeOrSymbolId) ||
            (type === 'rune' && item.symbolId === subTypeOrSymbolId)) {
          total += item.amount || 0;
        }
      }
    }
    return total;
  }

  /**
   * 消耗背包中指定类型的物品
   * @param {string} type - 'pill' | 'rune'
   * @param {string} subTypeOrSymbolId - 'exp'|'hp' 或 'SYM_01'|'SYM_02'|'SYM_03'
   * @param {number} count - 扣除数量
   * @returns {boolean} 是否成功扣除
   */
  consumeItem(type, subTypeOrSymbolId, count = 1) {
    if (this.getItemAmount(type, subTypeOrSymbolId) < count) {
      return false;
    }
    let remaining = count;
    for (let i = 0; i < this.capacity; i++) {
      const item = this.slots[i];
      if (item && item.type === type) {
        if ((type === 'pill' && item.subType === subTypeOrSymbolId) ||
            (type === 'rune' && item.symbolId === subTypeOrSymbolId)) {
          if (item.amount > remaining) {
            item.amount -= remaining;
            remaining = 0;
            break;
          } else {
            remaining -= item.amount;
            this.slots[i] = null;
            if (remaining === 0) break;
          }
        }
      }
    }
    return true;
  }

  /**
   * 获取乾坤袋中带有红点提示（未读/新获得）的物品数量
   */
  getUnreadCount(predicate) {
    return this.slots.filter(s => {
      if (!s || !s.isNew) return false;
      if (predicate) return predicate(s);
      return true;
    }).length;
  }

  /**
   * 标记指定槽位的物品为已读（消除红点）
   */
  markItemRead(index) {
    if (index >= 0 && index < this.capacity && this.slots[index]) {
      this.slots[index].isNew = false;
    }
  }

  /**
   * 清除所有红点
   */
  clearAllUnread() {
    this.slots.forEach(s => {
      if (s) s.isNew = false;
    });
  }

  /**
   * 是否允许从身上卸下装备 (防丢件硬约束: 空位必须 > 0)
   */
  canUnequip() {
    return this.getFreeSlotsCount() > 0;
  }

  /**
   * 添加入库
   * @param {Object} item - 道具或装备对象
   * @returns {Object} 结果描述 { success, salvaged, energy, buffered, overflowFull, slotIndex }
   */
  addItem(item) {
    if (!item) return { success: false };

    const key = this.getItemKey(item);
    const isFirstDiscovery = key ? !this.discoveredItemKeys.has(key) : false;
    if (key) this.discoveredItemKeys.add(key);

    // 1. 自动分解判定 (仅针对凡铁/灵器装备)
    if (this.autoSalvageEnabled && item.type === 'equip') {
      if (this.autoSalvageQualities.includes(item.qualityCode)) {
        return {
          success: true,
          salvaged: true,
          energy: item.salvageEnergy || 5,
          item: item
        };
      }
    }

    // 2. 堆叠类道具处理 (丹药、道符等)
    if (item.type === 'pill' || item.type === 'rune') {
      for (let i = 0; i < this.capacity; i++) {
        const slot = this.slots[i];
        if (slot && slot.type === item.type && 
            ((slot.type === 'pill' && slot.subType === item.subType) || 
             (slot.type === 'rune' && slot.symbolId === item.symbolId))) {
          if (slot.amount + item.amount <= slot.maxStack) {
            slot.amount += item.amount;
            // 堆叠在已有物品上，绝不置为未读新物品 (彻底消除重复红点骚扰)
            slot.isNew = false;
            return { success: true, slotIndex: i, item: slot };
          } else {
            // 超出 999 分离
            const spaceLeft = slot.maxStack - slot.amount;
            slot.amount = slot.maxStack;
            slot.isNew = false;
            item.amount -= spaceLeft;
          }
        }
      }
    }

    // 3. 寻找第一个空格入库
    const freeIndex = this.slots.findIndex(s => s === null);
    if (freeIndex !== -1) {
      if (item.type === 'pill' || item.type === 'rune') {
        // 仅当玩家历史上从未获得过此符箓/丹药时，作为新发现图鉴标记红点
        item.isNew = isFirstDiscovery;
      } else if (item.type === 'equip') {
        // 装备类若未预先指定，默认保持原有 isNew 或 false
        if (item.isNew === undefined) {
          item.isNew = false;
        }
      }

      this.slots[freeIndex] = item;
      return { success: true, slotIndex: freeIndex, item };
    }

    // 4. 第二道防线：造化暂存槽 (溢出缓冲 6 格)
    if (this.overflowBuffer.length < this.maxOverflow) {
      this.overflowBuffer.push(item);
      return {
        success: true,
        buffered: true,
        bufferCount: this.overflowBuffer.length,
        item
      };
    }

    // 5. 暂存槽也已满，必须阻断并告警
    return {
      success: false,
      overflowFull: true,
      item
    };
  }

  /**
   * 移除指定槽位的物品
   */
  removeItem(index) {
    if (index < 0 || index >= this.capacity) return null;
    const item = this.slots[index];
    this.slots[index] = null;
    this.flushOverflowBuffer(); // 空出位置后尝试从暂存槽补充
    return item;
  }

  /**
   * 获取指定槽位物品
   */
  getItem(index) {
    if (index < 0 || index >= this.capacity) return null;
    return this.slots[index];
  }

  /**
   * 替换或置入槽位
   */
  setItem(index, item) {
    if (index < 0 || index >= this.capacity) return;
    this.slots[index] = item;
  }

  /**
   * 分解指定槽位的单件装备
   * @param {number} index - 背包格子索引
   * @returns {number} 返还的机缘数值
   */
  salvageItem(index) {
    const item = this.getItem(index);
    if (!item || item.type !== 'equip') return 0;
    
    this.removeItem(index);
    return item.salvageEnergy || 5;
  }

  /**
   * 背包一键整理
   * 优先级: 丹药道具 > 装备品质(Q7->Q1) > 部位分类(武器->衣服->戒指->帽子->鞋->腰带) > 战力高低
   */
  sort() {
    const partOrder = { weapon: 1, armor: 2, ring: 3, hat: 4, boots: 5, belt: 6 };
    const qualityWeight = { Q7: 7, Q6: 6, Q5: 5, Q4: 4, Q3: 3, Q2: 2, Q1: 1 };

    // 提取所有非空物品
    const items = this.slots.filter(item => item !== null);

    items.sort((a, b) => {
      // 1. 丹药置顶
      if (a.type === 'pill' && b.type !== 'pill') return -1;
      if (a.type !== 'pill' && b.type === 'pill') return 1;
      if (a.type === 'pill' && b.type === 'pill') {
        return a.subType.localeCompare(b.subType);
      }

      // 2. 装备按品质从高到低 (Q7 -> Q1)
      const qA = qualityWeight[a.qualityCode] || 0;
      const qB = qualityWeight[b.qualityCode] || 0;
      if (qA !== qB) return qB - qA;

      // 3. 按部位分类
      const pA = partOrder[a.part] || 99;
      const pB = partOrder[b.part] || 99;
      if (pA !== pB) return pA - pB;

      // 4. 按战力高低
      return (b.power || 0) - (a.power || 0);
    });

    // 重新铺设槽位
    for (let i = 0; i < this.capacity; i++) {
      this.slots[i] = items[i] || null;
    }

    this.flushOverflowBuffer();
  }

  /**
   * 判断当前背包是否需要/可以整理 (若已完全有序且无空洞，或物品数<=1，则无法整理)
   * @returns {boolean}
   */
  canSort() {
    const nonNullItems = this.slots.filter(item => item !== null);
    if (nonNullItems.length === 0) return false;

    // 1. 如果存在空洞 (非空物品未连续紧凑排列在最前)，则需要整理
    for (let i = 0; i < nonNullItems.length; i++) {
      if (this.slots[i] === null) return true;
    }

    // 2. 如果只有 1 件物品且在位置 0，则无需整理
    if (nonNullItems.length <= 1) return false;

    // 3. 比较相邻物品是否已经满足排序规则
    const partOrder = { weapon: 1, armor: 2, ring: 3, hat: 4, boots: 5, belt: 6 };
    const qualityWeight = { Q7: 7, Q6: 6, Q5: 5, Q4: 4, Q3: 3, Q2: 2, Q1: 1 };

    for (let i = 0; i < nonNullItems.length - 1; i++) {
      const a = nonNullItems[i];
      const b = nonNullItems[i + 1];

      // 丹药置顶
      if (a.type !== 'pill' && b.type === 'pill') return true;
      if (a.type === 'pill' && b.type === 'pill') {
        if ((a.subType || '').localeCompare(b.subType || '') > 0) return true;
        continue;
      }
      if (a.type === 'pill' && b.type !== 'pill') continue;

      // 装备按品质从高到低 (Q7 -> Q1)
      const qA = qualityWeight[a.qualityCode] || 0;
      const qB = qualityWeight[b.qualityCode] || 0;
      if (qA < qB) return true;
      if (qA > qB) continue;

      // 按部位
      const pA = partOrder[a.part] || 99;
      const pB = partOrder[b.part] || 99;
      if (pA > pB) return true;
      if (pA < pB) continue;

      // 按战力高低
      if ((a.power || 0) < (b.power || 0)) return true;
    }

    return false;
  }

  /**
   * 尝试将暂存槽中的物品移入空格
   */
  flushOverflowBuffer() {
    while (this.overflowBuffer.length > 0 && this.getFreeSlotsCount() > 0) {
      const item = this.overflowBuffer.shift();
      const freeIdx = this.slots.findIndex(s => s === null);
      if (freeIdx !== -1) {
        this.slots[freeIdx] = item;
      }
    }
  }

  /**
   * 扩充背包容量 (+4格)
   */
  expandCapacity(additionalSlots = 4) {
    const newCap = Math.min(this.maxCapacity, this.capacity + additionalSlots);
    const added = newCap - this.capacity;
    if (added > 0) {
      for (let i = 0; i < added; i++) {
        this.slots.push(null);
      }
      this.capacity = newCap;
      this.flushOverflowBuffer();
    }
    return this.capacity;
  }

  /**
   * 序列化保存
   */
  serialize() {
    return {
      capacity: this.capacity,
      slots: this.slots,
      overflowBuffer: this.overflowBuffer,
      autoSalvageEnabled: this.autoSalvageEnabled
    };
  }

  /**
   * 反序列化恢复
   */
  deserialize(data) {
    if (!data) return;
    this.capacity = data.capacity || 24;
    this.slots = new Array(this.capacity).fill(null);
    if (Array.isArray(data.slots)) {
      data.slots.forEach((item, idx) => {
        if (idx < this.capacity) this.slots[idx] = item;
      });
    }
    this.overflowBuffer = Array.isArray(data.overflowBuffer) ? data.overflowBuffer : [];
    this.autoSalvageEnabled = !!data.autoSalvageEnabled;
  }
}

window.SlotsRPG.InventoryManager = InventoryManager;
