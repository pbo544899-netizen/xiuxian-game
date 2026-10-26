import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

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
        # SETUP: Set game to prologueStep=3, prologueSpins=1, weapon in bag
        # ----------------------------------------------------
        print("Setting up state: prologueStep=3, prologueSpins=1 (First Dragon Spout completed)...")
        driver.execute_script("""
            if (window.storyManager) window.storyManager.closeStoryDialog(true);
            const modalStory = document.getElementById('modal-story-dialog');
            if (modalStory) modalStory.classList.add('hidden');

            const gm = window.SlotsRPG.GameManager;
            gm.isPrologueComplete = false;
            gm.prologueStep = 3;
            gm.prologueSpins = 1;
            gm.hasCompletedFirstDragonSpoutFTUE = true;
            gm.hasCompletedEquipFTUE = false;
            gm.hasCompletedSlotsReturnFTUE = false;

            // Ensure player has mortal weapon
            gm.player.equipment.weapon = {
                id: 'MORTAL_WEAPON',
                name: '锈蚀柴刀',
                part: 'weapon',
                quality: 'Q1',
                power: 10,
                stats: { atk: 5 }
            };

            // Put a new divine weapon in slot 0
            gm.inventory.slots[0] = {
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
                isNew: true
            };

            window.switchTab('character');
            gm.emitStateChange();
            window.SlotsRPG.SpotlightGuide.checkAndTriggerFTUE(true);
        """)
        time.sleep(0.5)

        # 1. Verify Quick Equip guide is shown
        step1 = driver.execute_script("return window.SlotsRPG.SpotlightGuide.currentStepId;")
        print(f"Step 1: Current FTUE step: {step1} (Expected: ftue-quick-equip)")
        assert step1 == 'ftue-quick-equip', f"Expected ftue-quick-equip, got {step1}"

        # 2. Click Quick Equip
        print("\nClicking Quick Equip button...")
        btn_quick_equip = driver.find_element(By.ID, "btn-quick-equip")
        driver.execute_script("arguments[0].click();", btn_quick_equip)
        time.sleep(0.6)

        # 3. Verify Combat Power Breakthrough modal is presented!
        modal_visible = driver.execute_script("""
            const m = document.getElementById('modal-power-gain');
            return m && !m.classList.contains('hidden');
        """)
        power_old = driver.execute_script("return document.getElementById('power-gain-old').innerText;")
        power_diff = driver.execute_script("return document.getElementById('power-gain-diff').innerText;")
        item_name = driver.execute_script("return document.getElementById('power-gain-item-name').innerText;")

        print(f"Combat power modal visible? {modal_visible} (Expected: True)")
        print(f"Modal displays: Weapon={item_name}, OldPower={power_old}, Diff={power_diff}")
        assert modal_visible, "Error: modal-power-gain is not displayed! Combat power process missing!"
        assert "140" in power_diff or "+" in power_diff, f"Expected power gain diff, got {power_diff}"

        # 4. Verify Spotlight guide guides the player to confirm the power increase (NOT jumping to tab-slots!)
        current_step_modal = driver.execute_script("return window.SlotsRPG.SpotlightGuide.currentStepId;")
        print(f"Current spotlight step on modal: {current_step_modal} (Expected: ftue-power-gain-confirm)")
        assert current_step_modal == 'ftue-power-gain-confirm', \
            f"Error: Did not guide to confirm power gain, prematurely got {current_step_modal}!"

        # Take screenshot of the Combat Power Breakthrough Showcase
        driver.save_screenshot("scratch/verified_power_gain_modal.png")
        driver.save_screenshot("C:/Users/baish/.gemini/antigravity/brain/01f29278-40ce-4787-9d2d-2408e9039bf0/verified_power_gain_modal.png")
        print("[PASS] Combat power increase process is clearly presented in full glory!")

        # 5. Click the confirm button ("实力大增 · 知悉")
        print("\nClicking confirm button (实力大增 · 知悉)...")
        btn_confirm = driver.find_element(By.ID, "btn-power-gain-confirm")
        start_dismiss = time.time()
        driver.execute_script("arguments[0].click();", btn_confirm)
        time.sleep(0.3)

        # Verify modal is hidden
        modal_hidden_after = driver.execute_script("""
            const m = document.getElementById('modal-power-gain');
            return m && m.classList.contains('hidden');
        """)
        print(f"Modal hidden after confirm? {modal_hidden_after} (Expected: True)")
        assert modal_hidden_after, "Error: modal-power-gain not hidden after confirm click"

        # Check at 400ms: spotlight should still be in cooldown (not rushing the player)
        time.sleep(0.4)
        active_400ms = driver.execute_script("return window.SlotsRPG.SpotlightGuide.isActive();")
        print(f"At t = 700ms after confirm: is spotlight active? {active_400ms} (Expected: False - comfortable pause)")
        assert not active_400ms, "Error: Next guide popped up too soon after power gain confirm!"

        # Wait until t = 1.4s: next guide (ftue-nav-slots-continue) appears
        time.sleep(0.9)
        elapsed = time.time() - start_dismiss
        next_step = driver.execute_script("return window.SlotsRPG.SpotlightGuide.currentStepId;")
        is_active = driver.execute_script("return window.SlotsRPG.SpotlightGuide.isActive();")
        print(f"At t = {elapsed:.2f}s: is spotlight active? {is_active}, step: {next_step}")
        assert is_active and next_step == 'ftue-nav-slots-continue', \
            f"Expected ftue-nav-slots-continue after power gain modal, got {next_step}"
        print("[PASS] Guide smoothly transitioned to: '神兵已佩！点击前往神龙继续推演'!")

        # 6. Click tab-slots to complete
        tab_slots = driver.find_element(By.ID, "tab-slots")
        driver.execute_script("arguments[0].click();", tab_slots)
        time.sleep(0.5)

        flag_done = driver.execute_script("return window.SlotsRPG.GameManager.hasCompletedSlotsReturnFTUE;")
        assert flag_done is True, "Expected hasCompletedSlotsReturnFTUE to be True"
        print("[PASS] Full flow completed successfully!")

    finally:
        driver.quit()

if __name__ == '__main__':
    run_test()
