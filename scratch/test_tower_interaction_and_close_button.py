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

        # Unlock tabs and set state
        print("Unlocking tabs and navigating to Cave tab...")
        driver.execute_script("""
            if (window.storyManager) window.storyManager.closeStoryDialog(true);
            const gm = window.SlotsRPG.GameManager;
            gm.isPrologueComplete = true;
            gm.hasCompletedCaveFTUE = true;
            gm.hasCompletedFirstDragonSpoutFTUE = true;
            gm.hasCompletedEquipFTUE = true;
            gm.hasCompletedSlotsReturnFTUE = true;
            window.switchTab('cave');
        """)
        time.sleep(0.5)

        # Check demon-tower-card and btn-enter-demon-tower text
        btn_text = driver.execute_script("""
            const btn = document.getElementById('btn-enter-demon-tower');
            return btn ? btn.innerText.trim() : '';
        """)
        print(f"Demon tower button text: '{btn_text}'")
        assert "持剑闯关" in btn_text, f"Expected 持剑闯关, got {btn_text}"

        # -------------------------------------------------------------------
        # Test 1: Click outside the button on demon-tower-card => Opens modal
        # -------------------------------------------------------------------
        print("\nTest 1: Clicking demon-tower-card (outside button)...")
        card = driver.find_element(By.ID, "demon-tower-card")
        title_el = driver.find_element(By.CLASS_NAME, "tower-title")
        driver.execute_script("arguments[0].click();", title_el)
        time.sleep(0.4)

        modal_visible = driver.execute_script("""
            const m = document.getElementById('modal-demon-tower');
            return m && !m.classList.contains('hidden');
        """)
        print(f"Modal visible on card click? {modal_visible} (Expected: True)")
        assert modal_visible, "Error: Clicking demon-tower-card did not open modal!"

        # Check close button position
        btn_close_rect = driver.execute_script("""
            const b = document.getElementById('btn-close-tower-modal');
            const card = document.querySelector('.demon-tower-modal-card');
            const bRect = b.getBoundingClientRect();
            const cRect = card.getBoundingClientRect();
            return {
                btnTopRel: bRect.top - cRect.top,
                btnRightRel: cRect.right - bRect.right,
                btnWidth: bRect.width,
                btnHeight: bRect.height,
                btnBottom: bRect.bottom,
                cTop: cRect.top
            };
        """)
        print(f"Close button relative pos in card: Top={btn_close_rect['btnTopRel']}px, Right={btn_close_rect['btnRightRel']}px")
        # In upper right corner: Top should be around 12px, Right around 14px
        assert abs(btn_close_rect['btnTopRel'] - 12) < 10, f"Close button not at top! {btn_close_rect}"
        assert abs(btn_close_rect['btnRightRel'] - 14) < 10, f"Close button not at right! {btn_close_rect}"

        # Save screenshot of demon tower modal with fixed close button
        driver.save_screenshot("scratch/verified_demon_tower_modal_top_right.png")
        driver.save_screenshot("C:/Users/baish/.gemini/antigravity/brain/01f29278-40ce-4787-9d2d-2408e9039bf0/verified_demon_tower_modal_top_right.png")
        print("[PASS] Close button is positioned perfectly in top-right corner of 破关激战 modal!")

        # -------------------------------------------------------------------
        # Test 2: Click close button => Closes modal
        # -------------------------------------------------------------------
        print("\nTest 2: Clicking close button (btn-close-tower-modal)...")
        btn_close = driver.find_element(By.ID, "btn-close-tower-modal")
        driver.execute_script("arguments[0].click();", btn_close)
        time.sleep(0.3)

        modal_hidden = driver.execute_script("""
            const m = document.getElementById('modal-demon-tower');
            return m && m.classList.contains('hidden');
        """)
        print(f"Modal hidden after close click? {modal_hidden} (Expected: True)")
        assert modal_hidden, "Error: Close button did not close modal!"
        print("[PASS] Modal closed successfully via top-right close button!")

        # -------------------------------------------------------------------
        # Test 3: Click '持剑闯关' button => Directly enters battle
        # -------------------------------------------------------------------
        print("\nTest 3: Clicking '持剑闯关' button directly...")
        btn_enter = driver.find_element(By.ID, "btn-enter-demon-tower")
        driver.execute_script("arguments[0].click();", btn_enter)
        time.sleep(0.5)

        # Check if battle transition or battle arena modal is active
        battle_started = driver.execute_script("""
            const trans = document.getElementById('modal-battle-transition');
            const arena = document.getElementById('modal-battle-arena');
            const gm = window.SlotsRPG.GameManager;
            const inBattle = gm.isInBattle || (trans && !trans.classList.contains('hidden')) || (arena && !arena.classList.contains('hidden'));
            const modalTowerHidden = document.getElementById('modal-demon-tower').classList.contains('hidden');
            return inBattle && modalTowerHidden;
        """)
        print(f"Battle started directly and modal remained hidden? {battle_started} (Expected: True)")
        assert battle_started, "Error: Direct button click did not launch battle directly!"
        print("[PASS] Direct battle entrance verified successfully!")

        # -------------------------------------------------------------------
        # Test 4: Verify Hero Profile, Filter Settings, and Title Modal close buttons
        # -------------------------------------------------------------------
        print("\nTest 4: Checking other modals' close buttons (统一在右上角)...")
        # Check hero profile detail modal
        hero_close_pos = driver.execute_script("""
            const m = document.getElementById('modal-hero-profile-detail');
            m.classList.remove('hidden');
            const b = document.getElementById('btn-close-hero-detail');
            const card = m.querySelector('.modal-card');
            const bRect = b.getBoundingClientRect();
            const cRect = card.getBoundingClientRect();
            const res = {
                btnTopRel: bRect.top - cRect.top,
                btnRightRel: cRect.right - bRect.right
            };
            m.classList.add('hidden');
            return res;
        """)
        print(f"Hero profile close button: Top={hero_close_pos['btnTopRel']}px, Right={hero_close_pos['btnRightRel']}px")
        assert abs(hero_close_pos['btnTopRel'] - 12) < 10 and abs(hero_close_pos['btnRightRel'] - 14) < 10

        # Check filter settings modal
        filter_close_pos = driver.execute_script("""
            const m = document.getElementById('modal-filter-settings');
            m.classList.remove('hidden');
            const b = document.getElementById('btn-close-filter-settings');
            const card = m.querySelector('.modal-card');
            const bRect = b.getBoundingClientRect();
            const cRect = card.getBoundingClientRect();
            const res = {
                btnTopRel: bRect.top - cRect.top,
                btnRightRel: cRect.right - bRect.right
            };
            m.classList.add('hidden');
            return res;
        """)
        print(f"Filter settings close button: Top={filter_close_pos['btnTopRel']}px, Right={filter_close_pos['btnRightRel']}px")
        assert abs(filter_close_pos['btnTopRel'] - 12) < 10 and abs(filter_close_pos['btnRightRel'] - 14) < 10

        # Check title modal
        title_close_pos = driver.execute_script("""
            const m = document.getElementById('modal-title-select');
            m.classList.remove('hidden');
            const b = document.getElementById('btn-close-title-modal');
            const card = m.querySelector('.modal-card');
            const bRect = b.getBoundingClientRect();
            const cRect = card.getBoundingClientRect();
            const res = {
                btnTopRel: bRect.top - cRect.top,
                btnRightRel: cRect.right - bRect.right
            };
            m.classList.add('hidden');
            return res;
        """)
        print(f"Title modal close button: Top={title_close_pos['btnTopRel']}px, Right={title_close_pos['btnRightRel']}px")
        assert abs(title_close_pos['btnTopRel'] - 12) < 10 and abs(title_close_pos['btnRightRel'] - 14) < 10

        print("[PASS] All modals have unified, elegant top-right close buttons!")

    finally:
        driver.quit()

if __name__ == '__main__':
    run_test()
