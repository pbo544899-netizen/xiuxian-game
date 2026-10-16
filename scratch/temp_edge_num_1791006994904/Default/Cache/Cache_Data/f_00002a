/**
 * SymbolPainter - 纯代码 Canvas 矢量符号绘制器
 * 无外部图片依赖，以新国风道门修仙美学实时渲染 13 类符号
 */
window.SlotsRPG = window.SlotsRPG || {};

class SymbolPainter {
  constructor() {
    this.paytable = window.SlotsRPG.PaytableConfig.SYMBOLS;
  }

  /**
   * 获取符号的动态品质与展示属性 (受聚宝盆等级驱动品质跃迁)
   */
  static getSymbolQualityProfile(symbolId, potLevel = 1, worldTier = 1) {
    const paytable = (window.SlotsRPG && window.SlotsRPG.PaytableConfig && window.SlotsRPG.PaytableConfig.SYMBOLS) || {};
    const raw = paytable[symbolId] || paytable['SYM_01'] || { name: '法宝' };
    let color = '#8c8c8c';
    let qualityName = '凡铁';
    let badgeText = '凡';
    let displayName = raw.name;

    // 灵界 · 飘渺仙域 (World Tier 2) 神格化展示
    if (worldTier === 2) {
      switch (symbolId) {
        case 'SYM_01':
          return { color: '#38bdf8', qualityName: '仙晶', badgeText: '仙·晶', displayName: '极品仙晶' };
        case 'SYM_02':
          return { color: '#818cf8', qualityName: '真魄', badgeText: '玄·魄', displayName: '玄黄灵魄' };
        case 'SYM_03':
          return { color: '#f43f5e', qualityName: '神符', badgeText: '神·雷', displayName: '太素神雷符' };
        case 'SYM_04':
          return { color: '#fb7185', qualityName: '金丹', badgeText: '九·转', displayName: '九转金丹' };
        case 'SYM_05':
          return { color: '#fbbf24', qualityName: '真灵', badgeText: '鸿·蒙', displayName: '鸿蒙真灵丹' };
        case 'SYM_06':
          return { color: '#f59e0b', qualityName: '灵宝', badgeText: '斩·仙', displayName: '斩仙飞剑' };
        case 'SYM_07':
          return { color: '#06b6d4', qualityName: '仙甲', badgeText: '神·煞', displayName: '诸天神煞铠' };
        case 'SYM_08':
          return { color: '#c084fc', qualityName: '通天', badgeText: '虚·空', displayName: '虚空纳芥戒' };
        case 'SYM_09':
          return { color: '#34d399', qualityName: '神履', badgeText: '步·云', displayName: '缩地步云履' };
        case 'SYM_10':
          return { color: '#fb923c', qualityName: '灵绫', badgeText: '捆·仙', displayName: '混元捆仙绫' };
        case 'SYM_11':
          return { color: '#facc15', qualityName: '混沌', badgeText: '混·元', displayName: '造化混元珠' };
        case 'SYM_12':
          return { color: '#ef4444', qualityName: '神魔', badgeText: '神·魔', displayName: '洪荒神魔鳞' };
        case 'SYM_13':
          return { color: '#10b981', qualityName: '太初', badgeText: '太·初', displayName: '鸿蒙太初印' };
      }
    }

    switch (symbolId) {
      case 'SYM_01': // 聚灵符
        color = '#52c41a';
        qualityName = '灵符';
        badgeText = '灵·符';
        break;
      case 'SYM_02': // 凝神符
        color = '#1890ff';
        qualityName = '宝符';
        badgeText = '宝·符';
        break;
      case 'SYM_03': // 破魔符
        color = '#722ed1';
        qualityName = '法符';
        badgeText = '法·符';
        break;
      case 'SYM_04': // 气血丹
        color = '#ff416c';
        qualityName = '极品';
        badgeText = '丹';
        break;
      case 'SYM_05': // 修为丹
        color = '#fadb14';
        qualityName = '仙品';
        badgeText = '丹';
        break;
      case 'SYM_06': // 武器
        if (potLevel >= 2) {
          color = '#52c41a';
          qualityName = '灵器';
          badgeText = '灵·剑';
          displayName = '青锋剑';
        } else {
          color = '#8c8c8c';
          qualityName = '凡铁';
          badgeText = '凡·剑';
          displayName = '玄铁剑';
        }
        break;
      case 'SYM_07': // 防具衣服
        if (potLevel >= 2) {
          color = '#52c41a';
          qualityName = '灵器';
          badgeText = '灵·甲';
          displayName = '太玄甲';
        } else {
          color = '#8c8c8c';
          qualityName = '凡铁';
          badgeText = '凡·甲';
          displayName = '青云甲';
        }
        break;
      case 'SYM_08': // 戒指
        if (potLevel >= 2) {
          color = '#1890ff';
          qualityName = '宝器';
          badgeText = '宝·戒';
          displayName = '紫金戒';
        } else {
          color = '#52c41a';
          qualityName = '灵器';
          badgeText = '灵·戒';
          displayName = '紫金戒';
        }
        break;
      case 'SYM_09': // 鞋子 (2阶新解封)
        color = '#27ae60';
        qualityName = '灵器';
        badgeText = '新·履';
        displayName = '混元履';
        break;
      case 'SYM_10': // 腰带 (2阶新解封)
        color = '#1890ff';
        qualityName = '宝器';
        badgeText = '新·索';
        displayName = '捆仙索';
        break;
      case 'SYM_11': // 万应灵珠 (WILD)
        color = '#fadb14';
        qualityName = '神品';
        badgeText = '神·变';
        displayName = '万应灵珠';
        break;
      case 'SYM_12': // 妖兽逆鳞 (SCATTER)
        color = '#f5222d';
        qualityName = '凶煞';
        badgeText = '凶·兽';
        displayName = '妖兽逆鳞';
        break;
      case 'SYM_13': // 造化秘印 (BONUS)
        color = '#2ecc71';
        qualityName = '仙品';
        badgeText = '仙·秘';
        displayName = '造化秘印';
        break;
    }

    return {
      color,
      qualityName,
      badgeText,
      displayName
    };
  }

