/* Cube simulator and SVG renderer. Yellow on top, green in front, white cross on the bottom. */
(function (root) {
  'use strict';
  var ROT = {
    x: function (v) { return [v[0], v[2], -v[1]]; },
    y: function (v) { return [-v[2], v[1], v[0]]; },
    z: function (v) { return [v[1], -v[0], v[2]]; }
  };
  var AX = { x: 0, y: 1, z: 2 };
  var MOVES = {
    R: ['x', [1], 1], L: ['x', [-1], -1], M: ['x', [0], -1], r: ['x', [0, 1], 1], l: ['x', [-1, 0], -1], x: ['x', [-1, 0, 1], 1],
    U: ['y', [1], 1], D: ['y', [-1], -1], E: ['y', [0], -1], u: ['y', [0, 1], 1], d: ['y', [-1, 0], -1], y: ['y', [-1, 0, 1], 1],
    F: ['z', [1], 1], B: ['z', [-1], -1], S: ['z', [0], 1], f: ['z', [0, 1], 1], b: ['z', [-1, 0], -1], z: ['z', [-1, 0, 1], 1]
  };
  var FACES = { U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0] };
  var COLORS = { U: '#f7d417', D: '#f3f4f1', F: '#1e9e57', B: '#2b6fe0', R: '#f58a1f', L: '#d8323a' };
  var DIRS = [[0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0]];

  function solved() {
    var s = [];
    Object.keys(FACES).forEach(function (f) {
      var n = FACES[f];
      for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) {
        var p = n[0] ? [n[0], a, b] : n[1] ? [a, n[1], b] : [a, b, n[2]];
        s.push({ p: p, n: n.slice(), c: f, hp: p.slice() });
      }
    });
    return s;
  }
  function clone(st) { return st.map(function (s) { return { p: s.p.slice(), n: s.n.slice(), c: s.c, hp: s.hp }; }); }
  function parse(alg) {
    return alg.replace(/[()\[\]]/g, ' ').trim().split(/\s+/).filter(Boolean).map(function (t) {
      var m = /^([RLUDFBMESrludfbxyz])(2'?|'|3)?$/.exec(t);
      if (!m) throw new Error('Bad move "' + t + '" in "' + alg + '"');
      var k = !m[2] ? 1 : m[2].charAt(0) === '2' ? 2 : 3;
      return [m[1], k];
    });
  }
  function tokens(alg) { return parse(alg).map(function (m) { return m[0] + (m[1] === 2 ? '2' : m[1] === 3 ? "'" : ''); }); }
  function invert(alg) {
    return parse(alg).reverse().map(function (m) { return m[0] + (m[1] === 2 ? '2' : m[1] === 1 ? "'" : ''); }).join(' ');
  }
  function apply(state, alg) {
    parse(alg).forEach(function (m) {
      var def = MOVES[m[0]], rot = ROT[def[0]], ax = AX[def[0]];
      var times = (def[2] === 1 ? m[1] : 4 - m[1]) % 4;
      state.forEach(function (s) {
        if (def[1].indexOf(s.p[ax]) < 0) return;
        for (var i = 0; i < times; i++) { s.p = rot(s.p); s.n = rot(s.n); }
      });
    });
    return state;
  }
  /* What one move looks like in mid-turn: the axis, the layers that move and the signed angle it ends at. */
  function turn(token) {
    var m = parse(token)[0], def = MOVES[m[0]];
    var q = m[1] === 3 ? -1 : m[1];
    return { axis: AX[def[0]], layers: def[1], angle: def[2] * q * Math.PI / 2 };
  }
  function spin(v, axis, t) {
    var c = Math.cos(t), s = Math.sin(t), x = v[0], y = v[1], z = v[2];
    if (axis === 0) return [x, y * c + z * s, -y * s + z * c];
    if (axis === 1) return [x * c - z * s, y, x * s + z * c];
    return [x * c + y * s, -x * s + y * c, z];
  }
  function caseFor(alg) { return apply(solved(), invert(alg)); }
  function zeros(v) { return (v[0] === 0) + (v[1] === 0) + (v[2] === 0); }
  var MASK = 'var(--mask, #8d93a0)';
  var MASKS = {
    none: function (s) { return COLORS[s.c]; },
    pll: function (s) { return COLORS[s.c]; },
    oll: function (s) { return s.c === 'U' ? COLORS.U : MASK; },
    f2l: function (s) { return s.hp[1] === 1 ? MASK : COLORS[s.c]; },
    olldone: function (s) { return s.hp[1] === 1 && s.c !== 'U' ? MASK : COLORS[s.c]; },
    cross: function (s) { return zeros(s.hp) === 2 || (s.hp[1] === -1 && zeros(s.hp) === 1) ? COLORS[s.c] : MASK; }
  };
  var BODY = '#14161b';

  function plan(state, mask, size) {
    var c = 30, t = 9, g = 3, o = t + g + 2, W = o * 2 + c * 3, fill = MASKS[mask || 'pll'], out = [];
    out.push('<rect x="' + (o - 2) + '" y="' + (o - 2) + '" width="' + (c * 3 + 4) + '" height="' + (c * 3 + 4) + '" rx="5" fill="' + BODY + '"/>');
    state.forEach(function (s) {
      if (s.p[1] !== 1) return;
      var x, y, w, h, col = s.p[0] + 1, row = s.p[2] + 1;
      if (s.n[1] === 1) { x = o + col * c + 1.5; y = o + row * c + 1.5; w = h = c - 3; }
      else if (s.n[2] === 1) { x = o + col * c + 2; y = o + 3 * c + g; w = c - 4; h = t; }
      else if (s.n[2] === -1) { x = o + col * c + 2; y = 2; w = c - 4; h = t; }
      else if (s.n[0] === 1) { x = o + 3 * c + g; y = o + row * c + 2; w = t; h = c - 4; }
      else if (s.n[0] === -1) { x = 2; y = o + row * c + 2; w = t; h = c - 4; }
      else return;
      out.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2.5" fill="' + fill(s) + '" stroke="' + BODY + '" stroke-width="1"/>');
    });
    return '<svg viewBox="0 0 ' + W + ' ' + W + '" width="' + (size || 120) + '" height="' + (size || 120) + '" role="img" aria-label="Top view of the last layer">' + out.join('') + '</svg>';
  }

  /* Three-quarter view, drawn cubie by cubie so a layer can be shown part-way through a turn. */
  function iso(state, mask, size, anim) {
    var S = 26, C = 0.866, fill = MASKS[mask || 'none'], pad = anim ? 30 : 4;
    var ox = 3 * C * S + pad, oy = 3 * S + pad, map = {}, cubies = [];
    state.forEach(function (s) { map[s.p.join() + '|' + s.n.join()] = s; });
    function pr(v) { return ((v[0] - v[2]) * C * S + ox).toFixed(1) + ',' + (((v[0] + v[2]) * 0.5 - v[1]) * S + oy).toFixed(1); }
    for (var x = -1; x <= 1; x++) for (var y = -1; y <= 1; y++) for (var z = -1; z <= 1; z++) {
      if (!x && !y && !z) continue;
      var c = [x, y, z], moving = anim && anim.layers.indexOf(c[anim.axis]) >= 0, t = moving ? anim.angle : 0;
      var ctr = t ? spin(c, anim.axis, t) : c, polys = '';
      for (var d = 0; d < 6; d++) {
        var n = DIRS[d], nn = t ? spin(n, anim.axis, t) : n;
        if (nn[0] + nn[1] + nn[2] <= 0.02) continue;
        var st = map[c.join() + '|' + n.join()];
        if (!st && !anim) continue;
        var axes = [0, 1, 2].filter(function (i) { return n[i] === 0; });
        var quad = function (half) {
          return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (k) {
            var v = [c[0] + n[0] * 0.5, c[1] + n[1] * 0.5, c[2] + n[2] * 0.5];
            v[axes[0]] += k[0] * half; v[axes[1]] += k[1] * half;
            return pr(t ? spin(v, anim.axis, t) : v);
          }).join(' ');
        };
        polys += '<polygon points="' + quad(0.5) + '" fill="' + BODY + '" stroke="' + BODY + '" stroke-width="1" stroke-linejoin="round"/>';
        if (st) { var f = fill(st); polys += '<polygon points="' + quad(0.41) + '" fill="' + f + '" stroke="' + f + '" stroke-width="2" stroke-linejoin="round"/>'; }
      }
      cubies.push([ctr[0] + ctr[1] + ctr[2], polys]);
    }
    cubies.sort(function (a, b) { return a[0] - b[0]; });
    var W = 6 * C * S + pad * 2, H = 6 * S + pad * 2;
    return '<svg viewBox="0 0 ' + W.toFixed(0) + ' ' + H + '" width="' + (size || 132) + '" role="img" aria-label="Cube diagram">' + cubies.map(function (q) { return q[1]; }).join('') + '</svg>';
  }

  function scramble(len) {
    var faces = ['U', 'D', 'R', 'L', 'F', 'B'], suf = ['', "'", '2'], out = [], last = -1, prev = -1;
    while (out.length < (len || 20)) {
      var f = Math.floor(Math.random() * 6);
      if (f === last) continue;
      if ((f >> 1) === (last >> 1) && (f >> 1) === (prev >> 1)) continue;
      out.push(faces[f] + suf[Math.floor(Math.random() * 3)]);
      prev = last; last = f;
    }
    return out.join(' ');
  }

  var api = { solved: solved, clone: clone, apply: apply, invert: invert, parse: parse, tokens: tokens, turn: turn, caseFor: caseFor, plan: plan, iso: iso, scramble: scramble };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Cube = api;
})(this);
