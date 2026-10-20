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
PORT = 8098

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

        # 准备角色状态并向背包塞入高阶更优装备
        setup_res = driver.execute_script("""
            if (!window.gameManager) return { success: false, reason: 'no gameManager' };
            const gm = window.gameManager;
            gm.isPrologueComplete = true;
            if (gm.player) {
                gm.player.isMortal = false;
                gm.player.level = 5;
                gm.player.currentSect = 'taiyi';
            }
            // 关闭所有弹窗
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));

            // 切换至角色修真
            const tabBtn = document.querySelector('.bottom-nav-item[data-tab="character"]');
            if (tabBtn) tabBtn.click();

            // 生成几件高品质极品装备放入背包
            const itemModel = window.SlotsRPG.ItemModel;
            if (itemModel) {
                const highWeapon = itemModel.createEquipment('weapon', 'Q4');
                const highArmor = itemModel.createEquipment('armor', 'Q4');
                const highRing = itemModel.createEquipment('ring', 'Q4');
                gm.inventory.addItem(highWeapon);
                gm.inventory.addItem(highArmor);
                gm.inventory.addItem(highRing);
            }
            gm.emitStateChange();

            return {
                success: true,
                initialPower: gm.player.combatPower,
                bagCount: gm.inventory.slots.filter(Boolean).length,
                canUpgradeWeapon: gm.canSlotBeEquippedOrUpgraded('weapon')
            };
        """)
        print("Setup result:", setup_res)
        time.sleep(1)

        # 点击一键装备
        print("Clicking #btn-quick-equip...")
        click_res = driver.execute_script("""
            const btn = document.getElementById('btn-quick-equip');
            const prevPower = window.gameManager.player.combatPower;
            btn.click();
            
            // 立即检测弹窗是否被触发
            const modalNotice = document.getElementById('modal-action-notice');
            const isModalHidden = modalNotice ? modalNotice.classList.contains('hidden') : true;

            // 检测飘字元素
            const powerGainEl = document.querySelector('.quick-equip-power-gain');
            const powerGainText = powerGainEl ? powerGainEl.innerText : null;

            const newPower = window.gameManager.player.combatPower;

            return {
                prevPower,
                newPower,
                powerDiff: newPower - prevPower,
                isModalHidden,
                powerGainText
            };
        """)
        print("Equip Result:", click_res)

        # 断言检测
        assert click_res['isModalHidden'] == True, "ERROR: #modal-action-notice must NOT be shown when clicking 一键装备!"
        assert click_res['powerDiff'] > 0, f"ERROR: Power should have increased, got {click_res['powerDiff']}"
        assert click_res['powerGainText'] is not None and ('战力' in click_res['powerGainText']), f"ERROR: Floating combat power text must be visible, got {click_res['powerGainText']}"

        # 截取装备后的战力飘字特效画面
        time.sleep(0.3)
        screenshot1 = os.path.join(ARTIFACT_DIR, "verify_quick_equip_direct.png")
        driver.save_screenshot(screenshot1)
        print(f"Saved direct equip screenshot to {screenshot1}")

        # 再次点击一键装备 (已是最佳配装时)
        time.sleep(2) # 等待前一次飘字结束
        print("Clicking #btn-quick-equip second time (when already best)...")
        click2_res = driver.execute_script("""
            const btn = document.getElementById('btn-quick-equip');
            btn.click();
            const modalNotice = document.getElementById('modal-action-notice');
            const isModalHidden = modalNotice ? modalNotice.classList.contains('hidden') : true;
            return { isModalHidden };
        """)
        print("Second click result:", click2_res)
        assert click2_res['isModalHidden'] == True, "ERROR: Modal notice must NOT show even on second click!"

        screenshot2 = os.path.join(ARTIFACT_DIR, "verify_quick_equip_already_best.png")
        driver.save_screenshot(screenshot2)
        print(f"Saved already-best screenshot to {screenshot2}")

        print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")

    finally:
        driver.quit()

if __name__ == '__main__':
    main()
