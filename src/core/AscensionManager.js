/**
 * AscensionManager.js - 升仙天碑、飞升解谜与九转轮回总控器
 * 严格遵循 PRD_剧情与轮回宗门系统规格书 第 4、5、6 章规范：
 * 1. 升仙天碑五卷归一 (Ascension Stele 5/5)
 * 2. 永久被动心法属性复利叠乘
 * 3. 跨轮回神魂永存 (Meta Progression: 传家宝、门派精魄、功德池、寻龙盘)
 * 4. 散功坐化防死锁逃生通道与白日飞升世界跃迁
 */
window.SlotsRPG = window.SlotsRPG || {};

class AscensionManager {
  constructor(gameManager = null) {
    this.gameManager = gameManager;

    // 跨世资产 (Meta Progression)
    this.meta = {
      samsaraCount: 1,                 // 轮回世数 (第1世开始)
      collectedShards: [],             // 已点亮的飞升残卷 ID 集合 ['shard_metal', ...]
      masteredSects: [],               // 已通关宗门精魄集合 ['wanjian', ...]
      heirloomItems: [],               // 万通商行跨世传家宝 [weapon, armor]
      guaranteedNextSect: null,        // 钦天监寻龙盘定向宗门 ID
      karmaPoints: 0,                  // 轮回累积功德点
      legacyStats: { hp: 0, atk: 0, def: 0 }, // 先天道基 (保留前世净基础属性 100%)
      sectArchives: {},                // 天碑英灵殿宗门神装档案库 { [sectId]: { sectId, sectName, element, completedAtSamsara, combatPower, stats, equipment, sealStatus } }
      hiddenMarks: {}                  // 隐世奇遇客卿仙印库 { [hiddenSectId]: { acquired: true, acquiredAt, name, desc } }
    };

    // 飞升天碑 5 大正统真卷基础定义
    this.SHARD_DEFINITIONS = {
      shard_metal: {
        id: 'shard_metal',
        element: '金',
        name: '【混元飞升经 · 剑破天门篇】',
        shortName: '金 · 剑破天门',
        sectId: 'wanjian',
        sectName: '万剑仙宗',
        color: '#e0af68',
        icon: 'assets/ascension/shard_metal.png',
        buffDesc: '永久攻击 +5%',
        modifiers: { atkRate: 0.05 },
        clue: '唯有一柄飞剑开天门者方能感悟，需拜入【万剑仙宗】并通关大捷方能显现。'
      },
      shard_wood: {
        id: 'shard_wood',
        element: '木',
        name: '【混元飞升经 · 九转仙魄篇】',
        shortName: '木 · 九转仙魄',
        sectId: 'taiyi',
        sectName: '太乙丹霞宗',
        color: '#34e89e',
        icon: 'assets/ascension/shard_wood.png',
        buffDesc: '永久气血 +8%',
        modifiers: { hpRate: 0.08 },
        clue: '采天地奇花融万药真灵，需拜入【太乙丹霞宗】温养金丹通关大捷方可凝聚。'
      },
      shard_water: {
        id: 'shard_water',
        element: '水',
        name: '【混元飞升经 · 百灵化神篇】',
        shortName: '水 · 百灵化神',
        sectId: 'yushou',
        sectName: '御兽玄机门',
        color: '#7aa2f7',
        icon: 'assets/ascension/shard_water.png',
        buffDesc: '永久全属性 +6%',
        modifiers: { hpRate: 0.06, atkRate: 0.06, defRate: 0.06 },
        clue: '御万兽者心神合一，需拜入【御兽玄机门】驾驭灵兽通关大捷方能通晓。'
      },
      shard_earth: {
        id: 'shard_earth',
        element: '土',
        name: '【混元飞升经 · 周天星斗篇】',
        shortName: '土 · 周天星斗',
        sectId: 'tianji',
        sectName: '天机神阵门',
        color: '#e5c07b',
        icon: 'assets/ascension/shard_earth.png',
        buffDesc: '永久防御 +8%',
        modifiers: { defRate: 0.08 },
        clue: '八卦奇门借天地山川厚土，需拜入【天机神阵门】布阵御敌大捷方可获悉。'
      },
      shard_fire: {
        id: 'shard_fire',
        element: '火',
        name: '【混元飞升经 · 涅槃焚天篇】',
        shortName: '火 · 涅槃焚天',
        sectId: 'fen_tian',
        sectName: '焚天九幽道',
        color: '#ff416c',
        icon: 'assets/ascension/shard_fire.png',
        buffDesc: '永久暴击率 +3%',
        modifiers: { critRateBonus: 0.03 },
        clue: '逆命向死而生焚灭虚妄，需拜入【焚天九幽道】孤勇绝杀大捷方能传承。'
      }
    };
  }

