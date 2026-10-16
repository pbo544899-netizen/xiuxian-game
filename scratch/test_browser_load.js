const fs = require('fs');
const path = require('path');

// 模拟完整浏览器 DOM
const storageMap = {};
global.localStorage = {
  getItem: (k) => storageMap[k] || null,
  setItem: (k, v) => { storageMap[k] = String(v); },
  removeItem: (k) => { delete storageMap[k]; },
  clear: () => { for (let k in storageMap) delete storageMap[k]; }
};

global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

global.window = {
  SlotsRPG: {},
  addEventListener: (event, cb) => {
    if (event === 'DOMContentLoaded') {
      global.window._domReady = cb;
    }
  },
  location: { reload: () => {} }
};

const domElements = {};
function getOrCreateEl(id) {
  if (!domElements[id]) {
    domElements[id] = {
      id,
      innerText: '',
      innerHTML: '',
      style: {},
      className: '',
      classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        contains(c) { return this.classes.has(c); },
        toggle(c, f) { if (f !== undefined) { if (f) this.classes.add(c); else this.classes.delete(c); } else { if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c); } }
      },
      addEventListener: (evt, fn) => {},
      getContext: () => ({
        clearRect: () => {}, fillRect: () => {}, beginPath: () => {}, stroke: () => {},
        arc: () => {}, fill: () => {}, save: () => {}, restore: () => {}, translate: () => {},
        rotate: () => {}, scale: () => {}, measureText: () => ({ width: 10 }), drawImage: () => {},
        fillText: () => {}, strokeText: () => {}
      }),
      appendChild: () => {},
      querySelector: () => null,
      querySelectorAll: () => []
    };
  }
  return domElements[id];
}

global.document = {
  getElementById: (id) => getOrCreateEl(id),
  querySelector: (sel) => getOrCreateEl(sel),
  querySelectorAll: () => [],
  addEventListener: () => {},
  body: getOrCreateEl('body')
};

global.Image = class {
  constructor() {
    this.src = '';
    this.complete = true;
    this.naturalWidth = 64;
  }
};

const htmlSrc = fs.readFileSync('index.html', 'utf8');
const scriptMatches = htmlSrc.match(/<script src="([^"]+)"><\/script>/g);
console.log('Found scripts:', scriptMatches);

scriptMatches.forEach(tag => {
  const match = tag.match(/src="([^"]+)"/);
  if (match && match[1]) {
    const file = path.resolve(match[1]);
    console.log('Loading script:', match[1]);
    try {
      require(file);
      console.log('  -> OK');
    } catch(e) {
      console.error('  -> ERROR in ' + match[1] + ':', e);
    }
  }
});

if (global.window._domReady) {
  console.log('Triggering DOMContentLoaded...');
  try {
    global.window._domReady();
    console.log('DOMContentLoaded execution SUCCESSFUL!');
  } catch(e) {
    console.error('ERROR during DOMContentLoaded:', e);
  }
}
