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

// Search for text clusters across the map
let textPts = [];
for (let y = 20; y < height - 20; y++) {
  for (let x = 20; x < width - 20; x++) {
    const p = getPixel(x, y);
    // Dark text pixels
    if (p.r < 120 && p.g < 120 && p.b < 120 && Math.abs(p.r - p.g) < 20 && Math.abs(p.g - p.b) < 20 && p.a > 200) {
      textPts.push({x, y});
    }
  }
}

// Cluster text pixels into regions (within 35 pixels)
let textClusters = [];
textPts.forEach(pt => {
  let found = false;
  for (const c of textClusters) {
    if (Math.hypot(pt.x - c.cx, pt.y - c.cy) < 35) {
      c.pts.push(pt);
      c.cx = c.pts.reduce((s,p)=>s+p.x,0)/c.pts.length;
      c.cy = c.pts.reduce((s,p)=>s+p.y,0)/c.pts.length;
      found = true;
      break;
    }
  }
  if (!found) textClusters.push({ cx: pt.x, cy: pt.y, pts: [pt] });
});

// Filter clusters with > 20 pixels
const significant = textClusters.filter(c => c.pts.length >= 15);
console.log(`Found ${significant.length} text regions in L2:`);
significant.sort((a,b) => a.cy - b.cy || a.cx - b.cx);
significant.forEach((c, i) => {
  const xs = c.pts.map(p=>p.x), ys = c.pts.map(p=>p.y);
  console.log(`Region ${i+1}: cx=${Math.round(c.cx)}, cy=${Math.round(c.cy)}, bbox=[${Math.min(...xs)}, ${Math.min(...ys)} to ${Math.max(...xs)}, ${Math.max(...ys)}], pts=${c.pts.length}`);
});
