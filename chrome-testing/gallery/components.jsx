/* ============================================================
   THE CSS CODEX — shared UI atoms & the Specimen scaffolding
   ============================================================ */
const { useState, useEffect, useRef, useCallback } = React;

/* Properties whose values must NOT be applied as live inline CSS: certain
   anchor-positioning `try` tactics (e.g. position-try with flip tactics) send
   the layout engine into an unbounded reflow when applied without an anchored
   context — they hang headless Chrome and jank real browsers. They are shown
   label-only (the grammar-derived values are still listed; just not painted). */
const PREVIEW_UNSAFE = new Set(["position-try", "position-try-fallbacks", "position-try-order"]);
function previewCss(propertyName, css) {
  return PREVIEW_UNSAFE.has(propertyName) ? "" : (css || "");
}

/* ---------- toast (global, event-driven) ---------- */
function toast(msg) {
  window.dispatchEvent(new CustomEvent("codex-toast", { detail: msg }));
}
function ToastHost() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    let t;
    const on = (e) => {
      setMsg(e.detail);
      clearTimeout(t);
      t = setTimeout(() => setMsg(null), 1700);
    };
    window.addEventListener("codex-toast", on);
    return () => { window.removeEventListener("codex-toast", on); clearTimeout(t); };
  }, []);
  if (!msg) return null;
  return (
    <div className="toast" role="status">
      <span style={{ color: "var(--accent)" }}>✓</span> {msg}
    </div>
  );
}

/* ---------- MiniSample — applies a declaration to a representative element ---------- */
function MiniSample({ kind, css }) {
  const ref = useRef(null);
  const base = {
    flex: "display:flex;gap:7px;align-items:center;justify-content:center;width:100%;height:100%;padding:12px;",
    box3d: "width:78px;height:52px;border-radius:8px;background:linear-gradient(140deg,var(--accent),color-mix(in srgb,var(--accent) 55%,#000));box-shadow:0 16px 28px -14px color-mix(in srgb,var(--accent) 55%,transparent);",
    box: "width:96px;height:62px;border-radius:8px;background:var(--accent);",
    text: "margin:0;font-size:13px;line-height:1.45;color:var(--ink);max-width:24ch;",
    swatch: "display:grid;place-items:center;width:90px;height:62px;border-radius:8px;background:var(--bg-3);font-family:var(--mono);font-size:22px;color:var(--accent);",
  }[kind] || "";

  useEffect(() => {
    if (ref.current) ref.current.style.cssText = base + (css || "");
  }, [css, base]);

  if (kind === "flex") {
    return (
      <div className="ms-flex" ref={ref}>
        <span style={miniItem(26)} />
        <span style={miniItem(38)} />
        <span style={miniItem(20)} />
      </div>
    );
  }
  if (kind === "box3d") {
    return (
      <div style={{ perspective: "520px", display: "grid", placeItems: "center", width: "100%", height: "100%", transformStyle: "preserve-3d" }}>
        <div ref={ref} />
      </div>
    );
  }
  if (kind === "text") return <p className="ms-text" ref={ref}>The quick brown fox.</p>;
  if (kind === "swatch") return <div className="ms-swatch" ref={ref}><span>Aa</span></div>;
  return <div className="ms-box" ref={ref} />;
}
function miniItem(h) {
  return { width: "20px", height: h + "px", borderRadius: "4px", background: "var(--accent)", flex: "none", display: "block" };
}

/* ---------- CSS tokeniser → highlighted code ---------- */
function CodeBlock({ css, selector = ".specimen", title = "Generated CSS" }) {
  const decls = (css || "").split(";").map((d) => d.trim()).filter(Boolean);
  const copy = () => {
    const text = `${selector} {\n${decls.map((d) => "  " + d + ";").join("\n")}\n}`;
    navigator.clipboard && navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  };
  return (
    <div className="codeblock">
      <div className="code-head">
        <span className="t">{title}</span>
        <button className="copy-btn" onClick={copy}>
          <CopyIcon /> Copy
        </button>
      </div>
      <div className="code-body">
        <span className="tok-sel">{selector}</span> <span className="tok-punc">{"{"}</span>{"\n"}
        {decls.map((d, i) => {
          const ci = d.indexOf(":");
          const prop = d.slice(0, ci).trim();
          const val = d.slice(ci + 1).trim();
          return (
            <React.Fragment key={i}>
              {"  "}
              <span className="tok-prop">{prop}</span>
              <span className="tok-punc">: </span>
              <span className="tok-val hi">{val}</span>
              <span className="tok-punc">;</span>
              {"\n"}
            </React.Fragment>
          );
        })}
        <span className="tok-punc">{"}"}</span>
      </div>
    </div>
  );
}

