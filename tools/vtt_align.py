# FR-CAP-01, FR-HOH-09: Choose caption boundaries from pause candidates.
import math
import unicodedata

# Permissive silence settings shared with tools/make_vtt.py.
DP_NOISE = -27
DP_PAUSE = 0.10


def syllables(text):
    fidel = other = 0
    for char in text:
        code = ord(char)
        cat = unicodedata.category(char)
        if 0x1200 <= code <= 0x137F and cat.startswith("L"):
            fidel += 1
        elif cat.startswith("N") or (char.isascii() and char.isalpha()):
            other += 1
    return fidel + other / 3.0


def expected_durations(texts, span):
    counts = [syllables(text) or 0.01 for text in texts]
    scale = span / sum(counts)
    return [count * scale for count in counts]


def speech_bounds(spans, total):
    cursor, regions = 0.0, []
    for start, end in spans:
        if start > cursor + 0.02:
            regions.append((cursor, start))
        cursor = max(cursor, end)
    if total - cursor > 0.02:
        regions.append((cursor, total))
    if not regions:
        return 0.0, total, 0.0
    t0, t1 = regions[0][0], regions[-1][1]
    lead = t0 - spans[0][0] if spans and spans[0][0] <= 0.02 else 0.0
    return t0, t1, lead


def _ok(actual, exp):
    return exp > 0 and actual > 0 and 0.45 <= actual / exp <= 2.20


def _cost(actual, exp, pause):
    return math.log(actual / exp) ** 2 - 0.5 * min(pause, 0.6)


def choose_boundaries(pauses, t0, t1, expected, constrained=True):
    n, mids, lens = len(expected), [], []
    for start, end in pauses:
        mids.append((start + end) / 2)
        lens.append(end - start)
    m = len(mids)
    if n == 0:
        return []
    if n == 1:
        return [] if not constrained or _ok(t1 - t0, expected[0]) else None
    if m < n - 1:
        return None
    inf = math.inf
    dp = [[inf] * m for _ in range(n - 1)]
    prev = [[-1] * m for _ in range(n - 1)]
    for j in range(m):
        actual = mids[j] - t0
        if _ok(actual, expected[0]) or (not constrained and actual > 0 and expected[0] > 0):
            dp[0][j] = _cost(actual, expected[0], lens[j])
    for k in range(1, n - 1):
        for j in range(k, m):
            best, bi = inf, -1
            for i in range(j):
                if dp[k - 1][i] == inf:
                    continue
                actual = mids[j] - mids[i]
                if constrained and not _ok(actual, expected[k]):
                    continue
                if actual <= 0 or expected[k] <= 0:
                    continue
                cost = dp[k - 1][i] + _cost(actual, expected[k], lens[j])
                if cost < best:
                    best, bi = cost, i
            dp[k][j], prev[k][j] = best, bi
    best, bi = inf, -1
    for i in range(n - 2, m):
        if dp[n - 2][i] == inf:
            continue
        actual = t1 - mids[i]
        if constrained and not _ok(actual, expected[-1]):
            continue
        if actual <= 0 or expected[-1] <= 0:
            continue
        cost = dp[n - 2][i] + math.log(actual / expected[-1]) ** 2
        if cost < best:
            best, bi = cost, i
    if bi < 0:
        return None
    chosen = [bi]
    for k in range(n - 2, 0, -1):
        bi = prev[k][bi]
        chosen.append(bi)
    return list(reversed(chosen))


def cue_times(pauses, chosen, t0, t1, total):
    cues, prev_end = [], t0
    picked = [pauses[i] for i in chosen]
    for start, end in picked:
        cue_s = max(0.0, prev_end - 0.05)
        nxt = max(0.0, end - 0.05)
        cue_e = min(total, start + 0.15, nxt)
        cues.append((cue_s, max(cue_s, cue_e)))
        prev_end = end
    cue_s = max(0.0, prev_end - 0.05)
    cues.append((cue_s, max(cue_s, min(total, t1 + 0.15))))
    for i in range(len(cues) - 1):
        if cues[i][1] > cues[i + 1][0]:
            cues[i] = (cues[i][0], max(cues[i][0], cues[i + 1][0]))
    return cues


def align_cues(spans, total, texts):
    t0, t1, lead = speech_bounds(spans, total)
    pauses = [(a, b) for a, b in spans if t0 < (a + b) / 2 < t1]
    expected = expected_durations(texts, max(t1 - t0, 0.001))
    mode, idx = "constrained", choose_boundaries(pauses, t0, t1, expected, True)
    if idx is None:
        mode, idx = "relaxed", choose_boundaries(pauses, t0, t1, expected, False)
    if idx is None:
        return None
    return {
        "cues": cue_times(pauses, idx, t0, t1, total),
        "expected": expected,
        "pause_before": [lead] + [pauses[i][1] - pauses[i][0] for i in idx],
        "mode": mode, "t0": t0, "t1": t1, "npauses": len(pauses),
    }
