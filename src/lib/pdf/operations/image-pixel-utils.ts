import { zlibSync } from "fflate";

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function calculateCrc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type: string, data: Uint8Array): Uint8Array {
  const len = data.length;
  const chunk = new Uint8Array(4 + 4 + len + 4);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, len, false);
  for (let i = 0; i < 4; i++) chunk[4 + i] = type.charCodeAt(i);
  chunk.set(data, 8);
  const crcVal = calculateCrc32(chunk.subarray(4, 8 + len));
  view.setUint32(8 + len, crcVal, false);
  return chunk;
}

export function encodeRgbaToPng(
  rgba: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number
): Uint8Array {
  const scanlineLength = width * 4 + 1;
  const raw = new Uint8Array(scanlineLength * height);
  for (let y = 0; y < height; y++) {
    raw[y * scanlineLength] = 0; // Filter 0 (None)
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * scanlineLength + 1);
  }
  const compressed = zlibSync(raw);

  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width, false);
  ihdrView.setUint32(4, height, false);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const header = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makePngChunk("IHDR", ihdr);
  const idatChunk = makePngChunk("IDAT", compressed);
  const iendChunk = makePngChunk("IEND", new Uint8Array(0));

  const totalLen = header.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
  const png = new Uint8Array(totalLen);
  let offset = 0;
  png.set(header, offset);
  offset += header.length;
  png.set(ihdrChunk, offset);
  offset += ihdrChunk.length;
  png.set(idatChunk, offset);
  offset += idatChunk.length;
  png.set(iendChunk, offset);

  return png;
}

export function convertRawPixelsToRgba(
  raw: Uint8Array,
  width: number,
  height: number,
  smask?: Uint8Array
): Uint8ClampedArray {
  const totalPixels = width * height;
  const rgba = new Uint8ClampedArray(totalPixels * 4);

  // If already 4 channels (RGBA)
  if (raw.length >= totalPixels * 4) {
    rgba.set(raw.subarray(0, totalPixels * 4));
    return rgba;
  }

  // 3 channels (RGB)
  if (raw.length >= totalPixels * 3) {
    for (let i = 0, j = 0, p = 0; p < totalPixels; i += 3, j += 4, p++) {
      rgba[j] = raw[i];
      rgba[j + 1] = raw[i + 1];
      rgba[j + 2] = raw[i + 2];
      rgba[j + 3] = smask && p < smask.length ? smask[p] : 255;
    }
    return rgba;
  }

  // 1 channel (Grayscale)
  for (let i = 0, j = 0; i < totalPixels && i < raw.length; i++, j += 4) {
    const val = raw[i];
    rgba[j] = val;
    rgba[j + 1] = val;
    rgba[j + 2] = val;
    rgba[j + 3] = smask && i < smask.length ? smask[i] : 255;
  }
  return rgba;
}

export function createPreviewUrl(bytes: Uint8Array, mime: string): string {
  if (typeof window !== "undefined" && typeof URL !== "undefined" && URL.createObjectURL) {
    return URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime }));
  }
  // Node fallback for unit tests
  const b64 = Buffer.from(bytes).toString("base64");
  return `data:${mime};base64,${b64}`;
}
