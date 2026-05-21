# CSS Properties Visual Reference — Usage Instructions

A visual reference for all 525 CSS properties. Each property has a unique HTML template that demonstrates its values, screenshotted via headless Chrome and displayed in a browsable gallery.

---

## What this module does

- **525 HTML templates** in `templates/` — one per CSS property, each with 3-6 labeled value demos
- **525 PNG screenshots** in `screenshots/` — captured at 2560x1600 (1280x800 @ 2x scale)
- **`gallery.html`** — responsive 5-column grid displaying all screenshots with property names

Screenshots are taken using [chromerpc](https://github.com/accretional/chromerpc), a gRPC bridge to Chrome DevTools Protocol.

---

## Prerequisites

- **Google Chrome** installed on the system
- **Go** (to build chromerpc from source)
- **Python 3** (serves HTML files over HTTP for screenshotting)

chromerpc is fetched and built automatically on first run.

---

## Quick start

### Full pipeline — screenshot all templates and generate gallery

```bash
cd chrome-testing
./run.sh
```

### Regenerate gallery from existing screenshots

```bash
./run.sh --gallery-only
```

### Screenshot a single template

```bash
./snap.sh templates/flex-direction.html screenshots/flex-direction.png
```

### Screenshot all templates (without gallery)

```bash
./snap.sh templates/ screenshots/
```

### Screenshot an external URL

```bash
./snap.sh https://example.com output.png
```

---

## Adding a new CSS property

1. Create `templates/{property-name}.html` — self-contained HTML with:
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

4. Verify the screenshot in `screenshots/{property-name}.png`

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

## Notes

- All scripts are idempotent — safe to re-run at any time
- chromerpc binaries are cached in `/tmp/chromerpc-testing/bin/`
- Ports are auto-assigned (no conflicts with other services)
- Scripts clean up child processes via `trap EXIT`
- `gallery.html` is generated — do not edit it manually