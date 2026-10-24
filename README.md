# Cubic

A speedcubing timer, algorithm trainer, step-by-step guides and stats. Black AMOLED interface, official WCA scrambles, everything stored in your own browser.

## Run it

It is a static site. Serve the `app/` folder with any web server (or open `app/index.html` straight from disk). There is no build step and nothing to install to run it.

To host it, upload the contents of `app/` and point your host at that folder.
The only network request the page makes is for the Geist typeface from Google Fonts; without it the page falls back to the system font.

## Folders

| Folder | What it is |
|---|---|
| `app/` | **The site.** Everything in here is served as is. |
| `source/` | Third-party code and data the generated files are built from (csTimer engine, algorithm data, TNoodle WebAssembly port, licences). |
| `tools/` | Build scripts and test suites. Only needed to regenerate data or run the tests. |

## Rebuilding generated files (needs Node 20+)

```
node tools/mkbundle.cjs      # app/engine-src.js, app/catalog.js   from source/engine.js
node tools/mk-tnoodle.cjs    # checks the WCA scrambler against its own rules
node tools/mk-polypal.cjs    # app/poly-pal.js                      Pyraminx / Skewb / Megaminx colours
node tools/build-train.cjs   # app/train-data.js                    keeps only cases whose algorithm verifiably solves them
node tools/build-pics.cjs    # app/learn-pics.js                    pictures for the Learn guides
node tools/mkalg.cjs         # app/algsets.js                       algorithm library used by the method review
```

## Tests

```
node tools/test-logic.cjs      # comment tones and statistics maths
node tools/test-quips2.cjs     # every number a comment quotes is checked against separate maths
node tools/test-cal.cjs        # calendar, streaks
node tools/verify-views.cjs    # every Train case renders in its 3D / top view
node tools/live6.cjs           # in a real browser: timer, buttons, history, settings, stats
node tools/live7.cjs           # in a real browser: per-puzzle stats, calendar
node tools/live8.cjs           # in a real browser: whole-app sweep
```

The browser suites drive Microsoft Edge (already on Windows) over its debugging port; they install nothing. Edit the `EDGE` path at the top of each file if yours is elsewhere.

## Where the scrambles and algorithms come from

- **WCA scrambles:** TNoodle, the WCA's official scrambler, through the WebAssembly port in NexusTimer (`source/tnoodle/`). Used for every event TNoodle has, which is all of them except FMC.
- **Practice scramble types and diagrams:** the csTimer engine (`source/engine.js`).
- **Algorithms:** NexusTimer's dataset (`source/algorithms.json`). A case is shown in Train only if its algorithm, run on a model of the puzzle, really solves it.
- **3D puzzle geometry:** csTimer's `poly3dlib.js` (`source/cstimer/`).

## Honest limits

- **Learn guides:** 3×3 and 2×2 guides have every algorithm checked on a model of the cube. 4×4 to 7×7 have their parity algorithms checked. Clock, Megaminx, Pyraminx, Skewb and Square-1 follow published beginner guides; their move letters could not be machine-checked, and the Skewb and Pyraminx pictures assume one corner letter maps to the engine's (see the note in the Skewb guide).
- **Train:** Roux and Mehta sets are missing because no verified algorithm data was available. About 240 dataset cases were dropped because their algorithm did not solve them.
- **Method review:** 3×3 only. The solutions are searched step by step; they are checked to solve your scramble but are not proven shortest.
- **Data:** solves, name and settings live in your browser's storage. Clearing site data erases them; use Settings > Export to keep a copy.

## Licence

This project contains and is derived from GPL-3.0 software (csTimer, NexusTimer, TNoodle's library, TwistyTimer data), so it is distributed under the **GNU General Public License v3**. The full text is in `app/LICENSE.txt` and `source/licenses/`; credits are in `app/ATTRIBUTION.txt`. If you host it, keep both files in the served folder and offer the source (this repository) to anyone who asks.
