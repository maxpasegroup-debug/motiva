/**
 * Reads public/logo.jpeg, removes near-background pixels (edge-estimated),
 * trims, exports public/logo.png with alpha.
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const inputPath = path.join(root, "public", "logo.jpeg");
const outputPath = path.join(root, "public", "logo.png");

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function getPx(buf, width, ch, x, y) {
  const i = (y * width + x) * ch;
  return [buf[i], buf[i + 1], buf[i + 2]];
}

const input = readFileSync(inputPath);
const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({
  resolveWithObject: true,
});

const { width, height, channels } = info;
const buf = new Uint8Array(data);
const ch = 4;

const edgeR = [];
const edgeG = [];
const edgeB = [];

for (let x = 0; x < width; x++) {
  const top = getPx(buf, width, ch, x, 0);
  const bot = getPx(buf, width, ch, x, height - 1);
  edgeR.push(top[0], bot[0]);
  edgeG.push(top[1], bot[1]);
  edgeB.push(top[2], bot[2]);
}
for (let y = 0; y < height; y++) {
  const left = getPx(buf, width, ch, 0, y);
  const right = getPx(buf, width, ch, width - 1, y);
  edgeR.push(left[0], right[0]);
  edgeG.push(left[1], right[1]);
  edgeB.push(left[2], right[2]);
}

const bgR = median(edgeR);
const bgG = median(edgeG);
const bgB = median(edgeB);

const THRESH = 42;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * ch;
    const r = buf[i];
    const g = buf[i + 1];
    const b = buf[i + 2];
    const dr = r - bgR;
    const dg = g - bgG;
    const db = b - bgB;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    buf[i + 3] = dist < THRESH ? 0 : 255;
  }
}

const png = await sharp(Buffer.from(buf), {
  raw: { width, height, channels: 4 },
})
  .png({ compressionLevel: 9, effort: 10, palette: false })
  .trim()
  .toBuffer();

writeFileSync(outputPath, png);
console.log("Wrote", outputPath, `(${width}x${height} → trimmed PNG)`);
