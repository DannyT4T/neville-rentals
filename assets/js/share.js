/* Neville Rentals & Transportation — sending a finished contract out.

   There is no mail server behind this app, so sending hands off to whatever
   the device already has: the native share sheet, the Messages app, the mail
   client. That is what actually works from a phone at the curb.

   Telephony is device-dependent — a phone can text, a tablet generally cannot —
   so the text option is offered only where it will succeed. */
(function (root) {
  'use strict';

  var U = root.NRT.util;
  var S = root.NRT.store;
  var UI = root.NRT.ui;
  var T = root.NRT.terms;

  var Sh = {};

  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.indexOf('Mac') > -1 && navigator.maxTouchPoints > 1);
  var isIPad = /iPad/.test(ua) || (ua.indexOf('Mac') > -1 && navigator.maxTouchPoints > 1 && !/iPhone/.test(ua));

  /* A phone can open sms:. Tablets and desktops generally cannot, so the
     control says so instead of opening a dead link. */
  Sh.canSMS = function () {
    if (/iPhone|iPod/.test(ua)) return true;
    if (/Android/.test(ua) && /Mobile/.test(ua)) return true;
    if (/Windows Phone/.test(ua)) return true;
    return false;
  };
  Sh.deviceKind = function () {
    if (Sh.canSMS()) return 'phone';
    if (isIPad || (/Android/.test(ua) && !/Mobile/.test(ua))) return 'tablet';
    return 'desktop';
  };
  Sh.canNativeShare = function () { return typeof navigator.share === 'function'; };

  /* iOS wants sms:NUMBER&body=, everything else sms:NUMBER?body= */
  Sh.smsHref = function (number, body) {
    var n = String(number || '').replace(/[^\d+]/g, '');
    return 'sms:' + n + (isIOS ? '&' : '?') + 'body=' + encodeURIComponent(body);
  };
  Sh.mailHref = function (to, subject, body) {
    return 'mailto:' + encodeURIComponent(to || '') +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  };

  /* ------------------------------------------------------------ text form */

  Sh.summaryText = function (c) {
    var co = S.company();
    var veh = S.vehicle(c.vehicleId) || {};
    var t = c.totals || S.totals(c);
    return [
      co.name,
      'Rental agreement ' + (c.no || ''),
      '',
      (c.renter && c.renter.name) || '',
      (veh.year || '') + ' ' + (veh.make || '') + ' ' + (veh.model || '') +
        (veh.plate ? '  plate ' + veh.plate : ''),
      U.fmtDate(c.startDate) + ' to ' + U.fmtDate(c.endDate) + '  (' + t.days + ' days)',
      '',
      'Rental ' + U.money(t.rental) +
        (t.insurance ? ' + insurance ' + U.money(t.insurance) : '') +
        ' + deposit ' + U.money(t.deposit),
      'Paid at signing: ' + U.money(t.dueAtSigning),
      '',
      'Tolls during the rental are deducted from the ' + U.money(t.deposit) +
        ' deposit; the balance is returned within 7 business days of check-in.',
      '',
      co.phone
    ].join('\n');
  };

  Sh.fullText = function (c) {
    var co = S.company();
    var veh = S.vehicle(c.vehicleId) || {};
    var t = c.totals || S.totals(c);
    var r = c.renter || {};
    var L = [];
    function rule() { L.push('------------------------------------------------------------'); }

    L.push(co.name.toUpperCase());
    L.push(co.address);
    L.push(co.phone + '  ' + co.email);
    rule();
    L.push('VEHICLE RENTAL AGREEMENT');
    L.push('Agreement no. ' + (c.no || '') + '     Issued ' + U.fmtDate(c.signedAt || U.today(), 'long'));
    rule();
    L.push('');
    L.push('1. PARTIES');
    L.push('   Renter:        ' + (r.name || ''));
    L.push('   Date of birth: ' + U.fmtDate(r.dob) + '   (age ' + U.ageOn(r.dob, c.startDate) + ')');
    L.push('   License:       ' + (r.license || '') + '  (' + (r.licState || '') + ', exp ' + U.fmtDate(r.licExp) + ')');
    L.push('   Phone / email: ' + (r.phone || '') + '  ' + (r.email || ''));
    L.push('   Address:       ' + (r.address || ''));
    L.push('');
    L.push('2. VEHICLE');
    L.push('   ' + [veh.year, veh.make, veh.model].filter(Boolean).join(' ') + '  (' + (veh.color || '') + ')');
    L.push('   VIN:   ' + (veh.vin || ''));
    L.push('   Plate: ' + (veh.plate || '') + ' ' + (veh.state || ''));
    L.push('');
    L.push('3. TERM AND RATE');
    L.push('   ' + U.fmtDate(c.startDate, 'long') + '  to  ' + U.fmtDate(c.endDate, 'long'));
    L.push('   Duration: ' + t.days + ' days' + (t.weeks ? ' (' + t.weeks + ' wk + ' + t.extraDays + ' d)' : ''));
    L.push('   Daily ' + U.money(c.dailyRate) + '   Weekly ' + U.money(c.weeklyRate));
    L.push('');
    L.push('4. CHARGES');
    if (t.weeks) {
      L.push('   Rental, weekly      ' + U.money(c.weeklyRate) + ' x ' + t.weeks + ' wk = ' + U.money(t.weeks * c.weeklyRate));
      if (t.extraDays) L.push('   Rental, extra days  ' + U.money(c.dailyRate) + ' x ' + t.extraDays + ' d = ' + U.money(t.extraDays * c.dailyRate));
    } else {
      L.push('   Rental, daily       ' + U.money(c.dailyRate) + ' x ' + t.days + ' d = ' + U.money(t.rental));
    }
    L.push('   Insurance           ' + (c.insurance && c.insurance.type === 'company'
      ? U.money(c.insurance.dailyFee) + '/day = ' + U.money(t.insurance)
      : 'self-insured by renter'));
    (c.fees || []).forEach(function (f) { L.push('   ' + (f.label || 'Fee') + '  ' + U.money(f.amount)); });
    L.push('   Security deposit    ' + U.money(t.deposit));
    L.push('   DUE AT SIGNING      ' + U.money(t.dueAtSigning));
    L.push('');
    L.push('5. CONDITION AT PICKUP');
    L.push('   Fuel: ' + U.fuelLabel(c.pickup ? c.pickup.fuel : 1) +
      '    Odometer: ' + ((c.pickup && c.pickup.odometer) ? Number(c.pickup.odometer).toLocaleString('en-US') + ' mi' : '—'));
    L.push('   Pre-existing damage marks recorded: ' + (((c.pickup && c.pickup.damage) || []).length));
    L.push('   (The damage diagram is on the printed contract.)');
    if (c.dropoff) {
      L.push('');
      L.push('   CONDITION AT RETURN');
      L.push('   Fuel: ' + U.fuelLabel(c.dropoff.fuel) +
        '    Odometer: ' + (c.dropoff.odometer ? Number(c.dropoff.odometer).toLocaleString('en-US') + ' mi' : '—'));
    }
    if ((c.tolls || []).length || c.status === 'completed') {
      L.push('');
      L.push('6. DEPOSIT SETTLEMENT');
      L.push('   Deposit held        ' + U.money(t.deposit));
      (c.tolls || []).forEach(function (x) { L.push('   less toll, ' + (x.label || '') + '  -' + U.money(x.amount)); });
      (c.fees || []).forEach(function (f) { L.push('   less ' + (f.label || 'fee') + '  -' + U.money(f.amount)); });
      L.push(t.balanceOwed > 0
        ? '   BALANCE DUE FROM RENTER  ' + U.money(t.balanceOwed)
        : '   RETURNED TO RENTER       ' + U.money(t.depositRefund));
    }
    L.push('');
    rule();
    L.push('TERMS AND CONDITIONS');
    rule();
    T.clauses(c, co, veh).forEach(function (cl, i) {
      L.push('');
      L.push((i + 1) + '. ' + cl.title.toUpperCase());
      L.push(wrap(cl.text, 62, '   '));
    });
    L.push('');
    rule();
    L.push('Signed by ' + (r.name || '') + ' on ' + U.fmtDate(c.signedAt || c.startDate, 'long') +
      ' and by ' + (c.agent || co.agent) + ' for ' + co.name + '.');
    L.push('A signed PDF with the signature and damage diagram is available on request.');
    return L.join('\n');
  };

  function wrap(text, width, indent) {
    var words = String(text).split(/\s+/), lines = [], line = indent;
    words.forEach(function (w) {
      if ((line + ' ' + w).length > width + indent.length) { lines.push(line); line = indent + w; }
      else line = line === indent ? indent + w : line + ' ' + w;
    });
    if (line.trim()) lines.push(line);
    return lines.join('\n');
  }

  /* mailto: bodies get truncated by some clients well before the URL limit. */
  var MAIL_CAP = 1900;

  function clip(text) {
    if (text.length <= MAIL_CAP) return text;
    return text.slice(0, MAIL_CAP - 90).replace(/\n[^\n]*$/, '') +
      '\n\n[...] Full agreement continues on the printed PDF attached separately.';
  }

  Sh.copy = function (text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text)
        .then(function () { U.toast('Copied to the clipboard.', 'good'); })
        .catch(function () { fallbackCopy(text); });
    }
    fallbackCopy(text);
    return Promise.resolve();
  };
  function fallbackCopy(text) {
    var ta = U.el('textarea', { style: 'position:fixed;top:-2000px;left:0;opacity:0' });
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); U.toast('Copied to the clipboard.', 'good'); }
    catch (e) { U.toast('Could not copy — select the text and copy manually.', 'bad'); }
    document.body.removeChild(ta);
  }

  function go(href) {
    var a = U.el('a', { href: href });
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { document.body.removeChild(a); }, 400);
  }

  /* ------------------------------------------------------------ the sheet */

  Sh.open = function (c) {
    var co = S.company();
    var r = c.renter || {};
    var kind = Sh.deviceKind();
    var subject = co.name + ' — rental agreement ' + (c.no || '');

    var body = U.el('div', { class: 'stack' });

    body.appendChild(UI.note('info', null,
      kind === 'phone'
        ? 'Sending opens your phone’s Messages or Mail app with the agreement already written. Nothing leaves this device until you press send there.'
        : kind === 'tablet'
          ? 'This tablet has no texting, so email is the route here. It opens your Mail app with the agreement already written.'
          : 'This opens your computer’s mail client with the agreement already written. Texting works from a phone.',
      'info'));

    /* what to send */
    var scope = 'summary';
    var scopeSeg = UI.seg([
      { value: 'summary', label: 'Summary' },
      { value: 'full', label: 'Full agreement' }
    ], scope, function (v) { scope = v; refreshPreview(); });
    body.appendChild(U.el('div', { class: 'field' }, [
      U.el('span', { class: 'label', text: 'What to send' }), scopeSeg,
      U.el('div', { class: 'hint', text: 'The summary fits a text message. The full agreement includes every clause as plain text.' })
    ]));

    /* phone */
    var phoneIn = UI.input('send_phone', { type: 'tel', value: r.phone || '', placeholder: '(718) 555-0142', autocomplete: 'tel' });
    var smsBtn = UI.button('Send by text', {
      variant: 'primary', icon: 'receipt',
      onClick: function () {
        var n = phoneIn.value.trim();
        if (!n) { U.toast('Enter a mobile number first.', 'bad'); phoneIn.focus(); return; }
        go(Sh.smsHref(n, scope === 'full' ? Sh.summaryText(c) : Sh.summaryText(c)));
        markSent(c, 'text', n);
      }
    });
    var phoneRow = U.el('div', { class: 'inline' }, [smsBtn]);
    if (!Sh.canSMS()) {
      smsBtn.disabled = true;
      phoneRow.appendChild(U.el('span', { class: 'hint',
        text: kind === 'tablet' ? 'Texting needs a phone.' : 'Texting needs a phone. Open this page on your phone to send.' }));
    }
    var phoneField = UI.field('Mobile number', phoneIn, {
      hint: 'A text carries the summary and the deposit terms — the full contract goes by email or print.'
    });
    phoneField.appendChild(phoneRow);
    body.appendChild(phoneField);

    body.appendChild(U.el('hr', { class: 'divider' }));

    /* email */
    var mailIn = UI.input('send_email', { type: 'email', value: r.email || '', placeholder: 'renter@example.com', autocomplete: 'email' });
    var mailBtn = UI.button('Send by email', {
      variant: 'primary', icon: 'files',
      onClick: function () {
        var a = mailIn.value.trim();
        if (!a) { U.toast('Enter an email address first.', 'bad'); mailIn.focus(); return; }
        var text = scope === 'full' ? Sh.fullText(c) : Sh.summaryText(c);
        go(Sh.mailHref(a, subject, clip(text)));
        markSent(c, 'email', a);
      }
    });
    var mailField = UI.field('Email address', mailIn, {
      hint: 'Attach the PDF from Print for a copy with the signature and damage diagram.'
    });
    mailField.appendChild(U.el('div', { class: 'inline' }, [mailBtn]));
    body.appendChild(mailField);

    body.appendChild(U.el('hr', { class: 'divider' }));

    /* everything else */
    var more = U.el('div', { class: 'inline' });
    if (Sh.canNativeShare()) {
      more.appendChild(UI.button('Share…', {
        icon: 'upload',
        onClick: function () {
          navigator.share({
            title: subject,
            text: scope === 'full' ? Sh.fullText(c).slice(0, 4000) : Sh.summaryText(c)
          }).then(function () { markSent(c, 'share', 'share sheet'); })
            .catch(function () { /* the user dismissed the sheet */ });
        }
      }));
    }
    more.appendChild(UI.button('Copy full text', {
      icon: 'files', onClick: function () { Sh.copy(Sh.fullText(c)); }
    }));
    more.appendChild(UI.button('Print / save PDF', {
      icon: 'printer',
      onClick: function () { root.NRT.app.printContract(c.id); }
    }));
    body.appendChild(U.el('div', { class: 'field' }, [
      U.el('span', { class: 'label', text: 'Other ways out' }), more
    ]));

    /* live preview of exactly what goes */
    var pre = U.el('pre', {
      class: 'mono',
      style: 'white-space:pre-wrap;font-size:.72rem;line-height:1.5;margin:0;max-height:220px;overflow:auto;' +
             'background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-md);padding:12px;color:var(--ink-2)'
    });
    function refreshPreview() {
      pre.textContent = scope === 'full' ? Sh.fullText(c) : Sh.summaryText(c);
    }
    refreshPreview();
    body.appendChild(U.el('div', { class: 'field' }, [
      U.el('span', { class: 'label', text: 'Preview' }), pre
    ]));

    UI.modal({ title: 'Send agreement ' + (c.no || ''), body: body, actions: [{ label: 'Done' }] });
  };

  function markSent(c, how, target) {
    c.sentLog = c.sentLog || [];
    c.sentLog.push({ how: how, target: target, at: new Date().toISOString() });
    S.saveContract(c);
    U.toast('Handed off to your ' + (how === 'text' ? 'Messages' : how === 'email' ? 'Mail' : 'share') + ' app.', 'good');
  }

  root.NRT.share = Sh;
})(window);
