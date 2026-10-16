/**
 * GameManager - 游戏状态与生命周期总控器
 * 负责状态持久维护、推演动作流转、角色养成与乾坤袋背包统一调度
 * 严格遵循 PRD 规范
 */
window.SlotsRPG = window.SlotsRPG || {};

class GameManager {
  constructor() {
    this.energy = 0;               // 凡人初始机缘为 0，斩恶兽觉醒认主后赠送 100
    this.level = 1;                // 聚宝盆等级 (1阶，击败赤炼蟒后升至2阶)
    this.potExp = 0;               // 天机盘蕴灵值 (经验进度)
    this.potSubLevel = 1;          // 天机盘当前等级 (Lv 1 ~ Lv 6，决定掉落品质基准线)
    this.potSubExp = 0;            // 天机盘升级经验
    this.freeReliefCount = 3;      // 每日免费机缘救济次数
    this.lastReliefDate = this._getTodayDateString(); // 上次救济重置日期 (YYYY-MM-DD)
    this.dailySecretRealmCount = 1; // 每日洞天探寻秘境次数 (每天1次)
    this.lastSecretRealmDate = this._getTodayDateString(); // 上次探寻秘境日期
    
    // 序章状态机 (凡人采药 -> 斩黑鬣猪 -> 天机认主 -> 散修初探 -> 叩问仙门)
    this.isPrologueComplete = false;
    this.prologueStep = 0;         // 0: 凡人未入门, 1: 恶兽对决, 2: 斩猪待认主, 3: 散修初探中, 4: 拜入宗门大成
    this.prologueSpins = 0;        // 散修阶段已推演抽数 (1~6 驱动 FTUESequence)

    // 快速消耗档位体系 (根据玩家当前拥有灵机自适应开放)
    this.ALL_BET_TIERS = [25, 50, 100, 200, 500, 1000, 2000, 5000];
    this.currentBet = 25;          // 当前单次推演消耗灵机 (默认 25)

    this.isAutoSpinning = false;
    this.autoSpinTimer = null;
    this.wasAutoSpinningBeforeBattle = false; // 记录进入战斗前天机盘是否处于自动推演状态
    this.wasAutoSpinningBeforeBonus = false;  // 记录进入秘境前天机盘是否处于自动推演状态
    this.currentWorldTier = 1; // 1: 人界, 2: 灵界·飘渺仙域 (PRD 4.3 节)
    this.adService = (window.SlotsRPG && window.SlotsRPG.AdService) || null;

    // PRD 10.5 节: 作弊器嘴炮吐槽与同门震惊动态语料库
    this.CHATTER_QUOTES = {
      idle: [
        '【天机作弊器】：“检测到宗门外门执事在打瞌睡，悄悄顺走他一袋灵石...”',
        '【天机盘低鸣】：“天地不仁，唯推演万道方能长生！”',
        '【作弊器提示】：“今日灵气充沛，转动天机盘或有造化机缘降临。”'
      ],
      win: [
        '【同门师妹】：“天呐！师兄这随手一拨，为何竟引来天地异象？！”',
        '【太上长老】：“此子悟性逆天，实乃我宗万载不遇之麒麟仙胚！”',
        '【天机作弊器】：“检测到天道法则被篡改，机缘正在疯狂倾泻！”'
      ],
      boss: [
        '【后山妖王】：“吼！小小人族，竟敢擅闯本座领地受死！”',
        '【作弊器报警】：“宿主战意激荡，建议速出暴击斩妖除害！”'
      ],
      mortal: [
        '【采药童子】：“后山野兽凶悍，柴刀虽钝，亦可斩妖！”',
        '【神秘古盘】：“宿主凡胎肉体逆境斩凶，天机造化由此开！”'
      ],
      ascension: [
        '【九天仙使】：“下界修士五卷归一，叩开天门，位列仙班！”',
        '【天机神算】：“飘渺仙域万界来朝，鸿蒙浮岛星汉璀璨！”'
      ]
    };

    this.defeatStreak = 0;         // 战斗连续失败次数 (用于自适应降难)
    this.currentBattle = null;     // 当前或最近一场战斗记录
    this.bossChallengeUnlocked = false; // 是否已解锁降妖伏魔 (滚轮遭遇Boss且打不过时激活)
    this.hasDefeatedSectBoss = false;   // 当前轮回是否已斩灭本宗门守关妖王
    this.sectTrialStage = 1;       // 当前门派主动挑战关卡进度 (1~12 关为递增试炼，13 为终极守关大 Boss)
    this.trialBestDamagePct = 0;   // 当前试炼关卡历史最高削血百分比 (0~99%)
    this.lockedSectBossSnapshot = null; // 首次生成锁定的 1.1~1.2x 动态守关 Boss 属性快照
    this.unlockedSectTicket = null;     // 作弊器截获的新宗门入场券 { sectId, sectName, tokenName, tokenIcon, desc }
    this.bossTicketAttempts = 0;        // 守关妖王门票掉落尝试次数 (40% -> 75% -> 100% 保底)
    this.consecutiveEmptySpins = 0;     // 连续空转次数 (用于钦天监奇遇)
    this.wantongSpinCounter = 0;        // 万通金玉满堂推演计数器 (每10次返还100灵机)

    // 核心子系统
    this.slotsEngine = new window.SlotsRPG.SlotsEngine();
    this.player = new window.SlotsRPG.PlayerModel();
    this.player.gameManager = this;
    this.inventory = new window.SlotsRPG.InventoryManager(24);
    this.caveManager = new window.SlotsRPG.CaveManager();
    this.holdAndSpinEngine = new window.SlotsRPG.HoldAndSpinEngine();
    this.ascensionManager = window.SlotsRPG.AscensionManager
      ? new window.SlotsRPG.AscensionManager(this)
      : null;
    this.renderer = null;
    this.pendingOfflineReward = null;

    // 默认装配凡人采药破烂装束 (战力 18)
    this.player.setupMortalState();
  }

  /**
   * 获取当前天机盘阶数升阶所需的最大蕴灵值
   */
  getMaxPotExp(level = this.level) {
    const samsara = (this.ascensionManager && this.ascensionManager.meta && this.ascensionManager.meta.samsaraCount) || 1;
    const potTargets = (window.SlotsRPG && window.SlotsRPG.GameBalanceConfig && window.SlotsRPG.GameBalanceConfig.PotExpTargets) || null;
    if (potTargets && typeof potTargets.getMaxExp === 'function') {
      return potTargets.getMaxExp(samsara, level);
    }
    const tierTargets = { 1: 500, 2: 1500, 3: 3500, 4: 6500, 5: 10000 };
    const base = tierTargets[samsara] || (10000 + (samsara - 5) * 5000);
    return level > 1 ? Math.floor(base * 1.5) : base;
  }

  /**
   * 增加天机盘蕴灵值
   * @param {number} amount 
   */
  addPotExp(amount) {
    const max = this.getMaxPotExp();
    const old = this.potExp;
    this.potExp = Math.min(max, this.potExp + amount);
    const reached = old < max && this.potExp >= max;
    if (this.renderer && amount > 0) {
      this.renderer.addFloatingText(`蕴灵 +${amount}!`, '#38ef7d');
    }
    return { gain: amount, current: this.potExp, max, reached };
  }

  /**
   * 获取天机盘当前子等级升级所需经验
   */
  getPotSubMaxExp(lvl = this.potSubLevel) {
    const table = { 1: 80, 2: 100, 3: 100, 4: 100, 5: 80 };
    return table[lvl] || 999999;
  }

  /**
   * 增加天机盘子等级经验，驱动 Lv 1 ~ Lv 6 进阶与掉落矩阵升级
   * @param {number} amount
   */
  addPotSubExp(amount) {
    if (this.potSubLevel >= 6) return { level: 6, leveledUp: false };
    this.potSubExp = (this.potSubExp || 0) + amount;
    let leveledUp = false;
    const titles = { 1: '初窥门径', 2: '凝神引灵', 3: '百炼天机', 4: '通玄灵鼎', 5: '造化乾坤', 6: '鸿蒙道盘' };

    while (this.potSubLevel < 6 && this.potSubExp >= this.getPotSubMaxExp(this.potSubLevel)) {
      this.potSubExp -= this.getPotSubMaxExp(this.potSubLevel);
      this.potSubLevel++;
      leveledUp = true;
      if (this.renderer) {
        this.renderer.addFloatingText(`✨ 天机盘进阶至 Lv.${this.potSubLevel}【${titles[this.potSubLevel]}】！`, '#ffd700');
      }
      window.SlotsRPG.EventBus.emit('POT_SUB_LEVEL_UP', {
        level: this.potSubLevel,
        title: titles[this.potSubLevel]
      });
    }
    return { level: this.potSubLevel, leveledUp };
  }

  /**
   * 6槽神装毕业且已击败守关妖王，颁发下一宗门真传接引令牌 (门票)
   */
  awardFullSetSectTicket() {
    if (this.unlockedSectTicket) return this.unlockedSectTicket;
    const fullSet = this.player ? this.player.checkFullSetEquipped('Q4') : null;
    if (!this.hasDefeatedSectBoss || !fullSet || !fullSet.isGraduated) {
      return null;
    }
    const ticket = this.stealSectTicketWithCheat(true);
    if (ticket) {
      if (this.renderer) {
        this.renderer.addFloatingText(`🌟 妖王伏诛，六道圆满！获下一宗门【${ticket.tokenName}】！`, '#ffd700');
      }
      window.SlotsRPG.EventBus.emit('FULL_SET_SECT_TICKET_AWARDED', { ticket });
    }
    return ticket;
  }

  /**
   * 判定天机盘升阶试炼是否就绪 (满额可一键挑战妖王升阶)
   */
  isPotBreakthroughReady() {
    if (this.hasDefeatedSectBoss) return false; // 妖王已斩伏，本门派试炼已通关，严禁重复死循环触发妖王
    return this.potExp >= this.getMaxPotExp();
  }

  /**
   * 当前消耗对应的基础倍率 (以 25 为 1x)
   */
  get betMultiplier() {
    return Math.max(1, Math.floor((this.currentBet || 25) / 25));
  }

  /**
   * 根据玩家当前拥有的资源(灵机)决定出现哪些消耗档位
   * PRD 需求：有 25 50 100 200 等等选项，根据用户拥有的资源决定
   */
  getAvailableBetTiers() {
    const available = this.ALL_BET_TIERS.filter(t => t <= this.energy);
    return available.length > 0 ? available : [25];
  }

  /**
   * 切换至指定消耗档位
   * @param {number} newBet 
   */
  setBet(newBet) {
    const val = Number(newBet);
    if (!this.ALL_BET_TIERS.includes(val)) return false;
    // 只有当前机缘允许的档位或基础保底 25 允许设置
    if (val > this.energy && val > 25) return false;
    this.currentBet = val;
    this.emitStateChange();
    return true;
  }

  /**
   * 步进切换消耗档位 (-1 降低, +1 提高)
   * @param {number} direction 
   */
  stepBet(direction = 1) {
    const tiers = this.getAvailableBetTiers();
    let idx = tiers.indexOf(this.currentBet);
    if (idx === -1) {
      idx = tiers.length - 1;
    }
    const nextIdx = idx + direction;
    if (nextIdx >= 0 && nextIdx < tiers.length) {
      this.currentBet = tiers[nextIdx];
      this.emitStateChange();
    }
  }

  init(renderer) {
    this.renderer = renderer;
    this._bindEvents();

    let loaded = false;
    // 尝试读取本地存档
    if (window.SlotsRPG.StorageService) {
      loaded = window.SlotsRPG.StorageService.loadGame(this);
    }

    if (!loaded) {
      // 纯新玩家：初始化凡人采药童子破烂装束
      this.energy = 0;
      this.isPrologueComplete = false;
      this.prologueStep = 0;
      this.player.setupMortalState();
    }

    // 初始化洞天灵脉心跳并计算离线收益 (仅序章已完成的真正修真者开放)
    if (this.caveManager && this.isPrologueComplete) {
      this.caveManager.init();
      this.pendingOfflineReward = this.caveManager.calculateOfflineEarnings();
    }

    this.emitStateChange();

    // 若有离线收益，延迟广播通知 UI 弹出收益大喜报
    if (this.pendingOfflineReward && (this.pendingOfflineReward.energyGained > 0 || this.pendingOfflineReward.pillsGained > 0)) {
      setTimeout(() => {
        window.SlotsRPG.EventBus.emit('OFFLINE_REWARD', this.pendingOfflineReward);
      }, 600);
    }
  }

