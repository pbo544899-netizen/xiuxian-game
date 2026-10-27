/**
 * StoryManager.js
 * 《我有一个修仙系统》剧情驱动引擎与网文弹幕调度器
 * 核心职责：
 * 1. 驱动主视口顶部作弊器神念对话气泡 (#cheat-dialog) 的实时响应与水墨淡入淡出动画
 * 2. 挂载 12 秒空闲待机神念轮播定时器，保持界面鲜活灵动
 * 3. 监听全局 EventBus 核心事件 (推演中奖/大奖/AllWild、暴击、升阶窃取门票、境界突破、兵解轮回)
 * 4. 驱动多步沉浸式水墨剧情对话弹窗 (#modal-story-dialog)
 */

(function (global) {
  'use strict';

  class StoryManager {
    constructor() {
      this.gameManager = null;
      this.storyConfig = null;
      this.idleTimer = null;
      this.idleInterval = 12000; // 12 秒待机神念轮播

      // DOM 引用缓存
      this.dom = {
        cheatBubble: null,
        cheatDialog: null,
        cheatAvatar: null,
        modalStoryDialog: null,
        storyTitle: null,
        storySpeakerBadge: null,
        storyAvatarImg: null,
        storyContentText: null,
        storyChatStream: null,
        chatInputPreview: null,
        btnStoryNextText: null,
        btnStoryNext: null,
        btnStorySkip: null
      };

      // 剧情弹窗步进状态机
      this.activeStory = {
        dialogue: [],
        lines: [],
        currentIndex: 0,
        onComplete: null,
        isOpen: false
      };
      this.isDialogActive = false;
    }

    /**
     * 初始化挂载
     */
    init(gameManager) {
      this.gameManager = gameManager;
      this.storyConfig = (global.SlotsRPG && global.SlotsRPG.StoryConfig) || null;

      this.cacheDOMElements();
      this.bindStoryDialogEvents();
      this.bindGameEvents();
      this.startIdleChatterTimer();

      // 初始展示凡人/入道问候 (凡人阶段绝不提前透露作弊器与天机盘)
      if (this.gameManager && !this.gameManager.isPrologueComplete) {
        if (this.gameManager.prologueStep < 2) {
          this.setCheatDialog('【林凡】：“凡人一介，家中米尽，唯有握紧柴刀去后山采药了...”', '林凡');
        } else if (this.gameManager.prologueStep === 2) {
          this.setCheatDialog('【林凡】：“恶兽已除，偶获上古残盘！快去乾坤袋看看...”', '林凡');
        } else if (this.gameManager.prologueStep === 3) {
          this.setCheatDialog('【修仙系统】：“系统已成功绑定！速速启动系统推演，本系统保你首抽必出顶级仙门神装！”', '系统');
        } else {
          this.getRandomChatter('idle');
        }
      } else {
        this.getRandomChatter('idle');
      }

      console.log('📖 StoryManager 剧情与网文弹幕系统初始化完成');
    }

    /**
     * 缓存 DOM 节点
     */
    cacheDOMElements() {
      if (typeof document === 'undefined') return;

      this.dom.cheatBubble = document.querySelector('.cheat-bubble');
      this.dom.cheatDialog = document.getElementById('cheat-dialog');
      this.dom.cheatAvatar = document.querySelector('.cheat-avatar');

      this.dom.modalStoryDialog = document.getElementById('modal-story-dialog');
      this.dom.storyCard = document.getElementById('story-overhead-theatre') || document.querySelector('.story-theatre-card') || document.querySelector('.story-overhead-theatre');
      this.dom.storyTitle = document.getElementById('story-dialog-title');
      this.dom.storySpeakerBadge = document.getElementById('story-dialog-speaker');
      this.dom.storyAvatarImg = document.getElementById('story-dialog-avatar');
      this.dom.storyContentText = document.getElementById('story-dialog-text');
      this.dom.storyChatStream = document.getElementById('story-chat-stream');
      this.dom.chatInputPreview = document.getElementById('chat-input-preview');
      this.dom.btnStoryNextText = document.getElementById('btn-story-next-text');
      this.dom.btnStoryNext = document.getElementById('btn-story-next');
      this.dom.btnStorySkip = document.getElementById('btn-story-skip');

      // 剧情舞台对峙角色立绘与名牌
      this.dom.actorPlayer = document.getElementById('story-actor-player');
      this.dom.actorCheat = document.getElementById('story-actor-cheat');
      this.dom.actorPlayerImg = document.getElementById('actor-avatar-player-img');
      this.dom.actorCheatImg = document.getElementById('actor-avatar-cheat-img');
      this.dom.actorPlayerName = document.getElementById('actor-player-name');
      this.dom.actorCheatName = document.getElementById('actor-cheat-name');

      // 角色形象头顶专属对白聊天泡泡与文本
      this.dom.playerBubble = document.getElementById('player-speech-bubble');
      this.dom.playerBubbleSpeakerTag = document.getElementById('player-bubble-speaker-tag');
      this.dom.playerBubbleText = document.getElementById('player-bubble-text');
      this.dom.systemBubble = document.getElementById('system-speech-bubble');
      this.dom.systemBubbleSpeakerTag = document.getElementById('system-bubble-speaker-tag');
      this.dom.systemBubbleText = document.getElementById('system-bubble-text');

      // 系统实时灵犀提示浮窗 (#system-tip-toast)
      this.dom.systemTipToast = document.getElementById('system-tip-toast');
      this.dom.systemTipBadge = document.getElementById('system-tip-toast-badge');
      this.dom.systemTipText = document.getElementById('system-tip-toast-text');
      this.dom.btnSystemToastClose = document.getElementById('btn-system-toast-close');

      // 主界面常驻【作弊系统】互动入口
      this.dom.btnCheatSystemAi = document.getElementById('btn-cheat-system-ai');
      this.dom.cheatSystemUnreadDot = document.getElementById('cheat-system-unread-dot');
    }

    /**
     * 绑定剧情弹窗点击交互
     */
    bindStoryDialogEvents() {
      if (this.dom.btnCheatSystemAi) {
        this.dom.btnCheatSystemAi.addEventListener('click', (e) => {
          if (e && e.stopPropagation) e.stopPropagation();
          this.handleCheatSystemClick();
        });
      }

      if (this.dom.btnStoryNext) {
        this.dom.btnStoryNext.addEventListener('click', (e) => {
          if (e && e.stopPropagation) e.stopPropagation();
          this.advanceStoryLine();
        });
      }

      if (this.dom.btnStorySkip) {
        this.dom.btnStorySkip.addEventListener('click', (e) => {
          if (e && e.stopPropagation) e.stopPropagation();
          this.closeStoryDialog(true);
        });
      }

      // 仙侠RPG沉浸手感：点击剧情舞台或对白遮罩任意处推进头顶气泡
      const handleStageTap = (e) => {
        if (e && e.target && typeof e.target.closest === 'function') {
          if (e.target.closest('#btn-story-skip') || e.target.closest('#btn-story-next')) {
            return;
          }
        }
        this.advanceStoryLine();
      };

      if (this.dom.storyCard) {
        this.dom.storyCard.addEventListener('click', handleStageTap);
      }
      if (this.dom.modalStoryDialog) {
        this.dom.modalStoryDialog.addEventListener('click', handleStageTap);
      }

      // 系统灵犀气泡关闭按钮
      if (this.dom.btnSystemToastClose) {
        this.dom.btnSystemToastClose.addEventListener('click', (e) => {
          if (e && e.stopPropagation) e.stopPropagation();
          this.hideSystemTip();
        });
      }
    }

    /**
     * 监听核心游戏事件并自动分发剧情
     */
    bindGameEvents() {
      const bus = global.SlotsRPG && global.SlotsRPG.EventBus;
      if (!bus) return;

      // 1. 推演结束：根据中奖程度更新神念语料 (兼容 SPIN_COMPLETE 与 SPIN_COMPLETED)
      const handleSpinResult = (data) => {
        if (!data) return;
        const spinData = data.spinData || data;
        const evalResult = (spinData && spinData.evaluation) || spinData || {};
        const totalWin = evalResult.totalPayout !== undefined ? evalResult.totalPayout : (evalResult.totalWin || 0);
        const isAllWild = !!evalResult.isAllWild;
        const winMultiplier = evalResult.winMultiplier || (spinData && spinData.betMultiplier) || 1;
        const isBigWin = !!evalResult.isBigWin || totalWin >= 75;

        // 特殊：全百搭气运之子大满贯
        if (isAllWild || winMultiplier >= 10) {
          this.triggerChatter('spin_all_wild');
          return;
        }

        // 连线大奖 (Mega Win / Big Win)
        if (totalWin > 0 && (isBigWin || winMultiplier >= 3)) {
          this.triggerChatter('spin_big_win');
          return;
        }

        // 普通中奖
        if (totalWin > 0) {
          this.triggerChatter('spin_win');
          return;
        }

        // 空转未中
        this.triggerChatter('spin_empty');
      };

      bus.on('SPIN_COMPLETE', handleSpinResult);
      bus.on('SPIN_COMPLETED', handleSpinResult);

      // 作弊器觉醒认主
      bus.on('ARTIFACT_AWAKENED', () => {
        this.setCheatDialog('【修仙系统】：“系统已成功绑定！速速启动系统推演，本系统保你首抽必出顶级仙门神装！”');
      });

      // 2. 聚宝盆升阶击败妖王，截获新宗门门票 (方案 A 关键主线)
      bus.on('CHEAT_TICKET_ACQUIRED', (data) => {
        if (!data || !data.ticket) return;
        const targetSectName = data.ticket.sectName || '未知仙门';
        
        // 立即更新顶栏气泡
        this.setCheatDialog(`【修仙系统】：“叮！已为宿主截获一枚【${targetSectName}】真传法牒！通关后可至【升仙天碑】兵解转世！”`);

        // 弹出聊天软件式剧情对话框
        this.triggerChapter('pot_promoted_ticket', null, { sectName: targetSectName });
      });

      // 3. 境界突破
      bus.on('LEVEL_UP', (data) => {
        if (!data) return;
        const newLvl = data.newLevel;
        const breakConfig = this.storyConfig && this.storyConfig.REALM_BREAKTHROUGHS && this.storyConfig.REALM_BREAKTHROUGHS[newLvl];
        if (breakConfig) {
          this.setCheatDialog(`【${breakConfig.speaker}】：${breakConfig.quote}`);
        } else {
          this.setCheatDialog(`【修仙系统】：“突破了！道行精进，本系统能为你推演更丰厚的天道机缘！”`);
        }
      });

      // 4. 拜入宗门大捷
      bus.on('PROLOGUE_COMPLETED', (data) => {
        if (!data || !data.sectId) return;
        const reaction = this.storyConfig && this.storyConfig.SECT_JOIN_REACTIONS && this.storyConfig.SECT_JOIN_REACTIONS[data.sectId];
        if (reaction) {
          this.setCheatDialog(reaction);
        }
      });

      // 5. 兵解轮回完成
      bus.on('SAMSARA_COMPLETED', (data) => {
        const sectName = (data && data.sectName) || '新仙门';
        this.setCheatDialog(`【修仙系统】：“九世宿慧觉醒！20%先天道基与神装已继承，入驻【${sectName}】！”`);
      });

      // 6. 白日飞升完成
      bus.on('ASCENSION_COMPLETED', () => {
        this.triggerChapter('ascension_complete');
      });

      // 7. 装备 3 合 1 升阶
      bus.on('EQUIP_MERGED', () => {
        this.triggerChatter('equip_merge');
      });

      // 8. 开启秘境 Hold & Spin
      bus.on('HOLD_AND_SPIN_TRIGGERED', () => {
        this.triggerChatter('hold_spin');
      });

      // 9. 灵机断粮
      bus.on('ENERGY_DEPLETED', () => {
        this.triggerChatter('energy_empty');
      });

      // 10. 试炼关卡开启 (判定里程碑前置对白)
      bus.on('TRIAL_STAGE_START', (data) => {
        if (!data || !this.storyConfig) return;
        const curSect = data.sectId || 'wanjian';
        const stage = data.stage || 1;
        const wTier = (this.gameManager && this.gameManager.currentWorldTier) || 1;
        const chapterId = this.storyConfig.getMilestoneChapter(curSect, stage, 'start', wTier);
        if (chapterId) {
          this.triggerChapter(chapterId, () => {
            if (data.onComplete) data.onComplete();
          });
        }
      });

      // 11. 试炼关卡战胜大捷 (判定里程碑通关对白)
      bus.on('TRIAL_STAGE_CLEARED', (data) => {
        if (!data || !this.storyConfig) return;
        const curSect = data.sectId || 'wanjian';
        const stage = data.stage || 1;
        const wTier = (this.gameManager && this.gameManager.currentWorldTier) || 1;
        const chapterId = this.storyConfig.getMilestoneChapter(curSect, stage, 'clear', wTier);
        if (chapterId) {
          setTimeout(() => {
            this.triggerChapter(chapterId);
          }, 400);
        } else {
          this.setCheatDialog(`【修仙系统】：“第 ${stage} 关妖兽荡平！宿主战力狂飙，速速挺进下一重天梯！”`);
        }
      });
    }

    /**
     * 更新主界面作弊器神念气泡
     * @param {string} text - 对话文本
     * @param {string} avatarLabel - 头像标签 (默认 '作弊器')
     */
    setCheatDialog(text, avatarLabel = '系统') {
      if (!this.dom.cheatDialog) return;

      if (this.dom.cheatAvatar) {
        this.dom.cheatAvatar.innerText = avatarLabel;
      }

      // 添加水墨平滑淡入动画
      this.dom.cheatDialog.classList.remove('cheat-text-fade');
      void this.dom.cheatDialog.offsetWidth; // 触发 reflow 重置动画
      this.dom.cheatDialog.innerText = text;
      this.dom.cheatDialog.classList.add('cheat-text-fade');

      // 重置待机计时器
      this.restartIdleChatterTimer();
    }

    /**
     * 随机获取分类语料并更新气泡
     */
    triggerChatter(categoryKey) {
      if (!this.storyConfig || !this.storyConfig.CHATTER) return;
      const list = this.storyConfig.CHATTER[categoryKey];
      if (!list || list.length === 0) return;

      const randomText = list[Math.floor(Math.random() * list.length)];
      this.setCheatDialog(randomText);
    }

    /**
     * 别名方法：获取随机语料
     */
    getRandomChatter(categoryKey) {
      this.triggerChatter(categoryKey);
    }

    /**
     * 待机神念轮播定时器
     */
    startIdleChatterTimer() {
      this.stopIdleChatterTimer();
      if (typeof window === 'undefined') return;

      this.idleTimer = setInterval(() => {
        // 若当前有全屏弹窗或正在转盘中，不打扰
        if (this.activeStory.isOpen) return;
        if (this.gameManager && (this.gameManager.isSpinning || this.gameManager.isAutoSpinning)) return;
        // 凡人未解封天机盘前，不播放作弊器待机语料
        if (this.gameManager && !this.gameManager.isPrologueComplete && this.gameManager.prologueStep < 3) return;

        this.triggerChatter('idle');
      }, this.idleInterval);
    }

    stopIdleChatterTimer() {
      if (this.idleTimer) {
        clearInterval(this.idleTimer);
        this.idleTimer = null;
      }
    }

    restartIdleChatterTimer() {
      this.startIdleChatterTimer();
    }

    /**
     * 触发指定剧情章节对话弹窗
     * @param {string} chapterId - 对应 StoryConfig.CHAPTERS 的 key
     * @param {Function} onComplete - 播放完毕回调
     * @param {Object} extraData - 附加动态数据 (如 sectName)
     */
    triggerChapter(chapterId, onComplete = null, extraData = {}) {
      if (!this.storyConfig || !this.storyConfig.CHAPTERS) return;
      const chapter = this.storyConfig.CHAPTERS[chapterId];
      if (!chapter) return;

      let dialogue = chapter.dialogue ? JSON.parse(JSON.stringify(chapter.dialogue)) : null;
      let lines = chapter.lines ? JSON.parse(JSON.stringify(chapter.lines)) : null;

      // 替换动态变量 (例如 {sectName})
      if (extraData && extraData.sectName) {
        if (dialogue) {
          dialogue.forEach(d => {
            if (d.text) d.text = d.text.replace(/\{sectName\}/g, extraData.sectName);
          });
        }
        if (lines) {
          lines = lines.map(l => l.replace(/\{sectName\}/g, extraData.sectName));
        }
      }

      this.showStoryDialog({
        title: chapter.title,
        speaker: chapter.speaker,
        speakerTitle: chapter.speakerTitle,
        avatar: chapter.speakerAvatar,
        dialogue: dialogue,
        lines: lines
      }, onComplete);
    }

    /**
     * 打开仙侠RPG沉浸式剧情对白舞台 (角色形象头顶聊天泡泡对白模式)
     */
    showStoryDialog(dialogData, onComplete = null) {
      if (!this.dom.modalStoryDialog || !dialogData) {
        if (onComplete) onComplete();
        return;
      }

      this.hideSystemTip();

      // 开启剧情对话时，立即隐藏聚光灯引导遮罩，防止抢跑穿透
      if (global.SlotsRPG && global.SlotsRPG.SpotlightGuide) {
        global.SlotsRPG.SpotlightGuide.hide();
      }
      this.isDialogActive = true;

      // 1. 规范化剧情对白序列
      let dialogue = [];
      if (Array.isArray(dialogData.dialogue) && dialogue.length === 0 && dialogData.dialogue.length > 0) {
        dialogue = JSON.parse(JSON.stringify(dialogData.dialogue));
      } else if (Array.isArray(dialogData.lines) && dialogData.lines.length > 0) {
        // 兼容模式：偶数条系统(右)，奇数条宿主玩家(左)
        dialogue = dialogData.lines.map((text, idx) => {
          const isSystem = idx % 2 === 0;
          return {
            sender: isSystem ? 'system' : 'player',
            name: isSystem ? (dialogData.speaker || '系统') : '宿主 (林凡)',
            avatar: isSystem ? (dialogData.avatar || 'assets/character/cheat_system_spirit.png') : 'assets/character/hero_cultivator.png',
            text: text
          };
        });
      } else if (Array.isArray(dialogData.dialogue) && dialogData.dialogue.length > 0) {
        dialogue = JSON.parse(JSON.stringify(dialogData.dialogue));
      } else {
        dialogue = [{
          sender: 'system',
          name: dialogData.speaker || '系统',
          avatar: dialogData.avatar || 'assets/character/cheat_system_spirit.png',
          text: dialogData.lines || ''
        }];
      }

      this.activeStory = {
        dialogue: dialogue,
        lines: dialogue.map(d => d.text),
        currentIndex: 0,
        onComplete: onComplete,
        isOpen: true
      };

      if (this.dom.storyTitle) {
        this.dom.storyTitle.innerText = dialogData.title || '序章 · 凡躯逆命';
      }

      if (this.dom.storySpeakerBadge) {
        this.dom.storySpeakerBadge.innerText = `【修仙系统】· 灵识通讯`;
      }

      if (this.dom.storyAvatarImg) {
        this.dom.storyAvatarImg.src = dialogData.avatar || 'assets/character/cheat_system_spirit.png';
      }

      // 播放系统接入音效
      if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('MODAL_OPEN');
      }

      // 清空旧气泡流 (兼容老节点)
      if (this.dom.storyChatStream) {
        this.dom.storyChatStream.innerHTML = '';
      }

      // 渲染第一句头顶气泡
      this.appendStoryMessage(0);
      this.updateFooterState();

      this.dom.modalStoryDialog.classList.remove('hidden');
    }

    /**
     * 渲染指定序号的角色头顶聊天气泡
     * @param {number} index 
     */
    appendStoryMessage(index) {
      if (!this.activeStory.dialogue) return;
      const msg = this.activeStory.dialogue[index];
      if (!msg) return;

      const isSystem = (msg.sender === 'system' || msg.sender === 'cheat');
      const isPlayer = (msg.sender === 'player');
      
      let avatarSrc = msg.avatar;
      const isPlayerHero = isPlayer && (!msg.name || msg.name.includes('林凡') || msg.name.includes('宿主'));
      if (isPlayerHero) {
        const curSect = window.gameManager && window.gameManager.player && window.gameManager.player.currentSect;
        const sectCfg = (window.SlotsRPG && window.SlotsRPG.SectConfig && window.SlotsRPG.SectConfig.SECTS && window.SlotsRPG.SectConfig.SECTS[curSect]) || null;
        const visual = (sectCfg && sectCfg.characterVisual) || (window.SlotsRPG && window.SlotsRPG.SectConfig && window.SlotsRPG.SectConfig.DEFAULT_CHARACTER);
        avatarSrc = (visual && (visual.dialogAvatar || visual.avatar)) || 'assets/character/hero_mortal.png';
      } else if (!avatarSrc) {
        avatarSrc = isSystem ? 'assets/character/cheat_system_spirit.png' : 'assets/character/hero_mortal.png';
      }

      const senderName = msg.name || (isSystem ? '修仙系统' : '宿主 (林凡)');

      // 1. 头顶聊天气泡模式：聚焦切换与头顶气泡文本动态装填
      if (this.dom.actorPlayer && this.dom.actorCheat) {
        // 判断系统是否处于未激活沉眠阶段 (序章凡人未认主前)
        const isSystemAwakened = (this.gameManager && (this.gameManager.isPrologueComplete || this.gameManager.prologueStep >= 2)) || isSystem;
        
        if (!isSystemAwakened) {
          this.dom.actorCheat.classList.add('actor-dormant');
          if (this.dom.actorCheatName) this.dom.actorCheatName.innerText = '修仙系统 (待唤醒)';
        } else {
          this.dom.actorCheat.classList.remove('actor-dormant');
          if (this.dom.actorCheatName) this.dom.actorCheatName.innerText = '⚡ 修仙系统';
        }

        if (isSystem) {
          this.dom.actorCheat.classList.add('active-speaker');
          this.dom.actorPlayer.classList.remove('active-speaker');
          if (this.dom.actorCheatImg) this.dom.actorCheatImg.src = avatarSrc;
          if (this.dom.actorCheatName) this.dom.actorCheatName.innerText = senderName;

          if (this.dom.systemBubbleSpeakerTag) {
            this.dom.systemBubbleSpeakerTag.innerText = `⚡ ${senderName}`;
          }
          if (this.dom.systemBubbleText) {
            if (msg.itemShowcase) {
              const item = msg.itemShowcase;
              this.dom.systemBubbleText.innerHTML = `
                <div class="bubble-text-msg">${msg.text}</div>
                <div class="story-bubble-item-showcase">
                  <div class="story-item-token-icon">${item.icon || '🎫'}</div>
                  <div class="story-item-token-info">
                    <div class="story-item-token-head">
                      <span class="story-item-token-name">${item.name}</span>
                      <span class="story-item-token-tag">${item.badge || '仙门信物'}</span>
                    </div>
                    <div class="story-item-token-desc">${item.desc}</div>
                  </div>
                </div>
              `;
            } else {
              this.dom.systemBubbleText.innerText = msg.text;
            }
          }
        } else {
          this.dom.actorPlayer.classList.add('active-speaker');
          this.dom.actorCheat.classList.remove('active-speaker');
          if (this.dom.actorPlayerImg) this.dom.actorPlayerImg.src = avatarSrc;
          if (this.dom.actorPlayerName) this.dom.actorPlayerName.innerText = senderName;

          if (this.dom.playerBubbleSpeakerTag) {
            const icon = isPlayerHero ? '🗡️ ' : '👤 ';
            this.dom.playerBubbleSpeakerTag.innerText = `${icon}${senderName}`;
          }
          if (this.dom.playerBubbleText) {
            if (msg.itemShowcase) {
              const item = msg.itemShowcase;
              this.dom.playerBubbleText.innerHTML = `
                <div class="bubble-text-msg">${msg.text}</div>
                <div class="story-bubble-item-showcase">
                  <div class="story-item-token-icon">${item.icon || '🎫'}</div>
                  <div class="story-item-token-info">
                    <div class="story-item-token-head">
                      <span class="story-item-token-name">${item.name}</span>
                      <span class="story-item-token-tag">${item.badge || '仙门信物'}</span>
                    </div>
                    <div class="story-item-token-desc">${item.desc}</div>
                  </div>
                </div>
              `;
            } else {
              this.dom.playerBubbleText.innerText = msg.text;
            }
          }
        }
      }

      // 2. 兼容历史节点与测试断言 (story-chat-stream 和 story-dialog-text)
      if (this.dom.storyContentText) {
        this.dom.storyContentText.innerText = msg.text;
      }

      if (this.dom.storyChatStream && typeof document !== 'undefined' && typeof document.createElement === 'function') {
        const bubbleSideClass = isSystem ? 'bubble-right bubble-cheat' : 'bubble-left bubble-player';
        const row = document.createElement('div');
        row.className = `game-bubble-row ${bubbleSideClass}`;
        row.innerHTML = `
          <div class="game-bubble-card">
            <div class="bubble-header-bar">
              <span class="bubble-sender-badge">${senderName}</span>
            </div>
            <div class="bubble-content-text">${msg.text}</div>
          </div>
        `;
        this.dom.storyChatStream.appendChild(row);
      }
    }

    /**
     * 更新底部推进行动栏文案与提示
     */
    updateFooterState() {
      const { dialogue, currentIndex } = this.activeStory;
      if (!dialogue || dialogue.length === 0) return;
      const isLast = currentIndex >= dialogue.length - 1;

      // 更新按钮文案 (兼容单元测试与游戏沉浸体验)
      const nextBtnText = isLast ? '知 悉 (继续)' : '下一步 ➔';
      if (this.dom.btnStoryNextText) {
        this.dom.btnStoryNextText.innerText = isLast ? '知 悉 (继续)' : '下一步';
      }
      if (this.dom.btnStoryNext) {
        this.dom.btnStoryNext.innerText = nextBtnText;
      }

      // 更新提示语与兼容
      if (this.dom.chatInputPreview) {
        if (isLast) {
          this.dom.chatInputPreview.innerText = '✨ 仙途指引已成，点击知悉继续...';
          this.dom.chatInputPreview.style.color = '#38ef7d';
        } else {
          this.dom.chatInputPreview.innerText = '点击任意处推进剧情...';
          this.dom.chatInputPreview.style.color = '#94a3b8';
        }
      }
    }

    /**
     * 步进下一句对白
     */
    advanceStoryLine() {
      if (!this.activeStory.isOpen) return;

      this.activeStory.currentIndex++;
      if (this.activeStory.currentIndex < this.activeStory.dialogue.length) {
        this.appendStoryMessage(this.activeStory.currentIndex);
        this.updateFooterState();
      } else {
        this.closeStoryDialog(false);
      }
    }

    /**
     * 关闭剧情弹窗
     */
    closeStoryDialog(isSkipped = false) {
      if (!this.activeStory.isOpen && !this.isDialogActive) return;

      this.activeStory.isOpen = false;
      this.isDialogActive = false;
      if (this.dom.modalStoryDialog) {
        this.dom.modalStoryDialog.classList.add('hidden');
      }

      const cb = this.activeStory.onComplete;
      this.activeStory.onComplete = null;
      if (typeof cb === 'function') {
        cb(isSkipped);
      }

      if (global.SlotsRPG && global.SlotsRPG.EventBus) {
        global.SlotsRPG.EventBus.emit('STORY_DIALOG_END', { isSkipped });
      }

      if (global.SlotsRPG && global.SlotsRPG.SpotlightGuide) {
        if (typeof global.SlotsRPG.SpotlightGuide.scheduleCheck === 'function') {
          global.SlotsRPG.SpotlightGuide.scheduleCheck(1200);
        } else {
          setTimeout(() => {
            global.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE();
          }, 1200);
        }
      }
    }

    closeModal(isSkipped = false) {
      this.closeStoryDialog(isSkipped);
    }

    /**
     * 弹出系统实时灵犀气泡提示 (用于战斗力不够、通关大捷、灵机告罄、装备合成等事件)
     * @param {string} textOrKey - 文本内容，或 StoryConfig.SYSTEM_TIPS 中的 key (如 'power_low', 'stage_clear')
     * @param {Object} options - 参数对象 (如 { playerPower, recPower, stage, realm, duration, type })
     */
    showSystemTip(textOrKey, options = {}) {
      let text = textOrKey;
      if (this.storyConfig && this.storyConfig.SYSTEM_TIPS && this.storyConfig.SYSTEM_TIPS[textOrKey]) {
        text = this.storyConfig.SYSTEM_TIPS[textOrKey];
        if (options) {
          for (const k in options) {
            text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), options[k]);
          }
        }
      }

      // 1. 同步在主界面顶部神念气泡展示
      this.setCheatDialog(text, '系统');

      // 2. 弹出轻量灵犀气泡 (#system-tip-toast)
      if (this.dom.systemTipToast) {
        if (this.systemTipTimer) {
          clearTimeout(this.systemTipTimer);
          this.systemTipTimer = null;
        }

        if (this.dom.systemTipText) {
          this.dom.systemTipText.innerText = text;
        }
        if (this.dom.systemTipBadge) {
          const type = options.type || (textOrKey.includes('low') || textOrKey.includes('depleted') ? 'warning' : (textOrKey.includes('clear') || textOrKey.includes('defeated') ? 'success' : 'info'));
          if (type === 'warning' || textOrKey === 'power_low') {
            this.dom.systemTipBadge.innerText = '⚠️【系统警示】';
            this.dom.systemTipBadge.style.color = '#ff6b6b';
          } else if (type === 'success' || textOrKey === 'stage_clear' || textOrKey === 'boss_defeated') {
            this.dom.systemTipBadge.innerText = '🎉【系统贺报】';
            this.dom.systemTipBadge.style.color = '#38ef7d';
          } else {
            this.dom.systemTipBadge.innerText = '⚡【系统提示】';
            this.dom.systemTipBadge.style.color = '#ffd700';
          }
        }

        this.dom.systemTipToast.classList.remove('hidden');

        // 3. 同步点亮主界面【作弊系统】提示红点
        if (this.dom.cheatSystemUnreadDot) {
          this.dom.cheatSystemUnreadDot.classList.remove('hidden');
        }

        const duration = options.duration || 4500;
        this.systemTipTimer = setTimeout(() => {
          this.hideSystemTip();
        }, duration);
      }
    }

    /**
     * 隐藏系统实时灵犀气泡提示
     */
    hideSystemTip() {
      if (this.systemTipTimer) {
        clearTimeout(this.systemTipTimer);
        this.systemTipTimer = null;
      }
      if (this.dom.systemTipToast) {
        this.dom.systemTipToast.classList.add('hidden');
      }
    }

    /**
     * 主界面【作弊系统】按钮点击响应：通过作弊系统主动触发对话与修行指引
     */
    handleCheatSystemClick() {
      if (window.SlotsRPG && window.SlotsRPG.SoundEffects) {
        window.SlotsRPG.SoundEffects.play('CLICK');
      }

      // 清除未读红点
      if (this.dom.cheatSystemUnreadDot) {
        this.dom.cheatSystemUnreadDot.classList.add('hidden');
      }

      const gm = this.gameManager || (window.SlotsRPG && window.SlotsRPG.GameManager) || window.gameManager;
      if (!gm) return;

      // 1. 战力不足预警诊断
      const trialInfo = (typeof gm.getCurrentTrialMonsterInfo === 'function') ? gm.getCurrentTrialMonsterInfo() : null;
      const playerPower = (gm.player && gm.player.combatPower) || 0;
      const recPower = (trialInfo && trialInfo.monster && trialInfo.monster.recPower) || 0;
      const isDangerous = recPower > 0 && playerPower < recPower;

      if (isDangerous) {
        this.showSystemTip('power_low', {
          playerPower: playerPower,
          recPower: recPower,
          type: 'warning'
        });
        return;
      }

      // 2. 洞天灵泉已满提示
      if (gm.caveManager && typeof gm.caveManager.canCollect === 'function' && gm.caveManager.canCollect()) {
        this.showSystemTip('cave_ready', { type: 'info' });
        return;
      }

      // 3. 装备可合成提示
      if (gm.inventory && typeof gm.inventory.hasMergeableEquipment === 'function' && gm.inventory.hasMergeableEquipment()) {
        this.showSystemTip('equip_merge_ready', { type: 'info' });
        return;
      }

      // 4. 灵机告罄提示
      if (gm.energy < (gm.currentBet || 25)) {
        this.showSystemTip('energy_depleted', { type: 'warning' });
        return;
      }

      // 5. 境界可突破提示
      if (gm.player && typeof gm.player.canBreakthrough === 'function' && gm.player.canBreakthrough()) {
        this.showSystemTip('level_up', { realm: gm.player.realmName, type: 'success' });
        return;
      }

      // 6. 常规状态：作弊系统高维神念指引
      const normalSystemQuotes = [
        '“叮！修仙系统运转正常！当前系统气运旺盛，速速推演天机，大爆神装！”',
        '“本系统已为宿主锁定天道机缘，连续推演将大幅增加【洞天共鸣】与伏妖概率！”',
        '“检测到宿主根骨精奇，通过推演积累修为，本系统助你早日突破瓶颈、叩开仙门！”',
        '“宿主切记：天机推演中获得的极品符箓，可在伏妖战中作为瞬发底牌逆转乾坤！”'
      ];
      const quote = normalSystemQuotes[Math.floor(Math.random() * normalSystemQuotes.length)];
      this.showSystemTip(quote, { type: 'info' });
    }
  }

  // 挂载至全局
  global.SlotsRPG = global.SlotsRPG || {};
  global.SlotsRPG.StoryManager = new StoryManager();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.SlotsRPG.StoryManager;
  }
})(typeof window !== 'undefined' ? window : global);
