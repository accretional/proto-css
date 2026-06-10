/* ============================================================
   THE CSS CODEX — Live behavioural demonstrators
   Properties that only mean something in motion or on interaction
   (animations, transitions, scrolling, cursor, selection, filters)
   get a demonstrator that actually runs the behaviour and shows how
   each value differs. Controls expose `data-codex-val` anchors so the
   screenshot driver can toggle every value.
   ============================================================ */

const camel = (n) => n.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/* shared keyframes, injected once */
const CODEX_KEYFRAMES = `
@keyframes codex-slide { from { transform: translateX(-72px); } to { transform: translateX(72px); } }
@keyframes codex-spin  { to { transform: rotate(360deg); } }
@keyframes codex-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: .55; } }
/* keyframes NAMED after the generator's idents so animation-name's values each
   drive a visibly distinct motion (none → no motion). */
@keyframes my-ident { from { transform: translateX(-72px); } to { transform: translateX(72px); } }
@keyframes tag-a    { to { transform: rotate(360deg); } }
@keyframes Specimen { 0%,100% { transform: scale(.7); } 50% { transform: scale(1.5); } }
@keyframes Aa       { 0%,100% { border-radius: 10px; } 50% { border-radius: 50%; } }
@keyframes "Specimen" { 0%,100% { transform: scale(.7); } 50% { transform: scale(1.5); } }
@keyframes "Aa"       { 0%,100% { border-radius: 10px; } 50% { border-radius: 50%; } }
`;
function useKeyframes() {
  useEffect(() => {
    if (document.getElementById("codex-kf")) return;
    const s = document.createElement("style");
    s.id = "codex-kf";
    s.textContent = CODEX_KEYFRAMES;
    document.head.appendChild(s);
  }, []);
}

/* which live demonstrator (if any) a property uses */
function behaviorOf(property, family) {
  if (family.demo && family.demo !== "generic") return family.demo; // flex / transform3d / color
  const n = property.name;
  if (/^animation/.test(n)) return "animation";
  if (/^transition/.test(n)) return "transition";
  if (n === "scroll-behavior" || /^scroll-snap/.test(n) || /^scroll-padding/.test(n) ||
      /^scroll-margin/.test(n) || /^overflow/.test(n) || /^overscroll/.test(n) || /^scrollbar/.test(n))
    return "scroll";
  if (n === "cursor") return "cursor";
  if (/^caret/.test(n)) return "interactive";
  if (["user-select", "user-modify", "pointer-events", "resize", "appearance", "field-sizing", "touch-action", "accent-color"].includes(n))
    return "interactive";
  if (["filter", "backdrop-filter", "mix-blend-mode", "background-blend-mode", "box-shadow", "isolation"].includes(n))
    return "filter";
  return "static";
}
function isLive(property, family) {
  const b = behaviorOf(property, family);
  return b !== "static" && b !== "generic";
}
function familyHasLive(f) {
  return f.focus || (f.properties || []).some((p) => isLive(p, f));
}

/* common control footer with value chips that carry screenshot anchors */
function LiveControls({ property, value, onChange, hint }) {
  return (
    <div className="controls">
      <div className="controls-label">{property.name}</div>
      {property.values && property.values.length > 0
        ? <ValueChips values={property.values} active={value.value} onChange={onChange} />
        : <div className="empty-note">No enumerable values.</div>}
      {hint && <p style={{ fontSize: "12.5px", color: "var(--ink-2)", lineHeight: 1.5, marginTop: "4px" }}>{hint}</p>}
    </div>
  );
}

