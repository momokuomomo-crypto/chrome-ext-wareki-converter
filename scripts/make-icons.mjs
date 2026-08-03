/**
 * アイコン生成。外部素材・画像ライブラリに依存しないよう、その場で PNG を書き出す。
 * 依存を増やさないため zlib だけで PNG を組み立てる。
 *
 * 意匠：小豆色の角丸正方形に、白い双方向の矢印（上段は右向き、下段は左向き）。
 * 西暦と和暦を**相互に**変換することを一目で示す。
 *
 * 当初は横棒2本だけの仮アイコンだった。ストア一覧では 128px が商品の顔になり、
 * 横棒2本では何のツールか伝わらないため作り直した。
 *
 * 描画は 4 倍の解像度で行い、縮小時に平均を取る（スーパーサンプリング）。
 * 16px の角丸と矢印の斜辺はアンチエイリアスなしでは階段状になる。
 * アルファチャンネルを持たせ、角の外側は透過にする（濃い背景に置いても角が四角く残らない）。
 */
import { deflateSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";

/** 1 辺あたりの分割数。4 なら 1 画素につき 16 点を平均する。 */
const SUPERSAMPLE = 4;

const BRAND = [0x8b, 0x2f, 0x4a];
const WHITE = [0xff, 0xff, 0xff];

function crc32(buf) {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
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
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/**
 * 角丸長方形の内側か。座標は 0〜1 の正規化値。
 * 点を内側の長方形へ寄せ、その最近点からの距離で判定する（角では円弧になる）。
 */
function insideRoundedRect(u, v, x0, y0, x1, y1, r) {
  const cx = Math.min(Math.max(u, x0 + r), x1 - r);
  const cy = Math.min(Math.max(v, y0 + r), y1 - r);
  const dx = u - cx;
  const dy = v - cy;
  return dx * dx + dy * dy <= r * r;
}

/** 右向きの矢印。軸と三角形の頭で構成する。 */
function insideArrowRight(u, v, centerY) {
  const shaftHalf = 0.075; // 16px でも 1 画素を割らない太さ
  const headHalf = 0.18;
  const tailX = 0.16;
  const headX = 0.54;
  const tipX = 0.84;

  if (u >= tailX && u <= headX) return Math.abs(v - centerY) <= shaftHalf;
  if (u >= headX && u <= tipX) {
    const remaining = (tipX - u) / (tipX - headX); // 先端へ向かって 0 に収束する
    return Math.abs(v - centerY) <= headHalf * remaining;
  }
  return false;
}

/**
 * 両端に頭を持つ 1 本の矢印。小さいサイズ用の簡略形。
 *
 * 16px でツールバーに出るときは、矢印 2 本では軸も頭も 1〜2 画素に落ちて
 * 判別できない塊になる。線を太くし、要素を 1 つに減らす。
 */
function insideDoubleArrow(u, v) {
  const shaftHalf = 0.11;
  const headHalf = 0.3;
  const shaftFrom = 0.2;
  const shaftTo = 0.8;
  const headFrom = 0.62;
  const tipX = 0.9;

  const dv = Math.abs(v - 0.5);
  if (u >= shaftFrom && u <= shaftTo && dv <= shaftHalf) return true;

  // 左右対称なので、右半分の判定へ折り返して両端の頭を得る
  const mirrored = Math.max(u, 1 - u);
  if (mirrored >= headFrom && mirrored <= tipX) {
    const remaining = (tipX - mirrored) / (tipX - headFrom);
    return dv <= headHalf * remaining;
  }
  return false;
}

/** 上段は右向き、下段は左向き。左向きは左右反転で得る。 */
function insideOpposingArrows(u, v) {
  return insideArrowRight(u, v, 0.33) || insideArrowRight(1 - u, v, 0.67);
}

/** 小さいサイズは簡略形へ切り替える。境界は 32px（48px 以上は 2 本でも読める）。 */
function foregroundAt(u, v, size) {
  return size < 32 ? insideDoubleArrow(u, v) : insideOpposingArrows(u, v);
}

function makePng(size) {
  const rows = [];
  const samples = SUPERSAMPLE * SUPERSAMPLE;

  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      let covered = 0;
      let r = 0;
      let g = 0;
      let b = 0;

      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const u = (x + (sx + 0.5) / SUPERSAMPLE) / size;
          const v = (y + (sy + 0.5) / SUPERSAMPLE) / size;
          if (!insideRoundedRect(u, v, 0.02, 0.02, 0.98, 0.98, 0.22)) continue;
          covered += 1;
          const c = foregroundAt(u, v, size) ? WHITE : BRAND;
          r += c[0];
          g += c[1];
          b += c[2];
        }
      }

      const i = 1 + x * 4;
      if (covered > 0) {
        row[i] = Math.round(r / covered);
        row[i + 1] = Math.round(g / covered);
        row[i + 2] = Math.round(b / covered);
      }
      row[i + 3] = Math.round((255 * covered) / samples);
    }
    rows.push(row);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: truecolor + alpha
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

await mkdir("icons", { recursive: true });
for (const size of [16, 48, 128]) {
  await writeFile(`icons/icon${size}.png`, makePng(size));
}
console.log("icons: done");
