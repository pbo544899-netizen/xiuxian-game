/**
 * DragonSpoutRenderer.js - 周天神龙 · 吐宝入匣 (左右宝物列表) 节奏与轨迹渲染引擎
 * 核心节奏：
 * 1. 龙头含光蓄势 (0.2s)
 * 2. 依次朝左侧神兵宝匣、右侧灵材宝匣喷吐灵球轨迹 (顺序打击与槽位震爆)
 * 3. 待全部奖励喷吐入格并完全呈现后，才触发下一步结算回调，保障清晰爽快的游戏节奏感
 */
window.SlotsRPG = window.SlotsRPG || {};

(function() {
  class DragonSpoutRenderer {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas ? canvas.getContext('2d') : null;
      this.isSpinning = false;
      this.floatingTexts = [];
      this.particles = [];
      this.animFrameId = null;

      // 视觉锚点坐标
      this.dragonMouth = { x: 0, y: 0 };
      this.bagLeftTarget = { x: 0, y: 0 };
      this.bagRightTarget = { x: 0, y: 0 };

      // 吐宝飞弹轨迹队列
      this.spoutProjectiles = [];

      this.worldTier = 1;

      this._initResize();
      this._startLoop();
    }

    _initResize() {
      if (!this.canvas) return;
      const updateSize = () => {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        if (rect.width <= 0) return;
        const dpr = window.devicePixelRatio || 1;
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        if (this.ctx) {
          this.ctx.setTransform(1, 0, 0, 1, 0, 0);
          this.ctx.scale(dpr, dpr);
        }

        // 计算龙头口部及12格宝萃展示区的物理相对坐标 (适应放大后的神龙法相)
        this.dragonMouth = { x: this.width * 0.5, y: 135 };
        this.showcaseTargetA = { x: this.width * 0.35, y: 245 };
        this.showcaseTargetB = { x: this.width * 0.65, y: 245 };
      };
      this.updateSize = updateSize;

      window.addEventListener('resize', updateSize);
      setTimeout(updateSize, 100);
      updateSize();
    }

    /**
     * 实时获取目标格子的精确坐标
     */
    _getSlotCoordinates(slotId, fallback) {
      const el = document.getElementById(slotId);
      if (!el || !this.canvas) return fallback;
      const slotRect = el.getBoundingClientRect();
      const canvasRect = this.canvas.getBoundingClientRect();
      return {
        x: (slotRect.left + slotRect.width * 0.5) - canvasRect.left,
        y: (slotRect.top + slotRect.height * 0.5) - canvasRect.top
      };
    }

    /**
     * 开始引龙吐宝蓄力
     */
    startSpin(options = {}) {
      this.isSpinning = true;
      this.spoutProjectiles = [];

      if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('REEL_SPIN');
      }

      const headEl = document.getElementById('dragon-head-sprite');
      if (headEl) {
        headEl.classList.add('charging');
      }

      // 龙头灵机灌注高光反馈
      const headBox = document.querySelector('.dragon-head-box');
      if (headBox) {
        headBox.classList.remove('infusing');
        void headBox.offsetWidth;
        headBox.classList.add('infusing');
        setTimeout(() => headBox.classList.remove('infusing'), 700);
      }

      // 生成口部聚气粒子
      for (let i = 0; i < 28; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 55;
        this.particles.push({
          x: this.dragonMouth.x + Math.cos(angle) * dist,
          y: this.dragonMouth.y + Math.sin(angle) * dist,
          vx: -Math.cos(angle) * 3.2,
          vy: -Math.sin(angle) * 3.2,
          life: 1.0,
          decay: 0.05 + Math.random() * 0.03,
          color: Math.random() < 0.5 ? '#00e5ff' : '#ffd700',
          size: 2.5 + Math.random() * 3.5
        });
      }

      // 灵机灌注：生成自下方控制区拔地而起、垂直注入龙口的灵光光束粒子流！
      for (let i = 0; i < 22; i++) {
        const startX = (this.width || 360) * 0.5 + (Math.random() - 0.5) * 100;
        const startY = (this.height || 400) * 0.9 + Math.random() * 20;
        const targetX = this.dragonMouth.x + (Math.random() - 0.5) * 16;
        const targetY = this.dragonMouth.y + (Math.random() - 0.5) * 10;
        const dx = targetX - startX;
        const dy = targetY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = 8 + Math.random() * 6;

        this.particles.push({
          x: startX,
          y: startY,
          vx: (dx / dist) * speed,
          vy: (dy / dist) * speed,
          life: 1.0,
          decay: 0.04 + Math.random() * 0.02,
          color: Math.random() < 0.65 ? '#00e5ff' : '#ffd700',
          size: 3 + Math.random() * 3.5
        });
      }
    }

    /**
     * 出货分析：判定本次掉落中是否存在高光极品 (用于驱动戏剧性刹车与蓄能变奏)
     */
    _analyzeSpinLoot(spinResult) {
      if (!spinResult) return { hasEpic: false, epicItem: null, epicSide: null };
      const left = spinResult.leftCabinet;
      const right = spinResult.rightCabinet;

      let hasEpic = false;
      let epicItem = null;
      let epicSide = null; // 'left' or 'right'

      if (left) {
        if (left.type === 'battle' || left.type === 'bonus' || left.type === 'sect') {
          hasEpic = true;
          epicItem = left;
          epicSide = 'left';
        } else if (left.type === 'equip') {
          const q = (left.item && (left.item.quality || left.item.qualityCode) || 'Q1').toUpperCase();
          const isHighQ = ['Q4', 'Q5', 'Q6', 'Q7', 'Q8'].includes(q);
          const isPowerUp = left.isUpgrade || (left.powerDiff && left.powerDiff > 0);
          if (isHighQ || isPowerUp || left.isLuckyBurst || spinResult.isGrandSpin) {
            hasEpic = true;
            epicItem = left;
            epicSide = 'left';
          }
        }
      }

      if (!hasEpic && right) {
        if (right.isCrit || right.isGrandSpin || (right.quality && ['Q4', 'Q5', 'Q6'].includes(String(right.quality).toUpperCase()))) {
          hasEpic = true;
          epicItem = right;
          epicSide = 'right';
        }
      }

      return { hasEpic, epicItem, epicSide };
    }

    _getLootEpicColor(item) {
      if (!item) return '#ffd700';
      if (item.type === 'battle') return '#ff4d4f';
      if (item.type === 'bonus') return '#ffd700';
      if (item.type === 'sect') return '#bb9af7';
      if (item.type === 'equip' && item.item) {
        return item.item.qualityColor || '#ffd700';
      }
      return item.qualityColor || '#ffd700';
    }

    /**
     * 针对【连续性抽奖】深度融合【节奏感与期待感】的双轨动态吐宝引擎
     * 1. 常规流转 (无极品)：毫秒级极速流光倾泻 (总耗时 ~450ms)，保证连续抽奖行云流水、绝不卡顿
     * 2. 极品出货：常规物先落，随后流水线突然刹车停顿 350ms 聚灵充能 (Drama Pause)，再轰出高能金芒重音砸地 (总耗时 ~1150ms)
     */
    stopSpin(spinResult, callback) {
      const headEl = document.getElementById('dragon-head-sprite');
      const { hasEpic, epicItem, epicSide } = this._analyzeSpinLoot(spinResult);

      const targetCoordA = this._getSlotCoordinates('dragon-slot-0', this.showcaseTargetA);
      const targetCoordB = this._getSlotCoordinates('dragon-slot-1', this.showcaseTargetB);
      const now = performance.now();

      if (!hasEpic) {
        // ==========================================
        // 模式 A：常规流水线连抽极速倾泻 (Total ~450ms)
        // ==========================================
        if (headEl) {
          headEl.classList.remove('charging', 'epic-charging');
          headEl.classList.add('spouting');
          setTimeout(() => headEl.classList.remove('spouting'), 360);
        }

        const shotDuration = 220; // 极速流光 220ms
        const shotDelay = 100;    // 次发仅延后 100ms，连珠喷吐

        // 第1发：右侧材料 (灵石/丹药) 预测槽位落点，落地前不修改临时背包
        let predictedIdx1 = 0;
        if (window.gameManager && window.gameManager.dragonCabinetManager) {
          predictedIdx1 = window.gameManager.dragonCabinetManager.predictTargetSlotIndex('right');
        }
        const targetSlot1 = `dragon-slot-${predictedIdx1}`;
        const targetCoord1 = this._getSlotCoordinates(targetSlot1, targetCoordB);

        const proj1 = {
          startX: this.dragonMouth.x + 12,
          startY: this.dragonMouth.y,
          endX: targetCoord1.x,
          endY: targetCoord1.y,
          controlX: this.dragonMouth.x + 35,
          controlY: this.dragonMouth.y + 35,
          startTime: now,
          duration: shotDuration,
          color: '#52c41a',
          targetSlotId: targetSlot1,
          impactFired: false
        };

        // 实体宝物飞行动画从龙口喷向槽位
        this._spawnSpoutFlyer(spinResult.rightCabinet, targetSlot1, shotDuration, 0, false);

        // 第1发落地瞬间：才真正将宝物揭晓放入临时背包并触发爆破显现动效
        setTimeout(() => {
          let actualIdx1 = predictedIdx1;
          if (window.gameManager && window.gameManager.dragonCabinetManager) {
            actualIdx1 = window.gameManager.dragonCabinetManager.revealSlot('right', { isBump: true });
            window.gameManager.dragonCabinetManager.revealSlotImpact(actualIdx1, false);
          }
          this._triggerSlotImpact(`dragon-slot-${actualIdx1}`, '#52c41a');
          if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
            window.SlotsRPG.SoundEffects.play('CLICK');
          }
        }, shotDuration);

        // 第2发：左侧常规物 (延后 shotDelay 喷出)
        setTimeout(() => {
          let predictedIdx2 = 0;
          if (window.gameManager && window.gameManager.dragonCabinetManager) {
            predictedIdx2 = window.gameManager.dragonCabinetManager.predictTargetSlotIndex('left');
          }
          const targetSlot2 = `dragon-slot-${predictedIdx2}`;
          const targetCoord2 = this._getSlotCoordinates(targetSlot2, targetCoordA);

          const proj2 = {
            startX: this.dragonMouth.x - 12,
            startY: this.dragonMouth.y,
            endX: targetCoord2.x,
            endY: targetCoord2.y,
            controlX: this.dragonMouth.x - 35,
            controlY: this.dragonMouth.y + 35,
            startTime: performance.now(),
            duration: shotDuration,
            color: '#00e5ff',
            targetSlotId: targetSlot2,
            impactFired: false
          };
          this.spoutProjectiles.push(proj2);

          // 实体宝物飞行动画
          this._spawnSpoutFlyer(spinResult.leftCabinet, targetSlot2, shotDuration, 0, false);

          // 第2发落地瞬间：才真正将宝物揭晓放入临时背包
          setTimeout(() => {
            let actualIdx2 = predictedIdx2;
            if (window.gameManager && window.gameManager.dragonCabinetManager) {
              actualIdx2 = window.gameManager.dragonCabinetManager.revealSlot('left', { isBump: true });
              window.gameManager.dragonCabinetManager.revealSlotImpact(actualIdx2, false);
            }
            this._triggerSlotImpact(`dragon-slot-${actualIdx2}`, '#00e5ff');
            if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
              window.SlotsRPG.SoundEffects.play('REEL_STOP');
            }
          }, shotDuration);
        }, shotDelay);

        this.spoutProjectiles = [proj1];

        // 常规流转结清 (总耗时 ~480ms)
        const totalDuration = shotDelay + shotDuration + 160;
        setTimeout(() => {
          this.isSpinning = false;
          window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('DRAGON_SPOUT_ALL_REVEALED', spinResult);
          if (typeof callback === 'function') callback(spinResult);
        }, totalDuration);

      } else {
        // ==========================================
        // 模式 B：极品高光骤停与破空大爆 (Total ~1200ms)
        // ==========================================
        const normalSide = (epicSide === 'left') ? 'right' : 'left';
        const normalItem = (epicSide === 'left') ? spinResult.rightCabinet : spinResult.leftCabinet;
        const epicTargetCoord = (epicSide === 'left') ? targetCoordA : targetCoordB;
        const normalTargetCoord = (epicSide === 'left') ? targetCoordB : targetCoordA;

        // 1. 常规耗材率先喷出入格铺垫 (200ms)
        const normalDuration = 200;
        let predictedIdxNormal = 0;
        if (window.gameManager && window.gameManager.dragonCabinetManager) {
          predictedIdxNormal = window.gameManager.dragonCabinetManager.predictTargetSlotIndex(normalSide);
        }
        const normalSlotId = `dragon-slot-${predictedIdxNormal}`;
        const normalSlotCoord = this._getSlotCoordinates(normalSlotId, normalTargetCoord);

        const projNormal = {
          startX: this.dragonMouth.x + (epicSide === 'left' ? 12 : -12),
          startY: this.dragonMouth.y,
          endX: normalSlotCoord.x,
          endY: normalSlotCoord.y,
          controlX: this.dragonMouth.x + (epicSide === 'left' ? 35 : -35),
          controlY: this.dragonMouth.y + 35,
          startTime: now,
          duration: normalDuration,
          color: '#00e5ff',
          targetSlotId: normalSlotId,
          impactFired: false
        };

        this.spoutProjectiles = [projNormal];
        this._spawnSpoutFlyer(normalItem, normalSlotId, normalDuration, 0, false);

        // 常规物落地瞬间：才真正将宝物揭晓放入临时背包
        setTimeout(() => {
          let actualIdxNormal = predictedIdxNormal;
          if (window.gameManager && window.gameManager.dragonCabinetManager) {
            actualIdxNormal = window.gameManager.dragonCabinetManager.revealSlot(normalSide, { isBump: true });
            window.gameManager.dragonCabinetManager.revealSlotImpact(actualIdxNormal, false);
          }
          this._triggerSlotImpact(`dragon-slot-${actualIdxNormal}`, '#00e5ff');
        }, normalDuration);

        // 2. 戏剧性刹车顿挫 (Drama Pause ~350ms) 龙头聚灵狂暴蓄能！
        const brakeDelay = normalDuration;
        setTimeout(() => {
          if (headEl) {
            headEl.classList.remove('charging', 'spouting');
            headEl.classList.add('epic-charging');
          }
          if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
            window.SlotsRPG.SoundEffects.play('NEAR_MISS', 1);
          }
          // 向心旋转内聚粒子 (黑洞吸能特效)
          for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 45 + Math.random() * 65;
            this.particles.push({
              x: this.dragonMouth.x + Math.cos(angle) * dist,
              y: this.dragonMouth.y + Math.sin(angle) * dist,
              vx: -Math.cos(angle) * 4.8,
              vy: -Math.sin(angle) * 4.8,
              life: 0.8,
              decay: 0.04,
              color: Math.random() < 0.65 ? '#ffd700' : '#c084fc',
              size: 3 + Math.random() * 3.5
            });
          }
        }, brakeDelay);

        // 3. 极品破空怒喷 (在 200 + 350 = 550ms 发射)
        const epicShotStartTime = brakeDelay + 350;
        const epicShotDuration = 280;
        const epicColor = this._getLootEpicColor(epicItem);
        let predictedIdxEpic = 0;

        setTimeout(() => {
          if (headEl) {
            headEl.classList.remove('epic-charging');
            headEl.classList.add('spouting');
            setTimeout(() => headEl.classList.remove('spouting'), 500);
          }

          if (window.gameManager && window.gameManager.dragonCabinetManager) {
            predictedIdxEpic = window.gameManager.dragonCabinetManager.predictTargetSlotIndex(epicSide);
          }
          const epicSlotId = `dragon-slot-${predictedIdxEpic}`;
          const epicSlotCoord = this._getSlotCoordinates(epicSlotId, epicTargetCoord);

          const projEpic = {
            startX: this.dragonMouth.x,
            startY: this.dragonMouth.y,
            endX: epicSlotCoord.x,
            endY: epicSlotCoord.y,
            controlX: this.dragonMouth.x + (epicSide === 'left' ? -25 : 25),
            controlY: this.dragonMouth.y + 25,
            startTime: performance.now(),
            duration: epicShotDuration,
            color: epicColor,
            isEpic: true,
            targetSlotId: epicSlotId,
            impactFired: false
          };

          this.spoutProjectiles.push(projEpic);
          this._spawnSpoutFlyer(epicItem, epicSlotId, epicShotDuration, 0, true);
        }, epicShotStartTime);

        // 4. 极品砸地轰鸣与震屏：落地时才真正揭晓入格
        const epicImpactTime = epicShotStartTime + epicShotDuration; // ~830ms
        setTimeout(() => {
          let actualIdxEpic = predictedIdxEpic;
          if (window.gameManager && window.gameManager.dragonCabinetManager) {
            actualIdxEpic = window.gameManager.dragonCabinetManager.revealSlot(epicSide, { isEpic: true });
            window.gameManager.dragonCabinetManager.revealSlotImpact(actualIdxEpic, true);
          }
          const finalSlotId = `dragon-slot-${actualIdxEpic}`;
          this._triggerSlotImpact(finalSlotId, epicColor, true);

          // 触发震屏与仙乐音效
          const viewSlots = document.getElementById('view-slots');
          if (viewSlots) {
            viewSlots.classList.remove('view-slots-shake');
            void viewSlots.offsetWidth;
            viewSlots.classList.add('view-slots-shake');
            setTimeout(() => viewSlots.classList.remove('view-slots-shake'), 300);
          }
          if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
            window.SlotsRPG.SoundEffects.play('WIN_LINE');
          }
          window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('DRAGON_SLOT_REVEAL', { side: epicSide, index: actualIdxEpic, isEpic: true });
        }, epicImpactTime);

        // 5. 极品结算展示完毕 (~1200ms)
        const totalDuration = epicImpactTime + 370;
        setTimeout(() => {
          this.isSpinning = false;
          window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('DRAGON_SPOUT_ALL_REVEALED', spinResult);
          if (typeof callback === 'function') callback(spinResult);
        }, totalDuration);
      }
    }

    /**
     * 周天十连抽 · 瞬时聚爆倾泻动效 (方案 A)
     * 1. 龙头高能剧烈充能 (260ms)
     * 2. 10连发灵光法宝弧形弹道如流星暴雨般喷出，密集降落至 12 格天机宝萃
     * 3. 槽位连环金光激荡，并在 ~850ms 处轰出十连结算高光看板与飘字
     */
    startTenPullBurst(summary, callback) {
      this.isSpinning = true;
      const headEl = document.getElementById('dragon-head-sprite');
      const hasEpic = !!summary.hasEpic;

      // 1. 龙头高能蓄力充能
      if (headEl) {
        headEl.classList.remove('spouting');
        headEl.classList.add(hasEpic ? 'epic-charging' : 'charging');
      }
      if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play(hasEpic ? 'REEL_SPIN' : 'CLICK');
      }

      const chargeDelay = 260; // 260ms 聚灵充能
      const volleyCount = Math.min(12, summary.itemsCount || 10);

      setTimeout(() => {
        if (headEl) {
          headEl.classList.remove('charging', 'epic-charging');
          headEl.classList.add('spouting');
          setTimeout(() => headEl.classList.remove('spouting'), 450);
        }

        // 2. 连环十发流星弹道如扇形散开直轰 12 格
        const flightDuration = 260;
        const stagger = 40; // 每发间隔 40ms，节奏紧凑更具冲击力
        const insertedItemsSet = new Set();

        for (let i = 0; i < volleyCount; i++) {
          const delay = i * stagger;
          const rawItem = (summary.allLootItems && summary.allLootItems[i]) || null;
          const targetSlotId = `dragon-slot-${i % 12}`;
          const targetCoord = this._getSlotCoordinates(targetSlotId, {
            x: (this.width || 360) * (0.16 + (i % 6) * 0.14),
            y: (this.height || 400) * (i < 6 ? 0.65 : 0.85)
          });

          const isItemEpic = (i === 0 && hasEpic);
          const orbColor = isItemEpic ? '#ffd700' : (i % 2 === 0 ? '#00e5ff' : '#38ef7d');

          // 生成画布飞弹与实体宝物飞行动画
          setTimeout(() => {
            const curNow = performance.now();
            this.spoutProjectiles.push({
              startX: this.dragonMouth.x + (Math.random() - 0.5) * 16,
              startY: this.dragonMouth.y,
              endX: targetCoord.x,
              endY: targetCoord.y,
              controlX: this.dragonMouth.x + (i % 2 === 0 ? -30 : 30) + (Math.random() - 0.5) * 20,
              controlY: this.dragonMouth.y + 40,
              startTime: curNow,
              duration: flightDuration,
              color: orbColor,
              targetSlotId: targetSlotId,
              isEpic: isItemEpic,
              impactFired: false
            });

            if (rawItem) {
              this._spawnSpoutFlyer(rawItem, targetSlotId, flightDuration, 0, isItemEpic);
            }

            // 槽位落地瞬间：才真正将该份宝物揭晓并呈现到临时背包对应槽位！
            setTimeout(() => {
              if (rawItem && window.gameManager && window.gameManager.dragonCabinetManager) {
                const insertedIdx = window.gameManager.dragonCabinetManager.addItemFromSpout(rawItem, {
                  silentFloating: true,
                  isTenPull: true,
                  isEpic: isItemEpic
                });
                insertedItemsSet.add(i);
                this._triggerSlotImpact(`dragon-slot-${insertedIdx}`, orbColor, isItemEpic);
              } else {
                this._triggerSlotImpact(targetSlotId, orbColor, isItemEpic);
              }

              if (window.SlotsRPG && window.SlotsRPG.SoundEffects && i % 3 === 0) {
                window.SlotsRPG.SoundEffects.play('CLICK');
              }
            }, flightDuration);

          }, delay);
        }

        // 3. 终局结算与多巴胺爆发 (全部落定后)
        const totalWait = volleyCount * stagger + flightDuration + 120;
        setTimeout(() => {
          this.isSpinning = false;

          // 兜底校验：确保十连所有产出均稳妥入库
          if (summary.allLootItems && window.gameManager && window.gameManager.dragonCabinetManager) {
            summary.allLootItems.forEach((item, idx) => {
              if (!insertedItemsSet.has(idx)) {
                window.gameManager.dragonCabinetManager.addItemFromSpout(item, {
                  silentFloating: true,
                  isTenPull: true
                });
              }
            });
          }

          // 震屏与高光音效
          if (hasEpic) {
            const viewSlots = document.getElementById('view-slots');
            if (viewSlots) {
              viewSlots.classList.remove('view-slots-shake');
              void viewSlots.offsetWidth;
              viewSlots.classList.add('view-slots-shake');
              setTimeout(() => viewSlots.classList.remove('view-slots-shake'), 300);
            }
            if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
              window.SlotsRPG.SoundEffects.play('TREASURE_BURST');
            }
          }

          // 飘字汇总看板
          if (summary.bestEquip && summary.maxPowerDiff > 0) {
            this.addFloatingText(`⚡ 周天十连大爆！斩获【${summary.bestEquip.name}】！`, '#ffd700');
            this.addFloatingText(`⚡ 战力飙升 +${summary.maxPowerDiff} ⬆`, '#38ef7d');
          } else if (summary.bestEquip) {
            this.addFloatingText(`⚡ 周天十连大爆！斩获【${summary.bestEquip.name}】！`, '#ffd700');
          } else {
            this.addFloatingText(`✨ 周天十连圆满：获宝 10 份！`, '#ffd700');
          }

          // 触发全部揭晓完成事件
          window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('DRAGON_SPOUT_ALL_REVEALED', summary);

          if (typeof callback === 'function') callback();
        }, totalWait);

      }, chargeDelay);
    }

    _triggerSlotImpact(slotId, glowColor, isEpic = false) {
      const el = document.getElementById(slotId);
      if (!el) return;

      el.classList.add(isEpic ? 'slot-epic-burst' : 'impact-burst');
      setTimeout(() => el.classList.remove('impact-burst'), 500);

      const coord = this._getSlotCoordinates(slotId, { x: this.width * 0.5, y: this.height * 0.65 });

      // 生成槽位爆发粒子
      const particleCount = isEpic ? 38 : 20;
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (isEpic ? 3.5 : 2) + Math.random() * (isEpic ? 5.5 : 3.5);
        this.particles.push({
          x: coord.x,
          y: coord.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          life: 1.0,
          decay: 0.04 + Math.random() * 0.04,
          color: glowColor,
          size: (isEpic ? 3.5 : 2.5) + Math.random() * 3.5
        });
      }
    }
    /**
     * 生成从龙口喷出、沿抛物线掉落砸入目标格子槽位的 DOM 实体宝萃飞行动画
     */
    _spawnSpoutFlyer(item, targetSlotId, durationMs = 240, delayMs = 0, isEpic = false) {
      if (!item) return;

      // 界面守卫：若当前不在天机推演面板 (例如玩家在角色修真或洞天)，静默跳过视觉飞行动画
      const viewSlots = document.getElementById('view-slots');
      if (!viewSlots || !viewSlots.classList.contains('active')) {
        return;
      }

      setTimeout(() => {
        // 延时触发时再次检查界面，若玩家在此期间切换至角色修真等其它面板，立即放弃生成飞行动画
        const viewSlotsNow = document.getElementById('view-slots');
        if (!viewSlotsNow || !viewSlotsNow.classList.contains('active')) {
          return;
        }

        // 1. 获取龙头龙嘴屏幕起点
        const headEl = document.getElementById('dragon-head-sprite') || document.querySelector('.dragon-head-box');
        let startX = window.innerWidth * 0.5;
        let startY = window.innerHeight * 0.22;
        if (headEl) {
          const hRect = headEl.getBoundingClientRect();
          if (hRect.width > 0 && hRect.height > 0) {
            startX = hRect.left + hRect.width * 0.5;
            startY = hRect.top + hRect.height * 0.7;
          }
        }

        // 2. 获取终点槽位元素与屏幕坐标
        const targetSlotEl = document.getElementById(targetSlotId) || document.getElementById('dragon-slot-0');
        let endX = window.innerWidth * 0.5;
        let endY = window.innerHeight * 0.6;
        if (targetSlotEl) {
          const sRect = targetSlotEl.getBoundingClientRect();
          if (sRect.width > 0 && sRect.height > 0) {
            endX = sRect.left + sRect.width * 0.5;
            endY = sRect.top + sRect.height * 0.5;
          }
        }

        // 3. 构造飞行动画 DOM 宝物元素，挂载至 view-slots 内部专属层中，确保切面板时自动隐藏
        const flyerLayer = document.getElementById('dragon-spout-flyer-layer') || viewSlotsNow;
        const flyer = document.createElement('div');
        flyer.className = `dragon-spout-flyer ${isEpic ? 'epic' : ''}`;

        let iconSrc = 'assets/symbols/SYM_06.png';
        let qColor = isEpic ? '#ffd700' : '#00e5ff';
        if (item.icon) iconSrc = item.icon;
        else if (item.item && item.item.icon) iconSrc = item.item.icon;
        else if (item.type === 'energy') iconSrc = 'assets/symbols/SYM_05.png';
        else if (item.type === 'battle') iconSrc = 'assets/symbols/SYM_12.png';
        else if (item.type === 'pill') iconSrc = 'assets/symbols/SYM_07.png';

        if (item.qualityColor) qColor = item.qualityColor;
        else if (item.item && item.item.qualityColor) qColor = item.item.qualityColor;

        flyer.style.borderColor = qColor;
        flyer.style.boxShadow = `0 0 16px ${qColor}, inset 0 0 8px rgba(255, 255, 255, 0.4)`;

        const img = document.createElement('img');
        img.src = iconSrc;
        img.alt = item.name || '宝萃';
        flyer.appendChild(img);
        flyerLayer.appendChild(flyer);

        // 4. 生成贝塞尔抛物线关键帧动画 (从龙口拱出下坠砸入格子)
        const ctrlX = (startX + endX) * 0.5 + (startX > endX ? -35 : 35);
        const ctrlY = Math.min(startY, endY) - 30;
        const steps = 16;
        const keyframes = [];

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const inv = 1 - t;
          const curX = inv * inv * startX + 2 * inv * t * ctrlX + t * t * endX;
          const curY = inv * inv * startY + 2 * inv * t * ctrlY + t * t * endY;
          const scale = (t < 0.25) ? (0.35 + t * 3.8) : (1.2 - (t - 0.25) * 0.22);
          const rot = (t * 360 * (startX > endX ? -1 : 1)).toFixed(1) + 'deg';
          keyframes.push({
            transform: `translate3d(${curX}px, ${curY}px, 0) translate(-50%, -50%) scale(${scale}) rotate(${rot})`,
            opacity: t < 0.05 ? t * 20 : (t > 0.95 ? (1 - t) * 20 : 1)
          });
        }

        if (flyer.animate) {
          const anim = flyer.animate(keyframes, {
            duration: durationMs,
            easing: 'cubic-bezier(0.2, 0, 0.2, 1)',
            fill: 'forwards'
          });
          anim.onfinish = () => {
            flyer.remove();
          };
        } else {
          setTimeout(() => flyer.remove(), durationMs);
        }
      }, delayMs);
    }


    /**
     * 飘字提示系统 - 级联防重叠队列与暗金仙韵胶囊底板
     */
    addFloatingText(text, color = '#ffd700') {
      if ((!this.width || this.width === 0) && this.updateSize) {
        this.updateSize();
      }
      const ROW_SPACING = 32;

      // 1. 若当前已有飘字，将其向上平移留出充足垂直间距，彻底消除文字重叠
      for (const ft of this.floatingTexts) {
        ft.y -= ROW_SPACING;
        if (ft.life > 0.65) {
          ft.life = 0.65;
        }
      }

      // 2. 限制同屏最多保留 2 条飘字（旧字在上，新字在下）
      while (this.floatingTexts.length >= 2) {
        this.floatingTexts.shift();
      }

      // 3. 压入最新飘字
      const baseY = (this.height || 400) * 0.46;
      this.floatingTexts.push({
        text,
        color,
        x: (this.width || 360) * 0.5,
        y: baseY,
        opacity: 1.0,
        vy: -0.65,
        life: 1.0,
        decay: 0.012
      });
    }

    _startLoop() {
      const loop = (timestamp) => {
        this._update(timestamp);
        this._render(timestamp);
        this.animFrameId = requestAnimationFrame(loop);
      };
      this.animFrameId = requestAnimationFrame(loop);
    }

    _update(timestamp) {
      // 1. 更新飘字
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.y += ft.vy;
        ft.life -= ft.decay;
        ft.opacity = Math.max(0, ft.life);
        if (ft.life <= 0) {
          this.floatingTexts.splice(i, 1);
        }
      }

      // 2. 更新通用粒子
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
        }
      }

      // 3. 更新弹道轨迹
      if (this.spoutProjectiles.length > 0) {
        for (let i = this.spoutProjectiles.length - 1; i >= 0; i--) {
          const proj = this.spoutProjectiles[i];
          if (timestamp < proj.startTime) continue; // 延时发射控制

          const elapsed = timestamp - proj.startTime;
          const t = Math.min(1.0, Math.max(0, elapsed / proj.duration));

          // 二次贝塞尔曲线插值
          const invT = 1 - t;
          proj.currentX = invT * invT * proj.startX + 2 * invT * t * proj.controlX + t * t * proj.endX;
          proj.currentY = invT * invT * proj.startY + 2 * invT * t * proj.controlY + t * t * proj.endY;

          // 拖尾火花
          if (t < 1.0 && Math.random() < 0.75) {
            this.particles.push({
              x: proj.currentX + (Math.random() - 0.5) * 6,
              y: proj.currentY + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5,
              life: 0.6,
              decay: 0.06,
              color: proj.color,
              size: 2 + Math.random() * 2.5
            });
          }

          if (t >= 1.0) {
            this.spoutProjectiles.splice(i, 1);
          }
        }
      }
    }

    _render(timestamp) {
      if (!this.ctx) return;
      if ((!this.width || this.width === 0) && this.updateSize) {
        this.updateSize();
      }
      if (!this.width) return;
      this.ctx.clearRect(0, 0, this.width, this.height);

      // 1. 绘制落入双宝匣格子的弧形灵球
      for (const proj of this.spoutProjectiles) {
        if (proj.currentX !== undefined) {
          this.ctx.save();
          // 外发光环 (极品大货光晕更宏大灿烂)
          const auraRadius = proj.isEpic ? 28 : 18;
          const coreRadius = proj.isEpic ? 6 : 4;
          const grad = this.ctx.createRadialGradient(
            proj.currentX, proj.currentY, 2,
            proj.currentX, proj.currentY, auraRadius
          );
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.35, proj.color);
          if (proj.isEpic) {
            grad.addColorStop(0.7, '#ffd700');
          }
          grad.addColorStop(1, 'transparent');

          this.ctx.fillStyle = grad;
          this.ctx.beginPath();
          this.ctx.arc(proj.currentX, proj.currentY, auraRadius, 0, Math.PI * 2);
          this.ctx.fill();

          // 核心光核
          this.ctx.fillStyle = '#ffffff';
          this.ctx.beginPath();
          this.ctx.arc(proj.currentX, proj.currentY, coreRadius, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        }
      }

      // 2. 绘制粒子
      for (const p of this.particles) {
        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, p.life);
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }

      // 3. 绘制居中高光浮字（带防遮挡半透胶囊底板与仙韵边框，彻底杜绝混叠）
      for (const ft of this.floatingTexts) {
        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, Math.min(1, ft.opacity));
        this.ctx.font = 'bold 15px "STKaiti", "KaiTi", "Songti SC", serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const metrics = this.ctx.measureText(ft.text);
        const textW = metrics.width;
        const padX = 14;
        const boxW = Math.max(76, textW + padX * 2);
        const boxH = 26;
        const boxX = ft.x - boxW / 2;
        const boxY = ft.y - boxH / 2;
        const radius = 13;

        // 绘制暗色玄金半透胶囊底板
        this.ctx.beginPath();
        if (this.ctx.roundRect) {
          this.ctx.roundRect(boxX, boxY, boxW, boxH, radius);
        } else {
          this.ctx.rect(boxX, boxY, boxW, boxH);
        }
        this.ctx.fillStyle = 'rgba(8, 14, 24, 0.86)';
        this.ctx.shadowColor = ft.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fill();

        // 细微仙灵光晕描边
        this.ctx.strokeStyle = ft.color;
        this.ctx.lineWidth = 1.2;
        this.ctx.stroke();

        // 绘制高亮文字
        this.ctx.fillStyle = ft.color;
        this.ctx.shadowBlur = 4;
        this.ctx.fillText(ft.text, ft.x, ft.y);
        this.ctx.restore();
      }
    }

    setTheme(tier) {
      this.worldTier = tier;
    }
  }

  window.SlotsRPG.DragonSpoutRenderer = DragonSpoutRenderer;
})();
