// scratch/simulate_flow_progression.js
// 模拟玩家 100抽、200抽、500抽... 生命周期的全量数值与心流体验

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 模拟全局浏览器与存储环境
global.window = { SlotsRPG: {} };
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

require('../src/core/EventBus.js');
require('../src/skills/SkillPipeline.js');
require('../src/rpg/SectConfig.js');
require('../src/skills/SectSkillRegistry.js');
require('../src/slots/PaytableConfig.js');
require('../src/slots/PaylinesConfig.js');
require('../src/slots/FlowController.js');
require('../src/slots/GameBalanceConfig.js');
require('../src/slots/SlotsEngine.js');
require('../src/character/PlayerModel.js');
require('../src/inventory/ItemModel.js');
require('../src/inventory/InventoryManager.js');
require('../src/inventory/EquipSynthesizer.js');
require('../src/rpg/MonsterConfig.js');
require('../src/rpg/BossConfig.js');
require('../src/rpg/CombatEngine.js');
require('../src/bonus/HoldAndSpinEngine.js');
require('../src/cave/CaveManager.js');
require('../src/core/StorageService.js');
require('../src/core/AscensionManager.js');
require('../src/core/GameManager.js');

const GameManager = window.SlotsRPG.GameManager;
const ItemModel = window.SlotsRPG.ItemModel;

