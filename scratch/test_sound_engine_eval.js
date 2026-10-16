// Test BattleSoundEngine syntax and methods
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

// Now load BattleSoundEngine.js
const code = fs.readFileSync('src/rpg/BattleSoundEngine.js', 'utf8');
eval(code);

console.log("BattleSoundEngine loaded successfully!");
console.log("window.SlotsRPG:", Object.keys(window.SlotsRPG));

// Test calling all SoundEffects actions
const actions = [
  'CLICK', 'MODAL_OPEN', 'MODAL_CLOSE', 'EQUIP', 'UNEQUIP', 'EQUIP_SWAP',
  'QUICK_EQUIP', 'UPGRADE', 'EQUIP_UPGRADE', 'MERGE', 'SALVAGE', 'BULK_SALVAGE',
  'BAG_SORT', 'SORT', 'PILL', 'PILL_CONSUME', 'RUNE', 'RUNE_USE', 'BREAKTHROUGH',
  'LEVELUP', 'TAB', 'TAB_SWITCH', 'BET', 'BET_SWITCH', 'CAVE', 'CAVE_COLLECT',
  'JOIN_SECT', 'REEL_SPIN', 'REEL_STOP', 'NEAR_MISS', 'WIN_LINE', 'REWARD_DROP',
  'SECT_TICKET_REVEAL'
];

actions.forEach(act => {
  window.SlotsRPG.SoundEffects.play(act, 1);
});
console.log("All SoundEffects played successfully without error!");

// Test BGM methods
window.SlotsRPG.BGMPlayer.start();
window.SlotsRPG.BGMPlayer.setDucking(true);
window.SlotsRPG.BGMPlayer.setDucking(false);
window.SlotsRPG.BGMPlayer.setVolume(0.5);
window.SlotsRPG.BGMPlayer.stop();
console.log("BGMPlayer methods tested successfully!");

// Test mute toggle
const mutedState = window.SlotsRPG.BattleSoundEngine.toggleMute();
console.log("Toggled mute state:", mutedState);
window.SlotsRPG.BattleSoundEngine.toggleMute();
console.log("All audio tests passed 100%!");