  /**
   * 获取升仙天碑 5 卷的完整状态
   */
  getShardsStatus() {
    const list = [];
    for (const id in this.SHARD_DEFINITIONS) {
      const def = this.SHARD_DEFINITIONS[id];
      const isCollected = this.meta.collectedShards.includes(id);
      list.push({
        ...def,
        isCollected
      });
    }
    return list;
  }

  /**
   * 当前已收集飞升残卷数量 (X / 5)
   */
  get collectedCount() {
    return this.meta.collectedShards.length;
  }

  /**
   * 判定五行 5 大正统宗门神装是否全部封神归位 (5/5)
   */
  isFiveElementsGathered() {
    const trueSects = ['wanjian', 'taiyi', 'yushou', 'tianji', 'fen_tian'];
    const archives = this.meta.sectArchives || {};
    return trueSects.every(id => archives[id] && archives[id].sealStatus === 'consecrated');
  }

  /**
   * 判定是否达成白日飞升总条件 (天碑 5 卷真经齐聚 + 五行宗门法相全归位)
   */
  isAscensionReady() {
    const shardsReady = this.meta.collectedShards.length >= 5;
    const archivesReady = this.isFiveElementsGathered();
    return shardsReady && archivesReady;
  }

  /**
   * 将当前门派穿戴装备、结算战力与属性完整封存至天碑宗门法相殿 (英灵殿)
   * @param {string} sectId - 宗门ID
   * @param {Object} equipment - 角色当前穿戴装备字典
   * @param {Object} totalStats - 角色总属性
   * @param {number} combatPower - 角色总战力
   */
  archiveSectEquipment(sectId, equipment, totalStats, combatPower) {
    if (!sectId) return null;
    if (!this.meta.sectArchives) this.meta.sectArchives = {};

    const sectCfg = window.SlotsRPG && window.SlotsRPG.SectConfig ? window.SlotsRPG.SectConfig.getSect(sectId) : null;
    const sectName = sectCfg ? sectCfg.name : sectId;
    const element = sectCfg ? (sectCfg.elementName || sectCfg.element || '道') : '道';

    const equipCopy = {};
    if (equipment) {
      for (const part in equipment) {
        if (equipment[part]) {
          equipCopy[part] = JSON.parse(JSON.stringify(equipment[part]));
        } else {
          equipCopy[part] = null;
        }
      }
    }

    const archiveEntry = {
      sectId,
      sectName,
      element,
      completedAtSamsara: this.meta.samsaraCount,
      combatPower: combatPower || (this.gameManager && this.gameManager.player ? this.gameManager.player.combatPower : 0),
      stats: totalStats ? { ...totalStats } : (this.gameManager && this.gameManager.player ? this.gameManager.player.getTotalStats() : { hp: 100, atk: 20, def: 10 }),
      equipment: equipCopy,
      sealStatus: 'consecrated'
    };

    this.meta.sectArchives[sectId] = archiveEntry;

    // 同步点亮该门派对应的飞升真卷 (若有)
    if (sectCfg && sectCfg.shardId) {
      this.unlockShard(sectCfg.shardId);
    }

    if (this.gameManager && window.SlotsRPG.StorageService) {
      window.SlotsRPG.StorageService.saveGame(this.gameManager, true);
    }

    window.SlotsRPG.EventBus.emit('SECT_ARCHIVED', archiveEntry);
    return archiveEntry;
  }

