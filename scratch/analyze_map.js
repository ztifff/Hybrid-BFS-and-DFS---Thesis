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

// Find inner boundary of the atrium (the green area in the center)
let atriumMinX = width, atriumMaxX = 0, atriumMinY = height, atriumMaxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const p = getPixel(x, y);
    // Green central atrium area: dark greenish grey
    // Let's check green hue
    if (p.r > 90 && p.r < 130 && p.g > 120 && p.g < 160 && p.b > 100 && p.b < 140) {
      if (x > 200 && x < 500 && y > 150 && y < 400) {
        if (x < atriumMinX) atriumMinX = x;
        if (x > atriumMaxX) atriumMaxX = x;
        if (y < atriumMinY) atriumMinY = y;
        if (y > atriumMaxY) atriumMaxY = y;
      }
    }
  }
}
console.log('Central Atrium box:', { atriumMinX, atriumMaxX, atriumMinY, atriumMaxY, cx: (atriumMinX+atriumMaxX)/2, cy: (atriumMinY+atriumMaxY)/2 });

// Find North stairs / elevator area (yellowish / escalator)
let escNorthMinX = width, escNorthMaxX = 0, escNorthMinY = height, escNorthMaxY = 0;
let escSouthMinX = width, escSouthMaxX = 0, escSouthMinY = height, escSouthMaxY = 0;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const p = getPixel(x, y);
    if (p.r > 200 && p.g > 160 && p.g < 210 && p.b > 80 && p.b < 140) {
      if (y < 200) {
        if (x < escNorthMinX) escNorthMinX = x;
        if (x > escNorthMaxX) escNorthMaxX = x;
        if (y < escNorthMinY) escNorthMinY = y;
        if (y > escNorthMaxY) escNorthMaxY = y;
      } else {
        if (x < escSouthMinX) escSouthMinX = x;
        if (x > escSouthMaxX) escSouthMaxX = x;
        if (y < escSouthMinY) escSouthMinY = y;
        if (y > escSouthMaxY) escSouthMaxY = y;
      }
    }
  }
}
console.log('North feature (stairs/escalator):', { escNorthMinX, escNorthMaxX, escNorthMinY, escNorthMaxY, cx: (escNorthMinX+escNorthMaxX)/2, cy: (escNorthMinY+escNorthMaxY)/2 });
console.log('South escalator:', { escSouthMinX, escSouthMaxX, escSouthMinY, escSouthMaxY, cx: (escSouthMinX+escSouthMaxX)/2, cy: (escSouthMinY+escSouthMaxY)/2 });

// Look for outer building perimeter
let outerMinX = width, outerMaxX = 0, outerMinY = height, outerMaxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const p = getPixel(x, y);
    // Dark walls (border is dark grey/black, r < 80, g < 80, b < 80)
    if (p.r < 80 && p.g < 80 && p.b < 80 && p.a > 200) {
      if (x < outerMinX) outerMinX = x;
      if (x > outerMaxX) outerMaxX = x;
      if (y < outerMinY) outerMinY = y;
      if (y > outerMaxY) outerMaxY = y;
    }
  }
}
console.log('Outer wall bounds:', { outerMinX, outerMaxX, outerMinY, outerMaxY });
