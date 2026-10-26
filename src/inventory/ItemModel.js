/**
 * ItemModel.js - 装备与道具数据规格模型
 * 封装装备 Q1~Q8 品质乘区、随机词条浮动、人界/灵界6大部位基准属性及道具工厂
 * 严格遵循 PRD 5.3 品质表与 飞升后高维仙宝规格体系
 */
window.SlotsRPG = window.SlotsRPG || {};

window.SlotsRPG.ItemModel = {
  // 8 阶品质规格表 (人界凡铁~道器 + 灵界通天灵宝/鸿蒙至宝/太初神兵)
  QUALITIES: {
    Q1: { code: 'Q1', name: '凡铁', color: '#8c8c8c', multiplier: 1.0, variance: 0, salvageEnergy: 2 },
    Q2: { code: 'Q2', name: '灵器', color: '#52c41a', multiplier: 1.8, variance: 0.05, salvageEnergy: 5 },
    Q3: { code: 'Q3', name: '宝器', color: '#1890ff', multiplier: 3.2, variance: 0.08, salvageEnergy: 10 },
    Q4: { code: 'Q4', name: '法器', color: '#722ed1', multiplier: 5.8, variance: 0.10, salvageEnergy: 25 },
    Q5: { code: 'Q5', name: '道器', color: '#fa8c16', multiplier: 12.0, variance: 0.12, salvageEnergy: 50 },
    Q6: { code: 'Q6', name: '通天灵宝', color: '#f5222d', multiplier: 30.0, variance: 0.15, salvageEnergy: 100 },
    Q7: { code: 'Q7', name: '鸿蒙至宝', color: '#fadb14', multiplier: 65.0, variance: 0.20, salvageEnergy: 250 },
    Q8: { code: 'Q8', name: '太初神兵', color: '#e056fd', multiplier: 130.0, variance: 0.25, salvageEnergy: 500 }
  },

  // 1. 人界 6 大装备部位基准设定 (WorldTier 1)
  PARTS: {
    weapon: {
      part: 'weapon',
      name: '玄铁剑',
      slotName: '武器',
      icon: 'assets/symbols/SYM_06.png',
      symbolId: 'SYM_06',
      baseStats: { hp: 0, atk: 15, def: 0 },
      unlockLevel: 1
    },
    armor: {
      part: 'armor',
      name: '青云甲',
      slotName: '衣服',
      icon: 'assets/symbols/SYM_07.png',
      symbolId: 'SYM_07',
      baseStats: { hp: 80, atk: 0, def: 8 },
      unlockLevel: 1
    },
    ring: {
      part: 'ring',
      name: '紫金戒',
      slotName: '戒指',
      icon: 'assets/symbols/SYM_08.png',
      symbolId: 'SYM_08',
      baseStats: { hp: 50, atk: 10, def: 0 },
      unlockLevel: 1
    },
    hat: {
      part: 'hat',
      name: '纯阳巾',
      slotName: '帽子',
      icon: 'assets/symbols/SYM_01.png',
      symbolId: 'SYM_01',
      baseStats: { hp: 60, atk: 0, def: 6 },
      unlockLevel: 2
    },
    boots: {
      part: 'boots',
      name: '混元履',
      slotName: '鞋子',
      icon: 'assets/symbols/SYM_09.png',
      symbolId: 'SYM_09',
      baseStats: { hp: 0, atk: 0, def: 12 },
      unlockLevel: 2
    },
    belt: {
      part: 'belt',
      name: '捆仙索',
      slotName: '腰带',
      icon: 'assets/symbols/SYM_10.png',
      symbolId: 'SYM_10',
      baseStats: { hp: 40, atk: 0, def: 8 },
      unlockLevel: 2
    }
  },

  // 2. 灵界 · 飘渺九霄仙域 6 大高维仙宝部位基准设定 (WorldTier 2)
  PARTS_TIER2: {
    weapon: {
      part: 'weapon',
      name: '诛仙青冥剑',
      slotName: '武器',
      icon: 'assets/symbols/SYM_06.png',
      symbolId: 'SYM_06',
      baseStats: { hp: 0, atk: 160, def: 0 },
      unlockLevel: 1
    },
    armor: {
      part: 'armor',
      name: '诸天神煞铠',
      slotName: '衣服',
      icon: 'assets/symbols/SYM_07.png',
      symbolId: 'SYM_07',
      baseStats: { hp: 1400, atk: 0, def: 140 },
      unlockLevel: 1
    },
    ring: {
      part: 'ring',
      name: '虚空须弥戒',
      slotName: '戒指',
      icon: 'assets/symbols/SYM_08.png',
      symbolId: 'SYM_08',
      baseStats: { hp: 900, atk: 110, def: 0 },
      unlockLevel: 1
    },
    hat: {
      part: 'hat',
      name: '紫微通天冠',
      slotName: '帽子',
      icon: 'assets/symbols/SYM_01.png',
      symbolId: 'SYM_01',
      baseStats: { hp: 1000, atk: 0, def: 100 },
      unlockLevel: 2
    },
    boots: {
      part: 'boots',
      name: '缩地步云履',
      slotName: '鞋子',
      icon: 'assets/symbols/SYM_09.png',
      symbolId: 'SYM_09',
      baseStats: { hp: 0, atk: 0, def: 200 },
      unlockLevel: 2
    },
    belt: {
      part: 'belt',
      name: '混元捆仙绫',
      slotName: '腰带',
      icon: 'assets/symbols/SYM_10.png',
      symbolId: 'SYM_10',
      baseStats: { hp: 700, atk: 0, def: 130 },
      unlockLevel: 2
    }
  },

  // 四大战斗流派基础词条配置 (暴击、连击、反震、吸血)
  ARCHETYPE_AFFIX_TYPES: [
    { key: 'critRate', name: '暴击', icon: '🎯', color: '#ffd700' },
    { key: 'comboRate', name: '连击', icon: '⚡', color: '#00e5ff' },
    { key: 'counterRate', name: '反震', icon: '🛡️', color: '#c084fc' },
    { key: 'lifestealRate', name: '吸血', icon: '🩸', color: '#f43f5e' }
  ],

  // 仙道专属被动词条池 (通天灵宝 Q6 及以上随机附加)
  IMMORTAL_AFFIXES: [
    { id: 'affix_true_dmg', name: '【真伤破晓】', desc: '攻击附加 20% 真实穿透伤害', atkBonusPct: 0.20 },
    { id: 'affix_divine_shield', name: '【青莲生生】', desc: '战斗中每回合开始回复 10% 最大气血', healRate: 0.10 },
    { id: 'affix_immortal_body', name: '【不灭神体】', desc: '防御力额外提升 25%', defBonusPct: 0.25 },
    { id: 'affix_crit_god', name: '【天道诛杀】', desc: '暴击率提升 10%', critRateBonus: 0.10 },
    { id: 'affix_lifesteal', name: '【幽冥嗜血】', desc: '攻击伤害的 20% 转化为吸血恢复', lifestealRate: 0.20 },
    { id: 'affix_karma_reflect', name: '【反震星罡】', desc: '受到攻击时反弹 20% 伤害给敌方', reflectRate: 0.20 }
  ],

  /**
   * 工厂方法：创建一件全新装备
   * @param {string} part - 部位 ('weapon'|'armor'|'ring'|'hat'|'boots'|'belt')
   * @param {string} qualityCode - 品质代码 ('Q1'~'Q8')
   * @param {number} worldTier - 1=人界, 2=灵界
   * @returns {Object} 装备数据对象
   */
  createEquipment(part, qualityCode = 'Q1', worldTier = 1) {
    const isImmortalTier = worldTier === 2 || ['Q6', 'Q7', 'Q8'].includes(qualityCode);
    const partDef = (isImmortalTier ? this.PARTS_TIER2[part] : this.PARTS[part]) || this.PARTS[part] || this.PARTS.weapon;
    const quality = this.QUALITIES[qualityCode] || this.QUALITIES.Q1;

    // 计算属性浮动 (1 - variance) ~ (1 + variance)
    const floatRatio = quality.variance > 0 
      ? 1 + (Math.random() * 2 - 1) * quality.variance
      : 1;

    const stats = {
      hp: Math.round(partDef.baseStats.hp * quality.multiplier * floatRatio),
      atk: Math.round(partDef.baseStats.atk * quality.multiplier * floatRatio),
      def: Math.round(partDef.baseStats.def * quality.multiplier * floatRatio)
    };

    // 装备贡献战力估算
    const itemPower = Math.floor(stats.hp * 0.2 + stats.atk * 2.0 + stats.def * 1.5);

    // 抽取专属仙道被动词条 (Q6=1条, Q7=2条, Q8=3条)
    let affixes = [];
    let affixCount = 0;
    if (qualityCode === 'Q6') affixCount = 1;
    else if (qualityCode === 'Q7') affixCount = 2;
    else if (qualityCode === 'Q8') affixCount = 3;

    if (affixCount > 0 && Array.isArray(this.IMMORTAL_AFFIXES)) {
      const shuffled = [...this.IMMORTAL_AFFIXES].sort(() => 0.5 - Math.random());
      affixes = shuffled.slice(0, affixCount).map(a => ({ ...a }));
    }

    // 四大流派属性词条生成 (Q2 及以上装备概率附加特化流派词条)
    const specialStats = {};
    const archetypeTags = [];
    const qRank = parseInt(qualityCode.replace(/\D/g, ''), 10) || 1;
    if (qRank >= 2 && Array.isArray(this.ARCHETYPE_AFFIX_TYPES)) {
      const count = (qRank >= 5 && Math.random() < 0.5) ? 2 : 1;
      const shuffledArchetypes = [...this.ARCHETYPE_AFFIX_TYPES].sort(() => 0.5 - Math.random());
      const selected = shuffledArchetypes.slice(0, count);
      const minPct = 0.02 + (qRank - 2) * 0.035;
      const maxPct = minPct + 0.03 + (qRank - 2) * 0.01;
      selected.forEach(arch => {
        const val = parseFloat((minPct + Math.random() * (maxPct - minPct)).toFixed(3));
        specialStats[arch.key] = val;
        archetypeTags.push({
          key: arch.key,
          name: arch.name,
          icon: arch.icon,
          color: arch.color,
          value: val,
          text: `${arch.icon} ${arch.name} +${Math.round(val * 100)}%`
        });
      });
    }

    const item = {
      id: `EQ_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      type: 'equip',
      part: partDef.part,
      slotName: partDef.slotName,
      baseName: partDef.name,
      name: `${quality.name}·${partDef.name}`,
      qualityCode: quality.code,
      qualityName: quality.name,
      qualityColor: quality.color,
      icon: partDef.icon,
      stats: stats,
      power: itemPower,
      salvageEnergy: quality.salvageEnergy,
      affixes: affixes,
      specialStats: specialStats,
      archetypeTags: archetypeTags,
      archetypeText: archetypeTags.map(t => t.text).join(' · '),
      isImmortal: isImmortalTier,
      isLocked: false,
      isNew: true
    };

    if (affixes.length > 0) {
      item.affixNames = affixes.map(a => a.name).join(' ');
      item.desc = `仙道专属：${affixes.map(a => a.name + a.desc).join('；')}`;
    }
    if (archetypeTags.length > 0) {
      const archDesc = `流派：${archetypeTags.map(t => t.text).join('，')}`;
      item.desc = item.desc ? `${item.desc} | ${archDesc}` : archDesc;
    }

    return item;
  },

  /**
   * 工厂方法：创建丹药或消耗品
   * @param {string} subType - 'hp' | 'exp'
   * @param {number} amount - 数量
   */
  createPill(subType = 'exp', amount = 1) {
    const isExp = subType === 'exp';
    return {
      id: `PILL_${subType}`,
      type: 'pill',
      subType: subType,
      name: isExp ? '九转修为丹' : '太乙气血丹',
      qualityColor: isExp ? '#f9d423' : '#ff416c',
      icon: isExp ? 'assets/symbols/SYM_05.png' : 'assets/symbols/SYM_04.png',
      amount: amount,
      maxStack: 999,
      expValue: isExp ? 100 : 0,
      healPercent: isExp ? 0 : 0.4,
      desc: isExp ? '服用可直接增加 100 点修为经验，助力突破小境界' : '战时服用可立即回复 40% 最大气血',
      isNew: true
    };
  },

  /**
   * 工厂方法：创建道门灵符 (基础资源类)
   * @param {string} symbolId - 'SYM_01'|'SYM_02'|'SYM_03'
   * @param {number} amount - 数量
   */
  createTalisman(symbolId = 'SYM_01', amount = 1) {
    const meta = {
      SYM_01: { name: '聚灵符', qualityColor: '#4ecdc4', icon: 'assets/symbols/SYM_01.png', desc: '基础聚灵符，内蕴天地微弱灵机，推演所得真符' },
      SYM_02: { name: '凝神符', qualityColor: '#45b6fe', icon: 'assets/symbols/SYM_02.png', desc: '中级凝神符，清心明智，聚气凝神之造化符' },
      SYM_03: { name: '破魔符', qualityColor: '#ff6b6b', icon: 'assets/symbols/SYM_03.png', desc: '高级破魔符，朱砂破煞，夺天地造化机缘' }
    }[symbolId] || { name: '聚灵符', qualityColor: '#4ecdc4', icon: 'assets/symbols/SYM_01.png', desc: '道家真符' };

    return {
      id: `RUNE_${symbolId}`,
      type: 'rune',
      symbolId: symbolId,
      name: meta.name,
      qualityColor: meta.qualityColor,
      icon: meta.icon,
      amount: amount,
      maxStack: 999,
      desc: meta.desc,
      isNew: true
    };
  },

  /**
   * 获取品质名称
   */
  getQualityName(code) {
    if (!code) return '凡铁';
    const c = String(code).toUpperCase();
    return (this.QUALITIES[c] && this.QUALITIES[c].name) || '凡铁';
  },

  /**
   * 获取品质对应主色调
   */
  getQualityColor(code) {
    if (!code) return '#8c8c8c';
    const c = String(code).toUpperCase();
    return (this.QUALITIES[c] && this.QUALITIES[c].color) || '#8c8c8c';
  },

  /**
   * 获取下一品质阶级代码
   */
  getNextQuality(currentCode) {
    const sequence = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'];
    const idx = sequence.indexOf(currentCode);
    if (idx >= 0 && idx < sequence.length - 1) {
      return sequence[idx + 1];
    }
    return null; // Q8 已满阶
  }
};