  /**
   * 激活并吸纳隐藏奇遇门派的专属客卿仙印
   * @param {string} hiddenSectId - 'wantong' | 'jiusi' | 'qintian'
   * @returns {Object} 仙印结果
   */
  unlockHiddenMark(hiddenSectId) {
    if (!hiddenSectId) return null;
    if (!this.meta.hiddenMarks) this.meta.hiddenMarks = {};

    const definitions = {
      wantong: {
        id: 'wantong',
        name: '万通·富甲诸天印',
        sectName: '万通多宝商行',
        icon: 'assets/sects/tokens/token_merchant.png',
        desc: '天机盘推演每10次天降元宝返还100灵机；基础攻击永久+15%',
        modifiers: { atkRate: 0.15 }
      },
      jiusi: {
        id: 'jiusi',
        name: '九死·万劫不灭印',
        sectName: '九死血魂魔教',
        icon: 'assets/sects/tokens/token_fire.png',
        desc: '攻击伤害20%转化为吸血恢复自身；暴击率永久+15%',
        modifiers: { critRateBonus: 0.15, lifestealRate: 0.20 }
      },
      qintian: {
        id: 'qintian',
        name: '钦天·观星逆命印',
        sectName: '钦天观星监',
        icon: 'assets/sects/tokens/token_array.png',
        desc: '挑战Boss阵亡时触发1次时光倒流满血复活；全装备防御永久+20%',
        modifiers: { defRate: 0.20, reviveCount: 1 }
      }
    };

    const def = definitions[hiddenSectId];
    if (!def) return null;

    const isNew = !this.meta.hiddenMarks[hiddenSectId];
    this.meta.hiddenMarks[hiddenSectId] = {
      ...def,
      acquiredAt: Date.now()
    };

    if (this.gameManager && window.SlotsRPG.StorageService) {
      window.SlotsRPG.StorageService.saveGame(this.gameManager, true);
    }

    window.SlotsRPG.EventBus.emit('HIDDEN_MARK_UNLOCKED', {
      mark: this.meta.hiddenMarks[hiddenSectId],
      isNew,
      totalMarks: Object.keys(this.meta.hiddenMarks).length
    });

    return this.meta.hiddenMarks[hiddenSectId];
  }

  /**
   * 点亮激活一块飞升残卷
   * @param {string} shardId 
   * @returns {Object} { success, shard, isNew, allComplete }
   */
  unlockShard(shardId) {
    const def = this.SHARD_DEFINITIONS[shardId];
    if (!def) return { success: false, reason: '残卷不存在' };

    const isNew = !this.meta.collectedShards.includes(shardId);
    if (isNew) {
      this.meta.collectedShards.push(shardId);
      if (this.gameManager && window.SlotsRPG.StorageService) {
        window.SlotsRPG.StorageService.saveGame(this.gameManager, true);
      }
      window.SlotsRPG.EventBus.emit('SHARD_UNLOCKED', {
        shard: def,
        collectedCount: this.collectedCount,
        allComplete: this.isAscensionReady()
      });
    }

    return {
      success: true,
      shard: def,
      isNew,
      allComplete: this.isAscensionReady()
    };
  }

