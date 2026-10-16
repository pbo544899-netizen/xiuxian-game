/**
 * CombatEngine.js - 伏妖自动/交互回合制战斗引擎
 * 负责角色与三阶妖兽 (普通群怪/精英/关卡Boss) 的回合推演、技能特效触发与时序流生成
 * 严格遵照 PRD 5.3 节与最新规范：回合制游戏中，使用道具 (气血丹/破魔符) 计为一个完整行动回合
 */
window.SlotsRPG = window.SlotsRPG || {};

class CombatSession {
  /**
   * 构造一场实时可控的战斗会话
   * @param {Object} player - PlayerModel 实例
   * @param {Object} encounter - MonsterConfig.createEncounter 返回的对象
   * @param {InventoryManager} inventory - 乾坤袋背包管理器
   * @param {Object} options - 战斗选项 (如 withRevive)
   */
  constructor(player, encounter, inventory, options = {}) {
    this.player = player;
    this.encounter = encounter;
    this.inventory = inventory;
    this.options = options;

    const playerStats = player.getTotalStats();
    this.playerMaxHp = playerStats.hp;
    this.playerHp = this.playerMaxHp;
    this.playerAtk = playerStats.atk;
    this.playerDef = playerStats.def;
    this.playerCritRate = player.critRate || 0.08;

    this.pipeline = (window.SlotsRPG && window.SlotsRPG.SkillPipeline) || (typeof global !== 'undefined' && global.SlotsRPG && global.SlotsRPG.SkillPipeline);
    this.battleState = {
      playerHp: this.playerHp,
      playerMaxHp: this.playerMaxHp,
      playerAtk: this.playerAtk,
      playerDef: this.playerDef,
      playerCritRate: this.playerCritRate
    };

    this.timeline = [];
    this.itemsUsed = [];
    this.monsters = encounter.monsters || [];
    this.monsters.forEach((m, idx) => {
      m.currentHp = m.hp;
      m.maxHp = m.hp;
      m.index = idx;
    });

    this.round = 1;
    this.maxRounds = 35;
    this.isOver = false;
    this.isVictory = false;
    this.result = null;

    // --- 战前准备阶段：宗门心法开局广播 ---
    if (this.pipeline) {
      this.pipeline.trigger('ON_BATTLE_START', {
        player: this.player,
        encounter: this.encounter,
        monsters: this.monsters,
        inventory: this.inventory,
        timeline: this.timeline,
        battleState: this.battleState
      });
      this.playerHp = this.battleState.playerHp;
      this.playerMaxHp = this.battleState.playerMaxHp;
      this.playerAtk = this.battleState.playerAtk;
      this.playerDef = this.battleState.playerDef;
      this.playerCritRate = this.battleState.playerCritRate;
    }
  }

  getAliveMonsters() {
    return this.monsters.map((m, idx) => ({ m, idx })).filter(o => o.m.currentHp > 0);
  }

  getTotalMonsterHp() {
    return this.monsters.reduce((sum, m) => sum + Math.max(0, m.currentHp), 0);
  }

  getTotalMonsterMaxHp() {
    return this.monsters.reduce((sum, m) => sum + m.maxHp, 0);
  }

