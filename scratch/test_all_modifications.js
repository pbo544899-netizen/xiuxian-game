// Verify syntax and consistency of modified files
const fs = require('fs');

console.log("Checking syntax of modified JavaScript files...");

const files = [
  'src/rpg/BattleSoundEngine.js',
  'src/render/CanvasRenderer.js',
  'src/core/GameManager.js',
  'src/main.js'
];

let hasError = false;
files.forEach(file => {
  try {
    const code = fs.readFileSync(file, 'utf8');
    // Basic syntax check using new Function
    new Function(code);
    console.log(`[PASS] ${file} is syntactically valid.`);
  } catch (err) {
    console.error(`[FAIL] ${file} has syntax error:`, err.message);
    hasError = true;
  }
});

if (hasError) {
  process.exit(1);
} else {
  console.log("All modified files passed syntax validation!");
}
