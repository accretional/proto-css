/* ============================================================
   THE CSS CODEX — Per-family Viewing Glasses (§6)
   Each demo renders the interior of .spec-stage:
   a <div className="glass"> and a <div className="controls">.
   Contract:  ({ property, family, value, onChange })
   value = { value: string, css: declaration string }
   ============================================================ */

/* shared: render the right control for a property's value type */
function ValueControl({ property, value, onChange, presetsAsChips }) {
  if (property.valueType === "keyword" || (presetsAsChips && property.values.length)) {
    return <ValueChips values={property.values} active={value.value} onChange={onChange} />;
  }
  if (property.valueType === "angle") {
    const n = parseFloat(value.value) || 0;
    return (
      <Dial
        value={n}
        min={property.min != null ? property.min : -180}
        max={property.max != null ? property.max : 180}
        onChange={(deg) => onChange({ value: `${deg}deg`, css: `${property.name}: ${deg}deg;` })}
      />
    );
  }
  if (property.valueType === "length" || property.valueType === "number") {
    return <ScalarControl property={property} valueStr={value.value} onChange={onChange} />;
  }
  if (property.values && property.values.length) {
    return <ValueChips values={property.values} active={value.value} onChange={onChange} />;
  }
  return null;
}

/* ---------------------------------------------------------------
   1 · FLEX PLAYGROUND
--------------------------------------------------------------- */
function FlexDemo({ property, family, value, onChange }) {
  const [count, setCount] = useState(4);
  const itemLevel = property.name === "flex-grow" || property.name === "order";
  const isAlignItems = property.name === "align-items";
  const isPlaceContent = property.name === "place-content";
  const isColumnGap = property.name === "column-gap" || property.name === "row-gap" || property.name === "gap";
  // justify-content governs the MAIN axis: to make safe/unsafe + start/end pairs
  // diverge we force OVERFLOW (wide items, no wrap) so unsafe alignments push
  // items past the start edge (clipped) while safe ones clamp to start.
  const isJustify = property.name === "justify-content";
  const ref = useRef(null);
  const ref2 = useRef(null);
  const [gapText, setGapText] = useState("");
  const heights = [44, 66, 34, 56, 48, 40];

  useEffect(() => {
    if (!ref.current) return;
    const base = itemLevel
      ? "display:flex;gap:14px;align-items:stretch;justify-content:flex-start;width:100%;height:100%;padding:26px;flex-wrap:nowrap;"
      // justify-content: NOWRAP + clip so the (wide) items overflow the main axis;
      // place-content: keep WRAP (for align-content) but clip so the over-wide row
      // overflows on the main axis -> safe vs unsafe finally diverge.
      : isJustify
      ? "display:flex;gap:14px;flex-wrap:nowrap;overflow:hidden;align-items:center;justify-content:center;width:100%;height:100%;padding:26px;"
      : isPlaceContent
      ? "display:flex;gap:14px;flex-wrap:wrap;overflow:hidden;align-items:center;justify-content:center;align-content:center;width:100%;height:100%;padding:26px;"
      : "display:flex;gap:14px;flex-wrap:wrap;align-items:center;justify-content:center;align-content:center;width:100%;height:100%;padding:26px;";
    ref.current.style.cssText = base + (itemLevel ? "" : value.css);
    // place-content: mirror the same declaration onto an RTL twin strip so the
    // physical `left`/`right` values pack to the opposite side from the logical
    // `start`/`end`/`flex-start`/`flex-end` -> they stop colliding in LTR.
    if (isPlaceContent && ref2.current) {
      ref2.current.style.cssText =
        "display:flex;direction:rtl;gap:14px;flex-wrap:wrap;overflow:hidden;align-items:center;justify-content:center;align-content:center;width:100%;height:100%;padding:26px;" +
        value.css;
    }
    // justify-content: the MAIN strip (small items) has free space so the
    // distribution values diverge; this twin strip deliberately OVERFLOWS
    // (wide nowrap items) so `safe *` clamps the row to start (fully visible)
    // while `unsafe *`/`center`/`end` let it overflow past the start edge
    // (clipped) -> safe vs unsafe finally diverge.
    if (isJustify && ref2.current) {
      ref2.current.style.cssText =
        "display:flex;gap:14px;flex-wrap:nowrap;overflow:hidden;align-items:center;justify-content:center;width:100%;height:100%;padding:26px;" +
        value.css;
    }
    // Surface the REAL resolved gap so the line-width keywords thin/medium/thick
    // (computed 1px/3px/5px) are legible even though the pixel gap itself is tiny.
    if (isColumnGap) {
      const cs = getComputedStyle(ref.current);
      const g = property.name === "row-gap" ? cs.rowGap : cs.columnGap;
      setGapText(g);
    }
  });

  // align-items / align-content govern the CROSS axis: items need an AUTO
  // cross-size (so stretch/normal visibly fill the container) while keeping
  // DIFFERING content heights (so start/center/end/baseline still read).
  const crossAlign = property.name === "align-items" || property.name === "align-content";
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">display: flex</span>
        {isColumnGap && gapText ? (
          <span className="glass-label" style={{ top: "auto", bottom: "12px", left: "auto", right: "14px", color: "var(--accent)" }}>
            computed {property.name}: {gapText}
          </span>
        ) : null}
        <div ref={ref}>
          {items.map((i) => {
            const hi = itemLevel && i === 1;
            // align-items: make the FIRST item taller than the container's cross
            // size so `safe *` clamps it to stay visible while `unsafe *` lets it
            // overflow past the edge -> safe vs unsafe finally diverge.
            const overflowTall = isAlignItems && i === 0;
            // place-content: make the FIRST item WIDER than a flex line so its row
            // overflows the MAIN axis -> `safe center/end` clamp it to the start
            // (fully visible) while `unsafe center/end`/`center` let it overflow
            // past the start edge (clipped). Mirrors overflowTall on the cross axis.
            const overflowWide = isPlaceContent && i === 0;
            const style = {
              // justify-content: wide, non-shrinking items so 3-4 of them overflow
              // the container on the main axis and safe vs unsafe alignment differs.
              minWidth: overflowWide ? "230%"
                : itemLevel ? "52px"
                : isJustify ? "72px"
                : isColumnGap ? "150px"
                : "46px",
              // place-content: give items a wide basis + tall height so 4+ items
              // WRAP into multiple flex lines -> align-content can actually move
              // the rows (start/center/end/space-* stop collapsing into one row).
              // gap: a wide basis forces wrapping into >=2 rows so the FIRST
              // (row-gap) component of the shorthand produces a visible vertical gap.
              flexBasis: isPlaceContent ? "40%" : isColumnGap ? "150px" : undefined,
              height: overflowTall ? "320px"
                : isPlaceContent ? "86px"
                : (itemLevel || crossAlign) ? "auto"
                : heights[i % heights.length] + "px",
              display: "grid", placeItems: "center",
              // place-content: pin each item's number to its START (left) edge so
              // that when the over-wide row is shifted by `unsafe center/end`/`center`
              // the leftmost label scrolls off (clipped) while `safe *` keeps it at the
              // track's left edge -> the safe/unsafe pair stops looking identical.
              justifyItems: isPlaceContent ? "start" : undefined,
              borderRadius: "7px", fontFamily: "var(--mono)", fontSize: (crossAlign ? 12 + (i % 3) * 7 : 12) + "px",
              padding: itemLevel ? "16px 18px" : isPlaceContent ? "0 0 0 9px" : (crossAlign ? (6 + (i % 3) * 12) + "px 8px" : "0 6px"),
              background: hi ? "var(--accent)" : "color-mix(in srgb, var(--accent) 16%, var(--bg-3))",
              color: hi ? "#fff" : "var(--ink-2)",
              border: "1px solid " + (hi ? "var(--accent)" : "var(--line)"),
              flex: itemLevel ? (hi ? value.css.replace(/.*:/, "").replace(";", "").trim() + " 1 auto" : "0 1 auto") : "none",
              transition: "flex 200ms var(--ease), background 200ms var(--ease)",
            };
            return <div key={i} style={style}>{hi ? value.value : i + 1}</div>;
          })}
        </div>
        {isPlaceContent ? (
          <React.Fragment>
            <span className="glass-label" style={{ top: "auto", bottom: "calc(50% + 4px)", left: "14px", color: "var(--ink-3)" }}>ltr</span>
            <span className="glass-label" style={{ top: "calc(50% + 6px)", left: "14px", color: "var(--accent)" }}>rtl</span>
            <div ref={ref2} style={{ borderTop: "1px dashed var(--line)" }}>
              {items.map((i) => (
                <div key={i} style={{
                  minWidth: i === 0 ? "230%" : "46px", flexBasis: "40%", height: "40px",
                  display: "grid", placeItems: "center", justifyItems: "start",
                  padding: "0 0 0 9px", borderRadius: "7px",
                  fontFamily: "var(--mono)", fontSize: "12px",
                  background: "color-mix(in srgb, var(--accent) 16%, var(--bg-3))",
                  color: "var(--ink-2)", border: "1px solid var(--line)",
                }}>{i + 1}</div>
              ))}
            </div>
          </React.Fragment>
        ) : isJustify ? (
          <React.Fragment>
            <span className="glass-label" style={{ top: "auto", bottom: "calc(50% + 4px)", left: "14px", color: "var(--ink-3)" }}>free space</span>
            <span className="glass-label" style={{ top: "calc(50% + 6px)", left: "14px", color: "var(--accent)" }}>overflow</span>
            <div ref={ref2} style={{ borderTop: "1px dashed var(--line)" }}>
              {items.map((i) => (
                <div key={i} style={{
                  minWidth: "150px", height: "40px", flex: "none",
                  display: "grid", placeItems: "center", justifyItems: "start",
                  padding: "0 0 0 10px", borderRadius: "7px",
                  fontFamily: "var(--mono)", fontSize: "12px",
                  background: "color-mix(in srgb, var(--accent) 16%, var(--bg-3))",
                  color: "var(--ink-2)", border: "1px solid var(--line)",
                }}>{i + 1}</div>
              ))}
            </div>
          </React.Fragment>
        ) : null}
      </div>
      <div className="controls">
        <div className="controls-label">{property.name}</div>
        <ValueControl property={property} value={value} onChange={onChange} />
        <div className="ctrl-row" style={{ marginTop: "6px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
          <div className="ctrl-head">
            <span className="name">items</span>
            <span className="num">{count}</span>
          </div>
          <div className="seg">
            {[2, 3, 4, 5, 6].map((c) => (
              <button key={c} className={count === c ? "active" : ""} onClick={() => setCount(c)}>{c}</button>
            ))}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   2 · TRANSFORM 3D STAGE
--------------------------------------------------------------- */
function Transform3DDemo({ property, family, value, onChange }) {
  const wrapRef = useRef(null);
  const cardRef = useRef(null);
  const isPerspective = property.name === "perspective";

  useEffect(() => {
    if (!wrapRef.current || !cardRef.current) return;
    if (isPerspective) {
      const pv = value.value === "none" ? "none" : value.value;
      wrapRef.current.style.perspective = pv;
      wrapRef.current.style.perspectiveOrigin = "50% 50%";
      cardRef.current.style.cssText = "transform: rotateY(38deg) rotateX(8deg);";
    } else {
      // Tighter perspective (260px vs 640px) strongly amplifies how Z depth reads:
      // small Z offsets (translateZ(24px); translate's 8/16/24/48/64px Z) now scale and
      // recede visibly instead of collapsing onto none. The off-center perspective-origin
      // throws any pure-Z motion sideways (parallax), so Z-only-different values that used
      // to land in the same spot now fan out to distinct screen positions.
      // translate's Z steps are only 8/16/24/48/64px apart; at 260px focal length the
      // size-scale between 8px and 16px is ~3% (barely readable in a thumbnail). A tight
      // 150px focal length for `translate` more than doubles that foreshortening (Z=8 ->
      // ~5.6% upscale, Z=16 -> ~11.9%) AND, paired with a strongly off-centre
      // perspective-origin (12% 16%), throws each Z value far further up-and-left as a
      // parallax shift so 24px 8px 8px vs 24px 8px 16px land at distinctly different
      // size AND screen position.
      wrapRef.current.style.perspective = property.name === "translate" ? "120px" : "260px";
      // translate uses a much more off-centre perspective-origin so a pure-Z
      // difference (8 vs 16 vs 24px) throws the card far further up-and-left as a
      // parallax shift, on top of the size foreshortening — making adjacent Z
      // steps land at clearly distinct positions instead of a few px apart.
      wrapRef.current.style.perspectiveOrigin = property.name === "translate" ? "12% 16%" : "24% 30%";
      // keyword props (transform-origin/style) need a visible transform to read against
      const ambient = (property.name === "transform-origin" || property.name === "transform-style")
        ? "transform: rotateY(28deg);" : "";
      // translate's percentage Y components resolve against the element's OWN height,
      // so on the default 98px-tall card 30%/50%/65%/80% land only ~14-19px apart and
      // collide at thumbnail scale (e.g. 24px 50% vs 24px 30% vs 24px 80%). Re-stage the
      // card as a tall fixed box for translate so the same percentages resolve against a
      // ~226px height: 30% -> 68px, 50% -> 113px, 65% -> 147px, 80% -> 181px — now
      // 34-45px apart and clearly distinct rows. width/height are forced here (cssText
      // replaces the inline style) so the staged box is deterministic regardless of
      // React re-render timing; a narrower 110px width keeps the taller box inside the
      // 380px stage and adds vertical headroom for the 80% offset.
      const box = property.name === "translate"
        ? "width: 110px; height: 226px; font-size: 12px; " : "";
      cardRef.current.style.cssText = box + ambient + value.css;
    }
  });

  return (
    <React.Fragment>
      <div className="glass" ref={wrapRef} style={{ perspective: "260px", perspectiveOrigin: "24% 30%", transformStyle: "preserve-3d" }}>
        <span className="glass-label">{isPerspective ? "perspective scene" : "transform-box"}</span>
        {/* floor grid for depth */}
        <div style={{
          position: "absolute", inset: "auto 0 0 0", height: "44%",
          background: "linear-gradient(transparent, color-mix(in srgb, var(--accent) 6%, transparent))",
          backgroundImage: "linear-gradient(var(--grid-dot) 1px, transparent 1px), linear-gradient(90deg, var(--grid-dot) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
          transform: "rotateX(72deg)", transformOrigin: "bottom", opacity: 0.5, pointerEvents: "none",
        }} />
        <div ref={cardRef} style={{
          width: "150px", height: "98px", borderRadius: "10px",
          background: "linear-gradient(140deg, var(--accent), color-mix(in srgb, var(--accent) 50%, #000))",
          display: "grid", placeItems: "center", color: "#fff",
          fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.08em",
          boxShadow: "0 30px 50px -18px color-mix(in srgb, var(--accent) 55%, transparent)",
          transition: "transform 260ms var(--ease)", position: "relative", zIndex: 2,
          transformStyle: "preserve-3d",
        }}>
          {/* a real 3D-tilted inner face so transform-functions that only act on 3D
              DESCENDANTS — notably transform: perspective(24px) — have something to bite on.
              With the card flat (none), this panel just sits rotated; once perspective(24px)
              is applied to the card the panel's rotateY is foreshortened by the 24px focal
              length and reads dramatically different from none. */}
          <div style={{
            position: "absolute", inset: "14px", borderRadius: "7px",
            background: "color-mix(in srgb, #fff 16%, transparent)",
            border: "1px solid color-mix(in srgb, #fff 30%, transparent)",
            transform: "rotateY(42deg)", transformOrigin: "left center",
            display: "grid", placeItems: "center", pointerEvents: "none",
          }} />
          {property.name}
        </div>
      </div>
      <div className="controls">
        <div className="controls-label">{property.name}</div>
        <ValueControl property={property} value={value} onChange={onChange} presetsAsChips={property.valueType === "function"} />
        <p style={{ fontSize: "12.5px", color: "var(--ink-2)", lineHeight: 1.5, marginTop: "4px" }}>
          {property.valueType === "angle"
            ? "Drag the dial or use arrow keys. The card pivots in real perspective space."
            : "Pick a value to apply it to the staged element."}
        </p>
      </div>
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   3 · COLOR LAB  (branches by property)
--------------------------------------------------------------- */
const COLOR_SWATCHES = [
  "#c5483c", "#e07a3c", "#d8b13a", "oklch(62% 0.14 150)",
  "oklch(60% 0.13 200)", "#2f5fd0", "oklch(55% 0.16 290)", "#8a3ca0",
  "#1c1813", "#ece6d8",
];

function ColorDemo({ property, family, value, onChange }) {
  const name = property.name;
  if (name === "color-mix()") return <ColorMixLab property={property} value={value} onChange={onChange} />;
  if (name === "light-dark()") return <LightDarkLab property={property} value={value} onChange={onChange} />;
  if (name === "opacity") return <OpacityLab property={property} value={value} onChange={onChange} />;
  if (name === "accent-color") return <AccentColorLab property={property} value={value} onChange={onChange} />;
  if (name === "color-scheme") return <ColorSchemeLab property={property} value={value} onChange={onChange} />;
  return <PlainColorLab property={property} value={value} onChange={onChange} />;
}

function SwatchPicker({ active, onPick, colors = COLOR_SWATCHES }) {
  return (
    <div className="swatch-grid">
      {colors.map((c) => (
        <button key={c} className={"swatch" + (c === active ? " active" : "")}
          style={{ background: c }} onClick={() => onPick(c)} title={c} />
      ))}
    </div>
  );
}

function PlainColorLab({ property, value, onChange }) {
  const c = value.value === "currentColor" ? "var(--accent)" : value.value;
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">color</span>
        <div style={{ textAlign: "center", color: c }}>
          <div style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: "84px", lineHeight: 1 }}>Aa</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: "12px", marginTop: "12px", letterSpacing: "0.04em" }}>
            color: {value.value}
          </div>
        </div>
      </div>
      <div className="controls">
        <div className="controls-label">color</div>
        <SwatchPicker active={value.value}
          onPick={(c) => onChange({ value: c, css: `color: ${c};` })} />
        <p style={{ fontSize: "12.5px", color: "var(--ink-2)", lineHeight: 1.5 }}>
          Modern syntaxes — hex, <span className="mono">oklch()</span>, <span className="mono">currentColor</span> — all resolve to the same paint.
        </p>
      </div>
    </React.Fragment>
  );
}

