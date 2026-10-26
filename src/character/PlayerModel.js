/**
 * PlayerModel.js - 修仙角色数据模型
 * 负责角色境界、经验成长递增算法、属性复利增长与综合战力实时结算
 * 严格遵循 PRD 5.1 与 5.2 节规范
 */
window.SlotsRPG = window.SlotsRPG || {};

class PlayerModel {
  constructor() {
    this.level = 1; // 等级 (1~10 对应当前大世界各境界)
    this.exp = 0;   // 当前经验
    this.worldTier = 1; // 当前大世界位面: 1=人界, 2=灵界·飘渺仙域
    
    // 人界境界称号对照表 (Lv 1 ~ Lv 10)
    this.REALM_NAMES = [
      '练气一层', '练气二层', '练气三层', '练气四层', '练气五层',
      '练气六层', '练气七层', '练气八层', '练气九层', '练气大圆满'
    ];

    // 灵界高维境界称号对照表 (PRD 4.3 节: 化神、炼虚、合体、大乘)
    this.REALM_NAMES_TIER2 = [
      '化神初期', '化神中期', '化神后期', '化神大圆满',
      '炼虚初期', '炼虚中期', '炼虚后期', '炼虚大圆满',
      '合体初期', '大乘期大圆满'
    ];

    // 装备栏 (6大槽位)
    // 1级聚宝盆开放: weapon(武器), armor(衣服), ring(戒指)
    // 2级聚宝盆开放: hat(纯阳巾), boots(混元履), belt(捆仙索)
    this.equipment = {
      weapon: {
        id: 'MORTAL_WEAPON',
        part: 'weapon',
        slotName: '武器',
        baseName: '柴刀',
        name: '锈蚀柴刀',
        qualityCode: 'Q1',
        qualityName: '凡铁',
        qualityColor: '#94a3b8',
        stats: { atk: 3, hp: 0, def: 0 },
        power: 6,
        icon: 'assets/symbols/SYM_06.png'
      },
      armor: null,
      ring: null,
      hat: null,
      boots: null,
      belt: null
    };

    this.canBreakthrough = false; // 大境界突破卡点标记 (Lv 10 大圆满需击败赤炼蟒)
    this.currentSect = null;      // 当前所拜入的宗门 ID (如 'wanjian', 'taiyi')
    this.isMortal = false;        // 凡人状态标记 (序章未拜入宗门时为 true)
  }

  /**
   * 获取当前境界称号
   */
  get realmName() {
    if (this.isMortal || this.level === 0) {
      return '凡人境 · 未入道';
    }
    if (this.worldTier === 2) {
      if (this.level <= 10) {
        return this.REALM_NAMES_TIER2[this.level - 1] || '化神境';
      }
      return '渡劫仙尊';
    }
    if (this.level <= 10) {
      return this.REALM_NAMES[this.level - 1] || '练气期';
    }
    return '筑基初期';
  }

  /**
   * 计算当前等级升级所需总经验:
   * RequiredExp(L) = floor(100 * L^1.4 + 50 * L)
   */
  getRequiredExp(level = this.level) {
    if (level <= 0) return 100;
    if (this.worldTier === 2) {
      // 灵界深厚道行需求
      return Math.floor(400 * Math.pow(level, 1.5) + 200 * level);
    }
    return Math.floor(100 * Math.pow(level, 1.4) + 50 * level);
  }

  /**
   * 当前等级的经验上限
   */
  get maxExp() {
    return this.getRequiredExp(this.level);
  }

  /**
   * 计算角色基础裸装属性 (每级复利增长: HP +12%, ATK +10%, DEF +10%)
   * 凡人境: HP=100, ATK=8, DEF=2
   * Lv 1 基础: HP=100, ATK=20, DEF=10
   * 灵界化神基础: HP=2500, ATK=500, DEF=260
   */
  getBaseStats(level = this.level) {
    if (this.isMortal || level === 0) {
      return { hp: 100, atk: 8, def: 2 };
    }
    const l = level - 1;
    let hp, atk, def;
    if (this.worldTier === 2) {
      hp = Math.floor(2500 * Math.pow(1.15, l));
      atk = Math.floor(500 * Math.pow(1.12, l));
      def = Math.floor(260 * Math.pow(1.12, l));
    } else {
      hp = Math.floor(100 * Math.pow(1.12, l));
      atk = Math.floor(20 * Math.pow(1.10, l));
      def = Math.floor(10 * Math.pow(1.10, l));
    }

    // 叠加九转轮回先天道基 (大号转生 20% 属性传承)
    const gm = this.gameManager || (window.SlotsRPG && window.SlotsRPG.GameManager);
    const ascension = gm && gm.ascensionManager;
    if (ascension && ascension.meta && ascension.meta.legacyStats) {
      hp += (ascension.meta.legacyStats.hp || 0);
      atk += (ascension.meta.legacyStats.atk || 0);
      def += (ascension.meta.legacyStats.def || 0);
    }

    return { hp, atk, def };
  }

