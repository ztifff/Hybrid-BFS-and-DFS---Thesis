const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('./public/EvacMaps/AtriumL2.png');
let pos = 8; const idatChunks = [];
let width = 0, height = 0;

// Read PNG chunks
pos = 8;
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.toString('ascii', pos + 4, pos + 8);
  if (type === 'IHDR') {
    width = buf.readUInt32BE(pos + 8);
    height = buf.readUInt32BE(pos + 12);
    console.log(`IHDR: width=${width}, height=${height}, bitDepth=${buf[pos+16]}, colorType=${buf[pos+17]}`);
  }
  if (type === 'IDAT') idatChunks.push(buf.subarray(pos + 8, pos + 8 + len));
  pos += 12 + len;
}

const raw = zlib.inflateSync(Buffer.concat(idatChunks));
const bpp = 4;
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
    else if (filterType === 4) val = (byte + paeth(left, up, upLeft)) & 0xff;
    unfilt[outRow + x] = val;
  }
}

function getPixel(x, y) {
  const idx = (y * width + x) * bpp;
  return { r: unfilt[idx], g: unfilt[idx+1], b: unfilt[idx+2], a: unfilt[idx+3] };
}

// 1. Central green atrium
let atriumMinX = width, atriumMaxX = 0, atriumMinY = height, atriumMaxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const p = getPixel(x, y);
    if (p.r > 80 && p.r < 140 && p.g > 110 && p.g < 170 && p.b > 90 && p.b < 150) {
      if (x > 200 && x < 500 && y > 150 && y < 400) {
        if (x < atriumMinX) atriumMinX = x;
        if (x > atriumMaxX) atriumMaxX = x;
        if (y < atriumMinY) atriumMinY = y;
        if (y > atriumMaxY) atriumMaxY = y;
      }
    }
  }
}
console.log('Atrium box in L2:', { atriumMinX, atriumMaxX, atriumMinY, atriumMaxY, cx: (atriumMinX+atriumMaxX)/2, cy: (atriumMinY+atriumMaxY)/2 });

// 2. Escalators / Stairs
let goldPts = [];
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const p = getPixel(x, y);
    if (p.r > 190 && p.g > 150 && p.b > 70 && p.b < 160 && p.r > p.g) {
      goldPts.push({ x, y });
    }
  }
}
console.log('Gold features count in L2:', goldPts.length);

// 3. Restroom teal
let tealPts = [];
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const p = getPixel(x, y);
    if (p.r > 40 && p.r < 120 && p.g > 110 && p.g < 190 && p.b > 140 && p.b < 220) {
      tealPts.push({ x, y });
    }
  }
}
if (tealPts.length) {
  const xs = tealPts.map(p=>p.x), ys = tealPts.map(p=>p.y);
  console.log('Restroom teal box in L2:', { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys), cx: (Math.min(...xs)+Math.max(...xs))/2, cy: (Math.min(...ys)+Math.max(...ys))/2 });
}

// 4. Outer walls bounds
let outerMinX = width, outerMaxX = 0, outerMinY = height, outerMaxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const p = getPixel(x, y);
    if (p.r < 80 && p.g < 80 && p.b < 80 && p.a > 200) {
      if (x < outerMinX) outerMinX = x;
      if (x > outerMaxX) outerMaxX = x;
      if (y < outerMinY) outerMinY = y;
      if (y > outerMaxY) outerMaxY = y;
    }
  }
}
console.log('Outer wall bounds in L2:', { outerMinX, outerMaxX, outerMinY, outerMaxY });

// 5. Text Centroid detection
function findTextCenter(name, x1, y1, x2, y2) {
  let pts = [];
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      const p = getPixel(x, y);
      if (p.r < 130 && p.g < 130 && p.b < 130 && Math.abs(p.r - p.g) < 20 && Math.abs(p.g - p.b) < 20 && p.a > 200) {
        pts.push({x, y});
      }
    }
  }
  if (!pts.length) {
    console.log(`${name.padEnd(25)} -> no text found in [${x1},${y1},${x2},${y2}]`);
    return null;
  }
  const avgX = Math.round(pts.reduce((s,pt)=>s+pt.x,0)/pts.length);
  const avgY = Math.round(pts.reduce((s,pt)=>s+pt.y,0)/pts.length);
  const minX = Math.min(...pts.map(p=>p.x)), maxX = Math.max(...pts.map(p=>p.x));
  const minY = Math.min(...pts.map(p=>p.y)), maxY = Math.max(...pts.map(p=>p.y));
  console.log(`${name.padEnd(25)} -> center: (${avgX}, ${avgY})  bbox: (${minX},${minY}) to (${maxX},${maxY}) pts=${pts.length}`);
  return { avgX, avgY, minX, maxX, minY, maxY, pts: pts.length };
}

console.log('--- FINDING L2 TEXTS ---');
findTextCenter('Top-Left (Furniture?)', 40, 30, 250, 180);
findTextCenter('Top-Mid (Daiso?)', 250, 30, 480, 180);
findTextCenter('Top-Right (Casa?)', 480, 30, 650, 180);
findTextCenter('Mid-Right 1', 480, 180, 650, 270);
findTextCenter('Mid-Right 2', 480, 270, 650, 360);
findTextCenter('Bot-Left (Ashley?)', 40, 370, 300, 520);
findTextCenter('Bot-Mid (Dogs/Abenson?)', 300, 370, 500, 520);
findTextCenter('Bot-Right (Dental?)', 500, 370, 650, 520);
