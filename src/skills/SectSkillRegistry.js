/**
 * SectSkillRegistry.js - 八大宗门心法声明式注册表
 * 将各宗门的专属技能与 SkillPipeline 钩子绑定
 * 业务引擎无需关心宗门名字，完全由本模块统筹挂载
 */
window.SlotsRPG = window.SlotsRPG || {};

window.SlotsRPG.SectSkillRegistry = {
  /**
   * 激活指定宗门的心法钩子
   * @param {string} sectId - 宗门 ID
   * @param {Object} player - PlayerModel 实例
   */
  applySect(sectId, player) {
    const pipeline = window.SlotsRPG.SkillPipeline;
    if (!pipeline) return;

    // 先清理原先绑定的所有宗门心法
    pipeline.clear();

    if (!sectId) return;

    switch (sectId) {
      // 1. 万剑仙宗：二段飞剑突刺 + 剑意破界翻倍 + 飞剑符号加权
      case 'wanjian': {
        // 战斗追击：玩家斩击后 30% 概率追加二段飞剑
        pipeline.register('AFTER_PLAYER_ATTACK', (ctx) => {
          const { player, targetMonster, targetIndex, battleState, timeline, round, isAlive } = ctx;
          if (!targetMonster || targetMonster.currentHp <= 0) return;

          if (Math.random() < 0.30) {
            const extraDmg = Math.max(6, Math.floor((battleState.playerAtk || player.totalAtk) * 0.60));
            targetMonster.currentHp = Math.max(0, targetMonster.currentHp - extraDmg);

            timeline.push({
              round,
              turn: 'player_extra',
              actor: 'player',
              skillType: 'wanjian_chuanxin',
              skillName: '万剑归宗 · 二段飞剑',
              targetIndex,
              targetMonster,
              damage: extraDmg,
              isCrit: true,
              playerHp: battleState.playerHp,
              playerMaxHp: battleState.playerMaxHp,
              monsterHp: targetMonster.currentHp,
              monsterMaxHp: targetMonster.maxHp,
              text: `🗡️【万剑归宗】剑芒激荡！二段破空飞剑突刺贯穿【${targetMonster.name}】，追加暴击伤害 -${extraDmg}！`
            });
          }
        }, 10, 'wanjian_after_attack');

        // 转盘异变：飞剑权重提升 50%
        pipeline.register('ON_REEL_WEIGHT_CALC', (ctx) => {
          if (ctx.weights && ctx.weights['SYM_06']) {
            ctx.weights['SYM_06'] = Math.floor(ctx.weights['SYM_06'] * 1.50);
          }
        }, 10, 'wanjian_reel_weight');

        // 转盘中奖：25% 概率剑意破界 3 倍机缘
        pipeline.register('ON_SPIN_EVALUATED', (ctx) => {
          if (ctx.totalPayout > 0 && Math.random() < 0.25) {
            const oldPayout = ctx.totalPayout;
            ctx.totalPayout = Math.floor(oldPayout * 3.0);
            ctx.isSectBurst = true;
            ctx.sectBurstDesc = `⚔️【万剑破界】太白剑意引动天地共鸣，本轮推演机缘狂翻 3 倍！(${oldPayout} -> ${ctx.totalPayout})`;
          }
        }, 10, 'wanjian_spin_mult');
        break;
      }

      // 2. 太乙丹霞宗：开局青莲护盾 + 气血丹强化 + 空转草木回灵
      case 'taiyi': {
        // 开局进场：挂上太乙青莲护盾
        pipeline.register('ON_BATTLE_START', (ctx) => {
          const { battleState, timeline } = ctx;
          battleState.taiyiShield = true; // 抵消一次首道全额伤害
          timeline.push({
            phase: 'pre_battle',
            type: 'shield_activate',
            skillType: 'lotus_shield_deploy',
            skillName: '太乙青莲护体',
            text: '🪷【太乙青莲护体】青木仙谷药香弥漫，主角周身凝聚一朵青莲仙盾，护持道躯！'
          });
        }, 10, 'taiyi_battle_start');

        // 受击拦截：若青莲护盾在，免除首道伤害
        pipeline.register('ON_TAKE_DAMAGE', (ctx) => {
          const { battleState, timeline, round, monster } = ctx;
          if (battleState.taiyiShield) {
            battleState.taiyiShield = false;
            const blockedDmg = ctx.damage;
            ctx.damage = 0; // 伤害清零
            timeline.push({
              round,
              turn: 'player_defense',
              type: 'shield_block',
              skillType: 'lotus_shield_block',
              blockedDamage: blockedDmg,
              playerHp: battleState.playerHp,
              playerMaxHp: battleState.playerMaxHp,
              text: `🪷【太乙青莲】灵光流转！青莲华光完美抵消【${monster ? monster.name : '敌方'}】的首道伤害 (-${blockedDmg} 被全额吸收)！`
            });
          }
        }, 5, 'taiyi_take_damage');

        // 转盘异变：灵药仙丹权重提升 60%
        pipeline.register('ON_REEL_WEIGHT_CALC', (ctx) => {
          if (ctx.weights) {
            if (ctx.weights['SYM_04']) ctx.weights['SYM_04'] = Math.floor(ctx.weights['SYM_04'] * 1.60);
            if (ctx.weights['SYM_05']) ctx.weights['SYM_05'] = Math.floor(ctx.weights['SYM_05'] * 1.60);
          }
        }, 10, 'taiyi_reel_weight');

        // 转盘空转：30% 凝聚仙丹掉落
        pipeline.register('ON_SPIN_NO_WIN', (ctx) => {
          if (Math.random() < 0.30) {
            ctx.herbPillAward = {
              type: Math.random() < 0.5 ? 'hp' : 'exp',
              name: '回春灵丹',
              count: 1
            };
            ctx.notice = '🌿【草木回灵】天机未应，然而青木谷生气郁结，虚空自然凝结 1 枚回春仙丹！';
          }
        }, 10, 'taiyi_spin_no_win');
        break;
      }

      // 3. 御兽玄机门：青灵狼助战扑咬 + 击杀怪叠战力 + 妖兽高遭遇
      case 'yushou': {
        // 开局进场：青灵狼现身
        pipeline.register('ON_BATTLE_START', (ctx) => {
          const { battleState, timeline } = ctx;
          battleState.wolfKillCount = 0;
          timeline.push({
            phase: 'pre_battle',
            type: 'summon_wolf',
            skillType: 'wolf_summon',
            skillName: '驱灵唤兽 · 青灵狼',
            text: '🐺【驱灵唤兽】百灵长啸！主角身侧跃出一头双眸幽蓝的青灵狼，龇牙低吼随同迎战！'
          });
        }, 10, 'yushou_battle_start');

        // 攻击后灵狼扑咬补刀 35% 伤害
        pipeline.register('AFTER_PLAYER_ATTACK', (ctx) => {
          const { targetMonster, targetIndex, battleState, timeline, round } = ctx;
          if (!targetMonster || targetMonster.currentHp <= 0) return;

          const wolfDmg = Math.max(4, Math.floor((battleState.playerAtk || 15) * 0.35));
          targetMonster.currentHp = Math.max(0, targetMonster.currentHp - wolfDmg);

          timeline.push({
            round,
            turn: 'companion',
            actor: 'wolf',
            skillType: 'wolf_pounce',
            skillName: '青灵狼袭',
            targetIndex,
            targetMonster,
            damage: wolfDmg,
            playerHp: battleState.playerHp,
            playerMaxHp: battleState.playerMaxHp,
            monsterHp: targetMonster.currentHp,
            monsterMaxHp: targetMonster.maxHp,
            text: `🐺【青灵狼袭】灵狼疾如狂风扑上撕咬！【${targetMonster.name}】遭受补刀创伤 -${wolfDmg}！`
          });
        }, 15, 'yushou_wolf_attack');

        // 斩破敌人：战力临时叠加 5%
        pipeline.register('ON_ENEMY_KILLED', (ctx) => {
          const { battleState, timeline, round, killedMonster } = ctx;
          battleState.wolfKillCount = (battleState.wolfKillCount || 0) + 1;
          const boostAtk = Math.floor(battleState.playerAtk * 0.05);
          battleState.playerAtk += boostAtk;

          timeline.push({
            round,
            type: 'buff_gain',
            skillType: 'beast_bloodlust',
            skillName: '百兽血脉沸腾',
            text: `🐾【百兽共鸣】斩灭【${killedMonster.name}】，凶煞之气反哺自身，临时攻击 +${boostAtk}！`
          });
        }, 10, 'yushou_kill_buff');

        // 转盘异变：妖兽遭遇率提升 40%
        pipeline.register('ON_REEL_WEIGHT_CALC', (ctx) => {
          if (ctx.weights && ctx.weights['SYM_12']) {
            ctx.weights['SYM_12'] = Math.floor(ctx.weights['SYM_12'] * 1.40);
          }
        }, 10, 'yushou_reel_weight');
        break;
      }

      // 4. 天机神阵门：致命伤替身免死 + 八卦Wild增加 + 胜战返灵机
      case 'tianji': {
        // 开局进场：装配替身草人
        pipeline.register('ON_BATTLE_START', (ctx) => {
          const { battleState, timeline } = ctx;
          battleState.hasTianjiSubstitute = true; // 每战 1 次致命免死
          timeline.push({
            phase: 'pre_battle',
            type: 'talisman_deploy',
            skillType: 'substitute_ready',
            skillName: '奇门遁甲 · 替身咒',
            text: '📜【奇门遁甲】八卦星轨虚影浮现，主角暗扣一枚替身草人，布下周天星斗大阵！'
          });
        }, 10, 'tianji_battle_start');

        // 受击判定：遭遇致命伤免死回血 25% + 50% 伤害反弹
        pipeline.register('ON_TAKE_DAMAGE', (ctx) => {
          const { battleState, timeline, round, monster } = ctx;
          const incomingDmg = ctx.damage;

          // 致命伤拦截 (即将清零)
          if (battleState.hasTianjiSubstitute && (battleState.playerHp - incomingDmg <= 0)) {
            battleState.hasTianjiSubstitute = false;
            ctx.damage = 0; // 免疫致命一击

            const reviveHp = Math.floor(battleState.playerMaxHp * 0.25);
            battleState.playerHp = reviveHp;

            const reflectDmg = Math.max(10, Math.floor(incomingDmg * 0.50));
            if (monster && monster.currentHp > 0) {
              monster.currentHp = Math.max(0, monster.currentHp - reflectDmg);
            }

            timeline.push({
              round,
              turn: 'player_substitute',
              type: 'fatal_prevent',
              skillType: 'straw_dummy_burst',
              skillName: '移形换位 · 替身消劫',
              reflectDmg,
              playerHp: battleState.playerHp,
              playerMaxHp: battleState.playerMaxHp,
              monsterHp: monster ? monster.currentHp : 0,
              text: `✨【替身消劫】命悬一线之际草人爆为金光替死！主角免遭一劫并回春气血 +${reviveHp}，奇门遁甲将 50% 巨力反弹【${monster ? monster.name : '敌怪'}】造成 -${reflectDmg}！`
            });
          }
        }, 1, 'tianji_fatal_prevention');

        // 转盘异变：八卦 Wild 提升 45%，Bonus 翻倍
        pipeline.register('ON_REEL_WEIGHT_CALC', (ctx) => {
          if (ctx.weights) {
            if (ctx.weights['SYM_11']) ctx.weights['SYM_11'] = Math.floor(ctx.weights['SYM_11'] * 1.45);
            if (ctx.weights['SYM_13']) ctx.weights['SYM_13'] = Math.floor(ctx.weights['SYM_13'] * 2.0);
          }
        }, 10, 'tianji_reel_weight');

        // 胜战灵机返还 50%
        pipeline.register('ON_BATTLE_VICTORY', (ctx) => {
          ctx.energyRefund = 15; // 基础返还 15 点灵机
          ctx.refundDesc = '🌟【奇门返虚】战阵敛息，天机神阵聚拢散逸灵气，返还 15 点推演灵机！';
        }, 10, 'tianji_victory_refund');
        break;
      }

      // 5. 焚天九幽道：舍身燃血残血增伤 + 暴击溅射魔火
      case 'fen_tian': {
        // 攻击前结算残血增伤 (每降 10% 气血增伤 15%，最高 +100%)
        pipeline.register('BEFORE_PLAYER_ATTACK', (ctx) => {
          const { battleState, timeline, round } = ctx;
          const hpLossRatio = (battleState.playerMaxHp - battleState.playerHp) / battleState.playerMaxHp;
          if (hpLossRatio > 0.05) {
            const steps = Math.floor(hpLossRatio / 0.10);
            const dmgBonusRate = Math.min(1.0, steps * 0.15);
            if (dmgBonusRate > 0) {
              ctx.dmgMultiplier = (ctx.dmgMultiplier || 1.0) + dmgBonusRate;
              ctx.isBloodIgnited = true;
              ctx.ignitedRate = Math.floor(dmgBonusRate * 100);
            }
          }
        }, 5, 'fen_tian_before_attack');

        // 攻击后若暴击触发全场魔火溅射
        pipeline.register('AFTER_PLAYER_ATTACK', (ctx) => {
          const { isCrit, aliveMonsters, battleState, timeline, round, targetIndex } = ctx;
          if (isCrit && aliveMonsters && aliveMonsters.length > 1) {
            const splashDmg = Math.max(5, Math.floor(battleState.playerAtk * 0.35));
            let hitCount = 0;
            aliveMonsters.forEach(obj => {
              if (obj.idx !== targetIndex && obj.m.currentHp > 0) {
                obj.m.currentHp = Math.max(0, obj.m.currentHp - splashDmg);
                hitCount++;
              }
            });

            if (hitCount > 0) {
              timeline.push({
                round,
                turn: 'splash_fire',
                skillType: 'nether_flame_splash',
                skillName: '九幽魔火燎原',
                damage: splashDmg,
                text: `🔥【九幽魔火】暴击引动滔天幽冥紫火，漫天飞溅灼烧全场，对其余妖兽造成 -${splashDmg} 溅射伤害！`
              });
            }
          }
        }, 20, 'fen_tian_crit_splash');

        // 转盘高赔率高方差
        pipeline.register('ON_SPIN_EVALUATED', (ctx) => {
          if (ctx.totalPayout >= 50) {
            ctx.totalPayout = Math.floor(ctx.totalPayout * 2.5);
            ctx.isSectBurst = true;
            ctx.sectBurstDesc = '🔥【魔火焚天】命中高阶神品天象，九幽狂怒将大奖赔率推升至 2.5 倍！';
          }
        }, 10, 'fen_tian_spin_burst');
        break;
      }

      // 6. 万通多宝商行：纯打金流，灵机产出 2.5 倍
      case 'wantong': {
        pipeline.register('ON_SPIN_EVALUATED', (ctx) => {
          if (ctx.totalPayout > 0) {
            const origin = ctx.totalPayout;
            ctx.totalPayout = Math.floor(origin * 2.5);
            ctx.isMerchantBonus = true;
            ctx.sectBurstDesc = `💰【富甲仙途】万通宝印闪烁万道金芒，本轮收益尊享 2.5 倍商会特权！(${origin} -> ${ctx.totalPayout})`;
          }
        }, 5, 'wantong_gold_rush');
        break;
      }

      // 7. 钦天观星监：削弱 Boss 35% 防御
      case 'qintian': {
        pipeline.register('ON_BATTLE_START', (ctx) => {
          const { monsters, timeline } = ctx;
          monsters.forEach(m => {
            const originDef = m.def;
            m.def = Math.max(1, Math.floor(m.def * 0.65));
            m.defReduced = originDef - m.def;
          });
          timeline.push({
            phase: 'pre_battle',
            type: 'debuff_enemy',
            skillType: 'astral_weakness',
            skillName: '天机烛照 · 命轨破绽',
            text: '🔮【天机烛照】摘星术士勘破敌阵星命，敌方全员护甲防御骤降 35%！'
          });
        }, 10, 'qintian_weaken_enemies');
        break;
      }

      // 8. 九死血魂教：牺牲气血打出真伤
      case 'jiusi': {
        pipeline.register('BEFORE_PLAYER_ATTACK', (ctx) => {
          const { battleState, timeline, round } = ctx;
          const sacrificeHp = Math.max(3, Math.floor(battleState.playerHp * 0.10));
          if (battleState.playerHp > sacrificeHp + 5) {
            battleState.playerHp -= sacrificeHp;
            ctx.bonusTrueDmg = Math.floor(sacrificeHp * 1.5);
            timeline.push({
              round,
              turn: 'player_sacrifice',
              skillType: 'blood_sacrifice',
              skillName: '血煞解体',
              damage: sacrificeHp,
              text: `🩸【血煞解体】燃烧自身 ${sacrificeHp} 点本命精血，引动极道凶煞，附带 +${ctx.bonusTrueDmg} 真实创伤！`
            });
          }
        }, 10, 'jiusi_blood_sacrifice');
        break;
      }
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.SlotsRPG.SectSkillRegistry;
}
