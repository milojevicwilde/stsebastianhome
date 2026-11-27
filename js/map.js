// =============================================================================
// Map: San Francisco, Sacramento, Los Angeles, Las Vegas and Phoenix in black,
// joined to Jackson (red) by fine dotted lines that roughly follow the real
// highways. The routes form one road network (a tree rooted in Jackson), so
// shared stretches are drawn once. The dots travel inward at one pace and all
// arrive in Jackson together; each city pops up as its line sets off.
//
// Outlines: Natural Earth coastlines and borders (world-atlas) and US state
// lines (us-atlas), both public domain, via the jsDelivr CDN, cached in the
// browser after the first visit. If they can't load, the routes still show.
// =============================================================================
(function () {
  'use strict';

  var stage = document.querySelector('.stage');
  if (!stage) return;
  var coastC = stage.querySelector('.map-coast');
  var routeC = stage.querySelector('.map-routes');
  var root = document.documentElement;
  var reduce = root.classList.contains('reduce');

  // ---- timeline (ms from start) ------------------------------------------
  var T = {
    home:    80,     // Jackson pops
    start:   450,    // Phoenix (the farthest) sets off
    travel:  3200,   // until everything reaches Jackson  -> ~3650
    coastIn: 300,    // outlines start fading in
    chrome:  3500    // header and footer fade in (done ~4.6 s)
  };
  var DOT_FADE = 150, POP = 420;

  // ---- road network -------------------------------------------------------
  // [lon, lat]. Waypoints sit on (or near) the actual highway corridors.
  var P = {
    jackson: [-120.774, 38.349],
    // CA-49 and CA-16 to Sacramento
    suttercreek: [-120.802, 38.393], amadorcity: [-120.824, 38.420], drytown: [-120.855, 38.441],
    ca16a: [-120.950, 38.470], ranchomurieta: [-121.090, 38.500], sloughhouse: [-121.190, 38.500],
    perkins: [-121.380, 38.530], sacramento: [-121.494, 38.581],
    // CA-88 to Stockton
    martell: [-120.790, 38.370], ca88a: [-120.930, 38.310], ca88b: [-121.050, 38.220],
    clements: [-121.090, 38.190], lockeford: [-121.150, 38.160], waterloo: [-121.210, 38.030],
    stockton: [-121.290, 37.960],
    // I-5, I-205, I-580, Bay Bridge to San Francisco
    i205: [-121.340, 37.780], tracy: [-121.430, 37.740], altamont: [-121.650, 37.730],
    livermore: [-121.770, 37.690], dublin: [-121.930, 37.700], castrovalley: [-122.080, 37.700],
    oakland: [-122.240, 37.790], toll: [-122.300, 37.820], baybridge: [-122.370, 37.800],
    sf: [-122.419, 37.775],
    // CA-99 down the Central Valley, I-5 over the Grapevine to Los Angeles
    manteca: [-121.220, 37.800], ripon: [-121.120, 37.740], modesto: [-120.990, 37.640],
    turlock: [-120.850, 37.490], livingston: [-120.720, 37.390], merced: [-120.480, 37.300],
    chowchilla: [-120.260, 37.120], madera: [-120.060, 36.960], fresno: [-119.790, 36.740],
    selma: [-119.610, 36.570], kingsburg: [-119.550, 36.510], tulare: [-119.350, 36.210],
    delano: [-119.250, 35.770], mcfarland: [-119.230, 35.680], bakersfield: [-119.020, 35.370],
    wheeler: [-118.960, 35.010], grapevine: [-118.920, 34.940], lebec: [-118.870, 34.840],
    gorman: [-118.850, 34.790], pyramid: [-118.760, 34.650], castaic: [-118.620, 34.490],
    santaclarita: [-118.550, 34.390], sylmar: [-118.470, 34.310], burbank: [-118.320, 34.180],
    la: [-118.244, 34.052],
    // CA-58 over Tehachapi to Barstow, I-15 to Las Vegas
    ca58a: [-118.850, 35.330], keene: [-118.560, 35.220], tehachapi: [-118.450, 35.130],
    mojave: [-118.170, 35.050], boron: [-117.650, 35.000], hinkley: [-117.200, 34.930],
    barstow: [-117.020, 34.900], yermo: [-116.850, 34.910], baker: [-116.070, 35.270],
    halloran: [-115.850, 35.370], mountainpass: [-115.540, 35.470], primm: [-115.390, 35.610],
    jean: [-115.330, 35.780], lv: [-115.140, 36.170],
    // I-15 over Cajon Pass, I-10 through the desert to Phoenix
    lenwood: [-117.150, 34.800], victorville: [-117.290, 34.540], hesperia: [-117.320, 34.430],
    cajon: [-117.450, 34.310], devore: [-117.400, 34.220], sanbernardino: [-117.290, 34.100],
    redlands: [-117.180, 34.050], beaumont: [-116.980, 33.930], banning: [-116.880, 33.930],
    palmsprings: [-116.550, 33.920], indio: [-116.220, 33.720], chiriaco: [-115.720, 33.660],
    desertcenter: [-115.400, 33.710], blythe: [-114.600, 33.610], quartzsite: [-114.230, 33.660],
    tonopah: [-112.930, 33.490], buckeye: [-112.580, 33.430], phoenix: [-112.074, 33.448]
  };

  // Each route is a list of waypoints from Jackson. Shared prefixes are drawn once.
  var ROUTES = [
    ['jackson','suttercreek','amadorcity','drytown','ca16a','ranchomurieta','sloughhouse','perkins','sacramento'],
    ['jackson','martell','ca88a','ca88b','clements','lockeford','waterloo','stockton','i205','tracy','altamont','livermore','dublin','castrovalley','oakland','toll','baybridge','sf'],
    ['stockton','manteca','ripon','modesto','turlock','livingston','merced','chowchilla','madera','fresno','selma','kingsburg','tulare','delano','mcfarland','bakersfield','wheeler','grapevine','lebec','gorman','pyramid','castaic','santaclarita','sylmar','burbank','la'],
    ['bakersfield','ca58a','keene','tehachapi','mojave','boron','hinkley','barstow','yermo','baker','halloran','mountainpass','primm','jean','lv'],
    ['barstow','lenwood','victorville','hesperia','cajon','devore','sanbernardino','redlands','beaumont','banning','palmsprings','indio','chiriaco','desertcenter','blythe','quartzsite','tonopah','buckeye','phoenix']
  ];

  // cities (label elements carry the names in both languages)
  var DEST = ['sf', 'sacramento', 'la', 'lv', 'phoenix'];

  // Build the tree: parent of each node, children in order of first mention.
  var parent = {}, kids = { jackson: [] };
  ROUTES.forEach(function (r) {
    for (var i = 1; i < r.length; i++) {
      var a = r[i - 1], b = r[i];
      if (parent[b] === undefined) {
        parent[b] = a;
        (kids[a] = kids[a] || []).push(b);
        kids[b] = kids[b] || [];
      }
    }
  });

  // ---- projection: Lambert azimuthal equal-area, in km ---------------------
  var D2R = Math.PI / 180, LON0 = -118 * D2R, LAT0 = 36 * D2R, RE = 6371;
  var sin0 = Math.sin(LAT0), cos0 = Math.cos(LAT0);
  function proj(lon, lat) {
    var l = lon * D2R - LON0, p = lat * D2R;
    var cp = Math.cos(p), sp = Math.sin(p), cl = Math.cos(l);
    var k = Math.sqrt(2 / (1 + sin0 * sp + cos0 * cp * cl)) * RE;
    return [k * cp * Math.sin(l), -k * (cos0 * sp - sin0 * cp * cl)];
  }
  var KM = {}, bb = [1e9, 1e9, -1e9, -1e9];
  Object.keys(P).forEach(function (n) {
    if (n !== 'jackson' && parent[n] === undefined) return;
    var q = KM[n] = proj(P[n][0], P[n][1]);
    bb[0] = Math.min(bb[0], q[0]); bb[1] = Math.min(bb[1], q[1]);
    bb[2] = Math.max(bb[2], q[0]); bb[3] = Math.max(bb[3], q[1]);
  });

  // ---- labels -------------------------------------------------------------
  var labelEl = {};
  Array.prototype.forEach.call(stage.querySelectorAll('[data-place]'), function (el) {
    labelEl[el.getAttribute('data-place')] = el;
  });
  // where each name sits relative to its dot
  var SIDE = { jackson: 'right', sacramento: 'left', sf: 'left', la: 'left', lv: 'right', phoenix: 'above' };
  // phones: names that would run off the left edge go above / below their dot
  var SIDE_SMALL = { sacramento: 'above-l', sf: 'below-l' };

  // ---- layout state -------------------------------------------------------
  var W = 0, H = 0, DPR = 1, view = null;   // view: {k, ox, oy}
  var dots = null, dests = null, home = null, Smax = 1, sz = null;
  var cctx = coastC.getContext('2d'), rctx = routeC.getContext('2d');

  function toPx(q) { return [q[0] * view.k + view.ox, q[1] * view.k + view.oy]; }

  function layout() {
    var r = stage.getBoundingClientRect();
    W = Math.round(r.width); H = Math.round(r.height);
    if (!W || !H) return false;
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    [coastC, routeC].forEach(function (c) {
      c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
    });

    var small = W < 600;
    sz = {
      dotR: small ? 0.8 : 0.9,
      gap:  small ? 3.0 : 3.4,
      dest: small ? 2.5 : 2.9,
      home: small ? 4.3 : 5,
      margin: small ? 10 : 12
    };

    // room for the city names on the left and right
    var padX = small ? 24 : Math.max(110, W * 0.06);
    var padY = small ? 34 : 44;
    var sw = W - 2 * padX, sh = H - 2 * padY;
    var bw = bb[2] - bb[0], bh = bb[3] - bb[1];
    var k = Math.min(sw / bw, sh / bh) * 0.9;
    view = {
      k: k,
      ox: W / 2 - (bb[0] + bw / 2) * k,
      oy: H / 2 - (bb[1] + bh / 2) * k
    };
    buildNetwork();
    placeLabels();
    return true;
  }

  // ---- geometry: smooth edges, evenly spaced dots ---------------------------
  function unit(v) { var l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; }

  function buildNetwork() {
    var px = {}, tan = {}, cum = {};
    Object.keys(KM).forEach(function (n) { px[n] = toPx(KM[n]); });
    Object.keys(px).forEach(function (n) {
      var p = parent[n], c = kids[n] && kids[n][0];
      var din = p ? unit([px[n][0] - px[p][0], px[n][1] - px[p][1]]) : null;
      var dout = c ? unit([px[c][0] - px[n][0], px[c][1] - px[n][1]]) : null;
      tan[n] = din && dout ? unit([din[0] + dout[0], din[1] + dout[1]]) : (din || dout || [1, 0]);
    });

    dots = []; dests = [];
    cum.jackson = 0;
    var gap = sz.gap;
    var queue = ['jackson'];
    while (queue.length) {
      var a = queue.shift();
      (kids[a] || []).forEach(function (b, idx) {
        var A = px[a], B = px[b];
        var chord = Math.hypot(B[0] - A[0], B[1] - A[1]);
        var dirAB = unit([B[0] - A[0], B[1] - A[1]]);
        var t0;
        if (a === 'jackson') t0 = dirAB;
        else if (idx === 0) t0 = tan[a];
        else t0 = unit([tan[a][0] * 0.5 + dirAB[0], tan[a][1] * 0.5 + dirAB[1]]);
        var t1 = tan[b];
        var c1 = [A[0] + t0[0] * chord / 3, A[1] + t0[1] * chord / 3];
        var c2 = [B[0] - t1[0] * chord / 3, B[1] - t1[1] * chord / 3];
        var n = Math.max(8, Math.ceil(chord / 1.5));
        var prev = A, s = cum[a];
        var next = (Math.floor(s / gap) + 1) * gap;
        for (var i = 1; i <= n; i++) {
          var t = i / n, u = 1 - t;
          var q = [
            u*u*u*A[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t*t*t*B[0],
            u*u*u*A[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t*t*t*B[1]
          ];
          var seg = Math.hypot(q[0] - prev[0], q[1] - prev[1]);
          while (s + seg >= next) {
            var f = (next - s) / seg;
            dots.push(prev[0] + (q[0] - prev[0]) * f, prev[1] + (q[1] - prev[1]) * f, next);
            next += gap;
          }
          s += seg; prev = q;
        }
        cum[b] = s;
        queue.push(b);
      });
    }
    Smax = 0;
    Object.keys(cum).forEach(function (n) { if (cum[n] > Smax) Smax = cum[n]; });
    DEST.forEach(function (n) { dests.push({ id: n, x: px[n][0], y: px[n][1], s: cum[n] }); });
    home = px.jackson;

    // keep dots clear of the end-point discs
    var clearHome = sz.home + 2.2, clearDest = sz.dest + 1.6;
    var kept = [];
    for (var j = 0; j < dots.length; j += 3) {
      var x = dots[j], y = dots[j + 1], ok = Math.hypot(x - home[0], y - home[1]) > clearHome;
      for (var d = 0; ok && d < dests.length; d++) {
        if (Math.hypot(x - dests[d].x, y - dests[d].y) < clearDest) ok = false;
      }
      if (ok) kept.push(x, y, dots[j + 2]);
    }
    dots = kept;
  }

  function placeLabels() {
    var small = W < 600;
    function put(id, x, y, r) {
      var el = labelEl[id]; if (!el) return;
      var g = r + 7, side = (small && SIDE_SMALL[id]) || SIDE[id], tf;
      var X = x.toFixed(1) + 'px', Y = y.toFixed(1) + 'px';
      if (side === 'left')         tf = 'translate(' + (x - g).toFixed(1) + 'px,' + Y + ') translate(-100%,-46%)';
      else if (side === 'above')   tf = 'translate(' + X + ',' + (y - g + 2).toFixed(1) + 'px) translate(-50%,-100%)';
      else if (side === 'above-l') tf = 'translate(' + (x - 6).toFixed(1) + 'px,' + (y - g + 2).toFixed(1) + 'px) translateY(-100%)';
      else if (side === 'below-l') tf = 'translate(' + (x - 6).toFixed(1) + 'px,' + (y + g - 2).toFixed(1) + 'px)';
      else                         tf = 'translate(' + (x + g).toFixed(1) + 'px,' + Y + ') translateY(-46%)';
      el.style.transform = tf;
      el.style.justifyItems = side === 'left' ? 'end' : side === 'above' ? 'center' : 'start';
    }
    put('jackson', home[0], home[1], sz.home);
    dests.forEach(function (d) { put(d.id, d.x, d.y, sz.dest); });
  }

  // ---- timing: one front moving inward, same pace on every route ------------
  // The front starts at the farthest city and slows gently into Jackson:
  // covered fraction y = 1.3x - 0.3x^2 of the longest route at time fraction x.
  function timeAt(s) {
    var y = 1 - s / Smax;
    var x = (1.3 - Math.sqrt(Math.max(0, 1.69 - 1.2 * y))) / 0.6;
    return T.start + T.travel * x;
  }
  var ARRIVE = T.start + T.travel;
  function easeOutBack(p) { var c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); }
  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }

  // ---- drawing --------------------------------------------------------------
  var INK = '28,27,24', RED = '#9E3729', RED_RGB = '158,55,41';

  function drawRoutes(now) {
    var c = rctx;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.clearRect(0, 0, W, H);

    // route dots
    var r = sz.dotR, fading = [];
    c.fillStyle = 'rgba(' + INK + ',.62)';
    c.beginPath();
    for (var i = 0; i < dots.length; i += 3) {
      var t = timeAt(dots[i + 2]);
      if (now < t) continue;
      var a = (now - t) / DOT_FADE;
      if (a >= 1) { c.moveTo(dots[i] + r, dots[i + 1]); c.arc(dots[i], dots[i + 1], r, 0, 6.2832); }
      else fading.push(dots[i], dots[i + 1], a);
    }
    c.fill();
    for (var j = 0; j < fading.length; j += 3) {
      c.fillStyle = 'rgba(' + INK + ',' + (0.62 * fading[j + 2]).toFixed(3) + ')';
      c.beginPath(); c.arc(fading[j], fading[j + 1], r * 1.25, 0, 6.2832); c.fill();
    }

    // cities: pop as their line sets off
    dests.forEach(function (d) {
      var t = timeAt(d.s) - 60;
      if (now < t) return;
      var p = Math.min(1, (now - t) / POP);
      c.fillStyle = 'rgb(' + INK + ')';
      c.beginPath(); c.arc(d.x, d.y, Math.max(0, sz.dest * easeOutBack(p)), 0, 6.2832); c.fill();
      if (p < 1) {
        c.strokeStyle = 'rgba(' + INK + ',' + (0.38 * (1 - p)).toFixed(3) + ')';
        c.lineWidth = 0.8;
        c.beginPath(); c.arc(d.x, d.y, sz.dest + 9 * easeOut(p), 0, 6.2832); c.stroke();
      }
      if (labelEl[d.id] && now >= t + 120) labelEl[d.id].classList.add('is-on');
    });

    // Jackson: pops first, ripples again when everything arrives
    if (now >= T.home) {
      var ph = Math.min(1, (now - T.home) / 480);
      c.fillStyle = RED;
      c.beginPath(); c.arc(home[0], home[1], sz.home * easeOutBack(ph), 0, 6.2832); c.fill();
      [T.home + 200, ARRIVE - 60].forEach(function (start, n) {
        var rp = (now - start) / 1900;
        if (rp > 0 && rp < 1) {
          c.strokeStyle = 'rgba(' + RED_RGB + ',' + ((n ? 0.6 : 0.5) * (1 - rp)).toFixed(3) + ')';
          c.lineWidth = 1;
          c.beginPath(); c.arc(home[0], home[1], sz.home + (n ? 24 : 18) * easeOut(rp), 0, 6.2832); c.stroke();
        }
      });
      if (labelEl.jackson && now >= T.home + 250) labelEl.jackson.classList.add('is-on');
    }
  }

  // ---- outlines: coast + national borders, US state lines -------------------
  var URLS = {
    coast: [
      'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json',
      'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
    ],
    states: ['https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json']
  };
  var CACHE_KEY = 'ssh-map-v1';
  var BOX = [-134, 24, -100, 48];        // lon/lat window worth keeping
  var lines = { coast: null, states: null };   // arrays of Float64Array km coords

  // arcs -> lon/lat polylines inside BOX. `only` (optional) = set of arc indexes to keep.
  function fromTopo(topo, only) {
    var tr = topo.transform, out = [];
    topo.arcs.forEach(function (arc, idx) {
      if (only && !only[idx]) return;
      var x = 0, y = 0, cur = [];
      for (var i = 0; i < arc.length; i++) {
        var lon, lat;
        if (tr) { x += arc[i][0]; y += arc[i][1]; lon = x * tr.scale[0] + tr.translate[0]; lat = y * tr.scale[1] + tr.translate[1]; }
        else { lon = arc[i][0]; lat = arc[i][1]; }
        if (lon < BOX[0] || lon > BOX[2] || lat < BOX[1] || lat > BOX[3]) {
          if (cur.length > 2) out.push(cur);
          cur = []; continue;
        }
        cur.push(Math.round(lon * 1000) / 1000, Math.round(lat * 1000) / 1000);
      }
      if (cur.length > 2) out.push(cur);
    });
    return out;
  }
  // state lines only where two states meet (the coast comes from the other file)
  function innerArcs(topo) {
    var cnt = {}, geoms = topo.objects.states.geometries;
    function walk(a) {
      if (typeof a === 'number') { var i = a < 0 ? ~a : a; cnt[i] = (cnt[i] || 0) + 1; }
      else a.forEach(walk);
    }
    geoms.forEach(function (g) { if (g.arcs) walk(g.arcs); });
    var keep = {};
    Object.keys(cnt).forEach(function (i) { if (cnt[i] > 1) keep[i] = true; });
    return keep;
  }
  function toKm(arr) {
    return arr.map(function (ll) {
      var a = new Float64Array(ll.length);
      for (var i = 0; i < ll.length; i += 2) { var q = proj(ll[i], ll[i + 1]); a[i] = q[0]; a[i + 1] = q[1]; }
      return a;
    });
  }

  function strokeLines(c, set, alpha, width) {
    if (!set) return;
    var k = view.k, ox = view.ox, oy = view.oy;
    c.beginPath();
    for (var i = 0; i < set.length; i++) {
      var a = set[i];
      c.moveTo(a[0] * k + ox, a[1] * k + oy);
      for (var j = 2; j < a.length; j += 2) c.lineTo(a[j] * k + ox, a[j + 1] * k + oy);
    }
    c.strokeStyle = 'rgba(' + INK + ',' + alpha + ')';
    c.lineWidth = width;
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.stroke();
  }
  function drawCoast() {
    var c = cctx;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.clearRect(0, 0, W, H);
    var small = W < 600;
    strokeLines(c, lines.states, '.2', small ? 0.6 : 0.7);
    strokeLines(c, lines.coast, '.36', small ? 0.75 : 0.85);
  }

  var t0 = null;
  function coastReady() {
    drawCoast();
    if (coastC.classList.contains('is-on')) return;
    var elapsed = t0 === null ? 0 : performance.now() - t0;
    if (reduce) { coastC.style.transition = 'none'; coastC.classList.add('is-on'); return; }
    if (elapsed > T.coastIn + 600) coastC.classList.add('is-late');
    setTimeout(function () {
      requestAnimationFrame(function () { coastC.classList.add('is-on'); });
    }, Math.max(0, T.coastIn - elapsed));
  }

  function fetchFirst(urls, done) {
    (function tryUrl(i) {
      if (i >= urls.length || !window.fetch) return done(null);
      fetch(urls[i]).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      }).then(function (j) { done(j, i); }).catch(function () { tryUrl(i + 1); });
    })(0);
  }
  function loadOutlines() {
    try {
      var cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && cached.coast) {
        lines.coast = toKm(cached.coast);
        if (cached.states) lines.states = toKm(cached.states);
        coastReady(); return;
      }
    } catch (e) {}
    var got = { coast: null, states: null }, pending = 2, best = true;
    function finish() {
      if (--pending) return;
      if (best && got.coast && got.states) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(got)); } catch (e) {}
      }
    }
    fetchFirst(URLS.coast, function (topo, i) {
      if (topo) { got.coast = fromTopo(topo); lines.coast = toKm(got.coast); if (i) best = false; coastReady(); }
      finish();
    });
    fetchFirst(URLS.states, function (topo) {
      if (topo) { got.states = fromTopo(topo, innerArcs(topo)); lines.states = toKm(got.states); if (lines.coast) coastReady(); }
      finish();
    });
  }

  // ---- run --------------------------------------------------------------------
  var END = ARRIVE + 2000;
  var done = false;

  function frame(ts) {
    if (t0 === null) t0 = ts;
    var now = ts - t0;
    drawRoutes(now);
    if (now >= T.chrome) root.classList.add('chrome-in');
    if (now < END) requestAnimationFrame(frame);
    else done = true;
  }

  if (!layout()) { root.classList.add('chrome-in'); return; }
  loadOutlines();
  if (reduce) {
    done = true; t0 = 0;
    drawRoutes(1e9);
    root.classList.add('chrome-in');
  } else {
    requestAnimationFrame(frame);
  }

  // Re-layout on real size changes only (ignore mobile toolbar wobble).
  var lastW = W, lastH = H, rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var r = stage.getBoundingClientRect();
      if (Math.abs(r.width - lastW) < 2 && Math.abs(r.height - lastH) < 60) return;
      if (!layout()) return;
      lastW = W; lastH = H;
      drawCoast();
      if (done) drawRoutes(1e9);
    }, 120);
  });
})();