  /**
   * 汇总天碑残卷、通关宗门精魄与隐藏奇遇仙印赋予角色的永久被动属性修正
   */
  getPermanentModifiers() {
    const mods = {
      hpRate: 0,
      atkRate: 0,
      defRate: 0,
      critRateBonus: 0,
      lifestealRate: 0,
      reviveCount: 0
    };

    // 1. 飞升天碑已收集残卷加成
    this.meta.collectedShards.forEach(sId => {
      const def = this.SHARD_DEFINITIONS[sId];
      if (def && def.modifiers) {
        if (def.modifiers.hpRate) mods.hpRate += def.modifiers.hpRate;
        if (def.modifiers.atkRate) mods.atkRate += def.modifiers.atkRate;
        if (def.modifiers.defRate) mods.defRate += def.modifiers.defRate;
        if (def.modifiers.critRateBonus) mods.critRateBonus += def.modifiers.critRateBonus;
      }
    });

    // 2. 宗门通关精魄加成
    this.meta.masteredSects.forEach(sectId => {
      if (sectId === 'wanjian') mods.atkRate += 0.02;
      else if (sectId === 'taiyi') mods.hpRate += 0.03;
      else if (sectId === 'yushou') { mods.atkRate += 0.01; mods.hpRate += 0.01; }
      else if (sectId === 'tianji') mods.defRate += 0.03;
      else if (sectId === 'fen_tian') mods.critRateBonus += 0.01;
      else if (sectId === 'wantong') mods.atkRate += 0.01;
      else if (sectId === 'qintian') mods.defRate += 0.01;
      else if (sectId === 'jiusi') mods.atkRate += 0.02;
    });

    // 3. 隐藏奇遇客卿仙印逆天加成
    const marks = this.meta.hiddenMarks || {};
    if (marks.wantong) {
      mods.atkRate += 0.15;
    }
    if (marks.jiusi) {
      mods.critRateBonus += 0.15;
      mods.lifestealRate += 0.20;
    }
    if (marks.qintian) {
      mods.defRate += 0.20;
      mods.reviveCount += 1;
    }

    // 4. 三大隐藏仙印齐聚激活【三界逆命仙尊】光环 (全属性额外+10%)
    if (marks.wantong && marks.jiusi && marks.qintian) {
      mods.hpRate += 0.10;
      mods.atkRate += 0.10;
      mods.defRate += 0.10;
    }

    return mods;
  }

  /**
   * 封存万通商行传家宝 (最多 1 武器 + 1 衣服，自动覆盖旧传家宝)
   * @param {Object} equipItem 
   */
  saveHeirloom(equipItem) {
    if (!equipItem || equipItem.type !== 'equip') return false;
    const part = equipItem.part;
    if (part !== 'weapon' && part !== 'armor') return false;

    // 清理同部位旧传家宝并放入新传家宝
    this.meta.heirloomItems = this.meta.heirloomItems.filter(it => it.part !== part);
    // 深拷贝保存
    this.meta.heirloomItems.push(JSON.parse(JSON.stringify(equipItem)));

    if (this.gameManager && window.SlotsRPG.StorageService) {
      window.SlotsRPG.StorageService.saveGame(this.gameManager, true);
    }
    return true;
  }

  /**
   * 设定钦天监寻龙盘预选宗门
   */
  setGuaranteedNextSect(sectId) {
    this.meta.guaranteedNextSect = sectId;
    if (this.gameManager && window.SlotsRPG.StorageService) {
      window.SlotsRPG.StorageService.saveGame(this.gameManager, true);
    }
  }

  /**
   * 获取尚未收集的五大正统残卷对应宗门列表 (防卡碎片算法使用)
   */
  getUncollectedTrueSects() {
    const uncollected = [];
    for (const sId in this.SHARD_DEFINITIONS) {
      if (!this.meta.collectedShards.includes(sId)) {
        uncollected.push(this.SHARD_DEFINITIONS[sId].sectId);
      }
    }
    return uncollected;
  }

  /**
   * 计算当前轮回兵解可折算的功德点
   * 基础功德 = 等级 * 10 + 聚宝盆阶数 * 40 + 战力 / 10
   */
  calculateKarmaGain(gm = this.gameManager) {
    if (!gm) return 10;
    const p = gm.player;
    const lvl = p ? p.level : 1;
    const pot = gm.level || 1;
    const power = p ? p.combatPower : 18;
    const base = Math.floor(lvl * 10 + pot * 40 + power * 0.1);
    return Math.max(10, base);
  }

