/**
 * DragonLootEngine.js - 神龙吐宝 · 乾坤双柜 掉落与奇遇引擎
 * 替代传统 3x5 老虎机滚轮逻辑，实现微信爆款开箱流高频多巴胺循环与奇遇事件池
 * 100% 兼容已有 RPG 数值、装备品质矩阵、回合战斗、洞天秘境与宗门飞升
 */
window.SlotsRPG = window.SlotsRPG || {};

(function() {
  class DragonLootEngine {
    constructor() {
      // 龙威值 (真龙狂暴蓄力槽 0~100)
      this.dragonRage = 0;
      this.maxRage = 100;
      this.isFrenzyActive = false;
      this.frenzySpinsLeft = 0;

      // 统计与防空转计数
      this.consecutiveEquipmentSpins = 0;
      this.totalSpouts = 0;
    }

    /**
     * 重置或更新龙威蓄力
     */
    addRage(amount = 1) {
      if (this.isFrenzyActive) return false;
      this.dragonRage = Math.min(this.maxRage, this.dragonRage + amount);
      if (this.dragonRage >= this.maxRage) {
        this.triggerFrenzy();
        return true;
      }
      return false;
    }

    /**
     * 触发真龙狂暴状态
     */
    triggerFrenzy() {
      this.isFrenzyActive = true;
      this.frenzySpinsLeft = 10;
      this.dragonRage = 0;
      window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('DRAGON_FRENZY_TRIGGERED', {
        spins: 10
      });
    }

    /**
     * 核心计算：执行一次神龙引宝
     * @param {Object} context - 包含 player, potSubLevel, multiplier, options, ftueScript
     * @returns {Object} 吐宝结果包
     */
    spout(context = {}) {
      const {
        player = null,
        potSubLevel = 1,
        multiplier = 1,
        worldTier = 1,
        options = {},
        ftueScript = null,
        isBreakthroughReady = false,
        hasJoinedSect = false
      } = context;

      this.totalSpouts++;
      const isFrenzy = this.isFrenzyActive && this.frenzySpinsLeft > 0;
      if (isFrenzy) {
        this.frenzySpinsLeft--;
        if (this.frenzySpinsLeft <= 0) {
          this.isFrenzyActive = false;
        }
      } else {
        this.addRage(1);
      }

      // ==========================================
      // 1. 左柜判定：【造化玄兵】 / 【奇遇事件】
      // ==========================================
      let leftCabinet = null;

      // (1) 新手散修初探 (FTUE) 强脚本保护
      if (ftueScript) {
        if (ftueScript.forceBattle) {
          leftCabinet = {
            type: 'battle',
            name: '龙息引煞 · 山间幼兽',
            battleConfig: {
              tier: ftueScript.forceBattle.tier || 'normal',
              count: ftueScript.forceBattle.count || 1,
              scatterCount: 3,
              isFTUEDemo: true
            }
          };
        } else if (ftueScript.forceSectInduction) {
          leftCabinet = {
            type: 'sect',
            name: '仙门法牒 · 叩问仙门'
          };
        } else if (ftueScript.forceLine && ftueScript.forceLine.symbol === 'SYM_06') {
          // FTUE 必出初始玄铁剑
          const initSword = window.SlotsRPG.ItemModel.createEquipment('weapon', 'Q1', worldTier);
          initSword.baseName = '玄铁剑';
          initSword.name = '凡铁·玄铁剑';
          leftCabinet = {
            type: 'equip',
            item: initSword,
            isLuckyBurst: false
          };
        }
      }

      // (2) 突破卡点 Boss 战或强指定 Boss
      if (!leftCabinet && (options.forceBoss || isBreakthroughReady)) {
        leftCabinet = {
          type: 'battle',
          name: '天道雷劫 · 守关大妖王',
          battleConfig: {
            tier: 'boss',
            count: 1,
            scatterCount: 5,
            betMultiplier: multiplier
          }
        };
      }

      // (3) 强指定遭遇妖兽
      if (!leftCabinet && options.forceMonster) {
        leftCabinet = {
          type: 'battle',
          name: '龙息引煞 · 妖兽突袭',
          battleConfig: {
            tier: 'normal',
            count: 2,
            scatterCount: 3,
            betMultiplier: multiplier
          }
        };
      }

      // (4) 强指定洞天秘境
      if (!leftCabinet && options.forceBonus) {
        leftCabinet = {
          type: 'bonus',
          name: '龙域秘境 · 造化机缘',
          bonusCount: 6
        };
      }

      // (5) 常规随机生成：妖兽遭遇(~6%)、秘境空间(~2%)、或者装备掉落(~92%)
      if (!leftCabinet) {
        const randEvent = Math.random();
        
        // 狂暴状态下第 10 抽必定爆神品装备，不出战斗打断
        const isFrenzyGuaranteed10th = isFrenzy && this.frenzySpinsLeft === 0;

        if (!isFrenzyGuaranteed10th && randEvent < 0.06 && hasJoinedSect) {
          // 龙息引煞：遭遇妖兽
          const isElite = Math.random() < 0.25;
          leftCabinet = {
            type: 'battle',
            name: isElite ? '龙息引煞 · 精英大妖' : '龙息引煞 · 巡山群妖',
            battleConfig: {
              tier: isElite ? 'elite' : 'normal',
              count: isElite ? 1 : (Math.random() < 0.5 ? 2 : 3),
              scatterCount: 3,
              betMultiplier: multiplier
            }
          };
        } else {
          // 装备掉落 (开箱流核心，取消推演过程中的跑马灯附属玩法打断)
          leftCabinet = this._generateEquipmentLoot({
            player,
            potSubLevel,
            multiplier,
            worldTier,
            isFrenzyGuaranteed10th
          });
        }
      }

      // ==========================================
      // 2. 右柜判定：【天道灵材】 (资粮保底与 RTP 返还)
      // ==========================================
      let rightCabinet = this._generateMaterialLoot({
        multiplier,
        worldTier,
        ftueScript
      });

      // ==========================================
      // 3. 构建聚合评估结构 (兼容 GameManager 结算流)
      // ==========================================
      const itemsWon = [];
      let totalPayout = rightCabinet.energyGain || 0;

      if (leftCabinet.type === 'equip' && leftCabinet.item) {
        itemsWon.push({
          type: 'equip',
          item: leftCabinet.item,
          part: leftCabinet.item.part,
          qualityCode: leftCabinet.item.qualityCode,
          name: leftCabinet.item.name,
          icon: leftCabinet.item.icon,
          matchCount: leftCabinet.isLuckyBurst ? 5 : 3,
          row: 1,
          col: 1
        });
      }

      if (rightCabinet.type === 'pill' && rightCabinet.item) {
        itemsWon.push({
          type: 'pill',
          item: rightCabinet.item,
          subType: rightCabinet.item.subType,
          amount: rightCabinet.item.amount,
          expReward: rightCabinet.expGain,
          icon: rightCabinet.item.icon,
          name: rightCabinet.item.name,
          matchCount: rightCabinet.isCrit ? 5 : 3,
          row: 1,
          col: 3
        });
      } else if (rightCabinet.type === 'rune' && rightCabinet.item) {
        itemsWon.push({
          type: 'rune',
          item: rightCabinet.item,
          symbolId: rightCabinet.item.symbolId,
          amount: rightCabinet.item.amount,
          icon: rightCabinet.item.icon,
          name: rightCabinet.item.name,
          matchCount: 3,
          row: 1,
          col: 3
        });
      }

      const evaluation = {
        totalPayout: totalPayout,
        itemsWon: itemsWon,
        hasTriggeredBattle: leftCabinet.type === 'battle',
        battleConfig: leftCabinet.battleConfig || null,
        hasTriggeredBonus: false,
        bonusCount: 0,
        scatterCount: leftCabinet.type === 'battle' ? (leftCabinet.battleConfig?.scatterCount || 3) : 0,
        winningLines: totalPayout > 0 ? [{ payout: totalPayout, coords: [1, 1, 1] }] : []
      };

      return {
        leftCabinet,
        rightCabinet,
        evaluation,
        dragonRage: this.dragonRage,
        maxRage: this.maxRage,
        isFrenzyActive: this.isFrenzyActive,
        frenzySpinsLeft: this.frenzySpinsLeft,
        betMultiplier: multiplier,
        ftueScript: ftueScript
      };
    }

    /**
     * 生成左柜装备
     */
    _generateEquipmentLoot({ player, potSubLevel, multiplier, worldTier, isFrenzyGuaranteed10th }) {
      // 1. 部位选择：优先从未装备或战力偏低的部位中选择，确保 6 槽平滑成长
      const allSlots = ['weapon', 'armor', 'ring', 'hat', 'boots', 'belt'];
      const availableSlots = allSlots.filter(s => {
        if (!player) return true;
        return player.isSlotUnlocked ? player.isSlotUnlocked(s, potSubLevel) : true;
      });
      const chosenSlot = availableSlots.length > 0 
        ? availableSlots[Math.floor(Math.random() * availableSlots.length)]
        : 'weapon';

      // 2. 品质矩阵计算
      const matrix = (window.SlotsRPG && window.SlotsRPG.GameBalanceConfig && window.SlotsRPG.GameBalanceConfig.EquipQualityMatrix) || null;
      let qualityCode = matrix ? matrix.pickQuality(potSubLevel, Math.random()) : 'Q1';

      // 狂暴第 10 抽神装保底：保底 Q4 (法器·紫) 或更高
      if (isFrenzyGuaranteed10th) {
        const qRanks = { Q1: 1, Q2: 2, Q3: 3, Q4: 4, Q5: 5, Q6: 6, Q7: 7, Q8: 8 };
        if ((qRanks[qualityCode] || 1) < 4) {
          qualityCode = Math.random() < 0.25 ? 'Q5' : 'Q4';
        }
      }

      // 3. 气运跃阶判定 (龙目金光赐福 / 高倍暴击)
      let isLuckyBurst = false;
      const burstChance = Math.min(0.50, 0.08 + (multiplier - 1) * 0.05);
      if (Math.random() < burstChance) {
        const nextQ = window.SlotsRPG.ItemModel.getNextQuality(qualityCode);
        if (nextQ) {
          qualityCode = nextQ;
          isLuckyBurst = true;
        }
      }

      // 4. 创建装备对象
      const newEquip = window.SlotsRPG.ItemModel.createEquipment(chosenSlot, qualityCode, worldTier);

      // 高倍消耗微调战力
      if (multiplier > 1 && newEquip.stats) {
        const boost = 1 + Math.min(0.15, (multiplier - 1) * 0.02);
        newEquip.stats.hp = Math.round(newEquip.stats.hp * boost);
        newEquip.stats.atk = Math.round(newEquip.stats.atk * boost);
        newEquip.stats.def = Math.round(newEquip.stats.def * boost);
        newEquip.power = Math.floor(newEquip.stats.hp * 0.2 + newEquip.stats.atk * 2.0 + newEquip.stats.def * 1.5);
      }

      // 宗门专属前缀
      if (player && player.currentSect && window.SlotsRPG.SectConfig) {
        const tmpl = window.SlotsRPG.SectConfig.getSectEquipTemplate(player.currentSect, chosenSlot);
        if (tmpl) {
          newEquip.baseName = tmpl.name;
          newEquip.name = `${newEquip.qualityName}·${tmpl.name}`;
          if (tmpl.icon) newEquip.icon = tmpl.icon;
        }
      }

      return {
        type: 'equip',
        item: newEquip,
        isLuckyBurst: isLuckyBurst
      };
    }

    /**
     * 生成右柜日常资粮 (丹药、灵石、法符)
     */
    _generateMaterialLoot({ multiplier, worldTier, ftueScript }) {
      // FTUE 指定
      if (ftueScript) {
        if (ftueScript.forceLine && ftueScript.forceLine.symbol === 'SYM_05') {
          // FTUE 必出修为丹
          const pill = window.SlotsRPG.ItemModel.createPill('exp', 1);
          return {
            type: 'pill',
            item: pill,
            energyGain: 0,
            expGain: 150,
            potExpGain: 20,
            isCrit: false,
            desc: '服用增长 150 点修为道行'
          };
        } else if (ftueScript.forceLine && (ftueScript.forceLine.symbol === 'SYM_01' || ftueScript.forceLine.symbol === 'SYM_02')) {
          // FTUE 返还机缘
          const gain = 50 * multiplier;
          return {
            type: 'energy',
            item: null,
            energyGain: gain,
            expGain: 20,
            potExpGain: 10,
            isCrit: false,
            desc: `吸纳天道灵机，机缘 +${gain}`
          };
        }
      }

      const roll = Math.random();
      const isSneeze = Math.random() < 0.015; // 龙神打喷嚏 1.5% 暴击

      // (A) 修为/气血丹药 (40% 几率)
      if (roll < 0.40) {
        const isExp = Math.random() < 0.75;
        const subType = isExp ? 'exp' : 'hp';
        const count = (isSneeze ? 3 : 1) * (multiplier >= 5 ? 2 : 1);
        const pill = window.SlotsRPG.ItemModel.createPill(subType, count);
        const baseExp = isExp ? (worldTier === 2 ? 800 : 100) : 30;
        const expGain = baseExp * count * multiplier;
        const potExpGain = Math.round(expGain * 0.15);

        return {
          type: 'pill',
          item: pill,
          energyGain: 0,
          expGain: expGain,
          potExpGain: potExpGain,
          isCrit: isSneeze,
          desc: isSneeze 
            ? `龙神喷嚏天降甘霖！大爆 3倍【${pill.name}】！` 
            : `获得灵药【${pill.name}】x${count}，道行 +${expGain}`
        };
      }

      // (B) 天道灵石 / 机缘返还 (45% 几率，保障 RTP ~96%)
      if (roll < 0.85) {
        // 返还 0.4x ~ 2.5x 消耗
        const ratios = [0.4, 0.6, 0.8, 1.2, 1.5, 2.5];
        const rRatio = ratios[Math.floor(Math.random() * ratios.length)];
        let gain = Math.round(25 * rRatio * multiplier);
        if (isSneeze) gain = Math.round(gain * 3);

        return {
          type: 'energy',
          item: null,
          energyGain: gain,
          expGain: Math.round(gain * 0.2),
          potExpGain: Math.round(gain * 0.1),
          isCrit: isSneeze,
          desc: isSneeze 
            ? `真龙吐纳瑞气千条！灵石暴增 +${gain} 机缘！` 
            : `采撷天道灵石，聚纳 +${gain} 机缘`
        };
      }

      // (C) 龙道灵符 (15% 几率)
      const symList = ['SYM_01', 'SYM_02', 'SYM_03'];
      const sym = symList[Math.floor(Math.random() * symList.length)];
      const talisman = window.SlotsRPG.ItemModel.createTalisman(sym, 1);
      const gainEnergy = 20 * multiplier;

      return {
        type: 'rune',
        item: talisman,
        energyGain: gainEnergy,
        expGain: 25 * multiplier,
        potExpGain: 15,
        isCrit: false,
        desc: `获赠【${talisman.name}】，蕴化 +${gainEnergy} 机缘`
      };
    }
  }

  window.SlotsRPG.DragonLootEngine = DragonLootEngine;
})();
