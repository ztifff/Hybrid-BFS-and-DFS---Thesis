const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('./public/EvacMaps/AtriumL1.png');
let pos = 8; const idatChunks = [];
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.toString('ascii', pos + 4, pos + 8);
  if (type === 'IDAT') idatChunks.push(buf.subarray(pos + 8, pos + 8 + len));
  pos += 12 + len;
}
const raw = zlib.inflateSync(Buffer.concat(idatChunks));
const width = 672, height = 532, bpp = 4;
const stride = width * bpp;
const unfilt = Buffer.alloc(width * height * bpp);

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

for (let y = 0; y < height; y++) {
  const filterType = raw[y * (stride + 1)];
  const rawRow = y * (stride + 1) + 1;
  const outRow = y * stride;
  const prevOutRow = (y - 1) * stride;
  for (let x = 0; x < stride; x++) {
    const byte = raw[rawRow + x];
    const left = x >= bpp ? unfilt[outRow + x - bpp] : 0;
    const up = y > 0 ? unfilt[prevOutRow + x] : 0;
    const upLeft = (y > 0 && x >= bpp) ? unfilt[prevOutRow + x - bpp] : 0;
    let val = byte;
    if (filterType === 1) val = (byte + left) & 0xff;
    else if (filterType === 2) val = (byte + up) & 0xff;
    else if (filterType === 3) val = (byte + Math.floor((left + up) / 2)) & 0xff;
    else if (filterType === 4) val = (byte + paeth(left, up, tactical = upLeft)) & 0xff;
    unfilt[outRow + x] = val;
  }
}

function getPixel(x, y) {
  const idx = (y * width + x) * bpp;
  return { r: unfilt[idx], g: unfilt[idx+1], b: unfilt[idx+2], a: unfilt[idx+3] };
}

// Function to find black text center within a box
function findTextCenter(name, x1, y1, x2, y2) {
  let pts = [];
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      const p = getPixel(x, y);
      // Text pixel (grey / black)
      if (p.r < 130 && p.g < 130 && p.b < 130 && Math.abs(p.r - p.g) < 20 && Math.abs(p.g - p.b) < 20 && p.a > 200) {
        pts.push({x, y});
      }
    }
  }
  if (!pts.length) {
    console.log(`${name}: no black text found in [${x1},${y1},${x2},${y2}]`);
    return;
  }
  const avgX = Math.round(pts.reduce((s,pt)=>s+pt.x,0)/pts.length);
  const avgY = Math.round(pts.reduce((s,pt)=>s+pt.y,0)/pts.length);
  const minX = Math.min(...pts.map(p=>p.x)), maxX = Math.max(...pts.map(p=>p.x));
  const minY = Math.min(...pts.map(p=>p.y)), maxY = Math.max(...pts.map(p=>p.y));
  console.log(`${name.padEnd(25)} -> center: (${avgX}, ${avgY})  [text bbox: (${minX},${minY}) to (${maxX},${maxY})] pts=${pts.length}`);
}

console.log('--- FINDING TEXT CENTERS ---');
findTextCenter('Bacolod Inasal', 45, 40, 110, 120);
findTextCenter('Classic Savory', 60, 120, 180, 170);
findTextCenter('National Bookstore', 230, 40, 340, 140);
findTextCenter('Jamba Juice', 410, 40, 480, 110);
findTextCenter('Bonchon Chicken', 540, 40, 640, 110);
findTextCenter('Watsons', 470, 110, 560, 160);
findTextCenter('Kuya J Restaurant', 70, 180, 220, 240);
findTextCenter('Hap Chan', 60, 250, 180, 300);
findTextCenter('Beabi / Casa', 470, 180, 550, 240);
findTextCenter('Healthy Options', 470, 240, 640, 300);
findTextCenter('Sarabia Optical', 470, 300, 530, 360);
findTextCenter('Bow & Wow', 540, 300, 630, 360);
findTextCenter('Bank of PH', 50, 400, 140, 500);
findTextCenter('Salad Stop', 190, 400, 250, 500);
findTextCenter('Hokkaido Ramen', 250, 380, 330, 435);
findTextCenter('Katsu Sora', 250, 435, 330, 495);
findTextCenter('Kenny Rogers', 420, 400, 485, 500);
findTextCenter('Breadtalk', 490, 400, 550, 500);
findTextCenter('Starbucks', 560, 400, 630, 500);
