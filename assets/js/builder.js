/* Neville Rentals & Transportation — the contract builder.
   One long form rather than a wizard: at a rental counter you jump around,
   and a running total stays pinned at the bottom the whole time. */
(function (root) {
  'use strict';

  var U = root.NRT.util;
  var S = root.NRT.store;
  var UI = root.NRT.ui;
  var CV = root.NRT.canvas;
  var T = root.NRT.terms;

  var B = {};

  /* Increment grids the owner asked for: $25 a day, $50 a week. */
  var DAILY_STEP = 25, DAILY_MIN = 25, DAILY_MAX = 400;
  var WEEKLY_STEP = 50, WEEKLY_MIN = 150, WEEKLY_MAX = 2500;

  function section(n, title, note, kids) {
    var headRow = U.el('div', { class: 'section__head' }, [
      U.el('span', { class: 'section__n', text: String(n).padStart(2, '0') }),
      U.el('span', { class: 'section__title', text: title })
    ]);
    if (note) headRow.appendChild(U.el('span', { class: 'section__note', text: note }));
    var card = U.el('section', { class: 'card section' }, [headRow]);
    var body = U.el('div', { class: 'card__body stack' });
    (kids || []).forEach(function (k) { if (k) body.appendChild(k); });
    card.appendChild(body);
    card.bodyEl = body;
    return card;
  }

  B.render = function (mount, query) {
    var co = S.company();
    var vehicles = S.vehicles();
    var preselect = (query && query.vehicle) || null;

    var draft = {
      vehicleId: null,
      renter: { name: '', dob: '', license: '', licState: 'FL', licExp: '', phone: '', email: '', address: '' },
      startDate: U.today(),
      endDate: U.addDays(U.today(), 7),
      rateMode: 'auto',
      dailyRate: 75,
      weeklyRate: 400,
      insurance: { type: 'company', dailyFee: co.insuranceDaily, provider: '', policyNo: '', policyFileName: null, verified: false },
      pickup: { fuel: 1, odometer: 0, damage: [], date: U.today() },
      dropoff: null,
      deposit: co.deposit,
      tolls: [], fees: [],
      acks: {},
      signature: null,
      agent: co.agent,
      status: 'active'
    };

    mount.appendChild(head());

    var available = vehicles.filter(function (v) { return v.status !== 'rented'; });
    if (!vehicles.length) {
      mount.appendChild(U.el('div', { class: 'card' }, [U.el('div', { class: 'empty' }, [
        U.el('h3', { text: 'Add a vehicle first' }),
        U.el('p', { text: 'A contract needs a vehicle profile. Set one up once and reuse it on every rental.' }),
        UI.button('Go to the fleet', { variant: 'primary', onClick: function () { location.hash = '#/fleet'; } })
      ])]));
      return;
    }

    var form = U.el('div', {});
    mount.appendChild(form);

    /* ---------------------------------------------------------- 1 vehicle */

    var picker = U.el('div', { class: 'picker' });
    var vehNote = U.el('div', { class: 'hint' });
    vehicles.forEach(function (v) {
      var onRent = v.status === 'rented';
      var maint = v.status === 'maintenance';
      var b = U.el('button', {
        type: 'button',
        class: 'pick', disabled: onRent || maint,
        'aria-pressed': 'false'
      });
      var g = U.el('div', { class: 'pick__glyph' });
      g.appendChild(UI.vehicleIcon(v.klass));
      b.appendChild(g);
      b.appendChild(U.el('div', { class: 'pick__body' }, [
        U.el('div', { class: 'pick__name', text: v.year + ' ' + v.make + ' ' + v.model }),
        U.el('div', { class: 'pick__meta', text: (v.plate || '') + ' · ' + U.money0(v.dailyRate) + '/d · ' + U.money0(v.weeklyRate) + '/wk' })
      ]));
      if (onRent) b.appendChild(U.el('span', { class: 'pill pill--info', text: 'Out' }));
      else if (maint) b.appendChild(U.el('span', { class: 'pill pill--warn', text: 'Service' }));
      b.addEventListener('click', function () { selectVehicle(v, b); });
      b.dataset.id = v.id;
      picker.appendChild(b);
    });

    var readyCount = vehicles.filter(function (v) { return v.status === 'available'; }).length;
    var sec1 = section(1, 'Vehicle', readyCount + ' of ' + vehicles.length + ' available', [picker, vehNote]);
    form.appendChild(sec1);

    function selectVehicle(v, btn) {
      draft.vehicleId = v.id;
      U.$$('.pick', picker).forEach(function (x) { x.classList.remove('is-on'); x.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('is-on');
      btn.setAttribute('aria-pressed', 'true');
      draft.dailyRate = v.dailyRate;
      draft.weeklyRate = v.weeklyRate;
      dailyCtl.setValue(v.dailyRate);
      weeklyCtl.setValue(v.weeklyRate);
      draft.pickup.odometer = v.odometer || 0;
      odoIn.value = v.odometer || 0;
      vehNote.textContent = 'VIN ' + (v.vin || '—') + '  ·  ' + (v.color || '') +
        '  ·  rates loaded from the fleet profile, adjustable below.';
      recalc();
    }

    /* ----------------------------------------------------------- 2 renter */

    var f = {};
    f.name = UI.input('r_name', { placeholder: 'As printed on the license', autocomplete: 'name' });
    f.dob = UI.input('r_dob', { type: 'date', max: U.today() });
    f.license = UI.input('r_lic', { placeholder: 'W412-8873-2201-90', class: 'input--mono', autocomplete: 'off' });
    f.licState = UI.input('r_licstate', { value: 'FL', maxlength: 2, class: 'input--mono' });
    f.licExp = UI.input('r_licexp', { type: 'date' });
    f.phone = UI.input('r_phone', { type: 'tel', placeholder: '(305) 555-0142', autocomplete: 'tel' });
    f.email = UI.input('r_email', { type: 'email', placeholder: 'renter@example.com', autocomplete: 'email' });
    f.address = U.el('textarea', { id: 'r_addr', placeholder: 'Street, city, state, ZIP', rows: 2 });

    var nameField = UI.field('Full legal name', f.name);
    var dobField = UI.field('Date of birth', f.dob, { hint: 'Must be ' + co.minimumAge + ' or older on the pickup date.' });
    var ageBadge = U.el('div', { class: 'hint' });
    dobField.appendChild(ageBadge);
    var licField = UI.field('Driver license number', f.license);
    var licExpField = UI.field('License expires', f.licExp);

    var sec2 = section(2, 'Renter', 'Age ' + co.minimumAge + '+ required', [
      U.el('div', { class: 'grid grid--2' }, [nameField, dobField]),
      U.el('div', { class: 'grid grid--3' }, [licField, UI.field('State', f.licState), licExpField]),
      U.el('div', { class: 'grid grid--2' }, [UI.field('Phone', f.phone), UI.field('Email', f.email)]),
      UI.field('Address', f.address)
    ]);
    form.appendChild(sec2);

    ['name', 'license', 'licState', 'phone', 'email'].forEach(function (k) {
      f[k].addEventListener('input', function () { draft.renter[k] = f[k].value; });
    });
    f.address.addEventListener('input', function () { draft.renter.address = f.address.value; });
    f.dob.addEventListener('input', function () { draft.renter.dob = f.dob.value; checkAge(); });
    f.licExp.addEventListener('input', function () { draft.renter.licExp = f.licExp.value; checkLicense(); });

    function checkAge() {
      var age = U.ageOn(draft.renter.dob, draft.startDate);
      if (age === null) { ageBadge.textContent = ''; dobField.setError(''); return true; }
      if (age < co.minimumAge) {
        dobField.setError('Age ' + age + ' on the pickup date. ' + co.name.split(' &')[0] + ' rents to ' + co.minimumAge + ' and over only.');
        ageBadge.textContent = '';
        return false;
      }
      dobField.setError('');
      ageBadge.textContent = 'Age ' + age + ' at pickup — eligible.';
      ageBadge.style.color = 'var(--ok)';
      return true;
    }

    function checkLicense() {
      if (!draft.renter.licExp) { licExpField.setError(''); return true; }
      if (draft.renter.licExp < draft.endDate) {
        licExpField.setError('This license expires before the vehicle is due back.');
        return false;
      }
      licExpField.setError('');
      return true;
    }

    /* ------------------------------------------------------ 3 dates/rates */

    var startIn = UI.input('d_start', { type: 'date', value: draft.startDate });
    var endIn = UI.input('d_end', { type: 'date', value: draft.endDate });
    var durationEl = U.el('div', { class: 'duration' });
    var dateField = UI.field('Return date', endIn);

    var modeSeg = UI.seg([
      { value: 'auto', label: 'Automatic' },
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' }
    ], 'auto', function (v) { draft.rateMode = v; recalc(); });

    var dailyCtl = UI.rateControl({
      id: 'rate_daily', label: 'Daily rate', unit: '/day',
      value: draft.dailyRate, step: DAILY_STEP, min: DAILY_MIN, max: DAILY_MAX,
      onChange: function (v) { draft.dailyRate = v; recalc(); }
    });
    var weeklyCtl = UI.rateControl({
      id: 'rate_weekly', label: 'Weekly rate', unit: '/week',
      value: draft.weeklyRate, step: WEEKLY_STEP, min: WEEKLY_MIN, max: WEEKLY_MAX,
      onChange: function (v) { draft.weeklyRate = v; recalc(); }
    });

    var sec3 = section(3, 'Dates and rate', null, [
      U.el('div', { class: 'grid grid--2' }, [UI.field('Pickup date', startIn), dateField]),
      durationEl,
      U.el('div', { class: 'field' }, [
        U.el('span', { class: 'label', text: 'How to bill it' }), modeSeg,
        U.el('div', { class: 'hint', text: 'Automatic charges full weeks at the weekly rate and any remaining days at the daily rate.' })
      ]),
      U.el('div', { class: 'grid grid--2' }, [dailyCtl, weeklyCtl])
    ]);
    form.appendChild(sec3);

    startIn.addEventListener('input', function () {
      draft.startDate = startIn.value;
      if (draft.endDate <= draft.startDate) {
        draft.endDate = U.addDays(draft.startDate, 1);
        endIn.value = draft.endDate;
      }
      draft.pickup.date = draft.startDate;
      endIn.min = U.addDays(draft.startDate, 1);
      checkAge(); recalc();
    });
    endIn.addEventListener('input', function () {
      draft.endDate = endIn.value;
      if (draft.endDate <= draft.startDate) {
        dateField.setError('The return date has to come after pickup.');
      } else dateField.setError('');
      checkLicense(); recalc();
    });
    endIn.min = U.addDays(draft.startDate, 1);

    /* -------------------------------------------------------- 4 insurance */

    var insCompany = U.el('label', { class: 'choice is-on' });
    var insCompanyRadio = U.el('input', { type: 'radio', name: 'ins', value: 'company', checked: true, id: 'ins_company' });
    insCompany.appendChild(insCompanyRadio);
    insCompany.appendChild(U.el('div', { class: 'choice__body' }, [
      U.el('div', { class: 'choice__title', text: 'Insurance provided by ' + co.name.split(' &')[0] }),
      U.el('div', { class: 'choice__note', text: 'Coverage runs for the whole rental term, billed per day at signing.' })
    ]));
    var insPrice = U.el('span', { class: 'choice__price' });
    insCompany.appendChild(insPrice);

    var insSelf = U.el('label', { class: 'choice' });
    var insSelfRadio = U.el('input', { type: 'radio', name: 'ins', value: 'self', id: 'ins_self' });
    insSelf.appendChild(insSelfRadio);
    insSelf.appendChild(U.el('div', { class: 'choice__body' }, [
      U.el('div', { class: 'choice__title', text: 'Renter is self-insured' }),
      U.el('div', { class: 'choice__note', text: 'Requires a current policy covering this vehicle before keys are released.' })
    ]));
    var insSelfPrice = U.el('span', { class: 'choice__price', text: 'No daily fee' });
    insSelf.appendChild(insSelfPrice);

    var selfPanel = U.el('div', { class: 'stack', hidden: true });
    var provIn = UI.input('ins_provider', { placeholder: 'GEICO, Progressive, State Farm' });
    var polIn = UI.input('ins_policy', { placeholder: '4471-882-119', class: 'input--mono' });
    var provField = UI.field('Insurance company', provIn);
    var polField = UI.field('Policy number', polIn);

    var fileIn = U.el('input', { type: 'file', id: 'ins_file', accept: 'image/*,.pdf' });
    var fileNote = U.el('div', { class: 'hint', text: 'Take a photo of the declarations page or insurance card, or attach a PDF.' });
    var fileStatus = U.el('div', { class: 'hint' });
    var verifyBox = U.el('input', { type: 'checkbox', id: 'ins_verified' });
    var verifyLabel = U.el('label', { class: 'choice' }, [
      verifyBox,
      U.el('div', { class: 'choice__body' }, [
        U.el('div', { class: 'choice__title', text: 'I have seen a valid policy covering this vehicle' }),
        U.el('div', { class: 'choice__note', text: 'Confirmed by the agent releasing the keys.' })
      ])
    ]);

    selfPanel.appendChild(UI.note('warn', 'Proof of insurance required',
      'Do not release the keys until you have a copy of the renter’s policy on file. Attach it here and it is noted on the contract.'));
    selfPanel.appendChild(U.el('div', { class: 'grid grid--2' }, [provField, polField]));
    selfPanel.appendChild(U.el('div', { class: 'field' }, [
      U.el('label', { text: 'Copy of the policy', for: 'ins_file' }), fileIn, fileNote, fileStatus
    ]));
    selfPanel.appendChild(verifyLabel);

    fileIn.addEventListener('change', function () {
      var file = fileIn.files && fileIn.files[0];
      if (!file) { draft.insurance.policyFileName = null; fileStatus.textContent = ''; return; }
      draft.insurance.policyFileName = file.name;
      draft.insurance.policyFileSize = file.size;
      fileStatus.textContent = 'Attached: ' + file.name + ' (' + Math.round(file.size / 1024) + ' KB). ' +
        'The file stays on this device — the contract records that a copy was received.';
      fileStatus.style.color = 'var(--ok)';
    });
    verifyBox.addEventListener('change', function () { draft.insurance.verified = verifyBox.checked; });
    provIn.addEventListener('input', function () { draft.insurance.provider = provIn.value; });
    polIn.addEventListener('input', function () { draft.insurance.policyNo = polIn.value; });

    function setInsurance(type) {
      draft.insurance.type = type;
      /* The per-day fee is ours to charge only when we carry the coverage.
         Zero it on the record as well as in the total, so a self-insured
         contract cannot read back as though a fee were owed. */
      draft.insurance.dailyFee = type === 'company' ? co.insuranceDaily : 0;
      insCompany.classList.toggle('is-on', type === 'company');
      insSelf.classList.toggle('is-on', type === 'self');
      selfPanel.hidden = type !== 'self';
      recalc();
    }
    insCompanyRadio.addEventListener('change', function () { if (insCompanyRadio.checked) setInsurance('company'); });
    insSelfRadio.addEventListener('change', function () { if (insSelfRadio.checked) setInsurance('self'); });

    var sec4 = section(4, 'Insurance', U.money(co.insuranceDaily) + ' per day if we cover it', [
      insCompany, insSelf, selfPanel
    ]);
    form.appendChild(sec4);

    /* -------------------------------------------------------- 5 condition */

    var gauge = CV.fuelGauge({ value: 1, onChange: function (v) { draft.pickup.fuel = v; } });
    var odoIn = UI.input('p_odo', { type: 'number', min: 0, value: 0, class: 'input--mono' });
    odoIn.addEventListener('input', function () { draft.pickup.odometer = U.num(odoIn.value); });

    var tools = U.el('div', { class: 'dmg__tools' });
    var dmgCanvas = U.el('canvas', { class: 'dmg__canvas' });
    var dmgCount = U.el('span', { class: 'dmg__count', text: 'No marks yet. Circle or draw anything already on the vehicle.' });
    var pad = null;

    [['pen', 'Draw', 'pen'], ['circle', 'Circle', 'circle'], ['x', 'Mark X', 'x'], ['note', 'Note', 'note']].forEach(function (t, i) {
      var b = U.el('button', { type: 'button', class: 'dmg__tool' + (i === 0 ? ' is-on' : '') });
      b.appendChild(UI.icon(t[2]));
      b.appendChild(document.createTextNode(t[1]));
      b.addEventListener('click', function () {
        U.$$('.dmg__tool', tools).forEach(function (x) { x.classList.remove('is-on'); });
        b.classList.add('is-on');
        if (pad) pad.setTool(t[0]);
      });
      tools.appendChild(b);
    });
    var undoBtn = U.el('button', { type: 'button', class: 'dmg__tool dmg__spacer' });
    undoBtn.appendChild(UI.icon('undo'));
    undoBtn.appendChild(document.createTextNode('Undo'));
    undoBtn.addEventListener('click', function () { if (pad) pad.undo(); });
    var clearBtn = U.el('button', { type: 'button', class: 'dmg__tool' });
    clearBtn.appendChild(UI.icon('trash'));
    clearBtn.appendChild(document.createTextNode('Clear'));
    clearBtn.addEventListener('click', function () { if (pad) pad.clear(); });
    tools.appendChild(undoBtn);
    tools.appendChild(clearBtn);

    var sec5 = section(5, 'Condition at pickup', 'Walk around the vehicle with the renter', [
      U.el('div', { class: 'grid grid--2' }, [
        U.el('div', { class: 'field' }, [
          U.el('span', { class: 'label', text: 'Fuel level' }), gauge,
          U.el('div', { class: 'hint', text: 'The vehicle must come back at this level.' })
        ]),
        UI.field('Odometer (mi)', odoIn, { hint: 'Loaded from the fleet profile — correct it if it has moved.' })
      ]),
      U.el('div', { class: 'dmg' }, [
        U.el('span', { class: 'label', text: 'Existing damage — mark it before the keys change hands' }),
        tools, dmgCanvas, dmgCount
      ])
    ]);
    form.appendChild(sec5);

    /* ---------------------------------------------------- 6 deposit/fees */

    var depIn = UI.input('dep', { type: 'number', min: 0, step: 25, value: co.deposit, class: 'input--mono' });
    depIn.addEventListener('input', function () { draft.deposit = U.num(depIn.value); recalc(); });

    var feeLines = U.el('div', { class: 'lines' });
    function feeRow(item) {
      var label = UI.input('', { value: item.label || '', placeholder: 'Additional driver, delivery, child seat' });
      var amt = UI.input('', { type: 'number', step: '0.01', min: 0, value: item.amount || '', placeholder: '0.00' });
      var row = U.el('div', { class: 'line-item' }, [label, amt]);
      var del = UI.button('', { size: 'sm', variant: 'ghost', icon: 'x', onClick: function () {
        draft.fees = draft.fees.filter(function (x) { return x !== item; });
        row.remove(); recalc();
      } });
      del.setAttribute('aria-label', 'Remove charge');
      row.appendChild(del);
      label.addEventListener('input', function () { item.label = label.value; });
      amt.addEventListener('input', function () { item.amount = U.num(amt.value); recalc(); });
      feeLines.appendChild(row);
    }

    var ledger = U.el('div', { class: 'ledger' });
    var sec6 = section(6, 'Deposit and charges', null, [
      U.el('div', { class: 'grid grid--2' }, [
        UI.field('Security deposit', depIn, { hint: 'Refundable. Tolls and damage come out of this at check-in.' }),
        U.el('div', { class: 'field' }, [
          U.el('span', { class: 'label', text: 'Additional charges' }),
          feeLines,
          U.el('div', {}, [UI.button('Add a charge', { size: 'sm', icon: 'plus', onClick: function () {
            var item = { label: '', amount: 0 };
            draft.fees.push(item); feeRow(item);
          } })])
        ])
      ]),
      U.el('hr', { class: 'divider' }),
      ledger
    ]);
    form.appendChild(sec6);

    /* ------------------------------------------------------------ 7 terms */

    var termsBox = U.el('div', {
      style: 'max-height:280px;overflow:auto;border:1px solid var(--line);border-radius:var(--r-md);' +
             'padding:14px;background:var(--surface-2);font-size:.82rem;line-height:1.5'
    });
    var ackBox = U.el('div', { class: 'stack' });
    var sec7 = section(7, 'Terms', 'Read with the renter', [
      termsBox,
      U.el('div', { class: 'label', style: 'margin-top:4px', text: 'Renter acknowledgements' }),
      ackBox
    ]);
    form.appendChild(sec7);

    /* -------------------------------------------------------- 8 signature */

    var sigCanvas = U.el('canvas', { class: 'sig__pad' });
    var sigPad = null;
    var sigStatus = U.el('div', { class: 'hint', text: 'Sign with a finger on a phone or tablet, or with the mouse.' });
    var agentIn = UI.input('agent', { value: co.agent });
    agentIn.addEventListener('input', function () { draft.agent = agentIn.value; });

    var sec8 = section(8, 'Signature', null, [
      U.el('div', { class: 'sig' }, [
        U.el('span', { class: 'label', text: 'Renter signature' }),
        sigCanvas,
        U.el('div', { class: 'sig__rule' }, [U.el('span', {})]),
        U.el('div', { class: 'inline' }, [
          UI.button('Clear signature', { size: 'sm', icon: 'undo', onClick: function () { if (sigPad) sigPad.clear(); } }),
          sigStatus
        ])
      ]),
      UI.field('Releasing agent', agentIn)
    ]);
    form.appendChild(sec8);

    /* ------------------------------------------------------- sticky total */

    var sumAmt = U.el('div', { class: 'summary__amt', text: '—' });
    var sumMid = U.el('div', { class: 'summary__mid' });
    var signBtn = UI.button('Sign & generate', {
      variant: 'primary', onClick: submit
    });
    var summary = U.el('div', { class: 'summary no-print' }, [
      U.el('div', { class: 'summary__fig' }, [
        U.el('div', { class: 'summary__lbl', text: 'Due at signing' }), sumAmt
      ]),
      sumMid, signBtn
    ]);
    mount.appendChild(summary);

    /* ------------------------------------------------------------- recalc */

    function currentContract() {
      return Object.assign({}, draft, { rateMode: draft.rateMode === 'auto' ? 'weekly' : draft.rateMode });
    }

    function recalc() {
      var c = currentContract();
      var t = S.totals(c);
      c.totals = t;

      /* duration readout */
      durationEl.innerHTML = '';
      durationEl.appendChild(U.el('div', { class: 'duration__part' }, [
        U.el('span', { class: 'duration__lbl', text: 'Duration' }),
        U.el('span', { class: 'duration__big', text: t.days + (t.days === 1 ? ' day' : ' days') })
      ]));
      if (t.weeks) {
        durationEl.appendChild(U.el('div', { class: 'duration__part' }, [
          U.el('span', { class: 'duration__lbl', text: 'Billed as' }),
          U.el('span', { class: 'duration__big', text: t.weeks + 'w' + (t.extraDays ? ' + ' + t.extraDays + 'd' : '') })
        ]));
      }
      durationEl.appendChild(U.el('div', { class: 'duration__part' }, [
        U.el('span', { class: 'duration__lbl', text: 'Rental charge' }),
        U.el('span', { class: 'duration__big', text: U.money0(t.rental) })
      ]));
      if (t.monthlyInspection) {
        durationEl.appendChild(U.el('span', { class: 'pill pill--warn',
          text: t.inspectionsDue + ' inspection' + (t.inspectionsDue === 1 ? '' : 's') + ' required' }));
      }

      insPrice.textContent = U.money(co.insuranceDaily) + '/day · ' + U.money(co.insuranceDaily * t.days);
      insSelfPrice.textContent = 'No daily fee · saves ' + U.money(co.insuranceDaily * t.days);

      /* ledger */
      ledger.innerHTML = '';
      function row(label, amt, sub, cls) {
        var l = U.el('div', { class: 'ledger__label', text: label });
        if (sub) l.appendChild(U.el('small', { text: sub }));
        ledger.appendChild(U.el('div', { class: 'ledger__row' + (cls ? ' ledger__row--' + cls : '') }, [
          l, U.el('div', { class: 'ledger__amt', text: amt })
        ]));
      }
      if (t.weeks) {
        row('Rental, weekly', U.money(t.weeks * draft.weeklyRate), U.money(draft.weeklyRate) + ' × ' + t.weeks + ' week' + (t.weeks === 1 ? '' : 's'));
        if (t.extraDays) row('Rental, extra days', U.money(t.extraDays * draft.dailyRate), U.money(draft.dailyRate) + ' × ' + t.extraDays + ' day' + (t.extraDays === 1 ? '' : 's'));
      } else {
        row('Rental, daily', U.money(t.rental), U.money(draft.dailyRate) + ' × ' + t.days + ' day' + (t.days === 1 ? '' : 's'));
      }
      if (draft.insurance.type === 'company') {
        row('Insurance', U.money(t.insurance), U.money(co.insuranceDaily) + ' × ' + t.days + ' days');
      } else {
        row('Insurance — waived', U.money(0),
          U.money(co.insuranceDaily) + '/day not charged · renter is self-insured');
      }
      (draft.fees || []).forEach(function (fee) {
        if (U.num(fee.amount)) row(fee.label || 'Additional charge', U.money(fee.amount));
      });
      row('Security deposit', U.money(t.deposit), 'Refundable less tolls and damage');
      row('Due at signing', U.money(t.dueAtSigning), null, 'total');

      sumAmt.textContent = U.money0(t.dueAtSigning);
      sumMid.textContent = t.days + ' days · ' + U.money0(t.revenue) + ' revenue · ' +
        U.money0(t.deposit) + ' deposit held';

      paintTerms(c);
    }

    function paintTerms(c) {
      var veh = S.vehicle(draft.vehicleId);
      termsBox.innerHTML = '';
      T.clauses(c, co, veh).forEach(function (cl, i) {
        termsBox.appendChild(U.el('p', {
          style: 'margin:0 0 9px',
          html: '<b>' + (i + 1) + '. ' + U.escape(cl.title) + '.</b> ' + U.escape(cl.text)
        }));
      });

      var acks = T.acknowledgements(c, co);
      var existing = draft.acks;
      ackBox.innerHTML = '';
      acks.forEach(function (a) {
        var cb = U.el('input', { type: 'checkbox', id: a.id, checked: !!existing[a.id] });
        var lab = U.el('label', { class: 'choice' + (existing[a.id] ? ' is-on' : ''), for: a.id }, [
          cb, U.el('div', { class: 'choice__body' }, [U.el('div', { class: 'choice__note', text: a.text })])
        ]);
        cb.addEventListener('change', function () {
          draft.acks[a.id] = cb.checked;
          lab.classList.toggle('is-on', cb.checked);
        });
        ackBox.appendChild(lab);
      });
      /* drop acknowledgements that no longer apply */
      Object.keys(draft.acks).forEach(function (k) {
        if (!acks.some(function (a) { return a.id === k; })) delete draft.acks[k];
      });
    }

    /* ------------------------------------------------------------- submit */

    function submit() {
      var problems = [];
      if (!draft.vehicleId) problems.push('Pick a vehicle.');
      if (!draft.renter.name.trim()) { problems.push('Enter the renter’s name.'); nameField.setError('Required.'); }
      else nameField.setError('');
      if (!draft.renter.dob) { problems.push('Enter the renter’s date of birth.'); dobField.setError('Required.'); }
      else if (!checkAge()) problems.push('The renter is under ' + co.minimumAge + '.');
      if (!draft.renter.license.trim()) { problems.push('Enter the driver license number.'); licField.setError('Required.'); }
      else licField.setError('');
      if (U.dayDiff(draft.startDate, draft.endDate) < 1) problems.push('The return date has to come after pickup.');
      if (draft.insurance.type === 'self') {
        if (!draft.insurance.provider.trim() || !draft.insurance.policyNo.trim()) {
          problems.push('Self-insured renters need an insurance company and policy number.');
          if (!draft.insurance.provider.trim()) provField.setError('Required for self-insurance.');
          if (!draft.insurance.policyNo.trim()) polField.setError('Required for self-insurance.');
        }
        if (!draft.insurance.verified) problems.push('Confirm you have seen the renter’s policy.');
      }
      var acks = T.acknowledgements(currentContract(), co);
      var missingAcks = acks.filter(function (a) { return !draft.acks[a.id]; });
      if (missingAcks.length) problems.push('The renter has ' + missingAcks.length + ' acknowledgement' +
        (missingAcks.length === 1 ? '' : 's') + ' left to check.');
      if (!sigPad || sigPad.isEmpty()) {
        problems.push('The renter has to sign.');
        sigCanvas.classList.add('is-required');
      } else sigCanvas.classList.remove('is-required');

      if (problems.length) {
        U.toast(problems[0], 'bad');
        showProblems(problems);
        return;
      }

      draft.signature = sigPad.getStrokes();
      draft.signedAt = U.today();
      draft.rateMode = draft.rateMode === 'auto' ? 'weekly' : draft.rateMode;
      draft.pickup.damage = pad ? pad.getMarks() : [];
      draft.fees = draft.fees.filter(function (x) { return U.num(x.amount) > 0; });
      draft.status = 'active';

      var saved = S.saveContract(draft);
      U.toast('Contract ' + saved.no + ' is signed and in force.', 'good');
      afterSign(saved);
    }

    function showProblems(problems) {
      var list = U.el('ul', { style: 'margin:0;padding-left:20px;line-height:1.6' });
      problems.forEach(function (p) { list.appendChild(U.el('li', { text: p })); });
      UI.modal({
        title: 'Before this can be signed',
        body: U.el('div', {}, [
          U.el('p', { class: 'dim', text: 'A few things are still outstanding:' }), list
        ]),
        actions: [{ label: 'Back to the form', variant: 'primary' }]
      });
    }

    function afterSign(saved) {
      var body = U.el('div', { class: 'stack' });
      body.appendChild(UI.note('info', 'Agreement ' + saved.no + ' is signed',
        'The vehicle is marked as out. Send the renter their copy now, or print it for the file.', 'check'));
      var actions = U.el('div', { class: 'inline' }, [
        UI.button('Send to renter', { variant: 'primary', icon: 'upload', onClick: function () {
          root.NRT.share.open(saved);
        } }),
        UI.button('Print', { icon: 'printer', onClick: function () { root.NRT.app.printContract(saved.id); } }),
        UI.button('Open the contract', { icon: 'files', onClick: function () { location.hash = '#/contract/' + saved.id; } })
      ]);
      body.appendChild(actions);
      UI.modal({
        title: 'Signed', body: body,
        actions: [{ label: 'Done', variant: 'primary', onClick: function () { location.hash = '#/contract/' + saved.id; } }],
        onClose: function () { location.hash = '#/contract/' + saved.id; }
      });
    }

    function head() {
      return U.el('div', { class: 'page-head' }, [
        U.el('div', { class: 'page-head__text' }, [
          U.el('div', { class: 'eyebrow', text: 'New agreement · ' + S.nextContractNo() }),
          U.el('h1', { text: 'Write a contract' })
        ])
      ]);
    }

    /* ---------------------------------------------------------- start up */

    recalc();

    requestAnimationFrame(function () {
      pad = new CV.DamagePad(dmgCanvas, [], function (marks) {
        dmgCount.textContent = marks.length
          ? marks.length + ' mark' + (marks.length === 1 ? '' : 's') + ' recorded'
          : 'No marks yet. Circle or draw anything already on the vehicle.';
      });
      sigPad = new CV.SignaturePad(sigCanvas, function (strokes) {
        sigStatus.textContent = strokes.length ? 'Signature captured.' : 'Sign with a finger on a phone or tablet, or with the mouse.';
        sigStatus.style.color = strokes.length ? 'var(--ok)' : '';
        sigCanvas.classList.remove('is-required');
      });

      var target = preselect && S.vehicle(preselect);
      if (!target) {
        target = vehicles.filter(function (v) { return v.status === 'available'; })[0];
      }
      if (target && target.status !== 'rented' && target.status !== 'maintenance') {
        var btn = U.$$('.pick', picker).filter(function (b) { return b.dataset.id === target.id; })[0];
        if (btn) selectVehicle(target, btn);
      }
    });
  };

  root.NRT.builder = B;
})(window);
