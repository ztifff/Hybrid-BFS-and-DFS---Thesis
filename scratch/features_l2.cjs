const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('./public/EvacMaps/AtriumL2.png');
let pos = 8; const idatChunks = [];
let width = 0, height = 0;
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.toString('ascii', pos + 4, pos + 8);
  if (type === 'IHDR') {
    width = buf.readUInt32BE(pos + 8);
    height = buf.readUInt32BE(pos + 12);
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

// Find gold features in L2 (escalators and stairs)
let goldClusters = [];
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const p = getPixel(x, y);
    if (p.r > 190 && p.g > 150 && p.b > 70 && p.b < 160 && p.r > p.g) {
      let found = false;
      for (const c of goldClusters) {
        if (Math.hypot(x - c.cx, y - c.cy) < 60) {
          c.pts.push({x, y});
          c.cx = c.pts.reduce((s,pt)=>s+pt.x,0)/c.pts.length;
          c.cy = c.pts.reduce((s,pt)=>s+pt.y,0)/c.pts.length;
          found = true;
          break;
        }
      }
      if (!found) goldClusters.push({ cx: x, cy: y, pts: [{x, y}] });
    }
  }
}
console.log('Gold clusters (stairs/escalators):');
goldClusters.forEach((c, i) => {
  const xs = c.pts.map(p=>p.x), ys = c.pts.map(p=>p.y);
  console.log(`Cluster ${i+1}: cx=${Math.round(c.cx)}, cy=${Math.round(c.cy)}, minX=${Math.min(...xs)}, maxX=${Math.max(...xs)}, minY=${Math.min(...ys)}, maxY=${Math.max(...ys)}, pts=${c.pts.length}`);
});

// Find outer perimeter border
// Let's sample edges
console.log('Border checks:');
// check x=13 to 30
let leftWallX = 0;
for (let x = 0; x < 50; x++) {
  let darkCount = 0;
  for (let y = 100; y < 400; y++) {
    const p = getPixel(x, y);
    if (p.r < 70 && p.g < 70 && p.b < 70) darkCount++;
  }
  if (darkCount > 100) { leftWallX = x; break; }
}
let rightWallX = 0;
for (let x = width - 1; x > width - 50; x--) {
  let darkCount = 0;
  for (let y = 100; y < 400; y++) {
    const p = getPixel(x, y);
    if (p.r < 70 && p.g < 70 && p.b < 70) darkCount++;
  }
  if (darkCount > 100) { rightWallX = x; break; }
}
let topWallY = 0;
for (let y = 0; y < 50; y++) {
  let darkCount = 0;
  for (let x = 100; x < 500; x++) {
    const p = getPixel(x, y);
    if (p.r < 70 && p.g < 70 && p.b < 70) darkCount++;
  }
  if (darkCount > 100) { topWallY = y; break; }
}
let botWallY = 0;
for (let y = height - 1; y > height - 50; y--) {
  let darkCount = 0;
  for (let x = 100; x < 500; x++) {
    const p = getPixel(x, y);
    if (p.r < 70 && p.g < 70 && p.b < 70) darkCount++;
  }
  if (darkCount > 100) { botWallY = y; break; }
}
console.log('Building outer walls in L2:', { leftWallX, rightWallX, topWallY, botWallY });
