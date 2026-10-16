/**
 * BossConfig.js - 关卡妖兽 Boss 配置与动态数值模型
 * 遵循 PRD 5.5 节规范
 */
window.SlotsRPG = window.SlotsRPG || {};

window.SlotsRPG.BossConfig = {
  SECT_BOSS_MAP: {
    wanjian: 1,
    taiyi: 2,
    yushou: 3,
    tianji: 4,
    fen_tian: 5,
    spirit_realm: 6
  },

  BOSS_DEFS: {
    1: {
      id: 'boss_1',
      sectId: 'wanjian',
      name: '赤炼蟒',
      realm: '练气境巅峰·妖王',
      title: '练气境妖王·赤炼蟒',
      potTier: 1,
      level: 10,
      avatar: 'assets/boss/boss_red_python_vivid.png',
      icon: 'assets/boss/boss_red_python_vivid.png',
      battleBg: 'assets/battle_bg/bg_python_magma.jpg',
      hp: 5500,
      maxHp: 5500,
      atk: 96,
      def: 42,
      critRate: 0.08,
      skillName: '九幽毒煞',
      skillDesc: '喷吐赤炼毒焰，造成 135% 烈火灼烧重击',
      skillMultiplier: 1.35,
      rewards: {
        exp: 1500,
        energy: 1500,
        rewardEquip: { part: 'weapon', qualityCode: 'Q4' },
        rewardPill: { subType: 'exp', amount: 10 }
      }
    },
    2: {
      id: 'boss_2',
      sectId: 'taiyi',
      name: '丹霞金顶兽',
      realm: '筑基初期·神兽',
      title: '筑基初期·丹霞金顶兽',
      potTier: 2,
      level: 20,
      avatar: 'assets/boss/boss_golden_chimera_vivid.png',
      icon: 'assets/boss/boss_golden_chimera_vivid.png',
      battleBg: 'assets/battle_bg/bg_taiyi_dan.jpg',
      hp: 12000,
      maxHp: 12000,
      atk: 220,
      def: 110,
      critRate: 0.10,
      skillName: '金霞真火',
      skillDesc: '吐出丹霞三昧真火，造成 140% 烈阳灼烧重击',
      skillMultiplier: 1.4,
      rewards: {
        exp: 3500,
        energy: 3000,
        rewardEquip: { part: 'armor', qualityCode: 'Q4' },
        rewardPill: { subType: 'exp', amount: 15 }
      }
    },
    3: {
      id: 'boss_3',
      sectId: 'yushou',
      name: '通天狂暴猿',
      realm: '筑基后期·荒兽',
      title: '筑基后期·通天狂暴猿',
      potTier: 3,
      level: 30,
      avatar: 'assets/monsters/monster_ape_vivid.png',
      icon: 'assets/monsters/monster_ape_vivid.png',
      battleBg: 'assets/battle_bg/bg_yushou_valley.jpg',
      hp: 26000,
      maxHp: 26000,
      atk: 450,
      def: 220,
      critRate: 0.12,
      skillName: '撼天裂地',
      skillDesc: '暴猿双拳捶击大地，造成 150% 碎岳重击伤害',
      skillMultiplier: 1.5,
      rewards: {
        exp: 8000,
        energy: 5000,
        rewardEquip: { part: 'ring', qualityCode: 'Q4' },
        rewardPill: { subType: 'exp', amount: 20 }
      }
    },
    4: {
      id: 'boss_4',
      sectId: 'tianji',
      name: '八卦机巧神尊',
      realm: '金丹初期·傀儡',
      title: '金丹初期·八卦机巧神尊',
      potTier: 4,
      level: 40,
      avatar: 'assets/boss/boss_tianji_puppet_vivid.png',
      icon: 'assets/boss/boss_tianji_puppet_vivid.png',
      battleBg: 'assets/battle_bg/bg_tianji_stars.jpg',
      hp: 55000,
      maxHp: 55000,
      atk: 850,
      def: 420,
      critRate: 0.15,
      skillName: '九宫天绝阵',
      skillDesc: '机巧神尊逆转阴阳乾坤，造成 160% 混元绝杀',
      skillMultiplier: 1.6,
      rewards: {
        exp: 18000,
        energy: 8000,
        rewardEquip: { part: 'weapon', qualityCode: 'Q5' },
        rewardPill: { subType: 'exp', amount: 25 }
      }
    },
    5: {
      id: 'boss_5',
      sectId: 'fen_tian',
      name: '九幽冥狱魔尊',
      realm: '金丹圆满·魔尊',
      title: '金丹圆满·九幽冥狱魔尊',
      potTier: 5,
      level: 50,
      avatar: 'assets/boss/boss_thunder_dragon_vivid.png',
      icon: 'assets/boss/boss_thunder_dragon_vivid.png',
      battleBg: 'assets/battle_bg/bg_python_magma.jpg',
      hp: 110000,
      maxHp: 110000,
      atk: 1500,
      def: 750,
      critRate: 0.18,
      skillName: '焚天灭世煞',
      skillDesc: '冥狱狂雷与焚天魔焰并起，造成 170% 毁灭雷火伤害',
      skillMultiplier: 1.7,
      rewards: {
        exp: 35000,
        energy: 15000,
        rewardEquip: { part: 'weapon', qualityCode: 'Q5' },
        rewardPill: { subType: 'exp', amount: 30 }
      }
    },
    6: {
      id: 'boss_6',
      sectId: 'spirit_realm',
      name: '诛邪剑尊残相',
      realm: '化神境极限·剑仙残魂',
      title: '化神境极限·诛邪剑尊残相',
      potTier: 6,
      level: 60,
      avatar: 'assets/boss/boss_tianji_puppet_vivid.png',
      icon: 'assets/boss/boss_tianji_puppet_vivid.png',
      battleBg: 'assets/battle_bg/bg_tianji_stars.jpg',
      hp: 380000,
      maxHp: 380000,
      atk: 2800,
      def: 1100,
      critRate: 0.20,
      skillName: '诛仙青冥剑阵',
      skillDesc: '引动九霄剑海贯穿乾坤，造成 180% 破甲神圣真伤',
      skillMultiplier: 1.8,
      rewards: {
        exp: 80000,
        energy: 40000,
        rewardEquip: { part: 'weapon', qualityCode: 'Q6' },
        rewardPill: { subType: 'exp', amount: 40 }
      }
    },
    7: {
      id: 'boss_7',
      sectId: 'spirit_realm',
      name: '混沌始祖吞天兽',
      realm: '炼虚初期·太虚古兽',
      title: '炼虚初期·混沌始祖吞天兽',
      potTier: 7,
      level: 70,
      avatar: 'assets/boss/boss_golden_chimera_vivid.png',
      icon: 'assets/boss/boss_golden_chimera_vivid.png',
      battleBg: 'assets/battle_bg/bg_yushou_valley.jpg',
      hp: 850000,
      maxHp: 850000,
      atk: 4800,
      def: 2200,
      critRate: 0.22,
      skillName: '太虚黑洞吞噬',
      skillDesc: '撕裂空间黑洞，造成 190% 虚空撕裂并转化为自身护盾',
      skillMultiplier: 1.9,
      rewards: {
        exp: 180000,
        energy: 90000,
        rewardEquip: { part: 'armor', qualityCode: 'Q6' },
        rewardPill: { subType: 'exp', amount: 50 }
      }
    },
    8: {
      id: 'boss_8',
      sectId: 'spirit_realm',
      name: '极夜天魔主宰',
      realm: '合体初期·魔渊主宰',
      title: '合体初期·极夜天魔主宰',
      potTier: 8,
      level: 80,
      avatar: 'assets/boss/boss_thunder_dragon_vivid.png',
      icon: 'assets/boss/boss_thunder_dragon_vivid.png',
      battleBg: 'assets/battle_bg/bg_python_magma.jpg',
      hp: 1800000,
      maxHp: 1800000,
      atk: 8500,
      def: 3800,
      critRate: 0.25,
      skillName: '极夜万魔劫',
      skillDesc: '召唤三千天魔神念同时暴击，造成 200% 灭神重击',
      skillMultiplier: 2.0,
      rewards: {
        exp: 360000,
        energy: 180000,
        rewardEquip: { part: 'ring', qualityCode: 'Q7' },
        rewardPill: { subType: 'exp', amount: 60 }
      }
    },
    9: {
      id: 'boss_9',
      sectId: 'spirit_realm',
      name: '伪天道金身法相',
      realm: '大乘期圆满·天道意志',
      title: '大乘期圆满·伪天道金身法相',
      potTier: 9,
      level: 90,
      avatar: 'assets/boss/boss_thunder_dragon_vivid.png',
      icon: 'assets/boss/boss_thunder_dragon_vivid.png',
      battleBg: 'assets/battle_bg/bg_tianji_stars.jpg',
      hp: 3500000,
      maxHp: 3500000,
      atk: 14000,
      def: 6500,
      critRate: 0.28,
      skillName: '大道审判 · 归墟湮灭',
      skillDesc: '以伪天道法则降下万劫神雷，造成 220% 终极天道裁决',
      skillMultiplier: 2.2,
      rewards: {
        exp: 800000,
        energy: 400000,
        rewardEquip: { part: 'weapon', qualityCode: 'Q8' },
        rewardPill: { subType: 'exp', amount: 80 }
      }
    }
  },

  /**
   * 根据玩家当前综合战力动态计算 Boss 属性 (1.1 ~ 1.2倍)，并支持首次生成后锁定数值
   * @param {Object} boss - Boss 实例对象
   * @param {Object} player - PlayerModel 实例
   * @param {Object|null} lockedSnapshot - 已锁定的首次生成属性快照
   * @param {Array<number>} multiplierRange - 动态战力倍率区间，默认 [1.10, 1.20]
   */
  scaleBossToPlayerPower(boss, player, lockedSnapshot = null, multiplierRange = [1.10, 1.20]) {
    if (!boss) return null;

    // 获取当前门派妖王基准战力 (赤炼蟒 1355, 丹霞金顶兽 3005 等，确保高于第12关试炼标尺)
    const basePower = Math.floor((boss.maxHp || boss.hp || 5500) * 0.2 + (boss.atk || 96) * 2.0 + (boss.def || 42) * 1.5);

    const snap = lockedSnapshot || (boss && boss.lockedSnapshot) || (player && player.gameManager && player.gameManager.lockedSectBossSnapshot);
    // 若快照存在且数值达标 (不低于妖王基准线，过滤早期误锁定的低战力快照)
    if (snap && snap.hp > 0 && snap.atk > 0 && (snap.combatPower || 0) >= Math.min(1000, basePower)) {
      boss.hp = snap.hp;
      boss.maxHp = snap.maxHp || snap.hp;
      boss.atk = snap.atk;
      boss.def = snap.def;
      boss.combatPower = snap.combatPower || Math.floor(boss.hp * 0.2 + boss.atk * 2.0 + boss.def * 1.5);
      boss.dynamicMultiplier = snap.dynamicMultiplier || 1.15;
      boss.isLockedDynamic = true;
      return snap;
    }

    const playerStats = (player && typeof player.getTotalStats === 'function')
      ? player.getTotalStats()
      : { hp: 200, atk: 25, def: 12 };
    const playerPower = Math.max(
      50,
      (player && player.combatPower) || Math.floor(playerStats.hp * 0.2 + playerStats.atk * 2.0 + playerStats.def * 1.5)
    );

    const minMult = (multiplierRange && multiplierRange[0]) || 1.10;
    const maxMult = (multiplierRange && multiplierRange[1]) || 1.20;
    const mult = Number((minMult + Math.random() * (maxMult - minMult)).toFixed(2));
    // 守关妖王战力至少等于基准设计战力 (确保高于试炼第12关)，当玩家战力更高时动态提升 1.1~1.2x
    const targetPower = Math.max(basePower, Math.round(playerPower * mult));

    const scaleRatio = targetPower / basePower;
    boss.atk = Math.max(10, Math.round(boss.atk * scaleRatio));
    boss.def = Math.max(4, Math.round(boss.def * scaleRatio));
    const remainingPowerForHp = Math.max(20, targetPower - (boss.atk * 2.0 + boss.def * 1.5));
    boss.hp = Math.max(Math.round(boss.hp * scaleRatio), Math.round(remainingPowerForHp / 0.2));
    boss.maxHp = boss.hp;
    boss.combatPower = Math.floor(boss.hp * 0.2 + boss.atk * 2.0 + boss.def * 1.5);
    boss.dynamicMultiplier = mult;
    boss.isLockedDynamic = true;

    return {
      sectId: boss.sectId || null,
      bossId: boss.id,
      name: boss.name,
      hp: boss.hp,
      maxHp: boss.maxHp,
      atk: boss.atk,
      def: boss.def,
      combatPower: boss.combatPower,
      dynamicMultiplier: mult
    };
  },

  /**
   * 获取指定聚宝盆等级 / 宗门对应的关卡 Boss 实例
   * @param {number} potLevel - 当前聚宝盆阶数或世数
   * @param {number} defeatStreak - 连续战败次数 (用于动态降难)
   * @param {string} sectId - 当前宗门 ID
   * @param {number} samsaraCount - 当前轮回世数
   * @param {Object|null} player - 玩家模型 (用于 1.1~1.2x 动态战力计算)
   * @param {Object|null} lockedSnapshot - 首次生成锁定的 Boss 属性快照
   */
  getBoss(potLevel = 1, defeatStreak = 0, sectId = null, samsaraCount = 1, player = null, lockedSnapshot = null) {
    // 关卡妖王严格根据当前拜入的宗门锁定专属守关妖王
    // 万剑门 -> 赤炼蟒(1阶), 太乙神丹宗 -> 丹霞金顶兽(2阶), 御兽玄机门 -> 通天狂暴猿(3阶), 天机阁 -> 八卦机巧神尊(4阶), 焚天魔宗 -> 九幽冥狱魔尊(5阶)
    let tier = 1;
    if (sectId && this.SECT_BOSS_MAP[sectId]) {
      tier = this.SECT_BOSS_MAP[sectId];
    } else if (player && player.worldTier === 2) {
      tier = Math.min(9, Math.max(6, 5 + (potLevel || 1)));
    } else {
      tier = Math.min(5, Math.max(1, potLevel || samsaraCount || 1));
    }
    const raw = this.BOSS_DEFS[tier] || this.BOSS_DEFS[1];
    const boss = JSON.parse(JSON.stringify(raw));

    if (player || lockedSnapshot) {
      const snap = this.scaleBossToPlayerPower(boss, player, lockedSnapshot, [1.10, 1.20]);
      boss.lockedSnapshot = snap;
      return boss;
    }

    // 兼容未传入 player 上下文的静态调用
    if (defeatStreak >= 1) {
      const weakFactor = Math.max(0.55, 1 - defeatStreak * 0.15);
      boss.hp = Math.max(100, Math.round(boss.hp * weakFactor));
      boss.maxHp = boss.hp;
      boss.atk = Math.max(10, Math.round(boss.atk * weakFactor));
      boss.isWeakened = true;
    }

    return boss;
  }
};