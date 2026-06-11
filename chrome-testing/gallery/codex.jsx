/* ============================================================
   THE CSS CODEX — app shell, routing & screens
   ============================================================ */
const { createRoot } = ReactDOM;

/* strip inline markup → plain text (for list rows, search, anywhere not rendered
   as HTML); the full property page renders the description as rich HTML instead. */
function plainText(htmlStr) {
  return (htmlStr || "").replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

/* status icons (MDN's Lucide glyphs, inlined so they take the status colour via
   currentColor): flask = experimental, trash = deprecated, triangle = non-standard. */
const ICON_SVG = (d) => <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
const FlaskIcon = () => ICON_SVG("M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2M6.453 15h11.094M8.5 2h7");
const TrashIcon = () => ICON_SVG("M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-6 5v6m4-6v6");
const TriangleIcon = () => ICON_SVG("m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4m0 4h.01");
const STATUS_BADGES = [
  ["experimental", FlaskIcon, "Experimental"],
  ["deprecated", TrashIcon, "Deprecated"],
  ["nonstandard", TriangleIcon, "Non-standard"],
];
function statusBadges(p) {
  if (!p) return null;
  const out = STATUS_BADGES.filter(([k]) => p[k]);
  if (!out.length) return null;
  return (
    <span className="status-badges">
      {out.map(([k, Icon, t]) => <span key={k} className={"status-badge " + k} title={t} role="img" aria-label={t}><Icon /></span>)}
    </span>
  );
}

/* ---------- property index (for search & cross-links) ---------- */
const PROP_INDEX = [];
const PROP_BY_NAME = {};
let LIVE_COUNT = 0;
CODEX.families.forEach((f) => {
  f.properties.forEach((p) => {
    const entry = { name: p.name, familyId: f.id, familyTitle: f.title, sigil: f.sigil, number: p.number, description: plainText(p.description),
      experimental: p.experimental, deprecated: p.deprecated, nonstandard: p.nonstandard, warning: !!p.warning };
    PROP_INDEX.push(entry);
    if (!PROP_BY_NAME[p.name]) PROP_BY_NAME[p.name] = entry;
    if (isLive(p, f)) LIVE_COUNT++;
  });
});

/* ---------- MDN docs: localize links + status notecards ---------- */
// Rewrite MDN-relative hrefs: to a LOCAL property page when the link targets a
// property in this gallery, otherwise to an absolute MDN URL (new tab).
function localizeMdn(htmlStr) {
  if (!htmlStr) return htmlStr;
  return htmlStr.replace(/href="(\/[^"]*)"/g, (_, href) => {
    const seg = decodeURIComponent(href.split("#")[0].split("?")[0].replace(/\/$/, "").split("/").pop() || "");
    const hit = PROP_BY_NAME[seg];
    if (hit) return `href="#/p/${hit.familyId}/${encodeURIComponent(seg)}"`;
    return `href="https://developer.mozilla.org${href}" target="_blank" rel="noopener noreferrer"`;
  });
}
const MDN_EXPERIMENTAL_URL = "https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Experimental_deprecated_obsolete#experimental";
function MdnNotes({ property }) {
  const notes = [];
  if (property.experimental) notes.push(
    <div className="mdn-note experimental" key="x"><strong>Experimental:</strong> This is an <a href={MDN_EXPERIMENTAL_URL} target="_blank" rel="noopener noreferrer">experimental technology</a>. Check the browser compatibility table carefully before using this in production.</div>);
  if (property.nonstandard) notes.push(
    <div className="mdn-note nonstandard" key="n"><strong>Non-standard:</strong> This feature is not standardized. We do not recommend using non-standard features in production, as they have limited browser support, and may change or be removed. However, they can be a suitable alternative in specific cases where no standard option exists.</div>);
  if (property.deprecated) notes.push(
    <div className="mdn-note deprecated" key="d"><strong>Deprecated:</strong> This feature is no longer recommended. Though some browsers might still support it, it may have already been removed from the relevant web standards, may be in the process of being dropped, or may only be kept for compatibility purposes. Avoid using it, and update existing code if possible.</div>);
  if (property.warning) notes.push(
    <div className="mdn-note warning" key="w" dangerouslySetInnerHTML={{ __html: localizeMdn(property.warning) }} />);
  return notes.length ? <div className="mdn-notes">{notes}</div> : null;
}