function runSingleSimulation(runId, maxSpins = 600) {
  // 1. 初始化全套干净环境
  GameManager.energy = 1000;
  GameManager.potExp = 0;
  GameManager.level = 1;
  GameManager.potSubLevel = 1;
  GameManager.potSubExp = 0;
  GameManager.unlockedSectTicket = null;
  GameManager.hasDefeatedSectBoss = false;
  GameManager.consecutiveEmptySpins = 0;
  GameManager.bossTicketAttempts = 0;
  GameManager.inventory.slots = new Array(24).fill(null);
  GameManager.player.setupMortalState();
  GameManager.player.promoteToCultivator('wanjian'); // 序章后加入万剑宗
  GameManager.isPrologueComplete = true;
  GameManager.prologueStep = 4;
  GameManager.currentBet = 25;
  GameManager.betMultiplier = 1;

  // 记录关键里程碑快照
  const milestones = [50, 100, 200, 300, 400, 500, 600];
  const snapshots = {};

  // 过程追踪器
  let totalEnergyBet = 0;
  let totalEnergyWon = 0;
  let totalEquipsDropped = 0;
  let totalMerges = 0;
  let normalBattles = 0;
  let eliteBattles = 0;
  let bossBattles = 0;
  let normalWins = 0;
  let eliteWins = 0;
  let bossWins = 0;
  let bonusTriggers = 0;
  let peakBagUsed = 0;

  let firstFullSetSpin = null;
  let firstBossDefeatSpin = null;
  let ticketAwardedSpin = null;
  let prematureTicketDetected = false;

  // 注册事件捕获
  const unsubs = [];
  unsubs.push(window.SlotsRPG.EventBus.on('TRIGGER_BATTLE', (data) => {
    const tier = (data.battleConfig && data.battleConfig.tier) || 'normal';
    if (tier === 'boss') bossBattles++;
    else if (tier === 'elite') eliteBattles++;
    else normalBattles++;

    const battle = GameManager.startBossBattle(data.battleConfig);
    if (battle && battle.isVictory) {
      if (tier === 'boss') {
        bossWins++;
        if (firstBossDefeatSpin === null) firstBossDefeatSpin = currentSpinIndex;
      } else if (tier === 'elite') {
        eliteWins++;
      } else {
        normalWins++;
      }
      GameManager.claimBattleRewards(battle);
    }
  }));

  unsubs.push(window.SlotsRPG.EventBus.on('TRIGGER_BONUS', () => {
    bonusTriggers++;
    GameManager.startHoldAndSpin();
    const hs = GameManager.claimHoldAndSpinRewards();
    if (hs && hs.totalEnergy) totalEnergyWon += hs.totalEnergy;
  }));

  unsubs.push(window.SlotsRPG.EventBus.on('FULL_SET_SECT_TICKET_AWARDED', (data) => {
    if (ticketAwardedSpin === null) ticketAwardedSpin = currentSpinIndex;
    // 校验是否提前发放
    const fullSet = GameManager.player.checkFullSetEquipped('Q4');
    if (!fullSet.isGraduated || !GameManager.hasDefeatedSectBoss) {
      prematureTicketDetected = true;
    }
  }));

  let currentSpinIndex = 0;

  for (let spin = 1; spin <= maxSpins; spin++) {
    currentSpinIndex = spin;

    // 维持机缘循环底线：若机缘不足 25，模拟洞天灵脉或自然补充
    if (GameManager.energy < 25) {
      GameManager.energy += 300; // 模拟洞天灵气累积收菜
    }

    const startEnergy = GameManager.energy;
    totalEnergyBet += 25;

    // 执行一次单抽推演
    GameManager.executeSpin();

    const spinRefund = Math.max(0, GameManager.energy - (startEnergy - 25));
    totalEnergyWon += spinRefund;

    // 定期（每 5 抽）进行一次自动穿戴与 3合1 合成
    if (spin % 5 === 0) {
      // 1. 穿戴更好装备
      GameManager.quickEquipBestGear();

      // 2. 3 合 1 合成
      const mergeRes = GameManager.mergeEquipment();
      if (mergeRes && mergeRes.mergedGroupsCount > 0) {
        totalMerges += mergeRes.mergedGroupsCount;
      }

      // 3. 再次穿戴合成后产出的新神装
      GameManager.quickEquipBestGear();
    }

    // 记录背包峰值
    const bagUsed = 24 - GameManager.inventory.getFreeSlotsCount();
    if (bagUsed > peakBagUsed) peakBagUsed = bagUsed;

    // 检查首次 6 槽满配紫装
    if (firstFullSetSpin === null) {
      const full = GameManager.player.checkFullSetEquipped('Q4');
      if (full.isGraduated) {
        firstFullSetSpin = spin;
      }
    }

    // 记录里程碑快照
    if (milestones.includes(spin)) {
      const slots = ['weapon', 'armor', 'ring', 'hat', 'boots', 'belt'];
      const equipQualities = {};
      let purpleCount = 0;
      slots.forEach(s => {
        const eq = GameManager.player.equipment[s];
        const q = eq ? eq.qualityCode : 'empty';
        equipQualities[s] = q;
        if (q === 'Q4' || q === 'Q5' || q === 'Q6' || q === 'Q7') purpleCount++;
      });

      snapshots[spin] = {
        spin,
        energy: GameManager.energy,
        rtp: ((totalEnergyWon / totalEnergyBet) * 100).toFixed(1) + '%',
        combatPower: GameManager.player.combatPower,
        realmLevel: GameManager.player.level,
        realmName: GameManager.player.realmName || `练气${GameManager.player.level}层`,
        potLevel: GameManager.potSubLevel,
        purpleCount,
        equipQualities,
        totalMerges,
        peakBagUsed,
        battles: { normal: normalBattles, elite: eliteBattles, boss: bossBattles },
        wins: { normal: normalWins, elite: eliteWins, boss: bossWins },
        bonusTriggers,
        hasDefeatedBoss: GameManager.hasDefeatedSectBoss,
        hasTicket: !!GameManager.unlockedSectTicket
      };
    }
  }

  // 清理监听
  unsubs.forEach(u => u && u());

  return {
    runId,
    snapshots,
    firstFullSetSpin,
    firstBossDefeatSpin,
    ticketAwardedSpin,
    prematureTicketDetected,
    totalEnergyBet,
    totalEnergyWon,
    overallRtp: ((totalEnergyWon / totalEnergyBet) * 100).toFixed(2),
    peakBagUsed,
    finalPower: GameManager.player.combatPower
  };
}

// 运行 30 次全生命周期蒙特卡洛模拟
console.log('========================================================================');
console.log('🚀 启动 500 抽全生命周期心流数值蒙特卡洛模拟 (30组玩家样本)...');
console.log('========================================================================');

const totalRuns = 30;
const allResults = [];
for (let r = 1; r <= totalRuns; r++) {
  allResults.push(runSingleSimulation(r, 600));
}

// 汇总统计
const milestones = [50, 100, 200, 300, 400, 500, 600];
const milestoneAverages = {};