  /**
   * 执行单回合推演 (主角行动 + 敌方全体反击)
   * 遵循规范：主角回合可选择【御剑攻击】、【服用气血丹】或【祭出破魔符】，使用道具占用该回合行动！
   * @param {string} actionType - 'auto' | 'attack' | 'pill' | 'talisman'
   * @param {number|null} targetIndex - 指定攻击/施符的目标怪索引，留空默认首位存活者
   * @returns {Object} { isOver, isVictory, roundEvents }
   */
  executeRound(actionType = 'auto', targetIndex = null) {
    if (this.isOver) {
      return { isOver: true, isVictory: this.isVictory, roundEvents: [] };
    }

    const aliveList = this.getAliveMonsters();
    if (aliveList.length === 0) {
      this._finalize(true);
      return { isOver: true, isVictory: true, roundEvents: [] };
    }
    if (this.playerHp <= 0 || this.round > this.maxRounds) {
      this._finalize(false);
      return { isOver: true, isVictory: false, roundEvents: [] };
    }

    const roundEvents = [];
    const currentRound = this.round;

    // 锁定打击目标 (支持显式目标与 preferredTargetIndex 优先集火)
    const chosenIdx = targetIndex !== null ? targetIndex : this.preferredTargetIndex;
    let targetObj = (chosenIdx !== null && chosenIdx !== undefined)
      ? (aliveList.find(o => o.idx === chosenIdx) || aliveList[0])
      : aliveList[0];
    let targetMonster = targetObj.m;
    let tIdx = targetObj.idx;

    // AI 决策行动类型
    let resolvedAction = actionType;
    if (resolvedAction === 'auto') {
      // 智能 AI：血量 <= 40% 且背包有气血丹时，本回合优先吃药调息护体
      if (this.playerHp <= this.playerMaxHp * 0.40 && this.inventory && this.inventory.getItemAmount('pill', 'hp') > 0) {
        resolvedAction = 'pill';
      } else if (currentRound === 1 && this.inventory && this.inventory.getItemAmount('rune', 'SYM_03') > 0) {
        // 开局第 1 回合如有破魔符，本回合优先祭出神雷抢占先机
        resolvedAction = 'talisman';
      } else {
        resolvedAction = 'attack';
      }
    }

    // ==========================================
    // 阶段 1：主角行动 (御剑攻伐 OR 使用道具占一回合)
    // ==========================================

    // 行动 A: 服用太乙气血丹 (占用当前回合，不进行剑法攻击)
    if (resolvedAction === 'pill') {
      if (this.inventory && this.inventory.consumeItem('pill', 'hp', 1)) {
        const healAmount = Math.floor(this.playerMaxHp * 0.4);
        this.playerHp = Math.min(this.playerMaxHp, this.playerHp + healAmount);
        this.battleState.playerHp = this.playerHp;
        this.itemsUsed.push({ type: 'pill', name: '太乙气血丹', effect: `护脉回春 +${healAmount} 气血` });

        const pillEv = {
          round: currentRound,
          turn: 'player',
          actionType: 'pill',
          type: 'pill_heal',
          skillType: 'lotus_heal',
          itemName: '太乙气血丹',
          heal: healAmount,
          playerHp: this.playerHp,
          playerMaxHp: this.playerMaxHp,
          totalEnemyHp: this.getTotalMonsterHp(),
          totalEnemyMaxHp: this.getTotalMonsterMaxHp(),
          text: `💊 第 ${currentRound} 回合：主角运功调息，吞服【太乙气血丹】！药力化作灵泉甘霖，气血回复 +${healAmount}！`
        };
        roundEvents.push(pillEv);
        this.timeline.push(pillEv);
      } else {
        // 无气血丹降级为普通攻击
        resolvedAction = 'attack';
      }
    }

    // 行动 B: 祭出破魔符 (占用当前回合，降下九天纯阳雷劫，全场 AOE 轰顶所有存活妖兽！)
    if (resolvedAction === 'talisman') {
      if (this.inventory && this.inventory.consumeItem('rune', 'SYM_03', 1)) {
        const isMulti = aliveList.length > 1;
        // 单体目标 35% 最大气血，群体目标每只 30% 最大气血 (保底 35 点)
        const pctRate = isMulti ? 0.30 : 0.35;
        let totalTalismanDmg = 0;
        const struckTargets = [];
        const defeatedInThunder = [];

        // 轰击场上所有存活妖兽！
        for (let i = 0; i < aliveList.length; i++) {
          const living = aliveList[i];
          const m = living.m;
          const idx = living.idx;
          let dmg = Math.max(35, Math.floor(m.maxHp * pctRate));
          // 妖王威压：关卡妖王护体煞气凝实，破魔符对 Boss 伤害上限为 15% 且不超过 750 点
          if (m.tier === 'boss' || (m.id && m.id.startsWith('boss_'))) {
            const bossCap = Math.min(Math.floor(m.maxHp * 0.15), 750);
            dmg = Math.min(dmg, Math.max(150, bossCap));
          }
          m.currentHp = Math.max(0, m.currentHp - dmg);
          totalTalismanDmg += dmg;
          struckTargets.push({
            targetIndex: idx,
            monster: m,
            damage: dmg,
            remainingHp: m.currentHp,
            maxHp: m.maxHp
          });
          if (m.currentHp <= 0) {
            defeatedInThunder.push({ m, idx });
          }
        }

        this.itemsUsed.push({
          type: 'rune',
          name: '破魔符',
          effect: isMulti 
            ? `九天雷劫荡魔，全场群妖共受创 -${totalTalismanDmg} 气血`
            : `天雷重创 -${totalTalismanDmg} 气血`
        });

        const talEv = {
          round: currentRound,
          turn: 'player',
          actionType: 'talisman',
          type: 'talisman_strike',
          skillType: 'talisman_thunder',
          itemName: '破魔符',
          damage: totalTalismanDmg,
          isAOE: isMulti,
          targetCount: struckTargets.length,
          targets: struckTargets,
          targetIndex: tIdx, // 兼容单体引用
          targetMonster: targetMonster,
          monsterHp: targetMonster.currentHp,
          monsterMaxHp: targetMonster.maxHp,
          totalEnemyHp: this.getTotalMonsterHp(),
          totalEnemyMaxHp: this.getTotalMonsterMaxHp(),
          playerHp: this.playerHp,
          playerMaxHp: this.playerMaxHp,
          text: isMulti
            ? `⚡ 第 ${currentRound} 回合：主角掐诀疾掷【破魔真符】！朱砂破煞，九天纯阳雷劫倾泻全场！群妖共受雷轰，总计重创 -${totalTalismanDmg}！`
            : `⚡ 第 ${currentRound} 回合：主角掐诀疾掷【破魔真符】！朱砂破煞，九天纯阳神雷轰顶！【${targetMonster.name}】受创 -${totalTalismanDmg}！`
        };
        roundEvents.push(talEv);
        this.timeline.push(talEv);

        // 判定受雷击阵亡的妖兽
        for (let i = 0; i < defeatedInThunder.length; i++) {
          const defObj = defeatedInThunder[i];
          const defeatEv = {
            round: currentRound,
            type: 'monster_defeated',
            monsterIndex: defObj.idx,
            monster: defObj.m,
            remainingCount: this.getAliveMonsters().length,
            totalEnemyHp: this.getTotalMonsterHp(),
            totalEnemyMaxHp: this.getTotalMonsterMaxHp(),
            text: `💥 天雷荡魔！【${defObj.m.name}】在神雷轰鸣中化为齑粉！`
          };
          roundEvents.push(defeatEv);
          this.timeline.push(defeatEv);

          if (this.pipeline) {
            this.pipeline.trigger('ON_ENEMY_KILLED', {
              player: this.player,
              killedMonster: defObj.m,
              round: currentRound,
              battleState: this.battleState,
              timeline: this.timeline
            });
            this.playerAtk = this.battleState.playerAtk;
          }
        }
      } else {
        // 无符箓降级为普通攻击
        resolvedAction = 'attack';
      }
    }

    // 行动 C: 普通御剑斩击
    if (resolvedAction === 'attack') {
      const attackCtx = {
        player: this.player,
        targetMonster,
        targetIndex: tIdx,
        round: currentRound,
        battleState: this.battleState,
        timeline: this.timeline,
        dmgMultiplier: 1.0,
        bonusTrueDmg: 0
      };
      if (this.pipeline) {
        this.pipeline.trigger('BEFORE_PLAYER_ATTACK', attackCtx);
        this.playerHp = this.battleState.playerHp;
      }

      const isPlayerCrit = Math.random() < this.playerCritRate;
      const basePlayerDmg = Math.max(4, Math.floor(this.playerAtk - 0.4 * targetMonster.def));
      const playerDmg = Math.floor(basePlayerDmg * (isPlayerCrit ? 1.5 : 1.0) * (attackCtx.dmgMultiplier || 1.0)) + (attackCtx.bonusTrueDmg || 0);

      targetMonster.currentHp = Math.max(0, targetMonster.currentHp - playerDmg);

      // 隐藏客卿仙印与仙宝词条：九死·万劫不灭印 / 幽冥嗜血 (攻击伤害转化为吸血恢复)
      const gm = (window.SlotsRPG && window.SlotsRPG.GameManager) || (typeof global !== 'undefined' && global.SlotsRPG && global.SlotsRPG.GameManager);
      const permMods = gm && gm.ascensionManager ? gm.ascensionManager.getPermanentModifiers() : null;
      const lifestealRate = (this.player && this.player.lifestealRate) || (permMods && permMods.lifestealRate) || 0;
      if (lifestealRate > 0 && this.playerHp < this.playerMaxHp && playerDmg > 0) {
        const stealHp = Math.min(this.playerMaxHp - this.playerHp, Math.floor(playerDmg * lifestealRate));
        if (stealHp > 0) {
          this.playerHp += stealHp;
          this.battleState.playerHp = this.playerHp;
          const lsEv = {
            round: currentRound,
            phase: 'mid_battle',
            type: 'lifesteal',
            skillType: 'blood_drain',
            heal: stealHp,
            playerHp: this.playerHp,
            playerMaxHp: this.playerMaxHp,
            text: `🩸【九死·万劫不灭】魔血嗜生！抽取敌方精血恢复 +${stealHp} 气血！`
          };
          roundEvents.push(lsEv);
          this.timeline.push(lsEv);
        }
      }

      const atkEv = {
        round: currentRound,
        turn: 'player',
        actionType: 'attack',
        actor: 'player',
        targetIndex: tIdx,
        targetMonster,
        damage: playerDmg,
        isCrit: isPlayerCrit,
        skillType: isPlayerCrit ? 'wanjian_guizong' : 'sword_slash',
        playerHp: this.playerHp,
        playerMaxHp: this.playerMaxHp,
        monsterHp: targetMonster.currentHp,
        monsterMaxHp: targetMonster.maxHp,
        totalEnemyHp: this.getTotalMonsterHp(),
        totalEnemyMaxHp: this.getTotalMonsterMaxHp(),
        text: isPlayerCrit
          ? `⚔️ 第 ${currentRound} 回合：剑意冲霄！主角施展【万剑归宗】暴击重创【${targetMonster.name}】 -${playerDmg}！`
          : `⚔️ 第 ${currentRound} 回合：飞剑贯日！主角斩击【${targetMonster.name}】 -${playerDmg}！`
      };
      roundEvents.push(atkEv);
      this.timeline.push(atkEv);

      if (this.pipeline) {
        this.pipeline.trigger('AFTER_PLAYER_ATTACK', {
          player: this.player,
          targetMonster,
          targetIndex: tIdx,
          damageDealt: playerDmg,
          isCrit: isPlayerCrit,
          round: currentRound,
          battleState: this.battleState,
          timeline: this.timeline,
          aliveMonsters: this.getAliveMonsters()
        });
      }

      if (targetMonster.currentHp <= 0) {
        const defEv = {
          round: currentRound,
          type: 'monster_defeated',
          monsterIndex: tIdx,
          monster: targetMonster,
          remainingCount: this.getAliveMonsters().length,
          totalEnemyHp: this.getTotalMonsterHp(),
          totalEnemyMaxHp: this.getTotalMonsterMaxHp(),
          text: `💥 剑光破煞！【${targetMonster.name}】已被斩灭！`
        };
        roundEvents.push(defEv);
        this.timeline.push(defEv);

        if (this.pipeline) {
          this.pipeline.trigger('ON_ENEMY_KILLED', {
            player: this.player,
            killedMonster: targetMonster,
            round: currentRound,
            battleState: this.battleState,
            timeline: this.timeline
          });
          this.playerAtk = this.battleState.playerAtk;
        }
      }
    }

    // 判定是否所有敌怪已阵亡 (伏妖大捷)
    if (this.getAliveMonsters().length === 0) {
      this._finalize(true);
      return { isOver: true, isVictory: true, roundEvents };
    }

    // ==========================================
    // 阶段 2：敌方反击回合 (阵列中所有存活妖兽反击)
    // ==========================================
    const currentLiving = this.getAliveMonsters();
    const gm = (window.SlotsRPG && window.SlotsRPG.GameManager) || (typeof global !== 'undefined' && global.SlotsRPG && global.SlotsRPG.GameManager);
    const permMods = gm && gm.ascensionManager ? gm.ascensionManager.getPermanentModifiers() : null;

    for (let i = 0; i < currentLiving.length; i++) {
      if (this.playerHp <= 0) break;
      const livingObj = currentLiving[i];
      const m = livingObj.m;
      const mIdx = livingObj.idx;

      const isSkill = Math.random() < 0.20;
      const baseMonsterDmg = Math.max(2, Math.floor(m.atk - 0.45 * this.playerDef));
      let rawDmg = isSkill ? Math.floor(baseMonsterDmg * 1.15) : baseMonsterDmg;

      // 多怪同屏围攻衰减：第1只造成100%全额伤害，第2只衰减为85%，第3只及以上衰减为70%，避免多怪并发瞬秒主角
      let crowdFalloff = 1.0;
      if (i === 1) crowdFalloff = 0.85;
      else if (i >= 2) crowdFalloff = 0.70;
      let monsterDmg = Math.max(1, Math.floor(rawDmg * crowdFalloff));

      // 受击拦截钩子
      if (this.pipeline) {
        const dmgCtx = {
          player: this.player,
          monster: m,
          damage: monsterDmg,
          isSkill,
          round: currentRound,
          battleState: this.battleState,
          timeline: this.timeline
        };
        this.pipeline.trigger('ON_TAKE_DAMAGE', dmgCtx);
        monsterDmg = dmgCtx.damage;
        this.playerHp = this.battleState.playerHp;
      }

      if (monsterDmg > 0) {
        this.playerHp = Math.max(0, this.playerHp - monsterDmg);
        this.battleState.playerHp = this.playerHp;
      }

      // 新手期天道眷顾锁血护脉：当玩家处于凡人或练气初阶 (Lv <= 3) 时，首度遭受致命打击激活护体神光
      const isNewbie = this.player && (this.player.isMortal || (this.player.level <= 3));
      if (this.playerHp <= 0 && isNewbie && !this.battleState.hasNewbieGritProtected) {
        this.battleState.hasNewbieGritProtected = true;
        const rescueHp = Math.max(15, Math.floor(this.playerMaxHp * 0.25));
        this.playerHp = rescueHp;
        this.battleState.playerHp = this.playerHp;

        const gritEv = {
          round: currentRound,
          phase: 'mid_battle',
          type: 'newbie_protection',
          skillType: 'golden_revive',
          heal: rescueHp,
          playerHp: this.playerHp,
          playerMaxHp: this.playerMaxHp,
          totalEnemyHp: this.getTotalMonsterHp(),
          totalEnemyMaxHp: this.getTotalMonsterMaxHp(),
          text: `✨【天道眷顾 · 锁血护脉】造化神盘引动天地清气！抵御致命死劫，护脉回元 +${rescueHp} 气血！`
        };
        roundEvents.push(gritEv);
        this.timeline.push(gritEv);
      }

      // 复活机制检测 (options.withRevive / 钦天·观星逆命免死)
      const canQintianRevive = permMods && permMods.reviveCount > 0 && !this.battleState.hasQintianRevived;
      if (this.playerHp <= 0 && (this.options.withRevive || canQintianRevive) && !this.battleState.hasRevived) {
        this.battleState.hasRevived = true;
        if (canQintianRevive) this.battleState.hasQintianRevived = true;
        this.playerHp = this.playerMaxHp;
        this.battleState.playerHp = this.playerHp;
        this.battleState.heroShieldHp = (this.battleState.heroShieldHp || 0) + 99999;

        const revEv = {
          round: currentRound,
          phase: 'mid_battle',
          type: 'hero_revive',
          skillType: 'golden_revive',
          playerHp: this.playerHp,
          playerMaxHp: this.playerMaxHp,
          totalEnemyHp: this.getTotalMonsterHp(),
          totalEnemyMaxHp: this.getTotalMonsterMaxHp(),
          text: canQintianRevive
            ? '🌌【钦天·观星逆命】星盘倒悬，时光倒流！宿主窥破死劫，100% 满血重凝战躯！'
            : '✨【起死回生 · 九转还魂】造化神光灌顶！宿主 100% 满血复活并凝聚无敌护盾，绝地逆袭！'
        };
        roundEvents.push(revEv);
        this.timeline.push(revEv);
      }

      const mEv = {
        round: currentRound,
        turn: 'monster',
        actor: 'monster',
        actorIndex: mIdx,
        actorMonster: m,
        damage: monsterDmg,
        isSkill,
        skillName: isSkill ? m.skillName : null,
        skillType: isSkill ? (m.skillType || 'fissure_claw') : 'arm_slash',
        playerHp: this.playerHp,
        playerMaxHp: this.playerMaxHp,
        totalEnemyHp: this.getTotalMonsterHp(),
        totalEnemyMaxHp: this.getTotalMonsterMaxHp(),
        text: isSkill
          ? `🔥【${m.name}】(攻击:${m.atk}) 施展【${m.skillName}】，主角受损 -${monsterDmg}！`
          : `💥【${m.name}】(攻击:${m.atk}) 巨爪猛扑，主角受损 -${monsterDmg}！`
      };
      roundEvents.push(mEv);
      this.timeline.push(mEv);
    }

    // 判定回合结束是否主角阵亡或超时
    if (this.playerHp <= 0 || this.round >= this.maxRounds) {
      this._finalize(false);
      return { isOver: true, isVictory: false, roundEvents };
    }

    this.round++;
    return { isOver: false, isVictory: false, roundEvents };
  }

