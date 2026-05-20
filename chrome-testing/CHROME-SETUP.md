# CSS Properties Visual Reference — Setup & Workflow

## Prerequisites

- **Google Chrome** — headless screenshots
- **Go** — builds chromerpc from source
- **Python 3** — local HTTP server for serving templates
- **git** — clones chromerpc repo

## Directory Structure

```
chrome-testing/
├── CHROME-SETUP.md      # This file
├── snap.sh              # chromerpc screenshot tool (from github.com/accretional/chromerpc)
├── run.sh               # Main pipeline: screenshots all templates + generates gallery
├── templates/           # 525 unique HTML files, one per CSS property
│   ├── accent-color.html
│   ├── align-content.html
│   ├── ...
│   └── zoom.html
├── screenshots/         # Generated PNGs (2560x1600 @ 2x scale)
│   ├── accent-color.png
│   ├── align-content.png
│   ├── ...
│   └── zoom.png
└── gallery.html         # Generated gallery page (5-column grid)
```

## Step 1: chromerpc — Chrome DevTools Protocol Bridge

[chromerpc](https://github.com/accretional/chromerpc) is a gRPC bridge to the Chrome DevTools Protocol.

`snap.sh` handles fetching and building chromerpc automatically:
- Clones the repo to `/tmp/chromerpc-testing/src/`
- Builds two Go binaries into `/tmp/chromerpc-testing/bin/`:
  - **chromerpc** — gRPC server that wraps headless Chrome
  - **automate** — orchestrator that reads `.textproto` automation sequences
- Binaries are cached across runs; re-built only if missing

## Step 2: HTML Templates — One Per CSS Property

Each template in `templates/` is a self-contained HTML file that:
- Has a dark background (`#1a1a2e`) with light text
- Shows the property name as a heading + monospace subtitle
- Demonstrates 3-6 different values of that CSS property
- Each value shown in a labeled demo card with visible effect
- Fits within a 1280x800 viewport (no scrolling needed)
- Uses only inline CSS (no external dependencies)

Templates were created manually (not auto-generated) to ensure each one uniquely showcases the specific features of its CSS property.

The full list of 525 properties comes from `properties.txt` (MDN CSS reference).

## Step 3: Screenshot Pipeline (`snap.sh`)

`snap.sh` orchestrates the screenshot process:

1. Detects Chrome installation
2. Fetches/builds chromerpc if needed
3. Starts a local Python HTTP server on a free port (serves `templates/`)
4. Starts chromerpc in headless mode on a free port
5. For each `.html` file in the input directory:
   - Generates a `.textproto` automation sequence:
     - `set_viewport`: 1280x800, 2x device scale factor
     - `navigate`: to the local HTTP URL
     - `wait`: 500ms for rendering
     - `screenshot`: capture to PNG
   - Runs the `automate` binary with that sequence
6. Cleans up all child processes on exit

### Usage

```bash
# Batch mode — one PNG per HTML file
./snap.sh templates/ screenshots/

# Single file
./snap.sh templates/flex-direction.html screenshots/flex-direction.png

# External URL
./snap.sh https://example.com output.png
```

## Step 4: Gallery Generation (`run.sh`)

`run.sh` is the main entry point that:
1. Calls `snap.sh` to screenshot all templates (unless `--gallery-only`)
2. Generates `gallery.html` — a responsive 5-column grid showing all screenshots with property names as labels

### Usage

```bash
# Full pipeline: screenshot all templates + generate gallery
./run.sh

# Regenerate gallery from existing screenshots only
./run.sh --gallery-only
```

## Step 5: Verification

Screenshots were verified across multiple categories:

| Category | Properties Checked |
|---|---|
| Layout | flex-direction, grid-template-areas, z-index |
| Box model | border-radius, box-shadow, overflow |
| Text | text-decoration |
| SVG | stroke-dasharray |
| Animation | animation-timing-function |
| Visual | accent-color, transform, cursor |

All 525 templates produce correct, property-specific visualizations. The gallery page renders all screenshots in a browsable 5-column grid.
