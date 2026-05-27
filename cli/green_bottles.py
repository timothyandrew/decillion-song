#!/usr/bin/env python3
import argparse
import functools
import sys

ONES = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen",
]
TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
SCALES = [
    (10**100, "googol"),
    (10**63, "vigintillion"),
    (10**60, "novemdecillion"),
    (10**57, "octodecillion"),
    (10**54, "septendecillion"),
    (10**51, "sexdecillion"),
    (10**48, "quindecillion"),
    (10**45, "quattuordecillion"),
    (10**42, "tredecillion"),
    (10**39, "duodecillion"),
    (10**36, "undecillion"),
    (10**33, "decillion"),
    (10**30, "nonillion"),
    (10**27, "octillion"),
    (10**24, "septillion"),
    (10**21, "sextillion"),
    (10**18, "quintillion"),
    (10**15, "quadrillion"),
    (10**12, "trillion"),
    (10**9, "billion"),
    (10**6, "million"),
    (1000, "thousand"),
    (100, "hundred"),
]

ONES_LEN = [len(w) for w in ONES]
TENS_LEN = [len(w) for w in TENS]


def number_to_words(n: int) -> str:
    if n < 20:
        return ONES[n]
    if n < 100:
        tens, ones = divmod(n, 10)
        return TENS[tens] + (f"-{ONES[ones]}" if ones else "")
    for value, name in SCALES:
        if n >= value:
            high, low = divmod(n, value)
            result = f"{number_to_words(high)} {name}"
            if low:
                joiner = " and " if value == 100 or low < 100 else " "
                result += joiner + number_to_words(low)
            return result
    raise ValueError(f"number too large: {n}")


def word_len(n: int) -> int:
    if n < 20:
        return ONES_LEN[n]
    if n < 100:
        t, o = divmod(n, 10)
        return TENS_LEN[t] + (0 if o == 0 else 1 + ONES_LEN[o])
    for value, name in SCALES:
        if n >= value:
            high, low = divmod(n, value)
            res = word_len(high) + 1 + len(name)
            if low:
                joiner = 5 if value == 100 or low < 100 else 1
                res += joiner + word_len(low)
            return res
    raise ValueError(f"number too large: {n}")


def bottles(n: int) -> str:
    word = number_to_words(n)
    return f"{word} green bottle" if n == 1 else f"{word} green bottles"


@functools.cache
def cum_word_len(N: int) -> int:
    """Sum of word_len(i) for i = 1..N. O(log N) via scale decomposition."""
    if N <= 0:
        return 0
    if N < 20:
        return sum(ONES_LEN[1:N + 1])
    if N < 100:
        t_max, o_max = divmod(N, 10)
        total = sum(ONES_LEN[1:20])
        ones_extras = sum(1 + ONES_LEN[o] for o in range(1, 10))
        for t in range(2, t_max):
            total += 10 * TENS_LEN[t] + ones_extras
        total += (o_max + 1) * TENS_LEN[t_max]
        total += sum(1 + ONES_LEN[o] for o in range(1, o_max + 1))
        return total
    for value, name in SCALES:
        if N >= value:
            return _cum_with_scale(N, value, name)
    raise ValueError(f"N too large: {N}")


def _joiner_sum_full(V: int) -> int:
    if V == 100:
        return 5 * 99
    return 5 * 99 + (V - 100)


def _joiner_sum_partial(V: int, r_max: int) -> int:
    if V == 100 or r_max < 100:
        return 5 * r_max
    return 5 * 99 + (r_max - 99)


def _cum_with_scale(N: int, V: int, name: str) -> int:
    h_max, r_max = divmod(N, V)
    name_part = 1 + len(name)
    block_below = cum_word_len(V - 1)
    total = block_below
    if h_max >= 2:
        total += V * cum_word_len(h_max - 1)
        total += (h_max - 1) * (V * name_part + _joiner_sum_full(V) + block_below)
    total += (r_max + 1) * (word_len(h_max) + name_part)
    total += _joiner_sum_partial(V, r_max) + cum_word_len(r_max)
    return total


def emit_song(n: int, max_lines: int | None = None) -> None:
    if max_lines == 0:
        return
    lines_emitted = 0
    for verse_idx, i in enumerate(range(n, 0, -1)):
        if verse_idx > 0:
            print()
            lines_emitted += 1
            if max_lines is not None and lines_emitted >= max_lines:
                return
        current = bottles(i)
        remaining = "no green bottles" if i == 1 else bottles(i - 1)
        current_cap = current[0].upper() + current[1:]
        verse_lines = (
            f"{current_cap} hanging on the wall,",
            f"{current_cap} hanging on the wall,",
            "And if one green bottle should accidentally fall,",
            f"There'll be {remaining} hanging on the wall.",
        )
        for line in verse_lines:
            print(line)
            lines_emitted += 1
            if max_lines is not None and lines_emitted >= max_lines:
                return


LINES_PER_PAGE = 50
BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB", "RB", "QB"]


def format_bytes(b: int) -> str:
    if b < 1024:
        return f"{b} B"
    unit_index = 0
    value = float(b)
    while value >= 1024 and unit_index < len(BYTE_UNITS) - 1:
        value /= 1024
        unit_index += 1
    if value >= 1024:
        mantissa_str, exp_str = f"{value:.3e}".split("e")
        exp_num = int(exp_str)
        sign = "+" if exp_num >= 0 else "-"
        return f"{mantissa_str}e{sign}{abs(exp_num)} {BYTE_UNITS[-1]}"
    return f"{value:,.2f} {BYTE_UNITS[unit_index]}"


def compute_stats(n: int) -> None:
    if n == 0:
        print("Lines: 0")
        print("Pages: 0")
        print("Bytes: 0 B (0)")
        return

    cw_n = cum_word_len(n)
    cw_n_minus_1 = cum_word_len(n - 1)

    total_bytes = 2 * cw_n + cw_n_minus_1 + 170 * n + max(0, n - 2)
    total_lines = 5 * n - 1
    total_pages = (total_lines + LINES_PER_PAGE - 1) // LINES_PER_PAGE

    print(f"Verses: {n:,}")
    print(f"        ({number_to_words(n)})")
    print(f"Lines:  {total_lines:,}")
    print(f"        ({number_to_words(total_lines)})")
    print(f"Pages:  {total_pages:,}  (at {LINES_PER_PAGE} lines/page)")
    print(f"        ({number_to_words(total_pages)})")
    print(f"Bytes:  {format_bytes(total_bytes)}  ({total_bytes:,})")


def main() -> None:
    parser = argparse.ArgumentParser(description="Emit the N green bottles song.")
    parser.add_argument("n", type=int, help="number of bottles")
    parser.add_argument(
        "--stats",
        action="store_true",
        help="print stats about the song instead of the lyrics",
    )
    parser.add_argument(
        "--lines",
        type=int,
        default=None,
        metavar="N",
        help="only print the first N lines of the song",
    )
    args = parser.parse_args()

    if args.n < 0:
        print("N must be non-negative", file=sys.stderr)
        sys.exit(1)
    if args.lines is not None and args.lines < 0:
        print("--lines must be non-negative", file=sys.stderr)
        sys.exit(1)

    if args.stats:
        compute_stats(args.n)
    else:
        emit_song(args.n, max_lines=args.lines)


if __name__ == "__main__":
    main()
