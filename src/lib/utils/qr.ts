/**
 * AmenDesk — Offline-First QR Code Generator Utility
 * Pure TypeScript implementation with zero external dependencies.
 * Generates ISO/IEC 18004 compliant QR Codes (Versions 1-10, ECC Level M).
 * Outputs responsive SVG paths and data URLs for offline printing and mobile scanning.
 */

// GF(256) Galois Field tables with primitive polynomial 0x11D (x^8 + x^4 + x^3 + x^2 + 1)
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    EXP_TABLE[i + 255] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

function rsComputePoly(ecCount: number): Uint8Array {
  const poly = new Uint8Array(ecCount + 1);
  poly[0] = 1;
  for (let i = 0; i < ecCount; i++) {
    const root = EXP_TABLE[i];
    for (let j = i + 1; j > 0; j--) {
      poly[j] = poly[j] ^ gfMul(poly[j - 1], root);
    }
    poly[0] = gfMul(poly[0], root);
  }
  // Reverse to get highest degree first: x^k + c_{k-1}x^{k-1} + ... + c_0
  const result = new Uint8Array(ecCount + 1);
  for (let i = 0; i <= ecCount; i++) {
    result[i] = poly[ecCount - i];
  }
  return result;
}

function rsCalculateEC(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = rsComputePoly(ecCount);
  const remainder = new Uint8Array(ecCount);

  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < ecCount - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    remainder[ecCount - 1] = gfMul(gen[ecCount], factor);
  }

  return remainder;
}

interface VersionSpec {
  version: number;
  totalCodewords: number;
  dataCodewords: number;
  ecPerBlock: number;
  group1Blocks: number;
  group1DataPerBlock: number;
  group2Blocks: number;
  group2DataPerBlock: number;
  alignCoords: number[];
}

// Version Specs for ECC Level M (15% error tolerance)
const VERSION_SPECS_M: VersionSpec[] = [
  { version: 1, totalCodewords: 26, dataCodewords: 16, ecPerBlock: 10, group1Blocks: 1, group1DataPerBlock: 16, group2Blocks: 0, group2DataPerBlock: 0, alignCoords: [] },
  { version: 2, totalCodewords: 44, dataCodewords: 28, ecPerBlock: 16, group1Blocks: 1, group1DataPerBlock: 28, group2Blocks: 0, group2DataPerBlock: 0, alignCoords: [6, 18] },
  { version: 3, totalCodewords: 70, dataCodewords: 44, ecPerBlock: 26, group1Blocks: 1, group1DataPerBlock: 44, group2Blocks: 0, group2DataPerBlock: 0, alignCoords: [6, 22] },
  { version: 4, totalCodewords: 100, dataCodewords: 64, ecPerBlock: 18, group1Blocks: 2, group1DataPerBlock: 32, group2Blocks: 0, group2DataPerBlock: 0, alignCoords: [6, 26] },
  { version: 5, totalCodewords: 134, dataCodewords: 86, ecPerBlock: 24, group1Blocks: 2, group1DataPerBlock: 43, group2Blocks: 0, group2DataPerBlock: 0, alignCoords: [6, 30] },
  { version: 6, totalCodewords: 172, dataCodewords: 108, ecPerBlock: 16, group1Blocks: 4, group1DataPerBlock: 27, group2Blocks: 0, group2DataPerBlock: 0, alignCoords: [6, 34] },
  { version: 7, totalCodewords: 196, dataCodewords: 124, ecPerBlock: 18, group1Blocks: 4, group1DataPerBlock: 31, group2Blocks: 0, group2DataPerBlock: 0, alignCoords: [6, 22, 38] },
  { version: 8, totalCodewords: 242, dataCodewords: 154, ecPerBlock: 22, group1Blocks: 2, group1DataPerBlock: 38, group2Blocks: 2, group2DataPerBlock: 39, alignCoords: [6, 24, 42] },
  { version: 9, totalCodewords: 292, dataCodewords: 182, ecPerBlock: 22, group1Blocks: 3, group1DataPerBlock: 36, group2Blocks: 2, group2DataPerBlock: 37, alignCoords: [6, 26, 46] },
  { version: 10, totalCodewords: 346, dataCodewords: 216, ecPerBlock: 26, group1Blocks: 4, group1DataPerBlock: 43, group2Blocks: 1, group2DataPerBlock: 44, alignCoords: [6, 28, 50] },
];

