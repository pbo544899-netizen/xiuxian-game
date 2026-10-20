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
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        if (this.ctx) {
          this.ctx.scale(dpr, dpr);
        }

        // 计算龙头口部及12格宝萃展示区的物理相对坐标 (适应放大后的神龙法相)
        this.dragonMouth = { x: this.width * 0.5, y: 135 };
        this.showcaseTargetA = { x: this.width * 0.35, y: 245 };
        this.showcaseTargetB = { x: this.width * 0.65, y: 245 };
      };

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

        const shotDuration = 190; // 极速流光 190ms
        const shotDelay = 85;     // 次发仅延后 85ms，连珠喷吐

        // 第1发：右侧材料 (灵石/丹药)
        const proj1 = {
          startX: this.dragonMouth.x + 12,
          startY: this.dragonMouth.y,
          endX: targetCoordB.x,
          endY: targetCoordB.y,
          controlX: this.dragonMouth.x + 35,
          controlY: this.dragonMouth.y + 35,
          startTime: now,
          duration: shotDuration,
          color: '#52c41a',
          targetSlotId: 'dragon-slot-1',
          impactFired: false
        };

        // 第2发：左侧常规物
        const proj2 = {
          startX: this.dragonMouth.x - 12,
          startY: this.dragonMouth.y,
          endX: targetCoordA.x,
          endY: targetCoordA.y,
          controlX: this.dragonMouth.x - 35,
          controlY: this.dragonMouth.y + 35,
          startTime: now + shotDelay,
          duration: shotDuration,
          color: '#00e5ff',
          targetSlotId: 'dragon-slot-0',
          impactFired: false
        };

        this.spoutProjectiles = [proj1, proj2];

        // 第1发落地
        setTimeout(() => {
          let idx = 0;
          if (window.gameManager && window.gameManager.dragonCabinetManager) {
            idx = window.gameManager.dragonCabinetManager.revealSlot('right');
          }
          this._triggerSlotImpact(`dragon-slot-${idx}`, '#52c41a');
          if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
            window.SlotsRPG.SoundEffects.play('CLICK');
          }
        }, shotDuration);

        // 第2发落地
        setTimeout(() => {
          let idx = 0;
          if (window.gameManager && window.gameManager.dragonCabinetManager) {
            idx = window.gameManager.dragonCabinetManager.revealSlot('left');
          }
          this._triggerSlotImpact(`dragon-slot-${idx}`, '#00e5ff');
          if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
            window.SlotsRPG.SoundEffects.play('REEL_STOP');
          }
        }, shotDelay + shotDuration);

        // 常规流转结清 (短促驻留 160ms，总耗时 435ms)
        const totalDuration = shotDelay + shotDuration + 160;
        setTimeout(() => {
          this.isSpinning = false;
          window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('DRAGON_SPOUT_ALL_REVEALED', spinResult);
          if (typeof callback === 'function') callback(spinResult);
        }, totalDuration);

      } else {
        // ==========================================
        // 模式 B：极品高光骤停与破空大爆 (Total ~1150ms)
        // ==========================================
        const normalSide = (epicSide === 'left') ? 'right' : 'left';
        const epicTargetCoord = (epicSide === 'left') ? targetCoordA : targetCoordB;
        const normalTargetCoord = (epicSide === 'left') ? targetCoordB : targetCoordA;

        // 1. 常规耗材率先喷出入格铺垫 (170ms)
        const normalDuration = 170;
        const projNormal = {
          startX: this.dragonMouth.x + (epicSide === 'left' ? 12 : -12),
          startY: this.dragonMouth.y,
          endX: normalTargetCoord.x,
          endY: normalTargetCoord.y,
          controlX: this.dragonMouth.x + (epicSide === 'left' ? 35 : -35),
          controlY: this.dragonMouth.y + 35,
          startTime: now,
          duration: normalDuration,
          color: '#00e5ff',
          targetSlotId: epicSide === 'left' ? 'dragon-slot-1' : 'dragon-slot-0',
          impactFired: false
        };

        this.spoutProjectiles = [projNormal];

        // 常规物快速入格
        setTimeout(() => {
          let idx = 0;
          if (window.gameManager && window.gameManager.dragonCabinetManager) {
            idx = window.gameManager.dragonCabinetManager.revealSlot(normalSide);
          }
          this._triggerSlotImpact(`dragon-slot-${idx}`, '#00e5ff');
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

        // 3. 极品破空怒喷 (在 170 + 350 = 520ms 发射)
        const epicShotStartTime = brakeDelay + 350;
        const epicShotDuration = 270;
        const epicColor = this._getLootEpicColor(epicItem);

        setTimeout(() => {
          if (headEl) {
            headEl.classList.remove('epic-charging');
            headEl.classList.add('spouting');
            setTimeout(() => headEl.classList.remove('spouting'), 500);
          }

          const projEpic = {
            startX: this.dragonMouth.x,
            startY: this.dragonMouth.y,
            endX: epicTargetCoord.x,
            endY: epicTargetCoord.y,
            controlX: this.dragonMouth.x + (epicSide === 'left' ? -25 : 25),
            controlY: this.dragonMouth.y + 25,
            startTime: performance.now(),
            duration: epicShotDuration,
            color: epicColor,
            isEpic: true,
            targetSlotId: epicSide === 'left' ? 'dragon-slot-0' : 'dragon-slot-1',
            impactFired: false
          };

          this.spoutProjectiles.push(projEpic);
        }, epicShotStartTime);

        // 4. 极品砸地轰鸣与震屏
        const epicImpactTime = epicShotStartTime + epicShotDuration; // ~790ms
        setTimeout(() => {
          let insertedIdx = 0;
          if (window.gameManager && window.gameManager.dragonCabinetManager) {
            insertedIdx = window.gameManager.dragonCabinetManager.revealSlot(epicSide);
          }
          this._triggerSlotImpact(`dragon-slot-${insertedIdx}`, epicColor, true);

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
          window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('DRAGON_SLOT_REVEAL', { side: epicSide, index: insertedIdx, isEpic: true });
        }, epicImpactTime);

        // 5. 极品结算展示完毕 (~1160ms)
        const totalDuration = epicImpactTime + 370;
        setTimeout(() => {
          this.isSpinning = false;
          window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('DRAGON_SPOUT_ALL_REVEALED', spinResult);
          if (typeof callback === 'function') callback(spinResult);
        }, totalDuration);
      }
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
     * 飘字提示系统
     */
    addFloatingText(text, color = '#ffd700') {
      this.floatingTexts.push({
        text,
        color,
        x: (this.width || 360) * 0.5,
        y: (this.height || 400) * 0.48,
        opacity: 1.0,
        vy: -1.2,
        life: 1.0,
        decay: 0.016
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
      if (!this.ctx || !this.width) return;
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

      // 3. 绘制居中高光浮字
      for (const ft of this.floatingTexts) {
        this.ctx.save();
        this.ctx.globalAlpha = ft.opacity;
        this.ctx.font = 'bold 16px "STKaiti", "KaiTi", "Songti SC", serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = ft.color;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = ft.color;
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(ft.text, ft.x, ft.y);
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
