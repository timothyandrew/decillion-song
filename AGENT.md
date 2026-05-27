# AGENT notes

Quick orientation for AI coding agents touching this repo.

## Run / build

```sh
# CLI
python3 cli/green_bottles.py <N> [--stats] [--lines=K]

# Web (dev)
cd web && npm install && npm run dev

# Web (prod)
cd web && npm run build   # output: web/dist/
```

No test suite. Verify changes by cross-checking the CLI against the JS lib
for the same *N* — they must produce byte-identical stats.

## Architecture

The math lives in two places:

- `cli/green_bottles.py` — Python (uses native `int`)
- `web/src/lib.js` — JS (uses `BigInt`)

These are deliberate duplicates, not a shared module. Any change to scales,
formatting, or the stats formula must land in **both** files. After editing,
sanity-check by running:

```sh
python3 cli/green_bottles.py "<N>" --stats
node -e "import('./web/src/lib.js').then(m => { const s = m.getStats(<N>n); \
  console.log(m.formatBigInt(s.bytes), m.formatBytes(s.bytes)); })"
```

The two outputs must agree exactly (including byte formatting).

## Key invariants

- **`SCALES` order matters.** Largest scale first — `number_to_words` and
  `cum_word_len` both pick the first scale `≤ N`.
- **Closed-form bytes.** Don't reintroduce a per-verse loop; that breaks for
  large *N*. The formula is:
  `total_bytes = 2·cum_word_len(N) + cum_word_len(N-1) + 170·N + max(0, N-2)`
  Each constant is derived from the verse template (see comments in source).
  If you change the verse template, recompute the constants.
- **Joiner rules.** Between high and low parts of a scaled number:
  ` and ` (5 chars) if the scale is `hundred` OR the low part is `< 100`,
  otherwise a single space.
- **No mocked iteration in stats.** `cum_word_len` must remain O(log N).
- **Preview is a generator.** `song_lines`/`songLines` yield lazily so a
  small `--lines` is fast regardless of *N*.

## Deployment

Web app deploys to Cloudflare Pages (root: `web`, build: `npm run build`,
output: `dist`). No backend.
