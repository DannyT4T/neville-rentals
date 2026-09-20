/* Neville Rentals & Transportation — persistence layer.
   Storage sits behind this one module on purpose: swap read()/write() for a
   server call and nothing else in the app has to change. */
(function (root) {
  'use strict';

  var U = root.NRT.util;
  var KEY = 'nrt.db.v2';
  var LEGACY_KEY = 'lrt.db.v2';   // pre-rename key; carried over once on first read
  var db = null;
  var listeners = [];

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) {
        var legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          localStorage.setItem(KEY, legacy);
          localStorage.removeItem(LEGACY_KEY);
          raw = legacy;
        }
      }
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function write() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { /* private window, blocked storage, quota — app stays usable in memory */ }
    listeners.forEach(function (fn) { try { fn(db); } catch (err) {} });
  }

  /* ------------------------------------------------------------------ seed */

  function seedFleet() {
    return [
      { id: 'v_bmw330', year: 2021, make: 'BMW', model: '330i xDrive', trim: 'Sedan', klass: 'luxury',
        color: 'Alpine White', vin: 'WBA5R7C51MFH12384', plate: 'NRT-4471', state: 'FL',
        seats: 5, dailyRate: 100, weeklyRate: 550, odometer: 48210, status: 'available',
        notes: 'Premium package. Takes 91 octane.' },
      { id: 'v_tahoe', year: 2022, make: 'Chevrolet', model: 'Tahoe LT', trim: 'Full-size SUV', klass: 'suv',
        color: 'Black', vin: '1GNSKNKD4NR203918', plate: 'NRT-8802', state: 'FL',
        seats: 8, dailyRate: 150, weeklyRate: 850, odometer: 61455, status: 'available',
        notes: 'Third row. Tow package installed.' },
      { id: 'v_camry', year: 2020, make: 'Toyota', model: 'Camry SE', trim: 'Sedan', klass: 'standard',
        color: 'Celestial Silver', vin: '4T1G11AK2LU907712', plate: 'NRT-2219', state: 'FL',
        seats: 5, dailyRate: 75, weeklyRate: 400, odometer: 88940, status: 'available', notes: '' },
      { id: 'v_grandch', year: 2021, make: 'Jeep', model: 'Grand Cherokee', trim: 'Mid-size SUV', klass: 'suv',
        color: 'Granite Crystal', vin: '1C4RJFBG7MC804455', plate: 'NRT-6130', state: 'FL',
        seats: 5, dailyRate: 125, weeklyRate: 750, odometer: 54002, status: 'available', notes: '' },
      { id: 'v_altima', year: 2023, make: 'Nissan', model: 'Altima SV', trim: 'Sedan', klass: 'standard',
        color: 'Gun Metallic', vin: '1N4BL4DV0PN331076', plate: 'NRT-9048', state: 'FL',
        seats: 5, dailyRate: 75, weeklyRate: 400, odometer: 29187, status: 'available', notes: '' },
      { id: 'v_odyssey', year: 2019, make: 'Honda', model: 'Odyssey EX-L', trim: 'Minivan', klass: 'van',
        color: 'Modern Steel', vin: '5FNRL6H79KB015529', plate: 'NRT-3376', state: 'FL',
        seats: 8, dailyRate: 100, weeklyRate: 600, odometer: 102310, status: 'maintenance',
        notes: 'In the shop — rear brakes. Back Thursday.' }
    ];
  }

  /* A handful of contracts so the dashboard opens on a working business rather
     than an empty shell. Every one is flagged sample:true and can be cleared
     in Settings before real data goes in. */
  function seedContracts() {
    var t = U.today();
    function back(n) { return U.addDays(t, -n); }
    function fwd(n) { return U.addDays(t, n); }
    var out = [];

    out.push(withTotals({
      id: 'c_sample1', no: 'NRT-2026-0141', sample: true, status: 'active',
      vehicleId: 'v_bmw330',
      renter: { name: 'Marcus A. Whitfield', dob: '1989-03-14', license: 'W412-8873-2201-90',
        licState: 'FL', licExp: '2029-03-14', phone: '(305) 555-0142',
        email: 'm.whitfield@example.com', address: '1240 NW 119th St, Apt 3B, Miami, FL 33167' },
      startDate: back(9), endDate: fwd(5), rateMode: 'weekly', dailyRate: 100, weeklyRate: 550,
      insurance: { type: 'company', dailyFee: 15 },
      pickup: { fuel: 1, odometer: 48210, damage: [], date: back(9) },
      dropoff: null, deposit: 150, tolls: [], fees: [],
      acks: SEED_ACKS, signature: sampleSignature(0.7), signedAt: back(9), agent: 'Neville'
    }));

    out.push(withTotals({
      id: 'c_sample2', no: 'NRT-2026-0143', sample: true, status: 'active',
      vehicleId: 'v_tahoe',
      renter: { name: 'Danielle R. Okonkwo', dob: '1994-11-02', license: 'O882-1140-7765-22',
        licState: 'FL', licExp: '2028-11-02', phone: '(786) 555-0199',
        email: 'd.okonkwo@example.com', address: '8455 NE 2nd Ave, Miami, FL 33138' },
      startDate: back(2), endDate: fwd(1), rateMode: 'daily', dailyRate: 150, weeklyRate: 850,
      insurance: { type: 'self', dailyFee: 0, provider: 'GEICO', policyNo: '4471-882-119',
        policyFileName: 'okonkwo-policy-declarations.pdf', verified: true },
      pickup: { fuel: 0.75, odometer: 61455, damage: [], date: back(2) },
      dropoff: null, deposit: 150, tolls: [], fees: [],
      acks: SEED_ACKS, signature: sampleSignature(2.4), signedAt: back(2), agent: 'Neville'
    }));

    var past = [
      { id: 'c_s3', no: 'NRT-2026-0128', v: 'v_camry', name: 'Priya S. Raman', start: 110, len: 14,
        mode: 'weekly', d: 75, w: 400, ins: 'company',
        tolls: [{ label: 'SunPass \u2014 Dolphin Expwy', amount: 13.1 }, { label: 'Rickenbacker Causeway', amount: 6.94 }] },
      { id: 'c_s4', no: 'NRT-2026-0132', v: 'v_grandch', name: 'Elias T. Moreau', start: 78, len: 21,
        mode: 'weekly', d: 125, w: 750, ins: 'company',
        tolls: [{ label: 'Florida\u2019s Turnpike', amount: 41.25 }] },
      { id: 'c_s5', no: 'NRT-2026-0135', v: 'v_altima', name: 'Sasha Benoit', start: 47, len: 5,
        mode: 'daily', d: 75, w: 400, ins: 'self', tolls: [] },
      { id: 'c_s6', no: 'NRT-2026-0138', v: 'v_odyssey', name: 'Carlton J. Reyes', start: 24, len: 10,
        mode: 'weekly', d: 100, w: 600, ins: 'company',
        tolls: [{ label: 'Airport Expwy toll-by-plate', amount: 17.63 }] },
      { id: 'c_s7', no: 'NRT-2026-0140', v: 'v_camry', name: 'Imani Grant', start: 12, len: 7,
        mode: 'weekly', d: 75, w: 400, ins: 'company', tolls: [] }
    ];

    past.forEach(function (p) {
      var start = back(p.start);
      var end = U.addDays(start, p.len);
      out.push(withTotals({
        id: p.id, no: p.no, sample: true, status: 'completed', vehicleId: p.v,
        renter: { name: p.name, dob: '1990-06-01', license: 'ON FILE', licState: 'FL',
          licExp: '2030-06-01', phone: '(305) 555-0100', email: '', address: 'On file' },
        startDate: start, endDate: end, rateMode: p.mode, dailyRate: p.d, weeklyRate: p.w,
        insurance: p.ins === 'company'
          ? { type: 'company', dailyFee: 15 }
          : { type: 'self', dailyFee: 0, provider: 'Progressive', policyNo: 'ON FILE', verified: true },
        pickup: { fuel: 1, odometer: 0, damage: [], date: start },
        dropoff: { fuel: 1, odometer: 0, damage: [], date: end },
        deposit: 150, tolls: p.tolls, fees: [],
        acks: SEED_ACKS, signature: sampleSignature(p.len * 0.37), signedAt: start, agent: 'Neville', closedAt: end
      }));
    });

    return out;
  }

  /* Every seeded contract was signed, so all of its acknowledgements are
     ticked. Ids not used by a given contract are simply ignored. */
  var SEED_ACKS = {
    ack_terms: true, ack_tolls: true, ack_age: true,
    ack_condition: true, ack_inspect: true, ack_policy: true
  };

  function withTotals(c) { c.totals = S.totals(c); return c; }

  /* A plausible ink scribble for the sample contracts, drawn in the signature
     pad's own 640x200 coordinate space so it renders like a real capture. */
  function sampleSignature(seed) {
    var main = [], flourish = [], i, t;
    for (i = 0; i <= 140; i++) {
      t = i / 140;
      main.push([
        46 + t * 430,
        126 - 44 * Math.sin(t * Math.PI * 3.1 + seed) -
          30 * Math.sin(t * Math.PI * 7.7 + seed * 1.9) * (1 - t) -
          18 * Math.cos(t * Math.PI * 1.3 + seed)
      ]);
    }
    for (i = 0; i <= 40; i++) {
      t = i / 40;
      flourish.push([70 + t * 400, 158 + 9 * Math.sin(t * Math.PI * 2 + seed)]);
    }
    return [main, flourish];
  }

  /* ------------------------------------------------------------------- API */

  var S = {};

  S.defaultCompany = function () {
    return {
      name: 'Neville Rentals & Transportation',
      tagline: 'Vehicle rental and transportation services',
      address: '775 NW 144 St, Miami, FL 33168',
      phone: '(305) 555-0170',
      email: 'rentals@nevillerentals.com',
      agent: 'Neville',
      deposit: 150,
      insuranceDaily: 15,
      minimumAge: 21,
      inspectionIntervalDays: 30
    };
  };

  /* The demo fleet shipped with LRT- plates before the rebrand. A browser that
     carried its data across the rename keeps them, so bring the placeholders
     into line. Only the seeded vehicles are touched — anything the owner typed
     is left exactly as entered. */
  var SEEDED_VEHICLES = {
    v_bmw330: 1, v_tahoe: 1, v_camry: 1, v_grandch: 1, v_altima: 1, v_odyssey: 1
  };
  function migrateSeedPlates() {
    var changed = false;
    db.vehicles.forEach(function (v) {
      if (SEEDED_VEHICLES[v.id] && /^LRT-/.test(v.plate || '')) {
        v.plate = v.plate.replace(/^LRT-/, 'NRT-');
        changed = true;
      }
    });
    return changed;
  }

  S.init = function () {
    db = read();
    if (!db || !db.vehicles || !db.contracts) {
      db = { version: 2, seq: 143, company: S.defaultCompany(), vehicles: seedFleet(), contracts: [] };
      db.contracts = seedContracts();
      write();
    }
    if (!db.company) db.company = S.defaultCompany();
    if (migrateSeedPlates()) write();
    S.syncVehicleStatus();
    return db;
  };

  S.onChange = function (fn) { listeners.push(fn); };
  S.company = function () { return db.company; };
  S.saveCompany = function (patch) { Object.assign(db.company, patch); write(); };

  /* ----------------------------------------------------------------- fleet */

  S.vehicles = function () { return db.vehicles.slice(); };
  S.vehicle = function (id) {
    return db.vehicles.filter(function (v) { return v.id === id; })[0] || null;
  };
  S.saveVehicle = function (v) {
    if (!v.id) { v.id = U.uid('v'); db.vehicles.push(v); }
    else {
      var i = db.vehicles.findIndex(function (x) { return x.id === v.id; });
      if (i < 0) db.vehicles.push(v); else db.vehicles[i] = Object.assign(db.vehicles[i], v);
    }
    S.syncVehicleStatus();
    write();
    return v;
  };
  S.deleteVehicle = function (id) {
    var inUse = db.contracts.some(function (c) { return c.vehicleId === id && c.status === 'active'; });
    if (inUse) return false;
    db.vehicles = db.vehicles.filter(function (v) { return v.id !== id; });
    write();
    return true;
  };

  /* ------------------------------------------------------------- contracts */

  S.contracts = function () { return db.contracts.slice(); };
  S.contract = function (id) {
    return db.contracts.filter(function (c) { return c.id === id; })[0] || null;
  };
  S.nextContractNo = function () {
    return 'NRT-' + new Date().getFullYear() + '-' + ('000' + (db.seq + 1)).slice(-4);
  };
  S.saveContract = function (c) {
    c.totals = S.totals(c);
    if (!c.id) {
      c.id = U.uid('c');
      db.seq += 1;
      c.no = 'NRT-' + new Date().getFullYear() + '-' + ('000' + db.seq).slice(-4);
      db.contracts.push(c);
    } else {
      var i = db.contracts.findIndex(function (x) { return x.id === c.id; });
      if (i < 0) db.contracts.push(c); else db.contracts[i] = c;
    }
    S.syncVehicleStatus();
    write();
    return c;
  };
  S.deleteContract = function (id) {
    db.contracts = db.contracts.filter(function (c) { return c.id !== id; });
    S.syncVehicleStatus();
    write();
  };

  S.syncVehicleStatus = function () {
    var rentedOut = {};
    db.contracts.forEach(function (c) { if (c.status === 'active') rentedOut[c.vehicleId] = true; });
    db.vehicles.forEach(function (v) {
      if (v.status === 'maintenance') return;
      v.status = rentedOut[v.id] ? 'rented' : 'available';
    });
  };

  /* ---------------------------------------------------------------- money */

  S.totals = function (c) {
    var days = Math.max(1, U.dayDiff(c.startDate, c.endDate));
    var bd = U.breakdown(days, c.rateMode, U.num(c.dailyRate), U.num(c.weeklyRate));
    var rental = bd.subtotal;
    var insFee = (c.insurance && c.insurance.type === 'company')
      ? U.num(c.insurance.dailyFee, 15) * days : 0;
    var fees = (c.fees || []).reduce(function (s, f) { return s + U.num(f.amount); }, 0);
    var tolls = (c.tolls || []).reduce(function (s, t) { return s + U.num(t.amount); }, 0);
    var deposit = U.num(c.deposit, 150);
    var deductions = tolls + fees;
    var interval = (db && db.company && db.company.inspectionIntervalDays) || 30;
    return {
      days: days, weeks: bd.weeks, extraDays: bd.extraDays, billedAs: bd.mode,
      rental: rental, insurance: insFee, fees: fees, tolls: tolls, deposit: deposit,
      dueAtSigning: rental + insFee + deposit,
      revenue: rental + insFee + fees,
      deductions: deductions,
      depositRefund: Math.max(0, deposit - deductions),
      balanceOwed: Math.max(0, deductions - deposit),
      inspectionsDue: Math.floor(days / interval),
      monthlyInspection: days > interval
    };
  };

  /* ------------------------------------------------------------ reporting */

  S.stats = function () {
    var cs = db.contracts, vs = db.vehicles;
    var active = cs.filter(function (c) { return c.status === 'active'; });
    var thisMonth = U.today().slice(0, 7);
    return {
      activeCount: active.length,
      fleetSize: vs.length,
      available: vs.filter(function (v) { return v.status === 'available'; }).length,
      rented: vs.filter(function (v) { return v.status === 'rented'; }).length,
      maintenance: vs.filter(function (v) { return v.status === 'maintenance'; }).length,
      monthRevenue: cs.reduce(function (s, c) {
        return U.monthKey(c.startDate) === thisMonth ? s + c.totals.revenue : s;
      }, 0),
      depositsHeld: active.reduce(function (s, c) { return s + U.num(c.deposit, 150); }, 0),
      lifetimeRevenue: cs.reduce(function (s, c) { return s + c.totals.revenue; }, 0),
      openTolls: active.reduce(function (s, c) { return s + c.totals.tolls; }, 0),
      utilization: vs.length
        ? Math.round((vs.filter(function (v) { return v.status === 'rented'; }).length / vs.length) * 100)
        : 0
    };
  };

  /* Revenue by month, trailing n months, oldest first. A contract books to the
     month its rental starts. */
  S.revenueByMonth = function (n) {
    n = n || 6;
    var now = new Date(), buckets = [];
    for (var i = n - 1; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var key = U.iso(d).slice(0, 7);
      buckets.push({ key: key, label: U.monthLabel(key), value: 0, count: 0 });
    }
    db.contracts.forEach(function (c) {
      var b = buckets.filter(function (x) { return x.key === U.monthKey(c.startDate); })[0];
      if (b) { b.value += c.totals.revenue; b.count += 1; }
    });
    return buckets;
  };

  /* Active rentals ordered by how soon they are due back. */
  S.dueBack = function () {
    var today = U.today();
    return db.contracts
      .filter(function (c) { return c.status === 'active'; })
      .map(function (c) {
        return { contract: c, vehicle: S.vehicle(c.vehicleId), daysLeft: U.dayDiff(today, c.endDate) };
      })
      .sort(function (a, b) { return a.daysLeft - b.daysLeft; });
  };

  /* --------------------------------------------------------- data control */

  S.exportJSON = function () { return JSON.stringify(db, null, 2); };
  S.importJSON = function (text) {
    var parsed = JSON.parse(text);
    if (!parsed.vehicles || !parsed.contracts) throw new Error('That file is not a Neville backup.');
    db = parsed;
    if (!db.company) db.company = S.defaultCompany();
    S.syncVehicleStatus();
    write();
    return db;
  };
  S.clearSamples = function () {
    db.contracts = db.contracts.filter(function (c) { return !c.sample; });
    S.syncVehicleStatus();
    write();
  };
  S.hasSamples = function () { return db.contracts.some(function (c) { return c.sample; }); };
  S.resetAll = function () {
    db = null;
    try { localStorage.removeItem(KEY); } catch (e) {}
    return S.init();
  };

  root.NRT.store = S;
})(window);
