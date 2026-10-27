/**
 * 修仙作弊器：技能视觉表现与打击感参数化复用配置表 (SkillVisualConfig)
 * 设计理念：
 * 全游戏 100% 特效与动画复用 4 种底层数学模板 (Slash Arc, Sparks, Shockwave, Motion)，
 * 通过参数化注入 (Parameterization) 产生千变万化的仙术光效与打击反馈。
 */

(function() {
  'use strict';

  window.SlotsRPG = window.SlotsRPG || {};

  window.SlotsRPG.SkillVisualConfig = {
    // 基础模板默认参数
    templates: {
      slash_arc: {
        scale: 1.0,
        blur: 10,
        speed: 0.12,
        lineWidth: 4.5
      },
      radial_sparks: {
        count: 16,
        gravity: 0.35,
        speedMin: 3.0,
        speedMax: 8.5
      },
      shockwave: {
        startRadius: 8,
        maxRadius: 55,
        speed: 3.8,
        lineWidth: 3
      }
    },

    // 技能与攻击表现映射定义
    skills: {
      // 1. 凡人阶段·朴素柴刀劈砍 (极速利落，告别拖沓卡顿)
      mortal_slash: {
        timeline: { windup: 45, cast: 40, hitStop: 15, recovery: 75 },
        motion: { lunge: 18, anticipate: 0.95 },
        vfx: {
          arc: { color: '#cbd5e1', scale: 0.95, angle: -30, count: 1 },
          sparks: { count: 12, colors: ['#ffffff', '#cbd5e1', '#94a3b8'] },
          shockwave: { maxRadius: 40, color: '#f8fafc' }
        },
        sfx: { cast: 'heavy', impact: 'normal', clang: false },
        shake: { intensity: 3, duration: 90 }
      },

      // 2. 万剑仙宗·极道金芒破空斩 (附带二段出鞘飞剑追击，剑气行云流水)
      wanjian_slash: {
        timeline: { windup: 50, cast: 45, hitStop: 25, recovery: 85 },
        motion: { lunge: 30, anticipate: 0.92 },
        vfx: {
          arc: { color: '#ffd700', scale: 1.4, angle: -35, count: 1, lineWidth: 5.5 },
          sparks: { count: 24, colors: ['#ffd700', '#f59e0b', '#ffffff'] },
          shockwave: { maxRadius: 70, color: '#fef08a' }
        },
        flyingSwords: { count: 2, color: '#ffd700', speed: 0.085 },
        sfx: { cast: 'sharp', impact: 'crit', clang: true, swordThrust: true },
        shake: { intensity: 5, duration: 120 }
      },

      // 3. 太乙丹霞宗·乙木青莲丹火斩 (药王灵焰与回春灵气)
      taiyi_dan_fire: {
        timeline: { windup: 50, cast: 45, hitStop: 20, recovery: 80 },
        motion: { lunge: 26, anticipate: 0.93 },
        vfx: {
          arc: { color: '#10b981', scale: 1.35, angle: -30, count: 1, lineWidth: 5.2 },
          sparks: { count: 24, colors: ['#10b981', '#34d399', '#a7f3d0', '#fef08a'], jitter: 2.0 },
          shockwave: { maxRadius: 75, color: '#34d399', lineWidth: 3.5 }
        },
        sfx: { cast: 'sharp', customCast: 'playPillBurst', impact: 'normal', clang: false },
        shake: { intensity: 4, duration: 110 }
      },

      // 4. 御兽玄机门·青灵狂狼裂天爪 (三道凌厉水刃爪痕)
      yushou_claw_swipe: {
        timeline: { windup: 50, cast: 45, hitStop: 20, recovery: 85 },
        motion: { lunge: 32, anticipate: 0.90 },
        vfx: {
          arc: { color: '#38bdf8', scale: 1.35, angle: -40, count: 3, lineWidth: 4.8 }, // 三重湛蓝爪痕
          sparks: { count: 26, colors: ['#38bdf8', '#60a5fa', '#93c5fd', '#ffffff'], jitter: 2.5 },
          shockwave: { maxRadius: 80, color: '#38bdf8', lineWidth: 4.0 }
        },
        sfx: { cast: 'beast', customCast: 'playWaterSlash', impact: 'crit', clang: false },
        shake: { intensity: 5, duration: 120 }
      },

      // 5. 天机神阵门·周天星斗破天诀 (紫微星芒与八卦阵纹)
      tianji_star_shatter: {
        timeline: { windup: 55, cast: 45, hitStop: 25, recovery: 85 },
        motion: { lunge: 24, anticipate: 0.92 },
        vfx: {
          arc: { color: '#c084fc', scale: 1.45, angle: -60, count: 2, lineWidth: 5.5 }, // 双曲星宿斩芒
          sparks: { count: 30, colors: ['#c084fc', '#e879f9', '#fbbf24', '#ffffff'], jitter: 3.0 },
          shockwave: { maxRadius: 90, color: '#c084fc', lineWidth: 4.5 }
        },
        sfx: { cast: 'sharp', customCast: 'playStarPulse', impact: 'crit', clang: true },
        shake: { intensity: 5, duration: 130 }
      },

      // 6. 焚天九幽道·三昧真火焚天斩 (九幽烈焰狂澜)
      fentian_fire_storm: {
        timeline: { windup: 60, cast: 50, hitStop: 30, recovery: 95 },
        motion: { lunge: 36, anticipate: 0.88 },
        vfx: {
          arc: { color: '#ef4444', scale: 1.65, angle: -35, count: 2, lineWidth: 6.5 }, // 炽烈重焰
          sparks: { count: 36, colors: ['#ef4444', '#f97316', '#fbbf24', '#7f1d1d'], jitter: 3.5 },
          shockwave: { maxRadius: 105, color: '#f97316', lineWidth: 5.0 }
        },
        sfx: { cast: 'heavy', customCast: 'playFlameStorm', impact: 'crit', clang: false },
        shake: { intensity: 6, duration: 140 }
      },

      // 7. 妖兽·普通撞击/利爪扫击 (黑鬣猪/蛇妖)
      monster_attack: {
        timeline: { windup: 55, cast: 45, hitStop: 15, recovery: 80 },
        motion: { lunge: 22, anticipate: 1.12 },
        vfx: {
          arc: { color: '#f87171', scale: 1.1, angle: 35, count: 1 },
          sparks: { count: 14, colors: ['#ef4444', '#fca5a5', '#ffffff'] },
          shockwave: { maxRadius: 50, color: '#fecaca' }
        },
        sfx: { cast: 'beast', impact: 'normal', clang: false },
        shake: { intensity: 3, duration: 90 }
      },

      // 8. 妖兽·狂暴三连撕咬 (妖狐/妖狼)
      monster_bite: {
        timeline: { windup: 60, cast: 45, hitStop: 20, recovery: 85 },
        motion: { lunge: 25, anticipate: 1.15 },
        vfx: {
          arc: { color: '#ef4444', scale: 1.25, angle: 40, count: 3 }, // 三道血色撕裂爪痕
          sparks: { count: 18, colors: ['#ef4444', '#b91c1c', '#f87171'] },
          shockwave: { maxRadius: 60, color: '#f87171' }
        },
        sfx: { cast: 'beast', impact: 'crit', clang: false },
        shake: { intensity: 4, duration: 110 }
      },

      // 9. 破魔符·九天雷劫天罚
      talisman_thunder: {
        timeline: { windup: 50, cast: 40, hitStop: 30, recovery: 90 },
        motion: { lunge: 10, anticipate: 0.9 },
        vfx: {
          arc: { color: '#38bdf8', scale: 1.6, angle: -85, count: 2, lineWidth: 6 }, // 贯穿天际的纵向雷芒
          sparks: { count: 28, colors: ['#38bdf8', '#818cf8', '#ffffff'], jitter: 3.5 },
          shockwave: { maxRadius: 90, color: '#38bdf8', lineWidth: 4 }
        },
        sfx: { thunder: true },
        shake: { intensity: 7, duration: 150 }
      },

      // 10. Boss 1: 赤炼蟒·九幽毒煞咆哮
      boss_poison_roar: {
        timeline: { windup: 80, cast: 50, hitStop: 35, recovery: 105 },
        motion: { lunge: 38, anticipate: 1.25 },
        vfx: {
          arc: { color: '#dc2626', scale: 2.0, angle: 45, count: 2, lineWidth: 6.5 },
          sparks: { count: 32, colors: ['#dc2626', '#991b1b', '#7c3aed', '#f87171'], jitter: 4 },
          shockwave: { maxRadius: 135, color: '#ef4444', lineWidth: 5.5 }
        },
        sfx: { roar: true, cast: 'beast', impact: 'crit', clang: false },
        shake: { intensity: 8, duration: 160 }
      },

      // 11. Boss 2: 丹霞金顶兽·金霞真火
      boss_golden_fire: {
        timeline: { windup: 75, cast: 50, hitStop: 30, recovery: 100 },
        motion: { lunge: 35, anticipate: 1.2 },
        vfx: {
          arc: { color: '#f59e0b', scale: 1.9, angle: 40, count: 2, lineWidth: 6.0 },
          sparks: { count: 30, colors: ['#f59e0b', '#fbbf24', '#fef08a', '#ffffff'], jitter: 3.5 },
          shockwave: { maxRadius: 125, color: '#f59e0b', lineWidth: 5.0 }
        },
        sfx: { roar: true, cast: 'sharp', impact: 'crit', clang: true },
        shake: { intensity: 7, duration: 150 }
      },

      // 12. Boss 3: 通天狂暴猿·撼天裂地
      boss_earth_quake: {
        timeline: { windup: 85, cast: 55, hitStop: 40, recovery: 110 },
        motion: { lunge: 42, anticipate: 1.3 },
        vfx: {
          arc: { color: '#b45309', scale: 2.1, angle: 90, count: 2, lineWidth: 7.0 }, // 垂直重砸
          sparks: { count: 36, colors: ['#b45309', '#d97706', '#78350f', '#fef3c7'], jitter: 4.5 },
          shockwave: { maxRadius: 145, color: '#d97706', lineWidth: 6.0 }
        },
        sfx: { roar: true, cast: 'heavy', impact: 'crit', clang: false },
        shake: { intensity: 8, duration: 160 }
      },

      // 13. Boss 4: 八卦机巧神尊·九宫天绝阵
      boss_bagua_array: {
        timeline: { windup: 80, cast: 50, hitStop: 35, recovery: 105 },
        motion: { lunge: 32, anticipate: 1.15 },
        vfx: {
          arc: { color: '#8b5cf6', scale: 1.95, angle: -45, count: 3, lineWidth: 5.8 },
          sparks: { count: 34, colors: ['#8b5cf6', '#a78bfa', '#fbbf24', '#ffffff'], jitter: 3.5 },
          shockwave: { maxRadius: 135, color: '#8b5cf6', lineWidth: 5.0 }
        },
        sfx: { thunder: true, cast: 'sharp', impact: 'crit', clang: true },
        shake: { intensity: 7, duration: 150 }
      },

      // 14. Boss 5: 九幽冥狱魔尊·焚天灭世煞
      boss_hell_inferno: {
        timeline: { windup: 90, cast: 55, hitStop: 45, recovery: 120 },
        motion: { lunge: 45, anticipate: 1.3 },
        vfx: {
          arc: { color: '#b91c1c', scale: 2.3, angle: 45, count: 3, lineWidth: 7.5 },
          sparks: { count: 42, colors: ['#b91c1c', '#ef4444', '#7f1d1d', '#9333ea'], jitter: 5.0 },
          shockwave: { maxRadius: 160, color: '#ef4444', lineWidth: 6.5 }
        },
        sfx: { roar: true, thunder: true, impact: 'crit', clang: true },
        shake: { intensity: 8, duration: 170 }
      }
    }
  };
})();
