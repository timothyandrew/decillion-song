import { useMemo, useState } from 'react';
import {
  numberToWords,
  getStats,
  songLines,
  formatBytes,
  formatBigInt,
} from './lib.js';

const MAX_PREVIEW = 500;

export default function App() {
  const [nText, setNText] = useState('100');
  const [previewLines, setPreviewLines] = useState(20);

  const parsed = useMemo(() => {
    const t = nText.trim();
    if (!t) return { N: null, error: 'Enter a number.' };
    if (!/^\d+$/.test(t)) return { N: null, error: 'Must be a non-negative integer.' };
    return { N: BigInt(t), error: null };
  }, [nText]);

  const stats = useMemo(() => (parsed.N === null ? null : getStats(parsed.N)), [parsed.N]);

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
        <h1>Green Bottles</h1>
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
            <Stat label="Verses" value={stats.verses} />
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
