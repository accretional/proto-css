/* ============================================================
   THE CSS CODEX — Contextual demonstrators (batch fixes)
   Per-property/per-family demos that give each value a context
   where its effect is actually visible and distinct. Grown batch
   by batch. resolveDemo() consults contextDemoFor() first.
   ============================================================ */

const applyCss = (ref, base, css) => {
  if (ref.current) ref.current.style.cssText = base + (css || "");
};

/* ---------------------------------------------------------------
   BORDERS — give the box a visible base edge so colour/width/style
   read; round for radius; an SVG-ish striped border-image; a table
   for collapse/spacing; a base outline for outline-*.
--------------------------------------------------------------- */
function BorderDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const isCorner = /^corner/.test(n);
  const isRadius = /radius/.test(n);
  const isImage = /border-image/.test(n);
  const isOutline = /^outline/.test(n);
  const isTable = n === "border-collapse" || n === "border-spacing";

  let base;
  if (isCorner) {
    // corner-shape only reshapes an already-rounded corner, so start with a big radius
    base = "width:170px;height:108px;background:linear-gradient(140deg,var(--accent),color-mix(in srgb,var(--accent) 48%,#000));border-radius:46px;box-shadow:0 18px 34px -16px color-mix(in srgb,var(--accent) 55%,transparent);";
  } else if (isRadius) {
    base = "width:170px;height:108px;background:linear-gradient(140deg,var(--accent),color-mix(in srgb,var(--accent) 48%,#000));border:2px solid var(--ink-3);box-shadow:0 18px 34px -16px color-mix(in srgb,var(--accent) 55%,transparent);";
  } else if (isImage) {
    base = "width:180px;height:116px;background:var(--bg-3);border:20px solid var(--accent);border-image-source:repeating-linear-gradient(45deg,#c5483c 0 10px,#2f5fd0 10px 20px);border-image-slice:30;border-image-repeat:round;";
  } else if (isOutline) {
    base = "width:160px;height:100px;border-radius:8px;background:var(--bg-3);border:1px solid var(--line);outline:8px solid color-mix(in srgb,var(--accent) 60%,var(--bg-3));outline-offset:3px;";
  } else if (/width/.test(n)) {
    // width props: a thin base so the tested edge's thickness dominates
    base = "width:158px;height:100px;border-radius:8px;background:var(--bg-3);border:3px solid color-mix(in srgb,var(--accent) 40%,var(--bg-3));";
  } else {
    // colour / style / shorthands — neutral base edge so the tested
    // side/colour/style stands out against it
    base = "width:158px;height:100px;border-radius:8px;background:var(--bg-3);border:11px solid color-mix(in srgb,var(--accent) 32%,var(--bg-3));";
  }
  useEffect(() => applyCss(ref, base, value.css));

  if (isTable) return <TableBorderDemo property={property} value={value} onChange={onChange} />;
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span><div ref={ref} /></div>
      <LiveControls property={property} value={value} onChange={onChange} />
    </React.Fragment>
  );
}

function TableBorderDemo({ property, value, onChange }) {
  const ref = useRef(null);
  // apply border-collapse / border-spacing to the <table>
  useEffect(() => {
    if (ref.current) ref.current.style.cssText =
      "border:2px solid var(--accent);background:var(--bg-3);color:var(--ink-2);font-family:var(--mono);font-size:12px;" + (value.css || "");
  });
  const cell = { border: "2px solid color-mix(in srgb, var(--accent) 50%, var(--bg-3))", padding: "10px 16px" };
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{property.name}</span>
        <table ref={ref}><tbody>
          <tr><td style={cell}>A1</td><td style={cell}>B1</td></tr>
          <tr><td style={cell}>A2</td><td style={cell}>B2</td></tr>
        </tbody></table>
      </div>
      <LiveControls property={property} value={value} onChange={onChange} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   BOX MODEL — padding shown as the inset between an outer element
   edge and a coloured content box; margin shown as the gap from a
   reference frame.
--------------------------------------------------------------- */
function MarginTrimDemo({ property, value, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.style.cssText =
      "display:block;width:166px;height:182px;border:1px solid var(--accent-line);border-radius:9px;background:repeating-linear-gradient(45deg,color-mix(in srgb,var(--accent) 16%,var(--bg-3)) 0 7px,var(--bg-3) 7px 14px);overflow:hidden;" + (value.css || "");
  });
  // margins shown against the striped backdrop so a trimmed edge (no gap) reads
  const item = (i) => ({ margin: "20px", padding: "7px 12px", borderRadius: "6px", background: `color-mix(in srgb,var(--accent) ${42 + i * 16}%,var(--bg-3))`, color: "#fff", fontFamily: "var(--mono)", fontSize: "11px", textAlign: "center" });
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">margin-trim</span>
        <div ref={ref}>{[0, 1, 2].map((i) => <div key={i} style={item(i)}>item {i + 1}</div>)}</div>
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint="Each child has an 18px margin; margin-trim removes the ones touching the container's edges." />
    </React.Fragment>
  );
}

function BoxModelDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const isMargin = /margin/.test(n);
  if (n === "margin-trim") {
    // children carry margins; margin-trim removes the ones that touch the
    // container's edges (so the gap at the trimmed edge disappears).
    return <MarginTrimDemo property={property} value={value} onChange={onChange} />;
  }
  useEffect(() => {
    if (!ref.current) return;
    if (isMargin) {
      ref.current.style.cssText =
        "width:120px;height:78px;border-radius:8px;background:var(--accent);box-shadow:0 12px 26px -14px color-mix(in srgb,var(--accent) 55%,transparent);" + (value.css || "");
    } else {
      // content-sized (no height:100%) so the padding band shows on the BLOCK
      // axis too (padding-top/bottom), not just inline.
      ref.current.style.cssText =
        "width:190px;border-radius:10px;background:repeating-linear-gradient(45deg,color-mix(in srgb,var(--accent) 22%,var(--bg-3)) 0 8px,color-mix(in srgb,var(--accent) 12%,var(--bg-3)) 8px 16px);box-sizing:border-box;" + (value.css || "");
    }
  });
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        {isMargin ? (
          <div style={{ border: "1px dashed var(--line-strong)", borderRadius: "10px", background: "var(--bg-3)", display: "inline-block" }}>
            <div ref={ref} />
          </div>
        ) : (
          <div ref={ref}>
            <div style={{ height: "100%", minHeight: "70px", borderRadius: "6px", background: "var(--accent)", display: "grid", placeItems: "center", color: "#fff", fontFamily: "var(--mono)", fontSize: "11px" }}>content</div>
          </div>
        )}
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint={isMargin ? "The accent box sits inside a dashed frame; margin pushes it off the edges." : "The striped band is padding; the solid block is the content box."} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   TEXT — a real paragraph; decoration props get a base underline so
   colour/style/thickness/offset read; transform/emphasis/shadow/
   spacing apply directly.
--------------------------------------------------------------- */
function TextDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const decoration = /decoration|underline/.test(n) && n !== "text-decoration" && n !== "text-decoration-line";
  const emphasis = /^text-emphasis-(color|position|style)?$/.test(n) && n !== "text-emphasis-style";
  const overflow = n === "text-overflow";
  const justify = n === "text-justify";                       // needs justified multi-line
  const cjk = n === "text-autospace" || n === "text-spacing-trim"; // CJK inter-script spacing
  useEffect(() => {
    if (!ref.current) return;
    let base = "margin:0;font-family:var(--serif);font-size:26px;line-height:1.55;color:var(--ink);";
    if (overflow) base += "max-width:12ch;white-space:nowrap;overflow:hidden;border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:var(--bg-3);";
    else if (justify) base += "width:200px;font-size:17px;text-align:justify;border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:var(--bg-3);";
    else if (cjk) base += "width:210px;font-family:'Codex CJK',var(--serif);font-size:18px;";
    else base += "max-width:22ch;";
    if (decoration) base += "text-decoration-line:underline;text-decoration-thickness:3px;text-decoration-color:var(--accent);";
    if (emphasis) base += "-webkit-text-emphasis-style:filled circle;text-emphasis-style:filled circle;line-height:2.2;";
    ref.current.style.cssText = base + (value.css || "");
  });
  const txt = overflow ? "Specimen Quartz Glyphs overflow here"
    : justify ? "Specimen quartz glyphs justify across the measure with stretched word spacing."
    : cjk ? "Codex（コード）と「2024」年。日本語Test、混植テキスト。"
    : "Specimen Quartz Glyph 0123";
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <p ref={ref}>{txt}</p>
      </div>
      <LiveControls property={property} value={value} onChange={onChange} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   SVG — a real figure with fill + stroke; paint/stroke/geometry
   properties apply to the shape.
