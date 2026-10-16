// Comprehensive dry-run test of BattleSoundEngine
const fs = require('fs');

class MockAudioNode {
  connect(dest) { return dest; }
  disconnect() {}
}
class MockGainNode extends MockAudioNode {
  constructor() {
    super();
    this.gain = {
      value: 1,
      setValueAtTime: () => {},
      linearRampToValueAtTime: () => {},
      exponentialRampToValueAtTime: () => {},
      cancelScheduledValues: () => {}
    };
  }
}
class MockOscillatorNode extends MockAudioNode {
  constructor() {
    super();
    this.frequency = {
      value: 440,
      setValueAtTime: () => {},
      linearRampToValueAtTime: () => {},
      exponentialRampToValueAtTime: () => {},
      cancelScheduledValues: () => {}
    };
    this.type = 'sine';
  }
  start() {}
  stop() {}
}
class MockBiquadFilterNode extends MockAudioNode {
  constructor() {
    super();
    this.frequency = {
      value: 1000,
      setValueAtTime: () => {},
      linearRampToValueAtTime: () => {},
      exponentialRampToValueAtTime: () => {}
    };
    this.Q = { setValueAtTime: () => {} };
    this.gain = { setValueAtTime: () => {} };
    this.type = 'lowpass';
  }
}
class MockBufferSourceNode extends MockAudioNode {
  constructor() {
    super();
    this.buffer = null;
    this.loop = false;
  }
  start() {}
  stop() {}
}
class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.destination = new MockAudioNode();
    this.state = 'running';
  }
  createGain() { return new MockGainNode(); }
  createOscillator() { return new MockOscillatorNode(); }
  createBiquadFilter() { return new MockBiquadFilterNode(); }
  createBuffer(channels, length, rate) {
    return { getChannelData: () => new Float32Array(length) };
  }
  createBufferSource() { return new MockBufferSourceNode(); }
  resume() { return Promise.resolve(); }
}

global.window = {
  AudioContext: MockAudioContext,
  localStorage: {
    data: {},
    getItem(k) { return this.data[k] || null; },
    setItem(k, v) { this.data[k] = String(v); }
  }
};
global.document = {
  addEventListener: () => {},
  removeEventListener: () => {}
};

console.log("Ready for script evaluation.");
