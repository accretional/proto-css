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
/* animation-composition: a keyframe that animates the SAME transform the box
   already carries as a base (underlying) value, so replace / add / accumulate
   compose differently. End frame is held (single forward run, fill:forwards) so
   each value settles at a distinct x-offset AND scale:
     replace    -> keyframe wins:      translateX(60px) scale(1.4)        (x~60,  small)
     accumulate -> components summed:  translateX(100px) scale(1.8)       (x~100, mid)
     add        -> lists concatenated: base . keyframe matrix             (x~124, large) */
@keyframes codex-compose { to { transform: translateX(60px) scale(1.4); } }
@keyframes codex-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: .55; } }
/* single-direction LINEAR track for animation-iteration-count: progress maps
   1:1 to position, so a finite count run with fill-mode:forwards SETTLES at
   that fraction of the track (0.25 -> 1/4 left, 0.5 -> centre, 0.75 -> 3/4,
   1/2 -> far right). 1 vs 2 settle at the same far-right spot, so a per-
   iteration counter badge tells them apart. */
@keyframes codex-count { from { transform: translateX(-110px); } to { transform: translateX(110px); } }
/* keyframes NAMED after the generator's idents so animation-name's values each
   drive a visibly distinct motion (none → no motion). */
@keyframes my-ident { from { transform: translateX(-72px); } to { transform: translateX(72px); } }
@keyframes tag-a    { to { transform: rotate(360deg); } }
@keyframes Specimen { 0%,100% { transform: scale(.7); } 50% { transform: scale(1.5); } }
@keyframes Aa       { 0%,100% { border-radius: 10px; } 50% { border-radius: 50%; } }
@keyframes "Specimen" { 0%,100% { transform: scale(.7); } 50% { transform: scale(1.5); } }
@keyframes "Aa"       { 0%,100% { border-radius: 10px; } 50% { border-radius: 50%; } }
/* monotonic progress track for scroll/view-timeline demos: maps 1:1 to timeline
   progress, so a scroll-driven bar slides + shifts hue as the container scrolls. */