function OpacityLab({ property, value, onChange }) {
  const a = parseFloat(value.value);
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">opacity</span>
        <div style={{ position: "relative", display: "grid", placeItems: "center" }}>
          <div style={{
            position: "absolute", width: "180px", height: "120px", borderRadius: "10px",
            backgroundImage: "repeating-conic-gradient(var(--line) 0 25%, transparent 0 50%)",
            backgroundSize: "20px 20px",
          }} />
          <div style={{
            width: "180px", height: "120px", borderRadius: "10px", opacity: isNaN(a) ? 1 : a,
            background: "linear-gradient(140deg, var(--accent), oklch(60% 0.13 250))",
            display: "grid", placeItems: "center", color: "#fff", fontFamily: "var(--mono)",
            fontSize: "13px", position: "relative",
          }}>{value.value}</div>
        </div>
      </div>
      <div className="controls">
        <div className="controls-label">opacity</div>
        <ScalarControl property={property} valueStr={value.value} onChange={onChange} />
        <p style={{ fontSize: "12.5px", color: "var(--ink-2)", lineHeight: 1.5 }}>
          Opacity flattens the whole element — note the checkerboard showing through.
        </p>
      </div>
    </React.Fragment>
  );
}

function AccentColorLab({ property, value, onChange }) {
  const ac = value.value;
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">accent-color</span>
        <div style={{ accentColor: ac, display: "grid", gap: "20px", fontFamily: "var(--sans)", color: "var(--ink)" }}>
          <label style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input type="checkbox" defaultChecked style={{ width: "20px", height: "20px" }} /> Specimen logged
          </label>
          <label style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input type="radio" defaultChecked name="ac" style={{ width: "20px", height: "20px" }} /> Catalogued
          </label>
          <input type="range" defaultValue="62" style={{ width: "180px" }} />
          <progress value="0.62" style={{ width: "180px" }} />
        </div>
      </div>
      <div className="controls">
        <div className="controls-label">accent-color</div>
        <SwatchPicker active={ac} onPick={(c) => onChange({ value: c, css: `accent-color: ${c};` })} />
        <p style={{ fontSize: "12.5px", color: "var(--ink-2)", lineHeight: 1.5 }}>
          One declaration tints every native control at once.
        </p>
      </div>
    </React.Fragment>
  );
}

