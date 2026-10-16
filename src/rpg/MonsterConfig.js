/**
 * MonsterConfig.js - 三阶修仙妖兽与遭遇模型
 * 遵循网文修仙小说经典原型：
 * 1. 普通妖兽 (3个符号触发3~5只车轮战，体型 120px，小巧敏捷)
 * 2. 精英妖兽 (4个符号触发1~2只，体型 180px，魁梧骨铠带神通)
 * 3. 关卡 Boss (5个符号/满蕴灵触发1只，体型 250px，巨型霸气盘踞半屏)
 */
window.SlotsRPG = window.SlotsRPG || {};

window.SlotsRPG.MonsterConfig = {
  // 怪物分阶形象与基准属性定义
  MONSTERS: {
    // 1. 普通妖兽库 (Normal)
    normal: {
      1: [
        {
          id: 'norm_fox_1',
          name: '赤灵妖狐',
          title: '一阶妖兽·赤灵妖狐',
          tierName: '妖兽',
          tier: 'normal',
          size: 85,
          avatar: 'assets/monsters/monster_fox_vivid.png',
          avatarFilter: 'none',
          hp: 55,
          maxHp: 55,
          atk: 7,
          def: 2,
          critRate: 0.02,
          skillName: '狐火扑击',
          skillDesc: '喷吐赤煞狐火向前扑击',
          skillType: 'poison_flame',
          dropExp: 45,
          dropEnergy: 40
        },
        {
          id: 'norm_toad_1',
          name: '黑水巨蟾',
          title: '一阶妖兽·黑水巨蟾',
          tierName: '妖兽',
          tier: 'normal',
          size: 90,
          avatar: 'assets/monsters/monster_toad_vivid.png',
          avatarFilter: 'none',
          hp: 65,
          maxHp: 65,
          atk: 6,
          def: 3,
          critRate: 0.02,
          skillName: '阴涎重击',
          skillDesc: '狂甩巨舌猛击主角',
          skillType: 'poison_flame',
          dropExp: 50,
          dropEnergy: 45
        },
        {
          id: 'norm_bat_1',
          name: '噬血魔蝠',
          title: '一阶妖兽·噬血魔蝠',
          tierName: '妖兽',
          tier: 'normal',
          size: 80,
          avatar: 'assets/monsters/monster_bat_vivid.png',
          avatarFilter: 'none',
          hp: 48,
          maxHp: 48,
          atk: 8,
          def: 1,
          critRate: 0.03,
          skillName: '声煞碎石',
          skillDesc: '尖锐声波振荡虚空',
          skillType: 'claw_scratch',
          dropExp: 40,
          dropEnergy: 50
        },
        {
          id: 'norm_spider_1',
          name: '幽冥鬼蛛',
          title: '一阶妖兽·幽冥鬼蛛',
          tierName: '妖兽',
          tier: 'normal',
          size: 85,
          avatar: 'assets/monsters/monster_spider_vivid.png',
          avatarFilter: 'none',
          hp: 58,
          maxHp: 58,
          atk: 8,
          def: 2,
          critRate: 0.03,
          skillName: '鬼丝缠魄',
          skillDesc: '喷吐粘稠鬼丝封锁气机',
          skillType: 'poison_flame',
          dropExp: 48,
          dropEnergy: 45
        },
        {
          id: 'norm_boar_1',
          name: '狂暴獠猪',
          title: '一阶妖兽·狂暴獠猪',
          tierName: '妖兽',
          tier: 'normal',
          size: 90,
          avatar: 'assets/monsters/monster_boar_vivid.png',
          battleBg: 'assets/battle_bg/bg_misty_forest.jpg',
          avatarFilter: 'none',
          hp: 70,
          maxHp: 70,
          atk: 7,
          def: 3,
          critRate: 0.02,
          skillName: '金刚怒撞',
          skillDesc: '两颗狂暴獠牙突刺横扫',
          skillType: 'arm_slash',
          dropExp: 52,
          dropEnergy: 48
        },
        {
          id: 'yao_snake',
          name: '碧磷青蛇妖',
          title: '山林小妖·碧磷青蛇',
          tierName: '妖兽',
          tier: 'normal',
          size: 88,
          avatar: 'assets/monsters/monster_snake_vivid.png',
          avatarFilter: 'none',
          hp: 56,
          maxHp: 56,
          atk: 8,
          def: 2,
          critRate: 0.03,
          skillName: '碧磷毒雾',
          skillDesc: '昂首吐信喷出腥甜碧绿毒雾',
          skillType: 'poison_flame',
          dropExp: 48,
          dropEnergy: 46
        },
        {
          id: 'yao_dog',
          name: '黑煞恶犬妖',
          title: '山野凶妖·黑煞恶犬',
          tierName: '妖兽',
          tier: 'normal',
          size: 88,
          avatar: 'assets/monsters/monster_dog_vivid.png',
          avatarFilter: 'none',
          hp: 62,
          maxHp: 62,
          atk: 9,
          def: 2,
          critRate: 0.04,
          skillName: '黑煞扑咬',
          skillDesc: '裹挟黑煞妖风猛扑撕咬咽喉',
          skillType: 'claw_scratch',
          dropExp: 50,
          dropEnergy: 48
        },
        {
          id: 'yao_rooster',
          name: '赤冠铁羽鸡妖',
          title: '荒村凶妖·铁羽公鸡',
          tierName: '妖兽',
          tier: 'normal',
          size: 86,
          avatar: 'assets/monsters/monster_rooster_vivid.png',
          avatarFilter: 'none',
          hp: 54,
          maxHp: 54,
          atk: 9,
          def: 2,
          critRate: 0.04,
          skillName: '铁喙啄魂',
          skillDesc: '怒竖赤焰鸡冠，精钢铁喙疾啄破甲',
          skillType: 'arm_slash',
          dropExp: 46,
          dropEnergy: 45
        },
        {
          id: 'yao_rat',
          name: '盗丹硕鼠精',
          title: '地穴狡妖·盗丹硕鼠',
          tierName: '妖兽',
          tier: 'normal',
          size: 84,
          avatar: 'assets/monsters/monster_rat_vivid.png',
          avatarFilter: 'none',
          hp: 52,
          maxHp: 52,
          atk: 8,
          def: 2,
          critRate: 0.05,
          skillName: '噬灵金爪',
          skillDesc: '金铁利爪带起妖烟抓挠偷袭',
          skillType: 'claw_scratch',
          dropExp: 48,
          dropEnergy: 52
        },
        {
          id: 'yao_rabbit',
          name: '赤目暴走兔妖',
          title: '密林凶妖·赤目暴兔',
          tierName: '妖兽',
          tier: 'normal',
          size: 85,
          avatar: 'assets/monsters/monster_rabbit_vivid.png',
          avatarFilter: 'none',
          hp: 58,
          maxHp: 58,
          atk: 9,
          def: 2,
          critRate: 0.04,
          skillName: '赤焰蹬踏',
          skillDesc: '血瞳暴起，双腿裹挟妖火连环猛踹',
          skillType: 'poison_flame',
          dropExp: 50,
          dropEnergy: 48
        }
      ],
      2: [
        {
          id: 'norm_scorpion_2',
          name: '赤火巨蝎',
          title: '二阶妖兽·赤火巨蝎',
          tierName: '二阶妖兽',
          tier: 'normal',
          size: 95,
          avatar: 'assets/monsters/monster_scorpion_vivid.png',
          avatarFilter: 'none',
          hp: 320,
          maxHp: 320,
          atk: 30,
          def: 16,
          critRate: 0.03,
          skillName: '毒钩刺魄',
          skillDesc: '毒尾倒钩迅猛穿刺',
          skillType: 'poison_flame',
          dropExp: 110,
          dropEnergy: 100
        },
        {
          id: 'norm_wolf_2',
          name: '幽冥狂狼',
          title: '二阶妖兽·幽冥狂狼',
          tierName: '二阶妖兽',
          tier: 'normal',
          size: 90,
          avatar: 'assets/monsters/monster_wolf_vivid.png',
          avatarFilter: 'none',
          hp: 280,
          maxHp: 280,
          atk: 34,
          def: 12,
          critRate: 0.04,
          skillName: '冥影撕咬',
          skillDesc: '身化暗影狂暴撕裂',
          skillType: 'claw_scratch',
          dropExp: 105,
          dropEnergy: 110
        },
        {
          id: 'norm_ape_2',
          name: '赤火暴猿',
          title: '二阶妖兽·赤火暴猿',
          tierName: '二阶妖兽',
          tier: 'normal',
          size: 98,
          avatar: 'assets/monsters/monster_ape_vivid.png',
          avatarFilter: 'none',
          hp: 360,
          maxHp: 360,
          atk: 36,
          def: 18,
          critRate: 0.05,
          skillName: '裂石狂捶',
          skillDesc: '火山岩双拳震碎大地',
          skillType: 'arm_slash',
          dropExp: 125,
          dropEnergy: 115
        },
        {
          id: 'yao_bull',
          name: '青角蛮牛精',
          title: '二阶妖兽·青角蛮牛',
          tierName: '二阶妖兽',
          tier: 'normal',
          size: 98,
          avatar: 'assets/monsters/monster_bull_vivid.png',
          avatarFilter: 'none',
          hp: 350,
          maxHp: 350,
          atk: 32,
          def: 18,
          critRate: 0.04,
          skillName: '蛮角冲撞',
          skillDesc: '鼻喷白火，青铜巨角狂暴顶撞',
          skillType: 'fissure_claw',
          dropExp: 120,
          dropEnergy: 110
        },
        {
          id: 'yao_tiger',
          name: '吊睛斑斓虎妖',
          title: '二阶妖兽·斑斓山君',
          tierName: '二阶妖兽',
          tier: 'normal',
          size: 98,
          avatar: 'assets/monsters/monster_tiger_vivid.png',
          avatarFilter: 'none',
          hp: 330,
          maxHp: 330,
          atk: 38,
          def: 15,
          critRate: 0.06,
          skillName: '山君腥风',
          skillDesc: '额纹放光，虎啸掀起腥风利爪扑杀',
          skillType: 'claw_scratch',
          dropExp: 125,
          dropEnergy: 115
        },
        {
          id: 'yao_bear',
          name: '裂山黑熊精',
          title: '二阶妖兽·裂山黑熊',
          tierName: '二阶妖兽',
          tier: 'normal',
          size: 102,
          avatar: 'assets/monsters/monster_bear_vivid.png',
          avatarFilter: 'none',
          hp: 390,
          maxHp: 390,
          atk: 35,
          def: 20,
          critRate: 0.04,
          skillName: '裂山熊抱',
          skillDesc: '岩甲暴熊咆哮震地，巨掌重击',
          skillType: 'arm_slash',
          dropExp: 130,
          dropEnergy: 120
        },
        {
          id: 'yao_turtle',
          name: '玄水铁背龟妖',
          title: '寒潭妖兽·玄水铁龟',
          tierName: '二阶妖兽',
          tier: 'normal',
          size: 96,
          avatar: 'assets/monsters/monster_turtle_vivid.png',
          avatarFilter: 'none',
          hp: 400,
          maxHp: 400,
          atk: 28,
          def: 24,
          critRate: 0.03,
          skillName: '寒潭水煞',
          skillDesc: '背壳符文亮起，喷吐冰寒水箭',
          skillType: 'thunder_strike',
          dropExp: 120,
          dropEnergy: 115
        },
        {
          id: 'yao_crab',
          name: '玄铁巨钳蟹妖',
          title: '深渊妖兽·玄铁巨蟹',
          tierName: '二阶妖兽',
          tier: 'normal',
          size: 96,
          avatar: 'assets/monsters/monster_crab_vivid.png',
          avatarFilter: 'none',
          hp: 340,
          maxHp: 340,
          atk: 36,
          def: 20,
          critRate: 0.05,
          skillName: '玄铁断金钳',
          skillDesc: '挥舞黑铁重甲巨钳横扫夹击',
          skillType: 'arm_slash',
          dropExp: 125,
          dropEnergy: 118
        }
      ],
      // 3. 灵界 · 飘渺九霄仙域 太古大荒真灵库 (WorldTier 2)
      3: [
        {
          id: 'spirit_sparrow_1',
          name: '焚天赤炎雀',
          title: '大荒凶灵·焚天赤炎雀',
          tierName: '太古真灵',
          tier: 'normal',
          size: 110,
          avatar: 'assets/monsters/monster_rooster_vivid.png',
          avatarFilter: 'hue-rotate(330deg) saturate(180%)',
          hp: 25000,
          maxHp: 25000,
          atk: 520,
          def: 240,
          critRate: 0.10,
          skillName: '离火燎原',
          skillDesc: '喷吐太荒朱雀神炎焚灭虚空',
          skillType: 'poison_flame',
          dropExp: 1800,
          dropEnergy: 1600
        },
        {
          id: 'spirit_snake_1',
          name: '噬灵玄冥蟒',
          title: '极北寒渊·噬灵玄冥蟒',
          tierName: '太古真灵',
          tier: 'normal',
          size: 115,
          avatar: 'assets/monsters/monster_snake_vivid.png',
          avatarFilter: 'hue-rotate(180deg) brightness(1.2)',
          hp: 35000,
          maxHp: 35000,
          atk: 600,
          def: 280,
          critRate: 0.10,
          skillName: '九幽冰魄',
          skillDesc: '冰煞巨尾横扫卷动万载玄霜',
          skillType: 'poison_flame',
          dropExp: 2200,
          dropEnergy: 2000
        },
        {
          id: 'spirit_rhino_1',
          name: '太古独角兕',
          title: '大荒巨擘·太古独角兕',
          tierName: '太古真灵',
          tier: 'normal',
          size: 125,
          avatar: 'assets/monsters/monster_bull_vivid.png',
          avatarFilter: 'hue-rotate(270deg) contrast(130%)',
          hp: 48000,
          maxHp: 48000,
          atk: 750,
          def: 380,
          critRate: 0.08,
          skillName: '裂地撼山',
          skillDesc: '踏地狂震引动地脉崩裂冲击',
          skillType: 'fissure_claw',
          dropExp: 2800,
          dropEnergy: 2500
        },
        {
          id: 'spirit_bat_1',
          name: '虚空裂隙魔蝠',
          title: '太虚异种·裂隙魔蝠',
          tierName: '太古真灵',
          tier: 'normal',
          size: 105,
          avatar: 'assets/monsters/monster_bat_vivid.png',
          avatarFilter: 'hue-rotate(90deg) invert(20%)',
          hp: 42000,
          maxHp: 42000,
          atk: 880,
          def: 300,
          critRate: 0.15,
          skillName: '虚空音煞',
          skillDesc: '穿梭裂隙破空超音波绞杀',
          skillType: 'claw_scratch',
          dropExp: 3200,
          dropEnergy: 3000
        },
        {
          id: 'spirit_beast_1',
          name: '星渊噬魂巨蝎',
          title: '星罗诡兽·噬魂巨蝎',
          tierName: '太古真灵',
          tier: 'normal',
          size: 120,
          avatar: 'assets/monsters/monster_scorpion_vivid.png',
          avatarFilter: 'hue-rotate(220deg) brightness(1.3)',
          hp: 60000,
          maxHp: 60000,
          atk: 960,
          def: 420,
          critRate: 0.12,
          skillName: '星毒贯心刺',
          skillDesc: '淬炼星宿死光之剧毒巨尾暴刺',
          skillType: 'thunder_strike',
          dropExp: 3800,
          dropEnergy: 3500
        }
      ]
    },

    // 2. 精英妖兽库 (Elite)
    elite: {
      1: [
        {
          id: 'elite_leopard_1',
          name: '三目雷豹',
          title: '一阶精英·三目雷豹',
          tierName: '精英大妖',
          tier: 'elite',
          size: 130,
          avatar: 'assets/monsters/monster_leopard_vivid.png',
          avatarFilter: 'none',
          hp: 200,
          maxHp: 200,
          atk: 13,
          def: 5,
          critRate: 0.04,
          skillName: '紫霄天雷',
          skillDesc: '第三神目引动九天妖雷轰顶',
          skillType: 'thunder_strike',
          dropExp: 220,
          dropEnergy: 200,
          rewardEquip: { part: 'weapon', qualityCode: 'Q2' }
        },
        {
          id: 'elite_rhino_1',
          name: '金角巨兕',
          title: '一阶精英·金角巨兕',
          tierName: '精英大妖',
          tier: 'elite',
          size: 135,
          avatar: 'assets/monsters/monster_rhino_vivid.png',
          avatarFilter: 'none',
          hp: 240,
          maxHp: 240,
          atk: 11,
          def: 7,
          critRate: 0.03,
          skillName: '裂地冲撞',
          skillDesc: '冲天巨角狂暴奔袭撞击',
          skillType: 'fissure_claw',
          dropExp: 240,
          dropEnergy: 220,
          rewardEquip: { part: 'armor', qualityCode: 'Q2' }
        }
      ],
      2: [
        {
          id: 'elite_lion_2',
          name: '紫晶翼狮',
          title: '二阶精英·紫晶翼狮',
          tier: 'elite',
          size: 195,
          avatar: 'assets/monsters/monster_lion_vivid.png',
          avatarFilter: 'none',
          hp: 2100,
          maxHp: 2100,
          atk: 88,
          def: 45,
          critRate: 0.12,
          skillName: '紫晶狂啸',
          skillDesc: '羽翼振动紫晶破空，金刚碎石',
          skillType: 'fissure_claw',
          dropExp: 550,
          dropEnergy: 500,
          rewardEquip: { part: 'boots', qualityCode: 'Q3' }
        },
        {
          id: 'elite_snake_2',
          name: '幽冥白骨巨蛇',
          title: '二阶精英·白骨巨蛇',
          tier: 'elite',
          size: 190,
          avatar: 'assets/monsters/monster_bone_snake_vivid.png',
          avatarFilter: 'none',
          hp: 1900,
          maxHp: 1900,
          atk: 95,
          def: 38,
          critRate: 0.10,
          skillName: '九幽阴煞',
          skillDesc: '骨刺暴起，阴风蚀骨',
          skillType: 'thunder_strike',
          dropExp: 520,
          dropEnergy: 520,
          rewardEquip: { part: 'belt', qualityCode: 'Q3' }
        },
        {
          id: 'elite_hawk_2',
          name: '九天雷鹏',
          title: '二阶精英·九天雷鹏',
          tier: 'elite',
          size: 185,
          avatar: 'assets/monsters/monster_hawk_vivid.png',
          avatarFilter: 'none',
          hp: 1850,
          maxHp: 1850,
          atk: 98,
          def: 35,
          critRate: 0.15,
          skillName: '风雷天翼',
          skillDesc: '双翼卷动九天罡风狂雷俯冲',
          skillType: 'thunder_strike',
          dropExp: 540,
          dropEnergy: 510,
          rewardEquip: { part: 'weapon', qualityCode: 'Q3' }
        }
      ],
      // 3. 灵界 · 飘渺九霄仙域 精英仙将与魔尊库 (WorldTier 2)
      3: [
        {
          id: 'elite_god_guard_3',
          name: '南天门 · 执戈神将',
          title: '仙庭律法·执戈神将',
          tierName: '仙庭神尊',
          tier: 'elite',
          size: 210,
          avatar: 'assets/boss/boss_tianji_puppet_vivid.png',
          avatarFilter: 'hue-rotate(45deg) saturate(160%)',
          hp: 150000,
          maxHp: 150000,
          atk: 1800,
          def: 850,
          critRate: 0.15,
          skillName: '金戈荡魔斩',
          skillDesc: '仙庭律法金戈引动十万天兵意志力劈',
          skillType: 'thunder_strike',
          dropExp: 8000,
          dropEnergy: 7500,
          rewardEquip: { part: 'weapon', qualityCode: 'Q6' }
        },
        {
          id: 'elite_golden_crow_3',
          name: '太古金乌 · 炽炎残躯',
          title: '太阳神裔·金乌战魄',
          tierName: '仙庭神尊',
          tier: 'elite',
          size: 220,
          avatar: 'assets/boss/boss_golden_chimera_vivid.png',
          avatarFilter: 'hue-rotate(15deg) contrast(150%)',
          hp: 260000,
          maxHp: 260000,
          atk: 2500,
          def: 1100,
          critRate: 0.18,
          skillName: '真阳灭世金芒',
          skillDesc: '九天大日神芒自双翼激射轰炸大地',
          skillType: 'poison_flame',
          dropExp: 14000,
          dropEnergy: 12000,
          rewardEquip: { part: 'armor', qualityCode: 'Q6' }
        },
        {
          id: 'elite_asura_lord_3',
          name: '幽冥修罗魔尊',
          title: '域外血海·修罗魔尊',
          tierName: '魔渊霸主',
          tier: 'elite',
          size: 235,
          avatar: 'assets/boss/boss_thunder_dragon_vivid.png',
          avatarFilter: 'hue-rotate(300deg) saturate(200%)',
          hp: 420000,
          maxHp: 420000,
          atk: 3600,
          def: 1500,
          critRate: 0.20,
          skillName: '血海滔天煞',
          skillDesc: '无尽血煞之潮湮灭元神真身',
          skillType: 'thunder_strike',
          dropExp: 25000,
          dropEnergy: 20000,
          rewardEquip: { part: 'ring', qualityCode: 'Q7' }
        }
      ]
    },

    // 3. 关卡 Boss 库 (Boss)
    boss: {
      1: {
        id: 'boss_1',
        name: '赤炼蟒',
        realm: '练气境巅峰·妖王',
        title: '练气境妖王·赤炼蟒',
        tier: 'boss',
        potTier: 1,
        level: 10,
        size: 250,
        avatar: 'assets/boss/boss_red_python_vivid.png',
        avatarFilter: 'none',
        hp: 5500,
        maxHp: 5500,
        atk: 96,
        def: 42,
        critRate: 0.08,
        skillName: '九幽毒煞',
        skillDesc: '喷吐赤炼毒焰，遮天蔽日烈火焚虚',
        skillType: 'poison_flame',
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
        name: '铁甲金猊',
        realm: '筑基初期·神兽',
        title: '筑基初期·铁甲金猊',
        tier: 'boss',
        potTier: 2,
        level: 20,
        size: 255,
        avatar: 'assets/boss/boss_golden_chimera_vivid.png',
        avatarFilter: 'none',
        hp: 12000,
        maxHp: 12000,
        atk: 220,
        def: 110,
        critRate: 0.10,
        skillName: '裂地金罡',
        skillDesc: '金刚巨爪裂地狂啸，三道金芒撕碎乾坤',
        skillType: 'fissure_claw',
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
        name: '九霄雷龙',
        realm: '筑基后期·妖祖',
        title: '筑基后期·九霄雷龙',
        tier: 'boss',
        potTier: 3,
        level: 30,
        size: 270,
        avatar: 'assets/boss/boss_thunder_dragon_vivid.png',
        avatarFilter: 'none',
        hp: 26000,
        maxHp: 26000,
        atk: 450,
        def: 220,
        critRate: 0.12,
        skillName: '九天劫雷',
        skillDesc: '真龙咆哮引动周天雷劫，万丈狂雷灭世',
        skillType: 'thunder_strike',
        skillMultiplier: 1.5,
        rewards: {
          exp: 8000,
          energy: 5000,
          rewardEquip: { part: 'ring', qualityCode: 'Q4' },
          rewardPill: { subType: 'exp', amount: 20 }
        }
      }
    },

    // 4. 宗门伴生护法灵兽
    COMPANIONS: {
      wolf: {
        id: 'wolf_companion',
        name: '青灵狼',
        sectId: 'yushou',
        title: '灵兽·青灵狼',
        avatar: 'assets/monsters/wolf_companion_vivid.png',
        desc: '御兽玄机门护法灵兽，出战协助扑咬补刀'
      }
    }
  },

  /**
   * 根据推演出的怪物符号数量生成对应的遭遇战队列
   * @param {number|Object} scatterCountOrConfig - 怪物符号数量 (3, 4, 5) 或 battleConfig 对象
   * @param {number} potLevel - 天机盘等级 (1 或 2)
   * @param {number} defeatStreak - 连败保护
   * @param {Object} player - 玩家上下文 (用于智能短板装备补齐)
   */
  createEncounter(scatterCountOrConfig = 3, potLevel = 1, defeatStreak = 0, player = null) {
    const levelKey = potLevel >= 2 ? 2 : 1;
    let tier = 'normal';
    let monsters = [];
    let scatterCount = 3;
    let exactCount = null;
    let betMultiplier = 1;

    if (typeof scatterCountOrConfig === 'object' && scatterCountOrConfig !== null) {
      scatterCount = scatterCountOrConfig.scatterCount || 3;
      exactCount = scatterCountOrConfig.count || null;
      tier = scatterCountOrConfig.tier || (scatterCount >= 5 ? 'boss' : (scatterCount === 4 ? 'elite' : 'normal'));
      if (scatterCountOrConfig.betMultiplier) {
        betMultiplier = Math.max(1, Number(scatterCountOrConfig.betMultiplier) || 1);
      }
    } else {
      scatterCount = Number(scatterCountOrConfig) || 3;
      if (scatterCount >= 5) tier = 'boss';
      else if (scatterCount === 4) tier = 'elite';
      else tier = 'normal';
    }

    const targetPlayer = player || (scatterCountOrConfig && scatterCountOrConfig.player) || null;
    const isMortal = targetPlayer && targetPlayer.isMortal;
    const pLevel = targetPlayer ? (isMortal ? 0 : targetPlayer.level) : 1;

    if (tier === 'boss') {
      // 触发 1 个关卡大 Boss (优先通过 BossConfig 匹配宗门并按 1.1~1.2x 动态计算战力与锁定快照)
      let boss = null;
      const lockedSnap = (scatterCountOrConfig && scatterCountOrConfig.lockedSnapshot) ||
        (targetPlayer && targetPlayer.gameManager && targetPlayer.gameManager.lockedSectBossSnapshot) || null;
      if (window.SlotsRPG && window.SlotsRPG.BossConfig) {
        const sectId = scatterCountOrConfig && scatterCountOrConfig.sectId ? scatterCountOrConfig.sectId : (targetPlayer ? targetPlayer.currentSect : null);
        const samsara = scatterCountOrConfig && scatterCountOrConfig.samsaraCount ? scatterCountOrConfig.samsaraCount : potLevel;
        boss = window.SlotsRPG.BossConfig.getBoss(potLevel, defeatStreak, sectId, samsara, targetPlayer, lockedSnap);
      } else {
        const rawBoss = this.MONSTERS.boss[levelKey] || this.MONSTERS.boss[1];
        boss = JSON.parse(JSON.stringify(rawBoss));
        if (defeatStreak >= 1) {
          const weakFactor = Math.max(0.55, 1 - defeatStreak * 0.15);
          boss.hp = Math.max(100, Math.round(boss.hp * weakFactor));
          boss.maxHp = boss.hp;
          boss.atk = Math.max(10, Math.round(boss.atk * weakFactor));
          boss.isWeakened = true;
        }
      }
      monsters = [boss];
    } else if (tier === 'elite') {
      // 触发 1 ~ 2 个精英怪物 (打乱池子确保怪兽互不相同)
      const rawPool = this.MONSTERS.elite[levelKey] || this.MONSTERS.elite[1];
      const shuffled = [...rawPool].sort(() => Math.random() - 0.5);
      const count = exactCount || (isMortal || pLevel <= 3 ? 1 : (Math.floor(Math.random() * 2) + 1));
      const isReel = !!(scatterCountOrConfig && scatterCountOrConfig.isReelEncounter);
      for (let i = 0; i < count; i++) {
        const template = shuffled[i % shuffled.length];
        const m = JSON.parse(JSON.stringify(template));
        m.index = i + 1;
        m.total = count;

        if (isReel && targetPlayer && !isMortal) {
          // 滚轮 2-3-4 触发精英奇遇：动态匹配玩家当前综合战力 0.95 ~ 1.05x，保证惊喜挑战性与高额掉落
          const pStats = targetPlayer.getTotalStats();
          const perMonsterMult = (0.95 + Math.random() * 0.10) / Math.max(1, count * 0.85);
          m.hp = Math.max(80, Math.round(pStats.hp * perMonsterMult * 0.9));
          m.maxHp = m.hp;
          m.atk = Math.max(12, Math.round(pStats.atk * perMonsterMult * 0.85));
          m.def = Math.max(4, Math.round(pStats.def * perMonsterMult * 0.8));
          m.combatPower = Math.floor(m.hp * 0.2 + m.atk * 2.0 + m.def * 1.5);
        } else if (isMortal || pLevel <= 3) {
          m.hp = Math.max(80, Math.round(m.hp * 0.65));
          m.maxHp = m.hp;
          m.atk = Math.max(6, Math.round(m.atk * 0.70));
          m.def = Math.max(2, Math.round(m.def * 0.60));
        }
        if (defeatStreak >= 1) {
          const weakFactor = Math.max(0.5, 1 - defeatStreak * 0.15);
          m.hp = Math.max(40, Math.round(m.hp * weakFactor));
          m.maxHp = m.hp;
          m.atk = Math.max(4, Math.round(m.atk * weakFactor));
          m.isWeakened = true;
        }

        monsters.push(m);
      }
    } else {
      // 3 个符号：普通妖兽群攻 (根据玩家境界动态调整群怪数量与属性，杜绝初期围攻猝死)
      const rawPool = this.MONSTERS.normal[levelKey] || this.MONSTERS.normal[1];
      const shuffled = [...rawPool].sort(() => Math.random() - 0.5);
      
      let count = exactCount;
      if (!count) {
        if (isMortal) {
          count = 1; // 凡人阶段严格单挑
        } else if (pLevel <= 2) {
          count = Math.random() < 0.75 ? 1 : 2; // 练气初阶 1~2 只
        } else if (pLevel <= 4) {
          count = Math.floor(Math.random() * 2) + 2; // 练气中阶 2~3 只
        } else {
          count = Math.floor(Math.random() * 3) + 3; // 练气高阶 3~5 只
        }
      }

      for (let i = 0; i < count; i++) {
        const template = shuffled[i % shuffled.length];
        const m = JSON.parse(JSON.stringify(template));
        m.index = i + 1;
        m.total = count;

        // 动态新手期与战力适配 (Player-Centric Adaptive Scaling)
        if (isMortal) {
          // 凡人阶段试剑幼兽：30气血、3攻击、0防御，新手手持柴刀/兵刃 2刀轻松斩灭
          m.hp = 30;
          m.maxHp = 30;
          m.atk = 3;
          m.def = 0;
          m.name = `山间幼兽·${m.name}`;
          m.title = `试剑幼兽·${m.name}`;
        } else if (pLevel <= 2) {
          // 练气初阶 (Lv 1 ~ 2): 怪物属性动态降调，确保新手胜率 98% ~ 100%
          m.hp = Math.max(25, Math.round(m.hp * 0.55));
          m.maxHp = m.hp;
          m.atk = Math.max(3, Math.round(m.atk * 0.60));
          m.def = Math.max(0, Math.round(m.def * 0.50));
        } else if (pLevel <= 4) {
          // 练气中阶 (Lv 3 ~ 4): 怪物属性平缓递增，胜率 90% ~ 95%
          m.hp = Math.max(35, Math.round(m.hp * 0.75));
          m.maxHp = m.hp;
          m.atk = Math.max(4, Math.round(m.atk * 0.80));
          m.def = Math.max(1, Math.round(m.def * 0.70));
        }

        // 全局连败动态降难补偿 (DDA: Dynamic Difficulty Adjustment)
        if (defeatStreak >= 1) {
          const weakFactor = Math.max(0.5, 1 - defeatStreak * 0.15);
          m.hp = Math.max(15, Math.round(m.hp * weakFactor));
          m.maxHp = m.hp;
          m.atk = Math.max(2, Math.round(m.atk * weakFactor));
          m.isWeakened = true;
        }

        monsters.push(m);
      }
    }

    // 汇总掉落包 (按倍率放大奖励，传入玩家上下文定向补齐短板)
    const aggregatedRewards = this._aggregateRewards(monsters, tier, potLevel, betMultiplier, targetPlayer);

    // Boss 战同步将其内部 rewards 设为倍率放大后的对象
    if (tier === 'boss' && monsters[0]) {
      monsters[0].rewards = aggregatedRewards;
    }

    return {
      tier,
      scatterCount,
      potLevel,
      monsters,
      totalCount: monsters.length,
      betMultiplier,
      rewards: aggregatedRewards
    };
  },

  // 首杀追踪记录 (首杀必爆短板装备，非首杀 0% 掉整装，彻底断绝刷怪爆仓)
  firstKills: {
    normal: false,
    elite: false,
    boss: false
  },

  /**
   * 智能短板槽位探测器：优先补齐未穿戴空槽位，其次补齐战力最低部位
   */
  _findShortestSlot(player) {
    const allSlots = ['weapon', 'armor', 'ring', 'hat', 'boots', 'belt'];
    if (!player || !player.equipment) {
      return allSlots[Math.floor(Math.random() * allSlots.length)];
    }
    // 1. 优先寻找未穿戴空槽位
    for (let slot of allSlots) {
      if (!player.equipment[slot]) return slot;
    }
    // 2. 寻找战力最低的部位
    let weakestSlot = allSlots[0];
    let minPower = 999999;
    for (let slot of allSlots) {
      const eq = player.equipment[slot];
      const p = eq ? (eq.power || 0) : 0;
      if (p < minPower) {
        minPower = p;
        weakestSlot = slot;
      }
    }
    return weakestSlot;
  },

  /**
   * 守关妖王毕业神装智能补齐：优先检测 6 槽中尚未达到 targetQuality (Q4 紫品) 的缺失部位
   * 确保击败妖王时必定掉落缺失部位，当场达成 6 槽 Q4 大圆满并顺理成章颁发下一门派门票！
   */
  _findMissingGraduationSlot(player, targetQuality = 'Q4') {
    const allSlots = ['weapon', 'armor', 'ring', 'hat', 'boots', 'belt'];
    const qualityRanks = { Q1: 1, Q2: 2, Q3: 3, Q4: 4, Q5: 5, Q6: 6, Q7: 7 };
    const targetRank = qualityRanks[targetQuality] || 4;

    if (!player || !player.equipment) {
      return allSlots[Math.floor(Math.random() * allSlots.length)];
    }

    const missing = [];
    for (const slot of allSlots) {
      const eq = player.equipment[slot];
      if (!eq) {
        missing.push({ slot, rank: 0, power: 0 });
      } else {
        const rk = qualityRanks[eq.qualityCode] || 1;
        if (rk < targetRank) {
          missing.push({ slot, rank: rk, power: eq.power || 0 });
        }
      }
    }

    if (missing.length > 0) {
      // 优先补齐 rank 最低或战力最低的未达标槽位
      missing.sort((a, b) => (a.rank - b.rank) || (a.power - b.power));
      return missing[0].slot;
    }

    // 若全部 6 槽均已达标 (甚至已有更高阶装备)，寻找当前相对战力最低的槽位
    return this._findShortestSlot(player);
  },

  _aggregateRewards(monsters, tier, potLevel, betMultiplier = 1, player = null) {
    let totalExp = 0;
    let totalEnergy = 0;
    const items = [];

    if (tier === 'boss') {
      const boss = monsters[0];
      const baseRewards = boss ? (boss.rewards || {}) : {};
      const multiplied = {
        exp: Math.round((baseRewards.exp || 0) * betMultiplier),
        energy: Math.round((baseRewards.energy || 0) * betMultiplier)
      };

      // 智能补齐毕业神装：绝不掉落固定重复部件，必定定向补齐玩家尚未达成的 Q4 部位
      const targetQuality = (potLevel >= 4) ? 'Q5' : 'Q4';
      const targetPart = this._findMissingGraduationSlot(player, targetQuality);
      multiplied.rewardEquip = {
        part: targetPart,
        qualityCode: targetQuality
      };

      if (baseRewards.rewardPill) {
        multiplied.rewardPill = {
          subType: baseRewards.rewardPill.subType || 'exp',
          amount: Math.round((baseRewards.rewardPill.amount || 1) * betMultiplier)
        };
      }
      if (baseRewards.rewardRune) {
        multiplied.rewardRune = {
          symbolId: baseRewards.rewardRune.symbolId,
          amount: Math.round((baseRewards.rewardRune.amount || 1) * betMultiplier)
        };
      }
      if (baseRewards.artifactItem) {
        multiplied.artifactItem = JSON.parse(JSON.stringify(baseRewards.artifactItem));
      }
      return multiplied;
    }

    monsters.forEach(m => {
      totalExp += m.dropExp || 0;
      totalEnergy += m.dropEnergy || 0;
    });

    totalExp = Math.round(totalExp * betMultiplier);
    totalEnergy = Math.round(totalEnergy * betMultiplier);

    // 丹药概率奖励 (随倍率放大)
    const basePillAmount = tier === 'elite' ? Math.floor(Math.random() * 2) + 2 : 1;
    const pillAmount = Math.round(basePillAmount * betMultiplier);
    const rewardPill = { subType: 'hp', amount: pillAmount };

    // 装备掉落规则：首杀必爆短板槽位装备；非首杀100%严禁掉落整装 (彻底防止爆仓死锁)
    let rewardEquip = null;
    const isFirst = !this.firstKills[tier];
    if (isFirst) {
      const targetPart = this._findShortestSlot(player);
      if (tier === 'elite') {
        const quality = (betMultiplier >= 4) ? 'Q3' : (potLevel >= 2 ? 'Q3' : 'Q2');
        rewardEquip = { part: targetPart, qualityCode: quality };
      } else if (tier === 'normal') {
        const quality = (betMultiplier >= 4) ? 'Q2' : 'Q1';
        rewardEquip = { part: targetPart, qualityCode: quality };
      }
      this.firstKills[tier] = true;
    } else {
      rewardEquip = null; // 非首杀 0% 掉落整装，只给丰厚经验与机缘！
    }

    return {
      exp: totalExp,
      energy: totalEnergy,
      rewardEquip,
      rewardPill
    };
  },

  /**
   * 根据 ID 检索妖怪原型模板
   */
  getMonsterTemplateById(id) {
    const pools = [
      ...(this.MONSTERS.normal[1] || []),
      ...(this.MONSTERS.normal[2] || []),
      ...(this.MONSTERS.normal[3] || []),
      ...(this.MONSTERS.elite[1] || []),
      ...(this.MONSTERS.elite[2] || []),
      ...(this.MONSTERS.elite[3] || [])
    ];
    const found = pools.find(m => m.id === id);
    if (found) return JSON.parse(JSON.stringify(found));
    // 兜底返回首个普通怪
    return JSON.parse(JSON.stringify(this.MONSTERS.normal[1][0]));
  },

  /**
   * 五大门派与灵界仙域 12 关递增试炼妖怪排布表 (每门派 12 场普通/精英战，第 13 战为终极守关妖王)
   */
  SECT_TRIAL_ROSTERS: {
    wanjian: [
      { stage: 1, title: '荒村鸡犬', tier: 'normal', monsterIds: ['yao_rooster', 'yao_rooster', 'yao_dog'], baseReq: 95 },
      { stage: 2, title: '竹林碧影', tier: 'normal', monsterIds: ['yao_snake', 'yao_snake', 'yao_rabbit'], baseReq: 140 },
      { stage: 3, title: '恶犬头目', tier: 'elite', monsterIds: ['elite_leopard_1', 'yao_dog'], baseReq: 195, milestone: 'Q2' },
      { stage: 4, title: '蛇窟毒雾', tier: 'normal', monsterIds: ['yao_snake', 'yao_snake', 'yao_snake', 'norm_toad_1'], baseReq: 260 },
      { stage: 5, title: '野径双凶', tier: 'normal', monsterIds: ['yao_rooster', 'yao_rooster', 'norm_boar_1'], baseReq: 340 },
      { stage: 6, title: '巡山雷豹', tier: 'elite', monsterIds: ['elite_leopard_1', 'norm_fox_1', 'norm_fox_1'], baseReq: 430, milestone: 'Q2' },
      { stage: 7, title: '暗夜妖阵', tier: 'normal', monsterIds: ['yao_dog', 'yao_dog', 'norm_bat_1', 'yao_rabbit'], baseReq: 535 },
      { stage: 8, title: '暴走獠阵', tier: 'normal', monsterIds: ['norm_boar_1', 'norm_boar_1', 'yao_rabbit', 'yao_dog'], baseReq: 655 },
      { stage: 9, title: '金角凶煞', tier: 'elite', monsterIds: ['elite_rhino_1', 'norm_boar_1'], baseReq: 790, milestone: 'Q3' },
      { stage: 10, title: '灵狐毒阵', tier: 'normal', monsterIds: ['norm_fox_1', 'norm_fox_1', 'yao_snake', 'yao_rooster'], baseReq: 940 },
      { stage: 11, title: '群魔夜伏', tier: 'normal', monsterIds: ['yao_dog', 'yao_dog', 'norm_boar_1', 'norm_bat_1'], baseReq: 1100 },
      { stage: 12, title: '护山双圣', tier: 'elite', monsterIds: ['elite_leopard_1', 'elite_rhino_1'], baseReq: 1280, milestone: 'Q3' }
    ],
    taiyi: [
      { stage: 1, title: '药园贼影', tier: 'normal', monsterIds: ['yao_rat', 'yao_rat', 'yao_rooster'], baseReq: 95 },
      { stage: 2, title: '草庐毒影', tier: 'normal', monsterIds: ['yao_snake', 'norm_toad_1', 'yao_rat'], baseReq: 140 },
      { stage: 3, title: '盗丹硕鼠首领', tier: 'elite', monsterIds: ['elite_leopard_1', 'yao_rat', 'yao_rat'], baseReq: 195, milestone: 'Q2' },
      { stage: 4, title: '火蝎毒刺', tier: 'normal', monsterIds: ['norm_scorpion_2', 'norm_scorpion_2', 'yao_snake'], baseReq: 260 },
      { stage: 5, title: '丹毒鬼蛛', tier: 'normal', monsterIds: ['norm_spider_1', 'norm_spider_1', 'yao_rat'], baseReq: 340 },
      { stage: 6, title: '幽冥骨蛇', tier: 'elite', monsterIds: ['elite_snake_2', 'norm_toad_1'], baseReq: 430, milestone: 'Q3' },
      { stage: 7, title: '赤霞群蝎', tier: 'normal', monsterIds: ['norm_scorpion_2', 'norm_scorpion_2', 'norm_bat_1', 'yao_rat'], baseReq: 535 },
      { stage: 8, title: '毒火连天', tier: 'normal', monsterIds: ['yao_rooster', 'norm_scorpion_2', 'yao_snake', 'norm_spider_1'], baseReq: 655 },
      { stage: 9, title: '赤焰骨煞', tier: 'elite', monsterIds: ['elite_snake_2', 'norm_scorpion_2'], baseReq: 790, milestone: 'Q3' },
      { stage: 10, title: '药山百蛊', tier: 'normal', monsterIds: ['norm_spider_1', 'norm_spider_1', 'norm_toad_1', 'yao_rat'], baseReq: 940 },
      { stage: 11, title: '火穴毒蛟卫', tier: 'normal', monsterIds: ['norm_scorpion_2', 'yao_snake', 'yao_snake', 'norm_bat_1'], baseReq: 1100 },
      { stage: 12, title: '丹顶双卫', tier: 'elite', monsterIds: ['elite_snake_2', 'elite_leopard_1'], baseReq: 1280, milestone: 'Q4' }
    ],
    yushou: [
      { stage: 1, title: '谷口蛮牛', tier: 'normal', monsterIds: ['yao_bull', 'yao_bull', 'yao_dog'], baseReq: 95 },
      { stage: 2, title: '深林狂狼', tier: 'normal', monsterIds: ['norm_wolf_2', 'norm_wolf_2', 'yao_dog'], baseReq: 140 },
      { stage: 3, title: '斑斓虎妖', tier: 'elite', monsterIds: ['elite_rhino_1', 'yao_tiger'], baseReq: 195, milestone: 'Q2' },
      { stage: 4, title: '狂暴山猿', tier: 'normal', monsterIds: ['norm_ape_2', 'norm_ape_2', 'norm_wolf_2'], baseReq: 260 },
      { stage: 5, title: '裂山黑熊', tier: 'normal', monsterIds: ['yao_bear', 'yao_bull', 'yao_bull'], baseReq: 340 },
      { stage: 6, title: '紫晶翼狮', tier: 'elite', monsterIds: ['elite_lion_2', 'norm_wolf_2'], baseReq: 430, milestone: 'Q3' },
      { stage: 7, title: '百兽群奔', tier: 'normal', monsterIds: ['yao_tiger', 'norm_wolf_2', 'norm_ape_2', 'yao_bull'], baseReq: 535 },
      { stage: 8, title: '黑熊暴猿', tier: 'normal', monsterIds: ['yao_bear', 'norm_ape_2', 'norm_ape_2', 'yao_bull'], baseReq: 655 },
      { stage: 9, title: '金角巨犀卫', tier: 'elite', monsterIds: ['elite_rhino_1', 'yao_bear'], baseReq: 790, milestone: 'Q3' },
      { stage: 10, title: '幽谷狂阵', tier: 'normal', monsterIds: ['norm_wolf_2', 'norm_wolf_2', 'yao_tiger', 'yao_bear'], baseReq: 940 },
      { stage: 11, title: '万兽咆哮', tier: 'normal', monsterIds: ['yao_bear', 'yao_tiger', 'norm_ape_2', 'yao_bull'], baseReq: 1100 },
      { stage: 12, title: '兽皇双护法', tier: 'elite', monsterIds: ['elite_lion_2', 'elite_rhino_1'], baseReq: 1280, milestone: 'Q4' }
    ],
    tianji: [
      { stage: 1, title: '寒潭铁龟', tier: 'normal', monsterIds: ['yao_turtle', 'yao_turtle', 'yao_rabbit'], baseReq: 95 },
      { stage: 2, title: '星渊巨蟹', tier: 'normal', monsterIds: ['yao_crab', 'yao_crab', 'norm_toad_1'], baseReq: 140 },
      { stage: 3, title: '玄甲蟹将', tier: 'elite', monsterIds: ['elite_hawk_2', 'yao_crab'], baseReq: 195, milestone: 'Q2' },
      { stage: 4, title: '潭底蛛阵', tier: 'normal', monsterIds: ['norm_spider_1', 'norm_spider_1', 'yao_turtle'], baseReq: 260 },
      { stage: 5, title: '飞鼠潜行', tier: 'normal', monsterIds: ['yao_rat', 'yao_rat', 'yao_rabbit', 'norm_bat_1'], baseReq: 340 },
      { stage: 6, title: '九天雷鹏', tier: 'elite', monsterIds: ['elite_hawk_2', 'norm_bat_1'], baseReq: 430, milestone: 'Q3' },
      { stage: 7, title: '水火双渊', tier: 'normal', monsterIds: ['yao_turtle', 'yao_crab', 'norm_spider_1', 'norm_bat_1'], baseReq: 535 },
      { stage: 8, title: '铁甲破阵', tier: 'normal', monsterIds: ['yao_crab', 'yao_crab', 'yao_turtle', 'yao_rat'], baseReq: 655 },
      { stage: 9, title: '雷鹏骨龙', tier: 'elite', monsterIds: ['elite_hawk_2', 'elite_snake_2'], baseReq: 790, milestone: 'Q4' },
      { stage: 10, title: '星罗诡局', tier: 'normal', monsterIds: ['norm_spider_1', 'yao_turtle', 'yao_crab', 'yao_rabbit'], baseReq: 940 },
      { stage: 11, title: '机巧玄卫', tier: 'normal', monsterIds: ['yao_crab', 'yao_crab', 'yao_turtle', 'norm_bat_1'], baseReq: 1100 },
      { stage: 12, title: '神尊双傀儡', tier: 'elite', monsterIds: ['elite_hawk_2', 'elite_snake_2'], baseReq: 1280, milestone: 'Q5' }
    ],
    fen_tian: [
      { stage: 1, title: '冥炎黑熊', tier: 'normal', monsterIds: ['yao_bear', 'yao_bull', 'norm_scorpion_2'], baseReq: 95 },
      { stage: 2, title: '魔焰狂狼', tier: 'normal', monsterIds: ['norm_wolf_2', 'norm_wolf_2', 'yao_tiger'], baseReq: 140 },
      { stage: 3, title: '紫晶翼狮卫', tier: 'elite', monsterIds: ['elite_lion_2', 'norm_wolf_2'], baseReq: 195, milestone: 'Q3' },
      { stage: 4, title: '焚天暴猿', tier: 'normal', monsterIds: ['norm_ape_2', 'norm_ape_2', 'yao_bear'], baseReq: 260 },
      { stage: 5, title: '幽冥铁蟹', tier: 'normal', monsterIds: ['yao_crab', 'yao_crab', 'norm_scorpion_2'], baseReq: 340 },
      { stage: 6, title: '白骨魔蛇', tier: 'elite', monsterIds: ['elite_snake_2', 'norm_scorpion_2'], baseReq: 430, milestone: 'Q4' },
      { stage: 7, title: '万魔炼狱', tier: 'normal', monsterIds: ['yao_tiger', 'yao_bear', 'norm_ape_2', 'yao_bull'], baseReq: 535 },
      { stage: 8, title: '冥火巨蟹阵', tier: 'normal', monsterIds: ['yao_crab', 'yao_crab', 'norm_scorpion_2', 'yao_bear'], baseReq: 655 },
      { stage: 9, title: '九天雷劫魔鹏', tier: 'elite', monsterIds: ['elite_hawk_2', 'elite_lion_2'], baseReq: 790, milestone: 'Q4' },
      { stage: 10, title: '修罗百兽', tier: 'normal', monsterIds: ['yao_bear', 'yao_tiger', 'norm_wolf_2', 'norm_ape_2'], baseReq: 940 },
      { stage: 11, title: '冥狱先锋', tier: 'normal', monsterIds: ['norm_scorpion_2', 'yao_crab', 'yao_bear', 'yao_bull'], baseReq: 1100 },
      { stage: 12, title: '魔尊双煞护法', tier: 'elite', monsterIds: ['elite_lion_2', 'elite_snake_2'], baseReq: 1280, milestone: 'Q5' }
    ],
    // 灵界 · 飘渺九霄仙域 通天试炼阶梯 (WorldTier 2)
    spirit_realm: [
      { stage: 1, title: '仙门守关使', tier: 'normal', monsterIds: ['spirit_sparrow_1', 'spirit_sparrow_1', 'spirit_snake_1'], baseReq: 2800 },
      { stage: 2, title: '大荒冥火雀', tier: 'normal', monsterIds: ['spirit_sparrow_1', 'spirit_snake_1', 'spirit_snake_1'], baseReq: 4500 },
      { stage: 3, title: '仙庭巡界天将', tier: 'elite', monsterIds: ['elite_god_guard_3', 'spirit_sparrow_1'], baseReq: 7200, milestone: 'Q6' },
      { stage: 4, title: '极北冰魄渊', tier: 'normal', monsterIds: ['spirit_snake_1', 'spirit_snake_1', 'spirit_rhino_1'], baseReq: 11000 },
      { stage: 5, title: '太古碎岳阵', tier: 'normal', monsterIds: ['spirit_rhino_1', 'spirit_rhino_1', 'spirit_bat_1'], baseReq: 16500 },
      { stage: 6, title: '太阳金乌残躯', tier: 'elite', monsterIds: ['elite_golden_crow_3', 'spirit_rhino_1'], baseReq: 24000, milestone: 'Q6' },
      { stage: 7, title: '虚空裂隙群妖', tier: 'normal', monsterIds: ['spirit_bat_1', 'spirit_bat_1', 'spirit_beast_1'], baseReq: 34000 },
      { stage: 8, title: '星渊噬魂狂潮', tier: 'normal', monsterIds: ['spirit_beast_1', 'spirit_beast_1', 'spirit_bat_1', 'spirit_snake_1'], baseReq: 48000 },
      { stage: 9, title: '域外修罗魔尊', tier: 'elite', monsterIds: ['elite_asura_lord_3', 'spirit_beast_1'], baseReq: 65000, milestone: 'Q7' },
      { stage: 10, title: '天域混沌凶煞', tier: 'normal', monsterIds: ['spirit_beast_1', 'spirit_bat_1', 'spirit_rhino_1', 'spirit_sparrow_1'], baseReq: 85000 },
      { stage: 11, title: '九天绝灭神将', tier: 'normal', monsterIds: ['spirit_bat_1', 'spirit_beast_1', 'spirit_rhino_1', 'spirit_rhino_1'], baseReq: 110000 },
      { stage: 12, title: '仙帝双极护法', tier: 'elite', monsterIds: ['elite_god_guard_3', 'elite_asura_lord_3'], baseReq: 145000, milestone: 'Q7' }
    ]
  },

  /**
   * 获取指定宗门、指定关卡（1~12）的试炼配置
   */
  getSectTrialStageConfig(sectId = 'wanjian', stageIndex = 1, potLevel = 1, samsaraCount = 1) {
    const sId = (sectId && this.SECT_TRIAL_ROSTERS[sectId]) ? sectId : 'wanjian';
    const roster = this.SECT_TRIAL_ROSTERS[sId] || this.SECT_TRIAL_ROSTERS.wanjian;
    const idx = Math.max(1, Math.min(12, Number(stageIndex) || 1));
    const rawDef = roster[idx - 1] || roster[0];

    // 门派与轮回阶梯战力缩放倍率
    const SECT_POWER_MULT = { wanjian: 1.0, wantong: 1.0, taiyi: 2.2, yushou: 4.8, tianji: 10.0, fen_tian: 20.0, spirit_realm: 1.0 };
    const baseMult = (sId === 'spirit_realm' ? 1.0 : (SECT_POWER_MULT[sId] || 1.0)) * Math.pow(1.5, Math.max(0, samsaraCount - 1));
    const reqPower = Math.round(rawDef.baseReq * baseMult);

    // 关卡奖励规划 (反哺抽奖灵机 + 修为丹)
    const rewardMult = sId === 'spirit_realm' ? 16.0 : baseMult;
    const baseEnergy = Math.round((140 + idx * 55) * Math.sqrt(rewardMult));
    const baseExp = Math.round((100 + idx * 60) * Math.sqrt(rewardMult));
    const pillAmount = idx >= 10 ? 3 : (idx >= 6 ? 2 : 1);
    const rewardPill = { subType: (idx % 2 === 0 ? 'exp' : 'hp'), amount: pillAmount };

    let rewardEquip = null;
    if (rawDef.milestone) {
      rewardEquip = {
        qualityCode: rawDef.milestone,
        part: ['weapon', 'armor', 'ring', 'hat', 'boots', 'belt'][(idx - 1) % 6]
      };
    }

    return {
      sectId: sId,
      stage: idx,
      totalStages: 12,
      title: rawDef.title,
      tier: rawDef.tier,
      monsterIds: rawDef.monsterIds,
      reqPower,
      rewards: {
        energy: baseEnergy,
        exp: baseExp,
        rewardPill,
        rewardEquip
      }
    };
  },

  /**
   * 生成主动挑战关卡遭遇对象 (可直接送入 CombatEngine.simulateEncounter)
   */
  createTrialStageEncounter(sectId = 'wanjian', stageIndex = 1, potLevel = 1, samsaraCount = 1, player = null) {
    const stageCfg = this.getSectTrialStageConfig(sectId, stageIndex, potLevel, samsaraCount);
    const monsters = [];
    const ids = stageCfg.monsterIds;
    const mCount = ids.length;

    // 根据关卡目标总战力，合理分配每只小怪的属性
    const targetTotalPower = stageCfg.reqPower;
    const powerPerMonster = targetTotalPower / Math.max(1, mCount);

    for (let i = 0; i < mCount; i++) {
      const tmpl = this.getMonsterTemplateById(ids[i]);
      const m = JSON.parse(JSON.stringify(tmpl));
      m.index = i + 1;
      m.total = mCount;
      m.isTrialMonster = true;
      m.stageIndex = stageCfg.stage;

      // 调整数值使每只小怪战力吻合本关分配
      // Power = hp * 0.2 + atk * 2.0 + def * 1.5
      const scale = Math.max(0.3, powerPerMonster / 35.0);
      m.hp = Math.max(25, Math.round(tmpl.hp * scale * 0.9));
      m.maxHp = m.hp;
      m.atk = Math.max(3, Math.round(tmpl.atk * scale * 0.85));
      m.def = Math.max(1, Math.round(tmpl.def * scale * 0.8));
      m.combatPower = Math.floor(m.hp * 0.2 + m.atk * 2.0 + m.def * 1.5);

      monsters.push(m);
    }

    return {
      tier: stageCfg.tier,
      isTrialEncounter: true,
      stageIndex: stageCfg.stage,
      totalStages: 12,
      stageTitle: stageCfg.title,
      reqPower: stageCfg.reqPower,
      potLevel,
      monsters,
      totalCount: monsters.length,
      betMultiplier: 1,
      rewards: stageCfg.rewards
    };
  }
};
