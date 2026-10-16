const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const injectScript = `
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        // Dismiss story dialog
        const modalStory = document.getElementById('modal-story-dialog');
        if (modalStory) modalStory.classList.add('hidden');
        const btnStorySkip = document.getElementById('btn-story-skip');
        if (btnStorySkip) btnStorySkip.click();

        const proSec = document.getElementById('prologue-section');
        if (proSec) proSec.classList.add('hidden');

        if (window.gameManager && window.SlotsRPG && window.SlotsRPG.ItemModel) {
          const gm = window.gameManager;
          const ItemModel = window.SlotsRPG.ItemModel;

          gm.player.promoteToCultivator('wanjian');

          // 3 Q1 weapons to test floating merge button
          gm.inventory.addItem(ItemModel.createEquipment('weapon', 'Q1'));
          gm.inventory.addItem(ItemModel.createEquipment('weapon', 'Q1'));
          gm.inventory.addItem(ItemModel.createEquipment('weapon', 'Q1'));

          const armorQ3 = ItemModel.createEquipment('armor', 'Q3');
          armorQ3.power = 85;
          gm.inventory.addItem(armorQ3);
          const ringQ3 = ItemModel.createEquipment('ring', 'Q3');
          ringQ3.power = 90;
          gm.inventory.addItem(ringQ3);

          gm.emitStateChange();
        }

        // Switch to character view
        const tabChar = document.getElementById('tab-character');
        if (tabChar) tabChar.click();

        if (modalStory) modalStory.classList.add('hidden');
        if (proSec) proSec.classList.add('hidden');

        setTimeout(() => {
          const viewChar = document.getElementById('view-character');
          if (viewChar) {
            viewChar.scrollTop = 200;
          }
        }, 300);
      }, 500);
    });
  </script>
`;
html = html.replace('</body>', injectScript + '</body>');
fs.writeFileSync('preview_character_ui.html', html, 'utf8');
console.log('preview_character_ui.html updated with scroll');