/* ---------------------------------------------------------------
   ANIMATION — a box runs a keyframe animation; the tested longhand
   is substituted so duration/easing/direction/iteration/play-state
   each change the motion. A replay button restarts finite runs.
--------------------------------------------------------------- */
function AnimationDemo({ property, value, onChange }) {
  useKeyframes();
  const [run, setRun] = useState(0);
  const n = property.name;
  const base = {
    animationName: "codex-slide", animationDuration: "1.4s", animationTimingFunction: "ease",
    animationDelay: "0s", animationIterationCount: "infinite", animationDirection: "alternate",
    animationFillMode: "none", animationPlayState: "running",
  };
  const style = { ...base };
  const key = camel(n);
  if (n === "animation") {
    Object.assign(style, { animation: "codex-slide 1.4s ease infinite alternate" });
    style.animation = value.value && /\d/.test(value.value) ? `codex-slide ${value.value}` : style.animation;
  } else if (n === "animation-name") {
    style.animationName = value.value; // none → no motion; idents map to distinct keyframes
  } else if (key in base) {
    style[key] = value.value;
  } else {
    style.animationName = "codex-slide"; // -composition/-range/-timeline: run base, label the value
  }
  // finite, terminal-state properties read better as a single forward run
  if (n === "animation-fill-mode" || n === "animation-iteration-count") {
    style.animationDirection = "normal";
    if (n === "animation-fill-mode") style.animationIterationCount = "1";
  }
  const hint = n === "animation-play-state"
    ? "running animates; paused freezes the box mid-track."
    : "Pick a value — the box's motion changes. ↻ replays finite runs.";
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">{n}</span>
        <div style={{ position: "relative", width: "100%", display: "grid", placeItems: "center" }}>
          <div key={n + value.value + run} style={{
            width: "62px", height: "62px", borderRadius: "12px",
            background: "linear-gradient(140deg, var(--accent), color-mix(in srgb, var(--accent) 50%, #000))",
            boxShadow: "0 16px 30px -14px color-mix(in srgb, var(--accent) 60%, transparent)", ...style,
          }} />
        </div>
        <button className="xl-chip" style={{ position: "absolute", right: "12px", bottom: "12px" }}
          onClick={() => setRun((r) => r + 1)}>↻ replay</button>
      </div>
      <LiveControls property={property} value={value} onChange={onChange} hint={hint} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   TRANSITION — a box auto-toggles between two states; the tested
   transition longhand controls how the change interpolates.
--------------------------------------------------------------- */
function TransitionDemo({ property, value, onChange }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setOn((o) => !o), 1700);
    return () => clearInterval(id);
  }, []);
  const n = property.name;
  const base = {
    transitionProperty: "transform, background-color, border-radius",
    transitionDuration: "0.8s", transitionTimingFunction: "ease", transitionDelay: "0s",
  };
  const style = { ...base };
  const key = camel(n);
  if (n === "transition") style.transition = value.value;
  else if (key in base) style[key] = value.value;
  const dyn = {
    transform: on ? "translateX(150px) rotate(8deg)" : "translateX(0) rotate(0)",
    backgroundColor: on ? "var(--accent)" : "color-mix(in srgb, var(--accent) 26%, var(--bg-3))",
    borderRadius: on ? "50%" : "12px",
  };
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">{n}</span>
        <div style={{ width: "100%", padding: "0 28px", display: "flex", alignItems: "center" }}>
          <div style={{ width: "64px", height: "64px", border: "1px solid var(--line)", ...style, ...dyn }} />
        </div>
        <button className="xl-chip" style={{ position: "absolute", right: "12px", bottom: "12px" }}
          data-codex-trigger="toggle" onClick={() => setOn((o) => !o)}>toggle</button>
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint="The box toggles every ~1.7s — watch how this value shapes the interpolation." />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   SCROLL — a scrollable container; the tested property changes how
   it overflows, snaps, or scrolls. A button drives a programmatic
   scroll (so scroll-behavior reads), children carry snap alignment.
