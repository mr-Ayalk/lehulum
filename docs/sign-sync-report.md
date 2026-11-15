# Sign sync

Ends-only trimming and boundary holds stay as they were. Pacing is Smooth by default: the lesson slows down to 0.85 where the signer would otherwise fall more than 2.0 s behind, and a hold is only the remainder of at least 0.5 s. Pause at sentence ends is the previous behaviour. Off never holds and skips forward past 2.0 s.

The plan ignores catch-up. Live catch-up is 1.10× while the lag is above 0.8 s, so the lesson uses fewer and shorter holds than the plan.

## Smooth, live

Lowest lesson rate applied: 0.85. The speed control stayed at 1×. No ratechange reached the host.

| boundary | lesson s | hold s | sign advance s |
|---|---:|---:|---:|
| A01 -> A02 | 2.38 | 3.46 | 3.46 |
| A03 -> A04 | 8.40 | 0.60 | 0.60 |
| A07 -> A08 | 20.13 | 1.30 | 1.30 |
| A09 -> A10 | 25.86 | 1.15 | 1.15 |

Mid-lesson holds: 4. The aim was 2. At a floor of 0.85 these four sentence ends still have more signing left than the slower lesson can absorb. Sign advance was the full hold. End wait 1.19 s. Mean lag 0.22 s. Max lag 1.92 s. Wall 60.9 s.

## Pause, live

Same seven boundaries as the accepted boundary-hold run.

| boundary | lesson s | hold s | sign advance s |
|---|---:|---:|---:|
| A01 -> A02 | 2.40 | 3.70 | 3.70 |
| A02 -> A03 | 5.28 | 0.74 | 0.74 |
| A03 -> A04 | 8.38 | 0.90 | 0.90 |
| A05 -> A06 | 14.90 | 1.15 | 1.15 |
| A07 -> A08 | 20.12 | 1.65 | 1.65 |
| A09 -> A10 | 25.87 | 1.45 | 1.45 |
| A10 -> A11 | 29.51 | 0.70 | 0.70 |

Mid-lesson holds: 7. End wait 1.17 s. Mean lag 0.26 s. Max lag 2.13 s. Wall 59.6 s. Lesson rate stayed 1.

## Picture, captions, clock

Before any pacing, on the boundary-hold lesson: picture drift max 0.043 s (the frame slightly ahead of the clock). Captions A03 +0.055 s and A11 +0.067 s, both just after a hold. Signer lag reached 2.247 s at A12, and A01 started 0.012 s early.

After, Smooth picture drift max 0.047 s and Pause 0.055 s. Every caption appears and leaves within 0.05 s of its cue, except Pause A10, whose clock itself stepped 0.055 s and the caption was already up. Signer start minus cue start is 0 to 1.93 s in Smooth and 0 to 2.14 s in Pause. Lesson time at each cue start is within 0.055 s of the cue.

The report “the lesson video is falling behind a little” matches the captions. The picture was not behind. The signer lag is the 2 s limit, not a small slip.

axe: 0 violations in light, dark, contrast, and with the More menu open.
