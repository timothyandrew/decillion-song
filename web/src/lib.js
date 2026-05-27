const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const SCALES = [
  [10n ** 100n, 'googol'],
  [10n ** 63n, 'vigintillion'],
  [10n ** 60n, 'novemdecillion'],
  [10n ** 57n, 'octodecillion'],
  [10n ** 54n, 'septendecillion'],
  [10n ** 51n, 'sexdecillion'],
  [10n ** 48n, 'quindecillion'],
  [10n ** 45n, 'quattuordecillion'],
  [10n ** 42n, 'tredecillion'],
  [10n ** 39n, 'duodecillion'],
  [10n ** 36n, 'undecillion'],
  [10n ** 33n, 'decillion'],
  [10n ** 30n, 'nonillion'],
  [10n ** 27n, 'octillion'],
  [10n ** 24n, 'septillion'],
  [10n ** 21n, 'sextillion'],
  [10n ** 18n, 'quintillion'],
  [10n ** 15n, 'quadrillion'],
  [10n ** 12n, 'trillion'],
  [10n ** 9n, 'billion'],
  [10n ** 6n, 'million'],
  [1000n, 'thousand'],
  [100n, 'hundred'],
];

const ONES_LEN = ONES.map((w) => w.length);
const TENS_LEN = TENS.map((w) => w.length);

export function numberToWords(n) {
  n = BigInt(n);
  if (n < 20n) return ONES[Number(n)];
  if (n < 100n) {
    const t = Number(n / 10n);
    const o = Number(n % 10n);
    return TENS[t] + (o ? `-${ONES[o]}` : '');
  }
  for (const [value, name] of SCALES) {
    if (n >= value) {
      const high = n / value;
      const low = n % value;
      let result = `${numberToWords(high)} ${name}`;
      if (low > 0n) {
        const joiner = value === 100n || low < 100n ? ' and ' : ' ';
        result += joiner + numberToWords(low);
      }
      return result;
    }
  }
  throw new Error(`number too large: ${n}`);
}

function wordLen(n) {
  n = BigInt(n);
  if (n < 20n) return BigInt(ONES_LEN[Number(n)]);
  if (n < 100n) {
    const t = Number(n / 10n);
    const o = Number(n % 10n);
    return BigInt(TENS_LEN[t] + (o === 0 ? 0 : 1 + ONES_LEN[o]));
  }
  for (const [value, name] of SCALES) {
    if (n >= value) {
      const high = n / value;
      const low = n % value;
      let res = wordLen(high) + 1n + BigInt(name.length);
      if (low > 0n) {
        const joiner = value === 100n || low < 100n ? 5n : 1n;
        res += joiner + wordLen(low);
      }
      return res;
    }
  }
  throw new Error();
}

const cumCache = new Map();

function cumWordLen(N) {
  N = BigInt(N);
  if (N <= 0n) return 0n;
  const cached = cumCache.get(N);
  if (cached !== undefined) return cached;
  const result = cumWordLenCompute(N);
  cumCache.set(N, result);
  return result;
}

function cumWordLenCompute(N) {
  if (N < 20n) {
    let s = 0n;
    for (let i = 1; i <= Number(N); i++) s += BigInt(ONES_LEN[i]);
    return s;
  }
  if (N < 100n) {
    const tMax = Number(N / 10n);
    const oMax = Number(N % 10n);
    let total = 0n;
    for (let i = 1; i < 20; i++) total += BigInt(ONES_LEN[i]);
    let onesExtras = 0n;
    for (let o = 1; o < 10; o++) onesExtras += BigInt(1 + ONES_LEN[o]);
    for (let t = 2; t < tMax; t++) {
      total += 10n * BigInt(TENS_LEN[t]) + onesExtras;
    }
    total += BigInt(oMax + 1) * BigInt(TENS_LEN[tMax]);
    for (let o = 1; o <= oMax; o++) total += BigInt(1 + ONES_LEN[o]);
    return total;
  }
  for (const [value, name] of SCALES) {
    if (N >= value) return cumWithScale(N, value, name);
  }
  throw new Error();
}

function joinerSumFull(V) {
  if (V === 100n) return 495n;
  return 495n + (V - 100n);
}

function joinerSumPartial(V, rMax) {
  if (V === 100n || rMax < 100n) return 5n * rMax;
  return 495n + (rMax - 99n);
}

function cumWithScale(N, V, name) {
  const hMax = N / V;
  const rMax = N % V;
  const namePart = 1n + BigInt(name.length);
  const blockBelow = cumWordLen(V - 1n);
  let total = blockBelow;
  if (hMax >= 2n) {
    total += V * cumWordLen(hMax - 1n);
    total += (hMax - 1n) * (V * namePart + joinerSumFull(V) + blockBelow);
  }
  total += (rMax + 1n) * (wordLen(hMax) + namePart);
  total += joinerSumPartial(V, rMax) + cumWordLen(rMax);
  return total;
}

function bottlesPhrase(n) {
  n = BigInt(n);
  const word = numberToWords(n);
  return n === 1n ? `${word} green bottle` : `${word} green bottles`;
}

export function* songLines(N, maxLines = Infinity) {
  N = BigInt(N);
  if (N === 0n) return;
  let emitted = 0;
  let first = true;
  for (let i = N; i >= 1n; i -= 1n) {
    if (!first) {
      yield '';
      emitted += 1;
      if (emitted >= maxLines) return;
    }
    first = false;
    const current = bottlesPhrase(i);
    const remaining = i === 1n ? 'no green bottles' : bottlesPhrase(i - 1n);
    const currentCap = current[0].toUpperCase() + current.slice(1);
    const lines = [
      `${currentCap} hanging on the wall,`,
      `${currentCap} hanging on the wall,`,
      'And if one green bottle should accidentally fall,',
      `There'll be ${remaining} hanging on the wall.`,
    ];
    for (const line of lines) {
      yield line;
      emitted += 1;
      if (emitted >= maxLines) return;
    }
  }
}