--------------------------------------------------------------- */
function SvgDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  useEffect(() => {
    if (!ref.current) return;
    let css = value.css || "";
    // marker-* take a <marker> reference; the grammar's url leaf is a generic
    // asset url, so point it at this demo's marker def so the markers render.
    if (/marker/.test(n)) css = css.replace(/url\([^)]*\)/g, "url(#cdxm)");
    ref.current.style.cssText = css;
  });
  let body;
  if (["cx", "cy", "r"].includes(n)) {
    body = <circle ref={ref} cx="120" cy="90" r="46" fill="var(--accent)" stroke="#2f5fd0" strokeWidth="4" />;
  } else if (["rx", "ry", "x", "y", "width", "height", "d"].includes(n)) {
    body = <rect ref={ref} x="60" y="36" width="120" height="108" fill="var(--accent)" stroke="#2f5fd0" strokeWidth="4" />;
  } else if (n === "text-anchor") {
    // text-anchor sets which end of the <text> sits at its x; a dashed vertical
    // guide marks that x so start (extends right) / middle / end (extends left) read.
    body = (
      <g>
        <line x1="120" y1="34" x2="120" y2="150" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 4" />
        <text ref={ref} x="120" y="104" fontSize="34" fill="var(--accent)" stroke="#2f5fd0" strokeWidth="0.5">Abgx</text>
      </g>
    );
  } else if (["alignment-baseline", "baseline-shift", "dominant-baseline"].includes(n)) {
    body = (
      <g>
        <line x1="0" y1="92" x2="240" y2="92" stroke="var(--line-strong)" strokeWidth="1" />
        <text x="120" y="92" fontSize="44" fill="var(--ink-2)" textAnchor="middle">A<tspan ref={ref} fill="var(--accent)" fontSize="30">bg</tspan>x</text>
      </g>
    );
  } else if (/marker/.test(n)) {
    // The CSS value (marker / marker-start|mid|end) supplies the marker refs —
    // the path carries NO preset markers, so none vs url(#…) and start/mid/end
    // read distinctly. A dot marker sits at every vertex of the zig-zag.
    body = (
      <g>
        <defs><marker id="cdxm" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><circle cx="5" cy="5" r="4.5" fill="#2f5fd0" /></marker></defs>
        <path ref={ref} d="M22,140 L80,44 L140,140 L210,44" fill="none" stroke="var(--accent)" strokeWidth="4" />
      </g>
    );
  } else if (n === "fill-rule") {
    // A true pentagram (vertices connected every-other) self-intersects, so the
    // nonzero vs evenodd winding rule visibly hollows or fills the centre.
    body = <polygon ref={ref} points="120,24 173,186 35,86 205,86 67,186"
      fill="var(--accent)" stroke="#2f5fd0" strokeWidth="3" />;
  } else if (n === "clip-rule") {
    // clip-rule governs the winding of a clipPath. The self-intersecting
    // pentagram clips the photo: evenodd punches a hole the centre, nonzero fills.
    body = (
      <g>
        <defs><clipPath id="cdxc"><polygon ref={ref} points="120,24 173,186 35,86 205,86 67,186" /></clipPath></defs>
        <image href="assets/photo.jpg" x="20" y="10" width="200" height="170" preserveAspectRatio="xMidYMid slice" clipPath="url(#cdxc)" />
      </g>
    );
  } else if (["stroke-linejoin", "stroke-miterlimit"].includes(n)) {
    // A SOLID thick stroke with a sharp acute corner so the join shape reads:
    // miter = long spike, bevel = flat cut, round = rounded; miterlimit clips
    // the spike to a bevel past its threshold. No dashes (they hide the join).
    body = <polyline ref={ref} points="40,150 120,40 200,150" fill="none"
      stroke="var(--accent)" strokeWidth="30" />;
  } else if (n === "vector-effect") {
    // non-scaling-stroke keeps the stroke at screen size under the 2× group
    // scale, so it reads thin; the default scales the stroke up to ~2× thick.
    body = (
      <g transform="translate(60 30) scale(2)">
        <polyline ref={ref} points="0,40 30,4 60,40" fill="none" stroke="var(--accent)" strokeWidth="6" strokeLinejoin="round" />
      </g>
    );
  } else if (["stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-width", "stroke-opacity"].includes(n)) {
    // An OPEN zig-zag with a dashed thick stroke so caps (butt/round/square),
    // dash array/offset and width all read on the dash ends.
    body = <polyline ref={ref} points="24,132 78,48 132,132 186,48 222,118" fill="none"
      stroke="var(--accent)" strokeWidth="16" strokeDasharray="26 14" strokeLinecap="butt" strokeLinejoin="miter" />;
  } else if (["stop-color", "stop-opacity"].includes(n)) {
    body = (
      <g>
        <defs><linearGradient id="cdxg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c5483c" /><stop ref={ref} offset="1" stopColor="#2f5fd0" /></linearGradient></defs>
        <rect x="28" y="28" width="184" height="124" rx="12" fill="url(#cdxg)" />
      </g>
    );
  } else if (["flood-color", "flood-opacity", "lighting-color"].includes(n)) {
    const prim = n === "lighting-color"
      ? <feDiffuseLighting in="SourceGraphic" surfaceScale="3" diffuseConstant="1"><fePointLight x="80" y="40" z="60" /></feDiffuseLighting>
      : <feFlood />;
    body = (
      <g>
        <filter id="cdxf" x="0" y="0" width="100%" height="100%">{React.cloneElement(prim, { ref })}</filter>
        <rect x="28" y="28" width="184" height="124" rx="12" fill="var(--accent)" filter="url(#cdxf)" />
      </g>
    );
  } else if (["color-interpolation", "color-interpolation-filters"].includes(n)) {
    // a wide blue→yellow gradient: sRGB interpolates through muddy grey/green,
    // linearRGB through a brighter green — the midtone band differs by value.
    body = (
      <g>
        <defs><linearGradient ref={ref} id="cdxci" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1530ff" /><stop offset="1" stopColor="#ffe000" />
        </linearGradient></defs>
        <rect x="16" y="46" width="208" height="88" rx="10" fill="url(#cdxci)" />
      </g>
    );
  } else {
    // fill / stroke / paint-order / fill-rule / vector-effect
    body = <polygon ref={ref} points="120,20 152,96 234,96 168,146 192,226 120,176 48,226 72,146 6,96 88,96"
      fill="var(--accent)" stroke="#2f5fd0" strokeWidth="9" strokeLinejoin="round"
      style={{ transform: "scale(.68)", transformOrigin: "center" }} />;
  }
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <svg width="250" height="180" viewBox="0 0 240 180">{body}</svg>
      </div>
      <LiveControls property={property} value={value} onChange={onChange} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   LISTS — a real <ul>; list-style-* apply to it; counters/content
   handled where meaningful.
