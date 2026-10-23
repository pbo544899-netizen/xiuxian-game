/**
 * CaveUI.js
 * 洞天福地、灵泉产出、灵阵升级与 Hold & Spin 秘境大奖交互
 */
(function() {
  window.SlotsRPG = window.SlotsRPG || {};
  window.SlotsRPG.UI = window.SlotsRPG.UI || {};

  const CaveUI = {
    init() {
      const gameManager = window.SlotsRPG.GameManager || window.gameManager;

      const showFloatingNotice = (m, c) => window.showFloatingNotice && window.showFloatingNotice(m, c);
      const showGameNotice = (t, c, b) => window.showGameNotice && window.showGameNotice(t, c, b);

      const EventBus = window.SlotsRPG.EventBus;

    const tabCave = document.getElementById('tab-cave');
    const tabBadgeCave = document.getElementById('tab-badge-cave');
    const viewCave = document.getElementById('view-cave');
    const caveAccumulatedEnergy = document.getElementById('cave-accumulated-energy');
    const caveMaxEnergy = document.getElementById('cave-max-energy');
    const caveAccumulatedPills = document.getElementById('cave-accumulated-pills');
    const btnCaveCollect = document.getElementById('btn-cave-collect');
    const spiritArrayName = document.getElementById('spirit-array-name');
    const spiritArrayRate = document.getElementById('spirit-array-rate');
    const spiritArrayCost = document.getElementById('spirit-array-cost');
    const btnUpgradeArray = document.getElementById('btn-upgrade-array');
    const btnCaveSecretRealm = document.getElementById('btn-cave-secret-realm');
    const caveRealmDailyBadge = document.getElementById('cave-realm-daily-badge');
    const caveRealmBtnAction = document.getElementById('cave-realm-btn-action');
    const modalOfflineReward = document.getElementById('modal-offline-reward');
    const offlineGainEnergy = document.getElementById('offline-gain-energy');
    const offlineGainPills = document.getElementById('offline-gain-pills');
    const btnClaimOffline = document.getElementById('btn-claim-offline');
    const elPower = document.getElementById('val-power');


  // 14. 洞天灵脉业务与交互绑定
  window.updateCaveView = updateCaveView;
  function updateCaveView() {
    if (!gameManager.caveManager) return;
    const cave = gameManager.caveManager;
    const cfg = cave.getCurrentArrayConfig();
    const nextCfg = cave.getNextArrayConfig();

    if (caveAccumulatedEnergy) caveAccumulatedEnergy.innerText = Math.floor(cave.accumulatedEnergy);
    if (caveMaxEnergy) caveMaxEnergy.innerText = `/ ${cfg.maxCapacity}`;
    if (caveAccumulatedPills) caveAccumulatedPills.innerText = cave.accumulatedPills;

    if (spiritArrayName) spiritArrayName.innerText = cfg.name;
    if (spiritArrayRate) spiritArrayRate.innerText = `产出: ${cfg.ratePerMin} 机缘/分钟 (上限 ${cfg.maxCapacity})`;
    if (spiritArrayCost) {
      if (nextCfg) {
        spiritArrayCost.innerText = nextCfg.upgradeCost;
        if (btnUpgradeArray) btnUpgradeArray.disabled = false;
      } else {
        spiritArrayCost.innerText = '已满阶';
        if (btnUpgradeArray) btnUpgradeArray.disabled = true;
      }
    }

    // 每日洞天灵泉采撷状态更新 (每日限 1 次直接采撷，去赌场跑马灯化)
    const canExplore = gameManager.canExploreSecretRealmToday();
    const caveRealmBtnAction = document.getElementById('cave-realm-btn-action');
    if (btnCaveSecretRealm) {
      if (canExplore) {
        btnCaveSecretRealm.classList.add('ready');
        btnCaveSecretRealm.classList.remove('exhausted');
        if (caveRealmDailyBadge) {
          caveRealmDailyBadge.innerHTML = '✨ 灵泉圆满 · 今日可采撷 (1/1)';
          caveRealmDailyBadge.style.color = '#38bdf8';
        }
        if (caveRealmBtnAction) caveRealmBtnAction.innerText = '采撷造化 ➔';
      } else {
        btnCaveSecretRealm.classList.remove('ready');
        btnCaveSecretRealm.classList.add('exhausted');
        if (caveRealmDailyBadge) {
          caveRealmDailyBadge.innerHTML = '⌛ 灵泉凝结中 · 明日辰时复苏 (0/1)';
          caveRealmDailyBadge.style.color = '#94a3b8';
        }
        if (caveRealmBtnAction) caveRealmBtnAction.innerText = '已采撷';
      }
    }

    // 镇妖塔进度与目标更新
    if (gameManager.demonTowerManager) {
      const tower = gameManager.demonTowerManager;
      const flrCfg = tower.getFloorConfig(tower.currentFloor);
      const elFloor = document.getElementById('tower-current-floor-tag');
      const elBoss = document.getElementById('tower-boss-name');
      const elPower = document.getElementById('tower-req-power');
      if (elFloor) elFloor.innerText = `平定进度: ${tower.currentFloor - 1}/50 层`;
      if (elBoss) {
        elBoss.innerText = `第 ${flrCfg.floor} 层 · ${flrCfg.bossName}`;
        elBoss.style.color = flrCfg.isBoss ? '#ef4444' : (flrCfg.isMilestone ? '#c084fc' : '#fca5a5');
      }
      if (elPower) elPower.innerText = `推荐战力: ${flrCfg.reqPower}`;
    }

    // 灵脉气泡角标提示：累积机缘超过 30 或产出丹药时亮起
    if (tabBadgeCave && !tabCave.classList.contains('active')) {
      if (cave.accumulatedEnergy >= 30 || cave.accumulatedPills >= 1) {
        tabBadgeCave.classList.remove('hidden');
      } else {
        tabBadgeCave.classList.add('hidden');
      }
    }
  }

  // 每 2 秒微量平滑刷新灵脉
  setInterval(updateCaveView, 2000);

  if (btnCaveCollect) {
    btnCaveCollect.addEventListener('click', () => {
      const res = gameManager.collectCaveEarnings();
      if (res && (res.energy > 0 || res.pills > 0)) {
        if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
          window.SlotsRPG.SoundEffects.play('CAVE_COLLECT');
        }
        let msg = '纳宝入体: ';
        if (res.energy > 0) msg += `+${res.energy}机缘 `;
        if (res.pills > 0) msg += `+${res.pills}修为丹`;
        if (renderer) renderer.addFloatingText(msg, '#34e89e');
        updateCaveView();
      } else {
        showGameNotice('仙鼎灵机微浅', '当前仙鼎中灵机尚浅，稍待片刻再来收取吧！', '☯ 洞天静修');
      }
    });
  }

  if (btnUpgradeArray) {
    btnUpgradeArray.addEventListener('click', () => {
      const res = gameManager.upgradeCaveSpiritArray();
      if (res.success) {
        if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
          window.SlotsRPG.SoundEffects.play('BREAKTHROUGH');
        }
        if (renderer) renderer.addFloatingText(`聚灵阵进阶为【${res.newConfig.name}】!`, '#ffd700');
        updateCaveView();
      } else {
        showGameNotice('聚灵阵进阶受阻', res.reason || '升级所需机缘不足，暂无法突破！', '⚠️ 灵力不足');
      }
    });
  }

  // 15. 洞天灵泉 · 采撷灵脉造化 (每日 1 次，直接点入乾坤袋，无需转盘)
  if (btnCaveSecretRealm) {
    btnCaveSecretRealm.addEventListener('click', () => {
      if (!gameManager.canExploreSecretRealmToday()) {
        showFloatingNotice('今日洞天灵泉已采撷，天地灵机凝结温养中，明日辰时复苏！', '#94a3b8');
        return;
      }

      const res = gameManager.claimCaveSpringFortune();
      if (!res) return;

      if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('CAVE_COLLECT');
      }

      // 组装造化清单文字
      let giftList = [];
      if (res.energy > 0) giftList.push(`✨ 机缘 +${res.energy}`);
      if (res.pills > 0) giftList.push(`💊 纯阳丹 x${res.pills}`);
      if (res.runes && res.runes.length > 0) {
        res.runes.forEach(r => giftList.push(`📜 ${r.name} x${r.count}`));
      }
      if (res.equip) {
        giftList.push(`⚔️ 【${res.equip.name}】(${res.equip.qualityName || '极品'})`);
      }

      showGameNotice(
        res.isGrand ? '🌟 灵泉大爆 · 洞天太极大圆满' : '🌊 灵泉蕴润 · 采撷造化功成',
        `<p style="line-height:1.7; color:#e2e8f0; font-size:14px;">
          引灵化露，洞天灵泉喷涌出天地至纯造化灵萃：<br/>
          <b style="color:#ffd700;">${giftList.join(' · ')}</b><br/><br/>
          <span style="font-size:12px; color:#94a3b8;">已悉数汇入道友法力与乾坤袋中，灵脉温养明日辰时再聚天露！</span>
        </p>`,
        res.isGrand ? '✨ 鸿蒙大造化' : '☯ 灵泉纳福'
      );

      updateCaveView();
    });
  }

  // 离线收益结算弹窗
  window.SlotsRPG.EventBus.on('OFFLINE_REWARD', (reward) => {
    if (modalOfflineReward) {
      if (offlineGainEnergy) offlineGainEnergy.innerText = `+${reward.energyGained}`;
      if (offlineGainPills) offlineGainPills.innerText = `+${reward.pillsGained} 颗`;
      modalOfflineReward.classList.remove('hidden');
    }
  });

  if (btnClaimOffline) {
    btnClaimOffline.addEventListener('click', () => {
      gameManager.collectCaveEarnings();
      if (modalOfflineReward) modalOfflineReward.classList.add('hidden');
      updateCaveView();
    });
  }



      // 注册离线收益事件监听
      if (EventBus) {
        EventBus.on('OFFLINE_REWARD', (reward) => {
          if (reward && (reward.energy > 0 || reward.pills > 0)) {
            if (offlineGainEnergy) offlineGainEnergy.innerText = `+${reward.energy}`;
            if (offlineGainPills) offlineGainPills.innerText = `+${reward.pills}`;
            if (modalOfflineReward) modalOfflineReward.classList.remove('hidden');
          }
        });
      }

      // 暴露方法到对象与全局
      CaveUI.updateCaveView = updateCaveView;
      window.updateCaveView = updateCaveView;
    }
  };

  window.SlotsRPG.UI.CaveUI = CaveUI;
})();
