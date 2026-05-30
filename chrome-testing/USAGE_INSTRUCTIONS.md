# CSS Properties Visual Reference — Usage Instructions

A visual reference for CSS properties. 525 hand-written HTML templates demonstrate each property, and 528 EBNF-generated templates show grammar-derived CSS values. Both sets are screenshotted via headless Chrome and displayed in browsable galleries.

---

## What this module does

- **525 hand-written HTML templates** in `html/template/` — one per CSS property, each with 3-6 labeled value demos
- **528 EBNF-generated HTML templates** in `html/generated/` — cloned from hand-written templates with grammar-derived values
- **Screenshots** in `screenshots/template/` and `screenshots/generated/` — captured at 2560x1600 (1280x800 @ 2x scale)
- **Gallery pages** in `html/` — responsive 5-column grids (screenshot galleries + live iframe galleries)

Screenshots are taken using [chromerpc](https://github.com/accretional/chromerpc), a gRPC bridge to Chrome DevTools Protocol.

---

## Prerequisites

- **Google Chrome** installed on the system
- **Go** (to build chromerpc from source + run EBNF generator)
- **Python 3** (serves HTML files over HTTP for screenshotting)

chromerpc is fetched and built automatically on first run.

---

## Quick start

### Full pipeline — both template + generated

```bash
cd chrome-testing
./run.sh
```

### Template only or generated only

```bash
./run.sh --template
./run.sh --generated
```

### Regenerate galleries from existing screenshots

```bash
./run.sh --gallery-only
./run.sh --template --gallery-only
./run.sh --generated --gallery-only
```

### Batch EBNF generation (first 20 properties)

```bash
START=0 COUNT=20 ./run.sh --generated
```

### Screenshot a single template

```bash
./snap.sh html/template/flex-direction.html screenshots/template/flex-direction.png
```

### Screenshot all hand-written templates (without gallery)

```bash
./snap.sh html/template/ screenshots/template/
```

### Screenshot an external URL

```bash
./snap.sh https://example.com output.png
```

---

## Adding a new CSS property

1. Create `html/template/{property-name}.html` — self-contained HTML with:
   - Dark background (`#1a1a2e`), light text
   - Property name as `<h1>` + monospace `<p>` subtitle
   - 3-6 demo cards showing different values with labels
   - Must fit within 1280x800 viewport (no scrolling)
   - Inline CSS only (no external dependencies)

2. Add the property name to `properties.txt`

3. Run the pipeline:
   ```bash
   ./run.sh
   ```

4. Verify the screenshot in `screenshots/template/{property-name}.png`

---

## How screenshotting works

`snap.sh` orchestrates the full process:

1. Detects Chrome installation (macOS, Linux)
2. Fetches and builds chromerpc if not cached (`/tmp/chromerpc-testing/`)
3. Starts a Python HTTP server on a free port to serve templates
4. Starts chromerpc in headless mode on a free port
5. For each HTML file, generates a `.textproto` automation sequence:
   - `set_viewport`: 1280x800, 2x device scale factor
   - `navigate`: to the local HTTP URL
   - `wait`: 500ms for rendering
   - `screenshot`: capture to PNG
6. Cleans up all processes on exit

---

## Gallery pages

All galleries are in `html/`:

| File | Description |
|---|---|
| `template_screenshots_gallery.html` | Screenshot grid of hand-written templates |
| `template_gallery.html` | Live iframe gallery (click to expand) of hand-written templates |
| `generated_screenshots_gallery.html` | Screenshot grid of EBNF-generated templates |
| `generated_gallery.html` | Live iframe gallery of EBNF-generated templates |

---

## Notes

- All scripts are idempotent — safe to re-run at any time
- chromerpc binaries are cached in `/tmp/chromerpc-testing/bin/`
- Ports are auto-assigned (no conflicts with other services)
- Scripts clean up child processes via `trap EXIT`
- Gallery HTML files are generated — do not edit them manually