/* ---------- routing ---------- */
function parseHash() {
  const h = (location.hash || "#/").replace(/^#/, "");
  const parts = h.split("/").filter(Boolean);
  // #/embed/<family>/<prop>/<valueIndex?> — preview+controls only, for screenshots
  if (parts[0] === "embed" && parts[1] && parts[2]) {
    return { screen: "embed", familyId: decodeURIComponent(parts[1]), propName: decodeURIComponent(parts[2]), valueIndex: parts[3] ? parseInt(parts[3], 10) : 0 };
  }
  if (parts[0] === "family" && parts[1]) return { screen: "family", familyId: decodeURIComponent(parts[1]) };
  if (parts[0] === "p" && parts[1] && parts[2]) return { screen: "specimen", familyId: decodeURIComponent(parts[1]), propName: decodeURIComponent(parts[2]) };
  return { screen: "home" };
}
function go(path) { location.hash = path; }
function useRoute() {
  const [route, setRoute] = useState(parseHash());
  useEffect(() => {
    const on = () => { setRoute(parseHash()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

/* ---------- theme ---------- */
function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("codex-theme") || "ink");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("codex-theme", theme);
  }, [theme]);
  return [theme, () => setTheme((t) => (t === "ink" ? "paper" : "ink"))];
}

/* ---------- initial value for a specimen ---------- */
function initValue(property) {
  const d = property.defaultValue;
  if (property.valueType === "function" && property.values && property.values.length) {
    const m = property.values.find((v) => v.value === d) || property.values[0];
    return { value: m.value, css: m.css };
  }
  if (property.values && property.values.length) {
    const m = property.values.find((v) => v.value === d);
    if (m) return { value: m.value, css: m.css };
  }
  if (d) {
    if (["length", "number", "angle"].includes(property.valueType))
      return { value: d, css: `${property.name}: ${d};` };
    if (property.values && property.values.length) {
      const v0 = property.values[0]; return { value: v0.value, css: v0.css };
    }
    return { value: d, css: `${property.name}: ${d};` };
  }
  if (property.values && property.values.length) {
    const v0 = property.values[0]; return { value: v0.value, css: v0.css };
  }
  return { value: "", css: "" };
}

/* ============================================================
   THE SPECIMEN  (§5)
   ============================================================ */
function Specimen({ family, property }) {
  const [value, setValue] = useState(() => initValue(property));
  useEffect(() => { setValue(initValue(property)); }, [property.name, family.id]);
  const Demo = resolveDemo(family, property);
  const onChange = useCallback((v) => setValue(v), []);
  const related = (property.related || []).map((n) => ({ name: n, entry: PROP_BY_NAME[n] }));

  return (
    <div className="specimen">
      <div className="spec-header">
        <div className="spec-plate">№<b>{String(property.number).padStart(3, "0")}</b>{family.sigil}</div>
        <div className="spec-title">
          <h1>{property.name}{statusBadges(property)}</h1>
          <p className="desc" dangerouslySetInnerHTML={{ __html: localizeMdn(property.description) }} />
          <MdnNotes property={property} />
          <div className="spec-meta-tags">
            <button className="pill" onClick={() => go(`/family/${family.id}`)}>{family.title}</button>
            <span className="pill">{property.valueType}</span>
            {property.maturity && <span className="pill accent">{property.maturity}</span>}
          </div>
        </div>
      </div>

      <ProvenanceBanner property={property} />

      {/* Hidden toggle anchors — one per value — so the screenshot driver can
          select every value uniformly, regardless of each demo's control style. */}
      <div id="codex-anchors" style={{ display: "none" }} aria-hidden="true">
        {(property.values || []).map((val, i) => (
          <button key={val.value} data-codex-anchor={i} data-codex-val={val.value}
            onClick={() => onChange({ value: val.value, css: val.css })} />
        ))}
      </div>

      <div className="spec-stage">
        <Demo key={family.id + property.name} property={property} family={family} value={value} onChange={onChange} />
      </div>

      <DifferenceStrip property={property} family={family} activeValue={value.value} onPick={onChange} />

      {value.css ? <CodeBlock css={value.css} /> : null}

      <GrammarDrawer property={property} />

      {related.length > 0 && (
        <div className="xlinks">
          <div className="xl-label">Related · longhand · logical siblings</div>
          <div className="xl-chips">
            {related.map((r) => (
              <button key={r.name} className="xl-chip"
                onClick={() => r.entry && go(`/p/${r.entry.familyId}/${encodeURIComponent(r.name)}`)}
                style={!r.entry ? { opacity: 0.55, cursor: "default" } : {}}>
                {r.name}{statusBadges(r.entry)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   FRONTISPIECE (home)
   ============================================================ */
const HERO_STEPS = [
  { p: "rotate", v: "rotate(-14deg)", t: "transform: rotate(-14deg)" },
  { p: "scale", v: "scale(1.18)", t: "transform: scale(1.18)" },
  { p: "rotateY", v: "rotateY(46deg)", t: "transform: rotateY(46deg)" },
  { p: "skew", v: "skewX(-12deg)", t: "transform: skewX(-12deg)" },
  { p: "translate", v: "translateY(-14px) rotate(6deg)", t: "transform: translateY(-14px) rotate(6deg)" },
];
function Frontispiece() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % HERO_STEPS.length), 2600);
    return () => clearInterval(id);
  }, []);
  const step = HERO_STEPS[i];
  const fams = CODEX.families.filter((f) => f.group !== "galleries");
  const galleries = CODEX.families.filter((f) => f.group === "galleries");
  return (
    <div className="wrap">
      <header className="masthead">
        <div>
          <div className="eyebrow">A Specimen Atlas of the CSS Grammar</div>
          <h1>The CSS<br /><em>Codex</em></h1>
          <p className="lede">
            Every property of the CSS language, catalogued like a specimen in a naturalist's
            atlas — grouped into families, set under a viewing glass, and made to behave at your touch.
          </p>
          <div className="masthead-stats">
            <div className="stat"><div className="n">{CODEX.total}</div><div className="l">Properties</div></div>
            <div className="stat"><div className="n">{CODEX.familyCount}</div><div className="l">Families</div></div>
            <div className="stat"><div className="n">{LIVE_COUNT}</div><div className="l">Live specimens</div></div>
          </div>
        </div>
        <div className="hero-spec">
          <div className="hero-spec-glass">
            <div className="hero-card" style={{ transform: step.v }}>{step.p}</div>
          </div>
          <div className="hero-spec-foot">
            <span className="lbl">№ 211 · transform</span>
            <span className="val">{step.t}</span>
          </div>
        </div>
      </header>

      <ProvenanceLedger />

      <div className="section-head">
        <h2>The Taxonomy</h2>
        <span className="meta">{CODEX.familyCount} families · {CODEX.total} specimens</span>
      </div>
      <div className="taxo-grid">
        {fams.map((f) => <FamilyCard key={f.id} f={f} />)}
      </div>

      <div className="section-head">
        <h2>The Galleries</h2>
        <span className="meta">beyond properties</span>
      </div>
      <div className="taxo-grid">
        {galleries.map((f) => <FamilyCard key={f.id} f={f} />)}
      </div>
    </div>
  );
}
function ProvenanceLedger() {
  const s = CODEX.stats || { pureComplete: 0, pureTruncated: 0, assisted: 0, empty: 0 };
  const pure = (s.pureComplete || 0) + (s.pureTruncated || 0);
  const total = CODEX.total || (pure + s.assisted + s.empty);
  const cards = [
    { n: pure, tone: "var(--accent)", label: "True grammar path-walking",
      sub: "every value enumerated straight from the EBNF" },
    { n: s.assisted, tone: "#caa23a", label: "Path-walked · assisted leaves",
      sub: "structure walked; only open-ended leaves (length/colour/number…) sampled" },
    { n: s.empty, tone: "var(--ink-3)", label: "Representational only",
      sub: "no enumerable terminal values. Catalogued for reference" },
  ];
  const pctOf = (n) => (total ? Math.round((100 * n) / total) : 0);
  return (
    <React.Fragment>
      <div className="section-head">
        <h2>How each specimen was generated</h2>
        <span className="meta">{total} specimens, walked from the CSS grammar</span>
      </div>
      <div className="taxo-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {cards.map((c) => (
          <div key={c.label} className="family-card" style={{ cursor: "default", borderLeft: `3px solid ${c.tone}` }}>
            <div className="fc-top">
              <span className="fc-sigil" style={{ color: c.tone }}>{c.n}</span>
              <span className="fc-count">{pctOf(c.n)}%</span>
            </div>
            <h3 style={{ fontSize: "16px" }}>{c.label}</h3>
            <div className="fc-blurb">{c.sub}</div>
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}
function FamilyCard({ f }) {
  return (
    <button className={"family-card" + (familyHasLive(f) ? " is-focus" : "")} onClick={() => go(`/family/${f.id}`)}>
      <div className="fc-top">
        <span className="fc-sigil">{f.sigil}</span>
        <span className="fc-count">{f.gallery ? "gallery" : f.count + " spec"}</span>
      </div>
      <h3>{f.title}</h3>
      <div className="fc-blurb">{f.blurb.length > 96 ? f.blurb.slice(0, 94) + "…" : f.blurb}</div>
      {familyHasLive(f) && <div className="fc-tag">Live demonstrator ◆</div>}
    </button>
  );
}

/* ============================================================
   FAMILY VIEW
   ============================================================ */
function StageTeaser({ family, property }) {
  const [value, setValue] = useState(() => initValue(property));
  const Demo = resolveDemo(family, property);
  return (
    <div className="spec-stage" style={{ marginTop: "30px" }}>
      <Demo property={property} family={family} value={value} onChange={setValue} />
    </div>
  );
}
function FamilyView({ family }) {
  if (!family) return <NotFound />;
  const live = familyHasLive(family);
  const hero = family.properties.find((p) => isLive(p, family)) || family.properties[0];
  return (
    <div className="wrap">
      <header className="family-intro">
        <div className="eyebrow">
          <span>Family {family.sigil}</span>
          <span>·</span>
          <b>{family.gallery ? "Gallery" : family.count + " specimens"}</b>
          {live && <React.Fragment><span>·</span><b>Live demonstrator</b></React.Fragment>}
        </div>
        <h1>{family.title}</h1>
        <p className="blurb">{family.blurb}</p>
      </header>

      {hero && live && (
        <React.Fragment>
          <div className="section-head" style={{ marginBottom: "0" }}>
            <h2 style={{ fontSize: "20px" }}>Live demonstrator</h2>
            <span className="meta">{hero.name}</span>
          </div>
          <StageTeaser family={family} property={hero} />
        </React.Fragment>
      )}

      <div className="section-head">
        <h2 style={{ fontSize: "20px" }}>Specimen index</h2>
        <span className="meta">{family.properties.length} of {family.gallery ? family.properties.length : family.count}</span>
      </div>
      <div className="specimen-index">
        {family.properties.map((p) => (
          <button key={p.name} className="spec-row" onClick={() => go(`/p/${family.id}/${encodeURIComponent(p.name)}`)}>
            <span className="sr-num">№ {String(p.number).padStart(3, "0")}</span>
            <span className="sr-name">{p.name}{statusBadges(p)}{isLive(p, family) && <span style={{ color: "var(--accent)", marginLeft: "7px", fontSize: "10px" }}>◆ live</span>}</span>
            <span className="sr-desc">{plainText(p.description)}</span>
            <span className="sr-go"><ArrowIcon /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   SPECIMEN VIEW
   ============================================================ */
function SpecimenView({ family, propName }) {
  if (!family) return <NotFound />;
  const property = family.properties.find((p) => p.name === propName);
  if (!property) return <NotFound />;
  return (
    <div className="wrap">
      <Specimen family={family} property={property} />
    </div>
  );
}
function NotFound() {
  return (
    <div className="wrap" style={{ padding: "80px 0" }}>
      <div className="empty-note">Specimen not found in this edition. <button className="xl-chip" onClick={() => go("/")} style={{ marginLeft: "8px" }}>Return to frontispiece</button></div>
    </div>
  );
}

/* ============================================================
   EMBED VIEW — just the preview + controls, fixed-size and framed,
   for clean per-value screenshots. #/embed/<family>/<prop>/<index>
   ============================================================ */
function EmbedView({ family, propName, valueIndex }) {
  const property = family && family.properties.find((p) => p.name === propName);
  const vals = (property && property.values) || [];
  const initial = vals[valueIndex] || vals[0] || { value: "", css: "" };
  const [value, setValue] = useState(() => ({ value: initial.value, css: initial.css }));
  useEffect(() => {
    const v = vals[valueIndex] || vals[0];
    if (v) setValue({ value: v.value, css: v.css });
  }, [propName, family && family.id, valueIndex]);
  if (!property) return <div className="embed-root"><div className="empty-note">not found</div></div>;
  const Demo = resolveDemo(family, property);
  return (
    <div className="embed-root">
      <div className="spec-stage">
        <Demo key={family.id + property.name + ":" + valueIndex} property={property} family={family} value={value} onChange={setValue} />
      </div>
    </div>
  );
}

/* ============================================================
   FAMILY RAIL
   ============================================================ */
function Rail({ activeFamily, onNavigate }) {
  const fams = CODEX.families.filter((f) => f.group !== "galleries");
  const galleries = CODEX.families.filter((f) => f.group === "galleries");
  const Item = (f) => (
    <button key={f.id} className={"rail-item" + (activeFamily === f.id ? " active" : "")}
      onClick={() => { go(`/family/${f.id}`); onNavigate && onNavigate(); }}>
      <span className="rail-sigil">{f.sigil}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.title}</span>
      <span className="rail-count">{f.focus ? "◆" : f.gallery ? "▤" : f.count}</span>
    </button>
  );
  return (
    <nav className="rail">
      <div className="rail-head">
        <button className="rail-mark" onClick={() => { go("/"); onNavigate && onNavigate(); }} style={{ background: "none", border: "none", textAlign: "left", padding: 0 }}>
          The CSS <em>Codex</em>
        </button>
        <div className="rail-sub">Specimen Atlas · 525</div>
      </div>
      <div className="rail-scroll">
        <div className="rail-group-label">Property Families</div>
        {fams.map(Item)}
        <div className="rail-group-label">Galleries</div>
        {galleries.map(Item)}
      </div>
    </nav>
  );
}

/* ============================================================
   COMMAND PALETTE (⌘K)
   ============================================================ */
function Palette({ onClose }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  const results = (() => {
    const query = q.trim().toLowerCase();
    const fams = CODEX.families
      .filter((f) => !query || f.title.toLowerCase().includes(query) || f.id.includes(query))
      .slice(0, 4)
      .map((f) => ({ kind: "family", id: f.id, name: f.title, sig: f.sigil, sub: f.gallery ? "gallery" : f.count + " specimens" }));
    const props = PROP_INDEX
      .filter((p) => !query || p.name.toLowerCase().includes(query) || p.familyTitle.toLowerCase().includes(query))
      .slice(0, 28)
      .map((p) => ({ kind: "prop", id: p.familyId, prop: p.name, name: p.name, sig: p.sigil, sub: p.familyTitle,
        experimental: p.experimental, deprecated: p.deprecated, nonstandard: p.nonstandard, warning: p.warning }));
    return { fams, props, flat: [...fams, ...props] };
  })();

  const goTo = (r) => {
    if (r.kind === "family") go(`/family/${r.id}`);
    else go(`/p/${r.id}/${encodeURIComponent(r.prop)}`);
    onClose();
  };
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(results.flat.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); results.flat[sel] && goTo(results.flat[sel]); }
    else if (e.key === "Escape") onClose();
  };
  useEffect(() => { setSel(0); }, [q]);

  let idx = -1;
  const row = (r) => {
    idx++;
    const here = idx;
    return (
      <button key={r.kind + r.id + (r.prop || "")} className={"pal-item" + (here === sel ? " sel" : "")}
        onMouseEnter={() => setSel(here)} onClick={() => goTo(r)}>
        <span className="pi-sig">{r.sig}</span>
        <span className="pi-name">{r.name}{r.kind === "prop" && statusBadges(r)}</span>
        <span className="pi-fam">{r.sub}</span>
      </button>
    );
  };

  return (
    <div className="palette-scrim" onMouseDown={onClose}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKey}>
        <div className="palette-input">
          <SearchIcon />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search properties, families, values…" />
          <span className="kbd" style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "var(--ink-3)", border: "1px solid var(--line)", borderRadius: "4px", padding: "2px 6px" }}>esc</span>
        </div>
        <div className="palette-results">
          {results.flat.length === 0 && <div className="pal-empty">No specimen matches “{q}”.</div>}
          {results.fams.length > 0 && <div className="pal-group">Families</div>}
          {results.fams.map(row)}
          {results.props.length > 0 && <div className="pal-group">Properties</div>}
          {results.props.map(row)}
        </div>
        <div className="palette-foot">
          <span><span className="k">↑↓</span>navigate</span>
          <span><span className="k">↵</span>open</span>
          <span><span className="k">esc</span>close</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TOP BAR + BREADCRUMB
   ============================================================ */
function TopBar({ route, onMenu, onSearch, theme, toggleTheme }) {
  const fam = route.familyId ? CODEX.byId[route.familyId] : null;
  return (
    <div className="topbar">
      <button className="icon-btn" onClick={onMenu} aria-label="Toggle family rail"><MenuIcon /></button>
      <div className="breadcrumb">
        <a onClick={() => go("/")} style={{ cursor: "pointer" }}>Codex</a>
        {fam && <React.Fragment><span className="sep">/</span><a onClick={() => go(`/family/${fam.id}`)} style={{ cursor: "pointer" }} className={route.screen === "family" ? "crumb-now" : ""}>{fam.title}</a></React.Fragment>}
        {route.screen === "specimen" && <React.Fragment><span className="sep">/</span><span className="crumb-now">{route.propName}{statusBadges(PROP_BY_NAME[route.propName])}</span></React.Fragment>}
      </div>
      <button className="search-trigger" onClick={onSearch}>
        <SearchIcon />
        <span className="st-label">Search the codex</span>
        <span className="kbd">⌘K</span>
      </button>
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === "ink" ? "Ink" : "Paper"}
        <span className="theme-dot" />
      </button>
    </div>
  );
}

/* ============================================================
   APP
   ============================================================ */
function App() {
  const route = useRoute();
  const [theme, toggleTheme] = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(window.innerWidth > 920);

  useEffect(() => {
    const on = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((o) => !o); }
      if (e.key === "/" && document.activeElement.tagName !== "INPUT" && !paletteOpen) { e.preventDefault(); setPaletteOpen(true); }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [paletteOpen]);

  const fam = route.familyId ? CODEX.byId[route.familyId] : null;
  const onMobile = () => { if (window.innerWidth <= 920) setRailOpen(false); };

  // Embed mode renders only the preview+controls, with no app chrome.
  if (route.screen === "embed") {
    return <EmbedView family={fam} propName={route.propName} valueIndex={route.valueIndex} />;
  }

  return (
    <div className={"app" + (railOpen ? "" : " rail-collapsed")}>
      <Rail activeFamily={route.familyId} onNavigate={onMobile} />
      <div className="rail-scrim" onClick={() => setRailOpen(false)} />
      <main className="main">
        <TopBar route={route} theme={theme} toggleTheme={toggleTheme}
          onMenu={() => setRailOpen((o) => !o)} onSearch={() => setPaletteOpen(true)} />
        <div className="canvas">
          {route.screen === "home" && <Frontispiece />}
          {route.screen === "family" && <FamilyView family={fam} />}
          {route.screen === "specimen" && <SpecimenView family={fam} propName={route.propName} />}
        </div>
      </main>
      {paletteOpen && <Palette onClose={() => setPaletteOpen(false)} />}
      <ToastHost />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
