/**
 * GameBalanceConfig.js - 核心数值与心流平衡配置表
 * 集中管理所有数值矩阵、抽卡权重、掉落概率与新手脚本序列，杜绝业务代码硬编码
 */
window.SlotsRPG = window.SlotsRPG || {};

window.SlotsRPG.GameBalanceConfig = {
  // ==========================================
  // 1. 新手散修初探与仙门引荐脚本序列 (FTUE)
  // ==========================================
  FTUESequence: {
    targetInductionSpin: 6, // 第 6 抽达到高潮并递送宗门法牒
    candidateSects: ['wanjian', 'wantong'], // 首次叩问仙门候选 (正统万剑 vs 旁门万通二选一)
    scriptedSpins: {
      1: {
        spinIndex: 1,
        name: '初试天机 · 爆神兵',
        forceLine: { lineIndex: 0, symbol: 'SYM_06', count: 3 }, // 中间线3枚玄铁剑
        tip: '天机初转，造化显现！已爆出兵刃【玄铁剑】，速速去角色面板穿戴换装！',
        dialog: '“嘿！神物初显神威便爆出一柄玄铁剑！快去乾坤袋装备上，战力立涨！”',
        highlightTab: 'character'
      },
      2: {
        spinIndex: 2,
        name: '灵丹通脉 · 突境界',
        forceLine: { lineIndex: 0, symbol: 'SYM_05', count: 3 }, // 中间线3枚纯阳修为丹
        tip: '灵丹出世！吞服纯阳修为丹，即刻冲开筋脉突破练气！',
        dialog: '“好精纯的丹气！吞下这枚纯阳修为丹，助你当场脱去凡胎踏入练气！”',
        highlightTab: 'character'
      },
      3: {
        spinIndex: 3,
        name: '气运流转 · 学回血',
        forceLine: { lineIndex: 0, symbol: 'SYM_01', count: 3 }, // 聚灵符返还机缘
        tip: '聚灵符显神威，机缘流转返还！体会以战养盘真意。',
        dialog: '“聚灵符连成一线，灵气回流！记住这种机缘流转的感觉，以战养盘才是修仙王道！”'
      },
      4: {
        spinIndex: 4,
        name: '玄黄护体 · 聚灵成海',
        forceLine: { lineIndex: 0, symbol: 'SYM_02', count: 3 }, // 凝神符
        tip: '凝神引气，机缘再增！气机稳固步步前行。',
        dialog: '“道基初稳，气运渐盛！前方似乎有妖气波动，提高戒备！”'
      },
      5: {
        spinIndex: 5,
        name: '小试牛刀 · 斩群妖',
        forceBattle: { tier: 'normal', count: 1, scatterCount: 3, isFTUEDemo: true }, // 凡人试剑幼兽伏妖战
        tip: '妖气初现！方才出世的神兵与灵丹，正堪拿这只山间幼兽试锋！',
        dialog: '“嘿！一头不长眼的山间幼兽撞上来了！宿主刚换上的神兵利器，正好一刀斩之！”'
      },
      6: {
        spinIndex: 6,
        name: '天象冲霄 · 仙门递牒',
        forceSectInduction: true,
        forceLine: { lineIndex: 0, symbol: 'SYM_11', count: 3 }, // 造化灵珠金芒冲霄
        tip: '三花聚顶，剑气冲霄！各大仙门巡察使递来真传引荐法牒，请道友执令入宗！',
        dialog: '“哈哈！斩妖引动天地共鸣，各大仙门的巡察使已经被你惊动，速速执令叩问仙门！”'
      }
    }
  },

  // ==========================================
  // 2. 转盘符号基准权重池 (SlotsEngine 引用)
  // ==========================================
  ReelWeights: {
    rune_basic: 220,    // 基础聚灵符 (高频返奖)
    rune_medium: 160,   // 中级凝神符
    rune_high: 110,     // 高级破魔符
    pill: 110,          // 丹药类 (气血/修为)
    equip: 80,          // 装备类
    wild: 35,           // 百搭造化灵珠
    scatter_normal: 35, // 妖兽常规权重
    scatter_forced: 1500, // 保底妖兽强制权重
    bonus_normal: 20,   // 洞天秘印常规权重
    bonus_forced: 1500  // 保底秘境强制权重
  },

  // ==========================================
  // 2.5 全局商业化纯净无广告总控与数值节奏联动 (FeatureConfig)
  // ==========================================
  FeatureConfig: {
    enableAds: false,              // 当前阶段无广告设为 false；后续接入微信广告时一键切 true
    initialAwakeningEnergy: 200,   // 新手凡人觉醒赠送启动灵机 (由 100 提升至 200)
    encounterRate: 0.015,          // 抽卡中随机遭遇妖兽概率 (由 0.06 降至 0.015，消除频繁打断)
    meditateDailyLimit: 5,         // 每日打坐吐纳次数上限 (无广告修真福利)
    meditateEnergyGain: 50         // 每次打坐回复灵机点数
  },

  // ==========================================
  // 3. 心流调控与防猝死保底阈值 (FlowController 引用)
  // ==========================================
  FlowPity: {
    lossStreakSoft: 4,        // 4 连败开启轻度加权
    lossStreakHard: 8,        // 8 连败必中回血大奖
    softWeightMultiplier: 1.8,// 软保底权重放大系数
    monsterPityLimit: 38,     // 38 抽未遇怪必在 2-3-4 滚轮触发精英/妖王挑战
    bonusPityLimit: 180,      // 180 抽未出秘境必出大奖
    newbieProtectionSpins: 6  // 仅前 6 抽散修序章期锁定脚本保护
  },

  // ==========================================
  // 3.1 神龙引宝天道动态保底与心流阶梯 (DragonLootEngine 引用)
  // 严格锚定作弊器/天机盘等级上限 (potSubLevel)，平滑心流阶梯，杜绝低级作弊器越级出金装
  // ==========================================
  DragonPityConfig: {
    // 阶段常规保底阈值 (各阶段通用：连续 20 抽未出当前阶位最高品质必定硬保底)
    softPityThreshold: 15,
    hardPityLimit: 20,
    softStepRate: 0.18,

    // 终局鸿蒙天道大保底阈值 (仅在 Lv.6 鸿蒙道盘激活，60 抽必降金色道器 Q5)
    goldSoftPityThreshold: 45,
    goldHardPityLimit: 60,
    goldSoftStepRate: 0.065,

    // 作弊器各阶位品质天花板与保底锚定标准
    levelCaps: {
      1: { maxQuality: 'Q2', minQuality: 'Q1', pityQuality: 'Q2', title: '初窥门径', label: '灵器', color: '#52c41a' },
      2: { maxQuality: 'Q3', minQuality: 'Q1', pityQuality: 'Q3', title: '凝神引灵', label: '宝器', color: '#1890ff' },
      3: { maxQuality: 'Q4', minQuality: 'Q1', pityQuality: 'Q4', title: '百炼天机', label: '法器', color: '#722ed1' },
      4: { maxQuality: 'Q4', minQuality: 'Q2', pityQuality: 'Q4', title: '通玄灵鼎', label: '法器', color: '#722ed1' },
      5: { maxQuality: 'Q4', minQuality: 'Q2', pityQuality: 'Q4', title: '造化乾坤', label: '法器', color: '#722ed1' },
      6: { maxQuality: 'Q5', minQuality: 'Q3', pityQuality: 'Q5', title: '鸿蒙道盘', label: '道器', color: '#ffd700' }
    },

    // 兼容旧属性名
    purpleSoftPityThreshold: 15,
    purpleHardPityLimit: 20,
    purpleSoftStepRate: 0.18
  },

  // ==========================================
  // 4. 天机盘等级装备品质掉落率矩阵 (GameManager 引用)
  // ==========================================
  EquipQualityMatrix: {
    1: [
      { quality: 'Q2', threshold: 0.15 },
      { quality: 'Q1', threshold: 1.00 }
    ],
    2: [
      { quality: 'Q3', threshold: 0.05 },
      { quality: 'Q2', threshold: 0.45 },
      { quality: 'Q1', threshold: 1.00 }
    ],
    3: [
      { quality: 'Q4', threshold: 0.05 },
      { quality: 'Q3', threshold: 0.25 },
      { quality: 'Q2', threshold: 0.80 },
      { quality: 'Q1', threshold: 1.00 }
    ],
    4: [ // Lv4 彻底淘汰凡铁 Q1
      { quality: 'Q4', threshold: 0.15 },
      { quality: 'Q3', threshold: 0.60 },
      { quality: 'Q2', threshold: 1.00 }
    ],
    5: [
      { quality: 'Q4', threshold: 0.35 },
      { quality: 'Q3', threshold: 0.85 },
      { quality: 'Q2', threshold: 1.00 }
    ],
    6: [ // 鸿蒙道盘：Q3 30%, Q4 65%, Q5 5% 奇遇
      { quality: 'Q5', threshold: 0.05 },
      { quality: 'Q4', threshold: 0.70 },
      { quality: 'Q3', threshold: 1.00 }
    ],

    /**
     * 根据天机盘等级随机抽取装备品质代码
     */
    pickQuality(potSubLevel = 1, rand = Math.random()) {
      const lvl = Math.max(1, Math.min(6, potSubLevel || 1));
      const pool = this[lvl] || this[1];
      for (const entry of pool) {
        if (rand < entry.threshold) {
          return entry.quality;
        }
      }
      return 'Q1';
    }
  },

  // ==========================================
  // 5. 妖王门票掉落与道基大圆满硬门槛约束 (GameManager 引用)
  // 铁律：必须同时达成【斩伏当前守关妖王】与【全身6槽Q4极品紫装大圆满】，未集齐前掉率恒为 0%
  // ==========================================
  BossTicketPity: {
    // 门票获取属于充要硬性门槛，在达成 6 槽满配顶级装备 + 击败妖王前绝对不发放
    strictPrerequisites: {
      requireFullSetQ4: true,
      requireBossDefeated: true
    },
    getDropChance(attemptCount = 1, isFullSetQ4 = false, isBossDefeated = false) {
      if (!isFullSetQ4 || !isBossDefeated) return 0.0;
      return 1.0; // 满足条件即 100% 顺天应命必定发放
    }
  },

  // ==========================================
  // 6. 天机盘蕴灵升级上限与轮回膨胀 (GameManager 引用)
  // ==========================================
  PotExpTargets: {
    tierTargets: {
      1: 500,
      2: 1500,
      3: 3500,
      4: 6500,
      5: 10000
    },
    getMaxExp(samsaraCount = 1, level = 1) {
      const base = this.tierTargets[samsaraCount] || (10000 + (samsaraCount - 5) * 5000);
      return level > 1 ? Math.floor(base * 1.5) : base;
    }
  }
};
