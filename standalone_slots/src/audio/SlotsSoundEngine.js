/**
 * SlotsSoundEngine.js
 * 独立老虎机音频合成引擎 (纯 Web Audio API，无需外部音频文件)
 */
window.SlotsRPG = window.SlotsRPG || {};

(function() {
  class SlotsSoundEngine {
    constructor() {
      this.audioCtx = null;
      this.isMuted = localStorage.getItem('slots_standalone_muted') === 'true';
    }

    _getAudioContext() {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioCtx = new AudioContext();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      localStorage.setItem('slots_standalone_muted', String(this.isMuted));
      return this.isMuted;
    }

    play(soundName) {
      if (this.isMuted) return;
      const ctx = this._getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      switch (soundName) {
        case 'SPIN_START': {
          // 齿轮加速旋转的嗡鸣音
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(110, now);
          osc.frequency.exponentialRampToValueAtTime(330, now + 0.35);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        }

        case 'REEL_STOP': {
          // 轮盘咔哒锁止声
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(160, now);
          osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.09);
          break;
        }

        case 'WIN_LINE': {
          // 金光连线清脆钟鸣
          [523.25, 659.25, 783.99].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.12, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.35);
          });
          break;
        }

        case 'BIG_WIN': {
          // 大奖华彩琶音
          const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);
            gain.gain.setValueAtTime(0.18, now + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.45);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.45);
          });
          break;
        }

        case 'DRAGON_FIRE': {
          // 神龙吐息深沉能量波
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(80, now);
          osc.frequency.exponentialRampToValueAtTime(240, now + 0.25);
          osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.65);
          break;
        }

        case 'CLICK':
        default: {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }
      }
    }
  }

  const soundEngine = new SlotsSoundEngine();
  window.SlotsRPG.SoundEngine = soundEngine;
  window.SlotsRPG.SoundEffects = {
    play: (s) => soundEngine.play(s)
  };
})();
