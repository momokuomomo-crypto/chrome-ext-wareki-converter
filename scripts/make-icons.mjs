/**
 * アイコン生成。外部素材に依存しないよう、最小限のPNGをその場で書き出す。
 * 依存を増やさないため zlib だけで PNG を組み立てる。
 */
import { deflateSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** 角丸なしの単色背景に、中央へ白い横棒2本（"年" を模した簡素な意匠） */
function makePng(size) {
  const bg = [0x8b, 0x2f, 0x4a];
  const fg = [0xff, 0xff, 0xff];
  const rows = [];
  const barTop1 = Math.round(size * 0.34);
  const barTop2 = Math.round(size * 0.58);
  const barH = Math.max(1, Math.round(size * 0.09));
  const barL = Math.round(size * 0.22);
  const barR = size - barL;

  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    row[0] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const inBar =
        ((y >= barTop1 && y < barTop1 + barH) || (y >= barTop2 && y < barTop2 + barH)) &&
        x >= barL &&
        x < barR;
      const c = inBar ? fg : bg;
      row[1 + x * 3] = c[0];
      row[1 + x * 3 + 1] = c[1];
      row[1 + x * 3 + 2] = c[2];
    }
    rows.push(row);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

await mkdir("icons", { recursive: true });
for (const size of [16, 48, 128]) {
  await writeFile(`icons/icon${size}.png`, makePng(size));
}
console.log("icons: done");