--------------------------------------------------------------- */
function ListDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const counter = /^counter-/.test(n);   // counter-increment / -reset / -set
  useEffect(() => {
    if (!ref.current) return;
    if (counter) {
      // increment goes on each ITEM; reset/set go on the LIST. The ::before (in
      // the injected style) prints the my-ident & tag-a counters so the value's
      // number/ident choice produces a visibly different running tally.
      if (n === "counter-increment") ref.current.querySelectorAll("li").forEach((li) => (li.style.cssText = value.css || ""));
      else ref.current.style.cssText = "counter-reset:my-ident 0 tag-a 0;" + (value.css || "");
    } else {
      ref.current.style.cssText = "margin:0;padding-left:34px;font-family:var(--serif);font-size:18px;line-height:1.9;color:var(--ink);text-align:left;" + (value.css || "");
    }
  });
  if (counter) {
    return (
      <React.Fragment>
        <div className="glass"><span className="glass-label">{n}</span>
          <style>{`.cdxc{counter-reset:my-ident 0 tag-a 0;list-style:none;margin:0;padding:0;font-family:var(--mono);font-size:18px;line-height:2.1;color:var(--ink)}
            .cdxc li{counter-increment:my-ident 1 tag-a 1}
            .cdxc li::before{content:counter(my-ident) " · " counter(tag-a) "    ";color:var(--accent);font-weight:700}`}</style>
          <ul ref={ref} className="cdxc"><li>item</li><li>item</li><li>item</li><li>item</li></ul>
        </div>
        <LiveControls property={property} value={value} onChange={onChange}
          hint="Each row prints the running my-ident · tag-a counters; the value changes the tally." />
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <ul ref={ref}><li>Alpha specimen</li><li>Beta specimen</li><li>Gamma specimen</li></ul>
      </div>
      <LiveControls property={property} value={value} onChange={onChange} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   OBJECT / IMAGE — a real <img> in a fixed frame; object-fit/position
   reframe a mismatched-aspect photo, image-rendering up-scales a small
   image so the scaling algorithm shows.
--------------------------------------------------------------- */
function ObjectImageDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const rendering = n === "image-rendering" || n === "image-resolution";
  useEffect(() => {
    if (!ref.current) return;
    let base;
    if (rendering) base = "width:210px;height:150px;"; // small source up-scaled below
    else if (n === "object-position") base = "width:150px;height:150px;object-fit:none;"; // none so position reads
    else base = "width:150px;height:150px;object-fit:fill;"; // square frame, landscape photo
    ref.current.style.cssText = "border-radius:8px;border:1px solid var(--line);display:block;background:var(--bg-3);" + base + (value.css || "");
  });
  const src = rendering ? "assets/icon.png" : "assets/photo.jpg";
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <img ref={ref} src={src} alt="specimen" />
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint={rendering ? "A small image up-scaled — the value picks the scaling algorithm." : "A landscape photo in a square frame; the value reframes it."} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   BACKGROUNDS — a box carrying a real background image so position/
   size/repeat/origin/clip/attachment read; image/colour apply direct.
--------------------------------------------------------------- */
function BgDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const direct = n === "background-image" || n === "background-color" || n === "background" || n === "background-blend-mode";
  const clipOrigin = n === "background-clip" || n === "background-origin";
  useEffect(() => {
    if (!ref.current) return;
    let base;
    if (clipOrigin) {
      // thick dashed border + padding so the paint/positioning box is visible
      base = "width:200px;height:130px;border-radius:10px;border:14px dashed color-mix(in srgb,var(--accent) 50%,transparent);padding:18px;background-color:color-mix(in srgb,var(--accent) 30%,var(--bg-3));background-image:linear-gradient(135deg,#c5483c,#e0a13c,#2f5fd0);background-repeat:no-repeat;";
    } else if (n === "background-color") {
      // no covering image — the value's colour fills the box (with a small label)
      base = "width:200px;height:140px;border-radius:10px;border:1px solid var(--line);display:grid;place-items:center;color:var(--ink-3);font-family:var(--mono);font-size:11px;";
    } else if (direct) {
      base = "width:200px;height:140px;border-radius:10px;background-color:var(--accent);background-image:url(assets/photo.jpg),linear-gradient(135deg,#c5483c,#2f5fd0);background-size:cover;background-blend-mode:normal;";
    } else {
      base = "width:200px;height:140px;border-radius:10px;border:2px solid var(--line);background-image:url(assets/photo.jpg);background-repeat:no-repeat;background-size:60%;background-position:center;background-color:var(--bg-3);";
    }
    ref.current.style.cssText = base + (value.css || "");
  });
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span><div ref={ref} /></div>
      <LiveControls property={property} value={value} onChange={onChange} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   CLIP / MASK — a photo-filled box; clip-path clips it, mask-* use a
   real mask image / gradient to reveal parts.
--------------------------------------------------------------- */
function ClipMaskDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const svgRef = useRef(null);
  const n = property.name;
  const isMask = /^mask/.test(n);
  const isClip = n === "clip"; // deprecated rect() clip — needs absolute positioning
  const isType = n === "mask-type";        // SVG <mask> element property — demo'd via inline SVG
  const isComposite = n === "mask-composite"; // needs ≥2 mask layers to differ
  // mask-image / mask (shorthand) supply the mask THEMSELVES; the other mask-*
  // modifiers need a partial base mask so position/size/repeat/origin/clip read.
  const maskIsValue = n === "mask-image" || n === "mask" || n === "mask-border" || n === "mask-border-source";
  // a vivid, high-contrast backdrop behind the masked photo so any hidden (masked
  // out) region reads as a different colour rather than blending into the panel.
  const BACKDROP = "background:repeating-conic-gradient(#2f5fd0 0 25%, #e0a13c 0 50%) 0/40px 40px;";
  useEffect(() => {
    // mask-type: render the SVG as raw markup so the mask-type attribute reaches
    // the <mask> element (React drops the unknown SVG attribute). alpha → full
    // reveal (every gradient pixel is opaque); luminance → graded by brightness.
    if (isType) {
      if (!svgRef.current) return;
      const mt = value.value === "alpha" ? "alpha" : "luminance";
      svgRef.current.innerHTML =
        `<svg width="180" height="150" viewBox="0 0 100 100">
           <defs>
             <linearGradient id="lg-${mt}" x1="0" y1="0" x2="1" y2="1">
               <stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/>
             </linearGradient>
             <mask id="mt-${mt}" mask-type="${mt}" style="mask-type:${mt}">
               <rect x="0" y="0" width="100" height="100" fill="url(#lg-${mt})"/>
             </mask>
           </defs>
           <rect x="0" y="0" width="100" height="100" fill="#c5483c" mask="url(#mt-${mt})"/>
         </svg>`;
      return;
    }
    if (!ref.current) return;
    let base;
    if (isClip) {
      base = "position:absolute;top:24px;left:40px;width:170px;height:150px;background:url(assets/photo.jpg) center/cover;";
    } else if (isComposite) {
      // two large opaque shape layers that OVERLAP in the middle (star on the
      // left, disc on the right); the composite operator decides how they combine
      // — union / cut / overlap / xor — visibly different in the overlap region.
      const layers = "url(assets/mask-shape.svg), url(assets/mask-circle.svg)";
      const lay = (p) => `-webkit-mask-image:${layers};-webkit-mask-repeat:no-repeat;-webkit-mask-size:74%,74%;-webkit-mask-position:left center,right center;${p}`
        + `mask-image:${layers};mask-repeat:no-repeat;mask-size:74%,74%;mask-position:left center,right center;`;
      base = `width:200px;height:150px;background:url(assets/photo.jpg) center/cover;` + lay("");
    } else if (isMask && maskIsValue) {
      // the VALUE is the mask source; put it over a vivid backdrop so a real
      // alpha source (mask-shape.svg) cuts a silhouette instead of a full reveal.
      base = `width:170px;height:150px;${BACKDROP}`
        + `background:url(assets/photo.jpg) center/cover;`;
    } else if (isMask) {
      // a small contained mask of the statue so position/size/repeat/clip/origin shift visibly
      const m = "url(assets/mask.png)";
      base = `width:170px;height:150px;padding:10px;border:10px solid color-mix(in srgb,var(--accent) 40%,transparent);background:url(assets/photo.jpg) center/cover, linear-gradient(135deg,#c5483c,#2f5fd0);-webkit-mask-image:${m};-webkit-mask-repeat:no-repeat;-webkit-mask-position:left top;-webkit-mask-size:60%;mask-image:${m};mask-repeat:no-repeat;mask-position:left top;mask-size:60%;`;
    } else {
      base = "width:170px;height:150px;background:url(assets/photo.jpg) center/cover, linear-gradient(135deg,#c5483c,#2f5fd0);";
    }
    ref.current.style.cssText = base + (value.css || "");
  });
  if (isType) {
    return (
      <React.Fragment>
        <div className="glass"><span className="glass-label">{n}</span><div ref={svgRef} /></div>
        <LiveControls property={property} value={value} onChange={onChange} />
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      <div className="glass" style={isClip ? { position: "relative", minHeight: "200px" } : undefined}><span className="glass-label">{n}</span><div ref={ref} /></div>
      <LiveControls property={property} value={value} onChange={onChange} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   GRID — a grid container with items; container props shape the
   tracks/flow, item props (grid-column/row/area) span one item.
--------------------------------------------------------------- */
function GridDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const itemLevel = /^grid-(column|row|area)/.test(n) && !/gap/.test(n);
  // grid-auto-* tracks only exist once items overflow the explicit grid, and
  // auto-columns needs column flow; give the demo that context per property.
  const autoCol = n === "grid-auto-columns";
  useEffect(() => {
    if (!ref.current) return;
    if (itemLevel) {
      ref.current.style.cssText = "display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,30px);gap:6px;width:240px;";
    } else {
      // a small explicit grid so the value's auto tracks / flow / template / gaps
      // visibly reshape the (many) auto-placed cells.
      const base = autoCol
        ? "display:grid;grid-auto-flow:column;grid-template-rows:repeat(2,34px);grid-auto-columns:30px;gap:6px;width:240px;"
        : "display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:30px;gap:6px;width:240px;";
      ref.current.style.cssText = base + (value.css || "");
    }
  });
  const itemStyle = (hi) => ({ borderRadius: "5px", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: "11px", background: hi ? "var(--accent)" : "color-mix(in srgb, var(--accent) 18%, var(--bg-3))", color: hi ? "#fff" : "var(--ink-2)", border: "1px solid var(--line)", minWidth: 0, minHeight: 0 });
  const cells = Array.from({ length: itemLevel ? 11 : 10 }, (_, i) => i);
  // grid-auto-flow needs a couple of multi-track spanners so that the `dense`
  // variants visibly backfill the holes the spanners leave (vs sparse flow).
  const span = (i) => n === "grid-auto-flow" && (i === 1 || i === 5) ? { gridColumn: "span 2" } : null;
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <div ref={ref}>
          {itemLevel && <div style={{ ...itemStyle(true), ...(value.css ? cssToObj(value.css) : {}) }}>★</div>}
          {cells.map((i) => <div key={i} style={{ ...itemStyle(false), ...span(i) }}>{i + 1}</div>)}
        </div>
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint={itemLevel ? "The ★ item takes the value; watch where it lands/spans." : "The grid container is shaped by the value."} />
    </React.Fragment>
  );
}
function cssToObj(css) {
  const o = {};
  (css || "").split(";").forEach((d) => {
    const i = d.indexOf(":"); if (i < 0) return;
    const k = d.slice(0, i).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (k) o[k] = d.slice(i + 1).trim();
  });
  return o;
}

/* ---------------------------------------------------------------
   POSITIONING — an absolutely-positioned element inside a relative
   frame; inset/top/left move it; position changes the scheme; z-index
   restacks overlapping boxes.
--------------------------------------------------------------- */
function PositionDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const isZ = n === "z-index";
  const isPosition = n === "position";
  useEffect(() => {
    if (!ref.current) return;
    if (isZ) { ref.current.style.cssText = "position:relative;width:80px;height:80px;border-radius:8px;background:var(--accent);" + (value.css || ""); return; }
    const base = isPosition ? "width:74px;height:54px;border-radius:7px;background:var(--accent);color:#fff;display:grid;place-items:center;font-family:var(--mono);font-size:11px;"
      : "position:absolute;width:60px;height:46px;border-radius:7px;background:var(--accent);box-shadow:0 10px 22px -10px color-mix(in srgb,var(--accent) 55%,transparent);";
    ref.current.style.cssText = base + (value.css || "");
  });
  if (isZ) {
    return (
      <React.Fragment>
        <div className="glass"><span className="glass-label">{n}</span>
          <div style={{ position: "relative", width: "200px", height: "130px" }}>
            <div style={{ position: "absolute", left: 20, top: 20, width: 90, height: 90, borderRadius: 8, background: "color-mix(in srgb,#2f5fd0 80%,#000)", zIndex: 1 }} />
            <div ref={ref} style={{ position: "absolute", left: 70, top: 40 }} />
          </div>
        </div>
        <LiveControls property={property} value={value} onChange={onChange} hint="The red box's z-index vs the blue box (z-index:1) decides who's on top." />
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <div style={{ position: "relative", width: "210px", height: "150px", border: "1px dashed var(--line-strong)", borderRadius: "10px", background: "var(--bg-3)", overflow: "hidden" }}>
          <div ref={ref}>{isPosition ? value.value.slice(0, 8) : ""}</div>
        </div>
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint={isPosition ? "Positioning scheme of the box within its dashed frame." : "The box is offset from the frame edges by the value."} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   SIZING — a box whose size the value sets, against a fixed track so
   width/height/min/max/aspect-ratio read.
--------------------------------------------------------------- */
function SizeDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const grad = "linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 55%,#000))";
  const isBlock = /height|block-size/.test(n);
  const isMin = /^min-/.test(n);
  const isMax = /^max-/.test(n);
  const intrinsic = /contain-intrinsic/.test(n);   // placeholder size while content is skipped
  // The intrinsic content must FIGHT the constraint to make it visible:
  //  - min-*  needs SHORT content (smaller than the min) so the min pushes out.
  //  - max-*  needs LARGE content (bigger than the max) so the max clips it in.
  //  - plain width/height get medium content.
  const big = isBlock
    ? "Specimen text wraps down across several lines to give this box a tall intrinsic block size that a max can clip."
    : "Specimen content stretches wide";
  // min-* gets an EMPTY box so the min value IS the size (8px→8px bar … all
  // distinct, no text-line floor). max-* gets LARGE content so the max clips it.
  const content = isMin ? "" : isMax ? big : "Specimen";
  const pad = "color:#fff;font:600 13px/1.4 var(--sans);padding:" + (isMin ? "0" : "6px 8px") + ";box-sizing:border-box;overflow:hidden;";
  useEffect(() => {
    if (!ref.current) return;
    let base;
    if (n === "aspect-ratio") base = "width:120px;border-radius:8px;background:" + grad + ";";
    else if (n === "box-sizing") base = "width:150px;height:90px;border:12px solid color-mix(in srgb,var(--accent) 55%,var(--bg-3));padding:14px;border-radius:8px;background:" + grad + ";background-clip:content-box;";
    // contain-intrinsic-*: skip the content (content-visibility:hidden) so the box
    // takes its size FROM the intrinsic value; a base intrinsic-size seeds both axes.
    else if (intrinsic) base = "content-visibility:hidden;contain-intrinsic-size:96px 60px;border-radius:8px;background:" + grad + ";";
    // min-*: fix the cross axis, leave the constrained axis empty so min drives it.
    else if (isMin) base = (isBlock ? "width:150px;" : "height:44px;") + "border-radius:8px;background:" + grad + ";";
    else if (isMax) base = (isBlock ? "width:150px;" : "white-space:nowrap;") + "border-radius:8px;background:" + grad + ";";
    else base = (isBlock ? "width:150px;" : "width:120px;") + "border-radius:8px;background:" + grad + ";";
    ref.current.style.cssText = base + pad + (value.css || "");
  });
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <div style={{ width: "230px", minHeight: "180px", border: "1px dashed var(--line-strong)", borderRadius: "10px", display: "flex", alignItems: "flex-start", padding: "10px", overflow: "hidden" }}>
          <div ref={ref}>{content}</div>
        </div>
      </div>
      <LiveControls property={property} value={value} onChange={onChange} hint="The box wraps real content inside a fixed dashed track; the value sizes it." />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   TYPOGRAPHY — a specimen of glyphs the font property reshapes.
--------------------------------------------------------------- */
function TypographyDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  // Pick a specimen font + sample text that actually exercises this property:
  //  - axis props (weight/width/stretch/optical/variation) need the RobotoFlex
  //    variable font ("Codex Flex"), which carries wght/wdth/opsz/slnt axes.
  //  - feature props (numeric/ligatures/feature-settings/variant) need Inter
  //    ("Codex Inter"), whose OpenType features actually fire.
  // route the face that actually CARRIES the feature/axis the property drives:
  //  CJK (Noto JP) for east-asian; a feature-rich serif (EB Garamond) for
  //  ligatures; Inter for numeric/feature-settings/caps; a single-weight
  //  typewriter for synthesis (so faux bold/italic has something to synthesize);
  //  RobotoFlex (Codex Flex) variable for the axis props.
  const cjk = n === "font-variant-east-asian";
  const ligs = n === "font-variant-ligatures";
  const palette = n === "font-palette";
  const emoji = n === "font-variant-emoji";
  // EB Garamond ("Codex Garamond") is the richest face we bundle — it carries
  // smcp, swsh, frac, liga, onum AND tnum — so feature-settings, caps,
  // alternates and ligatures route there (Inter has no small-caps or swash).
  // Inter ("Codex Inter") keeps numeric (tnum/onum/frac/zero) + position
  // (sups/subs). RobotoFlex ("Codex Flex") drives the variation axes.
  const garamond = /feature-settings|variant-caps|variant-alternates/.test(n) || ligs;
  const inter = /variant-numeric|variant-position|^font-variant$/.test(n);
  let fam = "'Codex Flex'";
  if (cjk) fam = "'Codex CJK'"; else if (garamond) fam = "'Codex Garamond'";
  else if (palette) fam = "'Codex Spice'"; else if (inter) fam = "'Codex Inter'";
  let text = "Hamburgefonstiv";
  if (n === "font-kerning") text = "AVATo Wave Ye.";
  else if (cjk) text = "東京 水準 0123 縦書き 永";
  else if (n === "font-feature-settings") text = "Quartz Fjord 1/2 ct st fi 0123";
  else if (n === "font-variant-numeric") text = "0123456789  1/2 3/4  2nd";
  else if (n === "font-variant-alternates") text = "Quaint Regal afgjy";
  else if (ligs) text = "ct st fi ffl ffi  Quaint spqr";
  else if (palette) text = "CODEX";
  else if (emoji) text = "Codex ✉ ☂ ✈ ❤";
  else if (n === "font-variant-position") text = "H2SO4  E = mc2";
  else if (n === "font-variant-caps") text = "Codex Small Caps";
  else if (n === "font-size-adjust" || n === "font-size") text = "Hamburg 0123";
  useEffect(() => {
    if (!ref.current) return;
    // synthesis-* only fire when the face LACKS the requested style, so request
    // bold+italic+small-caps from the single-weight typewriter face.
    const synth = /synthesis/.test(n);
    const base = synth
      ? "margin:0;font-family:'Codex Typewriter',monospace;font-weight:800;font-style:italic;font-variant:all-small-caps;font-size:30px;line-height:1.4;color:var(--ink);"
      : `margin:0;font-family:${fam},var(--sans);font-size:${cjk ? 30 : 34}px;line-height:1.4;color:var(--ink);max-width:13ch;font-feature-settings:normal;font-variation-settings:normal;`;
    ref.current.style.cssText = base + (value.css || "");
  });
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <p ref={ref}>{text}</p>
      </div>
      <LiveControls property={property} value={value} onChange={onChange} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   LINE / INLINE SPACING — a narrow column of awkward text so
   wrapping/breaking/hyphenation/whitespace differences show.
--------------------------------------------------------------- */
function LineSpacingDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const tabs = n === "tab-size";
  const hyph = /hyphenate/.test(n);
  const cjk = n === "line-break";   // line-break mostly governs CJK breaking
  const ws = n === "white-space-collapse";  // needs runs of spaces/newlines to collapse
  const wrap = n === "text-wrap-style";     // balance evens the ragged lines
  useEffect(() => {
    if (!ref.current) return;
    let base = "margin:0;width:150px;font-size:16px;line-height:1.5;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:12px;background:var(--bg-3);text-align:left;";
    base += cjk ? "font-family:'Codex CJK',var(--serif);" : "font-family:var(--serif);";
    if (tabs) base += "white-space:pre-wrap;";                    // so the \t actually renders
    if (hyph) base += "hyphens:auto;-webkit-hyphens:auto;";       // so hyphenate-* apply
    if (wrap) base = "margin:0;width:230px;font-family:var(--serif);font-size:19px;line-height:1.45;color:var(--ink);text-wrap:wrap;";
    ref.current.style.cssText = base + (value.css || "");
    if (hyph) ref.current.setAttribute("lang", "en");
  });
  const text = tabs ? "Col\tA\tnums\t12\tand\t34 tabbed out"
    : cjk ? "日本語のテキストはこのように折り返します и 2024"
    : hyph ? "supercalifragilisticexpialidocious antidisestablishmentarianism phenomenon"
    : ws ? "Codex    spaced   out\n\nwith   breaks   kept   or   collapsed"
    : wrap ? "The codex balances this ragged headline across its measure"
    : "Pneumonoultramicroscopicsilicovolcanoconiosis and longlonglong wrapping.";
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <p ref={ref}>{text}</p>
      </div>
      <LiveControls property={property} value={value} onChange={onChange} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   COLUMNS — multi-column text so rules/spans/fill read.
--------------------------------------------------------------- */
function ColumnsDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const span = n === "column-span";
  const widthDriven = n === "column-width";  // let the value choose the column count
  const ruleProp = /column-rule/.test(n);
  const fill = n === "column-fill";
  useEffect(() => {
    if (!ref.current) return;
    let base = "width:248px;column-gap:16px;font-family:var(--serif);font-size:11px;line-height:1.5;color:var(--ink-2);text-align:justify;overflow:hidden;";
    base += widthDriven ? "" : "column-count:3;";          // column-width drives the count itself
    base += fill ? "height:84px;" : "height:150px;";        // a short, constrained height so fill mode shows
    base += ruleProp ? "column-rule:8px solid var(--accent);" : "column-rule:6px solid var(--accent);";
    ref.current.style.cssText = base + (span ? "" : (value.css || ""));
  });
  const para = "The codex flows its specimens into newspaper columns so the gutter rules, spans and balance can be seen at a glance across the measure of the page.";
  // column-fill needs LESS content than fills every column, so the auto vs
  // balance difference (lopsided vs even) is visible; others get the full flow.
  const body = fill ? para : para + " " + para;
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <div ref={ref}>
          {span && <h4 style={{ margin: "0 0 6px", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)", ...cssToObj(value.css) }}>{value.value}</h4>}
          {body}
        </div>
      </div>
      <LiveControls property={property} value={value} onChange={onChange} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   BOX / DISPLAY — display reshapes a container of children; float
   wraps text; overflow shows clipped/scrolled content.
--------------------------------------------------------------- */
function DisplayDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const isFloatClear = n === "float" || n === "clear";
  const isOverflow = /^overflow/.test(n);
  useEffect(() => {
    if (!ref.current) return;
    if (n === "display") ref.current.style.cssText = "gap:6px;width:210px;border:1px dashed var(--line-strong);border-radius:8px;padding:8px;background:var(--bg-3);" + (value.css || "");
    else if (n === "clear") ref.current.style.cssText = "height:24px;border-radius:6px;background:var(--accent);color:#fff;font-family:var(--mono);font-size:11px;display:grid;place-items:center;margin-top:4px;" + (value.css || "");
    else if (isFloatClear) ref.current.style.cssText = "width:70px;height:50px;border-radius:7px;background:var(--accent);margin:0 10px 6px 0;" + (value.css || "");
    else if (n === "overflow-clip-margin") ref.current.style.cssText = "width:118px;height:88px;border:1.5px solid var(--accent);border-radius:8px;background:var(--bg-3);overflow:clip;margin:50px;" + (value.css || "");
    else if (isOverflow) ref.current.style.cssText = "width:170px;height:120px;border:1px solid var(--line);border-radius:8px;background:var(--bg-3);padding:10px;" + (value.css || "");
    else ref.current.style.cssText = "width:150px;height:96px;border-radius:8px;background:var(--accent);" + (value.css || "");
  });
  if (isFloatClear) {
    const clearing = n === "clear";
    return (
      <React.Fragment>
        <div className="glass"><span className="glass-label">{n}</span>
          <div style={{ width: "230px", fontFamily: "var(--serif)", fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.5 }}>
            {/* clear: a left + right float for the bar to clear past; float: the box IS the float */}
            {clearing && <div style={{ float: "inline-start", width: "56px", height: "44px", background: "#2f5fd0", borderRadius: "6px", margin: "0 8px 6px 0" }} />}
            {clearing && <div style={{ float: "inline-end", width: "56px", height: "70px", background: "#2f8f6b", borderRadius: "6px", margin: "0 0 6px 8px" }} />}
            <div ref={ref}>{clearing ? "cleared bar" : null}</div>
            The codex wraps its running text around the floated specimens so the value's effect on flow is plainly visible across several lines of prose here.
          </div>
        </div>
        <LiveControls property={property} value={value} onChange={onChange} />
      </React.Fragment>
    );
  }
  const child = { borderRadius: "5px", padding: "8px 10px", background: "color-mix(in srgb,var(--accent) 26%,var(--bg-3))", color: "var(--ink)", fontFamily: "var(--mono)", fontSize: "11px", border: "1px solid var(--line)" };
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        {isOverflow
          ? <div ref={ref}><div style={{ width: "260px", height: "200px", background: "repeating-linear-gradient(45deg,color-mix(in srgb,var(--accent) 20%,var(--bg-3)) 0 10px,var(--bg-3) 10px 20px)", borderRadius: "6px" }} /></div>
          : <div ref={ref}><span style={child}>one</span><span style={child}>two</span><span style={child}>three</span></div>}
      </div>
      <LiveControls property={property} value={value} onChange={onChange} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   TABLES — a real table; table-layout / caption-side / empty-cells.
--------------------------------------------------------------- */
function TableDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  useEffect(() => {
    if (ref.current) ref.current.style.cssText =
      "border-collapse:separate;border:2px solid var(--accent);background:var(--bg-3);color:var(--ink-2);font-family:var(--mono);font-size:12px;width:210px;" + (value.css || "");
  });
  const cell = { border: "1px solid color-mix(in srgb,var(--accent) 45%,var(--bg-3))", padding: "8px 12px" };
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <table ref={ref}>
          <caption style={{ padding: "4px", color: "var(--accent)", fontSize: "11px" }}>caption</caption>
          <tbody>
            {/* lopsided content so table-layout auto (size-to-content) vs fixed
                (equal columns) produce visibly different column widths */}
            <tr><td style={cell}>A</td><td style={cell}>Supercalifragilistic</td></tr>
            <tr><td style={cell}>Gamma delta epsilon</td><td style={cell}>B</td></tr>
          </tbody>
        </table>
      </div>
      <LiveControls property={property} value={value} onChange={onChange} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   WRITING MODE — a block of text whose direction/orientation changes.
--------------------------------------------------------------- */
function WritingDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  // text-orientation / text-combine-upright only manifest in VERTICAL flow with
  // CJK + digit runs; give them that context so the value reads.
  const vertical = n === "text-orientation" || n === "text-combine-upright";
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.cssText =
      "margin:0;width:170px;height:150px;border:1px solid var(--line);border-radius:8px;padding:12px;background:var(--bg-3);font-size:19px;line-height:1.7;color:var(--ink);"
      + (vertical ? "font-family:'Codex CJK',var(--serif);writing-mode:vertical-rl;" : "font-family:var(--serif);")
      + (value.css || "");
  });
  const text = vertical ? "縦書き 2024 テキスト 12" : "Codex 文字 specimen 1234 — flowing lines";
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <p ref={ref}>{text}</p>
      </div>
      <LiveControls property={property} value={value} onChange={onChange} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   FLEX item/container — a flex row of items; one ★ item or the whole
   container takes the value so align-self/order/place-* etc. read.
--------------------------------------------------------------- */
function FlexFixDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const grid = ["justify-items", "place-items", "justify-self", "place-self"].includes(n);
  const itemLevel = ["align-self", "justify-self", "place-self", "order", "flex-basis", "flex-shrink", "flex", "flex-grow"].includes(n);
  useEffect(() => {
    if (!ref.current) return;
    if (grid) {
      // big cells, content-sized items, so place-items / -self alignment WITHIN a
      // cell reads (fixed width, not fit-content, so the cells keep their 60px).
      ref.current.style.cssText = "display:grid;grid-template-columns:repeat(3,60px);grid-template-rows:repeat(2,50px);gap:8px;width:196px;" + (itemLevel ? "" : (value.css || ""));
    } else if (itemLevel) {
      // a no-wrap row, slightly over-full so flex / flex-shrink / order on the
      // ★ visibly change its size or position among the siblings
      ref.current.style.cssText = "display:flex;gap:7px;align-items:stretch;width:232px;height:108px;border:1px dashed var(--line-strong);border-radius:8px;padding:8px;";
    } else {
      // align-content needs MULTIPLE lines with spare cross-axis room to distribute
      ref.current.style.cssText = "display:flex;gap:8px;width:232px;height:150px;border:1px dashed var(--line-strong);border-radius:8px;padding:8px;flex-wrap:wrap;" + (value.css || "");
    }
  });
  const box = (hi, extra) => ({ ...extra, borderRadius: "6px", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: "11px", background: hi ? "var(--accent)" : "color-mix(in srgb,var(--accent) 18%,var(--bg-3))", color: hi ? "#fff" : "var(--ink-2)", border: "1px solid var(--line)" });

  if (grid) {
    // PLAIN content-sized items (no display:grid, which suppresses justify-self):
    // start→corner, center→middle, end→far corner, stretch→fills the cell.
    const gitem = (hi) => ({ padding: "2px 7px", minWidth: 0, minHeight: 0, borderRadius: "6px", textAlign: "center", lineHeight: "18px",
      fontFamily: "var(--mono)", fontSize: "11px", background: hi ? "var(--accent)" : "color-mix(in srgb,var(--accent) 18%,var(--bg-3))", color: hi ? "#fff" : "var(--ink-2)", border: "1px solid var(--line)" });
    return (
      <React.Fragment>
        <div className="glass"><span className="glass-label">{n}</span>
          <div ref={ref}>
            {itemLevel && <div style={{ ...gitem(true), ...cssToObj(value.css) }}>★</div>}
            {[1, 2, 3, 4, 5].map((i) => <div key={i} style={gitem(false)}>{i}</div>)}
          </div>
        </div>
        <LiveControls property={property} value={value} onChange={onChange}
          hint={itemLevel ? "The ★ item is aligned within its (larger) grid cell by the value." : "Every item is aligned within its cell by the value."} />
      </React.Fragment>
    );
  }
  if (itemLevel) {
    // ★ starts wide so flex-shrink/flex visibly resize it; siblings flex-shrink
    // to make room; siblings carry spread orders so the ★'s order moves it.
    const star = { ...box(true, { flex: "1 1 86px", height: "auto" }), ...cssToObj(value.css) };
    return (
      <React.Fragment>
        <div className="glass"><span className="glass-label">{n}</span>
          <div ref={ref}>
            <div style={star}>★</div>
            {[1, 2, 3, 4].map((i) => <div key={i} style={box(false, { flex: "1 1 34px", height: "auto", order: i })}>{i}</div>)}
          </div>
        </div>
        <LiveControls property={property} value={value} onChange={onChange}
          hint="The ★ item carries the value among its siblings — watch its size or position shift." />
      </React.Fragment>
    );
  }
  // container-level (flex-flow / align-content / justify-content …)
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <div ref={ref}>
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} style={box(false, { flex: "0 0 auto", width: "62px", height: "30px" })}>{i}</div>)}
        </div>
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint="The whole flex container takes the value." />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   BREAKS / FRAGMENTATION — a 2-column flow; the ★ card carries the
   break value. break-before/after: column/always push it to the next
   column; avoid keeps it; orphans/widows act on the split paragraph.
   (page / left / right values are print-only — no on-screen effect.)
--------------------------------------------------------------- */
function BreakDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const lines = /orphans|widows/.test(n);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.cssText =
      "columns:2;column-gap:16px;column-rule:1px dashed var(--line-strong);width:248px;height:180px;font-family:var(--serif);font-size:10.5px;line-height:1.5;color:var(--ink-2);text-align:justify;" +
      (lines ? (value.css || "") : "");
  });
  const card = (i, hi) => ({
    breakInside: "avoid", margin: "0 0 7px", padding: "5px 7px", borderRadius: "5px",
    background: hi ? "var(--accent)" : "color-mix(in srgb,var(--accent) 14%,var(--bg-3))",
    color: hi ? "#fff" : "var(--ink-2)", fontFamily: "var(--mono)", fontSize: "10px",
    ...(hi ? cssToObj(value.css) : {}),
  });
  const para = "Fragmentation flows boxes down one column then into the next; the break value decides where the highlighted card lands. ";
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <div ref={ref}>
          {lines ? (para + para + para + para)
            : [0, 1, 2, 3, 4, 5].map((i) => {
              // the ★ card is TALL so break-inside:avoid (keep whole) vs auto
              // (allow split across the column boundary) is visible.
              const tall = n === "break-inside" && i === 3;
              return <div key={i} style={card(i, i === 3)}>card {i + 1}{i === 3 ? " ★" : ""}{tall ? " — " + para + para : ""}</div>;
            })}
        </div>
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint={lines ? "The paragraph splits across columns; the value sets min lines kept together."
          : "The ★ card takes the value — column/always push it to the next column; page/left/right are print-only."} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   PAGED — a tall printable "document". The screenshot driver renders
   this to a PDF (print media) and rasterises the pages, so paged-media
   behaviour that only exists across page boundaries — break-before/after:
   page, page-break-*, break-inside:avoid, orphans/widows — becomes visible.
   On screen it just shows the top of the document.
