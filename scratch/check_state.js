// check_state.js
const fetch = global.fetch;

async function check() {
  try {
    const r = await fetch('http://127.0.0.1:9226/json');
    const pages = await r.json();
    const p = pages.find(x => x.type === 'page' && x.url.includes('localhost'));
    if (!p) {
      console.log('No page on port 9226');
      return;
    }
    const ws = new WebSocket(p.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: '({ step: window.gameManager.prologueStep, spins: window.gameManager.prologueSpins, energy: window.gameManager.energy, bet: window.gameManager.currentBet, spinning: window.gameManager.renderer.isSpinning, prologueComplete: window.gameManager.isPrologueComplete, freeSlots: window.gameManager.inventory.getFreeSlotsCount() })',
          returnByValue: true
        }
      }));
    };
    ws.onmessage = (e) => {
      console.log(JSON.parse(e.data).result.result.value);
      process.exit(0);
    };
  } catch (err) {
    console.error('Error:', err.message);
  }
}
check();