  _bindEvents() {
    window.SlotsRPG.EventBus.on('TRIGGER_SPIN', () => {
      this.executeSpin();
    });

    window.SlotsRPG.EventBus.on('TOGGLE_AUTO_SPIN', () => {
      this.toggleAutoSpin();
    });
  }

  /**
   * 广播全局状态
   */
  emitStateChange() {
    this.checkDailyReliefReset();
    const totalStats = this.player.getTotalStats();
    const baseStats = this.player.getBaseStats();
    const equipStats = this.player.getEquipmentStats();

    window.SlotsRPG.EventBus.emit('STATE_CHANGE', {
      energy: this.energy,
      level: this.level,
      potExp: this.potExp,
      maxPotExp: this.getMaxPotExp(),
      isPotBreakthroughReady: this.isPotBreakthroughReady(),
      potSubLevel: this.potSubLevel || 1,
      potSubExp: this.potSubExp || 0,
      potSubMaxExp: this.getPotSubMaxExp(this.potSubLevel || 1),
      potSubTitle: ({ 1: '初窥门径', 2: '凝神引灵', 3: '百炼天机', 4: '通玄灵鼎', 5: '造化乾坤', 6: '鸿蒙道盘' })[this.potSubLevel || 1] || '初窥门径',
      
      // 快速消耗档位
      currentBet: this.currentBet,
      betMultiplier: this.betMultiplier,
      availableBetTiers: this.getAvailableBetTiers(),

      // 角色数据
      realm: this.player.realmName,
      playerLevel: this.player.level,
      exp: this.player.exp,
      maxExp: this.player.maxExp,
      combatPower: this.player.combatPower,
      totalStats: totalStats,
      baseStats: baseStats,
      equipStats: equipStats,
      equipment: this.player.equipment,

      // 背包数据
      inventorySlots: this.inventory.slots,
      inventoryCapacity: this.inventory.capacity,
      freeSlots: this.inventory.getFreeSlotsCount(),
      overflowCount: this.inventory.overflowBuffer.length,
      autoSalvageEnabled: this.inventory.autoSalvageEnabled,
      unreadCount: this.inventory.getUnreadCount(item => item.type !== 'equip' || this.player.hasEquipmentImprovement(item, this.level)),

      // 运转状态
      isAutoSpinning: this.isAutoSpinning,
      freeReliefCount: this.freeReliefCount,
      dailySecretRealmCount: this.dailySecretRealmCount,
      canExploreSecretRealmToday: this.canExploreSecretRealmToday(),

      // 序章与宗门数据
      isPrologueComplete: this.isPrologueComplete,
      prologueStep: this.prologueStep,
      isMortal: this.player.isMortal,
      currentSect: this.player.currentSect,
      sectConfig: this.player.getSectConfig(),
      bossChallengeUnlocked: !!this.bossChallengeUnlocked,
      hasDefeatedSectBoss: !!this.hasDefeatedSectBoss,
      unlockedSectTicket: this.unlockedSectTicket ? { ...this.unlockedSectTicket } : null,

      // 升仙天碑与轮回资产
      ascension: this.ascensionManager ? {
        collectedCount: this.ascensionManager.collectedCount,
        totalCount: 5,
        isReady: this.ascensionManager.isAscensionReady(),
        shards: this.ascensionManager.getShardsStatus(),
        samsaraCount: this.ascensionManager.meta.samsaraCount,
        karmaPoints: this.ascensionManager.meta.karmaPoints,
        masteredSects: [...this.ascensionManager.meta.masteredSects],
        heirlooms: [...this.ascensionManager.meta.heirloomItems],
        legacyStats: this.ascensionManager.meta.legacyStats ? { ...this.ascensionManager.meta.legacyStats } : { hp: 0, atk: 0, def: 0 }
      } : null,

      // 洞天灵脉数据
      cave: this.caveManager ? this.caveManager.serialize() : null,

      // 大世界位面与商业变现
      worldTier: this.currentWorldTier || 1,
      adState: this.adService ? this.adService.serialize() : null
    });

    // 自动防抖保存存档
    if (window.SlotsRPG.StorageService) {
      window.SlotsRPG.StorageService.saveGame(this);
    }
  }

  /**
   * 消除单件物品的未读红点
   */
  markItemRead(index) {
    this.inventory.markItemRead(index);
    this.emitStateChange();
  }

  /**
   * 执行一次推演天机 (Spin)
   */
  executeSpin() {
    if (this.renderer && this.renderer.isSpinning) return;

    // 序章阶段未获神物认主时禁止转盘推演
    if (!this.isPrologueComplete && this.prologueStep < 3) {
      if (this.renderer) {
        this.renderer.addFloatingText('天机盘未觉醒，请先至角色面板采药除害！', '#ef4444');
      }
      return;
    }

    // 自适应校验当前消耗档位：若玩家灵机消耗后不足以支持当前档位，自动降级至当前能承受的最高档位
    const availableTiers = this.getAvailableBetTiers();
    if (!availableTiers.includes(this.currentBet)) {
      this.currentBet = availableTiers[availableTiers.length - 1];
    }

    const cost = this.currentBet;
    if (this.energy < cost) {
      this.stopAutoSpin();
      this.checkDailyReliefReset();
      this.checkWantongSecretEgg();
      window.SlotsRPG.EventBus.emit('ENERGY_DEPLETED', {
        canRelief: this.freeReliefCount > 0,
        remainingRelief: this.freeReliefCount
      });
      return;
    }

    // 1. 扣除机缘 (支持多倍快速消耗)
    this.energy -= cost;

    // 隐藏客卿仙印：万通·金玉满堂 (每 10 次推演返还 100 灵机)
    if (this.ascensionManager && this.ascensionManager.meta && this.ascensionManager.meta.hiddenMarks && this.ascensionManager.meta.hiddenMarks.wantong) {
      this.wantongSpinCounter = (this.wantongSpinCounter || 0) + 1;
      if (this.wantongSpinCounter >= 10) {
        this.wantongSpinCounter = 0;
        this.energy += 100;
        if (this.renderer) {
          this.renderer.addFloatingText('万通·金玉满堂：天降金元 +100灵机！', '#ffd700');
        }
      }
    }

    // 2. 每次推演保底获得角色经验与天机盘蕴灵值 (按倍率放大)
    const multiplier = this.betMultiplier;
    const levelUps = this.player.addExp(5 * multiplier);
    if (levelUps.length > 0) {
      window.SlotsRPG.EventBus.emit('PLAYER_LEVEL_UP', levelUps);
    }
    // 500 抽长线节拍：每次推演保底 +1 蕴灵 (蓄满 500 点引动妖王)，并驱动天机盘 Lv 1 ~ Lv 6 升级
    this.addPotExp(1 * multiplier);
    this.addPotSubExp(1 * multiplier);

    this.emitStateChange();

    // 3. 启动转轮动效
    if (this.renderer) {
      this.renderer.startSpin();
    }

    // 4. 核心计算生成结果 (除序章剧情首战外，所有战斗均由天机盘推演触发)
    let spinData;
    const ftueCfg = (window.SlotsRPG && window.SlotsRPG.GameBalanceConfig && window.SlotsRPG.GameBalanceConfig.FTUESequence) || null;
    const isFTUEMode = !this.isPrologueComplete && this.prologueStep === 3 && ftueCfg;

    if (isFTUEMode && this.prologueSpins < ftueCfg.targetInductionSpin) {
      this.prologueSpins = (this.prologueSpins || 0) + 1;
      const script = ftueCfg.scriptedSpins[this.prologueSpins];

      if (script && script.forceBattle) {
        // 第 5 抽：触发 3 妖兽伏妖战
        spinData = this.slotsEngine.spin(this.level, multiplier, { forceMonster: true });
        spinData.evaluation.hasTriggeredBattle = true;
        spinData.evaluation.scatterCount = script.forceBattle.scatterCount || 3;
        spinData.evaluation.battleConfig = {
          tier: script.forceBattle.tier || 'normal',
          count: script.forceBattle.count || 3,
          scatterCount: script.forceBattle.scatterCount || 3,
          betMultiplier: multiplier
        };
        spinData.ftueScript = script;
      } else if (script && script.forceLine) {
        // 脚本化连线 (第 1 抽 3玄铁剑, 第 2 抽 3修为丹, 第 3 抽 聚灵符, 第 4 抽 凝神符, 第 6 抽 3造化灵珠)
        spinData = this.slotsEngine.spin(this.level, multiplier, { forceHit: true });
        const sym = script.forceLine.symbol;
        const count = script.forceLine.count || 3;
        for (let c = 0; c < count; c++) {
          spinData.grid[1][c] = sym;
        }
        spinData.evaluation = this.slotsEngine.evaluateGrid(spinData.grid, multiplier);
        spinData.ftueScript = script;
        if (script.forceSectInduction) {
          spinData.isSectInductionSpin = true;
        }
      } else {
        spinData = this.slotsEngine.spin(this.level, multiplier);
        spinData.ftueScript = script;
      }
    } else if (this.isPotBreakthroughReady()) {
      // 天机盘蕴灵圆满！推演引动天机共鸣，全盘引动 5 枚 Scatter 关卡妖王 Boss 降世！
      spinData = this.slotsEngine.spin(this.level, multiplier, { forceBoss: true });
    } else {
      spinData = this.slotsEngine.spin(this.level, multiplier);
    }

    // 5. 将计算结果交予渲染层执行停轮动画
    if (this.renderer) {
      this.renderer.stopSpin(spinData, (result) => {
        this._handleSpinSettlement(result);
      });
    } else {
      this._handleSpinSettlement(spinData);
    }
  }