  getSymbolQualityProfile(symbolId, potLevel = 1, worldTier = 1) {
    return SymbolPainter.getSymbolQualityProfile(symbolId, potLevel, worldTier);
  }

  /**
   * 绘制单个符号到指定 Canvas 区域 (含品质光晕、品质双层外框、立体角标)
   * @param {CanvasRenderingContext2D} ctx 
   * @param {string} symbolId 
   * @param {number} x - 单元格左上角 X
   * @param {number} y - 单元格左上角 Y
   * @param {number} w - 宽度
   * @param {number} h - 高度
   * @param {boolean} isHighlighted - 是否处于连线高亮中
   * @param {number} potLevel - 天机盘等级 (1 或 2)
   * @param {number} worldTier - 大世界位面 (1 或 2)
   */
  drawSymbol(ctx, symbolId, x, y, w, h, isHighlighted = false, potLevel = 1, worldTier = 1) {
    const config = this.paytable[symbolId] || this.paytable['SYM_01'];
    const profile = this.getSymbolQualityProfile(symbolId, potLevel, worldTier);
    const cx = x + w / 2;
    const cy = y + h / 2;
    const pad = 5;
    const cardW = w - pad * 2;
    const cardH = h - pad * 2;
    const cardX = x + pad;
    const cardY = y + pad;
    const r = Math.min(w, h) / 2 - pad;

    ctx.save();

    // 1. 绘制底板微光卡片 (中心品质光晕)
    ctx.beginPath();
    this._drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 7);
    const cardGrad = ctx.createRadialGradient(cx, cy, 6, cx, cy, cardW * 0.7);
    cardGrad.addColorStop(0, '#161c28');
    cardGrad.addColorStop(0.65, '#0b0f16');
    cardGrad.addColorStop(1, '#06080d');
    ctx.fillStyle = cardGrad;
    ctx.fill();

