/**
 * CharacterUI.js
 * 角色修真面板、6大法宝装备槽位、24格乾坤袋背包、一键穿戴与一键熔炼、九重雷劫破境大典
 */
(function() {
  window.SlotsRPG = window.SlotsRPG || {};
  window.SlotsRPG.UI = window.SlotsRPG.UI || {};

  let selectedBagSlotIndex = -1;

  const CharacterUI = {
    init() {
      const gameManager = window.SlotsRPG.GameManager || window.gameManager;
      const renderer = (gameManager && gameManager.renderer) || window.renderer;

      const storyManager = window.SlotsRPG.StoryManager || window.storyManager;
      const showGameNotice = (t, c, b) => window.showGameNotice && window.showGameNotice(t, c, b);

      const EventBus = window.SlotsRPG.EventBus;

    const tabCharacter = document.getElementById('tab-character');
    const tabBadgeCharacter = document.getElementById('tab-badge-character');
    const viewCharacter = document.getElementById('view-character');
    const charRealmText = document.getElementById('val-realm');
    const charPowerText = document.getElementById('val-power');
    const heroProfileRealm = document.getElementById('hero-profile-realm');
    const heroProfilePower = document.getElementById('hero-profile-power');
    const charHeroEnergy = document.getElementById('char-hero-energy');
    const charHeroLevel = document.getElementById('char-hero-level');
    const charHeroSect = document.getElementById('char-hero-sect');
    const charExpText = document.getElementById('char-exp-text');
    const charExpFill = document.getElementById('char-exp-fill');
    const statHp = document.getElementById('stat-hp');
    const statAtk = document.getElementById('stat-atk');
    const statDef = document.getElementById('stat-def');
    const btnQuickEquip = document.getElementById('btn-quick-equip');
    const btnSpin = document.getElementById('btn-spin');

    const bagCapText = document.getElementById('bag-cap-text') || document.getElementById('bag-capacity-text');
    const bagGrid = document.getElementById('bag-grid');
    const chkAutoSalvage = document.getElementById('chk-auto-salvage');
    const btnBagSortHeader = document.getElementById('btn-bag-sort-header');
    const btnBagSort = document.getElementById('btn-bag-sort');
    const btnBagMerge = document.getElementById('btn-bag-merge');
    const btnFloatingMerge = document.getElementById('btn-floating-merge');
    const floatingMergeWrap = document.getElementById('floating-merge-wrap');
    const btnBagSalvage = document.getElementById('btn-bag-salvage');

    // 守关妖王与关卡试炼战力雷达标尺 DOM
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

    // 升级突破与背包满载弹窗 DOM
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

    // 战力暴涨庆典展示弹窗 DOM
    const modalPowerGain = document.getElementById('modal-power-gain');
    const btnPowerGainConfirm = document.getElementById('btn-power-gain-confirm');
    const powerGainOld = document.getElementById('power-gain-old');
    const powerGainNew = document.getElementById('power-gain-new');
    const powerGainDiff = document.getElementById('power-gain-diff');
    const powerGainItemName = document.getElementById('power-gain-item-name');
    const powerGainItemIcon = document.getElementById('power-gain-item-icon');
    const powerGainItemDesc = document.getElementById('power-gain-item-desc');
    const powerGainStatsGrid = document.getElementById('power-gain-stats-grid');

    /**
     * 数值动态滚动递增动画 (easeOutCubic 曲线)
     */
    function animateCountUp(el, startVal, endVal, durationMs = 1000, prefix = '', suffix = '') {
      if (!el) return;
      const start = parseInt(startVal, 10) || 0;
      const end = parseInt(endVal, 10) || 0;
      if (start === end) {
        el.innerText = `${prefix}${end}${suffix}`;
        return;
      }
      const startTime = performance.now();
      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.round(start + (end - start) * ease);
        el.innerText = `${prefix}${currentVal}${suffix}`;
        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.innerText = `${prefix}${end}${suffix}`;
        }
      }
      requestAnimationFrame(update);
    }


      const switchTab = (tab, skipSound) => window.switchTab && window.switchTab(tab, skipSound);
      const showFloatingNotice = (msg, clr) => window.showFloatingNotice && window.showFloatingNotice(msg, clr);
      const showFloatingAttrBurst = (diff) => window.showFloatingAttrBurst && window.showFloatingAttrBurst(diff);
      const showCombatPowerGainNotice = (g, c) => window.showCombatPowerGainNotice && window.showCombatPowerGainNotice(g, c);
      const showEquipDetailModal = (t) => window.showEquipDetailModal && window.showEquipDetailModal(t);


      // 1. 装备槽位与背包网格渲染
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
  function renderBagGrid(state = {}) {
    const isAwakened = gameManager && (gameManager.prologueStep >= 3 || gameManager.isPrologueComplete);
    // 若作弊器已激活，预先清理背包中残留的造化天机盘
    if (isAwakened && gameManager && gameManager.inventory && Array.isArray(gameManager.inventory.slots)) {
      for (let sIdx = 0; sIdx < gameManager.inventory.slots.length; sIdx++) {
        const it = gameManager.inventory.slots[sIdx];
        if (it && (it.isArtifactPlate || it.id === 'ITEM_TIANJI_PLATE' || (it.name && it.name.includes('造化天机盘')))) {
          gameManager.inventory.slots[sIdx] = null;
        }
      }
    }

    const items = (state && state.inventorySlots) || (gameManager && gameManager.inventory ? gameManager.inventory.slots : []);
    const capacity = (state && state.inventoryCapacity) || (gameManager && gameManager.inventory ? gameManager.inventory.capacity : 24);
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
        if (item.isArtifactPlate || item.id === 'ITEM_TIANJI_PLATE' || (item.name && item.name.includes('造化天机盘'))) {
          // 若天机盘已认主激活 (prologueStep >= 3 或序章已完成)，神物已融于识海神魂，背包中绝不残留展示
          if (isAwakened) {
            continue;
          }
          cell.id = 'item-tianji-pan';
          cell.className = 'bag-cell occupied artifact-plate-slot';
          cell.style.borderColor = '#ffd700';
          cell.innerHTML = `
            <div class="artifact-plate-guide-pointer">👉</div>
            <img class="cell-icon" src="${item.icon}" alt="${item.name}" />
            <div class="cell-name" style="color:#ffd700; font-weight:bold;">${item.name}</div>
            <span class="cell-badge cell-quality-badge" style="color:#ffd700; background:rgba(255,215,0,0.25);">神物</span>
          `;
          cell.onclick = () => {
            // 点击天机盘：在乾坤袋中解封认主，唤起作弊器认主弹窗
            const modalAwakening = document.getElementById('modal-awakening');
            if (modalAwakening) {
              modalAwakening.classList.remove('hidden');
            }
            if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
              window.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE();
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
        if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
          window.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE();
        }
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
    const initialHp = gameManager.player.maxHp || 0;
    const initialAtk = gameManager.player.attack || 0;
    const initialDef = gameManager.player.defense || 0;
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
              color: res.equipped.qualityColor || '#ffd700',
              icon: res.equipped.icon
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

      // 1. 战力数值动态滚动跃升展示
      animateCountUp(heroProfilePower, initialCombatPower, gameManager.player.combatPower, 1000);
      animateCountUp(charPowerText, initialCombatPower, gameManager.player.combatPower, 1000);

      // 2. 检查是否在 FTUE 首次穿戴神兵或有战力大幅跃升
      const isFTUEFirstEquip = !gameManager.isPrologueComplete && gameManager.prologueStep === 3 && gameManager.prologueSpins === 1;

      if (isFTUEFirstEquip && modalPowerGain) {
        // 展示战力暴涨庆典弹窗，给玩家充分感受战力数值飙升的震撼正反馈
        const firstEquip = upgradedDetails[0] || {};
        if (powerGainItemName) {
          powerGainItemName.innerText = firstEquip.name || '绝世神兵';
          if (firstEquip.color) powerGainItemName.style.color = firstEquip.color;
        }
        if (powerGainItemIcon && firstEquip.icon) powerGainItemIcon.src = firstEquip.icon;
        if (powerGainItemDesc) powerGainItemDesc.innerText = `${firstEquip.slotName || '武器'}槽位已装备 · 威能显赫`;

        if (powerGainOld) powerGainOld.innerText = initialCombatPower;
        if (powerGainDiff) powerGainDiff.innerText = `+${displayPowerGain} 🔺`;
        if (powerGainNew) {
          powerGainNew.innerText = initialCombatPower;
          animateCountUp(powerGainNew, initialCombatPower, gameManager.player.combatPower, 1000);
        }

        // 基础四维属性精进对比条目装填
        if (powerGainStatsGrid) {
          const diffAtk = (gameManager.player.attack || 0) - initialAtk;
          const diffDef = (gameManager.player.defense || 0) - initialDef;
          const diffHp = (gameManager.player.maxHp || 0) - initialHp;
          let statsHtml = '';
          if (diffAtk > 0) {
            statsHtml += `
              <div class="stat-compare-row">
                <span class="stat-label">⚔️ 攻击威能</span>
                <div class="stat-values">
                  <span class="stat-old">${initialAtk}</span>
                  <span class="stat-arrow">➔</span>
                  <span class="stat-new">${gameManager.player.attack}</span>
                  <span class="stat-diff" style="color:#34e89e; font-weight:bold;">(+${diffAtk})</span>
                </div>
              </div>
            `;
          }
          if (diffDef > 0) {
            statsHtml += `
              <div class="stat-compare-row">
                <span class="stat-label">🛡️ 护体防御</span>
                <div class="stat-values">
                  <span class="stat-old">${initialDef}</span>
                  <span class="stat-arrow">➔</span>
                  <span class="stat-new">${gameManager.player.defense}</span>
                  <span class="stat-diff" style="color:#34e89e; font-weight:bold;">(+${diffDef})</span>
                </div>
              </div>
            `;
          }
          if (diffHp > 0) {
            statsHtml += `
              <div class="stat-compare-row">
                <span class="stat-label">💚 气血上限</span>
                <div class="stat-values">
                  <span class="stat-old">${initialHp}</span>
                  <span class="stat-arrow">➔</span>
                  <span class="stat-new">${gameManager.player.maxHp}</span>
                  <span class="stat-diff" style="color:#34e89e; font-weight:bold;">(+${diffHp})</span>
                </div>
              </div>
            `;
          }
          powerGainStatsGrid.innerHTML = statsHtml;
        }

        modalPowerGain.classList.remove('hidden');
        if (window.SlotsRPG.SoundEffects) {
          window.SlotsRPG.SoundEffects.play('LEVEL_UP');
        }
        // 战力暴涨全过程展示无需用新手引导呈现，常规展示战力跃升
        if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
          window.SlotsRPG.SpotlightGuide.hide();
        }
        clearTimeout(window._powerGainModalTimer);
        window._powerGainModalTimer = setTimeout(() => {
          if (modalPowerGain && !modalPowerGain.classList.contains('hidden')) {
            modalPowerGain.classList.add('hidden');
            if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
              window.SlotsRPG.SpotlightGuide.lastGuideDismissTime = Date.now();
              window.SlotsRPG.SpotlightGuide.scheduleCheck(800);
            }
          }
        }, 3600);
      } else {
        // 非新手首抽：常规动效胶囊直接展现
        showCombatPowerGainNotice(displayPowerGain, upgradedCount);
      }
    } else {
      showFloatingNotice('当前佩戴已是最佳法宝组合，无需更换', '#94a3b8');
    }

    updateQuickEquipButtonState();
    updateBagActionButtons();
  }



      // 2. 背包与换装快捷操作
  // 8. 装备与乾坤袋快捷操作 (一键装备、一键整理、浮动一键升阶)
  if (btnQuickEquip) {
    btnQuickEquip.addEventListener('click', () => {
      quickEquipBestGear();
    });
  }

  if (btnPowerGainConfirm) {
    btnPowerGainConfirm.addEventListener('click', () => {
      clearTimeout(window._powerGainModalTimer);
      if (modalPowerGain) modalPowerGain.classList.add('hidden');
      if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('MODAL_CLOSE');
      }
      if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
        window.SlotsRPG.SpotlightGuide.lastGuideDismissTime = Date.now();
        window.SlotsRPG.SpotlightGuide.scheduleCheck(800);
      }
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
        '造化熔炉·一键升阶成功',
        `共融合 <b>${res.mergedGroupsCount}</b> 组同阶法宝，释放 <b>${res.freedSlots}</b> 个背包空格！<br><br><b>凝练获得全新仙家法宝：</b><br>${names}`,
        '✨ 熔炉神铸'
      );
      if (renderer && renderer.addFloatingText) {
        renderer.addFloatingText(`一键升阶成功 +${res.mergedGroupsCount}组!`, '#ffd700');
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



      // 3. 突破与九重雷劫仪式
  // 10. 突破与九重雷劫破境仪式
  function playTribulationCeremony(data, onComplete) {
    const overlay = document.createElement('div');
    overlay.className = 'tribulation-overlay';
    overlay.innerHTML = `
      <div class="tribulation-cloud-vortex"></div>
      <div class="tribulation-lightning-flash" id="trib-flash"></div>
      <div class="tribulation-thunder-beam" id="trib-beam"></div>
      <div class="tribulation-title-wrap">
        <div class="tribulation-stage-hint">⚡ 九重雷劫 · 破境登天 ⚡</div>
        <div class="tribulation-realm-transition">
          <span class="realm-old">${data.oldRealm}</span>
          <span class="realm-arrow">➔</span>
          <span class="realm-new">${data.newRealm}</span>
        </div>
      </div>
      <div class="tribulation-seal" id="trib-seal">破境功成</div>
      <div class="tribulation-power-badge" id="trib-power">⚡ 战力飙升 +${data.powerDiff} ⬆</div>
      <div class="tribulation-skip-hint">点击屏幕任意位置跳过</div>
    `;

    document.body.appendChild(overlay);

    const flash = overlay.querySelector('#trib-flash');
    const beam = overlay.querySelector('#trib-beam');
    const seal = overlay.querySelector('#trib-seal');
    const power = overlay.querySelector('#trib-power');

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 280);
      if (typeof onComplete === 'function') onComplete();
    };

    overlay.onclick = finish;

    // 0.2s: 雷云聚顶，白炽雷暴贯体
    setTimeout(() => {
      if (finished) return;
      if (flash) flash.classList.add('flash-active');
      if (beam) beam.classList.add('beam-active');
      if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('TREASURE_BURST');
      }
    }, 200);

    // 0.6s: 破境功成朱红大印轰然盖下
    setTimeout(() => {
      if (finished) return;
      if (seal) seal.classList.add('seal-slammed');
      if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('BREAKTHROUGH');
      }
    }, 600);

    // 0.95s: 战力飙升浮标展示
    setTimeout(() => {
      if (finished) return;
      if (power) power.classList.add('badge-revealed');
    }, 950);

    // 1.85s: 演出平滑结束进入详情面板
    setTimeout(() => {
      finish();
    }, 1850);
  }

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

    const isMajorBreakthrough = oldRealm && newRealm && oldRealm !== newRealm;
    if (isMajorBreakthrough) {
      playTribulationCeremony({ oldRealm, newRealm, powerDiff }, () => {
        if (modalLevelUp) modalLevelUp.classList.remove('hidden');
      });
    } else {
      if (modalLevelUp) modalLevelUp.classList.remove('hidden');
    }
  });

  btnLevelupConfirm.addEventListener('click', () => {
    modalLevelUp.classList.add('hidden');
  });

  window.SlotsRPG.EventBus.on('INVENTORY_OVERFLOW_FULL', () => {
    if (modalOverflowAlert) {
      modalOverflowAlert.classList.remove('hidden');
      if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
        window.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE();
      }
    }
  });

  btnOverflowMerge.addEventListener('click', () => {
    gameManager.mergeEquipment();
    modalOverflowAlert.classList.add('hidden');
    if (gameManager.dragonCabinetManager && gameManager.dragonCabinetManager.collectAllToInventory) {
      gameManager.dragonCabinetManager.collectAllToInventory();
    }
  });

  btnOverflowSalvage.addEventListener('click', () => {
    gameManager.bulkSalvageEquipment(['Q1', 'Q2', 'Q3']);
    modalOverflowAlert.classList.add('hidden');
    if (gameManager.dragonCabinetManager && gameManager.dragonCabinetManager.collectAllToInventory) {
      gameManager.dragonCabinetManager.collectAllToInventory();
    }
  });

  const btnCloseOverflowX = document.getElementById('btn-close-overflow-x');
  if (btnCloseOverflowX && modalOverflowAlert) {
    btnCloseOverflowX.addEventListener('click', () => {
      modalOverflowAlert.classList.add('hidden');
    });
  }

  const btnOverflowGotoBag = document.getElementById('btn-overflow-goto-bag');
  if (btnOverflowGotoBag && modalOverflowAlert) {
    btnOverflowGotoBag.addEventListener('click', () => {
      modalOverflowAlert.classList.add('hidden');
      if (window.switchTab) {
        window.switchTab('character');
      }
    });
  }



      // 4. 事件监听
      if (EventBus) {
        EventBus.on('PLAYER_LEVEL_UP', (levelUps) => {
          playTribulationCeremony(levelUps, () => {
            const levelUpSummary = document.getElementById('level-up-summary');
            if (modalLevelUp && levelUpSummary && levelUps && levelUps.length > 0) {
              const last = levelUps[levelUps.length - 1];
              levelUpSummary.innerHTML = `
                <div class="level-up-badge">破境登天</div>
                <div class="level-up-title">${last.oldRealm || ''} ➔ ${last.newRealm || ''}</div>
                <div class="level-up-stats">
                  <div>⚡ 战力跃升: +${(last.newPower || 0) - (last.oldPower || 0)}</div>
                  <div>💚 气血上限: +${(last.newHp || 0) - (last.oldHp || 0)}</div>
                  <div>⚔️ 攻击威能: +${(last.newAtk || 0) - (last.oldAtk || 0)}</div>
                  <div>🛡️ 护体防御: +${(last.newDef || 0) - (last.oldDef || 0)}</div>
                </div>
              `;
              modalLevelUp.classList.remove('hidden');
              if (window.SlotsRPG && window.SlotsRPG.SpotlightGuide) {
                window.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE();
              }
            }
          });
        });

        EventBus.on('REWARDS_DROPPED', (data) => {
          if (data && data.items && data.items.length > 0) {
            const inventory = gameManager ? gameManager.inventory : null;
            if (inventory) renderBagGrid({ inventorySlots: inventory.slots, inventoryCapacity: inventory.capacity });
          }
        });
      }

      /**
       * 渲染角色修真界面的守关妖王与宗门试炼战力雷达标尺 (与天机盘横幅严格统一)
       */
      function renderBossRadarPanel(state) {
        if (!bossRadarPanel || !gameManager) return;
        const hasJoinedSect = !!(gameManager.currentWorldTier === 2 || (gameManager.player && gameManager.player.currentSect && !gameManager.player.isMortal));

        if (!hasJoinedSect) {
          bossRadarPanel.classList.add('hidden');
          return;
        }

        const info = (typeof gameManager.getCurrentTrialStageInfo === 'function') ? gameManager.getCurrentTrialStageInfo() : null;
        if (!info || info.isMortal) {
          bossRadarPanel.classList.add('hidden');
          return;
        }

        bossRadarPanel.classList.remove('hidden');

        const curPower = info.playerPower || (state && state.combatPower) || (gameManager.player && gameManager.player.combatPower) || 18;
        const reqPower = info.reqPower || 100;
        const pct = Math.min(100, Math.max(5, Math.floor((curPower / reqPower) * 100)));
        const diff = curPower - reqPower;
        const isReady = curPower >= reqPower;
        const isHard = !isReady && curPower >= reqPower * 0.85;

        if (info.isAllCleared) {
          if (bossRadarIcon) bossRadarIcon.innerText = '🏆';
          if (bossRadarLabel) bossRadarLabel.innerText = '试炼通关:';
          if (bossRadarName) bossRadarName.innerText = '本门派妖魔已全灭';
          if (bossRadarReqPower) bossRadarReqPower.innerText = '圆满';

          if (bossRadarFill) {
            bossRadarFill.style.width = '100%';
            bossRadarFill.classList.add('ready');
          }
          if (bossRadarProgressText) {
            bossRadarProgressText.innerText = '战力达成度: 100% (已通关)';
          }

          if (bossRadarStatus) {
            bossRadarStatus.className = 'boss-radar-status ready';
            bossRadarStatus.innerText = '登峰造极 (试炼圆满)';
            bossRadarPanel.classList.add('ready');
            if (bossRadarHint) bossRadarHint.innerText = '🎉 恭喜！当前门派所有试炼妖兽与守关妖王已被尽数伏诛！';
          }

          if (btnBossRadarChallenge) {
            btnBossRadarChallenge.disabled = true;
            btnBossRadarChallenge.classList.add('disabled');
            btnBossRadarChallenge.innerText = '已通关';
            btnBossRadarChallenge.classList.remove('pulse-gold');
          }
        } else if (info.isFinalBoss) {
          // 守关大妖王终局标尺
          if (bossRadarIcon) bossRadarIcon.innerText = '🔥';
          if (bossRadarLabel) bossRadarLabel.innerText = '守关妖王:';
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
              bossRadarStatus.innerText = '道基大成 (可斩妖王)';
              bossRadarPanel.classList.add('ready');
              if (bossRadarHint) bossRadarHint.innerText = '✨ 战力已达斩妖标尺！拔剑决战即可荡平妖王破关晋阶！';
            } else if (isHard) {
              bossRadarStatus.classList.add('warning');
              bossRadarStatus.innerText = `势均力敌 (还差 ${Math.abs(diff)} 战力)`;
              bossRadarPanel.classList.remove('ready');
              if (bossRadarHint) bossRadarHint.innerText = '⚔️ 战力接近斩妖门槛，建议再合成1~2件法宝确保稳操胜券！';
            } else {
              bossRadarStatus.classList.add('danger');
              bossRadarStatus.innerText = `凶险异常 (还差 ${Math.abs(diff)} 战力)`;
              bossRadarPanel.classList.remove('ready');
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
          // 前 1~12 关递增试炼 (与天机盘横幅严格统一评估目标与数据)
          if (bossRadarIcon) bossRadarIcon.innerText = info.tier === 'elite' ? '👹' : '🐾';
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
              bossRadarStatus.innerText = '胜券在握 (可斩杀)';
              bossRadarPanel.classList.add('ready');
              if (bossRadarHint) bossRadarHint.innerText = `✨ 战力已达标！出鞘迎击可轻松通关第 ${info.stageIndex} 关试炼！`;
            } else if (isHard) {
              bossRadarStatus.classList.add('warning');
              bossRadarStatus.innerText = `势均力敌 (还差 ${Math.abs(diff)} 战力)`;
              bossRadarPanel.classList.remove('ready');
              if (bossRadarHint) bossRadarHint.innerText = '⚔️ 战力接近本关门槛，精炼法宝或祭出破魔符可一决高下！';
            } else {
              bossRadarStatus.classList.add('danger');
              bossRadarStatus.innerText = `凶险异常 (还差 ${Math.abs(diff)} 战力)`;
              bossRadarPanel.classList.remove('ready');
              if (bossRadarHint) bossRadarHint.innerText = '💡 敌方灵压高于自身战力！建议回【乾坤袋】一键升阶装备后再战！';
            }
          }

          if (btnBossRadarChallenge) {
            btnBossRadarChallenge.disabled = false;
            btnBossRadarChallenge.classList.remove('disabled');
            btnBossRadarChallenge.innerText = isReady ? `⚔️ 拔剑斩妖 (第${info.stageIndex}关)` : `⚔️ 试剑第${info.stageIndex}关`;
            btnBossRadarChallenge.classList.toggle('pulse-gold', isReady);
          }
        }
      }

      // 暴露方法到对象与全局
      
      // 道相详参轻量一级弹窗绑定 (头像与道相按钮点击呼出，无多级套娃)
      const heroAvatarBox = document.getElementById('hero-avatar-box');
      const btnHeroProfileDetail = document.getElementById('btn-hero-profile-detail');
      const modalHeroProfileDetail = document.getElementById('modal-hero-profile-detail');
      const btnCloseHeroDetail = document.getElementById('btn-close-hero-detail');
      const btnCloseHeroDetailBottom = document.getElementById('btn-close-hero-detail-bottom');
      const btnOpenTitleModalFromDetail = document.getElementById('btn-open-title-modal-from-detail');

      const openHeroDetailModal = () => {
        if (modalHeroProfileDetail) {
          if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
            window.SlotsRPG.SoundEffects.play('CLICK');
          }
          modalHeroProfileDetail.classList.remove('hidden');
        }
      };

      const closeHeroDetailModal = () => {
        if (modalHeroProfileDetail) {
          if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
            window.SlotsRPG.SoundEffects.play('MODAL_CLOSE');
          }
          modalHeroProfileDetail.classList.add('hidden');
        }
      };

      if (heroAvatarBox) heroAvatarBox.addEventListener('click', openHeroDetailModal);
      if (btnHeroProfileDetail) btnHeroProfileDetail.addEventListener('click', openHeroDetailModal);
      if (btnCloseHeroDetail) btnCloseHeroDetail.addEventListener('click', closeHeroDetailModal);
      if (btnCloseHeroDetailBottom) btnCloseHeroDetailBottom.addEventListener('click', closeHeroDetailModal);
      if (modalHeroProfileDetail) {
        modalHeroProfileDetail.addEventListener('click', (e) => {
          if (e.target === modalHeroProfileDetail) closeHeroDetailModal();
        });
      }

      if (btnOpenTitleModalFromDetail) {
        btnOpenTitleModalFromDetail.addEventListener('click', () => {
          closeHeroDetailModal();
          const heroProfileTitle = document.getElementById('hero-profile-title');
          if (heroProfileTitle) heroProfileTitle.click();
        });
      }

      CharacterUI.renderEquipmentSlots = renderEquipmentSlots;
      CharacterUI.renderBagGrid = renderBagGrid;
      CharacterUI.renderBossRadarPanel = renderBossRadarPanel;
      CharacterUI.updateBagActionButtons = updateBagActionButtons;
      CharacterUI.updateQuickEquipButtonState = updateQuickEquipButtonState;
      CharacterUI.quickEquipBestGear = quickEquipBestGear;
      CharacterUI.executeBagMerge = executeBagMerge;
      CharacterUI.playTribulationCeremony = playTribulationCeremony;

      window.getSlotDisplayName = getSlotDisplayName;
      window.renderEquipmentSlots = renderEquipmentSlots;
      window.renderBagGrid = renderBagGrid;
      window.renderBossRadarPanel = renderBossRadarPanel;
      window.quickEquipBestGear = quickEquipBestGear;
      window.executeBagMerge = executeBagMerge;
      window.playTribulationCeremony = playTribulationCeremony;
    }
  };

  window.SlotsRPG.UI.CharacterUI = CharacterUI;
})();
