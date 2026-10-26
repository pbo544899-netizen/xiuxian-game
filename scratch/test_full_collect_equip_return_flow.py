import time
import sys
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def run_test():
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=430,932')

    driver = webdriver.Chrome(options=chrome_options)
    try:
        url = 'http://localhost:8085/index.html'
        print(f"Navigating to {url}...")
        driver.get(url)
        time.sleep(1.5)

        # ----------------------------------------------------
        # SETUP: Set game to prologueStep=3, prologueSpins=1, loot in dragonCabinetManager
        # ----------------------------------------------------
        print("Setting up state: prologueStep=3, prologueSpins=1, weapon in showcase (dragonCabinetManager)...")
        driver.execute_script("""
            if (window.storyManager) window.storyManager.closeStoryDialog(true);
            const modalStory = document.getElementById('modal-story-dialog');
            if (modalStory) modalStory.classList.add('hidden');

            const gm = window.SlotsRPG.GameManager;
            gm.isPrologueComplete = false;
            gm.prologueStep = 3;
            gm.prologueSpins = 1;
            gm.hasCompletedFirstDragonSpoutFTUE = true;
            gm.hasCompletedCollectFTUE = false;
            gm.hasCompletedEquipFTUE = false;
            gm.hasCompletedSlotsReturnFTUE = false;

            // Player starts with mortal weapon
            gm.player.equipment.weapon = {
                id: 'MORTAL_WEAPON',
                name: '锈蚀柴刀',
                part: 'weapon',
                quality: 'Q1',
                power: 10,
                stats: { atk: 5 }
            };

            // Put divine weapon in dragon showcase via addItemFromSpout
            gm.dragonCabinetManager.clear();
            const godWeapon = {
                id: 'WEAPON_TEST_GOD',
                name: '【宝器 · 玄铁剑】',
                type: 'equip',
                part: 'weapon',
                quality: 'Q3',
                qualityCode: 'Q3',
                qualityColor: '#a855f7',
                qualityName: '宝器',
                power: 150,
                stats: { atk: 40, def: 10, hp: 50 },
                icon: 'assets/symbols/SYM_03.png',
                count: 1
            };
            gm.dragonCabinetManager.addItemFromSpout({
                type: 'equip',
                item: godWeapon
            });

            window.switchTab('slots');
            window.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE(true);
        """)
        time.sleep(0.5)

        # ----------------------------------------------------
        # Step 1: Verify Guide points to "一键收纳" (btn-collect-all-slots)
        # ----------------------------------------------------
        step1 = driver.execute_script("return window.SlotsRPG.SpotlightGuide.currentStepId;")
        step1_text = driver.execute_script("return document.getElementById('spotlight-guide-text').innerText;")
        print(f"\nStep 1: Current step: {step1}, text: '{step1_text}'")
        assert step1 == 'ftue-collect-all-slots', f"Expected ftue-collect-all-slots, got {step1}"
        assert "一键收纳" in step1_text, f"Expected 一键收纳 in text, got {step1_text}"
        print("[PASS] Step 1: Correctly guides player to click '一键收纳'!")

        # ----------------------------------------------------
        # Step 2: Click "一键收纳"
        # ----------------------------------------------------
        print("\nClicking '一键收纳' button...")
        btn_collect = driver.find_element(By.ID, "btn-collect-all-slots")
        driver.execute_script("arguments[0].click();", btn_collect)
        time.sleep(0.8)

        # Verify showcase is cleared and weapon moved to inventory
        has_in_bag = driver.execute_script("""
            const gm = window.SlotsRPG.GameManager;
            const slotsEmpty = gm.dragonCabinetManager.slots.length === 0;
            const inBag = gm.inventory.slots.some(s => s && s.id === 'WEAPON_TEST_GOD');
            return slotsEmpty && inBag && gm.hasCompletedCollectFTUE;
        """)
        print(f"Showcase cleared, weapon in bag, hasCompletedCollectFTUE=True? {has_in_bag}")
        assert has_in_bag, "Error: Item not moved to bag or collect FTUE not flagged"

        # ----------------------------------------------------
        # Step 3: Verify Guide points to "角色修真" (tab-character)
        # ----------------------------------------------------
        time.sleep(0.5)
        step2 = driver.execute_script("return window.SlotsRPG.SpotlightGuide.currentStepId;")
        step2_text = driver.execute_script("return document.getElementById('spotlight-guide-text').innerText;")
        print(f"\nStep 2: Current step: {step2}, text: '{step2_text}'")
        assert step2 == 'ftue-nav-char-equip', f"Expected ftue-nav-char-equip, got {step2}"
        assert "角色修真" in step2_text, f"Expected 角色修真 in text, got {step2_text}"
        print("[PASS] Step 2: Correctly guides player to click '角色修真'!")

        # ----------------------------------------------------
        # Step 4: Click "角色修真" and verify Reaction Time buffer
        # ----------------------------------------------------
        print("\nClicking '角色修真' tab...")
        tab_char = driver.find_element(By.ID, "tab-character")
        driver.execute_script("arguments[0].click();", tab_char)

        # Check at 200ms: spotlight should be paused / giving reaction time
        time.sleep(0.2)
        active_early = driver.execute_script("return window.SlotsRPG.SpotlightGuide.isActive();")
        print(f"At t = 200ms after entering character tab: is spotlight active? {active_early} (Expected: False - comfortable pause)")
        assert not active_early, "Error: Spotlight guide rushed player without reaction time!"

        # Wait until t = 1.2s: now spotlight should point to "一键装备"
        time.sleep(1.0)
        step3 = driver.execute_script("return window.SlotsRPG.SpotlightGuide.currentStepId;")
        step3_text = driver.execute_script("return document.getElementById('spotlight-guide-text').innerText;")
        print(f"At t = 1.2s: step: {step3}, text: '{step3_text}'")
        assert step3 == 'ftue-quick-equip', f"Expected ftue-quick-equip, got {step3}"
        assert "一键装备" in step3_text, f"Expected 一键装备 in text, got {step3_text}"
        print("[PASS] Step 3: After reaction time, smoothly guides to '一键装备'!")

        # ----------------------------------------------------
        # Step 5: Click "一键装备", verify normal modal presentation WITHOUT beginner guide
        # ----------------------------------------------------
        print("\nClicking '一键装备' button...")
        btn_quick_equip = driver.find_element(By.ID, "btn-quick-equip")
        driver.execute_script("arguments[0].click();", btn_quick_equip)
        time.sleep(0.4)

        # Modal must be visible
        modal_visible = driver.execute_script("""
            const m = document.getElementById('modal-power-gain');
            return m && !m.classList.contains('hidden');
        """)
        # BUT spotlight guide must be HIDDEN! (No finger / mask covering the celebration)
        spotlight_on_modal = driver.execute_script("return window.SlotsRPG.SpotlightGuide.isActive();")
        print(f"Power Gain modal visible? {modal_visible} (Expected: True)")
        print(f"Is beginner spotlight guide active on modal? {spotlight_on_modal} (Expected: False - regular game flow!)")
        assert modal_visible, "Error: modal-power-gain is not displayed!"
        assert not spotlight_on_modal, "Error: Spotlight guide should NOT cover the power gain celebration modal!"
        print("[PASS] Step 4: Normal game celebration displayed without beginner guide disturbance!")

        # ----------------------------------------------------
        # Step 6: Close modal and verify smooth transition to "神龙吐宝"
        # ----------------------------------------------------
        print("\nClosing power gain modal...")
        btn_confirm = driver.find_element(By.ID, "btn-power-gain-confirm")
        driver.execute_script("arguments[0].click();", btn_confirm)

        # Wait 900ms buffer after modal close
        time.sleep(1.35)
        step4 = driver.execute_script("return window.SlotsRPG.SpotlightGuide.currentStepId;")
        step4_text = driver.execute_script("return document.getElementById('spotlight-guide-text').innerText;")
        print(f"After power gain modal closed: step: {step4}, text: '{step4_text}'")
        assert step4 == 'ftue-nav-slots-continue', f"Expected ftue-nav-slots-continue, got {step4}"
        assert "神龙吐宝" in step4_text, f"Expected 神龙吐宝 in text, got {step4_text}"
        print("[PASS] Step 5: Smoothly transitioned to guide player to click '神龙吐宝'!")

        # ----------------------------------------------------
        # Step 7: Click "神龙吐宝" to complete
        # ----------------------------------------------------
        tab_slots = driver.find_element(By.ID, "tab-slots")
        driver.execute_script("arguments[0].click();", tab_slots)
        time.sleep(0.5)

        done = driver.execute_script("return window.SlotsRPG.GameManager.hasCompletedSlotsReturnFTUE;")
        print(f"Flow fully completed? {done} (Expected: True)")
        assert done is True

        print("\n=======================================================")
        print("[ALL PASS] The complete FTUE sequence functions flawlessly!")
        print("=======================================================")

    finally:
        driver.quit()

if __name__ == '__main__':
    run_test()