    // 2. 绘制中心图腾 (优先加载外部高清资产，降级使用矢量)
    const externalImg = window.SlotsRPG.AssetManager ? window.SlotsRPG.AssetManager.getImage(symbolId) : null;
    if (externalImg) {
      ctx.save();
      ctx.beginPath();
      this._drawRoundedRect(ctx, cardX + 2, cardY + 2, cardW - 4, cardH - 4, 6);
      ctx.clip();
      ctx.drawImage(externalImg, cardX + 3, cardY + 3, cardW - 6, cardH - 6);
      ctx.restore();
    } else {
      ctx.save();
      switch (symbolId) {
        case 'SYM_01':
        case 'SYM_02':
        case 'SYM_03':
          this._drawTalismanRune(ctx, cx, cy, r, config);
          break;
        case 'SYM_04':
          this._drawElixirPill(ctx, cx, cy, r, '#ff4b5c', '#800020');
          break;
        case 'SYM_05':
          this._drawElixirPill(ctx, cx, cy, r, '#ffd700', '#ff8c00', true);
          break;
        case 'SYM_06':
          this._drawSword(ctx, cx, cy, r);
          break;
        case 'SYM_07':
          this._drawArmor(ctx, cx, cy, r);
          break;
        case 'SYM_08':
          this._drawRing(ctx, cx, cy, r);
          break;
        case 'SYM_09':
          this._drawBoots(ctx, cx, cy, r);
          break;
        case 'SYM_10':
          this._drawRope(ctx, cx, cy, r);
          break;
        case 'SYM_11':
          this._drawWildOrb(ctx, cx, cy, r);
          break;
        case 'SYM_12':
          this._drawScatterBeast(ctx, cx, cy, r);
          break;
        case 'SYM_13':
          this._drawBonusBagua(ctx, cx, cy, r);
          break;
        default:
          this._drawTalismanRune(ctx, cx, cy, r, config);
      }
      ctx.restore();
    }

