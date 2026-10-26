/**
 * StorageService.js - 本地存档与持久化管理服务
 * 遵循 PRD 7.1 节规范：
 * 纯前端单机无外部依赖，基于 localStorage / 微信小游戏 wx.setStorageSync 抽象
 * 包含版本号校验、防抖自动保存、数据损坏兜底回退
 */
window.SlotsRPG = window.SlotsRPG || {};

class StorageService {
  constructor() {
    this.STORAGE_KEY = 'SLOTS_RPG_SAVE_V1';
    this.SAVE_DEBOUNCE_MS = 1000;
    this._saveTimer = null;
  }

  /**
   * 保存游戏存档
   * @param {Object} gameManager - GameManager 实例
   * @param {boolean} immediate - 是否立即写入 (无防抖)
   */
  saveGame(gameManager, immediate = false) {
    if (!gameManager) return;

    const doSave = () => {
      try {
        const p = gameManager.player;
        const inv = gameManager.inventory;
        const cave = gameManager.caveManager;

        const saveData = {
          version: '1.1.0',
          timestamp: Date.now(),
          isPrologueComplete: !!gameManager.isPrologueComplete,
          prologueStep: gameManager.prologueStep || 0,
          prologueSpins: gameManager.prologueSpins || 0,
          bossChallengeUnlocked: !!gameManager.bossChallengeUnlocked,
          hasDefeatedSectBoss: !!gameManager.hasDefeatedSectBoss,
          unlockedSectTicket: gameManager.unlockedSectTicket ? Object.assign({}, gameManager.unlockedSectTicket) : null,
          bossTicketAttempts: gameManager.bossTicketAttempts || 0,
          sectTrialStage: gameManager.sectTrialStage || 1,
          trialBestDamagePct: gameManager.trialBestDamagePct || 0,
          demonTowerFloor: (gameManager.demonTowerManager && gameManager.demonTowerManager.currentFloor) || 1,
          unlockedTitles: (gameManager.titleManager && gameManager.titleManager.unlockedTitles) || ['title_mortal'],
          equippedTitle: (gameManager.titleManager && gameManager.titleManager.equippedTitle) || 'title_mortal',
          lockedSectBossSnapshot: gameManager.lockedSectBossSnapshot ? Object.assign({}, gameManager.lockedSectBossSnapshot) : null,
          energy: gameManager.energy,
          level: gameManager.level,
          potExp: gameManager.potExp || 0,
          currentBet: gameManager.currentBet || 25,
          waterTankProgress: gameManager.waterTankProgress || 0,
          hasCompletedFirstDragonSpoutFTUE: !!gameManager.hasCompletedFirstDragonSpoutFTUE,
          hasCompletedCollectFTUE: !!gameManager.hasCompletedCollectFTUE,
          hasCompletedEquipFTUE: !!gameManager.hasCompletedEquipFTUE,
          hasCompletedSlotsReturnFTUE: !!gameManager.hasCompletedSlotsReturnFTUE,
          hasCompletedTrialFTUE: !!gameManager.hasCompletedTrialFTUE,
          hasCompletedCaveFTUE: !!gameManager.hasCompletedCaveFTUE,
          defeatStreak: gameManager.defeatStreak,
          freeReliefCount: gameManager.freeReliefCount,
          lastReliefDate: gameManager.lastReliefDate,
          dailySecretRealmCount: gameManager.dailySecretRealmCount,
          lastSecretRealmDate: gameManager.lastSecretRealmDate,
          player: p ? p.serialize() : null,
          inventory: {
            capacity: inv.capacity,
            autoSalvageEnabled: inv.autoSalvageEnabled,
            discoveredItemKeys: Array.from(inv.discoveredItemKeys || []),
            slots: inv.slots.map(s => s ? Object.assign({}, s) : null)
          },
          cave: cave ? cave.serialize() : null,
          metaProgression: gameManager.ascensionManager ? gameManager.ascensionManager.serialize() : null,
          currentWorldTier: gameManager.currentWorldTier || 1,
          adState: (window.SlotsRPG && window.SlotsRPG.AdService) ? window.SlotsRPG.AdService.serialize() : null
        };

        const jsonStr = JSON.stringify(saveData);
        localStorage.setItem(this.STORAGE_KEY, jsonStr);
      } catch (err) {
        console.error('[StorageService] 存档写入失败:', err);
      }
    };

    if (immediate) {
      if (this._saveTimer) {
        clearTimeout(this._saveTimer);
        this._saveTimer = null;
      }
      doSave();
    } else {
      if (this._saveTimer) clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => {
        this._saveTimer = null;
        doSave();
      }, this.SAVE_DEBOUNCE_MS);
    }
  }

  /**
   * 读取游戏存档并还原至 GameManager
   * @param {Object} gameManager - GameManager 实例
   * @returns {boolean} 是否成功读取到有效存档
   */
  loadGame(gameManager) {
    if (!gameManager) return false;

    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return false;

      const data = JSON.parse(raw);
      if (!data || !data.version) return false;

      // 0. 序章进度迁移与恢复 (老存档平稳兼容，防强制重复教学)
      if (typeof data.isPrologueComplete === 'boolean') {
        gameManager.isPrologueComplete = data.isPrologueComplete;
        gameManager.prologueStep = data.prologueStep || 0;
        gameManager.prologueSpins = data.prologueSpins || 0;
      } else {
        const hasLegacyProgress = (data.player && data.player.level >= 1) || (typeof data.energy === 'number' && data.energy > 100);
        gameManager.isPrologueComplete = hasLegacyProgress;
        gameManager.prologueStep = hasLegacyProgress ? 4 : 0;
        gameManager.prologueSpins = hasLegacyProgress ? 6 : 0;
      }

      // 1. 还原主数值
      if (typeof data.energy === 'number') gameManager.energy = data.energy;
      if (typeof data.level === 'number') gameManager.level = data.level;
      if (typeof data.potExp === 'number') gameManager.potExp = data.potExp;
      if (typeof data.currentBet === 'number') gameManager.currentBet = data.currentBet;
      if (typeof data.defeatStreak === 'number') gameManager.defeatStreak = data.defeatStreak;
      if (typeof data.freeReliefCount === 'number') gameManager.freeReliefCount = data.freeReliefCount;
      if (typeof data.lastReliefDate === 'string') gameManager.lastReliefDate = data.lastReliefDate;
      if (typeof data.dailySecretRealmCount === 'number') gameManager.dailySecretRealmCount = data.dailySecretRealmCount;
      if (typeof data.lastSecretRealmDate === 'string') gameManager.lastSecretRealmDate = data.lastSecretRealmDate;
      gameManager.checkDailyReliefReset();
      if (typeof data.bossChallengeUnlocked === 'boolean') {
        gameManager.bossChallengeUnlocked = data.bossChallengeUnlocked;
      }
      if (typeof data.hasDefeatedSectBoss === 'boolean') {
        gameManager.hasDefeatedSectBoss = data.hasDefeatedSectBoss;
      }
      if (data.unlockedSectTicket && typeof data.unlockedSectTicket === 'object') {
        gameManager.unlockedSectTicket = Object.assign({}, data.unlockedSectTicket);
      } else {
        gameManager.unlockedSectTicket = null;
      }
      if (typeof data.bossTicketAttempts === 'number') gameManager.bossTicketAttempts = data.bossTicketAttempts;
      if (typeof data.consecutiveEmptySpins === 'number') gameManager.consecutiveEmptySpins = data.consecutiveEmptySpins;
      if (typeof data.sectTrialStage === 'number') gameManager.sectTrialStage = Math.max(1, data.sectTrialStage);
      if (typeof data.trialBestDamagePct === 'number') gameManager.trialBestDamagePct = data.trialBestDamagePct;
      if (data.lockedSectBossSnapshot && typeof data.lockedSectBossSnapshot === 'object' && (data.lockedSectBossSnapshot.combatPower || 0) >= 1000) {
        gameManager.lockedSectBossSnapshot = Object.assign({}, data.lockedSectBossSnapshot);
      } else {
        gameManager.lockedSectBossSnapshot = null;
      }
      if (typeof data.hasCompletedFirstDragonSpoutFTUE === 'boolean') {
        gameManager.hasCompletedFirstDragonSpoutFTUE = data.hasCompletedFirstDragonSpoutFTUE;
      } else {
        const hasSpunBefore = (data.prologueSpins && data.prologueSpins > 0) ||
                              data.isPrologueComplete ||
                              (data.player && data.player.level >= 1) ||
                              (data.prologueStep && data.prologueStep > 3) ||
                              (typeof data.energy === 'number' && data.energy > 100);
        gameManager.hasCompletedFirstDragonSpoutFTUE = !!hasSpunBefore;
      }

      if (typeof data.hasCompletedCollectFTUE === 'boolean') {
        gameManager.hasCompletedCollectFTUE = data.hasCompletedCollectFTUE;
      } else {
        gameManager.hasCompletedCollectFTUE = !!((data.prologueSpins && data.prologueSpins > 1) || data.isPrologueComplete || hasSpunBefore);
      }
      if (typeof data.hasCompletedEquipFTUE === 'boolean') {
        gameManager.hasCompletedEquipFTUE = data.hasCompletedEquipFTUE;
      }
      if (typeof data.hasCompletedSlotsReturnFTUE === 'boolean') {
        gameManager.hasCompletedSlotsReturnFTUE = data.hasCompletedSlotsReturnFTUE;
      } else if ((data.prologueSpins && data.prologueSpins > 1) || data.isPrologueComplete) {
        gameManager.hasCompletedSlotsReturnFTUE = true;
      }
      if (typeof data.hasCompletedTrialFTUE === 'boolean') {
        gameManager.hasCompletedTrialFTUE = data.hasCompletedTrialFTUE;
      }
      if (typeof data.hasCompletedCaveFTUE === 'boolean') {
        gameManager.hasCompletedCaveFTUE = data.hasCompletedCaveFTUE;
      }

      if (typeof data.waterTankProgress === 'number') {
        gameManager.waterTankProgress = Math.min(gameManager.waterTankMax || 10, Math.max(0, data.waterTankProgress));
      } else {
        gameManager.waterTankProgress = 10; // 新手或首登赠送一次免费引龙吐宝
      }

      // 如果尚未完成首次引龙吐宝新手体验，确保水缸进度为 10/10 满格
      if (!gameManager.hasCompletedFirstDragonSpoutFTUE &&
          !gameManager.isPrologueComplete &&
          gameManager.prologueStep === 3 &&
          (gameManager.prologueSpins || 0) === 0) {
        gameManager.waterTankProgress = 10;
      }

      // 1.1 还原锁妖天关爬塔进度与称号
      if (gameManager.demonTowerManager && typeof data.demonTowerFloor === 'number') {
        gameManager.demonTowerManager.currentFloor = Math.max(1, Math.min(50, data.demonTowerFloor));
      }
      if (gameManager.titleManager) {
        if (Array.isArray(data.unlockedTitles) && data.unlockedTitles.length > 0) {
          gameManager.titleManager.unlockedTitles = data.unlockedTitles;
        }
        if (typeof data.equippedTitle === 'string') {
          gameManager.titleManager.equippedTitle = data.equippedTitle;
        }
      }

      // 2. 还原角色 (通过 PlayerModel.deserialize 恢复完整境界与装备)
      if (data.player && gameManager.player) {
        gameManager.player.deserialize(data.player);
      }

      // 门票有效性校验纠偏：门票必须同时满足【击败守关妖王】+【全身6槽Q4紫品法器神装】
      // 若因老版本Bug导致未满足条件时错误获得了门票，自动纠偏清空，避免破环养成
      if (gameManager.unlockedSectTicket && gameManager.player) {
        const fullSet = gameManager.player.checkFullSetEquipped('Q4');
        if (!fullSet || !fullSet.isGraduated || !gameManager.hasDefeatedSectBoss) {
          console.warn('[StorageService] 纠偏：清除不合规的提前掉落门票(道基未圆满或未击败妖王)');
          gameManager.unlockedSectTicket = null;
        }
      }

      // 妖王击败与蕴灵死循环纠偏：
      // 1. 若当前门派妖王已击败，清空残留的满额蕴灵与挑战标记，恢复正常转盘
      if (gameManager.hasDefeatedSectBoss) {
        if (gameManager.potExp >= gameManager.getMaxPotExp()) {
          console.warn('[StorageService] 纠偏：妖王已伏诛，重置残留满额蕴灵，解除推演死循环');
          gameManager.potExp = 0;
        }
        gameManager.bossChallengeUnlocked = false;
      }
      // 2. 若妖王已击败且全身已大圆满，但遗漏了门票，自动补发
      if (gameManager.hasDefeatedSectBoss && gameManager.player) {
        const fullSet = gameManager.player.checkFullSetEquipped('Q4');
        if (fullSet && fullSet.isGraduated && !gameManager.unlockedSectTicket) {
          gameManager.awardFullSetSectTicket();
        }
      }

      // 3. 还原乾坤袋背包
      if (data.inventory && gameManager.inventory) {
        const inv = gameManager.inventory;
        if (typeof data.inventory.capacity === 'number') inv.capacity = data.inventory.capacity;
        if (typeof data.inventory.autoSalvageEnabled === 'boolean') {
          inv.autoSalvageEnabled = data.inventory.autoSalvageEnabled;
        }
        if (Array.isArray(data.inventory.discoveredItemKeys)) {
          inv.discoveredItemKeys = new Set(data.inventory.discoveredItemKeys);
        }
        if (Array.isArray(data.inventory.slots)) {
          inv.slots = new Array(inv.capacity).fill(null);
          data.inventory.slots.forEach((item, i) => {
            if (i < inv.capacity) {
              inv.slots[i] = item;
            }
          });

          // 纠偏：若作弊器天机盘已觉醒融于识海 (prologueStep >= 3 或 isPrologueComplete)，清除乾坤袋中残留的造化天机盘道具
          if (gameManager.prologueStep >= 3 || gameManager.isPrologueComplete) {
            inv.slots = inv.slots.map(s => {
              if (s && (s.id === 'ITEM_TIANJI_PLATE' || s.isArtifactPlate || (s.name && s.name.includes('造化天机盘')))) {
                return null;
              }
              return s;
            });
          }
        }
      }

      // 4. 还原洞天灵脉
      if (data.cave && gameManager.caveManager) {
        gameManager.caveManager.deserialize(data.cave);
      }

      // 5. 还原升仙天碑与跨世 Meta Progression
      if (data.metaProgression && gameManager.ascensionManager) {
        gameManager.ascensionManager.deserialize(data.metaProgression);
      }

      // 6. 还原大世界位面与商业变现配额
      if (typeof data.currentWorldTier === 'number') {
        gameManager.currentWorldTier = data.currentWorldTier;
        if (gameManager.player) gameManager.player.worldTier = data.currentWorldTier;
        if (gameManager.caveManager) gameManager.caveManager.worldTier = data.currentWorldTier;
      }
      if (data.adState && window.SlotsRPG && window.SlotsRPG.AdService) {
        window.SlotsRPG.AdService.deserialize(data.adState);
      }

      console.log('[StorageService] 成功恢复游戏存档，最后游玩时间:', new Date(data.timestamp).toLocaleString());
      return true;
    } catch (err) {
      console.error('[StorageService] 存档解析恢复失败，采用初始默认数据:', err);
      return false;
    }
  }

  /**
   * 清除存档 (散功重修)
   */
  clearSave() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('[StorageService] 存档已彻底清除！');
      return true;
    } catch (err) {
      return false;
    }
  }
}

window.SlotsRPG.StorageService = new StorageService();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.SlotsRPG.StorageService;
}
