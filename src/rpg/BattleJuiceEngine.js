/**
 * 修仙作弊器：伏妖战场受力打击感与视觉特效引擎 (BattleJuiceEngine)
 * 特性：
 * 1. 顶层 Canvas 2D 硬件加速，零外部贴图，仅通过数学几何路径与粒子光栅化渲染；
 * 2. Zero-GC 动态粒子对象池 (预分配 128 个 Typed 粒子，战斗期间 0 内存动态分配)；
 * 3. 极速自休眠机制 (无特效活跃时自动停止 requestAnimationFrame，CPU 0% 占用)；
 * 4. 封装卡肉顿帧 (Hit Stop)、视差震屏 (Screen Shake)、瞬态闪白 (Flash White) 与局部受击定位。
 */

(function() {
  'use strict';

  const MAX_PARTICLES = 128;
  const MAX_ARCS = 8;
  const MAX_SHOCKWAVES = 8;
  const MAX_SWORDS = 6;

  class BattleJuiceEngine {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.container = null;
      this.dpr = window.devicePixelRatio || 1;
      this.width = 0;
      this.height = 0;
      this.animId = null;
      this.isRunning = false;

      // 预分配粒子对象池 (Zero-GC)
      this.particlePool = new Array(MAX_PARTICLES);
      for (let i = 0; i < MAX_PARTICLES; i++) {
        this.particlePool[i] = {
          active: false,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          gravity: 0.35,
          color: '#ffd700',
          size: 3,
          alpha: 1.0,
          decay: 0.03,
          shape: 'circle', // 'circle' | 'shard' | 'spark'
          jitter: 0
        };
      }

      // 弧光斩痕池 (Zero-GC)
      this.arcPool = new Array(MAX_ARCS);
      for (let i = 0; i < MAX_ARCS; i++) {
        this.arcPool[i] = {
          active: false,
          x: 0,
          y: 0,
          angle: -30,
          scale: 1.0,
          color: '#ffd700',
          progress: 0,
          speed: 0.09,
          lineWidth: 4,
          count: 1
        };
      }

      // 环形冲击波池 (Zero-GC)
      this.wavePool = new Array(MAX_SHOCKWAVES);
      for (let i = 0; i < MAX_SHOCKWAVES; i++) {
        this.wavePool[i] = {
          active: false,
          x: 0,
          y: 0,
          currentRadius: 10,
          maxRadius: 60,
          speed: 3.5,
          color: '#ffffff',
          lineWidth: 3,
          alpha: 1.0
        };
      }

      // 万剑出鞘飞剑池 (Zero-GC)
      this.swordPool = new Array(MAX_SWORDS);
      for (let i = 0; i < MAX_SWORDS; i++) {
        this.swordPool[i] = {
          active: false,
          startX: 0,
          startY: 0,
          targetX: 0,
          targetY: 0,
          curveDir: 1,
          curveOffset: 40,
          progress: 0,
          speed: 0.075,
          length: 42,
          width: 4.2,
          color: '#ffd700',
          delay: 0,
          onReachTarget: null
        };
      }
    }

    /**
     * 绑定挂载到战场容器中
     */
    init(containerEl) {
      this.container = containerEl || document.querySelector('#modal-battle-arena .battle-arena-container');
      if (!this.container) return;

      let cvs = this.container.querySelector('#battle-juice-canvas');
      if (!cvs) {
        cvs = document.createElement('canvas');
        cvs.id = 'battle-juice-canvas';
        cvs.style.position = 'absolute';
        cvs.style.top = '0';
        cvs.style.left = '0';
        cvs.style.width = '100%';
        cvs.style.height = '100%';
        cvs.style.pointerEvents = 'none';
        cvs.style.zIndex = '100';
        this.container.appendChild(cvs);
      }

      this.canvas = cvs;
      this.ctx = cvs.getContext('2d');
      this.resize();

      window.addEventListener('resize', () => this.resize(), { passive: true });
    }

    resize() {
      if (!this.canvas || !this.container) return;
      const rect = this.container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      this.width = rect.width;
      this.height = rect.height;
      this.dpr = window.devicePixelRatio || 1;

      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);
      this.canvas.style.width = this.width + 'px';
      this.canvas.style.height = this.height + 'px';

      if (this.ctx) {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(this.dpr, this.dpr);
      }
    }

    _checkResize() {
      if (this.width === 0 || (this.canvas && this.canvas.width === 0)) {
        this.resize();
      }
    }

    _startLoop() {
      if (this.isRunning) return;
      this.isRunning = true;
      const loop = () => {
        this._updateAndRender();
        if (this._hasActiveElements()) {
          this.animId = requestAnimationFrame(loop);
        } else {
          this.isRunning = false;
          this.animId = null;
          // 清空画布保证无残影
          if (this.ctx) {
            this.ctx.clearRect(0, 0, this.width, this.height);
          }
        }
      };
      this.animId = requestAnimationFrame(loop);
    }

    _hasActiveElements() {
      for (let i = 0; i < MAX_PARTICLES; i++) {
        if (this.particlePool[i].active) return true;
      }
      for (let i = 0; i < MAX_ARCS; i++) {
        if (this.arcPool[i].active) return true;
      }
      for (let i = 0; i < MAX_SHOCKWAVES; i++) {
        if (this.wavePool[i].active) return true;
      }
      for (let i = 0; i < MAX_SWORDS; i++) {
        if (this.swordPool[i].active) return true;
      }
      return false;
    }

    /**
     * 1. 激发贝塞尔斩击刃芒
     */
    triggerSlashArc(x, y, config = {}) {
      if (!this.ctx) return;
      this._checkResize();
      for (let i = 0; i < MAX_ARCS; i++) {
        const arc = this.arcPool[i];
        if (!arc.active) {
          arc.active = true;
          arc.x = x;
          arc.y = y;
          arc.angle = config.angle !== undefined ? config.angle : -35;
          arc.scale = config.scale || 1.2;
          arc.color = config.color || '#ffd700';
          arc.progress = 0;
          arc.speed = config.speed || 0.12;
          arc.lineWidth = config.lineWidth || 4.5;
          arc.count = config.count || 1;
          break;
        }
      }
      this._startLoop();
    }

    /**
     * 2. 激发火花/碎屑粒子群
     */
    triggerSparks(x, y, config = {}) {
      if (!this.ctx) return;
      this._checkResize();
      const count = config.count || 16;
      const colors = config.colors || ['#ffd700', '#f59e0b', '#ffffff'];
      const gravity = config.gravity !== undefined ? config.gravity : 0.35;
      const speedMin = config.speedMin || 3.0;
      const speedMax = config.speedMax || 8.5;
      const shape = config.shape || 'spark';
      const jitter = config.jitter || 0;

      let spawned = 0;
      for (let i = 0; i < MAX_PARTICLES && spawned < count; i++) {
        const p = this.particlePool[i];
        if (!p.active) {
          p.active = true;
          p.x = x;
          p.y = y;
          const angle = Math.random() * Math.PI * 2;
          const speed = speedMin + Math.random() * (speedMax - speedMin);
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed - 1.5; // 轻度向上微推
          p.gravity = gravity;
          p.color = colors[Math.floor(Math.random() * colors.length)];
          p.size = 2 + Math.random() * 3.5;
          p.alpha = 1.0;
          p.decay = 0.025 + Math.random() * 0.035;
          p.shape = shape;
          p.jitter = jitter;
          spawned++;
        }
      }
      this._startLoop();
    }

    /**
     * 3. 激发环形冲击波
     */
    triggerShockwave(x, y, config = {}) {
      if (!this.ctx) return;
      this._checkResize();
      for (let i = 0; i < MAX_SHOCKWAVES; i++) {
        const w = this.wavePool[i];
        if (!w.active) {
          w.active = true;
          w.x = x;
          w.y = y;
          w.currentRadius = config.startRadius || 8;
          w.maxRadius = config.maxRadius || 60;
          w.speed = config.speed || 3.8;
          w.color = config.color || '#ffffff';
          w.lineWidth = config.lineWidth || 3;
          w.alpha = 1.0;
          break;
        }
      }
      this._startLoop();
    }

    /**
     * 4. 激发万剑仙宗出鞘飞剑极速穿梭 (Flying Sword Barrage)
     * @param {number} startX - 起始 X 坐标 (主角身后)
     * @param {number} startY - 起始 Y 坐标
     * @param {number} targetX - 目标 X 坐标 (妖兽受击锚点)
     * @param {number} targetY - 目标 Y 坐标
     * @param {Object} config - { count, color, speed, onReachTarget }
     */
    triggerFlyingSwords(startX, startY, targetX, targetY, config = {}) {
      if (!this.ctx) return;
      this._checkResize();
      const count = config.count || 2;
      const color = config.color || '#ffd700';
      const speed = config.speed || 0.075;
      let spawned = 0;

      for (let i = 0; i < MAX_SWORDS && spawned < count; i++) {
        const sw = this.swordPool[i];
        if (!sw.active) {
          sw.active = true;
          sw.startX = startX + (spawned === 0 ? -32 : 32);
          sw.startY = startY - 15;
          sw.targetX = targetX;
          sw.targetY = targetY;
          sw.curveDir = spawned === 0 ? -1 : 1;
          sw.curveOffset = 42;
          sw.progress = 0;
          sw.speed = speed;
          sw.length = 42;
          sw.width = 4.2;
          sw.color = color;
          sw.delay = spawned * 4; // 错开 4 帧释放，呈现连贯出鞘感
          sw.onReachTarget = (spawned === count - 1 && typeof config.onReachTarget === 'function') ? config.onReachTarget : null;
          spawned++;
        }
      }
      this._startLoop();
    }

    /**
     * 主渲染与物理更新循环
     */
    _updateAndRender() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.width, this.height);

      // 1. 渲染冲击波
      for (let i = 0; i < MAX_SHOCKWAVES; i++) {
        const w = this.wavePool[i];
        if (!w.active) continue;
        w.currentRadius += w.speed;
        w.alpha = Math.max(0, 1.0 - (w.currentRadius / w.maxRadius));

        if (w.currentRadius >= w.maxRadius || w.alpha <= 0.01) {
          w.active = false;
          continue;
        }

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(w.x, w.y, w.currentRadius, 0, Math.PI * 2);
        this.ctx.strokeStyle = w.color;
        this.ctx.globalAlpha = w.alpha * 0.85;
        this.ctx.lineWidth = w.lineWidth;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = w.color;
        this.ctx.stroke();
        this.ctx.restore();
      }

      // 2. 渲染斩击刃芒 (贝塞尔曲线)
      for (let i = 0; i < MAX_ARCS; i++) {
        const arc = this.arcPool[i];
        if (!arc.active) continue;

        arc.progress += arc.speed;
        if (arc.progress >= 1.0) {
          arc.active = false;
          continue;
        }

        const alpha = Math.sin(arc.progress * Math.PI); // 0 -> 1 -> 0
        const rad = (arc.angle * Math.PI) / 180;
        const len = 70 * arc.scale;

        this.ctx.save();
        this.ctx.translate(arc.x, arc.y);
        this.ctx.rotate(rad);
        this.ctx.globalAlpha = alpha;

        for (let c = 0; c < arc.count; c++) {
          const offsetY = (c - (arc.count - 1) * 0.5) * 16 * arc.scale;
          this.ctx.beginPath();
          this.ctx.moveTo(-len * 0.6, offsetY);
          // 贝塞尔弧光控制点：中点向上弯曲
          this.ctx.quadraticCurveTo(0, offsetY - 25 * arc.scale, len * 0.6, offsetY);

          this.ctx.strokeStyle = arc.color;
          this.ctx.lineWidth = arc.lineWidth * arc.scale;
          this.ctx.lineCap = 'round';
          this.ctx.shadowColor = arc.color;
          this.ctx.shadowBlur = 12;
          this.ctx.stroke();

          // 核心高光白刃
          this.ctx.beginPath();
          this.ctx.moveTo(-len * 0.4, offsetY);
          this.ctx.quadraticCurveTo(0, offsetY - 18 * arc.scale, len * 0.4, offsetY);
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = Math.max(1.5, arc.lineWidth * 0.45);
          this.ctx.stroke();
        }

        this.ctx.restore();
      }

      // 3. 渲染粒子群
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = this.particlePool[i];
        if (!p.active) continue;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= p.decay;

        if (p.jitter > 0) {
          p.x += (Math.random() - 0.5) * p.jitter;
        }

        if (p.alpha <= 0.02) {
          p.active = false;
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 6;

        if (p.shape === 'spark') {
          // 速度拉伸火花
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          const angle = Math.atan2(p.vy, p.vx);
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate(angle);
          this.ctx.fillRect(-p.size * 1.5, -p.size * 0.5, p.size * (1 + speed * 0.3), p.size);
        } else {
          // 圆点光芒
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, Math.max(0.8, p.size * p.alpha), 0, Math.PI * 2);
          this.ctx.fill();
        }

        this.ctx.restore();
      }

      // 4. 渲染万剑出鞘飞剑
      for (let i = 0; i < MAX_SWORDS; i++) {
        const sw = this.swordPool[i];
        if (!sw.active) continue;

        if (sw.delay > 0) {
          sw.delay--;
          continue;
        }

        sw.progress += sw.speed;
        if (sw.progress >= 1.0) {
          sw.active = false;
          if (typeof sw.onReachTarget === 'function') {
            sw.onReachTarget();
          }
          // 命中目标点激发微型火花与光芒
          this.triggerSparks(sw.targetX, sw.targetY, { count: 8, colors: [sw.color, '#ffffff'] });
          continue;
        }

        // 沿二次贝塞尔曲线计算当前飞剑坐标 (x, y)
        const t = sw.progress;
        const invT = 1.0 - t;
        const midX = (sw.startX + sw.targetX) * 0.5;
        const midY = (sw.startY + sw.targetY) * 0.5;
        const cpX = midX + sw.curveDir * sw.curveOffset;
        const cpY = midY;

        const currX = invT * invT * sw.startX + 2 * invT * t * cpX + t * t * sw.targetX;
        const currY = invT * invT * sw.startY + 2 * invT * t * cpY + t * t * sw.targetY;

        // 切线速度向量 (用于计算飞剑自转朝向)
        const dx = 2 * invT * (cpX - sw.startX) + 2 * t * (sw.targetX - cpX);
        const dy = 2 * invT * (cpY - sw.startY) + 2 * t * (sw.targetY - cpY);
        const angle = Math.atan2(dy, dx);

        // 绘制万剑仙宗出鞘法剑几何实体
        this.ctx.save();
        this.ctx.translate(currX, currY);
        this.ctx.rotate(angle);

        // 剑身金色外晕
        this.ctx.shadowColor = sw.color;
        this.ctx.shadowBlur = 14;

        // 剑体路径 (菱形尖端 + 剑身 + 剑首)
        const halfW = sw.width * 0.5;
        const len = sw.length;
        this.ctx.beginPath();
        this.ctx.moveTo(len, 0);                   // 剑尖
        this.ctx.lineTo(len * 0.25, -halfW * 1.3); // 剑身左侧
        this.ctx.lineTo(-len * 0.2, -halfW);       // 剑格左侧
        this.ctx.lineTo(-len * 0.35, 0);           // 剑柄底部
        this.ctx.lineTo(-len * 0.2, halfW);        // 剑格右侧
        this.ctx.lineTo(len * 0.25, halfW * 1.3);  // 剑身右侧
        this.ctx.closePath();

        this.ctx.fillStyle = sw.color;
        this.ctx.fill();

        // 剑心白热高光
        this.ctx.beginPath();
        this.ctx.moveTo(len * 0.85, 0);
        this.ctx.lineTo(-len * 0.15, 0);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.6;
        this.ctx.stroke();

        this.ctx.restore();

        // 尾迹流光粒子
        if (Math.random() < 0.6) {
          this.triggerSparks(currX, currY, {
            count: 1,
            colors: [sw.color, '#ffffff'],
            speedMin: 0.5,
            speedMax: 2.0,
            gravity: 0.05
          });
        }
      }
    }

    /**
     * 辅助工具：卡肉顿帧 (Hit Stop)
     * @param {number} ms - 冻结毫秒数
     * @returns {Promise<void>}
     */
    hitStop(ms = 80) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 辅助工具：多轴视差震屏 (Screen Shake)
     * @param {number} intensity - 振幅像素 (2~15px)
     * @param {number} duration - 持续毫秒 (100~300ms)
     * @param {HTMLElement} targetEl - 震动容器，默认当前战场
     */
    shakeScreen(intensity = 6, duration = 180, targetEl = null) {
      const el = targetEl || this.container;
      if (!el) return;

      const startTime = performance.now();
      const originTransform = el.style.transform || '';

      const shake = (now) => {
        const elapsed = now - startTime;
        if (elapsed < duration) {
          const decay = 1.0 - (elapsed / duration);
          const offsetX = (Math.random() * 2 - 1) * intensity * decay;
          const offsetY = (Math.random() * 2 - 1) * intensity * decay;
          const rotate = (Math.random() * 2 - 1) * 0.8 * decay;
          el.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${rotate}deg)`;
          requestAnimationFrame(shake);
        } else {
          el.style.transform = originTransform;
        }
      };
      requestAnimationFrame(shake);
    }

    /**
     * 辅助工具：像素级瞬态闪白 (Hit Flash White)
     * @param {HTMLElement} el - 受创元素
     * @param {number} duration - 闪白毫秒数 (默认 50ms)
     */
    flashWhite(el, duration = 50) {
      if (!el) return;
      const originFilter = el.style.filter || '';
      el.style.filter = 'brightness(6) contrast(2) drop-shadow(0 0 16px #ffffff)';
      setTimeout(() => {
        el.style.filter = originFilter;
      }, duration);
    }

    /**
     * 辅助工具：物理击退与阻尼回弹 (Knockback & Spring Physics) - 无胶皮弹跳缩放
     * @param {HTMLElement} el - 被击退元素
     * @param {number} distance - 击退像素
     * @param {number} duration - 回弹总耗时 (默认 180ms)
     * @param {number} direction - 移动方向 (1向下，-1向上)
     */
    knockback(el, distance = 16, duration = 180, direction = -1) {
      if (!el) return;
      if (el.classList && el.classList.contains('monster-unit-avatar')) {
        this.triggerMonsterHurtFeedback(el, distance > 22);
        return;
      }

      el.style.transition = 'transform 60ms cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.transform = `translate3d(0, ${distance * direction}px, 0) rotate(${direction * 2.5}deg)`;

      setTimeout(() => {
        el.style.transition = `transform ${duration - 60}ms cubic-bezier(0.25, 1, 0.5, 1)`;
        el.style.transform = 'translate3d(0, 0, 0) rotate(0deg)';
        setTimeout(() => {
          if (el) el.style.transition = '';
        }, duration - 60);
      }, 60);
    }

    /**
     * 怪物受创灵动反馈 (Hit Reaction)
     * 基于物理受力后挫、躯干微倾、妖气震颤与顺滑回位，绝无胶皮球弹跳缩放
     * @param {HTMLElement} avatarEl - 怪物立绘元素
     * @param {boolean} isCrit - 是否暴击重创
     */
    triggerMonsterHurtFeedback(avatarEl, isCrit = false) {
      if (!avatarEl || avatarEl.classList.contains('monster-dying')) return;

      // 清除先前动作状态，重启受创动画
      avatarEl.classList.remove('monster-windup', 'monster-lunge', 'monster-boss-roar', 'monster-hit', 'monster-hit-crit');
      void avatarEl.offsetWidth; // 触发回流重绘
      avatarEl.classList.add(isCrit ? 'monster-hit-crit' : 'monster-hit');

      // 画布激发出受创妖煞与血芒粒子
      const anchor = this.getAnchorCoords(avatarEl);
      this.triggerSparks(anchor.x, anchor.y, {
        count: isCrit ? 22 : 12,
        colors: isCrit ? ['#ef4444', '#ffd700', '#ffffff'] : ['#ef4444', '#f87171', '#fbbf24'],
        speedMin: 1.5,
        speedMax: isCrit ? 4.8 : 3.0,
        gravity: 0.28
      });

      // 动画完成后自然重返待机呼吸姿态
      const duration = isCrit ? 440 : 360;
      setTimeout(() => {
        if (avatarEl && !avatarEl.classList.contains('monster-dying')) {
          avatarEl.classList.remove('monster-hit', 'monster-hit-crit');
        }
      }, duration);
    }

    /**
     * 怪物攻击/施法蓄势前摇 (Windup)
     * @param {HTMLElement} avatarEl
     */
    triggerMonsterWindup(avatarEl) {
      if (!avatarEl || avatarEl.classList.contains('monster-dying')) return;
      avatarEl.classList.remove('monster-hit', 'monster-hit-crit', 'monster-lunge', 'monster-boss-roar');
      void avatarEl.offsetWidth;
      avatarEl.classList.add('monster-windup');
    }

    /**
     * 怪物突进扑杀与绝技施展 (Lunge / Cast)
     * @param {HTMLElement} avatarEl
     * @param {boolean} isBossSkill - 是否为妖王级绝技
     */
    triggerMonsterLunge(avatarEl, isBossSkill = false) {
      if (!avatarEl || avatarEl.classList.contains('monster-dying')) return;
      avatarEl.classList.remove('monster-windup');
      void avatarEl.offsetWidth;
      avatarEl.classList.add(isBossSkill ? 'monster-boss-roar' : 'monster-lunge');

      const duration = isBossSkill ? 560 : 400;
      setTimeout(() => {
        if (avatarEl && !avatarEl.classList.contains('monster-dying')) {
          avatarEl.classList.remove('monster-lunge', 'monster-boss-roar');
        }
      }, duration);
    }

    /**
     * 重置怪物动作姿态
     * @param {HTMLElement} avatarEl
     */
    resetMonsterPose(avatarEl) {
      if (!avatarEl || avatarEl.classList.contains('monster-dying')) return;
      avatarEl.classList.remove('monster-windup', 'monster-lunge', 'monster-boss-roar', 'monster-hit', 'monster-hit-crit');
    }

    /**
     * 怪物死亡溃散与升华消融 (Death Dissolve)
     * @param {HTMLElement} avatarEl
     * @param {HTMLElement} cardEl
     */
    triggerMonsterDeathFeedback(avatarEl, cardEl) {
      if (avatarEl) {
        avatarEl.classList.remove('monster-windup', 'monster-lunge', 'monster-boss-roar', 'monster-hit', 'monster-hit-crit');
        void avatarEl.offsetWidth;
        avatarEl.classList.add('monster-dying');

        // 画布爆发出升华消解粒子（重力为负，向上飘散如灵气归虚）
        const anchor = this.getAnchorCoords(avatarEl);
        this.triggerShockwave(anchor.x, anchor.y, { maxRadius: 85, color: '#dc2626', lineWidth: 4 });
        this.triggerSparks(anchor.x, anchor.y, {
          count: 36,
          colors: ['#dc2626', '#7c3aed', '#9333ea', '#fbbf24', '#ffffff'],
          speedMin: 1.0,
          speedMax: 3.8,
          gravity: -0.16 // 灵气升华向上飘散
        });
      }

      if (cardEl) {
        cardEl.classList.add('defeated');
      }
    }

    /**
     * 动态采集目标绝对坐标并映射至特效画布本地空间
     * @param {HTMLElement} targetEl
     * @returns {{x: number, y: number}}
     */
    getAnchorCoords(targetEl) {
      this._checkResize();
      if (!targetEl || !this.canvas) {
        return { x: this.width * 0.5, y: this.height * 0.4 };
      }
      const tRect = targetEl.getBoundingClientRect();
      const cRect = this.canvas.getBoundingClientRect();
      return {
        x: tRect.left + tRect.width * 0.5 - cRect.left,
        y: tRect.top + tRect.height * 0.45 - cRect.top
      };
    }
  }

  // 挂载至全局命名空间
  window.SlotsRPG = window.SlotsRPG || {};
  window.SlotsRPG.BattleJuiceEngine = new BattleJuiceEngine();
})();
