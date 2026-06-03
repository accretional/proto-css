// interactive.js — Control bar, iframe isolation, and simulation loop for CSS property pages.
// Loaded by generated HTML pages.
// URL params:
//   ?static     — exit immediately (legacy static screenshots)
//   ?screenshot — hide control bar, start simulation immediately, no lazy loading
(function() {
  'use strict';

  // --- Static mode: exit immediately (for screenshots) ---
  if (new URLSearchParams(window.location.search).has('static')) return;

  // --- Screenshot mode: no control bar, immediate start, eager iframe loading ---
  var screenshotMode = new URLSearchParams(window.location.search).has('screenshot');

  // --- State ---
  var sim = { playing: false, interval: null, step: 0, caps: null, focusIndex: 0 };
  var iframes = []; // all created card iframes
  var pageStyles = ''; // cached <head> styles

  // --- Init ---
  window.addEventListener('DOMContentLoaded', function() {
    pageStyles = collectPageStyles();
    processCards();
    if (!screenshotMode) {
      buildControlBar();
      wireControls();
    }
    sim.caps = detectCapabilities();
    // Auto-start simulation: immediate in screenshot mode, delayed otherwise
    var delay = screenshotMode ? 200 : 600;
    setTimeout(function() { startLoop(); }, delay);
  });

  // ==========================================================================
  // Iframe Isolation
  // ==========================================================================

  function collectPageStyles() {
    var styles = [];
    var headStyles = document.querySelectorAll('head > style');
    for (var i = 0; i < headStyles.length; i++) {
      styles.push(headStyles[i].textContent);
    }
    return styles.join('\n');
  }

  function processCards() {
    var boxes = document.querySelectorAll('.demo-box');
    // Screenshot mode or no IntersectionObserver: convert all at once
    if (screenshotMode || !('IntersectionObserver' in window)) {
      for (var i = 0; i < boxes.length; i++) convertToIframe(boxes[i]);
      return;
    }
    var observer = new IntersectionObserver(function(entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          convertToIframe(entries[i].target);
          observer.unobserve(entries[i].target);
        }
      }
    }, { rootMargin: '400px' });
    for (var i = 0; i < boxes.length; i++) observer.observe(boxes[i]);
  }

  function convertToIframe(box) {
    var demoArea = box.querySelector('.demo-area');
    if (!demoArea || demoArea.querySelector('.card-iframe')) return; // already converted

    // Capture per-card style block if any
    var cardStyleEl = demoArea.querySelector('style');
    var cardStyle = cardStyleEl ? cardStyleEl.textContent : '';

    // Get wrapper style
    var wrapperStyle = demoArea.getAttribute('style') || '';

    // Get content (excluding per-card <style>)
    var content = '';
    var children = demoArea.childNodes;
    for (var i = 0; i < children.length; i++) {
      var node = children[i];
      if (node.nodeName !== 'STYLE') {
        content += (node.outerHTML || node.textContent || '');
      }
    }

    var srcdoc = buildSrcdoc(cardStyle, wrapperStyle, content);

    var iframe = document.createElement('iframe');
    iframe.className = 'card-iframe';
    iframe.setAttribute('scrolling', 'no');
    iframe.srcdoc = srcdoc;
    iframe.addEventListener('load', function() {
      resizeIframe(iframe);
      try {
        cloneHoverRules(iframe.contentDocument);
        pushCustomPropsToIframe(iframe);
      } catch(e) {}
    });

    // Replace demo-area content with iframe
    demoArea.innerHTML = '';
    demoArea.removeAttribute('style');
    demoArea.appendChild(iframe);

    // Store reference
    box._iframe = iframe;
    iframes.push(iframe);
  }

  function buildSrcdoc(cardStyle, wrapperStyle, content) {
    return '<!DOCTYPE html><html><head><style>' +
      pageStyles + '\n' + cardStyle + '\n' +
      'html, body { background: transparent !important; margin: 0 !important; padding: 0 !important; overflow: hidden; }' +
      '</style></head><body>' +
      '<div class="demo-area" style="' + escapeAttr(wrapperStyle) + '">' +
      content +
      '</div></body></html>';
  }

  function resizeIframe(iframe) {
    try {
      var doc = iframe.contentDocument;
      if (!doc || !doc.body) return;
      var height = doc.body.scrollHeight || doc.documentElement.scrollHeight;
      iframe.style.height = Math.max(40, Math.min(height + 2, 600)) + 'px';
    } catch(e) {
      iframe.style.height = '200px';
    }
  }

  function cloneHoverRules(doc) {
    if (!doc) return;
    var extra = [];
    try {
      for (var i = 0; i < doc.styleSheets.length; i++) {
        var rules;
        try { rules = doc.styleSheets[i].cssRules; } catch(e) { continue; }
        for (var j = 0; j < rules.length; j++) {
          var sel = rules[j].selectorText;
          if (sel && sel.indexOf(':hover') !== -1) {
            extra.push(rules[j].cssText.replace(/:hover/g, '.simulated-hover'));
          }
        }
      }
    } catch(e) {}
    if (extra.length) {
      var style = doc.createElement('style');
      style.textContent = extra.join('\n');
      doc.head.appendChild(style);
    }
  }

  // ==========================================================================
  // Control Bar
  // ==========================================================================

  function buildControlBar() {
    var bar = document.getElementById('control-bar');
    if (!bar) return;

    bar.innerHTML =
      '<div class="ctl-bar">' +
        '<label class="ctl-label">BG <input type="color" id="ctl-bg" value="#1a1a2e"></label>' +
        '<label class="ctl-label">Cards <input type="color" id="ctl-card" value="#16213e"></label>' +
        '<label class="ctl-label">Accent <input type="color" id="ctl-accent" value="#4fc3f7"></label>' +
        '<label class="ctl-label">Font <select id="ctl-font">' +
          '<option value="system-ui, sans-serif">system-ui</option>' +
          '<option value="monospace">monospace</option>' +
          '<option value="serif">serif</option>' +
          '<option value="sans-serif">sans-serif</option>' +
        '</select></label>' +
        '<label class="ctl-label">Size <input type="range" id="ctl-size" min="0.5" max="2" step="0.1" value="1"></label>' +
        '<label class="ctl-label">Gap <input type="range" id="ctl-gap" min="4" max="40" step="2" value="20"></label>' +
        '<span class="ctl-sep"></span>' +
        '<button id="btn-play" class="ctl-btn">\u25B6 Play</button>' +
        '<button id="btn-replay" class="ctl-btn">\u21BB Replay</button>' +
      '</div>';

    // Inject control bar styles
    var style = document.createElement('style');
    style.textContent =
      '#control-bar { position: sticky; top: 0; z-index: 9999; background: #111; ' +
        'padding: 8px 16px; border-bottom: 1px solid #333; margin: -32px -32px 24px -32px; }' +
      '.ctl-bar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }' +
      '.ctl-label { font-size: 11px; font-family: monospace; color: #9ca3af; display: flex; align-items: center; gap: 4px; }' +
      '.ctl-label input[type="color"] { width: 24px; height: 24px; border: 1px solid #444; border-radius: 4px; background: none; cursor: pointer; padding: 0; }' +
      '.ctl-label select { background: #1a1a2e; border: 1px solid #444; border-radius: 4px; padding: 2px 6px; font-size: 11px; color: #e0e0e0; font-family: monospace; }' +
      '.ctl-label input[type="range"] { width: 70px; accent-color: #4fc3f7; }' +
      '.ctl-sep { width: 1px; height: 20px; background: #333; }' +
      '.ctl-btn { background: #1a1a2e; border: 1px solid #444; border-radius: 4px; padding: 4px 10px; ' +
        'font-size: 11px; font-family: monospace; color: #e0e0e0; cursor: pointer; }' +
      '.ctl-btn:hover { background: #2a2a4e; }' +
      '.ctl-btn.active { background: #0f3460; border-color: #4fc3f7; color: #4fc3f7; }';
    document.head.appendChild(style);
  }

  function wireControls() {
    // Color pickers
    var colorMap = { 'ctl-bg': '--bg', 'ctl-card': '--card-bg', 'ctl-accent': '--accent' };
    for (var id in colorMap) {
      (function(elemId, varName) {
        var el = document.getElementById(elemId);
        if (!el) return;
        el.addEventListener('input', function() {
          document.documentElement.style.setProperty(varName, this.value);
          pushAllCustomProps();
        });
      })(id, colorMap[id]);
    }

    // Font selector
    var fontEl = document.getElementById('ctl-font');
    if (fontEl) fontEl.addEventListener('change', function() {
      document.documentElement.style.setProperty('--font', this.value);
      pushAllCustomProps();
    });

    // Size slider
    var sizeEl = document.getElementById('ctl-size');
    if (sizeEl) sizeEl.addEventListener('input', function() {
      document.documentElement.style.setProperty('--font-size', this.value);
      document.body.style.fontSize = (parseFloat(this.value) * 16) + 'px';
      pushAllCustomProps();
    });

    // Gap slider
    var gapEl = document.getElementById('ctl-gap');
    if (gapEl) gapEl.addEventListener('input', function() {
      document.documentElement.style.setProperty('--gap', this.value + 'px');
      pushAllCustomProps();
    });

    // Play/Pause
    var playBtn = document.getElementById('btn-play');
    if (playBtn) playBtn.addEventListener('click', togglePlay);

    // Replay
    var replayBtn = document.getElementById('btn-replay');
    if (replayBtn) replayBtn.addEventListener('click', replayAll);
  }

  function pushAllCustomProps() {
    for (var i = 0; i < iframes.length; i++) {
      pushCustomPropsToIframe(iframes[i]);
    }
  }

  function pushCustomPropsToIframe(iframe) {
    try {
      var parentRoot = document.documentElement;
      var iframeRoot = iframe.contentDocument.documentElement;
      var vars = ['--bg', '--card-bg', '--accent', '--font', '--font-size', '--gap'];
      for (var j = 0; j < vars.length; j++) {
        var val = getComputedStyle(parentRoot).getPropertyValue(vars[j]);
        if (val) iframeRoot.style.setProperty(vars[j], val.trim());
      }
    } catch(e) {}
  }

  // ==========================================================================
  // Simulation Loop
  // ==========================================================================

  function detectCapabilities() {
    // Always enable all capabilities — the tick functions gracefully no-op
    // when there are no targets. This avoids issues where elements are inside
    // iframes and not detectable from the main page.
    return {
      hasAnimation: true,
      hasHover: true,
      hasFocus: true,
      hasScroll: true
    };
  }

  function startLoop() {
    if (sim.playing) return;
    sim.playing = true;
    sim.step = 0;

    setAnimationState('running');

    sim.interval = setInterval(function() {
      sim.step++;
      if (sim.caps.hasHover) tickHover(sim.step);
      if (sim.caps.hasFocus) tickFocus(sim.step);
      if (sim.caps.hasScroll) tickScroll(sim.step);
    }, 500);

    updatePlayButton();
  }

  function stopLoop() {
    sim.playing = false;
    if (sim.interval) clearInterval(sim.interval);
    sim.interval = null;
    setAnimationState('paused');
    updatePlayButton();
  }

  function togglePlay() {
    if (sim.playing) stopLoop(); else startLoop();
  }

  function replayAll() {
    stopLoop();

    // Reset hover
    forEachIframeDoc(function(doc) {
      var els = doc.querySelectorAll('.simulated-hover');
      for (var i = 0; i < els.length; i++) els[i].classList.remove('simulated-hover');
    });

    // Restart animations
    forEachIframeDoc(function(doc) {
      var all = doc.querySelectorAll('*');
      var animated = [];
      for (var i = 0; i < all.length; i++) {
        try {
          if (getComputedStyle(all[i]).animationName !== 'none') {
            animated.push(all[i]);
            all[i].style.animation = 'none';
          }
        } catch(e) {}
      }
      void doc.body.offsetHeight; // force reflow
      for (var i = 0; i < animated.length; i++) {
        animated[i].style.animation = '';
      }
    });

    // Reset scroll
    forEachIframeDoc(function(doc) {
      var containers = findScrollContainers(doc);
      for (var i = 0; i < containers.length; i++) {
        try { containers[i].scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch(e) {}
      }
    });

    sim.focusIndex = 0;
    startLoop();
  }

  function updatePlayButton() {
    var btn = document.getElementById('btn-play');
    if (!btn) return;
    if (sim.playing) {
      btn.textContent = '\u23F8 Pause';
      btn.classList.add('active');
    } else {
      btn.textContent = '\u25B6 Play';
      btn.classList.remove('active');
    }
  }

  // --- Tick functions ---

  function tickHover(step) {
    var add = (step % 2 === 0);
    forEachIframeDoc(function(doc) {
      // Target the content element inside .demo-area (the element with the CSS property).
      // .demo-area itself is the wrapper — hover rules target its children.
      var target = doc.querySelector('.demo-area > *');
      if (!target) target = doc.querySelector('[style]');
      if (!target) return;
      if (add) target.classList.add('simulated-hover');
      else target.classList.remove('simulated-hover');
    });
  }

  function tickFocus(step) {
    // Collect focusable elements paired with their iframe
    var items = [];
    for (var i = 0; i < iframes.length; i++) {
      try {
        var doc = iframes[i].contentDocument;
        if (!doc || !doc.body) continue;
        var els = doc.querySelectorAll('input, textarea, select, [contenteditable]');
        for (var j = 0; j < els.length; j++) {
          items.push({ iframe: iframes[i], el: els[j] });
        }
      } catch(e) {}
    }
    if (items.length === 0) return;
    sim.focusIndex = step % items.length;
    var item = items[sim.focusIndex];
    try {
      // Focus the iframe first, then the element inside it
      item.iframe.focus();
      item.el.focus();
    } catch(e) {}
  }

  function tickScroll(step) {
    // Cycle: top(0) -> mid(1) -> bottom(2) -> mid(3) -> repeat
    var phase = step % 4;
    forEachIframeDoc(function(doc) {
      var containers = findScrollContainers(doc);
      for (var c = 0; c < containers.length; c++) {
        var sc = containers[c];
        var isVertical = sc.scrollHeight > sc.clientHeight + 10;
        var isHorizontal = sc.scrollWidth > sc.clientWidth + 10;

        if (isVertical) {
          var maxV = sc.scrollHeight - sc.clientHeight;
          var vPositions = [0, maxV * 0.5, maxV, maxV * 0.5];
          try { sc.scrollTo({ top: vPositions[phase], behavior: 'auto' }); } catch(e) {}
        }
        if (isHorizontal) {
          var maxH = sc.scrollWidth - sc.clientWidth;
          var hPositions = [0, maxH * 0.5, maxH, maxH * 0.5];
          try { sc.scrollTo({ left: hPositions[phase], behavior: 'auto' }); } catch(e) {}
        }
      }
    });
  }

  function findScrollContainers(doc) {
    var containers = [];
    var seen = [];
    // Check .scroll-container elements
    var sc = doc.querySelectorAll('.scroll-container');
    for (var j = 0; j < sc.length; j++) { containers.push(sc[j]); seen.push(sc[j]); }
    // Check any element with overflow style that is actually scrollable
    var all = doc.querySelectorAll('[style]');
    for (var i = 0; i < all.length; i++) {
      var s = getComputedStyle(all[i]);
      var isScrollableV = (s.overflow === 'auto' || s.overflow === 'scroll' ||
                           s.overflowY === 'auto' || s.overflowY === 'scroll') &&
                          all[i].scrollHeight > all[i].clientHeight + 10;
      var isScrollableH = (s.overflow === 'auto' || s.overflow === 'scroll' ||
                           s.overflowX === 'auto' || s.overflowX === 'scroll') &&
                          all[i].scrollWidth > all[i].clientWidth + 10;
      if (isScrollableV || isScrollableH) {
        var dup = false;
        for (var k = 0; k < seen.length; k++) { if (seen[k] === all[i]) { dup = true; break; } }
        if (!dup) { containers.push(all[i]); seen.push(all[i]); }
      }
    }
    return containers;
  }

  function setAnimationState(state) {
    forEachIframeDoc(function(doc) {
      var all = doc.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) {
        try {
          if (getComputedStyle(all[i]).animationName !== 'none') {
            all[i].style.animationPlayState = state;
          }
        } catch(e) {}
      }
    });
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  function forEachIframeDoc(fn) {
    for (var i = 0; i < iframes.length; i++) {
      try {
        var doc = iframes[i].contentDocument;
        if (doc && doc.body) fn(doc);
      } catch(e) {}
    }
  }

  function escapeAttr(s) {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
