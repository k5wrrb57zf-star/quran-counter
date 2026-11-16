# مِقياس · Miqyas — real-world size guessing game

A touch-first (iPad-first) web game: one object is shown at a fixed size, and you resize a
second object with a precision slider until you think both are in their true real-world
proportion. Reveal the answer to see the exact measurements, the true ratio, your ratio,
your percentage error and a score.

## Run

```bash
cd size-game
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/ (relative paths, host anywhere)
```

## How it works

| Piece | File |
| --- | --- |
| Curated catalogue (measurements, sources, confidence, image candidates) | `tools/subjects.py` |
| Image pipeline: Wikipedia/Commons lookup → download → background removal → validation → WebP | `tools/build_assets.py` |
| Review sheets of every cut-out | `tools/contact_sheet.py` |
| Merge into the app dataset (`src/data/subjects.json`) | `tools/export_data.py` |
| Pair generation, compatible dimensions, difficulty | `src/lib/pairs.ts` |
| Scoring | `src/lib/score.ts` |
| Stage (real-scale layout with a smooth auto-zoom camera) | `src/components/Stage.tsx` |
| Precision slider (relative drag, fine scrubbing, +/− with hold-to-repeat) | `src/components/SizeSlider.tsx` |

### Measurements

* Every value is in metres and carries a source and a confidence label:
  **official** (manufacturer, governing body, franchise canon), **measured** (scientific
  measurement), **typical** (typical adult / model — approximate) or **estimate** (shown
  as such in the game).
* Subjects have a height `h`, a length `l` and/or a diameter `d`. Two subjects are only
  compared on a shared dimension — height with height, length with length — and a sphere's
  diameter counts as either. A mountain can therefore meet an asteroid, but a car's length
  is never compared with a person's height.
* Each cut-out image is trimmed to the subject, and its pixel size is mapped to the
  measured dimension (`fit` handles poses where the measured part is only a fraction of the
  picture, e.g. a horse's height at the withers).

### Scoring

`k = guessed size ÷ true size`. Error is measured on a log scale so that 2× too big and
2× too small are equally wrong:

score = 1000 · e^−(|log₂ k| / 0.45)^1.5  (≈ 900 within 7 %, ≈ 550 at 25 %)

accuracy = min(k, 1/k)

### Slider

The slider maps position to `log₁₀ k` over 1.5 – 2.8 decades depending on difficulty, with
the correct answer placed at a random point of the track so the track itself gives nothing
away. Grabbing anywhere moves the slider relative to the finger (no jumps); moving the finger
up away from the bar gives ½× and ¼× finer control.

### Images

All images come from Wikimedia Commons or Wikipedia (see the in-game *Sources & credits*
screen for file, author and licence of each). Fictional characters are © their owners
and are shown at low resolution for educational, non-commercial purposes.
File names are hashes so they never reveal anything about the answer.
