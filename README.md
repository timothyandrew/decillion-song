# decillion-song

Generate, preview, and reason about the "*N* green bottles hanging on the wall"
song for arbitrarily large *N* — all the way up to a **googol** (10<sup>100</sup>).

Two interfaces share the same math:

- **CLI** ([`cli/green_bottles.py`](cli/green_bottles.py)) — Python script.
- **Web** ([`web/`](web/)) — React + Vite single-page app, live updates as you type.

## Why this is interesting

A naïve loop won't get you very far past a few million verses. This project
computes stats in closed form via scale decomposition, so it's effectively
instant even at googol scale:

- `cum_word_len(N)` — sum of `len(words(i))` for `i = 1..N` — runs in
  O(log N) using a memoized recursion over the named-number scales.
- Total bytes is derived analytically:
  `2·cum_word_len(N) + cum_word_len(N-1) + 170·N + max(0, N-2)`.
- The song preview is a generator that stops after the requested number of
  lines, so it stays cheap regardless of *N*.

## CLI

```sh
# Print the song
python3 cli/green_bottles.py 5

# Stats only — verses, lines, pages, bytes (with words for each)
python3 cli/green_bottles.py 1000000000000 --stats

# Only show the first N lines of the song
python3 cli/green_bottles.py 100 --lines=12

# Works up to a googol
python3 cli/green_bottles.py "$(python3 -c 'print(10**100)')" --stats
```

## Web

```sh
cd web
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → web/dist/
```

The UI takes an *N* and a preview-line count, then live-updates stats and a
song preview as you type.

### Deploy to Cloudflare Pages

Connect this repo in the Cloudflare Pages dashboard and set:

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `web`

No environment variables required.

## Layout

```
cli/green_bottles.py   # CLI (Python)
web/                   # React + Vite app
  src/lib.js           # number-to-words + closed-form stats (BigInt)
  src/App.jsx          # UI
  src/styles.css
```

The math is implemented twice — once in Python, once in JS BigInt — and the
two are kept in sync. They produce byte-identical output for the same *N*.