  /**
   * 汇总装备附加属性
   */
  getEquipmentStats() {
    let hp = 0, atk = 0, def = 0;
    for (let slot in this.equipment) {
      const item = this.equipment[slot];
      if (item && item.stats) {
        hp += item.stats.hp || 0;
        atk += item.stats.atk || 0;
        def += item.stats.def || 0;
      }
    }
    return { hp, atk, def };
  }

  /**
   * 角色总属性 (基础属性 + 装备附加 + 宗门心法修正)
   */
  getTotalStats() {
    const base = this.getBaseStats();
    const equip = this.getEquipmentStats();
    let hp = base.hp + equip.hp;
    let atk = base.atk + equip.atk;
    let def = base.def + equip.def;

    const sectCfg = this.getSectConfig();
    if (sectCfg && sectCfg.statModifiers) {
      const mods = sectCfg.statModifiers;
      if (mods.hpRate) hp = Math.max(1, Math.floor(hp * (1 + mods.hpRate)));
      if (mods.atkRate) atk = Math.max(1, Math.floor(atk * (1 + mods.atkRate)));
      if (mods.defRate) def = Math.max(0, Math.floor(def * (1 + mods.defRate)));
    }

    // 叠加升仙天碑飞升残卷与宗门精魄永久加成 (Meta Progression)
    const gm = this.gameManager || (window.SlotsRPG && window.SlotsRPG.GameManager);
    const ascension = gm && gm.ascensionManager;
    if (ascension && !this.isMortal) {
      const permMods = ascension.getPermanentModifiers();
      if (permMods.hpRate) hp = Math.max(1, Math.floor(hp * (1 + permMods.hpRate)));
      if (permMods.atkRate) atk = Math.max(1, Math.floor(atk * (1 + permMods.atkRate)));
      if (permMods.defRate) def = Math.max(0, Math.floor(def * (1 + permMods.defRate)));
    }

    // 叠加6神装全套共鸣加成 (神装初成 +15% / 六道大圆满 +25%)
    const setBonus = this.getFullSetResonanceBonus();
    if (setBonus && setBonus.hpRate) hp = Math.max(1, Math.floor(hp * (1 + setBonus.hpRate)));
    if (setBonus && setBonus.atkRate) atk = Math.max(1, Math.floor(atk * (1 + setBonus.atkRate)));
    if (setBonus && setBonus.defRate) def = Math.max(0, Math.floor(def * (1 + setBonus.defRate)));

    // 叠加仙宝专属被动词条加成 (Q6~Q8 通天灵宝/鸿蒙至宝/太初神兵)
    let affixAtkRate = 0, affixHpRate = 0, affixDefRate = 0;
    for (let slot in this.equipment) {
      const it = this.equipment[slot];
      if (it && Array.isArray(it.affixes)) {
        it.affixes.forEach(af => {
          if (af.atkBonusPct) affixAtkRate += af.atkBonusPct;
          if (af.defBonusPct) affixDefRate += af.defBonusPct;
          if (af.hpBonusPct) affixHpRate += af.hpBonusPct;
        });
      }
    }
    if (affixAtkRate > 0) atk = Math.round(atk * (1 + affixAtkRate));
    if (affixHpRate > 0) hp = Math.round(hp * (1 + affixHpRate));
    if (affixDefRate > 0) def = Math.round(def * (1 + affixDefRate));

    // PRD 6.1 节: 灵界本命神物【太上混元仙牒】五卷归一升华 (永久全属性 +25%)
    if (this.worldTier === 2) {
      hp = Math.floor(hp * 1.25);
      atk = Math.floor(atk * 1.25);
      def = Math.floor(def * 1.25);
    }

    return { hp, atk, def };
  }

