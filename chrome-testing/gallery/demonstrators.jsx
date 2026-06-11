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
  const ref = useRef(null);
  const heights = [44, 66, 34, 56, 48, 40];

  useEffect(() => {
    if (!ref.current) return;
    const base = itemLevel
      ? "display:flex;gap:14px;align-items:stretch;justify-content:flex-start;width:100%;height:100%;padding:26px;flex-wrap:nowrap;"
      : "display:flex;gap:14px;flex-wrap:wrap;align-items:center;justify-content:center;align-content:center;width:100%;height:100%;padding:26px;";
    ref.current.style.cssText = base + (itemLevel ? "" : value.css);
  });

  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">display: flex</span>
        <div ref={ref}>
          {items.map((i) => {
            const hi = itemLevel && i === 1;
            const style = {
              minWidth: itemLevel ? "52px" : "46px",
              height: itemLevel ? "auto" : heights[i % heights.length] + "px",
              display: "grid", placeItems: "center",
              borderRadius: "7px", fontFamily: "var(--mono)", fontSize: "12px",
              padding: itemLevel ? "16px 18px" : "0 6px",
              background: hi ? "var(--accent)" : "color-mix(in srgb, var(--accent) 16%, var(--bg-3))",
              color: hi ? "#fff" : "var(--ink-2)",
              border: "1px solid " + (hi ? "var(--accent)" : "var(--line)"),
              flex: itemLevel ? (hi ? value.css.replace(/.*:/, "").replace(";", "").trim() + " 1 auto" : "0 1 auto") : "none",
              transition: "flex 200ms var(--ease), background 200ms var(--ease)",
            };
            return <div key={i} style={style}>{hi ? value.value : i + 1}</div>;
          })}
        </div>
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
      cardRef.current.style.cssText = "transform: rotateY(38deg) rotateX(8deg);";
    } else {
      wrapRef.current.style.perspective = "640px";
      // keyword props (transform-origin/style) need a visible transform to read against
      const ambient = (property.name === "transform-origin" || property.name === "transform-style")
        ? "transform: rotateY(28deg);" : "";
      cardRef.current.style.cssText = ambient + value.css;
    }
  });

  return (
    <React.Fragment>
      <div className="glass" ref={wrapRef} style={{ perspective: "640px", transformStyle: "preserve-3d" }}>
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
        }}>
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

  useEffect(() => {
    if (ref.current && has) ref.current.style.cssText = base + previewCss(property.name, value.css);
  });

  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">{has ? "preview" : "specimen"}</span>
        {has ? (
          kind === "text"
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