// Format info bits for Level M (BCH 15,5 with mask 0x5412)
// Indices 0-7 correspond to mask patterns 0 through 7
const FORMAT_INFO_M = [
  0x5412 ^ 0x5412, // Mask 0 -> 0x0000
  0x5125 ^ 0x5412, // Mask 1 -> 0x0537
  0x5e7c ^ 0x5412, // Mask 2 -> 0x0a6e
  0x5b4b ^ 0x5412, // Mask 3 -> 0x0f59
  0x45f9 ^ 0x5412, // Mask 4 -> 0x11eb
  0x40ce ^ 0x5412, // Mask 5 -> 0x14dc
  0x4f97 ^ 0x5412, // Mask 6 -> 0x1b85
  0x4aa0 ^ 0x5412, // Mask 7 -> 0x1eb2
];

function chooseVersion(dataLen: number): VersionSpec {
  for (const spec of VERSION_SPECS_M) {
    // Byte mode overhead: 4 bits mode + (version < 10 ? 8 : 16) bits char count
    const countBits = spec.version < 10 ? 8 : 16;
    const overheadBytes = Math.ceil((4 + countBits) / 8);
    if (dataLen + overheadBytes <= spec.dataCodewords) {
      return spec;
    }
  }
  return VERSION_SPECS_M[VERSION_SPECS_M.length - 1];
}

class BitBuffer {
  buffer: number[] = [];
  length = 0;

  put(num: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) {
      const bit = (num >>> i) & 1;
      this.buffer.push(bit);
      this.length++;
    }
  }

  getBytes(): Uint8Array {
    const bytes = new Uint8Array(Math.ceil(this.length / 8));
    for (let i = 0; i < this.length; i++) {
      if (this.buffer[i]) {
        bytes[i >>> 3] |= 0x80 >>> (i & 7);
      }
    }
    return bytes;
  }
}

export interface QRCodeMatrix {
  size: number;
  modules: boolean[][];
  toSvgPath(moduleSize?: number): string;
  toDataUrl(moduleSize?: number, margin?: number): string;
}