  /**
   * 停轮结算
   */
  _handleSpinSettlement(spinData) {
    const { evaluation } = spinData;
    let netGain = evaluation.totalPayout;

    // 1. 增加中奖返还机缘
    if (netGain > 0) {
      this.energy += netGain;
    }

    let allLevelUps = [];
    const droppedRewards = [];

    // 2. 处理产出实物 (道符、丹药与法宝装备)
    if (evaluation.itemsWon && evaluation.itemsWon.length > 0) {
      // 防爆仓硬熔断 (Max 1 规则)：单抽最多入库 1 件品质最高装备，其余折算机缘返还
      const allEquips = evaluation.itemsWon.filter(i => i.type === 'equip');
      let primaryEquipItem = null;
      if (allEquips.length > 0) {
        allEquips.sort((a, b) => (b.matchCount || 3) - (a.matchCount || 3));
        primaryEquipItem = allEquips[0];
        if (allEquips.length > 1) {
          const extraRefund = (allEquips.length - 1) * 60 * (spinData.betMultiplier || 1);
          this.energy += extraRefund;
          if (this.renderer) {
            this.renderer.addFloatingText(`多线并发神兵：折算 +${extraRefund}机缘！`, '#ffd700');
          }
        }
      }

      evaluation.itemsWon.forEach(item => {
        if (item.type === 'pill') {
          if (item.subType === 'exp') {
            // 修为丹奖励经验 (已在 SlotsEngine 中乘以倍率)
            const expAmount = item.expReward || (item.matchCount === 5 ? 500 : (item.matchCount === 4 ? 150 : 50));
            const ups = this.player.addExp(expAmount);
            if (ups.length > 0) allLevelUps.push(...ups);
            // 额外为天机盘注入蕴灵 (适配500抽长线尺度，微调加成)
            const potGain = (item.matchCount === 5 ? 15 : (item.matchCount === 4 ? 6 : 2)) * (spinData.betMultiplier || 1);
            this.addPotExp(potGain);
            this.addPotSubExp(potGain);
            if (this.renderer) {
              this.renderer.addFloatingText(`修为 +${expAmount}!`, '#f9d423');
            }
          }
          // 丹药道具入乾坤袋
          const pillItem = window.SlotsRPG.ItemModel.createPill(item.subType, item.amount);
          this.inventory.addItem(pillItem);
          droppedRewards.push({
            type: 'pill',
            icon: item.icon || pillItem.icon,
            row: item.row,
            col: item.col,
            name: item.name
          });
        } else if (item.type === 'rune') {
          // 道门真符入乾坤袋
          const talisman = window.SlotsRPG.ItemModel.createTalisman(item.symbolId, item.amount);
          this.inventory.addItem(talisman);
          droppedRewards.push({
            type: 'rune',
            icon: item.icon || talisman.icon,
            row: item.row,
            col: item.col,
            name: item.name
          });
        } else if (item.type === 'equip') {
          // 硬熔断：非唯一主装备项已在上文折算为机缘，此处跳过入库
          if (primaryEquipItem && item !== primaryEquipItem) {
            return;
          }

          // 从 GameBalanceConfig 读取核心天机盘等级品质掉落矩阵 (严格遵循白皮书)
          const potLvl = Math.max(1, Math.min(6, this.potSubLevel || 1));
          const matrix = (window.SlotsRPG && window.SlotsRPG.GameBalanceConfig && window.SlotsRPG.GameBalanceConfig.EquipQualityMatrix) || null;
          const r = Math.random();
          let qualityCode = matrix ? matrix.pickQuality(potLvl, r) : (r < 0.15 ? 'Q2' : 'Q1');

          // 方案 A：高倍消耗【天道气运暴击】判定 (跨阶跳级大爆)
          const mult = spinData.betMultiplier || 1;
          const burstChance = Math.min(0.65, 0.10 + (mult - 1) * 0.05);
          let isLuckyBurst = false;

          if (item.matchCount >= 5 || Math.random() < burstChance) {
            const next1 = window.SlotsRPG.ItemModel.getNextQuality(qualityCode);
            if (next1) {
              qualityCode = next1;
              isLuckyBurst = true;
            }
            // 8倍以上极高消耗连击5连，有几率连升2阶！
            if (mult >= 8 && item.matchCount >= 5) {
              const next2 = window.SlotsRPG.ItemModel.getNextQuality(qualityCode);
              if (next2) qualityCode = next2;
            }
          } else if (item.matchCount >= 4 && Math.random() < 0.30) {
            const next1 = window.SlotsRPG.ItemModel.getNextQuality(qualityCode);
            if (next1) {
              qualityCode = next1;
              isLuckyBurst = true;
            }
          }

          let targetPart = item.part;
          // 防具类 (SYM_07 青云甲) 智能分流为衣服与帽子道冠 (优先填补短板)，确保 6 大神装槽位全覆盖
          if (targetPart === 'armor') {
            const hasArmor = this.player && this.player.equipment && this.player.equipment.armor;
            const hasHat = this.player && this.player.equipment && this.player.equipment.hat;
            if (!hasHat && hasArmor) {
              targetPart = 'hat';
            } else if (!hasArmor && hasHat) {
              targetPart = 'armor';
            } else {
              targetPart = Math.random() < 0.5 ? 'armor' : 'hat';
            }
          }

          const newEquip = window.SlotsRPG.ItemModel.createEquipment(targetPart, qualityCode);

          // 高倍消耗词条顶格保底 (多倍消耗战力显著增强)
          if (mult > 1 && newEquip.stats) {
            const boost = 1 + Math.min(0.12, (mult - 1) * 0.02);
            newEquip.stats.hp = Math.round(newEquip.stats.hp * boost);
            newEquip.stats.atk = Math.round(newEquip.stats.atk * boost);
            newEquip.stats.def = Math.round(newEquip.stats.def * boost);
            newEquip.power = Math.floor(newEquip.stats.hp * 0.2 + newEquip.stats.atk * 2.0 + newEquip.stats.def * 1.5);
          }

          // 宗门专属神装前缀微调
          if (this.player && this.player.currentSect && window.SlotsRPG.SectConfig) {
            const tmpl = window.SlotsRPG.SectConfig.getSectEquipTemplate(this.player.currentSect, targetPart);
            if (tmpl) {
              newEquip.baseName = tmpl.name;
              newEquip.name = `${newEquip.qualityName}·${tmpl.name}`;
              if (tmpl.icon) newEquip.icon = tmpl.icon;
            }
          }

          if (isLuckyBurst && this.renderer) {
            const burstText = mult > 1 ? `⚡${mult}倍气运神兵！大爆【${newEquip.name}】！` : `⚡天赐神兵！大爆【${newEquip.name}】！`;
            this.renderer.addFloatingText(burstText, '#ffd700');
          }

          // 判定该装备是否能带来提升
          const hasImprovement = this.player.hasEquipmentImprovement(newEquip, this.level);
          newEquip.isNew = hasImprovement;

          // 负战力且背包剩余空间 <= 4，直接自动熔炼为机缘，绝不塞满背包
          if (!hasImprovement && this.inventory.getFreeSlotsCount() <= 4) {
            const salvageE = (newEquip.salvageEnergy || 5) * mult;
            this.energy += salvageE;
            if (this.renderer) {
              this.renderer.addFloatingText(`自动熔铸次品【${newEquip.name}】 +${salvageE}机缘`, '#52c41a');
            }
            return;
          }
          const addRes = this.inventory.addItem(newEquip);

          if (addRes.salvaged) {
            this.energy += addRes.energy;
            if (this.renderer) {
              this.renderer.addFloatingText(`自动分解【${newEquip.name}】 +${addRes.energy}机缘`, '#52c41a');
            }
          } else if (addRes.buffered) {
            if (this.renderer) {
              this.renderer.addFloatingText(`乾坤袋满，入暂存槽 (${addRes.bufferCount}/6)!`, '#f39c12');
            }
            droppedRewards.push({
              type: 'equip',
              icon: newEquip.icon,
              row: item.row,
              col: item.col,
              name: newEquip.name,
              qualityColor: newEquip.qualityColor
            });
          } else if (addRes.overflowFull) {
            // 暂存槽也满，触发防爆仓强阻断并报警
            this.stopAutoSpin();
            window.SlotsRPG.EventBus.emit('INVENTORY_OVERFLOW_FULL', { item: newEquip });
            if (this.renderer) {
              this.renderer.addFloatingText(`乾坤袋与暂存槽已满!`, '#ff416c');
            }
          } else if (addRes.success) {
            if (this.renderer) {
              this.renderer.addFloatingText(`获宝: 【${newEquip.name}】`, newEquip.qualityColor);
            }
            droppedRewards.push({
              type: 'equip',
              icon: newEquip.icon,
              row: item.row,
              col: item.col,
              name: newEquip.name,
              qualityColor: newEquip.qualityColor
            });
          }
        }
      });
    }

    // 触发掉落飞入动效
    if (droppedRewards.length > 0) {
      window.SlotsRPG.EventBus.emit('REWARDS_DROPPED', { rewards: droppedRewards });
    }

    if (allLevelUps.length > 0) {
      window.SlotsRPG.EventBus.emit('PLAYER_LEVEL_UP', allLevelUps);
    }

    this.emitStateChange();
    window.SlotsRPG.EventBus.emit('SPIN_COMPLETE', {
      spinData,
      energy: this.energy
    });

    // 钦天监隐世奇遇检测：统计连续未中奖空转次数
    if (!evaluation.winningLines || evaluation.winningLines.length === 0) {
      this.consecutiveEmptySpins = (this.consecutiveEmptySpins || 0) + 1;
      this.checkQintianSecretEgg();
    } else {
      this.consecutiveEmptySpins = 0;
    }

    // 散修初探教学脚本动态提示与对白广播
    if (spinData.ftueScript) {
      if (spinData.ftueScript.tip && this.renderer) {
        this.renderer.addFloatingText(spinData.ftueScript.tip, '#ffd700');
      }
      if (spinData.ftueScript.dialog) {
        window.SlotsRPG.EventBus.emit('CHATTER_UPDATED', { text: spinData.ftueScript.dialog, category: 'ftue' });
      }
    }

    // 叩问仙门判定：散修初探至第 6 抽爆出 3 枚宗门法牒后触发时序队列 (普通奖励 -> 掉落通知 -> 门票符号高光 -> 加入门派弹窗)
    const isSectInduction = spinData.isSectInductionSpin || (!this.isPrologueComplete && this.prologueStep === 3 && this.prologueSpins >= 6);
    if (isSectInduction) {
      this.stopAutoSpin();
      // 解析中奖法牒/门票格子坐标: l.coords 为每列命中行索引数组 [rowCol0, rowCol1, ...]
      let ticketCoords = [];
      if (evaluation.winningLines && evaluation.winningLines.length > 0) {
        evaluation.winningLines.forEach(l => {
          if (Array.isArray(l.coords)) {
            l.coords.forEach((row, col) => {
              ticketCoords.push({ r: Number(row) || 0, c: Number(col) || 0 });
            });
          }
        });
      }
      if (ticketCoords.length === 0) {
        ticketCoords = [{ r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }];
      }

      window.SlotsRPG.EventBus.emit('TRIGGER_SECT_INDUCTION_SEQUENCE', {
        spinData,
        ticketCoords,
        options: this.getRandomSectOptions()
      });
    }

    // 支线触发判定
    if (evaluation.hasTriggeredBattle) {
      this.suspendAutoSpinForBattle();
      if (this.renderer && this.wasAutoSpinningBeforeBattle) {
        this.renderer.addFloatingText('【天机遭遇】妖兽降临！伏妖战毕后将自动维持推演', '#ffd700');
      }
      let bConfig = evaluation.battleConfig;
      if (bConfig && bConfig.tier === 'boss') {
        const canTriggerBoss = !this.hasDefeatedSectBoss && (this.isPotBreakthroughReady() || this.potSubLevel >= 5 || (this.player && this.player.level >= 8));
        if (!canTriggerBoss) {
          // 早期推演或当前妖王已诛：5枚逆鳞共鸣降级为 2 头巅峰【精英大妖】，既给足大奖惊喜感，又避免提前被妖王秒杀猝死或重复打Boss
          bConfig = { tier: 'elite', count: 2, scatterCount: evaluation.scatterCount, betMultiplier: this.betMultiplier, isDowngradedFromBoss: true };
        }
      }
      if (bConfig && !bConfig.betMultiplier) {
        bConfig.betMultiplier = this.betMultiplier;
      }
      window.SlotsRPG.EventBus.emit('TRIGGER_BATTLE', {
        scatterCount: evaluation.scatterCount,
        level: this.level,
        battleConfig: bConfig,
        betMultiplier: this.betMultiplier
      });
    }

    if (evaluation.hasTriggeredBonus) {
      this.suspendAutoSpinForBonus();
      if (this.renderer && this.wasAutoSpinningBeforeBonus) {
        this.renderer.addFloatingText('【洞天共鸣】造化秘境开启！秘境毕后将自动维持推演', '#34e89e');
      }
      window.SlotsRPG.EventBus.emit('TRIGGER_BONUS', {
        bonusCount: evaluation.bonusCount
      });
    }

    // 自动推演高光停机保护与步进调度 (PRD 10.4 节)
    const stopped = this.checkSmartStop(evaluation);
    if (!stopped && this.isAutoSpinning && !evaluation.hasTriggeredBattle && !evaluation.hasTriggeredBonus) {
      this.autoSpinTimer = setTimeout(() => {
        if (this.isAutoSpinning) this.executeSpin();
      }, 700);
    }
  }

  /**
   * 穿戴/替换装备 (包含换装属性增减差值计算)
   */
  equipItem(inventorySlotIndex) {
    const item = this.inventory.getItem(inventorySlotIndex);
    if (!item || item.type !== 'equip') return null;

    const oldStats = this.player.getTotalStats();
    const oldPower = this.player.combatPower;

    // 穿戴并取回原装备
    const oldItem = this.player.equip(item);

    // 换装旧物处理：仅淘汰的低阶凡铁 (Q1) 自动回炉；优质法宝 (Q2/Q3/Q4) 保留入乾坤袋作为 3合1 合成神品胚子！
    if (oldItem) {
      const qRanks = { Q1: 1, Q2: 2, Q3: 3, Q4: 4, Q5: 5, Q6: 6, Q7: 7 };
      const oldRank = qRanks[oldItem.qualityCode] || 1;
      if (oldRank === 1 || this.inventory.autoSalvageEnabled) {
        const salvageEnergy = oldItem.salvageEnergy || 10;
        this.energy += salvageEnergy;
        this.inventory.setItem(inventorySlotIndex, null); // 净腾出空格
        if (this.renderer) {
          this.renderer.addFloatingText(`凡铁【${oldItem.name}】回炉熔炼 +${salvageEnergy}机缘`, '#38ef7d');
        }
      } else {
        this.inventory.setItem(inventorySlotIndex, oldItem); // 保留入乾坤袋作为 3合1 核心胚子
      }
    } else {
      this.inventory.setItem(inventorySlotIndex, null);
    }

    const newStats = this.player.getTotalStats();
    const newPower = this.player.combatPower;

    const statDiff = {
      power: newPower - oldPower,
      atk: newStats.atk - oldStats.atk,
      def: newStats.def - oldStats.def,
      hp: newStats.hp - oldStats.hp
    };

    // 检查是否达成【六道道基大圆满】(6槽全满 Q4 法器及以上) 与 【击败当前守关妖王】
    const fullSetStatus = this.player.checkFullSetEquipped('Q4');
    if (fullSetStatus.isGraduated && !this.unlockedSectTicket) {
      if (this.hasDefeatedSectBoss) {
        this.awardFullSetSectTicket();
      } else {
        if (this.renderer) {
          this.renderer.addFloatingText('🌟 六道圆满！快去降妖伏魔斩灭守关妖王，夺取下一宗门真传法牒！', '#ffd700');
        }
        window.SlotsRPG.EventBus.emit('CHEAT_DIALOG_TRIGGER', {
          title: '【天机作弊器 · 提示】',
          speaker: '天道作弊器',
          text: '“六道法宝神装已淬炼大圆满！速去降妖伏魔斩灭当前宗门的守关妖王，本作弊器便可顺天应命截获下一宗门真传法牒！”'
        });
      }
    }

    this.emitStateChange();
    window.SlotsRPG.EventBus.emit('INVENTORY_CHANGE');
    return { equipped: item, unequipped: oldItem, statDiff };
  }