--------------------------------------------------------------- */
function ScrollDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  // Axis: inline / left / right longhands act on the HORIZONTAL scroller; block /
  // top / bottom and the shorthands act on the VERTICAL one. A red guide line
  // marks the snapport edge so the padding/margin offset is unmistakable.
  const horiz = /(^|-)inline(-|$)|left|right/.test(n) && !/block/.test(n);
  const isPad = /scroll-padding/.test(n);
  const isMargin = /scroll-margin/.test(n);
  const isSnap = /scroll-snap/.test(n);
  const isBar = /scrollbar/.test(n);            // scrollbar-color / -width / -gutter — show a real scrollbar
  const snapping = isPad || isMargin || isSnap; // these demos snap a target to the snapport edge
  const targetIdx = 3;                          // snap THIS panel so the offset from the edge reads

  const tref = useRef(null);
  const endSide = /end|bottom|right/.test(n);    // these snap the target to the FAR edge
  const cstyle = {
    height: "190px", width: "100%", border: "1px solid var(--line)", borderRadius: "10px",
    background: "var(--bg-3)", padding: "10px", position: "relative",
    overflow: isBar ? "scroll" : "auto",
    display: horiz ? "flex" : "block", gap: horiz ? "12px" : undefined,
    // contain the scroll so it never chains to the embed page (which would push
    // the whole fixed demo out of the capture viewport — that was the blank bug).
    overscrollBehavior: /overscroll/.test(n) ? value.value : "contain",
  };
  if (!isBar && !n.startsWith("overflow") && !/overscroll/.test(n)) cstyle[camel(n)] = value.value;
  if (isBar) cstyle[camel(n)] = value.value;
  if (isSnap && /type/.test(n)) {/* value already set */}
  else if (snapping) cstyle.scrollSnapType = horiz ? "x mandatory" : "y mandatory";

  const N = isBar ? 9 : 7;
  const blocks = Array.from({ length: N }, (_, i) => i);
  // Scroll the CONTAINER ONLY (never scrollIntoView — that bubbles to the page
  // and blanks the capture) to bring the target panel to the relevant edge;
  // scroll-snap then re-aligns it, honouring scroll-padding / scroll-margin.
  const place = (smooth) => {
    const el = ref.current, t = tref.current;
    if (!el || !t) return;
    const opt = smooth ? "smooth" : "auto";
    if (horiz) el.scrollTo({ left: endSide ? t.offsetLeft + t.offsetWidth - el.clientWidth : t.offsetLeft - el.clientLeft, behavior: opt });
    else el.scrollTo({ top: endSide ? t.offsetTop + t.offsetHeight - el.clientHeight : t.offsetTop - el.clientTop, behavior: opt });
  };
  useEffect(() => { if (snapping) place(false); });
  const go = () => {
    if (!ref.current) return;
    if (snapping) { place(true); return; }
    const el = ref.current, maxT = el.scrollHeight - el.clientHeight;
    el.scrollTo({ top: el.scrollTop > maxT / 2 ? 0 : maxT, behavior: n === "scroll-behavior" ? value.value : "smooth" });
  };
  const panelStyle = (i) => {
    const s = {
      flex: horiz ? "0 0 78%" : undefined,
      height: horiz ? "auto" : "78px", margin: horiz ? 0 : "0 0 10px", borderRadius: "8px",
      background: `color-mix(in srgb, var(--accent) ${10 + i * 10}%, var(--bg-2))`,
      display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: "12px",
      color: "var(--ink-2)", scrollSnapStop: n === "scroll-snap-stop" ? value.value : undefined,
    };
    if (isSnap && /align/.test(n)) s.scrollSnapAlign = value.value;
    else if (snapping) s.scrollSnapAlign = endSide ? "end" : "start";  // end-side props engage the far snap edge
    if (isMargin && i === targetIdx) s[camel(n)] = value.value;  // margin on the snap target
    return s;
  };
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">{n}</span>
        <div ref={ref} style={cstyle}>
          {/* snapport edge guide so padding/margin offsets are obvious */}
          {snapping && <div style={{ position: "sticky", [horiz ? "left" : "top"]: 0, zIndex: 2,
            [horiz ? "width" : "height"]: "2px", [horiz ? "height" : "width"]: "100%",
            [horiz ? "marginRight" : "marginBottom"]: horiz ? "-2px" : "-2px",
            background: "var(--accent)", opacity: .9 }} />}
          {blocks.map((i) => (
            <div key={i} ref={i === targetIdx ? tref : null} style={panelStyle(i)}>{i === targetIdx && snapping ? `▶ panel ${i + 1}` : `panel ${i + 1}`}</div>
          ))}
        </div>
        <button className="xl-chip" style={{ position: "absolute", right: "12px", bottom: "12px" }}
          data-codex-trigger="scroll" onClick={go}>{snapping ? "snap ▶" : "scroll ↕"}</button>
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint={isBar ? "The scrollbar takes the value." : snapping ? "Hit ‘snap ▶’ — the ▶ panel lands offset from the red edge by this value."
          : "Scroll the panel (or hit ‘scroll ↕’) to feel how this value behaves."} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   CURSOR — a pad that applies the cursor; hover to see the shape.