  /**
   * 获取当前基础暴击率 (默认 8%，叠加宗门心法加成与天碑加成及仙宝词条)
   */
  get critRate() {
    let rate = 0.08;
    const sectCfg = this.getSectConfig();
    if (sectCfg && sectCfg.statModifiers && sectCfg.statModifiers.critRateBonus) {
      rate += sectCfg.statModifiers.critRateBonus;
    }

    const gm = window.SlotsRPG && window.SlotsRPG.GameManager;
    const ascension = gm && gm.ascensionManager;
    if (ascension && !this.isMortal) {
      const permMods = ascension.getPermanentModifiers();
      if (permMods.critRateBonus) {
        rate += permMods.critRateBonus;
      }
    }

    // 灵界本命神物额外提供 +5% 暴击
    if (this.worldTier === 2) {
      rate += 0.05;
    }

    // 叠加装备流派词条与仙宝暴击词条
    for (let slot in this.equipment) {
      const it = this.equipment[slot];
      if (it && it.specialStats && it.specialStats.critRate) {
        rate += it.specialStats.critRate;
      }
      if (it && Array.isArray(it.affixes)) {
        it.affixes.forEach(af => {
          if (af.critRateBonus) rate += af.critRateBonus;
        });
      }
    }

    return Math.min(0.75, rate);
  }

  /**
   * 获取当前吸血率 (九死教令 + 仙宝词条)
   */
  get lifestealRate() {
    let rate = 0;
    const gm = window.SlotsRPG && window.SlotsRPG.GameManager;
    const ascension = gm && gm.ascensionManager;
    if (ascension && ascension.meta && ascension.meta.hiddenMarks && ascension.meta.hiddenMarks.jiusi) {
      rate += 0.20;
    }
    for (let slot in this.equipment) {
      const it = this.equipment[slot];
      if (it && it.specialStats && it.specialStats.lifestealRate) {
        rate += it.specialStats.lifestealRate;
      }
      if (it && Array.isArray(it.affixes)) {
        it.affixes.forEach(af => {
          if (af.lifestealRate) rate += af.lifestealRate;
        });
      }
    }
    return Math.min(0.50, rate);
  }

  /**
   * 获取当前连击率 (基础 5% + 装备流派属性)
   */
  get comboRate() {
    let rate = 0.05;
    for (let slot in this.equipment) {
      const it = this.equipment[slot];
      if (it && it.specialStats && it.specialStats.comboRate) {
        rate += it.specialStats.comboRate;
      }
      if (it && Array.isArray(it.affixes)) {
        it.affixes.forEach(af => {
          if (af.comboRateBonus) rate += af.comboRateBonus;
        });
      }
    }
    return Math.min(0.60, rate);
  }

  /**
   * 获取当前反震率 (基础 5% + 装备流派属性 + 反震星罡)
   */
  get counterRate() {
    let rate = 0.05;
    for (let slot in this.equipment) {
      const it = this.equipment[slot];
      if (it && it.specialStats && it.specialStats.counterRate) {
        rate += it.specialStats.counterRate;
      }
      if (it && Array.isArray(it.affixes)) {
        it.affixes.forEach(af => {
          if (af.reflectRate || af.counterRateBonus) {
            rate += (af.reflectRate || af.counterRateBonus);
          }
        });
      }
    }
    return Math.min(0.60, rate);
  }

  /**
   * 获取当前宗门配置
   */
  getSectConfig() {
    if (!this.currentSect || !window.SlotsRPG || !window.SlotsRPG.SectConfig) return null;
    return window.SlotsRPG.SectConfig.getSect(this.currentSect);
  }

  /**
   * 拜入指定宗门并激活对应心法钩子
   * @param {string} sectId - 宗门 ID
   */
  setSect(sectId) {
    this.currentSect = sectId;
    if (window.SlotsRPG && window.SlotsRPG.SectSkillRegistry) {
      window.SlotsRPG.SectSkillRegistry.applySect(sectId, this);
    }
  }