  /**
   * 卸下装备 (受防丢件硬约束: 背包必须有空格)
   */
  unequipItem(part) {
    if (!this.inventory.canUnequip()) {
      return { success: false, message: '乾坤袋已满，请先清理背包后再卸下！' };
    }

    const item = this.player.unequip(part);
    if (item) {
      this.inventory.addItem(item);
    }

    this.emitStateChange();
    window.SlotsRPG.EventBus.emit('INVENTORY_CHANGE');
    return { success: true, item };
  }

  /**
   * 单件分解
   */
  salvageItem(inventorySlotIndex) {
    const energy = this.inventory.salvageItem(inventorySlotIndex);
    if (energy > 0) {
      this.energy += energy;
      this.emitStateChange();
      window.SlotsRPG.EventBus.emit('INVENTORY_CHANGE');
    }
    return energy;
  }

  /**
   * 一键 3 合 1 升阶锻造
   */
  mergeEquipment() {
    const res = window.SlotsRPG.EquipSynthesizer.mergeThreeInOne(this.inventory);
    if (res.upgradedItems && res.upgradedItems.length > 0) {
      res.upgradedItems.forEach(item => {
        item.isNew = this.player.hasEquipmentImprovement(item, this.level);
      });
    }
    this.emitStateChange();
    window.SlotsRPG.EventBus.emit('INVENTORY_CHANGE');
    return res;
  }

  /**
   * 一键批量分解
   */
  bulkSalvageEquipment(targetQualities = ['Q1', 'Q2']) {
    const res = window.SlotsRPG.EquipSynthesizer.salvageByQualities(this.inventory, targetQualities);
    if (res.totalEnergy > 0) {
      this.energy += res.totalEnergy;
    }
    this.emitStateChange();
    window.SlotsRPG.EventBus.emit('INVENTORY_CHANGE');
    return res;
  }

  /**
   * 一键整理
   */
  sortInventory() {
    this.inventory.sort();
    this.emitStateChange();
    window.SlotsRPG.EventBus.emit('INVENTORY_CHANGE');
  }

  /**
   * 判断是否可执行 3 合 1 升阶
   */
  canMergeEquipment() {
    return window.SlotsRPG.EquipSynthesizer.canMergeThreeInOne(this.inventory);
  }

  /**
   * 判断是否可执行批量分解
   */
  canBulkSalvageEquipment(targetQualities = ['Q1', 'Q2']) {
    return window.SlotsRPG.EquipSynthesizer.canSalvageByQualities(this.inventory, targetQualities);
  }

  /**
   * 判断是否可执行整理
   */
  canSortInventory() {
    return this.inventory.canSort();
  }

  /**
   * 判断指定装备槽位是否可以穿戴或替换到更高级的装备
   */
  canSlotBeEquippedOrUpgraded(slotName) {
    return this.player.canSlotBeEquippedOrUpgraded(slotName, this.inventory, this.level);
  }

  /**
   * 获取乾坤袋中属于指定部位的所有候选法宝（按战力降序）
   */
  getEquipCandidatesForSlot(slotName) {
    const list = [];
    for (let i = 0; i < this.inventory.capacity; i++) {
      const item = this.inventory.slots[i];
      if (item && item.type === 'equip' && item.part === slotName) {
        list.push({ index: i, item });
      }
    }
    return list.sort((a, b) => (b.item.power || 0) - (a.item.power || 0));
  }

  /**
   * 一键装备：智能扫描乾坤袋，为所有已解锁部位穿戴或替换最佳战力法宝
   * @returns {number} 替换成功的装备件数
   */
  quickEquipBestGear() {
    const slots = ['weapon', 'armor', 'ring', 'hat', 'boots', 'belt'];
    const potLevel = this.level || 1;
    let upgradedCount = 0;
    let foundUpgrade = true;
    let safetyCounter = 0;

    while (foundUpgrade && safetyCounter < 12) {
      safetyCounter++;
      foundUpgrade = false;

      for (const slotName of slots) {
        if (!this.player.isSlotUnlocked(slotName, potLevel)) continue;

        const currentEquip = this.player.equipment[slotName];
        const currentPower = currentEquip ? (currentEquip.power || 0) : -1;

        let bestIndex = -1;
        let maxPower = currentPower;

        for (let i = 0; i < this.inventory.capacity; i++) {
          const item = this.inventory.slots[i];
          if (item && item.type === 'equip' && item.part === slotName) {
            const power = item.power || 0;
            if (power > maxPower) {
              maxPower = power;
              bestIndex = i;
            }
          }
        }

        if (bestIndex !== -1) {
          const res = this.equipItem(bestIndex);
          if (res) {
            upgradedCount++;
            foundUpgrade = true;
          }
        }
      }
    }
    return upgradedCount;
  }

  /**
   * 设置自动分解
   */
  setAutoSalvage(enabled) {
    this.inventory.autoSalvageEnabled = enabled;
    this.emitStateChange();
  }

  toggleAutoSpin() {
    this.isAutoSpinning = !this.isAutoSpinning;
    this.emitStateChange();

    if (this.isAutoSpinning) {
      this.executeSpin();
    } else {
      this.stopAutoSpin();
    }
  }

  stopAutoSpin() {
    this.isAutoSpinning = false;
    this.wasAutoSpinningBeforeBattle = false; // 用户主动关闭或耗尽停止，清除战斗恢复标记
    this.wasAutoSpinningBeforeBonus = false;  // 用户主动关闭或耗尽停止，清除秘境恢复标记
    if (this.autoSpinTimer) {
      clearTimeout(this.autoSpinTimer);
      this.autoSpinTimer = null;
    }
    this.emitStateChange();
  }

  /**
   * 校验当前机缘是否支持启动推演
   */
  canAffordSpin() {
    const cost = this.currentBet || 25;
    if (this.energy >= cost) return true;
    const availableTiers = this.getAvailableBetTiers();
    const minTier = (availableTiers && availableTiers.length > 0) ? availableTiers[0] : 25;
    if (this.energy >= minTier) {
      const affordable = availableTiers.filter(t => t <= this.energy);
      if (affordable.length > 0) {
        this.currentBet = affordable[affordable.length - 1];
        return true;
      }
    }
    return false;
  }

  /**
   * 战前挂起自动推演 (保留自动推演意图，待战斗结束后自动恢复)
   */
  suspendAutoSpinForBattle() {
    if (this.isAutoSpinning) {
      this.wasAutoSpinningBeforeBattle = true;
      if (this.autoSpinTimer) {
        clearTimeout(this.autoSpinTimer);
        this.autoSpinTimer = null;
      }
      this.isAutoSpinning = false;
      this.emitStateChange();
    }
  }

  /**
   * 秘境前挂起自动推演 (保留自动推演意图，待秘境小游戏结束后自动恢复)
   */
  suspendAutoSpinForBonus() {
    if (this.isAutoSpinning) {
      this.wasAutoSpinningBeforeBonus = true;
      if (this.autoSpinTimer) {
        clearTimeout(this.autoSpinTimer);
        this.autoSpinTimer = null;
      }
      this.isAutoSpinning = false;
      this.emitStateChange();
    }
  }

  /**
   * 秘境结束后恢复自动推演 (若此前处于自动推演状态则继续维持旋转)
   */
  resumeAutoSpinAfterBonus() {
    if (!this.wasAutoSpinningBeforeBonus) {
      return false;
    }
    this.wasAutoSpinningBeforeBonus = false;

    if (this.canAffordSpin()) {
      this.isAutoSpinning = true;
      this.emitStateChange();

      if (this.autoSpinTimer) {
        clearTimeout(this.autoSpinTimer);
      }
      this.autoSpinTimer = setTimeout(() => {
        if (this.isAutoSpinning && (!this.renderer || !this.renderer.isSpinning)) {
          this.executeSpin();
        }
      }, 600);
      return true;
    } else {
      this.stopAutoSpin();
      window.SlotsRPG.EventBus.emit('ENERGY_DEPLETED', {
        canRelief: this.freeReliefCount > 0,
        remainingRelief: this.freeReliefCount
      });
      return false;
    }
  }

  /**
   * 战斗结束后恢复自动推演 (若此前处于自动推演状态则继续维持旋转)
   */
  resumeAutoSpinAfterBattle() {
    if (!this.wasAutoSpinningBeforeBattle) {
      return false;
    }
    this.wasAutoSpinningBeforeBattle = false;

    // 校验机缘是否足够继续推演
    if (this.canAffordSpin()) {
      this.isAutoSpinning = true;
      this.emitStateChange();

      if (this.autoSpinTimer) {
        clearTimeout(this.autoSpinTimer);
      }
      this.autoSpinTimer = setTimeout(() => {
        if (this.isAutoSpinning && (!this.renderer || !this.renderer.isSpinning)) {
          this.executeSpin();
        }
      }, 600);
      return true;
    } else {
      this.stopAutoSpin();
      window.SlotsRPG.EventBus.emit('ENERGY_DEPLETED', {
        canRelief: this.freeReliefCount > 0,
        remainingRelief: this.freeReliefCount
      });
      return false;
    }
  }

  _getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /**
   * 跨自然日自动重置免费机缘救济与每日洞天秘境探寻配额
   */
  checkDailyReliefReset() {
    const today = this._getTodayDateString();
    let reset = false;
    if (!this.lastReliefDate || this.lastReliefDate !== today) {
      this.lastReliefDate = today;
      this.freeReliefCount = 3;
      reset = true;
    }
    if (!this.lastSecretRealmDate || this.lastSecretRealmDate !== today) {
      this.lastSecretRealmDate = today;
      this.dailySecretRealmCount = 1; // 每日洞天探寻秘境次数重置为 1 次
      reset = true;
    }
    return reset;
  }

  /**
   * 今日是否仍可探寻洞天秘境 (每日限 1 次)
   */
  canExploreSecretRealmToday() {
    this.checkDailyReliefReset();
    return (this.dailySecretRealmCount || 0) > 0;
  }

  /**
   * 消耗今日 1 次秘境探寻配额
   */
  consumeSecretRealmToday() {
    this.checkDailyReliefReset();
    if (this.dailySecretRealmCount > 0) {
      this.dailySecretRealmCount--;
      this.emitStateChange();
      if (window.SlotsRPG.StorageService) {
        window.SlotsRPG.StorageService.saveGame(this, true);
      }
      return true;
    }
    return false;
  }

  /**
   * 机缘救济领取
   */
  claimRelief() {
    this.checkDailyReliefReset();
    if (this.freeReliefCount <= 0) return false;
    this.freeReliefCount--;
    this.energy += 50;
    this.emitStateChange();
    if (this.renderer) {
      this.renderer.addFloatingText('灵机灌顶 +50 机缘!', '#34e89e');
    }
    return true;
  }

  /**
   * 确保当前门派守关 Boss 战力与属性快照已锁定 (首次生成锁定，软性绑定 1.1~1.2x 动态战力)
   */
  ensureLockedSectBossSnapshot() {
    if (this.lockedSectBossSnapshot && this.lockedSectBossSnapshot.hp > 0 && (this.lockedSectBossSnapshot.combatPower || 0) >= 1000) {
      return this.lockedSectBossSnapshot;
    }
    if (!this.player || this.player.isMortal || !this.player.currentSect) {
      return null;
    }

    const curSect = this.player.currentSect;
    const samsara = (this.ascensionManager && this.ascensionManager.meta && this.ascensionManager.meta.samsaraCount) || 1;
    if (window.SlotsRPG.BossConfig && typeof window.SlotsRPG.BossConfig.getBoss === 'function') {
      const boss = window.SlotsRPG.BossConfig.getBoss(this.level, this.defeatStreak, curSect, samsara, this.player, null);
      if (boss && boss.lockedSnapshot) {
        this.lockedSectBossSnapshot = boss.lockedSnapshot;
        if (window.SlotsRPG.StorageService) {
          window.SlotsRPG.StorageService.saveGame(this, false);
        }
        return this.lockedSectBossSnapshot;
      }
    }
    return null;
  }

