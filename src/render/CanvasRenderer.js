/**
 * CanvasRenderer - 周天奇门阵盘主渲染引擎（仙侠阵法推演 · 阵眼定穴 · 灵脉共鸣）
 * 1. 彻底去赌博机化：放弃滚筒物理下坠与机械弹簧回弹，重塑为道家【奇门遁甲阵盘】；
 * 2. 推演态：15 处天机符穴进入灵气激荡态，星宿神印在阵眼中以太极道光幻化轮转；
 * 3. 定穴态：自左至右逐列【法印归元 · 阵眼定穴】，爆发灵气冲击波与法器扣合仙音；
 * 4. 共鸣态：中奖连线升华为【天道灵脉贯通 · 阵纹天雷共鸣】，闪电星轨连携三才、四象、五行神道法则。
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

    // 阵列状态 (5 列，每列 3 个阵眼)
    this.reels = [];
    this._initReels();

    // 共鸣/中奖映射与连线
    this.activeWinningCells = new Map(); // key = "r,c", value = { symbolId, color }
    this.winningLines = [];              // 保存当前中奖阵纹路径

    // 动画与消融状态机
    this.isSpinning = false;
    this.isDissolving = false;
    this.nonWinningAlpha = 1.0;
    this.nearMissCols = [];

    // 阵法粒子系统
    this.arrayParticles = [];
    this.imprintShockwaves = [];

    // 门派法牒专属高光展示特效 (Sect Ticket Showcase)
    this.isSectTicketShowcase = false;
    this.sectTicketCells = [];
    this.sectTicketParticles = [];

    // 飘字列表
    this.floatingTexts = [];

    // 阵盘自转水纹角度
    this.taijiAngle = 0;

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
    const initialPool = [
      'SYM_01', 'SYM_02', 'SYM_03', 'SYM_04', 'SYM_05',
      'SYM_06', 'SYM_07', 'SYM_08', 'SYM_11'
    ];

    for (let c = 0; c < 5; c++) {
      const colSymbols = [
        initialPool[Math.floor(Math.random() * initialPool.length)],
        initialPool[Math.floor(Math.random() * initialPool.length)],
        initialPool[Math.floor(Math.random() * initialPool.length)]
      ];

      this.reels.push({
        colIndex: c,
        state: 'idle',           // 'idle', 'spinning', 'imprinting'
        symbols: colSymbols,     // 当前展现的道符
        bufferSymbols: [],       // 轮转缓冲
        morphTimer: 0,           // 符印幻化计时器
        morphIndex: 0,           // 当前幻化指针
        imprintProgress: 1.0,    // 0~1 定穴冲击波进度
        isNearMiss: false
      });
    }
  }

  /**
   * 开始推演天机 (启动奇门大阵)
   */
  startSpin() {
    this.isSpinning = true;
    this.isDissolving = false;
    this.nonWinningAlpha = 1.0;
    this.activeWinningCells.clear();
    this.winningLines = [];
    this.nearMissCols = [];
    this.stopSectTicketShowcase();

    // 旋转安全看门狗：防止任何意外异常导致停轮卡死锁死
    if (this.spinWatchdog) {
      clearTimeout(this.spinWatchdog);
      this.spinWatchdog = null;
    }
    this.spinWatchdog = setTimeout(() => {
      if (this.isSpinning) {
        console.warn('[CanvasRenderer] 阵法推演守护触发，自动复位阵盘状态。');
        this.isSpinning = false;
        this.isDissolving = false;
        this.nearMissCols = [];
        this.reels.forEach(r => { r.state = 'idle'; r.imprintProgress = 1.0; });
        window.SlotsRPG.EventBus.emit('SPIN_STOP', { grid: [], evaluation: { winningLines: [] }, nearMiss: {} });
      }
    }, 5500);

    const potLevel = window.SlotsRPG.GameManager ? window.SlotsRPG.GameManager.level : 1;
    const allSymbols = window.SlotsRPG.PaytableConfig.SYMBOLS;
    const unlockedKeys = Object.keys(allSymbols).filter(k => allSymbols[k].unlockLevel <= potLevel);

    this.reels.forEach(reel => {
      reel.state = 'spinning';
      reel.morphTimer = 0;
      reel.morphIndex = Math.floor(Math.random() * unlockedKeys.length);
      reel.imprintProgress = 1.0;
      reel.isNearMiss = false;

      // 生成激荡过程中的神印候选流
      reel.bufferSymbols = [];
      for (let k = 0; k < 12; k++) {
        const rndKey = unlockedKeys[Math.floor(Math.random() * unlockedKeys.length)];
        reel.bufferSymbols.push(rndKey);
      }
    });

    // 阵盘中央爆发一圈引灵光波
    this.imprintShockwaves.push({
      x: this.logicalWidth / 2,
      y: this.logicalHeight / 2,
      radius: 20,
      maxRadius: 360,
      alpha: 0.8,
      color: '#38bdf8'
    });

    window.SlotsRPG.EventBus.emit('SPIN_START');
    if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
      window.SlotsRPG.SoundEffects.play('REEL_SPIN');
    }
  }

  /**
   * 停止推演并载入天机结算法果
   * @param {Object} spinData - SlotsEngine.spin 返回的对象
   */
  stopSpin(spinData, onComplete) {
    const { grid, evaluation, nearMiss } = spinData;
    const isNearMiss = !!(nearMiss && (nearMiss.isNearMissMonster || nearMiss.isNearMissBonus));

    // 1. 预先解析所有共鸣阵眼坐标 (Row, Col)
    const winningMap = new Map();
    this.winningLines = evaluation.winningLines || [];

    // 收集常规阵纹连线
    this.winningLines.forEach(line => {
      if (!line.coords) return;
      line.coords.forEach((coordItem, idx) => {
        const row = Array.isArray(coordItem) ? coordItem[0] : coordItem;
        const col = Array.isArray(coordItem) ? coordItem[1] : idx;
        if (grid && grid[row] && grid[row][col] !== undefined) {
          winningMap.set(`${row},${col}`, {
            symbolId: grid[row][col],
            color: line.color || '#ffd700'
          });
        }
      });
    });

    // 收集妖兽 SCATTER (>= 3)
    if (evaluation.hasTriggeredBattle) {
      evaluation.scatterCoords.forEach(({ r, c }) => {
        winningMap.set(`${r},${c}`, {
          symbolId: 'SYM_12',
          color: '#f43f5e'
        });
      });
    }

    // 收集秘境 BONUS (>= 5)
    if (evaluation.hasTriggeredBonus) {
      evaluation.bonusCoords.forEach(({ r, c }) => {
        winningMap.set(`${r},${c}`, {
          symbolId: 'SYM_13',
          color: '#34d399'
        });
      });
    }

    // 2. 逐列【法印归元 · 阵眼定穴】逻辑 (维持从左到右紧张期待感)
    this.reels.forEach((reel, c) => {
      let delay = 320 + c * 210;

      // 若处于 Near-Miss 且为第 2, 3, 4 列，开启天道聚灵悬念减速
      if (isNearMiss && c >= 2) {
        reel.isNearMiss = true;
        this.nearMissCols.push(c);
        const extraNearMiss = (c - 1) * 750;
        delay += extraNearMiss;

        if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
          window.SlotsRPG.SoundEffects.play('NEAR_MISS', extraNearMiss);
        }
      }

      setTimeout(() => {
        // 本列定穴：装填真实推演结果并触发法印冲击波
        reel.symbols = [grid[0][c], grid[1][c], grid[2][c]];
        reel.state = 'imprinting';
        reel.imprintProgress = 0;

        // 3 处阵眼同时爆发定穴灵波
        const colCenterX = (c + 0.5) * this.colWidth;
        for (let r = 0; r < 3; r++) {
          const rowCenterY = (r + 0.5) * this.rowHeight;
          this.imprintShockwaves.push({
            x: colCenterX,
            y: rowCenterY,
            radius: 10,
            maxRadius: 55,
            alpha: 0.9,
            color: '#ffd700'
          });
        }

        // 播放法印扣合仙音
        if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
          window.SlotsRPG.SoundEffects.play('REEL_STOP', c);
        }

        // 最后一列定穴完毕：进入静观与灵脉共鸣阶段
        if (c === 4) {
          setTimeout(() => {
            this.activeWinningCells = winningMap;
            this.isDissolving = true;

            // 播放阵纹共鸣大捷仙乐
            if (winningMap.size > 0 && window.SlotsRPG && window.SlotsRPG.SoundEffects) {
              window.SlotsRPG.SoundEffects.play('WIN_LINE');
            }

            // 等待灵脉展开后，完成流程回调
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
                console.error('[CanvasRenderer] 结算回调异常:', err);
              } finally {
                window.SlotsRPG.EventBus.emit('SPIN_STOP', spinData);
              }
            }, 360);
          }, 380);
        }
      }, delay);
    });
  }

  /**
   * 启动宗门真传法牒高光展示特效
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

    // 为每个中奖法牒阵眼播撒金青色飞升灵气粒子
    this.sectTicketCells.forEach(({ r, c }) => {
      const colX = c * this.colWidth;
      const rowY = r * this.rowHeight;
      if (!Number.isFinite(colX) || !Number.isFinite(rowY)) return;
      for (let i = 0; i < 12; i++) {
        this.sectTicketParticles.push({
          r, c,
          baseX: colX + this.colWidth / 2,
          baseY: rowY + this.rowHeight - 12,
          x: colX + 16 + Math.random() * (this.colWidth - 32),
          y: rowY + 10 + Math.random() * (this.rowHeight - 20),
          speedY: 0.6 + Math.random() * 0.9,
          swaySpeed: 0.04 + Math.random() * 0.06,
          angle: Math.random() * Math.PI * 2,
          size: 1.8 + Math.random() * 2.4,
          alpha: 0.4 + Math.random() * 0.6
        });
      }
    });
  }

  stopSectTicketShowcase() {
    this.isSectTicketShowcase = false;
    this.sectTicketCells = [];
    this.sectTicketParticles = [];
  }

  /**
   * 动画渲染主循环
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
    this.taijiAngle += 0.008;

    // 1. 更新各列阵眼状态 (灵气激荡与定穴冲击波)
    this.reels.forEach(reel => {
      if (reel.state === 'spinning') {
        reel.morphTimer += 1;
        // 每 3 帧快速轮转一次神印，产生星宿瞬息幻化效果
        if (reel.morphTimer >= 3) {
          reel.morphTimer = 0;
          reel.morphIndex = (reel.morphIndex + 1) % reel.bufferSymbols.length;
        }
      } else if (reel.state === 'imprinting') {
        reel.imprintProgress += 0.08;
        if (reel.imprintProgress >= 1.0) {
          reel.imprintProgress = 1.0;
          reel.state = 'idle';
        }
      }
    });

    // 2. 更新非共鸣阵眼消融淡出
    if (this.isDissolving && this.nonWinningAlpha > 0.25) {
      this.nonWinningAlpha = Math.max(0.25, this.nonWinningAlpha - 0.045);
    }

    // 3. 更新定穴灵波冲击环
    for (let i = this.imprintShockwaves.length - 1; i >= 0; i--) {
      const sw = this.imprintShockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 0.18 + 1.2;
      sw.alpha -= 0.045;
      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        this.imprintShockwaves.splice(i, 1);
      }
    }

    // 4. 更新宗门真传灵光粒子
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

    // 5. 更新飘字
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

    const now = Date.now();
    const breathPulse = 0.5 + 0.5 * Math.sin(now / 220);

    // 1. 渲染古玉青铜【周天奇门阵盘】底座与八卦天象
    this._renderArrayPlateBackground(ctx, breathPulse);

    const gm = window.SlotsRPG.GameManager;
    const potLevel = gm ? gm.level : 1;
    const worldTier = gm ? (gm.currentWorldTier || 1) : 1;

    // 2. 渲染 15 处天机符穴 (阵眼) 与承载神物
    for (let c = 0; c < 5; c++) {
      const reel = this.reels[c];
      const colX = c * this.colWidth;

      // Near-Miss 天象预警灵柱
      if (reel.isNearMiss && reel.state === 'spinning') {
        this._drawNearMissCelestialTension(ctx, colX, breathPulse);
      }

      for (let r = 0; r < 3; r++) {
        const rowY = r * this.rowHeight;
        const cellKey = `${r},${c}`;
        const isWinning = this.activeWinningCells.has(cellKey);

        // 绘制青铜灵玉凹槽阵眼
        this._drawArrayBasin(
          ctx, colX, rowY, this.colWidth, this.rowHeight,
          isWinning, reel.state === 'spinning', breathPulse,
          reel.state === 'imprinting', reel.imprintProgress
        );

        // 获取当前阵眼展示的法宝/神印
        let symId = null;
        let isSpinActive = false;

        if (reel.state === 'spinning') {
          isSpinActive = true;
          const idx = (reel.morphIndex + r * 3) % reel.bufferSymbols.length;
          symId = reel.bufferSymbols[idx];
        } else {
          symId = reel.symbols[r];
        }

        if (symId) {
          ctx.save();
          if (isWinning) {
            ctx.globalAlpha = 1.0;
            this.symbolPainter.drawSymbol(ctx, symId, colX, rowY, this.colWidth, this.rowHeight, true, potLevel, worldTier);
            // 阵眼共鸣神圣光环
            this._drawWinningBasinResonance(ctx, colX, rowY, this.colWidth, this.rowHeight, breathPulse);
          } else if (isSpinActive) {
            // 激荡推演中：伴随微弱仙光灵气虚影
            ctx.globalAlpha = 0.85;
            this.symbolPainter.drawSymbol(ctx, symId, colX, rowY, this.colWidth, this.rowHeight, false, potLevel, worldTier);
          } else {
            // 定穴停驻：非共鸣阵眼优雅隐入玉石石纹
            ctx.globalAlpha = this.nonWinningAlpha;
            this.symbolPainter.drawSymbol(ctx, symId, colX, rowY, this.colWidth, this.rowHeight, false, potLevel, worldTier);
          }
          ctx.restore();
        }
      }
    }

    // 3. 渲染定穴冲击灵波
    this._renderShockwaves(ctx);

    // 4. 渲染【天道灵脉阵纹 (Winning Veins)】连携闪电与星轨
    if (this.winningLines && this.winningLines.length > 0 && this.isDissolving) {
      this._drawCelestialVeinPaylines(ctx, breathPulse);
    }

    // 5. 门派门票专属高光祥瑞霞光
    if (this.isSectTicketShowcase && this.sectTicketCells.length > 0) {
      this.sectTicketCells.forEach(({ r, c }) => {
        const colX = c * this.colWidth;
        const rowY = r * this.rowHeight;
        this._drawSectTicketWinningAura(ctx, colX, rowY, this.colWidth, this.rowHeight, breathPulse);
      });

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

    // 6. 飘字渲染
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
   * 绘制古玉青铜【周天奇门阵盘】底座与八卦星野纹理
   * 升级：星空宇宙背景 + 巨型圆形铜质阵盘外环 + 翡翠玉青色调
   */
  _renderArrayPlateBackground(ctx, breathPulse) {
    const w = this.logicalWidth;
    const h = this.logicalHeight;
    const cx = w / 2;
    const cy = h / 2;

    // 1. 深邃星空宇宙底色（深蓝玄青）
    const bgGrad = ctx.createRadialGradient(cx, cy * 0.6, 20, cx, cy, w * 0.85);
    bgGrad.addColorStop(0, '#0a1e2a');
    bgGrad.addColorStop(0.35, '#071828');
    bgGrad.addColorStop(0.7, '#050f1a');
    bgGrad.addColorStop(1, '#030810');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. 宇宙星野随机星点（一次初始化，持久闪烁）
    if (!this._stars) {
      this._stars = [];
      for (let i = 0; i < 90; i++) {
        this._stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.4 + 0.2,
          phase: Math.random() * Math.PI * 2,
          color: Math.random() > 0.7 ? 'rgba(160,220,255,' : 'rgba(200,230,255,'
        });
      }
    }
    const now = Date.now();
    this._stars.forEach(s => {
      const alpha = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(now / 1500 + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color + alpha.toFixed(2) + ')';
      ctx.fill();
    });

    // 3. 圆形阵盘星域大气辉光（青翠灵气）
    const diskR = Math.min(w * 0.56, h * 0.92);
    ctx.save();
    ctx.translate(cx, cy);

    const atmGlow = ctx.createRadialGradient(0, 0, diskR * 0.35, 0, 0, diskR * 1.15);
    atmGlow.addColorStop(0, `rgba(0, 120, 100, ${0.12 + 0.06 * breathPulse})`);
    atmGlow.addColorStop(0.5, `rgba(0, 90, 70, ${0.07 + 0.03 * breathPulse})`);
    atmGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = atmGlow;
    ctx.beginPath();
    ctx.arc(0, 0, diskR * 1.25, 0, Math.PI * 2);
    ctx.fill();

    // 4. 外圈主铜环（厚实，古朴青铜质感）
    ctx.shadowColor = `rgba(0, 190, 150, ${0.5 + 0.2 * breathPulse})`;
    ctx.shadowBlur = 20 + 12 * breathPulse;
    ctx.strokeStyle = `rgba(40, 150, 120, ${0.7 + 0.15 * breathPulse})`;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(0, 0, diskR, 0, Math.PI * 2);
    ctx.stroke();

    // 4b. 内侧金色细纹
    ctx.shadowBlur = 5;
    ctx.strokeStyle = `rgba(180, 140, 50, ${0.55 + 0.15 * breathPulse})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, diskR - 10, 0, Math.PI * 2);
    ctx.stroke();
    // 最内侧翠玉边线
    ctx.strokeStyle = `rgba(0, 160, 120, ${0.3 + 0.1 * breathPulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, diskR - 14, 0, Math.PI * 2);
    ctx.stroke();

    // 5. 外圈旋转古文字铭刻（缓慢转动）
    ctx.save();
    ctx.rotate(this.taijiAngle * 0.25);
    const inscriptions = '周天奇门阵法震坎艮离坤兑乾巽';
    const charFontSize = Math.round(diskR * 0.085);
    ctx.font = `${charFontSize}px serif`;
    ctx.fillStyle = `rgba(180, 145, 55, ${0.4 + 0.12 * breathPulse})`;
    ctx.shadowColor = '#c8a82a';
    ctx.shadowBlur = 5;
    inscriptions.split('').forEach((ch, i) => {
      const angle = (i / inscriptions.length) * Math.PI * 2 - Math.PI / 2;
      ctx.save();
      ctx.rotate(angle);
      ctx.translate(0, -(diskR - 5));
      ctx.fillText(ch, -charFontSize * 0.45, charFontSize * 0.38);
      ctx.restore();
    });
    ctx.restore();

    ctx.restore(); // undo translate(cx, cy)

    // 6. 阵盘中心太极气旋暗纹（旋转缓慢）
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.taijiAngle);
    ctx.globalAlpha = 0.06 + 0.03 * breathPulse;
    ctx.strokeStyle = '#00c8a0';
    ctx.lineWidth = 1.5;
    const tR = Math.min(w, h) * 0.35;
    ctx.beginPath();
    ctx.arc(0, 0, tR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -tR / 2, tR / 2, -Math.PI / 2, Math.PI / 2);
    ctx.arc(0, tR / 2, tR / 2, Math.PI / 2, -Math.PI / 2, true);
    ctx.stroke();
    ctx.restore();

    // 7. 四角周易卦象刻文（颜色换为翠绿金调）
    ctx.save();
    ctx.font = 'bold 12px serif';
    ctx.fillStyle = `rgba(0, 180, 140, ${0.4 + 0.15 * breathPulse})`;
    ctx.shadowColor = '#00c896';
    ctx.shadowBlur = 5;
    ctx.fillText('☰ 乾', 10, 18);
    ctx.fillText('☲ 离', w - 40, 18);
    ctx.fillText('☵ 坎', 10, h - 8);
    ctx.fillText('☷ 坤', w - 40, h - 8);
    ctx.restore();

    // 8. 行列分界细刻道痕（翠绿色）
    ctx.strokeStyle = 'rgba(0, 160, 120, 0.1)';
    ctx.lineWidth = 1;
    for (let c = 1; c < 5; c++) {
      const px = c * this.colWidth;
      ctx.beginPath();
      ctx.moveTo(px, 6);
      ctx.lineTo(px, h - 6);
      ctx.stroke();
    }
    for (let r = 1; r < 3; r++) {
      const ry = r * this.rowHeight;
      ctx.beginPath();
      ctx.moveTo(6, ry);
      ctx.lineTo(w - 6, ry);
      ctx.stroke();
    }
  }

  /**
   * 绘制 1 处独立凹槽阵眼 (Carved Jade Array Basin)
   * 升级：翡翠玉石绿底色 + 青铜边框 + 青绿激荡态
   */
  _drawArrayBasin(ctx, x, y, w, h, isWinning, isSpinning, pulse, isImprinting, imprintProgress) {
    const pad = 5;
    const basinW = w - pad * 2;
    const basinH = h - pad * 2;
    const bx = x + pad;
    const by = y + pad;
    const radius = 9;

    ctx.save();

    // 1. 凹槽翡翠玉石底色（深绿玉质）
    ctx.beginPath();
    this.symbolPainter._drawRoundedRect(ctx, bx, by, basinW, basinH, radius);

    if (isWinning) {
      // 中奖：金绿泛光玉石
      const grad = ctx.createLinearGradient(bx, by, bx, by + basinH);
      grad.addColorStop(0, 'rgba(22, 48, 28, 0.98)');
      grad.addColorStop(0.4, 'rgba(14, 34, 18, 0.96)');
      grad.addColorStop(1, 'rgba(8, 22, 12, 0.98)');
      ctx.fillStyle = grad;
    } else if (isSpinning) {
      // 激荡推演中：更亮的翠玉
      const grad = ctx.createLinearGradient(bx, by, bx, by + basinH);
      grad.addColorStop(0, 'rgba(14, 42, 28, 0.95)');
      grad.addColorStop(0.5, 'rgba(9, 30, 18, 0.93)');
      grad.addColorStop(1, 'rgba(6, 20, 12, 0.95)');
      ctx.fillStyle = grad;
    } else {
      // 普通静止：深翡翠玉石绿
      const grad = ctx.createLinearGradient(bx, by, bx, by + basinH);
      grad.addColorStop(0, 'rgba(12, 34, 20, 0.92)');
      grad.addColorStop(0.5, 'rgba(8, 24, 14, 0.9)');
      grad.addColorStop(1, 'rgba(5, 16, 10, 0.92)');
      ctx.fillStyle = grad;
    }
    ctx.fill();

    // 2. 阵眼外框（青铜玉质边缘）
    if (isSpinning) {
      // 激荡推演：青翠流光灵气光晕
      ctx.strokeStyle = `rgba(0, 210, 165, ${0.45 + 0.3 * pulse})`;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#00d4b0';
      ctx.shadowBlur = 12 * pulse;
    } else {
      ctx.strokeStyle = isWinning
        ? `rgba(255, 215, 0, ${0.8 + 0.2 * pulse})`
        : `rgba(0, 150, 110, ${0.4 + 0.15 * pulse})`;
      ctx.lineWidth = isWinning ? 2.2 : 1.5;
      ctx.shadowColor = isWinning ? '#ffd700' : '#009070';
      ctx.shadowBlur = isWinning ? 14 * pulse : 5;
    }
    ctx.stroke();

    // 3. 阵眼四角青铜嵌玉灵钉 (Corner Rivets)
    ctx.fillStyle = isWinning ? '#ffd700' : `rgba(0, 180, 130, ${0.5 + 0.15 * pulse})`;
    const rivetSize = 2.5;
    ctx.shadowBlur = 0;
    ctx.fillRect(bx + 4, by + 4, rivetSize, rivetSize);
    ctx.fillRect(bx + basinW - 6, by + 4, rivetSize, rivetSize);
    ctx.fillRect(bx + 4, by + basinH - 6, rivetSize, rivetSize);
    ctx.fillRect(bx + basinW - 6, by + basinH - 6, rivetSize, rivetSize);

    // 4. 定穴瞬间：中心爆闪一道法印烙印符纹
    if (isImprinting && imprintProgress < 0.9) {
      const flashAlpha = Math.max(0, (1 - imprintProgress) * 0.65);
      ctx.fillStyle = `rgba(200, 255, 230, ${flashAlpha})`;
      ctx.beginPath();
      this.symbolPainter._drawRoundedRect(ctx, bx, by, basinW, basinH, radius);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * 绘制中奖阵眼的道韵共鸣灵环
   */
  _drawWinningBasinResonance(ctx, x, y, w, h, pulse) {
    const pad = 4;
    const radius = 10;
    ctx.save();

    // 内部温养金霞
    ctx.beginPath();
    this.symbolPainter._drawRoundedRect(ctx, x + pad, y + pad, w - pad * 2, h - pad * 2, radius);
    ctx.fillStyle = `rgba(255, 215, 0, ${0.08 + 0.14 * pulse})`;
    ctx.fill();

    // 外圈双层炽烈阵雷辉光
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 12 + 18 * pulse;
    ctx.strokeStyle = `rgba(255, 220, 80, ${0.7 + 0.3 * pulse})`;
    ctx.lineWidth = 3 + 1.5 * pulse;
    ctx.stroke();

    // 四角舒张阵纹角标
    const cornerLen = 9 + 4 * pulse;
    ctx.fillStyle = '#ffd700';
    ctx.shadowBlur = 8 * pulse;

    ctx.fillRect(x + pad - 1, y + pad - 1, cornerLen, 3);
    ctx.fillRect(x + pad - 1, y + pad - 1, 3, cornerLen);
    ctx.fillRect(x + w - pad - cornerLen + 1, y + pad - 1, cornerLen, 3);
    ctx.fillRect(x + w - pad - 2, y + pad - 1, 3, cornerLen);
    ctx.fillRect(x + pad - 1, y + h - pad - 2, cornerLen, 3);
    ctx.fillRect(x + pad - 1, y + h - pad - cornerLen + 1, 3, cornerLen);
    ctx.fillRect(x + w - pad - cornerLen + 1, y + h - pad - 2, cornerLen, 3);
    ctx.fillRect(x + w - pad - 2, y + h - pad - cornerLen + 1, 3, cornerLen);

    ctx.restore();
  }

  /**
   * 绘制【天道灵脉阵纹 (Winning Veins)】：雷火星轨连携
   */
  _drawCelestialVeinPaylines(ctx, pulse) {
    if (!Array.isArray(this.winningLines) || this.winningLines.length === 0) return;

    const now = Date.now();
    ctx.save();

    this.winningLines.forEach((line, lineIdx) => {
      if (!line.coords || line.coords.length < 3) return;

      // 规范化坐标为 [[row, col], [row, col], ...]
      const normCoords = line.coords.map((item, idx) => {
        if (Array.isArray(item)) return [item[0], item[1]];
        return [item, idx];
      });
      const count = normCoords.length;
      const color = line.color || '#ffd700';

      // 1. 绘制底层宽幅灵脉辉光带
      ctx.beginPath();
      normCoords.forEach(([r, c], idx) => {
        const px = (c + 0.5) * this.colWidth;
        const py = (r + 0.5) * this.rowHeight;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.25 + 0.2 * pulse})`;
      ctx.lineWidth = 14 + 4 * pulse;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 22;
      ctx.stroke();

      // 2. 绘制中层雷光电弧核心
      ctx.beginPath();
      normCoords.forEach(([r, c], idx) => {
        const px = (c + 0.5) * this.colWidth;
        const py = (r + 0.5) * this.rowHeight;
        // 细微闪电抖动
        const jitterY = (idx > 0 && idx < count - 1) ? Math.sin(now / 45 + idx * 2) * 2.5 : 0;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py + jitterY);
      });
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.85 + 0.15 * pulse})`;
      ctx.lineWidth = 3.6;
      ctx.stroke();

      // 3. 在各连接阵眼节点绘制聚灵光核
      normCoords.forEach(([r, c]) => {
        const px = (c + 0.5) * this.colWidth;
        const py = (r + 0.5) * this.rowHeight;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(px, py, 4.5 + 2 * pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. 在首个阵眼上方漂浮共鸣尊号 (三才归元 / 四象同辉 / 五行合一)
      if (lineIdx === 0 && normCoords.length > 0) {
        const firstR = normCoords[0][0];
        const firstC = normCoords[0][1];
        const tagX = (firstC + 0.5) * this.colWidth;
        const tagY = (firstR + 0.5) * this.rowHeight - 38;

        let comboTitle = '✨ 阵纹共鸣';
        if (count === 3) comboTitle = '⚡ 三才归元';
        else if (count === 4) comboTitle = '🌟 四象同辉';
        else if (count >= 5) comboTitle = '👑 五行合一 · 天道显圣';

        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 8;
        ctx.fillText(comboTitle, tagX, tagY);
      }
    });

    ctx.restore();
  }

  /**
   * 绘制 Near-Miss 天象预警悬念灵柱
   */
  _drawNearMissCelestialTension(ctx, colX, breathPulse) {
    ctx.save();
    // 从天穹垂落的八卦阵雷灵柱
    const grad = ctx.createLinearGradient(colX, 0, colX, this.logicalHeight);
    grad.addColorStop(0, `rgba(255, 215, 0, ${0.5 + 0.4 * breathPulse})`);
    grad.addColorStop(0.5, `rgba(168, 85, 247, ${0.25 + 0.25 * breathPulse})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(colX + 3, 0, this.colWidth - 6, this.logicalHeight);

    ctx.strokeStyle = `rgba(255, 215, 0, ${0.6 + 0.4 * breathPulse})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 18;
    ctx.strokeRect(colX + 3, 3, this.colWidth - 6, this.logicalHeight - 6);

    ctx.restore();
  }

  /**
   * 绘制定穴冲击波
   */
  _renderShockwaves(ctx) {
    if (this.imprintShockwaves.length === 0) return;
    ctx.save();
    this.imprintShockwaves.forEach(sw => {
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.lineWidth = 2.2;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 10;
      ctx.stroke();
    });
    ctx.restore();
  }

  /**
   * 绘制宗门真传法牒专属高光道印与金色飞升霞光
   */
  _drawSectTicketWinningAura(ctx, x, y, w, h, pulse) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) return;
    const pad = 5;
    const radius = 10;
    ctx.save();

    const centerX = x + w / 2;
    const centerY = y + h / 2;
    const rad = ctx.createRadialGradient(centerX, centerY, 8, centerX, centerY, w * 0.65);
    rad.addColorStop(0, `rgba(255, 215, 0, ${0.2 + 0.15 * pulse})`);
    rad.addColorStop(0.55, `rgba(52, 232, 158, ${0.1 + 0.1 * pulse})`);
    rad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    this.symbolPainter._drawRoundedRect(ctx, x + pad, y + pad, w - pad * 2, h - pad * 2, radius);
    ctx.fillStyle = rad;
    ctx.fill();

    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 16 + 12 * pulse;
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.8 + 0.2 * pulse})`;
    ctx.lineWidth = 3.2 + 1.2 * pulse;
    ctx.stroke();

    // 顶部仙门法牒徽章浮标
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