--------------------------------------------------------------- */
function PagedDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const lines = /orphans|widows/.test(n);   // applies to the flowing container
  useEffect(() => {
    if (ref.current) ref.current.style.cssText = lines ? (value.css || "") : "";
  });
  const para = "Fragmentation is how CSS flows a tall document across page (or column) boundaries. Where the engine is allowed — or forced — to break decides what lands on each page. ";
  const breakVal = lines ? undefined : cssToObj(value.css);
  const P = (k) => <p key={k} style={{ margin: "0 0 9px" }}>{para}{para}</p>;
  return (
    <React.Fragment>
      <div className="glass paged-glass"><span className="glass-label">{n}</span>
        <div className="paged-doc" ref={ref}>
          <h3 style={{ margin: "0 0 8px" }}>Section I — opening</h3>
          {[0, 1, 2, 3].map(P)}
          <div className="paged-section" style={breakVal}>
            <h3 style={{ margin: "0 0 8px" }}>Section II — {lines ? "the split paragraph" : "takes the value"}</h3>
            {[4, 5, 6].map(P)}
          </div>
          {[7, 8].map(P)}
        </div>
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint={lines ? "Printed across pages — the value sets the min lines kept together at a page break."
          : "Printed to PDF — break / page-break values force or avoid a page break before Section II."} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   SHAPES — a floated shape with text wrapping around its contour.
--------------------------------------------------------------- */
function ShapeDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  useEffect(() => {
    if (ref.current) ref.current.style.cssText =
      "float:left;width:110px;height:110px;margin:0 12px 6px 0;background:linear-gradient(140deg,var(--accent),#2f5fd0);border-radius:50%;shape-outside:circle(50%);" + (value.css || "");
  });
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <div style={{ width: "250px", fontFamily: "var(--serif)", fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.5 }}>
          <div ref={ref} />
          The codex pours its running prose so it hugs the contour of the floated specimen, and the value reshapes how tightly the text wraps around it line by line.
        </div>
      </div>
      <LiveControls property={property} value={value} onChange={onChange} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   EFFECTS — box-shadow / isolation / blend over a backdrop.
--------------------------------------------------------------- */
function EffectsDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const shadow = n === "box-shadow";
  const isFilter = n === "filter";
  const isBackdrop = n === "backdrop-filter";
  useEffect(() => {
    if (!ref.current) return;
    let base;
    if (isFilter) // apply to a photo — brightness/contrast/sepia/hue-rotate read far better on an image
      base = "width:160px;height:110px;border-radius:12px;background:url(assets/photo.jpg) center/cover;";
    else if (isBackdrop) // a translucent pane that filters the busy content behind it
      base = "width:160px;height:110px;border-radius:12px;background:color-mix(in srgb,#fff 14%,transparent);border:1px solid color-mix(in srgb,#fff 30%,transparent);";
    else
      base = "width:150px;height:96px;border-radius:12px;background:linear-gradient(140deg,var(--accent),color-mix(in srgb,var(--accent) 50%,#000));";
    ref.current.style.cssText = base + (value.css || "");
  });
  // box-shadow needs a plain backdrop so the cast shadow reads; blend modes and
  // backdrop-filter need a busy backdrop to act against; filter is self-contained.
  const backdrop = shadow
    ? { padding: "42px", background: "var(--bg-3)", borderRadius: "14px", border: "1px solid var(--line)" }
    : isFilter
    ? { padding: "30px", background: "var(--bg-3)", borderRadius: "14px", border: "1px solid var(--line)" }
    : { padding: "26px", background: "conic-gradient(from 20deg,#c5483c,#e0a13c,#2f8f6b,#2f5fd0,#8a3ca0,#c5483c)", borderRadius: "14px" };
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <div style={backdrop}><div ref={ref} /></div>
      </div>
      <LiveControls property={property} value={value} onChange={onChange} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   TRANSFORM (3D) — a card in a perspective scene; origin/style/
   perspective-origin/backface-visibility/rotate read in real depth.
--------------------------------------------------------------- */
function TransformFixDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const sceneRef = useRef(null);
  const n = property.name;
  useEffect(() => {
    if (!ref.current) return;
    // top half light / bottom half dark + an up-arrow so x/y/z rotation and
    // flips are unmistakable; gridlines give the 3D tilt depth.
    let base = "width:120px;height:84px;border-radius:10px;background:linear-gradient(180deg,#ec6a5e 0 50%,#23306b 50% 100%);display:grid;place-items:center;color:#fff;font:700 22px var(--mono);box-shadow:0 16px 30px -14px color-mix(in srgb,var(--accent) 60%,transparent);backface-visibility:inherit;";
    if (n === "backface-visibility") base += "transform:rotateY(165deg);";
    // transform-origin: a big IN-PLANE rotation so the pivot point visibly moves
    // the card. transform-style: rotate the card a little; the nested child's 3D
    // pop only survives under preserve-3d (flat projects it onto the card plane).
    else if (n === "transform-origin") base += "transform:rotate(40deg);";
    else if (n === "transform-style") base += "transform:rotateY(34deg);";
    else if (n === "transform-box") base += "transform:rotateY(42deg) rotateX(12deg);";
    else if (n === "perspective-origin") base += "transform:rotateX(38deg);";
    ref.current.style.cssText = base + (value.css || "");
    if (sceneRef.current && n === "perspective-origin") sceneRef.current.style.cssText = "perspective:420px;width:100%;height:100%;display:grid;place-items:center;" + (value.css || "");
  });
  return (
    <React.Fragment>
      <div className="glass" style={{ perspective: "460px" }}>
        <span className="glass-label">{n}</span>
        <div ref={sceneRef} style={{ transformStyle: "preserve-3d", display: "grid", placeItems: "center" }}>
          <div ref={ref}>
            {n === "transform-style"
              ? <div style={{ width: "54px", height: "54px", margin: "15px", borderRadius: "8px", background: "#f0c24b", transform: "rotateY(60deg) translateZ(26px)", display: "grid", placeItems: "center", color: "#222", font: "700 16px var(--mono)" }}>3D</div>
              : "↑"}
          </div>
        </div>
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint="A card in a perspective scene; the value reshapes how it sits in 3D." />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   OFFSET / MOTION PATH — a dot rides a visible path; offset-distance
   moves it along, offset-rotate turns it, offset-path swaps the route.
--------------------------------------------------------------- */
const OFFSET_PATH = "M16,96 C 70,8 170,8 224,96";
function OffsetDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const ownPath = n === "offset-path";      // value supplies its own geometry
  const posMode = n === "offset-position";  // no path: offset-position places it directly
  const fixedGuide = !ownPath && !posMode;  // only show the dashed guide when we pin the arc
  useEffect(() => {
    if (!ref.current) return;
    // the riding element has REAL size (28×16) so offset-anchor (which point of
    // the box rides the path) and offset-position (its start point) actually move it.
    let base = "position:absolute;left:0;top:0;width:28px;height:16px;background:var(--accent);"
      + "box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 28%,transparent);clip-path:polygon(0 0,68% 0,100% 50%,68% 100%,0 100%);offset-rotate:auto;";
    if (ownPath) base += "offset-distance:60%;";                       // value sets offset-path
    else if (posMode) base += "offset-path:none;";                     // value sets offset-position
    else base += `offset-path:path('${OFFSET_PATH}');offset-distance:50%;`;
    ref.current.style.cssText = base + (value.css || "");
  });
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">{n}</span>
        <div style={{ position: "relative", width: "240px", height: "112px" }}>
          {fixedGuide && <svg width="240" height="112" style={{ position: "absolute", inset: 0 }}>
            <path d={OFFSET_PATH} fill="none" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="3 4" />
          </svg>}
          <div ref={ref} />
        </div>
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint="The arrow rides the dashed path — the value sets where along it (and which way) it points." />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   ANCHOR POSITIONING — a chip tethered to a central anchor; the value
   (position-area / position-try / etc.) decides where it sits.
--------------------------------------------------------------- */
function AnchorDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const anchorRef = useRef(null);
  const n = property.name;
  // The anchor is named --my-var (matching the generator's dashed-ident rep) and
  // the chip references --my-var, so anchor-name / position-anchor wire UP only
  // when the value is --my-var (vs none/auto → the chip can't anchor → fallback).
  const onAnchor = n === "anchor-name" || n === "anchor-scope";
  useEffect(() => {
    if (!ref.current) return;
    let chip = "position:absolute;position-anchor:--my-var;margin:5px;background:var(--accent);color:#fff;font:600 11px var(--mono);padding:4px 9px;border-radius:5px;white-space:nowrap;";
    if (!/position-area|^position$|position-try/.test(n)) chip += "position-area:top span-right;";
    // chip carries the value for position-* props; for anchor-name/scope the
    // value goes on the ANCHOR instead (previewCss blanks the hang-prone tries).
    ref.current.style.cssText = chip + (onAnchor ? "" : previewCss(n, value.css));
    if (anchorRef.current) anchorRef.current.style.cssText =
      "anchor-name:--my-var;width:44px;height:30px;border-radius:7px;background:color-mix(in srgb,var(--accent) 22%,var(--bg-3));border:1px solid var(--accent-line);display:grid;place-items:center;font-family:var(--mono);font-size:9px;color:var(--ink-2);"
      + (onAnchor ? value.css : "");
  });
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">{n}</span>
        <div style={{ position: "relative", width: "230px", height: "150px", display: "grid", placeItems: "center" }}>
          <div ref={anchorRef}>⚓</div>
          <div ref={ref}>chip</div>
        </div>
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint="The chip is tethered to the named anchor; the value decides whether/where it lands." />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   COLOR — opacity over a busy backdrop; color-scheme on native controls.
--------------------------------------------------------------- */
function ColorDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const scheme = n === "color-scheme" || n === "forced-color-adjust" || n === "print-color-adjust";
  const accent = n === "accent-color";
  const text = n === "color";
  useEffect(() => {
    if (!ref.current) return;
    if (scheme) ref.current.style.cssText = "padding:14px;border-radius:10px;background:Canvas;color:CanvasText;font-family:var(--sans);" + (value.css || "");
    else if (accent) ref.current.style.cssText = "display:grid;gap:14px;justify-items:start;font-family:var(--sans);color:var(--ink);" + (value.css || "");
    else if (text) ref.current.style.cssText = "font-family:var(--serif);font-size:30px;line-height:1.3;" + (value.css || "");
    else ref.current.style.cssText = "width:130px;height:90px;border-radius:12px;background:linear-gradient(140deg,var(--accent),#2f5fd0);" + (value.css || "");
  });
  let body;
  if (scheme) body = <div ref={ref}><div style={{ marginBottom: 8, fontSize: 12 }}>system colors</div><input type="checkbox" defaultChecked /> <progress value="0.6" /> <button>btn</button> <a href="#" onClick={(e) => e.preventDefault()}>link</a></div>;
  else if (accent) body = <div ref={ref}><label style={{ display: "flex", gap: 9, alignItems: "center" }}><input type="checkbox" defaultChecked style={{ width: 20, height: 20 }} />checkbox</label><label style={{ display: "flex", gap: 9, alignItems: "center" }}><input type="radio" defaultChecked style={{ width: 20, height: 20 }} />radio</label><input type="range" defaultValue="62" style={{ width: 200 }} /><progress value="0.62" style={{ width: 200 }} /></div>;
  else if (text) body = <p ref={ref} style={{ margin: 0 }}>Codex specimen — the quick brown fox 0123</p>;
  else body = <div style={{ padding: "20px", borderRadius: "14px", background: "conic-gradient(from 20deg,#c5483c,#e0a13c,#2f8f6b,#2f5fd0,#c5483c)" }}><div ref={ref} /></div>;
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>{body}</div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint={scheme ? "Tints the native controls' system colors." : accent ? "accent-color tints the checkbox / radio / range / progress." : text ? "color sets the text foreground." : "The box's opacity lets the busy backdrop show through."} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   CONTAINMENT — content-visibility hides/skips the subtree; contain:size
   collapses it. (container-type / -name / will-change are invisible hints.)
--------------------------------------------------------------- */
function ContainDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  // container-name / container-type: a query container holding a child whose
  // @container rule (keyed on the name "my-ident") fires ONLY when the container
  // is both a query container (type:size/inline-size) AND named my-ident.
  const query = n === "container-name" || n === "container-type";
  useEffect(() => {
    if (!ref.current) return;
    if (query) {
      const base = n === "container-name"
        ? "container-type:inline-size;" + (value.css || "")          // name from value
        : "container-name:my-ident;" + (value.css || "");            // type from value
      ref.current.style.cssText = "width:190px;min-height:64px;border:1px solid var(--line);border-radius:8px;padding:10px;background:var(--bg-3);" + base;
    } else {
      ref.current.style.cssText = "width:170px;min-height:46px;border:1px solid var(--line);border-radius:8px;padding:10px;background:var(--bg-3);font-family:var(--serif);font-size:14px;line-height:1.5;color:var(--ink);overflow:hidden;" + (value.css || "");
    }
  });
  if (query) {
    return (
      <React.Fragment>
        <div className="glass"><span className="glass-label">{n}</span>
          <style>{`@container my-ident (min-width: 0px){.cdxqchild{background:#c5483c !important;color:#fff !important;border-color:#c5483c !important}}`}</style>
          <div ref={ref}><div className="cdxqchild" style={{ padding: "10px 12px", borderRadius: "6px", border: "1px dashed var(--line-strong)", background: "var(--bg-2)", color: "var(--ink-3)", fontFamily: "var(--mono)", fontSize: "12px" }}>@container child — lights up when the container queries by name</div></div>
        </div>
        <LiveControls property={property} value={value} onChange={onChange}
          hint="The child reacts to @container my-ident — it only fires when the container is a NAMED query container." />
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <div ref={ref}>
          <img src="assets/photo.jpg" alt="" style={{ width: "48px", height: "32px", borderRadius: "4px", float: "left", margin: "0 8px 4px 0" }} />
          Codex specimen content that containment can skip rendering or collapse to nothing.
        </div>
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint="content-visibility:hidden skips the subtree (blank); contain:size collapses it." />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   MISC — one demo, many shapes: inline vertical-align, line-clamp,
   ruby annotation, legacy -webkit-box, MathML, quotes, drop-cap.
--------------------------------------------------------------- */
function MiscDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const kind = /^box-/.test(n) ? "box"
    : /^ruby/.test(n) ? "ruby"
    : /^math-/.test(n) ? "math"
    : ["vertical-align", "line-clamp", "quotes", "initial-letter"].includes(n) ? n : "plain";
  useEffect(() => {
    if (!ref.current) return;
    const v = value.css || "";
    if (kind === "vertical-align") ref.current.style.cssText = "display:inline-block;width:30px;height:30px;border-radius:6px;background:var(--accent);" + v;
    else if (kind === "line-clamp") ref.current.style.cssText = "width:190px;font-family:var(--serif);font-size:15px;line-height:1.5;color:var(--ink);" + v;
    // legacy box-* only work prefixed (-webkit-box-*); translate the value.
    // orient/pack/align/direction/lines are CONTAINER props; flex/ordinal-group/
    // flex-group are CHILD props applied to the highlighted first child.
    else if (kind === "box") {
      const childProp = /box-flex|box-ordinal-group|box-flex-group/.test(n);
      const wv = v.replace(/(^|;)\s*box-/g, "$1-webkit-box-");
      ref.current.style.cssText = "display:-webkit-box;width:200px;height:110px;border:1px dashed var(--line-strong);border-radius:8px;padding:6px;-webkit-box-orient:horizontal;-webkit-box-pack:start;-webkit-box-align:stretch;-webkit-box-direction:normal;" + (childProp ? "" : wv);
      if (childProp && ref.current.firstElementChild) ref.current.firstElementChild.style.cssText += ";" + wv;
    }
    else if (kind === "ruby") ref.current.style.cssText = "font-family:'Codex CJK',var(--serif);font-size:30px;color:var(--ink);" + v;
    else if (kind === "math") ref.current.style.cssText = "font-size:26px;color:var(--ink);" + v;
    else if (kind === "quotes") ref.current.style.cssText = "font-family:var(--serif);font-size:19px;color:var(--ink);" + v;
    else if (kind === "initial-letter") ref.current.style.cssText = "font-family:var(--serif);font-size:15px;line-height:1.4;width:200px;color:var(--ink);" + v;
    else ref.current.style.cssText = "width:170px;min-height:60px;border:1px solid var(--line);border-radius:8px;padding:10px;background:var(--bg-3);font-family:var(--serif);font-size:15px;color:var(--ink);" + v;
  });
  let body;
  if (kind === "vertical-align") body = <p style={{ margin: 0, fontFamily: "var(--serif)", fontSize: "22px", color: "var(--ink)", borderBottom: "1px solid var(--accent-line)" }}>Text <span ref={ref} /> baseline xÿ</p>;
  else if (kind === "line-clamp") body = <p ref={ref} style={{ margin: 0 }}>The codex clamps this specimen paragraph to a fixed number of lines and appends an ellipsis so the overflow is truncated cleanly across the measure.</p>;
  else if (kind === "box") body = <div ref={ref}>{[1, 2, 3].map((i) => <div key={i} style={{ background: `color-mix(in srgb,var(--accent) ${i * 22}%,var(--bg-3))`, border: "1px solid var(--line)", borderRadius: "5px", margin: "2px", padding: "6px 10px", color: "var(--ink-2)", fontFamily: "var(--mono)", fontSize: "11px" }}>{i}</div>)}</div>;
  else if (kind === "ruby") body = <ruby ref={ref}>東京<rt>とうきょう</rt> 札<rt>さつ</rt></ruby>;
  else if (kind === "math") body = <math ref={ref} display="block"><mfrac><mrow><msup><mi>x</mi><mn>2</mn></msup></mrow><mrow><mi>y</mi></mrow></mfrac><mo>+</mo><msqrt><mi>z</mi></msqrt></math>;
  else if (kind === "quotes") body = <p ref={ref} style={{ margin: 0 }}>A <q>nested <q>quote</q> here</q> end</p>;
  else if (kind === "initial-letter") body = <p ref={ref} style={{ margin: 0 }}><span style={{ initialLetter: "3", WebkitInitialLetter: "3", ...cssToObj(value.css) }}>C</span>odex drop-cap specimen text wraps around the raised initial letter for several lines.</p>;
  else body = <div ref={ref}>Codex specimen — {value.value}</div>;
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>{body}</div>
      <LiveControls property={property} value={value} onChange={onChange} />
    </React.Fragment>
  );
}

/* ---------- contextual demo router (consulted first by resolveDemo) ---------- */
function contextDemoFor(family, property) {
  if (family.id === "transforms" && ["transform-origin", "transform-style", "transform-box", "perspective-origin", "backface-visibility", "rotate"].includes(property.name)) return TransformFixDemo;
  // flexbox: only the B/C item/align props override the focus FlexDemo
  if (family.id === "flexbox" && ["align-self", "justify-self", "place-self", "order", "flex-basis", "flex-shrink", "flex", "flex-flow", "justify-items", "place-items", "flex-wrap", "align-content", "row-gap"].includes(property.name)) return FlexFixDemo;
  // clip-rule / text-anchor are SVG-only though they live in other families
  if (property.name === "clip-rule" || property.name === "text-anchor") return SvgDemo;
  if (property.name === "opacity" || property.name === "color-scheme") return ColorDemo;
  if (/^caret/.test(property.name)) return InteractiveDemo; // focused-caret demo (overrides the color family)
  // paged-media props are captured by printing the document to PDF, not on screen
  if (["page", "page-break-before", "page-break-after", "page-break-inside",
    "break-before", "break-after", "break-inside", "orphans", "widows"].includes(property.name)) return PagedDemo;
  switch (family.id) {
    case "borders": return BorderDemo;
    case "padding": return BoxModelDemo;
    case "margin": return BoxModelDemo;
    case "text-styling": return TextDemo;
    case "svg": return SvgDemo;
    case "lists": return ListDemo;
    case "object-image": return ObjectImageDemo;
    case "backgrounds": return BgDemo;
    case "clip-mask": return ClipMaskDemo;
    case "grid": return GridDemo;
    case "positioning": return PositionDemo;
    case "sizing": return SizeDemo;
    case "typography": return TypographyDemo;
    case "line-spacing": return LineSpacingDemo;
    case "columns": return ColumnsDemo;
    case "box-display": return DisplayDemo;
    case "tables": return TableDemo;
    case "writing-mode": return WritingDemo;
    case "shapes": return ShapeDemo;
    case "effects": return EffectsDemo;
    case "breaks": return BreakDemo;
    case "offset": return OffsetDemo;
    case "anchor": return AnchorDemo;
    case "containment": return ContainDemo;
    case "misc": return MiscDemo;
    default: return null;
  }
}

Object.assign(window, { BorderDemo, TableBorderDemo, BoxModelDemo, TextDemo, SvgDemo, ListDemo, ObjectImageDemo, BgDemo, ClipMaskDemo, GridDemo, PositionDemo, SizeDemo, TypographyDemo, LineSpacingDemo, ColumnsDemo, DisplayDemo, TableDemo, WritingDemo, FlexFixDemo, ShapeDemo, EffectsDemo, TransformFixDemo, BreakDemo, PagedDemo, OffsetDemo, AnchorDemo, ContainDemo, ColorDemo, MiscDemo, cssToObj, contextDemoFor, applyCss });
