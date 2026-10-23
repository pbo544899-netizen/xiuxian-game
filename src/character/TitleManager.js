/**
 * TitleManager.js - 修仙尊号与道门封号系统
 * 负责管理境界解锁与镇妖塔首通称号、头衔佩戴与微额属性加成
 */
(function() {
  window.SlotsRPG = window.SlotsRPG || {};

  const ALL_TITLES = {
    title_mortal: {
      id: 'title_mortal',
      name: '【青牛镇散修】',
      color: '#94a3b8',
      desc: '初踏仙途，微尘微芒，无拘无束',
      bonusPower: 0,
      unlockType: 'default',
      unlockCondition: '初入修仙界默认佩戴'
    },
    title_foundation: {
      id: 'title_foundation',
      name: '【青云门真传】',
      color: '#38ef7d',
      desc: '筑基初成，褪去凡胎，名列青云真传',
      bonusPower: 60,
      unlockType: 'realm',
      reqRealm: '筑基',
      unlockCondition: '突破至筑基境界'
    },
    title_gold_core: {
      id: 'title_gold_core',
      name: '【洞天首席】',
      color: '#38bdf8',
      desc: '一粒金丹吞入腹，始知我命不由天',
      bonusPower: 180,
      unlockType: 'realm',
      reqRealm: '金丹',
      unlockCondition: '突破至金丹境界'
    },
    title_nascent_soul: {
      id: 'title_nascent_soul',
      name: '【开宗立派老祖】',
      color: '#c084fc',
      desc: '元婴大成，神游太虚，纵横三千界',
      bonusPower: 450,
      unlockType: 'realm',
      reqRealm: '元婴',
      unlockCondition: '突破至元婴境界'
    },
    title_tower_5: {
      id: 'title_tower_5',
      name: '【伏魔先锋】',
      color: '#38ef7d',
      desc: '初探锁妖天关，斩妖除秽',
      bonusPower: 80,
      unlockType: 'tower',
      reqFloor: 5,
      unlockCondition: '平定锁妖天关第 5 层'
    },
    title_tower_10: {
      id: 'title_tower_10',
      name: '【镇妖真传】',
      color: '#38bdf8',
      desc: '力挫赤炼妖王，声威远播',
      bonusPower: 200,
      unlockType: 'tower',
      reqFloor: 10,
      unlockCondition: '平定锁妖天关第 10 层'
    },
    title_tower_20: {
      id: 'title_tower_20',
      name: '【荡魔剑仙】',
      color: '#c084fc',
      desc: '一剑寒霜十四州，群妖伏首',
      bonusPower: 500,
      unlockType: 'tower',
      reqFloor: 20,
      unlockCondition: '平定锁妖天关第 20 层'
    },
    title_tower_30: {
      id: 'title_tower_30',
      name: '【截天道尊】',
      color: '#f59e0b',
      desc: '截取天地造化，妖尊俯首',
      bonusPower: 1000,
      unlockType: 'tower',
      reqFloor: 30,
      unlockCondition: '平定锁妖天关第 30 层'
    },
    title_tower_50: {
      id: 'title_tower_50',
      name: '【九天锁妖至尊】',
      color: '#ffd700',
      desc: '登临锁妖天关绝巅，万古独尊',
      bonusPower: 2500,
      unlockType: 'tower',
      reqFloor: 50,
      unlockCondition: '平定锁妖天关第 50 层巅峰'
    }
  };

  class TitleManager {
    constructor(gameManager) {
      this.gameManager = gameManager;
      this.unlockedTitles = ['title_mortal'];
      this.equippedTitle = 'title_mortal';
    }

    getAllTitles() {
      return Object.values(ALL_TITLES);
    }

    getTitleConfig(id) {
      return ALL_TITLES[id] || ALL_TITLES['title_mortal'];
    }

    getEquippedTitleConfig() {
      return this.getTitleConfig(this.equippedTitle);
    }

    getBonusPower() {
      const cfg = this.getEquippedTitleConfig();
      return cfg ? (cfg.bonusPower || 0) : 0;
    }

    isUnlocked(titleId) {
      return this.unlockedTitles.includes(titleId);
    }

    unlockTitle(titleId) {
      if (!ALL_TITLES[titleId]) return false;
      if (!this.unlockedTitles.includes(titleId)) {
        this.unlockedTitles.push(titleId);
        const titleCfg = ALL_TITLES[titleId];
        
        // 浮字与事件通知
        if (this.gameManager && this.gameManager.renderer && this.gameManager.renderer.addFloatingText) {
          this.gameManager.renderer.addFloatingText(`🎖️ 荣获修仙尊号：${titleCfg.name}`, '#ffd700');
        }
        window.SlotsRPG && window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('TITLE_UNLOCKED', {
          title: titleCfg
        });
        if (window.SlotsRPG.StorageService) {
          window.SlotsRPG.StorageService.saveGame(this.gameManager, true);
        }
        return true;
      }
      return false;
    }

    equipTitle(titleId) {
      if (!this.isUnlocked(titleId)) return false;
      this.equippedTitle = titleId;
      const titleCfg = this.getTitleConfig(titleId);

      window.SlotsRPG && window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('TITLE_EQUIPPED', {
        title: titleCfg,
        bonusPower: this.getBonusPower()
      });

      if (this.gameManager) {
        this.gameManager.emitStateChange();
        if (window.SlotsRPG.StorageService) {
          window.SlotsRPG.StorageService.saveGame(this.gameManager, true);
        }
      }
      return true;
    }

    checkRealmUnlocks(realmName) {
      if (!realmName) return;
      Object.values(ALL_TITLES).forEach(t => {
        if (t.unlockType === 'realm' && realmName.includes(t.reqRealm)) {
          this.unlockTitle(t.id);
        }
      });
    }

    checkTowerUnlocks(floor) {
      Object.values(ALL_TITLES).forEach(t => {
        if (t.unlockType === 'tower' && floor >= t.reqFloor) {
          this.unlockTitle(t.id);
        }
      });
    }
  }

  window.SlotsRPG.TitleManager = TitleManager;
  window.SlotsRPG.ALL_TITLES = ALL_TITLES;
})();
