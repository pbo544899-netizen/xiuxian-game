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
    print("Launching Chrome via Selenium for Step 2 verification...")
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=430,932')
    temp_dir = tempfile.mkdtemp(prefix="verify_step2_")
    options.add_argument(f'--user-data-dir={temp_dir}')

    driver = webdriver.Chrome(options=options)
    try:
        print("Navigating to http://localhost:8085/index.html ...")
        driver.get("http://localhost:8085/index.html")
        time.sleep(2)

        # Unlock slots tab and close story dialog
        driver.execute_script("""
            if (window.storyManager && window.storyManager.closeStoryDialog) {
                window.storyManager.closeStoryDialog();
            }
            const mStory = document.getElementById('modal-story-dialog');
            if (mStory) {
                mStory.classList.add('hidden');
                mStory.style.display = 'none';
            }
            window.gameManager.isPrologueComplete = true;
            window.gameManager.prologueStep = 3;
            if (window.gameManager.updateTabLocks) {
                window.gameManager.updateTabLocks();
            }
            if (window.switchTab) {
                window.switchTab('slots');
            }
        """)
        time.sleep(1)

        # ========================================================
        # 1. 验证未达成【全身全紫】时的锁定状态
        # ========================================================
        print("Verifying initial locked state (not full purple)...")
        initial_check = driver.execute_script("""
            const gm = window.gameManager;
            const fullSet = gm.player.checkFullSetEquipped('Q4');
            const btn = document.getElementById('btn-open-filter-settings');
            return {
                isGraduated: fullSet.isGraduated,
                purpleCount: fullSet.purpleCount,
                hasUnlockedAutoSmelt: !!gm.hasUnlockedAutoSmelt,
                btnIsLocked: btn.classList.contains('locked'),
                btnText: btn.innerText.trim()
            };
        """)
        print(f"Initial check: {initial_check}")
        assert not initial_check["isGraduated"], "Initial state must not be graduated"
        assert not initial_check["hasUnlockedAutoSmelt"], "hasUnlockedAutoSmelt must be false initially"
        assert initial_check["btnIsLocked"], "Button must have 'locked' class"
        assert "熔炉" in initial_check["btnText"], f"Button text must show furnace lock state, got: {initial_check['btnText']}"

        # 点击带锁按钮应被拦截，不弹出设置面板
        driver.execute_script("""
            const btn = document.getElementById('btn-open-filter-settings');
            btn.click();
        """)
        time.sleep(0.3)
        modal_hidden_check = driver.execute_script("""
            const modal = document.getElementById('modal-filter-settings');
            return modal.classList.contains('hidden');
        """)
        assert modal_hidden_check, "Settings modal must remain hidden when locked"
        print("Verified button click is intercepted when locked!")

        artifact_locked = "C:/Users/baish/.gemini/antigravity/brain/01f29278-40ce-4787-9d2d-2408e9039bf0/verified_step2_locked_state.png"
        driver.save_screenshot(artifact_locked)
        print(f"Saved {artifact_locked}")

        # 未解锁时抽取低阶装备，必须正常保留在12格展架，绝不被误熔！
        print("Testing drop when locked (must NOT auto-smelt)...")
        unlocked_drop_res = driver.execute_script("""
            const cm = window.gameManager.dragonCabinetManager;
            cm.clear();
            const lowEquip = window.SlotsRPG.ItemModel.createEquipment('armor', 'Q1', 1);
            const insertedIdx = cm.addItemFromSpout({
                type: 'equip',
                item: lowEquip
            });
            return {
                insertedIdx: insertedIdx,
                slot0Name: cm.slots[0] ? cm.slots[0].name : null
            };
        """)
        print(f"Locked drop result: {unlocked_drop_res}")
        assert unlocked_drop_res["insertedIdx"] >= 0, "Low tier item must enter showcase when locked"
        assert unlocked_drop_res["slot0Name"] is not None, "Showcase slot 0 must contain the item"

        # ========================================================
        # 2. 模拟达成【全身全紫 Q4+】触发觉醒仪式
        # ========================================================
        print("Simulating equipping full Q4 purple set...")
        equip_res = driver.execute_script("""
            const p = window.gameManager.player;
            const IM = window.SlotsRPG.ItemModel;
            const slots = ['weapon', 'armor', 'ring', 'hat', 'boots', 'belt'];
            slots.forEach(s => {
                const q4Equip = IM.createEquipment(s, 'Q4', 1);
                p.equipment[s] = q4Equip;
            });

            // 触发觉醒检定
            const unlocked = window.gameManager.checkAutoSmeltUnlock();
            const modal = document.getElementById('modal-smelt-awakened');
            return {
                unlocked: unlocked,
                hasUnlockedAutoSmelt: window.gameManager.hasUnlockedAutoSmelt,
                modalVisible: modal && !modal.classList.contains('hidden')
            };
        """)
        print(f"Awakening trigger result: {equip_res}")
        assert equip_res["unlocked"], "checkAutoSmeltUnlock must return true for full Q4 set"
        assert equip_res["hasUnlockedAutoSmelt"], "hasUnlockedAutoSmelt must become true"
        assert equip_res["modalVisible"], "Awakening modal must be shown"

        artifact_awakened = "C:/Users/baish/.gemini/antigravity/brain/01f29278-40ce-4787-9d2d-2408e9039bf0/verified_step2_awakened_modal.png"
        driver.save_screenshot(artifact_awakened)
        print(f"Saved {artifact_awakened}")

        # 点击领悟关闭觉醒弹窗
        driver.execute_script("""
            const btn = document.getElementById('btn-confirm-smelt-awakened');
            if (btn) btn.click();
        """)
        time.sleep(0.4)

        # ========================================================
        # 3. 验证解锁后按钮变为【🔥 智能熔炉】金焰态
        # ========================================================
        print("Verifying unlocked button state...")
        unlocked_btn_check = driver.execute_script("""
            const btn = document.getElementById('btn-open-filter-settings');
            return {
                isUnlocked: btn.classList.contains('unlocked'),
                btnText: btn.innerText.trim()
            };
        """)
        print(f"Unlocked button check: {unlocked_btn_check}")
        assert unlocked_btn_check["isUnlocked"], "Button must have 'unlocked' class"
        assert "智能熔炉" in unlocked_btn_check["btnText"], f"Button text must be '智能熔炉', got: {unlocked_btn_check['btnText']}"

        artifact_unlocked_btn = "C:/Users/baish/.gemini/antigravity/brain/01f29278-40ce-4787-9d2d-2408e9039bf0/verified_step2_unlocked_btn.png"
        driver.save_screenshot(artifact_unlocked_btn)
        print(f"Saved {artifact_unlocked_btn}")

        # ========================================================
        # 4. 验证核心【以抽养抽】即时熔炼与灵机返还
        # ========================================================
        print("Testing instant auto-smelting & Lingji refund...")
        smelt_action_res = driver.execute_script("""
            const gm = window.gameManager;
            const cm = gm.dragonCabinetManager;
            cm.clear();
            const initialEnergy = gm.energy;

            // 抽中一件 Q3 宝器（非战力提升物）
            const q3Equip = window.SlotsRPG.ItemModel.createEquipment('armor', 'Q3', 1);
            const insertedIdx = cm.addItemFromSpout({
                type: 'equip',
                item: q3Equip
            });

            const finalEnergy = gm.energy;
            const energyDiff = finalEnergy - initialEnergy;
            const slotCount = cm.slots.length;

            return {
                insertedIdx: insertedIdx,
                initialEnergy: initialEnergy,
                finalEnergy: finalEnergy,
                energyDiff: energyDiff,
                slotCount: slotCount
            };
        """)
        print(f"Auto-smelt action result: {smelt_action_res}")
        assert smelt_action_res["insertedIdx"] == -1, "Auto-smelted item must return -1 (not occupying a showcase slot)"
        assert smelt_action_res["slotCount"] == 0, "Showcase slots must remain empty (not cluttered by smelted item)"
        assert smelt_action_res["energyDiff"] >= 25, f"Q3 smelt should refund >= 25 Lingji, got: {smelt_action_res['energyDiff']}"
        print(f"SUCCESS: Auto-smelt refunded +{smelt_action_res['energyDiff']} Lingji directly!")

        # 验证若是极品高战力装备（Q5），绝不熔炼，必须正常展示供宿主替换
        print("Testing Q5 drop when unlocked (must NOT be auto-smelted)...")
        q5_drop_res = driver.execute_script("""
            const gm = window.gameManager;
            const cm = gm.dragonCabinetManager;
            const q5Equip = window.SlotsRPG.ItemModel.createEquipment('weapon', 'Q5', 1);
            const insertedIdx = cm.addItemFromSpout({
                type: 'equip',
                item: q5Equip
            });
            return {
                insertedIdx: insertedIdx,
                slot0Name: cm.slots[0] ? cm.slots[0].name : null
            };
        """)
        print(f"Q5 drop result: {q5_drop_res}")
        assert q5_drop_res["insertedIdx"] >= 0, "Q5 equipment must enter showcase slot"
        assert "道器" in q5_drop_res["slot0Name"], f"Slot 0 should contain Q5 道器, got: {q5_drop_res['slot0Name']}"

        artifact_action = "C:/Users/baish/.gemini/antigravity/brain/01f29278-40ce-4787-9d2d-2408e9039bf0/verified_step2_auto_smelt_action.png"
        driver.save_screenshot(artifact_action)
        print(f"Saved {artifact_action}")

        # Check console logs for errors
        logs = driver.get_log('browser')
        real_errors = [l for l in logs if l['level'] == 'SEVERE' and 'navigator.vibrate' not in l['message'] and 'favicon' not in l['message'] and '404' not in l['message']]
        print(f"Browser real severe errors count: {len(real_errors)}")
        if real_errors:
            print("Real severe errors:", real_errors)
        assert len(real_errors) == 0, f"Expected 0 real errors, got {len(real_errors)}"

        print("ALL STEP 2 VERIFICATIONS PASSED PERFECTLY!")

    finally:
        driver.quit()
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == '__main__':
    main()
