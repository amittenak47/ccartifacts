/* Backgrounds for the gallery and the artifact pages: soft color washes and faint drawings
   from the artifacts on one fixed canvas, each layer moving at its own fraction of the scroll
   speed. Colors come from assets/theme.css; the disk needs assets/farey-bg.js.

   Backdrop.start(paint) uses <canvas id="bg"> (creating it if missing) and redraws on scroll,
   resize and theme changes. paint receives {ctx, W, H, y, wide, dark, at, tok}: at(docY, rate)
   is the screen y of a layer that sits centred when the page is scrolled to docY pixels and
   moves at `rate` times the scroll speed. Returns {draw} to redraw immediately.

   Backdrop.page(motif) is the artifact-page background: three color washes and one drawing,
   'antennas', 'penrose', 'disk', 'hexes', 'lanes' or 'strata', that drifts up slower than the page. */
(function () {
  var root = document.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)');
  function tok(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }
  function isDark() { return root.dataset.theme === 'dark' || (root.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches); }

  function line(c, f, n) { c.beginPath(); for (var i = 0; i <= n; i++) { var p = f(i / n); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke(); }
  function glow(c, x, y, r, color) {
    var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  // Peaks (solid) and nulls (dashed) of two antennas: hyperbolas with the antennas as foci.
  function antennas(c, cx, cy, S, color, alpha) {
    var d = S * 0.2, lam = d * 0.5; c.strokeStyle = color;
    for (var m = -3.5; m <= 3.5; m += 0.5) {
      var a = m * lam / 2, peak = Number.isInteger(m);
      c.globalAlpha = alpha * (peak ? 1 : 0.55); c.lineWidth = peak ? 1.4 : 1; c.setLineDash(peak ? [] : [4, 5]);
      if (a === 0) { line(c, function (u) { return [cx, cy + (u - 0.5) * S * 1.4]; }, 2); continue; }
      var b = Math.sqrt(d * d - a * a);
      (function (a, b) { line(c, function (u) { var t = (u - 0.5) * 4.4; return [cx + a * Math.cosh(t), cy + b * Math.sinh(t)]; }, 90); })(a, b);
    }
    c.setLineDash([]); c.globalAlpha = alpha; c.fillStyle = color;
    [cx - d, cx + d].forEach(function (x) { c.beginPath(); c.arc(x, cy, 3.5, 0, Math.PI * 2); c.fill(); });
  }
  // The Penrose diamond: light rays and hyperbolas after the arctan squeeze.
  function penrose(c, cx, cy, S, color, accent, alpha) {
    var R = S * 0.46, sq = function (u) { return (2 / Math.PI) * Math.atan(u); };
    var map = function (x, t) { return [cx + (sq(t + x) - sq(t - x)) / 2 * R, cy - (sq(t - x) + sq(t + x)) / 2 * R]; };
    c.globalAlpha = alpha; c.strokeStyle = color; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(cx, cy - R); c.lineTo(cx + R, cy); c.lineTo(cx, cy + R); c.lineTo(cx - R, cy); c.closePath(); c.stroke();
    c.lineWidth = 1.1;
    [0.6, 1.3, 2.2].forEach(function (q) { [1, -1].forEach(function (s) {
      line(c, function (u) { var v = (u - 0.5) * 12; return map(q * Math.sinh(v), s * q * Math.cosh(v)); }, 160);
      line(c, function (u) { var v = (u - 0.5) * 12; return map(s * q * Math.cosh(v), q * Math.sinh(v)); }, 160);
    }); });
    c.strokeStyle = accent; c.setLineDash([5, 5]); c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(cx - R / 2, cy - R / 2); c.lineTo(cx + R / 2, cy + R / 2); c.moveTo(cx + R / 2, cy - R / 2); c.lineTo(cx - R / 2, cy + R / 2); c.stroke(); c.setLineDash([]);
  }
  // Hexagons colored (q + 3r) mod 7, so each tile's six neighbours all differ.
  function hexes(c, cx, cy, S, alpha, dark) {
    var s = S * 0.085, reach = 4.6, L = dark ? 42 : 62, C = dark ? 60 : 55;
    for (var r = -6; r <= 6; r++) for (var q = -6; q <= 6; q++) {
      var dist = (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2; if (dist > reach) continue;
      var x = cx + s * Math.sqrt(3) * (q + r / 2), y = cy + s * 1.5 * r, k = ((q + 3 * r) % 7 + 7) % 7;
      c.globalAlpha = alpha * (1 - dist / (reach + 1.5));
      c.fillStyle = 'hsl(' + ((k * 360 / 7 + 170) % 360) + ' ' + C + '% ' + L + '%)';
      c.beginPath();
      for (var i = 0; i < 6; i++) { var an = Math.PI / 6 + i * Math.PI / 3, px = x + s * 0.94 * Math.cos(an), py = y + s * 0.94 * Math.sin(an); i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.closePath(); c.fill();
    }
  }
  // Alice, the server and Bob as three lanes, with the duel's messages crossing between them.
  function lanes(c, cx, cy, S, alpha) {
    var w = S * 1.1, h = S * 0.62, x0 = cx - w / 2, y = { A: cy - h / 2, S: cy, B: cy + h / 2 };
    var col = { A: tok('--alice') || tok('--violet'), S: tok('--server') || tok('--amber'), B: tok('--bob') || tok('--text-accent') };
    var X = function (t) { return x0 + t / 500 * w; };
    ['A', 'S', 'B'].forEach(function (k) { c.globalAlpha = alpha * 0.8; c.strokeStyle = col[k]; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x0, y[k]); c.lineTo(x0 + w, y[k]); c.stroke(); });
    [['B', 'S', 80, 105], ['S', 'A', 105, 230], ['A', 'S', 230, 355], ['S', 'B', 355, 380], ['S', 'A', 355, 480]].forEach(function (m) {
      c.globalAlpha = alpha; c.strokeStyle = col[m[0]]; c.lineWidth = 1.3;
      c.beginPath(); c.moveTo(X(m[2]), y[m[0]]); c.lineTo(X(m[3]), y[m[1]]); c.stroke();
    });
    c.globalAlpha = alpha; c.fillStyle = col.B; c.beginPath(); c.arc(X(380), y.B, 5, 0, Math.PI * 2); c.fill();
  }

  // Bedded rock seen side-on, with the oil window as an amber band two layers down.
  function strata(c, cx, cy, S, alpha) {
    var w = S * 1.2, h = S * 0.9, x0 = cx - w / 2, top = cy - h / 2, n = 9, gap = h / n;
    c.globalAlpha = alpha * 0.7; c.fillStyle = tok('--amber');
    c.fillRect(x0, top + gap * 3, w, gap * 2);
    c.strokeStyle = tok('--text-secondary'); c.lineWidth = 1.2;
    for (var i = 0; i <= n; i++) {
      c.globalAlpha = alpha * (i === 3 || i === 5 ? 1 : 0.6);
      (function (i) { line(c, function (u) { var x = x0 + u * w; return [x, top + i * gap + Math.sin(u * 6 + i * 1.7) * gap * 0.18]; }, 60); })(i);
    }
  }

  function start(paint) {
    var cv = document.getElementById('bg');
    if (!cv) {
      cv = document.createElement('canvas'); cv.id = 'bg'; cv.setAttribute('aria-hidden', 'true');
      cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none';
      document.body.prepend(cv);
    }
    var c = cv.getContext('2d'), W = 0, H = 0, dpr = 1, queued = false;
    function draw() {
      queued = false;
      var y = reduce.matches ? 0 : scrollY;
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H); c.globalAlpha = 1;
      paint({ ctx: c, W: W, H: H, y: y, wide: W >= 880, dark: isDark(), tok: tok, at: function (docY, rate) { return H / 2 - (y - docY) * rate; } });
      c.globalAlpha = 1; c.setLineDash([]);
    }
    function resize() { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); draw(); }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(draw); } }
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', resize);
    addEventListener('pagereveal', draw);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', queue);
    reduce.addEventListener('change', queue);
    new MutationObserver(queue).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    resize();
    return { draw: draw };
  }

  function page(motif) {
    return start(function (p) {
      var c = p.ctx, W = p.W, H = p.H, wide = p.wide, big = Math.max(W, H);
      // Color washes, a tenth of the scroll speed.
      glow(c, W * 0.86, p.at(0, 0.1) - H * 0.15, big * 0.55, tok('--glow-a'));
      glow(c, W * 0.1, p.at(1500, 0.1), big * 0.5, tok('--glow-b'));
      glow(c, W * 0.9, p.at(3200, 0.1), big * 0.5, tok('--glow-c'));
      // The page's drawing, twice: beside the top of the page, then lower on the other side,
      // both at a third of the scroll speed so they drift up behind the content.
      var S = wide ? Math.min(H * 0.85, W * 0.4) : Math.min(W * 0.9, H * 0.55), a = wide ? 1 : 0.45;
      [[wide ? W * 0.9 : W * 0.5, p.at(H * 0.5, 0.33)], [wide ? W * 0.1 : W * 0.5, p.at(H * 0.5 + 2400, 0.33)]].forEach(function (at) {
        var x = at[0], y = at[1];
        if (y < -S || y > H + S) return;
        if (motif === 'antennas') antennas(c, x, y, S, tok('--amber'), 0.36 * a);
        else if (motif === 'penrose') penrose(c, x, y, S, tok('--violet'), tok('--amber'), 0.36 * a);
        else if (motif === 'hexes') hexes(c, x, y, S, 0.3 * a, p.dark);
        else if (motif === 'lanes') lanes(c, x, y, S, 0.32 * a);
        else if (motif === 'strata') strata(c, x, y, S, 0.34 * a);
        else if (motif === 'disk' && window.fareyDraw) window.fareyDraw(c, { ox: x, oy: y, R: S * 0.5, shift: 0.35 + p.y / 2400, rim: 0.45 * a, lines: 0.32 * a, color: tok('--text-accent') });
      });
    });
  }

  window.Backdrop = { start: start, page: page, line: line, glow: glow, antennas: antennas, penrose: penrose, hexes: hexes, lanes: lanes, strata: strata };
})();
