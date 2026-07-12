const fs = require('fs');
const path = require('path');
let found = false;
function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('dY-') || content.includes('dY\"') || content.includes('\uFFFD') || content.includes('dYO?')) {
        console.log('Broken chars found in', fullPath);
        found = true;
      }
    }
  });
}
walk('src');
if (!found) console.log('All clear!');