milestones.forEach(m => {
  let sumPower = 0;
  let sumPurple = 0;
  let sumRtp = 0;
  let sumMerges = 0;
  let sumPotLvl = 0;
  let sumRealm = 0;
  let bossBeatenCount = 0;
  let ticketCount = 0;

  allResults.forEach(res => {
    const s = res.snapshots[m];
    sumPower += s.combatPower;
    sumPurple += s.purpleCount;
    sumRtp += parseFloat(s.rtp);
    sumMerges += s.totalMerges;
    sumPotLvl += s.potLevel;
    sumRealm += s.realmLevel;
    if (s.hasDefeatedBoss) bossBeatenCount++;
    if (s.hasTicket) ticketCount++;
  });

  milestoneAverages[m] = {
    avgPower: Math.round(sumPower / totalRuns),
    avgPurple: (sumPurple / totalRuns).toFixed(1),
    avgRtp: (sumRtp / totalRuns).toFixed(1) + '%',
    avgMerges: (sumMerges / totalRuns).toFixed(1),
    avgPotLvl: (sumPotLvl / totalRuns).toFixed(1),
    avgRealm: (sumRealm / totalRuns).toFixed(1),
    bossDefeatRate: ((bossBeatenCount / totalRuns) * 100).toFixed(1) + '%',
    ticketAcquireRate: ((ticketCount / totalRuns) * 100).toFixed(1) + '%'
  };
});

// 打印详细的典型样本 (样本 1)
console.log('\n【典型玩家样本全程推演详情 (Sample #1)】:');
const sample1 = allResults[0];
milestones.forEach(m => {
  const s = sample1.snapshots[m];
  console.log(`\n📍 [第 ${m} 抽快照]`);
  console.log(`  • 战力: ${s.combatPower} | 境界: 练气${s.realmLevel}层 | 天机盘阶位: Lv.${s.potLevel}`);
  console.log(`  • 6槽法宝品质: 武器[${s.equipQualities.weapon}] 衣服[${s.equipQualities.armor}] 戒指[${s.equipQualities.ring}] 帽子[${s.equipQualities.hat}] 鞋子[${s.equipQualities.boots}] 腰带[${s.equipQualities.belt}] (紫装: ${s.purpleCount}/6)`);
  console.log(`  • 3合1合成次数: ${s.totalMerges} 次 | 背包占用: ${s.peakBagUsed}/24`);
  console.log(`  • 累计战斗: 遇小妖 ${s.battles.normal}场(胜${s.wins.normal}) | 精英 ${s.battles.elite}场(胜${s.wins.elite}) | 守关妖王 ${s.battles.boss}场(胜${s.wins.boss})`);
  console.log(`  • 洞天秘境触发: ${s.bonusTriggers} 次 | 实际RTP: ${s.rtp}`);
  console.log(`  • 守关妖王伏诛: ${s.hasDefeatedBoss ? '✅ 已击败' : '❌ 未击败'} | 下一宗门门票: ${s.hasTicket ? '🎫 已获得' : '🔒 未获得'}`);
});

console.log('\n========================================================================');
console.log('📊 30组样本跨阶段宏观心流统计矩阵:');
console.log('========================================================================');
console.table(milestoneAverages);

// 统计门票获取与毕业抽数
const validFullSets = allResults.map(r => r.firstFullSetSpin).filter(s => s !== null);
const validBossWins = allResults.map(r => r.firstBossDefeatSpin).filter(s => s !== null);
const validTickets = allResults.map(r => r.ticketAwardedSpin).filter(s => s !== null);
const prematureTickets = allResults.filter(r => r.prematureTicketDetected).length;

function median(arr) {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

console.log('\n🎯 【核心里程碑达成节拍统计】:');
console.log(`  • 全套6槽Q4紫装达成抽数: 最早 ${Math.min(...validFullSets)} 抽, 中位数 ${median(validFullSets)} 抽, 最晚 ${Math.max(...validFullSets)} 抽`);
console.log(`  • 守关妖王首次击败抽数: 最早 ${Math.min(...validBossWins)} 抽, 中位数 ${median(validBossWins)} 抽, 最晚 ${Math.max(...validBossWins)} 抽`);
console.log(`  • 下一门派门票颁发抽数: 最早 ${Math.min(...validTickets)} 抽, 中位数 ${median(validTickets)} 抽, 最晚 ${Math.max(...validTickets)} 抽`);
console.log(`  • 提前误发门票样本数: ${prematureTickets} / ${totalRuns} (合规率: ${((1 - prematureTickets/totalRuns)*100)}%)`);

// 写入 JSON 报告供留档与分析
fs.writeFileSync(
  path.join(__dirname, 'simulation_flow_report.json'),
  JSON.stringify({ milestoneAverages, sample1, stats: { validFullSets, validBossWins, validTickets, prematureTickets } }, null, 2)
);
console.log('\n📝 完整模拟日志已保存至 scratch/simulation_flow_report.json');
