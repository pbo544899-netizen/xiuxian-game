import os
import sys
import time
import threading
from http.server import SimpleHTTPRequestHandler, HTTPServer
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

ARTIFACT_DIR = r"C:\Users\baish\.gemini\antigravity\brain\01f29278-40ce-4787-9d2d-2408e9039bf0"
PORT = 8093

class SilentServer(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

def run_server():
    server = HTTPServer(('127.0.0.1', PORT), SilentServer)
    server.serve_forever()

def main():
    print(f"Starting test server on port {PORT}...")
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

        # 模拟老玩家/完成序章的存档状态 (练气四层)
        driver.execute_script("""
            if (window.gameManager) {
                window.gameManager.isPrologueComplete = true;
                window.gameManager.energy = 773;
                if (window.gameManager.player) {
                    window.gameManager.player.isMortal = false;
                    window.gameManager.player.level = 4;
                    window.gameManager.player.currentSect = 'taiyi';
                }
                const modalStory = document.getElementById('modal-story');
                if (modalStory) modalStory.classList.add('hidden');
                if (window.SlotsRPG.StorageService) {
                    window.SlotsRPG.StorageService.saveGame(window.gameManager, true);
                }
            }
        """)

        # -----------------------------------------------------------------
        # 测试场景 1: 首次刷新页面（无持久化特定指定时，默认应在角色修真且界面严格一致）
        # -----------------------------------------------------------------
        print("Test 1: Refreshing with default/cleared tab persistence...")
        driver.execute_script("localStorage.removeItem('SLOTS_RPG_ACTIVE_TAB');")
        driver.refresh()
        time.sleep(2)

        state1 = driver.execute_script("""
            const tabChar = document.getElementById('tab-character');
            const tabSlots = document.getElementById('tab-slots');
            const viewChar = document.getElementById('view-character');
            const viewSlots = document.getElementById('view-slots');
            const topHud = document.querySelector('.top-hud');

            return {
                tabCharActive: tabChar ? tabChar.classList.contains('active') : false,
                tabSlotsActive: tabSlots ? tabSlots.classList.contains('active') : false,
                viewCharActive: viewChar ? viewChar.classList.contains('active') : false,
                viewSlotsActive: viewSlots ? viewSlots.classList.contains('active') : false,
                topHudHidden: topHud ? topHud.classList.contains('hidden') : false
            };
        """)
        print("State 1 after default refresh:", state1)
        assert state1["tabCharActive"] is True, "tab-character should be active"
        assert state1["viewCharActive"] is True, "view-character MUST be active!"
        assert state1["viewSlotsActive"] is False, "view-slots MUST NOT be active!"
        assert state1["tabSlotsActive"] is False, "tab-slots MUST NOT be active!"
        assert state1["topHudHidden"] is True, "top-hud should be hidden on character view"

        # 截图验证默认刷新在角色修真界面
        screenshot1 = os.path.join(ARTIFACT_DIR, "verify_character_tab_after_refresh.png")
        driver.save_screenshot(screenshot1)
        print(f"Saved Test 1 screenshot to {screenshot1}")

        # -----------------------------------------------------------------
        # 测试场景 2: 用户切换至【神龙吐宝】，然后按 F5 刷新
        # -----------------------------------------------------------------
        print("Test 2: Switching to slots tab and refreshing...")
        driver.execute_script("window.switchTab('slots');")
        time.sleep(0.5)

        # 刷新页面
        driver.refresh()
        time.sleep(2)

        state2 = driver.execute_script("""
            const tabChar = document.getElementById('tab-character');
            const tabSlots = document.getElementById('tab-slots');
            const viewChar = document.getElementById('view-character');
            const viewSlots = document.getElementById('view-slots');
            const topHud = document.querySelector('.top-hud');

            return {
                tabSlotsActive: tabSlots ? tabSlots.classList.contains('active') : false,
                viewSlotsActive: viewSlots ? viewSlots.classList.contains('active') : false,
                tabCharActive: tabChar ? tabChar.classList.contains('active') : false,
                viewCharActive: viewChar ? viewChar.classList.contains('active') : false,
                topHudHidden: topHud ? topHud.classList.contains('hidden') : false
            };
        """)
        print("State 2 after refreshing slots tab:", state2)
        assert state2["tabSlotsActive"] is True, "tab-slots should be active after refresh"
        assert state2["viewSlotsActive"] is True, "view-slots should be active after refresh"
        assert state2["tabCharActive"] is False, "tab-character should not be active"
        assert state2["viewCharActive"] is False, "view-character should not be active"
        assert state2["topHudHidden"] is False, "top-hud should be visible on slots view"

        screenshot2 = os.path.join(ARTIFACT_DIR, "verify_slots_tab_after_refresh.png")
        driver.save_screenshot(screenshot2)
        print(f"Saved Test 2 screenshot to {screenshot2}")

        # -----------------------------------------------------------------
        # 测试场景 3: 用户切换回【角色修真】，然后按 F5 刷新
        # -----------------------------------------------------------------
        print("Test 3: Switching to character tab and refreshing...")
        driver.execute_script("window.switchTab('character');")
        time.sleep(0.5)

        # 刷新页面
        driver.refresh()
        time.sleep(2)

        state3 = driver.execute_script("""
            const tabChar = document.getElementById('tab-character');
            const tabSlots = document.getElementById('tab-slots');
            const viewChar = document.getElementById('view-character');
            const viewSlots = document.getElementById('view-slots');
            const heroPower = document.getElementById('hero-profile-power');
            const bagGrid = document.getElementById('bag-grid');

            return {
                tabCharActive: tabChar ? tabChar.classList.contains('active') : false,
                viewCharActive: viewChar ? viewChar.classList.contains('active') : false,
                tabSlotsActive: tabSlots ? tabSlots.classList.contains('active') : false,
                viewSlotsActive: viewSlots ? viewSlots.classList.contains('active') : false,
                heroPower: heroPower ? heroPower.innerText : '',
                bagSlotsCount: bagGrid ? bagGrid.children.length : 0
            };
        """)
        print("State 3 after refreshing character tab:", state3)
        assert state3["tabCharActive"] is True, "tab-character MUST be active!"
        assert state3["viewCharActive"] is True, "view-character MUST be active!"
        assert state3["tabSlotsActive"] is False, "tab-slots MUST NOT be active!"
        assert state3["viewSlotsActive"] is False, "view-slots MUST NOT be active!"
        assert state3["bagSlotsCount"] > 0, "Bag grid should have slots rendered"

        screenshot3 = os.path.join(ARTIFACT_DIR, "verify_character_tab_content_correct.png")
        driver.save_screenshot(screenshot3)
        print(f"Saved Test 3 screenshot to {screenshot3}")

        print("=== ALL TAB REFRESH PERSISTENCE TESTS PASSED 100%! ===")

    finally:
        driver.quit()

if __name__ == "__main__":
    main()
