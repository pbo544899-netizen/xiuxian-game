const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const scriptRegex = /<script src="([^"]+)"><\/script>/g;
let match;
const scripts = [];
while ((match = scriptRegex.exec(html)) !== null) {
  scripts.push(match[1]);
}

console.log('Found scripts:', scripts);

for (const scriptPath of scripts) {
  const fullPath = path.join(__dirname, '..', scriptPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`Script NOT FOUND: ${scriptPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  console.log(`✓ ${scriptPath} exists (${content.length} bytes)`);
}

console.log('All referenced scripts exist!');