  /**
   * 综合战力计算: Power = floor(HP * 0.2 + ATK * 2.0 + DEF * 1.5)
   */
  get combatPower() {
    const stats = this.getTotalStats();
    let power = Math.floor(stats.hp * 0.2 + stats.atk * 2.0 + stats.def * 1.5);
    // 四大流派特化属性贡献战力
    power += Math.floor(this.critRate * 600 + this.comboRate * 800 + this.counterRate * 600 + this.lifestealRate * 700);
    if (window.gameManager && window.gameManager.titleManager) {
      power += window.gameManager.titleManager.getBonusPower();
    }
    return power;
  }

  /**
   * 初始化凡人采药童子状态 (序章使用)
   * 默认仅装备一把灰色凡铁武器，其余装备不存在
   */
  setupMortalState() {
    this.isMortal = true;
    this.level = 0;
    this.exp = 0;
    this.currentSect = null;
    this.equipment = {
      weapon: {
        id: 'MORTAL_WEAPON',
        part: 'weapon',
        slotName: '武器',
        baseName: '柴刀',
        name: '锈蚀柴刀',
        qualityCode: 'Q1',
        qualityName: '凡铁',
        qualityColor: '#94a3b8',
        stats: { atk: 3, hp: 0, def: 0 },
        power: 6,
        icon: 'assets/symbols/SYM_06.png'
      },
      armor: null,
      belt: null,
      ring: null,
      hat: null,
      boots: null
    };
  }

  /**
   * 序章结业：叩问仙门拜入宗门，蜕变为修真者
   * @param {string} sectId - 所拜宗门 ID
   */
  promoteToCultivator(sectId) {
    this.isMortal = false;
    this.level = 1;
    this.exp = 0;
    // 换上道门凡阶灵装
    if (window.SlotsRPG && window.SlotsRPG.ItemModel) {
      this.equipment.weapon = window.SlotsRPG.ItemModel.createEquipment('weapon', 'Q1');
      this.equipment.weapon.name = '青锋木剑';
      this.equipment.armor = window.SlotsRPG.ItemModel.createEquipment('armor', 'Q1');
      this.equipment.armor.name = '粗布道袍';
    } else {
      this.equipment.weapon = {
        id: 'EQ_INIT_WEAPON',
        part: 'weapon',
        slotName: '武器',
        baseName: '木剑',
        name: '青锋木剑',
        qualityCode: 'Q1',
        qualityName: '凡阶',
        qualityColor: '#cbd5e1',
        stats: { atk: 5, hp: 0, def: 0 },
        power: 10,
        icon: 'assets/symbols/SYM_06.png'
      };
      this.equipment.armor = {
        id: 'EQ_INIT_ARMOR',
        part: 'armor',
        slotName: '衣服',
        baseName: '道袍',
        name: '粗布道袍',
        qualityCode: 'Q1',
        qualityName: '凡阶',
        qualityColor: '#cbd5e1',
        stats: { hp: 15, def: 2, atk: 0 },
        power: 6,
        icon: 'assets/symbols/SYM_07.png'
      };
    }
    this.equipment.belt = null; // 聚宝盆1阶开放武器、防具、戒指
    if (sectId) {
      this.setSect(sectId);
    }
  }

  /**
   * 增加角色经验
   * @param {number} amount - 获得的经验值
   * @returns {Array} 本次升级触发的升级记录 [{ oldLevel, newLevel, oldRealm, newRealm, oldStats, newStats }]
   */
  addExp(amount) {
    if (amount <= 0) return [];
    // 凡人阶段尚未叩问仙门入道，不积累修真经验与升级判定
    if (this.isMortal) return [];
    const levelUpHistory = [];

    // 若已达练气大圆满且尚未突破大境界，经验锁死
    if (this.level >= 10 && this.canBreakthrough) {
      return [];
    }

    this.exp += amount;

    // 循环判定升级
    while (this.level < 10 && this.exp >= this.maxExp) {
      const oldLevel = this.level;
      const oldRealm = this.realmName;
      const oldStats = this.getTotalStats();
      const oldPower = this.combatPower;
      const req = this.maxExp;

      this.exp -= req;
      this.level++;

      const newLevel = this.level;
      const newRealm = this.realmName;
      const newStats = this.getTotalStats();
      const newPower = this.combatPower;

      levelUpHistory.push({
        oldLevel,
        newLevel,
        oldRealm,
        newRealm,
        oldStats,
        newStats,
        oldPower,
        newPower
      });
    }

    // 到达 Lv 10 大圆满处理
    if (this.level === 10) {
      const req = this.maxExp;
      if (this.exp >= req) {
        this.exp = req;
        this.canBreakthrough = true;
      }
    }

    return levelUpHistory;
  }

