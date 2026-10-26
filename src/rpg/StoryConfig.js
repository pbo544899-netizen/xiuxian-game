/**
 * StoryConfig.js
 * 《我有一个修仙系统》剧情主线大纲与网文灵魂语料库
 * 核心驱动：围绕“修仙系统”展开，网文修仙爽感、金手指毒舌嘴炮、同门震惊、逆天改命
 */

(function (global) {
  'use strict';

  const StoryConfig = {
    // =========================================================================
    // 0. 剧情角色核心设定 (Characters & Roles)
    // =========================================================================
    ROLES: {
      system: {
        id: 'system',
        name: '修仙系统',
        title: '天道修仙系统 · 系统灵识',
        avatar: 'assets/character/cheat_system_spirit.png',
        tagIcon: '⚡',
        side: 'right',
        badgeClass: 'system-plate'
      },
      cheat: {
        id: 'system',
        name: '修仙系统',
        title: '天道修仙系统 · 系统灵识',
        avatar: 'assets/character/cheat_system_spirit.png',
        tagIcon: '⚡',
        side: 'right',
        badgeClass: 'system-plate'
      },
      player: {
        id: 'player',
        name: '宿主 (林凡)',
        title: '逆天改命者 · 天道宿主',
        avatar: 'assets/character/hero_cultivator.png',
        tagIcon: '🗡️',
        side: 'left',
        badgeClass: 'player-plate'
      }
    },

    // =========================================================================
    // 0.1 系统实时灵犀提示库 (System In-Game Prompt Corpus)
    // 用于战斗力不足预警、通关庆贺、灵机告罄、装备合成、突破等事件
    // =========================================================================
    SYSTEM_TIPS: {
      power_low: '⚠️ 战力预警：敌方灵压（{recPower}）高于宿主战力（{playerPower}）！强行迎击凶险异常，建议先推演天机或去乾坤袋合成高阶神装！',
      power_ready: '✨ 气势如虹：宿主战力已达标，胜券在握，速出鞘荡平凶兽！',
      stage_clear: '🎉 叮！宿主大展神威，成功荡平第 {stage} 关强敌！掉落丰厚机缘与极品战利品！',
      boss_defeated: '🏆 叮！守关霸主·妖王已伏诛！天道机缘大丰收，宗门试炼功德圆满！',
      level_up: '🌟 叮！天道气运灌顶，宿主已晋升至【{realm}】！三维战斗属性大幅飞跃！',
      pot_tier_up: '🏺 叮！天机盘经验蕴满，成功晋升至【{tierTitle}】！已解锁更高阶位神兵产出！',
      energy_depleted: '⚠️ 灵机告罄！宿主可点击【🧘 打坐吐纳】回复机缘，或前往【洞天】吸纳蕴积灵泉！',
      cave_ready: '💧 叮！洞天福地灵泉蕴积已盈满，宿主快快一键吸纳灵机，莫要浪费天地灵脉！',
      equip_merge_ready: '🔥 叮！检测到同阶装备已集齐三件，速去乾坤袋一键合成高阶神兵！',
      defeat_advice: '宿主胜败乃兵家常事！妖兽势大，先回乾坤袋合成三合一神装，战力达标后再来荡平此獠！'
    },

    // =========================================================================
    // 1. 主线剧情核心章节 (Main Narrative Chapters)
    // =========================================================================
    CHAPTERS: {
      prologue_mortal_intro: {
        id: 'prologue_mortal_intro',
        title: '序章 · 凡人逆命',
        speaker: '宿主 (林凡)',
        speakerTitle: '一介凡夫 · 凡骨草芥',
        speakerAvatar: 'assets/character/hero_mortal.png',
        dialogue: [
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_mortal.png',
            text: '“天地浩瀚，修仙者高居九天之上，视凡人如草芥蝼蚁。我叫林凡，青阳镇下一介凡夫，天生凡骨无灵根，仙门连看都懒得看我一眼...”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“家中米缸已见底，为了活命，今日唯有提着这把防身锈柴刀，只身来到后山碰碰运气，采些止血灵草换几文铜钱度日。”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“（忽然，腥风大作，林间枯叶狂卷，地面剧烈震颤！）”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“吼——！前方草丛被猛然撞碎，竟跳出一头獠牙半尺、双目血红的凶暴黑鬣猪！该死，退路被封，唯有握紧柴刀拼死一搏了！”'
          }
        ],
        lines: [
          '“天地浩瀚，凡人命如草芥。我叫林凡，一介凡夫，天生凡骨无灵根...”',
          '“家中米缸见底，今日只得握着防身柴刀到后山采药糊口。”',
          '“吼——！忽然恶风扑面，一头獠牙黑鬣猪挡住去路！手无寸铁，退无可退，只能拼了！”'
        ]
      },

      prologue_intro: {
        id: 'prologue_intro',
        title: '序章 · 凡躯搏凶',
        speaker: '宿主 (林凡)',
        speakerTitle: '一介凡夫 · 殊死一战',
        speakerAvatar: 'assets/character/hero_mortal.png',
        dialogue: [
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_mortal.png',
            text: '“这头恶猪皮糙肉厚，眼冒凶光！狭路相逢勇者胜，看我一柴刀剁了你的猪头！”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“吼——！恶猪狂暴撞来，唯有一战！”'
          }
        ],
        lines: [
          '“狭路相逢勇者胜，看我一柴刀剁了你的猪头！”',
          '“吼——！恶猪狂暴撞来，唯有一战！”'
        ]
      },

      prologue_awaken: {
        id: 'prologue_awaken',
        title: '序章 · 神盘认主',
        speaker: '系统',
        speakerTitle: '修仙系统 · 灵识显化',
        speakerAvatar: 'assets/character/cheat_system_spirit.png',
        dialogue: [
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“（将指尖触碰背包中的青铜古盘，锋利的符文猛然刺破指腹，一滴凡人精血被古盘瞬间吞噬！）”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“叮！沉眠千万载，终于吸纳到宿主精血了！天道修仙系统正式绑定！”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“卧槽？！谁在我脑子里说话？！刚才从猪肚子里剖出来的古盘怎么化作金光钻进我丹田了？！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“本系统乃天道造化孕育的至高修仙系统！什么天生凡骨无法修仙？在本系统面前皆是狗屁！今日便为宿主逆天改命！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“造化天机盘已融于你的神魂识海！先赠你 100 点启动灵机，速去推演天机，窃取天地道统气运！”'
          }
        ],
        lines: [
          '“（指尖精血渗入青铜残盘，万丈金光爆裂而起，古盘融入识海！）”',
          '“哈哈哈哈！天道有缺，修仙系统觉醒绑定！宿主林凡，今日便为你逆天改命！”',
          '“天机造化盘已与你神魂绑定，赠你 100 点灵机，速去推演天地造化！”'
        ]
      },

      prologue_first_spin: {
        id: 'prologue_first_spin',
        title: '序章 · 天机初转',
        speaker: '系统',
        speakerTitle: '修仙系统 · 灵识显化',
        speakerAvatar: 'assets/character/cheat_system_spirit.png',
        dialogue: [
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“这阵盘竟然自成阴阳八卦小天地，齿轮转动间灵气奔涌！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“那是自然！上古禁忌神物岂是凡品？速速拨动推演，本系统保你首抽必出防身神兵！”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“好！待我推演一番，看看这天机盘能否助我逆天改命！”'
          }
        ],
        lines: [
          '“天机初测，造化显现！速速推演天机，本系统保你首抽必出法宝神兵！”',
          '“以散修之躯汲取天地气运，踏入真正的大道仙途！”'
        ]
      },

      pot_promoted_ticket: {
        id: 'pot_promoted_ticket',
        title: '主线 · 窃夺天机',
        speaker: '系统',
        speakerTitle: '修仙系统 · 灵识显化',
        speakerAvatar: 'assets/character/cheat_system_spirit.png',
        dialogue: [
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“叮！守关妖王已被斩灭，天道防火墙刚才被本系统强行撕开了一道大窟窿！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“聚宝盆已晋升至更高阶位！不仅如此，本系统刚才趁天道不备，从灵网深处顺手截获了一枚【{sectName}】的真传引荐法牒！”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“【{sectName}】的真传令？还能换宗门？那我现在的这一身修为你和装备怎么办？”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“有本系统护体，通关后前往【升仙天碑】激活【兵解转世】！保留 20% 先天道基，装备原地转化为新宗门专属神装，下山当祖师爷！”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“带道基和神装无损转世？不愧是修仙系统，这波羊毛必须薅！”'
          }
        ],
        lines: [
          '“叮！守关妖王已被斩灭，天道防火墙刚才被本系统强行撕开了一道大窟窿！”',
          '“聚宝盆已晋升至更高阶位！不仅如此，本系统刚才顺手截获了一枚【{sectName}】的真传引荐法牒！”',
          '“宿主若想体验全新门派的心法与专属神装，在通关本门后前往【升仙天碑】激活【兵解转世】！本系统护你神魂不灭，带20%道基与神装下山横着走！”'
        ]
      },

      samsara_confirm: {
        id: 'samsara_confirm',
        title: '轮回 · 逆转神魂',
        speaker: '系统',
        speakerTitle: '修仙系统 · 灵识显化',
        speakerAvatar: 'assets/character/cheat_system_spirit.png',
        dialogue: [
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“肉身兵解了！神魂在逆转阴阳，这就是九转轮回转世？！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“欺天逆乱大阵已起！九转轮回，神魂永存！20% 先天道基属性已彻底熔炼入魂！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“一身神装已全部重铸为【{sectName}】专属镇派法宝！开局直接当老祖级天骄！”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“重活一世，道基更强，看我这一世如何横扫天门！”'
          }
        ],
        lines: [
          '“欺天逆乱大阵已起！九转轮回，神魂永存！”',
          '“宿主当前累积的 20% 先天道基属性已彻底熔炼入魂，一身神装也已被本系统重铸为【{sectName}】专属镇派法宝！开局直接当老祖级天骄！”'
        ]
      },

      ascension_ready: {
        id: 'ascension_ready',
        title: '终章 · 五卷归一',
        speaker: '系统',
        speakerTitle: '修仙系统 · 灵识显化',
        speakerAvatar: 'assets/character/cheat_system_spirit.png',
        dialogue: [
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“五大正统真卷全部点亮！升仙天碑在轰鸣，天空中九天仙门大开了！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“太上混元仙典五大残卷齐聚！区区九霄紫雷劫，在本系统面前不过是放烟花！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“天门给本系统破！宿主，随本系统白日飞升，跃迁至【灵界·飘渺仙域】去祸害那些老仙尊！”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“白日飞升！诸位老仙尊，我林凡带着系统来了！”'
          }
        ],
        lines: [
          '“上古太上混元仙典五大残卷齐聚！升仙天碑共鸣，九天仙门大开！”',
          '“区区九霄紫雷劫，在本系统面前不过是放烟花！天门给本系统破！宿主，随本系统白日飞升，跃迁至【灵界·飘渺仙域】去祸害那些老仙尊！”'
        ]
      },

      ascension_complete: {
        id: 'ascension_complete',
        title: '飞升 · 位列仙班',
        speaker: '系统',
        speakerTitle: '修仙系统 · 仙界至尊',
        speakerAvatar: 'assets/character/cheat_system_spirit.png',
        dialogue: [
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“轰！穿透天门了！周身凡气退避，这就是化神巨擘的力量吗？！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“叮！恭喜宿主晋升为【化神境】大能！洞天已蜕变为浮空星天仙阙，天机盘全面神格化！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“通天灵宝与无尽仙晶已在滚轮中待命，仙界大世，随本系统由你主宰！”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“仙途无垠，有系统傍身，诸天万界我为主宰！”'
          }
        ],
        lines: [
          '“轰！天门已开，凡界退避！恭喜宿主一跃晋升为【化神境】无上巨擘！”',
          '“洞天已蜕变为浮空星天仙阙，天机盘全面神格化！通天灵宝与无尽仙晶已在滚轮中待命，仙界大世，由你主宰！”'
        ]
      },

      // =========================================================================
      // 宗门试炼里程碑章节 (Sect Trial Milestones)
      // =========================================================================
      sect_stage1_start: {
        id: 'sect_stage1_start',
        title: '试炼 · 初叩山门',
        speaker: '系统',
        speakerTitle: '修仙系统 · 天机阵脑',
        speakerAvatar: 'assets/character/cheat_system_spirit.png',
        dialogue: [
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“这就是本宗的十二重斩妖天梯？前方妖气森然，几只山门巡弋妖兽挡住了去路！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“几个杂鱼妖兽也敢拦本系统宿主？直接平推！打通前3关，本系统保你爆出护身绿阶灵宝！”'
          }
        ]
      },

      sect_stage3_clear: {
        id: 'sect_stage3_clear',
        title: '试炼 · 初露锋芒',
        speaker: '同门执事',
        speakerTitle: '宗门外门执事',
        speakerAvatar: 'assets/character/hero_cultivator.png',
        dialogue: [
          {
            sender: 'player',
            name: '同门执事',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“嘶——！恶犬头目这般皮糙肉厚的凶物，竟被林师弟三招劈成两段？！这等身手当真刚入宗门？！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“同门震惊值 +666！刚爆的护体神装快穿上！前面第4关开始有精英毒兽出没，可别翻车！”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“承让！区区恶兽不足挂齿，且待我继续登梯！”'
          }
        ]
      },

      sect_stage6_clear: {
        id: 'sect_stage6_clear',
        title: '试炼 · 登堂入室',
        speaker: '系统',
        speakerTitle: '修仙系统 · 天道阵脑',
        speakerAvatar: 'assets/character/cheat_system_spirit.png',
        dialogue: [
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“叮！第6重守山凶兽已伏诛！本门派心法领悟度狂飙，战力暴涨！蓝品极品神装已入手！”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“浑身真气奔腾如江河！不过前方山道煞气愈发浓烈，敌方灵压开始吃紧了。”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“慌什么？战力不够就去乾坤袋里3合1合成紫装！有本系统在，后山的妖魔鬼怪都是送经验的经验包！”'
          }
        ]
      },

      sect_stage9_clear: {
        id: 'sect_stage9_clear',
        title: '试炼 · 真传砥砺',
        speaker: '宗门长老',
        speakerTitle: '宗门传功长老',
        speakerAvatar: 'assets/character/hero_cultivator.png',
        dialogue: [
          {
            sender: 'player',
            name: '宗门长老',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“九重天梯，金角凶煞！此子竟以摧枯拉朽之势连破九阵！老夫修道两百载，从未见过如此妖孽的修行奇才！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“长老眼睛都看直了！宿主，距离问鼎首席只剩最后三关！把紫品神装全部合满，准备加冕道子！”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“九阶已破，十二重绝巅，我林凡必登顶峰！”'
          }
        ]
      },

      sect_stage12_clear: {
        id: 'sect_stage12_clear',
        title: '试炼 · 道子绝巅',
        speaker: '宗门掌教',
        speakerTitle: '宗门无上掌教',
        speakerAvatar: 'assets/character/hero_cultivator.png',
        dialogue: [
          {
            sender: 'player',
            name: '宗门掌教',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“双圣傀儡皆败，十二天梯尽折！紫气东来三万里！传本座法旨，拜林凡为我宗当代首席真传道子！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“掌教老头给你封道子了！不过别高兴太早，后山禁地的那头万年镇派大妖王已经苏醒了，正在疯狂撞击封印！”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“守关妖王么？正好拿它来检验我一身六槽大圆满神装的真正杀力！”'
          }
        ]
      },

      sect_stage13_boss_pre: {
        id: 'sect_stage13_boss_pre',
        title: '决战 · 霸主现世',
        speaker: '守关妖王',
        speakerTitle: '宗门禁地万年大妖王',
        speakerAvatar: 'assets/boss/boss_red_python_vivid.png',
        dialogue: [
          {
            sender: 'player',
            name: '守关妖王',
            avatar: 'assets/boss/boss_red_python_vivid.png',
            text: '“吼——！渺小凡胎蝼蚁，竟敢踏足本王沉眠绝地！今日本王便将你神魂炼化入腹！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“吼什么吼，嗓门大有用？本系统已经悄悄黑掉了它的护甲抗性！宿主，放开手脚秒了它，爆下一宗门的真传法牒！”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“孽畜休得狂妄，今日便是你的死期！”'
          }
        ]
      },

      // =========================================================================
      // 灵界 · 飘渺九霄仙域主线篇章 (Post-Ascension Spirit Realm)
      // =========================================================================
      spirit_realm_intro: {
        id: 'spirit_realm_intro',
        title: '仙界 · 斩碎仙籍',
        speaker: '系统',
        speakerTitle: '修仙系统 · 破界灵识',
        speakerAvatar: 'assets/character/cheat_system_spirit.png',
        dialogue: [
          {
            sender: 'player',
            name: '仙庭巡界使',
            avatar: 'assets/boss/boss_tianji_puppet_vivid.png',
            text: '“下界偷渡逆修听令！速速跪拜受缚，废去金丹道基入仙籍矿场开采仙晶十万载，方可赎去逆天之罪！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“去你大爷的矿奴！本系统直接给仙籍锁链来一记格式化指令！宿主，拔剑，剁了这个装神弄鬼的看门狗！”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“（轰！一剑斩碎仙籍铁链，巡界使身首异处！）仙庭又如何？我林凡成道于微末，岂容尔等欺压！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“爽！仙界天道防火墙已被黑掉30%！仙域通天塔大门已破，极品仙晶与通天灵宝滚轮全面激活，杀上九霄！”'
          }
        ]
      },

      spirit_boss1_clear: {
        id: 'spirit_boss1_clear',
        title: '仙域 · 诛邪剑陨',
        speaker: '系统',
        speakerTitle: '修仙系统 · 破界灵识',
        speakerAvatar: 'assets/character/cheat_system_spirit.png',
        dialogue: [
          {
            sender: 'player',
            name: '诛邪剑尊残相',
            avatar: 'assets/boss/boss_tianji_puppet_vivid.png',
            text: '“（剑气溃散）三万年了...老夫沉沦仙庭为奴三万载，今日竟败于后世飞升小友之手...好霸道的逆天剑意！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“叮！诛邪剑尊伏诛！掉落上古通天灵宝【诛仙青冥剑】！附带专属仙道被动【真伤破晓】！”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“前辈且安息。这九霄仙庭的虚伪天道，由晚辈替你斩碎！”'
          }
        ]
      },

      spirit_boss4_clear: {
        id: 'spirit_boss4_clear',
        title: '仙域终局 · 诸天主宰',
        speaker: '系统',
        speakerTitle: '修仙系统 · 鸿蒙灵识',
        speakerAvatar: 'assets/character/cheat_system_spirit.png',
        dialogue: [
          {
            sender: 'player',
            name: '伪天道金身',
            avatar: 'assets/boss/boss_thunder_dragon_vivid.png',
            text: '“吾乃天地至高规则...因果律不可改...汝为何能...跳出三界之外？！”'
          },
          {
            sender: 'system',
            name: '系统',
            avatar: 'assets/character/cheat_system_spirit.png',
            text: '“因为本系统就是天道最大的Bug！死机吧你！核心代码全量覆盖，天机造化神盘全面掌控大千诸天！”'
          },
          {
            sender: 'player',
            name: '宿主 (林凡)',
            avatar: 'assets/character/hero_cultivator.png',
            text: '“万界归一，大道独尊！从凡间柴刀到诸天主宰，我林凡当立永恒仙规！”'
          }
        ]
      }
    },

    // =========================================================================
    // 2. 拜入 8 大宗门时修仙系统的专属指引
    // =========================================================================
    SECT_JOIN_REACTIONS: {
      wanjian: '【修仙系统】：“剑修都是一帮兜里比脸还干净的穷鬼，不过杀伐极猛！看本座给你摇出满屏飞剑，一剑断万山！”',
      taiyi: '【修仙系统】：“选了太乙丹霞宗？很好，苟道长青，灵丹管够！哪怕空转本座也能从路边给你顺两颗灵丹回来补气血！”',
      yushou: '【修仙系统】：“御兽玄机门？开局自带一头通灵狼，群殴的感觉就是爽！关门，放狗...啊不，放狼！”',
      tianji: '【修仙系统】：“天机神阵门？同行是冤家，这帮摆阵的见了我都得喊祖师爷！八卦百搭满天飞，稳如老狗！”',
      fen_tian: '【修仙系统】：“九幽魔火，绝地狂赌！残血伤害翻倍？有本座在，你负责残血耍帅，本座负责帮你秒怪！”',
      fentian: '【修仙系统】：“九幽魔火，绝地狂赌！残血伤害翻倍？有本座在，你负责残血耍帅，本座负责帮你秒怪！”',
      wantong: '【修仙系统】：“万通多宝商行！有眼光，修仙就是修资源！把灵石赚够，神装直接打包带进下辈子，富可敌国！”',
      qintian: '【修仙系统】：“钦天观星监？天下大势尽在天枢罗盘，这把算无遗策，下辈子必定自选指定飞升真卷！”',
      jiusi: '【修仙系统】：“九死血魂魔宗！生死看淡不服就干，随时夺舍重开！速刷割草流，老夫聊发少年狂！”'
    },

    // =========================================================================
    // 3. 境界突破专属对白与同门震惊
    // =========================================================================
    REALM_BREAKTHROUGHS: {
      2: {
        speaker: '修仙系统',
        quote: '“练气二层了？就这？天道那老头刚才气得胡子都抖了一下，以为你卡在凡胎呢，继续冲！”'
      },
      3: {
        speaker: '同门师妹',
        quote: '“天呐！师兄昨日才刚入宗门，今日竟已突破至练气三层，这般修炼速度，当真恐怖如斯！”'
      },
      5: {
        speaker: '宗门外门长老',
        quote: '“骨龄尚幼，气息却沉稳如山岳！老夫阅人无数，此子必有大帝之资！”'
      },
      7: {
        speaker: '修仙系统',
        quote: '“练气后期！灵气经脉已经拓宽，本系统给你截获的灵丹药效直接翻倍吸收！”'
      },
      10: {
        speaker: '万剑宗太上长老',
        quote: '“练气圆满！紫气浩荡三十里，天生异象！速传法旨，封此子为我宗首席真传道子！”'
      },
      11: {
        speaker: '修仙系统',
        quote: '“筑基之始，褪去凡躯铸就道胎！聚宝盆已进阶，咱们去祸害更高阶的妖兽与仙藏！”'
      }
    },

    // =========================================================================
    // 4. 网文灵魂动态弹幕语料库 (Dynamic Chatter Bank)
    // 覆盖 11 大情境，实时由 StoryManager 驱动更新至主界面气泡与战报
    // =========================================================================
    CHATTER: {
      // 1. 待机/挂机神念 (Idle)
      idle: [
        '【修仙系统】：“天道老头刚才打了个盹，趁他没醒，赶快推演两把！”',
        '【修仙系统】：“检测到方圆百里灵气汇聚，本座掐指一算，今日有大造化降临！”',
        '【修仙系统】：“莫闲着，拨动天机盘，万一爆了极品法宝呢？”',
        '【同门师弟】：“师兄终日在此推演阵盘，周身道韵流转，莫非是在参悟无上仙法？”',
        '【修仙系统】：“修仙不易，外挂傍身！有本座护体，诸邪不侵，大道可期。”'
      ],

      // 2. 普通中奖 (Spin Win)
      spin_win: [
        '【修仙系统】：“顺走天道二两灵砂，美滋滋，积少成多！”',
        '【修仙系统】：“天机盘运转无误，灵机与修为尽收囊中。”',
        '【同门师妹】：“哇！师兄指尖灵光一闪，又有仙家机缘入账了！”',
        '【修仙系统】：“小小中奖，不过是本座随手拨弄因果的小把戏。”',
        '【修仙系统】：“继续保持，天机蕴灵正在悄悄填满！”'
      ],

      // 3. 连线大奖 / Mega Win (Spin Big Win)
      spin_big_win: [
        '【万剑宗太上长老】：“紫光冲霄，道音轰鸣！此子悟性逆天，实乃我宗万载不遇之麒麟仙胚！”',
        '【修仙系统】：“基操勿六！刚才本座不过是黑了天道一下，海量机缘直接到手！”',
        '【同门弟子】：“天呐！这等连线神迹，我在宗门藏经阁古籍里都未曾见过！”',
        '【修仙系统】：“发财了发财了！这一波赚得盆满钵满，聚宝盆都要溢出来了！”',
        '【万通商行大掌柜】：“这般夺天地机缘之手笔，老夫经商三百年亦甘拜下风！”'
      ],

      // 4. 气运之子大满贯 / All Wild Mega Win (PRD 10.5 节高光)
      spin_all_wild: [
        '【修仙系统预警】：“警告！强行夺取了天地万载气运，全盘八卦百搭！本轮机缘暴涨 10 倍！快收！”',
        '【天道意志震怒】：“何方妖孽？！竟敢篡改因果律！此子气运为何直逼鸿蒙道祖？！”',
        '【修仙系统】：“哈哈哈！天道老儿急了！满屏至宝，全归宿主所有！”'
      ],

      // 5. 空转未中 (Spin Empty)
      spin_empty: [
        '【修仙系统】：“咳...刚才天道纠察使路过，本座收了收神通，下把必中！”',
        '【修仙系统】：“空转是蓄力的开始，本座正在帮你积攒无上欧气。”',
        '【修仙系统】：“别慌，草木回灵，吸一口天地灵气平复一下心情。”',
        '【同门师兄】：“道海浮沉，偶有波折实属寻常，师弟且稳住道心！”'
      ],

      // 6. 战斗暴击秒怪 (Battle Crit)
      battle_crit: [
        '【同门师妹】：“天呐！师兄这一剑平平无奇，为何竟恐怖如斯？！”',
        '【修仙系统】：“叫你别惹我宿主，下辈子投胎记得把眼睛擦亮！”',
        '【敌方妖兽】：“嗷呜？！这凡人的一剑为何带着开天辟地的毁灭剑意？！”',
        '【修仙系统】：“弱点暴击！弱鸡妖兽，在至高修仙系统面前不堪一击！”'
      ],

      // 7. 濒死残血 (Battle Danger)
      battle_danger: [
        '【修仙系统急呼】：“喂喂！快嗝屁了！赶紧嚼一颗气血丹，本座可不想另寻新宿主！”',
        '【修仙系统】：“小心！妖王发狂了！稳住气血，等本座算它破绽！”',
        '【同门师弟惊呼】：“师兄小心！这妖孽残血狂暴了，快用保命符箓！”'
      ],

      // 8. 灵机耗尽 (Energy Empty)
      energy_empty: [
        '【修仙系统提示】：“机缘断粮了！赶紧打坐吐纳，或者引渡天降造化灵泉！”',
        '【修仙系统】：“巧妇难为无米之炊，快去洞天收取累积的灵气，本系统还要大显身手呢！”',
        '【修仙系统】：“灵机枯竭，切莫慌乱，天道自有漏灵之时。”'
      ],

      // 9. 装备3合1合成极品神装 (Equip Merge)
      equip_merge: [
        '【修仙系统】：“三块破铜烂铁融出绝世神装！天道炼器大宗师看了都得吐血三升！”',
        '【宗门执事】：“宝光冲斗牛！师兄此宝莫非是上古仙家遗泽？太强悍了！”',
        '【修仙系统】：“换上这件行头，你的战力又飙升了一截，去后山横着走吧！”'
      ],

      // 10. 开启洞天秘境 Hold & Spin (Hold & Spin)
      hold_spin: [
        '【修仙系统】：“八卦锁星，秘境大开！天道的小金库今天归我们掌管了，填满它！”',
        '【修仙系统】：“引灵入窍！只要转出新秘印就能无限续命，狠狠地薅！”',
        '【同门弟子】：“好强烈的洞天共鸣！师兄竟然引动了上古锁盘秘境！”'
      ],

      // 11. 斩妖升阶窃取到门票 (Sect Ticket)
      sect_ticket: [
        '【修仙系统】：“新宗门的引荐令已经截获！想不想兵解转世去他们家当一把祖师爷？”',
        '【修仙系统】：“手握他宗法牒，神魂逆转带走20%道基和神装，这才是真正的修仙大盗！”'
      ]
    },

    /**
     * 判定试炼关卡当前阶段是否存在里程碑剧情
     * @param {string} sectId - 宗门 ID
     * @param {number} stageIndex - 关卡索引 (1~13)
     * @param {string} moment - 'start' | 'clear'
     * @param {number} worldTier - 1=人界, 2=灵界
     */
    getMilestoneChapter(sectId = 'wanjian', stageIndex = 1, moment = 'clear', worldTier = 1) {
      if (worldTier === 2) {
        if (stageIndex === 1 && moment === 'start') return 'spirit_realm_intro';
        if (stageIndex === 1 && moment === 'clear') return 'spirit_boss1_clear';
        if (stageIndex === 12 && moment === 'clear') return 'spirit_boss4_clear';
        return null;
      }

      // 人界 12 阶天梯里程碑映射
      const idx = Number(stageIndex);
      if (moment === 'start') {
        if (idx === 1) return 'sect_stage1_start';
        if (idx === 13) return 'sect_stage13_boss_pre';
        return null;
      }

      if (moment === 'clear') {
        if (idx === 3) return 'sect_stage3_clear';
        if (idx === 6) return 'sect_stage6_clear';
        if (idx === 9) return 'sect_stage9_clear';
        if (idx === 12) return 'sect_stage12_clear';
        return null;
      }

      return null;
    }
  };

  // 暴露至全局命名空间
  global.SlotsRPG = global.SlotsRPG || {};
  global.SlotsRPG.StoryConfig = StoryConfig;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoryConfig;
  }
})(typeof window !== 'undefined' ? window : global);
