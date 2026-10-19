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

        // 计算龙头口部及左右双宝匣格子的物理相对坐标
        this.dragonMouth = { x: this.width * 0.5, y: 92 };
        this.bagLeftTarget = { x: this.width * 0.25, y: 172 };
        this.bagRightTarget = { x: this.width * 0.75, y: 172 };
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
    startSpin() {
      this.isSpinning = true;
      this.spoutProjectiles = [];

      const headEl = document.getElementById('dragon-head-sprite');
      if (headEl) {
        headEl.classList.add('charging');
      }

      // 生成口部聚气粒子
      for (let i = 0; i < 24; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 25 + Math.random() * 45;
        this.particles.push({
          x: this.dragonMouth.x + Math.cos(angle) * dist,
          y: this.dragonMouth.y + Math.sin(angle) * dist,
          vx: -Math.cos(angle) * 2.8,
          vy: -Math.sin(angle) * 2.8,
          life: 1.0,
          decay: 0.05 + Math.random() * 0.03,
          color: Math.random() < 0.5 ? '#00e5ff' : '#ffd700',
          size: 2 + Math.random() * 3
        });
      }
    }

    /**
     * 顺序吐出灵光落入双侧宝物列表格子 (节奏感驱动)
     * 1. 龙首昂起喷吐第1发 (左侧神兵格)
     * 2. 间隔 0.35s 喷吐第2发 (右侧灵材格)
     * 3. 待所有弹道到达爆破并展示完毕后 (1.05s)，才进入下一步决策或遭遇
     */
    stopSpin(spinResult, callback) {
      const headEl = document.getElementById('dragon-head-sprite');
      if (headEl) {
        headEl.classList.remove('charging');
        headEl.classList.add('spouting');
        setTimeout(() => headEl.classList.remove('spouting'), 700);
      }

      const leftCoord = this._getSlotCoordinates('bag-left-slot-0', this.bagLeftTarget);
      const rightCoord = this._getSlotCoordinates('bag-right-slot-0', this.bagRightTarget);

      const now = performance.now();
      const shotDuration = 380; // 单枚飞行时长 380ms

      // 第1发：飞向左侧【造化玄兵宝匣】
      const leftProj = {
        startX: this.dragonMouth.x - 12,
        startY: this.dragonMouth.y,
        endX: leftCoord.x,
        endY: leftCoord.y,
        controlX: this.dragonMouth.x - 50,
        controlY: 100,
        startTime: now,
        duration: shotDuration,
        color: '#00e5ff',
        targetSlotId: 'bag-left-slot-0',
        impactFired: false
      };

      // 第2发：延后 320ms 飞向右侧【天道灵材宝匣】(层次分明，节奏感极强)
      const rightProj = {
        startX: this.dragonMouth.x + 12,
        startY: this.dragonMouth.y,
        endX: rightCoord.x,
        endY: rightCoord.y,
        controlX: this.dragonMouth.x + 50,
        controlY: 100,
        startTime: now + 320,
        duration: shotDuration,
        color: '#ffd700',
        targetSlotId: 'bag-right-slot-0',
        impactFired: false
      };

      this.spoutProjectiles = [leftProj, rightProj];

      // 监听第1发落点
      setTimeout(() => {
        this._triggerSlotImpact('bag-left-slot-0', '#00e5ff');
        if (window.gameManager && window.gameManager.dragonCabinetManager) {
          window.gameManager.dragonCabinetManager.revealSlot('left');
        }
        window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('DRAGON_SLOT_REVEAL', { side: 'left', index: 0 });
      }, shotDuration);

      // 监听第2发落点
      setTimeout(() => {
        this._triggerSlotImpact('bag-right-slot-0', '#ffd700');
        if (window.gameManager && window.gameManager.dragonCabinetManager) {
          window.gameManager.dragonCabinetManager.revealSlot('right');
        }
        window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('DRAGON_SLOT_REVEAL', { side: 'right', index: 0 });
      }, 320 + shotDuration);

      // 全部奖励吐出并完全展示后 (留足 480ms 呼吸驻留时间，确保全部奖励显示全后，才进入下一步)，进入下一步！
      const totalAnimationTime = 320 + shotDuration + 480; // ~1180ms
      setTimeout(() => {
        this.isSpinning = false;
        window.SlotsRPG.EventBus && window.SlotsRPG.EventBus.emit('DRAGON_SPOUT_ALL_REVEALED', spinResult);

        if (typeof callback === 'function') {
          callback(spinResult);
        }
      }, totalAnimationTime);
    }

    _triggerSlotImpact(slotId, glowColor) {
      const el = document.getElementById(slotId);
      if (!el) return;

      el.classList.add('impact-burst');
      setTimeout(() => el.classList.remove('impact-burst'), 500);

      const coord = this._getSlotCoordinates(slotId, { x: this.width * 0.5, y: this.height * 0.65 });

      // 生成槽位爆发粒子
      for (let i = 0; i < 22; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4.5;
        this.particles.push({
          x: coord.x,
          y: coord.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          life: 1.0,
          decay: 0.04 + Math.random() * 0.04,
          color: glowColor,
          size: 2.5 + Math.random() * 3.5
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
          // 外发光环
          const grad = this.ctx.createRadialGradient(
            proj.currentX, proj.currentY, 2,
            proj.currentX, proj.currentY, 18
          );
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.35, proj.color);
          grad.addColorStop(1, 'transparent');

          this.ctx.fillStyle = grad;
          this.ctx.beginPath();
          this.ctx.arc(proj.currentX, proj.currentY, 18, 0, Math.PI * 2);
          this.ctx.fill();

          // 核心光核
          this.ctx.fillStyle = '#ffffff';
          this.ctx.beginPath();
          this.ctx.arc(proj.currentX, proj.currentY, 4, 0, Math.PI * 2);
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
