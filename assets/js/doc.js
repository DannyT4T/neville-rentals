/* Neville Rentals & Transportation — the contract document.
   Renders a signed (or in-progress) rental agreement as a classic black-ink
   sheet that prints on US Letter without further styling. */
(function (root) {
  'use strict';

  var U = root.NRT.util;
  var S = root.NRT.store;
  var CV = root.NRT.canvas;
  var T = root.NRT.terms;

  var D = {};

  function dlItem(k, v, mono) {
    var val = U.el('div', { class: 'dl__v' + (mono ? ' is-mono' : '') + (v ? '' : ' is-blank'), text: v || '—' });
    return U.el('div', { class: 'dl__i' }, [U.el('span', { class: 'dl__k', text: k }), val]);
  }

  function article(n, title, right, kids) {
    var head = U.el('div', { class: 'art__h' }, [
      U.el('span', { class: 'n', text: 'Art. ' + n }),
      U.el('span', { text: title })
    ]);
    if (right) head.appendChild(U.el('span', { class: 'r', text: right }));
    var art = U.el('section', { class: 'art' }, [head]);
    (kids || []).forEach(function (k) { art.appendChild(k); });
    return art;
  }

  /* Five boxes, the recorded level filled — a fuel gauge that survives a fax. */
  function fuelStrip(level) {
    var wrap = U.el('div', { class: 'fuelstrip-wrap' });
    var strip = U.el('div', { class: 'fuelstrip' });
    wrap.appendChild(U.el('span', { class: 'dl__k', style: 'float:left;margin-right:6px;line-height:26px', text: 'E' }));
    U.FUEL.forEach(function (f, i) {
      if (i === 0) return; // four quarters between E and F
      var filled = level >= f.v - 0.001;
      var b = U.el('div', { class: 'fuelstrip__b' + (filled ? ' is-on' : '') });
      b.appendChild(U.el('span', { text: f.short }));
      strip.appendChild(b);
    });
    wrap.appendChild(strip);
    return wrap;
  }

  function conditionBox(title, snap, opts) {
    opts = opts || {};
    var box = U.el('div', { class: 'cond__box' });
    box.appendChild(U.el('div', { class: 'cond__h', text: title }));
    if (!snap) {
      box.appendChild(U.el('div', { class: 'dl__v is-blank', text: 'Not yet recorded' }));
      return box;
    }
    var grid = U.el('div', { class: 'cond__grid' });
    var fuelCell = U.el('div', {}, [U.el('span', { class: 'dl__k', text: 'Fuel level' })]);
    fuelCell.appendChild(fuelStrip(snap.fuel));
    grid.appendChild(fuelCell);
    grid.appendChild(U.el('div', {}, [
      U.el('span', { class: 'dl__k', text: 'Odometer' }),
      U.el('div', { class: 'dl__v is-mono', text: snap.odometer ? Number(snap.odometer).toLocaleString('en-US') + ' mi' : '—' })
    ]));
    box.appendChild(grid);
    if (opts.date) {
      box.appendChild(U.el('div', { style: 'margin-top:8px' }, [
        U.el('span', { class: 'dl__k', text: 'Date & time' }),
        U.el('div', { class: 'dl__v is-mono', text: U.fmtDate(snap.date) })
      ]));
    }
    return box;
  }

  function damageBlock(marks, caption) {
    var box = U.el('div', { class: 'dmgdoc' });
    var cv = U.el('canvas');
    box.appendChild(cv);
    box.appendChild(U.el('div', { class: 'dmgdoc__cap', text: caption }));
    requestAnimationFrame(function () { CV.renderDamage(cv, marks, { mono: true }); });
    return box;
  }

  function signatureBlock(label, name, strokes, dateIso, roleNote) {
    var box = U.el('div', { class: 'sign__box' });
    var ink = U.el('div', { class: 'sign__ink' });
    if (strokes && strokes.length) {
      var cv = U.el('canvas');
      ink.appendChild(cv);
      requestAnimationFrame(function () { CV.renderSignature(cv, strokes, { color: '#0A0A0A' }); });
    } else if (roleNote === 'typed' && name) {
      ink.appendChild(U.el('div', { class: 'typed', text: name }));
    }
    box.appendChild(ink);
    var rule = U.el('div', { class: 'sign__rule' }, [
      U.el('div', { class: 'sign__k', text: label }),
      U.el('div', { class: 'sign__v', text: name || '—' }),
      U.el('div', { class: 'sign__date', text: 'Date: ' + (dateIso ? U.fmtDate(dateIso) : '____ / ____ / ________') })
    ]);
    box.appendChild(rule);
    return box;
  }

  /* --------------------------------------------------------------- render */

  D.render = function (c) {
    var co = S.company();
    var veh = S.vehicle(c.vehicleId) || c.vehicleSnapshot || {};
    var t = c.totals || S.totals(c);
    var sheet = U.el('article', { class: 'sheet', id: 'contract-sheet' });

    /* Articles are numbered as they are emitted - the settlement article only
       appears once there is something to settle, and the ones after it must
       not leave a gap. */
    var artNo = 0;
    function A() { return ++artNo; }

    /* masthead ---------------------------------------------------------- */
    var head = U.el('div', { class: 'sheet__head' }, [
      U.el('div', { class: 'sheet__co' }, [
        U.el('h1', { text: co.name }),
        U.el('p', { text: co.address }),
        U.el('p', { text: co.phone + '  ·  ' + co.email })
      ]),
      U.el('div', { class: 'sheet__stamp' }, [
        U.el('div', { class: 'eyebrow-b', text: 'Agreement no.' }),
        U.el('div', { class: 'sheet__no', text: c.no || S.nextContractNo() }),
        U.el('div', { class: 'sheet__date', text: 'Issued ' + U.fmtDate(c.signedAt || U.today(), 'long') })
      ])
    ]);
    sheet.appendChild(head);

    if (c.status === 'draft' || !c.signature) {
      sheet.appendChild(U.el('div', { class: 'watermark', text: 'Unsigned — not yet in force' }));
    }

    sheet.appendChild(U.el('div', { class: 'sheet__title' }, [
      U.el('h2', { text: 'Vehicle Rental Agreement' }),
      U.el('p', { text: 'This agreement is made between the parties named below and governs the rental of the vehicle described herein.' })
    ]));

    /* Art. 1 — parties -------------------------------------------------- */
    var r = c.renter || {};
    var age = U.ageOn(r.dob, c.startDate);
    sheet.appendChild(article(A(), 'Parties', 'Owner: ' + co.name, [
      U.el('div', { class: 'dl dl--2' }, [
        dlItem('Renter, full legal name', r.name),
        dlItem('Date of birth', r.dob ? U.fmtDate(r.dob) + (age !== null ? '   (age ' + age + ')' : '') : '', true),
        dlItem('Driver license number', r.license, true),
        dlItem('Issuing state / expiry', (r.licState || '—') + '  ·  ' + (r.licExp ? U.fmtDate(r.licExp) : '—'), true),
        dlItem('Telephone', r.phone, true),
        dlItem('Email', r.email),
        U.el('div', { class: 'dl__i', style: 'grid-column:1/-1' }, [
          U.el('span', { class: 'dl__k', text: 'Address' }),
          U.el('div', { class: 'dl__v' + (r.address ? '' : ' is-blank'), text: r.address || '—' })
        ])
      ])
    ]));

    /* Art. 2 — vehicle -------------------------------------------------- */
    sheet.appendChild(article(A(), 'The vehicle', null, [
      U.el('div', { class: 'dl dl--3' }, [
        dlItem('Year / make / model', [veh.year, veh.make, veh.model].filter(Boolean).join(' ')),
        dlItem('Color / body', [veh.color, veh.trim].filter(Boolean).join(' · ')),
        dlItem('Seats', veh.seats ? String(veh.seats) : '', true),
        dlItem('Vehicle identification number', veh.vin, true),
        dlItem('License plate', (veh.plate || '') + (veh.state ? '  (' + veh.state + ')' : ''), true),
        dlItem('Class', ({ standard: 'Standard', suv: 'Sport utility', luxury: 'Luxury', van: 'Van / minivan' })[veh.klass] || '—')
      ])
    ]));

    /* Art. 3 — term and rate -------------------------------------------- */
    var termRight = t.billedAs === 'weekly'
      ? 'Billed at the weekly rate'
      : 'Billed at the daily rate';
    sheet.appendChild(article(A(), 'Term and rate', termRight, [
      U.el('div', { class: 'dl dl--3' }, [
        dlItem('Rental begins', U.fmtDate(c.startDate, 'long')),
        dlItem('Rental ends', U.fmtDate(c.endDate, 'long')),
        dlItem('Duration', t.days + ' day' + (t.days === 1 ? '' : 's') +
          (t.weeks ? '  (' + t.weeks + ' week' + (t.weeks === 1 ? '' : 's') +
            (t.extraDays ? ' + ' + t.extraDays + ' day' + (t.extraDays === 1 ? '' : 's') : '') + ')' : ''), true),
        dlItem('Daily rate', U.money(c.dailyRate), true),
        dlItem('Weekly rate', U.money(c.weeklyRate), true),
        dlItem('Deposit held', U.money(t.deposit), true)
      ])
    ]));

    /* Art. 4 — charges --------------------------------------------------- */
    var tbl = U.el('table', { class: 'tbl' });
    var thead = U.el('thead', {}, [U.el('tr', {}, [
      U.el('th', { text: 'Charge' }),
      U.el('th', { class: 'r', text: 'Rate' }),
      U.el('th', { class: 'r', text: 'Qty' }),
      U.el('th', { class: 'r', text: 'Amount' })
    ])]);
    var tb = U.el('tbody');

    function line(label, rate, qty, amt, cls) {
      tb.appendChild(U.el('tr', { class: cls || '' }, [
        U.el('td', { text: label }),
        U.el('td', { class: 'r', text: rate }),
        U.el('td', { class: 'r', text: qty }),
        U.el('td', { class: 'r', text: amt })
      ]));
    }

    if (t.weeks) {
      line('Vehicle rental, weekly', U.money(c.weeklyRate), t.weeks + ' wk', U.money(t.weeks * c.weeklyRate));
      if (t.extraDays) line('Vehicle rental, additional days', U.money(c.dailyRate), t.extraDays + ' d', U.money(t.extraDays * c.dailyRate));
    } else {
      line('Vehicle rental, daily', U.money(c.dailyRate), t.days + ' d', U.money(t.rental));
    }
    if (c.insurance && c.insurance.type === 'company') {
      line('Insurance, provided by owner', U.money(c.insurance.dailyFee), t.days + ' d', U.money(t.insurance));
    } else {
      line('Insurance — waived, renter self-insured', 'no daily fee', '—', U.money(0));
    }
    (c.fees || []).forEach(function (f) {
      line(f.label || 'Additional charge', '—', '—', U.money(f.amount));
    });
    line('Refundable security deposit', '—', '—', U.money(t.deposit));
    tb.appendChild(U.el('tr', { class: 'total' }, [
      U.el('td', { text: 'Due at signing' }),
      U.el('td', { class: 'r' }), U.el('td', { class: 'r' }),
      U.el('td', { class: 'r', text: U.money(t.dueAtSigning) })
    ]));
    tbl.appendChild(thead); tbl.appendChild(tb);
    sheet.appendChild(article(A(), 'Charges', 'All amounts in US dollars', [tbl]));

    /* Art. 5 — condition ------------------------------------------------- */
    var condWrap = U.el('div', { class: 'cond' }, [
      conditionBox('Condition at pickup', c.pickup, { date: true }),
      conditionBox('Condition at return', c.dropoff, { date: true })
    ]);
    var art5 = article(A(), 'Vehicle condition', 'Marked and initialed by both parties', [
      condWrap,
      U.el('div', { style: 'height:12px' }),
      damageBlock((c.pickup && c.pickup.damage) || [],
        'Pre-existing damage recorded at pickup. Marks: ' + (((c.pickup && c.pickup.damage) || []).length || 'none'))
    ]);
    if (c.dropoff && c.dropoff.damage && c.dropoff.damage.length) {
      art5.appendChild(U.el('div', { style: 'height:12px' }));
      art5.appendChild(damageBlock(c.dropoff.damage,
        'Condition recorded at return. Marks: ' + c.dropoff.damage.length));
    }
    sheet.appendChild(art5);

    /* Art. 6 — deposit settlement (only once there is something to settle) */
    if (c.status === 'completed' || (c.tolls && c.tolls.length) || (c.fees && c.fees.length)) {
      var st = U.el('table', { class: 'tbl' });
      var stb = U.el('tbody');
      function srow(label, amt, cls) {
        stb.appendChild(U.el('tr', { class: cls || '' }, [
          U.el('td', { text: label, colSpan: 3 }),
          U.el('td', { class: 'r', text: amt })
        ]));
      }
      srow('Security deposit held', U.money(t.deposit));
      if ((c.tolls || []).length) {
        (c.tolls).forEach(function (x) {
          srow('Less toll — ' + (x.label || 'toll charge') + (x.date ? ' (' + U.fmtDate(x.date) + ')' : ''), '− ' + U.money(x.amount), 'sub');
        });
      } else {
        srow('Less tolls incurred', '− ' + U.money(0), 'sub');
      }
      (c.fees || []).forEach(function (f) {
        srow('Less ' + (f.label || 'additional charge'), '− ' + U.money(f.amount), 'sub');
      });
      stb.appendChild(U.el('tr', { class: 'total' }, [
        U.el('td', { colSpan: 3, text: t.balanceOwed > 0 ? 'Balance due from renter' : 'Deposit balance returned to renter' }),
        U.el('td', { class: 'r', text: U.money(t.balanceOwed > 0 ? t.balanceOwed : t.depositRefund) })
      ]));
      st.appendChild(stb);
      sheet.appendChild(article(A(), 'Security deposit settlement',
        c.status === 'completed' ? 'Settled ' + U.fmtDate(c.closedAt || c.endDate) : 'Provisional — rental open', [
        st,
        U.el('p', { class: 'tbl note-cell', style: 'margin-top:8px',
          text: 'Toll invoices received after this settlement remain payable by the renter under Clause 3 of the terms.' })
      ]));
    }

    /* Terms ------------------------------------------------------------- */
    var clauseList = T.clauses(c, co, veh);
    var box = U.el('div', { class: 'clauses' });
    clauseList.forEach(function (cl, i) {
      var row = U.el('div', { class: 'clause' + (cl.key ? ' clause--key' : '') }, [
        U.el('div', { class: 'clause__n', text: (i + 1) + '.' }),
        U.el('div', { class: 'clause__t', html: '<b>' + U.escape(cl.title) + '.</b> ' + U.escape(cl.text) })
      ]);
      box.appendChild(row);
    });
    var artTerms = article(A(), 'Terms and conditions', 'Clauses 1-' + clauseList.length, [box]);
    artTerms.classList.add('art--terms');

    var acks = T.acknowledgements(c, co);
    var ackWrap = U.el('div', { class: 'ack' });
    ackWrap.appendChild(U.el('div', { class: 'cond__h', text: 'Renter acknowledgements' }));
    acks.forEach(function (a) {
      var on = c.acks ? !!c.acks[a.id] : false;
      ackWrap.appendChild(U.el('div', { class: 'ack__i' }, [
        U.el('span', { class: 'ack__box' + (on ? ' is-on' : '') }),
        U.el('span', { text: a.text })
      ]));
    });
    artTerms.appendChild(ackWrap);
    sheet.appendChild(artTerms);

    /* Signatures -------------------------------------------------------- */
    sheet.appendChild(article(A(), 'Execution', 'Signed by both parties', [
      U.el('div', { class: 'signs' }, [
        signatureBlock('Renter signature', c.renter && c.renter.name, c.signature, c.signedAt),
        signatureBlock('For ' + co.name, c.agent || co.agent, null, c.signedAt, 'typed')
      ])
    ]));

    sheet.appendChild(U.el('div', { class: 'sheet__foot' }, [
      U.el('span', { text: co.name }),
      U.el('span', { text: 'Agreement ' + (c.no || '—') }),
      U.el('span', { text: c.signedAt ? 'Executed ' + U.fmtDate(c.signedAt) : 'Unsigned' })
    ]));

    return sheet;
  };

  root.NRT.doc = D;
})(window);