  /**
   * 获取当前宗门主动挑战关卡详情 (1~12关递增试炼，13关为守关Boss决战)
   */
  getCurrentTrialStageInfo() {
    if (this.player && (this.player.isMortal || !this.player.currentSect)) {
      return {
        isMortal: true,
        stageIndex: 0,
        totalStages: 12,
        isFinalBoss: false,
        title: '凡人未入道',
        tier: 'normal',
        reqPower: 0,
        playerPower: (this.player && this.player.combatPower) || 18,
        isPowerReady: false,
        bestDamagePct: 0,
        rewards: {}
      };
    }

    // 确保当前门派的守关 Boss 数值在首次获取时已锁定，后续旋转抽奖不再变动
    this.ensureLockedSectBossSnapshot();

    const curSect = (this.currentWorldTier === 2) ? 'spirit_realm' : ((this.player && this.player.currentSect) || 'wanjian');
    const samsara = (this.ascensionManager && this.ascensionManager.meta && this.ascensionManager.meta.samsaraCount) || 1;
    const pPower = (this.player && this.player.combatPower) || 18;

    if (this.sectTrialStage <= 12) {
      const cfg = window.SlotsRPG.MonsterConfig
        ? window.SlotsRPG.MonsterConfig.getSectTrialStageConfig(curSect, this.sectTrialStage, this.level, samsara)
        : { title: `第${this.sectTrialStage}关试炼`, reqPower: 100 * this.sectTrialStage, tier: 'normal', rewards: { energy: 200 } };
      return {
        stageIndex: this.sectTrialStage,
        totalStages: 12,
        isFinalBoss: false,
        title: cfg.title,
        tier: cfg.tier,
        reqPower: cfg.reqPower,
        playerPower: pPower,
        isPowerReady: pPower >= cfg.reqPower,
        bestDamagePct: this.trialBestDamagePct || 0,
        rewards: cfg.rewards
      };
    }

    if (!this.hasDefeatedSectBoss) {
      const bossRaw = window.SlotsRPG.BossConfig
        ? window.SlotsRPG.BossConfig.getBoss(this.level, this.defeatStreak, curSect, samsara, this.player, this.lockedSectBossSnapshot)
        : { name: '守关妖王', hp: 3000, atk: 60, def: 30 };
      const bossPower = bossRaw.combatPower || Math.floor(bossRaw.hp * 0.2 + bossRaw.atk * 2.0 + bossRaw.def * 1.5);
      return {
        stageIndex: 13,
        totalStages: 12,
        isFinalBoss: true,
        title: `决战守关妖王 · ${bossRaw.name}`,
        tier: 'boss',
        reqPower: bossPower,
        playerPower: pPower,
        isPowerReady: pPower >= bossPower,
        bestDamagePct: this.trialBestDamagePct || 0,
        isLockedDynamic: !!this.lockedSectBossSnapshot,
        rewards: bossRaw.rewards || {}
      };
    }

    return {
      stageIndex: 14,
      totalStages: 12,
      isFinalBoss: true,
      isAllCleared: true,
      title: '本门派试炼与守关妖王已全歼！',
      reqPower: pPower,
      playerPower: pPower,
      isPowerReady: true,
      bestDamagePct: 100
    };
  }

  /**
   * 玩家主动发起试炼挑战 (零消耗，随时检验新装备伤害输出与推关进度)
   */
  startActiveTrialChallenge() {
    if (this.player && this.player.isMortal) {
      return { success: false, reason: '凡人尚未入道，请先拜入仙宗门派！' };
    }
    if (this.hasDefeatedSectBoss && this.sectTrialStage > 12) {
      return { success: false, reason: '当前门派试炼与守关妖王已全部通关！' };
    }

    const curSect = (this.currentWorldTier === 2) ? 'spirit_realm' : ((this.player && this.player.currentSect) || 'wanjian');
    const samsara = (this.ascensionManager && this.ascensionManager.meta && this.ascensionManager.meta.samsaraCount) || 1;

    // 广播试炼开启事件 (触发剧情里程碑检测与战前对白)
    if (window.SlotsRPG && window.SlotsRPG.EventBus) {
      window.SlotsRPG.EventBus.emit('TRIAL_STAGE_START', {
        stage: this.sectTrialStage,
        sectId: curSect,
        isBoss: this.sectTrialStage === 13
      });
    }

    let encounter = null;
    if (this.sectTrialStage <= 12) {
      if (window.SlotsRPG.MonsterConfig && typeof window.SlotsRPG.MonsterConfig.createTrialStageEncounter === 'function') {
        encounter = window.SlotsRPG.MonsterConfig.createTrialStageEncounter(curSect, this.sectTrialStage, this.level, samsara, this.player);
      } else {
        return this.startBossBattle({ tier: 'normal', count: 3 });
      }
    } else {
      // 第 13 战：终极守关妖王主动决战
      const res = this.startBossBattle({
        tier: 'boss',
        count: 1,
        sectId: curSect,
        lockedSnapshot: this.lockedSectBossSnapshot
      });
      res.isActiveTrial = true;
      res.trialStageIndex = 13;
      return res;
    }

    const battleResult = window.SlotsRPG.CombatEngine.simulateEncounter(this.player, encounter, this.inventory);
    battleResult.isActiveTrial = true;
    battleResult.trialStageIndex = this.sectTrialStage;
    this.currentBattle = battleResult;

    if (battleResult.isVictory) {
      this.defeatStreak = 0;
    } else {
      this.defeatStreak++;
      const curLiving = encounter.monsters.reduce((s, m) => s + Math.max(0, m.currentHp), 0);
      const maxLiving = encounter.monsters.reduce((s, m) => s + m.maxHp, 0);
      const dmgPct = maxLiving > 0 ? Math.min(99, Math.max(1, Math.round((1 - curLiving / maxLiving) * 100))) : 0;
      const prevPct = this.trialBestDamagePct || 0;
      const diffPct = dmgPct - prevPct;
      if (dmgPct > prevPct) {
        this.trialBestDamagePct = dmgPct;
      }
      battleResult.damageProgress = {
        damagePct: dmgPct,
        prevBestPct: prevPct,
        diffPct: diffPct,
        bestDamagePct: this.trialBestDamagePct
      };
      if (window.SlotsRPG && window.SlotsRPG.StorageService) {
        window.SlotsRPG.StorageService.saveGame(this);
      }
    }

    this.emitStateChange();
    return battleResult;
  }

  /**
   * 发起妖兽遭遇推演 (支持普通3~5只、精英1~2只、或 Boss 关卡挑战)
   * @param {Object} battleConfig - 遭遇配置 { tier, count, scatterCount }
   */
  startBossBattle(battleConfig = null) {
    const curSect = this.player ? this.player.currentSect : null;
    const samsara = (this.ascensionManager && this.ascensionManager.meta && this.ascensionManager.meta.samsaraCount) || 1;
    const multiplier = (battleConfig && battleConfig.betMultiplier) || this.betMultiplier || 1;
    const cfg = Object.assign({
      tier: 'boss',
      count: 1,
      scatterCount: 5,
      sectId: curSect,
      samsaraCount: samsara,
      betMultiplier: multiplier,
      player: this.player,
      lockedSnapshot: this.lockedSectBossSnapshot
    }, battleConfig || {});
    cfg.betMultiplier = multiplier;

    let encounter = null;
    if (window.SlotsRPG.MonsterConfig) {
      encounter = window.SlotsRPG.MonsterConfig.createEncounter(cfg, this.level, this.defeatStreak, this.player);
    } else {
      const boss = window.SlotsRPG.BossConfig.getBoss(this.level, this.defeatStreak, curSect, samsara, this.player, this.lockedSectBossSnapshot);
      const mult = cfg.betMultiplier || this.betMultiplier || 1;
      const multipliedRewards = {
        exp: Math.round((boss.rewards?.exp || 0) * mult),
        energy: Math.round((boss.rewards?.energy || 0) * mult)
      };
      if (boss.rewards?.rewardEquip) multipliedRewards.rewardEquip = JSON.parse(JSON.stringify(boss.rewards.rewardEquip));
      if (boss.rewards?.rewardPill) {
        multipliedRewards.rewardPill = {
          subType: boss.rewards.rewardPill.subType || 'exp',
          amount: Math.round((boss.rewards.rewardPill.amount || 1) * mult)
        };
      }
      if (boss.rewards?.rewardRune) {
        multipliedRewards.rewardRune = {
          symbolId: boss.rewards.rewardRune.symbolId,
          amount: Math.round((boss.rewards.rewardRune.amount || 1) * mult)
        };
      }
      boss.rewards = multipliedRewards;
      encounter = {
        tier: 'boss',
        scatterCount: 5,
        potLevel: this.level,
        monsters: [boss],
        totalCount: 1,
        betMultiplier: mult,
        rewards: multipliedRewards
      };
    }

    // 首次生成守关 Boss 时，立即锁定 1.1~1.2x 动态属性快照
    if (encounter && (encounter.tier === 'boss' || encounter.isBoss) && !this.lockedSectBossSnapshot) {
      if (encounter.monsters && encounter.monsters[0] && encounter.monsters[0].lockedSnapshot) {
        this.lockedSectBossSnapshot = encounter.monsters[0].lockedSnapshot;
      }
    }

    const battleResult = window.SlotsRPG.CombatEngine.simulateEncounter(this.player, encounter, this.inventory);
    this.currentBattle = battleResult;

    if (battleResult.isVictory) {
      this.defeatStreak = 0;
    } else {
      this.defeatStreak++;
      if (encounter.tier === 'boss' || encounter.isBoss) {
        this.bossChallengeUnlocked = false;
        const curLiving = encounter.monsters.reduce((s, m) => s + Math.max(0, m.currentHp), 0);
        const maxLiving = encounter.monsters.reduce((s, m) => s + m.maxHp, 0);
        const dmgPct = maxLiving > 0 ? Math.min(99, Math.max(1, Math.round((1 - curLiving / maxLiving) * 100))) : 0;
        const prevPct = this.trialBestDamagePct || 0;
        const diffPct = dmgPct - prevPct;
        if (dmgPct > prevPct) {
          this.trialBestDamagePct = dmgPct;
        }
        battleResult.damageProgress = {
          damagePct: dmgPct,
          prevBestPct: prevPct,
          diffPct: diffPct,
          bestDamagePct: this.trialBestDamagePct
        };
        if (window.SlotsRPG && window.SlotsRPG.StorageService) {
          window.SlotsRPG.StorageService.saveGame(this);
        }
      }
    }

    return battleResult;
  }

  /**
   * 战中实时道具使用 (如玩家在回合交锋中点击气血丹)
   */
  consumeInBattleItem(type = 'pill', subType = 'hp') {
    if (!this.inventory || !this.inventory.consumeItem(type, subType, 1)) {
      return { success: false, reason: '道具不足' };
    }
    const maxHp = this.player.getTotalStats().hp;
    const healAmount = Math.floor(maxHp * 0.4);
    this.emitStateChange();
    return { success: true, heal: healAmount, maxHp };
  }

  /**
   * 背包中直接服用丹药 (如九转修为丹)
   * @param {string} subType - 'exp' | 'hp'
   * @param {number} count - 服用数量
   */
  usePill(subType = 'exp', count = 1) {
    if (!this.inventory) {
      return { success: false, message: '乾坤袋未就绪' };
    }
    if (this.player.isMortal) {
      return { success: false, message: '凡人未入道，灵根未显，无法炼化仙家灵丹，请先叩问仙门入道！' };
    }
    if (this.player.level >= 10 && this.player.canBreakthrough) {
      return { success: false, message: '已至练气大圆满之境，前方灵障阻隔，须击败守关妖王破关后方可继续进境！' };
    }

    const available = this.inventory.getItemAmount('pill', subType);
    if (available < 1) {
      return { success: false, message: '乾坤袋中此灵丹储量不足！' };
    }

    const consumeCount = Math.min(count, available);
    if (!this.inventory.consumeItem('pill', subType, consumeCount)) {
      return { success: false, message: '扣除灵丹失败' };
    }

    if (subType === 'exp') {
      const expPerPill = 100;
      const totalExp = expPerPill * consumeCount;
      const levelUps = this.player.addExp(totalExp);

      levelUps.forEach(up => {
        const bus = (window.SlotsRPG && window.SlotsRPG.EventBus) || (global.SlotsRPG && global.SlotsRPG.EventBus);
        if (bus) {
          bus.emit('LEVEL_UP', up);
        }
      });

      this.emitStateChange();
      const bus = (window.SlotsRPG && window.SlotsRPG.EventBus) || (global.SlotsRPG && global.SlotsRPG.EventBus);
      if (bus) {
        bus.emit('INVENTORY_CHANGE');
      }

      if (window.SlotsRPG && window.SlotsRPG.StorageService) {
        window.SlotsRPG.StorageService.saveGame(this);
      }

      return {
        success: true,
        consumed: consumeCount,
        expGained: totalExp,
        levelUps: levelUps,
        newLevel: this.player.level,
        newRealm: this.player.realmName
      };
    } else if (subType === 'hp') {
      return {
        success: true,
        consumed: consumeCount,
        message: '太乙气血丹温养筋脉，主要在挑战妖王时战中服用回复 40% 气血！'
      };
    }

    return { success: false, message: '未知灵丹' };
  }

