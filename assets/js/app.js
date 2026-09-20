/* Neville Rentals & Transportation — router, shell wiring, settings. */
(function (root) {
  'use strict';

  var U = root.NRT.util;
  var S = root.NRT.store;
  var UI = root.NRT.ui;
  var V = root.NRT.views;
  var B = root.NRT.builder;

  var App = {};
  var mount, titleEl;

  var ROUTES = [
    { id: 'dashboard', hash: '#/', label: 'Dashboard', icon: 'dashboard', title: 'Dashboard' },
    { id: 'new', hash: '#/new', label: 'New contract', icon: 'filePlus', title: 'New contract' },
    { id: 'contracts', hash: '#/contracts', label: 'Contracts', icon: 'files', title: 'Contracts' },
    { id: 'fleet', hash: '#/fleet', label: 'Fleet', icon: 'car', title: 'Fleet' },
    { id: 'settings', hash: '#/settings', label: 'Settings', icon: 'settings', title: 'Settings' }
  ];

  /* ------------------------------------------------------------ hash bits */

  function parseHash() {
    var raw = (location.hash || '#/').slice(1);
    var qi = raw.indexOf('?');
    var query = {};
    if (qi > -1) {
      raw.slice(qi + 1).split('&').forEach(function (kv) {
        var p = kv.split('=');
        query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
      });
      raw = raw.slice(0, qi);
    }
    var parts = raw.split('/').filter(Boolean);
    return { parts: parts, query: query };
  }

  /* ---------------------------------------------------------------- theme */

  var THEME_KEY = 'nrt.theme';
  function readTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || localStorage.getItem('lrt.theme') || 'system';
    } catch (e) { return 'system'; }
  }
  function applyTheme(t) {
    if (t === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    if (root.NRT.canvas) root.NRT.canvas.refreshTheme();
  }
  App.cycleTheme = function () {
    var order = ['system', 'light', 'dark'];
    var next = order[(order.indexOf(readTheme()) + 1) % order.length];
    applyTheme(next);
    U.toast('Theme: ' + next);
    App.render();
  };

  /* ------------------------------------------------------------- printing */

  App.printContract = function (id) {
    if (location.hash !== '#/contract/' + id) {
      location.hash = '#/contract/' + id;
      setTimeout(function () { window.print(); }, 420);
    } else {
      setTimeout(function () { window.print(); }, 120);
    }
  };

  /* ---------------------------------------------------------------- shell */

  function buildNav() {
    var rail = U.$('#rail');
    var tabbar = U.$('#tabbar');
    var stats = S.stats();

    var nav = U.el('nav', { class: 'nav' });
    ROUTES.forEach(function (r) {
      var b = U.el('button', { type: 'button', class: 'nav__item', dataset: { route: r.id } });
      b.appendChild(UI.icon(r.icon));
      b.appendChild(U.el('span', { text: r.label }));
      if (r.id === 'contracts' && stats.activeCount) {
        b.appendChild(U.el('span', { class: 'nav__count', text: String(stats.activeCount) }));
      }
      b.addEventListener('click', function () { location.hash = r.hash; });
      nav.appendChild(b);
    });
    var oldNav = U.$('.nav', rail);
    if (oldNav) rail.replaceChild(nav, oldNav);
    else rail.insertBefore(nav, U.$('.rail__foot', rail));

    tabbar.innerHTML = '';
    ROUTES.filter(function (r) { return r.id !== 'settings'; }).forEach(function (r) {
      var b = U.el('button', { type: 'button', class: 'tabbar__item', dataset: { route: r.id } });
      b.appendChild(UI.icon(r.icon));
      b.appendChild(U.el('span', { text: r.id === 'new' ? 'New' : r.label }));
      b.addEventListener('click', function () { location.hash = r.hash; });
      tabbar.appendChild(b);
    });
    var sb = U.el('button', { type: 'button', class: 'tabbar__item', dataset: { route: 'settings' } });
    sb.appendChild(UI.icon('settings'));
    sb.appendChild(U.el('span', { text: 'More' }));
    sb.addEventListener('click', function () { location.hash = '#/settings'; });
    tabbar.appendChild(sb);
  }

  function markActive(routeId) {
    U.$$('[data-route]').forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.route === routeId);
    });
    var r = ROUTES.filter(function (x) { return x.id === routeId; })[0];
    titleEl.textContent = r ? r.title : 'Neville Rentals';
  }

  /* -------------------------------------------------------------- settings */

  function settingsView(host) {
    var co = S.company();
    host.appendChild(U.el('div', { class: 'page-head' }, [
      U.el('div', { class: 'page-head__text' }, [
        U.el('div', { class: 'eyebrow', text: 'Configuration' }),
        U.el('h1', { text: 'Settings' })
      ])
    ]));

    var stack = U.el('div', { class: 'stack' });

    /* business */
    var f = {};
    f.name = UI.input('s_name', { value: co.name });
    f.address = UI.input('s_addr', { value: co.address });
    f.phone = UI.input('s_phone', { type: 'tel', value: co.phone });
    f.email = UI.input('s_email', { type: 'email', value: co.email });
    f.agent = UI.input('s_agent', { value: co.agent });
    f.deposit = UI.input('s_dep', { type: 'number', min: 0, step: 25, value: co.deposit, class: 'input--mono' });
    f.ins = UI.input('s_ins', { type: 'number', min: 0, step: 1, value: co.insuranceDaily, class: 'input--mono' });
    f.age = UI.input('s_age', { type: 'number', min: 16, max: 30, value: co.minimumAge, class: 'input--mono' });
    f.insp = UI.input('s_insp', { type: 'number', min: 7, max: 120, value: co.inspectionIntervalDays, class: 'input--mono' });

    var bizCard = U.el('div', { class: 'card' }, [
      U.el('div', { class: 'card__head' }, [U.el('h2', { text: 'Business details' })]),
      U.el('div', { class: 'card__body stack' }, [
        UI.field('Business name', f.name, { hint: 'Prints at the top of every contract.' }),
        U.el('div', { class: 'grid grid--2' }, [
          UI.field('Address', f.address), UI.field('Phone', f.phone)
        ]),
        U.el('div', { class: 'grid grid--2' }, [
          UI.field('Email', f.email), UI.field('Default releasing agent', f.agent)
        ])
      ])
    ]);
    stack.appendChild(bizCard);

    var policyCard = U.el('div', { class: 'card' }, [
      U.el('div', { class: 'card__head' }, [U.el('h2', { text: 'Rental policy defaults' })]),
      U.el('div', { class: 'card__body' }, [
        U.el('div', { class: 'grid grid--2' }, [
          UI.field('Security deposit', f.deposit, { hint: 'Preloaded on every new contract.' }),
          UI.field('Insurance, per day', f.ins, { hint: 'Charged when the business provides coverage.' }),
          UI.field('Minimum renter age', f.age, { hint: 'Blocks signing below this age.' }),
          UI.field('Inspection interval (days)', f.insp, { hint: 'Rentals longer than this require interim inspections.' })
        ])
      ])
    ]);
    stack.appendChild(policyCard);

    var saveRow = U.el('div', { class: 'inline' }, [
      UI.button('Save settings', { variant: 'primary', icon: 'check', onClick: function () {
        S.saveCompany({
          name: f.name.value.trim() || co.name,
          address: f.address.value.trim(), phone: f.phone.value.trim(),
          email: f.email.value.trim(), agent: f.agent.value.trim(),
          deposit: U.num(f.deposit.value, 150), insuranceDaily: U.num(f.ins.value, 15),
          minimumAge: U.num(f.age.value, 21), inspectionIntervalDays: U.num(f.insp.value, 30)
        });
        U.toast('Settings saved.', 'good');
        App.render();
      } })
    ]);
    stack.appendChild(saveRow);

    /* appearance */
    var themeSeg = UI.seg([
      { value: 'system', label: 'Match device' },
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' }
    ], readTheme(), function (v) { applyTheme(v); });
    stack.appendChild(U.el('div', { class: 'card' }, [
      U.el('div', { class: 'card__head' }, [U.el('h2', { text: 'Appearance' })]),
      U.el('div', { class: 'card__body' }, [
        U.el('div', { class: 'field' }, [
          U.el('span', { class: 'label', text: 'Theme' }), themeSeg,
          U.el('div', { class: 'hint', text: 'Contracts always print black on white regardless of this setting.' })
        ])
      ])
    ]));

    /* data */
    var dataBody = U.el('div', { class: 'card__body stack' });
    dataBody.appendChild(UI.note('warn', 'Everything lives in this browser',
      'Contracts and fleet data are stored on this device only. Export a backup regularly, and import it to move to another device.'));

    var importFile = U.el('input', { type: 'file', accept: 'application/json,.json', id: 'import_file' });
    importFile.style.display = 'none';
    importFile.addEventListener('change', function () {
      var file = importFile.files && importFile.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          S.importJSON(String(reader.result));
          U.toast('Backup restored.', 'good');
          App.render();
        } catch (e) {
          U.toast(e.message || 'That file could not be read.', 'bad');
        }
      };
      reader.readAsText(file);
    });

    var row = U.el('div', { class: 'inline' }, [
      UI.button('Export backup', { icon: 'download', onClick: function () { exportBackup(); } }),
      UI.button('Import backup', { icon: 'upload', onClick: function () { importFile.click(); } })
    ]);
    if (S.hasSamples()) {
      row.appendChild(UI.button('Clear sample contracts', {
        onClick: function () {
          UI.confirm({
            title: 'Clear the sample contracts?',
            message: 'The five example rentals go away. Your fleet and any contracts you wrote are kept.',
            confirmLabel: 'Clear samples'
          }).then(function (ok) {
            if (!ok) return;
            S.clearSamples(); U.toast('Sample contracts cleared.'); App.render();
          });
        }
      }));
    }
    row.appendChild(UI.button('Reset everything', {
      variant: 'danger', icon: 'trash', onClick: function () {
        UI.confirm({
          title: 'Reset all data?',
          message: 'Every contract, vehicle and setting on this device is erased and the demo fleet comes back. This cannot be undone.',
          confirmLabel: 'Erase and reset', danger: true
        }).then(function (ok) {
          if (!ok) return;
          S.resetAll(); U.toast('Reset complete.'); location.hash = '#/'; App.render();
        });
      }
    }));
    dataBody.appendChild(row);
    dataBody.appendChild(importFile);

    stack.appendChild(U.el('div', { class: 'card' }, [
      U.el('div', { class: 'card__head' }, [U.el('h2', { text: 'Data' })]),
      dataBody
    ]));

    var st = S.stats();
    stack.appendChild(U.el('div', { class: 'card' }, [
      U.el('div', { class: 'card__head' }, [U.el('h2', { text: 'On this device' })]),
      U.el('div', { class: 'card__body' }, [
        U.el('dl', { class: 'kv' }, [
          U.el('dt', { text: 'Vehicles' }), U.el('dd', { class: 'mono', text: String(st.fleetSize) }),
          U.el('dt', { text: 'Contracts' }), U.el('dd', { class: 'mono', text: String(S.contracts().length) }),
          U.el('dt', { text: 'Lifetime revenue' }), U.el('dd', { class: 'mono', text: U.money(st.lifetimeRevenue) }),
          U.el('dt', { text: 'Next contract no.' }), U.el('dd', { class: 'mono', text: S.nextContractNo() })
        ])
      ])
    ]));

    host.appendChild(stack);
  }

  function exportBackup() {
    var text = S.exportJSON();
    var name = 'neville-backup-' + U.today() + '.json';
    try {
      var blob = new Blob([text], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = U.el('a', { href: url, download: name });
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
      U.toast('Backup saved as ' + name, 'good');
    } catch (e) {
      root.NRT.share.copy(text);
      U.toast('Download blocked here — the backup was copied to your clipboard instead.');
    }
  }

  /* ---------------------------------------------------------------- render */

  App.render = function () {
    var h = parseHash();
    var p = h.parts;
    mount.innerHTML = '';
    window.scrollTo(0, 0);

    buildNav();

    if (!p.length) { markActive('dashboard'); V.dashboard(mount); return; }

    switch (p[0]) {
      case 'fleet':
        markActive('fleet'); V.fleet(mount); break;
      case 'new':
        markActive('new'); B.render(mount, h.query); break;
      case 'contracts':
        markActive('contracts'); V.contracts(mount, h.query); break;
      case 'contract':
        markActive('contracts'); V.contract(mount, p[1]); break;
      case 'settings':
        markActive('settings'); settingsView(mount); break;
      default:
        markActive('dashboard'); V.dashboard(mount);
    }
  };

  /* ------------------------------------------------------------------ boot */

  App.start = function () {
    mount = U.$('#view');
    titleEl = U.$('#appbar-title');
    applyTheme(readTheme());
    S.init();

    U.$('#brand-home').addEventListener('click', function () { location.hash = '#/'; });
    ['#theme-btn', '#rail-theme'].forEach(function (sel) {
      var b = U.$(sel);
      if (b) b.addEventListener('click', App.cycleTheme);
    });

    window.addEventListener('hashchange', App.render);
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onScheme = function () { if (root.NRT.canvas) root.NRT.canvas.refreshTheme(); App.render(); };
      if (mq.addEventListener) mq.addEventListener('change', onScheme);
    }

    App.render();
  };

  root.NRT.app = App;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.start);
  } else {
    App.start();
  }
})(window);