  _finalize(victoryOverride = null) {
    this.isOver = true;
    this.isVictory = victoryOverride !== null ? victoryOverride : (this.playerHp > 0 && this.getAliveMonsters().length === 0);

    const isBossFight = this.encounter.tier === 'boss' || this.encounter.isBoss;
    const canRevive = !this.isVictory && isBossFight && (window.SlotsRPG && window.SlotsRPG.AdService ? window.SlotsRPG.AdService.canWatch('revive') : false);

    if (this.isVictory && this.pipeline) {
      this.pipeline.trigger('ON_BATTLE_VICTORY', {
        player: this.player,
        encounter: this.encounter,
        timeline: this.timeline,
        rewards: this.encounter.rewards
      });
    }

    this.result = {
      isVictory: this.isVictory,
      canRevive,
      hasRevived: !!this.battleState.hasRevived,
      finalRound: this.round,
      totalRounds: Math.max(1, this.round),
      timeline: this.timeline,
      itemsUsed: this.itemsUsed,
      playerStartStats: { hp: this.playerMaxHp, atk: this.playerAtk, def: this.playerDef },
      playerFinalHp: this.playerHp,
      encounter: this.encounter,
      boss: this.encounter.monsters[0],
      rewards: this.encounter.rewards,
      session: this
    };
    return this.result;
  }

