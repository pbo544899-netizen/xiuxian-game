/**
 * 修仙作弊器：技能视觉状态机调度器 (SkillStateMachine)
 * 严格按照 PRD 规范调度 4 阶段生命周期：
 * 1. 蓄力预备态 (Windup / Anticipation)
 * 2. 释放突进态 (Cast / Execution)
 * 3. 命中卡肉态 (Impact & Hit Stop)
 * 4. 后摇归位态 (Recovery / Follow-through)
 */

(function() {
  'use strict';

  class SkillStateMachine {
    constructor() {
      this.isExecuting = false;
    }

    /**
     * 异步调度执行一次技能攻击
     * @param {string} skillKey - 技能标识 (如 'wanjian_slash', 'mortal_slash', 'monster_attack')
     * @param {HTMLElement} casterEl - 施法者元素 (主角或妖兽立绘)
     * @param {HTMLElement} targetEl - 受创目标元素
     * @param {Object} options - 额外参数 (isCrit, damage, onHit, etc.)
     * @returns {Promise<void>}
     */
    async execute(skillKey, casterEl, targetEl, options = {}) {
      const config = (window.SlotsRPG.SkillVisualConfig && window.SlotsRPG.SkillVisualConfig.skills[skillKey]) 
                     || window.SlotsRPG.SkillVisualConfig.skills['mortal_slash'];
      
      const juice = window.SlotsRPG.BattleJuiceEngine;
      const sound = window.SlotsRPG.BattleSoundEngine;
      const timeline = config.timeline;
      const motion = config.motion;
      const vfx = config.vfx;
      const sfx = config.sfx;

      // 确定施法者方向 (主角向上突刺，妖兽向下俯冲)
      const isPlayerCaster = options.isPlayer !== false;
      const lungeDirY = isPlayerCaster ? -1 : 1;

      // 采集受击核心坐标 (顶层 Canvas 局部坐标)
      const anchor = juice.getAnchorCoords(targetEl);

      // ==========================================
      // 【阶段一：蓄力预备态 Windup】
      // ==========================================
      if (sound) {
        if (sfx.roar) sound.playRoar();
        else sound.playCharge();
      }
      if (casterEl) {
        if (!isPlayerCaster) {
          if (juice.triggerMonsterWindup) {
            juice.triggerMonsterWindup(casterEl);
          }
        } else {
          casterEl.style.transition = `transform ${timeline.windup}ms cubic-bezier(0.2, 0.8, 0.4, 1)`;
          const antiY = -lungeDirY * 6; // 反向轻微后撤蓄力
          casterEl.style.transform = `translate3d(0, ${antiY}px, 0)`;
        }
      }
      await juice.hitStop(timeline.windup);

      // ==========================================
      // 【阶段二：释放突进态 Cast】
      // ==========================================
      if (sound) {
        if (sfx.customCast && typeof sound[sfx.customCast] === 'function') {
          sound[sfx.customCast]();
        } else if (sfx.thunder) {
          sound.playThunder();
        } else if (sfx.cast) {
          sound.playSlash(sfx.cast);
        }
      }

      if (casterEl) {
        if (!isPlayerCaster) {
          const isBossSkill = skillKey.startsWith('boss_');
          if (juice.triggerMonsterLunge) {
            juice.triggerMonsterLunge(casterEl, isBossSkill);
          }
        } else {
          casterEl.style.transition = `transform ${timeline.cast}ms cubic-bezier(0.12, 0.9, 0.24, 1)`;
          const lungeDist = (motion.lunge || 24) * lungeDirY;
          casterEl.style.transform = `translate3d(0, ${lungeDist}px, 0)`;
        }
      }

      // 释放刃芒弧光
      if (vfx.arc) {
        juice.triggerSlashArc(anchor.x, anchor.y, vfx.arc);
      }
      await juice.hitStop(timeline.cast);

      // ==========================================
      // 【阶段三：命中爆发态 Impact】
      // ==========================================
      const isCrit = options.isCrit || false;

      // 1. 顿帧卡肉判定 (微帧定格，清脆打击感，绝不拖泥带水)
      const hitStopMs = isCrit ? Math.min(35, Math.floor(timeline.hitStop * 1.2)) : Math.min(20, timeline.hitStop);

      // 2. 目标受创反馈 (灵动受击后挫与震颤，无任何胶皮弹跳缩放)
      if (targetEl) {
        if (isPlayerCaster) {
          if (juice.triggerMonsterHurtFeedback) {
            juice.triggerMonsterHurtFeedback(targetEl, isCrit);
          } else {
            juice.flashWhite(targetEl, 50);
            juice.knockback(targetEl, isCrit ? 26 : 16, timeline.recovery + 40, -1);
          }
        } else {
          juice.flashWhite(targetEl, 50);
          juice.knockback(targetEl, isCrit ? 22 : 14, timeline.recovery + 40, 1);
        }
      }

      // 3. 屏幕视差震颤
      const shakeConf = config.shake || { intensity: 5, duration: 160 };
      const shakeIntensity = isCrit ? shakeConf.intensity * 1.5 : shakeConf.intensity;
      juice.shakeScreen(shakeIntensity, shakeConf.duration);

      // 4. 激发粒子与冲击波
      if (vfx.sparks) {
        const sparkCount = isCrit ? Math.floor(vfx.sparks.count * 1.4) : vfx.sparks.count;
        juice.triggerSparks(anchor.x, anchor.y, { ...vfx.sparks, count: sparkCount });
      }
      if (vfx.shockwave) {
        juice.triggerShockwave(anchor.x, anchor.y, vfx.shockwave);
      }

      // 5. 命中音效与金石声
      if (sound) {
        if (sfx.customImpact && typeof sound[sfx.customImpact] === 'function') {
          sound[sfx.customImpact]();
        } else {
          sound.playImpact(isCrit);
          if (sfx.clang || isCrit) sound.playCritClang();
        }
      }

      // 6. 执行命中回调 (如扣血、跳字)
      if (typeof options.onHit === 'function') {
        options.onHit();
      }

      // 7. 万剑仙宗专属：会心暴击触发极速飞剑追击 (Flying Sword Pursuit)
      if (config.flyingSwords && (isCrit || options.enableFlyingSwords)) {
        const casterAnchor = juice.getAnchorCoords(casterEl);
        if (sound && sound.playSwordThrust) {
          sound.playSwordThrust();
        }
        juice.triggerFlyingSwords(casterAnchor.x, casterAnchor.y, anchor.x, anchor.y, {
          ...config.flyingSwords,
          onReachTarget: () => {
            if (sound) sound.playCritClang();
            juice.triggerShockwave(anchor.x, anchor.y, { maxRadius: 45, color: '#fef08a', lineWidth: 2.5 });
            juice.triggerSparks(anchor.x, anchor.y, { count: 14, colors: ['#ffd700', '#ffffff'] });
            if (typeof options.onFlyingSwordHit === 'function') {
              options.onFlyingSwordHit();
            }
          }
        });
      }

      // 物理冻结卡肉
      await juice.hitStop(hitStopMs);

      // ==========================================
      // 【阶段四：后摇归位态 Recovery】
      // ==========================================
      if (casterEl) {
        if (!isPlayerCaster) {
          if (juice.resetMonsterPose) {
            juice.resetMonsterPose(casterEl);
          }
        } else {
          casterEl.style.transition = `transform ${timeline.recovery}ms cubic-bezier(0.25, 1, 0.5, 1)`;
          casterEl.style.transform = 'translate3d(0, 0, 0)';
          setTimeout(() => {
            if (casterEl) casterEl.style.transition = '';
          }, timeline.recovery);
        }
      }

      await juice.hitStop(timeline.recovery);
    }
  }

  // 挂载至全局命名空间
  window.SlotsRPG = window.SlotsRPG || {};
  window.SlotsRPG.SkillStateMachine = new SkillStateMachine();
})();
