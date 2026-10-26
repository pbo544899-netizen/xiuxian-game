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
    print("Launching Chrome for Storage Full Interception verification...")
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=430,932')
    temp_dir = tempfile.mkdtemp(prefix="verify_storage_full_")
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
        """)
        time.sleep(1)

        # ========================================================
        # 1. 验证仅背包满但展架未满时：不触发双满阻断
        # ========================================================
        print("1. Filling only main backpack (24/24), keeping showcase empty (0/12)...")
        partial_fill_res = driver.execute_script("""
            const gm = window.gameManager || window.SlotsRPG.GameManager;
            const inv = gm.inventory;
            const cm = gm.dragonCabinetManager;
            const IM = window.SlotsRPG.ItemModel;

            cm.clear();

            // 填满背包 24 格
            for (let i = 0; i < inv.capacity; i++) {
                inv.slots[i] = IM.createEquipment('armor', 'Q1', 1);
            }

            return {
                bagFreeSlots: inv.getFreeSlotsCount(),
                cabinetCount: cm.slots.length,
                isAllStorageFull: gm.isAllStorageFull()
            };
        """)
        print(f"Partial Fill Result: {partial_fill_res}")
        assert partial_fill_res["bagFreeSlots"] == 0, "Backpack must be full"
        assert partial_fill_res["cabinetCount"] == 0, "Showcase must be empty"
        assert not partial_fill_res["isAllStorageFull"], "isAllStorageFull must be false when showcase has space"
        print("Verified: Only backpack full does NOT trigger storage full lock!")

        # ========================================================
        # 2. 模拟背包(24/24)与展架(12/12)双满状态
        # ========================================================
        print("2. Filling both backpack (24/24) AND showcase (12/12)...")
        full_storage_res = driver.execute_script("""
            const gm = window.gameManager || window.SlotsRPG.GameManager;
            const inv = gm.inventory;
            const cm = gm.dragonCabinetManager;
            const IM = window.SlotsRPG.ItemModel;

            // 填满展架 12 格
            cm.slots = [];
            for (let i = 0; i < cm.maxSlots; i++) {
                const eq = IM.createEquipment('armor', 'Q1', 1);
                cm.slots.push({
                    type: 'equip',
                    item: eq,
                    name: eq.name,
                    icon: eq.icon,
                    qualityRank: 1,
                    dropTimestamp: i
                });
            }
            cm.renderSlots();

            return {
                bagFreeSlots: inv.getFreeSlotsCount(),
                cabinetCount: cm.slots.length,
                isAllStorageFull: gm.isAllStorageFull()
            };
        """)
        print(f"Full Storage Result: {full_storage_res}")
        assert full_storage_res["bagFreeSlots"] == 0, "Backpack must be 24/24"
        assert full_storage_res["cabinetCount"] == 12, "Cabinet must be 12/12"
        assert full_storage_res["isAllStorageFull"], "isAllStorageFull must be TRUE when both are full"

        # ========================================================
        # 3. 验证抽奖拦截：点击推演被拦截并弹出报警弹窗
        # ========================================================
        print("3. Testing Spin Interception when both storages are full...")
        driver.execute_script("""
            const btnAuto = document.getElementById('btn-auto');
            btnAuto.click();
        """)
        time.sleep(0.5)

        modal_spin_info = driver.execute_script("""
            const modal = document.getElementById('modal-overflow-alert');
            const desc = document.getElementById('overflow-alert-desc');
            return {
                visible: modal && !modal.classList.contains('hidden'),
                descText: desc ? desc.innerText : ''
            };
        """)
        print(f"Modal Spin Alert Info: {modal_spin_info}")
        assert modal_spin_info["visible"], "Modal overflow alert must be displayed when attempting to spin"
        assert "乾坤袋" in modal_spin_info["descText"], "Modal text must explain storage is full"
        print("Verified Spin action is effectively intercepted!")

        artifact_spin_alert = "C:/Users/baish/.gemini/antigravity/brain/01f29278-40ce-4787-9d2d-2408e9039bf0/verified_storage_full_spin_alert.png"
        driver.save_screenshot(artifact_spin_alert)
        print(f"Saved {artifact_spin_alert}")

        # 关闭弹窗
        driver.execute_script("""
            const btnCloseX = document.getElementById('btn-close-overflow-x');
            if (btnCloseX) btnCloseX.click();
        """)
        time.sleep(0.3)

        # ========================================================
        # 4. 验证战斗挑战拦截：点击拔剑斩妖被拦截并弹出报警弹窗
        # ========================================================
        print("4. Testing Battle Challenge Interception when both storages are full...")
        driver.execute_script("""
            const btnChallenge = document.getElementById('btn-active-trial-challenge');
            if (btnChallenge) btnChallenge.click();
        """)
        time.sleep(0.5)

        modal_battle_info = driver.execute_script("""
            const modal = document.getElementById('modal-overflow-alert');
            const desc = document.getElementById('overflow-alert-desc');
            const arenaModal = document.getElementById('modal-battle-arena');
            return {
                visible: modal && !modal.classList.contains('hidden'),
                descText: desc ? desc.innerText : '',
                arenaHidden: !arenaModal || arenaModal.classList.contains('hidden')
            };
        """)
        print(f"Modal Battle Alert Info: {modal_battle_info}")
        assert modal_battle_info["visible"], "Modal overflow alert must be displayed when attempting battle"
        assert modal_battle_info["arenaHidden"], "Battle arena must NOT open when storage is full"
        assert "战利品" in modal_battle_info["descText"] or "斩妖" in modal_battle_info["descText"], "Modal text must specifically mention monster/battle rewards"
        print("Verified Battle Challenge is effectively intercepted!")

        artifact_battle_alert = "C:/Users/baish/.gemini/antigravity/brain/01f29278-40ce-4787-9d2d-2408e9039bf0/verified_storage_full_battle_alert.png"
        driver.save_screenshot(artifact_battle_alert)
        print(f"Saved {artifact_battle_alert}")

        # ========================================================
        # 5. 验证弹窗内点击【一键分解低阶】解决爆仓
        # ========================================================
        print("5. Clicking 一键分解低阶 inside alert modal...")
        driver.execute_script("""
            const btnSalvage = document.getElementById('btn-overflow-salvage');
            if (btnSalvage) btnSalvage.click();
        """)
        time.sleep(0.5)

        cleanup_res = driver.execute_script("""
            const gm = window.gameManager || window.SlotsRPG.GameManager;
            const inv = gm.inventory;
            const cm = gm.dragonCabinetManager;
            const modal = document.getElementById('modal-overflow-alert');
            return {
                modalHidden: modal.classList.contains('hidden'),
                bagFreeSlots: inv.getFreeSlotsCount(),
                isAllStorageFull: gm.isAllStorageFull()
            };
        """)
        print(f"Cleanup Result: {cleanup_res}")
        assert cleanup_res["modalHidden"], "Modal must close after salvaging"
        assert cleanup_res["bagFreeSlots"] > 0, "Backpack must have freed up spaces"
        assert not cleanup_res["isAllStorageFull"], "Storage must no longer be full"
        print("Verified: Salvaging low tier gear successfully clears storage and resumes gameplay!")

        # Check console logs for errors
        logs = driver.get_log('browser')
        real_errors = [l for l in logs if l['level'] == 'SEVERE' and 'navigator.vibrate' not in l['message'] and 'favicon' not in l['message'] and '404' not in l['message']]
        print(f"Browser severe errors count: {len(real_errors)}")
        if real_errors:
            print("Real severe errors:", real_errors)
        assert len(real_errors) == 0, f"Expected 0 real errors, got {len(real_errors)}"

        print("ALL STORAGE FULL INTERCEPTION TESTS PASSED PERFECTLY!")

    finally:
        driver.quit()
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == '__main__':
    main()