  /**
   * 自动推演全部剩余回合直到战斗结束
   */
  simulateRemaining() {
    while (!this.isOver && this.round <= this.maxRounds) {
      this.executeRound('auto');
    }
    if (!this.isOver) {
      this._finalize();
    }
    return this.result;
  }
}

class CombatEngine {
  /**
   * 创建一个可交互/可分步控制的战斗会话
   */
  static createSession(player, encounter, inventory, options = {}) {
    return new CombatSession(player, encounter, inventory, options);
  }

  /**
   * 执行完整的遭遇战推演 (支持多怪物车轮连战)
   * @param {Object} player - PlayerModel 实例
   * @param {Object} encounter - MonsterConfig.createEncounter 返回的对象
   * @param {InventoryManager} inventory - 乾坤袋背包管理器
   * @param {Object} options - 选项配置
   */
  static simulateEncounter(player, encounter, inventory, options = {}) {
    const session = new CombatSession(player, encounter, inventory, options);
    return session.simulateRemaining();
  }

  /**
   * 兼容旧接口的快捷转发
   */
  static simulateBattle(player, boss, inventory, options = {}) {
    const encounter = {
      tier: boss.tier || 'boss',
      scatterCount: 5,
      potLevel: boss.potTier || 1,
      monsters: [boss],
      totalCount: 1,
      rewards: boss.rewards
    };
    return this.simulateEncounter(player, encounter, inventory, options);
  }
}

window.SlotsRPG.CombatSession = CombatSession;
window.SlotsRPG.CombatEngine = CombatEngine;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.SlotsRPG.CombatEngine;
}