export const LINES_PER_PAGE = 50n;

export function getStats(N) {
  N = BigInt(N);
  if (N === 0n) return { verses: 0n, lines: 0n, pages: 0n, bytes: 0n };
  const cwN = cumWordLen(N);
  const cwNm1 = cumWordLen(N - 1n);
  const bytes = 2n * cwN + cwNm1 + 170n * N + (N >= 2n ? N - 2n : 0n);
  const lines = 5n * N - 1n;
  const pages = (lines + LINES_PER_PAGE - 1n) / LINES_PER_PAGE;
  return { verses: N, lines, pages, bytes };
}

const BYTE_UNITS = [
  'bytes', 'kilobytes', 'megabytes', 'gigabytes', 'terabytes',
  'petabytes', 'exabytes', 'zettabytes', 'yottabytes', 'ronnabytes', 'quettabytes',
];

export function formatBytes(b) {
  b = BigInt(b);
  if (b < 1024n) return `${b} ${b === 1n ? 'byte' : 'bytes'}`;
  let divisor = 1024n;
  let unitIndex = 1;
  const maxIdx = BYTE_UNITS.length - 1;
  while (unitIndex < maxIdx && b / divisor >= 1024n) {
    divisor *= 1024n;
    unitIndex += 1;
  }
  const scaled = (b * 100n) / divisor;
  const whole = scaled / 100n;
  const wholeStr = whole.toString();
  if (wholeStr.length > 50) {
    let exp = wholeStr.length - 1;
    const head = wholeStr.slice(0, 5).padEnd(5, '0');
    let rounded = Math.round(Number(head) / 10);
    if (rounded >= 10000) {
      rounded = Math.round(rounded / 10);
      exp += 1;
    }
    const mantissaStr = rounded.toString().padStart(4, '0');
    const mantissa = `${mantissaStr[0]}.${mantissaStr.slice(1)}`;
    return `${mantissa}e+${exp} ${BYTE_UNITS[unitIndex]}`;
  }
  const frac = scaled % 100n;
  const fracStr = frac < 10n ? `0${frac}` : `${frac}`;
  return `${formatBigInt(whole)}.${fracStr} ${BYTE_UNITS[unitIndex]}`;
}

export function formatBigInt(n) {
  return BigInt(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const BOTTLE_MASS_KG = 0.2;
const EARTH_MASS_KG = 5.972e24;
const SUN_MASS_KG = 1.989e30;
const CHARS_PER_SECOND_SPEAKING = 15;
const SECONDS_PER_YEAR = 31_557_600;
const AGE_OF_UNIVERSE_YEARS = 1.38e10;
const A4_HEIGHT_METERS = 0.297;
const EARTH_EQUATOR_METERS = 4.0075e7;
const EARTH_TO_MOON_METERS = 3.844e8;
const LIGHT_YEAR_METERS = 9.461e15;
const BYTES_PER_TB = 1e12;
const TOTAL_WORLD_DATA_BYTES = 1.81e23;

export function getWhimsy(stats, N) {
  const bytes = bigIntToFloat(stats.bytes);
  const pages = bigIntToFloat(stats.pages);
  const n = bigIntToFloat(N);
  const seconds = bytes / CHARS_PER_SECOND_SPEAKING;
  const stackHeight = pages * 0.0001;
  const lineLength = pages * A4_HEIGHT_METERS;
  return {
    hardDrives: bytes / BYTES_PER_TB,
    worldDataMultiple: bytes / TOTAL_WORLD_DATA_BYTES,
    readingYears: seconds / SECONDS_PER_YEAR,
    universesOfReading: seconds / SECONDS_PER_YEAR / AGE_OF_UNIVERSE_YEARS,
    earthMassesOfGlass: (n * BOTTLE_MASS_KG) / EARTH_MASS_KG,
    sunMassesOfGlass: (n * BOTTLE_MASS_KG) / SUN_MASS_KG,
    stackHeightMeters: stackHeight,
    stackToMoon: stackHeight / EARTH_TO_MOON_METERS,
    stackInLightYears: stackHeight / LIGHT_YEAR_METERS,
    paperEquatorLoops: lineLength / EARTH_EQUATOR_METERS,
  };
}

function bigIntToFloat(n) {
  n = BigInt(n);
  if (n === 0n) return 0;
  const s = n.toString();
  if (s.length <= 15) return Number(n);
  const lead = Number(s.slice(0, 15));
  const exp = s.length - 15;
  return lead * Math.pow(10, exp);
}

export function formatWhimsy(x) {
  if (x === 0) return '0';
  if (!Number.isFinite(x)) return x > 0 ? '∞' : '−∞';
  const negative = x < 0;
  const abs = Math.abs(x);
  if (abs < 1e-3) return x.toExponential(3);
  if (abs < 1) return x.toFixed(3);
  if (abs < 1000) return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (abs < 1e16) {
    return (negative ? '-' : '') + Math.round(abs).toLocaleString();
  }
  const [mantissa, expPart] = abs.toExponential(3).split('e');
  const exp = parseInt(expPart, 10);
  if (exp + 1 > 50) return (negative ? '-' : '') + abs.toExponential(3);
  const [intPart, frac = ''] = mantissa.split('.');
  const allDigits = intPart + frac;
  const intStr = allDigits + '0'.repeat(Math.max(0, exp + 1 - allDigits.length));
  const withCommas = intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (negative ? '-' : '') + withCommas;
}
