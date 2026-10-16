/**
 * SectConfig.js - 宗门体系与长线飞升配置表
 * 严格遵照 PRD_剧情与轮回宗门系统规格书 第 2 章规范
 * 包含：
 * 1. 五大正统宗门 (各持 1/5 混元飞升经真篇，开启白日飞升)
 * 2. 三大特色功能性旁门 (万通打金商行、钦天观星监、九死血魂教)
 */
window.SlotsRPG = window.SlotsRPG || {};

window.SlotsRPG.SectConfig = {
  // 5大真·飞升残篇定义
  ASCENSION_SHARDS: {
    shard_metal: { id: 'shard_metal', element: '金', name: '【混元飞升经·剑破天门篇】', sectId: 'wanjian', buffDesc: '永久攻击 +5%' },
    shard_wood:  { id: 'shard_wood',  element: '木', name: '【混元飞升经·九转仙魄篇】', sectId: 'taiyi',   buffDesc: '永久气血 +8%' },
    shard_water: { id: 'shard_water', element: '水', name: '【混元飞升经·百灵化神篇】', sectId: 'yushou',  buffDesc: '永久战力 +6%' },
    shard_earth: { id: 'shard_earth', element: '土', name: '【混元飞升经·周天星斗篇】', sectId: 'tianji',  buffDesc: '永久防御 +8%' },
    shard_fire:  { id: 'shard_fire',  element: '火', name: '【混元飞升经·涅槃焚天篇】', sectId: 'fen_tian', buffDesc: '永久暴击 +3%' }
  },

  // 默认凡人修真形象
  DEFAULT_CHARACTER: {
    avatar: 'assets/character/hero_mortal.png',
    battleAvatar: 'assets/character/hero_mortal.png',
    dialogAvatar: 'assets/character/hero_mortal.png',
    slashColor: '#cbd5e1',
    skillKey: 'mortal_slash'
  },

  // 8大宗门详情
  SECTS: {
    // ================= 1. 五大正统道脉 (True Sects) =================
    wanjian: {
      id: 'wanjian',
      name: '万剑仙宗',
      type: 'true',
      element: 'metal',
      elementName: '金',
      badge: '极道杀伐',
      themeColor: '#e0af68',
      mapName: '天剑绝壁 · 问剑峰',
      mapDesc: '断剑倒插，剑气嘶鸣。追求一剑破万法的至高杀力。',
      shardId: 'shard_metal',
      shardName: '【混元飞升经·剑破天门篇】',
      tokenName: '万剑仙宗令',
      tokenIcon: 'assets/sects/tokens/token_sword.png',
      tokenDesc: '剑气如虹，极道杀伐。破虚剑芒无坚不摧。',
      characterVisual: {
        avatar: 'assets/character/hero_wanjian.png',
        battleAvatar: 'assets/character/hero_wanjian.png',
        dialogAvatar: 'assets/character/hero_wanjian.png',
        slashColor: '#ffd700',
        skillKey: 'wanjian_slash'
      },
      statModifiers: {
        atkRate: 0.25,        // 攻击 +25%
        hpRate: 0.0,
        defRate: 0.0,
        critRateBonus: 0.12   // 基础暴击率提高 12% (使基准暴击达到 20%)
      },
      reelModifiers: {
        swordWeightMult: 1.5, // 飞剑符号权重 +50%
        winMultChance: 0.25,  // 连线 25% 触发【剑意破界】
        winMultiplier: 3.0    // 剑意破界机缘翻 3 倍
      },
      skills: [
        {
          id: 'wanjian_skill_1',
          name: '剑气如虹',
          tier: 'slots',
          desc: '飞剑符号出现率提升 50%；连线中奖 25% 概率触发【剑意破界】机缘暴涨 3 倍！'
        },
        {
          id: 'wanjian_skill_2',
          name: '万剑归宗 · 连环斩',
          tier: 'combat',
          desc: '攻击 30% 概率触发二段不占回合的飞剑突刺，造成 60% 攻击力的追击伤害！'
        }
      ]
    },

    taiyi: {
      id: 'taiyi',
      name: '太乙丹霞宗',
      type: 'true',
      element: 'wood',
      elementName: '木',
      badge: '回春长青',
      themeColor: '#73daca',
      mapName: '药王圣境 · 青木仙谷',
      mapDesc: '灵瀑飞悬，药香四溢。以木化生，精研长生仙丹与护体灵阵。',
      shardId: 'shard_wood',
      shardName: '【混元飞升经·九转仙魄篇】',
      tokenName: '太乙丹霞宗令',
      tokenIcon: 'assets/sects/tokens/token_pill.png',
      tokenDesc: '乙木长青，回春生息。开局自带青莲护体，空转草木回灵。',
      characterVisual: {
        avatar: 'assets/character/hero_taiyi.png',
        battleAvatar: 'assets/character/hero_taiyi.png',
        dialogAvatar: 'assets/character/hero_taiyi.png',
        slashColor: '#10b981',
        skillKey: 'taiyi_dan_fire'
      },
      statModifiers: {
        atkRate: 0.0,
        hpRate: 0.35,         // 生命上限 +35%
        defRate: 0.15,        // 防御 +15%
        critRateBonus: 0.0
      },
      reelModifiers: {
        pillWeightMult: 1.6,  // 仙丹/草药权重 +60%
        emptySpinHerbChance: 0.30 // 空转 30% 概率自然凝聚灵丹
      },
      skills: [
        {
          id: 'taiyi_skill_1',
          name: '草木回灵',
          tier: 'slots',
          desc: '仙丹符号权重 +60%；未中奖空转时 30% 概率生生不息凝聚 1 枚回春仙丹！'
        },
        {
          id: 'taiyi_skill_2',
          name: '太乙青莲护体',
          tier: 'combat',
          desc: '战斗开局凝聚青莲护盾抵消首道全额伤害；战中气血丹恢复效果提升至 65%！'
        }
      ]
    },

    yushou: {
      id: 'yushou',
      name: '御兽玄机门',
      type: 'true',
      element: 'water',
      elementName: '水',
      badge: '万兽统领',
      themeColor: '#7aa2f7',
      mapName: '大荒万兽天窟',
      mapDesc: '百兽啸聚，蛮荒古林。与灵兽血契相连，百战砺道。',
      shardId: 'shard_water',
      shardName: '【混元飞升经·百灵化神篇】',
      tokenName: '御兽玄机门令',
      tokenIcon: 'assets/sects/tokens/token_beast.png',
      tokenDesc: '通灵伏妖，百灵合道。身侧常驻青灵狼助战扑咬。',
      characterVisual: {
        avatar: 'assets/character/hero_yushou.png',
        battleAvatar: 'assets/character/hero_yushou.png',
        dialogAvatar: 'assets/character/hero_yushou.png',
        slashColor: '#38bdf8',
        skillKey: 'yushou_claw_swipe'
      },
      statModifiers: {
        atkRate: 0.10,        // 攻击 +10%
        hpRate: 0.15,         // 生命 +15%
        defRate: 0.0,
        critRateBonus: 0.0
      },
      reelModifiers: {
        scatterWeightMult: 1.40, // 妖兽遭遇率 +40%
        extraDropChance: 1.0     // 击破妖兽额外爆 1 件战利品
      },
      skills: [
        {
          id: 'yushou_skill_1',
          name: '万兽来朝',
          tier: 'slots',
          desc: '妖兽 Scatter 出现率提升 40%；战胜必定额外多爆出 1 件灵宝！'
        },
        {
          id: 'yushou_skill_2',
          name: '青灵狼袭',
          tier: 'combat',
          desc: '常驻青灵狼协同出击，主角出手后灵狼扑咬补刀 35% 伤害；每击杀 1 怪战力临时 +5%！'
        }
      ]
    },

    tianji: {
      id: 'tianji',
      name: '天机神阵门',
      type: 'true',
      element: 'earth',
      elementName: '土',
      badge: '奇门控盘',
      themeColor: '#e0af68',
      mapName: '悬空星罗浮岛',
      mapDesc: '八卦悬浮，星轨交织。拨弄天象气机，立于不败之地。',
      shardId: 'shard_earth',
      shardName: '【混元飞升经·周天星斗篇】',
      tokenName: '天机神阵门令',
      tokenIcon: 'assets/sects/tokens/token_array.png',
      tokenDesc: '奇门遁甲，万象在握。死境替身免死，胜者返还灵机。',
      characterVisual: {
        avatar: 'assets/character/hero_tianji.png',
        battleAvatar: 'assets/character/hero_tianji.png',
        dialogAvatar: 'assets/character/hero_tianji.png',
        slashColor: '#a855f7',
        skillKey: 'tianji_star_shatter'
      },
      statModifiers: {
        atkRate: 0.0,
        hpRate: 0.0,
        defRate: 0.30,        // 防御 +30%
        critRateBonus: 0.0
      },
      reelModifiers: {
        wildWeightMult: 1.45, // 八卦 Wild 权重 +45%
        bonusRateMult: 2.0,   // 秘境 Hold & Spin 触发率翻倍
        victoryEnergyRefund: 0.5 // 胜战返还 50% 灵机
      },
      skills: [
        {
          id: 'tianji_skill_1',
          name: '奇门借势',
          tier: 'slots',
          desc: '八卦阵 Wild 权重 +45%，秘境触发率翻倍；战斗胜利返还 50% 推演机缘！'
        },
        {
          id: 'tianji_skill_2',
          name: '移形换位 · 替身咒',
          tier: 'combat',
          desc: '受致命伤必定消耗草人免死 1 次并回血 25%，同时将该次伤害 50% 反弹敌方！'
        }
      ]
    },

    fen_tian: {
      id: 'fen_tian',
      name: '焚天九幽道',
      type: 'true',
      element: 'fire',
      elementName: '火',
      badge: '绝地逆命',
      themeColor: '#f7768e',
      mapName: '无间业火焦土',
      mapDesc: '地脉熔岩，紫黑魔焰。以命相搏，绝地爆发无量威能。',
      shardId: 'shard_fire',
      shardName: '【混元飞升经·涅槃焚天篇】',
      tokenName: '焚天九幽道令',
      tokenIcon: 'assets/sects/tokens/token_fire.png',
      tokenDesc: '舍身燃血，逆天而行。残血爆发翻倍杀意，魔火焚天。',
      characterVisual: {
        avatar: 'assets/character/hero_fentian.png',
        battleAvatar: 'assets/character/hero_fentian.png',
        dialogAvatar: 'assets/character/hero_fentian.png',
        slashColor: '#ef4444',
        skillKey: 'fentian_fire_storm'
      },
      statModifiers: {
        atkRate: 0.15,        // 攻击 +15%
        hpRate: 0.0,
        defRate: 0.0,
        critRateBonus: 0.05
      },
      reelModifiers: {
        highTierMultiplier: 2.5 // 高阶神物赔率暴增至 2.5 倍
      },
      skills: [
        {
          id: 'fen_tian_skill_1',
          name: '天魔狂赌',
          tier: 'slots',
          desc: '普通符印小奖期望微降 20%，但高阶神物与法宝连线赔率狂飙至 2.5 倍！'
        },
        {
          id: 'fen_tian_skill_2',
          name: '舍身燃血 · 焚天斩',
          tier: 'combat',
          desc: '气血越低伤害越高（每降 10% 气血增伤 15%，残血上限 +100%），暴击引动九幽魔火溅射！'
        }
      ]
    },

    // ================= 2. 三大隐世奇遇客卿门派 (Hidden Sects) =================
    wantong: {
      id: 'wantong',
      name: '万通多宝商行',
      type: 'hidden',
      element: 'gold_wealth',
      elementName: '金财',
      badge: '富甲天下',
      themeColor: '#ff9e64',
      mapName: '万通聚金总舵',
      mapDesc: '世俗巨富建立的天下商会，专精聚财传家，财可通神。',
      shardId: null,
      shardName: null,
      tokenName: '万通多宝商行金令',
      tokenIcon: 'assets/sects/tokens/token_merchant.png',
      tokenDesc: '富甲天下，灵机返现。获得客卿仙印【万通·富甲诸天印】！',
      hiddenMarkName: '万通·富甲诸天印',
      statModifiers: {
        atkRate: 0.15,
        hpRate: 0.0,
        defRate: 0.0,
        critRateBonus: 0.0
      },
      reelModifiers: {
        energyPayoutMult: 2.5, // 灵机产出 2.5 倍
        wildWeightMult: 1.30
      },
      legacyPerk: 'heirloom_slots_plus_2',
      skills: [
        {
          id: 'wantong_skill_1',
          name: '金玉满堂',
          tier: 'slots',
          desc: '天机盘推演每 10 次天降元宝返还 100 灵机；角色基础攻击永久 +15%！'
        },
        {
          id: 'wantong_skill_2',
          name: '乾坤传家',
          tier: 'legacy',
          desc: '通关后额外解锁 2 个传家宝槽位，允许自选 2 件极品神装封存带入下一世！'
        }
      ]
    },

    qintian: {
      id: 'qintian',
      name: '钦天观星监',
      type: 'hidden',
      element: 'star_radar',
      elementName: '星宿',
      badge: '星宿天枢',
      themeColor: '#bb9af7',
      mapName: '摘星观天阁',
      mapDesc: '避世苦行算命术士，掌握天下正统古令线索，推算无双。',
      shardId: null,
      shardName: null,
      tokenName: '钦天观星监令',
      tokenIcon: 'assets/sects/tokens/token_qintian.png',
      tokenDesc: '洞悉天数，免死复活。获得客卿仙印【钦天·观星逆命印】！',
      hiddenMarkName: '钦天·观星逆命印',
      statModifiers: {
        atkRate: 0.0,
        hpRate: 0.0,
        defRate: 0.20,
        critRateBonus: 0.0
      },
      reelModifiers: {
        bonusRateMult: 1.5
      },
      legacyPerk: 'guaranteed_missing_true_sect',
      skills: [
        {
          id: 'qintian_skill_1',
          name: '天命倒流',
          tier: 'combat',
          desc: '挑战 Boss 阵亡时，立即触发 1 次【时光倒流·免死满血复活】；全装备防御 +20%！'
        },
        {
          id: 'qintian_skill_2',
          name: '寻龙天枢盘',
          tier: 'legacy',
          desc: '通关后获天枢密令：下一世轮回时，100% 必定精准自选玩家尚未收集的正统门派！'
        }
      ]
    },

    jiusi: {
      id: 'jiusi',
      name: '九死血魂教',
      type: 'hidden',
      element: 'blood_reap',
      elementName: '魔血',
      badge: '嗜血逆命',
      themeColor: '#f7768e',
      mapName: '血海幽泉祭坛',
      mapDesc: '绝地求生的上古魔宗，追求逆天夺命、死中求活。',
      shardId: null,
      shardName: null,
      tokenName: '九死血魂教令',
      tokenIcon: 'assets/sects/tokens/token_blood.png',
      tokenDesc: '嗜血逆命，杀戮化生。获得客卿仙印【九死·万劫不灭印】！',
      hiddenMarkName: '九死·万劫不灭印',
      statModifiers: {
        atkRate: 0.0,
        hpRate: 0.0,
        defRate: 0.0,
        critRateBonus: 0.15
      },
      reelModifiers: {
        fastPace: true
      },
      legacyPerk: 'free_reincarnation_anytime',
      skills: [
        {
          id: 'jiusi_skill_1',
          name: '嗜血逆命',
          tier: 'combat',
          desc: '攻击造成伤害的 20% 转化为自身气血（吸血神技）；暴击率永久提升 15%！'
        },
        {
          id: 'jiusi_skill_2',
          name: '血祭夺舍',
          tier: 'legacy',
          desc: '允许随时无损主动轮回重开，并保留当前境界 50% 的攻防血属性注入新世！'
        }
      ]
    }
  },

  // 8 大宗门专属装备主题映射表 (转世转化神装使用，各门派色彩与图案鲜明区分，全量统一为 PNG 图标)
  EQUIPMENT_TEMPLATES: {
    wanjian: {
      weapon: { name: '极道飞剑', slotName: '武器', icon: 'assets/equipment/weapon_wanjian.png', element: '金' },
      armor:  { name: '天剑法袍', slotName: '衣服', icon: 'assets/equipment/armor_wanjian.png', element: '金' },
      ring:   { name: '剑意灵戒', slotName: '戒指', icon: 'assets/symbols/SYM_08.png', element: '金' },
      hat:    { name: '问剑道冠', slotName: '帽子', icon: 'assets/symbols/SYM_01.png', element: '金' },
      boots:  { name: '御剑踏云履', slotName: '鞋子', icon: 'assets/symbols/SYM_09.png', element: '金' },
      belt:   { name: '极道剑穗带', slotName: '腰带', icon: 'assets/symbols/SYM_10.png', element: '金' }
    },
    taiyi: {
      weapon: { name: '青木灵杖', slotName: '武器', icon: 'assets/equipment/weapon_taiyi.png', element: '木' },
      armor:  { name: '青莲道袍', slotName: '衣服', icon: 'assets/equipment/armor_taiyi.png', element: '木' },
      ring:   { name: '回春宝戒', slotName: '戒指', icon: 'assets/symbols/SYM_08.png', element: '木' },
      hat:    { name: '九转丹阳巾', slotName: '帽子', icon: 'assets/symbols/SYM_01.png', element: '木' },
      boots:  { name: '生生不息履', slotName: '鞋子', icon: 'assets/symbols/SYM_09.png', element: '木' },
      belt:   { name: '药王悬壶带', slotName: '腰带', icon: 'assets/symbols/SYM_10.png', element: '木' }
    },
    yushou: {
      weapon: { name: '驯兽骨刃', slotName: '武器', icon: 'assets/equipment/weapon_yushou.png', element: '水' },
      armor:  { name: '荒兽灵铠', slotName: '衣服', icon: 'assets/equipment/armor_yushou.png', element: '水' },
      ring:   { name: '血契兽灵戒', slotName: '戒指', icon: 'assets/symbols/SYM_08.png', element: '水' },
      hat:    { name: '兽王额带', slotName: '帽子', icon: 'assets/symbols/SYM_01.png', element: '水' },
      boots:  { name: '踏风蹑兽靴', slotName: '鞋子', icon: 'assets/symbols/SYM_09.png', element: '水' },
      belt:   { name: '万兽缚灵索', slotName: '腰带', icon: 'assets/symbols/SYM_10.png', element: '水' }
    },
    tianji: {
      weapon: { name: '天机阵盘', slotName: '武器', icon: 'assets/equipment/weapon_tianji.png', element: '土' },
      armor:  { name: '奇门八卦袍', slotName: '衣服', icon: 'assets/equipment/armor_tianji.png', element: '土' },
      ring:   { name: '星罗衍天戒', slotName: '戒指', icon: 'assets/symbols/SYM_08.png', element: '土' },
      hat:    { name: '天机阴阳巾', slotName: '帽子', icon: 'assets/symbols/SYM_01.png', element: '土' },
      boots:  { name: '移星易宿步', slotName: '鞋子', icon: 'assets/symbols/SYM_09.png', element: '土' },
      belt:   { name: '乾坤归元索', slotName: '腰带', icon: 'assets/symbols/SYM_10.png', element: '土' }
    },
    fen_tian: {
      weapon: { name: '九幽魔刀', slotName: '武器', icon: 'assets/equipment/weapon_fen_tian.png', element: '火' },
      armor:  { name: '业火黑煞甲', slotName: '衣服', icon: 'assets/equipment/armor_fen_tian.png', element: '火' },
      ring:   { name: '燃血魔煞戒', slotName: '戒指', icon: 'assets/symbols/SYM_08.png', element: '火' },
      hat:    { name: '焚天血炎冠', slotName: '帽子', icon: 'assets/symbols/SYM_01.png', element: '火' },
      boots:  { name: '踏焰追魂履', slotName: '鞋子', icon: 'assets/symbols/SYM_09.png', element: '火' },
      belt:   { name: '九幽焚煞带', slotName: '腰带', icon: 'assets/symbols/SYM_10.png', element: '火' }
    },
    wantong: {
      weapon: { name: '金玉如意算盘', slotName: '武器', icon: 'assets/equipment/weapon_wantong.png', element: '金财' },
      armor:  { name: '八宝绫罗锦缎袍', slotName: '衣服', icon: 'assets/equipment/armor_wantong.png', element: '金财' },
      ring:   { name: '聚宝翡翠戒', slotName: '戒指', icon: 'assets/symbols/SYM_08.png', element: '金财' },
      hat:    { name: '万宝祥云冠', slotName: '帽子', icon: 'assets/symbols/SYM_01.png', element: '金财' },
      boots:  { name: '金玉踏波靴', slotName: '鞋子', icon: 'assets/symbols/SYM_09.png', element: '金财' },
      belt:   { name: '八宝琉璃玉带', slotName: '腰带', icon: 'assets/symbols/SYM_10.png', element: '金财' }
    },
    qintian: {
      weapon: { name: '摘星天枢尺', slotName: '武器', icon: 'assets/equipment/weapon_qintian.png', element: '星宿' },
      armor:  { name: '周天星象仪法袍', slotName: '衣服', icon: 'assets/equipment/armor_qintian.png', element: '星宿' },
      ring:   { name: '北斗七星戒', slotName: '戒指', icon: 'assets/symbols/SYM_08.png', element: '星宿' },
      hat:    { name: '观天星斗冠', slotName: '帽子', icon: 'assets/symbols/SYM_01.png', element: '星宿' },
      boots:  { name: '踏宿步虚履', slotName: '鞋子', icon: 'assets/symbols/SYM_09.png', element: '星宿' },
      belt:   { name: '紫微星辰带', slotName: '腰带', icon: 'assets/symbols/SYM_10.png', element: '星宿' }
    },
    jiusi: {
      weapon: { name: '噬魂血饮枪', slotName: '武器', icon: 'assets/equipment/weapon_jiusi.png', element: '魔血' },
      armor:  { name: '九死逆命血衣', slotName: '衣服', icon: 'assets/equipment/armor_jiusi.png', element: '魔血' },
      ring:   { name: '万毒嗜血戒', slotName: '戒指', icon: 'assets/symbols/SYM_08.png', element: '魔血' },
      hat:    { name: '血魂逆煞巾', slotName: '帽子', icon: 'assets/symbols/SYM_01.png', element: '魔血' },
      boots:  { name: '幽泉踏血靴', slotName: '鞋子', icon: 'assets/symbols/SYM_09.png', element: '魔血' },
      belt:   { name: '噬血祭魂绦', slotName: '腰带', icon: 'assets/symbols/SYM_10.png', element: '魔血' }
    }
  },

  getSectEquipTemplate(sectId, part) {
    if (!sectId || !this.EQUIPMENT_TEMPLATES[sectId]) return null;
    return this.EQUIPMENT_TEMPLATES[sectId][part] || null;
  },

  getSect(sectId) {
    if (!sectId) return null;
    return this.SECTS[sectId] || null;
  },

  getTrueSects() {
    return Object.values(this.SECTS).filter(s => s.type === 'true');
  },

  getDecoySects() {
    return Object.values(this.SECTS).filter(s => s.type === 'decoy' || s.type === 'hidden');
  },

  getHiddenSects() {
    return Object.values(this.SECTS).filter(s => s.type === 'hidden');
  },

  getAllSects() {
    return Object.values(this.SECTS);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.SlotsRPG.SectConfig;
}
