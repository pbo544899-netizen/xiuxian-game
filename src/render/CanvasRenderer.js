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

    // 【方案B·周天奇门阵盘 · 浑天浑元罗盘】
    this.logicalWidth  = 680;
    this.logicalHeight = 680;   // 正方形画布，完全契合圆形阵盘
    this.diskCX = 340;
    this.diskCY = 340;
    this.diskRadius  = 320;     // 奇门阵盘外环半径

    // 内部玉石阵眼矩阵 (5 列 x 3 行，单元格 100x100，完全内嵌于阵盘内，四周留有雕花神印)
    this.colWidth  = 100;
    this.rowHeight = 100;
    this.gridWidth  = this.colWidth * 5;  // 500
    this.gridHeight = this.rowHeight * 3; // 300
    this.gridOffsetX = (this.logicalWidth - this.gridWidth) / 2; // 90
    this.gridOffsetY = 205; // 居中微下移，上方为太极神印天枢拱门预留 145px

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
      ft.y -= 0.65;
      ft.alpha -= 0.012;
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

    const now = Date.now();
    const breathPulse = 0.5 + 0.5 * Math.sin(now / 220);

    // 1. 渲染完整的圆形阵盘底座（星空 + 巨型铜环 + 上方太极法印 + 玉石衬底 + 底部莲花托座）
    this._renderArrayPlateBackground(ctx, breathPulse);

    const gm = window.SlotsRPG.GameManager;
    const potLevel = gm ? gm.level : 1;
    const worldTier = gm ? (gm.currentWorldTier || 1) : 1;

    // ── 开始阵盘内部 15 处天机符穴渲染区 ──────────────────────
    ctx.save();
    // 平移到玉石阵座坐标系 (X: 90, Y: 205)
    ctx.translate(this.gridOffsetX, this.gridOffsetY);

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

        // 绘制翡翠玉石凹槽阵眼
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
            this._drawWinningBasinResonance(ctx, colX, rowY, this.colWidth, this.rowHeight, breathPulse);
          } else if (isSpinActive) {
            ctx.globalAlpha = 0.85;
            this.symbolPainter.drawSymbol(ctx, symId, colX, rowY, this.colWidth, this.rowHeight, false, potLevel, worldTier);
          } else {
            ctx.globalAlpha = this.nonWinningAlpha;
            this.symbolPainter.drawSymbol(ctx, symId, colX, rowY, this.colWidth, this.rowHeight, false, potLevel, worldTier);
          }
          ctx.restore();
        }
      }
    }

    // 3. 渲染定穴冲击灵波（在 translate 区内，坐标完全自适应）
    this._renderShockwaves(ctx);

    // 4. 渲染【天道灵脉阵纹】连携闪电与星轨
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

    // 6. 飘字渲染（自适应多行换行与显式 \n 折行，带暗金半透胶囊底板与仙韵边框）
    const maxCanvasTextWidth = Math.max(180, (this.logicalWidth || 360) - 44);
    const fontStr = 'bold 13.5px "STKaiti", "KaiTi", "Songti SC", serif';
    const lineHeight = 19;
    const padX = 14;
    const padY = 7;

    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, ft.alpha));
      ctx.font = fontStr;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const rawLines = String(ft.text || '').split('\n');
      const formattedLines = [];

      for (const rawLine of rawLines) {
        if (!rawLine) continue;
        let cur = '';
        for (let i = 0; i < rawLine.length; i++) {
          const ch = rawLine[i];
          const test = cur + ch;
          if (ctx.measureText(test).width > maxCanvasTextWidth && cur.length > 0) {
            formattedLines.push(cur);
            cur = ch;
          } else {
            cur = test;
          }
        }
        if (cur.length > 0) formattedLines.push(cur);
      }

      if (formattedLines.length === 0) {
        ctx.restore();
        return;
      }

      let maxLineWidth = 0;
      for (const line of formattedLines) {
        const w = ctx.measureText(line).width;
        if (w > maxLineWidth) maxLineWidth = w;
      }

      const boxW = Math.min((this.logicalWidth || 360) - 20, Math.max(64, maxLineWidth + padX * 2));
      const boxH = padY * 2 + formattedLines.length * lineHeight;
      const boxX = ft.x - boxW / 2;
      const boxY = ft.y - boxH / 2;
      const radius = Math.min(13, boxH / 2);

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(boxX, boxY, boxW, boxH, radius);
      } else {
        ctx.rect(boxX, boxY, boxW, boxH);
      }
      ctx.fillStyle = 'rgba(8, 14, 24, 0.90)';
      ctx.shadowColor = ft.color || '#ffd700';
      ctx.shadowBlur = 10;
      ctx.fill();

      ctx.strokeStyle = ft.color || '#ffd700';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = ft.color || '#ffd700';
      ctx.shadowBlur = 4;
      const startY = boxY + padY + lineHeight / 2;
      for (let li = 0; li < formattedLines.length; li++) {
        ctx.fillText(formattedLines[li], ft.x, startY + li * lineHeight);
      }
      ctx.restore();
    });

    ctx.restore(); // 恢复：移除平移
    // ── 符穴内部渲染区结束 ─────────────────────────────────

    // 7. 在外层绘制巨型铜环外围、旋转铭文与八卦灵珠
    this._renderDiskOuterRing(ctx, breathPulse);
  }

  /**
   * 绘制浑天奇门阵盘底座与天象：
   * 1. 虚空星野
   * 2. 巨型玄铜底盘
   * 3. 顶部太极阴阳天枢印 (带缓慢旋转与仙气弥漫)
   * 4. 浑元翡翠玉牒底座 (承载 15 处阵眼)
   * 5. 底部地脉铜莲托座
   */
  _renderArrayPlateBackground(ctx, breathPulse) {
    const w  = this.logicalWidth;
    const h  = this.logicalHeight;
    const cx = this.diskCX; // 340
    const cy = this.diskCY; // 340
    const diskR = this.diskRadius; // 320

    // 1. 全域深邃星空底色
    const bgGrad = ctx.createRadialGradient(cx, cy * 0.7, 20, cx, cy, w * 0.72);
    bgGrad.addColorStop(0, '#0b202f');
    bgGrad.addColorStop(0.35, '#071726');
    bgGrad.addColorStop(0.75, '#040d17');
    bgGrad.addColorStop(1, '#02060b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. 星野随机闪烁星芒
    if (!this._stars) {
      this._stars = [];
      for (let i = 0; i < 110; i++) {
        this._stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.5 + 0.2,
          phase: Math.random() * Math.PI * 2,
          color: Math.random() > 0.65 ? 'rgba(160,230,255,' : 'rgba(210,240,255,'
        });
      }
    }
    const now = Date.now();
    this._stars.forEach(s => {
      const alpha = 0.15 + 0.5 * (0.5 + 0.5 * Math.sin(now / 1500 + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color + alpha.toFixed(2) + ')';
      ctx.fill();
    });

    // 3. 巨型圆盘主体内部深青玉质填充
    ctx.save();
    ctx.translate(cx, cy);

    const plateFill = ctx.createRadialGradient(0, 0, 0, 0, 0, diskR - 22);
    plateFill.addColorStop(0,   `rgba(8, 32, 22, ${0.92 + 0.04 * breathPulse})`);
    plateFill.addColorStop(0.65, `rgba(5, 20, 14, 0.96)`);
    plateFill.addColorStop(1,   `rgba(3, 12, 8, 0.98)`);
    ctx.fillStyle = plateFill;
    ctx.beginPath();
    ctx.arc(0, 0, diskR - 20, 0, Math.PI * 2);
    ctx.fill();

    // 内部青翠灵气氤氲
    const nebulaGlow = ctx.createRadialGradient(0, -60, 20, 0, 0, diskR * 0.95);
    nebulaGlow.addColorStop(0, `rgba(0, 160, 120, ${0.16 + 0.08 * breathPulse})`);
    nebulaGlow.addColorStop(0.5, `rgba(0, 100, 75, ${0.08 + 0.04 * breathPulse})`);
    nebulaGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = nebulaGlow;
    ctx.beginPath();
    ctx.arc(0, 0, diskR - 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // 退出圆心坐标系

    // 4. 【顶部太极阴阳天枢印】（位于玉牒上方，拱卫天心）
    const taijiCenterY = 126;
    const taijiR = 26;
    ctx.save();

    // 太极拱门青铜基座
    ctx.beginPath();
    ctx.arc(cx, taijiCenterY, taijiR + 8, Math.PI * 0.85, Math.PI * 2.15);
    ctx.strokeStyle = `rgba(180, 140, 50, ${0.65 + 0.2 * breathPulse})`;
    ctx.lineWidth = 4;
    ctx.shadowColor = '#c8a020';
    ctx.shadowBlur = 10;
    ctx.stroke();

    // 两侧青铜祥云舒展飞翼
    ctx.strokeStyle = `rgba(40, 150, 120, ${0.6 + 0.15 * breathPulse})`;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(cx - taijiR - 8, taijiCenterY);
    ctx.bezierCurveTo(cx - taijiR - 35, taijiCenterY - 15, cx - taijiR - 60, taijiCenterY + 12, cx - taijiR - 85, taijiCenterY + 4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + taijiR + 8, taijiCenterY);
    ctx.bezierCurveTo(cx + taijiR + 35, taijiCenterY - 15, cx + taijiR + 60, taijiCenterY + 12, cx + taijiR + 85, taijiCenterY + 4);
    ctx.stroke();

    // 旋转太极双鱼玉核
    ctx.translate(cx, taijiCenterY);
    ctx.rotate(this.taijiAngle * 0.8);

    // 外圈金边
    ctx.beginPath();
    ctx.arc(0, 0, taijiR, 0, Math.PI * 2);
    ctx.fillStyle = '#051810';
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00e6a8';
    ctx.shadowBlur = 12 * breathPulse;
    ctx.stroke();

    // 阳半弧 (青翠灵玉)
    ctx.beginPath();
    ctx.arc(0, 0, taijiR, -Math.PI / 2, Math.PI / 2);
    ctx.arc(0, taijiR / 2, taijiR / 2, Math.PI / 2, -Math.PI / 2, true);
    ctx.arc(0, -taijiR / 2, taijiR / 2, Math.PI / 2, -Math.PI / 2, false);
    ctx.fillStyle = '#00d492';
    ctx.fill();

    // 阴半弧 (皓白仙辉)
    ctx.beginPath();
    ctx.arc(0, 0, taijiR, Math.PI / 2, -Math.PI / 2);
    ctx.arc(0, -taijiR / 2, taijiR / 2, -Math.PI / 2, Math.PI / 2, true);
    ctx.arc(0, taijiR / 2, taijiR / 2, -Math.PI / 2, Math.PI / 2, false);
    ctx.fillStyle = '#e8fbf3';
    ctx.fill();

    // 阳鱼眼 (皓白)
    ctx.beginPath();
    ctx.arc(0, -taijiR / 2, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#e8fbf3';
    ctx.fill();

    // 阴鱼眼 (翠绿)
    ctx.beginPath();
    ctx.arc(0, taijiR / 2, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#00d492';
    ctx.fill();

    ctx.restore(); // 退出太极中心

    // 5. 【浑元翡翠玉牒底座】(承托 15 处阵眼的统一玉石碑面)
    const gx = this.gridOffsetX; // 90
    const gy = this.gridOffsetY; // 205
    const gw = this.gridWidth;   // 500
    const gh = this.gridHeight;  // 300
    const plaquePad = 8;
    const px = gx - plaquePad;
    const py = gy - plaquePad;
    const pw = gw + plaquePad * 2;
    const ph = gh + plaquePad * 2;

    ctx.save();
    // 玉牒底板
    this.symbolPainter._drawRoundedRect(ctx, px, py, pw, ph, 14);
    const jadePlaqueGrad = ctx.createLinearGradient(px, py, px, py + ph);
    jadePlaqueGrad.addColorStop(0, 'rgba(14, 45, 30, 0.94)');
    jadePlaqueGrad.addColorStop(0.5, 'rgba(8, 28, 18, 0.96)');
    jadePlaqueGrad.addColorStop(1, 'rgba(5, 18, 12, 0.98)');
    ctx.fillStyle = jadePlaqueGrad;
    ctx.fill();

    // 玉牒青铜外框
    ctx.strokeStyle = `rgba(0, 160, 120, ${0.45 + 0.15 * breathPulse})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00a87a';
    ctx.shadowBlur = 8;
    ctx.stroke();

    // 玉牒内圈金色饰线
    ctx.shadowBlur = 0;
    this.symbolPainter._drawRoundedRect(ctx, px + 3, py + 3, pw - 6, ph - 6, 12);
    ctx.strokeStyle = `rgba(180, 140, 50, ${0.4 + 0.15 * breathPulse})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 阵眼行列分界细雕青铜道纹
    ctx.strokeStyle = 'rgba(0, 150, 110, 0.15)';
    ctx.lineWidth = 1;
    for (let c = 1; c < 5; c++) {
      const colLineX = gx + c * this.colWidth;
      ctx.beginPath();
      ctx.moveTo(colLineX, py + 6);
      ctx.lineTo(colLineX, py + ph - 6);
      ctx.stroke();
    }
    for (let r = 1; r < 3; r++) {
      const rowLineY = gy + r * this.rowHeight;
      ctx.beginPath();
      ctx.moveTo(px + 6, rowLineY);
      ctx.lineTo(px + pw - 6, rowLineY);
      ctx.stroke();
    }

    ctx.restore();

    // 6. 【底部地脉青铜莲座】(锚定阵盘底部)
    const lotusY = py + ph + 6;
    ctx.save();
    ctx.strokeStyle = `rgba(180, 140, 50, ${0.55 + 0.2 * breathPulse})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#c8a020';
    ctx.shadowBlur = 8;

    // 底部主弧
    ctx.beginPath();
    ctx.moveTo(cx - 75, lotusY);
    ctx.quadraticCurveTo(cx, lotusY + 16, cx + 75, lotusY);
    ctx.stroke();

    // 莲瓣中枢尖端
    ctx.beginPath();
    ctx.moveTo(cx - 20, lotusY + 8);
    ctx.lineTo(cx, lotusY + 24);
    ctx.lineTo(cx + 20, lotusY + 8);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 在最上层绘制圆盘外围厚实青铜环、流转符文与八卦星辰
   */
  _renderDiskOuterRing(ctx, breathPulse) {
    const cx = this.diskCX; // 340
    const cy = this.diskCY; // 340
    const diskR = this.diskRadius; // 320

    ctx.save();
    ctx.translate(cx, cy);

    // 1. 圆环外侧柔和道韵晕染
    ctx.shadowColor = `rgba(0, 190, 150, ${0.55 + 0.25 * breathPulse})`;
    ctx.shadowBlur  = 24 + 14 * breathPulse;
    ctx.strokeStyle = `rgba(32, 140, 110, ${0.75 + 0.18 * breathPulse})`;
    ctx.lineWidth   = 22;
    ctx.beginPath();
    ctx.arc(0, 0, diskR - 10, 0, Math.PI * 2);
    ctx.stroke();

    // 2. 铜环内侧精铸金线
    ctx.shadowBlur  = 6;
    ctx.strokeStyle = `rgba(200, 160, 55, ${0.7 + 0.2 * breathPulse})`;
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, diskR - 21, 0, Math.PI * 2);
    ctx.stroke();

    // 3. 铜环外缘深青玄铁收边
    ctx.shadowBlur  = 0;
    ctx.strokeStyle = 'rgba(16, 52, 40, 0.9)';
    ctx.lineWidth   = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, diskR + 2, 0, Math.PI * 2);
    ctx.stroke();

    // 4. 外圈旋转古道文铭刻 (缓缓绕圈流转)
    ctx.save();
    ctx.rotate(this.taijiAngle * 0.2);
    const inscriptions = '周天奇门阵法·震坎艮·离坤兑·乾巽';
    const charFontSize = Math.round(diskR * 0.068);
    ctx.font      = `bold ${charFontSize}px serif`;
    ctx.fillStyle = `rgba(195, 160, 55, ${0.55 + 0.15 * breathPulse})`;
    ctx.shadowColor = '#c8a020';
    ctx.shadowBlur  = 5;
    const ringR = diskR - 11;
    inscriptions.split('').forEach((ch, i) => {
      if (ch === ' ') return;
      const angle = (i / inscriptions.length) * Math.PI * 2 - Math.PI / 2;
      ctx.save();
      ctx.rotate(angle);
      ctx.translate(0, -ringR);
      ctx.rotate(Math.PI / 2); // 文字沿切线朝外
      ctx.fillText(ch, -charFontSize * 0.42, charFontSize * 0.38);
      ctx.restore();
    });
    ctx.restore();

    // 5. 八方八卦方位真元宝石（八卦八曜）
    const baguaAngles = [0, 45, 90, 135, 180, 225, 270, 315];
    baguaAngles.forEach((deg, i) => {
      const rad = (deg - 90) * Math.PI / 180;
      const dotR = diskR - 1;
      const px = Math.cos(rad) * dotR;
      const py = Math.sin(rad) * dotR;
      ctx.beginPath();
      ctx.arc(px, py, 4.5 + 2 * breathPulse, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0
        ? `rgba(0, 220, 170, ${0.75 + 0.25 * breathPulse})`
        : `rgba(210, 170, 55, ${0.7 + 0.2 * breathPulse})`;
      ctx.shadowColor = i % 2 === 0 ? '#00e6a8' : '#ffd700';
      ctx.shadowBlur  = 12;
      ctx.fill();
    });

    ctx.restore();
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

  startTenPullBurst(summary, callback) {
    this.isSpinning = true;
    setTimeout(() => {
      this.isSpinning = false;
      if (summary.bestEquip && summary.maxPowerDiff > 0) {
        this.addFloatingText(`⚡ 周天十连大爆！斩获【${summary.bestEquip.name}】！`, '#ffd700');
        this.addFloatingText(`⚡ 战力飙升 +${summary.maxPowerDiff} ⬆`, '#38ef7d');
      } else if (summary.bestEquip) {
        this.addFloatingText(`⚡ 周天十连大爆！斩获【${summary.bestEquip.name}】！`, '#ffd700');
      } else {
        this.addFloatingText(`✨ 周天十连推演：获宝 10 份！`, '#ffd700');
      }
      if (typeof callback === 'function') callback();
    }, 700);
  }

  addFloatingText(text, color = '#ffd700') {
    const lineCount = (String(text).match(/\n/g) || []).length + 1;
    const shiftY = Math.max(34, lineCount * 22 + 14);
    for (const ft of this.floatingTexts) {
      ft.y -= shiftY;
      if (ft.alpha > 0.65) ft.alpha = 0.65;
    }
    while (this.floatingTexts.length >= 2) {
      this.floatingTexts.shift();
    }
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
