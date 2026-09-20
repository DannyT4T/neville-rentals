/* Neville Rentals & Transportation — dashboard, fleet, contract list and
   the check-in flow. */
(function (root) {
  'use strict';

  var U = root.NRT.util;
  var S = root.NRT.store;
  var UI = root.NRT.ui;
  var CV = root.NRT.canvas;
  var V = {};

  function head(eyebrow, title, actions) {
    var h = U.el('div', { class: 'page-head' }, [
      U.el('div', { class: 'page-head__text' }, [
        U.el('div', { class: 'eyebrow', text: eyebrow }),
        U.el('h1', { text: title })
      ])
    ]);
    if (actions && actions.length) {
      h.appendChild(U.el('div', { class: 'page-head__actions' }, actions));
    }
    return h;
  }

  function tile(label, value, meta, accent) {
    return U.el('div', { class: 'tile' + (accent ? ' tile--accent' : '') }, [
      U.el('div', { class: 'tile__label', text: label }),
      U.el('div', { class: 'tile__value', text: value }),
      meta ? U.el('div', { class: 'tile__meta', text: meta }) : null
    ]);
  }

  function vehicleLine(v) {
    if (!v) return 'Vehicle removed from fleet';
    return v.year + ' ' + v.make + ' ' + v.model;
  }

  /* ======================================================== revenue chart */

  /* Single series, so no legend — the card title names it. Two direct labels
     (the best month and the month in progress) rather than a number on every
     bar; the rest read off the axis or on hover. */
  function revenueChart(months) {
    var W = 640, H = 210;
    var padL = 52, padR = 14, padT = 16, padB = 46;
    var plotW = W - padL - padR, plotH = H - padT - padB;

    var max = Math.max.apply(null, months.map(function (m) { return m.value; }).concat([100]));
    var step = niceStep(max / 3);
    var top = Math.ceil(max / step) * step;

    var wrap = U.el('div', { class: 'chart-wrap' });
    var chart = U.el('div', { class: 'chart' });
    var tip = U.el('div', { class: 'chart__tip' });

    var bw = (plotW / months.length) * 0.56;
    var gap = plotW / months.length;
    var thisKey = U.today().slice(0, 7);
    var bestIdx = months.reduce(function (bi, m, i) { return m.value > months[bi].value ? i : bi; }, 0);

    var svg = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Revenue by month, last ' + months.length + ' months">'];

    // gridlines + value axis
    for (var g = 0; g <= 3; g++) {
      var val = (top / 3) * g;
      var y = padT + plotH - (val / top) * plotH;
      svg.push('<line class="grid-line" x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y.toFixed(1) + '"/>');
      svg.push('<text class="axis-text" x="' + (padL - 9) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' +
        U.money0(val).replace('$', '$') + '</text>');
    }

    months.forEach(function (m, i) {
      var h = top ? (m.value / top) * plotH : 0;
      var x = padL + gap * i + (gap - bw) / 2;
      var y = padT + plotH - h;
      var isCurrent = m.key === thisKey;
      // 4px rounded data-end anchored to the baseline
      var r = Math.min(4, h / 2);
      if (h > 0.5) {
        svg.push('<path class="bar' + (isCurrent ? ' bar--quiet' : '') + '" d="' +
          'M' + x.toFixed(1) + ' ' + (padT + plotH).toFixed(1) +
          ' V' + (y + r).toFixed(1) +
          ' a' + r + ' ' + r + ' 0 0 1 ' + r + ' -' + r +
          ' h' + (bw - 2 * r).toFixed(1) +
          ' a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + r +
          ' V' + (padT + plotH).toFixed(1) + ' Z"/>');
      }
      svg.push('<rect class="chart__hit" x="' + (padL + gap * i).toFixed(1) + '" y="' + padT +
        '" width="' + gap.toFixed(1) + '" height="' + plotH + '" data-i="' + i + '"/>');
      svg.push('<text class="axis-text" x="' + (x + bw / 2).toFixed(1) + '" y="' + (padT + plotH + 18) +
        '" text-anchor="middle">' + m.label + '</text>');
      if (isCurrent) {
        svg.push('<text class="axis-text" x="' + (x + bw / 2).toFixed(1) + '" y="' + (padT + plotH + 32) +
          '" text-anchor="middle">in progress</text>');
      }
      if (i === bestIdx || isCurrent) {
        svg.push('<text class="val-text" x="' + (x + bw / 2).toFixed(1) + '" y="' + (y - 7).toFixed(1) +
          '" text-anchor="middle">' + U.money0(m.value) + '</text>');
      }
    });

    // baseline
    svg.push('<line class="grid-line" x1="' + padL + '" y1="' + (padT + plotH) + '" x2="' + (W - padR) +
      '" y2="' + (padT + plotH) + '" stroke-width="1.5"/>');
    svg.push('</svg>');
    chart.innerHTML = svg.join('');

    wrap.appendChild(chart);
    wrap.appendChild(tip);

    var svgEl = chart.firstChild;
    svgEl.addEventListener('pointermove', function (e) {
      var hit = e.target.closest ? e.target.closest('.chart__hit') : null;
      if (!hit) { tip.classList.remove('is-on'); return; }
      var m = months[+hit.dataset.i];
      var rect = wrap.getBoundingClientRect();
      tip.innerHTML = '<b>' + U.money0(m.value) + '</b> &middot; ' + m.count +
        ' rental' + (m.count === 1 ? '' : 's') + '<br>' + m.label;
      tip.style.left = (e.clientX - rect.left) + 'px';
      tip.style.top = (e.clientY - rect.top) + 'px';
      tip.classList.add('is-on');
    });
    svgEl.addEventListener('pointerleave', function () { tip.classList.remove('is-on'); });

    return wrap;
  }

  function niceStep(raw) {
    var mag = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
    var n = raw / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
  }

  /* ============================================================ dashboard */

  V.dashboard = function (mount) {
    var st = S.stats();
    var co = S.company();

    mount.appendChild(head('Admin dashboard', 'Today at ' + co.name.split(' &')[0], [
      UI.button('New contract', { variant: 'primary', icon: 'filePlus', onClick: function () { location.hash = '#/new'; } })
    ]));

    mount.appendChild(U.el('div', { class: 'tiles' }, [
      tile('On rent now', String(st.activeCount), st.available + ' of ' + st.fleetSize + ' available', true),
      tile('Revenue this month', U.money0(st.monthRevenue), 'Booked to rental start date'),
      tile('Deposits held', U.money0(st.depositsHeld), 'Refundable less tolls'),
      tile('Fleet utilization', st.utilization + '%', st.maintenance ? st.maintenance + ' in service' : 'All vehicles roadworthy')
    ]));

    var cols = U.el('div', { class: 'stack' });

    /* revenue */
    var revCard = U.el('div', { class: 'card' });
    revCard.appendChild(U.el('div', { class: 'card__head' }, [
      U.el('h2', { text: 'Revenue by month' }),
      U.el('span', { class: 'muted', style: 'font-size:.78rem', text: 'Rental + insurance + fees' })
    ]));
    var revBody = U.el('div', { class: 'card__body' });
    revBody.appendChild(revenueChart(S.revenueByMonth(6)));
    revCard.appendChild(revBody);
    cols.appendChild(revCard);

    /* due back */
    var due = S.dueBack();
    var dueCard = U.el('div', { class: 'card' });
    dueCard.appendChild(U.el('div', { class: 'card__head' }, [
      U.el('h2', { text: 'Out on the road' }),
      UI.button('All contracts', { size: 'sm', variant: 'ghost', onClick: function () { location.hash = '#/contracts'; } })
    ]));
    if (!due.length) {
      dueCard.appendChild(U.el('div', { class: 'empty' }, [
        U.el('h3', { text: 'Every vehicle is on the lot' }),
        U.el('p', { text: 'Start a contract and it will show up here until the vehicle comes back.' })
      ]));
    } else {
      var rows = U.el('div', { class: 'rows' });
      due.forEach(function (d) {
        var late = d.daysLeft < 0;
        var soon = d.daysLeft >= 0 && d.daysLeft <= 1;
        var pill = late
          ? U.el('span', { class: 'pill pill--crit', text: Math.abs(d.daysLeft) + ' day' + (Math.abs(d.daysLeft) === 1 ? '' : 's') + ' overdue' })
          : soon
            ? U.el('span', { class: 'pill pill--warn', text: d.daysLeft === 0 ? 'Due today' : 'Due tomorrow' })
            : U.el('span', { class: 'pill pill--ok', text: d.daysLeft + ' days left' });
        var row = U.el('button', { class: 'row', type: 'button' }, [
          U.el('div', { class: 'row__main' }, [
            U.el('div', { class: 'row__title', text: d.contract.renter.name }),
            U.el('div', { class: 'row__sub', text: vehicleLine(d.vehicle) + '  ·  ' + (d.vehicle ? d.vehicle.plate : '') +
              '  ·  back ' + U.fmtDate(d.contract.endDate, 'short') })
          ]),
          U.el('div', { class: 'row__end' }, [pill,
            U.el('div', { class: 'row__amt', text: U.money0(d.contract.totals.revenue) })])
        ]);
        row.addEventListener('click', function () { location.hash = '#/contract/' + d.contract.id; });
        rows.appendChild(row);
      });
      dueCard.appendChild(rows);
    }
    cols.appendChild(dueCard);

    /* fleet status */
    var fleetCard = U.el('div', { class: 'card' });
    fleetCard.appendChild(U.el('div', { class: 'card__head' }, [
      U.el('h2', { text: 'Fleet status' }),
      UI.button('Manage fleet', { size: 'sm', variant: 'ghost', onClick: function () { location.hash = '#/fleet'; } })
    ]));
    var fb = U.el('div', { class: 'card__body' });
    var meter = U.el('div', { class: 'meter' });
    [['ok', st.available], ['rented', st.rented], ['maint', st.maintenance]].forEach(function (p) {
      if (!p[1]) return;
      var seg = U.el('div', { class: 'meter__seg meter__seg--' + p[0] });
      seg.style.flex = p[1];
      meter.appendChild(seg);
    });
    fb.appendChild(meter);
    var key = U.el('div', { class: 'meter-key' });
    [['ok', 'Available', st.available, 'var(--ok)'],
     ['rented', 'On rent', st.rented, 'var(--accent)'],
     ['maint', 'In service', st.maintenance, 'var(--warn)']].forEach(function (k) {
      var dot = U.el('span', { class: 'meter-key__dot' });
      dot.style.background = k[3];
      key.appendChild(U.el('div', { class: 'meter-key__item' }, [
        dot, U.el('span', { text: k[1] + ' — ' + k[2] })
      ]));
    });
    fb.appendChild(key);
    fleetCard.appendChild(fb);
    cols.appendChild(fleetCard);

    /* recent history */
    var recent = S.contracts().filter(function (c) { return c.status === 'completed'; })
      .sort(function (a, b) { return (b.closedAt || b.endDate).localeCompare(a.closedAt || a.endDate); })
      .slice(0, 5);
    if (recent.length) {
      var histCard = U.el('div', { class: 'card' });
      histCard.appendChild(U.el('div', { class: 'card__head' }, [U.el('h2', { text: 'Recently closed' })]));
      var hr = U.el('div', { class: 'rows' });
      recent.forEach(function (c) {
        var v = S.vehicle(c.vehicleId);
        var b = U.el('button', { class: 'row', type: 'button' }, [
          U.el('div', { class: 'row__main' }, [
            U.el('div', { class: 'row__title', text: c.renter.name }),
            U.el('div', { class: 'row__sub', text: c.no + '  ·  ' + vehicleLine(v) + '  ·  closed ' + U.fmtDate(c.closedAt || c.endDate, 'short') })
          ]),
          U.el('div', { class: 'row__end' }, [
            U.el('div', { class: 'row__amt', text: U.money0(c.totals.revenue) }),
            c.totals.tolls ? U.el('span', { class: 'pill pill--mute pill--plain', text: U.money(c.totals.tolls) + ' tolls' }) : null
          ])
        ]);
        b.addEventListener('click', function () { location.hash = '#/contract/' + c.id; });
        hr.appendChild(b);
      });
      histCard.appendChild(hr);
      cols.appendChild(histCard);
    }

    mount.appendChild(cols);
  };

  /* ================================================================ fleet */

  V.fleet = function (mount) {
    mount.appendChild(head('Fleet', 'Vehicles', [
      UI.button('Add vehicle', { variant: 'primary', icon: 'plus', onClick: function () { V.vehicleForm(null); } })
    ]));

    var vs = S.vehicles();
    if (!vs.length) {
      mount.appendChild(U.el('div', { class: 'card' }, [U.el('div', { class: 'empty' }, [
        U.el('h3', { text: 'No vehicles yet' }),
        U.el('p', { text: 'Add a vehicle once and it becomes a reusable profile — pick it on any future contract instead of retyping the VIN.' })
      ])]));
      return;
    }

    var grid = U.el('div', { class: 'fleet' });
    vs.forEach(function (v) { grid.appendChild(vehicleCard(v)); });
    mount.appendChild(grid);
  };

  function vehicleCard(v) {
    var card = U.el('div', { class: 'veh' });
    var glyph = U.el('div', { class: 'veh__glyph' });
    glyph.appendChild(UI.vehicleIcon(v.klass));

    var top = U.el('div', { class: 'veh__top' }, [
      glyph,
      U.el('div', { class: 'veh__id' }, [
        U.el('div', { class: 'veh__name', text: v.year + ' ' + v.make + ' ' + v.model }),
        U.el('div', { class: 'veh__desc', text: [v.trim, v.color, v.seats ? v.seats + ' seats' : null].filter(Boolean).join(' · ') })
      ]),
      UI.statusPill(v.status)
    ]);
    card.appendChild(top);

    var specs = U.el('div', { class: 'veh__specs' }, [
      U.el('dl', { class: 'veh__spec' }, [U.el('dt', { text: 'VIN' }), U.el('dd', { text: v.vin || '—' })]),
      U.el('dl', { class: 'veh__spec' }, [U.el('dt', { text: 'Plate' }), U.el('dd', { text: (v.plate || '—') + (v.state ? ' ' + v.state : '') })]),
      U.el('dl', { class: 'veh__spec' }, [U.el('dt', { text: 'Odometer' }), U.el('dd', { text: v.odometer ? Number(v.odometer).toLocaleString('en-US') + ' mi' : '—' })]),
      U.el('dl', { class: 'veh__spec' }, [U.el('dt', { text: 'Class' }), U.el('dd', { text: ({ standard: 'Standard', suv: 'SUV', luxury: 'Luxury', van: 'Van' })[v.klass] || '—' })])
    ]);
    card.appendChild(specs);

    card.appendChild(U.el('div', { class: 'veh__rates' }, [
      U.el('div', { class: 'veh__rate' }, [U.el('b', { text: U.money0(v.dailyRate) }), U.el('span', { text: 'per day' })]),
      U.el('div', { class: 'veh__rate' }, [U.el('b', { text: U.money0(v.weeklyRate) }), U.el('span', { text: 'per week' })])
    ]));

    if (v.notes) {
      card.appendChild(U.el('div', { style: 'padding:0 16px 10px', class: 'muted' },
        [U.el('div', { style: 'font-size:.78rem', text: v.notes })]));
    }

    var foot = U.el('div', { class: 'veh__foot' }, [
      UI.button('Edit', { size: 'sm', icon: 'pencil', onClick: function () { V.vehicleForm(v); } })
    ]);
    if (v.status === 'available') {
      foot.appendChild(UI.button('Rent it', {
        size: 'sm', variant: 'primary',
        onClick: function () { location.hash = '#/new?vehicle=' + v.id; }
      }));
    }
    foot.appendChild(UI.button('', {
      size: 'sm', variant: 'danger', icon: 'trash',
      onClick: function () {
        UI.confirm({
          title: 'Remove ' + v.make + ' ' + v.model + '?',
          message: 'This takes the vehicle out of the fleet. Contracts that used it keep their record.',
          confirmLabel: 'Remove vehicle', danger: true
        }).then(function (ok) {
          if (!ok) return;
          if (S.deleteVehicle(v.id)) { U.toast('Vehicle removed.'); root.NRT.app.render(); }
          else U.toast('That vehicle is on an active rental — close the contract first.', 'bad');
        });
      }
    })).lastChild.setAttribute('aria-label', 'Remove vehicle');
    card.appendChild(foot);
    return card;
  }

  V.vehicleForm = function (v) {
    var isNew = !v;
    v = v || { klass: 'standard', state: 'FL', status: 'available', seats: 5, dailyRate: 75, weeklyRate: 400 };
    var body = U.el('div', { class: 'stack' });

    var f = {};
    f.year = UI.input('v_year', { type: 'number', min: 1980, max: 2100, value: v.year || new Date().getFullYear() });
    f.make = UI.input('v_make', { value: v.make || '', placeholder: 'BMW' });
    f.model = UI.input('v_model', { value: v.model || '', placeholder: '330i xDrive' });
    f.trim = UI.input('v_trim', { value: v.trim || '', placeholder: 'Sedan' });
    f.color = UI.input('v_color', { value: v.color || '', placeholder: 'Alpine White' });
    f.vin = UI.input('v_vin', { value: v.vin || '', placeholder: 'WBA5R7C51MFH12384', maxlength: 17, class: 'input--mono' });
    f.plate = UI.input('v_plate', { value: v.plate || '', placeholder: 'NRT-4471', class: 'input--mono' });
    f.state = UI.input('v_state', { value: v.state || 'FL', maxlength: 2, class: 'input--mono' });
    f.seats = UI.input('v_seats', { type: 'number', min: 1, max: 20, value: v.seats || 5 });
    f.odometer = UI.input('v_odo', { type: 'number', min: 0, value: v.odometer || 0 });
    f.daily = UI.input('v_daily', { type: 'number', min: 0, step: 5, value: v.dailyRate || 75 });
    f.weekly = UI.input('v_weekly', { type: 'number', min: 0, step: 10, value: v.weeklyRate || 400 });
    f.klass = UI.select('v_class', [
      { value: 'standard', label: 'Standard — sedan / compact' },
      { value: 'suv', label: 'SUV — higher tier' },
      { value: 'luxury', label: 'Luxury' },
      { value: 'van', label: 'Van / minivan' }
    ], v.klass || 'standard');
    f.status = UI.select('v_status', [
      { value: 'available', label: 'Available' },
      { value: 'maintenance', label: 'In service / off the road' }
    ], v.status === 'maintenance' ? 'maintenance' : 'available');
    f.notes = U.el('textarea', { id: 'v_notes', placeholder: 'Anything the counter should know.' });
    f.notes.value = v.notes || '';

    var vinField = UI.field('VIN', f.vin, { hint: '17 characters. Printed on the contract.' });

    body.appendChild(U.el('div', { class: 'grid grid--3' }, [
      UI.field('Year', f.year), UI.field('Make', f.make), UI.field('Model', f.model)
    ]));
    body.appendChild(U.el('div', { class: 'grid grid--3' }, [
      UI.field('Body / trim', f.trim), UI.field('Color', f.color), UI.field('Seats', f.seats)
    ]));
    body.appendChild(vinField);
    body.appendChild(U.el('div', { class: 'grid grid--3' }, [
      UI.field('Plate', f.plate), UI.field('State', f.state), UI.field('Odometer (mi)', f.odometer)
    ]));
    body.appendChild(U.el('div', { class: 'grid grid--2' }, [
      UI.field('Class', f.klass, { hint: 'Drives the default rate tier on new contracts.' }),
      UI.field('Availability', f.status)
    ]));
    body.appendChild(U.el('div', { class: 'grid grid--2' }, [
      UI.field('Daily rate', f.daily, { hint: 'Adjustable per contract.' }),
      UI.field('Weekly rate', f.weekly, { hint: 'Used automatically past 7 days.' })
    ]));
    body.appendChild(UI.field('Notes', f.notes));

    UI.modal({
      title: isNew ? 'Add a vehicle' : 'Edit ' + v.make + ' ' + v.model,
      body: body,
      actions: [
        { label: 'Cancel' },
        {
          label: isNew ? 'Add to fleet' : 'Save changes', variant: 'primary',
          onClick: function () {
            if (!f.make.value.trim() || !f.model.value.trim()) {
              U.toast('Make and model are required.', 'bad');
              return false;
            }
            var vin = f.vin.value.trim().toUpperCase();
            if (vin && vin.length !== 17) {
              U.toast('A VIN is 17 characters — check that one.', 'bad');
              return false;
            }
            S.saveVehicle({
              id: v.id,
              year: U.num(f.year.value, new Date().getFullYear()),
              make: f.make.value.trim(), model: f.model.value.trim(),
              trim: f.trim.value.trim(), color: f.color.value.trim(),
              vin: vin, plate: f.plate.value.trim().toUpperCase(),
              state: f.state.value.trim().toUpperCase(), seats: U.num(f.seats.value, 5),
              odometer: U.num(f.odometer.value), klass: f.klass.value,
              status: f.status.value, notes: f.notes.value.trim(),
              dailyRate: U.num(f.daily.value, 75), weeklyRate: U.num(f.weekly.value, 400)
            });
            U.toast(isNew ? 'Vehicle added to the fleet.' : 'Vehicle updated.', 'good');
            root.NRT.app.render();
          }
        }
      ]
    });
  };

  /* ==================================================== contracts listing */

  V.contracts = function (mount, query) {
    mount.appendChild(head('Records', 'Contracts', [
      UI.button('New contract', { variant: 'primary', icon: 'filePlus', onClick: function () { location.hash = '#/new'; } })
    ]));

    var filter = (query && query.status) || 'all';
    var term = '';

    var search = UI.input('c_search', { type: 'text', placeholder: 'Search name, contract number or plate' });
    var seg = UI.seg([
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Closed' }
    ], filter, function (v) { filter = v; paint(); });

    mount.appendChild(U.el('div', { class: 'filters' }, [search, seg]));
    search.addEventListener('input', function () { term = search.value.trim().toLowerCase(); paint(); });

    var card = U.el('div', { class: 'card' });
    mount.appendChild(card);

    function paint() {
      card.innerHTML = '';
      var list = S.contracts().filter(function (c) {
        if (filter !== 'all' && c.status !== filter) return false;
        if (!term) return true;
        var v = S.vehicle(c.vehicleId) || {};
        return (c.renter.name + ' ' + c.no + ' ' + (v.plate || '') + ' ' + (v.make || '') + ' ' + (v.model || ''))
          .toLowerCase().indexOf(term) > -1;
      }).sort(function (a, b) { return String(b.startDate).localeCompare(String(a.startDate)); });

      if (!list.length) {
        card.appendChild(U.el('div', { class: 'empty' }, [
          U.el('h3', { text: 'Nothing matches' }),
          U.el('p', { text: term ? 'Try a different name, number or plate.' : 'Contracts appear here once they are signed.' })
        ]));
        return;
      }

      var rows = U.el('div', { class: 'rows' });
      list.forEach(function (c) {
        var v = S.vehicle(c.vehicleId);
        var end = U.el('div', { class: 'row__end' }, [
          UI.statusPill(c.status),
          U.el('div', { class: 'row__amt', text: U.money0(c.totals.revenue) })
        ]);
        var b = U.el('button', { class: 'row', type: 'button' }, [
          U.el('div', { class: 'row__main' }, [
            U.el('div', { class: 'row__title', text: c.renter.name }),
            U.el('div', { class: 'row__sub', text: c.no + '  ·  ' + vehicleLine(v) + '  ·  ' +
              U.fmtDate(c.startDate, 'short') + ' – ' + U.fmtDate(c.endDate, 'short') })
          ]),
          end
        ]);
        b.addEventListener('click', function () { location.hash = '#/contract/' + c.id; });
        rows.appendChild(b);
      });
      card.appendChild(rows);
    }
    paint();
  };

  /* =============================================== single contract + tools */

  V.contract = function (mount, id) {
    var c = S.contract(id);
    if (!c) {
      mount.appendChild(U.el('div', { class: 'card' }, [U.el('div', { class: 'empty' }, [
        U.el('h3', { text: 'That contract is gone' }),
        U.el('p', { text: 'It may have been deleted on this device.' })
      ])]));
      return;
    }

    var shell = U.el('div', { class: 'doc-shell' });
    var bar = U.el('div', { class: 'doc-toolbar no-print' });

    bar.appendChild(UI.button('Back', {
      variant: 'ghost', size: 'sm', icon: 'back',
      onClick: function () { location.hash = '#/contracts'; }
    }));
    bar.appendChild(U.el('span', { class: 'doc-toolbar__id', text: c.no }));
    bar.appendChild(UI.statusPill(c.status));
    bar.appendChild(U.el('span', { class: 'doc-toolbar__spacer' }));

    bar.appendChild(UI.button('Send', {
      variant: 'primary', size: 'sm', icon: 'upload',
      onClick: function () { root.NRT.share.open(c); }
    }));
    bar.appendChild(UI.button('Print', {
      size: 'sm', icon: 'printer', onClick: function () { window.print(); }
    }));
    if (c.status === 'active') {
      bar.appendChild(UI.button('Check in', {
        size: 'sm', icon: 'key', onClick: function () { V.checkIn(c); }
      }));
    }
    bar.appendChild(UI.button('', {
      size: 'sm', variant: 'danger', icon: 'trash',
      onClick: function () {
        UI.confirm({
          title: 'Delete ' + c.no + '?',
          message: 'The contract and its record are removed from this device. This cannot be undone.',
          confirmLabel: 'Delete contract', danger: true
        }).then(function (ok) {
          if (!ok) return;
          S.deleteContract(c.id);
          U.toast('Contract deleted.');
          location.hash = '#/contracts';
        });
      }
    })).lastChild.setAttribute('aria-label', 'Delete contract');

    shell.appendChild(bar);

    if (c.sentLog && c.sentLog.length) {
      var last = c.sentLog[c.sentLog.length - 1];
      shell.appendChild(UI.note('info', null,
        'Last sent by ' + last.how + ' to ' + last.target + ' on ' +
        new Date(last.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + '.',
        'info'));
      shell.lastChild.classList.add('no-print');
    }

    shell.appendChild(root.NRT.doc.render(c));
    mount.appendChild(shell);
  };

  /* ------------------------------------------------------------- check-in */

  V.checkIn = function (c) {
    var veh = S.vehicle(c.vehicleId) || {};
    var body = U.el('div', { class: 'stack' });
    var state = {
      fuel: c.pickup ? c.pickup.fuel : 1,
      odometer: veh.odometer || (c.pickup ? c.pickup.odometer : 0),
      damage: (c.pickup && c.pickup.damage ? c.pickup.damage.slice() : []),
      tolls: (c.tolls || []).slice(),
      fees: (c.fees || []).slice()
    };

    body.appendChild(UI.note('info', 'Closing out ' + c.no,
      'Record the vehicle as it came back, enter any tolls, and the deposit settles automatically.', 'info'));

    /* fuel + odometer */
    var gauge = CV.fuelGauge({ value: state.fuel, onChange: function (v) { state.fuel = v; recalc(); } });
    var odo = UI.input('ci_odo', { type: 'number', min: 0, value: state.odometer, class: 'input--mono' });
    odo.addEventListener('input', function () { state.odometer = U.num(odo.value); });

    var fuelOutNote = U.el('div', { class: 'hint',
      text: 'Released at ' + U.fuelLabel(c.pickup ? c.pickup.fuel : 1) + '. Returning below that adds a refuel charge.' });

    body.appendChild(U.el('div', { class: 'grid grid--2' }, [
      U.el('div', { class: 'field' }, [U.el('span', { class: 'label', text: 'Fuel on return' }), gauge, fuelOutNote]),
      UI.field('Odometer on return (mi)', odo, { hint: 'Out at ' + (c.pickup && c.pickup.odometer ? Number(c.pickup.odometer).toLocaleString('en-US') : '—') + ' mi.' })
    ]));

    /* damage */
    var dmgWrap = U.el('div', { class: 'dmg' });
    var tools = U.el('div', { class: 'dmg__tools' });
    var canvas = U.el('canvas', { class: 'dmg__canvas' });
    var count = U.el('span', { class: 'dmg__count' });
    var pad = null;

    [['pen', 'Draw', 'pen'], ['circle', 'Circle', 'circle'], ['x', 'Mark X', 'x'], ['note', 'Note', 'note']].forEach(function (t, i) {
      var b = U.el('button', { type: 'button', class: 'dmg__tool' + (i === 0 ? ' is-on' : '') });
      b.appendChild(UI.icon(t[2]));
      b.appendChild(document.createTextNode(t[1]));
      b.addEventListener('click', function () {
        U.$$('.dmg__tool', tools).forEach(function (x) { x.classList.remove('is-on'); });
        b.classList.add('is-on');
        pad.setTool(t[0]);
      });
      tools.appendChild(b);
    });
    var undo = U.el('button', { type: 'button', class: 'dmg__tool dmg__spacer' });
    undo.appendChild(UI.icon('undo')); undo.appendChild(document.createTextNode('Undo'));
    undo.addEventListener('click', function () { pad.undo(); });
    tools.appendChild(undo);

    dmgWrap.appendChild(U.el('span', { class: 'label', text: 'Condition on return — mark any new damage' }));
    dmgWrap.appendChild(tools);
    dmgWrap.appendChild(canvas);
    dmgWrap.appendChild(count);
    body.appendChild(dmgWrap);

    /* tolls */
    var tollLines = U.el('div', { class: 'lines' });
    function tollRow(item) {
      var label = UI.input('', { value: item.label || '', placeholder: 'E-ZPass, Verrazzano' });
      var amt = UI.input('', { type: 'number', step: '0.01', min: 0, value: item.amount || '', placeholder: '0.00' });
      var row = U.el('div', { class: 'line-item' }, [label, amt]);
      var del = UI.button('', { size: 'sm', variant: 'ghost', icon: 'x', onClick: function () {
        state.tolls = state.tolls.filter(function (x) { return x !== item; });
        row.remove(); recalc();
      } });
      del.setAttribute('aria-label', 'Remove toll');
      row.appendChild(del);
      label.addEventListener('input', function () { item.label = label.value; });
      amt.addEventListener('input', function () { item.amount = U.num(amt.value); recalc(); });
      tollLines.appendChild(row);
    }
    state.tolls.forEach(tollRow);

    var addToll = UI.button('Add toll', { size: 'sm', icon: 'plus', onClick: function () {
      var item = { label: '', amount: 0, date: U.today() };
      state.tolls.push(item); tollRow(item); recalc();
    } });
    body.appendChild(U.el('div', { class: 'field' }, [
      U.el('span', { class: 'label', text: 'Tolls incurred during the rental' }),
      tollLines, U.el('div', {}, [addToll]),
      U.el('div', { class: 'hint', text: 'Each one is itemized on the contract and deducted from the deposit.' })
    ]));

    /* other charges */
    var feeLines = U.el('div', { class: 'lines' });
    function feeRow(item) {
      var label = UI.input('', { value: item.label || '', placeholder: 'Cleaning, late return, refuel' });
      var amt = UI.input('', { type: 'number', step: '0.01', min: 0, value: item.amount || '', placeholder: '0.00' });
      var row = U.el('div', { class: 'line-item' }, [label, amt]);
      var del = UI.button('', { size: 'sm', variant: 'ghost', icon: 'x', onClick: function () {
        state.fees = state.fees.filter(function (x) { return x !== item; });
        row.remove(); recalc();
      } });
      del.setAttribute('aria-label', 'Remove charge');
      row.appendChild(del);
      label.addEventListener('input', function () { item.label = label.value; });
      amt.addEventListener('input', function () { item.amount = U.num(amt.value); recalc(); });
      feeLines.appendChild(row);
    }
    state.fees.forEach(feeRow);
    var addFee = UI.button('Add charge', { size: 'sm', icon: 'plus', onClick: function () {
      var item = { label: '', amount: 0 };
      state.fees.push(item); feeRow(item); recalc();
    } });
    body.appendChild(U.el('div', { class: 'field' }, [
      U.el('span', { class: 'label', text: 'Other charges' }),
      feeLines, U.el('div', {}, [addFee])
    ]));

    /* settlement */
    var ledger = U.el('div', { class: 'ledger' });
    body.appendChild(U.el('div', { class: 'card' }, [
      U.el('div', { class: 'card__head' }, [U.el('h2', { text: 'Deposit settlement' })]),
      U.el('div', { class: 'card__body' }, [ledger])
    ]));

    function recalc() {
      var probe = Object.assign({}, c, { tolls: state.tolls, fees: state.fees });
      var t = S.totals(probe);
      ledger.innerHTML = '';
      function row(label, amt, cls, sub) {
        var l = U.el('div', { class: 'ledger__label', text: label });
        if (sub) l.appendChild(U.el('small', { text: sub }));
        ledger.appendChild(U.el('div', { class: 'ledger__row' + (cls ? ' ledger__row--' + cls : '') }, [
          l, U.el('div', { class: 'ledger__amt', text: amt })
        ]));
      }
      row('Security deposit held', U.money(t.deposit));
      row('Tolls', '− ' + U.money(t.tolls), t.tolls ? 'debit' : null,
        state.tolls.length ? state.tolls.length + ' item' + (state.tolls.length === 1 ? '' : 's') : 'none recorded');
      row('Other charges', '− ' + U.money(t.fees), t.fees ? 'debit' : null);
      row(t.balanceOwed > 0 ? 'Balance due from renter' : 'Returned to renter',
        U.money(t.balanceOwed > 0 ? t.balanceOwed : t.depositRefund),
        'total');
      if (t.balanceOwed > 0) {
        ledger.appendChild(U.el('div', { class: 'hint', style: 'margin-top:8px; color:var(--crit)',
          text: 'Deductions exceed the deposit. Collect the difference before releasing the renter.' }));
      }
    }
    recalc();

    UI.modal({
      title: 'Check in — ' + (veh.make || '') + ' ' + (veh.model || ''),
      body: body,
      actions: [
        { label: 'Not yet' },
        {
          label: 'Close rental', variant: 'primary',
          onClick: function () {
            c.dropoff = {
              fuel: state.fuel, odometer: state.odometer,
              damage: pad ? pad.getMarks() : state.damage, date: U.today()
            };
            c.tolls = state.tolls.filter(function (x) { return U.num(x.amount) > 0 || (x.label || '').trim(); });
            c.fees = state.fees.filter(function (x) { return U.num(x.amount) > 0 || (x.label || '').trim(); });
            c.status = 'completed';
            c.closedAt = U.today();
            if (veh.id && state.odometer) S.saveVehicle({ id: veh.id, odometer: state.odometer });
            S.saveContract(c);
            U.toast('Rental closed. ' + U.money(c.totals.depositRefund) + ' back to the renter.', 'good');
            root.NRT.app.render();
          }
        }
      ]
    });

    requestAnimationFrame(function () {
      pad = new CV.DamagePad(canvas, state.damage, function (marks) {
        state.damage = marks;
        count.textContent = marks.length ? marks.length + ' mark' + (marks.length === 1 ? '' : 's') + ' recorded' : 'Pickup marks shown. Add anything new.';
      });
      count.textContent = state.damage.length + ' mark' + (state.damage.length === 1 ? '' : 's') + ' carried over from pickup';
    });
  };

  root.NRT.views = V;
})(window);
