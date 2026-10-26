/**
 * ModalsUI.js
 * 游戏全部弹窗控制器：装备详情、尊号录、镇妖塔、智能过滤、赔率规则、飞升天碑、破产救济
 */
(function() {
  window.SlotsRPG = window.SlotsRPG || {};
  window.SlotsRPG.UI = window.SlotsRPG.UI || {};

  const ModalsUI = {
    init() {
      const gameManager = window.SlotsRPG.GameManager || window.gameManager;
      const renderer = (gameManager && gameManager.renderer) || window.renderer;

      const playBattleSequence = (r, c) => window.playBattleSequence && window.playBattleSequence(r, c);
      const getSlotDisplayName = (s) => window.getSlotDisplayName ? window.getSlotDisplayName(s) : s;
      const showGameNotice = (t, c, b) => window.showGameNotice && window.showGameNotice(t, c, b);

      const storyManager = window.SlotsRPG.StoryManager || window.storyManager;
      const EventBus = window.SlotsRPG.EventBus;

    // 装备详情弹窗
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

    // 凡人序章与叩问仙门大典
    const prologueSection = document.getElementById('prologue-section');
    const btnPrologueBattle = document.getElementById('btn-prologue-battle');
    const modalAwakening = document.getElementById('modal-awakening');
    const btnAwakeningAccept = document.getElementById('btn-awakening-accept');
    const modalSectInduction = document.getElementById('modal-sect-induction');
    const inductionSectsContainer = document.getElementById('induction-sects-container');
    let isSectInductionSequenceRunning = false;

    // 升仙天碑与轮回结算
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

    const modalSamsaraConfirmPreview = document.getElementById('modal-samsara-confirm-preview');
    const samsaraPreviewTitle = document.getElementById('samsara-preview-title');
    const samsaraPreviewSubtitle = document.getElementById('samsara-preview-subtitle');
    const samsaraPreviewSect = document.getElementById('samsara-preview-sect');
    const samsaraPreviewStats = document.getElementById('samsara-preview-stats');
    const samsaraPreviewEquips = document.getElementById('samsara-preview-equips');
    const btnSamsaraPreviewCancel = document.getElementById('btn-samsara-preview-cancel');
    const btnSamsaraPreviewOk = document.getElementById('btn-samsara-preview-ok');

    // 破产救济
    const modalRelief = document.getElementById('modal-relief');
    const reliefCount = document.getElementById('relief-count');
    const btnClaimRelief = document.getElementById('btn-claim-relief');
    const btnMeditateRelief = document.getElementById('btn-meditate-relief');
    const btnCloseRelief = document.getElementById('btn-close-relief');

    let currentModalTarget = null;
    const btnSpin = document.getElementById('btn-spin');
    const elAnnouncement = document.getElementById('reel-announcement');
    const elAnnouncementText = document.getElementById('announcement-text');

    const switchTab = (tab, skipSound) => window.switchTab && window.switchTab(tab, skipSound);
    const showFloatingNotice = (msg, clr) => window.showFloatingNotice && window.showFloatingNotice(msg, clr);
    const showFloatingAttrBurst = (diff) => window.showFloatingAttrBurst && window.showFloatingAttrBurst(diff);
    const showCombatPowerGainNotice = (g, c) => window.showCombatPowerGainNotice && window.showCombatPowerGainNotice(g, c);
    const renderEquipmentSlots = (s) => window.renderEquipmentSlots && window.renderEquipmentSlots(s);
    const renderBagGrid = (s) => window.renderBagGrid && window.renderBagGrid(s);


      // 1. 装备详情展示与穿脱/升阶/熔炼弹窗
  // 7. 法宝通鉴弹窗展示与对比
  window.showEquipDetailModal = showEquipDetailModal;
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
        ${item.archetypeTags && item.archetypeTags.length > 0 ? `
          <div class="archetype-tags-list" style="margin-top:6px; display:flex; flex-wrap:wrap; gap:4px;">
            ${item.archetypeTags.map(t => `<span class="archetype-pill-tag" style="background:${t.color}20; border:1px solid ${t.color}77; color:${t.color}; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold;">${t.text}</span>`).join('')}
          </div>
        ` : ''}
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



      // 2. 尊号系统弹窗 (Titles)
  // 13.5 修仙尊号阁 (Title Manager UI)
  const modalTitleSelect = document.getElementById('modal-title-select');
  const btnCloseTitleModal = document.getElementById('btn-close-title-modal');
  const titleListContainer = document.getElementById('title-list-container');
  const heroProfileTitle = document.getElementById('hero-profile-title');

  function renderTitleModal() {
    if (!titleListContainer || !gameManager.titleManager) return;
    const tm = gameManager.titleManager;
    const allTitles = tm.getAllTitles();
    titleListContainer.innerHTML = '';

    allTitles.forEach(t => {
      const isUnlocked = tm.isUnlocked(t.id);
      const isEquipped = tm.equippedTitle === t.id;

      const card = document.createElement('div');
      card.className = `title-card-item ${isEquipped ? 'is-equipped' : ''} ${!isUnlocked ? 'is-locked' : ''}`;
      
      let actionBtn = '';
      if (isEquipped) {
        actionBtn = `<span class="btn-title-action btn-equipped-tag">已佩戴</span>`;
      } else if (isUnlocked) {
        actionBtn = `<button class="btn-title-action btn-equip" data-id="${t.id}">佩戴</button>`;
      } else {
        actionBtn = `<span class="btn-title-action btn-locked-tag" title="${t.unlockCondition}">未解锁</span>`;
      }

      card.innerHTML = `
        <div class="title-card-info">
          <div class="title-card-name" style="color: ${t.color}">${t.name}</div>
          <div class="title-card-desc">${t.desc}</div>
          <div class="title-card-power">⚡ 战力 +${t.bonusPower} ${!isUnlocked ? `· <span style="color:#94a3b8">条件: ${t.unlockCondition}</span>` : ''}</div>
        </div>
        <div class="title-card-right">
          ${actionBtn}
        </div>
      `;
      titleListContainer.appendChild(card);
    });

    titleListContainer.querySelectorAll('.btn-equip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const titleId = e.currentTarget.getAttribute('data-id');
        if (titleId && tm.equipTitle(titleId)) {
          if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
            window.SlotsRPG.SoundEffects.play('LEVEL_UP');
          }
          const tCfg = tm.getTitleConfig(titleId);
          if (renderer && renderer.addFloatingText) {
            renderer.addFloatingText(`已佩戴称号：${tCfg.name} (战力+${tCfg.bonusPower})`, tCfg.color);
          }
          renderTitleModal();
          gameManager.emitStateChange();
        }
      });
    });
  }

  if (heroProfileTitle) {
    heroProfileTitle.addEventListener('click', () => {
      if (modalTitleSelect) {
        renderTitleModal();
        modalTitleSelect.classList.remove('hidden');
      }
    });
  }

  if (btnCloseTitleModal) {
    btnCloseTitleModal.addEventListener('click', () => {
      if (modalTitleSelect) modalTitleSelect.classList.add('hidden');
    });
  }



      // 3. 锁妖天关 · 镇妖塔弹窗 (Demon Tower)
  // 13.6 锁妖天关 · 镇妖塔挑战弹窗 (Demon Tower UI)
  const modalDemonTower = document.getElementById('modal-demon-tower');
  const demonTowerCard = document.getElementById('demon-tower-card');
  const btnEnterDemonTower = document.getElementById('btn-enter-demon-tower');
  const btnCloseTowerModal = document.getElementById('btn-close-tower-modal');
  const btnStartTowerBattle = document.getElementById('btn-start-tower-battle');

  function openDemonTowerModal() {
    if (!gameManager.demonTowerManager || !modalDemonTower) return;
    const tower = gameManager.demonTowerManager;
    const flrCfg = tower.getFloorConfig(tower.currentFloor);
    const playerPower = (gameManager.player && gameManager.player.combatPower) || 0;

    const elTitle = document.getElementById('tower-modal-floor-title');
    const elAvatar = document.getElementById('tower-modal-boss-img');
    const elPlayerPower = document.getElementById('tower-player-power-val');
    const elReqPower = document.getElementById('tower-req-power-val');
    const elRewardsRow = document.getElementById('tower-rewards-row');

    if (elTitle) elTitle.innerText = `第 ${flrCfg.floor} 层 · ${flrCfg.bossName}`;
    if (elAvatar) elAvatar.src = flrCfg.avatar;
    if (elPlayerPower) {
      elPlayerPower.innerText = playerPower;
      elPlayerPower.style.color = playerPower >= flrCfg.reqPower ? '#38ef7d' : '#f87171';
    }
    if (elReqPower) elReqPower.innerText = flrCfg.reqPower;

    if (elRewardsRow) {
      let rHtml = `
        <span class="reward-pill-tag">✨ 机缘 +${flrCfg.rewards.energy}</span>
        <span class="reward-pill-tag">💊 纯阳丹 x${flrCfg.rewards.pills}</span>
      `;
      if (flrCfg.rewards.titleName) {
        rHtml += `<span class="reward-pill-tag" style="border-color:#ffd700; color:#ffd700;">👑 首通尊号 ${flrCfg.rewards.titleName}</span>`;
      }
      elRewardsRow.innerHTML = rHtml;
    }

    modalDemonTower.classList.remove('hidden');
    if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
      window.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE();
    }
  }

  function handleDirectTowerBattle(e) {
    if (e) {
      e.stopPropagation();
    }
    if (modalDemonTower) modalDemonTower.classList.add('hidden');
    if (!gameManager.demonTowerManager) return;

    const battleResult = gameManager.demonTowerManager.startChallenge();
    if (battleResult && battleResult.success === false) {
      showGameNotice('无法挑战', battleResult.reason || '挑战条件未达成', '⚠️ 镇妖天关');
      return;
    }
    playBattleSequence(battleResult);
  }

  // 优化操作步骤：点击【持剑闯关】按钮直接进入战斗
  if (btnEnterDemonTower) {
    btnEnterDemonTower.addEventListener('click', handleDirectTowerBattle);
  }

  // 优化操作步骤：点击卡片除按钮外的其它区域，显示【破关激战】详情弹窗
  if (demonTowerCard) {
    demonTowerCard.addEventListener('click', (e) => {
      if (e.target && e.target.closest('#btn-enter-demon-tower')) {
        return;
      }
      openDemonTowerModal();
    });
  }

  // 优化右上角关闭按钮逻辑
  if (btnCloseTowerModal) {
    btnCloseTowerModal.addEventListener('click', () => {
      if (modalDemonTower) {
        modalDemonTower.classList.add('hidden');
        if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
          window.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE();
        }
      }
    });
  }

  // 弹窗内的【破关激战】按钮
  if (btnStartTowerBattle) {
    btnStartTowerBattle.addEventListener('click', handleDirectTowerBattle);
  }



      // 4. 破产救济弹窗
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
          修仙系统感应天地灵涌，可引渡游离灵气补充。<br />
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
          修仙系统今日神念灌顶纳灵次数已用尽（0次）。<br />
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
      if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
        window.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE();
      }
    }
  });



      // 5. 凡人序章与叩问仙门大典
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
      if (window.updateFTUESpotlight) window.updateFTUESpotlight();

      // 触发天机初转引导与作弊器嘲讽天道剧情对白
      if (storyManager) {
        storyManager.triggerChapter('prologue_first_spin');
      } else if (renderer) {
        renderer.addFloatingText('天机盘觉醒！已获 100 灵机，请点击推演天机！', '#ffd700');
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
    // 安全防线：若玩家已完成序章或已拥有门派，严禁再次展现拜入门派弹窗
    if (gameManager.isPrologueComplete || (gameManager.player && gameManager.player.currentSect && !gameManager.player.isMortal)) {
      modalSectInduction.classList.add('hidden');
      return;
    }
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
          inductionSectsContainer.innerHTML = '';
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
      if (storyManager) {
        storyManager.isDialogActive = true;
      }
      switchTab('character', true);
      if (prologueSection) prologueSection.classList.remove('hidden');
      // 凡人初入开局：自动唤起背景故事对话 (林凡身世与后山遭遇)
      setTimeout(() => {
        if (storyManager) {
          storyManager.triggerChapter('prologue_mortal_intro');
        }
      }, 350);
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
      if (window.updateFTUESpotlight) window.updateFTUESpotlight();
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



      // 6. 升仙天碑与五行纯图案法阵
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
    const btnClosePantheonX = document.getElementById('btn-close-pantheon-x');
    if (btnClosePantheon) {
      btnClosePantheon.onclick = () => {
        modalPantheon.classList.add('hidden');
      };
    }
    if (btnClosePantheonX) {
      btnClosePantheonX.onclick = () => {
        modalPantheon.classList.add('hidden');
      };
    }
  }

  if (btnOpenStele) {
    btnOpenStele.addEventListener('click', () => {
      renderAscensionStele();
      if (modalAscensionStele) {
      modalAscensionStele.classList.remove('hidden');
      if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
        window.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE();
      }
    }
    });
  }

  if (btnCloseStele) {
    btnCloseStele.addEventListener('click', () => {
      if (modalAscensionStele) modalAscensionStele.classList.add('hidden');
    });
  }
  const btnCloseSteleX = document.getElementById('btn-close-stele-x');
  if (btnCloseSteleX) {
    btnCloseSteleX.addEventListener('click', () => {
      if (modalAscensionStele) modalAscensionStele.classList.add('hidden');
    });
  }



      // 7. 纯 IAA 变现广告与宗门大能英灵殿
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
          if (samsaraPreviewSubtitle) samsaraPreviewSubtitle.innerText = '修仙系统破壁引渡，神魂无损跨宗门重修！';
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
    if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
      window.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE();
    }
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
      `【修仙系统】截获${ticket.tokenName}`,
      `<div style="text-align:center; margin-bottom:12px;">
        <span style="font-size:36px; display:inline-block;">🎫</span>
        <h3 style="color:#ffd700; margin:6px 0;">截获【${ticket.sectName} · 真传法牒】！</h3>
       </div>
       <p style="line-height:1.7; color:#e2e8f0;">
        ${data.quote}<br/><br/>
        <b>【修仙系统特权激活】：</b><br/>
        1. 角色面板已开放<b>【兵解转世 · 踏入${ticket.sectName}】</b>专享通道！<br/>
        2. 兵解后<b>保留上一世 20% 总属性</b>为永久【先天道基】！<br/>
        3. 穿戴的法宝<b>无损转职转化</b>为【${ticket.sectName}】专属神装！<br/>
        4. 新一世跳过新手引导，直接以【${ticket.sectName}真传】开修！
       </p>`,
      '⚡ 修仙系统解析天道'
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



      // 8. 智能过滤与自动收纳设置弹窗
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
      const fullSet = gameManager && gameManager.player && gameManager.player.checkFullSetEquipped('Q4');
      const isUnlocked = !!(gameManager && gameManager.hasUnlockedAutoSmelt) || (fullSet && fullSet.isGraduated);
      if (!isUnlocked) return;
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


      // 9. 天机秘卷与赔率规则弹窗
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



      // 暴露方法到对象与全局
      ModalsUI.showEquipDetailModal = showEquipDetailModal;
      ModalsUI.renderTitleModal = renderTitleModal;
      ModalsUI.openDemonTowerModal = openDemonTowerModal;
      ModalsUI.syncFilterSettingsUI = syncFilterSettingsUI;
      ModalsUI.openPaytableRulesModal = openPaytableRulesModal;
      ModalsUI.closePaytableRulesModal = closePaytableRulesModal;
      ModalsUI.switchPaytableTab = switchPaytableTab;

      window.showEquipDetailModal = showEquipDetailModal;
      window.renderTitleModal = renderTitleModal;
      window.openDemonTowerModal = openDemonTowerModal;
      window.syncFilterSettingsUI = syncFilterSettingsUI;
      window.openPaytableRulesModal = openPaytableRulesModal;
      window.closePaytableRulesModal = closePaytableRulesModal;
      window.switchPaytableTab = switchPaytableTab;
      window.openRewardedAdModal = openRewardedAdModal;
      window.updateReliefModalUI = updateReliefModalUI;
    }
  };

  window.SlotsRPG.UI.ModalsUI = ModalsUI;
})();
