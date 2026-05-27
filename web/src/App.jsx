import { useMemo, useState } from 'react';
import {
  numberToWords,
  getStats,
  songLines,
  formatBytes,
  formatBigInt,
  getWhimsy,
  formatWhimsy,
} from './lib.js';

const MAX_PREVIEW = 500;
const DEFAULT_N = (10n ** 33n).toString();

export default function App() {
  const [nText, setNText] = useState(DEFAULT_N);
  const [previewLines, setPreviewLines] = useState(20);

  const parsed = useMemo(() => {
    const t = nText.trim();
    if (!t) return { N: null, error: 'Enter a number.' };
    if (!/^\d+$/.test(t)) return { N: null, error: 'Must be a non-negative integer.' };
    return { N: BigInt(t), error: null };
  }, [nText]);

  const stats = useMemo(() => (parsed.N === null ? null : getStats(parsed.N)), [parsed.N]);
  const whimsy = useMemo(
    () => (stats && parsed.N !== null ? getWhimsy(stats, parsed.N) : null),
    [stats, parsed.N],
  );

  const preview = useMemo(() => {
    if (parsed.N === null) return [];
    const cap = Math.min(previewLines, MAX_PREVIEW);
    const out = [];
    for (const line of songLines(parsed.N, cap)) out.push(line);
    return out;
  }, [parsed.N, previewLines]);

  const totalLines = stats ? stats.lines : 0n;
  const truncated = stats && BigInt(preview.length) < totalLines;

  return (
    <div className="app">
      <header>
        <h1>Big Green Bottles</h1>
        <p className="subtitle">
          Stats and a live preview of the "<em>N</em> green bottles" song, for any
          N up to a googol (10<sup>100</sup>).
        </p>
      </header>

      <section className="controls">
        <label className="field">
          <span>N (number of bottles)</span>
          <input
            type="text"
            inputMode="numeric"
            spellCheck="false"
            value={nText}
            onChange={(e) => setNText(e.target.value)}
            placeholder="e.g. 1000000000000"
          />
        </label>
        <label className="field field-small">
          <span>Preview lines</span>
          <input
            type="number"
            min="0"
            max={MAX_PREVIEW}
            value={previewLines}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isNaN(v)) return;
              setPreviewLines(Math.max(0, Math.min(MAX_PREVIEW, Math.floor(v))));
            }}
          />
        </label>
      </section>

      {parsed.error && <div className="error">{parsed.error}</div>}

      {stats && (
        <section className="panel">
          <h2>Stats</h2>
          <dl className="stats">
            <Stat label="Bottles" value={stats.verses} />
            <Stat label="Lines" value={stats.lines} />
            <Stat
              label="Pages"
              value={stats.pages}
              note="at 50 lines/page"
            />
            <Stat
              label="Bytes"
              value={stats.bytes}
              primary={formatBytes(stats.bytes)}
              secondary={`${formatBigInt(stats.bytes)} bytes`}
              showWords={false}
            />
          </dl>
        </section>
      )}

      {whimsy && (
        <section className="panel">
          <h2>For scale</h2>
          <dl className="stats">
            <Whim
              label="1 TB hard drives needed"
              value={whimsy.hardDrives}
            />
            <Whim
              label="Times humanity's total data storage"
              value={whimsy.worldDataMultiple}
              hint="vs. ~181 zettabytes generated globally in 2024"
            />
            <Whim
              label="Years to read aloud nonstop"
              value={whimsy.readingYears}
              hint="at ~150 words/min"
            />
            <Whim
              label="Ages of the universe spent reading"
              value={whimsy.universesOfReading}
              hint="universe age ≈ 13.8 billion years"
            />
            <Whim
              label="Earth-masses of glass"
              value={whimsy.earthMassesOfGlass}
              hint="at 200 g per bottle"
            />
            <Whim
              label="Stack height of printed pages"
              value={whimsy.stackHeightMeters}
              unit="meters"
              hint="at 0.1 mm per sheet"
            />
            <Whim
              label="…trips to the Moon"
              value={whimsy.stackToMoon}
              hint="same stack, vs. Earth–Moon distance"
            />
            <Whim
              label="…in light-years"
              value={whimsy.stackInLightYears}
              hint="same stack"
            />
            <Whim
              label="Trips around Earth's equator"
              value={whimsy.paperEquatorLoops}
              hint="pages laid end-to-end"
            />
          </dl>
        </section>
      )}

      {stats && (
        <section className="panel">
          <h2>
            Preview
            {preview.length > 0 && (
              <span className="muted">
                {' '}
                — showing {formatBigInt(preview.length)} of {formatBigInt(totalLines)} line
                {totalLines === 1n ? '' : 's'}
                {truncated ? ' (truncated)' : ''}
              </span>
            )}
          </h2>
          {preview.length === 0 ? (
            <p className="muted">No lines to show.</p>
          ) : (
            <pre className="song">{preview.join('\n')}</pre>
          )}
        </section>
      )}
    </div>
  );
}

function Whim({ label, value, unit, hint }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd>
        <div className="num">
          {formatWhimsy(value)}
          {unit && <span className="muted"> {unit}</span>}
        </div>
        {hint && <div className="secondary">{hint}</div>}
      </dd>
    </div>
  );
}

function Stat({ label, value, note, primary, secondary, showWords = true }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd>
        <div className="num">
          {primary ?? formatBigInt(value)}
          {note && <span className="muted"> ({note})</span>}
        </div>
        {secondary && <div className="secondary">{secondary}</div>}
        {showWords && <div className="words">{numberToWords(value)}</div>}
      </dd>
    </div>
  );
}
