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

const l2 = decodePng('./public/EvacMaps/AtriumL2.png');

function findTextCentroid(name, x1, y1, x2, y2) {
  let pts = [];
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      const p = l2.getPixel(x, y);
      if (p.r < 130 && p.g < 130 && p.b < 130 && Math.abs(p.r - p.g) < 20 && Math.abs(p.g - p.b) < 20 && p.a > 200) {
        pts.push({x, y});
      }
    }
  }
  if (!pts.length) {
    console.log(`${name.padEnd(25)}: no text found in [${x1},${y1},${x2},${y2}]`);
    return null;
  }
  const avgX = Math.round(pts.reduce((s,p)=>s+p.x,0)/pts.length);
  const avgY = Math.round(pts.reduce((s,p)=>s+p.y,0)/pts.length);
  // Add 7 to convert to L1 coordinate system (where x starts at 0 with 7px offset)
  const worldX = (avgX + 7) * 100;
  const worldY = avgY * 100;
  console.log(`${name.padEnd(25)} -> img: (${avgX}, ${avgY}) | world (scaled): (${worldX}, ${worldY}) pts=${pts.length}`);
  return { avgX, avgY, worldX, worldY };
}

console.log('--- FINDING L2 STORE CENTROIDS ---');
findTextCentroid('Furniture Republic', 50, 40, 220, 100);
findTextCentroid('Restroom L2', 130, 80, 230, 140);
findTextCentroid('Daiso Japan', 400, 40, 470, 100);
findTextCentroid('Casa Romantica', 480, 40, 640, 100);
findTextCentroid('San-Yang Furniture', 480, 160, 640, 250);
findTextCentroid('Japan Home Centre', 480, 250, 640, 340);
findTextCentroid('Ashley Furniture', 40, 400, 300, 460);
findTextCentroid('Dogs & The City', 400, 420, 450, 500);
findTextCentroid('Abenson', 460, 420, 520, 500);
findTextCentroid('Intellident Dental', 540, 420, 640, 500);