  /**
   * 穿戴或替换装备
   * @param {Object} item - 待穿戴的装备对象
   * @returns {Object|null} 原槽位上卸下的旧装备 (若有)
   */
  equip(item) {
    if (!item || !item.part) return null;
    const slot = item.part;
    const oldItem = this.equipment[slot] || null;
    this.equipment[slot] = item;
    return oldItem;
  }

  /**
   * 卸下指定部位的装备
   * @param {string} slot - 槽位名称 ('weapon', 'armor', etc.)
   * @returns {Object|null} 卸下的装备
   */
  unequip(slot) {
    if (!this.equipment[slot]) return null;
    const item = this.equipment[slot];
    this.equipment[slot] = null;
    return item;
  }

  /**
   * 判定指定部位是否已解锁
   * @param {string} slot - 部位 ('weapon'|'armor'|'ring'|'hat'|'boots'|'belt')
   * @param {number} potLevel - 聚宝盆等级
   */
  isSlotUnlocked(slot, potLevel = 1) {
    if (this.isMortal) {
      return slot === 'weapon';
    }
    // 拜入宗门后，6大装备槽位全开，支持长线6神装追求
    const allSlots = ['weapon', 'armor', 'ring', 'hat', 'boots', 'belt'];
    return allSlots.includes(slot);
  }

  /**
   * 检测当前6大装备槽位是否全部穿齐，以及是否达成指定毕业品质门槛
   * @param {string} minQuality - 目标品质代码，默认 'Q4' (法器·紫)
   * @returns {Object} { isFullSet, isGraduated, count, total: 6, equippedSlots, lowestQuality }
   */
  checkFullSetEquipped(minQuality = 'Q4') {
    const allSlots = ['weapon', 'armor', 'ring', 'hat', 'boots', 'belt'];
    const qualityRanks = { Q1: 1, Q2: 2, Q3: 3, Q4: 4, Q5: 5, Q6: 6, Q7: 7, Q8: 8 };
    const targetRank = qualityRanks[minQuality] || 4;

    let count = 0;
    let purpleCount = 0;
    let minRankFound = 99;
    let lowestQuality = 'Q1';
    const equippedSlots = {};

    allSlots.forEach(slot => {
      const eq = this.equipment[slot];
      if (eq) {
        count++;
        equippedSlots[slot] = eq;
        const qCode = (eq.qualityCode || eq.quality || 'Q1').toUpperCase();
        const rk = qualityRanks[qCode] || 1;
        if (rk >= targetRank) {
          purpleCount++;
        }
        if (rk < minRankFound) {
          minRankFound = rk;
          lowestQuality = qCode;
        }
      }
    });

    const isFullSet = count === allSlots.length;
    const isGraduated = isFullSet && (minRankFound >= targetRank);

    return {
      isFullSet,
      isGraduated,
      count,
      purpleCount,
      total: allSlots.length,
      equippedSlots,
      lowestQuality: isFullSet ? lowestQuality : null
    };
  }