function ColorSchemeLab({ property, value, onChange }) {
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">color-scheme</span>
        <div style={{
          colorScheme: value.value, background: "Canvas", color: "CanvasText",
          border: "1px solid var(--line)", borderRadius: "10px", padding: "22px",
          display: "grid", gap: "14px", width: "230px", fontFamily: "var(--sans)",
        }}>
          <strong style={{ fontFamily: "var(--serif)", fontSize: "16px" }}>Field notes</strong>
          <input type="text" placeholder="Specimen name" style={{ padding: "7px 9px", fontFamily: "var(--sans)" }} />
          <select style={{ padding: "7px 9px" }}><option>Family…</option><option>Transforms</option></select>
          <button style={{ padding: "8px" }}>Submit</button>
        </div>
      </div>
      <div className="controls">
        <div className="controls-label">color-scheme</div>
        <ValueChips values={property.values} active={value.value} onChange={onChange} />
        <p style={{ fontSize: "12.5px", color: "var(--ink-2)", lineHeight: 1.5 }}>
          The UA repaints form controls, <span className="mono">Canvas</span> and scrollbars to the declared scheme.
        </p>
      </div>
    </React.Fragment>
  );
}

function ColorMixLab({ property, value, onChange }) {
  const [a, setA] = useState("#c5483c");
  const [b, setB] = useState("#2f5fd0");
  const [ratio, setRatio] = useState(50);
  const [space, setSpace] = useState("oklch");
  const [pick, setPick] = useState("a");
  const css = `background: color-mix(in ${space}, ${a} ${ratio}%, ${b});`;
  useEffect(() => { onChange({ value: `color-mix(in ${space}, ${a} ${ratio}%, ${b})`, css }); }, [a, b, ratio, space]);
  const mix = `color-mix(in ${space}, ${a} ${ratio}%, ${b})`;
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">color-mix()</span>
        <div style={{ display: "grid", gap: "14px", placeItems: "center" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "8px", background: a, border: "1px solid var(--line)" }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--ink-3)" }}>{ratio}% / {100 - ratio}%</span>
            <div style={{ width: "44px", height: "44px", borderRadius: "8px", background: b, border: "1px solid var(--line)" }} />
          </div>
          <div style={{ width: "210px", height: "96px", borderRadius: "10px", background: mix, border: "1px solid var(--line)", boxShadow: "var(--shadow)" }} />
          <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)" }}>in {space}</div>
        </div>
      </div>
      <div className="controls">
        <div className="controls-label">color-mix()</div>
        <div className="seg">
          {["oklch", "srgb", "hsl"].map((s) => (
            <button key={s} className={space === s ? "active" : ""} onClick={() => setSpace(s)}>{s}</button>
          ))}
        </div>
        <div className="ctrl-row">
          <div className="ctrl-head"><span className="name">ratio</span><span className="num">{ratio}%</span></div>
          <input className="slider" type="range" min="0" max="100" step="5" value={ratio} onChange={(e) => setRatio(+e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--ink-3)" }}>
          editing
          <div className="seg">
            <button className={pick === "a" ? "active" : ""} onClick={() => setPick("a")}>color 1</button>
            <button className={pick === "b" ? "active" : ""} onClick={() => setPick("b")}>color 2</button>
          </div>
        </div>
        <SwatchPicker active={pick === "a" ? a : b} onPick={(c) => (pick === "a" ? setA(c) : setB(c))} />
      </div>
    </React.Fragment>
  );
}