  /**
   * 乾坤袋中炼化道家真符获取机缘能量
   * @param {string} symbolId - 'SYM_01'|'SYM_02'|'SYM_03'
   * @param {number} count - 数量
   */
  useRune(symbolId = 'SYM_01', count = 1) {
    if (!this.inventory) {
      return { success: false, message: '乾坤袋未就绪' };
    }
    const available = this.inventory.getItemAmount('rune', symbolId);
    if (available < 1) {
      return { success: false, message: '乾坤袋中此道符储量不足！' };
    }

    const consumeCount = Math.min(count, available);
    if (!this.inventory.consumeItem('rune', symbolId, consumeCount)) {
      return { success: false, message: '扣除道符失败' };
    }

    const energyPerRune = {
      SYM_01: 20,  // 聚灵符: 20 机缘
      SYM_02: 50,  // 凝神符: 50 机缘
      SYM_03: 100  // 破魔符: 100 机缘
    }[symbolId] || 20;

    const totalEnergy = energyPerRune * consumeCount;
    this.energy += totalEnergy;

    this.emitStateChange();
    const bus = (window.SlotsRPG && window.SlotsRPG.EventBus) || (typeof global !== 'undefined' && global.SlotsRPG && global.SlotsRPG.EventBus);
    if (bus) {
      bus.emit('INVENTORY_CHANGE');
    }

    if (window.SlotsRPG && window.SlotsRPG.StorageService) {
      window.SlotsRPG.StorageService.saveGame(this);
    }

    return {
      success: true,
      consumed: consumeCount,
      energyGained: totalEnergy,
      newEnergy: this.energy
    };
  }

  /**
   * 结算伏妖大捷奖励与突破
   */
  claimBattleRewards(battleResult = this.currentBattle) {
    if (!battleResult || !battleResult.isVictory) return null;

    const rewards = battleResult.rewards || (battleResult.boss && battleResult.boss.rewards) || {};
    const summary = {
      expGained: rewards.exp || 0,
      energyGained: rewards.energy || 0,
      itemsGiven: [],
      breakthroughInfo: null,
      potPromoted: false
    };

    // 1. 发放经验与机缘
    if (rewards.exp) {
      const levelUps = this.player.addExp(rewards.exp);
      summary.levelUps = levelUps;
    }
    if (rewards.energy) {
      this.energy += rewards.energy;
    }

    // 2. 发放装备与丹药实物 (优先发放，确保妖王掉落的最后一件神装即刻入库)
    if (battleResult.rewardItems && battleResult.rewardItems.length > 0) {
      battleResult.rewardItems.forEach(item => {
        if (item.type === 'equip') {
          const hasImp = this.player.hasEquipmentImprovement(item, this.level);
          item.isNew = hasImp;
        } else {
          item.isNew = true;
        }
        this.inventory.addItem(item);
        summary.itemsGiven.push(item);
      });
    } else {
      if (rewards.rewardEquip) {
        const eq = window.SlotsRPG.ItemModel.createEquipment(rewards.rewardEquip.part, rewards.rewardEquip.qualityCode);
        const hasImp = this.player.hasEquipmentImprovement(eq, this.level);
        eq.isNew = hasImp;
        this.inventory.addItem(eq);
        summary.itemsGiven.push(eq);
      }
      if (rewards.rewardPill) {
        const pill = window.SlotsRPG.ItemModel.createPill(rewards.rewardPill.subType, rewards.rewardPill.amount);
        this.inventory.addItem(pill);
        summary.itemsGiven.push(pill);
      }
      if (rewards.rewardRune) {
        const rune = window.SlotsRPG.ItemModel.createTalisman(rewards.rewardRune.symbolId, rewards.rewardRune.amount);
        this.inventory.addItem(rune);
        summary.itemsGiven.push(rune);
      }
    }

    // 2.1 主动试炼关卡进度推进
    if (battleResult.isActiveTrial) {
      if (battleResult.trialStageIndex <= 12) {
        this.sectTrialStage = Math.min(13, (this.sectTrialStage || 1) + 1);
        this.trialBestDamagePct = 0;
        summary.trialStageCleared = battleResult.trialStageIndex;
        summary.nextTrialStage = this.sectTrialStage;
        if (window.SlotsRPG && window.SlotsRPG.EventBus) {
          window.SlotsRPG.EventBus.emit('TRIAL_STAGE_CLEARED', {
            stage: summary.trialStageCleared,
            nextStage: summary.nextTrialStage,
            sectId: this.player ? this.player.currentSect : 'wanjian',
            summary
          });
        }
        if (this.renderer) {
          if (this.sectTrialStage === 13) {
            this.renderer.addFloatingText('🔥 12关试炼全通！终极守关妖王已降临，速去决战！', '#ffd700');
          } else {
            this.renderer.addFloatingText(`⚔️ 试炼大捷！推进至第 ${this.sectTrialStage}/12 关！`, '#34e89e');
          }
        }
      } else {
        this.sectTrialStage = 14;
      }
    }

    // 3. 击败宗门守护神兽/首领里程碑：智能穿戴、解除满额死循环、大圆满与门票闭环发放
    const isBossFight = battleResult.encounter 
      ? (battleResult.encounter.tier === 'boss' || battleResult.encounter.isBoss)
      : (battleResult.boss && (battleResult.boss.tier === 'boss' || (battleResult.boss.id && battleResult.boss.id.startsWith('boss_'))));

    if (isBossFight) {
      this.bossChallengeUnlocked = false;
      this.hasDefeatedSectBoss = true;
      this.potExp = 0; // 无论当前是第几阶，击败妖王后蕴灵必清零，彻底解除 750/750 满额死循环！

      // 自动为角色换装最新最佳法宝，确保刚获得的短板神装立刻生效
      this.quickEquipBestGear();

      // 双重保底：若因极端情况玩家仍缺少某部位 Q4 神装，当场补齐并自动穿戴
      let fullSet = this.player ? this.player.checkFullSetEquipped('Q4') : null;
      if (fullSet && !fullSet.isGraduated && window.SlotsRPG.MonsterConfig) {
        const targetQuality = this.level >= 4 ? 'Q5' : 'Q4';
        const missingPart = window.SlotsRPG.MonsterConfig._findMissingGraduationSlot(this.player, targetQuality);
        const bonusEq = window.SlotsRPG.ItemModel.createEquipment(missingPart, targetQuality);
        this.inventory.addItem(bonusEq);
        summary.itemsGiven.push(bonusEq);
        this.quickEquipBestGear();
        fullSet = this.player.checkFullSetEquipped('Q4');
      }

      // 判定是否同时满足【击败守关妖王】+【全身6槽Q4紫品法器神装大圆满】
      if (fullSet && fullSet.isGraduated) {
        if (!this.unlockedSectTicket) {
          const cheatTicket = this.stealSectTicketWithCheat(true);
          if (cheatTicket) {
            summary.cheatTicket = cheatTicket;
            if (this.renderer) {
              this.renderer.addFloatingText(`🌟 妖王伏诛，六道圆满！引动天道异象，获【${cheatTicket.tokenName}】！`, '#ffd700');
            }
            window.SlotsRPG.EventBus.emit('FULL_SET_SECT_TICKET_AWARDED', { ticket: cheatTicket });
          }
        }
      }

      // 聚宝盆阶位晋升与大境界突破
      if (this.level === 1) {
        this.level = 2; // 聚宝盆升至 2 阶
        this.potExp = 0;
        summary.potPromoted = true;
        const bt = this.player.breakthroughToFoundation();
        summary.breakthroughInfo = bt;
        const newCap = this.inventory.expandCapacity(4);
        summary.newBagCapacity = newCap;

        // 宗门通关大捷与飞升残卷赐予 (Phase 3 核心)
        if (this.ascensionManager && this.player.currentSect) {
          const curSectCfg = this.player.getSectConfig();
          if (curSectCfg) {
            if (!this.ascensionManager.meta.masteredSects.includes(curSectCfg.id)) {
              this.ascensionManager.meta.masteredSects.push(curSectCfg.id);
            }
            if (curSectCfg.type === 'true' && curSectCfg.shardId) {
              const shardRes = this.ascensionManager.unlockShard(curSectCfg.shardId);
              summary.shardAwarded = shardRes.shard;
              if (this.renderer) {
                this.renderer.addFloatingText(`领悟天碑真卷: 【${shardRes.shard.shortName}】!`, '#ffd700');
              }
            } else if (curSectCfg.id === 'wantong') {
              if (this.player.equipment.weapon) this.ascensionManager.saveHeirloom(this.player.equipment.weapon);
              if (this.player.equipment.armor) this.ascensionManager.saveHeirloom(this.player.equipment.armor);
              summary.heirloomsSaved = true;
              if (this.renderer) {
                this.renderer.addFloatingText('万通商行大捷：顶级法宝已封存为跨世传家宝！', '#ffd700');
              }
            } else if (curSectCfg.id === 'qintian') {
              const uncollected = this.ascensionManager.getUncollectedTrueSects();
              if (uncollected.length > 0) {
                this.ascensionManager.setGuaranteedNextSect(uncollected[0]);
                summary.dragonCompassSect = uncollected[0];
                if (this.renderer) {
                  this.renderer.addFloatingText('钦天监大捷：获寻龙天枢盘，下世必引荐真脉！', '#ffd700');
                }
              }
            }
          }
        }
      } else {
        this.level = Math.min(5, this.level + 1);
        this.potExp = 0;
        summary.potPromoted = true;
      }
    }

    // 4. 浮动通告飘字提示入囊成果
    if (this.renderer && summary.itemsGiven.length > 0) {
      summary.itemsGiven.forEach((it, idx) => {
        setTimeout(() => {
          if (this.renderer) {
            this.renderer.addFloatingText(`纳宝入囊: 【${it.name}】!`, it.qualityColor || '#ffd700');
          }
        }, idx * 250);
      });
    }

    // 隐藏客卿仙印彩蛋检测：九死血魂教残血反杀
    this.checkJiusiSecretEgg(battleResult);

    this.emitStateChange();
    window.SlotsRPG.EventBus.emit('INVENTORY_CHANGE');
    return summary;
  }

  // ==========================================
  // 洞天造化秘境 Hold & Spin 业务流
  // ==========================================

  /**
   * 开启洞天造化秘境
   * @param {Array} initialHits - 触发入场的秘印位置集合
   */
  startHoldAndSpin(initialHits = []) {
    if (!this.holdAndSpinEngine) return null;
    return this.holdAndSpinEngine.startChamber(initialHits, this.currentBet || 25);
  }

  /**
   * 执行一次引灵
   */
  executeHoldAndSpinStep() {
    if (!this.holdAndSpinEngine) return null;
    return this.holdAndSpinEngine.executeRespin();
  }

  /**
   * 结算秘境全部产出并纳宝
   */
  claimHoldAndSpinRewards() {
    if (!this.holdAndSpinEngine) return null;
    const settlement = this.holdAndSpinEngine.calculateSettlement(this.level);

    // 1. 发放海量机缘
    if (settlement.totalEnergy > 0) {
      this.energy += settlement.totalEnergy;
    }

    // 2. 发放额外修为丹
    if (settlement.extraPills > 0) {
      this.inventory.addItem(window.SlotsRPG.ItemModel.createPill('exp', settlement.extraPills));
    }

    // 3. 达成全满 Grand Jackpot 额外发放仙品法宝
    if (settlement.extraEquip) {
      const hasImp = this.player.hasEquipmentImprovement(settlement.extraEquip, this.level);
      settlement.extraEquip.isNew = hasImp;
      this.inventory.addItem(settlement.extraEquip);
    }

    this.emitStateChange();
    window.SlotsRPG.EventBus.emit('INVENTORY_CHANGE');
    return settlement;
  }

