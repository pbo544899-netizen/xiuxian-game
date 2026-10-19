/**
 * DragonSpoutRenderer.js - 周天神龙 · 乾坤吐宝 视觉与动效渲染引擎
 * 负责天工青铜古玉龙首的待机神态、龙息蓄力、双股灵弧俯冲落柜与宝光迸发的全套高品质动效
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

      // 视觉锚点坐标 (在 resize 时自适应更新)
      this.dragonMouth = { x: 0, y: 0 };
      this.cabinetLeft = { x: 0, y: 0 };
      this.cabinetRight = { x: 0, y: 0 };

      // 吐宝飞弹轨迹动画状态
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

        // 计算各关键点相对坐标
        this.dragonMouth = { x: this.width * 0.5, y: this.height * 0.28 };
        this.cabinetLeft = { x: this.width * 0.28, y: this.height * 0.72 };
        this.cabinetRight = { x: this.width * 0.72, y: this.height * 0.72 };
      };

      window.addEventListener('resize', updateSize);
      setTimeout(updateSize, 100);
      updateSize();
    }

    /**
     * 开始引龙吐宝蓄力
     */
    startSpin() {
      this.isSpinning = true;
      this.spoutProjectiles = [];

      // 触发龙头微震与口中聚气动画
      const headEl = document.getElementById('dragon-head-sprite');
      if (headEl) {
        headEl.classList.add('charging');
      }

      // 生成聚气粒子
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 50;
        this.particles.push({
          x: this.dragonMouth.x + Math.cos(angle) * dist,
          y: this.dragonMouth.y + Math.sin(angle) * dist,
          vx: -Math.cos(angle) * 3,
          vy: -Math.sin(angle) * 3,
          life: 1.0,
          decay: 0.05 + Math.random() * 0.03,
          color: Math.random() < 0.5 ? '#00e5ff' : '#ffd700',
          size: 2 + Math.random() * 3
        });
      }
    }

    /**
     * 吐出灵光并落入双柜停轮
     */
    stopSpin(spinResult, callback) {
      const headEl = document.getElementById('dragon-head-sprite');
      if (headEl) {
        headEl.classList.remove('charging');
        headEl.classList.add('spouting');
        setTimeout(() => headEl.classList.remove('spouting'), 500);
      }

      // 创建两道弧形弹道粒子流 (左柜·青金雷火, 右柜·金霞琼浆)
      const duration = 0.55; // 0.55秒弧形落柜
      const startTime = performance.now();

      const leftProj = {
        startX: this.dragonMouth.x - 10,
        startY: this.dragonMouth.y,
        endX: this.cabinetLeft.x,
        endY: this.cabinetLeft.y,
        controlX: this.dragonMouth.x - 70,
        controlY: this.height * 0.45,
        startTime: startTime,
        duration: duration * 1000,
        color: '#00e5ff',
        trailColor: 'rgba(0, 229, 255, 0.6)',
        target: 'left'
      };

      const rightProj = {
        startX: this.dragonMouth.x + 10,
        startY: this.dragonMouth.y,
        endX: this.cabinetRight.x,
        endY: this.cabinetRight.y,
        controlX: this.dragonMouth.x + 70,
        controlY: this.height * 0.45,
        startTime: startTime,
        duration: duration * 1000,
        color: '#ffd700',
        trailColor: 'rgba(255, 215, 0, 0.6)',
        target: 'right'
      };

      this.spoutProjectiles = [leftProj, rightProj];

      // 定时在炮弹到达时触发柜门震动与金光爆开
      setTimeout(() => {
        this._triggerCabinetImpact('cabinet-left', '#00e5ff');
        this._triggerCabinetImpact('cabinet-right', '#ffd700');
        this.isSpinning = false;

        if (typeof callback === 'function') {
          callback(spinResult);
        }
      }, duration * 1000);
    }

    _triggerCabinetImpact(elementId, glowColor) {
      const el = document.getElementById(elementId);
      if (!el) return;

      el.classList.add('impact');
      setTimeout(() => el.classList.remove('impact'), 450);

      // 在落点生成爆破火花粒子
      const rect = el.getBoundingClientRect();
      const canvasRect = this.canvas ? this.canvas.getBoundingClientRect() : { left: 0, top: 0 };
      const impactX = (rect.left + rect.width * 0.5) - canvasRect.left;
      const impactY = (rect.top + rect.height * 0.4) - canvasRect.top;

      for (let i = 0; i < 28; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        this.particles.push({
          x: impactX,
          y: impactY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          life: 1.0,
          decay: 0.04 + Math.random() * 0.04,
          color: glowColor,
          size: 2.5 + Math.random() * 4
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
        y: (this.height || 400) * 0.55,
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
          const elapsed = timestamp - proj.startTime;
          const t = Math.min(1.0, Math.max(0, elapsed / proj.duration));

          // 二次贝塞尔曲线插值
          const invT = 1 - t;
          proj.currentX = invT * invT * proj.startX + 2 * invT * t * proj.controlX + t * t * proj.endX;
          proj.currentY = invT * invT * proj.startY + 2 * invT * t * proj.controlY + t * t * proj.endY;

          // 拖尾火花
          if (t < 1.0 && Math.random() < 0.7) {
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

      // 1. 绘制落柜灵光光球与闪电尾迹
      for (const proj of this.spoutProjectiles) {
        if (proj.currentX !== undefined) {
          this.ctx.save();
          // 外发光环
          const grad = this.ctx.createRadialGradient(
            proj.currentX, proj.currentY, 2,
            proj.currentX, proj.currentY, 18
          );
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, proj.color);
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