/* ---------- Grammar Drawer (EBNF / syntax / data types) ---------- */
function GrammarDrawer({ property }) {
  const [open, setOpen] = useState(false);
  const hasSyntax = property.syntax || property.ebnf;
  if (!hasSyntax) return null;
  return (
    <div className={"grammar" + (open ? " open" : "")}>
      <button className="grammar-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="chev">▸</span>
        <span className="gt-title">Grammar</span>
        <span className="gt-sub">EBNF · syntax · data types</span>
      </button>
      <div className="grammar-body">
        <div>
          <div className="grammar-inner">
            {property.syntax && (
              <div className="gram-field">
                <div className="gf-label">Value definition syntax</div>
                <pre>{property.syntax}</pre>
              </div>
            )}
            {property.ebnf && (
              <div className="gram-field">
                <div className="gf-label">Grammar rule</div>
                <pre>{property.ebnf}</pre>
              </div>
            )}
            <div className="gram-field">
              <div className="gf-label">Initial / catalogue</div>
              <div className="gram-types">
                <span className="pill">№ {property.number}</span>
                <span className="pill">{property.valueType}</span>
                {property.maturity && <span className="pill accent">{property.maturity}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Provenance banner — how this specimen's values were produced ---------- */
function ProvenanceBanner({ property }) {
  const prov = property.provenance || "pure";
  const tc = property.trueCount || (property.values ? property.values.length : 0);
  const shown = property.shown != null ? property.shown : (property.values ? property.values.length : 0);
  const tone = { pure: "var(--accent)", assisted: "#caa23a", empty: "var(--ink-3)" }[prov] || "var(--ink-3)";
  const box = {
    border: "1px solid var(--line)", borderLeft: `3px solid ${tone}`,
    borderRadius: "8px", padding: "12px 16px", margin: "0 0 22px",
    background: "var(--bg-2)", fontSize: "12.5px", lineHeight: 1.55,
  };
  const tag = (t) => (
    <span style={{ fontFamily: "var(--mono)", fontSize: "10.5px", textTransform: "uppercase",
      letterSpacing: "0.08em", color: tone, border: `1px solid ${tone}`, borderRadius: "4px",
      padding: "2px 7px", marginRight: "10px", whiteSpace: "nowrap" }}>{t}</span>
  );

  if (prov === "empty") {
    return (
      <div style={box}>
        {tag("representational")}
        <span style={{ color: "var(--ink-2)" }}>
          No true values. This property's grammar head is entirely optional or a repeated list,
          so walking the EBNF produces no concrete terminal. This page is catalogued for reference only.
        </span>
      </div>
    );
  }
  if (prov === "assisted") {
    return (
      <div style={box}>
        <div style={{ marginBottom: property.assists && property.assists.length ? "8px" : 0 }}>
          {tag("path-walked · assisted")}
          <span style={{ color: "var(--ink-2)" }}>
            Every structural choice is walked from the grammar, and only the open-ended leaf types below
            are sampled (as they are just literals).
            {property.truncated ? ` Showing ${shown} of ${tc}+ values.` : ` All ${shown} forms shown.`}
          </span>
        </div>
        {property.assists && property.assists.length > 0 && (
          <div style={{ display: "grid", gap: "4px", marginTop: "6px" }}>
            {property.assists.map((a) => (
              <div key={a.type} style={{ fontFamily: "var(--mono)", fontSize: "11.5px" }}>
                <span style={{ color: tone }}>{a.type}</span>
                <span style={{ color: "var(--ink-3)" }}> → </span>
                <span style={{ color: "var(--ink-2)" }}>{a.samples.join(", ")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  // pure
  return (
    <div style={box}>
      {tag("true path-walked")}
      <span style={{ color: "var(--ink-2)" }}>
        {property.truncated
          ? `Fully grammar path-walked from the EBNF. Showing ${shown} of ${tc}+ enumerable values (the rest are the same shape).`
          : `Fully grammar path-walked from the EBNF. Every one of the ${shown} possible values enumerated. No samples.`}
      </span>
    </div>
  );
}

/* ---------- Difference Strip (small multiples, paginated) ---------- */
function DifferenceStrip({ property, family, activeValue, onPick }) {
  const PER_PAGE = 12;
  const [page, setPage] = useState(0);
  const all = property.values || [];
  if (all.length < 2) return null;
  const pages = Math.ceil(all.length / PER_PAGE);
  const start = page * PER_PAGE;
  const slice = all.slice(start, start + PER_PAGE);
  const more = property.truncated ? ` · ${property.trueCount}+ in grammar` : "";
  return (
    <div className="diff">
      <div className="diff-head">
        <span className="t">Difference strip · {all.length} values{more}</span>
        {pages > 1 ? (
          <span className="t" style={{ color: "var(--ink-3)", display: "flex", gap: "8px", alignItems: "center" }}>
            <button className="xl-chip" style={{ padding: "2px 8px" }}
              onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>‹</button>
            {start + 1}–{Math.min(start + PER_PAGE, all.length)} of {all.length}
            <button className="xl-chip" style={{ padding: "2px 8px" }}
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page === pages - 1}>›</button>
          </span>
        ) : (
          <span className="t" style={{ color: "var(--ink-3)" }}>same specimen, every value</span>
        )}
      </div>
      <div className="diff-grid">
        {slice.map((val) => (
          <div
            key={val.value}
            className={"diff-cell" + (val.value === activeValue ? " active" : "")}
            onClick={() => onPick(val)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick(val)}
          >
            <div className="diff-mini">
              <MiniSample kind={family.sampleKind} css={previewCss(property.name, val.css)} />
            </div>
            <div className="diff-cap">{val.label || val.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Generic value controls (keyword / number / length) ---------- */
function ValueChips({ values, active, onChange }) {
  return (
    <div className="chips">
      {values.map((val) => (
        <button
          key={val.value}
          className={"chip" + (val.value === active ? " active" : "")}
          data-codex-val={val.value}
          onClick={() => onChange(val)}
        >
          {val.label || val.value}
        </button>
      ))}
    </div>
  );
}

/* numeric/length slider — controlled by the css value string */
function ScalarControl({ property, valueStr, onChange }) {
  const isLen = property.valueType === "length";
  const unit = property.unit || (isLen ? "px" : "");
  const min = property.min != null ? property.min : 0;
  const max = property.max != null ? property.max : 100;
  const step = property.step != null ? property.step : 1;
  const n = (() => {
    const parsed = parseFloat(valueStr);
    return isNaN(parsed) ? (parseFloat(property.defaultValue) || min) : parsed;
  })();
  const set = (x) => onChange({ value: `${x}${unit}`, css: `${property.name}: ${x}${unit};` });
  return (
    <div className="ctrl-row">
      <div className="ctrl-head">
        <span className="name">{property.name}</span>
        <span className="num">{n}{unit}</span>
      </div>
      <input
        className="slider" type="range" min={min} max={max} step={step} value={n}
        onChange={(e) => set(parseFloat(e.target.value))}
      />
    </div>
  );
}

/* ---------- Rotary dial (angle values) ---------- */
function Dial({ value, onChange, min = -180, max = 180 }) {
  const ref = useRef(null);
  const drag = (clientX, clientY) => {
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let deg = Math.atan2(clientY - cy, clientX - cx) * 180 / Math.PI + 90;
    if (deg > 180) deg -= 360;
    deg = Math.max(min, Math.min(max, Math.round(deg)));
    onChange(deg);
  };
  const onDown = (e) => {
    e.preventDefault();
    const move = (ev) => {
      const p = ev.touches ? ev.touches[0] : ev;
      drag(p.clientX, p.clientY);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  return (
    <div className="dial-wrap">
      <div className="dial" ref={ref} onPointerDown={onDown} role="slider" aria-valuenow={value} tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(max, value + 1));
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(min, value - 1));
        }}>
        <div className="tick" style={{ transform: `rotate(${value}deg)` }} />
        <div className="hub" />
      </div>
      <div className="dial-read">{value}<span>deg</span></div>
    </div>
  );
}

/* ---------- small icons (stroked, no slop) ---------- */
function CopyIcon() {
  return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>);
}
function SearchIcon() {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>);
}
function MenuIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M3 12h18M3 18h18" /></svg>);
}
function ArrowIcon() {
  return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
}

Object.assign(window, {
  toast, ToastHost, MiniSample, CodeBlock, GrammarDrawer, DifferenceStrip,
  ProvenanceBanner, ValueChips, ScalarControl, Dial, CopyIcon, SearchIcon, MenuIcon, ArrowIcon,
});
