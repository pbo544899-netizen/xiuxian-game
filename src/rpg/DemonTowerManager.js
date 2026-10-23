/**
 * DemonTowerManager.js - 锁妖天关 · 镇妖塔核心系统
 * 负责管理 50 层阶梯爬塔模式、守关大妖配置、推荐战力对照、战斗发起与首通奖励发放
 */
(function() {
  window.SlotsRPG = window.SlotsRPG || {};

  // 守关大妖名号库与立绘素材池
  const BOSS_AVATARS = [
    'assets/boss/boss_red_python_vivid.png',
    'assets/boss/boss_black_boar.png',
    'assets/symbols/SYM_12.png',
    'assets/symbols/SYM_13.png'
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
      const isMilestone = (f % 5 === 0);
      const isBoss = (f % 10 === 0) || f === 50;

      // 推荐战力平滑递增：1层 300，5层 1100，10层 2400，20层 5500，50层 16000
      const reqPower = Math.floor(180 + f * 120 + Math.pow(f, 1.45) * 22);

      // 妖王属性根据层数自适应增长
      const hp = Math.floor(450 + f * 260 + (isBoss ? f * 400 : 0));
      const atk = Math.floor(25 + f * 14 + (isBoss ? 20 : 0));
      const def = Math.floor(8 + f * 6 + (isBoss ? 10 : 0));

      let bossName = '';
      if (f === 5) bossName = '狂暴獠牙猪王';
      else if (f === 10) bossName = '熔岩赤炼蟒皇';
      else if (f === 20) bossName = '千年九尾狐仙';
      else if (f === 30) bossName = '幽冥修罗妖尊';
      else if (f === 50) bossName = '九天混沌噬魂古兽';
      else if (isMilestone) bossName = `第${f}层·镇塔守关大妖`;
      else bossName = `第${f}层·迷雾护法妖卒`;

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
      else if (f === 50) { titleRewardId = 'title_tower_50'; titleName = '【九天锁妖至尊】'; }

      const avatar = BOSS_AVATARS[f % BOSS_AVATARS.length] || 'assets/boss/boss_red_python_vivid.png';

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