  /**
   * 叩开天门 · 白日飞升跃迁至【灵界 · 飘渺仙域】 (PRD 4.3 节 & 6.1-Rule 3)
   */
  ascendToSpiritRealm(force = false) {
    const gm = this.gameManager;
    if (!gm) return { success: false, reason: 'GameManager 未初始化' };

    if (!force && !this.isAscensionReady()) {
      return { success: false, reason: '天碑 5 卷真经未集齐，仙门未开！' };
    }

    // 1. 世界阶位跃迁
    gm.currentWorldTier = 2;

    // 2. 角色晋升为灵界大能 (化神初期)
    gm.player.promoteToSoulFormation();

    // 3. 洞天灵脉升级为【鸿蒙浮岛 · 星天仙阙】
    if (gm.caveManager) {
      gm.caveManager.worldTier = 2;
    }

    // 4. 重置灵界 12 重通天试炼进度
    gm.sectTrialStage = 1;
    gm.hasDefeatedSectBoss = false;
    gm.lockedSectBossSnapshot = null;
    gm.trialBestDamagePct = 0;

    // 5. 赠送 5 张【天机瞬发符】大里程碑奖励 (PRD 9.3 节)
    if (window.SlotsRPG && window.SlotsRPG.AdService) {
      window.SlotsRPG.AdService.grantMilestoneTickets(5, '叩关白日飞升壮举');
    }

    // 6. 立即持久化
    if (window.SlotsRPG.StorageService) {
      window.SlotsRPG.StorageService.saveGame(gm, true);
    }

    const payload = {
      worldTier: 2,
      realmName: gm.player.realmName,
      stats: gm.player.getTotalStats(),
      combatPower: gm.player.combatPower
    };

    window.SlotsRPG.EventBus.emit('ASCENSION_WORLD_TIER_UP', payload);
    gm.emitStateChange();

    return { success: true, ...payload };
  }

  /**
   * 装备跨门派神装转化：保持原有品质 Q1~Q7、属性、战力不减，转为新宗门专属法宝
   * @param {Object} currentEquipment 
   * @param {string} targetSectId 
   */
  convertEquipmentsToSect(currentEquipment, targetSectId) {
    if (!currentEquipment || !targetSectId) return currentEquipment;
    const sectCfg = window.SlotsRPG && window.SlotsRPG.SectConfig ? window.SlotsRPG.SectConfig.getSect(targetSectId) : null;
    const sectName = sectCfg ? sectCfg.name : targetSectId;
    const converted = {};

    for (const slot in currentEquipment) {
      const item = currentEquipment[slot];
      if (!item) {
        converted[slot] = null;
        continue;
      }
      const newItem = JSON.parse(JSON.stringify(item));
      const tmpl = window.SlotsRPG && window.SlotsRPG.SectConfig
        ? window.SlotsRPG.SectConfig.getSectEquipTemplate(targetSectId, slot)
        : null;

      if (tmpl) {
        newItem.baseName = tmpl.name;
        newItem.name = `${newItem.qualityName || '凡铁'}·${tmpl.name}`;
        if (tmpl.icon) newItem.icon = tmpl.icon;
        newItem.sectId = targetSectId;
        newItem.sectName = sectName;
        newItem.element = tmpl.element || null;
      }
      converted[slot] = newItem;
    }
    return converted;
  }

