/**
 * DemonTowerManager.js - 锁妖天关 · 镇妖塔核心系统
 * 负责管理 50 层阶梯爬塔模式、守关大妖配置、推荐战力对照、战斗发起与首通奖励发放
 */
(function() {
  window.SlotsRPG = window.SlotsRPG || {};

  // 50 层镇妖塔守关大妖完整名册与立绘素材池 (涵盖 10 款全新上古神话大妖立绘，彻底淘汰非怪物素材)
  const FLOOR_MONSTER_ROSTER = [
    // 层数 1 ~ 10: 地煞初阶·伏魔渊
    { floor: 1, name: '幽月魔狼', avatar: 'assets/monsters/monster_wolf_vivid.png' },
    { floor: 2, name: '毒甲巨蟹', avatar: 'assets/monsters/monster_crab_vivid.png' },
    { floor: 3, name: '千丝鬼蛛', avatar: 'assets/monsters/monster_spider_vivid.png' },
    { floor: 4, name: '碧眼魔蟾', avatar: 'assets/monsters/monster_toad_vivid.png' },
    { floor: 5, name: '狂暴獠牙猪王', avatar: 'assets/monsters/monster_boar_vivid.png', isMilestone: true },
    { floor: 6, name: '噬灵黑蝠', avatar: 'assets/monsters/monster_bat_vivid.png' },
    { floor: 7, name: '幽绿冥蝎', avatar: 'assets/monsters/monster_scorpion_vivid.png' },
    { floor: 8, name: '影纹黑豹', avatar: 'assets/monsters/monster_leopard_vivid.png' },
    { floor: 9, name: '青鳞毒蟒', avatar: 'assets/monsters/monster_snake_vivid.png' },
    { floor: 10, name: '熔岩赤炼蟒皇', avatar: 'assets/boss/boss_red_python_vivid.png', isBoss: true },

    // 层数 11 ~ 20: 天煞中阶·锁妖关
    { floor: 11, name: '玄羽魔鹰', avatar: 'assets/monsters/monster_hawk_vivid.png' },
    { floor: 12, name: '赤蛮狂牛', avatar: 'assets/monsters/monster_bull_vivid.png' },
    { floor: 13, name: '裂地魔熊', avatar: 'assets/monsters/monster_bear_vivid.png' },
    { floor: 14, name: '九幽天狗', avatar: 'assets/monsters/monster_dog_vivid.png' },
    { floor: 15, name: '撼山巨犀皇', avatar: 'assets/monsters/monster_rhino_vivid.png', isMilestone: true },
    { floor: 16, name: '金鬃狂狮', avatar: 'assets/monsters/monster_lion_vivid.png' },
    { floor: 17, name: '混元暴猿', avatar: 'assets/monsters/monster_ape_vivid.png' },
    { floor: 18, name: '白骨幽蛇妖', avatar: 'assets/monsters/monster_bone_snake_vivid.png' },
    { floor: 19, name: '斑斓煞虎', avatar: 'assets/monsters/monster_tiger_vivid.png' },
    { floor: 20, name: '千年九尾狐皇', avatar: 'assets/monsters/monster_fox_vivid.png', isBoss: true },

    // 层数 21 ~ 30: 太古大妖·上清禁境 (引入新增神兽)
    { floor: 21, name: '玄煞龙龟', avatar: 'assets/monsters/monster_turtle_vivid.png' },
    { floor: 22, name: '金乌火灵鸡', avatar: 'assets/monsters/monster_rooster_vivid.png' },
    { floor: 23, name: '玉煞神兔', avatar: 'assets/monsters/monster_rabbit_vivid.png' },
    { floor: 24, name: '噬灵魔鼠皇', avatar: 'assets/monsters/monster_rat_vivid.png' },
    { floor: 25, name: '金煞貔貅圣兽', avatar: 'assets/monsters/monster_pixiu_vivid.png', isMilestone: true },
    { floor: 26, name: '金晶狻猊神兽', avatar: 'assets/boss/boss_golden_chimera_vivid.png' },
    { floor: 27, name: '通天白泽神尊', avatar: 'assets/monsters/monster_baize_vivid.png' },
    { floor: 28, name: '墨玉麒麟圣尊', avatar: 'assets/monsters/monster_qilin_vivid.png' },
    { floor: 29, name: '覆海应龙天君', avatar: 'assets/monsters/monster_yinglong_vivid.png' },
    { floor: 30, name: '九幽冥凤妖尊', avatar: 'assets/monsters/monster_fenghuang_vivid.png', isBoss: true },

    // 层数 31 ~ 40: 混沌凶魔·万妖法域 (引入上古凶兽与机关妖皇)
    { floor: 31, name: '造化天机机关皇', avatar: 'assets/boss/boss_tianji_puppet_vivid.png' },
    { floor: 32, name: '通天魔猿战尊', avatar: 'assets/monsters/monster_ape_vivid.png' },
    { floor: 33, name: '万毒幽冥蟾皇', avatar: 'assets/monsters/monster_toad_vivid.png' },
    { floor: 34, name: '炎狱金睛狮皇', avatar: 'assets/monsters/monster_lion_vivid.png' },
    { floor: 35, name: '九头相柳妖神', avatar: 'assets/monsters/monster_xiangliu_vivid.png', isMilestone: true },
    { floor: 36, name: '绝煞穷奇魔皇', avatar: 'assets/monsters/monster_qiongqi_vivid.png' },
    { floor: 37, name: '上古饕餮邪尊', avatar: 'assets/monsters/monster_taotie_vivid.png' },
    { floor: 38, name: '万劫骨龙皇', avatar: 'assets/monsters/monster_bone_snake_vivid.png' },
    { floor: 39, name: '混沌天魔真灵', avatar: 'assets/monsters/monster_hundun_vivid.png' },
    { floor: 40, name: '紫霄劫雷神龙', avatar: 'assets/boss/boss_thunder_dragon_vivid.png', isBoss: true },

    // 层数 41 ~ 50: 洪荒天关·神魔绝巅
    { floor: 41, name: '墨玉麒麟皇·绝煞化身', avatar: 'assets/monsters/monster_qilin_vivid.png' },
    { floor: 42, name: '金煞貔貅·破军神将', avatar: 'assets/monsters/monster_pixiu_vivid.png' },
    { floor: 43, name: '九幽冥凤·涅槃魔神', avatar: 'assets/monsters/monster_fenghuang_vivid.png' },
    { floor: 44, name: '覆海应龙·翻江妖圣', avatar: 'assets/monsters/monster_yinglong_vivid.png' },
    { floor: 45, name: '深渊鲲鹏巨妖', avatar: 'assets/monsters/monster_kunpeng_vivid.png', isMilestone: true },
    { floor: 46, name: '九头相柳·荒古祖灵', avatar: 'assets/monsters/monster_xiangliu_vivid.png' },
    { floor: 47, name: '上古饕餮·吞天煞神', avatar: 'assets/monsters/monster_taotie_vivid.png' },
    { floor: 48, name: '绝煞穷奇·灭世凶神', avatar: 'assets/monsters/monster_qiongqi_vivid.png' },
    { floor: 49, name: '混沌天魔·万古始祖', avatar: 'assets/monsters/monster_hundun_vivid.png' },
    { floor: 50, name: '九天混沌噬魂古兽·混元真身', avatar: 'assets/monsters/monster_kunpeng_vivid.png', isBoss: true }
  ];

  class DemonTowerManager {
    constructor(gameManager) {
      this.gameManager = gameManager;
      this.currentFloor = 1; // 当前挑战层数 (1 ~ 50)
      this.maxFloor = 50;
      this.clearedFloors = new Set();
    }

    /**
     * 获取指定层数的关卡配置
     * @param {number} floor 
     */
    getFloorConfig(floor) {
      const f = Math.min(this.maxFloor, Math.max(1, floor || this.currentFloor));
      const entry = FLOOR_MONSTER_ROSTER[f - 1] || FLOOR_MONSTER_ROSTER[0];
      const isMilestone = (f % 5 === 0) || !!entry.isMilestone;
      const isBoss = (f % 10 === 0) || f === 50 || !!entry.isBoss;

      // 推荐战力平滑递增：1层 300，5层 1100，10层 2400，20层 5500，50层 16000
      const reqPower = Math.floor(180 + f * 120 + Math.pow(f, 1.45) * 22);

      // 妖王属性根据层数自适应增长
      const hp = Math.floor(450 + f * 260 + (isBoss ? f * 400 : 0));
      const atk = Math.floor(25 + f * 14 + (isBoss ? 20 : 0));
      const def = Math.floor(8 + f * 6 + (isBoss ? 10 : 0));

      const bossName = entry.name;
      const avatar = entry.avatar;

      // 奖励计算：层数越高，机缘与丹药越丰厚
      const energyReward = 120 + f * 85 + (isBoss ? 800 : 0);
      const pillReward = 2 + Math.floor(f / 4) + (isBoss ? 3 : 0);

      // 特定层数赠送专属修仙称号
      let titleRewardId = null;
      let titleName = null;
      if (f === 5) { titleRewardId = 'title_tower_5'; titleName = '【伏魔先锋】'; }
      else if (f === 10) { titleRewardId = 'title_tower_10'; titleName = '【镇妖真传】'; }
      else if (f === 20) { titleRewardId = 'title_tower_20'; titleName = '【荡魔剑仙】'; }
      else if (f === 30) { titleRewardId = 'title_tower_30'; titleName = '【截天道尊】'; }
      else if (f === 40) { titleRewardId = 'title_tower_40'; titleName = '【万劫诛邪神君】'; }
      else if (f === 50) { titleRewardId = 'title_tower_50'; titleName = '【九天锁妖至尊】'; }

      return {
        floor: f,
        name: `第 ${f} 层 · ${bossName}`,
        bossName: bossName,
        isBoss: isBoss,
        isMilestone: isMilestone,
        reqPower: reqPower,
        avatar: avatar,
        hp: hp,
        atk: atk,
        def: def,
        rewards: {
          energy: energyReward,
          pills: pillReward,
          titleId: titleRewardId,
          titleName: titleName
        }
      };
    }

    /**
     * 发起当前层数的镇妖塔挑战对决
     */
    startChallenge() {
      const gm = this.gameManager;
      if (!gm) return { success: false, reason: '游戏管理器未初始化' };

      const cfg = this.getFloorConfig(this.currentFloor);
      const playerPower = (gm.player && gm.player.combatPower) || 0;

      // 构造战斗遭遇数据结构 (对接已有的 playBattleSequence)
      const monsterUnit = {
        id: `tower_boss_${cfg.floor}`,
        name: cfg.bossName,
        maxHp: cfg.hp,
        hp: cfg.hp,
        atk: cfg.atk,
        def: cfg.def,
        tier: cfg.isBoss ? 'boss' : (cfg.isMilestone ? 'elite' : 'normal'),
        tierName: cfg.isBoss ? '镇塔妖尊' : '守关大妖',
        avatar: cfg.avatar
      };

      const encounter = {
        tier: monsterUnit.tier,
        monsters: [monsterUnit]
      };

      // 挂载镇妖塔专属上下文标志
      const battleResult = {
        encounter: encounter,
        boss: monsterUnit,
        isTowerBattle: true,
        towerFloor: cfg.floor,
        towerConfig: cfg,
        itemsUsed: [],
        timeline: []
      };

      // 利用既有 BattleEngine 预先运算回合脚本
      if (window.SlotsRPG && window.SlotsRPG.CombatEngine) {
        const sim = window.SlotsRPG.CombatEngine.simulateEncounter(gm.player, encounter, gm.inventory);
        battleResult.isVictory = sim.isVictory;
        battleResult.timeline = sim.timeline || [];
        battleResult.session = sim.session || null;
      } else {
        battleResult.isVictory = playerPower >= cfg.reqPower * 0.85;
      }

      return battleResult;
    }

    /**
     * 镇妖塔战斗胜利结算
     * @param {number} floor 
     */
    onVictory(floor) {
      const cfg = this.getFloorConfig(floor);
      const gm = this.gameManager;
      if (!gm) return;

      const isFirstClear = !this.clearedFloors.has(floor);
      this.clearedFloors.add(floor);

      if (isFirstClear) {
        // 1. 发放机缘奖励
        if (cfg.rewards.energy > 0) {
          gm.energy += cfg.rewards.energy;
        }

        // 2. 发放纯阳金丹
        if (cfg.rewards.pills > 0 && gm.inventory) {
          const pill = window.SlotsRPG.ItemModel.createPill('exp', cfg.rewards.pills);
          gm.inventory.addItem(pill);
        }

        // 3. 发放与解锁专属尊号
        if (cfg.rewards.titleId && gm.titleManager) {
          gm.titleManager.unlockTitle(cfg.rewards.titleId);
        }

        // 4. 晋阶至下一层
        if (this.currentFloor <= floor) {
          this.currentFloor = Math.min(this.maxFloor, floor + 1);
        }

        // 5. 飘字与系统传闻
        if (gm.renderer && gm.renderer.addFloatingText) {
          gm.renderer.addFloatingText(`🏆 锁妖天关第 ${floor} 层平定！首通大捷！`, '#ffd700');
          gm.renderer.addFloatingText(`✨ 获赐机缘 +${cfg.rewards.energy} · 纯阳丹 x${cfg.rewards.pills}`, '#38ef7d');
        }

        window.SlotsRPG && window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('DEMON_TOWER_FLOOR_CLEARED', {
          floor: floor,
          nextFloor: this.currentFloor,
          rewards: cfg.rewards
        });

        if (window.SlotsRPG.StorageService) {
          window.SlotsRPG.StorageService.saveGame(gm, true);
        }
      }
    }
  }

  window.SlotsRPG.DemonTowerManager = DemonTowerManager;
})();
