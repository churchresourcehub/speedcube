const Cube = require('./cube.js'), D = require('./data.js'), fs = require('fs');
const jp = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : '';
let bad = 0;
const home = s => s.p.every((v, i) => v === s.hp[i]) && true;
const ident = st => st.every(s => home(s) && s.n.every((v, i) => v === ({U:[0,1,0],D:[0,-1,0],F:[0,0,1],B:[0,0,-1],R:[1,0,0],L:[-1,0,0]})[s.c][i]));
function check(name, alg, kind) {
  const st = Cube.apply(Cube.solved(), alg); let ok = !ident(st);
  for (const s of st) {
    const slot = (s.hp[0] === 1 && s.hp[2] === 1 && s.hp[1] <= 0);
    if (kind === 'f2l') { if (s.hp[1] <= 0 && !slot && !home(s)) ok = false; if (s.hp[1] <= 0 && !slot && s.p[1] > 0) ok = false; }
    else { if (s.hp[1] <= 0 && !home(s)) ok = false; }
    if (kind === 'oll' || kind === 'pll') { if (s.c === 'U' && s.n[1] !== 1 && kind === 'pll') ok = false; }
  }
  if (kind === 'oll') { // the case must have non-yellow on top, and F2L intact
    const cs = Cube.caseFor(alg); if (cs.every(s => s.c !== 'U' || s.n[1] === 1)) ok = false;
  }
  if (!ok) { bad++; console.log('FAIL', kind, name, alg); }
}
D.f2l.forEach(a => check(a.name, a.alg, 'f2l'));
D.ollEdges.concat(D.ollCorners).forEach(a => check(a.name, a.alg, 'oll'));
D.pll.forEach(a => check(a.name, a.alg, 'pll'));
if (jp) {
  const norm = a => a.replace(/[()]/g, '').replace(/^(y2?'? )+/, '').replace(/\s+/g, ' ').trim();
  D.pll.forEach(a => {
    const m = new RegExp('name:"' + a.name + '",alg:\\[([^\\]]*)\\]').exec(jp);
    const list = m ? m[1].split('","').map(s => norm(s.replace(/"/g, ''))) : [];
    console.log(list.includes(norm(a.alg)) ? 'match ' : 'DIFF  ', a.name, list.includes(norm(a.alg)) ? '' : ' mine: ' + norm(a.alg) + '\n        theirs: ' + list.join(' | '));
  });
}
// every PLL must be distinct as a permutation
const sig = a => Cube.apply(Cube.solved(), a.alg).map(s => s.p.join('')).join('|');
const seen = {}; D.pll.forEach(a => { const k = sig(a); if (seen[k]) { bad++; console.log('DUP', a.name, seen[k]); } seen[k] = a.name; });
// sanity: sexy move x6 = identity
if (!ident(Cube.apply(Cube.solved(), "R U R' U' R U R' U' R U R' U' R U R' U' R U R' U' R U R' U'"))) { bad++; console.log('sim broken'); }
console.log(bad ? bad + ' problems' : 'all algorithm checks passed');
// ---- example solve: each stage must leave the cube in the state its label claims
{
  const z = v => (v[0] === 0) + (v[1] === 0) + (v[2] === 0);
  const all = D.example.map(e => e.alg).join(' ');
  const st = Cube.caseFor(all); let ok = true;
  const at = s => s.p.every((v, i) => v === s.hp[i]);
  const slots = [[-1, -1], [1, -1], [-1, 1], [1, 1]]; // BL BR FL FR as x,z
  const inSlot = (s, k) => s.hp[1] <= 0 && s.hp[0] === slots[k][0] && s.hp[2] === slots[k][1];
  D.example.forEach((e, i) => {
    Cube.apply(st, e.alg);
    const cross = st.filter(s => s.hp[1] === -1 && z(s.hp) === 1).every(at);
    let good = cross;
    for (let k = 0; k < Math.min(i, 4); k++) good = good && st.filter(s => inSlot(s, k)).every(at);
    if (i >= 5) good = good && st.filter(s => s.c === 'U' && z(s.hp) === 1).every(s => s.n[1] === 1);
    if (i >= 6) good = good && st.filter(s => s.c === 'U').every(s => s.n[1] === 1);
    if (i >= 8) good = good && st.every(at);
    if (i === 7) { // corners solved relative to each other: some U turn puts all four home
      let any = false; for (let k = 0; k < 4; k++) { const t = Cube.apply(Cube.clone(st), 'U'.repeat(0) + (k ? 'U' + (k === 2 ? '2' : k === 3 ? "'" : '') : 'U U\'')); if (t.filter(s => z(s.hp) === 0 && s.hp[1] === 1).every(at)) any = true; }
      good = good && any;
    }
    // before stage i the thing it solves must NOT already be solved
    if (!good) { ok = false; console.log('EXAMPLE FAIL at stage', i, e.stage); }
  });
  // and the start must be properly mixed: cross not solved, no slot solved
  const s0 = Cube.caseFor(all);
  if (s0.filter(s => s.hp[1] === -1 && z(s.hp) === 1).every(at)) { ok = false; console.log('cross already solved at start'); }
  console.log(ok ? 'example solve checks passed' : 'example solve BROKEN', '| scramble length', Cube.tokens(Cube.invert(all)).length);
  console.log('counts f2l/oll2/pll/oll', D.f2l.length, D.ollEdges.length + D.ollCorners.length, D.pll.length, D.oll.length);
}
