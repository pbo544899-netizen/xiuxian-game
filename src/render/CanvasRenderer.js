/**
 * CanvasRenderer - 聚宝天机阵主渲染引擎（幸运房东模式 + 心流延时消融 + 强力呼吸光效）
 * 1. 旋转与停轮阶段：所有滚轮依序停轮并完整展示符号，保留 Near-Miss（差一点中奖）紧张悬念；
 * 2. 结算消融阶段：当 5 列全部停止后，停顿观察 400ms，随后非中奖符号平滑淡出消融（若全无奖励则全盘消融留空）；
 * 3. 中奖发光阶段：中奖符号定格显现，方框呈现多重光晕金色强力呼吸律动（内透金光、外绽光芒、四角金印舒张）。
 */
window.SlotsRPG = window.SlotsRPG || {};

class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.symbolPainter = new window.SlotsRPG.SymbolPainter();

    // 逻辑视口规格 (680 x 420)
    this.logicalWidth = 680;
    this.logicalHeight = 420;
    this.colWidth = this.logicalWidth / 5;
    this.rowHeight = this.logicalHeight / 3;

    // 滚轴状态 (5列)
    this.reels = [];
    this._initReels();

    // 中奖格子映射表: key = "r,c", value = { symbolId, color }
    this.activeWinningCells = new Map();

    // 动画与消融状态机
    this.isSpinning = false;
    this.isDissolving = false;
    this.nonWinningAlpha = 1.0; // 初始状态保持 1.0，展示初始随机奖励符号
    this.nearMissCols = [];

    // 门派门票中奖符号专属高光展示特效 (Sect Ticket Showcase)
    this.isSectTicketShowcase = false;
    this.sectTicketCells = [];
    this.sectTicketParticles = [];

    // 飘字列表
    this.floatingTexts = [];

    this._setupCanvasResolution();
    this._startLoop();
  }

  _setupCanvasResolution() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.logicalWidth * dpr;
    this.canvas.height = this.logicalHeight * dpr;
    this.ctx.scale(dpr, dpr);
  }

  _initReels() {
    this.reels = [];
    // 初始展示的符号池 (包括玄铁剑、青云甲、紫金戒、修为丹、气血丹、各级真符与百搭灵珠)
    const initialPool = [
      'SYM_01', 'SYM_02', 'SYM_03', 'SYM_04', 'SYM_05',
      'SYM_06', 'SYM_07', 'SYM_08', 'SYM_11'
    ];

    for (let c = 0; c < 5; c++) {
      // 随机选取 3 个符号填充该列
      const colSymbols = [
        initialPool[Math.floor(Math.random() * initialPool.length)],
        initialPool[Math.floor(Math.random() * initialPool.length)],
        initialPool[Math.floor(Math.random() * initialPool.length)]
      ];

      this.reels.push({
        colIndex: c,
        offsetY: 0,
        speed: 0,
        state: 'idle', // 'idle', 'spinning', 'bounce'
        bounceProgress: 0,
        bufferSymbols: [],
        symbols: colSymbols, // 初始随机符号矩阵
        isNearMiss: false
      });
    }
  }

  /**
   * 开始旋转 (推演)
   */
  startSpin() {
    this.isSpinning = true;
    this.isDissolving = false;
    this.nonWinningAlpha = 1.0; // 旋转开始恢复全量符号可见度
    this.activeWinningCells.clear();
    this.nearMissCols = [];
    this.stopSectTicketShowcase(); // 彻底清理宗门法牒高光状态，重置特效

    // 旋转安全看门狗：防止任何意外异常导致停轮卡死锁死
    if (this.spinWatchdog) {
      clearTimeout(this.spinWatchdog);
      this.spinWatchdog = null;
    }
    this.spinWatchdog = setTimeout(() => {
      if (this.isSpinning) {
        console.warn('[CanvasRenderer] Spin watchdog triggered! Auto-recovering spin state.');
        this.isSpinning = false;
        this.isDissolving = false;
        this.nearMissCols = [];
        this.reels.forEach(r => { r.state = 'idle'; r.speed = 0; });
        window.SlotsRPG.EventBus.emit('SPIN_STOP', { grid: [], evaluation: { winningLines: [] }, nearMiss: {} });
      }
    }, 5500);

    const potLevel = window.SlotsRPG.GameManager ? window.SlotsRPG.GameManager.level : 1;
    const allSymbols = window.SlotsRPG.PaytableConfig.SYMBOLS;
    const unlockedKeys = Object.keys(allSymbols).filter(k => allSymbols[k].unlockLevel <= potLevel);

    this.reels.forEach(reel => {
      reel.state = 'spinning';
      reel.speed = 38;
      reel.offsetY = 0;
      reel.isNearMiss = false;

      // 生成滚动过程中的流光符号缓冲 (严格匹配当前阶位解锁池)
      reel.bufferSymbols = [];
      for (let k = 0; k < 12; k++) {
        const rndKey = unlockedKeys[Math.floor(Math.random() * unlockedKeys.length)];
        reel.bufferSymbols.push(rndKey);
      }
    });

    window.SlotsRPG.EventBus.emit('SPIN_START');
    if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
      window.SlotsRPG.SoundEffects.play('REEL_SPIN');
    }
  }

  /**
   * 停止旋转并载入中奖计算结果
   * @param {Object} spinData - SlotsEngine.spin 返回的对象
   */
  stopSpin(spinData, onComplete) {
    const { grid, evaluation, nearMiss } = spinData;
    const isNearMiss = !!(nearMiss && (nearMiss.isNearMissMonster || nearMiss.isNearMissBonus));

    // 1. 预先解析所有中奖格子坐标 (Row, Col)
    const winningMap = new Map();

    // 收集常规连线中奖符号
    evaluation.winningLines.forEach(line => {
      line.coords.forEach((r, c) => {
        winningMap.set(`${r},${c}`, {
          symbolId: grid[r][c],
          color: '#ffd700'
        });
      });
    });

    // 收集达到触发标准的妖兽 SCATTER (>= 3)
    if (evaluation.hasTriggeredBattle) {
      evaluation.scatterCoords.forEach(({ r, c }) => {
        winningMap.set(`${r},${c}`, {
          symbolId: 'SYM_12',
          color: '#e74c3c'
        });
      });
    }

    // 收集达到触发标准的秘境 BONUS (>= 5)
    if (evaluation.hasTriggeredBonus) {
      evaluation.bonusCoords.forEach(({ r, c }) => {
        winningMap.set(`${r},${c}`, {
          symbolId: 'SYM_13',
          color: '#2ecc71'
        });
      });
    }

    // 2. 逐列停轮逻辑：每列停下时，完整展示该列所有符号（保留看清 Near-Miss 机会！）
    this.reels.forEach((reel, c) => {
      let delay = 340 + c * 220;

      // 若处于 Near-Miss 且为第 2, 3, 4 列，开启减速期待金芒
      if (isNearMiss && c >= 2) {
        reel.isNearMiss = true;
        this.nearMissCols.push(c);
        const extraNearMiss = (c - 1) * 750;
        delay += extraNearMiss;

        // 播放期待减速张力音效
        if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
          window.SlotsRPG.SoundEffects.play('NEAR_MISS', extraNearMiss);
        }
      }

      setTimeout(() => {
        if (reel.isNearMiss) {
          reel.speed = 12; // 期待减速
        }
      }, delay - 350);

      setTimeout(() => {
        // 本列停稳：先完整装填该列真实结果 [row0, row1, row2]
        reel.symbols = [grid[0][c], grid[1][c], grid[2][c]];
        reel.state = 'bounce';
        reel.bounceProgress = 0;

        // 播放逐列停轮机簧音效 (五声音阶锁止)
        if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
          window.SlotsRPG.SoundEffects.play('REEL_STOP', c);
        }

        // 当最后一列 (第 4 列) 停稳后，进入心流定格与延时消融阶段
        if (c === 4) {
          // 【步骤 A】：全盘 15 个格子全部显现，定格静止 400ms，供玩家看清完整停轮结果与差一点中奖细节
          setTimeout(() => {
            this.activeWinningCells = winningMap;
            this.isDissolving = true; // 开启消融动画

            // 播放普通连线中奖音效 (Phase 1)
            if (winningMap.size > 0 && window.SlotsRPG && window.SlotsRPG.SoundEffects) {
              window.SlotsRPG.SoundEffects.play('WIN_LINE');
            }

            // 【步骤 B】：等待非中奖符号淡出完毕后，正式触发结算
            setTimeout(() => {
              if (this.spinWatchdog) {
                clearTimeout(this.spinWatchdog);
                this.spinWatchdog = null;
              }
              this.isSpinning = false;
              this.nearMissCols = [];

              try {
                if (onComplete) onComplete(spinData);
              } catch (err) {
                console.error('[CanvasRenderer] Error during spin settlement callback:', err);
              } finally {
                window.SlotsRPG.EventBus.emit('SPIN_STOP', spinData);
              }
            }, 350);
          }, 400);
        }
      }, delay);
    });
  }

  /**
   * 启动门派门票中奖符号专属高光展示特效 (Phase 3)
   * @param {Array<{r:number, c:number}>} coords - 中奖法牒/门票格子坐标
   */
  startSectTicketShowcase(coords) {
    this.isSectTicketShowcase = true;
    this.sectTicketCells = [];
    if (Array.isArray(coords)) {
      coords.forEach(cell => {
        if (cell && typeof cell === 'object' && Number.isFinite(cell.r) && Number.isFinite(cell.c)) {
          this.sectTicketCells.push({ r: Number(cell.r), c: Number(cell.c) });
        }
      });
    }
    this.sectTicketParticles = [];

    // 为每个中奖法牒格子播撒柔和金色灵气粒子
    this.sectTicketCells.forEach(({ r, c }) => {
      const colX = c * this.colWidth;
      const rowY = r * this.rowHeight;
      if (!Number.isFinite(colX) || !Number.isFinite(rowY)) return;
      for (let i = 0; i < 10; i++) {
        this.sectTicketParticles.push({
          r, c,
          baseX: colX + this.colWidth / 2,
          baseY: rowY + this.rowHeight - 12,
          x: colX + 16 + Math.random() * (this.colWidth - 32),
          y: rowY + 10 + Math.random() * (this.rowHeight - 20),
          speedY: 0.5 + Math.random() * 0.8,
          swaySpeed: 0.04 + Math.random() * 0.05,
          angle: Math.random() * Math.PI * 2,
          size: 1.8 + Math.random() * 2.2,
          alpha: 0.3 + Math.random() * 0.7
        });
      }
    });
  }

  /**
   * 关闭门派门票专属高光展示
   */
  stopSectTicketShowcase() {
    this.isSectTicketShowcase = false;
    this.sectTicketCells = [];
    this.sectTicketParticles = [];
  }

  /**
   * 动画渲染主循环 (附带异常容错守护，确保渲染线程绝不中断)
   */
  _startLoop() {
    const loop = () => {
      try {
        this._update();
        this._render();
      } catch (err) {
        console.error('[CanvasRenderer] 渲染主循环异常捕获，平滑自愈守护:', err);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  _update() {
    // 1. 更新每列转轮运动
    this.reels.forEach(reel => {
      if (reel.state === 'spinning') {
        reel.offsetY += reel.speed;
        if (reel.offsetY >= this.rowHeight) {
          reel.offsetY %= this.rowHeight;
          const top = reel.bufferSymbols.pop();
          reel.bufferSymbols.unshift(top);
        }
      } else if (reel.state === 'bounce') {
        reel.bounceProgress = (reel.bounceProgress || 0) + 0.1;
        if (reel.bounceProgress >= 1) {
          reel.state = 'idle';
          reel.offsetY = 0;
        } else {
          // 弹性回弹
          const p = reel.bounceProgress;
          const c1 = 1.70158;
          const c3 = c1 + 1;
          const eased = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
          reel.offsetY = (1 - eased) * 12;
        }
      }
    });

    // 2. 更新非中奖符号消融渐隐
    if (this.isDissolving && this.nonWinningAlpha > 0) {
      this.nonWinningAlpha = Math.max(0, this.nonWinningAlpha - 0.05); // 约 300ms 优雅淡出
    }

    // 3. 更新宗门法牒金色灵气粒子
    if (this.isSectTicketShowcase && this.sectTicketParticles.length > 0) {
      this.sectTicketParticles.forEach(p => {
        p.y -= p.speedY;
        p.angle += p.swaySpeed;
        p.alpha -= 0.012;
        if (p.alpha <= 0 || p.y < (p.r * this.rowHeight - 12)) {
          const colX = p.c * this.colWidth;
          const rowY = p.r * this.rowHeight;
          p.x = colX + 16 + Math.random() * (this.colWidth - 32);
          p.y = rowY + this.rowHeight - 10;
          p.alpha = 0.5 + Math.random() * 0.5;
        }
      });
    }

    // 4. 更新飘字
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 1.2;
      ft.alpha -= 0.015;
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

    // 1. 阵盘底板背景
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    // 2. 计算大幅度强力呼吸发光系数 (0.15 ~ 1.05 宽幅脉动)
    const now = Date.now();
    const breathPulse = 0.5 + 0.5 * Math.sin(now / 220); // 周期约 1.3 秒的沉浸呼吸

    this.reels.forEach((reel, c) => {
      const colX = c * this.colWidth;

      // 绘制 Near-Miss 减速期待高亮光圈
      if (reel.isNearMiss && reel.state === 'spinning') {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + 0.6 * breathPulse})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;
        ctx.strokeRect(colX + 3, 3, this.colWidth - 6, this.logicalHeight - 6);
        ctx.restore();
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(colX, 0, this.colWidth, this.logicalHeight);
      ctx.clip();

      if (reel.state === 'spinning') {
        // 【旋转过程中】：呈现天地灵气飞流与流光符号
        ctx.globalAlpha = 0.75;
        const buffer = reel.bufferSymbols;
        const gm = window.SlotsRPG.GameManager;
        const potLevel = gm ? gm.level : 1;
        const worldTier = gm ? (gm.currentWorldTier || 1) : 1;
        for (let i = -1; i < 4; i++) {
          const symIndex = (i + 12) % buffer.length;
          const symId = buffer[symIndex];
          const y = i * this.rowHeight + reel.offsetY;
          this.symbolPainter.drawSymbol(ctx, symId, colX, y, this.colWidth, this.rowHeight, false, potLevel, worldTier);
        }
      } else {
        const gm = window.SlotsRPG.GameManager;
        const potLevel = gm ? gm.level : 1;
        const worldTier = gm ? (gm.currentWorldTier || 1) : 1;
        // 【停轮或结算展示状态】：
        for (let r = 0; r < 3; r++) {
          const y = r * this.rowHeight + reel.offsetY;
          const cellKey = `${r},${c}`;
          const isWinning = this.activeWinningCells.has(cellKey);
          const symId = reel.symbols[r];

          // 首先绘制阵盘空槽底纹
          this._drawEmptySlot(ctx, colX, y, this.colWidth, this.rowHeight);

          if (symId) {
            if (isWinning) {
              // 【中奖符号】：始终保持 100% 鲜亮不透明
              ctx.save();
              ctx.globalAlpha = 1.0;
              this.symbolPainter.drawSymbol(ctx, symId, colX, y, this.colWidth, this.rowHeight, true, potLevel, worldTier);
              ctx.restore();

              // 【强力呼吸方框光效】：全方位光芒扩散
              this._drawWinningCellStrongGlow(ctx, colX, y, this.colWidth, this.rowHeight, breathPulse);
            } else if (this.nonWinningAlpha > 0) {
              // 【非中奖符号】：停轮初期完整显示，确认无奖后平滑消融至 0
              ctx.save();
              ctx.globalAlpha = this.nonWinningAlpha;
              this.symbolPainter.drawSymbol(ctx, symId, colX, y, this.colWidth, this.rowHeight, false, potLevel, worldTier);
              ctx.restore();
            }
          }
        }
      }
      ctx.restore();

      // 列分割暗线
      if (c > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(colX, 0);
        ctx.lineTo(colX, this.logicalHeight);
        ctx.stroke();
      }
    });

    // 3. 门派门票中奖符号专属高光道印与金色灵气飞升粒子 (Phase 3)
    if (this.isSectTicketShowcase && this.sectTicketCells.length > 0) {
      this.sectTicketCells.forEach(({ r, c }) => {
        const colX = c * this.colWidth;
        const rowY = r * this.rowHeight;
        this._drawSectTicketWinningAura(ctx, colX, rowY, this.colWidth, this.rowHeight, breathPulse);
      });

      // 渲染柔和升腾的灵气粒子
      this.sectTicketParticles.forEach(p => {
        ctx.save();
        ctx.fillStyle = `rgba(255, 215, 0, ${Math.max(0, p.alpha)})`;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        const drawX = p.x + Math.sin(p.angle) * 6;
        ctx.arc(drawX, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // 4. 飘字渲染
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color || '#ffd700';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 14;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  /**
   * 绘制极简空槽
   */
  _drawEmptySlot(ctx, x, y, w, h) {
    const pad = 6;
    ctx.save();
    ctx.beginPath();
    this.symbolPainter._drawRoundedRect(ctx, x + pad, y + pad, w - pad * 2, h - pad * 2, 8);
    ctx.fillStyle = 'rgba(14, 18, 28, 0.55)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 凹槽核心阵眼微光
    ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * 绘制中奖符号的【超明显强力呼吸发光方框】
   * 包含：1. 内部金光灵气脉动；2. 外圈超强金色光晕 Bloom (10~30px)；3. 双层边框；4. 四角金印舒张扩张
   */
  _drawWinningCellStrongGlow(ctx, x, y, w, h, pulse) {
    const pad = 5;
    const radius = 8;
    ctx.save();

    // 1. 内部金光灵气轻度填充脉动
    ctx.beginPath();
    this.symbolPainter._drawRoundedRect(ctx, x + pad, y + pad, w - pad * 2, h - pad * 2, radius);
    ctx.fillStyle = `rgba(255, 215, 0, ${0.06 + 0.16 * pulse})`;
    ctx.fill();

    // 2. 外圈强力金色 Bloom 辉光 (模糊扩散 10px ~ 32px)
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10 + 22 * pulse;
    ctx.strokeStyle = `rgba(255, 220, 80, ${0.65 + 0.35 * pulse})`;
    ctx.lineWidth = 3 + 1.8 * pulse; // 边框粗细随呼吸在 3px ~ 4.8px 之间律动
    ctx.stroke();

    // 3. 内部纯白金色高光边
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 + 0.45 * pulse})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 4. 四角灵印金色锚点舒张扩散
    const cornerLen = 8 + 4 * pulse; // 角标长度在 8px ~ 12px 动态呼吸
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10 * pulse;

    // 左上角
    ctx.fillRect(x + pad - 1, y + pad - 1, cornerLen, 3);
    ctx.fillRect(x + pad - 1, y + pad - 1, 3, cornerLen);
    // 右上角
    ctx.fillRect(x + w - pad - cornerLen + 1, y + pad - 1, cornerLen, 3);
    ctx.fillRect(x + w - pad - 2, y + pad - 1, 3, cornerLen);
    // 左下角
    ctx.fillRect(x + pad - 1, y + h - pad - 2, cornerLen, 3);
    ctx.fillRect(x + pad - 1, y + h - pad - cornerLen + 1, 3, cornerLen);
    // 右下角
    ctx.fillRect(x + w - pad - cornerLen + 1, y + h - pad - 2, cornerLen, 3);
    ctx.fillRect(x + w - pad - 2, y + h - pad - cornerLen + 1, 3, cornerLen);

    ctx.restore();
  }

  /**
   * 绘制宗门门票/法牒专属的【高阶仙门真传灵光法印】
   * 柔和、优雅、仙道流云、丝毫不突兀，但具备极高辨识度与庄严感
   */
  _drawSectTicketWinningAura(ctx, x, y, w, h, pulse) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) return;
    const pad = 5;
    const radius = 10;
    ctx.save();

    // 1. 内部仙门祥瑞霞光 (柔和金绿过渡光晕)
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    const rad = ctx.createRadialGradient(centerX, centerY, 8, centerX, centerY, w * 0.65);
    rad.addColorStop(0, `rgba(255, 215, 0, ${0.16 + 0.12 * pulse})`);
    rad.addColorStop(0.55, `rgba(52, 232, 158, ${0.08 + 0.08 * pulse})`);
    rad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    this.symbolPainter._drawRoundedRect(ctx, x + pad, y + pad, w - pad * 2, h - pad * 2, radius);
    ctx.fillStyle = rad;
    ctx.fill();

    // 2. 双层金色流光道门阵框
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 16 + 12 * pulse;
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.8 + 0.2 * pulse})`;
    ctx.lineWidth = 3.2 + 1.2 * pulse;
    ctx.stroke();

    // 3. 纯净内线白金色微光
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.45 + 0.35 * pulse})`;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // 4. 四角仙云金印雕饰
    const cornerSize = 10 + 3 * pulse;
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10 * pulse;

    // 左上、右上、左下、右下云纹角标
    ctx.fillRect(x + pad, y + pad, cornerSize, 3);
    ctx.fillRect(x + pad, y + pad, 3, cornerSize);
    ctx.fillRect(x + w - pad - cornerSize, y + pad, cornerSize, 3);
    ctx.fillRect(x + w - pad - 3, y + pad, 3, cornerSize);
    ctx.fillRect(x + pad, y + h - pad - 3, cornerSize, 3);
    ctx.fillRect(x + pad, y + h - pad - cornerSize, 3, cornerSize);
    ctx.fillRect(x + w - pad - cornerSize, y + h - pad - 3, cornerSize, 3);
    ctx.fillRect(x + w - pad - 3, y + h - pad - cornerSize, 3, cornerSize);

    // 5. 顶部仙门法牒徽章浮标
    const badgeW = 76;
    const badgeH = 18;
    const badgeX = x + (w - badgeW) / 2;
    const badgeY = y + pad + 3;

    ctx.beginPath();
    this.symbolPainter._drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
    ctx.fillStyle = 'rgba(12, 18, 30, 0.92)';
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.85 + 0.15 * pulse})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 4;
    ctx.fillText('✨ 宗门真传', centerX, badgeY + badgeH / 2 + 1);

    ctx.restore();
  }

  addFloatingText(text, color = '#ffd700') {
    this.floatingTexts.push({
      text,
      color,
      x: this.logicalWidth / 2,
      y: this.logicalHeight / 2 - 10,
      alpha: 1.0
    });
  }
}

window.SlotsRPG.CanvasRenderer = CanvasRenderer;
