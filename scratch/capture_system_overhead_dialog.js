const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const artifactDir = 'C:/Users/baish/.gemini/antigravity/brain/01f29278-40ce-4787-9d2d-2408e9039bf0';
const htmlSrc = fs.readFileSync('E:/my games/slots_rpg/index.html', 'utf8');

// 1. 生成触发系统说话的自启动脚本
function generateHtmlWithAction(actionCode) {
  const injectScript = `
    <script>
      window.addEventListener('load', () => {
        setTimeout(() => {
          ${actionCode}
        }, 600);
      });
    </script>
  `;
  return htmlSrc.replace('</body>', injectScript + '</body>');
}

// 场景 A: 剧情对话舞台 - 系统发言 (头顶气泡在系统头上)
const htmlSystemTalk = generateHtmlWithAction(`
  if (window.SlotsRPG && window.SlotsRPG.StoryManager) {
    window.SlotsRPG.StoryManager.showStoryDialog({
      title: '序章 · 神盘认主',
      speaker: '系统',
      dialogue: [
        { sender: 'player', name: '宿主 (林凡)', text: '我乃一介凡夫，真能在此觅得仙缘逆天改命么？' },
        { sender: 'system', name: '系统', text: '叮！本系统乃天道法则漏洞孕育！有本系统在，今日便助宿主夺造化、逆乾坤！' }
      ]
    });
    // 步进到系统发言
    window.SlotsRPG.StoryManager.advanceStoryLine();
  }
`);
const rootDir = 'E:/my games/slots_rpg';
const tempHtmlA = path.resolve(rootDir, 'temp_overhead_system.html');
fs.writeFileSync(tempHtmlA, htmlSystemTalk, 'utf8');

// 场景 B: 剧情对话舞台 - 林凡发言 (头顶气泡在林凡头上)
const htmlLinFanTalk = generateHtmlWithAction(`
  if (window.SlotsRPG && window.SlotsRPG.StoryManager) {
    window.SlotsRPG.StoryManager.showStoryDialog({
      title: '序章 · 凡躯逆命',
      speaker: '系统',
      dialogue: [
        { sender: 'player', name: '宿主 (林凡)', text: '家中米缸已见底，今日只得握着柴刀来这后山碰碰运气了...' },
        { sender: 'system', name: '系统', text: '宿主莫慌，前方有天地造化残卷，速速前去查探！' }
      ]
    });
  }
`);
const tempHtmlB = path.resolve(rootDir, 'temp_overhead_linfan.html');
fs.writeFileSync(tempHtmlB, htmlLinFanTalk, 'utf8');

// 场景 C: 游戏主视口 - 系统战力不足灵犀警示浮窗
const htmlSystemTip = generateHtmlWithAction(`
  if (window.SlotsRPG && window.SlotsRPG.StoryManager) {
    window.SlotsRPG.StoryManager.closeStoryDialog(true);
  }
  const modalStory = document.getElementById('modal-story-dialog');
  if (modalStory) modalStory.classList.add('hidden');

  if (window.SlotsRPG && window.SlotsRPG.StoryManager) {
    window.SlotsRPG.StoryManager.showSystemTip('power_low', {
      playerPower: 1280,
      recPower: 1950
    });
  }
`);
const tempHtmlC = path.resolve(rootDir, 'temp_system_tip.html');
fs.writeFileSync(tempHtmlC, htmlSystemTip, 'utf8');

// 场景 D: 伏妖大捷结算弹窗内置的系统点评气泡
const htmlVictory = generateHtmlWithAction(`
  if (window.SlotsRPG && window.SlotsRPG.StoryManager) {
    window.SlotsRPG.StoryManager.closeStoryDialog(true);
  }
  const modalStory = document.getElementById('modal-story-dialog');
  if (modalStory) modalStory.classList.add('hidden');

  const modal = document.getElementById('modal-battle-victory');
  const comment = document.getElementById('victory-system-comment');
  if (comment) {
    comment.innerText = '【系统速报】守关霸主已伏诛！天道机缘大丰收，宗门试炼功德圆满！';
  }
  if (modal) modal.classList.remove('hidden');
`);
const tempHtmlD = path.resolve(rootDir, 'temp_system_victory.html');
fs.writeFileSync(tempHtmlD, htmlVictory, 'utf8');

// 执行截图
const captures = [
  { file: tempHtmlA, out: 'live_overhead_dialog_system.png', desc: '系统头顶气泡发言' },
  { file: tempHtmlB, out: 'live_overhead_dialog_linfan.png', desc: '林凡头顶气泡发言' },
  { file: tempHtmlC, out: 'live_system_tip_toast.png', desc: '系统战力不足浮窗提示' },
  { file: tempHtmlD, out: 'live_system_victory_comment.png', desc: '伏妖大捷系统点评' }
];

captures.forEach(c => {
  const userDir = path.resolve(__dirname, 'edge_user_' + Date.now() + Math.floor(Math.random()*1000));
  fs.mkdirSync(userDir, { recursive: true });
  const outPath = path.resolve(artifactDir, c.out);
  const cmd = `"${edgePath}" --headless --disable-gpu --virtual-time-budget=2000 --user-data-dir="${userDir}" --screenshot="${outPath}" --window-size=430,860 "file:///${c.file.replace(/\\/g, '/')}"`;
  try {
    execSync(cmd, { stdio: 'ignore' });
    console.log(`📸 [${c.desc}] 截图成功:`, c.out);
  } catch (err) {
    console.error(`截图失败 [${c.desc}]:`, err.message);
  }
});
