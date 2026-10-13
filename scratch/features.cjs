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
    else if (filterType === 4) val = (byte + paeth(left, up, upLeft)) & 0xff;
    unfilt[outRow + x] = val;
  }
}

function getPixel(x, y) {
  const idx = (y * width + x) * bpp;
  return { r: unfilt[idx], g: unfilt[idx+1], b: unfilt[idx+2], a: unfilt[idx+3] };
}

// Find south escalator: around x=350-400, y=360-460
let sEscPts = [];
for (let y = 360; y < 460; y++) {
  for (let x = 350; x < 400; x++) {
    const p = getPixel(x, y);
    // Gold color: r around 210-230, g around 170-195, b around 100-140
    if (p.r > 190 && p.g > 150 && p.b > 80 && p.b < 150 && p.r > p.g) {
      sEscPts.push({x, y});
    }
  }
}
if (sEscPts.length) {
  const xs = sEscPts.map(p=>p.x), ys = sEscPts.map(p=>p.y);
  console.log('South escalator exact box:', {
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minY: Math.min(...ys), maxY: Math.max(...ys),
    cx: (Math.min(...xs)+Math.max(...xs))/2,
    cy: (Math.min(...ys)+Math.max(...ys))/2
  });
}

// Find north feature: around x=350-400, y=100-170
let nFeatPts = [];
for (let y = 100; y < 170; y++) {
  for (let x = 340; x < 410; x++) {
    const p = getPixel(x, y);
    if (p.r > 190 && p.g > 150 && p.b > 80 && p.b < 150 && p.r > p.g) {
      nFeatPts.push({x, y});
    }
  }
}
if (nFeatPts.length) {
  const xs = nFeatPts.map(p=>p.x), ys = nFeatPts.map(p=>p.y);
  console.log('North feature exact box:', {
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minY: Math.min(...ys), maxY: Math.max(...ys),
    cx: (Math.min(...xs)+Math.max(...xs))/2,
    cy: (Math.min(...ys)+Math.max(...ys))/2
  });
}

// Find green central atrium exact inner rect
let atriumPts = [];
for (let y = 180; y < 360; y++) {
  for (let x = 240; x < 460; x++) {
    const p = getPixel(x, y);
    // Greenish center:
    if (p.g > p.r && p.g > p.b && p.g > 100 && p.g < 170) {
      atriumPts.push({x, y});
    }
  }
}
if (atriumPts.length) {
  const xs = atriumPts.map(p=>p.x), ys = atriumPts.map(p=>p.y);
  console.log('Atrium exact green inner box:', {
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minY: Math.min(...ys), maxY: Math.max(...ys),
    cx: (Math.min(...xs)+Math.max(...xs))/2,
    cy: (Math.min(...ys)+Math.max(...ys))/2
  });
}