    // 3. 绘制品质彩色外框与高亮
    ctx.save();
    ctx.beginPath();
    this._drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 7);
    ctx.lineWidth = isHighlighted ? 3 : 1.8;
    ctx.strokeStyle = isHighlighted ? '#ffd700' : profile.color;
    if (isHighlighted) {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 14;
    } else {
      ctx.shadowColor = profile.color;
      ctx.shadowBlur = 6;
    }
    ctx.stroke();

    // 装饰四角金线切角
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = isHighlighted ? '#ffffff' : profile.color;
    ctx.beginPath();
    // 左上
    ctx.moveTo(cardX + 2, cardY + 7);
    ctx.lineTo(cardX + 2, cardY + 2);
    ctx.lineTo(cardX + 7, cardY + 2);
    // 右下
    ctx.moveTo(cardX + cardW - 2, cardY + cardH - 7);
    ctx.lineTo(cardX + cardW - 2, cardY + cardH - 2);
    ctx.lineTo(cardX + cardW - 7, cardY + cardH - 2);
    ctx.stroke();
    ctx.restore();

    // 4. 左上角品质小药丸角标 (立体半透黑底 + 品质色文字)
    ctx.save();
    const badgeText = profile.badgeText;
    ctx.font = 'bold 9px sans-serif';
    const textWidth = ctx.measureText(badgeText).width;
    const badgeW = textWidth + 8;
    const badgeH = 14;
    const badgeX = cardX + 3;
    const badgeY = cardY + 3;

    ctx.beginPath();
    this._drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 3);
    ctx.fillStyle = 'rgba(7, 10, 16, 0.88)';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = profile.color;
    ctx.stroke();

    ctx.fillStyle = profile.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);
    ctx.restore();

    // 5. 底部品名彩色高亮微标 (阴影防遮挡)
    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillStyle = isHighlighted ? '#ffd700' : profile.color;
    ctx.fillText(profile.displayName, cx, cardY + cardH - 3);
    ctx.restore();

    ctx.restore();
  }

  // --- 具体符号矢量绘制实现 ---

  _drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // 道符画法
  _drawTalismanRune(ctx, cx, cy, r, config) {
    const rw = r * 0.75;
    const rh = r * 1.1;
    // 符纸底框
    ctx.fillStyle = 'rgba(240, 230, 200, 0.9)';
    ctx.fillRect(cx - rw / 2, cy - rh / 2 - 4, rw, rh);
    
    // 朱砂符胆文字纹理
    ctx.strokeStyle = config.color || '#b22222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy - 14, 5, 0, Math.PI * 2);
    ctx.moveTo(cx, cy - 9);
    ctx.lineTo(cx, cy + 8);
    ctx.moveTo(cx - 7, cy);
    ctx.lineTo(cx + 7, cy);
    ctx.moveTo(cx - 5, cy + 8);
    ctx.lineTo(cx + 5, cy + 8);
    ctx.stroke();
  }

  // 丹药画法
  _drawElixirPill(ctx, cx, cy, r, innerColor, outerColor, isGolden = false) {
    const pr = r * 0.45;
    // 仙气光晕
    const glow = ctx.createRadialGradient(cx, cy, pr * 0.2, cx, cy, pr * 1.8);
    glow.addColorStop(0, innerColor);
    glow.addColorStop(0.6, outerColor);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy - 4, pr * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // 丹珠本体
    const pillGrad = ctx.createRadialGradient(cx - pr * 0.3, cy - pr * 0.3 - 4, 2, cx, cy - 4, pr);
    pillGrad.addColorStop(0, '#ffffff');
    pillGrad.addColorStop(0.3, innerColor);
    pillGrad.addColorStop(1, outerColor);
    ctx.fillStyle = pillGrad;
    ctx.beginPath();
    ctx.arc(cx, cy - 4, pr, 0, Math.PI * 2);
    ctx.fill();

    // 丹纹金环
    ctx.strokeStyle = isGolden ? '#ffffff' : '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 4, pr * 1.1, pr * 0.4, Math.PI / 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 飞剑画法
  _drawSword(ctx, cx, cy, r) {
    ctx.save();
    ctx.translate(cx, cy - 4);
    ctx.rotate(-Math.PI / 4);
    const len = r * 1.1;

    // 剑身
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.moveTo(0, -len / 2);
    ctx.lineTo(4, len / 2 - 8);
    ctx.lineTo(0, len / 2 - 6);
    ctx.lineTo(-4, len / 2 - 8);
    ctx.closePath();
    ctx.fill();

    // 剑脊流光
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -len / 2);
    ctx.lineTo(0, len / 2 - 6);
    ctx.stroke();

    // 剑格与剑柄
    ctx.fillStyle = '#b8860b';
    ctx.fillRect(-8, len / 2 - 8, 16, 3);
    ctx.fillRect(-2, len / 2 - 5, 4, 10);
    ctx.restore();
  }

  // 宝甲画法
  _drawArmor(ctx, cx, cy, r) {
    ctx.save();
    ctx.translate(cx, cy - 4);
    ctx.fillStyle = '#00c9ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.4);
    ctx.lineTo(r * 0.5, -r * 0.4);
    ctx.lineTo(r * 0.4, r * 0.45);
    ctx.lineTo(0, r * 0.55);
    ctx.lineTo(-r * 0.4, r * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 领口
    ctx.fillStyle = '#09203f';
    ctx.beginPath();
    ctx.arc(0, -r * 0.4, r * 0.25, 0, Math.PI);
    ctx.fill();
    ctx.restore();
  }

  // 戒指画法
  _drawRing(ctx, cx, cy, r) {
    const rr = r * 0.42;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy - 2, rr, 0, Math.PI * 2);
    ctx.stroke();

    // 戒面紫晶
    ctx.fillStyle = '#9b51e0';
    ctx.beginPath();
    ctx.arc(cx, cy - 2 - rr, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 4 - rr, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 履鞋画法
  _drawBoots(ctx, cx, cy, r) {
    ctx.fillStyle = '#2ecc71';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 12);
    ctx.lineTo(cx + 4, cy - 12);
    ctx.lineTo(cx + 4, cy);
    ctx.lineTo(cx + 14, cy + 6);
    ctx.lineTo(cx + 12, cy + 10);
    ctx.lineTo(cx - 10, cy + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 捆仙索画法
  _drawRope(ctx, cx, cy, r) {
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 4, r * 0.45, r * 0.25, Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy - 1, r * 0.35, r * 0.2, -Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  // WILD 万应灵珠画法 (金太极太极印)
  _drawWildOrb(ctx, cx, cy, r) {
    const or = r * 0.55;
    // 旋转金光外环
    ctx.save();
    ctx.shadowColor = '#ffe259';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy - 4, or, 0, Math.PI * 2);
    ctx.stroke();

    // 太极双鱼
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy - 4, or - 2, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(cx, cy - 4 - (or - 2) / 2, (or - 2) / 2, Math.PI * 1.5, Math.PI * 0.5);
    ctx.arc(cx, cy - 4 + (or - 2) / 2, (or - 2) / 2, Math.PI * 1.5, Math.PI * 0.5, true);
    ctx.fill();

    ctx.fillStyle = '#ffa751';
    ctx.beginPath();
    ctx.arc(cx, cy - 4, or - 2, Math.PI * 1.5, Math.PI * 0.5);
    ctx.arc(cx, cy - 4 + (or - 2) / 2, (or - 2) / 2, Math.PI * 1.5, Math.PI * 0.5);
    ctx.arc(cx, cy - 4 - (or - 2) / 2, (or - 2) / 2, Math.PI * 1.5, Math.PI * 0.5, true);
    ctx.fill();

    // WILD 醒目金印文字
    ctx.fillStyle = '#8a2be2';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WILD', cx, cy - 4);
    ctx.restore();
  }

  // SCATTER 妖兽逆鳞画法 (兽首威压赤角)
  _drawScatterBeast(ctx, cx, cy, r) {
    ctx.save();
    ctx.shadowColor = '#e74c3c';
    ctx.shadowBlur = 12;
    // 赤红兽首剪影
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.6);
    ctx.lineTo(cx + r * 0.5, cy - r * 0.1);
    ctx.lineTo(cx + r * 0.35, cy + r * 0.4);
    ctx.lineTo(cx, cy + r * 0.2);
    ctx.lineTo(cx - r * 0.35, cy + r * 0.4);
    ctx.lineTo(cx - r * 0.5, cy - r * 0.1);
    ctx.closePath();
    ctx.fill();

    // 凶煞双目
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(cx - 8, cy - 4, 3, 0, Math.PI * 2);
    ctx.arc(cx + 8, cy - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('妖兽', cx, cy + 12);
    ctx.restore();
  }

  // BONUS 造化秘印 (青玉八卦盘)
  _drawBonusBagua(ctx, cx, cy, r) {
    const br = r * 0.5;
    ctx.save();
    ctx.shadowColor = '#2ecc71';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2.5;

    // 八边形外廓
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI) / 4;
      const bx = cx + br * Math.cos(ang);
      const by = cy - 4 + br * Math.sin(ang);
      if (i === 0) ctx.moveTo(bx, by);
      else ctx.lineTo(bx, by);
    }
    ctx.closePath();
    ctx.fillStyle = '#004d40';
    ctx.fill();
    ctx.stroke();

    // 秘境两字
    ctx.fillStyle = '#a7ffeb';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('秘境', cx, cy - 4);
    ctx.restore();
  }
}

window.SlotsRPG.SymbolPainter = SymbolPainter;