  /**
   * 天命缺口雷达：精准感应角色当前最急需补强的最短板部位与目标品质
   * @param {number} potLevel - 聚宝盆阶位
   * @returns {Object}
   */
  getDestinyRadarTarget(potLevel = 1) {
    const SLOTS_META = [
      { part: 'weapon', name: '神兵', priority: 1 },
      { part: 'armor',  name: '宝甲', priority: 2 },
      { part: 'boots',  name: '仙履', priority: 3 },
      { part: 'hat',    name: '法冠', priority: 4 },
      { part: 'ring',   name: '灵戒', priority: 5 },
      { part: 'belt',   name: '宝带', priority: 6 }
    ];
    const qualityRanks = { Q1: 1, Q2: 2, Q3: 3, Q4: 4, Q5: 5, Q6: 6, Q7: 7, Q8: 8 };

    // 筛选已解锁部位
    const unlockedSlots = SLOTS_META.filter(s => this.isSlotUnlocked(s.part, potLevel));
    if (unlockedSlots.length === 0) {
      return {
        part: 'weapon',
        slotName: '神兵',
        currentQuality: null,
        targetQuality: 'Q1',
        targetQualityName: '凡铁',
        isMissing: true,
        isAllMax: false,
        desc: '天命未启 · 初始神兵'
      };
    }

    // 0. 作弊器当前阶位的最高目标品质与天花板 (严格锚定 potLevel)
    const lvl = Math.max(1, Math.min(6, potLevel || 1));
    const levelTargetMap = {
      1: { code: 'Q2', name: '灵器', rank: 2 },
      2: { code: 'Q3', name: '宝器', rank: 3 },
      3: { code: 'Q4', name: '法器', rank: 4 },
      4: { code: 'Q4', name: '法器', rank: 4 },
      5: { code: 'Q4', name: '法器', rank: 4 },
      6: { code: 'Q5', name: '道器', rank: 5 }
    };
    const curLevelTarget = levelTargetMap[lvl] || levelTargetMap[1];

    // 1. 优先找尚未装备的空缺部位 (按优先级，目标品质不超过当前作弊器上限)
    const missingSlots = unlockedSlots.filter(s => !this.equipment[s.part]);
    if (missingSlots.length > 0) {
      const target = missingSlots[0];
      return {
        part: target.part,
        slotName: target.name,
        currentQuality: null,
        targetQuality: curLevelTarget.code,
        targetQualityName: curLevelTarget.name,
        isMissing: true,
        isAllMax: false,
        desc: '虚位以待'
      };
    }

    // 2. 6 槽皆有装备时，寻找品质等级最低 (最短板) 的部位
    let minRank = 99;
    let minCandidates = [];

    unlockedSlots.forEach(s => {
      const eq = this.equipment[s.part];
      const qCode = (eq.qualityCode || eq.quality || 'Q1').toUpperCase();
      const rk = qualityRanks[qCode] || 1;
      if (rk < minRank) {
        minRank = rk;
        minCandidates = [{ ...s, eq, rk, power: eq.power || 0 }];
      } else if (rk === minRank) {
        minCandidates.push({ ...s, eq, rk, power: eq.power || 0 });
      }
    });

    // 若全部已达到当前作弊器最高天花板
    if (minRank >= curLevelTarget.rank) {
      return {
        part: 'weapon',
        slotName: '六道',
        currentQuality: curLevelTarget.code,
        targetQuality: lvl < 6 ? 'Q' + (curLevelTarget.rank + 1) : 'Q6',
        targetQualityName: lvl < 6 ? '待晋升' : '神品',
        isMissing: false,
        isAllMax: true,
        desc: lvl < 6 
          ? `待天机盘晋升`
          : `天道大成`
      };
    }

    // 相同品质下，战力最低者为第一缺口
    minCandidates.sort((a, b) => a.power - b.power);
    const chosen = minCandidates[0];

    // 目标品质升级推算 (不能超越当前作弊器最高天花板)
    const targetRank = Math.min(curLevelTarget.rank, chosen.rk + 1);
    const rankToQ = { 1: 'Q1', 2: 'Q2', 3: 'Q3', 4: 'Q4', 5: 'Q5', 6: 'Q6' };
    const rankToName = { 1: '凡铁', 2: '灵器', 3: '宝器', 4: '法器', 5: '道器', 6: '神品' };
    const nextQ = rankToQ[targetRank] || curLevelTarget.code;
    const nextQName = rankToName[targetRank] || curLevelTarget.name;

    const curQName = chosen.eq.qualityName || '凡铁';

    return {
      part: chosen.part,
      slotName: chosen.name,
      currentQuality: chosen.eq.qualityCode || 'Q1',
      targetQuality: nextQ,
      targetQualityName: nextQName,
      isMissing: false,
      isAllMax: false,
      desc: '亟待' + nextQName
    };
  }