  /**
   * 结算洞天秘境 · 八卦仙光跑灯奖励
   * @param {Object} prize 跑灯中奖项
   */
  claimMarqueeReward(prize) {
    if (!prize || !prize.reward) return null;
    const result = {
      energy: 0,
      pills: 0,
      runes: [],
      equip: null,
      itemsGiven: []
    };

    // 1. 机缘发放
    if (prize.reward.energy) {
      result.energy = prize.reward.energy;
      this.energy += prize.reward.energy;
    }

    // 2. 丹药发放
    if (prize.reward.pills) {
      result.pills = prize.reward.pills;
      const pillItem = window.SlotsRPG.ItemModel.createPill('exp', prize.reward.pills);
      this.inventory.addItem(pillItem);
      result.itemsGiven.push(pillItem);
    }

    // 3. 符箓发放
    if (prize.reward.rune) {
      const runeCount = prize.reward.runeCount || 1;
      const runeItem = window.SlotsRPG.ItemModel.createTalisman(prize.reward.rune, runeCount);
      this.inventory.addItem(runeItem);
      result.runes.push({ name: runeItem.name, count: runeCount });
      result.itemsGiven.push(runeItem);
    }

    // 4. 极品装备发放 (包括鸿蒙特等奖或天阶神兵/仙甲)
    if (prize.reward.equipType || prize.reward.equip) {
      let part = prize.reward.equipType;
      if (!part || part === 'random') {
        const parts = ['weapon', 'armor', 'ring', 'boots'];
        part = parts[Math.floor(Math.random() * parts.length)];
      }
      const qualityCode = prize.isGrand ? 'legendary' : 'epic';
      const eq = window.SlotsRPG.ItemModel.createEquipment(part, qualityCode);
      const hasImp = this.player.hasEquipmentImprovement(eq, this.level);
      eq.isNew = hasImp;
      this.inventory.addItem(eq);
      result.equip = eq;
      result.itemsGiven.push(eq);
    }

    this.emitStateChange();
    window.SlotsRPG.EventBus.emit('INVENTORY_CHANGE');
    if (window.SlotsRPG.StorageService) {
      window.SlotsRPG.StorageService.saveGame(this, true);
    }
    return result;
  }

  // ==========================================
  // 洞天灵脉挂机放置业务流
  // ==========================================

  /**
   * 一键引灵：收取灵泉仙鼎凝聚的所有机缘与丹药
   */
  collectCaveEarnings() {
    if (!this.caveManager) return null;
    const res = this.caveManager.collectAll();
    if (!res) return null;

    if (res.energy > 0) {
      this.energy += res.energy;
    }
    if (res.pills > 0) {
      this.inventory.addItem(window.SlotsRPG.ItemModel.createPill('exp', res.pills));
      window.SlotsRPG.EventBus.emit('INVENTORY_CHANGE');
    }

    this.emitStateChange();
    return res;
  }

  /**
   * 升级聚灵阵品阶
   */
  upgradeCaveSpiritArray() {
    if (!this.caveManager) return { success: false, reason: '灵脉未初始化' };
    const res = this.caveManager.upgradeSpiritArray(this.energy);
    if (res.success) {
      this.energy -= res.cost;
      this.emitStateChange();
    }
    return res;
  }

  /**
   * 散功重修 (彻底清除本地存档重置)
   */
  resetGameSave() {
    if (window.SlotsRPG.StorageService) {
      window.SlotsRPG.StorageService.clearSave();
    }
    window.location.reload();
  }

  // ==========================================
  // 序章：凡人采药、斩凶、觉醒与仙缘初测
  // ==========================================

  /**
   * 触发序章教学首战：后山采药除害 (对决嗜血黑鬣猪)
   */
  startPrologueBattle() {
    const boar = {
      id: 'prologue_boar',
      name: '后山恶兽 · 嗜血黑鬣猪',
      title: '后山恶兽',
      tier: 'normal',
      hp: 60,
      maxHp: 60,
      atk: 3,
      def: 0,
      avatar: 'assets/monsters/monster_boar_vivid.png',
      battleBg: 'assets/battle_bg/bg_misty_forest.jpg',
      skillName: '狂暴突撞',
      skillType: 'arm_slash',
      dropExp: 0,
      dropEnergy: 0
    };

    const encounter = {
      tier: 'normal',
      potLevel: 1,
      scatterCount: 3,
      monsters: [boar],
      totalCount: 1,
      rewards: { exp: 0, energy: 0, rewardEquip: null, rewardPill: null }
    };

    // 专属 3 回合经典决胜战局：
    // 回合 1: 柴刀劈砍 -11 (余49) -> 猪撞 -3 (主角余117)
    // 回合 2: 柴刀旋砍 -11 (余38) -> 猪撞 -3 (主角余114)
    // 回合 3: 柴刀引动天机金芒，暴击一刀毙命 -40！
    const timeline = [
      {
        round: 1,
        turn: 'player',
        actor: 'player',
        targetIndex: 0,
        targetMonster: boar,
        damage: 11,
        isCrit: false,
        skillType: 'sword_slash',
        playerHp: 120,
        playerMaxHp: 120,
        monsterHp: 49,
        monsterMaxHp: 60,
        totalEnemyHp: 49,
        totalEnemyMaxHp: 60,
        text: '🗡️ 第 1 回合：主角挥动【锈蚀柴刀】奋力劈砍，【后山恶兽 · 嗜血黑鬣猪】皮开肉绽 -11！'
      },
      {
        round: 1,
        turn: 'monster',
        actor: 'monster',
        actorIndex: 0,
        actorMonster: boar,
        damage: 3,
        isSkill: false,
        playerHp: 117,
        playerMaxHp: 120,
        totalEnemyHp: 49,
        totalEnemyMaxHp: 60,
        text: '💥【嗜血黑鬣猪】吃痛狂暴，尖锐獠牙向前突撞，主角受创 -3！'
      },
      {
        round: 2,
        turn: 'player',
        actor: 'player',
        targetIndex: 0,
        targetMonster: boar,
        damage: 11,
        isCrit: false,
        skillType: 'sword_slash',
        playerHp: 117,
        playerMaxHp: 120,
        monsterHp: 38,
        monsterMaxHp: 60,
        totalEnemyHp: 38,
        totalEnemyMaxHp: 60,
        text: '🗡️ 第 2 回合：主角借势旋身再砍一刀，黑鬣猪鬃毛撕裂 -11！'
      },
      {
        round: 2,
        turn: 'monster',
        actor: 'monster',
        actorIndex: 0,
        actorMonster: boar,
        damage: 3,
        isSkill: false,
        playerHp: 114,
        playerMaxHp: 120,
        totalEnemyHp: 38,
        totalEnemyMaxHp: 60,
        text: '💥【嗜血黑鬣猪】双目赤红，猛烈撞击主角胸腹 -3！'
      },
      {
        round: 3,
        turn: 'player',
        actor: 'player',
        targetIndex: 0,
        targetMonster: boar,
        damage: 40,
        isCrit: true,
        skillType: 'wanjian_guizong',
        playerHp: 114,
        playerMaxHp: 120,
        monsterHp: 0,
        monsterMaxHp: 60,
        totalEnemyHp: 0,
        totalEnemyMaxHp: 60,
        text: '⚡ 第 3 回合：生死一线！锈蚀柴刀引动一缕神秘古朴金芒，会心暴击一刀毙命 -40！'
      },
      {
        round: 3,
        type: 'monster_defeated',
        monsterIndex: 0,
        monster: boar,
        remainingCount: 0,
        totalEnemyHp: 0,
        totalEnemyMaxHp: 60,
        text: '💥 恶兽悲鸣一声轰然倒地！【后山恶兽 · 嗜血黑鬣猪】已被斩灭！'
      }
    ];

    const battleResult = {
      isVictory: true,
      isPrologueBattle: true,
      finalRound: 3,
      totalRounds: 3,
      timeline,
      itemsUsed: [],
      playerStartStats: { hp: 120, atk: 11, def: 2 },
      playerFinalHp: 114,
      encounter,
      boss: boar,
      rewards: {
        exp: 20,
        energy: 0,
        rewardEquip: null,
        rewardPill: null,
        artifactItem: {
          id: 'ITEM_TIANJI_PLATE',
          type: 'special',
          part: 'artifact',
          baseName: '造化天机盘',
          name: '【造化天机盘】',
          qualityCode: 'Q5',
          qualityName: '造化古宝',
          qualityColor: '#ffd700',
          icon: 'assets/symbols/SYM_13.png',
          desc: '自凶兽腹中剖出的青铜八卦残盘，表面刻满古老玄奥的天道神纹...【点击使用，探查玄机】',
          isNew: true,
          isArtifactPlate: true
        }
      }
    };

    // 将掉落的【造化天机盘】存入乾坤袋背包，引导玩家点击使用
    const tianjiArtifact = {
      id: 'ITEM_TIANJI_PLATE',
      type: 'special',
      part: 'artifact',
      baseName: '造化天机盘',
      name: '【造化天机盘】',
      qualityCode: 'Q5',
      qualityName: '造化古宝',
      qualityColor: '#ffd700',
      icon: 'assets/symbols/SYM_13.png',
      desc: '自凶兽腹中剖出的青铜八卦残盘，表面刻满古老玄奥的天道神纹...【点击使用，探查玄机】',
      isNew: true,
      isArtifactPlate: true
    };
    if (this.inventory) {
      this.inventory.addItem(tianjiArtifact);
    }

    this.currentBattle = battleResult;
    this.prologueStep = 1; // 处于首战交锋中，切勿提前推进至斩猪完成
    if (window.SlotsRPG.StorageService) {
      window.SlotsRPG.StorageService.saveGame(this, true);
    }
    this.emitStateChange();

    return battleResult;
  }

  /**
   * 玩家在乾坤袋中点击【造化天机盘】触发觉醒认主
   * @param {Object} [item]
   */
  awakenTianjiPlateFromBag(item) {
    if (this.inventory) {
      const itemId = (item && item.id) ? item.id : 'ITEM_TIANJI_PLATE';
      const slotIndex = this.inventory.slots.findIndex(s => s && s.id === itemId);
      if (slotIndex >= 0) {
        this.inventory.slots[slotIndex] = null;
      }
    }
    this.energy += 100; // 赠送启动灵机 100 点
    this.prologueStep = 3; // 开启山野散修初探教学 (前 5 抽小闭环，第 6 抽仙门递牒)
    this.prologueSpins = 0; // 重置已推演抽数
    if (window.SlotsRPG.StorageService) {
      window.SlotsRPG.StorageService.saveGame(this, true);
    }
    this.emitStateChange();
    window.SlotsRPG.EventBus.emit('ARTIFACT_AWAKENED', { energyGained: 100 });
    return { energyGained: 100 };
  }

  /**
   * 触发作弊器天机盘觉醒认主 (兼容旧接口)
   */
  triggerArtifactAwakening() {
    return this.awakenTianjiPlateFromBag();
  }

  /**
   * 获取叩问仙门宗门推荐 (序章硬锁定五行之首【万剑仙宗】单宗门)
   */
  getRandomSectOptions() {
    const sectConfig = window.SlotsRPG && window.SlotsRPG.SectConfig;
    if (!sectConfig) return [];

    // 1. 序章与首世：正统玄门【万剑仙宗】 vs 外道旁门【万通商行】二选一 (PRD 3.1 节)
    if (!this.isPrologueComplete || this.prologueStep <= 3) {
      const candidateIds = (window.SlotsRPG && window.SlotsRPG.GameBalanceConfig && window.SlotsRPG.GameBalanceConfig.FTUESequence && window.SlotsRPG.GameBalanceConfig.FTUESequence.candidateSects) || ['wanjian', 'wantong'];
      const sects = candidateIds.map(id => sectConfig.getSect(id)).filter(Boolean);
      return sects.length > 0 ? sects : [sectConfig.getSect('wanjian')];
    }

    // 2. 后续由击败守关妖王掉落的门票驱动
    if (this.unlockedSectTicket && this.unlockedSectTicket.sectId) {
      const s = sectConfig.getSect(this.unlockedSectTicket.sectId);
      if (s) return [s];
    }

    const uncollectedIds = this.ascensionManager ? this.ascensionManager.getUncollectedTrueSects() : [];
    if (uncollectedIds.length > 0) {
      const picked = sectConfig.getSect(uncollectedIds[0]);
      if (picked) return [picked];
    }

    return [sectConfig.getSect('wanjian')];
  }