  /**
   * 执行九转轮回 / 兵解转世
   * @param {Object} options - { isAscension, cause: 'breakthrough'|'nirvana'|'ascend', targetSectId: string }
   */
  reincarnate(options = {}) {
    const gm = this.gameManager;
    if (!gm) return null;

    if (options.cause === 'ascend') {
      return this.ascendToSpiritRealm();
    }

    const isAscension = !!options.isAscension;
    const karmaGain = this.calculateKarmaGain(gm);
    this.meta.karmaPoints += karmaGain;

    // 0. 旧门派装备与战力全套归档至【天碑英灵殿法相】
    const curSect = gm.player ? gm.player.currentSect : null;
    let archivedEntry = null;
    if (curSect && gm.player && gm.player.equipment) {
      archivedEntry = this.archiveSectEquipment(
        curSect,
        gm.player.equipment,
        gm.player.getTotalStats(),
        gm.player.combatPower
      );
    }

    // 若当前门派尚未精通且达标通关，记录宗门精魄
    if (curSect && !this.meta.masteredSects.includes(curSect)) {
      if (options.cause === 'breakthrough' || isAscension || (gm.player && gm.player.level >= 10)) {
        this.meta.masteredSects.push(curSect);
      }
    }

    // 1. 先天道基沉淀继承 (前世修行底蕴积累为先天道基)
    const curTotal = gm.player ? gm.player.getTotalStats() : { hp: 100, atk: 20, def: 10 };
    const inheritedHp = Math.max(20, Math.floor(curTotal.hp * 0.25));
    const inheritedAtk = Math.max(5, Math.floor(curTotal.atk * 0.25));
    const inheritedDef = Math.max(3, Math.floor(curTotal.def * 0.25));
    if (!this.meta.legacyStats) {
      this.meta.legacyStats = { hp: 0, atk: 0, def: 0 };
    }
    this.meta.legacyStats.hp += inheritedHp;
    this.meta.legacyStats.atk += inheritedAtk;
    this.meta.legacyStats.def += inheritedDef;

    // 目标宗门
    const targetSectId = options.targetSectId || (gm.unlockedSectTicket ? gm.unlockedSectTicket.sectId : null);

    // 递增轮回世数
    this.meta.samsaraCount++;

    // 单世重置：
    gm.level = 1;
    gm.potExp = 0;
    gm.energy = 100; // 新一世初始赠送 100 启动灵机
    gm.defeatStreak = 0;
    gm.freeReliefCount = 3;
    gm.hasDefeatedSectBoss = false; // 重置新一世守关妖王击杀标记

    // 清空普通背包 (保留容量，让新门派重新体验 3合1 极速合成)
    if (gm.inventory) {
      gm.inventory.slots = new Array(gm.inventory.capacity).fill(null);
      gm.inventory.overflowBuffer = [];
    }

    // 重置角色为练气一层修仙者 (第二世起永不重复凡人打猪教学)
    gm.isPrologueComplete = true;
    gm.player.isMortal = false;
    gm.player.level = 1;
    gm.player.exp = 0;

    if (targetSectId) {
      gm.prologueStep = 4;
      gm.isFirstSpinGuaranteedSect = false;
      gm.player.setSect(targetSectId);
    } else {
      gm.prologueStep = 3; // 待选择宗门
      gm.isFirstSpinGuaranteedSect = true; // 新世首抽必中门派法牒
      gm.player.currentSect = null;
    }

    // 2. 装备重置：旧装备已入法相殿封神，新门派装备从灰色起跑 (保留万通传家宝特权)
    gm.player.equipment = {
      weapon: null,
      armor: null,
      ring: null,
      hat: null,
      boots: null,
      belt: null
    };

    let equippedHeirlooms = [];
    if (this.meta.heirloomItems && this.meta.heirloomItems.length > 0) {
      this.meta.heirloomItems.forEach(item => {
        if (item && item.part && gm.player.equipment.hasOwnProperty(item.part)) {
          gm.player.equipment[item.part] = JSON.parse(JSON.stringify(item));
          equippedHeirlooms.push(item.name);
        }
      });
    }

    // 新门派基础灰色新手装保底 (若拜入具体宗门，使用该宗门专属器名)
    const tmplW = targetSectId && window.SlotsRPG && window.SlotsRPG.SectConfig ? window.SlotsRPG.SectConfig.getSectEquipTemplate(targetSectId, 'weapon') : null;
    const wBaseName = tmplW ? tmplW.name : '玄铁剑';
    if (!gm.player.equipment.weapon) {
      gm.player.equipment.weapon = {
        id: `STARTER_WEAPON_${Date.now()}`,
        part: 'weapon',
        slotName: '武器',
        baseName: wBaseName,
        name: `凡铁·${wBaseName}`,
        qualityCode: 'Q1',
        qualityName: '凡铁',
        qualityColor: '#8C8C8C',
        stats: { atk: 8, hp: 0, def: 0 },
        power: 16,
        icon: (tmplW && tmplW.icon) || 'assets/symbols/SYM_06.png',
        sectId: targetSectId || null
      };
    }
    const tmplA = targetSectId && window.SlotsRPG && window.SlotsRPG.SectConfig ? window.SlotsRPG.SectConfig.getSectEquipTemplate(targetSectId, 'armor') : null;
    const aBaseName = tmplA ? tmplA.name : '青云甲';
    if (!gm.player.equipment.armor) {
      gm.player.equipment.armor = {
        id: `STARTER_ARMOR_${Date.now()}`,
        part: 'armor',
        slotName: '衣服',
        baseName: aBaseName,
        name: `凡铁·${aBaseName}`,
        qualityCode: 'Q1',
        qualityName: '凡铁',
        qualityColor: '#8C8C8C',
        stats: { hp: 25, def: 4, atk: 0 },
        power: 11,
        icon: (tmplA && tmplA.icon) || 'assets/symbols/SYM_07.png',
        sectId: targetSectId || null
      };
    }

    // 消耗当前门派入场券
    if (gm.unlockedSectTicket) {
      gm.unlockedSectTicket = null;
    }

    // 洞天灵脉重置为一阶
    if (gm.caveManager) {
      gm.caveManager.init();
    }

    // 立即持久化
    if (window.SlotsRPG.StorageService) {
      window.SlotsRPG.StorageService.saveGame(gm, true);
    }

    gm.emitStateChange();

    const targetSectCfg = targetSectId && window.SlotsRPG.SectConfig ? window.SlotsRPG.SectConfig.getSect(targetSectId) : null;
    const settlementData = {
      samsaraCount: this.meta.samsaraCount,
      karmaGained: karmaGain,
      totalKarma: this.meta.karmaPoints,
      masteredSect: curSect,
      archivedEntry,
      isAscension,
      equippedHeirlooms,
      inheritedStats: { hp: inheritedHp, atk: inheritedAtk, def: inheritedDef },
      totalLegacyStats: { ...this.meta.legacyStats },
      targetSectId,
      targetSectName: targetSectCfg ? targetSectCfg.name : targetSectId
    };

    window.SlotsRPG.EventBus.emit('SAMSARA_SETTLEMENT', settlementData);
    return settlementData;
  }

