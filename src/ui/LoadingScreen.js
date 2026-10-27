/**
 * 游戏启动加载封面与健康游戏公告控制器 (Startup Loading Screen & Health Notice)
 * 职责：
 * 1. 展现首屏仙侠 Logo、龙头标识与规范健康游戏忠告
 * 2. 模拟与执行核心资源预载，以平滑的百分比进度条与道韵提示驱动加载心流
 * 3. 达到 100% 后支持点击任意处或平滑自动入关，无缝激活音频上下文并过渡至主界面
 */
(function() {
  'use strict';

  window.SlotsRPG = window.SlotsRPG || {};

  class LoadingScreenController {
    constructor() {
      this.splashEl = null;
      this.statusTextEl = null;
      this.percentTextEl = null;
      this.progressFillEl = null;
      this.enterPromptEl = null;

      this.currentProgress = 0;
      this.targetProgress = 0;
      this.isComplete = false;
      this.isDismissed = false;
      this.animFrameId = null;

      this.loadingSteps = [
        { progress: 20, text: '汲取天地灵气，构筑造化天机...' },
        { progress: 45, text: '参悟周天八卦，推演诸天造化...' },
        { progress: 75, text: '契合神识本源，洞悉五行道则...' },
        { progress: 95, text: '仙门法牒已下，诸天神魔归位...' },
        { progress: 100, text: '天道大成，仙途已开！' }
      ];
    }

    init() {
      this.splashEl = document.getElementById('startup-loading-screen');
      if (!this.splashEl) return;

      this.statusTextEl = document.getElementById('startup-status-text');
      this.percentTextEl = document.getElementById('startup-percent-text');
      this.progressFillEl = document.getElementById('startup-progress-bar-fill');
      this.enterPromptEl = document.getElementById('startup-enter-prompt');

      // 支持开发调试跳过参数 ?nosplash=1
      if (window.location.search.includes('nosplash=1')) {
        this.dismissImmediately();
        return;
      }

      this.bindEvents();
      this.startPreloadSequence();
    }

    bindEvents() {
      // 允许点击屏幕任意处提前或就绪后快速进入游戏
      const handleClick = (e) => {
        if (this.isDismissed) return;
        // 如果已就绪，立即隐匿
        if (this.isComplete) {
          this.dismiss();
        } else if (this.currentProgress >= 30) {
          // 若加载过半，点击可快速加速至 100%
          this.targetProgress = 100;
        }
      };

      this.splashEl.addEventListener('click', handleClick);
      this.splashEl.addEventListener('touchend', handleClick, { passive: true });
    }

    startPreloadSequence() {
      // 关键静态资源预载
      const preloadImages = [
        'assets/icon/game_icon.png',
        'assets/dragon/dragon_head.png',
        'assets/ui/tab_slots.png',
        'assets/ui/tab_character.png',
        'assets/ui/tab_cave.png',
        'assets/character/hero_mortal.png',
        'assets/character/cheat_system_spirit.png'
      ];

      let loadedCount = 0;
      preloadImages.forEach((src) => {
        const img = new Image();
        img.onload = img.onerror = () => {
          loadedCount++;
          const imgRatio = loadedCount / preloadImages.length;
          // 图片预载权重占 70%
          this.targetProgress = Math.max(this.targetProgress, Math.floor(imgRatio * 70));
        };
        img.src = src;
      });

      // 启动随时间推进的平滑模拟进度 (保底在 1.5s ~ 2.2s 内完成首屏展示)
      const startTime = Date.now();
      const minDuration = 1400; // 最短展示时长，保证健康游戏公告与宏伟背景充分阅读

      const updateLoop = () => {
        if (this.isDismissed) return;

        const elapsed = Date.now() - startTime;
        const timeRatio = Math.min(1, elapsed / minDuration);
        const timeProgress = Math.floor(timeRatio * 100);

        // 目标进度为预载进度与时间进度的有机结合
        this.targetProgress = Math.max(this.targetProgress, timeProgress);

        // 追赶插值计算
        if (this.currentProgress < this.targetProgress) {
          const step = Math.max(1, Math.ceil((this.targetProgress - this.currentProgress) * 0.22));
          this.currentProgress = Math.min(100, this.currentProgress + step);
          this.renderProgress(this.currentProgress);
        }

        if (this.currentProgress >= 100) {
          if (!this.isComplete) {
            this.onLoadingComplete();
          }
          return;
        }

        this.animFrameId = requestAnimationFrame(updateLoop);
      };

      this.animFrameId = requestAnimationFrame(updateLoop);
    }

    renderProgress(val) {
      if (this.progressFillEl) {
        this.progressFillEl.style.width = `${val}%`;
      }
      if (this.percentTextEl) {
        this.percentTextEl.innerText = `${val}%`;
      }

      // 更新阶段性提示文本
      if (this.statusTextEl) {
        for (let i = 0; i < this.loadingSteps.length; i++) {
          if (val <= this.loadingSteps[i].progress) {
            if (this.statusTextEl.innerText !== this.loadingSteps[i].text) {
              this.statusTextEl.innerText = this.loadingSteps[i].text;
            }
            break;
          }
        }
      }
    }

    onLoadingComplete() {
      this.isComplete = true;
      if (this.enterPromptEl) {
        this.enterPromptEl.classList.remove('hidden');
      }
      if (this.statusTextEl) {
        this.statusTextEl.innerText = '天道大成，仙途已开！';
      }

      // 留出适度气口（500ms），随后自动淡出入关
      setTimeout(() => {
        if (!this.isDismissed) {
          this.dismiss();
        }
      }, 550);
    }

    dismiss() {
      if (this.isDismissed) return;
      this.isDismissed = true;

      // 尝试唤醒 WebAudio 上下文
      if (window.SlotsRPG && window.SlotsRPG.SoundService) {
        try {
          if (typeof window.SlotsRPG.SoundService.resumeAudioContext === 'function') {
            window.SlotsRPG.SoundService.resumeAudioContext();
          }
        } catch (e) {
          // ignore
        }
      }

      if (this.splashEl) {
        this.splashEl.classList.add('splash-dismissed');
        setTimeout(() => {
          this.splashEl.style.display = 'none';
        }, 680);
      }

      // 发布启动完成全局事件
      if (window.SlotsRPG && window.SlotsRPG.EventBus) {
        window.SlotsRPG.EventBus.emit('STARTUP_LOADING_COMPLETE');
      }
    }

    dismissImmediately() {
      this.isDismissed = true;
      this.isComplete = true;
      if (this.splashEl) {
        this.splashEl.classList.add('splash-dismissed');
        this.splashEl.style.display = 'none';
      }
    }
  }

  window.SlotsRPG.LoadingScreen = new LoadingScreenController();

  // 页面 DOM 就绪即刻启动加载封面
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.SlotsRPG.LoadingScreen.init();
    });
  } else {
    window.SlotsRPG.LoadingScreen.init();
  }
})();
