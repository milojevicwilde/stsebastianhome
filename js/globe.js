// =============================================================================
// Globe intro.
//  1. Close in on Europe: coastlines appear, then Austria-Hungary (1914) in
//     grey, Bosnia and Herzegovina hatched, Herzegovina and Boka Kotorska in
//     a reddish tone.
//  2. A red line leaves Herzegovina / Boka and travels the great circle to
//     Jackson, California, while the camera turns and pulls back to show the
//     whole arc on the globe.
//  3. Jackson appears; header and footer fade in.
//
// Projection: orthographic (a globe seen from space), via d3-geo.
// Coastlines: Natural Earth (public domain) from the jsDelivr CDN.
// Regions: js/regions.js.
// =============================================================================
(function () {
  'use strict';

  var root   = document.documentElement;
  var stage  = document.querySelector('.stage');
  var canvas = stage && stage.querySelector('.globe');
  var d3 = window.d3, REG = window.SSH_REGIONS;
  if (!canvas || !d3 || !d3.geoOrthographic || !REG) { root.classList.add('chrome-in'); return; }

  var reduce = root.classList.contains('reduce');
  var ctx = canvas.getContext('2d');

  // ---- timeline (ms after the intro starts) ---------------------------------
  var T = {
    coast:  [0, 1300],      // coastlines + graticule fade in
    ah:     [450, 1450],    // Austria-Hungary grey
    bih:    [900, 1900],    // Bosnia and Herzegovina hatch
    red:    [1300, 2100],   // Herzegovina + Boka
    dot:    1800,           // start point pops
    labIn:  [1000, 1800],   // region names in …
    labOut: [2400, 2900],   // … and out as the camera pulls back
    cam:    [2300, 4800],   // camera: Europe -> whole arc
    line:   [2600, 5300],   // line: Herzegovina -> Jackson
    chrome: 5000,           // header + footer fade in
    end:    5900
  };
  var WAIT_FOR_COAST = 1600; // wait this long at most for the coastline before starting
  var ARCH = 26;             // degrees: how far below the arc the final view looks (more = rounder arch)

  // ---- colours ----------------------------------------------------------------
  var INK = '28,27,24', RED = '168,57,43';

  // ---- geometry -------------------------------------------------------------
  function polygon(ring) {
    var r = ring.slice(), a = r[0], b = r[r.length - 1];
    if (a[0] !== b[0] || a[1] !== b[1]) r.push(a);
    var g = { type: 'Polygon', coordinates: [r] };
    if (d3.geoArea(g) > 2 * Math.PI) r.reverse();     // d3 wants clockwise outer rings
    return g;
  }
  var G = {
    ah:   polygon(REG.ah),
    bih:  polygon(REG.bih),
    herz: polygon(REG.herz),
    boka: polygon(REG.boka)
  };
  var START = REG.start, END = REG.jackson;
  var arc = d3.geoInterpolate(START, END);
  var ARC_N = 260;
  var arcFull = { type: 'LineString', coordinates: d3.range(ARC_N + 1).map(function (i) { return arc(i / ARC_N); }) };
  var SPHERE = { type: 'Sphere' };
  var GRAT = d3.geoGraticule10();

  var proj = d3.geoOrthographic().clipAngle(90).precision(0.35);
  var path = d3.geoPath(proj, ctx);
  var measure = d3.geoPath(proj);

  // ---- labels ---------------------------------------------------------------
  var labels = {};
  Array.prototype.forEach.call(stage.querySelectorAll('[data-geo]'), function (el) {
    labels[el.getAttribute('data-geo')] = el;
  });
  var LABEL_AT = { ah: REG.labels.ah, herz: REG.labels.herz, boka: REG.labels.boka, jackson: END };
  var pin = stage.querySelector('.pin');

  // ---- layout: two camera positions -------------------------------------------
  var W = 0, H = 0, DPR = 1, small = false;
  var C0, K0, T0, C1, K1, T1;

  function setCam(c, k, t) { proj.rotate([-c[0], -c[1]]).scale(k).translate(t); }

  function layout() {
    var r = stage.getBoundingClientRect();
    W = Math.round(r.width); H = Math.round(r.height);
    if (!W || !H) return false;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    small = W < 600;

    var m = small ? 18 : 40;
    var box = { x: m, y: small ? 14 : 24, w: W - 2 * m, h: H - (small ? 28 : 48) };
    var mid = [box.x + box.w / 2, box.y + box.h / 2];

    // 1) close-up: Austria-Hungary fills most of the screen
    C0 = [18.6, 45.7];
    setCam(C0, 1, [0, 0]);
    var b = measure.bounds(G.ah);
    K0 = Math.min(box.w / (b[1][0] - b[0][0]), box.h / (b[1][1] - b[0][1])) * (small ? 0.92 : 0.74);
    T0 = [mid[0] - (b[0][0] + b[1][0]) / 2 * K0, mid[1] - (b[0][1] + b[1][1]) / 2 * K0];

    // 2) whole arc: look at the arc from below its midpoint, so the great
    //    circle reads as an arch over the North Atlantic, then fit it.
    var m0 = arc(0.5);
    C1 = [m0[0], m0[1] - ARCH];
    setCam(C1, 1, [0, 0]);
    var bb = measure.bounds(arcFull);
    var aw = bb[1][0] - bb[0][0], ah = bb[1][1] - bb[0][1];
    K1 = Math.min(
      (box.w * (small ? 0.84 : 0.8)) / aw,  // arc fits across
      box.h / 2 * 0.98                      // whole globe fits top to bottom
    );
    T1 = [mid[0] - (bb[0][0] + bb[1][0]) / 2 * K1, mid[1]];
    return true;
  }

  // ---- easing / helpers -------------------------------------------------------
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ramp(now, span) { return clamp01((now - span[0]) / (span[1] - span[0])); }
  function easeInOut(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function easeInOutSine(p) { return -(Math.cos(Math.PI * p) - 1) / 2; }
  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
  function easeOutBack(p) { var c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function camera(now) {
    var e = easeInOutSine(ramp(now, T.cam));
    var c = d3.geoInterpolate(C0, C1)(e);
    var k = Math.exp(lerp(Math.log(K0), Math.log(K1), e));
    var t = [lerp(T0[0], T1[0], e), lerp(T0[1], T1[1], e)];
    setCam(c, k, t);
    // keep the head of the line (or the start point) on screen while moving
    if (e > 0 && e < 1) {
      var lp = easeInOutSine(ramp(now, T.line)), f = proj(arc(lp));
      var mx = small ? 26 : 60, my = small ? 30 : 50;
      var dx = Math.max(0, mx - f[0]) - Math.max(0, f[0] - (W - mx));
      var dy = Math.max(0, my - f[1]) - Math.max(0, f[1] - (H - my));
      if (dx || dy) setCam(c, k, [t[0] + dx, t[1] + dy]);
    }
    return c;
  }
  function visible(p, centre) { return d3.geoDistance(p, centre) < Math.PI / 2 - 0.02; }

  // ---- coastline --------------------------------------------------------------
  var LAND_URLS = [
    'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json',
    'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json'
  ];
  var land = null, landAt = null;

  function fromTopo(topo) {
    var tr = topo.transform;
    var arcs = topo.arcs.map(function (a) {
      var x = 0, y = 0, out = new Array(a.length);
      for (var i = 0; i < a.length; i++) {
        if (tr) { x += a[i][0]; y += a[i][1]; out[i] = [x * tr.scale[0] + tr.translate[0], y * tr.scale[1] + tr.translate[1]]; }
        else out[i] = a[i];
      }
      return out;
    });
    function ring(ids) {
      var pts = [];
      ids.forEach(function (id) {
        var a = id < 0 ? arcs[~id].slice().reverse() : arcs[id];
        for (var j = pts.length ? 1 : 0; j < a.length; j++) pts.push(a[j]);
      });
      return pts;
    }
    var obj = topo.objects.land, geoms = obj.type === 'GeometryCollection' ? obj.geometries : [obj];
    var polys = [];
    geoms.forEach(function (g) {
      if (g.type === 'Polygon') polys.push(g.arcs.map(ring));
      else if (g.type === 'MultiPolygon') g.arcs.forEach(function (p) { polys.push(p.map(ring)); });
    });
    // keep the northern lands this globe can ever show (drops Antarctica, Australia)
    polys = polys.filter(function (p) {
      var maxLat = -90;
      for (var i = 0; i < p[0].length; i++) if (p[0][i][1] > maxLat) maxLat = p[0][i][1];
      return maxLat > 5;
    });
    return { type: 'MultiPolygon', coordinates: polys };
  }

  function loadLand(cb) {
    if (!window.fetch) return cb();
    (function tryUrl(i) {
      if (i >= LAND_URLS.length) return cb();
      fetch(LAND_URLS[i]).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      }).then(function (topo) { land = fromTopo(topo); cb(); })
        .catch(function () { tryUrl(i + 1); });
    })(0);
  }

  // ---- drawing ----------------------------------------------------------------
  function hatch(now, alpha) {
    var b = measure.bounds(G.bih);
    if (!isFinite(b[0][0])) return;
    var x0 = b[0][0], y0 = b[0][1], x1 = b[1][0], y1 = b[1][1], h = y1 - y0;
    ctx.save();
    ctx.beginPath(); path(G.bih); ctx.clip();
    // fading hatch: strong in the south, almost gone in the north
    var g = ctx.createLinearGradient(0, y1, 0, y0);
    g.addColorStop(0, 'rgba(' + INK + ',' + (0.6 * alpha).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(' + INK + ',' + (0.04 * alpha).toFixed(3) + ')');
    ctx.strokeStyle = g;
    ctx.lineWidth = small ? 0.6 : 0.7;
    var gap = small ? 3.6 : 4.2;
    ctx.beginPath();
    for (var x = x0 - h; x < x1; x += gap) { ctx.moveTo(x, y1); ctx.lineTo(x + h, y0); }
    ctx.stroke();
    ctx.restore();
  }

  function draw(now) {
    var c = ctx;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.clearRect(0, 0, W, H);
    var centre = camera(now);
    var k = proj.scale(), t = proj.translate();

    var aCoast = land ? ramp(now - (landAt || 0), T.coast) : ramp(now, T.coast) * 0.6;
    var aAH = easeOut(ramp(now, T.ah)), aBiH = easeOut(ramp(now, T.bih)), aRed = easeOut(ramp(now, T.red));

    // globe: soft light from the upper left
    var g = c.createRadialGradient(t[0] - k * 0.35, t[1] - k * 0.4, k * 0.05, t[0], t[1], k);
    g.addColorStop(0, '#FDFDFB');
    g.addColorStop(1, '#EBEBE6');
    c.beginPath(); path(SPHERE); c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(' + INK + ',.18)'; c.lineWidth = 0.8; c.stroke();

    // graticule
    c.beginPath(); path(GRAT);
    c.strokeStyle = 'rgba(' + INK + ',' + (0.07 * aCoast).toFixed(3) + ')'; c.lineWidth = 0.5; c.stroke();

    // land
    if (land) {
      c.beginPath(); path(land);
      c.fillStyle = 'rgba(' + INK + ',' + (0.045 * aCoast).toFixed(3) + ')'; c.fill();
      c.strokeStyle = 'rgba(' + INK + ',' + (0.34 * aCoast).toFixed(3) + ')';
      c.lineWidth = small ? 0.6 : 0.7; c.lineJoin = 'round'; c.stroke();
    }

    // regions, clipped to the coastline
    if (aAH > 0) {
      c.save();
      if (land) { c.beginPath(); path(land); c.clip(); }

      // Austria-Hungary without Bosnia and Herzegovina
      c.beginPath(); path(G.ah); path(G.bih);
      c.fillStyle = 'rgba(' + INK + ',' + (0.14 * aAH).toFixed(3) + ')'; c.fill('evenodd');
      c.beginPath(); path(G.ah);
      c.strokeStyle = 'rgba(' + INK + ',' + (0.38 * aAH).toFixed(3) + ')'; c.lineWidth = 0.7; c.stroke();

      if (aBiH > 0) {
        hatch(now, aBiH);
        c.beginPath(); path(G.bih);
        c.strokeStyle = 'rgba(' + INK + ',' + (0.3 * aBiH).toFixed(3) + ')'; c.lineWidth = 0.6; c.stroke();
      }
      if (aRed > 0) {
        c.beginPath(); path(G.herz); path(G.boka);
        c.fillStyle = 'rgba(' + RED + ',' + (0.34 * aRed).toFixed(3) + ')'; c.fill();
        c.strokeStyle = 'rgba(' + RED + ',' + (0.6 * aRed).toFixed(3) + ')'; c.lineWidth = 0.7; c.stroke();
      }
      c.restore();
    }

    // the line
    var lp = easeInOutSine(ramp(now, T.line));
    if (lp > 0) {
      var n = Math.floor(lp * ARC_N), coords = arcFull.coordinates.slice(0, n + 1);
      coords.push(arc(lp));
      c.beginPath(); path({ type: 'LineString', coordinates: coords });
      c.strokeStyle = 'rgb(' + RED + ')'; c.lineWidth = small ? 1.1 : 1.3; c.lineCap = 'round'; c.stroke();
      if (lp < 1) {
        var hp = arc(lp);
        if (visible(hp, centre)) {
          var q = proj(hp);
          c.fillStyle = 'rgb(' + RED + ')';
          c.beginPath(); c.arc(q[0], q[1], small ? 2 : 2.4, 0, 6.2832); c.fill();
        }
      }
    }

    // start point
    if (now >= T.dot && visible(START, centre)) {
      var ps = proj(START), pp = clamp01((now - T.dot) / 480);
      c.fillStyle = 'rgb(' + RED + ')';
      c.beginPath(); c.arc(ps[0], ps[1], (small ? 3.2 : 3.8) * easeOutBack(pp), 0, 6.2832); c.fill();
      var rp = (now - T.dot - 150) / 1600;
      if (rp > 0 && rp < 1) {
        c.strokeStyle = 'rgba(' + RED + ',' + (0.55 * (1 - rp)).toFixed(3) + ')'; c.lineWidth = 1;
        c.beginPath(); c.arc(ps[0], ps[1], 4 + 18 * easeOut(rp), 0, 6.2832); c.stroke();
      }
    }

    // Jackson
    var tj = T.line[1];
    if (now >= tj && visible(END, centre)) {
      var pj = proj(END), pq = clamp01((now - tj) / 450);
      c.fillStyle = 'rgb(' + INK + ')';
      c.beginPath(); c.arc(pj[0], pj[1], (small ? 2.8 : 3.2) * easeOutBack(pq), 0, 6.2832); c.fill();
    }

    placeLabels(now, centre);
  }

  function placeLabels(now, centre) {
    var aIn = easeOut(ramp(now, T.labIn)) * (1 - ramp(now, T.labOut));
    var aJ = easeOut(ramp(now, [T.line[1] + 150, T.line[1] + 900]));
    Object.keys(labels).forEach(function (key) {
      var el = labels[key], p = LABEL_AT[key];
      var a = key === 'jackson' ? aJ : aIn;
      if (key === 'ah') a *= 0.9;
      if (a <= 0 || !visible(p, centre)) { el.style.opacity = 0; return; }
      var q = proj(p), x = q[0], y = q[1], tf;
      if (key === 'jackson')   tf = 'translate(' + (x - 4).toFixed(1) + 'px,' + (y + 11).toFixed(1) + 'px)';
      else if (key === 'herz') tf = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-100%,-50%)';
      else if (key === 'boka') tf = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translateY(-50%)';
      else                     tf = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%)';
      el.style.transform = tf;
      el.style.opacity = a.toFixed(3);
    });
    if (pin) {
      if (now >= T.line[1] + 400 && visible(END, centre)) {
        var pj = proj(END);
        pin.style.left = pj[0].toFixed(1) + 'px'; pin.style.top = pj[1].toFixed(1) + 'px';
        pin.classList.add('is-on');
      } else pin.classList.remove('is-on');
    }
  }

  // ---- run --------------------------------------------------------------------
  var t0 = null, started = false, done = false, nowMs = 0;

  function frame(ts) {
    if (t0 === null) t0 = ts;
    nowMs = ts - t0;
    draw(nowMs);
    if (nowMs >= T.chrome) root.classList.add('chrome-in');
    if (nowMs < Math.max(T.end, (landAt || 0) + T.coast[1])) requestAnimationFrame(frame);
    else done = true;
  }

  function start() {
    if (started) return;
    started = true;
    if (reduce) {
      nowMs = 1e9; landAt = 0; done = true;
      draw(nowMs); root.classList.add('chrome-in');
      return;
    }
    requestAnimationFrame(frame);
  }

  if (!layout()) { root.classList.add('chrome-in'); return; }

  // blank globe until the coastline is in (or we stop waiting)
  setCam(C0, K0, T0); draw(-1);
  var waited = setTimeout(start, WAIT_FOR_COAST);
  loadLand(function () {
    if (land) {
      landAt = started ? Math.max(0, nowMs) : 0;   // late coastline fades in on its own
      if (done) { done = false; t0 = performance.now() - nowMs; requestAnimationFrame(frame); }
    }
    clearTimeout(waited); start();
  });

  // ---- resize -------------------------------------------------------------------
  var lastW = 0, lastH = 0, rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var r = stage.getBoundingClientRect();
      if (Math.abs(r.width - lastW) < 2 && Math.abs(r.height - lastH) < 60) return;
      lastW = r.width; lastH = r.height;
      if (!layout()) return;
      if (done || !started) draw(started ? nowMs : -1);   // a running intro picks it up
    }, 120);
  });
  lastW = W; lastH = H;
})();
