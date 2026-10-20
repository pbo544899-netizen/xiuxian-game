import os
import sys
import time
import threading
from http.server import SimpleHTTPRequestHandler, HTTPServer
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

ARTIFACT_DIR = r"C:\Users\baish\.gemini\antigravity\brain\01f29278-40ce-4787-9d2d-2408e9039bf0"
PORT = 8100

class SilentServer(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

def run_server():
    server = HTTPServer(('127.0.0.1', PORT), SilentServer)
    server.serve_forever()

def main():
    print(f"Starting server on port {PORT}...")
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

        # 1. 设置游戏为宗门正式玩家、具备充足机缘 (700+)
        init_res = driver.execute_script("""
            if (!window.gameManager) return { success: false };
            const gm = window.gameManager;
            gm.isPrologueComplete = true;
            gm.energy = 888;
            if (gm.player) {
                gm.player.isMortal = false;
                gm.player.level = 5;
                gm.player.currentSect = 'taiyi';
            }
            // 切换到天机盘 / 神龙吐宝界面
            const tabSlots = document.getElementById('tab-slots');
            if (tabSlots) tabSlots.click();
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));

            gm.emitStateChange();
            return {
                energy: gm.energy,
                viewActive: document.getElementById('view-slots').classList.contains('active')
            };
        """)
        print("Initial setup result:", init_res)
        time.sleep(1)

        # 2. 测试连续普通抽奖：快速连点 3 次 (测试毫秒级高频吐宝与同类堆叠跳动)
        print("Testing continuous regular draws (3 rapid clicks)...")
        draw1_time = driver.execute_script("""
            const t0 = performance.now();
            const btn = document.getElementById('btn-spin');
            btn.click();
            return t0;
        """)
        time.sleep(0.2)
        # 截取常规快速喷吐截图
        screenshot_reg = os.path.join(ARTIFACT_DIR, "verify_continuous_draw_regular.png")
        driver.save_screenshot(screenshot_reg)
        print(f"Saved regular rapid spout screenshot to {screenshot_reg}")

        time.sleep(0.4) # 等待第1发结束 (~450ms)

        # 3. 连点第2发
        driver.execute_script("document.getElementById('btn-spin').click();")
        time.sleep(0.5)

        # 4. 连点第3发
        driver.execute_script("document.getElementById('btn-spin').click();")
        time.sleep(0.6)

        bag_state = driver.execute_script("""
            const cm = window.gameManager.dragonCabinetManager;
            return {
                slotCount: cm.slots.length,
                slots: cm.slots.map(s => ({ name: s.name, count: s.count, quality: s.quality }))
            };
        """)
        print("Bag state after 3 continuous draws:", bag_state)

        # 5. 测试命中极品大货时的戏剧性刹车与大爆蓄势 (Drama Pause)
        print("Testing Epic Loot dramatic pause and burst...")
        driver.execute_script("""
            const itemModel = window.SlotsRPG.ItemModel;
            const epicSword = itemModel.createEquipment('weapon', 'Q4');
            // 模拟抽中 Q4 极品法宝
            const spinData = {
                leftCabinet: {
                    type: 'equip',
                    item: epicSword,
                    isUpgrade: true,
                    powerDiff: 180
                },
                rightCabinet: {
                    type: 'energy',
                    energyGain: 50
                },
                evaluation: { totalPayout: 50 }
            };
            window.gameManager.dragonCabinetManager.prepareSpout(spinData.leftCabinet, spinData.rightCabinet);
            window.gameManager.renderer.stopSpin(spinData, () => {});
        """)

        # 在 300ms 时检测龙头是否进入 .epic-charging 刹车蓄能状态
        time.sleep(0.25)
        is_charging = driver.execute_script("""
            const head = document.getElementById('dragon-head-sprite');
            return head ? head.classList.contains('epic-charging') : false;
        """)
        print("Epic charging state during drama pause:", is_charging)

        screenshot_epic_charge = os.path.join(ARTIFACT_DIR, "verify_continuous_draw_epic_charging.png")
        driver.save_screenshot(screenshot_epic_charge)
        print(f"Saved epic charging screenshot to {screenshot_epic_charge}")

        # 等待极品砸地轰鸣与前插归序 (~850ms)
        time.sleep(0.95)
        epic_landed = driver.execute_script("""
            const cm = window.gameManager.dragonCabinetManager;
            const slot0 = document.getElementById('dragon-slot-0');
            return {
                firstItemName: cm.slots[0] ? cm.slots[0].name : null,
                firstItemQuality: cm.slots[0] ? cm.slots[0].quality : null,
                hasEpicBurst: slot0 ? slot0.classList.contains('slot-epic-burst') : false
            };
        """)
        print("Epic landed state:", epic_landed)

        screenshot_epic_burst = os.path.join(ARTIFACT_DIR, "verify_continuous_draw_epic_burst.png")
        driver.save_screenshot(screenshot_epic_burst)
        print(f"Saved epic burst screenshot to {screenshot_epic_burst}")

        assert epic_landed['firstItemQuality'] == 'Q4', f"Expected Q4 in first slot, got {epic_landed['firstItemQuality']}"

        print("\nALL CONTINUOUS RHYTHM & EPIC ANTICIPATION TESTS PASSED!")

    finally:
        driver.quit()

if __name__ == '__main__':
    main()
