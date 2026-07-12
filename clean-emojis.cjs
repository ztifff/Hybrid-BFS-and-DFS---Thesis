const fs = require('fs');
const path = require('path');

function walkAndClean(dir) {
  const list = fs.readdirSync(dir);
  for (let file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkAndClean(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const orig = content;
      
      // Fix icon values in dictionaries
      content = content.replace(/icon:\s*['"][^'"]*['"]/g, match => {
        if (match.includes('dY') || match.includes('\uFFFD')) return "icon: ''";
        return match;
      });

      // Remove standalone mangled emojis in JSX text (like >+? Return<)
      // We look for \uFFFD and remove it and adjacent garbage
      content = content.replace(/\uFFFD[a-zA-Z0-9_\-\"\'\`\.\?\>\<\,\:\;\{\}\[\]]*/g, '');
      
      // Remove standalone dY garbage in JSX
      content = content.replace(/dY[a-zA-Z0-9_\-\"\'\`\.\?\>\<\,\:\;\{\}\[\]]*/g, '');

      if (content !== orig) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Cleaned ${fullPath}`);
      }
    }
  }
}

walkAndClean('src/components');
