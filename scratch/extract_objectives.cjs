const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Unzip docx using node's built-in or simple unzipper
// Actually docx is a standard PKZip. Let's find entries using a simple PKZip parser.
function findInZip(buffer, filename) {
  let offset = 0;
  while (offset < buffer.length - 4) {
    if (buffer.readUInt32LE(offset) === 0x04034b50) { // Local file header signature
      const compMethod = buffer.readUInt16LE(offset + 8);
      const compSize = buffer.readUInt32LE(offset + 18);
      const uncompSize = buffer.readUInt32LE(offset + 22);
      const nameLen = buffer.readUInt16LE(offset + 26);
      const extraLen = buffer.readUInt16LE(offset + 28);
      const name = buffer.toString('utf8', offset + 30, offset + 30 + nameLen);
      const dataOffset = offset + 30 + nameLen + extraLen;
      if (name === filename) {
        const compressedData = buffer.slice(dataOffset, dataOffset + compSize);
        if (compMethod === 8) { // Deflate
          return zlib.inflateRawSync(compressedData);
        } else if (compMethod === 0) {
          return compressedData;
        }
      }
      offset = dataOffset + compSize;
    } else {
      offset++;
    }
  }
  return null;
}

const docxPaths = [
  'C:\\Users\\Fitz\\Documents\\THESIS\\Thesis Progress\\CSA3A-8.DOC.docx',
  'C:\\Users\\Fitz\\Documents\\THESIS\\Thesis Progress\\Chapter4 RESULTS AND DISCUSSION  draft.docx'
];

for (const docxPath of docxPaths) {
  if (fs.existsSync(docxPath)) {
    try {
      console.log('=== Checking:', docxPath);
      const buf = fs.readFileSync(docxPath);
    const xmlBuf = findInZip(buf, 'word/document.xml');
    if (xmlBuf) {
      const xml = xmlBuf.toString('utf8');
      const text = xml.replace(/<w:p[^>]*>/g, '\n').replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ');
      
      const sections = ['Statement of the Problem', 'Objectives of the Study', 'General Objective', 'Specific Objectives'];
      for (const sec of sections) {
        let idx = 0;
        while ((idx = text.toLowerCase().indexOf(sec.toLowerCase(), idx)) !== -1) {
          console.log(`\n================ FOUND "${sec}" at index ${idx} ================`);
          console.log(text.substring(idx, idx + 1800));
          idx += sec.length + 100;
        }
      }
    }
  } catch (err) {
    console.error('Error with ' + docxPath, err.message);
  }
  }
}