--------------------------------------------------------------- */
function CursorDemo({ property, value, onChange }) {
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">cursor</span>
        <div style={{
          width: "78%", height: "150px", borderRadius: "12px", cursor: value.value,
          border: "1px dashed var(--line-strong)", display: "grid", placeItems: "center",
          background: "color-mix(in srgb, var(--accent) 8%, var(--bg-3))", color: "var(--ink-2)",
          fontFamily: "var(--mono)", fontSize: "13px", textAlign: "center",
        }}>
          hover this pad<br /><span style={{ color: "var(--accent)" }}>cursor: {value.value}</span>
        </div>
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint="Hover the pad — the pointer takes the chosen shape." />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   INTERACTIVE — selection, pointer-events, resize, native controls,
   caret — each branch makes the property’s effect tangible.
--------------------------------------------------------------- */
function InteractiveDemo({ property, value, onChange }) {
  const n = property.name;
  const [clicks, setClicks] = useState(0);
  let stage;
  if (n === "user-select" || n === "user-modify") {
    stage = (
      <p data-codex-select style={{ [camel(n)]: value.value, WebkitUserModify: n === "user-modify" ? value.value : undefined, maxWidth: "30ch", fontFamily: "var(--serif)", fontSize: "17px", lineHeight: 1.6, color: "var(--ink)" }}>
        Codex specimen — the screenshot driver selects this sentence; <b>{n}: {value.value}</b> decides whether it highlights.
      </p>
    );
  } else if (/^caret/.test(n)) {
    // a focused contenteditable with a STEADY, visible caret so its colour/shape
    // is reliably captured (the screenshot driver focuses it via the focus recipe).
    const styleObj = { padding: "14px 16px", fontSize: "26px", minWidth: "240px", borderRadius: "8px", border: "1px solid var(--line-strong)", background: "var(--bg-3)", color: "var(--ink)", fontFamily: "var(--mono)", outline: "none" };
    if (n !== "caret-animation") styleObj.caretAnimation = "manual";   // don't blink
    if (n !== "caret-color") styleObj.caretColor = "var(--accent)";    // visible caret
    styleObj[camel(n)] = value.value;                                  // the tested value wins
    stage = <div contentEditable suppressContentEditableWarning autoFocus style={styleObj}>Codex</div>;
  } else if (n === "resize") {
    stage = <div style={{ resize: value.value, overflow: "auto", width: "150px", height: "110px", minWidth: "60px", minHeight: "60px", border: "1px solid var(--line-strong)", borderRadius: "8px", background: "var(--bg-3)", padding: "10px", color: "var(--ink-3)", fontFamily: "var(--mono)", fontSize: "11px" }}>drag my corner ⤡</div>;
  } else if (n === "touch-action") {
    // a scrollable container the driver pans with a synthetic touch gesture: the
    // value decides whether a vertical pan scrolls it (auto/pan-y → scrolls,
    // none/pan-x → stays). The before/after frames differ only when it scrolls.
    stage = (
      <div data-codex-touch style={{ touchAction: value.value, overflow: "auto", width: "180px", height: "150px", border: "1px solid var(--line-strong)", borderRadius: "8px", background: "var(--bg-3)" }}>
        <div style={{ height: "520px", padding: "10px", fontFamily: "var(--mono)", fontSize: "12px", lineHeight: 1.9, color: "var(--ink-2)", background: "linear-gradient(var(--accent-soft), transparent 40%, var(--accent-soft))" }}>
          {Array.from({ length: 18 }, (_, i) => <div key={i}>row {String(i + 1).padStart(2, "0")} — pan me</div>)}
        </div>
      </div>
    );
  } else if (n === "pointer-events") {
    stage = (
      <div style={{ display: "grid", gap: "12px", placeItems: "center" }}>
        <button data-codex-trigger="click" onClick={() => setClicks((c) => c + 1)} style={{ pointerEvents: value.value, padding: "12px 22px", borderRadius: "8px", border: "1px solid var(--accent)", background: "var(--accent)", color: "#fff", fontFamily: "var(--sans)" }}>click me</button>
        <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--ink-2)" }}>received {clicks} clicks</span>
      </div>
    );
  } else if (n === "accent-color") {
    stage = (
      <div style={{ accentColor: value.value, display: "grid", gap: "16px", color: "var(--ink)", fontFamily: "var(--sans)" }}>
        <label style={{ display: "flex", gap: "10px", alignItems: "center" }}><input type="checkbox" defaultChecked style={{ width: "20px", height: "20px" }} /> checkbox</label>
        <input type="range" defaultValue="62" style={{ width: "200px" }} />
        <progress value="0.62" style={{ width: "200px" }} />
      </div>
    );
  } else if (n === "appearance") {
    // appearance is only visible on NATIVE form controls: `none` strips the
    // widget (a checkbox becomes a blank box, a <select> loses its arrow), while
    // `auto` / the compat keywords keep the platform rendering. A checkbox +
    // radio + select + button make the auto↔none difference unmistakable.
    const a = value.value;
    const ctl = { appearance: a, WebkitAppearance: a };
    stage = (
      <div style={{ display: "grid", gap: "16px", justifyItems: "start", color: "var(--ink)", fontFamily: "var(--sans)", fontSize: "14px" }}>
        <label style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input type="checkbox" defaultChecked style={{ ...ctl, width: "22px", height: "22px", accentColor: "var(--accent)", border: "1px solid var(--line-strong)", borderRadius: "4px" }} /> checkbox
        </label>
        <label style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input type="radio" defaultChecked style={{ ...ctl, width: "22px", height: "22px", accentColor: "var(--accent)", border: "1px solid var(--line-strong)", borderRadius: "50%" }} /> radio
        </label>
        <select style={{ ...ctl, padding: "7px 12px", border: "1px solid var(--line-strong)", borderRadius: "6px", background: "var(--bg-3)", color: "var(--ink)" }}>
          <option>menu option ▾</option>
        </select>
        <button style={{ ...ctl, padding: "8px 18px", border: "1px solid var(--line-strong)", borderRadius: "6px", background: "var(--bg-3)", color: "var(--ink)" }}>button</button>
      </div>
    );
  } else {
    // field-sizing — apply to a native control that grows with its content
    stage = (
      <div style={{ display: "grid", gap: "12px", placeItems: "center", [camel(n)]: value.value }}>
        <button style={{ [camel(n)]: value.value, padding: "10px 18px" }}>native button</button>
        <input style={{ [camel(n)]: value.value, padding: "8px 10px" }} defaultValue="native input" />
      </div>
    );
  }
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>{stage}</div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint={n === "user-select" ? "Drag across the text to test selection." : "Interact with the control to feel the value."} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   FILTER / COMPOSITING — apply the effect over a rich backdrop so
   each value reads visually.
--------------------------------------------------------------- */
function FilterDemo({ property, value, onChange }) {
  const n = property.name;
  const back = "conic-gradient(from 20deg, #c5483c, #e0a13c, #2f8f6b, #2f5fd0, #8a3ca0, #c5483c)";
  const isBackdrop = n === "backdrop-filter";
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">{n}</span>
        <div style={{ position: "relative", width: "230px", height: "150px", borderRadius: "12px", background: back, display: "grid", placeItems: "center", overflow: "hidden" }}>
          <div style={{
            width: isBackdrop ? "70%" : "78%", height: isBackdrop ? "70%" : "78%", borderRadius: "10px",
            display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: "12px", color: "#fff",
            background: isBackdrop ? "color-mix(in srgb, #000 30%, transparent)" : back,
            [camel(n)]: value.value,
          }}>{value.value.length > 16 ? "" : value.value}</div>
        </div>
      </div>
      <LiveControls property={property} value={value} onChange={onChange} />
    </React.Fragment>
  );
}

/* ---------- demo resolver (property-level, falls back to family) ---------- */
function resolveDemo(family, property) {
  // contextual (family/property-specific) demos take precedence
  if (typeof contextDemoFor === "function") {
    const c = contextDemoFor(family, property);
    if (c) return c;
  }
  const map = {
    flex: FlexDemo, transform3d: Transform3DDemo, color: ColorDemo,
    animation: AnimationDemo, transition: TransitionDemo, scroll: ScrollDemo,
    cursor: CursorDemo, interactive: InteractiveDemo, filter: FilterDemo,
  };
  return map[behaviorOf(property, family)] || GenericDemo;
}

Object.assign(window, {
  behaviorOf, isLive, familyHasLive, resolveDemo,
  AnimationDemo, TransitionDemo, ScrollDemo, CursorDemo, InteractiveDemo, FilterDemo,
});
