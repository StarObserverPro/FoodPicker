(() => {
  'use strict';

  const VERSION = 5;
  const SIZE = VERSION * 4 + 17;
  const DATA_CODEWORDS = 108;
  const ECC_CODEWORDS = 26;
  const MAX_BYTES = 106;
  const ALIGNMENT_POSITIONS = [6, 30];

  const EXP = new Uint8Array(512);
  const LOG = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < EXP.length; i += 1) EXP[i] = EXP[i - 255];

  function gfMultiply(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[LOG[a] + LOG[b]];
  }

  function multiplyPolynomials(a, b) {
    const out = new Uint8Array(a.length + b.length - 1);
    for (let i = 0; i < a.length; i += 1) {
      for (let j = 0; j < b.length; j += 1) {
        out[i + j] ^= gfMultiply(a[i], b[j]);
      }
    }
    return out;
  }

  function generatorPolynomial(degree) {
    let result = new Uint8Array([1]);
    for (let i = 0; i < degree; i += 1) {
      result = multiplyPolynomials(result, new Uint8Array([1, EXP[i]]));
    }
    return result;
  }

  const GENERATOR = generatorPolynomial(ECC_CODEWORDS);

  function reedSolomonRemainder(data) {
    const result = new Uint8Array(ECC_CODEWORDS);
    for (const value of data) {
      const factor = value ^ result[0];
      result.copyWithin(0, 1);
      result[result.length - 1] = 0;
      for (let i = 0; i < result.length; i += 1) {
        result[i] ^= gfMultiply(GENERATOR[i + 1], factor);
      }
    }
    return result;
  }

  function utf8Bytes(text) {
    if (typeof TextEncoder !== 'undefined') return Array.from(new TextEncoder().encode(text));
    const escaped = unescape(encodeURIComponent(text));
    return Array.from(escaped, char => char.charCodeAt(0));
  }

  function appendBits(target, value, length) {
    for (let i = length - 1; i >= 0; i -= 1) target.push((value >>> i) & 1);
  }

  function makeCodewords(text) {
    const bytes = utf8Bytes(String(text));
    if (bytes.length > MAX_BYTES) throw new Error(`QR payload is too long (${bytes.length}/${MAX_BYTES} bytes)`);

    const bits = [];
    appendBits(bits, 0x4, 4);
    appendBits(bits, bytes.length, 8);
    bytes.forEach(byte => appendBits(bits, byte, 8));

    const capacity = DATA_CODEWORDS * 8;
    appendBits(bits, 0, Math.min(4, capacity - bits.length));
    while (bits.length % 8) bits.push(0);

    const data = [];
    for (let i = 0; i < bits.length; i += 8) {
      let value = 0;
      for (let j = 0; j < 8; j += 1) value = (value << 1) | bits[i + j];
      data.push(value);
    }
    for (let pad = 0; data.length < DATA_CODEWORDS; pad += 1) data.push(pad % 2 === 0 ? 0xec : 0x11);

    const ecc = reedSolomonRemainder(Uint8Array.from(data));
    return Uint8Array.from([...data, ...ecc]);
  }

  function blankMatrix() {
    return {
      modules: Array.from({ length: SIZE }, () => Array(SIZE).fill(false)),
      functionModules: Array.from({ length: SIZE }, () => Array(SIZE).fill(false))
    };
  }

  function setFunction(qr, col, row, dark) {
    if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return;
    qr.modules[row][col] = Boolean(dark);
    qr.functionModules[row][col] = true;
  }

  function drawFinder(qr, centerCol, centerRow) {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        setFunction(qr, centerCol + dx, centerRow + dy, distance !== 2 && distance !== 4);
      }
    }
  }

  function drawAlignment(qr, centerCol, centerRow) {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        setFunction(qr, centerCol + dx, centerRow + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  function getBit(value, index) {
    return ((value >>> index) & 1) !== 0;
  }

  function formatBits(mask) {
    const data = (1 << 3) | mask; // Error correction level L = 01.
    let remainder = data;
    for (let i = 0; i < 10; i += 1) remainder = (remainder << 1) ^ (((remainder >>> 9) & 1) * 0x537);
    return ((data << 10) | remainder) ^ 0x5412;
  }

  function drawFormat(qr, mask) {
    const bits = formatBits(mask);
    for (let i = 0; i <= 5; i += 1) setFunction(qr, 8, i, getBit(bits, i));
    setFunction(qr, 8, 7, getBit(bits, 6));
    setFunction(qr, 8, 8, getBit(bits, 7));
    setFunction(qr, 7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i += 1) setFunction(qr, 14 - i, 8, getBit(bits, i));

    for (let i = 0; i < 8; i += 1) setFunction(qr, SIZE - 1 - i, 8, getBit(bits, i));
    for (let i = 8; i < 15; i += 1) setFunction(qr, 8, SIZE - 15 + i, getBit(bits, i));
    setFunction(qr, 8, SIZE - 8, true);
  }

  function drawFunctionPatterns(qr, mask) {
    for (let i = 0; i < SIZE; i += 1) {
      setFunction(qr, 6, i, i % 2 === 0);
      setFunction(qr, i, 6, i % 2 === 0);
    }

    drawFinder(qr, 3, 3);
    drawFinder(qr, SIZE - 4, 3);
    drawFinder(qr, 3, SIZE - 4);

    for (let rowIndex = 0; rowIndex < ALIGNMENT_POSITIONS.length; rowIndex += 1) {
      for (let colIndex = 0; colIndex < ALIGNMENT_POSITIONS.length; colIndex += 1) {
        const overlapsFinder = (rowIndex === 0 && colIndex === 0)
          || (rowIndex === 0 && colIndex === ALIGNMENT_POSITIONS.length - 1)
          || (rowIndex === ALIGNMENT_POSITIONS.length - 1 && colIndex === 0);
        if (!overlapsFinder) drawAlignment(qr, ALIGNMENT_POSITIONS[colIndex], ALIGNMENT_POSITIONS[rowIndex]);
      }
    }

    drawFormat(qr, mask);
  }

  function maskCondition(mask, col, row) {
    switch (mask) {
      case 0: return (row + col) % 2 === 0;
      case 1: return row % 2 === 0;
      case 2: return col % 3 === 0;
      case 3: return (row + col) % 3 === 0;
      case 4: return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
      case 5: return ((row * col) % 2) + ((row * col) % 3) === 0;
      case 6: return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
      case 7: return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
      default: return false;
    }
  }

  function drawCodewords(qr, codewords, mask) {
    let bitIndex = 0;
    let upward = true;
    for (let right = SIZE - 1; right >= 1; right -= 2) {
      if (right === 6) right -= 1;
      for (let vert = 0; vert < SIZE; vert += 1) {
        const row = upward ? SIZE - 1 - vert : vert;
        for (let offset = 0; offset < 2; offset += 1) {
          const col = right - offset;
          if (qr.functionModules[row][col]) continue;
          let dark = false;
          if (bitIndex < codewords.length * 8) {
            dark = getBit(codewords[bitIndex >>> 3], 7 - (bitIndex & 7));
            bitIndex += 1;
          }
          qr.modules[row][col] = dark !== maskCondition(mask, col, row);
        }
      }
      upward = !upward;
    }
  }

  function runPenalty(line) {
    let penalty = 0;
    let runColor = line[0];
    let runLength = 1;
    for (let i = 1; i < line.length; i += 1) {
      if (line[i] === runColor) {
        runLength += 1;
        if (runLength === 5) penalty += 3;
        else if (runLength > 5) penalty += 1;
      } else {
        runColor = line[i];
        runLength = 1;
      }
    }
    return penalty;
  }

  function finderPenalty(line) {
    let penalty = 0;
    const value = line.map(item => item ? '1' : '0').join('');
    for (let i = 0; i <= value.length - 7; i += 1) {
      if (value.slice(i, i + 7) !== '1011101') continue;
      const before = value.slice(Math.max(0, i - 4), i).padStart(4, '0');
      const after = value.slice(i + 7, i + 11).padEnd(4, '0');
      if (before === '0000' || after === '0000') penalty += 40;
    }
    return penalty;
  }

  function penaltyScore(modules) {
    let penalty = 0;
    let dark = 0;
    for (let row = 0; row < SIZE; row += 1) {
      const rowLine = modules[row];
      const colLine = modules.map(line => line[row]);
      penalty += runPenalty(rowLine) + runPenalty(colLine);
      penalty += finderPenalty(rowLine) + finderPenalty(colLine);
      dark += rowLine.filter(Boolean).length;
    }
    for (let row = 0; row < SIZE - 1; row += 1) {
      for (let col = 0; col < SIZE - 1; col += 1) {
        const color = modules[row][col];
        if (modules[row][col + 1] === color && modules[row + 1][col] === color && modules[row + 1][col + 1] === color) penalty += 3;
      }
    }
    penalty += Math.floor(Math.abs(dark * 20 - SIZE * SIZE * 10) / (SIZE * SIZE)) * 10;
    return penalty;
  }

  function matrix(text) {
    const codewords = makeCodewords(text);
    let bestModules = null;
    let bestPenalty = Infinity;
    for (let mask = 0; mask < 8; mask += 1) {
      const qr = blankMatrix();
      drawFunctionPatterns(qr, mask);
      drawCodewords(qr, codewords, mask);
      const penalty = penaltyScore(qr.modules);
      if (penalty < bestPenalty) {
        bestPenalty = penalty;
        bestModules = qr.modules;
      }
    }
    return bestModules;
  }

  function paint(context, text, xPosition, yPosition, size, options = {}) {
    const modules = matrix(text);
    const quiet = Number.isFinite(options.quiet) ? options.quiet : 4;
    const dark = options.dark || '#181512';
    const light = options.light || '#ffffff';
    const moduleSize = Math.max(1, Math.floor(size / (modules.length + quiet * 2)));
    const actualSize = moduleSize * (modules.length + quiet * 2);
    const left = Math.round(xPosition + (size - actualSize) / 2);
    const top = Math.round(yPosition + (size - actualSize) / 2);

    context.save();
    context.imageSmoothingEnabled = false;
    context.fillStyle = light;
    context.fillRect(left, top, actualSize, actualSize);
    context.fillStyle = dark;
    for (let row = 0; row < modules.length; row += 1) {
      for (let col = 0; col < modules.length; col += 1) {
        if (modules[row][col]) {
          context.fillRect(left + (col + quiet) * moduleSize, top + (row + quiet) * moduleSize, moduleSize, moduleSize);
        }
      }
    }
    context.restore();
    return { left, top, size: actualSize, moduleSize };
  }

  globalThis.FoodPickerQR = Object.freeze({ matrix, paint, version: VERSION, maxBytes: MAX_BYTES });
})();
