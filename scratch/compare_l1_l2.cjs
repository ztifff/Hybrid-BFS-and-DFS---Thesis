const fs = require('fs');
const zlib = require('zlib');

function decodePng(path) {
  const buf = fs.readFileSync(path);
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
  const bpp = 4, stride = width * bpp;
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
  return {
    width, height,
    getPixel: (x, y) => {
      const idx = (y * width + x) * bpp;
      return { r: unfilt[idx], g: unfilt[idx+1], b: unfilt[idx+2], a: unfilt[idx+3] };
    }
  };
}

const l1 = decodePng('./public/EvacMaps/AtriumL1.png');
const l2 = decodePng('./public/EvacMaps/AtriumL2.png');

console.log('L1 size:', l1.width, l1.height);
console.log('L2 size:', l2.width, l2.height);

// Find stairs and escalator in L1 and L2
function findEscalatorAndStairs(img, name) {
  let stairsPts = [], escalPts = [];
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const p = img.getPixel(x, y);
      if (p.r > 190 && p.g > 150 && p.b > 70 && p.b < 160 && p.r > p.g) {
        if (y < 250 && x > 300 && x < 420) stairsPts.push({x, y});
        if (y > 350 && x > 300 && x < 420) escalPts.push({x, y});
      }
    }
  }
  const sX = stairsPts.reduce((s,p)=>s+p.x,0)/stairsPts.length;
  const sY = stairsPts.reduce((s,p)=>s+p.y,0)/stairsPts.length;
  const eX = escalPts.reduce((s,p)=>s+p.x,0)/escalPts.length;
  const eY = escalPts.reduce((s,p)=>s+p.y,0)/escalPts.length;
  console.log(`${name}: North Stairs/Feature: (${sX.toFixed(1)}, ${sY.toFixed(1)}), South Escalator: (${eX.toFixed(1)}, ${eY.toFixed(1)})`);
  console.log(`${name}: dy between stairs and escalator = ${(eY - sY).toFixed(1)} px, dx = ${(eX - sX).toFixed(1)} px`);
}

findEscalatorAndStairs(l1, 'L1');
findEscalatorAndStairs(l2, 'L2');