function LightDarkLab({ property, value, onChange }) {
  const [scheme, setScheme] = useState("dark");
  const decl = value.css.startsWith("background") ? value.css : value.css;
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">light-dark()</span>
        <div style={{ colorScheme: scheme, display: "grid", gap: "16px", placeItems: "center" }}>
          <div ref={(el) => { if (el) el.style.cssText = "width:210px;height:120px;border-radius:10px;border:1px solid var(--line);display:grid;place-items:center;font-family:var(--mono);font-size:12px;" + value.css; }}>
            <span style={{ color: "light-dark(#1c1813,#ece6d8)" }}>scheme: {scheme}</span>
          </div>
          <div className="seg">
            <button className={scheme === "light" ? "active" : ""} onClick={() => setScheme("light")}>light</button>
            <button className={scheme === "dark" ? "active" : ""} onClick={() => setScheme("dark")}>dark</button>
          </div>
        </div>
      </div>
      <div className="controls">
        <div className="controls-label">light-dark()</div>
        <ValueChips values={property.values} active={value.value} onChange={onChange} />
        <p style={{ fontSize: "12.5px", color: "var(--ink-2)", lineHeight: 1.5 }}>
          Toggle the scheme — the single value resolves to its first colour in light, its second in dark.
        </p>
      </div>
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   GENERIC GLASS — best-effort preview for the rest of the codex
--------------------------------------------------------------- */
function GenericDemo({ property, family, value, onChange }) {
  const ref = useRef(null);
  const has = property.values && property.values.length;
  const kind = family.sampleKind || "box";
  const base = {
    box: "width:150px;height:96px;border-radius:10px;background:var(--accent);box-shadow:0 24px 44px -22px color-mix(in srgb,var(--accent) 55%,transparent);",
    text: "margin:0;font-family:var(--serif);font-size:21px;line-height:1.5;color:var(--ink);max-width:30ch;text-align:left;",
    swatch: "width:150px;height:96px;border-radius:10px;background:var(--accent);",
    flex: "display:flex;gap:10px;padding:14px;",
  }[kind] || "width:150px;height:96px;border-radius:10px;background:var(--accent);";

  // scroll-marker-group only does anything on a real scroll container whose
  // children generate ::scroll-marker pseudo-elements: it controls whether the
  // ::scroll-marker-group row of dots exists and whether it sits before/after
  // the content. A bare box can never show this, so build a live snap carousel.
  const isSmg = property.name === "scroll-marker-group";
  const smgKeyword = isSmg ? (value.css || "").replace(/^scroll-marker-group:\s*/, "").replace(/;.*$/, "").trim() : "";

  useEffect(() => {
    if (ref.current && has && !isSmg) ref.current.style.cssText = base + previewCss(property.name, value.css);
  });

  const smgBody = isSmg ? (
    <React.Fragment>
      <style>{`
        .cdx-smg{display:flex;gap:12px;width:230px;max-width:100%;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;padding:10px;border-radius:10px;background:var(--bg-3);anchor-name:none}
        .cdx-smg>.cdx-smg-slide{flex:0 0 86%;height:86px;scroll-snap-align:center;border-radius:8px;display:grid;place-items:center;font-family:var(--mono);font-size:15px;color:#fff}
        .cdx-smg>.cdx-smg-slide:nth-child(1){background:var(--accent)}
        .cdx-smg>.cdx-smg-slide:nth-child(2){background:#3c7dc5}
        .cdx-smg>.cdx-smg-slide:nth-child(3){background:#4c9a52}
        .cdx-smg>.cdx-smg-slide:nth-child(4){background:#8a63d2}
        .cdx-smg>.cdx-smg-slide::scroll-marker{content:"";width:11px;height:11px;border-radius:50%;border:2px solid var(--ink-3);margin:0 4px;background:transparent}
        .cdx-smg>.cdx-smg-slide::scroll-marker:target-current{border-color:var(--accent);background:var(--accent)}
        .cdx-smg::scroll-marker-group{display:flex;justify-content:center;align-items:center;padding:6px 0}
      `}</style>
      <div
        className="cdx-smg"
        style={{ scrollMarkerGroup: smgKeyword }}
      >
        <div className="cdx-smg-slide">1</div>
        <div className="cdx-smg-slide">2</div>
        <div className="cdx-smg-slide">3</div>
        <div className="cdx-smg-slide">4</div>
      </div>
    </React.Fragment>
  ) : null;

  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">{has ? "preview" : "specimen"}</span>
        {has ? (
          isSmg
            ? smgBody
            : kind === "text"
              ? <p ref={ref}>The quick brown fox jumps over the lazy dog — 0123456789.</p>
              : <div ref={ref} />
        ) : (
          <div className="ph-text" style={{ textAlign: "center", color: "var(--ink-3)" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "13px", lineHeight: 1.7 }}>
              <span style={{ color: "var(--accent)" }}>{property.name}</span><br />
              demonstrator supplied by<br />the full codex backend
            </div>
          </div>
        )}
      </div>
      <div className="controls">
        <div className="controls-label">{property.name}</div>
        {has ? (
          <ValueChips values={property.values} active={value.value} onChange={onChange} />
        ) : (
          <div className="empty-note">
            This specimen is catalogued.<br />Live values stream in from the data layer (§9).
          </div>
        )}
        <p style={{ fontSize: "12.5px", color: "var(--ink-2)", lineHeight: 1.5, marginTop: "4px" }}>{property.description}</p>
      </div>
    </React.Fragment>
  );
}

/* ---------- demo registry ---------- */
function getDemo(family) {
  return { flex: FlexDemo, transform3d: Transform3DDemo, color: ColorDemo }[family.demo] || GenericDemo;
}

Object.assign(window, { getDemo, FlexDemo, Transform3DDemo, ColorDemo, GenericDemo, ValueControl });