@keyframes codex-progress { from { transform: translateX(0); filter: hue-rotate(0deg); } to { transform: translateX(180px); filter: hue-rotate(200deg); } }
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
  // scroll/view timelines & ranges are SCROLL-driven — they get the timeline demo,
  // not the time-based animation demo (this must precede the /^animation/ test).
  if (/^scroll-timeline/.test(n) || /^view-timeline/.test(n) || n === "timeline-scope" ||
      n === "animation-timeline" || /^animation-range/.test(n)) return "timeline";
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
  // per-iteration run counter for animation-iteration-count: animationiteration
  // fires at every iteration boundary except the last; animationend adds the
  // final (possibly fractional) run. So count 0.25/0.5/0.75/1 -> 1 run, 2 -> 2
  // runs -> the held badge separates 1 from 2 in the settled still frame.
  const [iters, setIters] = useState(0);
  const n = property.name;
  useEffect(() => { setIters(0); }, [property.name, value.value, run]);
  const base = {
    animationName: "codex-slide", animationDuration: "1.4s", animationTimingFunction: "ease",
    animationDelay: "0s", animationIterationCount: "infinite", animationDirection: "alternate",
    animationFillMode: "none", animationPlayState: "running",
  };
  // for the `animation` SHORTHAND, omit the base longhands so the element serialises
  // as a single `animation:` declaration (the playground keys off "animation:" to find
  // it) and the chosen value is what shows in the live CSS.
  const style = n === "animation" ? {} : { ...base };
  const key = camel(n);
  if (n === "animation") {
    // the shorthand value already carries a keyframes name (my-ident / tag-a /
    // "Specimen" / "Aa", all defined in CODEX_KEYFRAMES), so apply it verbatim —
    // values with a duration animate; bare-name values rest (0s duration).
    style.animation = value.value && value.value !== "none" ? value.value : "none";
  } else if (n === "animation-name") {
    style.animationName = value.value; // none → no motion; idents map to distinct keyframes
  } else if (key in base) {
    style[key] = value.value;
  } else if (n === "animation-composition") {
    // composition only MEANS something when a keyframe value composes with an
    // underlying value: give the box a non-zero base transform (the underlying
    // value) and a keyframe animating the SAME transform, then HOLD the end
    // frame (single forward run + fill:forwards) so each value settles distinctly.
    style.animationName = "codex-compose";
    style.animationComposition = value.value;
    style.animationDirection = "normal";
    style.animationIterationCount = "1";
    style.animationDuration = "0.7s";
    style.animationTimingFunction = "ease-out";
    style.animationFillMode = "forwards";
    style.transform = "translateX(40px) scale(1.4)"; // underlying value to compose against
  } else {
    style.animationName = "codex-slide"; // -range/-timeline: run base, label the value
  }
  // finite, terminal-state properties read better as a single forward run
  if (n === "animation-fill-mode" || n === "animation-iteration-count") {
    style.animationDirection = "normal";
    if (n === "animation-fill-mode") style.animationIterationCount = "1";
  }
  // iteration-count: run a single-direction LINEAR track and HOLD the end frame
  // (fill-mode:forwards) so each finite count settles at its proportional offset
  // — 0.25 -> 1/4, 0.5 -> centre, 0.75 -> 3/4, 1/2 -> far right. 1s/iteration so
  // two whole iterations finish inside the ~2.6s settle-capture window.
  if (n === "animation-iteration-count") {
    style.animationName = "codex-count";
    style.animationTimingFunction = "linear";
    style.animationDuration = "1s";
    style.animationFillMode = "forwards";
  }
  const hint = n === "animation-play-state"
    ? "running animates; paused freezes the box mid-track."
    : "Pick a value — the box's motion changes. ↻ replays finite runs.";
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">{n}</span>
        <div style={{ position: "relative", width: "100%", display: "grid", placeItems: "center" }}>
          <div key={n + value.value + run}
            onAnimationIteration={n === "animation-iteration-count" ? () => setIters((i) => i + 1) : undefined}
            onAnimationEnd={n === "animation-iteration-count" ? () => setIters((i) => i + 1) : undefined}
            style={{
            width: "62px", height: "62px", borderRadius: "12px",
            background: "linear-gradient(140deg, var(--accent), color-mix(in srgb, var(--accent) 50%, #000))",
            boxShadow: "0 16px 30px -14px color-mix(in srgb, var(--accent) 60%, transparent)", ...style,
          }} />
          {n === "animation-iteration-count" && (
            <span style={{
              position: "absolute", top: "10px", right: "12px",
              padding: "2px 9px", borderRadius: "999px", fontFamily: "var(--mono)",
              fontSize: "13px", fontWeight: 700, color: "var(--ink)",
              background: "color-mix(in srgb, var(--accent) 22%, var(--bg-3))",
              border: "1px solid color-mix(in srgb, var(--accent) 50%, transparent)",
            }}>{iters}×</span>
          )}
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
  const isBehavior = n === "transition-behavior";
  // The toggled box deltas now drive every property a transition-property value can
  // name (transform/background/radius PLUS opacity/width/color), so each value
  // animates a DISTINCT property smoothly while the rest jump. For transition-behavior
  // we also toggle the DISCRETE property `display` (block<->none): 'allow-discrete'
  // keeps the box rendered and fades it out smoothly, 'normal' pops it instantly — the
  // mid-transition frame catches faded-but-present vs already-gone.
  const base = {
    transitionProperty: isBehavior ? "all" : "transform, background-color, border-radius, opacity, width, color",
    transitionDuration: "0.8s", transitionTimingFunction: "ease", transitionDelay: "0s",
    transitionBehavior: "normal",
  };
  const style = { ...base };
  const key = camel(n);
  if (n === "transition") style.transition = value.value;
  else if (key in base) style[key] = value.value;
  const dyn = {
    transform: on ? "translateX(150px) rotate(8deg)" : "translateX(0) rotate(0)",
    backgroundColor: on ? "var(--accent)" : "color-mix(in srgb, var(--accent) 26%, var(--bg-3))",
    borderRadius: on ? "50%" : "12px",
    opacity: on ? 1 : 0.1,
    width: on ? "168px" : "32px",
    color: on ? "var(--ink)" : "var(--accent)",
    display: isBehavior && on ? "none" : "flex",
  };
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">{n}</span>
        <div style={{ width: "100%", padding: "0 28px", display: "flex", alignItems: "center" }}>
          <div style={{ width: "64px", height: "64px", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: "34px", overflow: "hidden", ...style, ...dyn }}>Aa</div>
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
  const isSnapType = n === "scroll-snap-type";
  // Axis for scroll-snap-type lives in the VALUE (x/inline → horizontal scroller,
  // y/block/both → vertical) — route the container layout to match it; for the
  // longhands the axis is in the property NAME as before.
  const horiz = isSnapType
    ? /(^|\s)(x|inline)(\s|$)/.test(value.value)
    : /(^|-)inline(-|$)|left|right/.test(n) && !/block/.test(n);
  const isPad = /scroll-padding/.test(n);
  const isMargin = /scroll-margin/.test(n);
  const isSnap = /scroll-snap/.test(n);
  const isBar = /scrollbar/.test(n);            // scrollbar-color / -width / -gutter — show a real scrollbar
  const snapping = isPad || isMargin || isSnap; // these demos snap a target to the snapport edge
  // 'none' (snap-type / snap-align) and the proximity strictness must NOT realign:
  // we release from a deliberately off-boundary offset so mandatory snaps fully
  // while proximity / none rest where we let go — making the outcomes diverge.
  const isSnapNone = (n === "scroll-snap-align" && value.value === "none") ||
                     (isSnapType && value.value === "none");
  // % scroll-padding resolves against the scrollport: give the snap target plenty of
  // LEADING slack (high index + many small panels) so even 100% lands in-range and
  // visible instead of clamping at the scroll extremes — 30/50/65/80/100% then read.
  const targetIdx = isPad ? 10 : 3;            // snap THIS panel so the offset from the edge reads — for % padding keep it centred (10 panels of slack on EACH side ≈ 320px > the 280px scrollport) so even a 100% offset is fully reachable WITHOUT clamping on start- AND end-side props, which is what makes equal computed values (literal 48px vs var()/env()→48px) land at the SAME offset instead of one collapsing flush

  const tref = useRef(null);
  const endSide = /end|bottom|right/.test(n);    // these snap the target to the FAR edge
  const cstyle = {
    height: isPad ? "280px" : "190px", width: "100%", border: "1px solid var(--line)", borderRadius: "10px",
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

  const N = isBar ? 9 : isPad ? 21 : 7;  // padding: 21 short panels so the centred target (idx 10) has 10 panels (~320px) of slack on EACH side — more than the 280px scrollport, so a 100% padding offset is reachable without clamping on both start- and end-side props and equal computed values coincide
  const blocks = Array.from({ length: N }, (_, i) => i);
  // Scroll the CONTAINER ONLY (never scrollIntoView — that bubbles to the page
  // and blanks the capture) to bring the target panel to the relevant edge;
  // scroll-snap then re-aligns it, honouring scroll-padding / scroll-margin.
  const place = (smooth) => {
    const el = ref.current, t = tref.current;
    if (!el || !t) return;
    const opt = smooth ? "smooth" : "auto";
    // Off-boundary release: for snap-type / snap-align:none, drop the target ~46px
    // PAST its snap position before letting go. Mandatory re-snaps it back into
    // alignment; proximity / none have no pull strong enough to realign, so they
    // rest at this off offset — the snapped vs unsnapped frames now read distinctly.
    const off = (isSnapType || isSnapNone) ? 46 : 0;
    if (horiz) el.scrollTo({ left: (endSide ? t.offsetLeft + t.offsetWidth - el.clientWidth : t.offsetLeft - el.clientLeft) + off, behavior: opt });
    else el.scrollTo({ top: (endSide ? t.offsetTop + t.offsetHeight - el.clientHeight : t.offsetTop - el.clientTop) + off, behavior: opt });
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
      flex: horiz ? (isPad ? "0 0 20%" : "0 0 78%") : undefined,
      height: horiz ? "auto" : (isPad ? "22px" : "78px"), margin: horiz ? 0 : "0 0 10px", borderRadius: "8px",
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
          {/* fixed start-edge RULER: a sticky, full-scrollport tick column pinned to the
              snapport start so the snapped target's offset from the red edge reads directly
              in px. Vertical padding only — ticks every 40px from the top edge. */}
          {isPad && !horiz && <div aria-hidden style={{ position: "sticky", top: 0, left: 0, zIndex: 3,
            height: 0, width: "100%", pointerEvents: "none" }}>
            {[40, 80, 120, 160, 200, 240].map((y) => (
              <div key={y} style={{ position: "absolute", top: `${y}px`, left: 0, width: "30px",
                height: "1px", background: "var(--accent)", opacity: .35,
                boxShadow: "0 0 0 transparent" }}>
                <span style={{ position: "absolute", left: "32px", top: "-6px", fontFamily: "var(--mono)",
                  fontSize: "9px", color: "var(--ink-2)", opacity: .55 }}>{y}</span>
              </div>
            ))}
          </div>}
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
   TIMELINE — scroll/view-timeline-driven animation. A tall scroller
   declares a scroll-timeline (--st); a subject inside declares a
   view-timeline (--vt); timeline-scope on the wrapper hoists both so a
   sibling BAR can read them via animation-timeline. The tested property's
   value is routed into whichever element carries it, and the bar stays
   bound to a working timeline so it actually slides as the panel scrolls
   (the screenshot driver ramps [data-codex-scroll] 0→100%).
--------------------------------------------------------------- */
function TimelineDemo({ property, value, onChange }) {
  useKeyframes();
  const ref = useRef(null);
  const n = property.name, v = value.value;
  const wrap = { timelineScope: "--st, --vt", display: "grid", gap: "12px", width: "100%" };
  const scroller = {
    height: "150px", overflow: "auto", position: "relative",
    border: "1px solid var(--line)", borderRadius: "10px", background: "var(--bg-3)",
    scrollTimelineName: "--st", scrollTimelineAxis: "block",
  };
  const subject = {
    viewTimelineName: "--vt", viewTimelineAxis: "block",
    height: "54px", margin: "240px 18px", borderRadius: "8px",
    background: "color-mix(in srgb, var(--accent) 26%, var(--bg-2))",
    display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--ink-2)",
  };
  const bar = {
    animationName: "codex-progress", animationDuration: "1s",
    animationTimingFunction: "linear", animationFillMode: "both", animationTimeline: "--st",
    height: "20px", width: "34px", borderRadius: "999px",
    background: "linear-gradient(90deg, var(--accent), #fff)",
    boxShadow: "0 6px 16px -8px var(--accent)",
  };
  // hoist a custom timeline name into the wrapper's scope so the sibling bar can read it
  const hoist = (name) => { if (/^--/.test(name)) wrap.timelineScope = `--st, --vt, ${name}`; };
  if (n === "animation-timeline") bar.animationTimeline = v;
  else if (/^animation-range/.test(n)) { bar.animationTimeline = "--vt"; bar[camel(n)] = v; }
  else if (n === "scroll-timeline-name") { scroller.scrollTimelineName = v; bar.animationTimeline = v; hoist(v); }
  else if (n === "scroll-timeline-axis") { scroller.scrollTimelineAxis = v; }
  else if (n === "scroll-timeline") { scroller.scrollTimeline = v; const m = v.match(/--[\w-]+/); bar.animationTimeline = m ? m[0] : "--st"; if (m) hoist(m[0]); }
  else if (n === "view-timeline-name") { subject.viewTimelineName = v; bar.animationTimeline = v; hoist(v); }
  else if (n === "view-timeline-axis") { subject.viewTimelineAxis = v; bar.animationTimeline = "--vt"; }
  else if (n === "view-timeline-inset") { subject.viewTimelineInset = v; bar.animationTimeline = "--vt"; }
  else if (n === "view-timeline") { subject.viewTimeline = v; const m = v.match(/--[\w-]+/); bar.animationTimeline = m ? m[0] : "--vt"; if (m) hoist(m[0]); }
  else if (n === "timeline-scope") { wrap.timelineScope = v === "none" ? "none" : v; bar.animationTimeline = "--st"; }
  const go = () => { const el = ref.current; if (!el) return; const max = el.scrollHeight - el.clientHeight; el.scrollTo({ top: el.scrollTop > max / 2 ? 0 : max, behavior: "smooth" }); };
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">{n}</span>
        <div style={wrap}>
          <div ref={ref} data-codex-scroll="" style={scroller}>
            <div style={{ height: "28px", color: "var(--ink-2)", fontFamily: "var(--mono)", fontSize: "11px", padding: "6px 10px" }}>scroll ↓ to drive the timeline</div>
            <div style={subject}>subject · view timeline</div>
            <div style={{ height: "120px" }} />
          </div>
          <div style={{ position: "relative", height: "22px", paddingLeft: "4px" }}>
            <div style={bar} />
          </div>
        </div>
        <button className="xl-chip" style={{ position: "absolute", right: "12px", bottom: "12px" }}
          data-codex-trigger="scroll" onClick={go}>scroll ↕</button>
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint="The bar is driven by the scroll/view timeline — scroll the panel and it advances." />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   SCROLL CONTEXT — position (sticky/fixed pin while scrolling),
   background-attachment (fixed vs scroll/local), content-visibility
   (auto/hidden skip offscreen paint). A scroll container overflows; the
   driver ramps [data-codex-scroll] 0→100% so the behaviour is captured.
--------------------------------------------------------------- */
function ScrollContextDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name, v = value.value;
  const scroller = {
    width: "100%", height: "160px", overflow: "auto", position: "relative", padding: "10px",
    border: "1px solid var(--line)", borderRadius: "10px", background: "var(--bg-3)",
  };
  if (n === "background-attachment") {
    // wider + taller so the fixed-vs-scroll background difference is unmistakable, with a bigger pattern.
    scroller.height = "230px";
    scroller.backgroundImage = "repeating-linear-gradient(45deg, color-mix(in srgb, var(--accent) 60%, transparent) 0 18px, transparent 18px 40px)";
    scroller.backgroundAttachment = v;
    scroller.backgroundRepeat = "repeat";
  }
  const chip = {
    position: n === "position" ? v : undefined, top: "6px", left: "10px", zIndex: 3,
    width: "fit-content", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--ink)",
    background: "color-mix(in srgb, var(--accent) 32%, var(--bg-2))",
    border: "1px solid color-mix(in srgb, var(--accent) 55%, transparent)",
    borderRadius: "8px", padding: "6px 12px",
  };
  const cvBlock = (i) => ({
    height: "120px", margin: "0 0 12px", borderRadius: "8px",
    background: `color-mix(in srgb, var(--accent) ${14 + i * 12}%, var(--bg-2))`,
    contentVisibility: i === 1 && n === "content-visibility" ? v : undefined,
    containIntrinsicSize: i === 1 && n === "content-visibility" ? "auto 120px" : undefined,
    display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: "13px", color: "var(--ink)",
    fontWeight: 700,
  });
  const go = () => { const el = ref.current; if (!el) return; const max = el.scrollHeight - el.clientHeight; el.scrollTo({ top: el.scrollTop > max / 2 ? 0 : max, behavior: "smooth" }); };
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">{n}</span>
        <div ref={ref} data-codex-scroll="" style={scroller}>
          {n === "position" && <div style={chip}>{v}</div>}
          {n === "content-visibility"
            ? [0, 1, 2].map((i) => <div key={i} style={cvBlock(i)}>{i === 1 ? `BLOCK ${i + 1} · ${v}` : `block ${i + 1}`}</div>)
            : Array.from({ length: 8 }, (_, i) => (
              <div key={i} style={{
                height: "40px", margin: "0 0 10px", borderRadius: "6px",
                background: `color-mix(in srgb, var(--accent) ${8 + i * 8}%, var(--bg-2))`,
                display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--ink-2)",
              }}>row {i + 1}</div>))}
        </div>
        <button className="xl-chip" style={{ position: "absolute", right: "12px", bottom: "12px" }}
          data-codex-trigger="scroll" onClick={go}>scroll ↕</button>
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint={n === "position" ? "Scroll — sticky/fixed stay pinned; static/relative/absolute scroll away."
          : n === "background-attachment" ? "Scroll — fixed keeps the pattern still; scroll/local move with content."
          : "Scroll — auto/hidden skip painting the offscreen block's contents."} />
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
  // caret family: Chrome ships the caret-* LONGHANDS but not (yet) the `caret`
  // SHORTHAND parser, so `caret: …` (via style object OR cssText) is silently dropped
  // and nothing lands in the element. We expand the shorthand into its longhands by
  // hand so the caret actually renders AND the declarations show in the playground.
  const caretRef = useRef(null);
  useEffect(() => {
    if (!caretRef.current || !/^caret/.test(n)) return;
    let base = "padding:14px 16px;font-size:26px;min-width:240px;border-radius:8px;border:1px solid var(--line-strong);background:var(--bg-3);color:var(--ink);font-family:var(--mono);outline:none;";
    if (n === "caret") {
      // generator emits clean "shape? animation? color?" values; "auto" = all default.
      const parts = value.value === "auto" ? [] : (value.value || "").trim().split(/\s+/);
      let shape = "", anim = "", color = "";
      for (const p of parts) {
        if (/^(bar|block|underscore)$/.test(p)) shape = p;
        else if (p === "manual") anim = p;
        else color = p;
      }
      base += "caret-shape:" + (shape || "auto") + ";caret-animation:" + (anim || "manual") + ";caret-color:" + (color || "var(--accent)") + ";";
    } else {
      if (n === "caret-color" || n === "caret-shape") base += "caret-animation:manual;";   // steady caret so colour/shape reads
      if (n === "caret-shape" || n === "caret-animation") base += "caret-color:var(--accent);"; // visible caret when the value sets no colour
      base += value.css || "";
    }
    caretRef.current.style.cssText = base;
  });
  let stage;
  if (n === "user-select" || n === "user-modify") {
    stage = (
      <p data-codex-select style={{ [camel(n)]: value.value, WebkitUserModify: n === "user-modify" ? value.value : undefined, maxWidth: "30ch", fontFamily: "var(--serif)", fontSize: "17px", lineHeight: 1.6, color: "var(--ink)" }}>
        Codex specimen — the screenshot driver selects this sentence; <b>{n}: {value.value}</b> decides whether it highlights.
      </p>
    );
  } else if (/^caret/.test(n)) {
    // a focused contenteditable with a STEADY, visible caret so its colour/shape
    // is reliably captured. The cssText effect above applies the tested caret value
    // (shorthand OR longhand) as a real CSS declaration the playground can expose.
    stage = <div ref={caretRef} contentEditable suppressContentEditableWarning autoFocus>Codex</div>;
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
    // appearance only changes rendering on the NATIVE control its keyword names.
    // The old demo applied every keyword to the SAME four controls, so only
    // `none` looked different (it strips the widget) — meter/progress-bar/
    // textfield/textarea/listbox never touched a <meter>/<progress>/text
    // <input>/<textarea>/list <select>, so they all aliased to auto.
    // Now each keyword renders BESIDE its matching element so the strip/keep
    // difference (vs a `none` reference of the same element) is unmistakable.
    const a = value.value;
    const ctl = { appearance: a, WebkitAppearance: a };
    const none = { appearance: "none", WebkitAppearance: "none" };
    const ink = { color: "var(--ink)" };
    const box = { border: "1px solid var(--line-strong)", borderRadius: "6px", background: "var(--bg-3)", color: "var(--ink)" };
    // keyword → the native element the keyword is supposed to style.
    const make = (s) => {
      switch (a) {
        case "meter":
          return <meter min="0" max="1" value="0.62" style={{ ...s, width: "200px", height: "18px" }} />;
        case "progress-bar":
          return <progress value="0.62" style={{ ...s, width: "200px", height: "18px" }} />;
        case "textfield":
          return <input type="text" defaultValue="text field" style={{ ...s, ...box, padding: "7px 10px", width: "180px" }} />;
        case "searchfield":
          return <input type="search" defaultValue="search field" style={{ ...s, ...box, padding: "7px 10px", width: "180px" }} />;
        case "textarea":
          return <textarea defaultValue={"line one\nline two"} rows={2} style={{ ...s, ...box, padding: "7px 10px", width: "180px", resize: "none", fontFamily: "var(--mono)" }} />;
        case "listbox":
          return <select size={3} style={{ ...s, ...box, padding: "4px", width: "150px" }}><option>alpha</option><option>beta</option><option>gamma</option></select>;
        case "menulist":
        case "menulist-button":
        case "base-select":
          return <select style={{ ...s, ...box, padding: "7px 12px" }}><option>menu option ▾</option></select>;
        case "checkbox":
          return <input type="checkbox" defaultChecked style={{ ...s, width: "22px", height: "22px", accentColor: "var(--accent)", border: "1px solid var(--line-strong)", borderRadius: "4px" }} />;
        case "radio":
          return <input type="radio" defaultChecked style={{ ...s, width: "22px", height: "22px", accentColor: "var(--accent)", border: "1px solid var(--line-strong)", borderRadius: "50%" }} />;
        case "button":
          return <button style={{ ...s, ...box, padding: "8px 18px" }}>button</button>;
        default: // none / auto / base — no single matching control; show a strip
          return (
            <div style={{ display: "grid", gap: "12px", justifyItems: "start" }}>
              <input type="checkbox" defaultChecked style={{ ...s, width: "22px", height: "22px", accentColor: "var(--accent)", border: "1px solid var(--line-strong)", borderRadius: "4px" }} />
              <select style={{ ...s, ...box, padding: "7px 12px" }}><option>menu option ▾</option></select>
              <progress value="0.62" style={{ ...s, width: "170px", height: "18px" }} />
            </div>
          );
      }
    };
    const isStrip = a === "none" || a === "auto" || a === "base";
    const lbl = { fontFamily: "var(--mono)", fontSize: "11px", color: "var(--ink-2)", letterSpacing: "0.04em" };
    stage = (
      <div style={{ display: "grid", gap: "18px", justifyItems: "start", fontFamily: "var(--sans)", fontSize: "14px", ...ink }}>
        <div style={{ display: "grid", gap: "7px", justifyItems: "start" }}>
          <span style={lbl}>appearance: {a}</span>
          {make(ctl)}
        </div>
        {!isStrip && (
          <div style={{ display: "grid", gap: "7px", justifyItems: "start", opacity: 0.85 }}>
            <span style={lbl}>appearance: none (reference)</span>
            {make(none)}
          </div>
        )}
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
    timeline: TimelineDemo,
  };
  return map[behaviorOf(property, family)] || GenericDemo;
}

Object.assign(window, {
  behaviorOf, isLive, familyHasLive, resolveDemo,
  AnimationDemo, TransitionDemo, ScrollDemo, TimelineDemo, ScrollContextDemo,
  CursorDemo, InteractiveDemo, FilterDemo,
});
