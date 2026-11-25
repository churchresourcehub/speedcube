(function () {
  'use strict';
  var $ = function (q, el) { return Array.prototype.slice.call((el || document).querySelectorAll(q)); };
  var $1 = function (q, el) { return (el || document).querySelector(q); };
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  var CALM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- saved state (this browser only) ---------- */
  var KEY = 'cube-course-v1', store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { store = {}; }
  ['checks', 'algs', 'drills', 'watched', 'days', 'quiz'].forEach(function (k) { store[k] = store[k] || {}; });
  store.times = store.times || []; store.splits = store.splits || [];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }
  function today(d) { d = d || new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function touchDay() { store.days[today()] = 1; }
  function streak() {
    var n = 0, d = new Date();
    if (!store.days[today(d)]) d.setDate(d.getDate() - 1);
    while (store.days[today(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function fmt(ms) {
    if (ms == null) return '–';
    var s = ms / 1000, m = Math.floor(s / 60), r = (s - m * 60).toFixed(2);
    return m ? m + ':' + (r < 10 ? '0' : '') + r : r;
  }
  function avgOf(list, n) {
    if (list.length < n) return null;
    var a = list.slice(-n).sort(function (x, y) { return x - y; }).slice(1, -1);
    return a.reduce(function (x, y) { return x + y; }, 0) / a.length;
  }

  /* ---------- algorithm sets ---------- */
  var SETS = [
    { key: 'f2l', name: 'F2L basics', view: 'iso', mask: 'f2l', list: ALGS.f2l },
    { key: 'oll2', name: '2-look OLL', view: 'plan', mask: 'oll', list: ALGS.ollEdges.concat(ALGS.ollCorners) },
    { key: 'pll2', base: 'pll', name: '2-look PLL', view: 'plan', mask: 'pll', list: ALGS.pll.filter(function (a) { return a.group === 'two'; }) },
    { key: 'pll', name: 'Full PLL', view: 'plan', mask: 'pll', list: ALGS.pll },
    { key: 'oll', name: 'Full OLL', view: 'plan', mask: 'oll', list: ALGS.oll }
  ];
  var SET = {}; SETS.forEach(function (s) { SET[s.key] = s; s.base = s.base || s.key; });
  var HTMLSET = { f2l: 'f2l', ollEdges: 'oll2', ollCorners: 'oll2', pll: 'pll', oll: 'oll' };
  function aid(set, a) { return set.base + ':' + a.name; }
  function rec(id) { return store.algs[id] || (store.algs[id] = { s: 0, n: 0 }); }
  function status(id) { return store.algs[id] ? store.algs[id].s : 0; }
  function known(set) { return set.list.filter(function (a) { return status(aid(set, a)) === 2; }).length; }
  function pic(set, st, size) { return set.view === 'plan' ? Cube.plan(st, set.mask, size || 104) : Cube.iso(st, set.mask, size || 112); }

  /* ---------- animated cube ---------- */
  var STILL = { axis: 0, layers: [], angle: 0 };
  function draw(el, st, mask) { el._gen = (el._gen || 0) + 1; el.innerHTML = Cube.iso(st, mask, 190, STILL); }
  /* A frame callback that still fires when the tab is in the background. */
  function nextFrame(cb) { var fired = false, f = function () { if (!fired) { fired = true; cb(performance.now()); } }; requestAnimationFrame(f); setTimeout(f, 80); }
  function animate(el, st, tok, mask, ms, done) {
    var t = Cube.turn(tok), t0 = performance.now(), gen = el._gen = (el._gen || 0) + 1;
    ms = CALM ? 0 : ms * (Math.abs(t.angle) > 2 ? 1.5 : 1);
    (function frame(now) {
      if (!el.isConnected || el._gen !== gen) return;
      var k = ms ? Math.min(1, (now - t0) / ms) : 1, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      if (k < 1) { el.innerHTML = Cube.iso(st, mask, 190, { axis: t.axis, layers: t.layers, angle: t.angle * e }); nextFrame(frame); }
      else { Cube.apply(st, tok); draw(el, st, mask); done && done(); }
    })(t0);
  }

  function makePlayer(el, o) {
    el.innerHTML = '<div class="player"><div class="pl-cube"></div><div><div class="pl-moves"></div><div class="row">' +
      '<button type="button" class="btn small" data-a="reset">Restart</button><button type="button" class="btn small" data-a="back">Back</button>' +
      '<button type="button" class="btn small primary" data-a="play">Play</button><button type="button" class="btn small" data-a="next">Step</button>' +
      '<button type="button" class="btn small" data-a="speed">Speed: normal</button></div></div></div>';
    var cube = $1('.pl-cube', el), moves = $1('.pl-moves', el), playBtn = $1('[data-a=play]', el), spBtn = $1('[data-a=speed]', el);
    var toks, start, st, i, busy = false, playing = false, speeds = [['slow', 800], ['normal', 420], ['fast', 200]], sp = 1, mask;
    function paint() {
      $('span', moves).forEach(function (s, k) { s.className = k < i ? 'did' : k === i ? 'now' : ''; });
      playBtn.textContent = playing ? 'Pause' : i >= toks.length ? 'Play again' : 'Play';
    }
    function load(n) {
      playing = false; busy = false; mask = n.mask || 'none'; toks = Cube.tokens(n.alg);
      start = n.start ? Cube.clone(n.start) : n.fromSolved ? Cube.solved() : Cube.caseFor(n.alg);
      st = Cube.clone(start); i = 0;
      moves.innerHTML = toks.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
      draw(cube, st, mask); paint();
    }
    function step(cb) {
      if (busy || i >= toks.length) return;
      busy = true;
      animate(cube, st, toks[i], mask, speeds[sp][1], function () { i++; busy = false; paint(); cb && cb(); });
    }
    function run() { if (!playing) return; if (i >= toks.length) { playing = false; paint(); return; } step(function () { setTimeout(run, CALM ? 450 : 90); }); }
    function goto(k) { st = Cube.apply(Cube.clone(start), toks.slice(0, k).join(' ')); i = k; draw(cube, st, mask); paint(); }
    el.addEventListener('click', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (!a) return;
      if (a === 'speed') { sp = (sp + 1) % 3; spBtn.textContent = 'Speed: ' + speeds[sp][0]; return; }
      if (busy) return;
      if (a === 'play') { if (playing) { playing = false; paint(); } else { if (i >= toks.length) goto(0); playing = true; paint(); run(); } }
      else { playing = false; if (a === 'reset') goto(0); else if (a === 'back') { if (i > 0) goto(i - 1); } else if (a === 'next') step(); paint(); }
    });
    load(o);
    return { load: load };
  }

  /* ---------- stopwatch shared by timer, drills and trainer ---------- */
  var activeTap = null;
  function makeWatch(pad, read, onStop, onStart) {
    var running = false, t0 = 0, raf = 0, stopped = 0, api = {};
    function tick() { read.textContent = fmt(performance.now() - t0); raf = requestAnimationFrame(tick); }
    function tap() { if (api.tap) api.tap(); else stop(); }
    function start() { running = true; t0 = performance.now(); pad.classList.add('running'); activeTap = tap; onStart && onStart(); tick(); }
    function stop() {
      var ms = Math.round(performance.now() - t0); running = false; stopped = performance.now(); cancelAnimationFrame(raf);
      pad.classList.remove('running'); activeTap = null; read.textContent = fmt(ms); touchDay(); onStop(ms);
    }
    pad.addEventListener('click', function () { if (running) tap(); else if (performance.now() - stopped > 400) start(); });
    api.start = function () { if (!running && performance.now() - stopped > 400) start(); };
    api.stop = stop; api.elapsed = function () { return performance.now() - t0; }; api.running = function () { return running; };
    return api;
  }
  var mainWatch = null, view = 'home';
  document.addEventListener('keydown', function (e) {
    if (e.repeat) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (activeTap) { e.preventDefault(); activeTap(); return; }
    var tag = e.target.tagName;
    if (e.key === ' ' && view === 'timer' && mainWatch && tag !== 'BUTTON' && tag !== 'INPUT' && tag !== 'A') { e.preventDefault(); mainWatch.start(); }
  });

  /* ---------- modal ---------- */
  var modal = document.getElementById('modal'), modalBody = document.getElementById('modal-body');
  function closeModal() { modal.classList.remove('on', 'wide'); modalBody.innerHTML = ''; }
  function openVideo(id, title) {
    modalBody.innerHTML = '<h3 style="margin:0 70px 12px 0">' + esc(title) + '</h3><div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="' + esc(title) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>' +
      '<p class="note" style="margin-bottom:0">Not playing? <a href="https://www.youtube.com/watch?v=' + id + '" target="_blank" rel="noopener">Open it on YouTube</a>.</p>';
    modal.classList.add('on', 'wide'); modal.scrollTop = 0;
  }
  document.getElementById('modal-x').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  function openAlg(set, a) {
    var id = aid(set, a), labels = ['Not started', 'Learning', 'Know it'];
    modalBody.innerHTML = '<div class="kicker">' + esc(set.name) + (a.group && set.key === 'oll' ? ' · ' + esc(a.group) : '') + '</div><h2 style="margin:4px 60px 6px 0">' + esc(a.name) + '</h2>' +
      (a.note ? '<p class="note" style="margin-top:0">' + esc(a.note) + '</p>' : '') +
      '<p><code style="font-size:1rem">' + esc(a.alg) + '</code></p><div class="pl"></div>' +
      '<h4 style="margin-top:18px">How well do you know it?</h4><div class="row" style="margin-top:8px">' +
      labels.map(function (l, k) { return '<button type="button" class="btn small" data-s="' + k + '">' + l + '</button>'; }).join('') +
      '<a class="btn small" href="#train" data-sets="' + set.key + '" style="margin-left:auto">Drill this set</a></div>';
    makePlayer($1('.pl', modalBody), { alg: a.alg, mask: set.mask });
    function mark() { $('[data-s]', modalBody).forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-s') === status(id))); }); }
    $('[data-s]', modalBody).forEach(function (b) { b.addEventListener('click', function () { rec(id).s = +b.getAttribute('data-s'); save(); mark(); dots(); }); });
    mark(); modal.classList.add('on'); modal.scrollTop = 0;
  }
  function dots() { $('.alg[data-id]').forEach(function (c) { $1('.dot', c).className = 'dot s' + status(c.getAttribute('data-id')); }); }
  function cards(el, set, list) {
    el.innerHTML = list.map(function (a, k) {
      return '<button type="button" class="alg" data-id="' + esc(aid(set, a)) + '" data-k="' + k + '"><span class="dot"></span><span class="alg-pic">' + pic(set, Cube.caseFor(a.alg)) +
        '</span><span class="alg-body"><h4>' + esc(a.name) + '</h4><code>' + esc(a.alg) + '</code>' + (a.note ? '<p>' + esc(a.note) + '</p>' : '') + '<span class="play">Watch it play</span></span></button>';
    }).join('');
    el.addEventListener('click', function (e) { var c = e.target.closest('.alg'); if (c) openAlg(set, list[+c.getAttribute('data-k')]); });
  }

  /* ---------- static pieces in the lessons ---------- */
  $('.cube').forEach(function (el) {
    var st = Cube.caseFor(el.getAttribute('data-alg') || '');
    el.innerHTML = el.getAttribute('data-view') === 'plan' ? Cube.plan(st, el.getAttribute('data-mask'), 110) : Cube.iso(st, el.getAttribute('data-mask'), 120);
  });
  $('.algs').forEach(function (el) {
    var set = SET[HTMLSET[el.getAttribute('data-set')]], list = ALGS[el.getAttribute('data-set')], g = el.getAttribute('data-group');
    if (g) list = list.filter(function (a) { return a.group === g; });
    cards(el, set, list);
  });
  $('.vids').forEach(function (el) {
    el.innerHTML = ALGS.videos[el.getAttribute('data-level')].map(function (v) {
      var url = v.id ? 'https://www.youtube.com/watch?v=' + v.id : v.url, key = v.id || v.url;
      return '<div class="vid' + (v.id ? '' : ' site') + (store.watched[key] ? ' seen' : '') + '"><a href="' + esc(url) + '" target="_blank" rel="noopener"' + (v.id ? ' data-yt="' + v.id + '" data-t="' + esc(v.t) + '"' : '') + '><i class="ic" aria-hidden="true"></i><div><b>' + esc(v.t) + '</b><span>' + esc(v.by) + (v.id ? ' · YouTube' : '') + (v.why ? '. ' + esc(v.why) : '') + '</span></div></a>' +
        '<label><input type="checkbox" data-key="' + esc(key) + '"' + (store.watched[key] ? ' checked' : '') + ' aria-label="Mark as ' + (v.id ? 'watched' : 'read') + '">' + (v.id ? 'Watched' : 'Read') + '</label></div>';
    }).join('');
    el.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-yt]'); if (!a || e.metaKey || e.ctrlKey) return;
      e.preventDefault(); openVideo(a.getAttribute('data-yt'), a.getAttribute('data-t'));
    });
    el.addEventListener('change', function (e) { var k = e.target.getAttribute('data-key'); if (!k) return; store.watched[k] = e.target.checked; save(); e.target.closest('.vid').classList.toggle('seen', e.target.checked); });
  });
  $('.gate input').forEach(function (b) {
    b.checked = !!store.checks[b.id];
    b.addEventListener('change', function () { store.checks[b.id] = b.checked; save(); lvnav(); });
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-sets]'); if (!a) return;
    store.trainSets = a.getAttribute('data-sets').split(','); save(); closeModal();
    if (view === 'train') renderTrain();
  });

  /* ---------- levels ---------- */
  var LEVELS = [
    { t: 'Set up to improve', s: 'A speedcube, a timer, notation and a baseline', goal: '2:00', mask: 'none' },
    { t: 'Fix your hands and habits', s: 'Finger tricks, cross on the bottom, no cube flips', goal: '2:00 → 1:15', mask: 'cross' },
    { t: 'F2L', s: 'Corner and edge solved together as a pair', goal: '1:15 → 0:50', mask: 'f2l' },
    { t: 'Two-look last layer', s: '16 algorithms replace the beginner last layer', goal: '0:50 → 0:35', mask: 'olldone' },
    { t: 'Full PLL and look-ahead', s: 'All 21 PLLs, a planned cross, no pauses', goal: '0:35 → 0:25', mask: 'none' },
    { t: 'Full OLL', s: 'All 57 OLLs, efficient F2L, cross into first pair', goal: '0:25 → 0:18', mask: 'olldone' },
    { t: 'Advanced techniques', s: 'X-cross, last-layer control, turning speed', goal: '0:18 → 0:12', mask: 'none' }
  ];
  function gate(n) { var b = $('[data-view="level-' + n + '"] .gate input'); return { done: b.filter(function (x) { return x.checked; }).length, all: b.length }; }
  function currentLevel() { for (var n = 0; n < 7; n++) { var g = gate(n); if (g.done < g.all) return n; } return 6; }
  $('[data-view^="level-"]').forEach(function (sec) {
    var n = +sec.getAttribute('data-view').slice(6), nav = document.createElement('div'), pg = document.createElement('div');
    nav.className = 'lvnav'; sec.insertBefore(nav, sec.firstChild);
    pg.className = 'pager';
    pg.innerHTML = (n > 0 ? '<a class="btn" href="#level-' + (n - 1) + '">← Level ' + (n - 1) + '</a>' : '<a class="btn" href="#home">← Home</a>') + (n < 6 ? '<a class="btn primary" href="#level-' + (n + 1) + '">Level ' + (n + 1) + ' →</a>' : '<a class="btn primary" href="#train">Train →</a>');
    sec.appendChild(pg);
  });
  function lvnav() {
    var cur = +(view.slice(6));
    $('.lvnav').forEach(function (nav) {
      nav.innerHTML = LEVELS.map(function (l, n) { var g = gate(n); return '<a href="#level-' + n + '" class="' + (n === cur ? 'on' : '') + (g.done === g.all ? ' done' : '') + '">' + (g.done === g.all ? '✓ ' : '') + n + ' · ' + esc(l.t) + '</a>'; }).join('');
    });
  }

  /* ---------- widgets ---------- */
  var W = {};
  W.player = function (el) { makePlayer(el, { alg: el.getAttribute('data-alg'), mask: el.getAttribute('data-mask') || 'none', fromSolved: !!el.getAttribute('data-fromsolved') }); };

  W.playground = function (el) {
    el.className = 'w';
    var keys = ['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'", 'R2', 'U2', 'M', "M'", 'r', 'f', 'x', 'y', 'z'];
    el.innerHTML = '<h4>Try the moves</h4><div class="two" style="margin-top:8px"><div class="pl-cube"></div><div><div class="keys">' + keys.map(function (k) { return '<button type="button" data-m="' + esc(k) + '">' + esc(k) + '</button>'; }).join('') +
      '</div><p class="note" style="min-height:1.5em"><span class="hist">Tap a move.</span></p><button type="button" class="btn small" data-reset="1">Reset cube</button></div></div>';
    var cube = $1('.pl-cube', el), hist = $1('.hist', el), st = Cube.solved(), busy = false, done = [];
    $1('svg', cube) || draw(cube, st, 'none');
    cube.style.width = '190px';
    el.addEventListener('click', function (e) {
      var m = e.target.getAttribute('data-m');
      if (e.target.getAttribute('data-reset')) { if (busy) return; st = Cube.solved(); done = []; hist.textContent = 'Tap a move.'; draw(cube, st, 'none'); return; }
      if (!m || busy) return;
      busy = true; done.push(m); hist.textContent = done.slice(-12).join(' ');
      animate(cube, st, m, 'none', 380, function () { busy = false; });
    });
  };

  W.stopwatch = function (el) {
    el.className = 'w';
    var id = el.getAttribute('data-id');
    el.innerHTML = '<h4>' + esc(el.getAttribute('data-title')) + '</h4><p class="note">' + esc(el.getAttribute('data-desc')) + '</p><button type="button" class="pad small"><span class="rd">0.00</span><small>Tap to start, tap or press any key to stop</small></button><ul class="chips"></ul>';
    var list = $1('.chips', el);
    function show() {
      var t = store.drills[id] || [], best = t.length ? Math.min.apply(null, t) : null;
      list.innerHTML = t.length ? '<li class="best">Best ' + fmt(best) + '</li>' + t.slice(-6).reverse().map(function (x) { return '<li>' + fmt(x) + '</li>'; }).join('') : '<li class="empty">No attempts yet</li>';
    }
    makeWatch($1('.pad', el), $1('.rd', el), function (ms) { (store.drills[id] = store.drills[id] || []).push(ms); if (store.drills[id].length > 100) store.drills[id].shift(); save(); show(); });
    show();
  };

  W.crossdrill = function (el) {
    el.className = 'w';
    el.innerHTML = '<h4>Drill: cross only</h4><p class="note">Scramble with white on top and green in front. Your cube should match the picture. Turn it over, plan, then time only the cross.</p>' +
      '<div class="two"><div class="cd-pic"></div><div style="min-width:0;width:100%"><div class="scr"></div><button type="button" class="pad small" style="margin-top:10px"><span class="rd">0.00</span><small>Tap when you start turning, tap when the cross is done</small></button></div></div><ul class="chips"></ul><p><button type="button" class="btn small" data-new="1">New scramble</button></p>';
    var scr = $1('.scr', el), picEl = $1('.cd-pic', el), list = $1('.chips', el);
    function fresh() { var s = Cube.scramble(16); scr.textContent = s; picEl.innerHTML = Cube.iso(Cube.apply(Cube.apply(Cube.solved(), 'z2'), s), 'none', 130); }
    function show() {
      var t = store.drills.cross || [], a5 = avgOf(t, 5);
      list.innerHTML = t.length ? '<li class="best">Best ' + fmt(Math.min.apply(null, t)) + '</li>' + (a5 ? '<li>Avg of 5: ' + fmt(a5) + '</li>' : '') + t.slice(-5).reverse().map(function (x) { return '<li>' + fmt(x) + '</li>'; }).join('') : '<li class="empty">No crosses timed yet</li>';
    }
    makeWatch($1('.pad', el), $1('.rd', el), function (ms) { (store.drills.cross = store.drills.cross || []).push(ms); if (store.drills.cross.length > 100) store.drills.cross.shift(); save(); show(); fresh(); });
    $1('[data-new]', el).addEventListener('click', fresh);
    fresh(); show();
  };

  var mIds = 0;
  W.metronome = function (el) {
    el.className = 'w';
    var id = 'bpm-' + (++mIds);
    el.innerHTML = '<h4>Drill: metronome solves</h4><p class="note">Make exactly one turn per beat for the whole F2L and never stop. If you have to stop, the pace is too fast. Raise it by 10 after five clean solves in a row.</p>' +
      '<div class="row" style="margin-top:10px"><span class="beat"></span><button type="button" class="btn primary">Start</button><label for="' + id + '" class="note"><b class="bv">60</b> beats a minute</label><input type="range" id="' + id + '" min="40" max="240" step="5" value="60"></div>';
    var btn = $1('button', el), rng = $1('input', el), bv = $1('.bv', el), beat = $1('.beat', el), ctx = null, timer = 0;
    function tickOnce() {
      beat.classList.add('on'); setTimeout(function () { beat.classList.remove('on'); }, 90);
      try { var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(0.25, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06); o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.07); } catch (e) {}
      timer = setTimeout(function () { if (el.isConnected && el.offsetParent) tickOnce(); else stop(); }, 60000 / +rng.value);
    }
    function stop() { clearTimeout(timer); timer = 0; btn.textContent = 'Start'; }
    btn.addEventListener('click', function () {
      if (timer) { stop(); return; }
      try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); } catch (e) { ctx = null; }
      btn.textContent = 'Stop'; touchDay(); save(); tickOnce();
    });
    rng.addEventListener('input', function () { bv.textContent = rng.value; });
  };

  function makeQuiz(el, o) {
    el.className = 'w quiz';
    var key = o.kind || o.sets.join('+'), score = store.quiz[key] || (store.quiz[key] = { best: 0 }), run = 0, pool = [];
    if (o.kind === 'notation') pool = ['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'", 'M', "M'", 'r', 'R2', 'U2', 'x', 'y'].map(function (m) { return { label: m, move: m }; });
    else o.sets.forEach(function (k) { var s = SET[k]; s.list.forEach(function (a) { pool.push({ label: k === 'oll' ? a.group : a.name, a: a, set: s }); }); });
    el.innerHTML = '<h4>' + esc(o.title || 'Name the case') + '</h4><p class="note"><span class="qs"></span></p><div class="two" style="margin-top:8px"><div class="q-pic"></div><div style="width:100%"><div class="opts"></div><p class="row" style="margin:10px 0 0"><button type="button" class="btn small primary" data-next="1">Next</button><button type="button" class="btn small" data-again="1" hidden>Replay move</button><span class="note qf"></span></p></div></div>';
    var picEl = $1('.q-pic', el), opts = $1('.opts', el), qs = $1('.qs', el), qf = $1('.qf', el), again = $1('[data-again]', el), cur, answered;
    function showScore() { qs.textContent = 'Streak ' + run + ' · best ' + score.best + (o.kind === 'notation' ? '. Watch the cube, then pick the move it made.' : o.sets.indexOf('oll') >= 0 ? '. Pick the shape group.' : '. The case may be turned to any side.'); }
    function playMove() { var st = Cube.solved(); draw(picEl, st, 'none'); setTimeout(function () { animate(picEl, st, cur.move, 'none', 520); }, 250); }
    function next() {
      var c; do { c = pick(pool); } while (cur && pool.length > 1 && c.label === cur.label);
      cur = c; answered = false; qf.textContent = '';
      var labels = [cur.label], all = pool.map(function (p) { return p.label; }).filter(function (l, i, a) { return a.indexOf(l) === i && l !== cur.label; });
      while (labels.length < 4 && all.length) labels.push(all.splice(Math.floor(Math.random() * all.length), 1)[0]);
      labels.sort(function () { return Math.random() - 0.5; });
      opts.innerHTML = labels.map(function (l) { return '<button type="button">' + esc(l) + '</button>'; }).join('');
      if (cur.move) { again.hidden = false; playMove(); }
      else {
        var st = Cube.caseFor(cur.a.alg), turns = cur.set.key === 'f2l' ? 0 : Math.floor(Math.random() * 4);
        if (turns) Cube.apply(st, ['y', 'y2', "y'"][turns - 1]);
        picEl.innerHTML = pic(cur.set, st, 150);
      }
      showScore();
    }
    opts.addEventListener('click', function (e) {
      if (e.target.tagName !== 'BUTTON' || answered) return;
      answered = true; var ok = e.target.textContent === cur.label;
      $('button', opts).forEach(function (b) { b.disabled = true; if (b.textContent === cur.label) b.className = 'right'; });
      if (ok) { run++; if (run > score.best) score.best = run; qf.textContent = 'Correct.'; } else { e.target.className = 'wrong'; run = 0; qf.textContent = 'That was ' + cur.label + (cur.a ? ': ' + cur.a.alg : '') + '.'; }
      touchDay(); save(); showScore();
    });
    $1('[data-next]', el).addEventListener('click', next);
    again.addEventListener('click', function () { if (cur && cur.move) playMove(); });
    next();
  }
  W.quiz = function (el) { makeQuiz(el, { kind: el.getAttribute('data-kind'), sets: (el.getAttribute('data-sets') || '').split(','), title: el.getAttribute('data-title') }); };

  W.example = function (el) {
    el.className = 'w';
    var ex = ALGS.example, all = ex.map(function (e) { return e.alg; }).join(' '), s = 0;
    el.innerHTML = '<div class="stagebar">' + ex.map(function () { return '<i></i>'; }).join('') + '</div><div class="kicker"></div><h3 style="margin-top:2px"></h3><p class="say"></p><div class="pl"></div>' +
      '<div class="pager" style="margin-top:16px"><button type="button" class="btn" data-d="-1">← Previous stage</button><button type="button" class="btn primary" data-d="1">Next stage →</button></div>' +
      '<details style="margin-top:16px"><summary class="note" style="cursor:pointer">Follow along on your own cube</summary><p class="note">Hold a solved cube with yellow on top and green in front, and do this scramble. It is long because it is the solve run backwards.</p><p class="scr" style="font-size:0.9rem">' + esc(Cube.invert(all)) + '</p></details>';
    var player = makePlayer($1('.pl', el), { alg: ex[0].alg, mask: ex[0].mask, start: Cube.caseFor(all) });
    function show() {
      var st = Cube.apply(Cube.caseFor(all), ex.slice(0, s).map(function (e) { return e.alg; }).join(' ') || "U U'");
      player.load({ alg: ex[s].alg, mask: ex[s].mask, start: st });
      $1('.kicker', el).textContent = 'Stage ' + (s + 1) + ' of ' + ex.length;
      $1('h3', el).textContent = ex[s].stage; $1('.say', el).textContent = ex[s].say;
      $('.stagebar i', el).forEach(function (b, k) { b.className = k < s ? 'did' : k === s ? 'now' : ''; });
      $1('[data-d="-1"]', el).disabled = s === 0; $1('[data-d="1"]', el).disabled = s === ex.length - 1;
    }
    el.addEventListener('click', function (e) { var d = e.target.getAttribute && e.target.getAttribute('data-d'); if (!d) return; s = Math.max(0, Math.min(ex.length - 1, s + +d)); show(); });
    show();
  };
  $('[data-w]').forEach(function (el) { W[el.getAttribute('data-w')](el); });

  /* ---------- Train screen ---------- */
  var trainMode = 'drill', onlyWeak = false;
  function renderTrain() {
    var el = document.getElementById('train'), sel = (store.trainSets || ['oll2', 'pll2']).filter(function (k) { return SET[k]; });
    if (!sel.length) sel = ['oll2'];
    el.innerHTML = '<div class="w"><h4>What to train</h4><div class="row" style="margin-top:8px">' + SETS.map(function (s) { return '<button type="button" class="btn small" data-set="' + s.key + '" aria-pressed="' + (sel.indexOf(s.key) >= 0) + '">' + esc(s.name) + ' <span class="note">' + known(s) + '/' + s.list.length + '</span></button>'; }).join('') +
      '</div><div class="row" style="margin-top:10px"><button type="button" class="btn small" data-mode="drill" aria-pressed="' + (trainMode === 'drill') + '">Do the algorithm</button><button type="button" class="btn small" data-mode="quiz" aria-pressed="' + (trainMode === 'quiz') + '">Name the case</button>' +
      '<button type="button" class="btn small" data-weak="1" aria-pressed="' + onlyWeak + '">Only ones I have not mastered</button></div></div><div class="tbody"></div>';
    el.onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var k = b.getAttribute('data-set');
      if (k) { var i = sel.indexOf(k); if (i >= 0) sel.splice(i, 1); else sel.push(k); store.trainSets = sel; save(); renderTrain(); }
      else if (b.getAttribute('data-mode')) { trainMode = b.getAttribute('data-mode'); renderTrain(); }
      else if (b.getAttribute('data-weak')) { onlyWeak = !onlyWeak; renderTrain(); }
    };
    var body = $1('.tbody', el);
    if (trainMode === 'quiz') { var q = document.createElement('div'); body.appendChild(q); makeQuiz(q, { sets: sel, title: 'Name the case' }); return; }
    var seen = {}, pool = [];
    sel.forEach(function (k) { SET[k].list.forEach(function (a) { var id = aid(SET[k], a); if (!seen[id]) { seen[id] = 1; pool.push({ a: a, set: SET[k], id: id }); } }); });
    if (onlyWeak) pool = pool.filter(function (p) { return status(p.id) < 2; });
    if (!pool.length) { body.innerHTML = '<div class="w"><p>Nothing left to drill in this selection. Every case here is marked as known. Turn off the filter or pick another set.</p></div>'; return; }
    body.innerHTML = '<div class="w trainer"><div class="two"><div class="t-pic"></div><div style="width:100%;min-width:0"><div class="kicker tk"></div><h2 class="tn" style="margin:2px 0 6px"></h2><div class="reveal"></div><div class="row" style="margin:8px 0 12px"><button type="button" class="btn small" data-a="show">Show algorithm</button><button type="button" class="btn small" data-a="watch">Watch it</button><button type="button" class="btn small" data-a="skip">Skip</button></div>' +
      '<button type="button" class="pad small"><span class="rd">0.00</span><small>Set up the case, tap to start, tap or press any key when done</small></button></div></div>' +
      '<div class="rate"><button type="button" data-r="0">Missed it</button><button type="button" data-r="1">Shaky</button><button type="button" data-r="2">Got it</button></div><p class="note ts" style="margin-bottom:0"></p></div>';
    var cur = null, reveal = $1('.reveal', body), ts = $1('.ts', body);
    function weight(p) { var r = store.algs[p.id]; if (!r) return 3; return r.miss ? 6 : r.s === 2 ? 1 : 4; }
    function next() {
      var total = 0, c = pool.filter(function (p) { return pool.length < 2 || p !== cur; });
      c.forEach(function (p) { total += weight(p); });
      var x = Math.random() * total; cur = c[c.length - 1];
      for (var i = 0; i < c.length; i++) { x -= weight(c[i]); if (x <= 0) { cur = c[i]; break; } }
      $1('.t-pic', body).innerHTML = pic(cur.set, Cube.caseFor(cur.a.alg), 170);
      $1('.tk', body).textContent = cur.set.name + (cur.set.key === 'oll' ? ' · ' + cur.a.group : '');
      $1('.tn', body).textContent = cur.a.name; reveal.textContent = ''; $1('.rd', body).textContent = '0.00'; stats();
    }
    function stats() {
      var r = store.algs[cur.id], k = pool.filter(function (p) { return status(p.id) === 2; }).length;
      ts.textContent = 'Known ' + k + ' of ' + pool.length + ' in this selection.' + (r && r.best ? ' Your best on ' + cur.a.name + ': ' + fmt(r.best) + ' over ' + r.n + ' timed reps.' : ' To set up a case, do its algorithm backwards on a solved cube: ' + Cube.invert(cur.a.alg));
    }
    makeWatch($1('.pad', body), $1('.rd', body), function (ms) { var r = rec(cur.id); r.n++; if (!r.best || ms < r.best) r.best = ms; save(); reveal.textContent = cur.a.alg; stats(); });
    body.onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var a = b.getAttribute('data-a'), r = b.getAttribute('data-r');
      if (a === 'show') reveal.textContent = cur.a.alg;
      else if (a === 'watch') openAlg(cur.set, cur.a);
      else if (a === 'skip') next();
      else if (r !== null) { var rr = rec(cur.id); rr.s = +r === 2 ? 2 : 1; rr.miss = +r === 0 ? 1 : 0; touchDay(); save(); dots(); $('[data-set]', el).forEach(function (sb) { $1('.note', sb).textContent = known(SET[sb.getAttribute('data-set')]) + '/' + SET[sb.getAttribute('data-set')].list.length; }); next(); }
    };
    next();
  }

  /* ---------- Timer screen ---------- */
  (function () {
    var pad = document.getElementById('timer-pad'), read = document.getElementById('timer-read'), scr = document.getElementById('scramble'), hint = document.getElementById('timer-hint'),
        splitBtn = document.getElementById('t-split'), split = false, marks = [];
    function stats() {
      var t = store.times;
      document.getElementById('st-count').textContent = t.length;
      document.getElementById('st-best').textContent = fmt(t.length ? Math.min.apply(null, t) : null);
      document.getElementById('st-ao5').textContent = fmt(avgOf(t, 5));
      document.getElementById('st-ao12').textContent = fmt(avgOf(t, 12));
      document.getElementById('times').innerHTML = t.slice(-12).reverse().map(function (x) { return '<li>' + fmt(x) + '</li>'; }).join('') || '<li class="empty">No solves yet</li>';
      var sp = store.splits.slice(-5), n = sp.length;
      ['c', 'f', 'l'].forEach(function (k) { document.getElementById('sp-' + k).textContent = n ? fmt(sp.reduce(function (a, b) { return a + b[k]; }, 0) / n) : '–'; });
      if (n) {
        var tot = sp.reduce(function (a, b) { return a + b.c + b.f + b.l; }, 0), big = ['c', 'f', 'l'].map(function (k) { return [sp.reduce(function (a, b) { return a + b[k]; }, 0) / tot, k]; }).sort(function (a, b) { return b[0] - a[0]; })[0];
        document.getElementById('sp-note').textContent = 'Average of your last ' + n + ' split solve' + (n > 1 ? 's' : '') + '. ' + { c: 'The cross', f: 'F2L', l: 'The last layer' }[big[1]] + ' takes ' + Math.round(big[0] * 100) + '% of your solve.';
      } else document.getElementById('sp-note').textContent = 'No split solves yet.';
    }
    function fresh() { scr.textContent = Cube.scramble(20); }
    function idle() { hint.textContent = split ? 'Tap to start. Then tap at cross done, F2L done, and solved.' : 'Tap or press Space to start. Any key or tap stops.'; }
    mainWatch = makeWatch(pad, read, function (ms) {
      store.times.push(ms); if (store.times.length > 500) store.times = store.times.slice(-500);
      if (split && marks.length === 2) { store.splits.push({ c: Math.round(marks[0]), f: Math.round(marks[1] - marks[0]), l: Math.round(ms - marks[1]) }); if (store.splits.length > 100) store.splits.shift(); }
      save(); stats(); fresh(); idle();
    }, function () { marks = []; hint.textContent = split ? 'Tap when the cross is done' : 'Any key or tap stops'; });
    mainWatch.tap = function () {
      if (split && marks.length < 2) { marks.push(mainWatch.elapsed()); hint.textContent = marks.length === 1 ? 'Cross ' + fmt(marks[0]) + '. Tap when F2L is done' : 'F2L done. Tap when solved'; }
      else mainWatch.stop();
    };
    splitBtn.addEventListener('click', function () { if (mainWatch.running()) return; split = !split; splitBtn.setAttribute('aria-pressed', String(split)); splitBtn.textContent = 'Split mode: ' + (split ? 'on' : 'off'); idle(); });
    document.getElementById('t-undo').addEventListener('click', function () { store.times.pop(); save(); stats(); });
    document.getElementById('t-clear').addEventListener('click', function () {
      var b = this; if (b.getAttribute('data-arm')) { store.times = []; store.splits = []; save(); stats(); b.removeAttribute('data-arm'); b.textContent = 'Clear all'; }
      else { b.setAttribute('data-arm', '1'); b.textContent = 'Press again to clear'; setTimeout(function () { b.removeAttribute('data-arm'); b.textContent = 'Clear all'; }, 3000); }
    });
    document.getElementById('t-new').addEventListener('click', fresh);
    fresh(); stats();
  })();

  /* ---------- Algorithms screen ---------- */
  (function () {
    var el = document.getElementById('library'), html = '', jobs = [];
    function block(title, note, set, list) { var id = 'lib-' + jobs.length; html += '<div class="libgroup"><h3>' + esc(title) + '</h3>' + (note ? '<p class="note">' + esc(note) + '</p>' : '') + '<div class="algs" id="' + id + '"></div></div>'; jobs.push([id, set, list]); }
    block('F2L basics', 'Six cases to understand, not memorise.', SET.f2l, ALGS.f2l);
    block('2-look OLL', 'Three edge cases, then seven corner cases.', SET.oll2, SET.oll2.list);
    block('PLL', 'All 21. The first six are the 2-look set.', SET.pll, ALGS.pll);
    var groups = [];
    ALGS.oll.forEach(function (a) { if (groups.indexOf(a.group) < 0) groups.push(a.group); });
    var order = ['Corners Oriented', 'Cross', 'T Shape', 'P Shape', 'Square Shape', 'Fish Shape', 'W Shape', 'Knight Move Shape', 'Small L Shape', 'Small Lightning Bolt', 'Big Lightning Bolt', 'C Shape', 'I Shape', 'Awkward Shape', 'Dot'];
    groups.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
    groups.forEach(function (g) { block('Full OLL: ' + g, '', SET.oll, ALGS.oll.filter(function (a) { return a.group === g; })); });
    el.innerHTML = html;
    jobs.forEach(function (j) { cards(document.getElementById(j[0]), j[1], j[2]); });
  })();
  dots();

  /* ---------- Home screen ---------- */
  function renderHome() {
    var cur = currentLevel(), L = LEVELS[cur], t = store.times, k = known(SET.pll) + known(SET.oll) + known(SET.oll2), st = streak();
    var trend = '';
    if (t.length >= 2) {
      var d = t.slice(-40), lo = Math.min.apply(null, d), hi = Math.max.apply(null, d), w = 600, h = 110, px = function (i) { return (10 + i * (w - 20) / (d.length - 1)).toFixed(1); }, py = function (v) { return (12 + (hi === lo ? 0.5 : (hi - v) / (hi - lo)) * (h - 24)).toFixed(1); };
      trend = '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Your recent solve times"><line x1="10" x2="' + (w - 10) + '" y1="12" y2="12" stroke="var(--line)" stroke-dasharray="3 4"/><line x1="10" x2="' + (w - 10) + '" y1="' + (h - 12) + '" y2="' + (h - 12) + '" stroke="var(--line)" stroke-dasharray="3 4"/>' +
        '<polyline fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" points="' + d.map(function (v, i) { return px(i) + ',' + py(v); }).join(' ') + '"/><circle r="4.5" fill="var(--accent)" cx="' + px(d.length - 1) + '" cy="' + py(d[d.length - 1]) + '"/></svg>' +
        '<p class="note" style="margin:6px 0 0">Your last ' + d.length + ' solves. Fastest ' + fmt(lo) + ' (top line), slowest ' + fmt(hi) + ' (bottom line). Up is faster.</p>';
    } else trend = '<p class="note" style="margin:0">Time a few solves and your trend shows up here.</p>';
    var skill = [
      ['Notation', 'Tap through the moves and take the notation quiz.', '#level-0', 'Open Level 0'],
      ['Triggers and cross', 'Trigger drills, then ten crosses on the bottom.', '#level-1', 'Open the drills'],
      ['F2L pairs', 'Untimed, slow solves. Talk through each pair.', '#level-2', 'Open Level 2'],
      ['Two-look algorithms', 'One new algorithm, then drill the ones you have.', '#train', 'Open the trainer'],
      ['PLL and look-ahead', 'One new PLL, then metronome solves.', '#level-4', 'Open Level 4'],
      ['OLL by shape', 'Two or three new OLLs this week. Drill the group.', '#library', 'Open the algorithms'],
      ['One advanced skill', 'Pick one technique and stay on it all week.', '#level-6', 'Open Level 6']
    ][cur];
    document.getElementById('home').innerHTML =
      '<div class="hero"><div><div class="kicker">Your next step · Level ' + cur + '</div><h1 style="margin:6px 0 8px">' + esc(L.t) + '</h1><p style="margin-top:0">' + esc(L.s) + '. Target average: <b>' + esc(L.goal) + '</b>.</p>' +
      '<p class="row"><a class="btn primary" href="#level-' + cur + '">Continue Level ' + cur + '</a><a class="btn" href="#train">Train</a><a class="btn" href="#timer">Timer</a><a class="btn" href="#example">Watch a solve</a></p></div><div class="pic">' + Cube.iso(Cube.solved(), L.mask, 150) + '</div></div>' +
      '<div class="tiles"><div><b>' + fmt(avgOf(t, 12)) + '</b><span>Avg of 12</span></div><div><b>' + fmt(t.length ? Math.min.apply(null, t) : null) + '</b><span>Best solve</span></div><div><b>' + t.length + '</b><span>Solves timed</span></div><div><b>' + k + '</b><span>Algorithms known</span></div><div><b>' + st + '</b><span>Day streak</span></div></div>' +
      '<div class="card trend">' + trend + '</div>' +
      '<h3>Today, 30 minutes</h3><div class="plan3"><div class="card"><b class="t">5 min · Hands</b><h4>Warm up</h4><p>Trigger drills, plus ten reps of each algorithm you learned this week.</p><a class="btn small" href="#level-1">Trigger drills</a></div>' +
      '<div class="card"><b class="t">15 min · Skill</b><h4>' + esc(skill[0]) + '</h4><p>' + esc(skill[1]) + '</p><a class="btn small" href="' + skill[2] + '">' + esc(skill[3]) + '</a></div>' +
      '<div class="card"><b class="t">10 min · Timed</b><h4>Average of 12</h4><p>Twelve timed solves. Watch the weekly trend, not the single best.</p><a class="btn small" href="#timer">Open the timer</a></div></div>' +
      '<h3>The course</h3><div class="ladder">' + LEVELS.map(function (l, n) { var g = gate(n); return '<a href="#level-' + n + '" class="' + (g.done === g.all ? 'done' : n === cur ? 'cur' : '') + '"><span class="num">' + (g.done === g.all ? '✓' : n) + '</span><span><b>' + esc(l.t) + '</b><small>' + esc(l.s) + '</small><span class="meter"><i style="width:' + Math.round(100 * g.done / g.all) + '%"></i></span></span><span class="goal">' + esc(l.goal) + '<br>' + g.done + '/' + g.all + '</span></a>'; }).join('') + '</div>' +
      '<p class="note">Typical averages are rough community ranges, not promises. Under a minute comes in weeks, under 30 seconds in a few months, under 20 in six months to a year of steady practice.</p>';
  }

  /* ---------- router ---------- */
  function route() {
    var name = (location.hash || '#home').slice(1);
    if (!$1('.view[data-view="' + name + '"]')) name = 'home';
    view = name; closeModal();
    $('.view').forEach(function (v) { v.classList.toggle('on', v.getAttribute('data-view') === name); });
    var tab = name.indexOf('level-') === 0 ? 'level' : name;
    $('nav.tabs a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-tab') === tab); });
    $1('nav.tabs a[data-tab=level]').setAttribute('href', '#level-' + currentLevel());
    if (name === 'home') renderHome();
    if (name === 'train') renderTrain();
    if (tab === 'level') lvnav();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();
})();