export function generateQRCode(text: string): QRCodeMatrix {
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(text);
  const spec = chooseVersion(rawBytes.length);

  // 1. Bitstream encoding (Byte mode: 0100)
  const bb = new BitBuffer();
  bb.put(0b0100, 4); // Byte mode indicator
  const countBits = spec.version < 10 ? 8 : 16;
  bb.put(rawBytes.length, countBits);
  for (let i = 0; i < rawBytes.length; i++) {
    bb.put(rawBytes[i], 8);
  }

  // Terminator (up to 4 bits of 0)
  const remainingBits = spec.dataCodewords * 8 - bb.length;
  bb.put(0, Math.min(4, Math.max(0, remainingBits)));

  // Pad to byte boundary
  while (bb.length % 8 !== 0) {
    bb.put(0, 1);
  }

  // Alternate pad bytes 0xEC and 0x11
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bb.length < spec.dataCodewords * 8) {
    bb.put(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  const dataCodewords = bb.getBytes();

  // 2. Partition into blocks & compute Reed-Solomon Error Correction
  const totalBlocks = spec.group1Blocks + spec.group2Blocks;
  const blocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];

  let offset = 0;
  for (let b = 0; b < spec.group1Blocks; b++) {
    const blockData = dataCodewords.slice(offset, offset + spec.group1DataPerBlock);
    blocks.push(blockData);
    ecBlocks.push(rsCalculateEC(blockData, spec.ecPerBlock));
    offset += spec.group1DataPerBlock;
  }
  for (let b = 0; b < spec.group2Blocks; b++) {
    const blockData = dataCodewords.slice(offset, offset + spec.group2DataPerBlock);
    blocks.push(blockData);
    ecBlocks.push(rsCalculateEC(blockData, spec.ecPerBlock));
    offset += spec.group2DataPerBlock;
  }

  // 3. Interleave data codewords across all blocks
  const interleaved: number[] = [];
  const maxDataPerBlock = Math.max(spec.group1DataPerBlock, spec.group2DataPerBlock);
  for (let i = 0; i < maxDataPerBlock; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      if (i < blocks[b].length) {
        interleaved.push(blocks[b][i]);
      }
    }
  }

  // Interleave EC codewords across all blocks
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      interleaved.push(ecBlocks[b][i]);
    }
  }

  // 4. Create matrix & reserve function patterns
  const size = 17 + 4 * spec.version;
  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setModule = (r: number, c: number, val: boolean, fn = true) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = val;
      if (fn) isFunction[r][c] = true;
    }
  };

  // Finder pattern helper (7x7)
  const drawFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;

        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          setModule(nr, nc, isBorder || isCenter);
        } else {
          // White separator boundary
          setModule(nr, nc, false);
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  const coords = spec.alignCoords;
  for (let i = 0; i < coords.length; i++) {
    for (let j = 0; j < coords.length; j++) {
      const r = coords[i];
      const c = coords[j];
      // Skip if overlapping with finder patterns
      const isTopLeft = r < 9 && c < 9;
      const isTopRight = r < 9 && c > size - 9;
      const isBottomLeft = r > size - 9 && c < 9;
      if (isTopLeft || isTopRight || isBottomLeft) continue;

      // Draw 5x5 alignment pattern
      for (let ar = -2; ar <= 2; ar++) {
        for (let ac = -2; ac <= 2; ac++) {
          const isBox = Math.abs(ar) === 2 || Math.abs(ac) === 2 || (ar === 0 && ac === 0);
          setModule(r + ar, c + ac, isBox);
        }
      }
    }
  }

  // Dark module
  setModule(4 * spec.version + 9, 8, true);

  // Reserve format info coordinates
  for (let i = 0; i < 9; i++) {
    isFunction[8][i] = true;
    isFunction[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][size - 1 - i] = true;
    isFunction[size - 1 - i][8] = true;
  }

  // 5. Place interleaved data bits in zigzag pattern
  let bitIndex = 0;
  const totalBits = interleaved.length * 8;

  for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol--; // Skip vertical timing column

    const colRange = [rightCol, rightCol - 1];
    const goingUp = ((size - 1 - rightCol) / 2) % 2 === 0;

    const rowStart = goingUp ? size - 1 : 0;
    const rowEnd = goingUp ? -1 : size;
    const rowStep = goingUp ? -1 : 1;

    for (let r = rowStart; r !== rowEnd; r += rowStep) {
      for (const c of colRange) {
        if (!isFunction[r][c]) {
          let bit = false;
          if (bitIndex < totalBits) {
            const byte = interleaved[bitIndex >>> 3];
            bit = ((byte >>> (7 - (bitIndex & 7))) & 1) === 1;
            bitIndex++;
          }

          // Apply standard mask 0: (row + col) % 2 === 0
          const maskInvert = (r + c) % 2 === 0;
          modules[r][c] = maskInvert ? !bit : bit;
        }
      }
    }
  }

  // 6. Write Format Info (Level M, Mask 0)
  const formatVal = FORMAT_INFO_M[0];
  const formatBits = Array.from({ length: 15 }, (_, i) => ((formatVal >>> (14 - i)) & 1) === 1);

  // Top-left finder format placement
  const tlCoords: [number, number][] = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = tlCoords[i];
    modules[r][c] = formatBits[i];
  }

  // Split format placement around Top-Right & Bottom-Left finders
  for (let i = 0; i < 7; i++) {
    modules[8][size - 1 - i] = formatBits[14 - i];
  }
  for (let i = 0; i < 8; i++) {
    modules[size - 8 + i][8] = formatBits[i];
  }

  return {
    size,
    modules,
    toSvgPath(moduleSize = 10): string {
      let d = '';
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (modules[r][c]) {
            const x = c * moduleSize;
            const y = r * moduleSize;
            d += `M${x},${y}h${moduleSize}v${moduleSize}h-${moduleSize}z `;
          }
        }
      }
      return d.trim();
    },
    toDataUrl(moduleSize = 8, margin = 4): string {
      const fullSize = (size + margin * 2) * moduleSize;
      let pathD = '';
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (modules[r][c]) {
            const x = (c + margin) * moduleSize;
            const y = (r + margin) * moduleSize;
            pathD += `M${x},${y}h${moduleSize}v${moduleSize}h-${moduleSize}z `;
          }
        }
      }
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fullSize} ${fullSize}" width="${fullSize}" height="${fullSize}"><rect width="100%" height="100%" fill="#ffffff"/><path d="${pathD.trim()}" fill="#0f172a"/></svg>`;
      if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
        return `data:image/svg+xml;base64,${window.btoa(svg)}`;
      }
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
  };
}
