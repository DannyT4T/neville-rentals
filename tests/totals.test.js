/* Money rules, checked against the real store module.
   Run with:  node tests/totals.test.js  */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'assets', 'js');

const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};
global.window = global;

for (const f of ['util.js', 'store.js', 'terms.js']) {
  // eslint-disable-next-line no-eval
  eval(fs.readFileSync(path.join(ROOT, f), 'utf8'));
}

const S = global.NRT.store;
const U = global.NRT.util;
S.init();

function probe(label, insurance, start, end) {
  const c = {
    vehicleId: 'v_tahoe',
    startDate: start || '2026-10-01',
    endDate: end || '2026-10-08',   // 7 days unless overridden
    rateMode: 'weekly',
    dailyRate: 150,
    weeklyRate: 850,
    insurance: insurance,
    deposit: 150,
    tolls: [], fees: []
  };
  const t = S.totals(c);
  console.log(
    label.padEnd(34),
    'days=' + t.days,
    'rental=' + U.money(t.rental).padStart(9),
    'insurance=' + U.money(t.insurance).padStart(8),
    'deposit=' + U.money(t.deposit).padStart(8),
    'DUE=' + U.money(t.dueAtSigning).padStart(9),
    'revenue=' + U.money(t.revenue)
  );
  return t;
}

console.log('--- 7-day Tahoe rental, $850/week, $150 deposit ---');
const company = probe('Company insurance ($15/day)', { type: 'company', dailyFee: 15 });
const self1 = probe('Self-insured (dailyFee left 15)', { type: 'self', dailyFee: 15 });
const self2 = probe('Self-insured (dailyFee 0)', { type: 'self', dailyFee: 0 });

console.log('\n--- 10-day rental, automatic billing ---');
const split = probe('1 week + 3 days', { type: 'company', dailyFee: 15 }, '2026-10-01', '2026-10-11');

// The clause text and acknowledgements quote live figures. A contract handed
// in without .totals used to throw here, which made Sign & generate do nothing.
console.log('\n--- clauses on a contract with no .totals ---');
const T = global.NRT.terms;
const bare = {
  vehicleId: 'v_camry', startDate: '2026-10-01', endDate: '2026-10-08',
  rateMode: 'weekly', dailyRate: 75, weeklyRate: 400,
  insurance: { type: 'company', dailyFee: 15 }, deposit: 150, tolls: [], fees: []
};
let clauseCount = 0, ackCount = 0, threw = null;
try {
  clauseCount = T.clauses(bare, S.company(), S.vehicle('v_camry')).length;
  ackCount = T.acknowledgements(bare, S.company()).length;
} catch (e) { threw = e.message; }
console.log('  clauses=' + clauseCount + ' acknowledgements=' + ackCount + ' threw=' + threw);

console.log('\n--- assertions ---');
const checks = [
  ['company insurance charges 7 x $15 = $105', company.insurance === 105],
  ['self-insured charges $0 even if dailyFee is 15', self1.insurance === 0],
  ['self-insured charges $0 when dailyFee is 0', self2.insurance === 0],
  ['self-insured due at signing drops by $105', company.dueAtSigning - self1.dueAtSigning === 105],
  ['self-insured revenue drops by $105', company.revenue - self1.revenue === 105],
  ['deposit is unaffected by the insurance choice', company.deposit === self1.deposit],
  ['a 7-day term bills as exactly one week', company.weeks === 1 && company.extraDays === 0],
  ['a 7-day term uses the weekly rate, not 7 x daily', company.rental === 850],
  ['a 10-day term splits into 1 week + 3 days', split.weeks === 1 && split.extraDays === 3],
  ['that split bills $850 + 3 x $150 = $1,300', split.rental === 850 + 3 * 150],
  ['clauses render without .totals (no throw)', threw === null],
  ['all fifteen clauses are produced', clauseCount === 15],
  ['acknowledgements are produced', ackCount >= 4]
];
let bad = 0;
for (const [name, ok] of checks) {
  console.log((ok ? '  PASS  ' : '  FAIL  ') + name);
  if (!ok) bad++;
}
process.exit(bad ? 1 : 0);
