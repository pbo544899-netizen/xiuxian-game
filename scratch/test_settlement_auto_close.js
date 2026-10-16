const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:/Users/baish/.gemini/antigravity/brain/01f29278-40ce-4787-9d2d-2408e9039bf0';
const htmlSrc = fs.readFileSync('E:/my games/slots_rpg/index.html', 'utf8');

function generateHtmlWithAction(actionCode) {
  const injectScript = `
    <script>
      window.addEventListener('load', () => {
        setTimeout(() => {
          if (window.storyManager) {
            window.storyManager.closeStoryDialog(true);
          }
          const modalStory = document.getElementById('modal-story-dialog');
          if (modalStory) modalStory.classList.add('hidden');
          if (window.gameManager) {
            window.gameManager.isPrologueComplete = true;
            window.gameManager.prologueStep = 3;
          }
          ${actionCode}
        }, 550);
      });
    </script>
  `;
  return htmlSrc.replace('</body>', injectScript + '</body>');
}

const rootDir = 'E:/my games/slots_rpg';

// 场景 A: 胜利弹窗展示“战斗结束后自动关闭”勾选框（初始未勾选状态）
const htmlVictoryUnchecked = generateHtmlWithAction(`
  localStorage.setItem('slots_rpg_battle_auto_close', 'false');
  const mockResult = {
    encounter: {
      tier: 'normal',
      monsters: [
        { id: 'norm_fox_1', name: '赤狐大妖', maxHp: 180, hp: 180, atk: 22, def: 8, avatar: 'assets/monsters/monster_fox_vivid.png', tier: 'normal' }
      ]
    },
    rewards: { exp: 160, energy: 195, rewardPill: { subType: 'hp', amount: 1 } },
    itemsUsed: []
  };
  window.showVictoryModal(mockResult);
`);
const tempHtmlA = path.resolve(rootDir, 'temp_test_victory_unchecked.html');
fs.writeFileSync(tempHtmlA, htmlVictoryUnchecked, 'utf8');

// 场景 B: 胜利弹窗勾选“战斗结束后自动关闭”，展示倒计时 (2s) 并在到期后自动领取关闭
const htmlVictoryChecked = generateHtmlWithAction(`
  localStorage.setItem('slots_rpg_battle_auto_close', 'true');
  const mockResult = {
    encounter: {
      tier: 'normal',
      monsters: [
        { id: 'norm_fox_1', name: '赤狐大妖', maxHp: 180, hp: 180, atk: 22, def: 8, avatar: 'assets/monsters/monster_fox_vivid.png', tier: 'normal' }
      ]
    },
    rewards: { exp: 160, energy: 195, rewardPill: { subType: 'hp', amount: 1 } },
    itemsUsed: []
  };
  window.showVictoryModal(mockResult);
`);
const tempHtmlB = path.resolve(rootDir, 'temp_test_victory_checked.html');
fs.writeFileSync(tempHtmlB, htmlVictoryChecked, 'utf8');

// 场景 C: 倒计时到期后（约 2.2 秒），弹窗已自动关闭并纳宝入囊入库
const htmlVictoryAutoClosed = generateHtmlWithAction(`
  localStorage.setItem('slots_rpg_battle_auto_close', 'true');
  const mockResult = {
    encounter: {
      tier: 'normal',
      monsters: [
        { id: 'norm_fox_1', name: '赤狐大妖', maxHp: 180, hp: 180, atk: 22, def: 8, avatar: 'assets/monsters/monster_fox_vivid.png', tier: 'normal' }
      ]
    },
    rewards: { exp: 160, energy: 195, rewardPill: { subType: 'hp', amount: 1 } },
    itemsUsed: []
  };
  window.showVictoryModal(mockResult);
`);
const tempHtmlC = path.resolve(rootDir, 'temp_test_victory_closed.html');
fs.writeFileSync(tempHtmlC, htmlVictoryAutoClosed, 'utf8');

const captures = [
  { file: tempHtmlA, out: 'verify_auto_close_unchecked.png', desc: '结算弹窗自动关闭勾选框(未勾选)', budget: 900 },
  { file: tempHtmlB, out: 'verify_auto_close_countdown.png', desc: '结算弹窗自动关闭倒计时中(2s)', budget: 900 },
  { file: tempHtmlC, out: 'verify_auto_close_after_claimed.png', desc: '2秒后结算弹窗已自动领取入库并关闭', budget: 3500 }
];

captures.forEach(c => {
  const userDir = path.resolve(__dirname, 'edge_user_autoclose_' + Date.now() + Math.floor(Math.random()*1000));
  fs.mkdirSync(userDir, { recursive: true });
  const outPath = path.resolve(artifactDir, c.out);
  const cmd = `"${edgePath}" --headless --disable-gpu --virtual-time-budget=${c.budget} --user-data-dir="${userDir}" --screenshot="${outPath}" --window-size=430,860 "file:///${c.file.replace(/\\/g, '/')}"`;
  try {
    execSync(cmd, { stdio: 'ignore' });
    console.log(`📸 [${c.desc}] 截图成功:`, c.out);
  } catch (err) {
    console.error(`截图失败 [${c.desc}]:`, err.message);
  }
});
