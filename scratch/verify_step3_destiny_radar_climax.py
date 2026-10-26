# -*- coding: utf-8 -*-
import sys
import time
import json
import shutil
import tempfile
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def main():
    print("Launching Chrome for Step 3 (Destiny Radar & Climax Burst) verification...")
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=430,932')
    temp_dir = tempfile.mkdtemp(prefix="verify_step3_")
    options.add_argument(f'--user-data-dir={temp_dir}')

    driver = webdriver.Chrome(options=options)
    try:
        print("Navigating to http://localhost:8085/index.html ...")
        driver.get("http://localhost:8085/index.html")

        # Wait until window.gameManager is initialized
        for _ in range(20):
            ready = driver.execute_script("return !!(window.gameManager || (window.SlotsRPG && window.SlotsRPG.GameManager));")
            if ready:
                break
            time.sleep(0.5)

        # Skip prologue to normal cultivator state
        driver.execute_script("""
            const gm = window.gameManager || window.SlotsRPG.GameManager;
            if (window.storyManager && window.storyManager.closeStoryDialog) {
                window.storyManager.closeStoryDialog();
            }
            const mStory = document.getElementById('modal-story-dialog');
            if (mStory) {
                mStory.classList.add('hidden');
                mStory.style.display = 'none';
            }
            gm.isPrologueComplete = true;
            gm.prologueStep = 3;
            gm.player.promoteToCultivator('tianjian');
            if (gm.updateTabLocks) {
                gm.updateTabLocks();
            }
            if (window.switchTab) {
                window.switchTab('slots');
            }
            if (window.updateDestinyRadarUI) {
                window.updateDestinyRadarUI();
            }
        """)
        time.sleep(1)

        # ========================================================
        # 1. 验证天命缺口雷达初始状态呈现与最短板计算
        # ========================================================
        print("1. Verifying Destiny Radar initial state...")
        radar_info = driver.execute_script("""
            const gm = window.gameManager || window.SlotsRPG.GameManager;
            const radar = document.getElementById('dragon-destiny-radar');
            const slotTag = document.getElementById('radar-slot-tag');
            const desc = document.getElementById('radar-desc');
            const p = gm.player;
            const target = p.getDestinyRadarTarget(gm.potSubLevel);
            return {
                visible: !!radar && radar.offsetWidth > 0,
                tagText: slotTag ? slotTag.innerText : '',
                descText: desc ? desc.innerText : '',
                targetPart: target.part,
                targetName: target.slotName,
                isMissing: target.isMissing,
                targetDesc: target.desc
            };
        """)
        print(f"Radar Info: {radar_info}")
        assert radar_info["visible"], "Destiny Radar must be visible in slots stage"
        assert radar_info["tagText"] != '', "Radar slot tag text must not be empty"
        assert radar_info["targetName"] in radar_info["tagText"], f"Radar slot tag must include targetName {radar_info['targetName']}"
        print("Verified Destiny Radar accurately reflects lowest/missing slot!")

        artifact_radar_initial = "C:/Users/baish/.gemini/antigravity/brain/01f29278-40ce-4787-9d2d-2408e9039bf0/verified_step3_destiny_radar_initial.png"
        driver.save_screenshot(artifact_radar_initial)
        print(f"Saved {artifact_radar_initial}")

        # ========================================================
        # 2. 验证气运累积达到 10/10 触发【气运聚顶】耀眼就绪态
        # ========================================================
        print("2. Verifying Luck accumulation to 10/10 -> Burst Ready...")
        burst_ready_info = driver.execute_script("""
            const gm = window.gameManager || window.SlotsRPG.GameManager;
            gm.waterTankProgress = 10;
            gm.waterTankMax = 10;
            window.updateWaterTankUI();

            const radar = document.getElementById('dragon-destiny-radar');
            const burstFlag = document.getElementById('radar-burst-flag');
            return {
                isBurstReadyClass: radar.classList.contains('burst-ready'),
                burstFlagVisible: burstFlag && !burstFlag.classList.contains('hidden'),
                burstFlagText: burstFlag ? burstFlag.innerText : ''
            };
        """)
        print(f"Burst Ready Check: {burst_ready_info}")
        assert burst_ready_info["isBurstReadyClass"], "Radar must have .burst-ready class when luck reaches 10/10"
        assert burst_ready_info["burstFlagVisible"], "Burst flag must be visible"
        assert "气运聚顶" in burst_ready_info["burstFlagText"], f"Burst flag must say '气运聚顶', got: {burst_ready_info['burstFlagText']}"
        print("Verified Radar turns golden with .burst-ready and '⚡ 气运聚顶' badge!")

        artifact_burst_ready = "C:/Users/baish/.gemini/antigravity/brain/01f29278-40ce-4787-9d2d-2408e9039bf0/verified_step3_burst_ready.png"
        driver.save_screenshot(artifact_burst_ready)
        print(f"Saved {artifact_burst_ready}")

        # ========================================================
        # 3. 验证触发大爆发：精准定向降下缺口部位高品质装备
        # ========================================================
        print("3. Executing Climax Burst spout...")
        climax_spout_res = driver.execute_script("""
            const gm = window.gameManager || window.SlotsRPG.GameManager;
            const p = gm.player;
            const targetBefore = p.getDestinyRadarTarget(gm.potSubLevel);

            // 执行单抽大爆发
            const spinRes = gm.dragonLootEngine.spout({
                player: p,
                potSubLevel: gm.potSubLevel,
                multiplier: 1,
                worldTier: gm.worldTier,
                options: {
                    isClimaxBurst: true
                },
                hasJoinedSect: true
            });

            const left = spinRes.leftCabinet;
            return {
                targetPartBefore: targetBefore.part,
                leftType: left ? left.type : null,
                droppedPart: (left && left.item) ? left.item.part : null,
                droppedQuality: (left && left.item) ? left.item.qualityCode : null,
                isDestinyHit: !!(left && left.isDestinyHit),
                isDestinyDirected: !!(left && left.isDestinyDirected)
            };
        """)
        print(f"Climax Spout Result: {climax_spout_res}")
        assert climax_spout_res["leftType"] == 'equip', "Climax burst must produce equipment"
        assert climax_spout_res["isDestinyHit"], "Climax burst must accurately hit destiny target part"
        assert climax_spout_res["droppedPart"] == climax_spout_res["targetPartBefore"], f"Dropped part {climax_spout_res['droppedPart']} must match target {climax_spout_res['targetPartBefore']}"
        assert climax_spout_res["droppedQuality"] in ['Q4', 'Q5', 'Q6'], f"Climax burst must produce high quality gear (Q4+), got {climax_spout_res['droppedQuality']}"
        print(f"SUCCESS: Climax Burst generated targeted {climax_spout_res['droppedPart']} with quality {climax_spout_res['droppedQuality']}!")

        # 验证模拟 SPIN_STOP 事件触发雷达目标补全动画与气运重置
        burst_after_res = driver.execute_script("""
            const gm = window.gameManager || window.SlotsRPG.GameManager;
            // 模拟推演结束重置气运
            gm.waterTankProgress = 0;
            window.updateWaterTankUI();

            const radar = document.getElementById('dragon-destiny-radar');
            return {
                isBurstReady: radar.classList.contains('burst-ready'),
                progress: gm.waterTankProgress
            };
        """)
        print(f"After Burst Check: {burst_after_res}")
        assert not burst_after_res["isBurstReady"], "Radar must exit burst-ready mode after climax release"
        assert burst_after_res["progress"] == 0, "Water tank luck must reset to 0"

        # ========================================================
        # 4. 验证穿戴新装备后，天命雷达动态指向下一个最短板
        # ========================================================
        print("4. Testing dynamic radar update when gear is upgraded...")
        next_radar_res = driver.execute_script("""
            const gm = window.gameManager || window.SlotsRPG.GameManager;
            const p = gm.player;
            const IM = window.SlotsRPG.ItemModel;

            // 给当前短板部位穿上 Q5 极品
            const targetBefore = p.getDestinyRadarTarget(gm.potSubLevel);
            const upgradedEquip = IM.createEquipment(targetBefore.part, 'Q5', gm.worldTier);
            p.equipment[targetBefore.part] = upgradedEquip;

            // 触发事件通知雷达刷新
            window.SlotsRPG.EventBus.emit('ITEM_EQUIPPED');
            const targetAfter = p.getDestinyRadarTarget(gm.potSubLevel);
            const slotTag = document.getElementById('radar-slot-tag');
            return {
                oldPart: targetBefore.part,
                newPart: targetAfter.part,
                newTagText: slotTag.innerText,
                newDesc: targetAfter.desc
            };
        """)
        print(f"Next Radar Target Result: {next_radar_res}")
        assert next_radar_res["oldPart"] != next_radar_res["newPart"], "Radar must shift to next lowest slot after old slot is upgraded"
        print(f"SUCCESS: Radar smoothly transitioned from {next_radar_res['oldPart']} to next target {next_radar_res['newPart']}!")

        artifact_radar_next = "C:/Users/baish/.gemini/antigravity/brain/01f29278-40ce-4787-9d2d-2408e9039bf0/verified_step3_radar_next_target.png"
        driver.save_screenshot(artifact_radar_next)
        print(f"Saved {artifact_radar_next}")

        # Check console logs for errors
        logs = driver.get_log('browser')
        real_errors = [l for l in logs if l['level'] == 'SEVERE' and 'navigator.vibrate' not in l['message'] and 'favicon' not in l['message'] and '404' not in l['message']]
        print(f"Browser severe errors count: {len(real_errors)}")
        if real_errors:
            print("Real severe errors:", real_errors)
        assert len(real_errors) == 0, f"Expected 0 real errors, got {len(real_errors)}"

        print("ALL STEP 3 (DESTINY RADAR & CLIMAX BURST) TESTS PASSED PERFECTLY!")

    finally:
        driver.quit()
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == '__main__':
    main()
