const fs = require('fs');
const files = [
  'backend/src/data/robotics.aws.ts',
  'backend/src/data/robotics.clinic.ts',
  'backend/src/utils/roboticsGraph.ts'
];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/"type":\s*"shelf"/g, '"type": "delivery_bay"');
  c = c.replace(/"type":\s*"aisle"/g, '"type": "shelf"');
  c = c.replace(/type:\s*'shelf'/g, "type: 'delivery_bay'");
  c = c.replace(/type:\s*'aisle'/g, "type: 'shelf'");
  fs.writeFileSync(f, c);
});
console.log('Done!');