  /**
   * 序列化保存
   */
  serialize() {
    return {
      samsaraCount: this.meta.samsaraCount,
      collectedShards: [...this.meta.collectedShards],
      masteredSects: [...this.meta.masteredSects],
      heirloomItems: this.meta.heirloomItems.map(it => JSON.parse(JSON.stringify(it))),
      guaranteedNextSect: this.meta.guaranteedNextSect,
      karmaPoints: this.meta.karmaPoints,
      legacyStats: this.meta.legacyStats ? { ...this.meta.legacyStats } : { hp: 0, atk: 0, def: 0 },
      sectArchives: this.meta.sectArchives ? JSON.parse(JSON.stringify(this.meta.sectArchives)) : {},
      hiddenMarks: this.meta.hiddenMarks ? JSON.parse(JSON.stringify(this.meta.hiddenMarks)) : {}
    };
  }

  /**
   * 反序列化恢复
   */
  deserialize(data) {
    if (!data) return;
    if (typeof data.samsaraCount === 'number') this.meta.samsaraCount = data.samsaraCount;
    if (Array.isArray(data.collectedShards)) this.meta.collectedShards = [...data.collectedShards];
    if (Array.isArray(data.masteredSects)) this.meta.masteredSects = [...data.masteredSects];
    if (Array.isArray(data.heirloomItems)) this.meta.heirloomItems = data.heirloomItems.map(it => JSON.parse(JSON.stringify(it)));
    if (data.guaranteedNextSect !== undefined) this.meta.guaranteedNextSect = data.guaranteedNextSect;
    if (typeof data.karmaPoints === 'number') this.meta.karmaPoints = data.karmaPoints;
    if (data.legacyStats && typeof data.legacyStats === 'object') {
      this.meta.legacyStats = {
        hp: Number(data.legacyStats.hp) || 0,
        atk: Number(data.legacyStats.atk) || 0,
        def: Number(data.legacyStats.def) || 0
      };
    }
    if (data.sectArchives && typeof data.sectArchives === 'object') {
      this.meta.sectArchives = JSON.parse(JSON.stringify(data.sectArchives));
    }
    if (data.hiddenMarks && typeof data.hiddenMarks === 'object') {
      this.meta.hiddenMarks = JSON.parse(JSON.stringify(data.hiddenMarks));
    }
  }
}

window.SlotsRPG.AscensionManager = AscensionManager;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.SlotsRPG.AscensionManager;
}
