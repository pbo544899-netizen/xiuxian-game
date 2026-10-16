const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:/Users/baish/.gemini/antigravity/brain/01f29278-40ce-4787-9d2d-2408e9039bf0';
const htmlSrc = fs.readFileSync('E:/my games/slots_rpg/index.html', 'utf8');

const injectScript = `
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        const modalStory = document.getElementById('modal-story-dialog');
        if (modalStory) modalStory.classList.add('hidden');
        if (window.gameManager) window.gameManager.prologueStep = 2;
        
        const mockResult = {
          encounter: {
            tier: 'normal',
            monsters: [
              { id: 'norm_fox_1', name: '赤狐大妖', maxHp: 180, hp: 180, atk: 22, def: 8, avatar: 'assets/monsters/monster_fox_vivid.png', tier: 'normal' },
              { id: 'norm_toad_1', name: '玄毒蟾蜍', maxHp: 160, hp: 160, atk: 18, def: 10, avatar: 'assets/monsters/monster_toad_vivid.png', tier: 'normal' }
            ]
          },
          itemsUsed: []
        };
        const sim = window.SlotsRPG.CombatEngine.simulateEncounter(window.gameManager.player, mockResult.encounter, window.gameManager.inventory, 1);
        sim.encounter = mockResult.encounter;
        window.playBattleSequence(sim);
        setTimeout(() => {
          const trans = document.getElementById('modal-battle-transition');
          if (trans) {
            trans.classList.add('hidden');
            trans.classList.remove('phase-loading', 'phase-versus');
          }
          const arena = document.getElementById('modal-battle-arena');
          if (arena) arena.classList.remove('hidden');
        }, 50);
      }, 300);
    });
  </script>
`;

const tempHtml = path.resolve('E:/my games/slots_rpg', 'temp_battle_combat_active.html');
fs.writeFileSync(tempHtml, htmlSrc.replace('</body>', injectScript + '</body>'), 'utf8');

const userDir = path.resolve(__dirname, 'edge_user_round_test');
fs.mkdirSync(userDir, { recursive: true });
const outPath = path.resolve(artifactDir, 'verify_4_battle_active_round.png');
const cmd = `"${edgePath}" --headless --disable-gpu --virtual-time-budget=3200 --user-data-dir="${userDir}" --screenshot="${outPath}" --window-size=430,860 "file:///${tempHtml.replace(/\\/g, '/')}"`;
execSync(cmd, { stdio: 'ignore' });
console.log('Active round screenshot captured:', outPath);
