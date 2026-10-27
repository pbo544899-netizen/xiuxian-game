/**
 * BattleUI.js
 * 伏妖战场、修仙对决画卷切场、技能与飘字演出、战斗结算弹窗
 */
(function() {
  window.SlotsRPG = window.SlotsRPG || {};
  window.SlotsRPG.UI = window.SlotsRPG.UI || {};

  const BattleUI = {
    init() {
      const gameManager = window.SlotsRPG.GameManager || window.gameManager;
      const renderer = (gameManager && gameManager.renderer) || window.renderer;

      const storyManager = window.SlotsRPG.StoryManager || window.storyManager;
      const updateCaveView = () => window.updateCaveView && window.updateCaveView();
      const openRewardedAdModal = (t, r, c) => window.openRewardedAdModal && window.openRewardedAdModal(t, r, c);
      const updateSectTrialBanner = () => window.updateSectTrialBanner && window.updateSectTrialBanner();

      const EventBus = window.SlotsRPG.EventBus;

    const modalBattleArena = document.getElementById('modal-battle-arena');
    const battleRoundBadge = document.getElementById('battle-round-badge');
    const battleBossTitle = document.getElementById('battle-boss-title');
    const battleBossName = document.getElementById('battle-boss-name');
    const battleBossHpFill = document.getElementById('battle-boss-hp-fill');
    const battleBossHpText = document.getElementById('battle-boss-hp-text');
    const battleBossHud = document.getElementById('battle-boss-hud');
    const battleBossImg = document.getElementById('battle-boss-img');
    const battleMonstersContainer = document.getElementById('battle-monsters-container');
    const battleSwordBeam = document.getElementById('battle-sword-beam');
    const battleFloatingContainer = document.getElementById('battle-floating-container');
    const battleHeroImg = document.getElementById('battle-hero-img');
    const battleHeroName = document.getElementById('battle-hero-name');
    const battleHeroHpFill = document.getElementById('battle-hero-hp-fill');
    const battleHeroHpText = document.getElementById('battle-hero-hp-text');
    const battleHeroPower = document.getElementById('battle-hero-power');
    const battleTalismanStatus = document.getElementById('battle-talisman-status');
    const battlePillStatus = document.getElementById('battle-pill-status');
    const battleLogText = document.getElementById('battle-log-text');
    const btnBattleSpeed = document.getElementById('btn-battle-speed');
    const modalBattleVictory = document.getElementById('modal-battle-victory');
    const victorySubtitle = document.getElementById('victory-subtitle');
    const victoryBreakthroughBox = document.getElementById('victory-breakthrough-box');
    const victoryRewardExp = document.getElementById('victory-reward-exp');
    const victoryRewardEnergy = document.getElementById('victory-reward-energy');
    const victoryItemsGrid = document.getElementById('victory-items-grid');
    const btnVictoryClaim = document.getElementById('btn-victory-claim');
    const chkVictoryAutoClose = document.getElementById('chk-victory-auto-close');
    const victoryAutoCloseCountdown = document.getElementById('victory-auto-close-countdown');
    const modalBattleDefeat = document.getElementById('modal-battle-defeat');
    const btnDefeatConfirm = document.getElementById('btn-defeat-confirm');
    const chkDefeatAutoClose = document.getElementById('chk-defeat-auto-close');
    const defeatAutoCloseCountdown = document.getElementById('defeat-auto-close-countdown');
    let victoryAutoCloseTimer = null;
    let defeatAutoCloseTimer = null;
    const defeatDamageProgress = document.getElementById('defeat-damage-progress');
    const defeatProgressPct = document.getElementById('defeat-progress-pct');
    const defeatProgressBarFill = document.getElementById('defeat-progress-bar-fill');
    const defeatProgressDelta = document.getElementById('defeat-progress-delta');
    const battlePillQty = document.getElementById('battle-pill-qty');
    const battleTalismanQty = document.getElementById('battle-talisman-qty');
    const battleWaveBadge = document.getElementById('battle-wave-badge');
    const btnBattleAttack = document.getElementById('btn-battle-attack');
    const btnBattleAutoToggle = document.getElementById('btn-battle-auto-toggle');
    const btnBattleUsePill = document.getElementById('btn-battle-use-pill');
    const btnBattleUseTalisman = document.getElementById('btn-battle-use-talisman');
    const modalAwakening = document.getElementById('modal-awakening');

    const tabCharacter = document.getElementById('tab-character');
    const elDialog = document.getElementById('cheat-dialog');



      const switchTab = (tab, skipSound) => window.switchTab && window.switchTab(tab, skipSound);
      const showFloatingNotice = (msg, clr) => window.showFloatingNotice && window.showFloatingNotice(msg, clr);


      // 内部变量与方法注入
  // 12. 伏妖战场播放引擎与结算逻辑
  let isBattleFastMode = false;
  let activeBattleResult = null;
  let battleStepTimer = null;
  let battleWatchdog = null;

  if (btnBattleSpeed) {
    btnBattleSpeed.addEventListener('click', () => {
      isBattleFastMode = !isBattleFastMode;
      btnBattleSpeed.innerText = isBattleFastMode ? '⚡ 极速' : '⚡ 快速';
      if (isBattleFastMode) {
        btnBattleSpeed.classList.add('active');
      } else {
        btnBattleSpeed.classList.remove('active');
      }
    });
  }

  function addBattleFloatingText(text, type = 'normal') {
    if (!battleFloatingContainer) return;
    const floater = document.createElement('div');
    floater.className = `battle-float-text ${type}`;
    floater.innerText = text;
    battleFloatingContainer.appendChild(floater);
    setTimeout(() => {
      if (floater.parentNode) floater.remove();
    }, 900);
  }

  function updateBattlePlayerHUD(playerHp, playerMaxHp) {
    const curPlayerHp = Math.max(0, playerHp);
    if (battleHeroHpFill) {
      const pct = Math.max(0, Math.min(100, Math.floor((curPlayerHp / playerMaxHp) * 100)));
      battleHeroHpFill.style.width = `${pct}%`;
    }
    if (battleHeroHpText) {
      battleHeroHpText.innerText = `${curPlayerHp} / ${playerMaxHp}`;
    }
  }

  function updateBattleHUD(playerHp, playerMaxHp, bossHp, bossMaxHp) {
    updateBattlePlayerHUD(playerHp, playerMaxHp);

    // 只有在单体 Boss 战时才由 updateBattleHUD 更新怪物顶部条；多怪物战中由 updateTargetHUD 独立维护当前目标的血条与名字
    const isMulti = activeBattleResult && activeBattleResult.encounter && activeBattleResult.encounter.monsters && activeBattleResult.encounter.monsters.length > 1;
    if (!isMulti && bossHp !== undefined && bossMaxHp !== undefined) {
      const curBossHp = Math.max(0, bossHp);
      if (battleBossHpFill) {
        const pct = Math.max(0, Math.min(100, Math.floor((curBossHp / bossMaxHp) * 100)));
        battleBossHpFill.style.width = `${pct}%`;
      }
      if (battleBossHpText) {
        battleBossHpText.innerText = `${curBossHp} / ${bossMaxHp}`;
      }
    }
  }

  let isBattleAuto = true;
  let curBattlePlayerHp = 0;
  let curBattlePlayerMaxHp = 0;
  let curBattleBossHp = 0;
  let curBattleBossMaxHp = 0;

  // 战斗切入修仙过场动画 (VS 对决画卷)
  const modalBattleTransition = document.getElementById('modal-battle-transition');
  let battleTransitionTimer = null;

  function showBattleTransitionCutscene(battleResult, onComplete) {
    if (!modalBattleTransition) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    if (battleTransitionTimer) {
      clearTimeout(battleTransitionTimer);
      battleTransitionTimer = null;
    }

    const encounter = battleResult.encounter || {};
    const monsters = encounter.monsters && encounter.monsters.length > 0
      ? encounter.monsters
      : [battleResult.boss || { name: '赤炼蟒', maxHp: 950, hp: 950, atk: 34, def: 18, tier: 'boss', avatar: 'assets/boss/boss_red_python_vivid.png' }];
    const m0 = monsters[0];
    const isPrologue = !!battleResult.isPrologueBattle || (m0 && m0.id === 'prologue_boar');
    const tier = encounter.tier || (m0 && m0.tier) || (isPrologue ? 'boss' : 'normal');
    const totalMonsters = monsters.length;
    const curBossMaxHp = monsters.reduce((sum, m) => sum + (m.maxHp || 100), 0);

    const transTag = document.getElementById('trans-tag');
    const transTitle = document.getElementById('trans-title');
    const transPlayerAvatar = document.getElementById('trans-player-avatar');
    const transPlayerName = document.getElementById('trans-player-name');
    const transPlayerSub = document.getElementById('trans-player-sub');
    const transMonsterAvatar = document.getElementById('trans-monster-avatar');
    const transMonsterName = document.getElementById('trans-monster-name');
    const transMonsterSub = document.getElementById('trans-monster-sub');
    const transQuote = document.getElementById('trans-quote');

    // 加载组件元素
    const transLoaderTag = document.getElementById('trans-loader-tag');
    const transLoaderTitle = document.getElementById('trans-loader-title');
    const transLoaderFill = document.getElementById('trans-loader-fill');
    const transLoaderPercent = document.getElementById('trans-loader-percent');
    const transLoaderSubtext = document.getElementById('trans-loader-subtext');

    // 玩家信息装填
    const curSect = gameManager.player.currentSect;
    const sectConf = (window.SlotsRPG && window.SlotsRPG.SectConfig && window.SlotsRPG.SectConfig.SECTS && window.SlotsRPG.SectConfig.SECTS[curSect]) || null;
    const charVisual = (sectConf && sectConf.characterVisual) 
      || (window.SlotsRPG && window.SlotsRPG.SectConfig && window.SlotsRPG.SectConfig.DEFAULT_CHARACTER) 
      || { battleAvatar: 'assets/character/hero_mortal.png', skillKey: 'mortal_slash' };

    if (transPlayerAvatar) transPlayerAvatar.src = charVisual.battleAvatar || 'assets/character/hero_mortal.png';
    if (transPlayerName) transPlayerName.innerText = isPrologue || gameManager.player.isMortal ? '凡人 · 林凡' : (gameManager.player.name || '凌云修仙者');
    if (transPlayerSub) transPlayerSub.innerText = `战力: ${gameManager.player.combatPower || 45}`;

    // 怪物信息装填
    if (transMonsterAvatar) transMonsterAvatar.src = m0.avatar || 'assets/boss/boss_red_python_vivid.png';
    
    if (isPrologue) {
      if (transTag) transTag.innerText = '🐗 凡人逆命 · 生死一线';
      if (transTitle) transTitle.innerText = '拔 刀 斩 凶';
      if (transMonsterName) transMonsterName.innerText = '后山恶兽 · 暴黑鬣猪';
      if (transMonsterSub) transMonsterSub.innerText = '气血: 100';
      if (transQuote) transQuote.innerText = '“手无寸铁又如何？一柄柴刀亦可逆命斩凶！”';
    } else if (tier === 'boss') {
      if (transTag) transTag.innerText = '🔥 妖王降世 · 凶煞遮天';
      if (transTitle) transTitle.innerText = '诛 灭 妖 王';
      if (transMonsterName) transMonsterName.innerText = `${m0.tierName || '守关妖王'} · ${m0.name}`;
      if (transMonsterSub) transMonsterSub.innerText = `妖力澎湃 · 气血: ${curBossMaxHp}`;
      if (transQuote) transQuote.innerText = '“孽畜休得猖狂，看吾三尺青锋定斩不饶！”';
    } else if (tier === 'elite') {
      if (transTag) transTag.innerText = '⚡ 大妖破关 · 煞气冲天';
      if (transTitle) transTitle.innerText = '伏 诛 大 妖';
      if (transMonsterName) transMonsterName.innerText = `精英大妖 · ${m0.name}${totalMonsters > 1 ? ` 等${totalMonsters}头` : ''}`;
      if (transMonsterSub) transMonsterSub.innerText = `敌阵群集 · 气血: ${curBossMaxHp}`;
      if (transQuote) transQuote.innerText = '“大妖结阵来袭，引动周天剑气御敌！”';
    } else {
      if (transTag) transTag.innerText = '⚠️ 凶兽突袭 · 狭路相逢';
      if (transTitle) transTitle.innerText = '除 害 试 剑';
      if (transMonsterName) transMonsterName.innerText = `普通妖兽 · ${m0.name}${totalMonsters > 1 ? ` 等${totalMonsters}头` : ''}`;
      if (transMonsterSub) transMonsterSub.innerText = `敌阵群兽 · 气血: ${curBossMaxHp}`;
      if (transQuote) transQuote.innerText = '“狭路相逢勇者胜，拔剑斩凶纳命来！”';
    }

    // 动态装填加载组件状态文案 (需求1: 增加加载这个界面的效果)
    if (transLoaderTag) {
      transLoaderTag.innerText = isPrologue ? '后山危局 · 恶兽现身' : (tier === 'boss' ? '天道警示 · 妖王降世' : (tier === 'elite' ? '灵识感知 · 大妖逼近' : '天机洞察 · 锁敌中'));
    }
    if (transLoaderTitle) {
      transLoaderTitle.innerText = isPrologue ? '暴 兽 突 袭' : (tier === 'boss' ? '妖 王 亲 临' : (tier === 'elite' ? '大 妖 压 境' : '凶 兽 逼 近'));
    }
    if (transLoaderSubtext) {
      transLoaderSubtext.innerText = `锁定目标: ${m0.name}${totalMonsters > 1 ? ` 等${totalMonsters}头` : ''}`;
    }
    if (transLoaderPercent) {
      transLoaderPercent.innerText = '0%';
    }
    if (transLoaderFill) {
      transLoaderFill.style.transition = 'none';
      transLoaderFill.style.width = '0%';
    }

    // 重置并进入 phase-loading 阶段
    modalBattleTransition.classList.remove('hidden', 'trans-fade-out', 'trans-slash-out', 'trans-impact-active', 'phase-versus');
    modalBattleTransition.classList.add('phase-loading');
    void modalBattleTransition.offsetWidth;

    // 播放加载阶段音效 (灵识感知/蓄力脉冲)
    if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
      window.SlotsRPG.SoundEffects.play('CLICK');
    }

    let isDone = false;
    let impactShakeTimer = null;
    let versusRevealTimer = null;
    let progressInterval = null;

    // 加载动画进度推演 (0% -> 100%)
    const loadingDuration = isBattleFastMode ? 260 : 450;
    if (transLoaderFill) {
      void transLoaderFill.offsetWidth;
      transLoaderFill.style.transition = `width ${loadingDuration}ms cubic-bezier(0.1, 0.9, 0.2, 1)`;
      transLoaderFill.style.width = '100%';
    }

    let loadProgress = 0;
    progressInterval = setInterval(() => {
      loadProgress += Math.floor(100 / (loadingDuration / 40));
      if (loadProgress >= 100) {
        loadProgress = 100;
        clearInterval(progressInterval);
      }
      if (transLoaderPercent) {
        transLoaderPercent.innerText = `${loadProgress}%`;
      }
    }, 40);

    // 切换至 VS 对决画卷展示 (phase-versus)
    const startVersusPhase = () => {
      if (progressInterval) clearInterval(progressInterval);
      if (transLoaderPercent) transLoaderPercent.innerText = '100%';
      if (transLoaderFill) transLoaderFill.style.width = '100%';

      modalBattleTransition.classList.remove('phase-loading');
      modalBattleTransition.classList.add('phase-versus');
      void modalBattleTransition.offsetWidth;

      // 播放战斗过场专属道乐 (宏大古钟 + 双雄冲撞金鸣 + 战鼓裂空)
      if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('BATTLE_TRANSITION');
      }

      // 碰撞震屏定时器 (在对决双雄与 VS 炸裂对撞 260ms 触发剧烈震屏)
      impactShakeTimer = setTimeout(() => {
        if (!isDone && modalBattleTransition) {
          modalBattleTransition.classList.add('trans-impact-active');
        }
      }, 260);

      // 动态控制对决画卷展示时长：紧凑爽快切入，消除停滞卡顿感
      const versusDuration = isBattleFastMode ? 650 : ((tier === 'boss' || isPrologue) ? 1250 : 1000);
      battleTransitionTimer = setTimeout(finish, versusDuration);
    };

    versusRevealTimer = setTimeout(startVersusPhase, loadingDuration);

    const finish = () => {
      if (isDone) return;
      isDone = true;
      if (progressInterval) clearInterval(progressInterval);
      if (battleTransitionTimer) {
        clearTimeout(battleTransitionTimer);
        battleTransitionTimer = null;
      }
      if (versusRevealTimer) {
        clearTimeout(versusRevealTimer);
        versusRevealTimer = null;
      }
      if (impactShakeTimer) {
        clearTimeout(impactShakeTimer);
        impactShakeTimer = null;
      }
      if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('BATTLE_SLASH_OUT');
      }
      if (modalBattleArena) {
        modalBattleArena.classList.remove('hidden');
      }
      modalBattleTransition.classList.remove('trans-impact-active');
      modalBattleTransition.classList.add('trans-slash-out');
      setTimeout(() => {
        modalBattleTransition.classList.add('hidden');
        modalBattleTransition.classList.remove('trans-fade-out', 'trans-slash-out', 'trans-impact-active', 'phase-loading', 'phase-versus');
        if (typeof onComplete === 'function') onComplete();
      }, 300);
    };

    // 点击过场任意处：若在加载中则立即跳至对决，若在对决中则立即切入战场
    modalBattleTransition.onclick = () => {
      if (modalBattleTransition.classList.contains('phase-loading')) {
        if (versusRevealTimer) clearTimeout(versusRevealTimer);
        startVersusPhase();
      } else {
        finish();
      }
    };
  }

  window.showBattleTransitionCutscene = showBattleTransitionCutscene;
  window.playBattleSequence = playBattleSequence;
  function playBattleSequence(battleResult) {
    if (!modalBattleArena) return;
    if (window.gameManager && window.gameManager.isAllStorageFull && window.gameManager.isAllStorageFull()) {
      window.gameManager.showStorageFullAlert('battle');
      return;
    }
    activeBattleResult = battleResult;

    if (battleStepTimer) {
      clearTimeout(battleStepTimer);
      battleStepTimer = null;
    }
    if (battleWatchdog) {
      clearTimeout(battleWatchdog);
      battleWatchdog = null;
    }

    // 强制初始化自动战斗状态为开启，彻底杜绝上一局残留或移动端误触导致战斗停滞
    isBattleAuto = true;
    if (btnBattleAutoToggle) {
      btnBattleAutoToggle.innerText = '自动: 开启';
      btnBattleAutoToggle.classList.add('active');
    }
    if (btnBattleSpeed) {
      btnBattleSpeed.innerText = isBattleFastMode ? '⚡ 极速' : '⚡ 快速';
      btnBattleSpeed.classList.toggle('active', isBattleFastMode);
    }
    if (battleWaveBadge) {
      battleWaveBadge.classList.add('hidden');
      battleWaveBadge.style.display = 'none';
    }
    if (battleBossTitle) {
      battleBossTitle.classList.add('hidden');
      battleBossTitle.style.display = 'none';
    }

    // 若此前正在自动推演，挂起自动推演以待战斗结束后自动恢复
    if (gameManager && gameManager.isAutoSpinning) {
      gameManager.suspendAutoSpinForBattle();
    }

    // 提前解除战场隐藏，让战斗场景在转场遮罩层(z-index: 1050)之下静默就绪，杜绝转场消退时的闪屏露底
    modalBattleArena.classList.remove('hidden');

    const battleArenaEl = modalBattleArena.querySelector('.battle-arena-container');
    if (window.SlotsRPG && window.SlotsRPG.BattleJuiceEngine && battleArenaEl) {
      window.SlotsRPG.BattleJuiceEngine.init(battleArenaEl);
      window.SlotsRPG.BattleJuiceEngine.resize();
    }

    const session = battleResult.session || null;
    const encounter = battleResult.encounter || {};
    const monsters = encounter.monsters && encounter.monsters.length > 0
      ? encounter.monsters
      : [battleResult.boss || { name: '赤炼蟒', maxHp: 950, hp: 950, atk: 34, def: 18, tier: 'boss', avatar: 'assets/boss/boss_red_python_vivid.png' }];
    
    // 设置战场生态背景图 (带视差与环境打光联动)
    const bgUrl = (monsters[0] && monsters[0].battleBg) 
      || (battleResult.boss && battleResult.boss.battleBg)
      || (battleResult.isPrologueBattle ? 'assets/battle_bg/bg_misty_forest.jpg' : 'assets/battle_bg/bg_python_magma.jpg');
    const battleBgLayer = document.getElementById('battle-bg-layer');
    if (battleBgLayer) {
      battleBgLayer.style.backgroundImage = `url("${bgUrl}")`;
    }
    let isBossEnraged = false;
    if (battleArenaEl) {
      battleArenaEl.classList.remove('ambient-flash', 'ambient-focus', 'ambient-enrage');
    }

    const isPrologue = !!battleResult.isPrologueBattle || (monsters[0] && monsters[0].id === 'prologue_boar');
    const totalMonsters = monsters.length;
    const playerStats = gameManager.player.getTotalStats();

    if (isPrologue) {
      curBattlePlayerMaxHp = 120;
      curBattlePlayerHp = 120;
    } else {
      curBattlePlayerMaxHp = playerStats.hp;
      curBattlePlayerHp = playerStats.hp;
    }

    curBattleBossMaxHp = monsters.reduce((sum, m) => sum + (m.maxHp || m.hp || 100), 0);
    curBattleBossHp = curBattleBossMaxHp;

    // 顶部状态条与战区大标题
    const tier = encounter.tier || (monsters[0] && monsters[0].tier) || 'normal';
    const isSingleBoss = totalMonsters === 1 && (tier === 'boss' || isPrologue);
    const isMultiMonster = totalMonsters > 1;

    if (battleWaveBadge) {
      battleWaveBadge.classList.add('hidden');
      battleWaveBadge.style.display = 'none';
    }

    if (battleBossTitle) {
      battleBossTitle.classList.add('hidden');
      battleBossTitle.style.display = 'none';
    }

    /**
     * 战场修仙趣味道法气泡对话组件
     */
    function showBattleSpeechBubble(targetEl, text, bubbleType = 'monster', duration = 1500) {
      if (!targetEl) return;
      const old = targetEl.querySelector('.battle-speech-bubble');
      if (old) old.remove();

      const bubble = document.createElement('div');
      bubble.className = `battle-speech-bubble ${bubbleType === 'hero' ? 'bubble-hero' : (bubbleType === 'hurt' ? 'bubble-hurt' : '')}`;
      bubble.innerText = text;
      targetEl.appendChild(bubble);

      setTimeout(() => {
        bubble.classList.add('bubble-leaving');
        setTimeout(() => bubble.remove(), 280);
      }, duration);
    }

    // 顶部 HUD 模式：单体妖王展示专属长血条 (boss-mode)；多怪物展示聚焦目标追踪条 (target-mode)
    if (battleBossHud) {
      battleBossHud.classList.remove('hidden');
      if (isSingleBoss) {
        battleBossHud.classList.add('boss-mode');
        battleBossHud.classList.remove('target-mode');
        if (battleBossName) battleBossName.innerText = monsters[0].name;
      } else {
        battleBossHud.classList.remove('boss-mode');
        battleBossHud.classList.add('target-mode');
      }
    }

    // 动态渲染所有怪物卡片进入 #battle-monsters-container 并排同时陈列
    const monsterCardEls = [];
    let currentTargetIndex = 0;

    // 更新当前选中的怪物目标 (联动卡片高亮、准星与顶部 HUD)
    function updateTargetHUD(targetIdx) {
      if (targetIdx === undefined || targetIdx === null) targetIdx = currentTargetIndex;
      if (monsterCardEls[targetIdx] && !monsterCardEls[targetIdx].isAlive) {
        const nextAlive = monsterCardEls.find(c => c.isAlive);
        if (nextAlive) targetIdx = nextAlive.index;
      }
      currentTargetIndex = targetIdx;

      // 同步卡片目标准星与选中高亮
      monsterCardEls.forEach(c => {
        if (c.index === currentTargetIndex && c.isAlive) {
          c.cardEl.classList.add('is-targeted');
          if (c.markerEl) c.markerEl.classList.remove('hidden');
        } else {
          c.cardEl.classList.remove('is-targeted');
          if (c.markerEl) c.markerEl.classList.add('hidden');
        }
      });

      const targetRef = monsterCardEls[currentTargetIndex];
      if (!targetRef) return;

      if (session) {
        session.preferredTargetIndex = currentTargetIndex;
      }

      if (isMultiMonster) {
        // 多怪模式：顶部 HUD 独立展示当前锁定单体目标的名字与独立血量
        if (battleBossName) {
          const tierTag = targetRef.monster.tier === 'elite' 
            ? '<span class="target-tier-tag" style="color:#c084fc;font-size:10px;margin-left:4px;">(精英)</span>' 
            : '';
          battleBossName.innerHTML = `<span class="target-indicator" style="color:#ffd700;font-weight:900;margin-right:3px;">🎯 锁定:</span>${targetRef.monster.name}${tierTag}`;
        }
        if (battleBossHpFill) {
          const pct = Math.max(0, Math.min(100, Math.floor((targetRef.curHp / targetRef.maxHp) * 100)));
          battleBossHpFill.style.width = `${pct}%`;
        }
        if (battleBossHpText) {
          battleBossHpText.innerText = `${Math.max(0, targetRef.curHp)} / ${targetRef.maxHp}`;
        }
      } else if (isSingleBoss) {
        // 单体 Boss 模式：顶部长血条展示
        if (battleBossName) {
          battleBossName.innerText = targetRef.monster.name;
        }
        if (battleBossHpFill) {
          const pct = Math.max(0, Math.min(100, Math.floor((targetRef.curHp / targetRef.maxHp) * 100)));
          battleBossHpFill.style.width = `${pct}%`;
        }
        if (battleBossHpText) {
          battleBossHpText.innerText = `${Math.max(0, targetRef.curHp)} / ${targetRef.maxHp}`;
        }
      }
    }

    if (battleMonstersContainer) {
      battleMonstersContainer.innerHTML = '';
      const showBottomHp = !isSingleBoss;
      monsters.forEach((m, idx) => {
        const card = document.createElement('div');
        const cardTier = isPrologue ? 'boss' : (m.tier || 'normal');
        card.className = `monster-unit-card tier-${cardTier}${isSingleBoss ? ' single-boss' : ''}`;
        card.id = `monster-card-${idx}`;
        if (idx === 0) card.classList.add('is-targeted');

        const atkVal = m.atk || 15;
        const maxHpVal = m.maxHp || m.hp || 100;
        const curHpVal = maxHpVal;
        const initialHpPct = 100;

        const delaySec = (idx * 0.35).toFixed(2);
        card.innerHTML = `
          <div class="monster-target-marker ${idx === 0 ? '' : 'hidden'}" id="target-marker-${idx}">▼</div>
          <div class="monster-card-header">
            <span class="monster-card-name" title="${m.name}">${m.name}</span>
            <span class="monster-card-atk" title="固定攻击力: ${atkVal}">攻:${atkVal}</span>
          </div>
          <div class="monster-avatar-wrap">
            <img class="monster-unit-avatar" id="monster-avatar-${idx}" src="${m.avatar || 'assets/boss/boss_red_python_vivid.png'}" alt="${m.name}" style="animation-delay: ${delaySec}s;" />
            <div class="monster-ground-shadow"></div>
          </div>
          <div class="monster-mini-hp-bar ${showBottomHp ? '' : 'hidden'}">
            <div class="monster-mini-hp-fill" id="monster-hp-fill-${idx}" style="width: ${initialHpPct}%;"></div>
          </div>
          <div class="monster-mini-hp-text ${showBottomHp ? '' : 'hidden'}" id="monster-hp-text-${idx}">${curHpVal} / ${maxHpVal}</div>
          <div class="monster-defeated-badge hidden" id="monster-defeated-${idx}"><span>💀</span>&nbsp;<span>伏诛</span></div>
        `;

        // 交互：多怪时点击卡片切换当前锁定目标
        card.onclick = () => {
          const ref = monsterCardEls[idx];
          if (ref && ref.isAlive) {
            updateTargetHUD(idx);
            addBattleFloatingText(`🎯 锁定【${m.name}】`, 'normal');
          }
        };

        battleMonstersContainer.appendChild(card);

        monsterCardEls.push({
          index: idx,
          monster: m,
          cardEl: card,
          markerEl: card.querySelector(`#target-marker-${idx}`),
          avatarEl: card.querySelector(`#monster-avatar-${idx}`),
          hpFillEl: card.querySelector(`#monster-hp-fill-${idx}`),
          hpTextEl: card.querySelector(`#monster-hp-text-${idx}`),
          defeatedEl: card.querySelector(`#monster-defeated-${idx}`),
          maxHp: maxHpVal,
          curHp: curHpVal,
          isAlive: true
        });
      });
    }

    // 初始化锁定目标与顶部 HUD
    updateTargetHUD(0);

    // 战场趣味气泡：入场嘲讽台词
    const MONSTER_TAUNTS = [
      '区区练气，也敢阻挠本座！',
      '吼！见识本座利爪！',
      '留下乾坤袋，饶你不死！',
      '今日合该饱餐一顿！',
      '何方宵小，敢扰本王洞府！'
    ];
    const BOSS_TAUNTS = [
      '凡人蝼蚁，惊扰本王长眠！',
      '万年道行，岂是你能撼动？',
      '入得此关，唯有一死！',
      '吾乃万山之主，受死吧！'
    ];
    setTimeout(() => {
      if (monsterCardEls.length > 0 && monsterCardEls[0].isAlive) {
        const pool = (tier === 'boss' || isSingleBoss) ? BOSS_TAUNTS : MONSTER_TAUNTS;
        const txt = pool[Math.floor(Math.random() * pool.length)];
        showBattleSpeechBubble(monsterCardEls[0].cardEl, txt, 'monster', 1800);
      }
    }, 450);

    const curSect = gameManager.player.currentSect;
    const sectConf = (window.SlotsRPG && window.SlotsRPG.SectConfig && window.SlotsRPG.SectConfig.SECTS && window.SlotsRPG.SectConfig.SECTS[curSect]) || null;
    const charVisual = (sectConf && sectConf.characterVisual) 
      || (window.SlotsRPG && window.SlotsRPG.SectConfig && window.SlotsRPG.SectConfig.DEFAULT_CHARACTER) 
      || { battleAvatar: 'assets/character/hero_mortal.png', skillKey: 'mortal_slash' };

    if (battleHeroName) {
      if (isPrologue || gameManager.player.isMortal) {
        battleHeroName.innerText = '凡人 · 林凡';
      } else {
        battleHeroName.innerText = gameManager.player.name || '凌云修仙者';
      }
    }
    if (battleHeroImg) {
      battleHeroImg.src = charVisual.battleAvatar || 'assets/character/hero_mortal.png';
      battleHeroImg.classList.remove('attack', 'heal-burst');
      battleHeroImg.style.transform = '';
    }
    if (battleHeroPower) battleHeroPower.innerText = `战力: ${gameManager.player.combatPower}`;

    // 初始化法宝/丹药战前就绪状态
    const usedTalisman = battleResult.itemsUsed.some(i => i.type === 'rune');
    if (battleTalismanStatus) {
      battleTalismanStatus.className = 'battle-prep-tag' + (usedTalisman ? '' : ' used');
      battleTalismanStatus.innerText = usedTalisman ? '破魔符: 就绪' : '破魔符: 无';
    }

    const usedPill = battleResult.itemsUsed.some(i => i.type === 'pill');
    if (battlePillStatus) {
      battlePillStatus.className = 'battle-prep-tag' + (usedPill ? '' : ' used');
      battlePillStatus.innerText = usedPill ? '气血丹: 就绪' : '气血丹: 无';
    }

    // 道具快捷按钮数量展示与交互绑定
    const pillCount = gameManager.inventory ? gameManager.inventory.getItemAmount('pill', 'hp') : 0;
    if (battlePillQty) battlePillQty.innerText = pillCount;
    if (btnBattleUsePill) {
      btnBattleUsePill.classList.toggle('disabled', pillCount <= 0);
      btnBattleUsePill.onclick = () => {
        if (pillCount <= 0) {
          addBattleFloatingText('气血丹已空', 'normal');
          return;
        }
        if (curBattlePlayerHp >= curBattlePlayerMaxHp) {
          addBattleFloatingText('气血充盈，无需服丹', 'normal');
          return;
        }
        if (session && !session.isOver) {
          const res = session.executeRound('pill');
          timeline.splice(stepIndex);
          timeline.push(...res.roundEvents);
          executeNextStep();
        }
      };
    }

    const talismanCount = gameManager.inventory ? gameManager.inventory.getItemAmount('rune', 'SYM_03') : 0;
    if (battleTalismanQty) battleTalismanQty.innerText = talismanCount;
    if (btnBattleUseTalisman) {
      btnBattleUseTalisman.classList.toggle('disabled', talismanCount <= 0);
      btnBattleUseTalisman.onclick = () => {
        if (talismanCount <= 0) {
          addBattleFloatingText('破魔符已空', 'normal');
          return;
        }
        if (session && !session.isOver) {
          const res = session.executeRound('talisman');
          timeline.splice(stepIndex);
          timeline.push(...res.roundEvents);
          executeNextStep();
        }
      };
    }

    let stepIndex = 0;
    const timeline = battleResult.timeline;
    let isStepInProgress = false;

    // 战斗看门狗定时器：若出现任何非预期动画卡死或未推进，3.5秒后自动强制步进恢复
    function resetBattleWatchdog() {
      if (battleWatchdog) {
        clearTimeout(battleWatchdog);
        battleWatchdog = null;
      }
      if (!modalBattleArena.classList.contains('hidden')) {
        battleWatchdog = setTimeout(() => {
          if (!modalBattleArena.classList.contains('hidden') && !isStepInProgress) {
            console.warn('[BattleUI] 看门狗介入恢复战斗步进:', stepIndex);
            executeNextStep();
          }
        }, 3500);
      }
    }

    if (btnBattleAutoToggle) {
      btnBattleAutoToggle.onclick = () => {
        isBattleAuto = !isBattleAuto;
        btnBattleAutoToggle.innerText = isBattleAuto ? '自动: 开启' : '回合: 手动';
        btnBattleAutoToggle.classList.toggle('active', isBattleAuto);
        if (isBattleAuto && !battleStepTimer && !isStepInProgress && stepIndex < timeline.length) {
          executeNextStep();
        }
      };
    }

    // 手动模式单回合流畅推演：点击御剑攻击后，自动演播完本回合所有连击与怪物反击，并在下一回合主角行动点等待操作
    async function stepThroughCurrentRound() {
      if (isStepInProgress) return;
      const targetRound = (timeline[stepIndex] && timeline[stepIndex].round) || 1;
      while (stepIndex < timeline.length && !modalBattleArena.classList.contains('hidden')) {
        await executeNextStep();
        const nextEv = timeline[stepIndex];
        if (!nextEv) break;
        if (nextEv.round !== targetRound && (nextEv.turn === 'player' || nextEv.actionType === 'attack')) {
          break; // 在下一回合主角出招点平稳挂起，等待玩家指令
        }
        const stepDelay = isBattleFastMode ? 140 : 260;
        await new Promise(r => setTimeout(r, stepDelay));
      }
    }

    if (btnBattleAttack) {
      btnBattleAttack.innerText = (isPrologue || gameManager.player.isMortal)
        ? '🔪 柴刀劈砍'
        : '⚔️ 御剑攻击';
      btnBattleAttack.onclick = () => {
        if (!isBattleAuto) {
          stepThroughCurrentRound();
        }
      };
    }

    if (battleRoundBadge) battleRoundBadge.innerText = '战前对峙';
    if (battleLogText) {
      if (isPrologue) {
        battleLogText.innerText = '⚠️ 恶风扑面！嗜血黑鬣猪狂暴低吼，手握防身柴刀，生死一战！';
      } else if (totalMonsters > 1) {
        battleLogText.innerText = `⚠️ 妖气冲天！${totalMonsters} 头凶煞妖兽并排逼近，大战一触即发！`;
      } else {
        battleLogText.innerText = `⚠️ 妖气冲天！${monsters[0].name}盘踞虚空，大战一触即发！`;
      }
    }

    if (battleFloatingContainer) battleFloatingContainer.innerHTML = '';
    updateBattleHUD(curBattlePlayerHp, curBattlePlayerMaxHp, curBattleBossHp, curBattleBossMaxHp);

    async function executeNextStep() {
      if (stepIndex >= timeline.length) {
        if (battleWatchdog) { clearTimeout(battleWatchdog); battleWatchdog = null; }
        battleStepTimer = setTimeout(() => {
          modalBattleArena.classList.add('hidden');
          if (battleArenaEl) {
            battleArenaEl.classList.remove('ambient-flash', 'ambient-focus', 'ambient-enrage');
          }
          const isVic = session ? session.isVictory : battleResult.isVictory;
          if (session) battleResult.isVictory = isVic;
          if (isVic) {
            showVictoryModal(battleResult);
          } else {
            showDefeatModal(battleResult);
          }
        }, isBattleFastMode ? 350 : 750);
        return;
      }

      isStepInProgress = true;
      resetBattleWatchdog();
      let ev = null;
      try {
        ev = timeline[stepIndex++];

      if (ev.type === 'next_monster') {
        curBattleBossHp = ev.bossHp;
        curBattleBossMaxHp = ev.bossMaxHp;
        if (battleLogText) battleLogText.innerText = ev.text;
        updateBattleHUD(curBattlePlayerHp, curBattlePlayerMaxHp, curBattleBossHp, curBattleBossMaxHp);
      } else if (ev.type === 'monster_defeated') {
        const mIdx = ev.monsterIndex !== undefined ? ev.monsterIndex : 0;
        const targetRef = monsterCardEls[mIdx];
        if (targetRef) {
          targetRef.isAlive = false;
          targetRef.curHp = 0;
          if (window.SlotsRPG && window.SlotsRPG.BattleJuiceEngine) {
            window.SlotsRPG.BattleJuiceEngine.triggerMonsterDeathFeedback(targetRef.avatarEl, targetRef.cardEl);
          } else {
            targetRef.cardEl.classList.add('defeated');
          }
          targetRef.cardEl.classList.remove('is-targeted');
          if (targetRef.markerEl) targetRef.markerEl.classList.add('hidden');
          if (targetRef.defeatedEl) targetRef.defeatedEl.classList.remove('hidden');
          if (targetRef.hpFillEl) targetRef.hpFillEl.style.width = '0%';
          if (targetRef.hpTextEl) targetRef.hpTextEl.innerText = `0 / ${targetRef.maxHp}`;
        }
        // 自动转移锁定指示器到下一个存活目标并联动顶部 HUD
        const nextAlive = monsterCardEls.find(c => c.isAlive);
        if (nextAlive) {
          updateTargetHUD(nextAlive.index);
        }
        if (ev.totalEnemyHp !== undefined) {
          curBattleBossHp = ev.totalEnemyHp;
          updateBattleHUD(curBattlePlayerHp, curBattlePlayerMaxHp, curBattleBossHp, curBattleBossMaxHp);
        }
        if (battleLogText) battleLogText.innerText = ev.text;
        addBattleFloatingText('💀 妖兽伏诛!', 'crit');

        // 战场气泡：伏诛求饶
        const DEFEAT_SHOUTS = [
          '道友饶命……啊！',
          '本座……不甘心啊！',
          '算你狠……后会有期！',
          '可恶的剑修……！'
        ];
        const dTxt = DEFEAT_SHOUTS[Math.floor(Math.random() * DEFEAT_SHOUTS.length)];
        if (targetRef && targetRef.cardEl) {
          showBattleSpeechBubble(targetRef.cardEl, dTxt, 'hurt', 1200);
        }
        if (window.SlotsRPG && window.SlotsRPG.BattleSoundEngine) {
          window.SlotsRPG.BattleSoundEngine.playImpact(true);
        }
      } else if (ev.type === 'combo_attack') {
        const tIdx = ev.targetIndex !== undefined ? ev.targetIndex : 0;
        const targetRef = monsterCardEls[tIdx];
        if (targetRef) {
          targetRef.curHp = ev.monsterHp !== undefined ? ev.monsterHp : Math.max(0, targetRef.curHp - ev.damage);
          const pct = Math.max(0, Math.min(100, Math.floor((targetRef.curHp / targetRef.maxHp) * 100)));
          if (targetRef.hpFillEl) targetRef.hpFillEl.style.width = `${pct}%`;
          if (targetRef.hpTextEl) targetRef.hpTextEl.innerText = `${targetRef.curHp} / ${targetRef.maxHp}`;
          if (window.SlotsRPG && window.SlotsRPG.BattleJuiceEngine && targetRef.avatarEl) {
            window.SlotsRPG.BattleJuiceEngine.triggerMonsterHurtFeedback(targetRef.avatarEl, false);
          }
        }
        curBattleBossHp = ev.totalEnemyHp !== undefined ? ev.totalEnemyHp : curBattleBossHp;
        updateBattleHUD(curBattlePlayerHp, curBattlePlayerMaxHp, curBattleBossHp, curBattleBossMaxHp);
        if (battleLogText) battleLogText.innerText = ev.text;
        addBattleFloatingText(`⚡连击 -${ev.damage}`, 'crit');
        if (window.SlotsRPG && window.SlotsRPG.BattleSoundEngine) {
          window.SlotsRPG.BattleSoundEngine.playSwordSlash();
        }
      } else if (ev.type === 'counter_reflect') {
        const aIdx = ev.actorIndex !== undefined ? ev.actorIndex : 0;
        const actorRef = monsterCardEls[aIdx];
        if (actorRef) {
          actorRef.curHp = Math.max(0, actorRef.curHp - ev.damage);
          const pct = Math.max(0, Math.min(100, Math.floor((actorRef.curHp / actorRef.maxHp) * 100)));
          if (actorRef.hpFillEl) actorRef.hpFillEl.style.width = `${pct}%`;
          if (actorRef.hpTextEl) actorRef.hpTextEl.innerText = `${actorRef.curHp} / ${actorRef.maxHp}`;
          if (window.SlotsRPG && window.SlotsRPG.BattleJuiceEngine && actorRef.avatarEl) {
            window.SlotsRPG.BattleJuiceEngine.triggerMonsterHurtFeedback(actorRef.avatarEl, false);
          }
        }
        curBattleBossHp = ev.totalEnemyHp !== undefined ? ev.totalEnemyHp : curBattleBossHp;
        updateBattleHUD(curBattlePlayerHp, curBattlePlayerMaxHp, curBattleBossHp, curBattleBossMaxHp);
        if (battleLogText) battleLogText.innerText = ev.text;
        addBattleFloatingText(`🛡️反震 -${ev.damage}`, 'crit');
        if (window.SlotsRPG && window.SlotsRPG.BattleSoundEngine) {
          window.SlotsRPG.BattleSoundEngine.playImpact(false);
        }
      } else if (ev.type === 'talisman_strike' || ev.actionType === 'talisman') {
        const tIdx = ev.targetIndex !== undefined ? ev.targetIndex : 0;
        const targetRef = monsterCardEls[tIdx];

        curBattleBossHp = ev.totalEnemyHp !== undefined ? ev.totalEnemyHp : ev.bossHp;
        if (battleRoundBadge) battleRoundBadge.innerText = ev.round ? `回合 ${ev.round}/20` : '符箓神罚';
        if (battleLogText) battleLogText.innerText = ev.text;
        if (battleTalismanStatus) {
          battleTalismanStatus.classList.add('used');
          battleTalismanStatus.innerText = '破魔符: 已祭出';
        }
        const leftTal = gameManager.inventory ? gameManager.inventory.getItemAmount('rune', 'SYM_03') : 0;
        if (battleTalismanQty) battleTalismanQty.innerText = leftTal;
        if (btnBattleUseTalisman) btnBattleUseTalisman.classList.toggle('disabled', leftTal <= 0);

        // 场景环境雷光大闪 (Ambient Flash)
        if (battleArenaEl) {
          battleArenaEl.classList.add('ambient-flash');
          setTimeout(() => battleArenaEl.classList.remove('ambient-flash'), 350);
        }

        if (window.SlotsRPG && window.SlotsRPG.SkillStateMachine) {
          await window.SlotsRPG.SkillStateMachine.execute(
            'talisman_thunder',
            battleHeroImg,
            targetRef ? targetRef.avatarEl : null,
            {
              isPlayer: true,
              isCrit: true,
              damage: ev.damage,
              onHit: () => {
                if (ev.targets && ev.targets.length > 0) {
                  ev.targets.forEach(t => {
                    const ref = monsterCardEls[t.targetIndex];
                    if (ref) {
                      ref.curHp = t.remainingHp;
                      const pct = Math.max(0, Math.min(100, Math.floor((t.remainingHp / ref.maxHp) * 100)));
                      if (ref.hpFillEl) ref.hpFillEl.style.width = `${pct}%`;
                      if (ref.hpTextEl) ref.hpTextEl.innerText = `${Math.max(0, t.remainingHp)} / ${ref.maxHp}`;
                      if (window.SlotsRPG && window.SlotsRPG.BattleJuiceEngine) {
                        window.SlotsRPG.BattleJuiceEngine.triggerMonsterHurtFeedback(ref.avatarEl, true);
                      }
                    }
                  });
                  addBattleFloatingText(`⚡九霄雷劫 全体 -${ev.damage}`, 'talisman');
                } else if (targetRef) {
                  targetRef.curHp = ev.monsterHp;
                  const pct = Math.max(0, Math.min(100, Math.floor((ev.monsterHp / targetRef.maxHp) * 100)));
                  if (targetRef.hpFillEl) targetRef.hpFillEl.style.width = `${pct}%`;
                  if (targetRef.hpTextEl) targetRef.hpTextEl.innerText = `${Math.max(0, ev.monsterHp)} / ${targetRef.maxHp}`;
                  if (window.SlotsRPG && window.SlotsRPG.BattleJuiceEngine) {
                    window.SlotsRPG.BattleJuiceEngine.triggerMonsterHurtFeedback(targetRef.avatarEl, true);
                  }
                  addBattleFloatingText(`⚡破魔 -${ev.damage}`, 'talisman');
                }
                updateBattleHUD(curBattlePlayerHp, curBattlePlayerMaxHp, curBattleBossHp, curBattleBossMaxHp);
                updateTargetHUD();
              }
            }
          );
        } else {
          updateBattleHUD(curBattlePlayerHp, curBattlePlayerMaxHp, curBattleBossHp, curBattleBossMaxHp);
          updateTargetHUD();
        }
      } else if (ev.type === 'pill_heal' || ev.actionType === 'pill') {
        curBattlePlayerHp = ev.playerHp;
        if (battleRoundBadge) battleRoundBadge.innerText = ev.round ? `回合 ${ev.round}/20` : '回春调息';
        if (battleLogText) battleLogText.innerText = ev.text;
        if (battlePillStatus) {
          battlePillStatus.classList.add('used');
          battlePillStatus.innerText = '气血丹: 已消耗';
        }
        const leftPill = gameManager.inventory ? gameManager.inventory.getItemAmount('pill', 'hp') : 0;
        if (battlePillQty) battlePillQty.innerText = leftPill;
        if (btnBattleUsePill) btnBattleUsePill.classList.toggle('disabled', leftPill <= 0);
        addBattleFloatingText(`💚回春 +${ev.heal}`, 'heal');
        if (window.SlotsRPG && window.SlotsRPG.BattleSoundEngine) {
          window.SlotsRPG.BattleSoundEngine.playCharge();
        }
        if (battleHeroImg) {
          battleHeroImg.classList.remove('heal-burst');
          void battleHeroImg.offsetWidth;
          battleHeroImg.classList.add('heal-burst');
        }
        updateBattleHUD(curBattlePlayerHp, curBattlePlayerMaxHp, curBattleBossHp, curBattleBossMaxHp);
      } else if (ev.turn === 'player') {
        const tIdx = ev.targetIndex !== undefined ? ev.targetIndex : 0;
        const targetRef = monsterCardEls[tIdx];

        // 锁定当前被打击目标并联动顶部 HUD
        updateTargetHUD(tIdx);

        if (battleRoundBadge) battleRoundBadge.innerText = `回合 ${ev.round}/20`;
        if (battleLogText) battleLogText.innerText = ev.text;

        const playerSkillKey = charVisual.skillKey || (curSect === 'wanjian' ? 'wanjian_slash' : 'mortal_slash');

        // 会心暴击暗场聚焦 (Ambient Focus)
        if (ev.isCrit && battleArenaEl) {
          battleArenaEl.classList.add('ambient-focus');
          setTimeout(() => battleArenaEl.classList.remove('ambient-focus'), 220);
        }

        if (window.SlotsRPG && window.SlotsRPG.SkillStateMachine) {
          await window.SlotsRPG.SkillStateMachine.execute(
            playerSkillKey,
            battleHeroImg,
            targetRef ? targetRef.avatarEl : null,
            {
              isPlayer: true,
              isCrit: ev.isCrit,
              enableFlyingSwords: (playerSkillKey === 'wanjian_slash' && (ev.isCrit || Math.random() < 0.45)),
              damage: ev.damage,
              onHit: () => {
                if (targetRef) {
                  targetRef.curHp = Math.max(0, ev.monsterHp);
                  const pct = Math.max(0, Math.min(100, Math.floor((targetRef.curHp / targetRef.maxHp) * 100)));
                  if (targetRef.hpFillEl) targetRef.hpFillEl.style.width = `${pct}%`;
                  if (targetRef.hpTextEl) targetRef.hpTextEl.innerText = `${targetRef.curHp} / ${targetRef.maxHp}`;
                }
                curBattleBossHp = ev.totalEnemyHp !== undefined ? ev.totalEnemyHp : ev.bossHp;
                updateBattleHUD(curBattlePlayerHp, curBattlePlayerMaxHp, curBattleBossHp, curBattleBossMaxHp);
                updateTargetHUD(tIdx);
                addBattleFloatingText(ev.isCrit ? `💥会心 -${ev.damage}` : `-${ev.damage}`, ev.isCrit ? 'crit' : 'normal');

                // 怪物受创破防喊话 (< 40% HP)
                if (targetRef && targetRef.isAlive && targetRef.curHp > 0 && targetRef.curHp < targetRef.maxHp * 0.4 && !targetRef.hasShoutedHurt) {
                  targetRef.hasShoutedHurt = true;
                  const HURT_SHOUTS = [
                    '痛煞我也！纳命来！',
                    '这小辈……剑气怎如此凌厉？！',
                    '可恶……护体罡气碎了！',
                    '竟能伤及本王本源？！'
                  ];
                  const hTxt = HURT_SHOUTS[Math.floor(Math.random() * HURT_SHOUTS.length)];
                  showBattleSpeechBubble(targetRef.cardEl, hTxt, 'hurt', 1400);
                }

                // 主角暴击喊话
                if (ev.isCrit) {
                  const HERO_SHOUTS = [
                    '雕虫小技，安敢造次！',
                    '一剑光寒，破！',
                    '斩妖除魔，天道无偏！',
                    '九霄归一，给本座退下！'
                  ];
                  const heroTxt = HERO_SHOUTS[Math.floor(Math.random() * HERO_SHOUTS.length)];
                  const heroWrap = document.querySelector('.battle-hero-avatar-wrapper') || (battleHeroImg && battleHeroImg.parentElement);
                  if (heroWrap) {
                    showBattleSpeechBubble(heroWrap, heroTxt, 'hero', 1400);
                  }
                }
              },
              onFlyingSwordHit: () => {
                const pursuitDmg = Math.max(4, Math.floor(ev.damage * 0.3));
                addBattleFloatingText(`🗡️万剑追击! -${pursuitDmg}`, 'crit');
                if (targetRef && targetRef.avatarEl && window.SlotsRPG && window.SlotsRPG.BattleJuiceEngine) {
                  window.SlotsRPG.BattleJuiceEngine.triggerMonsterHurtFeedback(targetRef.avatarEl, false);
                }
              }
            }
          );
        }

        if (ev.isCrit && storyManager) {
          storyManager.triggerChatter('battle_crit');
        }

        // 检查妖王残血 35% 狂暴天象演出
        if (curBattleBossHp > 0 && curBattleBossHp <= curBattleBossMaxHp * 0.35 && tier === 'boss' && !isBossEnraged) {
          isBossEnraged = true;
          if (battleArenaEl) battleArenaEl.classList.add('ambient-enrage');
          const sound = window.SlotsRPG && window.SlotsRPG.BattleSoundEngine;
          if (sound && sound.playRoar) sound.playRoar();
          const juice = window.SlotsRPG && window.SlotsRPG.BattleJuiceEngine;
          if (juice) {
            juice.shakeScreen(15, 360);
            const anchor = targetRef ? juice.getAnchorCoords(targetRef.avatarEl) : { x: battleArenaEl.clientWidth * 0.5, y: battleArenaEl.clientHeight * 0.35 };
            juice.triggerShockwave(anchor.x, anchor.y, { maxRadius: 130, color: '#dc2626', lineWidth: 5.5 });
            juice.triggerSparks(anchor.x, anchor.y, { count: 28, colors: ['#dc2626', '#ef4444', '#7c3aed'] });
          }
          addBattleFloatingText('🔥【妖王狂暴·血煞沸腾】', 'crit');
          if (battleLogText) {
            battleLogText.innerText = '🔥【妖王狂暴】赤炼蟒濒死狂暴，万千剑冢熔岩沸腾！煞气席卷战场！';
          }
        }
      } else if (ev.turn === 'boss' || ev.turn === 'monster') {
        const aIdx = ev.actorIndex !== undefined ? ev.actorIndex : 0;
        const actorRef = monsterCardEls[aIdx];
        if (actorRef && actorRef.cardEl) {
          actorRef.cardEl.classList.add('is-acting');
          setTimeout(() => {
            if (actorRef && actorRef.cardEl) actorRef.cardEl.classList.remove('is-acting');
          }, 450);
        }

        if (battleRoundBadge) battleRoundBadge.innerText = `回合 ${ev.round}/20`;
        if (battleLogText) battleLogText.innerText = ev.text;

        const isBossSkill = (tier === 'boss' && ev.isSkill);
        const BOSS_SKILL_MAP = {
          boss_1: 'boss_poison_roar',
          boss_2: 'boss_golden_fire',
          boss_3: 'boss_earth_quake',
          boss_4: 'boss_bagua_array',
          boss_5: 'boss_hell_inferno'
        };
        const bossId = (actorRef && actorRef.monster && actorRef.monster.id) || (battleResult.boss && battleResult.boss.id) || 'boss_1';
        const monsterSkill = isBossSkill 
          ? (BOSS_SKILL_MAP[bossId] || 'boss_poison_roar') 
          : (actorRef && actorRef.monster && (actorRef.monster.id === 'norm_fox_1' || actorRef.monster.id === 'norm_wolf_2') ? 'monster_bite' : 'monster_attack');

        if (window.SlotsRPG && window.SlotsRPG.SkillStateMachine) {
          await window.SlotsRPG.SkillStateMachine.execute(
            monsterSkill,
            actorRef ? actorRef.avatarEl : null,
            battleHeroImg,
            {
              isPlayer: false,
              isCrit: ev.isCrit,
              damage: ev.damage,
              onHit: () => {
                curBattlePlayerHp = ev.playerHp;
                updateBattleHUD(curBattlePlayerHp, curBattlePlayerMaxHp, curBattleBossHp, curBattleBossMaxHp);
                addBattleFloatingText(
                  ev.isCrit ? `🔥狂暴 -${ev.damage}` : (ev.isSkill ? `⚡${ev.skillName || '绝技'} -${ev.damage}` : `-${ev.damage}`),
                  ev.isCrit ? 'crit' : 'normal'
                );
              }
            }
          );
        }

        if (curBattlePlayerHp <= curBattlePlayerMaxHp * 0.25 && storyManager) {
          storyManager.triggerChatter('battle_danger');
        }
      }

      } catch (err) {
        console.error('[BattleUI] executeNextStep 步进发生非预期异常，自动推进保障流程:', err);
      } finally {
        isStepInProgress = false;
        if (!modalBattleArena.classList.contains('hidden')) {
          if (stepIndex >= timeline.length) {
            // 所有回合与死亡反馈全部演播完毕，立即调度终局结算 (无论是自动还是手动)
            const finishDelay = (ev && ev.type === 'monster_defeated')
              ? (isBattleFastMode ? 250 : 450)
              : (isBattleFastMode ? 180 : 350);
            battleStepTimer = setTimeout(executeNextStep, finishDelay);
          } else if (isBattleAuto) {
            const nextEv = timeline[stepIndex];
            const isRoundTransition = nextEv && (nextEv.round !== (ev ? ev.round : 0));

            let delay;
            if (isRoundTransition) {
              delay = isBattleFastMode ? 260 : 500;
              if (battleRoundBadge) {
                battleRoundBadge.classList.remove('pulse');
                void battleRoundBadge.offsetWidth;
                battleRoundBadge.classList.add('pulse');
              }
            } else if (ev && ev.type === 'monster_defeated') {
              delay = isBattleFastMode ? 180 : 320;
            } else {
              delay = isPrologue ? (isBattleFastMode ? 260 : 420) : (isBattleFastMode ? 140 : 280);
            }

            battleStepTimer = setTimeout(executeNextStep, delay);
          } else {
            battleStepTimer = null;
          }
        }
      }
    }
    // 启动修仙风格战斗过场转场动画 (VS 对决画卷)，展示完毕后再切入战场开启第一回合
    showBattleTransitionCutscene(battleResult, () => {
      modalBattleArena.classList.remove('hidden');
      if (window.SlotsRPG && window.SlotsRPG.BattleJuiceEngine) {
        window.SlotsRPG.BattleJuiceEngine.resize();
      }
      // 需求2: 界面关闭之后，战斗延迟0.5秒开始
      const startDelay = isBattleFastMode ? 250 : 500;
      battleStepTimer = setTimeout(executeNextStep, startDelay);
    });
  }

  // 战后结算弹窗“自动关闭”状态管理与定时器调度
  function isBattleAutoCloseEnabled() {
    return localStorage.getItem('slots_rpg_battle_auto_close') === 'true';
  }

  function setBattleAutoCloseEnabled(enabled) {
    localStorage.setItem('slots_rpg_battle_auto_close', enabled ? 'true' : 'false');
    if (chkVictoryAutoClose) chkVictoryAutoClose.checked = enabled;
    if (chkDefeatAutoClose) chkDefeatAutoClose.checked = enabled;
  }

  function clearVictoryAutoCloseTimer() {
    if (victoryAutoCloseTimer) {
      clearInterval(victoryAutoCloseTimer);
      victoryAutoCloseTimer = null;
    }
    if (victoryAutoCloseCountdown) {
      victoryAutoCloseCountdown.classList.add('hidden');
      victoryAutoCloseCountdown.innerText = '';
    }
  }

  function startVictoryAutoCloseTimer() {
    clearVictoryAutoCloseTimer();
    if (!modalBattleVictory || modalBattleVictory.classList.contains('hidden')) return;
    let remainingSeconds = 2;
    if (victoryAutoCloseCountdown) {
      victoryAutoCloseCountdown.innerText = `(${remainingSeconds}s)`;
      victoryAutoCloseCountdown.classList.remove('hidden');
    }
    victoryAutoCloseTimer = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds > 0) {
        if (victoryAutoCloseCountdown) victoryAutoCloseCountdown.innerText = `(${remainingSeconds}s)`;
      } else {
        clearVictoryAutoCloseTimer();
        if (btnVictoryClaim && modalBattleVictory && !modalBattleVictory.classList.contains('hidden')) {
          btnVictoryClaim.click();
        }
      }
    }, 1000);
  }

  function clearDefeatAutoCloseTimer() {
    if (defeatAutoCloseTimer) {
      clearInterval(defeatAutoCloseTimer);
      defeatAutoCloseTimer = null;
    }
    if (defeatAutoCloseCountdown) {
      defeatAutoCloseCountdown.classList.add('hidden');
      defeatAutoCloseCountdown.innerText = '';
    }
  }

  function startDefeatAutoCloseTimer() {
    clearDefeatAutoCloseTimer();
    if (!modalBattleDefeat || modalBattleDefeat.classList.contains('hidden')) return;
    let remainingSeconds = 2;
    if (defeatAutoCloseCountdown) {
      defeatAutoCloseCountdown.innerText = `(${remainingSeconds}s)`;
      defeatAutoCloseCountdown.classList.remove('hidden');
    }
    defeatAutoCloseTimer = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds > 0) {
        if (defeatAutoCloseCountdown) defeatAutoCloseCountdown.innerText = `(${remainingSeconds}s)`;
      } else {
        clearDefeatAutoCloseTimer();
        if (btnDefeatConfirm && modalBattleDefeat && !modalBattleDefeat.classList.contains('hidden')) {
          btnDefeatConfirm.click();
        }
      }
    }, 1000);
  }

  if (chkVictoryAutoClose) {
    chkVictoryAutoClose.checked = isBattleAutoCloseEnabled();
    chkVictoryAutoClose.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      setBattleAutoCloseEnabled(isChecked);
      if (isChecked) {
        startVictoryAutoCloseTimer();
      } else {
        clearVictoryAutoCloseTimer();
      }
    });
  }

  if (chkDefeatAutoClose) {
    chkDefeatAutoClose.checked = isBattleAutoCloseEnabled();
    chkDefeatAutoClose.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      setBattleAutoCloseEnabled(isChecked);
      if (isChecked) {
        startDefeatAutoCloseTimer();
      } else {
        clearDefeatAutoCloseTimer();
      }
    });
  }

  window.showVictoryModal = showVictoryModal;
  window.showDefeatModal = showDefeatModal;
  function showVictoryModal(battleResult) {
    if (battleWatchdog) { clearTimeout(battleWatchdog); battleWatchdog = null; }
    if (!modalBattleVictory) return;
    activeBattleResult = battleResult;
    const boss = (battleResult.encounter && battleResult.encounter.monsters && battleResult.encounter.monsters[0]) || battleResult.boss;
    const rewards = battleResult.rewards || (battleResult.boss ? battleResult.boss.rewards : {}) || {};
    const mult = (battleResult.encounter && battleResult.encounter.betMultiplier) || battleResult.betMultiplier || (activeBattleResult && activeBattleResult.betMultiplier) || gameManager.betMultiplier || 1;

    if (victorySubtitle) {
      const isMulti = battleResult.encounter && battleResult.encounter.monsters && battleResult.encounter.monsters.length > 1;
      const bossName = boss ? boss.name : '妖兽';
      const multText = mult > 1 ? `（${mult}倍机缘加持）` : '';
      if (battleResult && battleResult.isTowerBattle) {
        victorySubtitle.innerText = `锁妖天关第 ${battleResult.towerFloor} 层荡平大捷！浩然正气激荡！`;
      } else if (battleResult && battleResult.isPrologueBattle) {
        victorySubtitle.innerText = '后山恶兽已被斩除，造化天机盘重见天日！';
      } else {
        victorySubtitle.innerText = isMulti
          ? `群妖溃败诛灭，天道甘霖倾泻！${multText}`
          : `${bossName}诛灭，天道甘霖倾泻！${multText}`;
      }
    }
    if (victoryRewardExp) {
      victoryRewardExp.innerText = `+${rewards.exp || 0}`;
    }
    if (victoryRewardEnergy) {
      victoryRewardEnergy.innerText = `+${rewards.energy || 0}`;
    }

    // 首胜赤炼蟒里程碑突破展示
    if (victoryBreakthroughBox) {
      const isBoss1 = battleResult.encounter 
        ? (battleResult.encounter.tier === 'boss' && gameManager.level === 1)
        : (battleResult.boss && battleResult.boss.id === 'boss_1' && gameManager.level === 1);
      if (isBoss1) {
        victoryBreakthroughBox.classList.remove('hidden');
      } else {
        victoryBreakthroughBox.classList.add('hidden');
      }
    }

    // 生成预定发放的真实奖励物品 (保证弹窗展示与背包实际入库的图标、名称、品质颜色完全一致)
    if (!battleResult.rewardItems) {
      battleResult.rewardItems = [];
      if (rewards.artifactItem) {
        battleResult.rewardItems.push(rewards.artifactItem);
      }
      if (rewards.rewardEquip) {
        const eq = window.SlotsRPG.ItemModel.createEquipment(rewards.rewardEquip.part, rewards.rewardEquip.qualityCode);
        battleResult.rewardItems.push(eq);
      }
      if (rewards.rewardPill) {
        const pill = window.SlotsRPG.ItemModel.createPill(rewards.rewardPill.subType, rewards.rewardPill.amount);
        battleResult.rewardItems.push(pill);
      }
      if (rewards.rewardRune) {
        const rune = window.SlotsRPG.ItemModel.createTalisman(rewards.rewardRune.symbolId, rewards.rewardRune.amount);
        battleResult.rewardItems.push(rune);
      }
    }

    // 掉落法宝与丹药卡片生成 (使用真实可用图标与品质颜色)
    if (victoryItemsGrid) {
      victoryItemsGrid.innerHTML = '';
      battleResult.rewardItems.forEach(item => {
        const itemCell = document.createElement('div');
        itemCell.className = 'victory-item-cell';
        itemCell.style.borderColor = item.qualityColor || '#ffd700';
        itemCell.style.boxShadow = `0 0 12px ${item.qualityColor || '#ffd700'}45, inset 0 0 6px ${item.qualityColor || '#ffd700'}20`;

        const countBadge = item.amount && item.amount > 1 ? `<span class="victory-item-count">x${item.amount}</span>` : '';
        const qualityTag = item.qualityName ? `<span class="victory-item-tag" style="background:${item.qualityColor}25; color:${item.qualityColor};">${item.qualityName}</span>` : '';

        itemCell.innerHTML = `
          <div class="victory-item-icon-wrap">
            <img class="victory-item-icon" src="${item.icon}" alt="${item.name}" />
            ${countBadge}
          </div>
          <span class="victory-item-name" style="color: ${item.qualityColor || '#ffd700'};" title="${item.name}">${item.name}</span>
          ${qualityTag}
        `;
        victoryItemsGrid.appendChild(itemCell);
      });
    }

    // 系统大捷灵犀点评气泡更新
    const victorySystemComment = document.getElementById('victory-system-comment');
    if (victorySystemComment) {
      if (battleResult && battleResult.isTowerBattle) {
        victorySystemComment.innerText = `【镇妖令】恭喜仙友荡平妖氛，成功通关镇妖塔第 ${battleResult.towerFloor} 层！浩气长存！`;
      } else {
        const isBoss = battleResult.encounter ? (battleResult.encounter.tier === 'boss') : (battleResult.boss && battleResult.boss.id === 'boss_1');
      if (isBoss) {
        victorySystemComment.innerText = '【系统速报】守关妖王已伏诛！天道机缘大丰收，宗门试炼功德圆满！';
      } else {
        const stageIdx = (gameManager.trialProgress && gameManager.trialProgress.currentStageIndex) || 1;
        victorySystemComment.innerText = `【系统贺报】宿主大展神威，成功荡平第 ${stageIdx} 关强敌！掉落丰厚机缘与极品战利品！`;
      }
      }
    }

    modalBattleVictory.classList.remove('hidden');
    if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
      window.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE();
    }

    // 检查并调度结算弹窗自动关闭
    const autoCloseVictory = isBattleAutoCloseEnabled();
    if (chkVictoryAutoClose) chkVictoryAutoClose.checked = autoCloseVictory;
    if (autoCloseVictory) {
      startVictoryAutoCloseTimer();
    } else {
      clearVictoryAutoCloseTimer();
    }
  }

  function renderDefeatProgress(battleResult) {
    if (!modalBattleDefeat) return;
    if (defeatDamageProgress) {
      if (battleResult && battleResult.damageProgress) {
        defeatDamageProgress.classList.remove('hidden');
        const dp = battleResult.damageProgress;
        if (defeatProgressPct) defeatProgressPct.innerText = `已削减 ${dp.damagePct}% 敌方气血`;
        if (defeatProgressBarFill) defeatProgressBarFill.style.width = `${dp.damagePct}%`;
        if (defeatProgressDelta) {
          if (dp.diffPct > 0) {
            defeatProgressDelta.innerText = `较上次挑战: +${dp.diffPct}% 战力增幅显著！`;
            defeatProgressDelta.style.color = '#34d399';
          } else if (dp.prevBestPct > 0) {
            defeatProgressDelta.innerText = `历史最佳削减: ${dp.bestDamagePct}% (继续打造法宝提升战力吧！)`;
            defeatProgressDelta.style.color = '#fbbf24';
          } else {
            defeatProgressDelta.innerText = `初次实战检验！前往【角色修真】打造法宝可进一步提升战力`;
            defeatProgressDelta.style.color = '#94a3b8';
          }
        }
      } else {
        defeatDamageProgress.classList.add('hidden');
      }
    }

    // 系统惜败战力复盘点评气泡
    const defeatSystemComment = document.getElementById('defeat-system-comment');
    if (defeatSystemComment) {
      if (battleResult && battleResult.isTowerBattle) {
        defeatSystemComment.innerText = `【镇妖复盘】第 ${battleResult.towerFloor} 层妖王势大！建议前往【天机盘】炼制高阶法宝，提升战力后再行叩关！`;
      } else {
        defeatSystemComment.innerText = '【系统复盘】胜败乃修仙常事！妖兽势大，建议先回乾坤袋【一键升阶】打造高品装备，战力达标后再来荡平此獠！';
      }
    }

    modalBattleDefeat.classList.remove('hidden');
    if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
      window.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE();
    }

    // 检查并调度结算弹窗自动关闭
    const autoCloseDefeat = isBattleAutoCloseEnabled();
    if (chkDefeatAutoClose) chkDefeatAutoClose.checked = autoCloseDefeat;
    if (autoCloseDefeat) {
      startDefeatAutoCloseTimer();
    } else {
      clearDefeatAutoCloseTimer();
    }
  }

  function showDefeatModal(battleResult) {
    if (battleWatchdog) { clearTimeout(battleWatchdog); battleWatchdog = null; }
    const featCfg = (window.SlotsRPG && window.SlotsRPG.GameBalanceConfig && window.SlotsRPG.GameBalanceConfig.FeatureConfig) || {};
    const enableAds = featCfg.enableAds !== false;
    if (enableAds && battleResult && battleResult.canRevive) {
      const modalRevive = document.getElementById('modal-revive-prompt');
      const reviveCountText = document.getElementById('revive-remaining-count');
      const adService = window.SlotsRPG && window.SlotsRPG.AdService;
      if (modalRevive) {
        if (reviveCountText && adService) {
          reviveCountText.innerText = adService.getRemainingQuota('revive');
        }
        modalRevive.classList.remove('hidden');
        if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
          window.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE();
        }

        const btnReviveAd = document.getElementById('btn-revive-watch-ad');
        const btnReviveTicket = document.getElementById('btn-revive-use-ticket');
        const btnReviveGiveUp = document.getElementById('btn-revive-give-up');

        const triggerRevive = () => {
          modalRevive.classList.add('hidden');
          const newBattle = window.SlotsRPG.CombatEngine.simulateEncounter(
            gameManager.player,
            battleResult.encounter,
            gameManager.inventory,
            { withRevive: true }
          );
          if (newBattle.isVictory) {
            gameManager.defeatStreak = 0;
            gameManager.emitStateChange();
            showVictoryModal(newBattle);
          } else {
            renderDefeatProgress(newBattle || battleResult);
          }
        };

        if (btnReviveAd) {
          btnReviveAd.onclick = () => {
            modalRevive.classList.add('hidden');
            openRewardedAdModal('revive', '妖王绝地还魂', triggerRevive);
          };
        }
        if (btnReviveTicket) {
          btnReviveTicket.onclick = () => {
            const res = adService ? adService.claimViaTicket('revive', triggerRevive) : { success: false };
            if (!res.success) {
              showFloatingNotice(res.reason || '瞬发符不足！');
            }
          };
        }
        if (btnReviveGiveUp) {
          btnReviveGiveUp.onclick = () => {
            modalRevive.classList.add('hidden');
            renderDefeatProgress(battleResult);
          };
        }
        return;
      }
    }

    renderDefeatProgress(battleResult);
  }

  // 封装通用伏妖大捷纳宝收纳逻辑
  function handleClaimBattleVictory() {
    clearVictoryAutoCloseTimer();
    if (!activeBattleResult) return null;
    const curBattle = activeBattleResult;
    activeBattleResult = null;

    if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
      window.SlotsRPG.SoundEffects.play('CLAIM_REWARD');
    }

    // 1. 抓取弹窗中的战利品卡片位置，启动抛物线掉落动画直坠底部角色修真/乾坤袋
    const cells = victoryItemsGrid ? victoryItemsGrid.querySelectorAll('.victory-item-cell') : [];
    const dropItems = [];
    if (curBattle.rewardItems && curBattle.rewardItems.length > 0) {
      curBattle.rewardItems.forEach((it, idx) => {
        dropItems.push({
          icon: it.icon,
          element: cells[idx] || modalBattleVictory
        });
      });
    }

    // 立即隐藏胜利弹窗并恢复背景仙乐
    if (modalBattleVictory) modalBattleVictory.classList.add('hidden');
    if (window.SlotsRPG && window.SlotsRPG.BGMPlayer) {
      window.SlotsRPG.BGMPlayer.setDucking(false);
    }

    // 2. 播放掉落飞入背包动画
    if (window.SlotsRPG.DropAnimator && dropItems.length > 0) {
      window.SlotsRPG.DropAnimator.playDropAnimationFromElements(
        dropItems,
        tabCharacter,
        () => {
          if (window.incrementNotificationBadge) window.incrementNotificationBadge(1);
        }
      );
    }

    // 3. 执行真正的纳宝入囊入库
    const summary = gameManager.claimBattleRewards(curBattle);

    // 镇妖塔战斗胜利额外结算
    if (curBattle && curBattle.isTowerBattle && gameManager.demonTowerManager) {
      gameManager.demonTowerManager.onVictory(curBattle.towerFloor);
      updateCaveView();
    }

    return { curBattle, summary };
  }

  if (btnVictoryClaim) {
    btnVictoryClaim.addEventListener('click', () => {
      const res = handleClaimBattleVictory();
      if (!res) return;
      const { curBattle, summary } = res;

      if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
        window.SlotsRPG.SpotlightGuide.scheduleCheck(350);
      }

      // 若此前处于自动推演状态，战斗结束后无缝切回天机盘并继续维持旋转
      if (gameManager.wasAutoSpinningBeforeBattle) {
        switchTab('slots');
        gameManager.resumeAutoSpinAfterBattle();
      } else if (summary && summary.breakthroughInfo) {
        // 若达成大境界突破且非自动旋转，等待掉落动画飞抵后自动切换至角色修真面板展示全新境界与扩容背包
        setTimeout(() => {
          tabCharacter.click();
        }, 550);
      } else if (curBattle && curBattle.isPrologueBattle) {
        gameManager.prologueStep = 2;
        if (window.SlotsRPG.StorageService) {
          window.SlotsRPG.StorageService.saveGame(gameManager, true);
        }
        gameManager.emitStateChange();
        if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
          window.SlotsRPG.SpotlightGuide.scheduleCheck(350);
        }
      }
    });
  }

  // 伏妖大捷 · 继续挑战新关卡/下一层
  const btnVictoryContinue = document.getElementById('btn-victory-continue');
  if (btnVictoryContinue) {
    btnVictoryContinue.addEventListener('click', () => {
      const res = handleClaimBattleVictory();
      if (!res) return;
      const { curBattle } = res;

      // 1. 镇妖天关：无缝挑战更高层
      if (curBattle && curBattle.isTowerBattle && gameManager.demonTowerManager) {
        const nextFloor = gameManager.demonTowerManager.currentFloor;
        if (nextFloor <= gameManager.demonTowerManager.maxFloor) {
          const nextChallenge = gameManager.demonTowerManager.startChallenge();
          if (nextChallenge && nextChallenge.success !== false) {
            playBattleSequence(nextChallenge);
            return;
          } else {
            if (window.showFloatingNotice) window.showFloatingNotice((nextChallenge && nextChallenge.reason) || '无法发起下一层挑战');
          }
        } else {
          if (window.showFloatingNotice) window.showFloatingNotice('已登顶镇妖天关最高层！功德无量！');
        }
        return;
      }

      // 2. 主线/门派妖王试炼：无缝挑战下一关
      if (gameManager.player && gameManager.player.isMortal) {
        if (window.showFloatingNotice) window.showFloatingNotice('凡人尚未入道，请先拜入仙宗门派！');
        return;
      }
      if (gameManager.hasDefeatedSectBoss && gameManager.sectTrialStage > 12) {
        if (window.showFloatingNotice) window.showFloatingNotice('当前门派试炼与守关妖王已全部荡平！');
        return;
      }
      if (gameManager.isAllStorageFull && gameManager.isAllStorageFull()) {
        gameManager.showStorageFullAlert('battle');
        return;
      }

      const nextTrialResult = gameManager.startActiveTrialChallenge({ skipStoryEmit: false });
      if (nextTrialResult && nextTrialResult.success !== false) {
        playBattleSequence(nextTrialResult);
      } else {
        if (window.showFloatingNotice) window.showFloatingNotice((nextTrialResult && nextTrialResult.reason) || '无法继续发起挑战');
      }
    });
  }

  if (btnDefeatConfirm) {
    btnDefeatConfirm.addEventListener('click', () => {
      clearDefeatAutoCloseTimer();
      activeBattleResult = null;
      if (modalBattleDefeat) modalBattleDefeat.classList.add('hidden');
      if (window.SlotsRPG && window.SlotsRPG.BGMPlayer) {
        window.SlotsRPG.BGMPlayer.setDucking(false);
      }
      // 若此前处于自动推演状态，战斗结束后无缝切回天机盘并继续维持旋转
      if (gameManager.wasAutoSpinningBeforeBattle) {
        switchTab('slots');
        gameManager.resumeAutoSpinAfterBattle();
      }
    });
  }

  // 不再提供单独的妖王挑战入口，除序章剧情首战外，所有战斗均由天机盘推演触发

  // 13. 监听转盘触发妖兽与秘境事件
  window.SlotsRPG.EventBus.on('TRIGGER_BATTLE', (data) => {
    if (window.clearBattleCountdownTimer) {
      window.clearBattleCountdownTimer();
    }
    updateSectTrialBanner();
    if (window.SlotsRPG && window.SlotsRPG.BGMPlayer) {
      window.SlotsRPG.BGMPlayer.setDucking(true);
    }
    if (gameManager.isAutoSpinning) {
      gameManager.suspendAutoSpinForBattle();
    }
    const mult = data.betMultiplier || (data.battleConfig && data.battleConfig.betMultiplier) || gameManager.betMultiplier || 1;
    const cfg = data.battleConfig || (data.scatterCount >= 5 ? { tier: 'boss', count: 1 } : (data.scatterCount === 4 ? { tier: 'elite', count: 2 } : { tier: 'normal', count: 3 }));
    cfg.betMultiplier = mult;

    const multTag = mult > 1 ? ` <span style="color:#ffd700;font-weight:bold;">[${mult}倍奖励]</span>` : '';
    if (elDialog) {
      if (cfg.tier === 'boss') {
        elDialog.innerHTML = `🔥 <span style="color:#ff416c;">【妖王降世】</span> 凶煞遮天！引动 <b>1 尊关卡霸主·妖王</b> 亲临！${multTag}立即切入伏妖战场！`;
      } else if (cfg.tier === 'elite') {
        elDialog.innerHTML = `⚡ <span style="color:#c084fc;">【大妖压境】</span> 灵压磅礴！引动 <b>${cfg.count}</b> 头【精英大妖】现身！${multTag}立即切入伏妖战场！`;
      } else {
        elDialog.innerHTML = `⚠️ <span style="color:#e74c3c;">【凶煞现世】</span> 妖气外溢！引动 <b>${cfg.count}</b> 头普通妖兽围攻！${multTag}立即切入伏妖战场！`;
      }
    }

    setTimeout(() => {
      const battleResult = gameManager.startBossBattle(cfg);
      playBattleSequence(battleResult);
    }, 180);
  });



    }
  };

  window.SlotsRPG.UI.BattleUI = BattleUI;
})();
