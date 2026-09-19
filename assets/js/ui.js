/* Leville Rentals & Transportation — icons, modals, small shared widgets. */
(function (root) {
  'use strict';

  var U = root.LRT.util;
  var UI = {};

  /* ------------------------------------------------------------- icon set */

  var PATHS = {
    dashboard: '<path d="M12 14l3.5-3.5"/><path d="M3.4 19a10 10 0 1 1 17.2 0"/>',
    car: '<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
    filePlus: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M12 11v6M9 14h6"/>',
    files: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h4"/>',
    settings: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
    trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    circle: '<circle cx="12" cy="12" r="8.5"/>',
    undo: '<path d="M3 7v6h6"/><path d="M3.5 13a9 9 0 1 0 2.6-6.4L3 9.5"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    search: '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    fuel: '<path d="M3 22h12V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v18z"/><path d="M15 9h3a2 2 0 0 1 2 2v6a2 2 0 0 0 2 2 2 2 0 0 0 2-2V8l-4-4"/><path d="M6 7h6"/>',
    note: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    receipt: '<path d="M4 2v20l2.5-1.5L9 22l2.5-1.5L14 22l2.5-1.5L19 22V2l-2.5 1.5L14 2l-2.5 1.5L9 2 6.5 3.5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    key: '<circle cx="7.5" cy="15.5" r="4"/><path d="m10.5 12.5 8-8 3 3-2 2-2-2-2 2 2 2-3 3"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5l-9.3 9.3a2.8 2.8 0 0 1-4-4z"/>',
    truck: '<path d="M2 17V7a1 1 0 0 1 1-1h11v11"/><path d="M14 9h4l3 3.5V17h-2"/><circle cx="7" cy="17.5" r="2.2"/><circle cx="17" cy="17.5" r="2.2"/>'
  };

  UI.icon = function (name, cls) {
    var span = document.createElement('span');
    span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '>' +
      (PATHS[name] || '') + '</svg>';
    return span.firstChild;
  };
  UI.iconHTML = function (name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (PATHS[name] || '') + '</svg>';
  };

  /* A class-appropriate glyph so a Tahoe doesn't wear a sedan icon. */
  UI.vehicleIcon = function (klass) {
    if (klass === 'suv') return UI.icon('truck');
    if (klass === 'van') return UI.icon('truck');
    return UI.icon('car');
  };

  UI.button = function (label, opts) {
    opts = opts || {};
    var b = U.el('button', {
      type: 'button',
      class: 'btn' + (opts.variant ? ' btn--' + opts.variant : '') + (opts.size ? ' btn--' + opts.size : '') +
             (opts.block ? ' btn--block' : '') + (opts.class ? ' ' + opts.class : ''),
      onclick: opts.onClick || function () {}
    });
    if (opts.icon) b.appendChild(UI.icon(opts.icon));
    if (label) b.appendChild(document.createTextNode(label));
    if (opts.disabled) b.disabled = true;
    return b;
  };

  /* -------------------------------------------------------------- modals */

  var openModals = [];

  UI.modal = function (opts) {
    var overlay = U.el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.title || 'Dialog' });
    var panel = U.el('div', { class: 'modal__panel' });
    var head = U.el('div', { class: 'modal__head' }, [U.el('h2', { text: opts.title || '' })]);
    var closeBtn = UI.button('', { variant: 'ghost', size: 'sm', icon: 'x', onClick: close });
    closeBtn.setAttribute('aria-label', 'Close');
    head.appendChild(closeBtn);

    var body = U.el('div', { class: 'modal__body' });
    if (typeof opts.body === 'string') body.innerHTML = opts.body;
    else if (opts.body) body.appendChild(opts.body);

    panel.appendChild(head);
    panel.appendChild(body);

    if (opts.actions && opts.actions.length) {
      var foot = U.el('div', { class: 'modal__foot' });
      opts.actions.forEach(function (a) {
        foot.appendChild(UI.button(a.label, {
          variant: a.variant,
          onClick: function () { if (!a.onClick || a.onClick(body) !== false) close(); }
        }));
      });
      panel.appendChild(foot);
    }

    overlay.appendChild(panel);
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    openModals.push(close);

    var focusable = panel.querySelector('input, select, textarea, button.btn--primary');
    if (focusable) setTimeout(function () { focusable.focus(); }, 40);

    function close() {
      if (!overlay.parentNode) return;
      overlay.parentNode.removeChild(overlay);
      openModals = openModals.filter(function (f) { return f !== close; });
      if (!openModals.length) document.body.style.overflow = '';
      if (opts.onClose) opts.onClose();
    }
    return { close: close, body: body, panel: panel };
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openModals.length) openModals[openModals.length - 1]();
  });

  UI.confirm = function (opts) {
    return new Promise(function (resolve) {
      var body = U.el('div', {}, [U.el('p', { text: opts.message, class: 'dim' })]);
      var answered = false;
      UI.modal({
        title: opts.title || 'Are you sure?',
        body: body,
        actions: [
          { label: opts.cancelLabel || 'Cancel', onClick: function () { answered = true; resolve(false); } },
          { label: opts.confirmLabel || 'Confirm', variant: opts.danger ? 'danger' : 'primary',
            onClick: function () { answered = true; resolve(true); } }
        ],
        onClose: function () { if (!answered) resolve(false); }
      });
    });
  };

  /* ------------------------------------------------------- small widgets */

  UI.statusPill = function (status) {
    var map = {
      available:  ['ok', 'Available'],
      rented:     ['info', 'On rent'],
      maintenance:['warn', 'In service'],
      active:     ['info', 'Active'],
      completed:  ['mute', 'Closed'],
      draft:      ['mute', 'Draft'],
      cancelled:  ['crit', 'Cancelled']
    };
    var m = map[status] || ['mute', status];
    return U.el('span', { class: 'pill pill--' + m[0], text: m[1] });
  };

  UI.note = function (tone, title, text, iconName) {
    var box = U.el('div', { class: 'note note--' + tone });
    box.appendChild(UI.icon(iconName || (tone === 'info' ? 'info' : 'alert')));
    var body = U.el('div');
    if (title) body.appendChild(U.el('strong', { text: title }));
    body.appendChild(document.createTextNode(text));
    box.appendChild(body);
    return box;
  };

  UI.field = function (labelText, control, opts) {
    opts = opts || {};
    var f = U.el('div', { class: 'field' + (opts.class ? ' ' + opts.class : '') });
    var lab = U.el('label', { text: labelText });
    if (control.id) lab.setAttribute('for', control.id);
    f.appendChild(lab);
    f.appendChild(control);
    if (opts.hint) f.appendChild(U.el('div', { class: 'hint', text: opts.hint }));
    f.errorSlot = U.el('div', { class: 'err', hidden: true });
    f.appendChild(f.errorSlot);
    f.setError = function (msg) {
      f.errorSlot.hidden = !msg;
      f.errorSlot.textContent = msg || '';
      control.classList.toggle('is-bad', !!msg);
    };
    return f;
  };

  UI.input = function (id, attrs) {
    return U.el('input', Object.assign({ id: id, type: 'text' }, attrs || {}));
  };

  UI.select = function (id, options, value) {
    var s = U.el('select', { id: id });
    options.forEach(function (o) {
      s.appendChild(U.el('option', { value: o.value, text: o.label, selected: o.value === value }));
    });
    s.value = value;
    return s;
  };

  UI.seg = function (options, value, onChange) {
    var wrap = U.el('div', { class: 'seg', role: 'tablist' });
    options.forEach(function (o) {
      var b = U.el('button', {
        type: 'button', class: 'seg__opt' + (o.value === value ? ' is-on' : ''),
        text: o.label, role: 'tab', 'aria-selected': o.value === value ? 'true' : 'false'
      });
      b.addEventListener('click', function () {
        U.$$('.seg__opt', wrap).forEach(function (x) { x.classList.remove('is-on'); x.setAttribute('aria-selected', 'false'); });
        b.classList.add('is-on'); b.setAttribute('aria-selected', 'true');
        onChange(o.value);
      });
      wrap.appendChild(b);
    });
    wrap.setValue = function (v) {
      U.$$('.seg__opt', wrap).forEach(function (x, i) {
        var on = options[i].value === v;
        x.classList.toggle('is-on', on);
        x.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    };
    return wrap;
  };

  /* Rate control: slider on the increment grid, ± buttons that move by one
     increment, and a typed field for the odd number a slider can't reach. */
  UI.rateControl = function (opts) {
    var value = opts.value;
    var step = opts.step, min = opts.min, max = opts.max;

    var wrap = U.el('div', { class: 'rate' });
    var valEl = U.el('div', { class: 'rate__val' });
    var unitEl = U.el('span', { class: 'rate__unit', text: opts.unit || '' });

    var top = U.el('div', { class: 'rate__top' }, [
      U.el('span', { class: 'rate__name', text: opts.label }),
      valEl
    ]);
    valEl.appendChild(unitEl);

    var minus = U.el('button', { type: 'button', class: 'rate__btn', text: '−', 'aria-label': 'Decrease ' + opts.label + ' by $' + step });
    var plus = U.el('button', { type: 'button', class: 'rate__btn', text: '+', 'aria-label': 'Increase ' + opts.label + ' by $' + step });
    var slider = U.el('input', {
      type: 'range', class: 'rate__slider', id: opts.id,
      min: min, max: max, step: step, value: Math.round(value / step) * step,
      'aria-label': opts.label
    });

    var stepper = U.el('div', { class: 'rate__stepper' }, [minus, slider, plus]);
    var scale = U.el('div', { class: 'rate__scale' }, [
      U.el('span', { text: U.money0(min) }),
      U.el('span', { class: 'muted', text: '$' + step + ' steps' }),
      U.el('span', { text: U.money0(max) })
    ]);

    var exact = U.el('input', { type: 'number', min: 0, step: '0.01', value: value, 'aria-label': opts.label + ', exact amount' });
    exact.style.width = '120px';
    var exactRow = U.el('div', { class: 'inline', style: 'margin-top:10px' }, [
      U.el('span', { class: 'label', text: 'Or set exactly' }), exact
    ]);

    function paint(fromExact) {
      valEl.textContent = U.money0(value);
      valEl.appendChild(unitEl);
      slider.value = Math.min(max, Math.max(min, Math.round(value / step) * step));
      if (!fromExact) exact.value = value;
    }

    function set(v, fromExact) {
      value = Math.max(0, Math.round(v * 100) / 100);
      paint(fromExact);
      opts.onChange(value);
    }

    /* Steps land on the increment grid: an off-grid rate snaps to the nearest
       grid line first, an on-grid rate moves a full increment. */
    minus.addEventListener('click', function () {
      var onGrid = Math.abs(value / step - Math.round(value / step)) < 1e-9;
      set(Math.max(min, onGrid ? value - step : Math.floor(value / step) * step));
    });
    plus.addEventListener('click', function () {
      var onGrid = Math.abs(value / step - Math.round(value / step)) < 1e-9;
      set(Math.min(max, onGrid ? value + step : Math.ceil(value / step) * step));
    });
    slider.addEventListener('input', function () { set(U.num(slider.value)); });
    exact.addEventListener('input', function () { set(U.num(exact.value), true); });

    wrap.appendChild(top);
    wrap.appendChild(stepper);
    wrap.appendChild(scale);
    wrap.appendChild(exactRow);
    paint();

    wrap.setValue = function (v) { value = v; paint(); };
    wrap.getValue = function () { return value; };
    return wrap;
  };

  root.LRT.ui = UI;
})(window);
