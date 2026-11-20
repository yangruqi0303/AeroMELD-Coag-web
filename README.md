# AeroMELD-Coag project website

Buildless static project website. Source and deployable files are in `dist/`.

The opening illustration follows the conceptual pathway of the paper's architecture figure: initial particle-population encoding, recursive latent dynamics, and diagnostic decoding. The hero uses the original full-resolution architecture figure. An optional walkthrough highlights encoding, latent dynamics and decoding in that published schematic; it does not run or replay simulations.

## Editing

- `dist/index.html`: paper information, section structure, measurements and citation.
- `dist/style.css`: responsive layout and visual styling.
- `dist/app.js`: architecture walkthrough, figure enlargement, method tabs, analytical scaling control, result tabs and citation copying.
- `dist/assets/`: downloaded original paper figures and site icon.

No installation or build is needed. Serve `dist/` with a static web server. GitHub Pages can serve a copy of `dist/` from the configured publishing source; This repository is `yangruqi0303/AeroMELD-Coag-web`; it is maintained separately from the manuscript repository.

## Sources

Primary paper: https://arxiv.org/abs/2609.31271 (v1, 25 September 2026).

Original images downloaded from the corresponding arXiv HTML on 20 November 2026:

- `framework.png`: `https://arxiv.org/html/2609.31271v1/flowchart.png`
- `ccn.png`: `https://arxiv.org/html/2609.31271v1/spec-mix-CCN.png`
- `freezing.png`: `https://arxiv.org/html/2609.31271v1/spec-mix-INP.png`
- `rollout-errors.png`: `https://arxiv.org/html/2609.31271v1/rel-error-time.png`

Numerical summaries were checked against the paper and the current paper repository's `3_outline/main.tex` (Git blob `02cf283d961f72d49c995c285f98a0ab54bdcf5d`) as read during this task. Runtime values use the separate 60 s integration workload, not the standard hourly accuracy evaluation. No manuscript files were modified.

The design is informed by Atlas-DeePC's restrained presentation. Its source code, text and visual assets were not copied.

Independent citation verification passed against the primary arXiv records: title, all eight authors and their order, year, identifier, category, and background-paper identity.

## Second visual version

Rebuilt around the original Figure 1 at full width, a compact academic title block, locally hosted Inter Tight and Source Sans 3 fonts, larger body type, outlined resource links, source result figures and exact-data error charts. No new experimental values or references were introduced. Numeric SVG chart bars use the already verified table values; each diagnostic has a labeled independent scale.

Validation for the second version: desktop visual comparison against Atlas-DeePC; actual iframe viewport checks at 390 px and 768 px without document overflow; diagram highlight selection, modal enlargement, result switching, and script syntax checks.

## Results-first version

The opening now plays back a published 48-hour rollout and scans selected cloud-response spectra before introducing the architecture. It follows Atlas-DeePC's progression from observed task behavior to method explanation, rather than presenting an architecture as the headline result.

`tools/extract_paper_traces.py` recovers line vertices from unchanged source PDFs in `dist/assets/source-figures/`. `dist/assets/paper-traces.json` records hashes, source identity, original axis transforms, and the recovered curves. `dist/result-animations.js` draws the curves, interpolates cursor values in the original plotting coordinates, and provides pause, seek, diagnostic and case controls. The spectrum cursor scans an input variable at fixed 48 h; it is not a time evolution. No model simulation is run in the browser.

Independent verification confirmed the model identities, original axes, case selection, all number and latent traces, and all cloud-response spectra. Interpolation is linear in time for rollout traces, linear in log supersaturation for CCN, and linear in log frozen fraction for freezing. Below-floor freezing values remain in the data and are clipped only for display.

Validation for the results-first version: number playback seek at 24 h, CCN/freezing mode changes, simple/complex case changes, SVG path finiteness, source-link existence, DOM order (results before architecture), and real 390 px / 768 px viewport overflow checks.

Opening copy tightened: one sentence per spectrum case, short source captions and metric labels, no standalone summary paragraph; the architecture follows the compact result summary. Existing evaluation definitions and benchmark conditions remain in the detailed comparison sections.
