import os
import sys
import time
import subprocess
import threading
from http.server import SimpleHTTPRequestHandler, HTTPServer
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

ARTIFACT_DIR = r"C:\Users\baish\.gemini\antigravity\brain\01f29278-40ce-4787-9d2d-2408e9039bf0"
PORT = 8092

class SilentServer(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

def run_server():
    server = HTTPServer(('127.0.0.1', PORT), SilentServer)
    server.serve_forever()

def main():
    print(f"Starting HTTP server on port {PORT}...")
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    time.sleep(1)

    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=430,932")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")

    driver = webdriver.Chrome(options=chrome_options)
    try:
        url = f"http://127.0.0.1:{PORT}/index.html"
        print(f"Loading {url}...")
        driver.get(url)
        time.sleep(2)

        # 跳过序章剧情，确保直达神龙天机盘主界面
        driver.execute_script("""
            const skipBtn = document.getElementById('btn-story-skip');
            if (skipBtn) skipBtn.click();
            if (window.gameManager) {
                window.gameManager.isPrologueComplete = true;
                if (window.gameManager.player) {
                    window.gameManager.player.isMortal = false;
                    window.gameManager.player.currentSect = 'taiyi';
                }
                const modalStory = document.getElementById('modal-story');
                if (modalStory) modalStory.classList.add('hidden');
                const prologueGuide = document.getElementById('prologue-spin-guide');
                if (prologueGuide) prologueGuide.classList.add('hidden');
                if (typeof window.switchTab === 'function') window.switchTab('slots');
                window.gameManager.emitStateChange();
            }
        """)
        time.sleep(1)

        # 1. 验证神龙外观及切图图层
        halo = driver.find_element(By.CSS_SELECTOR, ".dragon-celestial-halo")
        veil = driver.find_element(By.CSS_SELECTOR, ".dragon-mist-veil")
        print("Dragon 3D layers verified:", halo is not None, veil is not None)

        # 2. 模拟多次抽奖，验证同类物品堆叠与品阶自动排序
        print("Simulating spouts with duplicate energy and pills...")
        script_test_spouts = """
        const dcm = window.gameManager.dragonCabinetManager;
        dcm.clear();
        
        // 第一次吐宝: 凡铁剑(Q1) + 天道灵石(+25)
        dcm.addItemFromSpout({
            type: 'equip',
            item: { id: 'eq1', name: '凡铁·玄铁剑', quality: 'Q1', power: 10, part: 'weapon' }
        });
        dcm.addItemFromSpout({
            type: 'energy',
            energyGain: 25
        });

        // 第二次吐宝: 天道灵石(+50) + 上品灵药(+150道行)
        dcm.addItemFromSpout({
            type: 'energy',
            energyGain: 50
        });
        dcm.addItemFromSpout({
            type: 'pill',
            subType: 'exp',
            expGain: 150
        });

        // 第三次吐宝: 天道灵石(+30) + 极品紫装(Q4)
        dcm.addItemFromSpout({
            type: 'energy',
            energyGain: 30
        });
        dcm.addItemFromSpout({
            type: 'equip',
            item: { id: 'eq2', name: '极品·青龙履', quality: 'Q4', power: 88, part: 'boots' }
        });

        // 第四次吐宝: 天道灵石(+40) + 修为丹再次掉落(+150道行)
        dcm.addItemFromSpout({
            type: 'energy',
            energyGain: 40
        });
        dcm.addItemFromSpout({
            type: 'pill',
            subType: 'exp',
            expGain: 150
        });

        return {
            totalSlots: dcm.slots.length,
            slots: dcm.slots.map(s => ({
                name: s.name,
                gainText: s.gainText,
                qualityRank: s.qualityRank,
                count: s.count,
                totalEnergy: s.totalEnergy,
                totalExp: s.totalExp
            }))
        };
        """
        loot_res = driver.execute_script(script_test_spouts)
        print("Loot stacking result:", loot_res)

        # 校验：天道灵石只占 1 个格子，且 count=4, totalEnergy=145
        energy_slots = [s for s in loot_res["slots"] if "天道灵石" in s["name"]]
        pill_slots = [s for s in loot_res["slots"] if "灵药" in s["name"] or "修为丹" in s["name"]]
        print(f"Energy slots count: {len(energy_slots)} (Expected: 1)")
        print(f"Pill slots count: {len(pill_slots)} (Expected: 1)")
        assert len(energy_slots) == 1, f"Expected 1 energy slot, got {len(energy_slots)}"
        assert len(pill_slots) == 1, f"Expected 1 pill slot, got {len(pill_slots)}"
        assert energy_slots[0]["count"] == 4, f"Expected 4 energy draws, got {energy_slots[0]['count']}"
        assert energy_slots[0]["totalEnergy"] == 145, f"Expected 145 total energy, got {energy_slots[0]['totalEnergy']}"
        
        # 排序检验：Q4(极品·青龙履) 应该排在 Q1(凡铁剑) 和 Q2(灵石) 前面
        assert loot_res["slots"][0]["name"] == "极品·青龙履", f"Expected Q4 first, got {loot_res['slots'][0]['name']}"

        time.sleep(1)
        screenshot1 = os.path.join(ARTIFACT_DIR, "verify_stacking_and_sorting.png")
        driver.save_screenshot(screenshot1)
        print(f"Saved stacking screenshot to {screenshot1}")

        # 3. 验证触发战斗时，下方挑战横幅变身为战斗横幅
        print("Triggering battle to verify challenge banner transformation...")
        script_trigger_battle = """
        window.gameManager.pendingBattleData = {
            monsterName: '荒村恶犬精',
            level: 1,
            scatterCount: 3,
            battleConfig: { tier: 'normal', count: 2, betMultiplier: 1 }
        };
        window.SlotsRPG.EventBus.emit('DRAGON_BATTLE_READY', {
            monsterName: '荒村恶犬精',
            battleData: window.gameManager.pendingBattleData,
            isAutoSpinning: false
        });
        
        const banner = document.getElementById('sect-trial-banner');
        const badge = document.getElementById('trial-stage-badge');
        const target = document.getElementById('trial-target-name');
        const btnText = document.getElementById('trial-btn-text');
        const oldPrompt = document.getElementById('dragon-battle-prompt');

        return {
            bannerVisible: !banner.classList.contains('hidden'),
            bannerMode: banner.classList.contains('battle-triggered-mode'),
            badgeText: badge ? badge.innerText : '',
            targetText: target ? target.innerText : '',
            btnText: btnText ? btnText.innerText : '',
            oldPromptHidden: oldPrompt ? (oldPrompt.classList.contains('hidden') || window.getComputedStyle(oldPrompt).display === 'none') : true
        };
        """
        battle_ui_res = driver.execute_script(script_trigger_battle)
        print("Battle banner transformation result:", battle_ui_res)

        assert battle_ui_res["bannerVisible"] is True, "Banner should be visible"
        assert battle_ui_res["bannerMode"] is True, "Banner should have .battle-triggered-mode"
        assert "妖兽突袭" in battle_ui_res["badgeText"], f"Badge should be 妖兽突袭, got {battle_ui_res['badgeText']}"
        assert "荒村恶犬精" in battle_ui_res["targetText"], f"Target should be 荒村恶犬精, got {battle_ui_res['targetText']}"
        assert "拔剑迎战" in battle_ui_res["btnText"], f"Button text should be 拔剑迎战, got {battle_ui_res['btnText']}"
        assert battle_ui_res["oldPromptHidden"] is True, "Duplicate battle prompt must be hidden"

        time.sleep(1)
        screenshot2 = os.path.join(ARTIFACT_DIR, "verify_battle_banner_transformed.png")
        driver.save_screenshot(screenshot2)
        print(f"Saved battle banner screenshot to {screenshot2}")

        # 4. 点击挑战横幅上的【拔剑迎战】，验证进入战斗
        print("Clicking battle button to verify encounter execution...")
        btn_battle = driver.find_element(By.ID, "btn-active-trial-challenge")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'}); arguments[0].click();", btn_battle)
        time.sleep(1.5)

        script_check_arena = """
        const arena = document.getElementById('modal-battle-arena');
        return {
            arenaVisible: arena ? !arena.classList.contains('hidden') : false,
            pendingCleared: window.gameManager.pendingBattleData === null
        };
        """
        arena_res = driver.execute_script(script_check_arena)
        print("Arena execution result:", arena_res)
        assert arena_res["arenaVisible"] is True, "Battle arena modal should be visible"
        assert arena_res["pendingCleared"] is True, "Pending battle data should be cleared upon execution"

        screenshot3 = os.path.join(ARTIFACT_DIR, "verify_battle_arena_active.png")
        driver.save_screenshot(screenshot3)
        print(f"Saved arena screenshot to {screenshot3}")

        print("=== ALL 4 VERIFICATION TESTS PASSED SUCCESSFULLY! ===")

    finally:
        driver.quit()

if __name__ == "__main__":
    main()
