/**
 * AssetManager - 美术与图片资源管理器
 * 支持 Stitch/外部美术资源的无缝热替换加载与优雅降级兜底
 */
window.SlotsRPG = window.SlotsRPG || {};

class AssetManager {
  constructor() {
    this.images = {};
    this._initPreload();
  }

  _initPreload() {
    // 预定义 13 类核心符号与 UI 的标准相对路径
    const symbolList = [
      'SYM_01', 'SYM_02', 'SYM_03', 'SYM_04', 'SYM_05',
      'SYM_06', 'SYM_07', 'SYM_08', 'SYM_09', 'SYM_10',
      'SYM_11', 'SYM_12', 'SYM_13'
    ];

    symbolList.forEach(id => {
      this.loadImage(id, `assets/symbols/${id}.png`);
    });

    // 预载背景/外框（可选）
    this.loadImage('UI_REEL_BG', 'assets/ui/reel_bg.png');
    this.loadImage('UI_FRAME', 'assets/ui/reel_frame.png');
  }

  loadImage(key, src) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      this.images[key] = img;
      console.log(`[AssetManager] 成功加载高清资源: ${key} -> ${src}`);
    };
    img.onerror = () => {
      // 资源不存在时记录为 null，自动启用 SymbolPainter 代码矢量兜底
      this.images[key] = null;
    };
  }

  getImage(key) {
    const img = this.images[key];
    if (img && img.complete && img.naturalWidth > 0) {
      return img;
    }
    return null;
  }
}

window.SlotsRPG.AssetManager = new AssetManager();
