/**
 * main.js - 应用程序入口脚本
 * 负责 DOM 节点绑定、用户交互监听、视图切换与背包/角色面板数据流同步
 * 包含奖励缩小掉落飞入、消息徽标与背包红点交互
 * 纯前端零外部依赖，严格无跨域障碍
 */
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('dragon-fx-canvas') || document.getElementById('reel-canvas');
  if (!canvas) return;

  // 1. 初始化神龙画布渲染器与游戏总控器
  const renderer = window.SlotsRPG.DragonSpoutRenderer
    ? new window.SlotsRPG.DragonSpoutRenderer(canvas)
    : new window.SlotsRPG.CanvasRenderer(canvas);
  const gameManager = window.SlotsRPG.GameManager;
  window.gameManager = gameManager;
  gameManager.init(renderer);

  // 1.1 初始化剧情与网文弹幕驱动引擎
  const storyManager = window.SlotsRPG.StoryManager;
  if (storyManager) {
    storyManager.init(gameManager);
  }

  // 2. DOM 元素缓存
  // 顶栏 HUD
  const elEnergy = document.getElementById('val-energy');
  const elRealm = document.getElementById('val-realm');
  const elLevel = document.getElementById('val-level');
  const elPower = document.getElementById('val-power');

  // 转盘视图
  const elAnnouncement = document.getElementById('reel-announcement');
  const elAnnouncementText = document.getElementById('announcement-text');
  const elDialog = document.getElementById('cheat-dialog');
  const btnSpin = document.getElementById('btn-spin');
  const btnAutoSpin = document.getElementById('btn-auto');

  // 快速消耗控制元素
  const btnBetMinus = document.getElementById('btn-bet-minus');
  const btnBetToggle = document.getElementById('btn-bet-toggle');
  const btnBetPlus = document.getElementById('btn-bet-plus');
  const valCost = document.getElementById('val-cost');
  const valMult = document.getElementById('val-mult');
  const betPopover = document.getElementById('bet-popover');
  const betTiersList = document.getElementById('bet-tiers-list');

  // 视图切换 Tabs
  const tabSlots = document.getElementById('tab-slots');
  const tabCharacter = document.getElementById('tab-character');
  const tabBadgeCharacter = document.getElementById('tab-badge-character');
  const tabCave = document.getElementById('tab-cave');
  const tabBadgeCave = document.getElementById('tab-badge-cave');
  const viewSlots = document.getElementById('view-slots');
  const viewCharacter = document.getElementById('view-character');
  const viewCave = document.getElementById('view-cave');

  // 角色修真面板元素
  const charRealmText = document.getElementById('char-realm-text');
  const charPowerText = document.getElementById('char-power-text');
  const charHeroEnergy = document.getElementById('char-hero-energy');
  const charHeroLevel = document.getElementById('char-hero-level');
  const charHeroSect = document.getElementById('char-hero-sect');
  const charExpText = document.getElementById('char-exp-text');
  const charExpFill = document.getElementById('char-exp-fill');
  const statHp = document.getElementById('stat-hp');
  const statAtk = document.getElementById('stat-atk');
  const statDef = document.getElementById('stat-def');

  // 一键装备 & 乾坤袋元素
  const btnQuickEquip = document.getElementById('btn-quick-equip');
  const bagCapText = document.getElementById('bag-cap-text');
  const bagGrid = document.getElementById('bag-grid');
  const chkAutoSalvage = document.getElementById('chk-auto-salvage');
  const btnBagSortHeader = document.getElementById('btn-bag-sort-header');
  const floatingMergeWrap = document.getElementById('floating-merge-wrap');
  const btnFloatingMerge = document.getElementById('btn-floating-merge');
  const btnBagMerge = document.getElementById('btn-bag-merge');
  const btnBagSalvage = document.getElementById('btn-bag-salvage');
  const btnBagSort = document.getElementById('btn-bag-sort');

  // 弹窗元素
  const modalItemDetail = document.getElementById('modal-item-detail');
  const modalItemIconFrame = document.getElementById('modal-item-icon-frame');
  const modalItemIcon = document.getElementById('modal-item-icon');
  const modalItemName = document.getElementById('modal-item-name');
  const modalItemQuality = document.getElementById('modal-item-quality');
  const modalItemPart = document.getElementById('modal-item-part');
  const modalItemStats = document.getElementById('modal-item-stats');
  const modalItemCompare = document.getElementById('modal-item-compare');
  const btnItemPrimary = document.getElementById('btn-item-primary');
  const btnItemSalvage = document.getElementById('btn-item-salvage');
  const btnItemClose = document.getElementById('btn-item-close');
  const btnItemCloseX = document.getElementById('btn-item-close-x');
  const modalStatsBoxTitle = document.getElementById('modal-stats-box-title');
  const modalItemActions = document.getElementById('modal-item-actions');

  const modalLevelUp = document.getElementById('modal-level-up');
  const levelupRealmOld = document.getElementById('levelup-realm-old');
  const levelupRealmNew = document.getElementById('levelup-realm-new');
  const levelupPowerOld = document.getElementById('levelup-power-old');
  const levelupPowerNew = document.getElementById('levelup-power-new');
  const levelupPowerDiff = document.getElementById('levelup-power-diff');
  const levelupStatHpOld = document.getElementById('levelup-stat-hp-old');
  const levelupStatHpNew = document.getElementById('levelup-stat-hp-new');
  const levelupStatHpDiff = document.getElementById('levelup-stat-hp-diff');
  const levelupStatAtkOld = document.getElementById('levelup-stat-atk-old');
  const levelupStatAtkNew = document.getElementById('levelup-stat-atk-new');
  const levelupStatAtkDiff = document.getElementById('levelup-stat-atk-diff');
  const levelupStatDefOld = document.getElementById('levelup-stat-def-old');
  const levelupStatDefNew = document.getElementById('levelup-stat-def-new');
  const levelupStatDefDiff = document.getElementById('levelup-stat-def-diff');
  const btnLevelupConfirm = document.getElementById('btn-levelup-confirm');

  const modalOverflowAlert = document.getElementById('modal-overflow-alert');
  const btnOverflowMerge = document.getElementById('btn-overflow-merge');
  const btnOverflowSalvage = document.getElementById('btn-overflow-salvage');

  const modalRelief = document.getElementById('modal-relief');
  const btnClaimRelief = document.getElementById('btn-claim-relief');
  const btnMeditateRelief = document.getElementById('btn-meditate-relief');
  const btnCloseRelief = document.getElementById('btn-close-relief');
  const reliefCount = document.getElementById('relief-count');

  // 伏妖战场与结算元素
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

  // 角色面板立绘与挑战入口
  const heroProfileRealm = document.getElementById('hero-profile-realm');
  const heroProfilePower = document.getElementById('hero-profile-power');
  const btnChallengeBoss = document.getElementById('btn-challenge-boss');

  // 序章与宗门引荐 DOM 元素
  const prologueSection = document.getElementById('prologue-section');
  const btnPrologueBattle = document.getElementById('btn-prologue-battle');
  const modalAwakening = document.getElementById('modal-awakening');
  const btnAwakeningAccept = document.getElementById('btn-awakening-accept');
  const modalSectInduction = document.getElementById('modal-sect-induction');
  const inductionSectsContainer = document.getElementById('induction-sects-container');
  let isSectInductionSequenceRunning = false;

  // 飞升专属入口与九转轮回 DOM 元素
  const steleProgressBadge = document.getElementById('stele-progress-badge');
  const btnOpenStele = document.getElementById('btn-open-stele');
  const btnSteleReincarnate = document.getElementById('btn-stele-reincarnate');

  const modalAscensionStele = document.getElementById('modal-ascension-stele');
  const steleShardsContainer = document.getElementById('stele-shards-container');
  const steleGateStatus = document.getElementById('stele-gate-status');
  const steleBubbleBox = document.getElementById('stele-bubble-box');
  const steleBubbleTail = document.getElementById('stele-bubble-tail');
  const steleBubbleContent = document.getElementById('stele-bubble-content');
  const steleClueHint = document.getElementById('stele-clue-hint');
  const btnAscendHeaven = document.getElementById('btn-ascend-heaven');
  const btnCloseStele = document.getElementById('btn-close-stele');

  const modalSamsaraSettlement = document.getElementById('modal-samsara-settlement');
  const samsaraTitle = document.getElementById('samsara-title');
  const samsaraSubtitle = document.getElementById('samsara-subtitle');
  const samsaraValCount = document.getElementById('samsara-val-count');
  const samsaraValKarma = document.getElementById('samsara-val-karma');
  const samsaraValLegacy = document.getElementById('samsara-val-legacy');
  const samsaraValSpirit = document.getElementById('samsara-val-spirit');
  const samsaraValHeirlooms = document.getElementById('samsara-val-heirlooms');
  const btnSamsaraConfirm = document.getElementById('btn-samsara-confirm');

  // 兵解转世预览确认弹窗
  const modalSamsaraConfirmPreview = document.getElementById('modal-samsara-confirm-preview');
  const samsaraPreviewTitle = document.getElementById('samsara-preview-title');
  const samsaraPreviewSubtitle = document.getElementById('samsara-preview-subtitle');
  const samsaraPreviewSect = document.getElementById('samsara-preview-sect');
  const samsaraPreviewStats = document.getElementById('samsara-preview-stats');
  const samsaraPreviewEquips = document.getElementById('samsara-preview-equips');
  const btnSamsaraPreviewCancel = document.getElementById('btn-samsara-preview-cancel');
  const btnSamsaraPreviewOk = document.getElementById('btn-samsara-preview-ok');

  // 洞天灵脉面板元素
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

  // 仙府归来离线收益元素
  const modalOfflineReward = document.getElementById('modal-offline-reward');
  const offlineGainEnergy = document.getElementById('offline-gain-energy');
  const offlineGainPills = document.getElementById('offline-gain-pills');
  const btnClaimOffline = document.getElementById('btn-claim-offline');

  // 聚宝盆升级与外框元素
  const potExpContainer = document.getElementById('pot-exp-container');
  const potTierTitle = document.getElementById('pot-tier-title');
  const potExpText = document.getElementById('pot-exp-text');
  const potExpBarFill = document.getElementById('pot-exp-bar-fill');
  const btnPotBreakthrough = document.getElementById('btn-pot-breakthrough');
  const reelFrame = document.querySelector('.reel-frame');

  // 宗门斩妖试炼横幅元素 (1~12关主动挑战 + 守关大妖王，零消耗随时试剑)
  const sectTrialBanner = document.getElementById('sect-trial-banner');
  const trialStageBadge = document.getElementById('trial-stage-badge');
  const trialDiffTag = document.getElementById('trial-diff-tag');
  const trialRewardTag = document.getElementById('trial-reward-tag');
  const trialTargetName = document.getElementById('trial-target-name');
  const trialRecPower = document.getElementById('trial-rec-power');
  const trialPowerStatus = document.getElementById('trial-power-status');
  const trialBtnText = document.getElementById('trial-btn-text');
  const btnActiveTrialChallenge = document.getElementById('btn-active-trial-challenge');

  // 500抽战力雷达标尺与门票发放弹窗元素
  const bossRadarPanel = document.getElementById('boss-radar-panel');
  const bossRadarIcon = document.getElementById('boss-radar-icon');
  const bossRadarLabel = document.getElementById('boss-radar-label');
  const bossRadarName = document.getElementById('boss-radar-name');
  const bossRadarReqPower = document.getElementById('boss-radar-req-power');
  const bossRadarStatus = document.getElementById('boss-radar-status');
  const bossRadarFill = document.getElementById('boss-radar-fill');
  const bossRadarProgressText = document.getElementById('boss-radar-progress-text');
  const bossRadarHint = document.getElementById('boss-radar-hint');
  const btnBossRadarChallenge = document.getElementById('btn-boss-radar-challenge');

  const modalSectTicketAwarded = document.getElementById('modal-sect-ticket-awarded');
  const ticketModalIcon = document.getElementById('ticket-modal-icon');
  const ticketModalName = document.getElementById('ticket-modal-name');
  const ticketModalSect = document.getElementById('ticket-modal-sect');
  const ticketModalDesc = document.getElementById('ticket-modal-desc');
  const btnClaimSectTicket = document.getElementById('btn-claim-sect-ticket');

  // 游戏内仙道操作提示/结果弹窗 (彻底取代外部系统 alert)
  const modalActionNotice = document.getElementById('modal-action-notice');
  const actionNoticeBadge = document.getElementById('action-notice-badge');
  const actionNoticeTitle = document.getElementById('action-notice-title');
  const actionNoticeContent = document.getElementById('action-notice-content');
  const btnActionNoticeConfirm = document.getElementById('btn-action-notice-confirm');

  // 伏妖战场新交互与怪物动画元素
  const battleWaveBadge = document.getElementById('battle-wave-badge');
  const battleClawScratch = document.getElementById('battle-claw-scratch');
  const btnBattleUsePill = document.getElementById('btn-battle-use-pill');
  const btnBattleUseTalisman = document.getElementById('btn-battle-use-talisman');
  const btnBattleAttack = document.getElementById('btn-battle-attack');
  const btnBattleAutoToggle = document.getElementById('btn-battle-auto-toggle');
  const battlePillQty = document.getElementById('battle-pill-qty');
  const battleTalismanQty = document.getElementById('battle-talisman-qty');

  // 仙道操作通告弹窗统一展示函数 (取缔浏览器系统弹窗)
  function showGameNotice(title, htmlContent, badge = '✨ 仙道显化') {
    if (actionNoticeBadge) actionNoticeBadge.innerText = badge;
    if (actionNoticeTitle) actionNoticeTitle.innerText = title;
    if (actionNoticeContent) actionNoticeContent.innerHTML = htmlContent;
    if (modalActionNotice) modalActionNotice.classList.remove('hidden');
  }

  if (btnActionNoticeConfirm) {
    btnActionNoticeConfirm.addEventListener('click', () => {
      if (modalActionNotice) modalActionNotice.classList.add('hidden');
    });
  }

  // 换装属性增减浮动大字 (绿增、红减)
  function showFloatingAttrBurst(statDiff) {
    if (!statDiff) return;
    const container = viewCharacter || document.getElementById('app-container');
    if (!container) return;

    const lines = [];
    if (statDiff.power !== 0 && statDiff.power !== undefined) {
      lines.push({ text: `⚡ 战力 ${statDiff.power > 0 ? '+' : ''}${statDiff.power}`, isInc: statDiff.power > 0 });
    }
    if (statDiff.atk !== 0 && statDiff.atk !== undefined) {
      lines.push({ text: `⚔️ 攻击 ${statDiff.atk > 0 ? '+' : ''}${statDiff.atk}`, isInc: statDiff.atk > 0 });
    }
    if (statDiff.def !== 0 && statDiff.def !== undefined) {
      lines.push({ text: `🛡️ 防御 ${statDiff.def > 0 ? '+' : ''}${statDiff.def}`, isInc: statDiff.def > 0 });
    }
    if (statDiff.hp !== 0 && statDiff.hp !== undefined) {
      lines.push({ text: `💚 气血 ${statDiff.hp > 0 ? '+' : ''}${statDiff.hp}`, isInc: statDiff.hp > 0 });
    }

    if (lines.length === 0) return;

    lines.forEach((line, idx) => {
      setTimeout(() => {
        const burst = document.createElement('div');
        burst.className = `floating-attr-burst ${line.isInc ? 'inc' : 'dec'}`;
        burst.innerText = line.text;
        burst.style.left = '50%';
        burst.style.top = `${150 + idx * 28}px`;
        container.appendChild(burst);
        setTimeout(() => {
          if (burst.parentNode) burst.remove();
        }, 1500);
      }, idx * 160);
    });
  }

  // 一键换装战力直接提示 (取缔阻断式弹窗，直接动效呈现暴涨战力)
  function showCombatPowerGainNotice(powerGain, count = 1) {
    const container = (viewCharacter && viewCharacter.classList.contains('active'))
      ? viewCharacter
      : (document.getElementById('app-container') || document.body);
    if (!container) return;

    // 1. 战力数值脉冲高光 (角色界面与顶部 HUD 战力数值同步呼吸跳动)
    const powerEls = [
      document.getElementById('hero-profile-power'),
      document.getElementById('val-power')
    ];
    powerEls.forEach(el => {
      if (!el) return;
      el.classList.remove('power-burst-pulse');
      void el.offsetWidth;
      el.classList.add('power-burst-pulse');
      setTimeout(() => el.classList.remove('power-burst-pulse'), 1500);
    });

    // 2. 悬浮战力暴涨特效胶囊 (无弹窗，居中暴击跃升)
    const burst = document.createElement('div');
    burst.className = 'quick-equip-power-gain';
    const textGain = powerGain > 0 ? `+${powerGain}` : `+0`;
    const countTag = count > 1 ? `<span class="quick-equip-count-tag">换装 ${count} 件</span>` : '';
    burst.innerHTML = `
      <div class="quick-equip-gain-content">
        <span class="quick-equip-gain-icon">⚡</span>
        <span class="quick-equip-gain-label">战力</span>
        <span class="quick-equip-gain-num">${textGain}</span>
        ${countTag}
      </div>
    `;

    container.appendChild(burst);
    setTimeout(() => {
      if (burst.parentNode) burst.remove();
    }, 2200);
  }

  // 当前正在弹窗中查看的装备目标上下文
  let currentModalTarget = null; // { type: 'inventory'|'equipped', index, slot, item }

  // 消息提示计数器 (每次中奖累加，一直递增直至 999+，只有点击角色修真时才刷新清零)
  let pendingNotificationCount = 0;

  function updateNotificationBadge() {
    if (!tabBadgeCharacter) return;
    if (pendingNotificationCount > 0) {
      tabBadgeCharacter.innerText = pendingNotificationCount > 999 ? '999+' : pendingNotificationCount;
      tabBadgeCharacter.classList.remove('hidden');
      tabBadgeCharacter.classList.remove('pop');
      void tabBadgeCharacter.offsetWidth;
      tabBadgeCharacter.classList.add('pop');
    } else {
      tabBadgeCharacter.classList.add('hidden');
    }
  }

  // 浮动轻提示
  function showFloatingNotice(text, color = '#f87171') {
    if (renderer && renderer.addFloatingText) {
      renderer.addFloatingText(text, color);
    }
    const container = (viewCharacter && viewCharacter.classList.contains('active'))
      ? viewCharacter
      : (document.getElementById('app-container') || document.body);
    const el = document.createElement('div');
    el.className = 'floating-attr-burst';
    el.style.borderColor = color;
    el.style.color = color;
    el.style.left = '50%';
    el.style.top = '45%';
    el.innerText = text;
    container.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.remove();
    }, 2000);
  }

  // 3. Tab 视图切换
  function switchTab(tabName, skipSound = false) {
    if (!gameManager.isPrologueComplete) {
      if (tabName === 'slots' && gameManager.prologueStep < 3) {
        showFloatingNotice('凡心未泯，请先至【角色修真】后山采药除害！');
        return;
      }
      if (tabName === 'cave') {
        showFloatingNotice('洞天灵脉未开，需拜入仙门方能开辟洞府！');
        return;
      }
    }

    [tabSlots, tabCharacter, tabCave].forEach(t => t && t.classList.remove('active'));
    [viewSlots, viewCharacter, viewCave].forEach(v => v && v.classList.remove('active'));

    // 切换 Tab 时立即清除所有屏幕残留的飞行宝物粒子与掉落物，防止溢出污染目标界面
    document.querySelectorAll('.dragon-spout-flyer, .drop-flyer').forEach(el => el.remove());

    if (!skipSound && window.SlotsRPG && window.SlotsRPG.SoundEffects) {
      window.SlotsRPG.SoundEffects.play('TAB_SWITCH');
    }

    const topHud = document.querySelector('.top-hud');

    if (tabName === 'slots') {
      if (tabSlots) tabSlots.classList.add('active');
      if (viewSlots) viewSlots.classList.add('active');
      if (topHud) topHud.classList.remove('hidden');
    } else if (tabName === 'character') {
      if (tabCharacter) tabCharacter.classList.add('active');
      if (viewCharacter) viewCharacter.classList.add('active');
      if (topHud) topHud.classList.add('hidden');
      pendingNotificationCount = 0;
      updateNotificationBadge();
    } else if (tabName === 'cave') {
      if (tabCave) tabCave.classList.add('active');
      if (viewCave) viewCave.classList.add('active');
      if (topHud) topHud.classList.remove('hidden');
      if (tabBadgeCave) tabBadgeCave.classList.add('hidden');
      updateCaveView();
    }

    // 持久化存储当前视图 Tab，保障页面刷新后视图与底部高亮严格一致
    try {
      localStorage.setItem('SLOTS_RPG_ACTIVE_TAB', tabName);
    } catch (e) {}
  }

  if (tabSlots) tabSlots.addEventListener('click', () => switchTab('slots'));
  if (tabCharacter) tabCharacter.addEventListener('click', () => switchTab('character'));
  if (tabCave) tabCave.addEventListener('click', () => switchTab('cave'));
  window.switchTab = switchTab;

  // 4. 监听全局状态变更更新 UI
  window.SlotsRPG.EventBus.on('STATE_CHANGE', (state) => {
    // 序章与宗门驱动
    const isPrologueComplete = state.isPrologueComplete;
    const prologueStep = state.prologueStep;

    // 底部导航栏锁定态与图标联动 (带锁图片与锁徽标)
    const isSlotsLocked = !isPrologueComplete && prologueStep < 3;
    if (tabSlots) {
      const imgSlots = tabSlots.querySelector('.nav-icon-img');
      const lockTag = tabSlots.querySelector('.nav-lock-tag');
      if (isSlotsLocked) {
        tabSlots.classList.add('tab-locked');
        if (imgSlots) {
          imgSlots.src = 'assets/ui/tab_locked.png';
          imgSlots.classList.add('icon-locked');
        }
        if (lockTag) lockTag.classList.remove('hidden');
      } else {
        tabSlots.classList.remove('tab-locked');
        if (imgSlots) {
          imgSlots.src = 'assets/ui/tab_slots.png';
          imgSlots.classList.remove('icon-locked');
        }
        if (lockTag) lockTag.classList.add('hidden');
      }
    }

    const isCaveLocked = !isPrologueComplete;
    if (tabCave) {
      const imgCave = tabCave.querySelector('.nav-icon-img');
      const lockTag = tabCave.querySelector('.nav-lock-tag');
      if (isCaveLocked) {
        tabCave.classList.add('tab-locked');
        if (imgCave) {
          imgCave.src = 'assets/ui/tab_locked.png';
          imgCave.classList.add('icon-locked');
        }
        if (lockTag) lockTag.classList.remove('hidden');
      } else {
        tabCave.classList.remove('tab-locked');
        if (imgCave) {
          imgCave.src = 'assets/ui/tab_cave.png';
          imgCave.classList.remove('icon-locked');
        }
        if (lockTag) lockTag.classList.add('hidden');
      }
    }

    if (prologueSection) {
      if (!isPrologueComplete && prologueStep < 3) {
        prologueSection.classList.remove('hidden');
        const pIcon = document.getElementById('prologue-icon');
        const pTitle = document.getElementById('prologue-title');
        const pDesc = document.getElementById('prologue-desc');
        const pBtn = document.getElementById('btn-prologue-battle');
        if (prologueStep === 2) {
          if (pIcon) pIcon.innerText = '✨';
          if (pTitle) pTitle.innerText = '恶兽已斩 · 获神秘残盘';
          if (pDesc) pDesc.innerText = '黑鬣猪轰然倒地，从其腹中剖出一块青铜古盘！请点击下方乾坤袋中的【造化天机盘】！';
          if (pBtn) pBtn.classList.add('hidden');
        } else {
          if (pIcon) pIcon.innerText = '🐗';
          if (pTitle) pTitle.innerText = '后山采药 · 惊现恶兽';
          if (pDesc) pDesc.innerText = '采药途中忽闻腥风扑鼻，一头凶暴黑鬣猪挡住去路！手无寸铁，唯有一柄防身柴刀...';
          if (pBtn) pBtn.classList.remove('hidden');
        }
      } else {
        prologueSection.classList.add('hidden');
      }
    }

    const hasJoinedSect = !!(state.currentSect && !state.isMortal);

    // 序章神兵必出引导横幅 vs 宗门试炼横幅 (互斥：未加入门派前显示神兵必出，加入后显示试炼挑战，神兵必出永久隐藏)
    const prologueSpinGuide = document.getElementById('prologue-spin-guide');
    if (prologueSpinGuide) {
      if (!hasJoinedSect) {
        prologueSpinGuide.classList.remove('hidden');
        if (btnSpin && prologueStep === 3) {
          btnSpin.classList.add('pulse-anim');
        }
      } else {
        prologueSpinGuide.classList.add('hidden');
        if (btnSpin && (!state || !state.isFirstSpinGuaranteedSect)) {
          btnSpin.classList.remove('pulse-anim');
        }
      }
    }

    // 降妖伏魔：不再提供单独挑战入口，所有战斗均由天机盘推演触发
    if (btnChallengeBoss) {
      btnChallengeBoss.classList.add('hidden');
    }

    // 顶栏与位面主题更新
    if (state.worldTier === 2) {
      document.body.classList.add('tier-spirit-realm');
    } else {
      document.body.classList.remove('tier-spirit-realm');
    }

    if (elEnergy) elEnergy.innerText = state.energy;
    const elCurrentLingji = document.getElementById('current-lingji-val');
    if (elCurrentLingji) elCurrentLingji.innerText = state.energy;

    if (elRealm) elRealm.innerText = state.realm;
    if (elLevel) {
      if (!isPrologueComplete && prologueStep < 3) {
        elLevel.innerText = '未激活';
        elLevel.style.color = '#94a3b8';
      } else {
        elLevel.innerText = `${state.level} 阶`;
        elLevel.style.color = '#34e89e';
      }
    }
    if (elPower) elPower.innerText = state.combatPower;

    // 瞬发符状态更新 (已移除今日功德)
    const elTicketCount = document.getElementById('ticket-count-text');
    const adService = window.SlotsRPG && window.SlotsRPG.AdService;
    if (elTicketCount && adService) {
      elTicketCount.innerText = adService.skipTickets;
    }

    // 引龙吐宝图标上水缸进度条更新
    const elWaterTankLiquid = document.getElementById('water-tank-liquid');
    const elWaterTankBadge = document.getElementById('water-tank-badge');
    const elSpinBtnTitle = document.getElementById('spin-btn-title');
    if (elWaterTankLiquid) {
      const cur = state.waterTankProgress || 0;
      const max = state.waterTankMax || 10;
      const pct = Math.min(100, Math.round((cur / max) * 100));
      elWaterTankLiquid.style.height = `${pct}%`;
      if (elWaterTankBadge) {
        elWaterTankBadge.innerText = state.isWaterTankFull ? '10/10 可引' : `${cur}/${max}`;
      }
      if (btnSpin) {
        if (state.isWaterTankFull) {
          btnSpin.classList.remove('charging-locked');
          btnSpin.classList.add('tank-full');
          if (elSpinBtnTitle) elSpinBtnTitle.innerText = '免费引宝';
          btnSpin.title = '天道蓄满！点击立即引龙吐宝，必爆强力法宝神兵！';
        } else {
          btnSpin.classList.remove('tank-full');
          btnSpin.classList.add('charging-locked');
          if (elSpinBtnTitle) elSpinBtnTitle.innerText = '蓄能中';
          btnSpin.title = `天机盘灵能蓄积中 (${cur}/${max})，需普通推演满10次解锁引龙吐宝`;
        }
      }
    }

    // 洞天灵气浮泡收菜更新 (PRD 10.4 节)
    const elCaveBubble = document.getElementById('cave-bubble-collector');
    const elCaveBubbleText = document.getElementById('cave-bubble-text');
    const caveEnergy = state.cave ? Math.floor(state.cave.accumulatedEnergy || 0) : 0;
    if (elCaveBubble) {
      if (caveEnergy >= 5 && isPrologueComplete) {
        elCaveBubble.classList.remove('hidden');
        if (elCaveBubbleText) elCaveBubbleText.innerText = `灵机 +${caveEnergy}`;
      } else {
        elCaveBubble.classList.add('hidden');
      }
    }

    const elBtnMeditate = document.getElementById('btn-meditate');
    if (elBtnMeditate) {
      if (state.energy <= 0 && isPrologueComplete) {
        elBtnMeditate.classList.remove('hidden');
      } else {
        elBtnMeditate.classList.add('hidden');
      }
    }
    if (state.freeReliefCount !== undefined) {
      updateReliefModalUI(state.freeReliefCount);
    }

    // 聚宝盆升级经验与阶位更新
    const potLevel = state.level || 1;
    const potExp = state.potExp !== undefined ? state.potExp : 0;
    const maxPotExp = state.maxPotExp || (potLevel === 1 ? 500 : 1500);
    const potExpPct = Math.min(100, Math.floor((potExp / maxPotExp) * 100));

    if (potTierTitle) {
      const subLvl = state.potSubLevel || 1;
      const subTitle = state.potSubTitle || '初窥门径';
      potTierTitle.innerHTML = `<span class="pot-sub-badge">Lv.${subLvl}</span> <span class="pot-title-name">天机盘·【${subTitle}】</span>`;
    }
    if (potExpText) {
      if (state.isPotBreakthroughReady) {
        potExpText.innerHTML = `蕴灵圆满: ${potExp} / ${maxPotExp} <b style="color:#ffd700;">(推演即引妖王)</b>`;
      } else {
        const subExp = state.potSubExp || 0;
        const subMax = state.potSubMaxExp || 80;
        potExpText.innerHTML = `总蕴灵: ${potExp}/${maxPotExp} <span class="pot-sub-hint">(进阶 ${subExp}/${subMax})</span>`;
      }
    }
    if (potExpBarFill) {
      potExpBarFill.style.width = `${potExpPct}%`;
    }
    // 不再提供单独的突破挑战入口，所有战斗由天机盘推演触发
    if (btnPotBreakthrough) {
      btnPotBreakthrough.classList.add('hidden');
    }
    if (reelFrame) {
      if (potLevel >= 2) {
        reelFrame.classList.add('tier-2');
      } else {
        reelFrame.classList.remove('tier-2');
      }
    }

    // 真龙威势光环与内嵌微型能量槽同步更新
    if (gameManager && gameManager.dragonCabinetManager && gameManager.dragonCabinetManager.updateRage) {
      const rageVal = gameManager.dragonLootEngine ? gameManager.dragonLootEngine.dragonRage : (state.dragonRage || 0);
      gameManager.dragonCabinetManager.updateRage(rageVal);
    }

    // 宗门斩妖试炼横幅更新 (1~12关主动挑战 + 守关大妖王)
    updateSectTrialBanner();

    // 自动推演按钮状态与连抽进度显示
    if (btnAutoSpin) {
      const autoBtnTitle = document.getElementById('auto-btn-title');
      const autoBtnProgress = document.getElementById('auto-btn-progress');
      if (state.isAutoSpinning) {
        btnAutoSpin.classList.add('active');
        if (autoBtnTitle) autoBtnTitle.innerText = '停止推演';
        if (autoBtnProgress) {
          autoBtnProgress.classList.remove('hidden');
          const targetStr = (state.autoSpinTargetCount === Infinity) ? '∞' : (state.autoSpinTargetCount || 50);
          autoBtnProgress.innerText = `${state.autoSpinCompletedCount || 0}/${targetStr}`;
        }
      } else {
        btnAutoSpin.classList.remove('active');
        if (autoBtnProgress) {
          autoBtnProgress.classList.add('hidden');
        }
        if (autoBtnTitle) {
          autoBtnTitle.innerText = currentAutoCount === 1 ? '单次推演' : '开始推演';
        }
      }
    }

// 注灵倍率已精简废除，单抽固定消耗 25 灵机

    // 角色面板更新
    if (charRealmText) charRealmText.innerText = state.realm;
    if (charPowerText) charPowerText.innerText = state.combatPower;
    if (heroProfileRealm) heroProfileRealm.innerText = state.realm;
    if (heroProfilePower) heroProfilePower.innerText = state.combatPower;
    if (charHeroEnergy) charHeroEnergy.innerText = state.energy;
    if (charHeroLevel) charHeroLevel.innerText = `${state.level} 阶`;
    if (charHeroSect) {
      if (!isPrologueComplete || state.isMortal) {
        charHeroSect.innerText = '凡人未入道';
      } else if (state.currentSect && window.SlotsRPG && window.SlotsRPG.SectConfig) {
        const sectCfg = window.SlotsRPG.SectConfig.getSect(state.currentSect);
        charHeroSect.innerText = sectCfg ? `${sectCfg.name}真传` : '散修';
      } else {
        charHeroSect.innerText = '散修';
      }
    }

    const charMainAvatar = document.getElementById('character-main-avatar');
    if (charMainAvatar && window.SlotsRPG && window.SlotsRPG.SectConfig) {
      const curSect = state.currentSect;
      const sectCfg = (window.SlotsRPG.SectConfig.SECTS && window.SlotsRPG.SectConfig.SECTS[curSect]) || null;
      const visual = (sectCfg && sectCfg.characterVisual) || window.SlotsRPG.SectConfig.DEFAULT_CHARACTER;
      if (visual && visual.avatar) {
        charMainAvatar.src = visual.avatar;
      }
    }

    const expPct = Math.min(100, Math.floor((state.exp / state.maxExp) * 100));
    if (charExpText) {
      charExpText.innerText = `${state.exp} / ${state.maxExp} (${expPct}%)`;
    }
    if (charExpFill) {
      charExpFill.style.width = `${expPct}%`;
    }

    if (statHp && state.totalStats) statHp.innerText = state.totalStats.hp;
    if (statAtk && state.totalStats) statAtk.innerText = state.totalStats.atk;
    if (statDef && state.totalStats) statDef.innerText = state.totalStats.def;

    // 宗门斩妖试炼 / 守关妖王战力雷达标尺更新 (角色面板：与天机盘试炼横幅严格统一评估目标与标尺)
    if (bossRadarPanel) {
      if (!hasJoinedSect) {
        bossRadarPanel.classList.add('hidden');
      } else {
        const info = (typeof gameManager.getCurrentTrialStageInfo === 'function') ? gameManager.getCurrentTrialStageInfo() : null;
        if (!info || info.isMortal) {
          bossRadarPanel.classList.add('hidden');
        } else {
          bossRadarPanel.classList.remove('hidden');

          const curPower = info.playerPower || state.combatPower || 18;
          const reqPower = info.reqPower || 100;
          const pct = Math.min(100, Math.max(5, Math.floor((curPower / reqPower) * 100)));
          const diff = curPower - reqPower;
          const isReady = curPower >= reqPower;
          const isHard = !isReady && curPower >= reqPower * 0.85;

          if (info.isAllCleared) {
            if (bossRadarIcon) bossRadarIcon.innerText = '🏆';
            if (bossRadarLabel) bossRadarLabel.innerText = '试炼通关:';
            if (bossRadarName) bossRadarName.innerText = '本门派妖魔已全数荡平';
            if (bossRadarReqPower) bossRadarReqPower.innerText = '已通关';
            if (bossRadarStatus) {
              bossRadarStatus.className = 'boss-radar-status ready';
              bossRadarStatus.innerText = '登峰造极';
            }
            if (bossRadarFill) {
              bossRadarFill.style.width = '100%';
              bossRadarFill.classList.add('ready');
            }
            if (bossRadarProgressText) {
              bossRadarProgressText.innerText = `战力达成度: 100% (${curPower} / ${curPower})`;
            }
            if (bossRadarHint) {
              bossRadarHint.innerText = '✨ 门派妖魔已全灭，前往【升仙天碑】或参悟天机以求飞升！';
            }
            if (btnBossRadarChallenge) {
              btnBossRadarChallenge.disabled = true;
              btnBossRadarChallenge.classList.add('disabled');
              btnBossRadarChallenge.classList.remove('pulse-gold');
              btnBossRadarChallenge.innerText = '已荡平';
            }
          } else if (info.isFinalBoss) {
            // 第 13 战：守关大妖王决战
            if (bossRadarIcon) bossRadarIcon.innerText = '🔥';
            if (bossRadarLabel) bossRadarLabel.innerText = '守关妖王:';
            if (bossRadarName) bossRadarName.innerText = info.title;
            if (bossRadarReqPower) bossRadarReqPower.innerText = `推荐战力 ${reqPower}${info.isLockedDynamic ? ' (锁定)' : ''}`;

            if (bossRadarFill) {
              bossRadarFill.style.width = `${pct}%`;
              bossRadarFill.classList.toggle('ready', isReady);
            }
            if (bossRadarProgressText) {
              bossRadarProgressText.innerText = `战力达成度: ${pct}% (${curPower} / ${reqPower})`;
            }

            if (bossRadarStatus) {
              bossRadarStatus.className = 'boss-radar-status';
              if (isReady) {
                bossRadarStatus.classList.add('ready');
                bossRadarStatus.innerText = '道基大成 (可斩妖王！)';
                if (bossRadarPanel) bossRadarPanel.classList.add('ready');
                if (bossRadarHint) bossRadarHint.innerText = '✨ 战力已达斩妖标尺！拔剑决战即可荡平妖王破关晋阶！';
              } else if (isHard) {
                bossRadarStatus.classList.add('warning');
                bossRadarStatus.innerText = `势均力敌 (还差 ${Math.abs(diff)} 战力)`;
                if (bossRadarPanel) bossRadarPanel.classList.remove('ready');
                if (bossRadarHint) bossRadarHint.innerText = '⚔️ 战力接近斩妖门槛，建议再合成1~2件法宝确保稳操胜券！';
              } else {
                bossRadarStatus.classList.add('danger');
                bossRadarStatus.innerText = `凶险异常 (还差 ${Math.abs(diff)} 战力)`;
                if (bossRadarPanel) bossRadarPanel.classList.remove('ready');
                if (bossRadarHint) bossRadarHint.innerText = '💡 打造6槽全紫法宝或提升修为突破，战力达标后再来荡平妖王！';
              }
            }

            if (btnBossRadarChallenge) {
              btnBossRadarChallenge.disabled = false;
              btnBossRadarChallenge.classList.remove('disabled');
              btnBossRadarChallenge.innerText = isReady ? '⚔️ 斩灭妖王' : '⚔️ 决战妖王';
              btnBossRadarChallenge.classList.toggle('pulse-gold', isReady);
            }
          } else {
            // 第 1~12 关递增试炼 (与天机盘横幅严格统一评估目标与数值)
            if (bossRadarIcon) bossRadarIcon.innerText = info.tier === 'elite' ? '⚡' : '🐾';
            if (bossRadarLabel) bossRadarLabel.innerText = `试炼第${info.stageIndex}关:`;
            if (bossRadarName) bossRadarName.innerText = info.title;
            if (bossRadarReqPower) bossRadarReqPower.innerText = `推荐战力 ${reqPower}`;

            if (bossRadarFill) {
              bossRadarFill.style.width = `${pct}%`;
              bossRadarFill.classList.toggle('ready', isReady);
            }
            if (bossRadarProgressText) {
              bossRadarProgressText.innerText = `战力达成度: ${pct}% (${curPower} / ${reqPower})`;
            }

            if (bossRadarStatus) {
              bossRadarStatus.className = 'boss-radar-status';
              if (isReady) {
                bossRadarStatus.classList.add('ready');
                bossRadarStatus.innerText = '胜券在握 (可斩杀！)';
                if (bossRadarPanel) bossRadarPanel.classList.add('ready');
                if (bossRadarHint) bossRadarHint.innerText = `✨ 战力已达标！出鞘迎击可轻松通关第 ${info.stageIndex} 关试炼！`;
              } else if (isHard) {
                bossRadarStatus.classList.add('warning');
                bossRadarStatus.innerText = `势均力敌 (还差 ${Math.abs(diff)} 战力)`;
                if (bossRadarPanel) bossRadarPanel.classList.remove('ready');
                if (bossRadarHint) bossRadarHint.innerText = '⚔️ 战力接近本关门槛，精炼法宝或祭出破魔符可一决高下！';
              } else {
                bossRadarStatus.classList.add('danger');
                bossRadarStatus.innerText = `凶险异常 (还差 ${Math.abs(diff)} 战力)`;
                if (bossRadarPanel) bossRadarPanel.classList.remove('ready');
                if (bossRadarHint) bossRadarHint.innerText = '💡 敌方灵压高于自身战力！建议回【乾坤袋】一键升阶装备后再战！';
              }
            }

            if (btnBossRadarChallenge) {
              btnBossRadarChallenge.disabled = false;
              btnBossRadarChallenge.classList.remove('disabled');
              btnBossRadarChallenge.innerText = isReady ? `⚔️ 拔剑斩妖 (第${info.stageIndex}关)` : `⚔️ 试炼第${info.stageIndex}关`;
              btnBossRadarChallenge.classList.toggle('pulse-gold', isReady);
            }
          }
        }
      }
    }

    // 飞升按钮：在角色加入了宗门之后显示
    if (btnOpenStele) {
      if (hasJoinedSect) {
        btnOpenStele.classList.remove('hidden');
      } else {
        btnOpenStele.classList.add('hidden');
      }
    }

    // 升仙天碑简报与飞升入口更新
    const ascension = state.ascension;
    if (steleProgressBadge && ascension) {
      steleProgressBadge.innerText = `${ascension.collectedCount}/5`;
      if (ascension.isReady) {
        if (btnOpenStele) btnOpenStele.classList.add('ready');
        steleProgressBadge.style.background = 'rgba(56, 239, 125, 0.3)';
        steleProgressBadge.style.borderColor = '#34e89e';
        steleProgressBadge.style.color = '#34e89e';
      } else {
        if (btnOpenStele) btnOpenStele.classList.remove('ready');
        steleProgressBadge.style.background = '';
        steleProgressBadge.style.borderColor = '';
        steleProgressBadge.style.color = '';
      }
    }

    // 渲染装备栏与乾坤袋
    renderEquipmentSlots(state);
    renderBagGrid(state);
    updateCaveView();

    // 若升仙天碑弹窗开启中，实时刷新
    if (modalAscensionStele && !modalAscensionStele.classList.contains('hidden')) {
      renderAscensionStele();
    }
  });

  // 宗门斩妖试炼横幅刷新 (1~12关递增试炼 + 第13战守关大妖王决战，软性绑定；未入门派前隐藏)
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

    if (!hasJoinedSect) {
      sectTrialBanner.classList.add('hidden');
      if (prologueSpinGuide) {
        prologueSpinGuide.classList.remove('hidden');
      }
      return;
    }

    // 已加入宗门：开放挑战入口，神兵必出提示框永久不再显示
    if (prologueSpinGuide) {
      prologueSpinGuide.classList.add('hidden');
    }
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

    const battleResult = gameManager.startActiveTrialChallenge();
    if (battleResult && battleResult.success === false) {
      showFloatingNotice(battleResult.reason || '无法发起挑战');
      return;
    }

    playBattleSequence(battleResult);
  }

  if (btnActiveTrialChallenge) {
    btnActiveTrialChallenge.addEventListener('click', handleActiveTrialChallenge);
  }
  if (btnBossRadarChallenge) {
    btnBossRadarChallenge.addEventListener('click', handleActiveTrialChallenge);
  }

  // 5. 渲染 6 大法宝装备栏 (支持红点升级提示与拖拽换装)
  function renderEquipmentSlots(state) {
    const slotsMap = state.equipment || {};
    const potLevel = state.level || 1;
    const slotElements = document.querySelectorAll('.equip-slot');

    slotElements.forEach(el => {
      const slotName = el.getAttribute('data-slot');
      const isUnlocked = gameManager.player.isSlotUnlocked(slotName, potLevel);
      const item = slotsMap[slotName];

      if (!isUnlocked) {
        el.className = 'equip-slot locked';
        el.innerHTML = `
          <div class="slot-placeholder">
            <span class="slot-tag">${getSlotDisplayName(slotName)}</span>
            <span class="slot-state">未解锁</span>
          </div>
        `;
        el.onclick = () => {
          showGameNotice('槽位未开', `【${getSlotDisplayName(slotName)}】将在击败首个关卡妖兽 Boss 后解锁！`, '🔒 禁制未开');
        };
        return;
      }

      if (item) {
        el.className = 'equip-slot occupied';
        el.style.borderColor = item.qualityColor || '#ffd700';
        el.style.boxShadow = `0 0 10px ${item.qualityColor}40`;
        el.innerHTML = `
          <span class="slot-quality-badge" style="background:${item.qualityColor}">${item.qualityName}</span>
          <img class="slot-equip-icon" src="${item.icon}" alt="${item.name}" />
          <div class="slot-equip-name" style="color:${item.qualityColor}">${item.name}</div>
        `;
        el.onclick = () => {
          showEquipDetailModal({ type: 'equipped', slot: slotName, item });
        };
      } else {
        el.className = 'equip-slot';
        el.style.borderColor = 'rgba(255, 255, 255, 0.16)';
        el.style.boxShadow = 'none';
        el.innerHTML = `
          <div class="slot-placeholder">
            <span class="slot-tag">${getSlotDisplayName(slotName)}</span>
            <span class="slot-state">可穿戴</span>
          </div>
        `;
        el.onclick = () => {
          const candidates = gameManager.getEquipCandidatesForSlot(slotName);
          if (candidates.length > 0) {
            const best = candidates[0];
            if (best.item.isNew) {
              gameManager.markItemRead(best.index);
            }
            showEquipDetailModal({ type: 'inventory', index: best.index, item: best.item });
          } else {
            showGameNotice('槽位空置', `当前【${getSlotDisplayName(slotName)}】槽位为空，可在下方乾坤袋中选择合适法宝穿戴。`, '💡 穿戴指引');
          }
        };
      }

      // 【1. 装备栏红点提示】：有更好装备或空位可穿戴时显示
      const canUpgrade = gameManager.canSlotBeEquippedOrUpgraded(slotName);
      if (canUpgrade) {
        el.classList.add('has-upgrade');
      } else {
        el.classList.remove('has-upgrade');
      }

      // 【2. 拖拽换装目标区域绑定】：
      el.ondragover = (e) => {
        e.preventDefault();
        el.classList.add('drag-over');
      };
      el.ondragleave = () => {
        el.classList.remove('drag-over');
      };
      el.ondrop = (e) => {
        e.preventDefault();
        el.classList.remove('drag-over');
        try {
          const raw = e.dataTransfer.getData('text/plain');
          if (!raw) return;
          const data = JSON.parse(raw);
          if (data && data.index !== undefined) {
            if (data.part === slotName) {
              const res = gameManager.equipItem(data.index);
              if (res) {
                if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
                  window.SlotsRPG.SoundEffects.play(res.replaced ? 'EQUIP_SWAP' : 'EQUIP');
                }
                if (res.statDiff) {
                  showFloatingAttrBurst(res.statDiff);
                  renderer.addFloatingText(`换装成功: ${res.equipped.name}`, res.equipped.qualityColor || '#ffd700');
                }
              }
            } else {
              showGameNotice('部位不符', `该法宝为【${getSlotDisplayName(data.part)}】，无法佩戴于【${getSlotDisplayName(slotName)}】槽位！`, '⚠️ 佩戴有误');
            }
          }
        } catch (err) {
          console.error('Drag equip error:', err);
        }
      };
    });

    // 刷新一键装备状态 (若乾坤袋中有更强法宝则高亮呼吸提醒)
    updateQuickEquipButtonState();
  }

  function getSlotDisplayName(slot) {
    const map = {
      weapon: '武器',
      armor: '衣服',
      ring: '戒指',
      hat: '帽子',
      boots: '鞋子',
      belt: '腰带'
    };
    return map[slot] || slot;
  }

  // 6. 渲染乾坤袋 24 格网格 (支持红点提示与拖拽发起)
  function renderBagGrid(state) {
    const items = state.inventorySlots || [];
    const capacity = state.inventoryCapacity || 24;
    const occupied = items.filter(it => it !== null).length;

    if (bagCapText) {
      bagCapText.innerText = `乾坤袋 (${occupied}/${capacity})`;
    }

    if (chkAutoSalvage) {
      chkAutoSalvage.checked = !!state.autoSalvageEnabled;
    }

    if (!bagGrid) return;
    bagGrid.innerHTML = '';

    for (let i = 0; i < capacity; i++) {
      const item = items[i];
      const cell = document.createElement('div');

      if (item) {
        if (item.isArtifactPlate) {
          cell.className = 'bag-cell occupied artifact-plate-slot';
          cell.style.borderColor = '#ffd700';
          cell.innerHTML = `
            <div class="artifact-plate-guide-pointer">👉</div>
            <img class="cell-icon" src="${item.icon}" alt="${item.name}" />
            <div class="cell-name" style="color:#ffd700; font-weight:bold;">${item.name}</div>
            <span class="cell-badge cell-quality-badge" style="color:#ffd700; background:rgba(255,215,0,0.25);">神物</span>
          `;
          cell.onclick = () => {
            // 点击天机盘：在乾坤袋中解封认主，触发序章神盘认主剧情对话
            gameManager.awakenTianjiPlateFromBag(item);
            if (storyManager) {
              storyManager.triggerChapter('prologue_awaken', () => {
                switchTab('slots');
                const prologueSpinGuide = document.getElementById('prologue-spin-guide');
                if (prologueSpinGuide) prologueSpinGuide.classList.remove('hidden');
                if (btnSpin) btnSpin.classList.add('pulse-anim');
              });
            } else {
              switchTab('slots');
              const prologueSpinGuide = document.getElementById('prologue-spin-guide');
              if (prologueSpinGuide) prologueSpinGuide.classList.remove('hidden');
              if (btnSpin) btnSpin.classList.add('pulse-anim');
            }
          };
          bagGrid.appendChild(cell);
          continue;
        }

        cell.className = 'bag-cell occupied';
        cell.style.borderColor = item.qualityColor || '#fff';
        cell.style.boxShadow = `inset 0 0 8px ${item.qualityColor}30`;

        // 装备支持拖拽换装
        if (item.type === 'equip') {
          cell.draggable = true;
          cell.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ index: i, part: item.part, name: item.name }));
            cell.classList.add('dragging');
          };
          cell.ondragend = () => {
            cell.classList.remove('dragging');
          };
        }

        if (item.type === 'pill' || item.type === 'rune') {
          cell.innerHTML = `
            <img class="cell-icon" src="${item.icon}" alt="${item.name}" />
            <div class="cell-name" style="color:${item.qualityColor || '#cbd5e1'}">${item.name}</div>
            <span class="cell-badge">x${item.amount}</span>
          `;
        } else {
          cell.innerHTML = `
            <img class="cell-icon" src="${item.icon}" alt="${item.name}" />
            <div class="cell-name" style="color:${item.qualityColor}">${item.name}</div>
            <span class="cell-badge cell-quality-badge" style="color:${item.qualityColor}">${item.qualityName}</span>
          `;
        }

        // 【2. 物品红点过滤】：
        // - 对装备提升无效果的装备，不显示红点
        // - 不是新获得（没有获得过）的物品，不显示红点
        let showRedDot = false;
        if (item.type === 'equip') {
          const hasImprovement = gameManager.player.hasEquipmentImprovement(item, state.level || 1);
          showRedDot = !!item.isNew && hasImprovement;
        } else {
          showRedDot = !!item.isNew;
        }

        if (showRedDot) {
          const redDot = document.createElement('span');
          redDot.className = (item.type === 'pill' || item.type === 'rune')
            ? 'item-red-dot left-corner'
            : 'item-red-dot';
          cell.appendChild(redDot);
        }

        // 点击物品：消除红点并打开详情弹窗
        cell.onclick = () => {
          if (item.isNew) {
            gameManager.markItemRead(i);
          }
          showEquipDetailModal({ type: 'inventory', index: i, item });
        };
      } else {
        cell.className = 'bag-cell empty';
        cell.innerHTML = '';
      }

      bagGrid.appendChild(cell);
    }

    // 动态刷新底部 3 大操作按钮的置灰/启用状态
    updateBagActionButtons();
  }

  function updateBagActionButtons() {
    const canMerge = gameManager.canMergeEquipment();
    const canSalvage = gameManager.canBulkSalvageEquipment(['Q1', 'Q2']);
    const canSort = gameManager.canSortInventory();

    // 1. 浮动式一键升阶/合成按钮 (仅在有可合成装备时动态展现，带呼吸动态光效)
    if (floatingMergeWrap) {
      if (canMerge) {
        floatingMergeWrap.classList.remove('hidden');
      } else {
        floatingMergeWrap.classList.add('hidden');
      }
    }
    if (btnFloatingMerge) {
      btnFloatingMerge.disabled = !canMerge;
      btnFloatingMerge.classList.toggle('disabled', !canMerge);
    }

    // 2. 乾坤袋标题最右侧“整理”按钮
    if (btnBagSortHeader) {
      btnBagSortHeader.disabled = !canSort;
      btnBagSortHeader.classList.toggle('disabled', !canSort);
      btnBagSortHeader.title = canSort ? '一键整理乾坤袋' : '乾坤袋已整理有序，无需整理';
    }

    // 3. 向下兼容老按钮
    if (btnBagMerge) {
      btnBagMerge.disabled = !canMerge;
      btnBagMerge.classList.toggle('disabled', !canMerge);
      btnBagMerge.title = canMerge ? '一键 3 合 1 升阶法宝' : '乾坤袋中未找到 3 件同部位同品质的法宝';
    }

    if (btnBagSalvage) {
      btnBagSalvage.disabled = !canSalvage;
      btnBagSalvage.classList.toggle('disabled', !canSalvage);
      btnBagSalvage.title = canSalvage ? '一键批量分解凡铁/灵器法宝' : '乾坤袋中无凡铁或灵器法宝可分解';
    }

    if (btnBagSort) {
      btnBagSort.disabled = !canSort;
      btnBagSort.classList.toggle('disabled', !canSort);
      btnBagSort.title = canSort ? '一键整理乾坤袋' : '乾坤袋已整理有序，无需整理';
    }

    // 4. 刷新一键装备高亮状态
    updateQuickEquipButtonState();
  }

  /**
   * 刷新装备栏“一键装备”按钮的禁用与亮起状态：
   * 没有装备可替换时保持灰色并禁用，有更优装备可替换后才亮起翡翠流光与呼吸提醒
   */
  function updateQuickEquipButtonState() {
    if (!btnQuickEquip || !gameManager || !gameManager.player) return;
    const slots = ['weapon', 'armor', 'ring', 'hat', 'boots', 'belt'];
    const potLevel = gameManager.potLevel || 1;
    const hasUpgrade = slots.some(slot => gameManager.canSlotBeEquippedOrUpgraded(slot));

    btnQuickEquip.disabled = !hasUpgrade;
    btnQuickEquip.classList.toggle('disabled', !hasUpgrade);
    btnQuickEquip.classList.toggle('active', hasUpgrade);
    btnQuickEquip.classList.toggle('has-upgrade', hasUpgrade);

    if (hasUpgrade) {
      btnQuickEquip.title = '乾坤袋中有可提升战力的更优法宝，点击一键装备！';
    } else {
      btnQuickEquip.title = '乾坤袋中暂无可替换的更优法宝';
    }
  }

  /**
   * 一键装备：智能扫描乾坤袋，为所有已解锁槽位穿戴或替换为战力最高的最佳法宝组合
   */
  function quickEquipBestGear() {
    if (!gameManager || !gameManager.player) return;

    const slots = ['weapon', 'armor', 'ring', 'hat', 'boots', 'belt'];
    const potLevel = gameManager.potLevel || 1;
    const hasUpgrade = slots.some(slot => gameManager.canSlotBeEquippedOrUpgraded(slot));
    if (!hasUpgrade) {
      showFloatingNotice('当前佩戴已是最佳法宝组合，无需更换', '#94a3b8');
      return;
    }

    const initialCombatPower = gameManager.player.combatPower;
    let upgradedCount = 0;
    let totalPowerGain = 0;
    const upgradedDetails = [];

    // 持续扫描替换，直到所有已解锁部位均无可进一步提升的装备 (安全上限 12 次)
    let foundUpgrade = true;
    let safetyCounter = 0;

    while (foundUpgrade && safetyCounter < 12) {
      safetyCounter++;
      foundUpgrade = false;

      for (const slotName of slots) {
        if (!gameManager.player.isSlotUnlocked(slotName, potLevel)) {
          continue;
        }

        const currentEquip = gameManager.player.equipment[slotName];
        const currentPower = currentEquip ? (currentEquip.power || 0) : -1;

        // 在乾坤袋中寻找该部位战力最高的候选装备
        let bestCandidate = null;
        let bestIndex = -1;
        let maxPower = currentPower;

        for (let i = 0; i < gameManager.inventory.capacity; i++) {
          const item = gameManager.inventory.slots[i];
          if (item && item.type === 'equip' && item.part === slotName) {
            const p = item.power || 0;
            if (p > maxPower) {
              maxPower = p;
              bestCandidate = item;
              bestIndex = i;
            }
          }
        }

        if (bestCandidate && bestIndex !== -1) {
          const prevCombatPower = gameManager.player.combatPower;
          const res = gameManager.equipItem(bestIndex);
          if (res) {
            foundUpgrade = true;
            upgradedCount++;
            const diff = gameManager.player.combatPower - prevCombatPower;
            if (diff > 0) totalPowerGain += diff;
            upgradedDetails.push({
              slotName: res.equipped.slotName || getSlotDisplayName(slotName),
              name: res.equipped.name,
              color: res.equipped.qualityColor || '#ffd700'
            });
          }
        }
      }
    }

    const netPowerGain = gameManager.player.combatPower - initialCombatPower;
    const displayPowerGain = netPowerGain > 0 ? netPowerGain : totalPowerGain;

    if (upgradedCount > 0) {
      if (window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('QUICK_EQUIP');
      }

      // 直接显示加了多少战斗力 (取缔阻断弹窗，直接动效呈现)
      showCombatPowerGainNotice(displayPowerGain, upgradedCount);

      if (renderer && renderer.addFloatingText) {
        renderer.addFloatingText(`⚡ 战力提升 +${displayPowerGain}`, '#38ef7d');
      }
    } else {
      showFloatingNotice('当前佩戴已是最佳法宝组合，无需更换', '#94a3b8');
    }

    updateQuickEquipButtonState();
    updateBagActionButtons();
  }

  // 7. 法宝通鉴弹窗展示与对比
  function showEquipDetailModal(target) {
    currentModalTarget = target;
    const { item, type, slot, index } = target;
    if (!item) return;

    modalItemName.innerText = item.name;
    modalItemName.style.color = item.qualityColor || '#ffffff';
    modalItemIcon.src = item.icon;
    modalItemIconFrame.style.borderColor = item.qualityColor || '#8c8c8c';

    // 装备类
    if (item.type === 'equip') {
      if (modalStatsBoxTitle) modalStatsBoxTitle.innerText = '法宝属性加成';
      modalItemQuality.innerText = `${item.qualityName} (${item.qualityCode || '凡铁'})`;
      modalItemQuality.style.color = item.qualityColor || '#8c8c8c';
      modalItemPart.innerText = item.slotName || getSlotDisplayName(item.part);

      let affixHtml = '';
      if (item.affixes && item.affixes.length > 0) {
        affixHtml = `
          <div class="immortal-affix-list" style="margin-top:8px; padding-top:8px; border-top:1px dashed rgba(255,215,0,0.3);">
            <div style="font-size:11px; color:#ffd700; font-weight:bold; margin-bottom:4px;">✨ 仙道专属被动词条</div>
            ${item.affixes.map(af => `
              <div class="immortal-affix-item" style="font-size:11px; color:#e2e8f0; line-height:1.4; margin-bottom:3px; background:rgba(255,215,0,0.08); padding:4px 6px; border-radius:4px; border-left:3px solid #ffd700;">
                <b style="color:#f59e0b;">${af.name}</b>: <span style="color:#94a3b8;">${af.desc}</span>
              </div>
            `).join('')}
          </div>
        `;
      }
      let descHtml = '';
      if (item.desc) {
        descHtml = `<div class="item-lore-desc" style="font-size:11px; color:#94a3b8; font-style:italic; margin-top:6px; line-height:1.4; padding:4px 6px; background:rgba(255,255,255,0.03); border-radius:4px;">“${item.desc}”</div>`;
      }

      modalItemStats.innerHTML = `
        <div class="stat-line"><span class="stat-label">攻击力:</span><span class="stat-value stat-val-highlight">+${item.stats.atk || 0}</span></div>
        <div class="stat-line"><span class="stat-label">气血值:</span><span class="stat-value stat-val-highlight">+${item.stats.hp || 0}</span></div>
        <div class="stat-line"><span class="stat-label">防御力:</span><span class="stat-value stat-val-highlight">+${item.stats.def || 0}</span></div>
        <div class="stat-line" style="border-top:1px dashed rgba(255,255,255,0.1); padding-top:6px; margin-top:6px;">
          <span class="stat-label">法宝估值战力:</span><span class="stat-value" style="color:#ffaa00; font-weight:bold;">${item.power || 0}</span>
        </div>
        ${affixHtml}
        ${descHtml}
      `;

      if (type === 'inventory') {
        const currentEquipped = gameManager.player.equipment[item.part];
        let diffHtml = '';
        if (currentEquipped) {
          const dAtk = item.stats.atk - currentEquipped.stats.atk;
          const dHp = item.stats.hp - currentEquipped.stats.hp;
          const dDef = item.stats.def - currentEquipped.stats.def;
          const dPower = item.power - currentEquipped.power;

          diffHtml = `对比已穿戴【${currentEquipped.name}】: <br />
            战力: <span class="${dPower >= 0 ? 'diff-positive' : 'diff-negative'}">${dPower >= 0 ? '+' : ''}${dPower}</span> | 
            攻击: <span class="${dAtk >= 0 ? 'diff-positive' : 'diff-negative'}">${dAtk >= 0 ? '+' : ''}${dAtk}</span> | 
            气血: <span class="${dHp >= 0 ? 'diff-positive' : 'diff-negative'}">${dHp >= 0 ? '+' : ''}${dHp}</span>`;
        } else {
          diffHtml = `对应槽位暂无穿戴，直接装备可获得全部战力加成！`;
        }
        modalItemCompare.innerHTML = diffHtml;

        btnItemPrimary.style.display = 'block';
        btnItemPrimary.innerText = currentEquipped ? '替换穿戴' : '穿戴法宝';
        btnItemPrimary.disabled = false;

        btnItemSalvage.style.display = 'block';
        btnItemSalvage.innerText = `分解 (+${item.salvageEnergy || 5}机缘)`;
      } else {
        // 已穿戴
        const candidates = gameManager.getEquipCandidatesForSlot(slot);
        const better = candidates.find(c => (c.item.power || 0) > (item.power || 0));
        if (better) {
          const dPower = (better.item.power || 0) - (item.power || 0);
          modalItemCompare.innerHTML = `<span style="color:#34e89e;">● 正在佩戴中，属性已计入角色战力</span><br/><span style="color:#ffd700; font-weight:bold;">💡 乾坤袋中有更高战力法宝【${better.item.name}】(+${dPower} 战力) 可供替换！</span>`;
        } else {
          modalItemCompare.innerHTML = `<span style="color:#34e89e;">● 正在佩戴中，属性已计入角色属性与总战力</span>`;
        }
        btnItemPrimary.style.display = 'block';
        btnItemPrimary.innerText = '卸下入包';

        if (!gameManager.inventory.canUnequip()) {
          btnItemPrimary.disabled = true;
          btnItemPrimary.innerText = '乾坤袋已满(无法卸下)';
          btnItemPrimary.title = '背包无空格，请先分解或整理背包物品';
        } else {
          btnItemPrimary.disabled = false;
        }

        btnItemSalvage.style.display = 'none';
      }
    } else {
      // 丹药或道符类
      modalItemQuality.innerText = `储量: ${item.amount}`;
      modalItemQuality.style.color = item.qualityColor || '#ffd700';

      const isExpPill = item.type === 'pill' && item.subType === 'exp';
      const isHpPill = item.type === 'pill' && item.subType === 'hp';

      if (isExpPill) {
        if (modalStatsBoxTitle) modalStatsBoxTitle.innerText = '灵丹效用与储量';
        modalItemPart.innerText = '修真灵丹';
        modalItemStats.innerHTML = `
          <div class="stat-line"><span class="stat-label">灵丹品名:</span><span class="stat-value" style="color:#ffd700; font-weight:bold;">${item.name}</span></div>
          <div class="stat-line stat-line-desc">
            <span class="stat-label">灵丹效用:</span>
            <span class="stat-value desc-text">直接炼化注入 <b>+100 经验</b>，助益跨越境界！</span>
          </div>
          <div class="stat-line"><span class="stat-label">乾坤储量:</span><span class="stat-value stat-val-highlight">${item.amount} 颗</span></div>
        `;
        modalItemCompare.innerHTML = `<span style="color:#ffd700;">● 经验灵丹：点击下方按钮即可炼化药力提升修为！</span>`;

        btnItemPrimary.style.display = 'block';
        btnItemPrimary.innerText = item.amount > 1 ? '服用 1 颗 (+100经验)' : '服用灵丹 (+100经验)';
        btnItemPrimary.disabled = false;

        if (item.amount > 1) {
          btnItemSalvage.style.display = 'block';
          btnItemSalvage.innerText = `全部服用 (+${item.amount * 100}经验)`;
        } else {
          btnItemSalvage.style.display = 'none';
        }
      } else if (isHpPill) {
        if (modalStatsBoxTitle) modalStatsBoxTitle.innerText = '战备灵丹效用';
        modalItemPart.innerText = '战备灵丹';
        modalItemStats.innerHTML = `
          <div class="stat-line"><span class="stat-label">灵丹品名:</span><span class="stat-value" style="color:#ff6b6b; font-weight:bold;">${item.name}</span></div>
          <div class="stat-line stat-line-desc">
            <span class="stat-label">灵丹效用:</span>
            <span class="stat-value desc-text">温养筋脉气血，挑战妖王时战中服用<b>回复 40% 气血</b>！</span>
          </div>
          <div class="stat-line"><span class="stat-label">乾坤储量:</span><span class="stat-value stat-val-highlight">${item.amount} 颗</span></div>
        `;
        modalItemCompare.innerHTML = `<span style="color:#34e89e;">● 战备应急灵丹：挑战妖王/Boss 时在战斗面板底部快捷点击使用。</span>`;

        btnItemPrimary.style.display = 'block';
        btnItemPrimary.innerText = '知悉存纳';
        btnItemPrimary.disabled = false;
        btnItemSalvage.style.display = 'none';
      } else {
        if (modalStatsBoxTitle) modalStatsBoxTitle.innerText = '道家真符效用';
        modalItemPart.innerText = '道家符箓';
        const isSYM01 = item.symbolId === 'SYM_01';
        const isSYM02 = item.symbolId === 'SYM_02';
        const isSYM03 = item.symbolId === 'SYM_03';
        const energyGainedSingle = isSYM01 ? 20 : (isSYM02 ? 50 : 100);

        modalItemStats.innerHTML = `
          <div class="stat-line"><span class="stat-label">道符品名:</span><span class="stat-value" style="color:#38bdf8; font-weight:bold;">${item.name}</span></div>
          <div class="stat-line stat-line-desc">
            <span class="stat-label">道符效用:</span>
            <span class="stat-value desc-text">${
              isSYM03 
                ? '朱砂破煞，挑战妖王时可祭出纯阳神雷重创妖兽 (占 1 回合)；亦可炼化吸收转化为 <b>+100 机缘</b>！'
                : `内蕴道家真灵灵机，可直接炼化吸收转化为 <b>+${energyGainedSingle} 机缘</b>！`
            }</span>
          </div>
          <div class="stat-line"><span class="stat-label">乾坤储量:</span><span class="stat-value stat-val-highlight">${item.amount} 张</span></div>
        `;
        modalItemCompare.innerHTML = `<span style="color:#38bdf8;">● ${
          isSYM03 
            ? '战斗备战真符：迎战妖王时释放纯阳天雷神罚（占用 1 回合行动）；平时亦可炼化' 
            : '天地造化信物：点击下方按钮即可炼化为滚轮推演机缘！'
        }</span>`;

        btnItemPrimary.style.display = 'block';
        btnItemPrimary.innerText = `炼化 1 张 (+${energyGainedSingle}机缘)`;
        btnItemPrimary.disabled = false;

        if (item.amount > 1) {
          btnItemSalvage.style.display = 'block';
          btnItemSalvage.innerText = `全部炼化 (+${item.amount * energyGainedSingle}机缘)`;
        } else {
          btnItemSalvage.style.display = 'none';
        }
      }
    }

    // 动态自适应按钮布局：3 个按钮时自动切分为上二下一排版，2 个按钮时水平对半分
    const hasThree = btnItemSalvage && btnItemSalvage.style.display !== 'none';
    if (modalItemActions) {
      modalItemActions.classList.toggle('has-three-buttons', hasThree);
    }

    modalItemDetail.classList.remove('hidden');
  }

  // 弹窗按钮事件
  btnItemPrimary.addEventListener('click', () => {
    if (!currentModalTarget) return;
    const { type, index, slot, item } = currentModalTarget;

    if (item && item.type === 'equip') {
      if (type === 'inventory') {
        const res = gameManager.equipItem(index);
        if (res) {
          if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
            window.SlotsRPG.SoundEffects.play(res.replaced ? 'EQUIP_SWAP' : 'EQUIP');
          }
          if (res.statDiff) {
            showFloatingAttrBurst(res.statDiff);
            renderer.addFloatingText(`穿戴法宝: ${res.equipped.name}`, res.equipped.qualityColor || '#ffd700');
          }
        }
      } else if (type === 'equipped') {
        const res = gameManager.unequipItem(slot);
        if (!res.success) {
          showGameNotice('卸下失败', res.message || '乾坤袋已满，请先清理背包后再卸下！', '⚠️ 储物戒告罄');
          return;
        } else {
          if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
            window.SlotsRPG.SoundEffects.play('UNEQUIP');
          }
          renderer.addFloatingText(`卸下法宝: ${res.item.name}`, '#8fa0b5');
        }
      }
    } else if (item && item.type === 'pill' && item.subType === 'exp') {
      const res = gameManager.usePill('exp', 1);
      modalItemDetail.classList.add('hidden');
      if (!res.success) {
        showGameNotice('无法服用', res.message || '当前状态无法炼化此丹！', '⚠️ 灵力阻滞');
        return;
      }
      if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('PILL_CONSUME');
      }
      renderer.addFloatingText(`炼化九转修为丹 +${res.expGained} 经验!`, '#ffd700');
      showFloatingAttrBurst({ exp: res.expGained });
      if (res.levelUps && res.levelUps.length > 0) {
        const latest = res.levelUps[res.levelUps.length - 1];
        showLevelUpModal(latest);
      }
      return;
    } else if (item && item.type === 'rune') {
      const res = gameManager.useRune(item.symbolId, 1);
      modalItemDetail.classList.add('hidden');
      if (res.success) {
        if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
          window.SlotsRPG.SoundEffects.play('RUNE_USE');
        }
        renderer.addFloatingText(`炼化${item.name} +${res.energyGained} 机缘!`, '#38bdf8');
        showFloatingAttrBurst({ energy: res.energyGained });
      } else {
        showGameNotice('炼化失败', res.message || '无法炼化此道符！', '⚠️ 灵气紊乱');
      }
      return;
    }
    modalItemDetail.classList.add('hidden');
  });

  btnItemSalvage.addEventListener('click', () => {
    if (!currentModalTarget || currentModalTarget.type !== 'inventory') return;
    const { item, index } = currentModalTarget;

    if (item && item.type === 'equip') {
      const energyGained = gameManager.salvageItem(index);
      modalItemDetail.classList.add('hidden');
      renderer.addFloatingText(`法宝分解 +${energyGained} 机缘!`, '#52c41a');
      return;
    }

    if (item && item.type === 'pill' && item.subType === 'exp') {
      const count = item.amount || 1;
      const res = gameManager.usePill('exp', count);
      modalItemDetail.classList.add('hidden');
      if (!res.success) {
        showGameNotice('无法服用', res.message || '当前状态无法炼化此丹！', '⚠️ 灵力阻滞');
        return;
      }
      renderer.addFloatingText(`全部炼化 ${res.consumed} 颗修为丹 +${res.expGained} 经验!`, '#ffd700');
      showFloatingAttrBurst({ exp: res.expGained });
      if (res.levelUps && res.levelUps.length > 0) {
        const latest = res.levelUps[res.levelUps.length - 1];
        showLevelUpModal(latest);
      }
      return;
    }

    if (item && item.type === 'rune') {
      const count = item.amount || 1;
      const res = gameManager.useRune(item.symbolId, count);
      modalItemDetail.classList.add('hidden');
      if (res.success) {
        renderer.addFloatingText(`全部炼化 ${res.consumed} 张${item.name} +${res.energyGained} 机缘!`, '#38bdf8');
        showFloatingAttrBurst({ energy: res.energyGained });
      } else {
        showGameNotice('炼化失败', res.message || '无法炼化此道符！', '⚠️ 灵气紊乱');
      }
      return;
    }
  });

  btnItemClose.addEventListener('click', () => {
    modalItemDetail.classList.add('hidden');
  });

  if (btnItemCloseX) {
    btnItemCloseX.addEventListener('click', () => {
      modalItemDetail.classList.add('hidden');
    });
  }

  // 8. 装备与乾坤袋快捷操作 (一键装备、一键整理、浮动一键升阶)
  if (btnQuickEquip) {
    btnQuickEquip.addEventListener('click', () => {
      quickEquipBestGear();
    });
  }

  if (btnBagSortHeader) {
    btnBagSortHeader.addEventListener('click', () => {
      if (!gameManager.canSortInventory()) {
        if (renderer && renderer.addFloatingText) {
          renderer.addFloatingText('乾坤袋已井然有序，无需重复整理', '#94a3b8');
        }
        return;
      }
      gameManager.sortInventory();
      if (renderer && renderer.addFloatingText) {
        renderer.addFloatingText('乾坤袋整理完成', '#4b6cb7');
      }
      if (window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('BAG_SORT');
      }
      updateBagActionButtons();
    });
  }

  function executeBagMerge() {
    if (!gameManager.canMergeEquipment()) return;
    const res = gameManager.mergeEquipment();
    if (res.mergedGroupsCount > 0) {
      const names = res.upgradedItems.map(i => `<span style="color:${i.qualityColor || '#ffd700'};">${i.name}</span>`).join('、');
      showGameNotice(
        '造化熔炉·3合1升阶成功',
        `共融合 <b>${res.mergedGroupsCount}</b> 组同阶法宝，释放 <b>${res.freedSlots}</b> 个背包空格！<br><br><b>凝练获得全新仙家法宝：</b><br>${names}`,
        '✨ 熔炉神铸'
      );
      if (renderer && renderer.addFloatingText) {
        renderer.addFloatingText(`3合1融合成功 +${res.mergedGroupsCount}组!`, '#ffd700');
      }
      if (storyManager) {
        storyManager.triggerChatter('equip_merge');
      }
      if (window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('EQUIP_UPGRADE');
      }
      updateBagActionButtons();
      updateQuickEquipButtonState();
    }
  }

  if (btnFloatingMerge) {
    btnFloatingMerge.addEventListener('click', executeBagMerge);
  }

  if (btnBagMerge) {
    btnBagMerge.addEventListener('click', executeBagMerge);
  }

  if (btnBagSalvage) {
    btnBagSalvage.addEventListener('click', () => {
      if (!gameManager.canBulkSalvageEquipment(['Q1', 'Q2'])) return;
      const res = gameManager.bulkSalvageEquipment(['Q1', 'Q2']);
      if (res.count > 0) {
        if (window.SlotsRPG.SoundEffects) {
          window.SlotsRPG.SoundEffects.play('SALVAGE');
        }
        showGameNotice(
          '法宝批量分解完毕',
          `成功将 <b>${res.count}</b> 件凡铁/灵器法宝熔归天地！<br><br>灵火淬炼，回收机缘 <b style="color:#38bdf8;">+${res.totalEnergy}</b> 点！`,
          '🔥 灵火淬炼'
        );
        if (renderer && renderer.addFloatingText) {
          renderer.addFloatingText(`批量分解 +${res.totalEnergy}机缘!`, '#ff5858');
        }
        updateBagActionButtons();
      }
    });
  }

  if (btnBagSort) {
    btnBagSort.addEventListener('click', () => {
      if (!gameManager.canSortInventory()) return;
      gameManager.sortInventory();
      if (window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('BAG_SORT');
      }
      if (renderer && renderer.addFloatingText) {
        renderer.addFloatingText('乾坤袋整理完成', '#4b6cb7');
      }
      updateBagActionButtons();
    });
  }

  if (chkAutoSalvage) {
    chkAutoSalvage.addEventListener('change', (e) => {
      gameManager.setAutoSalvage(e.target.checked);
    });
  }

  // 9. 监听奖励掉落动效 (已由龙头吐宝入格动画与临时背包一键收纳接管，抽奖时不再直接掉入角色修真)
  window.SlotsRPG.EventBus.on('REWARDS_DROPPED', (data) => {
    // 抽奖过程只进入展示区槽位，由【一键收纳】或【自动收纳】统一收取飞入背包
  });

  // 10. 突破与爆仓弹窗事件
  window.SlotsRPG.EventBus.on('PLAYER_LEVEL_UP', (levelUps) => {
    if (!levelUps || levelUps.length === 0) return;
    const first = levelUps[0];
    const latest = levelUps[levelUps.length - 1];

    const oldRealm = first.oldRealm;
    const newRealm = latest.newRealm;
    const oldPower = first.oldPower !== undefined ? first.oldPower : Math.floor(first.oldStats.hp * 0.2 + first.oldStats.atk * 2.0 + first.oldStats.def * 1.5);
    const newPower = latest.newPower !== undefined ? latest.newPower : gameManager.player.combatPower;
    const powerDiff = Math.max(0, newPower - oldPower);

    const oldStats = first.oldStats;
    const newStats = latest.newStats;
    const hpDiff = Math.max(0, newStats.hp - oldStats.hp);
    const atkDiff = Math.max(0, newStats.atk - oldStats.atk);
    const defDiff = Math.max(0, newStats.def - oldStats.def);

    if (levelupRealmOld) levelupRealmOld.innerText = oldRealm;
    if (levelupRealmNew) levelupRealmNew.innerText = newRealm;

    if (levelupPowerOld) levelupPowerOld.innerText = oldPower;
    if (levelupPowerNew) levelupPowerNew.innerText = newPower;
    if (levelupPowerDiff) levelupPowerDiff.innerText = `+${powerDiff} 🔺`;

    if (levelupStatHpOld) levelupStatHpOld.innerText = oldStats.hp;
    if (levelupStatHpNew) levelupStatHpNew.innerText = newStats.hp;
    if (levelupStatHpDiff) levelupStatHpDiff.innerText = `(+${hpDiff})`;

    if (levelupStatAtkOld) levelupStatAtkOld.innerText = oldStats.atk;
    if (levelupStatAtkNew) levelupStatAtkNew.innerText = newStats.atk;
    if (levelupStatAtkDiff) levelupStatAtkDiff.innerText = `(+${atkDiff})`;

    if (levelupStatDefOld) levelupStatDefOld.innerText = oldStats.def;
    if (levelupStatDefNew) levelupStatDefNew.innerText = newStats.def;
    if (levelupStatDefDiff) levelupStatDefDiff.innerText = `(+${defDiff})`;

    if (modalLevelUp) {
      modalLevelUp.classList.remove('hidden');
    }
  });

  btnLevelupConfirm.addEventListener('click', () => {
    modalLevelUp.classList.add('hidden');
  });

  window.SlotsRPG.EventBus.on('INVENTORY_OVERFLOW_FULL', () => {
    if (modalOverflowAlert) {
      modalOverflowAlert.classList.remove('hidden');
    }
  });

  btnOverflowMerge.addEventListener('click', () => {
    gameManager.mergeEquipment();
    modalOverflowAlert.classList.add('hidden');
  });

  btnOverflowSalvage.addEventListener('click', () => {
    gameManager.bulkSalvageEquipment(['Q1', 'Q2']);
    modalOverflowAlert.classList.add('hidden');
  });

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

  // 12. 伏妖战场播放引擎与结算逻辑
  let isBattleFastMode = false;
  let activeBattleResult = null;
  let battleStepTimer = null;

  if (btnBattleSpeed) {
    btnBattleSpeed.addEventListener('click', () => {
      isBattleFastMode = !isBattleFastMode;
      btnBattleSpeed.innerText = isBattleFastMode ? '⚡ 极速 (2x)' : '⚡ 正常 (1x)';
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
    activeBattleResult = battleResult;

    if (battleStepTimer) {
      clearTimeout(battleStepTimer);
      battleStepTimer = null;
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
      if (totalMonsters > 1) {
        battleWaveBadge.innerText = `敌方阵列·共 ${totalMonsters} 头妖兽`;
        battleWaveBadge.classList.remove('hidden');
      } else {
        battleWaveBadge.classList.add('hidden');
      }
    }

    if (battleBossTitle) {
      if (isPrologue) {
        battleBossTitle.innerText = monsters[0].name;
      } else if (tier === 'boss') {
        battleBossTitle.innerText = `${monsters[0].tierName || '妖王'}·${monsters[0].name}`;
      } else if (tier === 'elite') {
        battleBossTitle.innerText = `精英大妖群 (共${totalMonsters}头)`;
      } else {
        battleBossTitle.innerText = `凶兽群围攻 (共${totalMonsters}头)`;
      }
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
          <div class="monster-defeated-badge hidden" id="monster-defeated-${idx}">💀 伏诛</div>
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

    if (btnBattleAutoToggle) {
      btnBattleAutoToggle.onclick = () => {
        isBattleAuto = !isBattleAuto;
        btnBattleAutoToggle.innerText = isBattleAuto ? '自动: 开启' : '回合: 手动';
        btnBattleAutoToggle.classList.toggle('active', isBattleAuto);
        if (isBattleAuto && !battleStepTimer && stepIndex < timeline.length) {
          executeNextStep();
        }
      };
    }

    if (btnBattleAttack) {
      btnBattleAttack.innerText = (isPrologue || gameManager.player.isMortal)
        ? '🔪 柴刀劈砍'
        : '⚔️ 御剑攻击';
      btnBattleAttack.onclick = () => {
        if (!isBattleAuto) {
          if (stepIndex < timeline.length) {
            executeNextStep();
          } else if (session && !session.isOver) {
            const res = session.executeRound('attack');
            timeline.splice(stepIndex);
            timeline.push(...res.roundEvents);
            executeNextStep();
          }
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
        battleStepTimer = setTimeout(() => {
          modalBattleArena.classList.add('hidden');
          if (battleArenaEl) {
            battleArenaEl.classList.remove('ambient-flash', 'ambient-focus', 'ambient-enrage');
          }
          if (battleResult.isPrologueBattle || (battleResult.boss && battleResult.boss.id === 'prologue_boar')) {
            // 序章首战圆满大捷：正式推进至步骤 2 (恶兽已斩，待解封天机盘)
            gameManager.prologueStep = 2;
            if (window.SlotsRPG.StorageService) {
              window.SlotsRPG.StorageService.saveGame(gameManager, true);
            }
            gameManager.emitStateChange();

            if (modalAwakening) modalAwakening.classList.remove('hidden');
            return;
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

      const ev = timeline[stepIndex++];

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
        if (window.SlotsRPG && window.SlotsRPG.BattleSoundEngine) {
          window.SlotsRPG.BattleSoundEngine.playImpact(true);
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

      if (isBattleAuto) {
        const nextEv = timeline[stepIndex];
        const isRoundTransition = nextEv && (nextEv.round !== ev.round);

        let delay;
        if (isRoundTransition) {
          // 需求3: 调整战斗的节奏，每回合之间增加一定时间的间隔，比如0.5秒
          delay = isBattleFastMode ? 260 : 500;
          if (battleRoundBadge) {
            battleRoundBadge.classList.remove('pulse');
            void battleRoundBadge.offsetWidth;
            battleRoundBadge.classList.add('pulse');
          }
        } else if (ev.type === 'monster_defeated') {
          // 妖兽伏诛特写与死亡反馈停留
          delay = isBattleFastMode ? 180 : 320;
        } else {
          // 回合内双方出手交锋间隔，节奏分明有呼吸感
          delay = isPrologue ? (isBattleFastMode ? 260 : 420) : (isBattleFastMode ? 140 : 280);
        }

        battleStepTimer = setTimeout(executeNextStep, delay);
      } else {
        battleStepTimer = null;
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
    if (!modalBattleVictory) return;
    activeBattleResult = battleResult;
    const boss = (battleResult.encounter && battleResult.encounter.monsters && battleResult.encounter.monsters[0]) || battleResult.boss;
    const rewards = battleResult.rewards || (battleResult.boss ? battleResult.boss.rewards : {}) || {};
    const mult = (battleResult.encounter && battleResult.encounter.betMultiplier) || battleResult.betMultiplier || (activeBattleResult && activeBattleResult.betMultiplier) || gameManager.betMultiplier || 1;

    if (victorySubtitle) {
      const isMulti = battleResult.encounter && battleResult.encounter.monsters && battleResult.encounter.monsters.length > 1;
      const bossName = boss ? boss.name : '妖兽';
      const multText = mult > 1 ? `（${mult}倍机缘加持）` : '';
      victorySubtitle.innerText = isMulti
        ? `群妖溃败诛灭，天道甘霖倾泻！${multText}`
        : `${bossName}诛灭，天道甘霖倾泻！${multText}`;
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
      const isBoss = battleResult.encounter ? (battleResult.encounter.tier === 'boss') : (battleResult.boss && battleResult.boss.id === 'boss_1');
      if (isBoss) {
        victorySystemComment.innerText = '【系统速报】守关妖王已伏诛！天道机缘大丰收，宗门试炼功德圆满！';
      } else {
        const stageIdx = (gameManager.trialProgress && gameManager.trialProgress.currentStageIndex) || 1;
        victorySystemComment.innerText = `【系统贺报】宿主大展神威，成功荡平第 ${stageIdx} 关强敌！掉落丰厚机缘与极品战利品！`;
      }
    }

    modalBattleVictory.classList.remove('hidden');

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
      defeatSystemComment.innerText = '【系统复盘】胜败乃修仙常事！妖兽势大，建议先回乾坤袋【一键升阶】打造高品装备，战力达标后再来荡平此獠！';
    }

    modalBattleDefeat.classList.remove('hidden');

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
    if (battleResult && battleResult.canRevive) {
      const modalRevive = document.getElementById('modal-revive-prompt');
      const reviveCountText = document.getElementById('revive-remaining-count');
      const adService = window.SlotsRPG && window.SlotsRPG.AdService;
      if (modalRevive) {
        if (reviveCountText && adService) {
          reviveCountText.innerText = adService.getRemainingQuota('revive');
        }
        modalRevive.classList.remove('hidden');

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

  if (btnVictoryClaim) {
    btnVictoryClaim.addEventListener('click', () => {
      clearVictoryAutoCloseTimer();
      if (!activeBattleResult) return;
      const curBattle = activeBattleResult;
      activeBattleResult = null;

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
            pendingNotificationCount++;
            updateNotificationBadge();
          }
        );
      }

      // 3. 执行真正的纳宝入囊入库
      const summary = gameManager.claimBattleRewards(curBattle);

      // 4. 若此前处于自动推演状态，战斗结束后无缝切回天机盘并继续维持旋转
      if (gameManager.wasAutoSpinningBeforeBattle) {
        switchTab('slots');
        gameManager.resumeAutoSpinAfterBattle();
      } else if (summary && summary.breakthroughInfo) {
        // 若达成大境界突破且非自动旋转，等待掉落动画飞抵后自动切换至角色修真面板展示全新境界与扩容背包
        setTimeout(() => {
          tabCharacter.click();
        }, 550);
      } else if (curBattle && curBattle.isPrologueBattle) {
        setTimeout(() => {
          switchTab('character');
        }, 550);
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
    if (battleCountdownTimer) {
      clearInterval(battleCountdownTimer);
      battleCountdownTimer = null;
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

  // 14. 洞天灵脉业务与交互绑定
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

  // 14. 机缘耗尽救济弹窗管理 (PRD 规范: 当今日次数为 0 时隐藏“纳灵”按钮)
  function updateReliefModalUI(remainingRelief) {
    const rem = typeof remainingRelief === 'number'
      ? remainingRelief
      : (gameManager ? gameManager.freeReliefCount : 0);
    const reliefDesc = document.getElementById('relief-desc');

    if (rem > 0) {
      if (reliefCount) reliefCount.innerText = rem;
      if (reliefDesc) {
        reliefDesc.innerHTML = `
          当前机缘不足以驱动阵盘！<br />
          作弊器感应天地灵涌，可引渡游离灵气补充。<br />
          （今日剩余神念灌顶: <b id="relief-count" style="color:#ffd700;">${rem}</b> 次）
        `;
      }
      if (btnClaimRelief) {
        btnClaimRelief.classList.remove('hidden');
        btnClaimRelief.style.display = '';
      }
      if (btnMeditateRelief) {
        btnMeditateRelief.classList.add('hidden');
        btnMeditateRelief.style.display = 'none';
      }
    } else {
      // 核心需求：当每天的次数为0的时候，不应该显示“纳灵 (+50机缘)”
      if (btnClaimRelief) {
        btnClaimRelief.classList.add('hidden');
        btnClaimRelief.style.display = 'none';
      }
      if (reliefDesc) {
        reliefDesc.innerHTML = `
          当前机缘不足以驱动阵盘！<br />
          作弊器今日神念灌顶纳灵次数已用尽（0次）。<br />
          <span style="color:#ffd700;">道友可通过打坐吐纳、炼化背包真符（聚灵符/凝神符/破魔符）换取机缘，或明日再来！</span>
        `;
      }
      if (btnMeditateRelief) {
        btnMeditateRelief.classList.remove('hidden');
        btnMeditateRelief.style.display = '';
      }
    }
  }

  window.SlotsRPG.EventBus.on('ENERGY_DEPLETED', (data) => {
    if (window.SlotsRPG && window.SlotsRPG.StoryManager) {
      window.SlotsRPG.StoryManager.showSystemTip('energy_depleted');
    }
    if (modalRelief) {
      updateReliefModalUI(data.remainingRelief);
      modalRelief.classList.remove('hidden');
    }
  });

// 15. 快速消耗档位管理已下线，统一采用固定 25 灵机与连抽次数选择器

  // 16. 核心推演交互绑定：【引龙吐宝】改为进度蓄满 (10/10) 才能点击触发免费大爆
  let spinBufferPending = false;

  btnSpin.addEventListener('click', () => {
    const hasJoinedSect = !!(gameManager.player && gameManager.player.currentSect && !gameManager.player.isMortal);
    if (hasJoinedSect) {
      const prologueSpinGuide = document.getElementById('prologue-spin-guide');
      if (prologueSpinGuide) {
        prologueSpinGuide.classList.add('hidden');
      }
    }
    btnSpin.classList.remove('pulse-anim');

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

  // 初始化已保存的连抽次数设置
  let currentAutoCount = 50;
  const savedCount = localStorage.getItem('slots_rpg_auto_count');
  if (savedCount) {
    currentAutoCount = savedCount === 'Infinity' ? Infinity : parseInt(savedCount, 10);
    if (autoCountLabel) {
      autoCountLabel.innerText = currentAutoCount === Infinity ? '无限' : `${currentAutoCount}次`;
    }
    countOptBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.count === savedCount);
    });
    const autoBtnTitle = document.getElementById('auto-btn-title');
    if (autoBtnTitle && !gameManager.isAutoSpinning) {
      autoBtnTitle.innerText = currentAutoCount === 1 ? '单次推演' : '开始推演';
    }
  }
  if (gameManager) gameManager.autoSpinTargetCount = currentAutoCount;

  if (btnAutoCountToggle && autoCountPopover) {
    btnAutoCountToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      autoCountPopover.classList.toggle('hidden');
    });

    countOptBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const countVal = btn.dataset.count;
        currentAutoCount = countVal === 'Infinity' ? Infinity : parseInt(countVal, 10);
        if (gameManager) gameManager.autoSpinTargetCount = currentAutoCount;
        localStorage.setItem('slots_rpg_auto_count', countVal);

        countOptBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (autoCountLabel) {
          autoCountLabel.innerText = countVal === 'Infinity' ? '无限' : `${currentAutoCount}次`;
        }
        const autoBtnTitle = document.getElementById('auto-btn-title');
        if (autoBtnTitle && !gameManager.isAutoSpinning) {
          autoBtnTitle.innerText = currentAutoCount === 1 ? '单次推演' : '开始推演';
        }
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
    if (gameManager.isAutoSpinning) {
      gameManager.stopAutoSpin();
      return;
    }
    if (currentAutoCount === 1) {
      // 单次推演：防连点拦截
      if (gameManager.renderer && gameManager.renderer.isSpinning) return;
      gameManager.executeSpin();
    } else {
      // 连抽 / 自动推演
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

  // ==========================================
  // 16.1 神龙引宝 · 左右双宝匣与即时换装交互绑定
  // ==========================================
  const dragonGearCompareBar = document.getElementById('dragon-gear-compare-bar');
  const compareCurrentDesc = document.getElementById('compare-current-desc');
  const compareNewDesc = document.getElementById('compare-new-desc');
  const comparePowerDiff = document.getElementById('compare-power-diff');
  const btnGearEquip = document.getElementById('btn-gear-equip');
  const btnGearSmelt = document.getElementById('btn-gear-smelt');

  const dragonBattlePrompt = document.getElementById('dragon-battle-prompt');
  const battlePromptMonsterName = document.getElementById('battle-prompt-monster-name');
  const btnDragonEngageBattle = document.getElementById('btn-dragon-engage-battle');
  const btnBattleLabel = document.getElementById('btn-battle-label');
  let battleCountdownTimer = null;

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

    if (battleCountdownTimer) {
      clearInterval(battleCountdownTimer);
      battleCountdownTimer = null;
    }

    if (isAutoSpinning) {
      let secondsLeft = 3;
      if (trialBtnText) trialBtnText.innerText = `拔剑迎战 (${secondsLeft}s)`;
      if (btnBattleLabel) btnBattleLabel.innerText = `拔剑迎战 (${secondsLeft}s)`;
      battleCountdownTimer = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
          clearInterval(battleCountdownTimer);
          battleCountdownTimer = null;
          if (dragonBattlePrompt) dragonBattlePrompt.classList.add('hidden');
          if (gameManager && gameManager.executePendingBattle) {
            gameManager.executePendingBattle();
          }
        } else {
          if (trialBtnText) trialBtnText.innerText = `拔剑迎战 (${secondsLeft}s)`;
          if (btnBattleLabel) btnBattleLabel.innerText = `拔剑迎战 (${secondsLeft}s)`;
        }
      }, 1000);
    } else {
      if (trialBtnText) trialBtnText.innerText = `拔剑迎战`;
      if (btnBattleLabel) btnBattleLabel.innerText = `拔剑迎战`;
    }
  });

  if (btnDragonEngageBattle) {
    btnDragonEngageBattle.addEventListener('click', () => {
      if (battleCountdownTimer) {
        clearInterval(battleCountdownTimer);
        battleCountdownTimer = null;
      }
      if (dragonBattlePrompt) dragonBattlePrompt.classList.add('hidden');
      if (gameManager && gameManager.executePendingBattle) {
        gameManager.executePendingBattle();
      }
    });
  }

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
      renderer.addFloatingText('🔥【真龙狂暴】降世！极速连喷 10 次！', '#ffd700');
    }
    const rageTitle = document.getElementById('dragon-rage-title');
    if (rageTitle) rageTitle.innerText = '🔥【真龙狂暴】爆发中！免费连喷！';
  });

  // 17. 序章凡人剧情与叩问仙门交互绑定
  if (btnPrologueBattle) {
    btnPrologueBattle.addEventListener('click', () => {
      if (gameManager.isAutoSpinning) {
        gameManager.stopAutoSpin();
      }
      // 关闭可能尚未关闭的开局背景剧情气泡，彻底杜绝遮挡战场
      if (storyManager && storyManager.activeStory && storyManager.activeStory.isOpen) {
        storyManager.closeStoryDialog(true);
      }
      const modalStoryDialog = document.getElementById('modal-story-dialog');
      if (modalStoryDialog) {
        modalStoryDialog.classList.add('hidden');
      }

      const battleResult = gameManager.startPrologueBattle();
      battleResult.isPrologueBattle = true;

      // 拔刀斩凶：直接切入全屏沉浸伏妖战场！
      playBattleSequence(battleResult);
    });
  }

  if (btnAwakeningAccept) {
    btnAwakeningAccept.addEventListener('click', () => {
      gameManager.triggerArtifactAwakening();
      if (modalAwakening) modalAwakening.classList.add('hidden');
      switchTab('slots');

      const prologueSpinGuide = document.getElementById('prologue-spin-guide');
      if (prologueSpinGuide) {
        prologueSpinGuide.classList.remove('hidden');
      }

      // 触发天机初转引导与作弊器嘲讽天道剧情对白
      if (storyManager) {
        storyManager.triggerChapter('prologue_first_spin');
      } else if (renderer) {
        renderer.addFloatingText('天机盘觉醒！已获 100 灵机，请点击推演天机！', '#ffd700');
      }

      if (btnSpin) {
        btnSpin.classList.add('pulse-anim');
      }
    });
  }

  // 核心时序协调器：叩问仙门法牒 4 阶段连贯时序
  // 严格执行用户指定顺序：
  // 阶段 1: 播放普通奖励效果 (转轮停止定格，连线动画高亮，播放 winLine 音效)
  // 阶段 2: 奖励数量通知与奖励掉落动画 (宣告栏展示，物品飞落，播放 rewardDrop 音效)
  // 阶段 3: 门派门票中奖符号展示效果 (Canvas 绘制真传光环与升腾粒子，播放持续 2000ms 的道钟古琴音效)
  // 阶段 4: 加入门派弹窗 (在所有其它奖励弹窗完全关闭后，平滑唤起叩问仙门弹窗)
  function isAnyOtherModalOpen(excludeId) {
    const modals = document.querySelectorAll('.modal-overlay');
    for (const m of modals) {
      if (m.id === excludeId) continue;
      if (!m.classList.contains('hidden')) return true;
    }
    return false;
  }

  function waitOtherModalsClosedThen(action) {
    const check = () => {
      if (isAnyOtherModalOpen('modal-sect-induction')) {
        setTimeout(check, 250);
      } else {
        action();
      }
    };
    check();
  }

  window.SlotsRPG.EventBus.on('TRIGGER_SECT_INDUCTION_SEQUENCE', (data) => {
    isSectInductionSequenceRunning = true;
    if (btnSpin) btnSpin.classList.add('disabled');

    const { spinData, ticketCoords, options } = data;

    // Phase 1 (0ms ~ 1000ms): 停轮时已展示连线动画并播放 winLine 音效
    // Phase 2 (1000ms ~ 2200ms): 宣告栏展示普通奖励与 DropAnimator 掉落灵石 (REWARD_DROP)
    // 延迟 1200ms 进入 Phase 3，使玩家能完整看清普通奖励与掉落动画
    setTimeout(() => {
      // Phase 3: 门派门票中奖符号专属高光展示 (严格维持 2000ms 一致)
      if (renderer && renderer.startSectTicketShowcase) {
        renderer.startSectTicketShowcase(ticketCoords);
      }
      if (window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('SECT_TICKET_REVEAL', 2000);
      }

      if (elAnnouncement && elAnnouncementText) {
        elAnnouncementText.innerHTML = `✨ <b>仙门感应 · 宗门法牒现世！</b><br/><span style="font-size:12px; color:#34e89e;">正统与旁门仙使携令降临...</span>`;
        elAnnouncement.classList.remove('show', 'play-anim');
        void elAnnouncement.offsetWidth;
        elAnnouncement.classList.add('show', 'play-anim');
      }

      // 持续展示 2000ms 后平滑收束高光
      setTimeout(() => {
        if (renderer && renderer.stopSectTicketShowcase) {
          renderer.stopSectTicketShowcase();
        }

        // Phase 4: 等待其它奖励弹窗（如突破升级、剧情等）关闭后，正式展示加入门派弹窗
        waitOtherModalsClosedThen(() => {
          isSectInductionSequenceRunning = false;
          window.SlotsRPG.EventBus.emit('SHOW_SECT_INDUCTION', { options });
        });
      }, 2000);
    }, 1200);
  });

  // 监听叩问仙门自选引荐事件 (Phase 4)
  window.SlotsRPG.EventBus.on('SHOW_SECT_INDUCTION', (data) => {
    if (!modalSectInduction || !inductionSectsContainer) return;
    if (btnSpin) btnSpin.classList.add('disabled');
    inductionSectsContainer.innerHTML = '';

    const options = data.options || gameManager.getRandomSectOptions();
    const subTitleEl = document.getElementById('induction-subtitle');
    if (subTitleEl) {
      if (options.length > 1) {
        subTitleEl.innerText = `散修初探斩妖引动天地异象，正宗与商门巡察使齐聚递来引荐法牒，请道友执令拜入：`;
      } else {
        subTitleEl.innerText = `天机运转引动金气冲霄，五行正宗之首【${options[0].name}】递来真传引荐法牒，请道友执令入宗：`;
      }
    }

    options.forEach(sect => {
      const card = document.createElement('div');
      card.className = 'induction-sect-card';

      const isOrthodox = sect.type === 'true' || sect.type === 'orthodox';
      const typeBadge = isOrthodox ? '正统玄门' : '外道旁门';
      const typeStyle = isOrthodox
        ? 'background: rgba(56, 239, 125, 0.2); color: #34e89e; border: 1px solid #34e89e;'
        : 'background: rgba(251, 146, 60, 0.2); color: #fb923c; border: 1px solid #fb923c;';

      const sectColor = sect.themeColor || sect.color || '#ffd700';
      const sectDesc = sect.tokenDesc || sect.desc || sect.mapDesc || '天地大道，造化独钟。';

      const skill1 = (sect.skills && sect.skills[0]) || sect.mainSkill || null;
      const skill2 = (sect.skills && sect.skills[1]) || sect.passiveTrait || null;

      const skill1Name = skill1 ? skill1.name : '传承心法';
      const skill1Desc = skill1 ? skill1.desc : '运转宗门秘术，参悟造化玄机。';
      const skill2Name = skill2 ? skill2.name : '';
      const skill2Desc = skill2 ? skill2.desc : '';

      card.innerHTML = `
        <div class="induction-sect-header">
          <span class="induction-sect-name" style="color: ${sectColor};">${sect.name}</span>
          <span class="induction-sect-badge" style="${typeStyle}">${typeBadge}</span>
        </div>
        <div class="induction-sect-desc">${sectDesc}</div>
        <div class="induction-sect-skills">
          <div><b>心法【${skill1Name}】</b>: ${skill1Desc}</div>
          ${skill2 ? `<div style="margin-top:4px; color:#93c5fd;"><b>绝技【${skill2Name}】</b>: ${skill2Desc}</div>` : ''}
        </div>
        <button class="btn-join-sect" data-sect-id="${sect.id}">叩问仙门 · 拜入【${sect.name}】</button>
      `;

      const btnJoin = card.querySelector('.btn-join-sect');
      if (btnJoin) {
        btnJoin.addEventListener('click', () => {
          if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
            window.SlotsRPG.SoundEffects.play('JOIN_SECT');
          }
          gameManager.completeSectInduction(sect.id);
          modalSectInduction.classList.add('hidden');
          if (btnSpin) btnSpin.classList.remove('disabled');
          showGameNotice(
            `踏入仙途 · 拜入【${sect.name}】`,
            `<p style="line-height:1.6; color:#e2e8f0;">
              恭喜道友叩问仙门成功，正式拜入<b>【${sect.name}】</b>门下！<br/>
              换下山野散修麻衣，赐下道门法袍与法器灵宝，洗去凡胎，晋升为<b>【练气一层】</b>正式修仙者！<br/>
              宗门心法<b>【${skill1Name}】</b>已铭刻神魂，天地广阔，任道友翱翔！
            </p>`,
            '☯ 仙门初入'
          );
          switchTab('character');
        });
      }

      inductionSectsContainer.appendChild(card);
    });

    modalSectInduction.classList.remove('hidden');
    if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
      window.SlotsRPG.SoundEffects.play('MODAL_OPEN');
    }
  });

  // 序章引导状态初始化与断点全场景恢复
  if (!gameManager.isPrologueComplete) {
    if (gameManager.prologueStep === 0) {
      switchTab('character', true);
      if (prologueSection) prologueSection.classList.remove('hidden');
      // 凡人初入开局：自动唤起背景故事对话 (林凡身世与后山遭遇)
      setTimeout(() => {
        if (storyManager) {
          storyManager.triggerChapter('prologue_mortal_intro');
        }
      }, 400);
    } else if (gameManager.prologueStep === 1) {
      switchTab('character', true);
      if (prologueSection) prologueSection.classList.remove('hidden');
    } else if (gameManager.prologueStep === 2) {
      switchTab('character', true);
      if (prologueSection) {
        prologueSection.classList.remove('hidden');
        const pIcon = document.getElementById('prologue-icon');
        const pTitle = document.getElementById('prologue-title');
        const pDesc = document.getElementById('prologue-desc');
        const pBtn = document.getElementById('btn-prologue-battle');
        if (pIcon) pIcon.innerText = '✨';
        if (pTitle) pTitle.innerText = '恶兽已斩 · 获神秘残盘';
        if (pDesc) pDesc.innerText = '黑鬣猪轰然倒地，从其腹中剖出一块青铜古盘！请点击下方乾坤袋中的【造化天机盘】！';
        if (pBtn) pBtn.classList.add('hidden');
      }
    } else if (gameManager.prologueStep === 3) {
      switchTab('slots', true);
      const spinGuide = document.getElementById('prologue-spin-guide');
      if (spinGuide) spinGuide.classList.remove('hidden');
      if (btnSpin) btnSpin.classList.add('pulse-anim');
    }
  } else {
    // 已完成序章：读取上次离开时的记忆 Tab，若无记录则默认进入【角色修真】(保障刷新后界面与底部导航栏角色修真严格一致)
    let savedTab = 'character';
    try {
      const persisted = localStorage.getItem('SLOTS_RPG_ACTIVE_TAB');
      if (persisted && (persisted === 'slots' || persisted === 'character' || persisted === 'cave')) {
        savedTab = persisted;
      }
    } catch (e) {}
    switchTab(savedTab, true);
  }

  // 18. 升仙天碑与九转轮回业务交互 (五行纯图案圆盘 - 取消五角星线条，未解锁灰色遮罩禁点击，已解锁聊天泡泡展示心法收益)
  function renderAscensionStele() {
    if (!steleShardsContainer || !gameManager.ascensionManager) return;
    steleShardsContainer.innerHTML = '';

    const shards = gameManager.ascensionManager.getShardsStatus();
    const isReady = gameManager.ascensionManager.isAscensionReady();
    const collectedCount = gameManager.ascensionManager.collectedCount;

    const shardMap = {};
    shards.forEach(s => { shardMap[s.id] = s; });

    // 五行置于五角星五角：顶木 -> 右火 -> 右下土 -> 左下金 -> 左水
    const WUXING_LAYOUT = [
      { id: 'shard_wood', key: 'wood', element: '木', left: '50.0%', top: '12.1%' },
      { id: 'shard_fire', key: 'fire', element: '火', left: '79.7%', top: '35.9%' },
      { id: 'shard_earth', key: 'earth', element: '土', left: '68.4%', top: '74.4%' },
      { id: 'shard_metal', key: 'metal', element: '金', left: '31.6%', top: '74.4%' },
      { id: 'shard_water', key: 'water', element: '水', left: '20.3%', top: '35.9%' }
    ];

    const board = document.createElement('div');
    board.className = `wuxing-board ${isReady ? 'all-collected' : ''}`;

    // 1. 背景 SVG：外层微光圆环与虚线圈（完全取消五角星线条）
    board.innerHTML = `
      <svg class="wuxing-star-svg" viewBox="0 0 320 270">
        <!-- 外层微光圆环与虚线圈 (纯净阵盘，无五角星线条) -->
        <circle class="wuxing-circle-ring" cx="160" cy="135" r="96" />
        <circle class="wuxing-circle-ring-inner" cx="160" cy="135" r="90" stroke-dasharray="3,4" opacity="0.35" />
      </svg>

      <!-- 阵眼中心太极印记 -->
      <div class="wuxing-center-core ${isReady ? 'core-ready' : ''}" id="wuxing-center-core" title="天碑混元太极阵眼">
        <div class="wuxing-center-taiji">☯</div>
        <div class="wuxing-center-num">${isReady ? '已圆满' : collectedCount + ' / 5'}</div>
      </div>
    `;

    // 2. 挂载 5 个五行纯图案圆盘节点 (无文字)
    let firstUnlockedLayout = null;

    WUXING_LAYOUT.forEach(layout => {
      const shard = shardMap[layout.id];
      if (!shard) return;

      const isCollected = !!shard.isCollected;
      if (isCollected && !firstUnlockedLayout) {
        firstUnlockedLayout = layout;
      }

      const nodeEl = document.createElement('div');
      nodeEl.className = `wuxing-corner-node node-${layout.key} ${isCollected ? 'unlocked' : 'locked'}`;
      nodeEl.setAttribute('data-shard-id', shard.id);
      nodeEl.style.left = layout.left;
      nodeEl.style.top = layout.top;

      if (isCollected) {
        // 已解锁：全彩高亮纯图案圆球，可点击
        nodeEl.innerHTML = `
          <div class="wuxing-orb">
            <img src="${shard.icon}" class="wuxing-orb-img" alt="${shard.shortName}" />
          </div>
        `;
        nodeEl.addEventListener('click', () => {
          showWuxingBubble(shard, layout.left);
        });
      } else {
        // 未解锁：灰色遮罩，带锁标，禁止点击 (pointer-events: none)
        nodeEl.innerHTML = `
          <div class="wuxing-orb">
            <img src="${shard.icon}" class="wuxing-orb-img" alt="未解锁" />
            <div class="wuxing-lock-badge">🔒</div>
          </div>
        `;
      }

      board.appendChild(nodeEl);
    });

    steleShardsContainer.appendChild(board);

    // 3. 聊天泡泡展示心法收益函数
    function showWuxingBubble(shard, tailLeft) {
      if (!steleBubbleBox || !steleBubbleContent) return;

      // 选中光晕高亮当前节点
      board.querySelectorAll('.wuxing-corner-node').forEach(node => {
        if (node.getAttribute('data-shard-id') === shard.id) {
          node.classList.add('selected');
        } else {
          node.classList.remove('selected');
        }
      });

      // 调整气泡尖角指向对应五行节点 X 轴坐标
      if (steleBubbleTail) {
        steleBubbleTail.style.left = tailLeft;
      }

      // 获取对应正统宗门的心法与被动配置
      const sectConfig = window.SlotsRPG && window.SlotsRPG.SectConfig;
      const sect = (sectConfig && sectConfig.SECTS && sectConfig.SECTS[shard.sectId]) || {};
      const skills = sect.skills || [];
      const skill1 = skills[0] || {};
      const skill2 = skills[1] || {};

      let statBonusText = '';
      if (sect.statModifiers) {
        const parts = [];
        if (sect.statModifiers.atkRate) parts.push(`攻击 +${Math.round(sect.statModifiers.atkRate * 100)}%`);
        if (sect.statModifiers.hpRate) parts.push(`生命上限 +${Math.round(sect.statModifiers.hpRate * 100)}%`);
        if (sect.statModifiers.defRate) parts.push(`防御 +${Math.round(sect.statModifiers.defRate * 100)}%`);
        if (sect.statModifiers.critRateBonus) parts.push(`暴击率 +${Math.round(sect.statModifiers.critRateBonus * 100)}%`);
        statBonusText = parts.join('、');
      }

      const archive = (gameManager.ascensionManager.meta.sectArchives && gameManager.ascensionManager.meta.sectArchives[shard.sectId]) || null;

      steleBubbleContent.innerHTML = `
        <div class="bubble-title-bar">
          <span class="bubble-sect-title">🏛️【${shard.sectName} · ${shard.name}】</span>
          <span class="bubble-close-btn" id="btn-close-bubble" title="关闭气泡">✕</span>
        </div>
        <div class="bubble-buff-line">✨ 飞升真意: <b style="color:${shard.color};">${shard.buffDesc}</b> (跨世神魂永存)</div>
        <div class="bubble-skills-list">
          ${statBonusText ? `<div class="bubble-skill-item"><b>📜 门派心法:</b> ${statBonusText}</div>` : ''}
          ${skill1.name ? `<div class="bubble-skill-item"><b>🌿 ${skill1.name}:</b> ${skill1.desc}</div>` : ''}
          ${skill2.name ? `<div class="bubble-skill-item"><b>🛡️ ${skill2.name}:</b> ${skill2.desc}</div>` : ''}
        </div>
        <button class="btn-view-sect-pantheon" id="btn-view-sect-pantheon" data-sect-id="${shard.sectId}">
          ${archive ? `🏛️ 启视当世真传法相 · 战力 ${archive.combatPower} ➔` : '🔒 当世法相待通关大捷归位'}
        </button>
      `;

      steleBubbleBox.classList.remove('hidden');
      if (steleClueHint) steleClueHint.classList.add('hidden');

      const btnViewPantheon = document.getElementById('btn-view-sect-pantheon');
      if (btnViewPantheon) {
        btnViewPantheon.addEventListener('click', (e) => {
          e.stopPropagation();
          showSectPantheonModal(shard.sectId);
        });
      }

      const btnCloseBubble = document.getElementById('btn-close-bubble');
      if (btnCloseBubble) {
        btnCloseBubble.addEventListener('click', (e) => {
          e.stopPropagation();
          steleBubbleBox.classList.add('hidden');
          if (steleClueHint) steleClueHint.classList.remove('hidden');
          board.querySelectorAll('.wuxing-corner-node').forEach(node => node.classList.remove('selected'));
        });
      }
    }

    // 默认行为：若有已解锁真卷，展示第一个已解锁的心法气泡；若全未解锁，显示全局引导提示
    if (firstUnlockedLayout) {
      const defaultShard = shardMap[firstUnlockedLayout.id];
      showWuxingBubble(defaultShard, firstUnlockedLayout.left);
    } else {
      if (steleBubbleBox) steleBubbleBox.classList.add('hidden');
      if (steleClueHint) steleClueHint.classList.remove('hidden');
    }

    // 4. 渲染上古隐世暗阁 · 客卿仙印
    const steleVaultCount = document.getElementById('stele-vault-count');
    const steleMarksContainer = document.getElementById('stele-marks-container');
    if (steleMarksContainer) {
      steleMarksContainer.innerHTML = '';
      const hiddenMarks = (gameManager.ascensionManager && gameManager.ascensionManager.meta && gameManager.ascensionManager.meta.hiddenMarks) || {};
      const hiddenDefs = [
        { id: 'wantong', name: '万通·富甲诸天印', icon: 'assets/sects/tokens/token_merchant.png', desc: '推演返还+攻击' },
        { id: 'jiusi', name: '九死·万劫不灭印', icon: 'assets/sects/tokens/token_blood.png', desc: '伤害吸血+暴击' },
        { id: 'qintian', name: '钦天·观星逆命印', icon: 'assets/sects/tokens/token_qintian.png', desc: '时光免死+防御' }
      ];

      const unlockedCount = Object.keys(hiddenMarks).length;
      if (steleVaultCount) {
        steleVaultCount.innerText = `${unlockedCount} / 3`;
        steleVaultCount.style.color = unlockedCount === 3 ? '#ffd700' : '#94a3b8';
      }

      hiddenDefs.forEach(hd => {
        const isUnlocked = !!hiddenMarks[hd.id];
        const card = document.createElement('div');
        card.className = `hidden-mark-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        card.title = isUnlocked ? `${hd.name}: ${hd.desc}` : '上古隐世秘境未启，极限绝境方可唤醒';
        card.innerHTML = `
          <img src="${hd.icon}" class="hidden-mark-icon" alt="${hd.name}" />
          <span class="hidden-mark-name">${isUnlocked ? hd.name : '🔒 秘境封印'}</span>
          <span class="hidden-mark-desc">${isUnlocked ? hd.desc : '绝境机缘'}</span>
        `;
        steleMarksContainer.appendChild(card);
      });
    }

    // 5. 更新天门封印状态
    if (steleGateStatus) {
      if (isReady) {
        steleGateStatus.innerText = '九天仙门大开 · 叩关飞升！';
        steleGateStatus.style.color = '#34e89e';
      } else {
        steleGateStatus.innerText = `仙门紧闭 (${collectedCount} / 5)`;
        steleGateStatus.style.color = '#f87171';
      }
    }

    // 5. 更新升仙与天碑兵解转世按钮状态
    const curSect = gameManager.player ? gameManager.player.currentSect : null;
    const isMastered = !!(curSect && gameManager.ascensionManager && gameManager.ascensionManager.meta.masteredSects.includes(curSect));
    const fullSet = gameManager.player ? gameManager.player.checkFullSetEquipped('Q4') : null;
    const isGraduated = !!(gameManager.hasDefeatedSectBoss && fullSet && fullSet.isGraduated);
    const ticket = gameManager.unlockedSectTicket;
    const canReincarnate = !!ticket || isGraduated || isMastered;

    if (isReady) {
      // 5卷全部集齐：白日飞升大圆满
      if (btnAscendHeaven) {
        btnAscendHeaven.classList.remove('hidden');
        btnAscendHeaven.innerText = '白日飞升';
        btnAscendHeaven.disabled = false;
        btnAscendHeaven.removeAttribute('disabled');
        btnAscendHeaven.classList.remove('disabled');
        btnAscendHeaven.classList.add('ready');
      }
      if (btnSteleReincarnate) {
        btnSteleReincarnate.classList.add('hidden');
      }
    } else {
      // 未全部集齐：仅在通关当前门派后通过天碑入口兵解转世进入下一门派
      if (btnAscendHeaven) {
        btnAscendHeaven.classList.add('hidden');
      }
      if (btnSteleReincarnate) {
        btnSteleReincarnate.classList.remove('hidden');
        if (canReincarnate) {
          btnSteleReincarnate.disabled = false;
          btnSteleReincarnate.removeAttribute('disabled');
          btnSteleReincarnate.classList.remove('disabled');
          btnSteleReincarnate.classList.add('ready');
          if (ticket) {
            btnSteleReincarnate.innerText = `🧘 兵解转世 · 踏入【${ticket.sectName}】`;
            btnSteleReincarnate.title = `持【${ticket.tokenName}】转生，继承20%属性，装备转为专属神装！`;
          } else {
            btnSteleReincarnate.innerText = '🧘 宗门通关 · 兵解转世';
            btnSteleReincarnate.title = '当前宗门通关大捷，可兵解转生进入新仙门！';
          }
        } else {
          btnSteleReincarnate.disabled = true;
          btnSteleReincarnate.setAttribute('disabled', 'disabled');
          btnSteleReincarnate.classList.remove('ready');
          btnSteleReincarnate.classList.add('disabled');
          btnSteleReincarnate.innerText = '🔒 宗门未通关 (待妖王伏诛与神装圆满)';
          btnSteleReincarnate.title = '需斩灭当前宗门守关妖王且六槽神装圆满，方可引动天碑转世！';
        }
      }
    }
  }

  /**
   * 启视并唤起【宗门大能法相殿 (英灵殿)】弹窗
   * @param {string} sectId - 宗门ID
   */
  function showSectPantheonModal(sectId) {
    const modalPantheon = document.getElementById('modal-sect-pantheon');
    if (!modalPantheon || !gameManager.ascensionManager) return;

    const archives = gameManager.ascensionManager.meta.sectArchives || {};
    const archive = archives[sectId];

    const elementBadge = document.getElementById('pantheon-element-badge');
    const titleEl = document.getElementById('pantheon-title');
    const subtitleEl = document.getElementById('pantheon-subtitle');
    const statsEl = document.getElementById('pantheon-stats-summary');
    const equipsGrid = document.getElementById('pantheon-equips-grid');
    const sealText = document.getElementById('pantheon-seal-text');

    const sectConfig = window.SlotsRPG && window.SlotsRPG.SectConfig;
    const sectCfg = sectConfig ? sectConfig.getSect(sectId) : null;
    const sectName = sectCfg ? sectCfg.name : sectId;
    const element = sectCfg ? (sectCfg.elementName || sectCfg.element || '道') : '道';

    if (elementBadge) elementBadge.innerText = element;
    if (titleEl) titleEl.innerText = `【${sectName} · ${element}系至尊法相】`;

    if (!archive) {
      if (subtitleEl) subtitleEl.innerText = '此宗门法相尚未封存归位 (需通关大捷转世封神)';
      if (statsEl) {
        statsEl.innerHTML = `
          <div class="pantheon-stat-item" style="grid-column: span 3; color: #94a3b8; font-size: 11px;">
            ⚠️ 暂无当世装备归档记录，通关【${sectName}】并兵解转生时，系统将自动为此位法相铸造金身！
          </div>
        `;
      }
      if (equipsGrid) {
        equipsGrid.innerHTML = `
          <div class="pantheon-equip-slot"><span style="color:#64748b; font-size:10px;">武器</span><span style="color:#475569; font-size:9px;">待归位</span></div>
          <div class="pantheon-equip-slot"><span style="color:#64748b; font-size:10px;">衣服</span><span style="color:#475569; font-size:9px;">待归位</span></div>
          <div class="pantheon-equip-slot"><span style="color:#64748b; font-size:10px;">戒指</span><span style="color:#475569; font-size:9px;">待归位</span></div>
          <div class="pantheon-equip-slot"><span style="color:#64748b; font-size:10px;">帽子</span><span style="color:#475569; font-size:9px;">待归位</span></div>
          <div class="pantheon-equip-slot"><span style="color:#64748b; font-size:10px;">鞋子</span><span style="color:#475569; font-size:9px;">待归位</span></div>
          <div class="pantheon-equip-slot"><span style="color:#64748b; font-size:10px;">腰带</span><span style="color:#475569; font-size:9px;">待归位</span></div>
        `;
      }
      if (sealText) sealText.innerText = `五行之${element} · 待归位`;
    } else {
      if (subtitleEl) subtitleEl.innerText = `第 ${archive.completedAtSamsara || 1} 世功德圆满 · 飞升神格归位`;
      const stats = archive.stats || { hp: 100, atk: 20, def: 10 };
      if (statsEl) {
        statsEl.innerHTML = `
          <div class="pantheon-stat-item">
            <span class="pantheon-stat-label">⚔️ 封神战力</span>
            <span class="pantheon-stat-val" style="color:#ffd700;">${archive.combatPower || 0}</span>
          </div>
          <div class="pantheon-stat-item">
            <span class="pantheon-stat-label">❤️ 气血上限</span>
            <span class="pantheon-stat-val">${stats.hp || 0}</span>
          </div>
          <div class="pantheon-stat-item">
            <span class="pantheon-stat-label">🗡️ 终极攻击</span>
            <span class="pantheon-stat-val">${stats.atk || 0}</span>
          </div>
          <div class="pantheon-stat-item">
            <span class="pantheon-stat-label">🛡️ 磐石防御</span>
            <span class="pantheon-stat-val">${stats.def || 0}</span>
          </div>
        `;
      }

      if (equipsGrid) {
        equipsGrid.innerHTML = '';
        const parts = ['weapon', 'armor', 'ring', 'hat', 'boots', 'belt'];
        const partNames = { weapon: '武器', armor: '衣服', ring: '戒指', hat: '帽子', boots: '鞋子', belt: '腰带' };
        parts.forEach(p => {
          const item = archive.equipment ? archive.equipment[p] : null;
          const slotEl = document.createElement('div');
          slotEl.className = `pantheon-equip-slot ${item ? 'has-item' : ''}`;
          if (item) {
            slotEl.style.borderColor = item.qualityColor || '#ffd700';
            slotEl.innerHTML = `
              <img src="${item.icon || 'assets/symbols/SYM_06.png'}" class="pantheon-equip-icon" alt="${item.name}" />
              <span class="pantheon-equip-name" style="color:${item.qualityColor || '#ffd700'}">${item.name}</span>
            `;
          } else {
            slotEl.innerHTML = `
              <span style="color:#64748b; font-size:10px;">${partNames[p]}</span>
              <span style="color:#475569; font-size:9px;">未穿戴</span>
            `;
          }
          equipsGrid.appendChild(slotEl);
        });
      }

      if (sealText) sealText.innerText = `五行之${element} · 已归位`;
    }

    modalPantheon.classList.remove('hidden');

    const btnClosePantheon = document.getElementById('btn-close-pantheon');
    if (btnClosePantheon) {
      btnClosePantheon.onclick = () => {
        modalPantheon.classList.add('hidden');
      };
    }
  }

  if (btnOpenStele) {
    btnOpenStele.addEventListener('click', () => {
      renderAscensionStele();
      if (modalAscensionStele) modalAscensionStele.classList.remove('hidden');
    });
  }

  if (btnCloseStele) {
    btnCloseStele.addEventListener('click', () => {
      if (modalAscensionStele) modalAscensionStele.classList.add('hidden');
    });
  }

  // 19. 激励视频广告与瞬发符通用触发器 (PRD 9.1 & 9.2 节)
  function openRewardedAdModal(type, title, onReward) {
    const modalAd = document.getElementById('modal-rewarded-ad');
    const adSeconds = document.getElementById('ad-countdown-seconds');
    const adProgress = document.getElementById('ad-progress-fill');
    const adTitle = document.getElementById('ad-reward-title');
    const adTicketQty = document.getElementById('ad-ticket-qty');
    const btnUseTicket = document.getElementById('btn-ad-use-ticket');
    const btnAdCancel = document.getElementById('btn-ad-cancel');
    const adService = window.SlotsRPG && window.SlotsRPG.AdService;

    if (!modalAd || !adService) {
      if (onReward) onReward({ usedTicket: false });
      return;
    }

    if (adTitle) adTitle.innerText = title || '观摩天道演化';
    if (adTicketQty) adTicketQty.innerText = adService.skipTickets;
    if (btnUseTicket) {
      btnUseTicket.disabled = adService.skipTickets <= 0;
    }

    modalAd.classList.remove('hidden');

    let finished = false;
    const cleanup = () => {
      modalAd.classList.add('hidden');
    };

    btnUseTicket.onclick = () => {
      if (finished) return;
      const res = adService.claimViaTicket(type, () => {
        finished = true;
        cleanup();
        if (onReward) onReward({ usedTicket: true });
      });
      if (!res.success) {
        showFloatingNotice(res.reason);
      }
    };

    btnAdCancel.onclick = () => {
      if (finished) return;
      adService.cancelCurrentAd();
      cleanup();
    };

    adService.startRewardedAd(type, {
      onStart: (task) => {
        if (adSeconds) adSeconds.innerText = task.duration;
        if (adProgress) adProgress.style.width = '0%';
      },
      onProgress: (p) => {
        if (adSeconds) adSeconds.innerText = p.remaining;
        if (adProgress) adProgress.style.width = `${Math.floor(p.progress * 100)}%`;
      },
      onSuccess: (res) => {
        if (finished) return;
        finished = true;
        cleanup();
        if (onReward) onReward({ usedTicket: false });
      },
      onCancel: () => {
        cleanup();
      }
    });
  }

  // 20. 飞升天门大开与全屏渡劫过场 (PRD 4.3 & 11.2 节)
  if (btnAscendHeaven) {
    btnAscendHeaven.addEventListener('click', () => {
      if (modalAscensionStele) modalAscensionStele.classList.add('hidden');
      const modalCutscene = document.getElementById('modal-ascension-cutscene');
      if (modalCutscene) {
        modalCutscene.classList.remove('hidden');
        const video = document.getElementById('ascension-video');
        if (video && video.canPlayType && video.canPlayType('video/mp4')) {
          video.classList.remove('hidden');
          video.play().catch(() => {
            video.classList.add('hidden');
          });
        }
      } else {
        gameManager.ascendToSpiritRealm();
      }
    });
  }

  const btnAscendEnter = document.getElementById('btn-ascension-enter-realm');
  if (btnAscendEnter) {
    btnAscendEnter.addEventListener('click', () => {
      const modalCutscene = document.getElementById('modal-ascension-cutscene');
      if (modalCutscene) modalCutscene.classList.add('hidden');
      const res = gameManager.ascendToSpiritRealm();
      switchTab('slots');
      showGameNotice(
        '白日飞升 · 位列仙班',
        `<p style="line-height:1.6; color:#e2e8f0;">
          五卷归一，仙门大开！道友历经九世磨砺，终成正果！<br/>
          <b>大世界跃迁:</b> 登临 <span style="color:#ffd700;">【灵界 · 飘渺仙域】</span>！<br/>
          <b>本命神器升华:</b> 【太上混元仙牒】永久全属性提升 <span style="color:#34e89e;">+25%</span>！<br/>
          <b>境界大晋阶:</b> 直接晋升为 <b style="color:#c084fc;">化神境初期</b>，开放化神、炼虚、合体、大乘境界！<br/>
          <b>洞天灵脉蜕变:</b> 凡间洞府进阶为 <b style="color:#38bdf8;">【鸿蒙浮岛 · 星天仙阙】</b>！<br/>
          <b>滚轮仙气化:</b> 全面升级为极品仙晶与洪荒通天灵宝！
        </p>`,
        '✨ 白日飞升'
      );
    });
  }

  // 21. 洞天灵气浮泡点击收菜 (PRD 10.4 节)
  const elCaveBubble = document.getElementById('cave-bubble-collector');
  if (elCaveBubble) {
    elCaveBubble.addEventListener('click', () => {
      gameManager.collectCaveBubble();
    });
  }

  // 22. 打坐吐纳兜底 (PRD 6.2 节)
  const elBtnMeditate = document.getElementById('btn-meditate');
  if (elBtnMeditate) {
    elBtnMeditate.addEventListener('click', () => {
      showFloatingNotice('🧘 沉心闭目，打坐吐纳天地灵机...', '#34e89e');
      gameManager.meditateForEnergy(res => {
        showFloatingNotice(`✨ 吐纳圆满，恢复 +${res.energyRestored} 机缘！`, '#ffd700');
      });
    });
  }

  if (btnSteleReincarnate) {
    btnSteleReincarnate.addEventListener('click', () => {
      const curSect = gameManager.player ? gameManager.player.currentSect : null;
      const isMastered = !!(curSect && gameManager.ascensionManager && gameManager.ascensionManager.meta.masteredSects.includes(curSect));
      const fullSet = gameManager.player ? gameManager.player.checkFullSetEquipped('Q4') : null;
      const isGraduated = !!(gameManager.hasDefeatedSectBoss && fullSet && fullSet.isGraduated);
      const ticket = gameManager.unlockedSectTicket;
      const canReincarnate = !!ticket || isGraduated || isMastered;

      if (!canReincarnate) {
        showGameNotice(
          '宗门未通关',
          '道友当前宗门尚未通关！<br/>需<b>斩灭本门守关妖王</b>且集齐<b>六槽圆满神装</b>，方可引动天碑阵眼兵解转世！<br/>请继续推演天机完成试炼！',
          '⚠️ 尚未通关'
        );
        return;
      }

      // 关闭升仙天碑弹窗
      if (modalAscensionStele) {
        modalAscensionStele.classList.add('hidden');
      }

      const curTotal = gameManager.player ? gameManager.player.getTotalStats() : { hp: 100, atk: 20, def: 10 };
      const hp = Math.floor(curTotal.hp * 0.20);
      const atk = Math.floor(curTotal.atk * 0.20);
      const def = Math.floor(curTotal.def * 0.20);

      if (modalSamsaraConfirmPreview) {
        if (ticket) {
          if (samsaraPreviewTitle) samsaraPreviewTitle.innerText = `兵解转世 · 踏入【${ticket.sectName}】`;
          if (samsaraPreviewSubtitle) samsaraPreviewSubtitle.innerText = '天机作弊器破壁引渡，神魂无损跨宗门重修！';
          if (samsaraPreviewSect) samsaraPreviewSect.innerText = `【${ticket.sectName}】(${ticket.badge})`;

          // 计算核心装备转化对照表
          const equipList = [];
          const equips = gameManager.player.equipment || {};
          for (const slot in equips) {
            const item = equips[slot];
            if (item) {
              const tmpl = window.SlotsRPG.SectConfig && window.SlotsRPG.SectConfig.getSectEquipTemplate(ticket.sectId, slot);
              const newName = tmpl ? `${item.qualityName || '凡铁'}·${tmpl.name}` : item.name;
              equipList.push(`${item.name} ➔ <b style="color:#ffd700;">${newName}</b>`);
            }
          }
          if (samsaraPreviewEquips) {
            samsaraPreviewEquips.innerHTML = equipList.length > 0 
              ? equipList.join('<br/>') 
              : '当前未佩戴核心装备，转生后将领受基础法宝';
          }
        } else {
          if (samsaraPreviewTitle) samsaraPreviewTitle.innerText = '散功坐化 · 九转重修';
          if (samsaraPreviewSubtitle) samsaraPreviewSubtitle.innerText = '一世修途功德圆满，神魂携道基转生重修！';
          if (samsaraPreviewSect) samsaraPreviewSect.innerText = '重入轮回，转生后自选新宗门';
          if (samsaraPreviewEquips) samsaraPreviewEquips.innerText = '万通商行传家宝已妥善封存，下世直接继承';
        }

        if (samsaraPreviewStats) {
          samsaraPreviewStats.innerText = `气血 +${hp} | 攻击 +${atk} | 防御 +${def} (上世 20% 传承)`;
        }

        modalSamsaraConfirmPreview.classList.remove('hidden');
      } else {
        if (confirm('【兵解转世确认】\n\n确定要兵解肉身、踏入九转轮回开启下一世吗？\n\n20% 基础属性与核心装备将神魂永存，带入新世！')) {
          gameManager.attemptSamsara('nirvana', ticket ? ticket.sectId : null);
        }
      }
    });
  }

  if (btnSamsaraPreviewCancel) {
    btnSamsaraPreviewCancel.addEventListener('click', () => {
      if (modalSamsaraConfirmPreview) modalSamsaraConfirmPreview.classList.add('hidden');
    });
  }

  if (btnSamsaraPreviewOk) {
    btnSamsaraPreviewOk.addEventListener('click', () => {
      if (modalSamsaraConfirmPreview) modalSamsaraConfirmPreview.classList.add('hidden');
      const ticket = gameManager.unlockedSectTicket;
      const targetSectId = ticket ? ticket.sectId : null;
      const sectName = ticket ? ticket.sectName : '新仙门';

      if (storyManager) {
        const tmpl = storyManager.storyConfig && storyManager.storyConfig.CHAPTERS && storyManager.storyConfig.CHAPTERS.samsara_confirm;
        if (tmpl) {
          const lines = tmpl.lines.map(l => l.replace('{sectName}', sectName));
          storyManager.showStoryDialog({
            title: tmpl.title,
            speaker: tmpl.speaker,
            speakerTitle: tmpl.speakerTitle,
            avatar: tmpl.speakerAvatar,
            lines: lines
          }, () => {
            gameManager.attemptSamsara('nirvana', targetSectId);
          });
          return;
        }
      }

      gameManager.attemptSamsara('nirvana', targetSectId);
    });
  }

  // 监听轮回转世结算大喜报
  window.SlotsRPG.EventBus.on('SAMSARA_SETTLEMENT', (data) => {
    if (!modalSamsaraSettlement) return;
    if (samsaraTitle) {
      samsaraTitle.innerText = data.isAscension ? '✨ 白日飞升 · 位列仙班' : '九转轮回 · 金光转生';
    }
    if (samsaraSubtitle) {
      samsaraSubtitle.innerText = data.isAscension
        ? '恭喜道友五卷归一，渡劫飞升！大千世界浩瀚无垠，仙门大开！'
        : (data.targetSectName
          ? `承接【${data.targetSectName}】大造化，转生拜入新道脉！神魂道基与专属神装已注入新世！`
          : '一世道途功德圆满，神魂不灭，携天地造化重入轮回！');
    }
    if (samsaraValCount) samsaraValCount.innerText = `第 ${data.samsaraCount} 世`;
    if (samsaraValKarma) samsaraValKarma.innerText = `+${data.karmaGained} 点 (总 ${data.totalKarma})`;
    if (samsaraValLegacy) {
      if (data.inheritedStats) {
        samsaraValLegacy.innerText = `气血 +${data.inheritedStats.hp} | 攻击 +${data.inheritedStats.atk} | 防御 +${data.inheritedStats.def} (20%传承)`;
      } else {
        samsaraValLegacy.innerText = '未继承新道基';
      }
    }
    if (samsaraValSpirit) {
      if (data.masteredSect) {
        const sCfg = window.SlotsRPG.SectConfig && window.SlotsRPG.SectConfig.getSect(data.masteredSect);
        const sName = sCfg ? sCfg.name : data.masteredSect;
        samsaraValSpirit.innerText = `【${sName}精魄】(永久属性加成已生效)`;
      } else {
        samsaraValSpirit.innerText = '本世未达成通关精魄';
      }
    }
    if (samsaraValHeirlooms) {
      if (data.targetSectName && data.convertedEquipsCount > 0) {
        samsaraValHeirlooms.innerText = `已将 ${data.convertedEquipsCount} 件法宝转化为【${data.targetSectName}】专属神装！`;
      } else if (data.equippedHeirlooms && data.equippedHeirlooms.length > 0) {
        samsaraValHeirlooms.innerText = `已继承带入: ${data.equippedHeirlooms.join('、')}`;
      } else {
        samsaraValHeirlooms.innerText = '未封存传家宝 (万通商行专享)';
      }
    }

    modalSamsaraSettlement.classList.remove('hidden');
  });

  if (btnSamsaraConfirm) {
    btnSamsaraConfirm.addEventListener('click', () => {
      if (modalSamsaraSettlement) modalSamsaraSettlement.classList.add('hidden');
      switchTab('slots');
      if (renderer) {
        renderer.addFloatingText('宿主携先天道基与神装转世降生！请推演初测仙缘！', '#ffd700');
      }
    });
  }

  // 监听作弊器窃取门票事件 (方案 A 破壁传音)
  window.SlotsRPG.EventBus.on('CHEAT_TICKET_ACQUIRED', (data) => {
    const ticket = data.ticket;
    showGameNotice(
      `【作弊器破壁】截获${ticket.tokenName}`,
      `<div style="text-align:center; margin-bottom:12px;">
        <span style="font-size:36px; display:inline-block;">🎫</span>
        <h3 style="color:#ffd700; margin:6px 0;">截获【${ticket.sectName} · 真传法牒】！</h3>
       </div>
       <p style="line-height:1.7; color:#e2e8f0;">
        ${data.quote}<br/><br/>
        <b>【作弊器特权激活】：</b><br/>
        1. 角色面板已开放<b>【兵解转世 · 踏入${ticket.sectName}】</b>专享通道！<br/>
        2. 兵解后<b>保留上一世 20% 总属性</b>为永久【先天道基】！<br/>
        3. 穿戴的法宝<b>无损转职转化</b>为【${ticket.sectName}】专属神装！<br/>
        4. 新一世跳过新手引导，直接以【${ticket.sectName}真传】开修！
       </p>`,
      '⚡ 作弊器骇入天道'
    );
  });

  // 监听获得飞升残卷喜报
  window.SlotsRPG.EventBus.on('SHARD_UNLOCKED', (data) => {
    const shard = data.shard;
    showGameNotice(
      `领悟天碑真卷 · 【${shard.shortName}】`,
      `<p style="line-height:1.6; color:#e2e8f0;">
        大道共鸣，天碑显圣！道友成功悟透<b>【${shard.name}】</b>！<br/>
        <b>永久增益:</b> <span style="color:#ffd700;">${shard.buffDesc}</span>（神魂永存，多世不灭）<br/>
        当前飞升真卷收集进度: <b>${data.collectedCount} / 5 卷</b>！<br/>
        ${data.allComplete ? '<b style="color:#34e89e;">🔥 五卷全部归一！可即刻前往升仙天碑叩关白日飞升！</b>' : '收集齐五大正统真卷即可白日飞升！'}
      </p>`,
      '🏛️ 天碑共鸣'
    );
  });

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
  window.SlotsRPG.EventBus.on('SPIN_COST_DEDUCTED', ({ cost, energy }) => {
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

  // 监听龙头吐宝完全展示完毕：若开启自动收纳，则抽一次静默收纳一次 (无需触发掉落与额外提示)
  window.SlotsRPG.EventBus.on('DRAGON_SPOUT_ALL_REVEALED', (spinResult) => {
    if (chkAutoCollect && chkAutoCollect.checked) {
      setTimeout(() => {
        const dcm = gameManager && gameManager.dragonCabinetManager;
        if (dcm && dcm.slots && dcm.slots.length > 0) {
          dcm.clear();
        }
      }, 160);
    }
  });

  // 临时背包一键收纳按钮
  const btnCollectAllSlots = document.getElementById('btn-collect-all-slots');
  if (btnCollectAllSlots) {
    btnCollectAllSlots.addEventListener('click', () => {
      const dcm = gameManager && gameManager.dragonCabinetManager;
      if (!dcm || !dcm.slots || dcm.slots.length === 0) {
        showFloatingNotice('临时背包空空如也，快引龙吐宝吧！', '#94a3b8');
        return;
      }

      const count = dcm.slots.length;
      dcm.clear();
      showFloatingNotice(`✨ 一键收纳成功！${count} 份天机宝萃已归入乾坤袋`, '#38ef7d');
    });
  }

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
    if (reelAnnouncement && announcementText) {
      announcementText.innerHTML = `✨ <b>天机盘进阶！</b> 突破至 Lv.${level}【${title}】，高阶法宝爆率大幅跃迁！`;
      reelAnnouncement.classList.add('visible');
      setTimeout(() => {
        reelAnnouncement.classList.remove('visible');
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
        if (window.SlotsRPG && window.SlotsRPG.SoundEffects) window.SlotsRPG.SoundEffects.play('MODAL_OPEN');
      }
    });
    showFloatingNotice(`🌟 妖王伏诛，六道大圆满！获得【${ticket.tokenName || '宗门法令'}】！`, '#ffd700');
  });

  if (btnClaimSectTicket) {
    btnClaimSectTicket.addEventListener('click', () => {
      if (modalSectTicketAwarded) modalSectTicketAwarded.classList.add('hidden');
      if (window.SlotsRPG && window.SlotsRPG.SoundEffects) window.SlotsRPG.SoundEffects.play('MODAL_CLOSE');
      showFloatingNotice('🌟 执掌宗门法令，静待飞升大典！', '#ffd700');
    });
  }

  // 26. 顶部常驻栏声音与背景仙乐开关 (支持天机盘与角色修真顶栏联动)
  const soundToggleBtns = document.querySelectorAll('.btn-sound-toggle');
  function updateSoundToggleButton() {
    const isMuted = (window.SlotsRPG && window.SlotsRPG.BattleSoundEngine && window.SlotsRPG.BattleSoundEngine.isSoundMuted()) || false;
    soundToggleBtns.forEach(btn => {
      if (isMuted) {
        btn.innerText = '🔇';
        btn.classList.add('muted');
        btn.title = '声音已静音 (点击开启仙乐与音效)';
      } else {
        btn.innerText = '🔊';
        btn.classList.remove('muted');
        btn.title = '声音已开启 (点击静音)';
      }
    });
  }

  soundToggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.SlotsRPG && window.SlotsRPG.BattleSoundEngine) {
        window.SlotsRPG.BattleSoundEngine.toggleMute();
        updateSoundToggleButton();
      }
    });
  });

  updateSoundToggleButton();

  // 27. 天机秘卷 (符号赔率、概率公示与修真法则) 弹窗
  const modalPaytableRules = document.getElementById('modal-paytable-rules');
  const btnRulesToggle = document.getElementById('btn-rules-toggle');
  const btnPaytableRules = document.getElementById('btn-paytable-rules');
  const btnClosePaytable = document.getElementById('btn-close-paytable');
  const btnPaytableConfirm = document.getElementById('btn-paytable-confirm');

  function openPaytableRulesModal(defaultTab = 'paytable') {
    if (!modalPaytableRules) return;
    switchPaytableTab(defaultTab);
    modalPaytableRules.classList.remove('hidden');
    if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
      window.SlotsRPG.SoundEffects.play('MODAL_OPEN');
    }
  }

  function closePaytableRulesModal() {
    if (!modalPaytableRules) return;
    modalPaytableRules.classList.add('hidden');
    if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
      window.SlotsRPG.SoundEffects.play('MODAL_CLOSE');
    }
  }

  function switchPaytableTab(tabKey) {
    if (!modalPaytableRules) return;
    const tabBtns = modalPaytableRules.querySelectorAll('.paytable-tab-btn');
    const panes = modalPaytableRules.querySelectorAll('.paytable-pane');

    tabBtns.forEach(btn => {
      const match = btn.getAttribute('data-tab') === tabKey;
      btn.classList.toggle('active', match);
    });

    panes.forEach(pane => {
      const match = pane.id === `pane-${tabKey}`;
      pane.classList.toggle('active', match);
    });
  }

  if (btnRulesToggle) {
    btnRulesToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      openPaytableRulesModal();
    });
  }

  if (btnPaytableRules) {
    btnPaytableRules.addEventListener('click', (e) => {
      e.stopPropagation();
      openPaytableRulesModal();
    });
  }

  if (btnClosePaytable) {
    btnClosePaytable.addEventListener('click', (e) => {
      e.stopPropagation();
      closePaytableRulesModal();
    });
  }

  if (btnPaytableConfirm) {
    btnPaytableConfirm.addEventListener('click', (e) => {
      e.stopPropagation();
      closePaytableRulesModal();
    });
  }

  if (modalPaytableRules) {
    // 手机操作优化：点击半透明遮罩背景即可快速闭卷
    modalPaytableRules.addEventListener('click', (e) => {
      if (e.target === modalPaytableRules) {
        closePaytableRulesModal();
      }
    });

    const tabBtns = modalPaytableRules.querySelectorAll('.paytable-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tab = btn.getAttribute('data-tab');
        if (tab) {
          switchPaytableTab(tab);
          if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
            window.SlotsRPG.SoundEffects.play('TAB_SWITCH');
          }
        }
      });
    });
  }

  // 28. 全局操作音效委托 (点击按钮与关闭弹窗)
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target) return;

    // A. 关闭弹窗操作
    if (target.closest('.modal-close, .btn-modal-close, [data-action="close"], .btn-close') ||
        (target.classList && target.classList.contains('modal-overlay'))) {
      if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('MODAL_CLOSE');
      }
      return;
    }

    // B. 通用按钮交互
    const btn = target.closest('button, .btn-primary-action, .btn-secondary-action, .tab-btn');
    if (btn) {
      const id = btn.id || '';
      const hasSpecificSound = id === 'btn-quick-equip' || id === 'btn-bag-merge' || id === 'btn-floating-merge' ||
                               id === 'btn-bag-salvage' || id === 'btn-bag-sort' || id === 'btn-bet-plus' ||
                               id === 'btn-bet-minus' || id === 'btn-spin' || id === 'btn-sound-toggle' ||
                               id === 'btn-item-primary' || btn.classList.contains('btn-join-sect');
      if (!hasSpecificSound && window.SlotsRPG && window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('CLICK');
      }
    }
  });

  // 确保所有 DOMContentLoaded 监听器全数挂载完毕后，立即广播初始状态刷新全盘 UI
  gameManager.emitStateChange();
});

