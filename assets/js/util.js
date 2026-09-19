/* Leville Rentals & Transportation — shared helpers */
(function (root) {
  'use strict';

  var U = {};

  U.$ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  U.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  U.el = function (tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), v);
        else if (k === 'dataset') Object.keys(v).forEach(function (d) { node.dataset[d] = v[d]; });
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    (kids || []).forEach(function (kid) {
      if (kid === null || kid === undefined) return;
      node.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    });
    return node;
  };

  U.escape = function (s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  /* ---- money (stored as whole dollars, may carry cents) ---- */
  var usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  var usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  U.money = function (n) { return usd.format(Number(n) || 0); };
  U.money0 = function (n) { return usd0.format(Number(n) || 0); };
  U.num = function (v, fallback) { var n = parseFloat(v); return isFinite(n) ? n : (fallback || 0); };

  /* ---- dates: ISO yyyy-mm-dd is the storage format, local-noon is the parse anchor ---- */
  U.today = function () { return U.iso(new Date()); };
  U.iso = function (d) {
    var y = d.getFullYear(), m = ('0' + (d.getMonth() + 1)).slice(-2), day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  };
  U.parseDate = function (s) {
    if (!s) return null;
    var p = String(s).split('-');
    if (p.length !== 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  };
  U.addDays = function (iso, n) {
    var d = U.parseDate(iso); if (!d) return null;
    d.setDate(d.getDate() + n); return U.iso(d);
  };
  U.dayDiff = function (a, b) {
    var x = U.parseDate(a), y = U.parseDate(b);
    if (!x || !y) return 0;
    return Math.round((y - x) / 86400000);
  };
  U.fmtDate = function (s, style) {
    var d = U.parseDate(s); if (!d) return '—';
    if (style === 'long') return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (style === 'short') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };
  U.monthKey = function (s) { return String(s || '').slice(0, 7); };
  U.monthLabel = function (key) {
    var p = String(key).split('-');
    var d = new Date(+p[0], +p[1] - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'short' });
  };

  U.ageOn = function (dobIso, onIso) {
    var dob = U.parseDate(dobIso), on = U.parseDate(onIso || U.today());
    if (!dob || !on) return null;
    var age = on.getFullYear() - dob.getFullYear();
    var m = on.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && on.getDate() < dob.getDate())) age--;
    return age;
  };

  U.uid = function (prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  };

  /* ---- duration -> billable breakdown ---- */
  U.breakdown = function (days, mode, daily, weekly) {
    days = Math.max(0, Math.round(days || 0));
    if (mode === 'daily' || days < 7) {
      return { weeks: 0, extraDays: days, days: days, subtotal: days * daily, mode: days < 7 ? 'daily' : mode };
    }
    var weeks = Math.floor(days / 7), extra = days % 7;
    var asWeekly = weeks * weekly + extra * daily;
    return { weeks: weeks, extraDays: extra, days: days, subtotal: asWeekly, mode: 'weekly' };
  };

  /* ---- toast ---- */
  var toastHost = null;
  U.toast = function (msg, tone) {
    if (!toastHost) {
      toastHost = U.el('div', { class: 'toast-host', 'aria-live': 'polite' });
      document.body.appendChild(toastHost);
    }
    var t = U.el('div', { class: 'toast' + (tone ? ' toast--' + tone : ''), text: msg });
    toastHost.appendChild(t);
    setTimeout(function () { t.classList.add('is-out'); }, 2600);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3100);
  };

  U.FUEL = [
    { v: 0, label: 'Empty', short: 'E' },
    { v: 0.25, label: 'One quarter', short: '1/4' },
    { v: 0.5, label: 'Half', short: '1/2' },
    { v: 0.75, label: 'Three quarters', short: '3/4' },
    { v: 1, label: 'Full', short: 'F' }
  ];
  U.fuelLabel = function (v) {
    var f = U.FUEL.filter(function (x) { return Math.abs(x.v - v) < 0.01; })[0];
    return f ? f.short : '—';
  };

  root.LRT = root.LRT || {};
  root.LRT.util = U;
})(window);