  /**
   * 获取6神装全套共鸣属性加成
   * 6槽全满即激活【道基圆满·神装共鸣】：全属性 +15%
   * 若达成毕业品质(Q4紫装及以上)加成提升至 +25%
   */
  getFullSetResonanceBonus() {
    const status = this.checkFullSetEquipped('Q4');
    if (!status.isFullSet) return { hpRate: 0, atkRate: 0, defRate: 0, powerRate: 0 };
    if (status.isGraduated) {
      return { hpRate: 0.25, atkRate: 0.25, defRate: 0.25, powerRate: 0.25, name: '【极品神装·六道大圆满】' };
    }
    return { hpRate: 0.15, atkRate: 0.15, defRate: 0.15, powerRate: 0.15, name: '【神装初成·六圣归元】' };
  }

  /**
   * 判定一件装备是否能对角色带来属性/战力提升
   * 1. 装备部位未解锁 -> false (暂无法穿戴)
   * 2. 装备部位已解锁且当前槽位为空 -> true (穿戴即可获得增益)
   * 3. 装备部位已穿戴 -> 比较战力 power，严格大于当前穿戴才为 true (可替换更高阶)
   * @param {Object} equipItem - 装备对象
   * @param {number} potLevel - 聚宝盆等级 (默认 1)
   */
  hasEquipmentImprovement(equipItem, potLevel = 1) {
    if (!equipItem || equipItem.type !== 'equip' || !equipItem.part) return false;
    if (!this.isSlotUnlocked(equipItem.part, potLevel)) return false;

    const currentEquip = this.equipment[equipItem.part];
    if (!currentEquip) return true; // 槽位为空，直接穿戴即有提升

    return (equipItem.power || 0) > (currentEquip.power || 0);
  }

  /**
   * 判定指定槽位是否有装备可以穿戴，或者可以替换到更高级的装备
   * @param {string} slotName - 部位名称 ('weapon', 'armor', 'ring', etc.)
   * @param {InventoryManager} inventory - 乾坤袋背包实例
   * @param {number} potLevel - 聚宝盆等级
   */
  canSlotBeEquippedOrUpgraded(slotName, inventory, potLevel = 1) {
    if (!this.isSlotUnlocked(slotName, potLevel)) return false;
    if (!inventory || !inventory.slots) return false;

    const currentEquip = this.equipment[slotName];
    const candidates = inventory.slots.filter(item => item && item.type === 'equip' && item.part === slotName);
    if (candidates.length === 0) return false;

    if (!currentEquip) return true;

    const currentPower = currentEquip.power || 0;
    return candidates.some(item => (item.power || 0) > currentPower);
  }

  /**
   * 大境界突破：练气大圆满 -> 筑基初期
   */
  breakthroughToFoundation() {
    const oldRealm = this.realmName;
    const oldStats = this.getTotalStats();
    const oldPower = this.combatPower;

    this.level = 11;
    this.exp = 0;
    this.canBreakthrough = false;

    const newRealm = this.realmName;
    const newStats = this.getTotalStats();
    const newPower = this.combatPower;

    return {
      oldLevel: 10,
      newLevel: 11,
      oldRealm,
      newRealm,
      oldStats,
      newStats,
      oldPower,
      newPower
    };
  }

  /**
   * 白日飞升：晋升为灵界大能 (化神境初期)
   */
  promoteToSoulFormation() {
    this.worldTier = 2;
    this.level = 1;
    this.exp = 0;
    this.isMortal = false;
    this.canBreakthrough = false;
  }

  /**
   * 导出序列化存档数据
   */
  serialize() {
    return {
      level: this.level,
      exp: this.exp,
      worldTier: this.worldTier || 1,
      isMortal: !!this.isMortal,
      canBreakthrough: this.canBreakthrough,
      equipment: this.equipment,
      currentSect: this.currentSect || null
    };
  }

  /**
   * 从存档恢复
   */
  deserialize(data) {
    if (!data) return;
    this.level = typeof data.level === 'number' ? data.level : 1;
    this.exp = data.exp || 0;
    this.worldTier = typeof data.worldTier === 'number' ? data.worldTier : 1;
    this.isMortal = !!data.isMortal;
    this.canBreakthrough = !!data.canBreakthrough;
    this.equipment = data.equipment || {
      weapon: null, armor: null, ring: null,
      hat: null, boots: null, belt: null
    };
    if (data.currentSect) {
      this.setSect(data.currentSect);
    } else {
      this.currentSect = null;
    }
  }
}

window.SlotsRPG.PlayerModel = PlayerModel;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.SlotsRPG.PlayerModel;
}
