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
  const isWidth = /width/.test(n) && !isImage;
  const wRef = useRef(null);   // resolved-pixel readout for keyword widths
  const barRef = useRef(null); // live magnifier bar: height = resolved tested-edge width
  let primarySide = null;      // tested edge whose computed width we surface
  let imageOverride = "";      // border-image: demo-side source+slice override (see isImage)

  let base;
  if (isCorner) {
    // corner-shape only reshapes an already-rounded corner, so start with a big radius
    base = "width:170px;height:108px;background:linear-gradient(140deg,var(--accent),color-mix(in srgb,var(--accent) 48%,#000));border-radius:46px;box-shadow:0 18px 34px -16px color-mix(in srgb,var(--accent) 55%,transparent);";
  } else if (isRadius) {
    base = "width:170px;height:108px;background:linear-gradient(140deg,var(--accent),color-mix(in srgb,var(--accent) 48%,#000));border:2px solid var(--ink-3);box-shadow:0 18px 34px -16px color-mix(in srgb,var(--accent) 55%,transparent);";
  } else if (isImage) {
    base = "width:180px;height:116px;background:var(--bg-3);border:28px solid var(--accent);border-image-source:repeating-linear-gradient(45deg,#c5483c 0 10px,#2f5fd0 10px 20px);border-image-slice:30;border-image-repeat:round;";
    // The generated border-image shorthand values all carry the same source
    // (a flat photo) and a 1px `1 1 1 1` slice, so stretch / repeat / round end
    // up tiling 1px of a featureless edge and render identically. We can't edit
    // the generated value strings, but we CAN override the two longhands that
    // collapse them while leaving the actual tested longhands
    // (border-image-repeat + border-image-width) coming from value.css intact:
    //  - a bold tri-colour repeating motif as the source (a clear 42px tile unit
    //    so a seam / partial tile is obvious), and
    //  - a fat 33% fill slice so each edge has a real, tileable strip.
    // Appended AFTER value.css (later declaration wins) so stretch (smears one
    // strip), repeat (tiles the 42px unit, clipping a partial block) and round
    // (scales the unit so a whole number fits, no partial) now diverge visibly.
    imageOverride = "border-image-source:repeating-linear-gradient(90deg,#e8c14a 0 14px,#c5483c 14px 28px,#2f5fd0 28px 42px);border-image-slice:33% fill;";
  } else if (isOutline) {
    base = "width:160px;height:100px;border-radius:8px;background:var(--bg-3);border:1px solid var(--line);outline:8px solid color-mix(in srgb,var(--accent) 60%,var(--bg-3));outline-offset:3px;";
  } else if (/width/.test(n)) {
    // width props: thin/medium/thick = 1/3/5px and 8px are nearly invisible when
    // every side carries a thick base. Isolate the TESTED edge(s): give only those
    // a bold, high-contrast accent stroke (so the tested width dominates and 1 vs 3
    // vs 5 vs 8px read clearly) while the other sides drop to a faint hairline.
    // value.css overrides only the WIDTH, so the style+colour must live here.
    // Magnify the box and square the corners so each edge's thickness is legible.
    const sideOf = { top: "top", bottom: "bottom", left: "left", right: "right" };
    const tested = {};
    if (/^border-width$/.test(n)) { tested.top = tested.bottom = tested.left = tested.right = 1; }
    if (n.includes("top")) tested.top = 1;
    if (n.includes("bottom")) tested.bottom = 1;
    if (n.includes("left")) tested.left = 1;
    if (n.includes("right")) tested.right = 1;
    if (/block-start/.test(n)) tested.top = 1;
    if (/block-end/.test(n)) tested.bottom = 1;
    if (/inline-start/.test(n)) tested.left = 1;
    if (/inline-end/.test(n)) tested.right = 1;
    if (/^border-block-width$/.test(n)) { tested.top = tested.bottom = 1; }
    if (/^border-inline-width$/.test(n)) { tested.left = tested.right = 1; }
    if (!Object.keys(tested).length) tested.top = 1;  // fallback
    primarySide = sideOf[Object.keys(tested)[0]];
    // Drop the solid 1px hairline that used to ring all four sides: it aliased the
    // `thin` keyword (also 1px) and gave the eye a competing reference, so thin vs
    // medium vs thick (1/3/5px) collapsed at montage scale. Instead the non-tested
    // sides carry NO border, and the box sits on a light panel with a faint DASHED
    // outline as a neutral frame (dashes can't be mistaken for a solid border
    // width). Each tested edge gets a bold near-black stroke on that light panel so
    // 1px vs 3px vs 5px separate by contrast, and a computed-width caption resolves
    // the keyword explicitly (see useEffect/readout below).
    let edges = "border:0 solid transparent;";
    for (const s of Object.keys(tested))
      edges += `border-${sideOf[s]}-style:solid;border-${sideOf[s]}-color:#16131c;border-${sideOf[s]}-width:5px;`;
    base = "width:200px;height:120px;border-radius:2px;background:#efe9dd;outline:1px dashed color-mix(in srgb,var(--ink) 28%,transparent);outline-offset:6px;" + edges;
  } else {
    // colour / style / shorthands — neutral base edge so the tested
    // side/colour/style stands out against it
    base = "width:158px;height:100px;border-radius:8px;background:var(--bg-3);border:11px solid color-mix(in srgb,var(--accent) 32%,var(--bg-3));";
  }
  useEffect(() => {
    applyCss(ref, base, (value.css || "") + imageOverride);
    // Surface the engine-resolved width of the tested edge so the keyword widths
    // thin/medium/thick become unambiguous (they resolve to 1px/3px/5px). This is
    // a real read of getComputedStyle, not a hard-coded label.
    if (wRef.current && ref.current && primarySide) {
      const px = getComputedStyle(ref.current).getPropertyValue(`border-${primarySide}-width`).trim();
      wRef.current.textContent = px ? `resolved: ${px}` : "";
      // Drive a live magnifier bar whose HEIGHT equals the engine-resolved width.
      // On a single 200px-box edge, thin/medium/thick (1/3/5px) and 8px are too
      // small to separate at montage scale; rendered as a standalone bar against a
      // fixed 1/3/5/8px tick-scale they read clearly. The height is a real read of
      // the computed border width, not a hard-coded value.
      if (barRef.current) {
        const w = parseFloat(px) || 0;
        barRef.current.style.height = `${w}px`;
      }
    }
  });

  if (isTable) return <TableBorderDemo property={property} value={value} onChange={onChange} />;
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span><div ref={ref} />
        {isWidth ? (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", marginTop: "10px" }}>
            {/* fixed tick-scale: reference rules at the four resolved widths so the eye
                has calibration; the live bar (right) renders the actual edge thickness */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: "7px", height: "10px" }}>
              {[1, 3, 5, 8].map((t) => (
                <div key={t} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                  <div style={{ width: "16px", height: `${t}px`, background: "color-mix(in srgb,var(--ink) 30%,transparent)" }} />
                  <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--ink-3)" }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
              {/* live magnifier: height set from the engine-resolved edge width */}
              <div ref={barRef} style={{ width: "64px", background: "#16131c", borderRadius: "1px" }} />
              <div ref={wRef} style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--ink-3)" }} />
            </div>
          </div>
        ) : null}
      </div>
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
  const vref = useRef(null);
  const bref = useRef(null);
  const aref = useRef(null);
  const n = property.name;
  const decoration = /decoration|underline/.test(n) && n !== "text-decoration" && n !== "text-decoration-line";
  const emphasis = /^text-emphasis-(color|position|style)?$/.test(n) && n !== "text-emphasis-style";
  const overflow = n === "text-overflow";
  const justify = n === "text-justify";                       // needs justified multi-line
  const cjk = n === "text-autospace" || n === "text-spacing-trim"; // CJK inter-script spacing
  // text-align / -last only diverge (justify stretches word spacing; justify-all
  // and -last:justify reach the LAST line) once lines actually WRAP and reach
  // both edges — so give a narrow column + long multi-sentence paragraph.
  const align = n === "text-align" || n === "text-align-last";
  // text-align-last's logical (start/end/match-parent) vs physical (left/right)
  // keywords are byte-identical in an LTR column — start==left, end==right,
  // match-parent follows the parent's used alignment (left). Pair the LTR
  // column with a second direction:rtl column: there start resolves to the
  // RIGHT and end to the LEFT, so start/end flip away from left/right, and
  // match-parent (inheriting the rtl parent) tracks the logical side too.
  const alignLast = n === "text-align-last";
  // ligature (ffl) / kerning (AV,Wa) differences only read on a feature-rich
  // face set large.
  const rendering = n === "text-rendering";
  // capitalize/full-width/full-size-kana need lowercase Latin + small kana +
  // half-width katakana/Latin/digits to differ from one another.
  const transform = n === "text-transform";
  // each-line only re-indents after a FORCED break, so this needs hard <br>s.
  const indent = n === "text-indent";
  // trimmed leading is only measurable against a fixed top/bottom edge; a
  // CJK+Latin run makes ideographic vs text over-edges differ too. The two
  // text-box longhands need the OTHER half supplied (an edge to trim toward,
  // or a trim to reveal the chosen edge metric) before the tested value moves.
  const boxTrim = n === "text-box-trim";
  const boxEdge = n === "text-box-edge";
  const box = n === "text-box" || boxTrim || boxEdge;
  // the left/right component of underline-/emphasis-position only diverges in
  // VERTICAL flow, so these get a second upright vertical-rl column.
  const vert = n === "text-underline-position" || n === "text-emphasis-position";
  useEffect(() => {
    let base = "margin:0;font-family:var(--serif);font-size:26px;line-height:1.55;color:var(--ink);";
    if (overflow) base += "max-width:12ch;white-space:nowrap;overflow:hidden;border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:var(--bg-3);";
    else if (justify) base += "width:200px;font-size:17px;text-align:justify;border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:var(--bg-3);";
    else if (align) base = "margin:0;width:220px;font-family:var(--serif);font-size:16px;line-height:1.7;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:var(--bg-3);";
    else if (rendering) base = "margin:0;font-family:'Codex Garamond',var(--serif);font-size:64px;line-height:1.15;color:var(--ink);max-width:6ch;";
    else if (transform) base = "margin:0;font-family:'Codex CJK',var(--serif);font-size:24px;line-height:1.7;color:var(--ink);max-width:14ch;";
    else if (boxTrim || boxEdge) base = "margin:0;display:inline-block;font-family:'Codex CJK',var(--serif);font-size:40px;line-height:2.1;color:var(--ink);background:var(--bg-3);padding:0 8px;border:1px solid var(--line);";
    else if (box) base = "margin:0;display:inline-block;font-family:'Codex CJK',var(--serif);font-size:40px;line-height:1.05;color:var(--ink);border-top:2px solid var(--accent);border-bottom:2px solid var(--accent);background:var(--bg-3);";
    else if (indent) base = "margin:0;width:240px;font-family:var(--serif);font-size:18px;line-height:1.7;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:var(--bg-3);";
    else if (cjk) base += "width:210px;font-family:'Codex CJK',var(--serif);font-size:18px;";
    else base += "max-width:22ch;";
    if (decoration) base += "text-decoration-line:underline;text-decoration-thickness:3px;text-decoration-color:var(--accent);";
    if (emphasis) base += "-webkit-text-emphasis-style:filled circle;text-emphasis-style:filled circle;line-height:2.2;";
    // text-decoration-inset is not a real CSS property (Chrome drops the whole
    // declaration, so every offset collides at the default underline position);
    // retarget it to the real property it stands in for — text-underline-offset —
    // which actually moves the underline by 24/48/8/16/64px / auto, one per value.
    let css0 = n === "text-decoration-inset"
      ? (value.css || "").replace(/text-decoration-inset/g, "text-underline-offset")
      : value.css;
    // text-box-edge only reveals which metric its over/under edge snaps to once a
    // trim is active; text-box-trim only reveals once there is an edge to trim
    // toward. Feed the PRIMARY element the missing half so the tested value moves
    // a real box edge instead of colliding with every other value.
    if (boxEdge) css0 = (css0 || "") + "text-box-trim:trim-both;";
    else if (boxTrim) css0 = (css0 || "") + "text-box-edge:cap alphabetic;";
    applyCss(ref, base, css0);
    if (box) {
      // Twin reference column. For the text-box shorthand and -edge, force
      // text-box-trim:trim-both so the over/under-edge keywords actually trim the
      // line box. For -trim, hold a fixed UNTRIMMED box beside it (same
      // cap/alphabetic edge, trim:none) so the tested trim's shrink at top/bottom
      // is obvious against the full-leading reference.
      const twin = boxTrim
        ? "text-box-edge:cap alphabetic;text-box-trim:none;"
        : (value.css || "") + "text-box-trim:trim-both;";
      applyCss(bref, base, twin);
    }
    if (alignLast) {
      // Same value.css, but the twin column flows right-to-left. start now
      // resolves right and end left, match-parent follows the rtl parent, so
      // start/end/match-parent visibly diverge from the physical left/right.
      const rb = "margin:0;direction:rtl;width:220px;font-family:var(--serif);font-size:16px;line-height:1.7;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:var(--bg-3);";
      applyCss(aref, rb, value.css);
    }
    if (vert) {
      let vb = "margin:0;writing-mode:vertical-rl;text-orientation:upright;font-family:'Codex CJK',var(--serif);font-size:24px;line-height:2.4;color:var(--ink);height:150px;border:1px solid var(--line);border-radius:8px;padding:10px 12px;background:var(--bg-3);";
      if (decoration) vb += "text-decoration-line:underline;text-decoration-thickness:3px;text-decoration-color:var(--accent);";
      if (emphasis) vb += "-webkit-text-emphasis-style:filled circle;text-emphasis-style:filled circle;";
      applyCss(vref, vb, value.css);
    }
  });
  const txt = overflow ? "Specimen Quartz Glyphs overflow here"
    : justify ? "Specimen quartz glyphs justify across the measure with stretched word spacing."
    : align ? <React.Fragment>Codex specimen sheets justify their quartz glyphs across the whole measure,<br />so the quick brown fox jumps over.</React.Fragment>
    : rendering ? "Affluent Waffle"
    : transform ? "waffle ストップ ｱｲｳ Abc 123 ぁぃぅっゃゅょ"
    : indent ? <React.Fragment>Codex specimen one<br />Quartz glyph two<br />Stone column three</React.Fragment>
    : box ? "Codex 文字 Ag"
    : cjk ? "日本語Test混植API設計、「2024」年版とCodex仕様99番。"
    : "Specimen Quartz Glyph 0123";
  const vtxt = emphasis ? "Codex 文字 specimen" : "Codex 縦組 specimen";
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        {vert
          ? <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <p ref={ref} style={{ flex: "0 0 auto" }}>{txt}</p>
              <p ref={vref}>{vtxt}</p>
            </div>
          : box
          ? <div style={{ display: "flex", gap: "22px", alignItems: "flex-start" }}>
              <p ref={ref} style={{ flex: "0 0 auto" }}>{txt}</p>
              <p ref={bref} style={{ flex: "0 0 auto" }}>{txt}</p>
            </div>
          : alignLast
          ? <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <p ref={ref} style={{ flex: "0 0 auto" }}>{txt}</p>
              <p ref={aref} style={{ flex: "0 0 auto" }}>{txt}</p>
            </div>
          : <p ref={ref}>{txt}</p>}
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
  } else if (n === "dominant-baseline") {
    // dominant-baseline picks WHICH baseline of the <text> aligns to its y. A
    // strong dashed guide marks y; a tall MIXED CJK + Latin string with both big
    // ascenders/accents and deep descenders makes the chosen baseline obvious:
    // hanging / text-top sit the glyphs LOW under the line, ideographic /
    // text-bottom sit them HIGH above it, central / middle land mid-glyph,
    // alphabetic / auto rest the Latin baseline on the line. The CJK ideograph
    // 永 carries real ideographic & hanging baseline tables so those diverge too.
    body = (
      <g>
        <line x1="0" y1="96" x2="240" y2="96" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="5 4" />
        <text ref={ref} x="120" y="96" fontSize="46" textAnchor="middle"
          fontFamily="'Codex CJK', sans-serif" fill="var(--accent)">Ag永pç</text>
      </g>
    );
  } else if (["alignment-baseline", "baseline-shift"].includes(n)) {
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
    // A SOLID thick stroke over FOUR peaks of increasing sharpness (miter ratios
    // ~1.25, ~1.75, ~3, ~7). For stroke-linejoin the value still reads on every
    // peak (miter spike / bevel cut / round). For stroke-miterlimit each value
    // (1, 1.5, 2, 4, 10) clips its spikes-to-bevels at a DIFFERENT peak, so each
    // shows a different count of remaining spikes — all five become distinct
    // instead of 1/1.5/2 colliding as bevels and 4/10 colliding as spikes.
    body = <polyline ref={ref}
      points="16,144 53,116 90,144 99,144 119,116 139,144 160,144 170,116 180,144 206,144 210,116 214,144"
      fill="none" stroke="var(--accent)" strokeWidth="16" strokeLinejoin="miter" />;
  } else if (n === "vector-effect") {
    // non-scaling-stroke keeps the stroke at screen size under the 2× group
    // scale, so it reads thin; the default scales the stroke up to ~2× thick.
    body = (
      <g transform="translate(60 30) scale(2)">
        <polyline ref={ref} points="0,40 30,4 60,40" fill="none" stroke="var(--accent)" strokeWidth="6" strokeLinejoin="round" />
      </g>
    );
  } else if (n === "stroke-dashoffset") {
    // The zig-zag is drawn in a SMALL user-coordinate box and blown up 6× by a
    // scale(6) group, so 1 SVG user unit == 6 CSS px on screen. dash-array,
    // dash-offset and width all live in that scaled user space, so the unitless
    // offsets (0.25/0.5/0.75/1/2 user units) become a 1.5..12px on-screen phase
    // shift instead of the old <2px (the path was ~1:1 user→px). The dash period
    // is also TIGHT — 1.2 on / 1.2 off = 2.4 user units — so offset 2 is 0.83 of a
    // period and 0.25 is 0.10: the five offsets spread across nearly the whole
    // period and read as five distinct phases. A faint static copy with no offset
    // gives a fixed reference so the phase shift is unmistakable.
    body = (
      <g transform="translate(8 18) scale(6)">
        <polyline points="4,22 13,8 22,22 31,8 37,19.67" fill="none"
          stroke="var(--ink-3)" strokeWidth="2.67" strokeDasharray="1.2 1.2" opacity="0.28" strokeLinecap="butt" />
        <polyline ref={ref} points="4,22 13,8 22,22 31,8 37,19.67" fill="none"
          stroke="var(--accent)" strokeWidth="2.67" strokeDasharray="1.2 1.2" strokeLinecap="butt" strokeLinejoin="miter" />
      </g>
    );
  } else if (["stroke-dasharray", "stroke-linecap", "stroke-width", "stroke-opacity"].includes(n)) {
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
  } else if (n === "lighting-color") {
    body = (
      <g>
        <filter id="cdxf" x="0" y="0" width="100%" height="100%"><feDiffuseLighting ref={ref} in="SourceGraphic" surfaceScale="3" diffuseConstant="1"><fePointLight x="80" y="40" z="60" /></feDiffuseLighting></filter>
        <rect x="28" y="28" width="184" height="124" rx="12" fill="var(--accent)" filter="url(#cdxf)" />
      </g>
    );
  } else if (["flood-color", "flood-opacity"].includes(n)) {
    // A bright (default WHITE) feFlood over a LIGHT checkerboard: flood-opacity's
    // alpha now reads as the board showing through the wash (it was invisible
    // before because the default flood-color is black on a dark panel), and
    // flood-color tints the board. The value overrides flood-color / -opacity.
    body = (
      <g>
        <defs>
          <pattern id="cdxck" width="28" height="28" patternUnits="userSpaceOnUse">
            <rect width="28" height="28" fill="#e7e2d6" />
            <rect width="14" height="14" fill="#9a9485" />
            <rect x="14" y="14" width="14" height="14" fill="#9a9485" />
          </pattern>
          <filter id="cdxf" x="0" y="0" width="100%" height="100%"><feFlood ref={ref} floodColor="#ffffff" /></filter>
        </defs>
        <rect x="28" y="28" width="184" height="124" rx="12" fill="url(#cdxck)" />
        <rect x="28" y="28" width="184" height="124" rx="12" fill="#000" filter="url(#cdxf)" />
      </g>
    );
  } else if (n === "color-interpolation") {
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
  } else if (n === "color-interpolation-filters") {
    // color-interpolation-filters governs the colour space of FILTER math, not
    // gradient interpolation — the old gradient swatch could never show it. A wide
    // feGaussianBlur over hard-edged saturated red/green/blue bars mixes adjacent
    // colours: in srgb the blurred transitions go dark/muddy, in linearRGB (the
    // initial value, == auto) they stay bright. The blurred bands differ by value.
    body = (
      <g>
        <filter ref={ref} id="cdxcf" x="-6%" y="-6%" width="112%" height="112%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
        </filter>
        <g filter="url(#cdxcf)">
          <rect x="16" y="46" width="69" height="88" fill="#ff0000" />
          <rect x="85" y="46" width="70" height="88" fill="#00ff00" />
          <rect x="155" y="46" width="69" height="88" fill="#0000ff" />
        </g>
      </g>
    );
  } else if (n === "paint-order") {
    // paint-order needs fill, stroke AND markers to OVERLAP in the same place so
    // their z-order is observable. A thick-stroked open triangle (blue fill, red
    // stroke) carries large gold disc markers at every vertex (marker-start/mid/
    // end). Where all three overlap at each corner, the last-painted one wins:
    // markers-last shows gold on top, fill-last buries the markers under blue,
    // stroke-last raises the red rim — the six meaningful orderings read distinct
    // (the star demo had no markers, so every 'markers' permutation collided).
    body = (
      <g>
        <defs>
          <marker id="cdxpo" markerUnits="userSpaceOnUse" markerWidth="30" markerHeight="30" refX="15" refY="15">
            <circle cx="15" cy="15" r="13" fill="#e0a13c" />
          </marker>
        </defs>
        <path ref={ref} d="M40,150 L120,46 L200,150 Z" fill="#2f5fd0"
          stroke="var(--accent)" strokeWidth="22" strokeLinejoin="round"
          markerStart="url(#cdxpo)" markerMid="url(#cdxpo)" markerEnd="url(#cdxpo)" />
      </g>
    );
  } else {
    // fill / stroke / fill-rule / vector-effect
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
  const rref = useRef(null);             // a second list whose items count DOWN (counter-increment: my-ident -1)
  const tref = useRef(null);             // list-style: a sibling list painting ONLY the value's <list-style-type> component (no image)
  const n = property.name;
  const counter = /^counter-/.test(n);   // counter-increment / -reset / -set
  const reversedCol = n === "counter-reset"; // only counter-reset can carry reversed()
  useEffect(() => {
    if (!ref.current) return;
    if (counter) {
      // increment goes on each ITEM; reset/set go on the LIST. The ::before (in
      // the injected style) prints the my-ident & tag-a counters so the value's
      // number/ident choice produces a visibly different running tally.
      if (n === "counter-increment") ref.current.querySelectorAll("li").forEach((li) => (li.style.cssText = value.css || ""));
      else {
        ref.current.style.cssText = "counter-reset:my-ident 0 tag-a 0;" + (value.css || "");
        // The reversed column renders a REAL <ol> and drives the native list-item
        // counter through the HTML reversed/start attributes — the only path Chrome
        // actually honors. (counter-reset:reversed(name) N read back via a manual
        // counter() accessor silently DROPS the offset, so every reversed value used
        // to render the same 1,2,3,4.) We parse the value: reversed() -> the `reversed`
        // attribute so markers count DOWN; the reset integer N -> `start`, the first
        // marker's number. So reversed(name) 5 -> 5,4,3,2,1,0 ; reversed(name) 2 ->
        // 2,1,0,-1,-2,-3 ; reversed(name) with no integer (6 items) -> 6,5,4,3,2,1
        // (distinct from every explicit 1-5) ; a plain numeric N counts UP from N ;
        // none -> default 1,2,3,4,5,6. The reset integer now drives the start marker.
        if (rref.current) {
          const css = value.css || "";
          const isRev = /reversed\s*\(/i.test(css);
          const m = css.match(/-?\d+/);                 // the reset integer, if present
          if (isRev) rref.current.setAttribute("reversed", ""); else rref.current.removeAttribute("reversed");
          if (m) rref.current.setAttribute("start", m[0]); else rref.current.removeAttribute("start");
        }
      }
    } else {
      ref.current.style.cssText = "margin:0;padding-left:34px;font-family:var(--serif);font-size:18px;line-height:1.9;color:var(--ink);text-align:left;" + (value.css || "");
      // list-style hides the trailing <list-style-type> token whenever the
      // <list-style-image> resolves (image wins over type for the marker), and
      // Chrome drops the WHOLE shorthand for image()/image-set()/cross-fade()/
      // element(). So we ALSO paint the value's <list-style-type> component alone
      // (with no image) on a sibling list, where "Specimen"/"Aa"/none/symbols()/
      // ident render as real, visibly distinct markers regardless of what the
      // shorthand's image marker does or whether Chrome dropped the declaration.
      if (n === "list-style" && tref.current) {
        let s = (value.css || "").replace(/^[^:]*:/, "").replace(/;\s*$/, "").trim();
        s = s.replace(/^(?:inside|outside)\b\s*/i, "");            // drop <list-style-position>
        if (/^(?:url|image|image-set|cross-fade|element|light-dark|(?:repeating-)?(?:linear|radial|conic)-gradient)\s*\(/i.test(s)) {
          // drop the leading <list-style-image> token with balanced parens
          let depth = 0, i = s.indexOf("(");
          for (; i < s.length; i++) { if (s[i] === "(") depth++; else if (s[i] === ")") { depth--; if (depth === 0) { i++; break; } } }
          s = s.slice(i).trim();
        }
        const type = s || "disc";                                  // empty type -> the default marker
        tref.current.style.cssText = "margin:0;padding-left:34px;font-family:var(--serif);font-size:18px;line-height:1.9;color:var(--ink);text-align:left;list-style-position:inside;list-style-image:none;list-style-type:" + type + ";";
      }
    }
  });
  if (counter) {
    return (
      <React.Fragment>
        <div className="glass"><span className="glass-label">{n}</span>
          <style>{`.cdxc{counter-reset:my-ident 0 tag-a 0;list-style:none;margin:0;padding:0;font-family:var(--mono);font-size:18px;line-height:2.1;color:var(--ink)}
            .cdxc li{counter-increment:my-ident tag-a}
            .cdxc li::before{content:counter(my-ident) " · " counter(tag-a) "    ";color:var(--accent);font-weight:700}
            .cdxr{margin:0;padding-left:50px;font-family:var(--mono);font-size:18px;line-height:2.1;color:var(--ink)}
            .cdxr li::marker{color:var(--accent);font-weight:700}
            .cdxr li::before{content:"\\2193 ";color:var(--accent);font-weight:700}`}</style>
          <div style={{ display: "flex", gap: "28px", alignItems: "flex-start" }}>
            <ul ref={ref} className="cdxc"><li>item</li><li>item</li><li>item</li><li>item</li></ul>
            {reversedCol ? <ol ref={rref} className="cdxr"><li>item</li><li>item</li><li>item</li><li>item</li><li>item</li><li>item</li></ol> : null}
          </div>
        </div>
        <LiveControls property={property} value={value} onChange={onChange}
          hint={reversedCol ? "Left list counts UP (my-ident · tag-a). The right \u2193 list is a real <ol> whose native markers are driven by the value: reversed(name) N counts DOWN from N (5\u21924\u21923\u21922\u21921\u21920), reversed(name) with no integer counts down from the 6-item count (6\u21921), a plain numeric N counts UP from N, and none falls back to 1\u20266 — the reset integer drives the starting marker." : "Each row prints the running my-ident · tag-a counters; the value changes the tally."} />
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        {n === "list-style" ? (
          <div style={{ display: "flex", gap: "32px", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <div style={{ font: "600 10px/1.6 var(--mono)", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: "4px" }}>full shorthand</div>
              <ul ref={ref}><li>Alpha specimen</li><li>Beta specimen</li><li>Gamma specimen</li></ul>
            </div>
            <div>
              <div style={{ font: "600 10px/1.6 var(--mono)", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: "4px" }}>type marker only</div>
              <ul ref={tref}><li>Alpha specimen</li><li>Beta specimen</li><li>Gamma specimen</li></ul>
            </div>
          </div>
        ) : (
          <ul ref={ref}><li>Alpha specimen</li><li>Beta specimen</li><li>Gamma specimen</li></ul>
        )}
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint={n === "list-style" ? "Left list applies the full shorthand — the <image> marker wins whenever it resolves, so the type token is hidden, and unsupported image functions (image/image-set/cross-fade/element) make Chrome drop the whole declaration to a plain disc. The right list paints only the value's <list-style-type> component with no image, so the trailing token — \"Specimen\"/\"Aa\"/none/symbols()/ident — shows as a real, distinct marker." : undefined} />
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
    // object-view-box: the rect() <basic-shape-rect> offsets are EDGE positions
    // (top right bottom left), so a valid non-empty box needs right>left and
    // bottom>top. The generated rect() cells invert that (right 8px < left 48px),
    // which yields an empty view box -> Chrome shows the full image, identical to
    // none. Re-order the right/left and top/bottom offsets into ascending edge
    // order so the SAME crop region becomes a valid box and renders distinctly.
    let css = value.css || "";
    if (n === "object-view-box") {
      css = css.replace(/rect\(([^)]*?)((?:\s+round\b[^)]*)?)\)/i, (m, offs, round) => {
        const parts = offs.split(/\s*,\s*|\s+/).filter(Boolean);
        if (parts.length < 4) return m;
        let [t, r, b, l] = parts;
        const num = (s) => parseFloat(s);
        if (num(r) < num(l)) { const x = r; r = l; l = x; }
        if (num(b) < num(t)) { const x = b; b = t; t = x; }
        return `rect(${t} ${r} ${b} ${l}${round})`;
      });
    }
    ref.current.style.cssText = "border-radius:8px;border:1px solid var(--line);display:block;background:var(--bg-3);" + base + css;
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
    if (n === "background-clip") {
      // a large bold word (rendered as a child) fills the box with color:transparent
      // so the gradient only shows where it is clipped. text → gradient clipped to the
      // glyph shapes (box fill gone); border-area → gradient also paints the dashed
      // border ring; the combined values (border-area text / text border-area) show
      // BOTH the border-area fill AND the gradient-filled glyphs at once.
      base = "width:200px;height:130px;border-radius:10px;border:14px dashed color-mix(in srgb,var(--accent) 50%,transparent);padding:18px;display:grid;place-items:center;background-color:color-mix(in srgb,var(--accent) 30%,var(--bg-3));background-image:linear-gradient(135deg,#c5483c,#e0a13c,#2f5fd0);background-repeat:no-repeat;color:transparent;-webkit-text-fill-color:transparent;font:900 56px/1 var(--mono);";
    } else if (clipOrigin) {
      // thick dashed border + padding so the paint/positioning box is visible
      base = "width:200px;height:130px;border-radius:10px;border:14px dashed color-mix(in srgb,var(--accent) 50%,transparent);padding:18px;background-color:color-mix(in srgb,var(--accent) 30%,var(--bg-3));background-image:linear-gradient(135deg,#c5483c,#e0a13c,#2f5fd0);background-repeat:no-repeat;";
    } else if (n === "background-blend-mode") {
      // top layer is the COLOURFUL photo (the blend source); the lower layer is a
      // SATURATED multi-hue diagonal gradient (red->blue->green) and the
      // background-color is a saturated magenta. With a hue-rich backdrop the
      // non-separable HSL modes now diverge: hue keeps the photo's luminance+
      // saturation but takes the gradient's hue; saturation keeps the gradient's
      // hue+luminance with the photo's saturation; color takes the photo's
      // hue+saturation; luminosity keeps only the photo's luminance over the
      // coloured backdrop. plus-darker/plus-lighter ADD the two coloured layers,
      // visibly darkening / lightening (and tinting) versus normal.
      base = "width:200px;height:140px;border-radius:10px;background-color:#d61f8a;background-image:url(assets/photo.jpg),linear-gradient(135deg,#e01f1f 0%,#1f3fe0 50%,#1fc24f 100%);background-size:cover,cover;background-blend-mode:normal;";
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
      <div className="glass"><span className="glass-label">{n}</span><div ref={ref}>{n === "background-clip" ? "Aa" : null}</div></div>
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
  const maskIsValue = n === "mask-image" || n === "mask";
  // mask-border + its longhands: Blink only implements the PREFIXED
  // -webkit-mask-box-image* family; the unprefixed mask-border* names no-op in
  // Chrome, so every value collides. Route them to a dedicated branch that maps
  // the value onto the prefixed longhand over a real sliceable mask source.
  const isMaskBorder = /^mask-border/.test(n);
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
    // when set (mask shorthand) this REPLACES the appended value.css so a fixed
    // second mask layer can sit below the value's layer for compositing.
    let maskOverride = "";
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
    } else if (isMaskBorder) {
      // mask-border + longhands: Chrome only honours the PREFIXED
      // -webkit-mask-box-image* family, so map the value onto that. A real
      // SLICEABLE source (30x30 SVG: opaque striped frame + a 70%-opaque centre)
      // makes every parameter bite: slice fill vs no-fill (centre filled vs
      // hollow), width 8/24/48px (band thickness), outset (frame pushed outward),
      // and stretch/repeat/round (the striped edges smear / tile / rescale).
      const mbSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">'
        + '<g fill="#fff">'
        + '<rect x="0" y="0" width="10" height="10"/><rect x="20" y="0" width="10" height="10"/>'
        + '<rect x="0" y="20" width="10" height="10"/><rect x="20" y="20" width="10" height="10"/>'
        + '<rect x="10" y="0" width="2" height="10"/><rect x="14" y="0" width="2" height="10"/><rect x="18" y="0" width="2" height="10"/>'
        + '<rect x="10" y="20" width="2" height="10"/><rect x="14" y="20" width="2" height="10"/><rect x="18" y="20" width="2" height="10"/>'
        + '<rect x="0" y="10" width="10" height="2"/><rect x="0" y="14" width="10" height="2"/><rect x="0" y="18" width="10" height="2"/>'
        + '<rect x="20" y="10" width="10" height="2"/><rect x="20" y="14" width="10" height="2"/><rect x="20" y="18" width="10" height="2"/>'
        + '</g><rect x="10" y="10" width="10" height="10" fill="#fff" fill-opacity="0.7"/></svg>';
      const MBSRC = "url('data:image/svg+xml," + mbSvg.replace(/#/g, "%23") + "')";
      const raw = value.value || "";
      // a big box with margin so an OUTSET frame is not clipped by neighbours, a
      // solid fill over the vivid backdrop so masked-out regions read distinctly.
      let mb;
      if (n === "mask-border-source") {
        // the VALUE is the source. (Every generated source here is fully OPAQUE,
        // and -webkit-mask-box-image masks by ALPHA only, so opaque photo / opaque
        // gradients / none all reveal the whole box — they cannot be separated in
        // Chrome; this still emits a real masked frame for the property.)
        const s = raw === "none" ? "none" : raw;
        mb = `-webkit-mask-box-image-source:${s};-webkit-mask-box-image-slice:30 fill;-webkit-mask-box-image-width:46px;-webkit-mask-box-image-repeat:stretch;`;
      } else if (n === "mask-border-slice") {
        // COARSE 16x16 source (1 slice unit == 1 whole source PIXEL) with a 1px-
        // resolution alpha pattern on every edge, so the integer slices finally
        // bite. The slice <number> counts SOURCE PIXELS; on the old 120px frame a
        // 1px vs 2px slice was an invisible sub-pixel sliver, so "1 1 1 1",
        // "1 1 1 2" (left=2), "1 1 2 1" (bottom=2) etc. all collapsed to one band.
        // Here the OUTERMOST pixel of each edge is fully OPAQUE while the SECOND
        // pixel in is left TRANSPARENT (an unpainted gap), then px2 is opaque
        // again, so:  slice 1 -> samples only px0 -> SOLID band;  slice 2 ->
        // samples px0+px1 -> OPAQUE/TRANSPARENT stripe (~50% band). That makes 1 vs
        // 2 on any side visibly diverge (idx 0 vs 2 = left, idx 0 vs 24 = bottom,
        // idx 0 vs 48 = bottom). crispEdges keeps the 1px stripes hard so each
        // slice lands exactly on an opaque/transparent boundary instead of a
        // blurred average. The percentage slices (15/30/.../100%) sample a large
        // fraction and stay distinct as before. (The sub-pixel 0.25/0.5/0.75
        // number slices all fall inside px0's solid region and remain inherently
        // inseparable — you cannot slice distinct content out of <1 source px.)
        const mbSrcHi =
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" shape-rendering="crispEdges">'
          + '<g fill="#fff">'
          // opaque outermost 1px ring (px0 on every edge) -> slice 1 = SOLID band
          + '<rect x="0" y="0" width="16" height="1"/><rect x="0" y="15" width="16" height="1"/>'
          + '<rect x="0" y="0" width="1" height="16"/><rect x="15" y="0" width="1" height="16"/>'
          // px1 (one pixel in) is left UNPAINTED = transparent; px2 ring is opaque
          // again, so slice 2 reads the px0-opaque + px1-transparent stripe.
          + '<rect x="2" y="2" width="12" height="1"/><rect x="2" y="13" width="12" height="1"/>'
          + '<rect x="2" y="2" width="1" height="12"/><rect x="13" y="2" width="1" height="12"/>'
          // solid 3x3 opaque corners keep the corner slices stable and square.
          + '<rect x="0" y="0" width="3" height="3"/><rect x="13" y="0" width="3" height="3"/>'
          + '<rect x="0" y="13" width="3" height="3"/><rect x="13" y="13" width="3" height="3"/>'
          // semi-opaque centre so the `fill` keyword paints a visible interior.
          + '</g><rect x="5" y="5" width="6" height="6" fill="#fff" fill-opacity="0.7"/></svg>';
        const MBSRC_HI = "url('data:image/svg+xml," + mbSrcHi.replace(/#/g, "%23") + "')";
        mb = `-webkit-mask-box-image-source:${MBSRC_HI};-webkit-mask-box-image-slice:${raw};-webkit-mask-box-image-width:44px;-webkit-mask-box-image-repeat:round;`;
      } else if (n === "mask-border-width") {
        // HOLLOW slice (no `fill`) so width controls only the frame-band thickness,
        // plus a non-zero (transparent) border so the <number> widths multiply a
        // REAL border-width instead of 0: 1/2/0.5/0.75/0.25 -> 24/48/12/18/6px
        // frame bands, each visibly different (they were all empty against a 0
        // border). The percents 50/65/80/100% saturating to a full checkerboard is
        // inherent slice overlap once each side >= 50% and is left as-is.
        mb = `border:24px solid transparent;-webkit-mask-box-image-source:${MBSRC};-webkit-mask-box-image-slice:10;-webkit-mask-box-image-width:${raw};-webkit-mask-box-image-repeat:round;`;
      } else if (n === "mask-border-outset") {
        // border:20px so the <number> outsets multiply a real border-width WITHOUT
        // aliasing any px value: 1/2/0.5/0.75/0.25 -> 20/40/10/15/5px (none equal
        // 8/16/24/48/64). A THICK band (width:88px > the 64px max outset) keeps the
        // striped frame partially over the interior at every outset, so the visible
        // fringe = width - outset = 80/72/64/40/24px for 8/16/24/48/64px and
        // 68/48/78/73/83px for the numbers — all distinct (was: 48px & 64px both
        // saturated to a clean checkerboard with no fringe, and 2 aliased 24px).
        mb = `border:20px solid transparent;-webkit-mask-box-image-source:${MBSRC};-webkit-mask-box-image-slice:10 fill;-webkit-mask-box-image-width:88px;-webkit-mask-box-image-outset:${raw};-webkit-mask-box-image-repeat:round;`;
      } else if (n === "mask-border-repeat") {
        mb = `-webkit-mask-box-image-source:${MBSRC};-webkit-mask-box-image-slice:10;-webkit-mask-box-image-width:40px;-webkit-mask-box-image-repeat:${raw};`;
      } else {
        // mask-border (shorthand): drop the unsupported mode keyword and swap the
        // placeholder photo source for the sliceable frame, then emit the prefixed
        // shorthand so the width (24/48/8px) and slice/repeat variations show.
        const sh = raw.replace(/\s+(luminance|alpha)\s*$/, "").replace(/^url\(assets\/photo\.jpg\)/, MBSRC);
        mb = `-webkit-mask-box-image:${sh};`;
      }
      ref.current.style.cssText =
        `width:240px;height:175px;margin:30px;box-sizing:border-box;`
        + `background:repeating-conic-gradient(#2f5fd0 0 25%, #e0a13c 0 50%) 0/34px 34px, #c5483c;`
        + mb;
      return;
    } else if (isMask && maskIsValue) {
      // the VALUE is the mask source; put it over a vivid backdrop so a real
      // alpha source (mask-shape.svg) cuts a silhouette instead of a full reveal.
      // mask-image: force LUMINANCE mode so the opaque colour gradients (whose
      // alpha is 1 everywhere, hence identical under the default alpha mode)
      // modulate opacity by brightness — each gradient then reveals a distinct
      // pattern (linear band vs radial bullseye vs conic wheel vs repeating tiles).
      // mask (shorthand): add real padding + a thick border so the value's own
      // content-box / padding-box / border-box origin+clip keywords bite on a
      // visibly different box (the shorthand resets mask-mode itself, so the
      // luminance line below is scoped to mask-image only).
      const lumMode = n === "mask-image" ? "-webkit-mask-mode:luminance;mask-mode:luminance;" : "";
      const boxModel = n === "mask" ? "padding:22px;border:18px solid color-mix(in srgb,var(--accent) 45%,transparent);" : "";
      // mask-image (luminance mode): reveal a FLAT high-contrast solid instead of
      // the photo so the opaque colour gradients' luminance pattern reads as clean
      // opacity GEOMETRY — linear → diagonal band, radial → bullseye, conic →
      // pinwheel, repeating-* → tiled stripes/rings/wedges — each visibly distinct
      // instead of the near-full reveal the photo texture muddied into one blob
      // (idx 0/5/7/9/11 all collided as “full reveal” before). The mask shorthand
      // keeps the photo so its box-model origin/clip keywords still bite.
      const revealBg = n === "mask-image" ? "var(--accent)" : "url(assets/photo.jpg) center/cover";
      base = `width:170px;height:150px;box-sizing:border-box;${boxModel}${BACKDROP}`
        + `background:${revealBg};${lumMode}`;
      // mask (shorthand): the generated value is a SINGLE mask layer, so its
      // <compositing-operator> (add / subtract / intersect / exclude) has nothing
      // below it to combine with and every operator collapses to the same strip.
      // Append a FIXED second layer — an alpha disc (mask-circle.svg) centred over
      // the box — BELOW the value's layer, so the value's operator composites its
      // strip against the disc: union (add) / strip-with-disc-hole (subtract) /
      // overlap-only (intersect) / xor (exclude) all render visibly differently.
      // Built from value.value so the value's own position/size/repeat/origin/clip
      // and alpha-vs-luminance mode keywords still bite on its own layer.
      if (n === "mask") {
        maskOverride = `mask:${value.value}, url(assets/mask-circle.svg) center/72% no-repeat;`;
      }
    } else if (n === "mask-origin") {
      // mask-origin: a GENEROUS padding + a thick border so content-box,
      // padding-box and border-box each anchor the (non-repeating, top-left)
      // mask to a visibly different sub-region of the element. box-sizing keeps
      // the outer box fixed so only the origin reference moves. NOTE fill-box is
      // a spec alias of content-box and stroke-box/view-box alias border-box on
      // HTML (non-SVG) elements, so those three cannot be separated by markup.
      const m = "url(assets/mask.png)";
      base = `width:200px;height:170px;box-sizing:border-box;padding:26px;border:18px solid color-mix(in srgb,var(--accent) 40%,transparent);background:url(assets/photo.jpg) center/cover;-webkit-mask-image:${m};-webkit-mask-repeat:no-repeat;-webkit-mask-position:left top;-webkit-mask-size:40%;mask-image:${m};mask-repeat:no-repeat;mask-position:left top;mask-size:40%;`;
    } else if (isMask) {
      // a small contained mask of the statue so position/size/repeat/clip/origin shift visibly
      const m = "url(assets/mask.png)";
      base = `width:170px;height:150px;padding:10px;border:10px solid color-mix(in srgb,var(--accent) 40%,transparent);background:url(assets/photo.jpg) center/cover, linear-gradient(135deg,#c5483c,#2f5fd0);-webkit-mask-image:${m};-webkit-mask-repeat:no-repeat;-webkit-mask-position:left top;-webkit-mask-size:60%;mask-image:${m};mask-repeat:no-repeat;mask-position:left top;mask-size:60%;`;
    } else if (n === "clip-path") {
      // clip-path: give the clipped element large, DIFFERING box-model dims — a
      // wide margin, a thick visible border and generous padding — plus a dashed
      // outline so the reference box is legible. circle()/ellipse()/inset()/
      // polygon() then clip to visibly different radii/extents under content-box
      // vs padding-box vs border-box vs margin-box. (fill-box/stroke-box/view-box
      // are SVG-only and alias content/border on HTML elements; a raster url()
      // clip source is unsupported by Chrome and renders the element unclipped.)
      base = "width:150px;height:130px;margin:26px;padding:26px;border:18px solid color-mix(in srgb,var(--accent) 45%,transparent);box-sizing:content-box;outline:2px dashed var(--line-strong);background:url(assets/photo.jpg) center/cover, linear-gradient(135deg,#c5483c,#2f5fd0);";
    } else {
      base = "width:170px;height:150px;background:url(assets/photo.jpg) center/cover, linear-gradient(135deg,#c5483c,#2f5fd0);";
    }
    ref.current.style.cssText = base + (maskOverride || value.css || "");
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
  const autoRow = n === "grid-auto-rows";
  const areas = n === "grid-template-areas";
  // Variable-length multi-word labels so the intrinsic-sizing keywords on the
  // auto tracks diverge: min-content wraps to the longest word (narrow), while
  // max-content / auto lay each phrase out on one line (wide); fit-content clamps.
  const phrases = ["auto grid", "min", "max content sizing", "fit", "specimen track", "fr"];
  const label = (i) => (autoCol || autoRow) ? phrases[i % phrases.length] : String(i + 1);
  useEffect(() => {
    if (!ref.current) return;
    if (itemLevel) {
      ref.current.style.cssText = "display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,30px);gap:6px;width:240px;";
    } else {
      // a small explicit grid so the value's auto tracks / flow / template / gaps
      // visibly reshape the (many) auto-placed cells.
      const base = autoCol
        // One explicit `1fr` column + many auto columns (sized by the value) in a
        // definite-width container: now 1fr keeps every column equal while 2fr makes
        // the auto columns twice the explicit one, and the variable phrases let
        // min-/max-content/auto/fit-content size to their (different) intrinsic widths.
        ? "display:grid;grid-auto-flow:column;grid-template-columns:[a] 1fr;grid-template-rows:repeat(2,minmax(30px,auto));grid-auto-columns:30px;gap:6px;width:300px;"
        : autoRow
        // Definite container height + one explicit `1fr` row so the auto rows (sized by
        // the value) split the free block space against it: 1fr keeps rows equal, 2fr
        // doubles the auto rows, and auto/intrinsic collapse to content height.
        ? "display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:[a] 1fr;grid-auto-rows:30px;gap:6px;width:240px;height:210px;"
        : n === "grid-auto-flow"
        // grid-auto-flow: 3 explicit columns AND 3 explicit rows. The fixed row
        // count bounds COLUMN flow to 3 rows, so a `grid-row: span 2` item that
        // can't fit at a column bottom spills to the next column and leaves a
        // column-end hole; `grid-auto-rows` still lets ROW flow grow extra rows.
        ? "display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,28px);grid-auto-rows:28px;gap:6px;width:240px;"
        : "display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:30px;gap:6px;width:240px;";
      ref.current.style.cssText = base + (value.css || "");
    }
  });
  const itemStyle = (hi) => ({ borderRadius: "5px", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: "11px", background: hi ? "var(--accent)" : "color-mix(in srgb, var(--accent) 18%, var(--bg-3))", color: hi ? "#fff" : "var(--ink-2)", border: "1px solid var(--line)", minWidth: 0, minHeight: 0 });
  const cells = Array.from({ length: itemLevel ? 11 : 10 }, (_, i) => i);
  // grid-auto-flow needs spanners in BOTH track directions so that the `dense`
  // variants visibly backfill the holes the spanners leave (vs sparse flow):
  //  - a `grid-column: span 2` item leaves a one-cell hole at a ROW end (for the
  //    row / row-dense flows), and
  //  - a `grid-row: span 2` (tall) item can't fit at a COLUMN bottom in the fixed
  //    3-row grid, so it spills to the next column and leaves a column-end hole
  //    (for the column / column-dense flows).
  // `dense` back-fills each hole with a later single item, so every dense keyword
  // renders visibly differently from its plain row/column counterpart.
  const span = (i) => n !== "grid-auto-flow" ? null : i === 2 ? { gridColumn: "span 2" } : i === 4 ? { gridRow: "span 2" } : null;
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <div ref={ref}>
          {itemLevel && <div style={{ ...itemStyle(true), ...(value.css ? cssToObj(value.css) : {}) }}>★</div>}
          {areas && <div style={{ ...itemStyle(true), gridArea: "Specimen" }}>Specimen</div>}
          {areas && <div style={{ ...itemStyle(true), gridArea: "Aa" }}>Aa</div>}
          {cells.map((i) => <div key={i} style={{ ...itemStyle(false), ...span(i) }}>{label(i)}</div>)}
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
    if (isZ) { ref.current.style.cssText = "position:absolute;left:34px;top:30px;width:128px;height:74px;border-radius:8px;background:color-mix(in srgb,var(--accent) 88%,transparent);color:#fff;display:grid;place-items:center;font-family:var(--mono);font-size:11px;" + (value.css || ""); return; }
    const base = isPosition ? "top:16px;left:16px;width:74px;height:54px;border-radius:7px;background:var(--accent);color:#fff;display:grid;place-items:center;font-family:var(--mono);font-size:11px;box-shadow:0 8px 18px -8px color-mix(in srgb,var(--accent) 55%,transparent);"
      : "position:absolute;width:60px;height:46px;border-radius:7px;background:var(--accent);box-shadow:0 10px 22px -10px color-mix(in srgb,var(--accent) 55%,transparent);";
    ref.current.style.cssText = base + (value.css || "");
  });
  if (isZ) {
    return (
      <React.Fragment>
        <div className="glass"><span className="glass-label">{n}</span>
          <div style={{ position: "relative", width: "200px", height: "140px", zIndex: 2 }}>
            {[1, 2, 3, 4, 5].map((zi, i) => (
              <div key={zi} style={{ position: "absolute", left: 10 + i * 30, top: 8 + i * 18, width: 44, height: 44, borderRadius: 6, background: "color-mix(in srgb,#2f5fd0 " + (50 + i * 10) + "%,#000)", color: "#cfe0ff", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: "12px", border: "1px solid color-mix(in srgb,#2f5fd0 60%,#000)", zIndex: zi }}>{zi}</div>
            ))}
            <div ref={ref}>{value.value}</div>
          </div>
        </div>
        <LiveControls property={property} value={value} onChange={onChange} hint="The red box's z-index vs the staircase (1\u20135) decides how many layers it covers; its parent inherits z-index 2." />
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <div style={{ position: "relative", width: "210px", height: "150px", border: "1px dashed var(--line-strong)", borderRadius: "10px", background: "var(--bg-3)", overflow: "hidden" }}>
          {isPosition && <div style={{ width: "74px", height: "54px", margin: "10px", borderRadius: "7px", border: "1px dashed var(--line-strong)", color: "var(--ink-3)", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: "10px" }}>flow</div>}
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
    ? "Specimen text wraps down across many many lines here, giving this box a very tall intrinsic block size so that each percentage max clips a distinct, visibly different number of lines counted from the top of the paragraph that just keeps running on far below the fold of the dashed track."
    : "Pack my box with five dozen liquor jugs";
  // min-* gets an EMPTY box so the min value IS the size (8px→8px bar … all
  // distinct, no text-line floor). max-* gets LARGE content so the max clips it.
  // For inline min-* (min-width / min-inline-size), the content-based KEYWORD
  // values all collapse to a zero-width invisible box when the pill is empty:
  // min-content / max-content / fit-content(24px) / fit-content / contain / auto
  // every resolve to 0 with no content, so they are indistinguishable. Give
  // ONLY those keyword values real multi-word text so each keyword resolves to a
  // different minimum width (min-content -> longest word, max-content -> full
  // line, fit-content(24px) -> 24px, fit-content/contain -> clamped, auto ->
  // content min). Length / percentage / calc values keep the empty box so the
  // 8px..64px and % bars stay distinct exactly as before (no regression).
  const minInlineIntrinsic = isMin && !isBlock &&
    /(min-content|max-content|fit-content|:contain\b|:auto\b)/.test(value.css || "");
  // BLOCK min-* (min-height / min-block-size): the previous approach put a
  // four-line wrapping paragraph (~90px tall) inside the width:150px box, so its
  // intrinsic content height already EXCEEDED every tested min (8/16/24/48/64px,
  // the 24-48px math functions, and 15%/30% of the track) -> every one of them
  // sat at the content height, identical to `auto`. Give block min-* the SAME
  // empty box the inline min-* path uses (no text, no padding) so the content
  // height is ~0 and the min value alone drives the box height: 8<16<24<48<64px
  // each render as a distinct bar, and the calc/min/max/clamp/round/abs/env/
  // fit-content(24px) math all separate, while the tall dashed track keeps the
  // 15/30/50/65/80/100% percentages distinct too.
  const content = minInlineIntrinsic
    ? "min to max width"
    : isMin ? "" : isMax ? big : "Specimen typography sample";
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
    // inline min with intrinsic-keyword content: width:0 base so the min-width
    // FLOOR (min/max/fit-content/contain/auto) is what actually sizes the pill;
    // without an explicit base width a flex item would just sit at max-content and
    // ignore the floor whenever it fits, collapsing the keywords together again.
    else if (isMin) base = (isBlock ? "width:150px;" : (minInlineIntrinsic ? "width:0;height:44px;" : "height:44px;")) + "border-radius:8px;background:" + grad + ";";
    else if (isMax) base = (isBlock ? "width:150px;" : "") + "border-radius:8px;background:" + grad + ";";
    else base = (isBlock ? "width:150px;" : "width:120px;") + "border-radius:8px;background:" + grad + ";";
    ref.current.style.cssText = base + pad + (value.css || "");
  });
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <div style={{ width: "230px", height: "240px", border: "1px dashed var(--line-strong)", borderRadius: "10px", display: "flex", alignItems: "flex-start", padding: "10px", overflow: "hidden" }}>
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
  const opsz = n === "font-optical-sizing";   // render LARGE so the opsz axis adjustment (auto) vs locked (none) reads
  const numeric = n === "font-variant-numeric"; // route to Recursive, which actually ships afrc/ordn/zero/frac
  const fontSh = n === "font";                 // the `font` shorthand: wrap to several lines so its line-height reads
  const synthPos = n === "font-synthesis-position"; // needs sub/super content so auto-synthesis diverges from none
  const styleSh = n === "font-style";          // synthesize oblique on a STATIC upright face so the angle's sign & magnitude read
  const widthSh = n === "font-width";           // drive the wdth axis on ONE wide non-wrapping word so 50/65/80/100% diverge
  const varSettings = n === "font-variation-settings"; // render LARGE so the subtle opsz (optical-size) axis adjustment reads
  const alternates = n === "font-variant-alternates"; // needs an @font-feature-values block mapping `alpha` to real feature indices
  // EB Garamond ("Codex Garamond") is the richest face we bundle — it carries
  // smcp, swsh, frac, liga, onum AND tnum — so feature-settings, caps,
  // alternates and ligatures route there (Inter has no small-caps or swash).
  // Inter ("Codex Inter") keeps numeric (tnum/onum/frac/zero) + position
  // (sups/subs). RobotoFlex ("Codex Flex") drives the variation axes.
  const garamond = /feature-settings|variant-caps/.test(n);
  const inter = /variant-position|variant-alternates/.test(n);
  let fam = "'Codex Flex'";
  if (cjk) fam = "'Codex CJK'"; else if (styleSh) fam = "'Codex Typewriter'"; else if (garamond) fam = "'Codex Garamond'";
  // Cormorant is the only bundled face that ships the WHOLE numeric set that
  // collided on Recursive: onum (oldstyle figures), lnum, tnum (tabular) AND
  // zero (slashed-zero) + ordn (ordinal) + frac. Recursive lacked onum and tnum,
  // so oldstyle-nums collapsed to lining and tabular-nums collapsed to
  // proportional. Routing numeric to Cormorant separates oldstyle vs lining,
  // tabular vs proportional, slashed vs unslashed and ordinal vs baseline
  // (verified rendering in Chrome). The one feature Cormorant lacks is afrc, so
  // stacked-fractions still falls back to diagonal -- noted, not demo-fixable.
  else if (numeric || ligs) fam = "'Codex Cormorant'";
  else if (n === "font-variant") fam = "'Codex Inter','Codex CJK'";
  else if (palette) fam = "'Codex Spice'"; else if (inter) fam = "'Codex Inter'";
  let text = "Hamburgefonstiv";
  if (n === "font-kerning") text = "AVATo Wave Ye.";
  // east-asian: kanji with documented jis78/83/90 shape differences (唖 鴎 蝉
  // 攪 莱) plus Latin/digits, so the jis forms AND full-width vs
  // proportional-width (fwid/pwid) all read.
  else if (cjk) text = "唖 鴎 蝉 攪 莱  国國 戦戰 単單 図圖  ABC 0123 永";
  else if (n === "font-feature-settings") text = "Quartz Fjord 1/2 ct st fi 0123";
  // numeric: more figures + several fractions + ordinals so stacked-fractions
  // (afrc), ordinal (ordn) and slashed-zero (zero) each separate visibly.
  else if (numeric) text = "0123456789  1/2 3/4 5/8  1st 2nd 3rd";
  else if (n === "font-variant-alternates") text = "Gault flu 13469";
  // ligatures: long-s (ſ) sequences trigger the historical ligatures/forms
  // (hlig/hist) so historical-ligatures vs no-historical-ligatures, which
  // previously collapsed, now diverge.
  else if (ligs) text = "Quartz  fi ffl  ct st  ſt tz";
  // the `font` shorthand pins xx-small text; a long wrapping paragraph makes
  // its line-height component (normal / 1 / 0.5 / 2) show as differing box
  // heights and line spacing instead of one identical single line.
  else if (fontSh) text = "The codex sets this running paragraph across several wrapped lines so its line-height component is plainly legible.";
  // synthesis-position: a base for the synthesised superscript exponent.
  else if (synthPos) text = "E = mc";
  else if (palette) text = "CODEX";
  else if (emoji) text = "Codex ✉ ☂ ✈ ❤";
  // the font-variant SHORTHAND combines caps+numeric+ligatures+position; the old
  // "Hamburgefonstiv" sample only exercised small-caps, so every value that
  // differed solely in `sub`/`super`/numeric collapsed (e.g. idx2 ...ruby sub vs
  // idx6 ...ruby super rendered identically). Digits + a fraction let the `sub`
  // and `super` position sub-features visibly lower/raise the figures on Codex
  // Inter (which carries subs/sups), separating each sub-row from its super-row.
  else if (n === "font-variant") text = "H2O 1/2 0123 ✉ 一永";
  else if (n === "font-variant-position") text = "H2SO4  E = mc2";
  else if (n === "font-variant-caps") text = "Codex Small Caps";
  else if (n === "font-size-adjust" || n === "font-size") text = "Hamburg 0123";
  useEffect(() => {
    if (!ref.current) return;
    // synthesis-* only fire when the face LACKS the requested style, so request
    // bold+italic+small-caps from the single-weight typewriter face.
    const synth = /synthesis/.test(n) && !synthPos;
    const base = synth
      ? "margin:0;font-family:'Codex Typewriter',monospace;font-weight:800;font-style:italic;font-variant:all-small-caps;font-size:30px;line-height:1.4;color:var(--ink);"
      : `margin:0;font-family:${fam},var(--sans);font-size:${cjk ? 30 : (opsz || varSettings) ? 72 : 34}px;line-height:1.4;color:var(--ink);${fontSh ? "width:110px;zoom:3;" : widthSh ? `white-space:nowrap;font-stretch:${value.value};` : "max-width:13ch;"}font-feature-settings:normal;font-variation-settings:normal;`;
    ref.current.style.cssText = base + (value.css || "");
  });
  // font-synthesis-position only acts on text marked font-variant-position:
  // super/sub, and only synthesises when the face lacks native sups/subs glyphs
  // (Codex Flex / RobotoFlex has none) — so render a superscript exponent: with
  // `auto` the browser raises+shrinks it, with `none` it stays full-size on the
  // baseline, making the two values clearly distinct. Plain <span> (not <sup>)
  // so UA superscript styling does not confound the test.
  const synthSup = synthPos
    ? <span style={{ fontFamily: "'Codex Flex'", fontVariantPosition: "super" }}>2</span>
    : null;
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        {alternates && <style>{`@font-feature-values "Codex Inter"{@stylistic{alpha:1}@swash{alpha:1}@ornaments{alpha:1}@annotation{alpha:1}@styleset{alpha:1}@character-variant{alpha:1}}`}</style>}
        <p ref={ref}>{text}{synthSup}</p>
      </div>
      <LiveControls property={property} value={value} onChange={onChange} />
    </React.Fragment>
  );
}

/* ---------------------------------------------------------------
   LINE / INLINE Spacing:  a narrow column of awkward text so
   wrapping/breaking/hyphenation/whitespace differences show.
--------------------------------------------------------------- */
function LineSpacingDemo({ property, value, onChange }) {
  const ref = useRef(null);
  const n = property.name;
  const tabs = n === "tab-size";
  const hyph = /hyphenate/.test(n);
  const cjk = n === "line-break";   // line-break mostly governs CJK breaking
  const limitChars = n === "hyphenate-limit-chars";  // a single integer sets the word-min: only words >= N chars may hyphenate
  const ws = n === "white-space-collapse";  // needs runs of spaces/newlines to collapse
  const wrap = n === "text-wrap-style" || n === "text-wrap";  // balance/pretty even the ragged headline; nowrap values overflow it
  const wordSp = n === "word-spacing";  // needs several short real words sharing a line so the inter-word gaps can visibly widen
  useEffect(() => {
    if (!ref.current) return;
    let base = "margin:0;width:150px;font-size:16px;line-height:1.5;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:12px;background:var(--bg-3);text-align:left;";
    base += cjk ? "font-family:'Codex CJK',var(--serif);width:108px;-webkit-line-break:after-white-space;" : "font-family:var(--serif);";
    if (tabs) base += "white-space:pre-wrap;";                    // so the \t actually renders
    if (hyph) base += "hyphens:auto;-webkit-hyphens:auto;";       // so hyphenate-* apply
    if (limitChars) base += "width:128px;text-align:justify;font-size:15px;";    // narrow + justified; the mixed-length words straddle each integer word-min so every value gates a different set of words for hyphenation
    if (wrap) base = "margin:0;width:230px;font-family:var(--serif);font-size:19px;line-height:1.45;color:var(--ink);text-wrap:wrap;";
    if (wordSp) base += "width:auto;max-width:260px;white-space:nowrap;font-size:18px;line-height:1.6;";  // a wide single-line measure with many short words, so word-spacing visibly grows every inter-word gap
    ref.current.style.cssText = base + (value.css || "");
    if (hyph) ref.current.setAttribute("lang", "en");
    if (cjk) ref.current.setAttribute("lang", "ja");   // fire Japanese kinsoku so loose/normal/strict diverge
  });
  const text = tabs ? "Col\tA\tnums\t12\tand\t34 tabbed out"
    : cjk ? "特許許可局っ東京都庁舎ー横浜中華街ゃ大阪城天守ょ神戸港町家っ京都嵐山寺ー奈良東大門ゅ札幌時計台っ仙台青葉城ー福岡博多湾ゃ長崎平和像ょ広島原爆館っ名古屋城下ー金沢兼六園ゃ"
    : limitChars ? "busy table happy water funny basket winter pretty monster lantern subject sunlight elephant computer beautiful chocolate wonderful basketball grandmother"
    : hyph ? "supercalifragilisticexpialidocious antidisestablishmentarianism phenomenon"
    : ws ? "Codex    spaced   out\n\nwith   breaks   kept   or   collapsed"
    : wrap ? "The codex balances this ragged headline across its measure"
    : wordSp ? "the quick brown fox jumps over a lazy dog"
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
  const colHeight = n === "column-height";  // tiny type so 8/16/24px column-height -> 1/2/3-line fragments
  useEffect(() => {
    if (!ref.current) return;
    // column-width: a WIDE measure so the intrinsic sizes diverge — min-content packs
    // many word-wide columns, max-content collapses to one very wide column, and
    // fit-content(24px) clamps to ~24px columns. A 248px measure fits only one column
    // for all three, so they collide; 460px gives min/max/fit room to differ.
    let base = (widthDriven ? "width:460px;" : "width:248px;") + "column-gap:16px;font-family:var(--serif);" + (colHeight ? "font-size:7px;line-height:8px;" : "font-size:11px;line-height:1.5;") + "color:var(--ink-2);text-align:justify;overflow:hidden;";
    base += widthDriven ? "" : (ruleProp ? "column-count:6;" : "column-count:3;");  // rule needs 5+ gaps so the trailing list style after the second comma shows; column-width drives its own count
    base += fill ? "height:160px;" : "height:150px;";       // fixed 160px height with column-count:3 and a SINGLE-paragraph body (~1.5-2 columns of text): auto fills column 1 to the full 160px then partly fills column 2, leaving column 3 EMPTY (lopsided); balance spreads the same text evenly across all three. The old two-paragraph body overflowed all three columns, so auto looked identical to balance.
    base += ruleProp ? "column-rule:8px solid var(--accent);" : "column-rule:6px solid var(--accent);";
    ref.current.style.cssText = base + (span ? "" : (value.css || ""));
  });
  const para = "The codex flows its specimens into newspaper columns so the gutter rules, spans and balance can be seen at a glance across the measure of the page.";
  // column-width sizes a column by the INTRINSIC width of its content, so it needs
  // text with clearly long words: min-content makes each column as wide as the
  // widest word (specimens/typographically/uninterruptedly), max-content makes one
  // column as wide as the whole unwrapped line, and fit-content(24px) clamps to 24px
  // — three visibly different column counts.
  const widthPara = "The codex flows its typographically uninterruptedly composited specimens into newspaper columns where the widest word governs every measure across the page.";
  // column-fill needs LESS content than fills every column, so the auto vs
  // balance difference (lopsided vs even) is visible; others get the full flow.
  // column-height caps each column box's height, so the flow fragments into
  // stacked rows of columns. A FIXED height only differs from auto (and from
  // another fixed height) when there is MORE text than 3 columns of that height
  // can hold, forcing a second/third column-row inside the 150px container.
  const heightPara = Array(7).fill(para).join(" ");
  const body = widthDriven ? (widthPara + " " + widthPara) : (fill ? para : (colHeight ? heightPara : para + " " + para));
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
  // Table-internal and ruby display roles only lay out distinctly INSIDE a real
  // display:table / display:ruby ancestor with sibling rows/cells/annotations.
  const dispTable = n === "display" && /^table-(row-group|header-group|footer-group|row|cell|column-group|column|caption)$/.test(value.value);
  const dispRuby = n === "display" && /^ruby-(base|text|base-container)$/.test(value.value);
  const dispInternal = dispTable || dispRuby;
  // Outer-display values (block/inline/run-in + legacy flow/flow-root/table/ruby
  // aliases, with optional list-item) only read distinctly with CONTEXT: a run of
  // surrounding prose (so block vs inline vs run-in break differently), a float
  // inside the box (so flow vs flow-root containment diverge), and cell children
  // (so table/ruby reshape them). flex/grid keep the plain box — their own layout
  // already shows. Internal roles are handled by dispInternal above.
  const dispOuter = n === "display" && !dispInternal && /^(block|inline|run-in|flow|flow-root|table|ruby)( (flow|flow-root|table|ruby))?( list-item)?$|^list-item$/.test(value.value);
  useEffect(() => {
    if (!ref.current) return;
    if (dispInternal) ref.current.style.cssText = "padding:4px 9px;border-radius:5px;background:var(--accent);color:#fff;font-family:var(--mono);font-size:11px;white-space:nowrap;" + (value.css || "");
    else if (dispOuter) ref.current.style.cssText = "box-sizing:border-box;border:1.5px dashed var(--accent);border-radius:7px;padding:5px 7px;background:color-mix(in srgb,var(--accent) 14%,var(--bg-3));color:var(--ink);font-family:var(--mono);font-size:11px;line-height:1.45;" + (value.css || "");
    else if (n === "display") ref.current.style.cssText = "gap:6px;width:210px;border:1px dashed var(--line-strong);border-radius:8px;padding:8px;background:var(--bg-3);" + (value.css || "");
    else if (n === "clear") ref.current.style.cssText = "height:24px;border-radius:6px;background:var(--accent);color:#fff;font-family:var(--mono);font-size:11px;display:grid;place-items:center;margin-top:4px;" + (value.css || "");
    else if (isFloatClear) ref.current.style.cssText = "width:70px;height:50px;border-radius:7px;background:var(--accent);margin:0 10px 6px 0;" + (value.css || "");
    else if (n === "overflow-clip-margin") ref.current.style.cssText = "width:96px;height:70px;padding:24px;border:12px solid color-mix(in srgb,var(--accent) 45%,var(--bg-3));border-radius:4px;background:var(--bg-3);overflow:clip;margin:64px;" + (value.css || "");
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
  if (dispOuter) {
    // The box carries the tested outer-display value and is embedded in a run of
    // serif prose. block/run-in break onto their own line(s); inline / inline-*
    // flow within the sentence. A float as the box's first child reveals BFC
    // containment: flow-root grows the box's border to enclose the float, plain
    // flow lets it poke past the bottom edge. The three cell spans lay out inline
    // for flow but become a content-sized row for table.
    const oc = { display: "inline-block", borderRadius: "4px", padding: "1px 5px", margin: "0 3px 3px 0", background: "color-mix(in srgb,var(--accent) 30%,var(--bg-3))", color: "var(--ink)", fontFamily: "var(--mono)", fontSize: "11px", border: "1px solid var(--line)" };
    return (
      <React.Fragment>
        <div className="glass"><span className="glass-label">{n}</span>
          <div style={{ width: "232px", fontFamily: "var(--serif)", fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.65 }}>
            The codex sets a&nbsp;
            <span ref={ref}>
              <span style={{ float: "left", width: "20px", height: "34px", margin: "1px 6px 2px 0", borderRadius: "4px", background: "var(--accent)" }} />
              <span style={oc}>one</span><span style={oc}>two</span><span style={oc}>three</span> 京都
            </span>
            &nbsp;specimen amid running prose, so block, inline and run-in break differently, the inset float reveals flow vs flow-root containment, and table/ruby reshape the cells.
          </div>
        </div>
        <LiveControls property={property} value={value} onChange={onChange} />
      </React.Fragment>
    );
  }
  if (dispInternal) {
    // The ★ box carries the value; it sits inside a REAL display:table (or
    // display:ruby) ancestor with sibling rows/cells (or base/annotation) so each
    // internal role lays out in its proper place instead of collapsing alike.
    const tcell = { border: "1px solid color-mix(in srgb,var(--accent) 45%,var(--bg-3))", padding: "4px 9px", color: "var(--ink-2)", fontFamily: "var(--mono)", fontSize: "11px", background: "var(--bg-3)" };
    return (
      <React.Fragment>
        <div className="glass"><span className="glass-label">{n}</span>
          {dispTable ? (
            <div style={{ display: "table", borderCollapse: "collapse", border: "1px solid var(--line-strong)", borderRadius: "8px", background: "var(--bg-3)", color: "var(--ink-2)" }}>
              <div style={{ display: "table-caption", captionSide: "top", padding: "4px 9px", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)" }}>caption</div>
              <div style={{ display: "table-row" }}>
                <div style={tcell}>r1c1</div>
                <div ref={ref}>★ {value.value}</div>
                <div style={tcell}>r1c3</div>
              </div>
              <div style={{ display: "table-row" }}>
                <div style={tcell}>r2c1</div>
                <div style={tcell}>r2c2</div>
                <div style={tcell}>r2c3</div>
              </div>
            </div>
          ) : (
            <div style={{ display: "ruby", border: "1px dashed var(--line-strong)", borderRadius: "8px", padding: "12px 14px", background: "var(--bg-3)", fontFamily: "var(--serif)", fontSize: "24px", color: "var(--ink)", lineHeight: 2.4 }}>
              <span style={{ display: "ruby-base" }}>東</span>
              <span style={{ display: "ruby-text", fontSize: "11px", color: "var(--accent)" }}>ひがし</span>
              <span ref={ref}>{value.value === "ruby-text" ? "ふりがな" : "京都"}</span>
              <span style={{ display: "ruby-base" }}>京</span>
              <span style={{ display: "ruby-text", fontSize: "11px", color: "var(--accent)" }}>きょう</span>
            </div>
          )}
        </div>
        <LiveControls property={property} value={value} onChange={onChange} />
      </React.Fragment>
    );
  }
  const child = { borderRadius: "5px", padding: "8px 10px", background: "color-mix(in srgb,var(--accent) 26%,var(--bg-3))", color: "var(--ink)", fontFamily: "var(--mono)", fontSize: "11px", border: "1px solid var(--line)" };
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        {n === "overflow-clip-margin"
          ? <div ref={ref}><div style={{ width: "230px", height: "190px", margin: "-72px 0 0 -72px", background: "repeating-linear-gradient(45deg,var(--accent) 0 9px,color-mix(in srgb,var(--accent) 35%,var(--bg-3)) 9px 18px)", borderRadius: "4px" }} /></div>
          : isOverflow
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
  const cell = { border: "1px solid color-mix(in srgb,var(--accent) 45%,var(--bg-3))", padding: "8px 12px", background: "color-mix(in srgb,var(--accent) 22%,var(--bg-3))" };
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <table ref={ref}>
          <caption style={{ padding: "4px", color: "var(--accent)", fontSize: "11px" }}>caption</caption>
          <tbody>
            {/* lopsided content so table-layout auto (size-to-content) vs fixed
                (equal columns) produce visibly different column widths */}
            <tr><td style={cell}>A</td><td style={cell}>Supercalifragilistic</td></tr>
            {/* a TRULY empty cell (no text, no &nbsp;) so empty-cells can act on it:
                show -> paints its border + background like a normal cell;
                hide -> leaves a transparent gap with no border. */}
            <tr><td style={cell}></td><td style={cell}>B</td></tr>
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
  // box-direction acts on -webkit-box CHILD order; text-combine-upright on a
  // vertical digit RUN; unicode-bidi on a MIXED-DIRECTION (RTL+LTR) run. Each
  // needs its own scaffold — a single flowing-text box cannot exercise them.
  const boxdir = n === "box-direction";
  const combine = n === "text-combine-upright";
  const bidi = n === "unicode-bidi";
  // text-orientation also only reads in VERTICAL flow with CJK + digit runs.
  const vertical = n === "text-orientation";
  useEffect(() => {
    if (!ref.current) return;
    if (boxdir) {
      // a horizontal -webkit-box; the value reorders the numbered children:
      // normal -> 1 2 3 4 (left->right), reverse -> 4 3 2 1.
      ref.current.style.cssText =
        "margin:0;display:-webkit-box;-webkit-box-orient:horizontal;-webkit-box-pack:center;-webkit-box-align:center;width:170px;height:84px;border:1px solid var(--line);border-radius:8px;padding:12px;background:var(--bg-3);"
        + "-webkit-box-direction:" + (value.value || "normal") + ";"
        + (value.css || "");
    } else if (combine) {
      // big VERTICAL line; the digit spans carry the value (see render), so the
      // box only needs to flow them top->bottom with room for the upright square.
      ref.current.style.cssText =
        "margin:0;width:120px;height:230px;border:1px solid var(--line);border-radius:8px;padding:12px;background:var(--bg-3);font-size:30px;line-height:1.35;color:var(--ink);font-family:'Codex CJK',var(--serif);writing-mode:vertical-rl;";
    } else if (bidi) {
      // LTR paragraph; the embedded Hebrew+digit span (see render) carries the
      // value, so override/isolate/embed reorder it relative to the LTR frame.
      ref.current.style.cssText =
        "margin:0;width:170px;height:150px;border:1px solid var(--line);border-radius:8px;padding:12px;background:var(--bg-3);font-size:19px;line-height:1.7;color:var(--ink);font-family:var(--serif);direction:ltr;text-align:left;";
    } else {
      ref.current.style.cssText =
        "margin:0;width:170px;height:150px;border:1px solid var(--line);border-radius:8px;padding:12px;background:var(--bg-3);font-size:19px;line-height:1.7;color:var(--ink);"
        + (vertical ? "font-family:'Codex CJK',var(--serif);writing-mode:vertical-rl;" : "font-family:var(--serif);")
        + (value.css || "");
    }
  });
  if (boxdir) {
    const cell = (i) => ({ margin: "0 4px", width: "30px", height: "30px", borderRadius: "6px", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: "13px", background: "color-mix(in srgb,var(--accent) 18%,var(--bg-3))", color: "var(--ink)", border: "1px solid var(--line)" });
    return (
      <React.Fragment>
        <div className="glass"><span className="glass-label">{n}</span>
          <div ref={ref}>
            {[1, 2, 3, 4].map((i) => <div key={i} style={cell(i)}>{i}</div>)}
          </div>
        </div>
        <LiveControls property={property} value={value} onChange={onChange}
          hint="The -webkit-box reorders its cells: normal -> 1 2 3 4, reverse -> 4 3 2 1." />
      </React.Fragment>
    );
  }
  if (combine) {
    // value.css lands on the digit SPANS: 'all' / 'digits N' squeeze a run of N
    // digits into one upright square; 'none' stacks each digit on its own line.
    const dig = cssToObj(value.css);
    return (
      <React.Fragment>
        <div className="glass"><span className="glass-label">{n}</span>
          <p ref={ref}>縦書き<span style={dig}>2024</span>年<span style={dig}>12</span>月</p>
        </div>
        <LiveControls property={property} value={value} onChange={onChange}
          hint="The digit runs (2024, 12) take the value — all/digits squeeze them into one upright square; none stacks each digit." />
      </React.Fragment>
    );
  }
  if (bidi) {
    // RTL Hebrew + LTR digits in one embedded span carrying the value, inside an
    // LTR frame: bidi-override flips glyph order, isolate/embed wall it off,
    // plaintext re-resolves direction from the content.
    const run = { direction: "rtl", ...cssToObj(value.css) };
    return (
      <React.Fragment>
        <div className="glass"><span className="glass-label">{n}</span>
          <p ref={ref}>5 <span style={run}>ABC 123 שלום</span> | <span style={run}>שלום 123 ABC</span> 9</p>
        </div>
        <LiveControls property={property} value={value} onChange={onChange}
          hint="Two direction:rtl spans inside an LTR frame — the first starts with a strong LTR letter, the second with a strong Hebrew letter. embed's extra embedding level reorders the boundary numbers (5/9), isolate/override wall each span off, and plaintext re-resolves each span's base direction from its own first strong char, so the LTR-first and RTL-first spans order differently." />
      </React.Fragment>
    );
  }
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
      ref.current.style.cssText = "display:grid;grid-template-columns:repeat(3," + (itemLevel ? "42px" : "40px") + ");grid-template-rows:repeat(2," + (itemLevel ? "50px" : "84px") + ");gap:8px;justify-items:stretch;align-items:" + (itemLevel ? "end" : "stretch") + ";width:" + (itemLevel ? "142px" : "136px") + ";" + (itemLevel ? "" : (value.css || ""));
    } else if (itemLevel) {
      // a no-wrap row, slightly over-full so flex / flex-shrink / order on the
      // ★ visibly change its size or position among the siblings
      ref.current.style.cssText = "display:flex;gap:7px;align-items:stretch;width:" + (n === "flex" ? "280px" : n === "flex-basis" ? "180px" : "232px") + ";height:108px;border:1px dashed var(--line-strong);border-radius:8px;padding:8px;overflow:hidden;";
    } else {
      // align-content needs MULTIPLE lines with spare cross-axis room to distribute
      ref.current.style.cssText = "display:flex;gap:8px;width:232px;height:" + (n === "align-content" ? "160px" : "150px") + ";border:1px dashed var(--line-strong);border-radius:8px;padding:8px;flex-wrap:wrap;" + (value.css || "");
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
            {itemLevel
              ? <div style={{ ...gitem(true), whiteSpace: "nowrap", width: "84px", height: "22px", overflow: "hidden", ...cssToObj(value.css) }}>★ overflows</div>
              : <div style={{ ...gitem(true), whiteSpace: "nowrap", minWidth: "max-content" }}>★ wide subject overflows its cell</div>}
            {[1, 2, 3, 4, 5].map((i) => <div key={i} style={itemLevel ? gitem(false) : { ...gitem(false), whiteSpace: "nowrap" }}>{itemLevel ? i : "item " + i}</div>)}
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
    const star = { ...box(true, { flex: (n === "flex-basis" ? "0 0 86px" : "1 1 86px"), height: "auto", minWidth: 0, overflow: "hidden" }), whiteSpace: (n === "flex-basis" ? "normal" : "nowrap"), ...cssToObj(value.css) };
    return (
      <React.Fragment>
        <div className="glass"><span className="glass-label">{n}</span>
          <div ref={ref}>
            <div style={star}>{n === "flex-basis" ? "★ extraordinarily reconfigurable specimen typography" : n === "flex" ? "★ codex specimen text" : "★"}</div>
            {[1, 2, 3, 4].map((i) => <div key={i} style={box(false, { flex: (n === "flex-basis" ? "0 0 auto" : n === "flex" ? "100 0 0" : "1 1 34px"), height: "auto", order: i, minWidth: 0, overflow: "hidden" })}>{i}</div>)}
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
          {(n === "align-content" ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [1, 2, 3, 4, 5, 6]).map((i) => <div key={i} style={box(false, { flex: "0 0 auto", width: (n === "align-content" ? "60px" : "62px"), height: (n === "align-content" ? "22px" : "30px") })}>{i}</div>)}
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
    // orphans/widows: the generated value var(--my-var, 0.5) carries a NON-INTEGER
    // fallback (0.5) which is invalid for <integer>, so the declaration is dropped
    // and the property silently computes to its initial 2 — colliding with orphans:2.
    // Define the referenced custom property to a real integer (4) so var(--my-var,…)
    // RESOLVES to a valid count and renders distinctly from 2. Real CSS: we supply
    // the custom property the value references rather than relying on its bad fallback.
    if (ref.current) ref.current.style.cssText = lines ? ("--my-var:4;" + (value.css || "")) : "";
  });
  const para = "Fragmentation is how CSS flows a tall document across page (or column) boundaries. Where the engine is allowed — or forced — to break decides what lands on each page. ";
  const breakVal = lines ? undefined : cssToObj(value.css);
  const P = (k) => <p key={k} style={{ margin: "0 0 9px" }}>{para}{para}</p>;
  // break-before/after/inside also carry COLUMN-context values (column / avoid-column)
  // that a single-column printed page can never show. A second multicolumn block —
  // column-fill:auto so columns fill top-to-bottom rather than balancing — lets the
  // same value land visibly even in the print path: break-before/after:column pushes
  // the highlighted block whole to the next column, break-inside:avoid-column keeps a
  // tall block from splitting, while auto lets it split across the column gap.
  const colCtx = /^break-(before|after|inside)$/.test(n);
  const colCard = { margin: "0 0 6px", padding: "4px 7px", borderRadius: "4px", background: "var(--accent-soft)" };
  return (
    <React.Fragment>
      <div className="glass paged-glass"><span className="glass-label">{n}</span>
        <div className="paged-doc" ref={ref}>
          <h3 style={{ margin: "0 0 8px" }}>Section I — opening</h3>
          {/* Section I is given a minHeight that nearly fills an A5 content area
              (~182mm tall) so Section II always sits at the very bottom edge of
              page 1. A FORCED break on Section II (always / all / page / left /
              right / recto / verso) then pushes the whole highlighted section
              onto page 2 — visibly two pages — while auto / avoid / avoid-page
              keep it crammed at the foot of page 1 (one page). Real layout
              sizing, not a faked render: it just guarantees the boundary is
              right under Section II so the forced break can fire. */}
          {/* For orphans/widows the filler is pushed taller (172mm) so the single
              tall split paragraph below straddles the page-1 boundary with only a
              FEW candidate lines at the foot of page 1. The orphans threshold then
              bites: low counts (1/2) leave those lines on page 1, while a high
              count (4/5) forbids the cramped break and shoves the WHOLE paragraph
              to page 2 — a visible divergence the fixed 150mm geometry hid. */}
          <div style={{ minHeight: lines ? "172mm" : "150mm" }}>
            {[0, 1, 2].map(P)}
          </div>
          <div className="paged-section" style={breakVal}>
            <h3 style={{ margin: "0 0 8px" }}>Section II — {lines ? "the split paragraph" : "takes the value"}</h3>
            {lines
              ? <p style={{ margin: "0 0 9px" }}>{para}{para}{para}{para}{para}</p>
              : [4, 5].map(P)}
          </div>
          {[7].map(P)}
          {colCtx && (
            <React.Fragment>
              <h3 style={{ margin: "14px 0 8px" }}>In columns — column / avoid-column</h3>
              <div style={{ columns: 2, columnGap: "16px", columnRule: "1px dashed var(--line-strong)", columnFill: "auto", height: "96px" }}>
                {/* Short columns (96px) with only one small leading card so column 1
                    is barely a third full. break-before:column then moves the whole
                    ★ block to the TOP of column 2 (leaving column 1 with just card 1),
                    while auto starts it right under card 1 in column 1 — an
                    unambiguous, visible difference. */}
                <div style={colCard}>card 1 — column 1 opens here; the flow fills this column top to bottom, then spills into the second.</div>
                <div className="paged-section" style={{ ...colCard, ...breakVal }}>
                  Section II ★ takes the value — column pushes this block whole to the top of column 2; avoid-column keeps it from splitting; auto lets it begin right under card 1 in column 1 and split across the gap.
                </div>
                <div style={colCard}>card 3 — trailing content following Section II in the flow.</div>
              </div>
            </React.Fragment>
          )}
        </div>
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint={lines ? "Printed across pages — the value sets the min lines kept together at a page break."
          : "Printed to PDF — page / left / right force a page break; the column block below shows column / avoid-column."} />
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
    if (!ref.current) return;
    // Image-source shape-outside values point at photo.jpg, which is fully
    // OPAQUE (no alpha) so the wrap collapses to the float's box rectangle —
    // making url()/image()/image-set()/cross-fade() identical to one another and
    // to the gradients. Re-point them at the alpha-bearing star mask (opaque
    // white star on a transparent ground) and add shape-image-threshold so the
    // wrap follows the real alpha contour, distinct from none / gradients / circle.
    let css = value.css || "";
    if (n === "shape-outside" && css.includes("assets/photo.jpg"))
      css = css.replace(/assets\/photo\.jpg/g, "assets/mask-shape.svg") + "shape-image-threshold:0.5;";
    // Per-property base box. shape-margin needs a TALL float carrying a FIXED
    // circle contour strictly SMALLER than the box, so each margin step grows
    // the curved exclusion through real slack; with the prose column widened to
    // 720px (below) the percentage margins (15%..100% of that column) resolve to
    // clearly different gutters instead of all over-clearing the small float.
    // shape-outside needs thick padding + a thick border so content-box /
    // padding-box / border-box / margin-box resolve to four DIFFERENT reference
    // boxes; without them those *-box keywords share one box and collide.
    // shape-image-threshold needs an ALPHA-GRADIENT image source as shape-outside
    // (mask-fade.svg: a radial fade from opaque centre to transparent rim) so each
    // threshold cuts the wrap contour at a different alpha radius; the value
    // (shape-image-threshold:X) applies on top via css. shape-rendering needs a
    // real, scaled SVG specimen — it is an INHERITED SVG property, so the value
    // set on this float propagates onto the child <svg> rendered below: crispEdges
    // / optimizeSpeed alias the diagonal & curved edges while auto /
    // geometricPrecision keep them anti-aliased.
    let base;
    if (n === "shape-margin")
      // shape-margin percentages resolve against the INLINE SIZE OF THE CONTAINING
      // BLOCK (the prose column), not the float — so a wide column made 15%..100%
      // resolve to 100px+ gutters that all over-clear the small float and collapse
      // to one rectangle. The column is narrowed to 380px (below) so 15%/30%/50%/
      // 65%/80%/100% map onto small, DISTINCT gutters (~57..380px) in the same
      // visible range as the 8/16/24/48/64px pixel steps. The contour is also shrunk
      // to circle(18px) inside an 84px-wide, 170px-tall float so the rounded
      // exclusion has empty box to grow THROUGH instead of saturating the box at
      // the first percentage step. The visible disc is drawn at 18px so the wrap
      // stays honest: 15% lands the first line close, 100% (=full column) clears it.
      base = "float:left;width:84px;height:170px;margin:0 14px 6px 0;background:radial-gradient(circle 18px at 50% 50%,var(--accent),#2f5fd0 99%,transparent 100%);shape-outside:circle(18px at center);";
    else if (n === "shape-image-threshold")
      // shape-outside points at the radial ALPHA fade; threshold:X (from css) cuts
      // the wrap at alpha X, so 0.25 keeps a large disc, 0.5 a medium, 0.75 a small
      // one, and 1/2/100% fall back to the full rectangular box. The matching
      // radial background shows the visible disc track the contour.
      base = "float:left;width:140px;height:140px;margin:0 16px 6px 0;shape-outside:url(assets/mask-fade.svg);background:radial-gradient(circle at center,var(--accent) 0%,#2f5fd0 55%,transparent 100%);";
    else if (n === "shape-rendering")
      // a transparent float that HOSTS the inline SVG below; shape-rendering is an
      // inherited SVG property so the value set here propagates onto the SVG edges.
      base = "float:left;width:240px;height:200px;margin:0 18px 6px 0;shape-rendering:auto;";
    else if (n === "shape-outside")
      // padding:14px + border:10px split the float into four distinct reference
      // boxes (content 64 / padding 92 / border 112 / margin ~120), so the
      // content-box / padding-box / border-box / margin-box variants each wrap
      // at a different contour size instead of sharing one box.
      base = "float:left;width:64px;height:64px;margin:0 14px 4px 0;padding:14px;border:10px solid color-mix(in srgb,var(--accent) 55%,#000);background:linear-gradient(140deg,var(--accent),#2f5fd0);border-radius:50%;shape-outside:circle(50%);";
    else
      base = "float:left;width:72px;height:72px;margin:0 14px 4px 0;background:linear-gradient(140deg,var(--accent),#2f5fd0);border-radius:50%;shape-outside:circle(50%);";
    ref.current.style.cssText = base + css;
  });
  return (
    <React.Fragment>
      <div className="glass"><span className="glass-label">{n}</span>
        <div style={{ width: n === "shape-margin" ? "380px" : "480px", fontFamily: "var(--serif)", fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.5 }}>
          <div ref={ref}>
            {n === "shape-rendering" &&
              // A real, zoomed-in SVG specimen: a small viewBox drawn at 120px (3x)
              // with thin-stroked diagonals, a circle outline and a curved path —
              // the geometry whose edges shape-rendering controls. shape-rendering
              // is inherited, so the value set on the host float (above) reaches
              // these shapes: crispEdges/optimizeSpeed render them aliased (hard,
              // jagged pixel edges) while auto/geometricPrecision keep them smooth.
              // A tiny 30x20 viewBox drawn at 240x160 (8x upscale) so one viewBox
              // unit spans ~8 CSS px: the long, very SHALLOW near-horizontal diagonal
              // and the near-vertical one are the geometry where antialiasing is
              // loudest, so crispEdges/optimizeSpeed staircase them into visible hard
              // pixel steps while auto/geometricPrecision keep the same edges smooth.
              <svg width="240" height="160" viewBox="0 0 30 20" style={{ display: "block" }} aria-hidden="true">
                <rect x="0" y="0" width="30" height="20" fill="var(--bg-3)" />
                <line x1="1" y1="17" x2="29" y2="11" stroke="#2f5fd0" strokeWidth="0.7" />
                <line x1="1" y1="10" x2="29" y2="6" stroke="#2f5fd0" strokeWidth="0.5" />
                <line x1="6" y1="1" x2="10" y2="19" stroke="var(--accent)" strokeWidth="0.6" />
                <circle cx="22" cy="10" r="7" fill="none" stroke="var(--accent)" strokeWidth="0.6" />
              </svg>}
          </div>
          The codex pours its running prose so it hugs the contour of the floated specimen, and the value reshapes how tightly the text wraps around it line by line. With a wide column beside a small float, every increment of the margin pushes more lines of prose progressively further from the specimen, so the wrap exclusion grows ring by ring and the difference between a tight gutter and a generous one is plain to read across the paragraph.
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
  const isIso = n === "isolation";
  useEffect(() => {
    if (!ref.current) return;
    let base;
    if (isFilter) // apply to a photo — brightness/contrast/sepia/hue-rotate read far better on an image
      base = "width:160px;height:110px;border-radius:12px;background:url(assets/photo.jpg) center/cover;";
    else if (isBackdrop) // a translucent pane that filters the busy content behind it
      base = "width:160px;height:110px;border-radius:12px;background:color-mix(in srgb,#fff 14%,transparent);border:1px solid color-mix(in srgb,#fff 30%,transparent);";
    else if (isIso) // a TRANSPARENT box over the conic backdrop holding a mix-blend child:
      // with isolation:auto the box forms no stacking context, so the difference-blend
      // child blends through to the conic backdrop (vivid inversion); with isolation:isolate
      // the box becomes a new isolated stacking context, cutting the backdrop out of the
      // blend so the child only blends against transparent (a flat, muted patch).
      base = "position:relative;width:150px;height:96px;border-radius:12px;overflow:hidden;background:transparent;";
    else
      base = "width:150px;height:96px;border-radius:12px;background:linear-gradient(140deg,var(--accent),color-mix(in srgb,var(--accent) 50%,#000));";
    let css = value.css || "";
    if (isFilter) {
      // The grammar emits identity factors (brightness(1)/contrast(1)/opacity(1)/
      // saturate(1)) which are no-ops, so they render identical to none. Swap each
      // for a visibly non-identity factor so the value reads as a real filter.
      css = css
        .replace(/brightness\(1\)/g, "brightness(1.6)")
        .replace(/contrast\(1\)/g, "contrast(2)")
        .replace(/opacity\(1\)/g, "opacity(0.4)")
        .replace(/saturate\(1\)/g, "saturate(3)");
      // A raster url() is not a valid <filter> reference, so Chrome drops it to none.
      // Repoint it at the inline SVG <filter id="cdx-filter"> defined below so the
      // url() form actually filters (a saturate + blur compound).
      css = css.replace(/url\([^)]*\)/g, "url(#cdx-filter)");
    }
    ref.current.style.cssText = base + css;
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
        <div style={backdrop}><div ref={ref}>
          {isIso && <div style={{ position: "absolute", inset: "18px", borderRadius: "10px", background: "#e8e8e8", mixBlendMode: "difference" }} />}
        </div></div>
        {isFilter &&
          // A real inline SVG <filter> so the filter:url(...) value resolves to a
          // visible effect (saturation boost + blur) instead of the no-op a raster
          // url() reference produces. Zero-sized + absolute so it adds no layout.
          <svg width="0" height="0" style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
            <filter id="cdx-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feColorMatrix type="saturate" values="2.6" />
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </svg>}
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint={isIso ? "A difference-blend patch over a rainbow backdrop: isolation:auto lets it blend through (vivid inversion); isolation:isolate forms a new stacking context so it only blends inside the box (flat patch)." : undefined} />
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
  const svgShapeRef = useRef(null);
  const n = property.name;
  useEffect(() => {
    // transform-box renders a REAL SVG graphic below; the value goes on the <rect>
    // (carrying a transform + offset transform-origin) so fill-box / stroke-box /
    // view-box pivot around different reference boxes.
    if (n === "transform-box") {
      if (svgShapeRef.current) svgShapeRef.current.style.cssText = "transform:rotate(40deg);transform-origin:0 0;" + (value.css || "");
      return;
    }
    if (!ref.current) return;
    // top half light / bottom half dark + an up-arrow so x/y/z rotation and
    // flips are unmistakable; gridlines give the 3D tilt depth.
    let base = "width:120px;height:84px;border-radius:10px;background:linear-gradient(180deg,#ec6a5e 0 50%,#23306b 50% 100%);display:grid;place-items:center;color:#fff;font:700 22px var(--mono);box-shadow:0 16px 30px -14px color-mix(in srgb,var(--accent) 60%,transparent);backface-visibility:inherit;position:relative;";
    // rotate: the card is a real 3D SLAB (preserve-3d + a back face pushed in Z below)
    // so even edge-on 90deg flips around x / y / a diagonal axis keep the slab's depth
    // and tilt direction visible instead of collapsing to one identical thin line.
    if (n === "rotate") base += "transform-style:preserve-3d;";
    else if (n === "backface-visibility") base += "transform:rotateY(165deg);";
    // transform-origin: a real 3D tilt (rotateX+rotateY) so the Z component of the
    // origin changes the projection — 'left top 24px' vs '…48px' vs '…64px' tilt and
    // scale differently instead of all reading as the same flat 2D pivot.
    else if (n === "transform-origin") base += "transform:rotateX(50deg) rotateY(-20deg);";
    else if (n === "transform-style") base += "transform:rotateY(34deg);";
    else if (n === "perspective-origin") base += "transform:rotateX(38deg);";
    ref.current.style.cssText = base + (value.css || "");
    if (sceneRef.current && n === "perspective-origin") sceneRef.current.style.cssText = "perspective:420px;width:100%;height:100%;display:grid;place-items:center;" + (value.css || "");
    // translate / transform: give the STAGE a near, off-centre perspective so the Z
    // component is unmistakable. A short focal length (260px) makes translateZ scale the
    // card a lot (8px vs 64px is a big size change), and an off-centre perspective-origin
    // makes that depth ALSO shift the card sideways/up — so each of the 5 Z-variants lands
    // at a distinct size AND position instead of overlapping. preserve-3d keeps ref in 3D.
    else if (sceneRef.current && (n === "translate" || n === "transform"))
      sceneRef.current.style.cssText = "perspective:260px;perspective-origin:18% 22%;transform-style:preserve-3d;display:grid;place-items:center;";
  });
  return (
    <React.Fragment>
      <div className="glass" style={{ perspective: "460px" }}>
        <span className="glass-label">{n}</span>
        <div ref={sceneRef} style={{ transformStyle: "preserve-3d", display: "grid", placeItems: "center" }}>
          {n === "transform-box"
            ? (
              // a REAL SVG graphic: explicit viewBox, a wide stroke and a fill, with a big
              // padding+border on the host. fill-box (geometry box) / stroke-box (stroke-
              // inclusive) / view-box (SVG viewport) pivot the rotation around different
              // boxes; the padding+border separate content-box from border-box — so all
              // five values land the square at a visibly different angle.
              <div style={{ padding: "26px", border: "14px solid color-mix(in srgb,var(--accent) 35%,transparent)", borderRadius: "10px", background: "var(--bg-3)" }}>
                <svg width="120" height="84" viewBox="0 0 120 84" style={{ overflow: "visible" }}>
                  <rect ref={svgShapeRef} x="34" y="22" width="52" height="40" fill="#ec6a5e" stroke="#23306b" strokeWidth="14" />
                </svg>
              </div>
            )
            : (
              <div ref={ref}>
                {n === "transform-style"
                  ? <div style={{ width: "54px", height: "54px", margin: "15px", borderRadius: "8px", background: "#f0c24b", transform: "rotateY(60deg) translateZ(26px)", display: "grid", placeItems: "center", color: "#222", font: "700 16px var(--mono)" }}>3D</div>
                  : "↑"}
                {n === "rotate" &&
                  <div style={{ position: "absolute", inset: 0, borderRadius: "10px", background: "linear-gradient(180deg,#3a7d6b 0 50%,#0f1740 50% 100%)", transform: "translateZ(-16px)", display: "grid", placeItems: "center", color: "#fff", font: "700 22px var(--mono)" }}>↓</div>}
              </div>
            )}
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
    // OFFSET-PATH gives the rider a thick BORDER + PADDING with box-sizing:content-box,
    // so content-box / padding-box / border-box become three different-sized reference
    // boxes — the shape paths (circle/ellipse/inset/polygon) then resolve to visibly
    // different geometry per <coord-box> keyword. background-clip:content-box leaves the
    // translucent border ring visible so the box layers are literally on screen.
    // Other offset-* props keep the small 28×16 arrow so anchor/position/rotate still read.
    let base = ownPath
      ? "position:absolute;left:0;top:0;box-sizing:content-box;width:20px;height:12px;padding:24px;"
        + "border:20px solid color-mix(in srgb,var(--accent) 45%,transparent);background:var(--accent);"
        + "background-clip:content-box;offset-rotate:auto;offset-distance:30%;"
      : "position:absolute;left:0;top:0;width:28px;height:16px;background:var(--accent);"
        + "box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 28%,transparent);clip-path:polygon(0 0,68% 0,100% 50%,68% 100%,0 100%);offset-rotate:auto;";
    // offset-position is INERT when offset-path is none (the box just stays at its CSS
    // position), so every value collided. Give it a basic-shape path with NO `at <pos>`:
    // a bare circle() is centred on the element's OFFSET-POSITION, so left/center/right/
    // top/bottom and the length/% values each move the whole circular motion path — and
    // thus the rider — to a visibly different origin. offset-distance picks a point on it.
    if (posMode) base += "offset-path:circle(34px);offset-distance:25%;";  // value sets offset-position (circle centre)
    else if (!ownPath) base += `offset-path:path('${OFFSET_PATH}');offset-distance:50%;`;
    // offset-path's url() values name an SVG that must carry a referenceable <path>.
    // A JPEG has none, so url(assets/photo.jpg) silently degrades to `none` (rider
    // pinned top-left, no curve) — making indices 8-14/44 collide with each other AND
    // with `none`. Re-point them at the same-document <path id=cdxoffpath> below, which
    // traces a distinct S-wave so the url() family rides a visible, separate geometry.
    // The `offset` SHORTHAND value always carries `none` in its offset-path slot, which
    // resets offset-path to none and leaves the value's offset-distance / offset-rotate /
    // trailing <offset-anchor> with nothing to act on — all 50 cells became one static
    // arrow. Re-assert the real arc AFTER the shorthand (last declaration wins) so the
    // distance moves the rider along it, the rotate turns the arrow, and each <offset-anchor>
    // (auto/left/right/top/bottom/center/%/two-keyword) shifts WHICH box-point rides the
    // path — making the anchor variants render distinctly.
    const pathFix = n === "offset" ? `;offset-path:path('${OFFSET_PATH}');` : "";
    const css = (value.css || "").replace(/url\(assets\/photo\.jpg\)/g, "url(#cdxoffpath)") + pathFix;
    ref.current.style.cssText = base + css;
  });
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">{n}</span>
        <div style={{ position: "relative", width: "240px", height: "112px" }}>
          {fixedGuide && <svg width="240" height="112" style={{ position: "absolute", inset: 0 }}>
            <path d={OFFSET_PATH} fill="none" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="3 4" />
          </svg>}
          {ownPath && <svg width="240" height="112" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {/* Referenceable SVG path for offset-path: url(#cdxoffpath). The S-wave is
                deliberately unlike the arc the basic-shape cells use, so the url() rows
                ride a distinct, visible curve instead of collapsing to none. A faint
                stroke shows the traced route in the cell. */}
            <path id="cdxoffpath" d="M10,90 C 60,8 100,176 150,90 S 220,12 230,84"
                  fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="2 5" />
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
  const refB = useRef(null);
  const anchorRef = useRef(null);
  const n = property.name;
  // The anchor is named --my-var (matching the generator's dashed-ident rep) and
  // the chip references --my-var, so anchor-name / position-anchor wire UP only
  // when the value is --my-var (vs none/auto → the chip can't anchor → fallback).
  const scopeRef = useRef(null);
  // anchor-scope drives its OWN scene (two same-named anchors per name in/out of a
  // scoping wrapper) — see the `scope` branch below. anchor-name still rides the chip.
  const scope = n === "anchor-scope";
  // position-area needs the chip to GROW into the spanned region so span-extents and
  // start/end cells read as different sizes instead of one point-sized chip.
  const parea = n === "position-area";
  const onAnchor = n === "anchor-name";
  useEffect(() => {
    if (scope) {
      // value (anchor-scope: none | all | --my-var) goes on the scoping wrapper.
      if (scopeRef.current) scopeRef.current.style.cssText =
        "position:absolute;top:8px;right:8px;width:104px;height:104px;border:1px dashed var(--line-strong);border-radius:9px;" + (value.css || "");
      return;
    }
    if (!ref.current) return;
    let chip;
    if (parea) {
      // TWO anchored chips share the SAME position-area value but carry CONTRASTING
      // writing modes. The CONTAINING BLOCK is vertical-rl + rtl, so non-self logical
      // keywords (y-start/y-end…, CB-resolved) flip off the physical top/bottom — both
      // chips agree on those. self-* keywords resolve against EACH CHIP's OWN mode:
      //   chip A horizontal-tb  → self-y-start = TOP
      //   chip B vertical-rl+rtl → self-y-start = BOTTOM
      // so a self-* value SPLITS the two chips to opposite vertical edges, while a
      // physical value (both at the physical edge) or a non-self value (both CB-resolved)
      // keeps them TOGETHER. That split is the unique signature that separates the
      // self-* keywords from the physical and non-self ones they previously collided with.
      // auto-size + stretch keeps each chip filling the spanned region so span-extents read.
      const pbase = "position:absolute;position-anchor:--my-var;box-sizing:border-box;width:auto;height:auto;min-width:0;min-height:0;justify-self:stretch;align-self:stretch;border-radius:5px;color:#fff;font:600 9px var(--mono);";
      ref.current.style.cssText = pbase + "writing-mode:horizontal-tb;background:color-mix(in srgb,var(--accent) 30%,transparent);border:1.5px solid var(--accent);" + previewCss(n, value.css);
      if (refB.current) refB.current.style.cssText = pbase + "writing-mode:vertical-rl;direction:rtl;background:color-mix(in srgb,#2f5fd0 30%,transparent);border:1.5px dashed #6f9bff;" + previewCss(n, value.css);
      chip = "";
    } else {
      chip = "position:absolute;position-anchor:--my-var;margin:5px;background:var(--accent);color:#fff;font:600 11px var(--mono);padding:4px 9px;border-radius:5px;white-space:nowrap;";
      if (!/^position$|position-try/.test(n)) chip += "position-area:top span-right;";
      // chip carries the value for position-* props; for anchor-name the value goes
      // on the ANCHOR instead (previewCss blanks the hang-prone tries).
      ref.current.style.cssText = chip + (onAnchor ? "" : previewCss(n, value.css));
    }
    if (anchorRef.current) anchorRef.current.style.cssText =
      "anchor-name:--my-var;width:44px;height:30px;border-radius:7px;background:color-mix(in srgb,var(--accent) 22%,var(--bg-3));border:1px solid var(--accent-line);display:grid;place-items:center;font-family:var(--mono);font-size:9px;color:var(--ink-2);"
      + (onAnchor ? value.css : "");
  });
  if (scope) {
    // Two anchors share --my-var (one INSIDE the scoping wrapper, one outside) and two
    // share --other likewise. Each tooltip resolves to the LAST in-scope anchor of its
    // name before it in tree order. none → both tips land on the INNER anchors;
    // --my-var confines only --my-var (tip1 falls back to its OUTER anchor, tip2 stays
    // inner); all confines every name (both tips fall back to their OUTER anchors).
    return (
      <React.Fragment>
        <div className="glass">
          <span className="glass-label">{n}</span>
          <style>{`
            .asx-frame{position:relative;width:230px;height:150px;font-family:var(--mono);font-size:9px}
            .asx-anc{position:absolute;width:30px;height:22px;display:grid;place-items:center;border-radius:6px;background:color-mix(in srgb,var(--accent) 20%,var(--bg-3));border:1px solid var(--accent-line);color:var(--ink-2)}
            .asx-outer-a{top:8px;left:8px;anchor-name:--my-var}
            .asx-outer-b{bottom:8px;left:8px;anchor-name:--other}
            .asx-inner-a{top:8px;left:8px;anchor-name:--my-var}
            .asx-inner-b{bottom:8px;left:8px;anchor-name:--other}
            .asx-tip{position:absolute;padding:2px 6px;border-radius:5px;color:#fff;font-weight:600;white-space:nowrap}
            .asx-tip1{position-anchor:--my-var;position-area:bottom span-right;background:#c5483c}
            .asx-tip2{position-anchor:--other;position-area:bottom span-right;background:#2f5fd0}
          `}</style>
          <div className="asx-frame">
            <div className="asx-anc asx-outer-a">A</div>
            <div className="asx-anc asx-outer-b">B</div>
            <div ref={scopeRef}>
              <div className="asx-anc asx-inner-a">a</div>
              <div className="asx-anc asx-inner-b">b</div>
            </div>
            <div className="asx-tip asx-tip1">--my-var</div>
            <div className="asx-tip asx-tip2">--other</div>
          </div>
        </div>
        <LiveControls property={property} value={value} onChange={onChange}
          hint="Two anchors per name (inner/outer of the dashed scope). none keeps both inner; --my-var confines only --my-var; all confines every name — so each tooltip jumps to a different anchor." />
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      <div className="glass">
        <span className="glass-label">{n}</span>
        <div style={{ position: "relative", width: "230px", height: "150px", display: "grid", placeItems: "center", writingMode: parea ? "vertical-rl" : undefined, direction: parea ? "rtl" : undefined }}>
          <div ref={anchorRef}>⚓</div>
          <div ref={ref}>{parea ? "A" : "chip"}</div>
          {parea ? <div ref={refB}>B</div> : null}
        </div>
      </div>
      <LiveControls property={property} value={value} onChange={onChange}
        hint={parea ? "Two chips share the value: A (horizontal) and B (vertical-rl rtl). self-* keywords split A and B to opposite edges; physical and y-start/y-end keep them together — so self/non-self/physical no longer collide." : "The chip is tethered to the named anchor; the value decides whether/where it lands."} />
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
  // container / container-name / container-type: a query container holding FOUR
  // independent probe children, each lit by its own @container rule, so every
  // axis of the value becomes observable:
  //   A  @container my-ident (min-width) -> name is my-ident (needs a size container)
  //   B  @container tag-a    (min-width) -> name is tag-a    (needs a size container)
  //   H  @container (min-height)         -> type carries the BLOCK axis  -> size (not inline-size)
  //   S  @container scroll-state(scrollable: bottom) -> type carries scroll-state
  // The container scrolls (overflow:auto + a spacer) so the scroll-state query resolves
  // in a still frame. none/my-ident/tag-a, size/inline-size, and scroll-state all diverge.
  const query = n === "container" || n === "container-name" || n === "container-type";
  useEffect(() => {
    if (!ref.current) return;
    if (query) {
      // container-name varies only the NAME (fix type to inline-size so only A/B move);
      // container-type varies only the TYPE (fix name to my-ident so A doubles as a
      // query-container probe); the shorthand carries BOTH axes straight from value.css.
      const base = n === "container-name"
        ? "container-type:inline-size;" + (value.css || "")          // name from value
        : n === "container-type"
        ? "container-name:my-ident;" + (value.css || "")            // type from value
        : (value.css || "");                                        // shorthand: name + type
      ref.current.style.cssText = "width:204px;height:188px;box-sizing:border-box;border:1px solid var(--line);border-radius:8px;padding:8px;background:var(--bg-3);overflow:auto;" + base;
    } else {
      ref.current.style.cssText = "width:170px;min-height:46px;border:1px solid var(--line);border-radius:8px;padding:10px;background:var(--bg-3);font-family:var(--serif);font-size:14px;line-height:1.5;color:var(--ink);overflow:hidden;" + (value.css || "");
    }
  });
  if (query) {
    return (
      <React.Fragment>
        <div className="glass"><span className="glass-label">{n}</span>
          <style>{`@container my-ident (min-width: 0px){.cdxq-a{background:#c5483c !important;color:#fff !important;border-color:#c5483c !important}}@container tag-a (min-width: 0px){.cdxq-b{background:#3c7dc5 !important;color:#fff !important;border-color:#3c7dc5 !important}}@container (min-width: 0px){.cdxq-w{background:#8a63d2 !important;color:#fff !important;border-color:#8a63d2 !important}}@container (min-height: 0px){.cdxq-h{background:#4c9a52 !important;color:#fff !important;border-color:#4c9a52 !important}}@container my-ident scroll-state(scrollable: bottom){.cdxq-na{background:#e07b39 !important;color:#fff !important;border-color:#e07b39 !important}}@container tag-a scroll-state(scrollable: bottom){.cdxq-nb{background:#2aa6a0 !important;color:#fff !important;border-color:#2aa6a0 !important}}@container scroll-state(scrollable: bottom){.cdxq-s{background:#d4a017 !important;color:#1a1a2e !important;border-color:#d4a017 !important}}`}</style>
          <div ref={ref}>
            {[["cdxq-a", "A · name my-ident"], ["cdxq-b", "B · name tag-a"], ["cdxq-w", "W · inline-size axis"], ["cdxq-h", "H · block-size axis"], ["cdxq-na", "NA · my-ident scroll-state"], ["cdxq-nb", "NB · tag-a scroll-state"], ["cdxq-s", "S · scroll-state"]].map(([c, t]) => (
              <div key={c} className={c} style={{ padding: "3px 6px", margin: "2px 0", borderRadius: "5px", border: "1px dashed var(--line-strong)", background: "var(--bg-2)", color: "var(--ink-3)", fontFamily: "var(--mono)", fontSize: "11px", whiteSpace: "nowrap" }}>{t}</div>
            ))}
            <div style={{ height: "60px" }} aria-hidden="true" />
          </div>
        </div>
        <LiveControls property={property} value={value} onChange={onChange}
          hint="Seven @container probes: A/B fire on the name via width, W on the inline-size axis, H on the (block) size axis, NA/NB on name+scroll-state, S on scroll-state — so name, both size axes and scroll-state are all visible." />
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
  const kind = n === "box-decoration-break" ? "decobreak"
    : n === "baseline-source" ? "baseline-source"
    : /^box-/.test(n) ? "box"
    : /^ruby/.test(n) ? "ruby"
    : /^math-/.test(n) ? "math"
    : n === "hanging-punctuation" ? "hang"
    : n === "interactivity" ? "interact"
    : n === "overlay" ? "overlay"
    : n === "user-modify" ? "usermod"
    : n === "content" ? "content"
    : n === "interpolate-size" ? "interpsize"
    : /^interest-delay/.test(n) ? "interest"
    : ["vertical-align", "line-clamp", "quotes", "initial-letter", "all", "line-height-step"].includes(n) ? n : "plain";
  useEffect(() => {
    if (!ref.current) return;
    const v = value.css || "";
    if (kind === "vertical-align") ref.current.style.cssText = "display:inline-block;width:16px;height:16px;border-radius:4px;background:var(--accent);" + v;
    else if (kind === "line-clamp") { const m = v.match(/(\d+)/); ref.current.style.cssText = "width:190px;font-family:var(--serif);font-size:15px;line-height:1.5;color:var(--ink);display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;" + (m ? "-webkit-line-clamp:" + m[1] + ";line-clamp:" + m[1] + ";" : ""); }
    // legacy box-* only work prefixed (-webkit-box-*); translate the value.
    // orient/pack/align/direction/lines are CONTAINER props; flex/ordinal-group/
    // flex-group are CHILD props applied to the highlighted first child.
    else if (kind === "box") {
      const childProp = /box-flex|box-ordinal-group|box-flex-group/.test(n);
      const wv = v.replace(/(^|;)\s*box-/g, "$1-webkit-box-");
      // box-flex / box-flex-group need a WIDE container (more free space to distribute) so the
      // highlighted child's share spreads across a large, punchy range instead of a few pixels.
      const cw = (n === "box-flex" || n === "box-flex-group") ? "300px" : "200px";
      ref.current.style.cssText = "display:-webkit-box;width:" + cw + ";height:110px;border:1px dashed var(--line-strong);border-radius:8px;padding:6px;-webkit-box-orient:horizontal;-webkit-box-pack:start;-webkit-box-align:stretch;-webkit-box-direction:normal;" + (childProp ? "" : wv);
      // box-ordinal-group: the tested box is the LAST child, slotting among fixed-group siblings 1..5;
      // box-flex / box-flex-group: applied to the highlighted first child.
      const target = n === "box-ordinal-group" ? ref.current.lastElementChild : ref.current.firstElementChild;
      // box-flex-group only does anything when the highlighted child is itself flexible: it then
      // competes against the fixed group-3 threshold sibling, so its group number decides who wins
      // the free space (group < 3 -> wide, == 3 -> shared, > 3 -> narrow).
      if (childProp && target) target.style.cssText += ";" + (n === "box-flex-group" ? "-webkit-box-flex:1;" : "") + wv;
    }
    else if (kind === "decobreak") ref.current.style.cssText = "color:#fff;font-weight:600;background:var(--accent);border:2px solid rgba(255,255,255,0.45);border-radius:10px;padding:3px 9px;box-shadow:0 0 0 2px var(--accent-line);-webkit-box-decoration-break:slice;box-decoration-break:slice;" + v + v.replace(/box-decoration-break/g, "-webkit-box-decoration-break");
    else if (kind === "baseline-source") ref.current.style.cssText = "display:inline-block;vertical-align:baseline;margin:0 5px;padding:0 5px;border-radius:4px;background:var(--accent);color:#fff;font-size:13px;line-height:1.3;text-align:center;" + v;
    else if (kind === "ruby") ref.current.style.cssText = "font-family:'Codex CJK',var(--serif);font-size:26px;line-height:3.6;color:var(--ink);" + v;
    else if (kind === "math" && n === "math-depth") ref.current.style.cssText = "font-size:math;color:var(--accent);font-weight:600;" + v;
    else if (kind === "math") ref.current.style.cssText = "font-size:26px;color:var(--ink);" + v;
    else if (kind === "quotes") ref.current.style.cssText = "font-family:var(--serif);font-size:19px;color:var(--ink);" + v;
    else if (kind === "initial-letter") ref.current.style.cssText = "font-family:var(--serif);font-size:15px;line-height:1.4;width:200px;color:var(--ink);";
    else if (kind === "all") ref.current.style.cssText = v;
    // line-height-step rounds EACH line box up to the next multiple of the step. With one short
    // line every value looks the same, so apply it to a fixed-width paragraph at font-size 17px
    // (natural line-height ~22px) that wraps to several lines: 8px->24px, 16px->32px, 24px->24px,
    // 48px->48px, 64px->64px line boxes give visibly different spacing and total block heights.
    else if (kind === "line-height-step") ref.current.style.cssText = "width:280px;font-family:var(--serif);font-size:17px;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:10px 12px;background:var(--bg-3);-webkit-line-height-step:0;" + v;
    else if (kind === "hang") ref.current.style.cssText = "width:14em;font-family:var(--serif);font-size:17px;line-height:1.7;color:var(--ink);text-align:justify;hyphens:none;border:1px solid var(--accent-line);border-radius:8px;padding:10px;background:var(--bg-3);" + v;
    // interactivity goes on the WRAPPER so its whole subtree (the field, the button)
    // becomes inert — auto lets you focus & type; inert blocks focus/typing/clicks/selection.
    else if (kind === "interact") ref.current.style.cssText = "display:flex;flex-direction:column;gap:11px;width:250px;align-items:stretch;" + v;
    // interest-delay goes on the INVOKER (the interestfor button): hover/focus it and
    // after the start delay its popover target appears; on leaving, the end delay holds.
    else if (kind === "interest") ref.current.style.cssText = "padding:10px 16px;font-family:var(--sans);font-size:14px;color:#fff;background:var(--accent);border:none;border-radius:8px;cursor:pointer;" + v;
    // overlay goes on the POPOVER: it keeps the top-layer element PAINTED in the top
    // layer while it animates out (transition overlay allow-discrete) — vs dropping
    // below the page the instant it closes. The button toggles the popover.
    else if (kind === "overlay") ref.current.style.cssText = "margin:0;inset:auto;position:fixed;left:50%;top:48%;transform:translate(-50%,-50%);padding:14px 18px;border-radius:12px;border:1px solid var(--accent-line);background:var(--bg-2);color:var(--ink);font-family:var(--sans);font-size:13px;max-width:220px;box-shadow:var(--shadow);transition:overlay 0.5s allow-discrete, opacity 0.5s ease, transform 0.5s ease;" + v;
    // user-modify (legacy, -webkit-prefixed): read-write makes the box editable like a
    // contenteditable; read-only blocks it. Click in and type to feel the difference.
    else if (kind === "usermod") ref.current.style.cssText = "padding:12px 14px;min-width:230px;min-height:46px;font-size:16px;font-family:var(--mono);color:var(--ink);background:var(--bg-3);border:1px dashed var(--line-strong);border-radius:8px;outline:none;" + v + v.replace(/(^|;)\s*user-modify/g, "$1-webkit-user-modify");
    // content goes on a ::before (the body injects the rule); the element only needs a frame.
    else if (kind === "content") ref.current.style.cssText = "font-family:var(--serif);font-size:18px;color:var(--ink-2);padding:10px 14px;border:1px solid var(--accent-line);border-radius:8px;background:var(--bg-3);min-height:28px;display:inline-flex;align-items:center;gap:8px;";
    else if (kind === "interpsize") { /* styled entirely by the body's <style> + inline; nothing to set here */ }
    else ref.current.style.cssText = "width:170px;min-height:60px;border:1px solid var(--line);border-radius:8px;padding:10px;background:var(--bg-3);font-family:var(--serif);font-size:15px;color:var(--ink);" + v;
  });
  let body;
  if (kind === "vertical-align") body = <p style={{ margin: 0, fontFamily: "var(--serif)", fontSize: "58px", lineHeight: 1.1, color: "var(--ink)", borderBottom: "1px solid var(--accent-line)" }}>Hg<span ref={ref} />xÿ</p>;
  else if (kind === "line-clamp") body = <p ref={ref} style={{ margin: 0 }}>The codex clamps this specimen paragraph to a fixed number of lines and appends an ellipsis so the overflow is truncated cleanly across the measure.</p>;
  else if (kind === "box" && n === "box-ordinal-group") body = <div ref={ref}>{[1, 2, 3, 4, 5].map((g) => <div key={g} style={{ WebkitBoxOrdinalGroup: String(g), background: "var(--bg-3)", border: "1px solid var(--line)", borderRadius: "5px", margin: "2px", padding: "6px 8px", color: "var(--ink-3)", fontFamily: "var(--mono)", fontSize: "11px" }}>{g}</div>)}<div style={{ background: "var(--accent)", border: "1px solid var(--accent)", borderRadius: "5px", margin: "2px", padding: "6px 8px", color: "#fff", fontFamily: "var(--mono)", fontSize: "11px" }}>★</div></div>;
  else if (kind === "box" && n === "box-flex-group") body = <div ref={ref}><div style={{ background: "var(--accent)", border: "1px solid var(--accent)", borderRadius: "5px", margin: "2px", padding: "6px 8px", color: "#fff", fontFamily: "var(--mono)", fontSize: "11px", whiteSpace: "nowrap" }}>★</div><div style={{ WebkitBoxFlex: 1, WebkitBoxFlexGroup: 3, background: "var(--bg-3)", border: "1px solid var(--line)", borderRadius: "5px", margin: "2px", padding: "6px 8px", color: "var(--ink-3)", fontFamily: "var(--mono)", fontSize: "11px", whiteSpace: "nowrap" }}>g3</div>{[1, 2].map((i) => <div key={i} style={{ background: "var(--bg-3)", border: "1px solid var(--line)", borderRadius: "5px", margin: "2px", padding: "6px 8px", color: "var(--ink-3)", fontFamily: "var(--mono)", fontSize: "11px" }}>·</div>)}</div>;
  else if (kind === "box") body = <div ref={ref}>{[1, 2, 3].map((i) => <div key={i} style={{ background: `color-mix(in srgb,var(--accent) ${i * 22}%,var(--bg-3))`, border: "1px solid var(--line)", borderRadius: "5px", margin: "2px", padding: "6px 10px", color: "var(--ink-2)", fontFamily: "var(--mono)", fontSize: "11px" }}>{i}</div>)}</div>;
  else if (kind === "ruby") body = <ruby ref={ref}><ruby>漢字<rt>かんじ</rt></ruby><rt>kanji</rt></ruby>;
  else if (kind === "math" && n === "math-depth") body = <math display="block" style={{ fontSize: "34px", color: "var(--ink)", lineHeight: 1 }}><mtext>A</mtext><mspace width="0.5em" /><mtext ref={ref}>A</mtext></math>;
  else if (kind === "math") body = <math ref={ref} display="block"><mfrac><mrow><msup><mi>x</mi><mn>2</mn></msup></mrow><mrow><mi>y</mi></mrow></mfrac><mo>+</mo><msqrt><mi>z</mi></msqrt></math>;
  else if (kind === "quotes") body = <div style={{ quotes: '"\\00AB" "\\00BB" "\\2039" "\\203A"' }}><p ref={ref} style={{ margin: 0 }}>A <q>nested <q>quote</q> here</q> end</p></div>;
  else if (kind === "initial-letter") { const il = (value.css || "").replace(/;\s*$/, ""); body = <React.Fragment><style>{`.cdx-il::first-letter{${il};-webkit-${il};}`}</style><p ref={ref} className="cdx-il" style={{ margin: 0 }}>Codex drop-cap specimen text wraps around the raised initial letter for several lines of running copy so the cap size and sink depth stay visible.</p></React.Fragment>; }
  else if (kind === "all") body = <React.Fragment><style>{`@layer cdxbase{.cdx-all{color:#3aa3c2;border:2px dotted #3aa3c2;padding:4px 8px}}.cdx-all{color:#c5483c;border:2px solid #c5483c;padding:8px 14px;font-style:italic}`}</style><div style={{ color: "#4c9a52", fontFamily: "var(--serif)", fontSize: "15px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}><span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--ink-3)" }}>parent inherits green</span><button ref={ref} className="cdx-all">Specimen</button></div></React.Fragment>;
  else if (kind === "decobreak") body = <p style={{ margin: 0, width: "210px", fontFamily: "var(--serif)", fontSize: "18px", lineHeight: 2.0 }}><span ref={ref}>Codex specimen text that wraps across several lines so every fragment shows its own edges.</span></p>;
  else if (kind === "baseline-source") body = <p style={{ margin: 0, fontFamily: "var(--serif)", fontSize: "22px", lineHeight: 1.3, color: "var(--ink)", borderBottom: "1px solid var(--accent-line)" }}>ab<span ref={ref}>first<br />last</span>cd</p>;
  else if (kind === "line-height-step") body = <p ref={ref} style={{ margin: 0 }}>The codex snaps each line box up to the nearest multiple of the step, so this wrapped specimen paragraph gains a measured vertical rhythm that spreads its lines apart as the step grows.</p>;
  else if (kind === "hang") body = <p ref={ref} style={{ margin: 0 }}>«Codex marginalia, hung at the very edges: openers slip left, while stops, commas, colons; and the closing period all drift past the right rule.»</p>;
  else if (kind === "overlay") body = (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "center", padding: "8px" }}>
      <button data-codex-trigger="click" popovertarget="cdx-overlay-pop" style={{ padding: "10px 16px", fontFamily: "var(--sans)", fontSize: "14px", color: "#fff", background: "var(--accent)", border: "none", borderRadius: "8px", cursor: "pointer" }}>open pop-up ▸</button>
      <div ref={ref} id="cdx-overlay-pop" popover="auto">
        Codex pop-up in the <b>top layer</b>.<br />overlay: {value.value}
      </div>
      <p style={{ margin: 0, fontSize: "12.5px", color: "var(--ink-2)", lineHeight: 1.5, textAlign: "center" }}>
        Click to toggle the pop-up — it closes with a smooth fade because <code>transition: overlay allow-discrete</code> keeps it painted in the top layer while it animates out. <b>overlay's value is set by the browser</b> (<code>auto</code> while in the top layer, <code>none</code> otherwise) and can't be authored, so the two chips render identically — its only authoring use is naming it in a <code>transition</code>.
      </p>
    </div>
  );
  else if (kind === "usermod") body = <div ref={ref}>Codex — when <b>user-modify</b> is read-write you can click in and type; read-only blocks editing.</div>;
  else if (kind === "content") body = (
    <React.Fragment>
      <style>{`.cdx-content-demo::before{${value.css.replace(/;?\s*$/, "")};color:var(--accent);font-weight:600;margin-right:8px}`}</style>
      <div ref={ref} className="cdx-content-demo"><span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--ink-3)" }}>← ::before content: {value.value}</span></div>
    </React.Fragment>
  );
  else if (kind === "interpsize") body = (
    <React.Fragment>
      <style>{`.cdx-isz{${value.css.replace(/;?\s*$/, "")};transition:width .6s ease;width:120px}.cdx-isz:hover{width:max-content}`}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
        <div ref={ref} className="cdx-isz" style={{ overflow: "hidden", whiteSpace: "nowrap", padding: "12px 16px", border: "1px solid var(--accent-line)", borderRadius: "8px", background: "var(--bg-3)", color: "var(--ink)", fontFamily: "var(--mono)", fontSize: "15px" }}>Codex — hover me to grow to fit</div>
        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--ink-2)", lineHeight: 1.5, textAlign: "center" }}><b>interpolate-size: {value.value}</b> — hover the box; <code>allow-keywords</code> animates its width smoothly to <code>max-content</code>, <code>normal</code> jumps.</p>
      </div>
    </React.Fragment>
  );
  else if (kind === "interest") body = (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "center", padding: "8px" }}>
      <button ref={ref} interestfor="cdx-interest-tgt">hover or focus me</button>
      <div id="cdx-interest-tgt" popover="auto" style={{ margin: 0, inset: "auto", padding: "10px 14px", borderRadius: "9px", border: "1px solid var(--accent-line)", background: "var(--bg-2)", color: "var(--ink)", fontFamily: "var(--sans)", fontSize: "13px", maxWidth: "210px", boxShadow: "var(--shadow)" }}>
        Codex preview popover — appears after <b>interest-delay-start</b>, dismisses after <b>interest-delay-end</b>.
      </div>
      <p style={{ margin: 0, fontSize: "12.5px", color: "var(--ink-2)", lineHeight: 1.5, textAlign: "center" }}>
        <b>{n}: {value.value}</b><br />Hover or focus the button — after the start delay the preview pops; on leaving, the end delay holds it before it dismisses.
      </p>
    </div>
  );
  else if (kind === "interact") body = (
    <div ref={ref}>
      <input defaultValue="Codex — try typing" style={{ padding: "10px 12px", fontSize: "15px", fontFamily: "var(--mono)", color: "var(--ink)", background: "var(--bg-3)", border: "1px solid var(--line-strong)", borderRadius: "8px", outline: "none" }} />
      <button style={{ padding: "9px 14px", fontFamily: "var(--sans)", fontSize: "14px", color: "#fff", background: "var(--accent)", border: "none", borderRadius: "8px", cursor: "pointer" }}>button</button>
      <p style={{ margin: 0, fontSize: "12.5px", color: "var(--ink-2)", lineHeight: 1.5 }}>
        <b>interactivity: {value.value}</b> — <code>auto</code> lets you focus & type the field and click the button; <code>inert</code> makes this whole block non-interactive (no focus, typing, clicks or text selection).
      </p>
    </div>
  );
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
  // sticky/fixed position, background-attachment & content-visibility only mean
  // something while scrolling — route them to the scroll-context demo (live.jsx).
  if (["position", "background-attachment", "content-visibility"].includes(property.name)) return window.ScrollContextDemo;
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
