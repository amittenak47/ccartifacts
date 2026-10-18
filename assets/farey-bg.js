/* The Farey tessellation of the Poincaré disk. Its geodesics join fractions p/q and
   r/s with |ps − qr| = 1 on the boundary, cutting the plane into ideal triangles that
   are all the same size. Sliding the upper half-plane by z → z + s is a Möbius map
   that carries the tessellation onto itself, so the pattern flows around one boundary
   point and repeats with every whole step.

   fareyDraw(ctx, {ox, oy, R, shift, rim, lines, color, fill}) draws it once: disk centre
   and radius in CSS pixels, the slide s, the alpha of the rim and of the geodesics, the
   stroke color, and optionally {color, alpha} to fill the triangle 0, 1, ∞.

   fareyBackground(canvas, layout) keeps a fixed full-window canvas redrawn on scroll and
   resize. layout receives {W, H, y, reduce} and returns the same options as fareyDraw. */
(function () {
  var edges = [], K = 24, N = 12;
  function farey(a, b, c, d) {
    var p = a + c, q = b + d;
    if (q > N) return;
    edges.push([p / q, a / b], [p / q, c / d]);
    farey(a, b, p, q);
    farey(p, q, c, d);
  }
  for (var n = -K; n < K; n++) {
    edges.push([n, n + 1], [n, Infinity]);
    farey(n, 1, n + 1, 1);
  }
  // Cayley map sends real x to the boundary angle atan2(−2x, x² − 1); ∞ goes to the top of the disk.
  function ang(x) { return x === Infinity ? Math.PI / 2 : Math.atan2(-2 * x, x * x - 1) + Math.PI / 2; }

  // Append the geodesic between boundary angles t1 and t2: the arc of the circle through both
  // endpoints that meets the rim at right angles (a diameter when they are opposite).
  function geodesic(ctx, ox, oy, R, t1, t2, move) {
    var m = (t1 + t2) / 2, h = Math.abs(t1 - t2) / 2;
    if (h > Math.PI / 2) { h = Math.PI - h; m += Math.PI; }
    var p1x = ox + R * Math.cos(t1), p1y = oy - R * Math.sin(t1), p2x = ox + R * Math.cos(t2), p2y = oy - R * Math.sin(t2);
    if (move) ctx.moveTo(p1x, p1y);
    if (Math.cos(h) < 1e-4) { ctx.lineTo(p2x, p2y); return; }
    var r = R * Math.tan(h);
    var ccx = ox + R * Math.cos(m) / Math.cos(h), ccy = oy - R * Math.sin(m) / Math.cos(h);
    var f1 = Math.atan2(p1y - ccy, p1x - ccx), sw = Math.atan2(p2y - ccy, p2x - ccx) - f1;
    while (sw > Math.PI) sw -= 2 * Math.PI;
    while (sw < -Math.PI) sw += 2 * Math.PI;
    if (r < 0.7) { ctx.lineTo(p2x, p2y); return; }
    ctx.arc(ccx, ccy, r, f1, f1 + sw, sw < 0);
  }

  window.fareyDraw = function (ctx, o) {
    var ox = o.ox, oy = o.oy, R = o.R, shift = ((o.shift % 1) + 1) % 1;
    ctx.strokeStyle = o.color || '#888';
    if (o.fill) {
      // The shaded triangle follows the unwrapped slide, so it keeps moving instead of jumping back.
      var A = ang(o.shift), B = ang(1 + o.shift), C = ang(Infinity);
      ctx.globalAlpha = o.fill.alpha; ctx.fillStyle = o.fill.color;
      ctx.beginPath(); geodesic(ctx, ox, oy, R, A, B, true); geodesic(ctx, ox, oy, R, B, C); geodesic(ctx, ox, oy, R, C, A); ctx.fill();
    }
    ctx.globalAlpha = Math.max(0, o.rim);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(ox, oy, R, 0, 2 * Math.PI); ctx.stroke();
    ctx.globalAlpha = Math.max(0, o.lines);
    ctx.lineWidth = o.lineWidth || 0.8;
    ctx.beginPath();
    for (var i = 0; i < edges.length; i++) {
      var a = edges[i][0], b = edges[i][1];
      var t1 = ang(a + shift), t2 = ang(b === Infinity ? b : b + shift);
      if (R * Math.tan(Math.min(Math.abs(t1 - t2), 2 * Math.PI - Math.abs(t1 - t2)) / 2) < 0.7) continue;
      geodesic(ctx, ox, oy, R, t1, t2, true);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  window.fareyBackground = function (canvas, layout) {
    var ctx = canvas.getContext('2d'), root = document.documentElement;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)');
    var W = 0, H = 0, dpr = 1, queued = false;
    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      paint();
    }
    function paint() {
      queued = false;
      var L = layout({ W: W, H: H, y: scrollY, reduce: reduce.matches });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      L.color = getComputedStyle(root).getPropertyValue('--text-secondary').trim() || '#888';
      window.fareyDraw(ctx, L);
    }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(paint); } }
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', resize);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', queue);
    reduce.addEventListener('change', queue);
    new MutationObserver(queue).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    resize();
    return { repaint: queue };
  };
})();
