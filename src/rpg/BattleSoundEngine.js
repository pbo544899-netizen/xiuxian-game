/**
 * 修仙作弊器：伏妖战场纯代码程序化音效与触觉反馈引擎 (BattleSoundEngine)
 * 特性：
 * 1. 零外部音频贴图/MP3/WAV依赖，完全使用 Web Audio API (振荡器 + 噪声发生器 + 双二阶滤波器) 数学合成；
 * 2. 天然跨端兼容浏览器与微信小游戏 (支持 wx.createWebAudioContext)；
 * 3. 毫秒级低延迟，零加载等待，首包体积开销仅 ~3KB；
 * 4. 内置物理触觉马达震动门面 (wx.vibrateShort / navigator.vibrate)。
 */

(function() {
  'use strict';

  /**
   * 仙侠道韵古风生成式背景音乐播放器 (XianxiaBGMPlayer)
   * 采用中国古五声音阶 (宫商角徵羽 D调五音) 算法实时数学生成：
   * 1. 太虚冥想和音底噪 (D2 73.4Hz + A2 110Hz 纯五度微呼吸调制)
   * 2. 空灵古琴/古筝丝弦拨奏 (物理共鸣滤波 + 泛音衰减)
   * 3. 悠扬竹笛/洞箫弱音起伏
   * 4. 青铜引磬/古寺梵钟长鸣净化神魂
   * 5. 战斗自动 Ducking 避让降噪，战斗结束后优雅回升
   */
  class XianxiaBGMPlayer {
    constructor(soundEngine) {
      this.engine = soundEngine;
      this.isPlaying = false;
      this.isDucked = false;
      this.bgmGainNode = null;
      this.bgmVolume = 0.28;

      this.droneOsc1 = null;
      this.droneOsc2 = null;
      this.droneFilter = null;
      this.droneLfo = null;
      this.droneGain = null;

      this.pluckTimer = null;
      this.fluteTimer = null;
      this.bellTimer = null;
    }

    _ensureBgmNode() {
      if (!this.engine.ctx) return null;
      if (!this.bgmGainNode) {
        this.bgmGainNode = this.engine.ctx.createGain();
        const initVol = this.engine.isMuted ? 0 : this.bgmVolume;
        this.bgmGainNode.gain.setValueAtTime(initVol, this.engine.ctx.currentTime);
        this.bgmGainNode.connect(this.engine.masterGainNode || this.engine.ctx.destination);
      }
      return this.bgmGainNode;
    }

    start() {
      if (this.isPlaying || this.engine.isMuted) return;
      const ctx = this.engine.ctx;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      this._ensureBgmNode();
      this.isPlaying = true;

      this._startDrone();
      this._scheduleNextPluck();
      this._scheduleNextFlute();
      this._scheduleNextBell();
    }

    stop() {
      this.isPlaying = false;
      this._stopDrone();
      if (this.pluckTimer) { clearTimeout(this.pluckTimer); this.pluckTimer = null; }
      if (this.fluteTimer) { clearTimeout(this.fluteTimer); this.fluteTimer = null; }
      if (this.bellTimer) { clearTimeout(this.bellTimer); this.bellTimer = null; }
    }

    setDucking(isDucked) {
      if (!this.bgmGainNode || !this.engine.ctx) return;
      this.isDucked = !!isDucked;
      const t = this.engine.ctx.currentTime;
      const target = isDucked ? this.bgmVolume * 0.35 : this.bgmVolume;
      this.bgmGainNode.gain.cancelScheduledValues(t);
      this.bgmGainNode.gain.linearRampToValueAtTime(target, t + (isDucked ? 0.3 : 0.8));
    }

    setVolume(vol) {
      this.bgmVolume = Math.max(0, Math.min(1, vol));
      if (this.bgmGainNode && this.engine.ctx && !this.engine.isMuted) {
        const t = this.engine.ctx.currentTime;
        const target = this.isDucked ? this.bgmVolume * 0.35 : this.bgmVolume;
        this.bgmGainNode.gain.setValueAtTime(target, t);
      }
    }

    _startDrone() {
      const ctx = this.engine.ctx;
      if (!ctx || !this._ensureBgmNode()) return;
      this._stopDrone();
      const t = ctx.currentTime;

      this.droneOsc1 = ctx.createOscillator();
      this.droneOsc2 = ctx.createOscillator();
      this.droneFilter = ctx.createBiquadFilter();
      this.droneLfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      this.droneGain = ctx.createGain();

      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(73.42, t); // D2

      this.droneOsc2.type = 'sine';
      this.droneOsc2.frequency.setValueAtTime(110.00, t); // A2 纯五度自然和音

      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(180, t);
      this.droneFilter.Q.setValueAtTime(1.5, t);

      // 0.08Hz 超慢速宇宙呼吸 LFO 律动
      this.droneLfo.type = 'sine';
      this.droneLfo.frequency.setValueAtTime(0.08, t);
      lfoGain.gain.setValueAtTime(45, t);
      this.droneLfo.connect(lfoGain);
      lfoGain.connect(this.droneFilter.frequency);

      this.droneGain.gain.setValueAtTime(0.01, t);
      this.droneGain.gain.linearRampToValueAtTime(0.05, t + 2.0);

      this.droneOsc1.connect(this.droneFilter);
      this.droneOsc2.connect(this.droneFilter);
      this.droneFilter.connect(this.droneGain);
      this.droneGain.connect(this.bgmGainNode);

      this.droneLfo.start(t);
      this.droneOsc1.start(t);
      this.droneOsc2.start(t);
    }

    _stopDrone() {
      try {
        if (this.droneOsc1) { this.droneOsc1.stop(); this.droneOsc1.disconnect(); this.droneOsc1 = null; }
        if (this.droneOsc2) { this.droneOsc2.stop(); this.droneOsc2.disconnect(); this.droneOsc2 = null; }
        if (this.droneLfo) { this.droneLfo.stop(); this.droneLfo.disconnect(); this.droneLfo = null; }
        if (this.droneGain) { this.droneGain.disconnect(); this.droneGain = null; }
      } catch (e) {}
    }

    _scheduleNextPluck() {
      if (!this.isPlaying) return;
      const delay = 2600 + Math.random() * 2000;
      this.pluckTimer = setTimeout(() => {
        if (this.isPlaying) {
          this._playPluck();
          this._scheduleNextPluck();
        }
      }, delay);
    }

    _playPluck() {
      const ctx = this.engine.ctx;
      if (!ctx || !this._ensureBgmNode() || this.engine.isMuted) return;
      const t = ctx.currentTime;
      // D调五声音阶 (宫商角徵羽: D3, E3, F#3, A3, B3, D4, E4, F#4, A4, B4, D5)
      const scale = [146.83, 164.81, 185.00, 220.00, 246.94, 293.66, 329.63, 369.99, 440.00, 493.88, 587.33];
      const freq = scale[Math.floor(Math.random() * scale.length)];

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, t);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, t);

      filter.type = 'peaking';
      filter.frequency.setValueAtTime(480, t);
      filter.gain.setValueAtTime(4.0, t);
      filter.Q.setValueAtTime(2.0, t);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.4);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGainNode);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 2.5);
      osc2.stop(t + 2.5);
    }

    _scheduleNextFlute() {
      if (!this.isPlaying) return;
      const delay = 9000 + Math.random() * 6000;
      this.fluteTimer = setTimeout(() => {
        if (this.isPlaying) {
          this._playFlutePhrase();
          this._scheduleNextFlute();
        }
      }, delay);
    }

    _playFlutePhrase() {
      const ctx = this.engine.ctx;
      if (!ctx || !this._ensureBgmNode() || this.engine.isMuted) return;
      const t = ctx.currentTime;
      const fluteNotes = [369.99, 440.00, 493.88, 587.33];
      const n1 = fluteNotes[Math.floor(Math.random() * fluteNotes.length)];
      const n2 = fluteNotes[Math.floor(Math.random() * fluteNotes.length)];

      [ { f: n1, st: 0 }, { f: n2, st: 0.8 } ].forEach(item => {
        const nt = t + item.st;
        const osc = ctx.createOscillator();
        const vib = ctx.createOscillator();
        const vibGain = ctx.createGain();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(item.f, nt);

        vib.type = 'sine';
        vib.frequency.setValueAtTime(5.2, nt);
        vibGain.gain.setValueAtTime(4.5, nt);
        vib.connect(vibGain);
        vibGain.connect(osc.frequency);

        gain.gain.setValueAtTime(0.01, nt);
        gain.gain.linearRampToValueAtTime(0.08, nt + 0.22);
        gain.gain.exponentialRampToValueAtTime(0.001, nt + 1.2);

        osc.connect(gain);
        gain.connect(this.bgmGainNode);

        vib.start(nt);
        osc.start(nt);
        vib.stop(nt + 1.3);
        osc.stop(nt + 1.3);
      });
    }

    _scheduleNextBell() {
      if (!this.isPlaying) return;
      const delay = 22000 + Math.random() * 10000;
      this.bellTimer = setTimeout(() => {
        if (this.isPlaying) {
          this._playBell();
          this._scheduleNextBell();
        }
      }, delay);
    }

    _playBell() {
      const ctx = this.engine.ctx;
      if (!ctx || !this._ensureBgmNode() || this.engine.isMuted) return;
      const t = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(293.66, t); // D4

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(810.0, t);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 4.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.bgmGainNode);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 4.6);
      osc2.stop(t + 4.6);
    }
  }

  class BattleSoundEngine {
    constructor() {
      this.ctx = null;
      try {
        const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('slots_rpg_sound_muted')) || null;
        this.isMuted = saved === 'true';
      } catch (e) {
        this.isMuted = false;
      }
      this.masterVolume = 0.85;
      this.masterGainNode = null;
      this.noiseBuffer = null;
      this.isUnlocked = false;

      this._initContext();
      this.bgm = new XianxiaBGMPlayer(this);
      this._bindUnlockEvents();
    }

    _initContext() {
      try {
        const AudioContextClass = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext));
        if (typeof wx !== 'undefined' && wx.createWebAudioContext) {
          this.ctx = wx.createWebAudioContext();
        } else if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      } catch (e) {
        console.warn('[BattleSoundEngine] Web Audio 初始化受阻:', e);
      }

      if (this.ctx) {
        try {
          this.masterGainNode = this.ctx.createGain();
          const initGain = this.isMuted ? 0 : this.masterVolume;
          this.masterGainNode.gain.setValueAtTime(initGain, this.ctx.currentTime);
          this.masterGainNode.connect(this.ctx.destination);
          this._buildNoiseBuffers();
        } catch (e) {
          console.warn('[BattleSoundEngine] Master Gain 绑定失败:', e);
        }
      }
    }

    _bindUnlockEvents() {
      const unlock = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().then(() => {
            this.isUnlocked = true;
            if (this.bgm && !this.isMuted) {
              this.bgm.start();
            }
          }).catch(() => {});
        } else {
          this.isUnlocked = true;
          if (this.bgm && !this.isMuted) {
            this.bgm.start();
          }
        }
        if (typeof document !== 'undefined') {
          document.removeEventListener('click', unlock);
          document.removeEventListener('touchstart', unlock);
        }
      };
      if (typeof document !== 'undefined') {
        document.addEventListener('click', unlock, { once: true, passive: true });
        document.addEventListener('touchstart', unlock, { once: true, passive: true });
      }
    }

    _buildNoiseBuffers() {
      if (!this.ctx) return;
      // 预生成 1 秒白噪声缓冲区供多次复用 (Zero-allocation)
      const bufferSize = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    }

    _ensureActive() {
      if (!this.ctx) return false;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return !this.isMuted;
    }

    /**
     * 1. 破空刀鸣与法剑长虹 (Slash SFX)
     * @param {string} style - 'sharp' (凌厉金芒剑气), 'heavy' (沉重大砍刀), 'beast' (妖兽爪风)
     */
    playSlash(style = 'sharp') {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;

      // 噪声发生器 + 带通滤波器模拟空气撕裂
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';

      const gain = this.ctx.createGain();

      if (style === 'sharp') {
        // 万剑宗青白剑气：高频尖锐破空 (2200Hz -> 800Hz)
        filter.frequency.setValueAtTime(2600, t);
        filter.frequency.exponentialRampToValueAtTime(700, t + 0.12);
        filter.Q.setValueAtTime(3.5, t);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.7, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      } else if (style === 'heavy') {
        // 凡人柴刀/重型武器：中低频沉重破空
        filter.frequency.setValueAtTime(1400, t);
        filter.frequency.exponentialRampToValueAtTime(350, t + 0.16);
        filter.Q.setValueAtTime(2.0, t);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.85, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      } else {
        // 妖兽撕咬爪风：双峰狂乱杂音
        filter.frequency.setValueAtTime(1800, t);
        filter.frequency.exponentialRampToValueAtTime(400, t + 0.15);
        filter.Q.setValueAtTime(1.8, t);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.75, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      }

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGainNode);

      noise.start(t);
      noise.stop(t + 0.2);
    }

    /**
     * 2. 重击钝挫入肉与物理碰撞 (Impact Thud SFX)
     * @param {boolean} isCrit - 是否暴击
     */
    playImpact(isCrit = false) {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;

      // 下行扫频正弦波 (模拟肉体与骨骼受力受挫)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startFreq = isCrit ? 220 : 160;
      const endFreq = 42;
      const duration = isCrit ? 0.18 : 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);

      const peakVolume = isCrit ? 1.0 : 0.65;
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(peakVolume, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(t);
      osc.stop(t + duration);

      // 若为暴击，伴随物理短马达震动
      this.triggerHaptic(isCrit ? 'heavy' : 'light');
    }

    /**
     * 3. 会心暴击金石铿锵长鸣 (Crit Clang SFX)
     * 叠加双非谐波正弦波 (1250Hz + 1820Hz)
     */
    playCritClang() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1250, t);
      osc1.frequency.exponentialRampToValueAtTime(950, t + 0.28);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1820, t);
      osc2.frequency.exponentialRampToValueAtTime(1500, t + 0.25);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.8, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGainNode);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.33);
      osc2.stop(t + 0.33);

      this.triggerHaptic('heavy');
    }

    /**
     * 4. 破魔符雷劫与九天惊雷 (Thunder Blast SFX)
     */
    playThunder() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;

      // 1. 低通轰鸣噪声 (滚滚闷雷)
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, t);
      filter.frequency.exponentialRampToValueAtTime(70, t + 0.45);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, t);
      noiseGain.gain.linearRampToValueAtTime(0.95, t + 0.02);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGainNode);

      // 2. 超低频次声波震颤 (Sub-bass impact 55Hz)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(75, t);
      subOsc.frequency.exponentialRampToValueAtTime(35, t + 0.4);

      subGain.gain.setValueAtTime(0.01, t);
      subGain.gain.linearRampToValueAtTime(0.85, t + 0.015);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

      subOsc.connect(subGain);
      subGain.connect(this.masterGainNode);

      noise.start(t);
      subOsc.start(t);
      noise.stop(t + 0.55);
      subOsc.stop(t + 0.45);

      this.triggerHaptic('heavy');
    }

    /**
     * 5. 蓄力前摇吸气高鸣 (Anticipation Charge SFX)
     */
    playCharge() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(660, t + 0.12);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.1);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.13);

      osc.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(t);
      osc.stop(t + 0.14);
    }

    /**
     * 6. 万剑出鞘与飞剑破空穿梭 (Flying Sword Thrust SFX)
     */
    playSwordThrust() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(3400, t + 0.18);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2000, t);
      filter.Q.setValueAtTime(4.5, t);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.65, t + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGainNode);

      osc.start(t);
      osc.stop(t + 0.24);

      this.triggerHaptic('medium');
    }

    /**
     * 7. 妖王狂暴与九幽毒煞咆哮 (Beast / Boss Roar SFX)
     */
    playRoar() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;

      // FM 调制合成深沉百兽凶煞之吼
      const carrier = this.ctx.createOscillator();
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const gain = this.ctx.createGain();

      carrier.type = 'sawtooth';
      carrier.frequency.setValueAtTime(110, t);
      carrier.frequency.exponentialRampToValueAtTime(48, t + 0.45);

      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(28, t);
      modGain.gain.setValueAtTime(80, t);
      modGain.gain.exponentialRampToValueAtTime(15, t + 0.4);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(520, t);
      filter.frequency.exponentialRampToValueAtTime(180, t + 0.45);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.85, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);

      carrier.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGainNode);

      modulator.start(t);
      carrier.start(t);
      modulator.stop(t + 0.5);
      carrier.stop(t + 0.5);

      this.triggerHaptic('heavy');
    }

    /**
     * 8. 太乙丹霞·乙木仙灵丹气与九转回春 (Pill Burst / Herbal Chime SFX)
     * 三音和声晶莹谐振 (880Hz, 1320Hz, 1760Hz)
     */
    playPillBurst() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const freqs = [880, 1320, 1760];
      const duration = 0.32;

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.92, t + duration);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.25 / (idx + 1), t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        gain.connect(this.masterGainNode);

        osc.start(t);
        osc.stop(t + duration);
      });

      this.triggerHaptic('light');
    }

    /**
     * 9. 御兽玄机·青灵狂狼爪风与灵流咆哮 (Water / Beast Claw Slash SFX)
     */
    playWaterSlash() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;

      // 1. 水刃狂澜撕裂风声
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, t);
      filter.frequency.exponentialRampToValueAtTime(800, t + 0.16);
      filter.Q.setValueAtTime(4.0, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, t);
      noiseGain.gain.linearRampToValueAtTime(0.8, t + 0.015);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGainNode);

      // 2. 灵狼咬合低频骨音
      const snapOsc = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(140, t);
      snapOsc.frequency.exponentialRampToValueAtTime(50, t + 0.12);

      snapGain.gain.setValueAtTime(0.01, t);
      snapGain.gain.linearRampToValueAtTime(0.7, t + 0.01);
      snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      snapOsc.connect(snapGain);
      snapGain.connect(this.masterGainNode);

      noise.start(t);
      snapOsc.start(t);
      noise.stop(t + 0.2);
      snapOsc.stop(t + 0.15);

      this.triggerHaptic('medium');
    }

    /**
     * 10. 天机神阵·星罗衍天周天星斗脉冲 (Astral Star Pulse SFX)
     */
    playStarPulse() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;

      const carrier = this.ctx.createOscillator();
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const gain = this.ctx.createGain();

      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(520, t);
      carrier.frequency.exponentialRampToValueAtTime(1600, t + 0.25);

      modulator.type = 'triangle';
      modulator.frequency.setValueAtTime(16, t);
      modGain.gain.setValueAtTime(180, t);
      modGain.gain.exponentialRampToValueAtTime(20, t + 0.22);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.65, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      carrier.connect(gain);
      gain.connect(this.masterGainNode);

      modulator.start(t);
      carrier.start(t);
      modulator.stop(t + 0.3);
      carrier.stop(t + 0.3);

      this.triggerHaptic('medium');
    }

    /**
     * 11. 焚天九幽·三昧真火业火烈焰风暴 (Samadhi Flame Storm SFX)
     */
    playFlameStorm() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;

      // 1. 烈焰爆轰低通音
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, t);
      filter.frequency.exponentialRampToValueAtTime(140, t + 0.35);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, t);
      noiseGain.gain.linearRampToValueAtTime(0.95, t + 0.025);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGainNode);

      // 2. 地煞魔音下潜
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(160, t);
      subOsc.frequency.exponentialRampToValueAtTime(38, t + 0.32);

      subGain.gain.setValueAtTime(0.01, t);
      subGain.gain.linearRampToValueAtTime(0.8, t + 0.018);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      subOsc.connect(subGain);
      subGain.connect(this.masterGainNode);

      noise.start(t);
      subOsc.start(t);
      noise.stop(t + 0.4);
      subOsc.stop(t + 0.36);

      this.triggerHaptic('heavy');
    }

    /**
     * 跨端触觉振动反馈门面 (Haptic Feedback)
     * @param {'light'|'medium'|'heavy'} type
     */
    triggerHaptic(type = 'light') {
      try {
        if (typeof wx !== 'undefined' && wx.vibrateShort) {
          wx.vibrateShort({ type: type === 'heavy' ? 'heavy' : 'light' });
        } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
          const ms = type === 'heavy' ? 35 : (type === 'medium' ? 20 : 12);
          navigator.vibrate(ms);
        }
      } catch (e) {
        // 优雅降级，忽略静音或不支持环境
      }
    }

    setMuted(muted) {
      this.isMuted = !!muted;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('slots_rpg_sound_muted', this.isMuted ? 'true' : 'false');
        }
      } catch (e) {}
      if (this.masterGainNode && this.ctx) {
        const targetVol = this.isMuted ? 0 : this.masterVolume;
        this.masterGainNode.gain.setValueAtTime(targetVol, this.ctx.currentTime);
      }
      if (this.bgm) {
        if (this.isMuted) this.bgm.stop();
        else this.bgm.start();
      }
    }

    toggleMute() {
      this.setMuted(!this.isMuted);
      if (typeof window !== 'undefined' && window.SlotsRPG && window.SlotsRPG.EventBus) {
        window.SlotsRPG.EventBus.emit('SOUND_MUTE_CHANGED', { isMuted: this.isMuted });
      }
      return this.isMuted;
    }

    isSoundMuted() {
      return this.isMuted;
    }

    // ==========================================
    // 天机盘阵盘推演与结算音效 (与动画时长严格同步)
    // ==========================================

    /**
     * 天机盘起转音效 (Reel Spin SFX, ~800-1000ms)
     * 狂风呼啸 + 沉重神木青铜阵盘急速飞旋破空声
     */
    playReelSpin() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;

      // 1. 空气旋流带通噪声
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, t);
      filter.frequency.exponentialRampToValueAtTime(850, t + 0.25);
      filter.frequency.exponentialRampToValueAtTime(450, t + 0.8);
      filter.Q.setValueAtTime(2.2, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, t);
      noiseGain.gain.linearRampToValueAtTime(0.35, t + 0.08);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGainNode);

      // 2. 阵眼飞旋低沉微鸣
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(85, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.2);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.7);

      oscGain.gain.setValueAtTime(0.01, t);
      oscGain.gain.linearRampToValueAtTime(0.2, t + 0.05);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      osc.connect(oscGain);
      oscGain.connect(this.masterGainNode);

      noise.start(t);
      osc.start(t);
      noise.stop(t + 0.9);
      osc.stop(t + 0.8);
    }

    /**
     * 逐列停轮机簧咬合音效 (Reel Stop SFX, ~60ms)
     * 宫商角徵羽五声音阶 (D4, E4, F#4, A4, B4)，每列依次递升，形成极具打击感的心流节拍
     * @param {number} colIndex - 列号 0..4
     */
    playReelStop(colIndex = 0) {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const pentatonic = [293.66, 329.63, 369.99, 440.00, 493.88]; // D4, E4, F#4, A4, B4
      const freq = pentatonic[Math.max(0, Math.min(4, colIndex))] || 330;

      // 1. 机簧敲击硬度瞬态 (白噪微脉冲)
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const nFilter = this.ctx.createBiquadFilter();
      nFilter.type = 'highpass';
      nFilter.frequency.setValueAtTime(2500, t);
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.3, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(this.masterGainNode);

      // 2. 玉石/青铜簧片谐振音
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.88, t + 0.07);

      oscGain.gain.setValueAtTime(0.01, t);
      oscGain.gain.linearRampToValueAtTime(0.45, t + 0.008);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(oscGain);
      oscGain.connect(this.masterGainNode);

      // 3. 高次泛音赋予玉质清脆感
      const overtone = this.ctx.createOscillator();
      const oGain = this.ctx.createGain();
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(freq * 2.5, t);
      oGain.gain.setValueAtTime(0.15, t);
      oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      overtone.connect(oGain);
      oGain.connect(this.masterGainNode);

      noise.start(t);
      osc.start(t);
      overtone.start(t);
      noise.stop(t + 0.03);
      osc.stop(t + 0.09);
      overtone.stop(t + 0.06);

      this.triggerHaptic('light');
    }

    /**
     * 期待减速张力音效 (Near-Miss Tension SFX)
     * 时长与减速动画严格一致 (默认 750ms)，谐波音调逐步上扬颤动
     * @param {number} durationMs - 减速时长毫秒
     */
    playNearMissTension(durationMs = 750) {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const dur = Math.max(0.2, durationMs / 1000);

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      lfo.type = 'sine';

      // 音调自 A4(440Hz) 向上拉升至 A5(880Hz) 与 E6(1320Hz)
      osc1.frequency.setValueAtTime(440, t);
      osc1.frequency.exponentialRampToValueAtTime(880, t + dur);

      osc2.frequency.setValueAtTime(660, t);
      osc2.frequency.exponentialRampToValueAtTime(1320, t + dur);

      // 12Hz 快速颤音形成心跳压迫感
      lfo.frequency.setValueAtTime(12, t);
      lfoGain.gain.setValueAtTime(0.08, t);
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      gain.gain.setValueAtTime(0.05, t);
      gain.gain.linearRampToValueAtTime(0.25, t + dur * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGainNode);

      lfo.start(t);
      osc1.start(t);
      osc2.start(t);

      lfo.stop(t + dur);
      osc1.stop(t + dur);
      osc2.stop(t + dur);
    }

    /**
     * 普通中奖连线展示音效 (Win Line Highlight SFX, ~800-1000ms)
     * 仙道五声琶音上升清响 (D4 -> F#4 -> A4 -> D5 -> F#5)，如星辉连缀
     */
    playWinLine() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const notes = [293.66, 369.99, 440.00, 587.33, 739.99]; // 宫、角、徵、高音宫、高音角

      notes.forEach((freq, idx) => {
        const noteTime = t + idx * 0.055;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.01, noteTime);
        gain.gain.linearRampToValueAtTime(0.25, noteTime + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.55);

        osc.connect(gain);
        gain.connect(this.masterGainNode);

        osc.start(noteTime);
        osc.stop(noteTime + 0.6);
      });

      this.triggerHaptic('medium');
    }

    /**
     * 奖励数量通知与掉落动画音效 (Reward Drop SFX, ~600ms)
     * 碎玉凝珠、灵石叮咚入袋的飞散清响
     */
    playRewardDrop() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const drops = [1318.5, 1567.9, 1760.0, 2093.0, 2637.0]; // E6, G6, A6, C7, E7

      drops.forEach((freq, idx) => {
        const dropTime = t + idx * 0.065 + Math.random() * 0.02;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, dropTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.95, dropTime + 0.12);

        gain.gain.setValueAtTime(0.01, dropTime);
        gain.gain.linearRampToValueAtTime(0.22, dropTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, dropTime + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGainNode);

        osc.start(dropTime);
        osc.stop(dropTime + 0.18);
      });
    }

    /**
     * 门派门票中奖符号展示效果音效 (Sect Ticket Symbol Reveal SFX)
     * 时长与展示特效严格维持 2000ms 一致！
     * 纯净浑厚青铜道钟长鸣 + 高天古琴泛音和鸣，道韵绵长悠远
     * @param {number} durationMs - 严格维持 2000ms
     */
    playSectTicketSymbolReveal(durationMs = 2000) {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const dur = Math.max(1.5, durationMs / 1000);

      // 1. 青铜道钟深沉基频 (D3: 146.83Hz + 丰富泛音)
      const bellFund = this.ctx.createOscillator();
      const bellOver = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();

      bellFund.type = 'sine';
      bellFund.frequency.setValueAtTime(146.83, t);

      bellOver.type = 'triangle';
      bellOver.frequency.setValueAtTime(440.5, t); // 3次泛音

      bellGain.gain.setValueAtTime(0.01, t);
      bellGain.gain.linearRampToValueAtTime(0.55, t + 0.035);
      bellGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      bellFund.connect(bellGain);
      bellOver.connect(bellGain);
      bellGain.connect(this.masterGainNode);

      // 2. 空灵古琴法牒泛音 (D5: 587.33Hz + A5: 880Hz)
      const qin1 = this.ctx.createOscillator();
      const qin2 = this.ctx.createOscillator();
      const qinGain = this.ctx.createGain();

      qin1.type = 'sine';
      qin1.frequency.setValueAtTime(587.33, t + 0.08);

      qin2.type = 'sine';
      qin2.frequency.setValueAtTime(880.00, t + 0.08);

      qinGain.gain.setValueAtTime(0.01, t + 0.08);
      qinGain.gain.linearRampToValueAtTime(0.38, t + 0.15);
      qinGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      qin1.connect(qinGain);
      qin2.connect(qinGain);
      qinGain.connect(this.masterGainNode);

      // 3. 灵气环流飘散闪烁 (轻度高通金粉声)
      const shimmer = this.ctx.createBufferSource();
      shimmer.buffer = this.noiseBuffer;
      const sFilter = this.ctx.createBiquadFilter();
      sFilter.type = 'bandpass';
      sFilter.frequency.setValueAtTime(3500, t + 0.1);
      sFilter.Q.setValueAtTime(4.0, t + 0.1);
      const sGain = this.ctx.createGain();
      sGain.gain.setValueAtTime(0.01, t + 0.1);
      sGain.gain.linearRampToValueAtTime(0.12, t + 0.25);
      sGain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.7);

      shimmer.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(this.masterGainNode);

      bellFund.start(t);
      bellOver.start(t);
      qin1.start(t + 0.08);
      qin2.start(t + 0.08);
      shimmer.start(t + 0.1);

      bellFund.stop(t + dur);
      bellOver.stop(t + dur);
      qin1.stop(t + dur);
      qin2.stop(t + dur);
      shimmer.stop(t + dur);

      this.triggerHaptic('heavy');
    }

    // ==========================================
    // 界面交互与操作全套音效 (UI Operations)
    // ==========================================

    /** 点击按钮轻响 (Click) */
    playBtnClick() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.035);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t);
      osc.stop(t + 0.04);
      this.triggerHaptic('light');
    }

    /** 弹窗展开 (Modal Open, 200ms) */
    playModalOpen() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(640, t + 0.16);
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t);
      osc.stop(t + 0.22);
    }

    /** 弹窗关闭 (Modal Close, 120ms) */
    playModalClose() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t);
      osc.stop(t + 0.13);
    }

    /** 装备穿戴 (Equip) */
    playEquip() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(1050, t);
      osc2.frequency.setValueAtTime(2100, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGainNode);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.15);
      osc2.stop(t + 0.15);
      this.triggerHaptic('light');
    }

    /** 装备卸下 (Unequip) */
    playUnequip() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.12);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t);
      osc.stop(t + 0.13);
    }

    /** 装备替换 (Equip Swap) */
    playEquipSwap() {
      this.playUnequip();
      setTimeout(() => this.playEquip(), 70);
    }

    /** 一键装备 (Quick Equip, 300ms 华彩) */
    playQuickEquip() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const notes = [587.33, 739.99, 880.00]; // D5, F#5, A5
      notes.forEach((freq, i) => {
        const nt = t + i * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, nt);
        gain.gain.setValueAtTime(0.01, nt);
        gain.gain.linearRampToValueAtTime(0.3, nt + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, nt + 0.22);
        osc.connect(gain);
        gain.connect(this.masterGainNode);
        osc.start(nt);
        osc.stop(nt + 0.24);
      });
      this.triggerHaptic('medium');
    }

    /** 装备升级 / 一键合成 (Upgrade / Merge) */
    playEquipUpgrade() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(350, t + 0.12);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, t);
      filter.Q.setValueAtTime(3.0, t);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGainNode);

      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(130, t);
      subGain.gain.setValueAtTime(0.3, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      sub.connect(subGain);
      subGain.connect(this.masterGainNode);

      osc.start(t);
      sub.start(t);
      osc.stop(t + 0.3);
      sub.stop(t + 0.28);
      this.triggerHaptic('heavy');
    }

    /** 装备分解 (Salvage) */
    playSalvage() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, t);
      filter.frequency.exponentialRampToValueAtTime(120, t + 0.25);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGainNode);
      noise.start(t);
      noise.stop(t + 0.28);
      this.triggerHaptic('medium');
    }

    /** 乾坤袋整理 (Bag Sort) */
    playBagSort() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      [0, 0.05, 0.1].forEach((delay, idx) => {
        const nt = t + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(700 + idx * 150, nt);
        gain.gain.setValueAtTime(0.12, nt);
        gain.gain.exponentialRampToValueAtTime(0.001, nt + 0.05);
        osc.connect(gain);
        gain.connect(this.masterGainNode);
        osc.start(nt);
        osc.stop(nt + 0.06);
      });
    }

    /** 丹药服用 (Consume Pill) */
    playPillConsume() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(540, t + 0.22);
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t);
      osc.stop(t + 0.38);
    }

    /** 符箓使用 (Rune Use) */
    playRuneUse() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(1600, t + 0.15);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t);
      osc.stop(t + 0.24);
    }

    /** 境界突破 / 聚宝盆升阶 (Breakthrough / Pot Level Up) */
    playBreakthrough() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const chord = [146.83, 293.66, 369.99, 440.00, 587.33];
      chord.forEach((freq, idx) => {
        const nt = t + idx * 0.04;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, nt);
        gain.gain.setValueAtTime(0.01, nt);
        gain.gain.linearRampToValueAtTime(0.35, nt + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, nt + 0.85);
        osc.connect(gain);
        gain.connect(this.masterGainNode);
        osc.start(nt);
        osc.stop(nt + 0.9);
      });
      this.triggerHaptic('heavy');
    }

    /** 底部标签切换 (Tab Switch) */
    playTabSwitch() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(520, t + 0.05);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t);
      osc.stop(t + 0.07);
    }

    /** 倍率切换 (Bet Switch) */
    playBetSwitch(mult = 1) {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const baseFreq = 350 + Math.min(600, (mult || 1) * 50);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, t);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t);
      osc.stop(t + 0.05);
    }

    /** 洞天灵气吸纳 (Cave Collect) */
    playCaveCollect() {
      this.playRewardDrop();
    }

    /** 叩问仙门拜入 (Join Sect) */
    playJoinSect() {
      this.playBreakthrough();
    }

    /** 战斗切入修仙过场 (Battle Transition Cutscene: 宏大古钟 + 双雄冲撞金鸣 + 战鼓裂空) */
    playBattleTransition() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;

      // 1. 低沉深远古钟和音 (73.4Hz D2 + 146.8Hz + 220Hz，悠远道韵)
      [73.4, 146.8, 220].forEach((freq, idx) => {
        const gongOsc = this.ctx.createOscillator();
        const gongGain = this.ctx.createGain();
        gongOsc.type = idx === 0 ? 'sine' : 'triangle';
        gongOsc.frequency.setValueAtTime(freq, t);
        gongOsc.frequency.exponentialRampToValueAtTime(freq * 0.92, t + 2.5);
        gongGain.gain.setValueAtTime(0.01, t);
        gongGain.gain.linearRampToValueAtTime(0.35 / (idx + 1), t + 0.06);
        gongGain.gain.exponentialRampToValueAtTime(0.001, t + 2.6);
        gongOsc.connect(gongGain);
        gongGain.connect(this.masterGainNode);
        gongOsc.start(t);
        gongOsc.stop(t + 2.7);
      });

      // 2. 双雄对撞瞬间 (t + 0.42s): 裂空金铁交鸣 + 剑气呼啸
      const clashTime = t + 0.42;
      [1800, 2400].forEach((freq, idx) => {
        const swordOsc = this.ctx.createOscillator();
        const swordGain = this.ctx.createGain();
        swordOsc.type = 'sawtooth';
        swordOsc.frequency.setValueAtTime(freq, clashTime);
        swordOsc.frequency.exponentialRampToValueAtTime(freq * 0.45, clashTime + 0.45);
        swordGain.gain.setValueAtTime(0.01, clashTime);
        swordGain.gain.linearRampToValueAtTime(0.32 / (idx + 1), clashTime + 0.04);
        swordGain.gain.exponentialRampToValueAtTime(0.001, clashTime + 0.55);
        swordOsc.connect(swordGain);
        swordGain.connect(this.masterGainNode);
        swordOsc.start(clashTime);
        swordOsc.stop(clashTime + 0.6);
      });

      // 3. 碰撞冲击低音巨响 (t + 0.42s): Sub-drop 重低音轰鸣
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(95, clashTime);
      subOsc.frequency.exponentialRampToValueAtTime(32, clashTime + 0.65);
      subGain.gain.setValueAtTime(0.01, clashTime);
      subGain.gain.linearRampToValueAtTime(0.48, clashTime + 0.05);
      subGain.gain.exponentialRampToValueAtTime(0.001, clashTime + 0.75);
      subOsc.connect(subGain);
      subGain.connect(this.masterGainNode);
      subOsc.start(clashTime);
      subOsc.stop(clashTime + 0.8);

      this.triggerHaptic('heavy');
    }

    /** 斩屏入阵音效 (White-flash Slash Cut: 凌厉出剑划破虚空) */
    playBattleTransitionSlash() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2600, t);
      osc.frequency.exponentialRampToValueAtTime(360, t + 0.3);
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t);
      osc.stop(t + 0.35);

      this.triggerHaptic('medium');
    }

    /** 跑灯走马步进音效 (清脆玉石金铃点按，五音宫商角徵羽循环) */
    playMarqueeStep(step = 0) {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // 宫商角徵羽清宫
      const freq = notes[step % notes.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.08, t + 0.045);
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
      osc.connect(gain);
      gain.connect(this.masterGainNode);
      osc.start(t);
      osc.stop(t + 0.06);
    }

    /** 跑灯中奖大奖天籁仙乐 (鸣磬金钟 + 和弦清鸣) */
    playMarqueeWin() {
      if (!this._ensureActive()) return;
      const t = this.ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.06);
        gain.gain.setValueAtTime(0.01, t + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.28, t + idx * 0.06 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.85);
        osc.connect(gain);
        gain.connect(this.masterGainNode);
        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.9);
      });
      this.triggerHaptic('success');
    }
  }

  const soundEngine = new BattleSoundEngine();

  const SoundEffects = {
    play(action, ...args) {
      if (!action) return;
      const key = String(action).toUpperCase();
      switch(key) {
        case 'CLICK': return soundEngine.playBtnClick();
        case 'MODAL_OPEN': return soundEngine.playModalOpen();
        case 'MODAL_CLOSE': return soundEngine.playModalClose();
        case 'EQUIP': return soundEngine.playEquip();
        case 'UNEQUIP': return soundEngine.playUnequip();
        case 'EQUIP_SWAP': return soundEngine.playEquipSwap();
        case 'QUICK_EQUIP': return soundEngine.playQuickEquip();
        case 'UPGRADE':
        case 'EQUIP_UPGRADE':
        case 'MERGE': return soundEngine.playEquipUpgrade();
        case 'SALVAGE':
        case 'BULK_SALVAGE': return soundEngine.playSalvage();
        case 'BAG_SORT':
        case 'SORT': return soundEngine.playBagSort();
        case 'PILL':
        case 'PILL_CONSUME': return soundEngine.playPillConsume();
        case 'RUNE':
        case 'RUNE_USE': return soundEngine.playRuneUse();
        case 'BREAKTHROUGH':
        case 'LEVELUP': return soundEngine.playBreakthrough();
        case 'TAB':
        case 'TAB_SWITCH': return soundEngine.playTabSwitch();
        case 'BET':
        case 'BET_SWITCH': return soundEngine.playBetSwitch(args[0]);
        case 'CAVE':
        case 'CAVE_COLLECT': return soundEngine.playCaveCollect();
        case 'JOIN_SECT': return soundEngine.playJoinSect();
        case 'REEL_SPIN': return soundEngine.playReelSpin();
        case 'REEL_STOP': return soundEngine.playReelStop(args[0]);
        case 'NEAR_MISS': return soundEngine.playNearMissTension(args[0]);
        case 'WIN_LINE': return soundEngine.playWinLine();
        case 'REWARD_DROP': return soundEngine.playRewardDrop();
        case 'SECT_TICKET_REVEAL': return soundEngine.playSectTicketSymbolReveal(args[0]);
        case 'BATTLE_TRANSITION': return soundEngine.playBattleTransition();
        case 'BATTLE_SLASH_OUT': return soundEngine.playBattleTransitionSlash();
        case 'MARQUEE_STEP': return soundEngine.playMarqueeStep(args[0]);
        case 'MARQUEE_WIN': return soundEngine.playMarqueeWin();
        default:
          if (typeof soundEngine[action] === 'function') {
            return soundEngine[action](...args);
          }
      }
    }
  };

  // 挂载至全局命名空间
  window.SlotsRPG = window.SlotsRPG || {};
  window.SlotsRPG.BattleSoundEngine = soundEngine;
  window.SlotsRPG.SoundManager = soundEngine;
  window.SlotsRPG.SoundEffects = SoundEffects;
  window.SlotsRPG.BGMPlayer = soundEngine.bgm;
})();