  /**
   * 【妖王试炼大捷】守关妖王与神装大圆满，掉落下一宗门入场券 (充要条件：击败妖王 + 6槽Q4紫品法器神装)
   * @param {boolean} force - 是否强制必定掉落 (测试或首通使用)
   */
  stealSectTicketWithCheat(force = false) {
    if (!this.ascensionManager || !window.SlotsRPG.SectConfig) return null;
    if (this.unlockedSectTicket) return this.unlockedSectTicket; // 已拥有门票则无需重复掉落

    const fullSet = this.player ? this.player.checkFullSetEquipped('Q4') : null;
    const isGraduated = fullSet && fullSet.isGraduated;

    // 绝对铁律门槛：必须同时满足【击败守关妖王】并且【全身6槽全套顶级装备(Q4紫品法器神装)大圆满】！
    // 无论任何情况，绝不能出现提前获得门票的情况！
    if (!this.hasDefeatedSectBoss || !isGraduated) {
      return null;
    }

    this.bossTicketAttempts = 0; // 成功爆出，保底清零
    const sectConfig = window.SlotsRPG.SectConfig;

    // 1. 优先从尚未收集残卷的五大正统道脉中寻找 (排除当前门派)
    const curSectId = this.player ? this.player.currentSect : null;
    const uncollectedTrueIds = this.ascensionManager.getUncollectedTrueSects()
      .filter(id => id !== curSectId);

    let targetSectId = null;
    if (uncollectedTrueIds.length > 0) {
      targetSectId = uncollectedTrueIds[Math.floor(Math.random() * uncollectedTrueIds.length)];
    } else {
      // 若正统宗门已全部收集，从其他正统门派中挑选不同于当前的
      const trueSects = sectConfig.getTrueSects();
      const others = trueSects.filter(s => s.id !== curSectId);
      targetSectId = (others.length > 0 ? others : trueSects)[Math.floor(Math.random() * (others.length > 0 ? others.length : trueSects.length))].id;
    }

    const targetSect = sectConfig.getSect(targetSectId);
    if (!targetSect) return null;

    const ticket = {
      sectId: targetSect.id,
      sectName: targetSect.name,
      tokenName: targetSect.tokenName,
      tokenIcon: targetSect.tokenIcon,
      elementName: targetSect.elementName || '道',
      badge: targetSect.badge || '真传',
      desc: targetSect.tokenDesc || `手持此令，转世可直接拜入【${targetSect.name}】！`
    };

    this.unlockedSectTicket = ticket;

    // 立即持久化
    if (window.SlotsRPG.StorageService) {
      window.SlotsRPG.StorageService.saveGame(this, true);
    }

    // 触发作弊器截获门票广播与仙道传音
    window.SlotsRPG.EventBus.emit('CHEAT_TICKET_ACQUIRED', {
      ticket,
      previousSect: curSectId,
      quote: `【天机作弊器】：“叮！妖王陨落，六道神装大圆满！天道壁垒碎裂，本作弊器成功截获一枚【${targetSect.name}】真传法牒！宿主可随时在角色面板兵解转生，入新门派重修！”`
    });

    return ticket;
  }

  /**
   * 触发【万通商行】绝境救济彩蛋：机缘归零且救济耗尽时触发
   */
  checkWantongSecretEgg() {
    if (this.energy <= 0 && this.freeReliefCount <= 0) {
      if (this.ascensionManager && (!this.ascensionManager.meta.hiddenMarks || !this.ascensionManager.meta.hiddenMarks.wantong)) {
        const mark = this.ascensionManager.unlockHiddenMark('wantong');
        this.energy += 200; // 破空救济赠送 200 灵机
        window.SlotsRPG.EventBus.emit('CHEAT_DIALOG_TRIGGER', {
          title: '【天无绝人之路 · 万通商行】',
          speaker: '万通大掌柜',
          text: '“哈哈！天无绝人之路！见道友仙资不凡却困于灵机，本作弊器破空引渡万通商会，特赠道友 200 灵机解燃眉之急！并赐予【万通·富甲诸天印】，往后推演常得天降金元！”'
        });
        if (this.renderer) {
          this.renderer.addFloatingText('绝境奇遇！万通商行破空救济 +200灵机！', '#ffd700');
        }
        this.emitStateChange();
      }
    }
  }

  /**
   * 触发【钦天监】因果逆转彩蛋：连续 8 次未中奖空转时触发
   */
  checkQintianSecretEgg() {
    if ((this.consecutiveEmptySpins || 0) >= 8) {
      if (this.ascensionManager && (!this.ascensionManager.meta.hiddenMarks || !this.ascensionManager.meta.hiddenMarks.qintian)) {
        const mark = this.ascensionManager.unlockHiddenMark('qintian');
        this.consecutiveEmptySpins = 0;
        window.SlotsRPG.EventBus.emit('CHEAT_DIALOG_TRIGGER', {
          title: '【天地逆乱 · 窥破星宿】',
          speaker: '钦天监正',
          text: '“数次空转，非道友运数不济，实乃天机遮蔽！本作弊器借此逆乱因果助道友窥破钦天星象！赐予【钦天·观星逆命印】，往后大战若逢致命劫数，可引动星斗时光倒流免死一次！”'
        });
        if (this.renderer) {
          this.renderer.addFloatingText('绝境奇遇！窥破天机获【钦天·观星逆命印】！', '#bb9af7');
        }
      }
    }
  }

  /**
   * 触发【九死血魂教】绝地反杀彩蛋：击败守关 Boss 时玩家血量 <= 15% 触发
   */
  checkJiusiSecretEgg(battleResult) {
    if (!battleResult || !battleResult.isVictory) return;
    const p = this.player;
    if (!p) return;
    const curHp = typeof battleResult.finalPlayerHp === 'number' ? battleResult.finalPlayerHp : p.currentHp;
    const maxHp = p.getTotalStats().hp;
    if (curHp > 0 && curHp <= maxHp * 0.15) {
      if (this.ascensionManager && (!this.ascensionManager.meta.hiddenMarks || !this.ascensionManager.meta.hiddenMarks.jiusi)) {
        const mark = this.ascensionManager.unlockHiddenMark('jiusi');
        window.SlotsRPG.EventBus.emit('CHEAT_DIALOG_TRIGGER', {
          title: '【绝地逆杀 · 魔门觉醒】',
          speaker: '九死血魔尊',
          text: '“痛快！丝血搏命，反杀妖王！骨子里的嗜血杀意正是九幽血道最纯正的仙苗！本作弊器顺应天命引动血海狂潮，赐予【九死·万劫不灭印】，往后凡伤敌者，皆可化伤为血生生不息！”'
        });
        if (this.renderer) {
          this.renderer.addFloatingText('绝境奇遇！残血反杀获【九死·万劫不灭印】！', '#ff416c');
        }
      }
    }
  }

  /**
   * 散功坐化 / 轮回转世 (PRD 6.1 逃生通道与长线轮回)
   * @param {string} cause - 'nirvana' (自愿坐化) 或 'breakthrough' (大捷转世) 或 'ascend' (飞升)
   * @param {string} targetSectId - 指定转入宗门 ID (来自门票)
   */
  attemptSamsara(cause = 'nirvana', targetSectId = null) {
    if (!this.ascensionManager) return null;
    const destSectId = targetSectId || (this.unlockedSectTicket ? this.unlockedSectTicket.sectId : null);

    if (!destSectId && cause === 'nirvana' && this.player.level < 5) {
      if (this.renderer) {
        this.renderer.addFloatingText('道行尚浅 (需练气五层以上) 方可参悟生死坐化转生！', '#f87171');
      }
      return { success: false, reason: '需练气五层以上' };
    }

    const res = this.ascensionManager.reincarnate({
      cause,
      isAscension: cause === 'ascend',
      targetSectId: destSectId
    });

    this.sectTrialStage = 1;
    this.trialBestDamagePct = 0;
    this.lockedSectBossSnapshot = null;
    this.hasDefeatedSectBoss = false;

    const destSect = destSectId && window.SlotsRPG.SectConfig ? window.SlotsRPG.SectConfig.getSect(destSectId) : null;
    window.SlotsRPG.EventBus.emit('SAMSARA_COMPLETED', {
      cause,
      targetSectId: destSectId,
      sectName: destSect ? destSect.name : '新仙门',
      settlement: res
    });

    return { success: true, settlement: res };
  }

  /**
   * 叩问仙门：玩家选定宗门拜入，结业序章进入修仙大世界
   * @param {string} sectId - 宗门 ID
   */
  completeSectInduction(sectId) {
    this.player.promoteToCultivator(sectId);
    this.isPrologueComplete = true;
    this.prologueStep = 4;
    this.sectTrialStage = 1;
    this.trialBestDamagePct = 0;
    this.lockedSectBossSnapshot = null;
    this.hasDefeatedSectBoss = false;
    this.ensureLockedSectBossSnapshot();

    // 开启洞天灵脉
    if (this.caveManager) {
      this.caveManager.init();
    }

    if (window.SlotsRPG.StorageService) {
      window.SlotsRPG.StorageService.saveGame(this, true);
    }

    this.emitStateChange();
    window.SlotsRPG.EventBus.emit('PROLOGUE_COMPLETED', { sectId });
  }

  /**
   * PRD 10.5 节: 随机吐出修仙网文弹幕吐槽
   * @param {string} category - 'idle'|'win'|'boss'|'mortal'|'ascension'
   */
  getRandomChatter(category = 'idle') {
    const list = this.CHATTER_QUOTES[category] || this.CHATTER_QUOTES.idle;
    const text = list[Math.floor(Math.random() * list.length)];
    window.SlotsRPG.EventBus.emit('CHATTER_UPDATED', { text, category });
    return text;
  }

  /**
   * PRD 10.4 节: 自动推演【高光智能停机】保护阀
   * @param {Object} evaluation - 转盘结算结果
   */
  checkSmartStop(evaluation) {
    if (!this.isAutoSpinning || !evaluation) return false;

    let shouldStop = false;
    let reason = '';

    // 遭遇妖兽伏妖时挂起自动推演 (战毕后自动恢复维持旋转)；遭遇洞天秘境时主动停机保护
    if (evaluation.hasTriggeredBattle || (evaluation.scatterCount && evaluation.scatterCount >= 3)) {
      this.suspendAutoSpinForBattle();
      if (this.renderer) {
        this.renderer.addFloatingText('【天机遭遇】妖兽降临！伏妖战毕后将自动维持推演', '#ffd700');
      }
      window.SlotsRPG.EventBus.emit('SMART_STOP_TRIGGERED', { reason: '⚡ 感应到高阶妖兽围攻！' });
      return true;
    } else if (evaluation.hasTriggeredBonus || (evaluation.bonusCount && evaluation.bonusCount >= 5)) {
      this.suspendAutoSpinForBonus();
      if (this.renderer) {
        this.renderer.addFloatingText('【洞天共鸣】造化秘境开启！秘境毕后将自动维持推演', '#34e89e');
      }
      window.SlotsRPG.EventBus.emit('SMART_STOP_TRIGGERED', { reason: '✨ 洞天造化秘境现世！' });
      return true;
    }
    return false;
  }

  /**
   * PRD 10.4 节: 转盘界面【洞天灵气浮泡】一键收菜
   */
  collectCaveBubble() {
    if (!this.caveManager) return 0;
    const energy = this.caveManager.collectEnergyOnly();
    if (energy > 0) {
      this.energy += energy;
      this.emitStateChange();
      window.SlotsRPG.EventBus.emit('CAVE_BUBBLE_COLLECTED', { energy });
      if (this.renderer) {
        this.renderer.addFloatingText(`洞天引灵 +${energy} 机缘！`, '#34e89e');
      }
    }
    return energy;
  }

  /**
   * PRD 6.2 节 & 9.2 节: 机缘枯竭时的【打坐吐纳】绝对兜底
   * 恢复 30 点灵机
   * @param {Function} onComplete 
   * @param {boolean} instant - 是否瞬时完成
   */
  meditateForEnergy(onComplete, instant = false) {
    if (!this.adService) {
      this.energy += 30;
      this.emitStateChange();
      if (onComplete) onComplete({ success: true, energyRestored: 30 });
      return;
    }

    this.adService.meditate(res => {
      this.energy += 30;
      this.emitStateChange();
      if (this.renderer) {
        this.renderer.addFloatingText('吐纳聚气完成，恢复 +30 机缘！', '#ffd700');
      }
      if (onComplete) onComplete({ success: true, energyRestored: 30 });
    }, instant);
  }

  /**
   * 叩关白日飞升 (PRD 4.3 节)
   */
  ascendToSpiritRealm() {
    if (!this.ascensionManager) return { success: false, reason: '未就绪' };
    const res = this.ascensionManager.ascendToSpiritRealm();
    if (res && res.success) {
      window.SlotsRPG.EventBus.emit('ASCENSION_COMPLETED', res);
    }
    return res;
  }
}

window.SlotsRPG.GameManager = new GameManager();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.SlotsRPG.GameManager;
}
