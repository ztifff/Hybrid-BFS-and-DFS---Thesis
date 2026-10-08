const fs = require('fs');
const files = [
  'backend/src/data/network.campus.ts',
  'backend/src/data/network.companybusiness.ts',
  'backend/src/utils/networkGraph.ts',
  'src/components/NetworkCanvas/types.ts',
  'src/components/simulation/TopologyEditor.tsx',
  'src/components/simulation/SimulationView.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    
    // Replace floor_router
    c = c.replace(/floor_router/g, 'multilayer_switch');
    
    // Safely replace switch type usages
    c = c.replace(/"type":\s*"switch"/g, '"type": "access_switch"');
    c = c.replace(/type:\s*'switch'/g, "type: 'access_switch'");
    c = c.replace(/'switch'/g, "'access_switch'");
    
    fs.writeFileSync(f, c);
  }
});
console.log('Done!');
