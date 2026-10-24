/**
 * main.js - 核心引导与主协调器 (Modular Master Orchestrator)
 * 职责：
 * 1. 负责画布与 GameManager / StoryManager 初始化
 * 2. 依次加载与启动各 UI 子模块 (ToastNotificationUI, CharacterUI, BattleUI, CaveUI, DragonSpoutUI, ModalsUI)
 * 3. 维护核心 Tab 切换调度 (switchTab) 与顶部统一 HUD 状态同步
 * 4. 监听全局事件委托与音效广播
 */
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('dragon-fx-canvas') || document.getElementById('reel-canvas');
  if (!canvas) return;

  // 1. 初始化渲染器与游戏核心管理器
  const renderer = window.SlotsRPG.DragonSpoutRenderer
    ? new window.SlotsRPG.DragonSpoutRenderer(canvas)
    : new window.SlotsRPG.CanvasRenderer(canvas);
  window.renderer = renderer;
  const gameManager = window.SlotsRPG.GameManager;
  window.gameManager = gameManager;
  gameManager.init(renderer);

  // 1.1 初始化剧情系统
  const storyManager = window.SlotsRPG.StoryManager;
  window.storyManager = storyManager;
  if (storyManager) {
    storyManager.init(gameManager);
  }

  // 2. 初始化各 UI 子系统
  if (window.SlotsRPG && window.SlotsRPG.UI) {
    if (window.SlotsRPG.UI.ToastNotificationUI && window.SlotsRPG.UI.ToastNotificationUI.init) {
      window.SlotsRPG.UI.ToastNotificationUI.init();
    }
    if (window.SlotsRPG.UI.CharacterUI && window.SlotsRPG.UI.CharacterUI.init) {
      window.SlotsRPG.UI.CharacterUI.init();
    }
    if (window.SlotsRPG.UI.BattleUI && window.SlotsRPG.UI.BattleUI.init) {
      window.SlotsRPG.UI.BattleUI.init();
    }
    if (window.SlotsRPG.UI.CaveUI && window.SlotsRPG.UI.CaveUI.init) {
      window.SlotsRPG.UI.CaveUI.init();
    }
    if (window.SlotsRPG.UI.DragonSpoutUI && window.SlotsRPG.UI.DragonSpoutUI.init) {
      window.SlotsRPG.UI.DragonSpoutUI.init();
    }
    if (window.SlotsRPG.UI.ModalsUI && window.SlotsRPG.UI.ModalsUI.init) {
      window.SlotsRPG.UI.ModalsUI.init();
    }
  }

  // 3. Tab 视图切换
  const tabSlots = document.getElementById('tab-slots');
  const tabCharacter = document.getElementById('tab-character');
  const tabCave = document.getElementById('tab-cave');
  const viewSlots = document.getElementById('view-slots');
  const viewCharacter = document.getElementById('view-character');
  const viewCave = document.getElementById('view-cave');
  const modalActionNotice = document.getElementById('modal-action-notice');

  function switchTab(tabName, skipSound = false) {
    if (!gameManager.isPrologueComplete) {
      if (tabName === 'slots' && gameManager.prologueStep < 3) {
        if (window.showFloatingNotice) window.showFloatingNotice('天机盘未觉醒，请先至角色面板采药除害！');
        return;
      }
      if (tabName === 'cave') {
        if (window.showFloatingNotice) window.showFloatingNotice('尚未拜入仙门，洞府仙脉暂未开启！');
        return;
      }
    }

    [tabSlots, tabCharacter, tabCave].forEach(t => t && t.classList.remove('active'));
    [viewSlots, viewCharacter, viewCave].forEach(v => v && v.classList.remove('active'));

    // 切换 Tab 时清理飞行动画节点
    document.querySelectorAll('.dragon-spout-flyer, .drop-flyer').forEach(el => el.remove());

    if (!skipSound && window.SlotsRPG && window.SlotsRPG.SoundEffects) {
      window.SlotsRPG.SoundEffects.play('TAB_SWITCH');
    }

    const topHud = document.querySelector('.top-hud');

    if (tabName === 'slots') {
      if (tabSlots) tabSlots.classList.add('active');
      if (viewSlots) viewSlots.classList.add('active');
      if (topHud) topHud.classList.remove('hidden');
      if (modalActionNotice) modalActionNotice.classList.add('hidden');
      if (renderer && renderer.updateSize) {
        requestAnimationFrame(() => renderer.updateSize());
      }
    } else if (tabName === 'character') {
      if (tabCharacter) tabCharacter.classList.add('active');
      if (viewCharacter) viewCharacter.classList.add('active');
      if (topHud) topHud.classList.remove('hidden');
      if (window.SlotsRPG.UI.ToastNotificationUI) {
        window.SlotsRPG.UI.ToastNotificationUI.setPendingNotificationCount(0);
      }
      if (window.renderBossRadarPanel) window.renderBossRadarPanel();
      gameManager.emitStateChange();
    } else if (tabName === 'cave') {
      if (tabCave) tabCave.classList.add('active');
      if (viewCave) viewCave.classList.add('active');
      if (topHud) topHud.classList.remove('hidden');
      if (window.updateCaveView) window.updateCaveView();
    }

    updateTabLockStates();

    try {
      localStorage.setItem('SLOTS_RPG_ACTIVE_TAB', tabName);
    } catch (e) {}
  }

  /**
   * 底部导航栏锁定态与图标联动 (带锁图片与锁徽标)
   */
  function updateTabLockStates() {
    if (!gameManager) return;
    const isPrologueComplete = !!gameManager.isPrologueComplete;
    const prologueStep = gameManager.prologueStep || 0;

    // 1. 神龙吐宝 (天机盘推演)：未完成序章且未觉醒天机盘 (prologueStep < 3) 时锁定
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

    // 2. 洞天灵脉：未完成序章（未拜入仙门）时锁定
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
  }

  window.updateTabLockStates = updateTabLockStates;

  // 绑定 Tab 点击事件
  if (tabSlots) tabSlots.addEventListener('click', () => switchTab('slots'));
  if (tabCharacter) tabCharacter.addEventListener('click', () => switchTab('character'));
  if (tabCave) tabCave.addEventListener('click', () => switchTab('cave'));

  window.switchTab = switchTab;

  // 初始化导航锁状态
  updateTabLockStates();

  // 监听觉醒与序章完成事件
  if (window.SlotsRPG && window.SlotsRPG.EventBus) {
    window.SlotsRPG.EventBus.on('ARTIFACT_AWAKENED', () => updateTabLockStates());
    window.SlotsRPG.EventBus.on('PROLOGUE_COMPLETED', () => updateTabLockStates());
    window.SlotsRPG.EventBus.on('SECT_JOINED', () => updateTabLockStates());
  }

  // 4. 监听全局状态变更，同步更新 HUD 与角色流派属性
  window.SlotsRPG.EventBus.on('STATE_CHANGE', (state) => {
    updateTabLockStates();
    // A. 顶部统一 HUD 与主推演盘灵机实时同步
    const elEnergy = document.getElementById('val-energy');
    const elCurrentLingji = document.getElementById('current-lingji-val');
    const elRealm = document.getElementById('val-realm');
    const elLevel = document.getElementById('val-level');
    const elPower = document.getElementById('val-power');

    if (elEnergy) elEnergy.innerText = state.energy;
    if (elCurrentLingji) elCurrentLingji.innerText = state.energy;
    if (elRealm) elRealm.innerText = state.realm;
    if (elLevel) elLevel.innerText = `${state.level} 阶`;
    if (elPower) elPower.innerText = state.combatPower;

    // B. 角色修真面板数值同步
    const heroProfileRealm = document.getElementById('hero-profile-realm');
    const heroProfilePower = document.getElementById('hero-profile-power');
    const heroProfileTitle = document.getElementById('hero-profile-title');
    const charHeroEnergy = document.getElementById('char-hero-energy');
    const charHeroLevel = document.getElementById('char-hero-level');
    const charHeroSect = document.getElementById('char-hero-sect');
    const statHp = document.getElementById('stat-hp');
    const statAtk = document.getElementById('stat-atk');
    const statDef = document.getElementById('stat-def');

    if (heroProfileRealm) heroProfileRealm.innerText = state.realm;
    if (heroProfilePower) heroProfilePower.innerText = state.combatPower;
    if (charHeroEnergy) charHeroEnergy.innerText = state.energy;
    if (charHeroLevel) charHeroLevel.innerText = `${state.level} 阶`;

    if (heroProfileTitle && gameManager.titleManager) {
      gameManager.titleManager.checkRealmUnlocks(state.realm);
      const curTitle = gameManager.titleManager.getEquippedTitleConfig();
      if (curTitle) {
        heroProfileTitle.innerText = curTitle.name;
        heroProfileTitle.style.color = curTitle.color;
        heroProfileTitle.style.borderColor = `${curTitle.color}88`;
      }
    }

    if (charHeroSect) {
      if (!gameManager.isPrologueComplete || state.isMortal) {
        charHeroSect.innerText = '凡人未入道';
      } else if (state.currentSect && window.SlotsRPG && window.SlotsRPG.SectConfig) {
        const sectCfg = window.SlotsRPG.SectConfig.getSect(state.currentSect);
        charHeroSect.innerText = sectCfg ? `${sectCfg.name}真传` : '散修';
      } else {
        charHeroSect.innerText = '散修';
      }
    }

    if (statHp && state.totalStats) statHp.innerText = state.totalStats.hp;
    if (statAtk && state.totalStats) statAtk.innerText = state.totalStats.atk;
    if (statDef && state.totalStats) statDef.innerText = state.totalStats.def;

    // 四大流派特化数值实时更新 (暴击、连击、反震、吸血)
    const elCrit = document.getElementById('arch-val-crit');
    const elCombo = document.getElementById('arch-val-combo');
    const elCounter = document.getElementById('arch-val-counter');
    const elLifesteal = document.getElementById('arch-val-lifesteal');
    const pModel = gameManager.player;
    if (pModel) {
      if (elCrit) elCrit.innerText = `${Math.round(pModel.critRate * 100)}%`;
      if (elCombo) elCombo.innerText = `${Math.round(pModel.comboRate * 100)}%`;
      if (elCounter) elCounter.innerText = `${Math.round(pModel.counterRate * 100)}%`;
      if (elLifesteal) elLifesteal.innerText = `${Math.round(pModel.lifestealRate * 100)}%`;
    }

    // 刷新装备、背包与试炼妖王战力雷达
    if (window.renderBossRadarPanel) window.renderBossRadarPanel(state);
    if (viewCharacter && viewCharacter.classList.contains('active')) {
      if (window.renderEquipmentSlots) window.renderEquipmentSlots(state);
      if (window.renderBagGrid) window.renderBagGrid(state);
    }

    // 序章凡人引导卡片联动 (恶兽斩杀后隐藏初战按钮，推进至神盘解封)
    const prologueSection = document.getElementById('prologue-section');
    if (prologueSection) {
      if (!gameManager.isPrologueComplete && gameManager.prologueStep < 3) {
        prologueSection.classList.remove('hidden');
        const pIcon = document.getElementById('prologue-icon');
        const pTitle = document.getElementById('prologue-title');
        const pDesc = document.getElementById('prologue-desc');
        const pBtn = document.getElementById('btn-prologue-battle');
        if (gameManager.prologueStep === 2) {
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
  });

  // 5. 全局音效委托与通用弹窗关闭
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target) return;

    // A. 关闭弹窗
    if (target.closest('.modal-close, .btn-modal-close, [data-action="close"], .btn-close') ||
        (target.classList && target.classList.contains('modal-overlay'))) {
      if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('MODAL_CLOSE');
      }
      return;
    }

    // B. 通用按钮音效
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

  // 6. 确保 DOMContentLoaded 全局挂载完成后广播初始状态刷新全局 UI
  gameManager.emitStateChange();
});
