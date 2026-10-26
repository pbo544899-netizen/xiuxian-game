/**
 * DragonSpoutUI.js
 * 周天神龙机台、八卦唤龙操作台、12格展示陈列架与一键收纳、狂暴顿悟视觉演出
 */
(function() {
  window.SlotsRPG = window.SlotsRPG || {};
  window.SlotsRPG.UI = window.SlotsRPG.UI || {};

  let currentAutoCount = 50;

  const DragonSpoutUI = {
    init() {
      const gameManager = window.SlotsRPG.GameManager || window.gameManager;
      const EventBus = window.SlotsRPG.EventBus;
      const renderer = gameManager ? gameManager.renderer : null;
      const elCurrentLingjiInit = document.getElementById('current-lingji-val');
      if (elCurrentLingjiInit && gameManager) {
        elCurrentLingjiInit.innerText = gameManager.energy || 0;
      }

    const btnSpin = document.getElementById('btn-spin');
    const btnAutoSpin = document.getElementById('btn-auto');
    const waterTankBadge = document.getElementById('water-tank-badge');
    const viewSlots = document.getElementById('view-slots');

    const sectTrialBanner = document.getElementById('sect-trial-banner');
    const trialStageBadge = document.getElementById('trial-stage-badge');
    const trialDiffTag = document.getElementById('trial-diff-tag');
    const trialRewardTag = document.getElementById('trial-reward-tag');
    const trialTargetName = document.getElementById('trial-target-name');
    const trialTargetDesc = document.getElementById('trial-target-desc');
    const trialRecPower = document.getElementById('trial-rec-power');
    const trialPowerStatus = document.getElementById('trial-power-status');
    const btnActiveTrialChallenge = document.getElementById('btn-active-trial-challenge');
    const btnBossRadarChallenge = document.getElementById('btn-boss-radar-challenge');
    const playBattleSequence = (r, c) => window.playBattleSequence && window.playBattleSequence(r, c);
    const prologueSpinGuide = document.getElementById('prologue-spin-guide');

    const getAutoBtnTitleText = (c) => window.getAutoBtnTitleText && window.getAutoBtnTitleText(c);
    const showGameNotice = (t, c, b) => window.showGameNotice && window.showGameNotice(t, c, b);
    const updateReliefModalUI = () => window.updateReliefModalUI && window.updateReliefModalUI();
    const waitOtherModalsClosedThen = (cb) => (window.SlotsRPG.UI.ModalsUI && window.SlotsRPG.UI.ModalsUI.waitOtherModalsClosedThen) ? window.SlotsRPG.UI.ModalsUI.waitOtherModalsClosedThen(cb) : cb();

    const modalSectInduction = document.getElementById('modal-sect-induction');

    const tabCharacter = document.getElementById('tab-character');
    const elDialog = document.getElementById('cheat-dialog');

    const elAnnouncement = document.getElementById('reel-announcement');
    const elAnnouncementText = document.getElementById('announcement-text');
    const trialBtnText = document.getElementById('trial-btn-text');
    const reelFrame = document.querySelector('.reel-frame');
    const valCost = document.getElementById('val-cost');
    const valMult = document.getElementById('val-mult');
    const betPopover = document.getElementById('bet-popover');
    const betTiersList = document.getElementById('bet-tiers-list');
    const modalRelief = document.getElementById('modal-relief');
    const btnMeditateRelief = document.getElementById('btn-meditate-relief');
    const btnClaimRelief = document.getElementById('btn-claim-relief');
    const btnCloseRelief = document.getElementById('btn-close-relief');

    const modalSectTicketAwarded = document.getElementById('modal-sect-ticket-awarded');
    const ticketModalIcon = document.getElementById('ticket-modal-icon');
    const ticketModalName = document.getElementById('ticket-modal-name');
    const ticketModalSect = document.getElementById('ticket-modal-sect');
    const ticketModalDesc = document.getElementById('ticket-modal-desc');
    const btnClaimSectTicket = document.getElementById('btn-claim-sect-ticket');


      const switchTab = (tab, skipSound) => window.switchTab && window.switchTab(tab, skipSound);
      const showFloatingNotice = (msg, clr) => window.showFloatingNotice && window.showFloatingNotice(msg, clr);
      const renderBagGrid = (s) => window.renderBagGrid && window.renderBagGrid(s);


      // 1. 抽卡生命周期监听
  // 11. 监听推演开始与停轮文字宣告
  window.SlotsRPG.EventBus.on('SPIN_START', () => {
    btnSpin.classList.add('disabled');
    if (elAnnouncement) {
      elAnnouncement.classList.remove('show', 'play-anim');
    }
  });

  window.SlotsRPG.EventBus.on('SPIN_STOP', (spinData) => {
    const { evaluation } = spinData;
    // 若当前正在触发宗门拜入弹窗、伏妖战役、洞天秘境或时序执行中，严禁解禁推演按钮
    const isSpecialTransition = spinData.isSectInductionSpin ||
      isSectInductionSequenceRunning ||
      (evaluation && (evaluation.hasTriggeredBonus || evaluation.hasTriggeredBattle)) ||
      (modalSectInduction && !modalSectInduction.classList.contains('hidden'));
    if (!isSpecialTransition) {
      btnSpin.classList.remove('disabled');
    }

    if (elAnnouncement && elAnnouncementText) {
      const hasReward = evaluation.winningLines.length > 0 || evaluation.hasTriggeredBattle || evaluation.hasTriggeredBonus;

      if (!hasReward) {
        // 【时机1】无奖励时：播放“天机未显，造化隐没”
        elAnnouncementText.innerText = '天机未显，造化隐没';
      } else {
        // 【时机2】有奖励时：播放奖励文字动画
        if (evaluation.winningLines.length > 0) {
          const comboTitle = (cnt) => cnt >= 5 ? '五行合一' : (cnt === 4 ? '四象同辉' : '三才归元');
          const lineNames = evaluation.winningLines.map(l => `${comboTitle(l.matchCount || 3)}·${l.symbolName}`).join('、');
          elAnnouncementText.innerText = `阵纹共鸣!\n${lineNames} +${evaluation.totalPayout} 机缘`;
        } else if (evaluation.hasTriggeredBattle) {
          const cfg = evaluation.battleConfig;
          if (cfg && cfg.tier === 'boss') {
            elAnnouncementText.innerText = `妖王降世!\n引动 1 尊关卡霸主`;
          } else if (cfg && cfg.tier === 'elite') {
            elAnnouncementText.innerText = `大妖压境!\n引动 ${cfg.count} 头精英大妖`;
          } else if (cfg && cfg.tier === 'normal') {
            elAnnouncementText.innerText = `群妖袭来!\n引动 ${cfg.count} 头妖兽围攻`;
          } else {
            elAnnouncementText.innerText = `妖兽袭来!\n引动 ${evaluation.scatterCount} 头妖兽`;
          }
        } else if (evaluation.hasTriggeredBonus) {
          elAnnouncementText.innerText = `洞天共鸣!\n聚敛 ${evaluation.bonusCount} 道秘印`;
        }
      }

      // 【时机3】弹入与呼吸动画
      elAnnouncement.classList.remove('show', 'play-anim');
      void elAnnouncement.offsetWidth;
      elAnnouncement.classList.add('show', 'play-anim');
    }
  });



      // 2. 八卦唤龙台与周天神龙机关控制
// 15. 快速消耗档位管理已下线，统一采用固定 25 灵机与连抽次数选择器

  // 16. 八卦唤龙台水缸进度与按键状态同步 (蓄满10次呈现耀眼金焰状态，支持启动系统推演)
  function updateWaterTankUI() {
    const btnSpinEl = document.getElementById('btn-spin');
    const waterTankLiquid = document.getElementById('water-tank-liquid');
    const waterTankBadge = document.getElementById('water-tank-badge');
    const spinBtnTitle = document.getElementById('spin-btn-title');
    if (!btnSpinEl || !gameManager) return;

    const max = gameManager.waterTankMax || 10;
    let cur = gameManager.waterTankProgress || 0;

    // 若处于新手系统推演引导期，强制水缸蓄满 10/10，初始呈现发光就绪态
    const isFTUEActive = !gameManager.hasCompletedFirstDragonSpoutFTUE &&
                         !gameManager.isPrologueComplete &&
                         gameManager.prologueStep === 3 &&
                         (gameManager.prologueSpins || 0) === 0;

    if (isFTUEActive) {
      cur = max;
      gameManager.waterTankProgress = max;
    }

    const isFull = cur >= max;
    const pct = Math.min(100, Math.max(0, Math.round((cur / max) * 100)));

    if (waterTankLiquid) {
      waterTankLiquid.style.height = `${pct}%`;
    }

    if (isFull) {
      btnSpinEl.classList.remove('charging-locked');
      btnSpinEl.classList.add('tank-full');
      btnSpinEl.title = '系统灵能已蓄满！点击启动系统推演！';
      if (spinBtnTitle) spinBtnTitle.innerText = '系统推演';
      if (waterTankBadge) waterTankBadge.innerText = '已蓄满';
    } else {
      btnSpinEl.classList.remove('tank-full');
      btnSpinEl.classList.add('charging-locked');
      btnSpinEl.title = `天机蓄能中 (${cur}/${max})，需蓄满10次灵能方可启动系统推演`;
      if (spinBtnTitle) spinBtnTitle.innerText = '蓄能中';
      if (waterTankBadge) waterTankBadge.innerText = `${cur}/${max}`;
    }
  }

  // 16.1 新手引导全局聚光灯遮罩与手势联动 (除引龙吐宝按键外，其余全屏区域遮罩阻断误触)
  function updateFTUESpotlight() {
    if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
      window.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE();
      return;
    }
    if (!gameManager) return;
    const isFTUEActive = !gameManager.hasCompletedFirstDragonSpoutFTUE &&
                         !gameManager.isPrologueComplete &&
                         gameManager.prologueStep === 3 &&
                         (gameManager.prologueSpins || 0) === 0;

    const ftueMask = document.getElementById('ftue-spotlight-mask');
    const prologueSpinGuide = document.getElementById('prologue-spin-guide');
    const ftueGuideFingerWrap = document.getElementById('ftue-guide-finger-wrap');
    const btnSpinEl = document.getElementById('btn-spin');

    if (isFTUEActive) {
      updateWaterTankUI();
      document.body.classList.add('ftue-spotlight-active');
      if (ftueMask) ftueMask.classList.remove('hidden');
      if (prologueSpinGuide) prologueSpinGuide.classList.remove('hidden');
      if (ftueGuideFingerWrap) ftueGuideFingerWrap.classList.remove('hidden');
      if (btnSpinEl) btnSpinEl.classList.add('pulse-anim');
    } else {
      document.body.classList.remove('ftue-spotlight-active');
      if (ftueMask) ftueMask.classList.add('hidden');
      if (prologueSpinGuide) prologueSpinGuide.classList.add('hidden');
      if (ftueGuideFingerWrap) ftueGuideFingerWrap.classList.add('hidden');
      if (btnSpinEl) btnSpinEl.classList.remove('pulse-anim');
    }
  }

  // 遮罩点击事件：吸收误触并使目标引龙吐宝按键微震动提醒聚焦
  const ftueMaskEl = document.getElementById('ftue-spotlight-mask');
  if (ftueMaskEl) {
    ftueMaskEl.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (btnSpin) {
        btnSpin.classList.remove('pulse-anim');
        void btnSpin.offsetWidth;
        btnSpin.classList.add('pulse-anim');
      }
    });
  }

  // 引导横幅点击直接联动触发系统推演
  const prologueSpinGuideEl = document.getElementById('prologue-spin-guide');
  if (prologueSpinGuideEl) {
    prologueSpinGuideEl.addEventListener('click', () => {
      if (btnSpin) btnSpin.click();
    });
  }

  let spinBufferPending = false;

  btnSpin.addEventListener('click', () => {
    // 检查是否处于新手系统推演首抽引导期
    const isFTUEActive = !gameManager.hasCompletedFirstDragonSpoutFTUE &&
                         !gameManager.isPrologueComplete &&
                         gameManager.prologueStep === 3 &&
                         (gameManager.prologueSpins || 0) === 0;

    if (isFTUEActive) {
      gameManager.hasCompletedFirstDragonSpoutFTUE = true;
      if (window.SlotsRPG && window.SlotsRPG.StorageService) {
        window.SlotsRPG.StorageService.saveGame(gameManager, true);
      }
      // 永久退出遮罩、指引横幅与手指手势
      document.body.classList.remove('ftue-spotlight-active');
      const ftueMask = document.getElementById('ftue-spotlight-mask');
      const prologueSpinGuide = document.getElementById('prologue-spin-guide');
      const ftueGuideFingerWrap = document.getElementById('ftue-guide-finger-wrap');
      if (ftueMask) ftueMask.classList.add('hidden');
      if (prologueSpinGuide) prologueSpinGuide.classList.add('hidden');
      if (ftueGuideFingerWrap) ftueGuideFingerWrap.classList.add('hidden');
      btnSpin.classList.remove('pulse-anim');

      // 释放 100% 免费系统推演大招！
      gameManager.executeSpin({ isDragonSpout: true, isFreeOverride: true });
      return;
    }

    // 检查水缸灵能是否蓄满
    const isFull = (gameManager.waterTankProgress || 0) >= (gameManager.waterTankMax || 10);
    if (!isFull) {
      const cur = gameManager.waterTankProgress || 0;
      const max = gameManager.waterTankMax || 10;
      showFloatingNotice(`天机盘灵能蓄积中 (${cur}/${max})，请先推演修真！`, '#38bdf8');
      btnSpin.classList.remove('shake-locked');
      void btnSpin.offsetWidth;
      btnSpin.classList.add('shake-locked');
      if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('CLICK');
      }
      return;
    }

    // 正在转动中防止重复连点
    if (gameManager.renderer && gameManager.renderer.isSpinning) return;

    // 蓄满 10/10，解封点击释放 0 消耗龙皇吐宝大招！
    gameManager.executeSpin({ isDragonSpout: true });
  });

  window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.on('DRAGON_SPOUT_ALL_REVEALED', () => {
    if (spinBufferPending) {
      spinBufferPending = false;
      setTimeout(() => {
        if (!gameManager.isSpinning && (!gameManager.renderer || !gameManager.renderer.isSpinning)) {
          gameManager.executeSpin();
        }
      }, 40);
    }
  });

  const btnAutoCountToggle = document.getElementById('btn-auto-count-toggle');
  const autoCountPopover = document.getElementById('auto-count-popover');
  const autoCountLabel = document.getElementById('auto-count-label');
  const countOptBtns = document.querySelectorAll('.count-opt-btn');

  // 初始化连抽次数设置：默认 1 次单抽推演
  let currentAutoCount = 1;
  function applyAutoCount(countVal) {
    currentAutoCount = countVal === 'Infinity' ? Infinity : parseInt(countVal, 10);
    if (gameManager) gameManager.autoSpinTargetCount = currentAutoCount;
    localStorage.setItem('slots_rpg_auto_count', String(countVal));

    if (autoCountLabel) {
      autoCountLabel.innerText = currentAutoCount === Infinity ? '无限' : `${currentAutoCount}次`;
    }
    countOptBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.count === String(countVal));
    });
    const autoBtnTitle = document.getElementById('auto-btn-title');
    if (autoBtnTitle && !gameManager.isAutoSpinning) {
      autoBtnTitle.innerText = getAutoBtnTitleText(currentAutoCount);
    }
    if (btnAutoSpin) {
      btnAutoSpin.classList.toggle('ten-pull-mode', currentAutoCount === 10);
    }
  }

  // 默认选中 1 次单抽 (若本地已保存有效配置则沿用，否则默认单抽1次，避免灵机过度消耗)
  const savedCount = localStorage.getItem('slots_rpg_auto_count');
  applyAutoCount(savedCount ? savedCount : '1');

  // 玩家激活天机盘 (ARTIFACT_AWAKENED) 时：保持默认 1 次单抽
  if (EventBus) {
    EventBus.on('ARTIFACT_AWAKENED', () => {
      const currentSaved = localStorage.getItem('slots_rpg_auto_count');
      applyAutoCount(currentSaved ? currentSaved : '1');
    });
  }

  if (btnAutoCountToggle && autoCountPopover) {
    btnAutoCountToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      autoCountPopover.classList.toggle('hidden');
    });

    countOptBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        applyAutoCount(btn.dataset.count);
        autoCountPopover.classList.add('hidden');
      });
    });

    document.addEventListener('click', (e) => {
      if (!autoCountPopover.contains(e.target) && e.target !== btnAutoCountToggle) {
        autoCountPopover.classList.add('hidden');
      }
    });
  }

  
  btnAutoSpin.addEventListener('click', () => {
    if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
      window.SlotsRPG.SoundEffects.play('CLICK');
    }

    // 若新手系统推演引导仍未完成，优先聚焦唤龙台【引龙吐宝】
    const isFTUEActive = !gameManager.hasCompletedFirstDragonSpoutFTUE &&
                         !gameManager.isPrologueComplete &&
                         gameManager.prologueStep === 3 &&
                         (gameManager.prologueSpins || 0) === 0;
    if (isFTUEActive) {
      if (btnSpin) btnSpin.click();
      return;
    }

    if (gameManager.isAutoSpinning) {
      gameManager.stopAutoSpin();
      return;
    }
    if (currentAutoCount === 1) {
      // 单次推演：防连点拦截与灵机硬校验
      if (gameManager.renderer && gameManager.renderer.isSpinning) return;
      if (gameManager.energy < 25) {
        showFloatingNotice('灵机不足 (单次推演需 25 灵机)！', '#ef4444');
        gameManager.checkDailyReliefReset();
        gameManager.checkWantongSecretEgg();
        window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('ENERGY_DEPLETED', {
          canRelief: gameManager.freeReliefCount > 0,
          remainingRelief: gameManager.freeReliefCount
        });
        return;
      }
      gameManager.executeSpin();
    } else if (currentAutoCount === 10) {
      // 方案 A：周天十连（瞬时批量聚爆展示）
      if (gameManager.renderer && gameManager.renderer.isSpinning) return;
      if (gameManager.energy < 250) {
        showFloatingNotice('灵机不足 (周天十连需 250 灵机)！', '#ef4444');
        gameManager.checkDailyReliefReset();
        gameManager.checkWantongSecretEgg();
        window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('ENERGY_DEPLETED', {
          canRelief: gameManager.freeReliefCount > 0,
          remainingRelief: gameManager.freeReliefCount
        });
        return;
      }
      gameManager.executeTenPull();
    } else {
      // 50 / 100 / 无限：长线连抽自动挂机推演
      if (gameManager.energy < 25) {
        showFloatingNotice('灵机不足，无法开启连抽！', '#ef4444');
        gameManager.checkDailyReliefReset();
        gameManager.checkWantongSecretEgg();
        window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('ENERGY_DEPLETED', {
          canRelief: gameManager.freeReliefCount > 0,
          remainingRelief: gameManager.freeReliefCount
        });
        return;
      }
      gameManager.toggleAutoSpin(currentAutoCount);
    }
  });

  if (btnClaimRelief) {
    btnClaimRelief.addEventListener('click', () => {
      const ok = gameManager.claimRelief();
      if (ok) {
        if (modalRelief) modalRelief.classList.add('hidden');
        showFloatingNotice('✨ 神念灌顶，纳灵回复 +50 机缘！', '#34e89e');
      }
      updateReliefModalUI(gameManager ? gameManager.freeReliefCount : 0);
    });
  }

  if (btnMeditateRelief) {
    btnMeditateRelief.addEventListener('click', () => {
      if (modalRelief) modalRelief.classList.add('hidden');
      showFloatingNotice('🧘 沉心闭目，打坐吐纳天地灵机...', '#34e89e');
      gameManager.meditateForEnergy(res => {
        showFloatingNotice(`✨ 吐纳圆满，恢复 +${res.energyRestored} 机缘！`, '#ffd700');
      });
    });
  }

  if (btnCloseRelief) {
    btnCloseRelief.addEventListener('click', () => {
      if (modalRelief) modalRelief.classList.add('hidden');
    });
  }
  const btnCloseReliefX = document.getElementById('btn-close-relief-x');
  if (btnCloseReliefX) {
    btnCloseReliefX.addEventListener('click', () => {
      if (modalRelief) modalRelief.classList.add('hidden');
    });
  }

  // ==========================================
  // 16.1 神龙引宝 · 左右双宝匣与即时换装交互绑定
  // ==========================================
  const dragonGearCompareBar = document.getElementById('dragon-gear-compare-bar');
  const compareCurrentDesc = document.getElementById('compare-current-desc');
  const compareNewDesc = document.getElementById('compare-new-desc');
  const comparePowerDiff = document.getElementById('compare-power-diff');
  const btnGearEquip = document.getElementById('btn-gear-equip');
  const btnGearSmelt = document.getElementById('btn-gear-smelt');

  let battleCountdownTimer = null;
  window.clearBattleCountdownTimer = () => {
    if (battleCountdownTimer) {
      clearInterval(battleCountdownTimer);
      battleCountdownTimer = null;
    }
  };

  const dragonRageBarFill = document.getElementById('dragon-rage-bar-fill');
  const dragonRageText = document.getElementById('dragon-rage-text');

  const btnAutoFilter = document.getElementById('btn-auto-filter');
  const autoFilterPopover = document.getElementById('auto-filter-popover');
  const btnCloseFilter = document.getElementById('btn-close-filter');
  const chkAutoEquip = document.getElementById('chk-auto-equip');
  const chkAutoSmelt = document.getElementById('chk-auto-smelt');
  const chkPauseUpgrade = document.getElementById('chk-pause-upgrade');
  const chkAutoFight = document.getElementById('chk-auto-fight');

  // 宝萃展示与龙威数据流驱动
  window.SlotsRPG.EventBus.on('DRAGON_LOOT_PRESENTED', (data) => {
    const { dragonRage } = data;

    // 1. 更新真龙狂暴进度与内嵌光环/能量细槽
    if (gameManager && gameManager.dragonCabinetManager && gameManager.dragonCabinetManager.updateRage) {
      gameManager.dragonCabinetManager.updateRage(dragonRage);
    } else if (dragonRageBarFill && dragonRageText) {
      const rage = Math.min(100, Math.max(0, dragonRage || 0));
      dragonRageBarFill.style.width = `${rage}%`;
      dragonRageText.innerText = `${rage} / 100`;
    }

    // 2. 装备对比栏已移出主界面视觉，保持隐藏避免遮挡
    if (dragonGearCompareBar) {
      dragonGearCompareBar.classList.add('hidden');
    }
  });

  // 掉落结算已由 DragonSpoutRenderer 龙口吐宝动画与临时背包接管，抽奖不再向角色修真飞入

  // 伏妖遭遇战就绪通知 (在所有奖励显示全后唤起，下方挑战横幅变身为当前妖兽挑战)
  window.SlotsRPG.EventBus.on('DRAGON_BATTLE_READY', (data) => {
    const { monsterName, isAutoSpinning } = data;
    if (dragonGearCompareBar) dragonGearCompareBar.classList.add('hidden');

    // 变身下方宗门挑战横幅
    updateSectTrialBanner();
    if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
      window.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE();
    }

    if (battleCountdownTimer) {
      clearInterval(battleCountdownTimer);
      battleCountdownTimer = null;
    }

    if (isAutoSpinning) {
      let secondsLeft = 3;
      if (trialBtnText) trialBtnText.innerText = `拔剑迎战 (${secondsLeft}s)`;
      battleCountdownTimer = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
          clearInterval(battleCountdownTimer);
          battleCountdownTimer = null;
          if (gameManager && gameManager.executePendingBattle) {
            gameManager.executePendingBattle();
          }
        } else {
          if (trialBtnText) trialBtnText.innerText = `拔剑迎战 (${secondsLeft}s)`;
            }
      }, 1000);
    } else {
      if (trialBtnText) trialBtnText.innerText = `拔剑迎战`;
    }
  });


  window.SlotsRPG.EventBus.on('BATTLE_START', () => {
    if (dragonBattlePrompt) dragonBattlePrompt.classList.add('hidden');
    if (battleCountdownTimer) {
      clearInterval(battleCountdownTimer);
      battleCountdownTimer = null;
    }
    updateSectTrialBanner();
  });

  // 一键穿戴 (旧装回炉)
  if (btnGearEquip) {
    btnGearEquip.addEventListener('click', () => {
      if (gameManager.dragonCabinetManager) {
        const res = gameManager.dragonCabinetManager.equipNewItem();
        if (res && res.success) {
          if (dragonGearCompareBar) dragonGearCompareBar.classList.add('hidden');
          if (renderer && renderer.addFloatingText) {
            renderer.addFloatingText(`换装成功！战力提升 +${res.powerDiff}！`, '#38ef7d');
          }
        }
      }
    });
  }

  // 熔炼换灵
  if (btnGearSmelt) {
    btnGearSmelt.addEventListener('click', () => {
      if (gameManager.dragonCabinetManager) {
        const res = gameManager.dragonCabinetManager.smeltNewItem();
        if (res && res.success) {
          if (dragonGearCompareBar) dragonGearCompareBar.classList.add('hidden');
          if (renderer && renderer.addFloatingText) {
            renderer.addFloatingText(`熔铸神兵！获得 +${res.energy} 机缘`, '#ffd700');
          }
        }
      }
    });
  }

  // 自动筛选浮层
  if (btnAutoFilter) {
    btnAutoFilter.addEventListener('click', () => {
      if (autoFilterPopover) autoFilterPopover.classList.toggle('hidden');
    });
  }
  if (btnCloseFilter) {
    btnCloseFilter.addEventListener('click', () => {
      if (autoFilterPopover) autoFilterPopover.classList.add('hidden');
    });
  }
  if (chkAutoEquip) {
    chkAutoEquip.addEventListener('change', (e) => {
      if (gameManager.dragonCabinetManager) {
        gameManager.dragonCabinetManager.autoSettings.autoEquipBetter = e.target.checked;
      }
    });
  }
  if (chkAutoSmelt) {
    chkAutoSmelt.addEventListener('change', (e) => {
      if (gameManager.dragonCabinetManager) {
        gameManager.dragonCabinetManager.autoSettings.autoSmeltLesser = e.target.checked;
      }
    });
  }
  if (chkPauseUpgrade) {
    chkPauseUpgrade.addEventListener('change', (e) => {
      if (gameManager.dragonCabinetManager) {
        gameManager.dragonCabinetManager.autoSettings.pauseOnPowerIncrease = e.target.checked;
      }
    });
  }
  if (chkAutoFight) {
    chkAutoFight.addEventListener('change', (e) => {
      if (gameManager.dragonCabinetManager) {
        gameManager.dragonCabinetManager.autoSettings.autoFightMonsters = e.target.checked;
      }
    });
  }

  window.SlotsRPG.EventBus.on('DRAGON_FRENZY_TRIGGERED', (data) => {
    if (renderer && renderer.addFloatingText) {
      renderer.addFloatingText('⚡【系统顿悟 · 狂暴推演】金光耀世！追加免消耗狂暴大爆！', '#ffd700');
    }
    const rageTitle = document.getElementById('dragon-rage-title');
    if (rageTitle) rageTitle.innerText = '⚡【系统顿悟】狂暴推演中！极品现世！';

    // 1. 龙头高能变色发光光环
    const headSprite = document.getElementById('dragon-head-sprite');
    if (headSprite) {
      headSprite.classList.add('dragon-head-frenzy');
      setTimeout(() => headSprite.classList.remove('dragon-head-frenzy'), 2800);
    }

    // 2. 全屏金色与赤霞光环流转动效
    const oldOverlay = document.querySelector('.frenzy-screen-overlay');
    if (oldOverlay) oldOverlay.remove();
    const overlay = document.createElement('div');
    overlay.className = 'frenzy-screen-overlay';
    document.body.appendChild(overlay);
    setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 2200);

    // 3. 画面震颤与大爆音效
    const viewSlots = document.getElementById('view-slots');

    const sectTrialBanner = document.getElementById('sect-trial-banner');
    const trialStageBadge = document.getElementById('trial-stage-badge');
    const trialDiffTag = document.getElementById('trial-diff-tag');
    const trialRewardTag = document.getElementById('trial-reward-tag');
    const trialTargetName = document.getElementById('trial-target-name');
    const trialTargetDesc = document.getElementById('trial-target-desc');
    const trialRecPower = document.getElementById('trial-rec-power');
    const trialPowerStatus = document.getElementById('trial-power-status');
    const btnActiveTrialChallenge = document.getElementById('btn-active-trial-challenge');
    const prologueSpinGuide = document.getElementById('prologue-spin-guide');

    const getAutoBtnTitleText = (c) => window.getAutoBtnTitleText && window.getAutoBtnTitleText(c);
    const showGameNotice = (t, c, b) => window.showGameNotice && window.showGameNotice(t, c, b);
    const updateReliefModalUI = () => window.updateReliefModalUI && window.updateReliefModalUI();
    const waitOtherModalsClosedThen = (cb) => (window.SlotsRPG.UI.ModalsUI && window.SlotsRPG.UI.ModalsUI.waitOtherModalsClosedThen) ? window.SlotsRPG.UI.ModalsUI.waitOtherModalsClosedThen(cb) : cb();

    const modalSectInduction = document.getElementById('modal-sect-induction');

    const tabCharacter = document.getElementById('tab-character');
    const elDialog = document.getElementById('cheat-dialog');

    if (viewSlots) {
      viewSlots.classList.remove('view-slots-shake');
      void viewSlots.offsetWidth;
      viewSlots.classList.add('view-slots-shake');
      setTimeout(() => viewSlots.classList.remove('view-slots-shake'), 450);
    }
    if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
      window.SlotsRPG.SoundEffects.play('TREASURE_BURST');
    }
  });



      // 3. 12 格暂存陈列架与一键收纳逻辑
  // 24. 商业化与修仙爽感事件总线监听 (PRD 9 & 10 节)
  window.SlotsRPG.EventBus.on('ASCENSION_WORLD_TIER_UP', (data) => {
    document.body.classList.add('tier-spirit-realm');
    showFloatingNotice('⚡ 天门大开！道友已跃迁至【灵界 · 飘渺仙域】！', '#ffd700');
  });

  window.SlotsRPG.EventBus.on('TICKETS_UPDATED', (data) => {
    showGameNotice(
      '仙道机缘 · 获天机瞬发符',
      `<p style="line-height:1.6; color:#e2e8f0;">
        道友仙缘深厚，天道特赐 <b>${data.ticketsGranted} 张【天机瞬发符】</b>！<br/>
        （持符可在任意仙道机缘处<b>0秒直接秒领</b>，当前持有: <b style="color:#ffd700;">${data.totalTickets}</b> 张）
      </p>`,
      '✨ 天赐福泽'
    );
  });

  // 灵机扣除飘字与龙头灌注反馈 (需求 1)
  window.SlotsRPG.EventBus.on('SPIN_COST_DEDUCTED', (data = {}) => {
    const cost = data.cost || 0;
    const energy = data.energy;
    const elCurrentLingji = document.getElementById('current-lingji-val');
    if (elCurrentLingji && typeof energy === 'number') {
      elCurrentLingji.innerText = energy;
    }
    // 1. 灵机减少飘字
    const floatEl = document.getElementById('lingji-cost-float');
    if (floatEl) {
      if (data && data.isFree) {
        floatEl.innerText = '免费引宝';
        floatEl.style.color = '#ffd700';
      } else {
        floatEl.innerText = `-${cost}`;
        floatEl.style.color = '#ff4d4f';
      }
      floatEl.classList.remove('hidden', 'anim-cost-float');
      void floatEl.offsetWidth; // 触发 reflow
      floatEl.classList.add('anim-cost-float');
      setTimeout(() => {
        floatEl.classList.add('hidden');
      }, 850);
    }

    // 2. 龙头得到灵机灌注高光动效
    const headBox = document.querySelector('.dragon-head-box');
    if (headBox) {
      headBox.classList.remove('infusing');
      void headBox.offsetWidth;
      headBox.classList.add('infusing');
      setTimeout(() => headBox.classList.remove('infusing'), 700);
    }
  });

  // 临时背包自动收纳开关 (需求 3: 抽一次收纳一次)
  const chkAutoCollect = document.getElementById('chk-auto-collect');
  if (chkAutoCollect) {
    const savedAutoCollect = localStorage.getItem('slots_rpg_auto_collect') === 'true';
    chkAutoCollect.checked = savedAutoCollect;
    if (gameManager) gameManager.autoCollect = savedAutoCollect;

    chkAutoCollect.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      if (gameManager) gameManager.autoCollect = isChecked;
      localStorage.setItem('slots_rpg_auto_collect', isChecked ? 'true' : 'false');
      showFloatingNotice(isChecked ? '已开启【自动收纳】：抽一次收纳一次' : '已关闭【自动收纳】', isChecked ? '#34d399' : '#94a3b8');
    });
  }

  let isCollectingSlots = false;

  /**
   * 临时背包【一键收纳】与【自动收纳】通用执行函数
   * 将 12 格天机宝萃中的宝物以优雅抛物线依次飞入底部【角色修真】乾坤袋，伴随果冻回弹与红点累加
   * @param {boolean} isAuto - 是否由自动收纳静默唤起
   */
  function collectAllTemporarySlots(isAuto = false) {
    if (gameManager) {
      gameManager.hasCompletedCollectFTUE = true;
    }
    const dcm = gameManager && gameManager.dragonCabinetManager;
    if (!dcm || !dcm.slots || dcm.slots.length === 0) {
      if (!isAuto) {
        showFloatingNotice('临时背包空空如也，快启动系统推演吧！', '#94a3b8');
      }
      return;
    }
    if (isCollectingSlots) return;
    isCollectingSlots = true;

    const totalCount = dcm.slots.length;
    const itemsToFly = [];

    dcm.slots.forEach((s, idx) => {
      const slotEl = document.getElementById(`dragon-slot-${idx}`);
      let iconSrc = 'assets/symbols/SYM_06.png';
      if (s.icon) iconSrc = s.icon;
      else if (s.item && s.item.icon) iconSrc = s.item.icon;
      else if (s.type === 'energy') iconSrc = 'assets/symbols/SYM_05.png';
      else if (s.type === 'pill') iconSrc = 'assets/symbols/SYM_07.png';
      else if (s.type === 'rune') iconSrc = 'assets/symbols/SYM_01.png';
      else if (s.type === 'battle') iconSrc = 'assets/symbols/SYM_12.png';
      else if (s.type === 'bonus') iconSrc = 'assets/symbols/SYM_13.png';

      itemsToFly.push({
        icon: iconSrc,
        element: slotEl,
        name: s.name,
        count: s.count || 1
      });
    });

    // 播放纳宝入袋音效
    if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
      window.SlotsRPG.SoundEffects.play('REWARD_DROP');
    }

    // 执行飞入底部【角色修真】乾坤袋的优雅抛物线动画
    if (window.SlotsRPG && window.SlotsRPG.DropAnimator && tabCharacter) {
      window.SlotsRPG.DropAnimator.playDropAnimationFromElements(
        itemsToFly,
        tabCharacter,
        (arrivedItem) => {
          if (window.incrementNotificationBadge) window.incrementNotificationBadge((arrivedItem && arrivedItem.count) ? arrivedItem.count : 1);
        }
      );
    } else {
      if (window.incrementNotificationBadge) window.incrementNotificationBadge(totalCount);
    }

    // 延时清空展示区槽位，让飞行动画有清晰的离位起飞感
    setTimeout(() => {
      dcm.collectAllToInventory();
      isCollectingSlots = false;
      if (!isAuto) {
        showFloatingNotice(`✨ 一键收纳成功！${totalCount} 份天机宝萃已归入乾坤袋`, '#38ef7d');
      if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
        window.SlotsRPG.SpotlightGuide.scheduleCheck(600);
      }
      }
    }, 120);
  }

  // 监听龙头吐宝完全展示完毕：若开启自动收纳，则触发顺畅收纳入袋动效
  window.SlotsRPG.EventBus.on('DRAGON_SPOUT_ALL_REVEALED', (spinResult) => {
    const isFirstFTUESpin = gameManager && !gameManager.isPrologueComplete && gameManager.prologueStep === 3 && gameManager.prologueSpins === 1 && !gameManager.hasCompletedCollectFTUE;
    if (chkAutoCollect && chkAutoCollect.checked && !isFirstFTUESpin) {
      setTimeout(() => {
        collectAllTemporarySlots(true);
      }, 200);
    }
  });

  // 临时背包一键收纳按钮
  const btnCollectAllSlots = document.getElementById('btn-collect-all-slots');
  if (btnCollectAllSlots) {
    btnCollectAllSlots.addEventListener('click', () => {
      collectAllTemporarySlots(false);
    });
  }

  // 临时背包智能过滤设置面板
  const btnOpenFilterSettings = document.getElementById('btn-open-filter-settings');
  const modalFilterSettings = document.getElementById('modal-filter-settings');
  const btnCloseFilterSettings = document.getElementById('btn-close-filter-settings');
  const btnSaveFilterSettings = document.getElementById('btn-save-filter-settings');
  const chkFilterQ1 = document.getElementById('chk-filter-q1');
  const chkFilterQ2 = document.getElementById('chk-filter-q2');
  const chkFilterQ3 = document.getElementById('chk-filter-q3');
  const chkFilterAutoEquip = document.getElementById('chk-filter-auto-equip');
  const chkFilterSmeltLesser = document.getElementById('chk-filter-smelt-lesser');

  function syncFilterSettingsUI() {
    const inv = gameManager && gameManager.inventory;
    const dcm = gameManager && gameManager.dragonCabinetManager;
    if (chkFilterQ1 && inv) chkFilterQ1.checked = (inv.autoSalvageQualities || []).includes('Q1');
    if (chkFilterQ2 && inv) chkFilterQ2.checked = (inv.autoSalvageQualities || []).includes('Q2');
    if (chkFilterQ3 && inv) chkFilterQ3.checked = (inv.autoSalvageQualities || []).includes('Q3');
    if (chkFilterAutoEquip && dcm) chkFilterAutoEquip.checked = !!dcm.autoSettings.autoEquipBetter;
    if (chkFilterSmeltLesser && dcm) chkFilterSmeltLesser.checked = !!dcm.autoSettings.autoSmeltLesser;
  }

  if (btnOpenFilterSettings && modalFilterSettings) {
    btnOpenFilterSettings.addEventListener('click', () => {
      syncFilterSettingsUI();
      modalFilterSettings.classList.remove('hidden');
    });
  }

  if (btnCloseFilterSettings && modalFilterSettings) {
    btnCloseFilterSettings.addEventListener('click', () => {
      modalFilterSettings.classList.add('hidden');
    });
  }

  if (btnSaveFilterSettings && modalFilterSettings) {
    btnSaveFilterSettings.addEventListener('click', () => {
      const inv = gameManager && gameManager.inventory;
      const dcm = gameManager && gameManager.dragonCabinetManager;
      if (inv) {
        const qualities = [];
        if (chkFilterQ1 && chkFilterQ1.checked) qualities.push('Q1');
        if (chkFilterQ2 && chkFilterQ2.checked) qualities.push('Q2');
        if (chkFilterQ3 && chkFilterQ3.checked) qualities.push('Q3');
        inv.autoSalvageQualities = qualities;
        inv.autoSalvageEnabled = qualities.length > 0;
      }
      if (dcm) {
        if (chkFilterAutoEquip) dcm.autoSettings.autoEquipBetter = chkFilterAutoEquip.checked;
        if (chkFilterSmeltLesser) dcm.autoSettings.autoSmeltLesser = chkFilterSmeltLesser.checked;
      }
      modalFilterSettings.classList.add('hidden');
      showFloatingNotice('✨ 天机智能熔炼与过滤规则已保存生效！', '#38ef7d');
      if (window.SlotsRPG && window.SlotsRPG.StorageService) {
        window.SlotsRPG.StorageService.saveGame(gameManager, true);
      }
    });
  }

  // 监听天机宝萃满额溢出：自动安全转存乾坤袋，累加角色背包红点
  window.SlotsRPG.EventBus.on('REWARD_OVERFLOW_SAVED', () => {
    if (window.incrementNotificationBadge) window.incrementNotificationBadge(1);
  });

  window.SlotsRPG.EventBus.on('CHATTER_UPDATED', (data) => {
    if (elDialog) {
      elDialog.innerText = data.text;
    }
  });

  window.SlotsRPG.EventBus.on('SMART_STOP_TRIGGERED', (data) => {
    showFloatingNotice(`【天机智能停机】${data.reason}`, '#ffd700');
  });

  // 25. 500抽长线成长事件监听：天机盘升阶与全神装发放下一门派门票
  window.SlotsRPG.EventBus.on('POT_SUB_LEVEL_UP', ({ level, title }) => {
    if (elAnnouncement && elAnnouncementText) {
      elAnnouncementText.innerHTML = `✨ <b>天机盘进阶！</b> 突破至 Lv.${level}【${title}】，高阶法宝爆率大幅跃迁！`;
      elAnnouncement.classList.add('visible');
      setTimeout(() => {
        elAnnouncement.classList.remove('visible');
      }, 3500);
    }
    showFloatingNotice(`✨ 天机盘进阶至 Lv.${level}【${title}】！`, '#ffd700');
  });

  window.SlotsRPG.EventBus.on('FULL_SET_SECT_TICKET_AWARDED', ({ ticket }) => {
    if (!ticket) return;
    if (ticketModalName) ticketModalName.innerText = ticket.tokenName || '太乙丹霞宗令';
    if (ticketModalSect) ticketModalSect.innerText = `${ticket.sectName || '太乙丹霞宗'} · 真传法牒`;
    if (ticketModalDesc) ticketModalDesc.innerText = ticket.desc || ticket.description || '持此法令可在转世时直接拜入新仙门！';

    // 等待其它弹窗关闭后再行展示
    waitOtherModalsClosedThen(() => {
      if (modalSectTicketAwarded) {
        modalSectTicketAwarded.classList.remove('hidden');
        if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
          window.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE();
        }
        if (window.SlotsRPG && window.SlotsRPG.SoundEffects) window.SlotsRPG.SoundEffects.play('MODAL_OPEN');
      }
    });
    showFloatingNotice(`🌟 妖王伏诛，六道大圆满！获得【${ticket.tokenName || '宗门法令'}】！`, '#ffd700');
  });

  if (btnClaimSectTicket) {
    btnClaimSectTicket.addEventListener('click', () => {
      if (modalSectTicketAwarded) modalSectTicketAwarded.classList.add('hidden');
      if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
        window.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE();
      }
      if (window.SlotsRPG && window.SlotsRPG.SoundEffects) window.SlotsRPG.SoundEffects.play('MODAL_CLOSE');
      showFloatingNotice('🌟 执掌宗门法令，静待飞升大典！', '#ffd700');
    });
  }



      // 暴露方法到对象与全局
        function updateSectTrialBanner() {
    if (!sectTrialBanner || !gameManager) return;
    const prologueSpinGuide = document.getElementById('prologue-spin-guide');

    // 【核心改动 4】：当触发伏妖遭遇战时，下方的挑战横幅临时变更为触发的伏妖挑战
    if (gameManager.pendingBattleData) {
      const pData = gameManager.pendingBattleData;
      sectTrialBanner.classList.remove('hidden');
      sectTrialBanner.classList.add('battle-triggered-mode');
      if (prologueSpinGuide) prologueSpinGuide.classList.add('hidden');

      if (trialStageBadge) trialStageBadge.innerText = '⚠️ 妖兽突袭';
      if (trialDiffTag) {
        trialDiffTag.className = 'trial-diff-tag danger';
        trialDiffTag.innerText = '紧急迎战';
      }
      if (trialRewardTag) trialRewardTag.innerText = '🎁 降妖机缘';
      if (trialTargetName) trialTargetName.innerText = `${pData.monsterName || '恶兽突袭'}！`;
      if (trialRecPower) trialRecPower.innerText = (gameManager.player ? gameManager.player.combatPower : 35);
      if (trialPowerStatus) {
        trialPowerStatus.className = 'trial-power-status danger';
        trialPowerStatus.innerText = '临阵对决';
      }
      if (btnActiveTrialChallenge) {
        btnActiveTrialChallenge.classList.remove('disabled');
        btnActiveTrialChallenge.disabled = false;
        btnActiveTrialChallenge.classList.add('pulse-gold');
      }
      if (trialBtnText) trialBtnText.innerText = '拔剑迎战';
      return;
    }

    // 恢复常规宗门试炼横幅样式
    sectTrialBanner.classList.remove('battle-triggered-mode');

    const hasJoinedSect = !!(gameManager.currentWorldTier === 2 || (gameManager.player && gameManager.player.currentSect && !gameManager.player.isMortal));

    // 联动更新水缸蓄水状态与新手全局聚光灯引导
    updateWaterTankUI();
    updateFTUESpotlight();

    const autoBtnTitle = document.getElementById('auto-btn-title');
    if (btnAutoSpin) {
      btnAutoSpin.classList.remove('ftue-highlight');
      if (autoBtnTitle && !gameManager.isAutoSpinning && (!gameManager.renderer || !gameManager.renderer.isSpinning)) {
        autoBtnTitle.innerText = getAutoBtnTitleText(currentAutoCount);
      }
    }

    if (!hasJoinedSect) {
      sectTrialBanner.classList.add('hidden');
      return;
    }

    // 已加入宗门：开放挑战入口，神兵必出提示框永久不再显示
    sectTrialBanner.classList.remove('hidden');

    const info = (typeof gameManager.getCurrentTrialStageInfo === 'function') ? gameManager.getCurrentTrialStageInfo() : null;
    if (!info || info.isMortal) {
      sectTrialBanner.classList.add('hidden');
      return;
    }

    if (info.isAllCleared) {
      sectTrialBanner.classList.remove('boss-ready');
      if (trialStageBadge) trialStageBadge.innerText = '试炼圆满';
      if (trialDiffTag) {
        trialDiffTag.className = 'trial-diff-tag';
        trialDiffTag.innerText = '已通关';
      }
      if (trialRewardTag) trialRewardTag.innerText = '✨ 门派妖魔已全灭';
      if (trialTargetName) trialTargetName.innerText = '本门派试炼与守关妖王已全数荡平！';
      if (trialRecPower) trialRecPower.innerText = '-';
      if (trialPowerStatus) {
        trialPowerStatus.className = 'trial-power-status safe';
        trialPowerStatus.innerText = '登峰造极';
      }
      if (btnActiveTrialChallenge) {
        btnActiveTrialChallenge.classList.remove('pulse-gold');
        btnActiveTrialChallenge.classList.add('disabled');
        btnActiveTrialChallenge.disabled = true;
      }
      if (trialBtnText) trialBtnText.innerText = '已通关';
      return;
    }

    if (btnActiveTrialChallenge) {
      btnActiveTrialChallenge.classList.remove('disabled');
      btnActiveTrialChallenge.disabled = false;
    }

    if (info.isFinalBoss) {
      sectTrialBanner.classList.add('boss-ready');
      if (trialStageBadge) trialStageBadge.innerText = '🔥 守关大妖王';
      if (trialDiffTag) {
        trialDiffTag.className = 'trial-diff-tag boss';
        trialDiffTag.innerText = '妖王';
      }
      if (trialRewardTag) trialRewardTag.innerText = '🎁 破关晋阶大礼';
      if (trialTargetName) trialTargetName.innerText = info.title;
      if (trialRecPower) trialRecPower.innerText = info.reqPower;

      const isReady = info.playerPower >= info.reqPower;
      if (trialPowerStatus) {
        trialPowerStatus.className = `trial-power-status ${isReady ? 'safe' : (info.playerPower >= info.reqPower * 0.85 ? 'hard' : 'danger')}`;
        trialPowerStatus.innerText = isReady ? '可斩杀' : (info.playerPower >= info.reqPower * 0.85 ? '可试剑' : '凶险');
      }
      if (trialBtnText) trialBtnText.innerText = isReady ? '斩灭妖王' : '拔剑试剑';
      if (btnActiveTrialChallenge) {
        btnActiveTrialChallenge.classList.toggle('pulse-gold', isReady);
      }
    } else {
      sectTrialBanner.classList.remove('boss-ready');
      const isSpirit = gameManager.currentWorldTier === 2;
      if (trialStageBadge) trialStageBadge.innerText = isSpirit ? `仙域天梯 第 ${info.stageIndex}/12 阶` : `试炼 第 ${info.stageIndex}/12 关`;
      if (trialDiffTag) {
        trialDiffTag.className = `trial-diff-tag ${info.tier === 'elite' ? 'elite' : ''}`;
        trialDiffTag.innerText = info.tier === 'elite' ? '精英' : '普通';
      }
      if (trialRewardTag) {
        const rewardEnergy = (info.rewards && info.rewards.energy) || (150 + info.stageIndex * 25);
        trialRewardTag.innerText = `🎁 奖 ${rewardEnergy} 机缘`;
      }
      if (trialTargetName) trialTargetName.innerText = info.title;
      if (trialRecPower) trialRecPower.innerText = info.reqPower;

      const isReady = info.playerPower >= info.reqPower;
      if (trialPowerStatus) {
        trialPowerStatus.className = `trial-power-status ${isReady ? 'safe' : (info.playerPower >= info.reqPower * 0.85 ? 'hard' : 'danger')}`;
        trialPowerStatus.innerText = isReady ? '可斩杀' : (info.playerPower >= info.reqPower * 0.85 ? '势均力敌' : '凶险');
      }
      if (trialBtnText) trialBtnText.innerText = isReady ? '拔剑斩妖' : '拔剑试刀';
      if (btnActiveTrialChallenge) {
        btnActiveTrialChallenge.classList.toggle('pulse-gold', isReady);
      }
    }
  }

  // 主动挑战事件发起处理 (零消耗，随时检验换装输出与战力成长)
  function handleActiveTrialChallenge() {
    if (gameManager) {
      gameManager.hasCompletedTrialFTUE = true;
      if (window.SlotsRPG.StorageService) {
        window.SlotsRPG.StorageService.saveGame(gameManager, true);
      }
    }
    // 【核心改动 4】：若当前有暂存的伏妖遭遇战，点击优先响应拔剑迎战
    if (gameManager.pendingBattleData) {
      if (battleCountdownTimer) {
        clearInterval(battleCountdownTimer);
        battleCountdownTimer = null;
      }
      gameManager.executePendingBattle();
      return;
    }

    const hasJoinedSect = !!(gameManager.currentWorldTier === 2 || (gameManager.player && gameManager.player.currentSect && !gameManager.player.isMortal));
    if (!hasJoinedSect) {
      showFloatingNotice('凡人未入门派，请先叩问仙门拜入宗门！');
      return;
    }
    if (gameManager.isSpinning) {
      showFloatingNotice('天机盘推演中，请稍候！');
      return;
    }
    const info = (typeof gameManager.getCurrentTrialStageInfo === 'function') ? gameManager.getCurrentTrialStageInfo() : null;
    if (info && info.isAllCleared) {
      showFloatingNotice('本门派试炼与守关妖王已全数荡平！');
      return;
    }

    // 系统战力检测与灵犀预警
    if (info && info.playerPower < info.reqPower) {
      if (window.SlotsRPG && window.SlotsRPG.StoryManager) {
        window.SlotsRPG.StoryManager.showSystemTip('power_low', {
          playerPower: info.playerPower,
          recPower: info.reqPower
        });
      }
    }

    if (window.SlotsRPG && window.SlotsRPG.BGMPlayer) {
      window.SlotsRPG.BGMPlayer.setDucking(true);
    }
    // 挂起自动旋转，战毕退出后继续维持旋转
    if (gameManager.isAutoSpinning) {
      gameManager.suspendAutoSpinForBattle();
    }

    const curSect = (gameManager.currentWorldTier === 2) ? 'spirit_realm' : ((gameManager.player && gameManager.player.currentSect) || 'wanjian');
    const stage = gameManager.sectTrialStage || 1;
    const wTier = gameManager.currentWorldTier || 1;
    const storyConfig = window.SlotsRPG && window.SlotsRPG.StoryConfig;
    const storyManager = window.storyManager || (window.SlotsRPG && window.SlotsRPG.StoryManager);
    const chapterId = (storyConfig && typeof storyConfig.getMilestoneChapter === 'function')
      ? storyConfig.getMilestoneChapter(curSect, stage, 'start', wTier)
      : null;

    const executeTrialBattle = () => {
      const battleResult = gameManager.startActiveTrialChallenge({ skipStoryEmit: true });
      if (battleResult && battleResult.success === false) {
        showFloatingNotice(battleResult.reason || '无法发起挑战');
        return;
      }
      playBattleSequence(battleResult);
    };

    // 若有战前剧情对白，严格先展示完剧情对白，待关闭后再启动战斗，杜绝战斗提前抢跑打断剧情沉浸
    if (chapterId && storyManager) {
      storyManager.triggerChapter(chapterId, () => {
        executeTrialBattle();
      });
    } else {
      executeTrialBattle();
    }
  }

  if (btnActiveTrialChallenge) {
    btnActiveTrialChallenge.addEventListener('click', handleActiveTrialChallenge);
  }
  if (btnBossRadarChallenge) {
    btnBossRadarChallenge.addEventListener('click', handleActiveTrialChallenge);
  }

  // 监听全局状态变更驱动水缸液体与聚光灯更新
  if (window.SlotsRPG && window.SlotsRPG.EventBus) {
    window.SlotsRPG.EventBus.on('STATE_CHANGE', () => {
      updateWaterTankUI();
      updateFTUESpotlight();
    });
    window.SlotsRPG.EventBus.on('SPIN_STOP', () => {
      updateWaterTankUI();
      updateFTUESpotlight();
    });
  }

  // 初始启动执行一次
  updateWaterTankUI();
  updateFTUESpotlight();

  DragonSpoutUI.collectAllTemporarySlots = collectAllTemporarySlots;
  DragonSpoutUI.updateSectTrialBanner = updateSectTrialBanner;
  DragonSpoutUI.updateWaterTankUI = updateWaterTankUI;
  DragonSpoutUI.updateFTUESpotlight = updateFTUESpotlight;
  DragonSpoutUI.handleActiveTrialChallenge = handleActiveTrialChallenge;
  window.updateSectTrialBanner = updateSectTrialBanner;
  window.updateWaterTankUI = updateWaterTankUI;
  window.updateFTUESpotlight = updateFTUESpotlight;
  window.collectAllTemporarySlots = collectAllTemporarySlots;
  window.handleActiveTrialChallenge = handleActiveTrialChallenge;
    }
  };

  window.SlotsRPG.UI.DragonSpoutUI = DragonSpoutUI;
})();
