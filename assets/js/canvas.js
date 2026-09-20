/* Neville Rentals & Transportation — canvas components.
   Damage marks and signatures are stored as vector strokes in a fixed logical
   coordinate space, never as a flattened image, so the same record re-renders
   crisply on a phone, on the printed contract, and at any zoom. */
(function (root) {
  'use strict';

  var U = root.NRT.util;
  var C = {};

  /* Logical drawing spaces. */
  var DMG_W = 1000, DMG_H = 520;
  var SIG_W = 640, SIG_H = 200;

  function hidpi(canvas, logicalW, logicalH) {
    var ratio = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var cssW = rect.width || canvas.clientWidth || logicalW;
    var cssH = cssW * (logicalH / logicalW);
    canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * ratio);
    canvas.height = Math.round(cssH * ratio);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var scale = (cssW * ratio) / logicalW;
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    return ctx;
  }

  function pointIn(canvas, evt, logicalW, logicalH) {
    var r = canvas.getBoundingClientRect();
    return {
      x: ((evt.clientX - r.left) / r.width) * logicalW,
      y: ((evt.clientY - r.top) / r.height) * logicalH
    };
  }

  /* ------------------------------------------------- vehicle schematic art */

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function panelLabel(ctx, text, x, y) {
    ctx.save();
    ctx.fillStyle = C.ink;
    ctx.font = '600 15px "Archivo", system-ui, sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.letterSpacing = '0.08em';
    ctx.fillText(text.toUpperCase(), x, y);
    ctx.restore();
  }

  /* Top-down plan: roof, hood, trunk, all four doors. */
  function drawTop(ctx, x, y, w, h) {
    ctx.save();
    ctx.strokeStyle = C.line;
    ctx.fillStyle = C.fill;
    ctx.lineWidth = 2.2;
    roundRect(ctx, x, y, w, h, w * 0.22);
    ctx.fill();
    ctx.stroke();

    ctx.lineWidth = 1.6;
    // windshield + rear glass
    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, y + h * 0.28); ctx.lineTo(x + w * 0.9, y + h * 0.28);
    ctx.moveTo(x + w * 0.1, y + h * 0.7); ctx.lineTo(x + w * 0.9, y + h * 0.7);
    ctx.stroke();
    // cabin box
    ctx.beginPath();
    roundRect(ctx, x + w * 0.12, y + h * 0.3, w * 0.76, h * 0.38, 10);
    ctx.stroke();
    // door split
    ctx.beginPath();
    ctx.moveTo(x + w * 0.12, y + h * 0.49); ctx.lineTo(x + w * 0.88, y + h * 0.49);
    ctx.stroke();
    // mirrors
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.32); ctx.lineTo(x - 12, y + h * 0.3);
    ctx.moveTo(x + w, y + h * 0.32); ctx.lineTo(x + w + 12, y + h * 0.3);
    ctx.stroke();
    ctx.restore();
  }

  /* Side elevation. facing = 1 nose-right, -1 nose-left. */
  function drawSide(ctx, x, y, w, h, facing) {
    ctx.save();
    ctx.translate(x + (facing < 0 ? w : 0), y);
    ctx.scale(facing, 1);
    ctx.strokeStyle = C.line;
    ctx.fillStyle = C.fill;
    ctx.lineWidth = 2.2;

    ctx.beginPath();
    ctx.moveTo(w * 0.02, h * 0.74);
    ctx.lineTo(w * 0.06, h * 0.44);
    ctx.lineTo(w * 0.2, h * 0.4);
    ctx.lineTo(w * 0.34, h * 0.14);
    ctx.lineTo(w * 0.68, h * 0.14);
    ctx.lineTo(w * 0.82, h * 0.4);
    ctx.lineTo(w * 0.95, h * 0.44);
    ctx.lineTo(w * 0.98, h * 0.74);
    ctx.lineTo(w * 0.02, h * 0.74);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.lineWidth = 1.5;
    // greenhouse
    ctx.beginPath();
    ctx.moveTo(w * 0.23, h * 0.4); ctx.lineTo(w * 0.36, h * 0.2);
    ctx.lineTo(w * 0.66, h * 0.2); ctx.lineTo(w * 0.79, h * 0.4);
    ctx.stroke();
    // door cuts + b-pillar
    ctx.beginPath();
    ctx.moveTo(w * 0.32, h * 0.74); ctx.lineTo(w * 0.32, h * 0.22);
    ctx.moveTo(w * 0.51, h * 0.74); ctx.lineTo(w * 0.51, h * 0.2);
    ctx.moveTo(w * 0.7, h * 0.74); ctx.lineTo(w * 0.7, h * 0.22);
    ctx.stroke();
    // wheels
    [0.22, 0.79].forEach(function (p) {
      ctx.beginPath();
      ctx.arc(w * p, h * 0.74, h * 0.16, Math.PI, 2 * Math.PI);
      ctx.stroke();
    });
    ctx.restore();
  }

  /* Front or rear elevation. */
  function drawEnd(ctx, x, y, w, h, kind) {
    ctx.save();
    ctx.strokeStyle = C.line;
    ctx.fillStyle = C.fill;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.08, y + h * 0.78);
    ctx.lineTo(x + w * 0.12, y + h * 0.4);
    ctx.lineTo(x + w * 0.24, y + h * 0.16);
    ctx.lineTo(x + w * 0.76, y + h * 0.16);
    ctx.lineTo(x + w * 0.88, y + h * 0.4);
    ctx.lineTo(x + w * 0.92, y + h * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.lineWidth = 1.5;
    // glass
    ctx.beginPath();
    roundRect(ctx, x + w * 0.22, y + h * 0.2, w * 0.56, h * 0.2, 6);
    ctx.stroke();
    // lamps
    [[0.16, 0.5], [0.7, 0.5]].forEach(function (p) {
      ctx.beginPath();
      roundRect(ctx, x + w * p[0], y + h * p[1], w * 0.14, h * 0.1, 4);
      ctx.stroke();
    });
    // grille or plate
    ctx.beginPath();
    roundRect(ctx, x + w * 0.36, y + h * (kind === 'front' ? 0.5 : 0.52), w * 0.28, h * 0.12, 3);
    ctx.stroke();
    ctx.restore();
  }

  function drawDiagram(ctx) {
    ctx.save();
    ctx.clearRect(0, 0, DMG_W, DMG_H);
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, DMG_W, DMG_H);

    panelLabel(ctx, 'Roof / plan', 40, 32);
    drawTop(ctx, 60, 48, 200, 300);

    panelLabel(ctx, "Driver side (left)", 330, 32);
    drawSide(ctx, 330, 48, 340, 150, 1);

    panelLabel(ctx, 'Passenger side (right)', 330, 232);
    drawSide(ctx, 330, 248, 340, 150, -1);

    panelLabel(ctx, 'Front', 730, 32);
    drawEnd(ctx, 730, 48, 210, 150, 'front');

    panelLabel(ctx, 'Rear', 730, 232);
    drawEnd(ctx, 730, 248, 210, 150, 'rear');

    // interior / mechanical strip along the bottom
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(40, 424); ctx.lineTo(DMG_W - 40, 424);
    ctx.stroke();
    ctx.setLineDash([]);
    panelLabel(ctx, 'Interior, glass, tires & mechanical notes', 40, 452);
    ctx.restore();
  }

  /* ------------------------------------------------------- mark rendering */

  function drawMark(ctx, m, scaleHint) {
    var lw = (m.w || 3) * (scaleHint || 1);
    ctx.save();
    ctx.strokeStyle = m.c || C.mark;
    ctx.fillStyle = m.c || C.mark;
    ctx.lineWidth = lw;
    if (m.t === 'pen' && m.pts && m.pts.length) {
      ctx.beginPath();
      ctx.moveTo(m.pts[0][0], m.pts[0][1]);
      for (var i = 1; i < m.pts.length; i++) ctx.lineTo(m.pts[i][0], m.pts[i][1]);
      if (m.pts.length === 1) ctx.lineTo(m.pts[0][0] + 0.6, m.pts[0][1] + 0.6);
      ctx.stroke();
    } else if (m.t === 'circle') {
      ctx.beginPath();
      ctx.ellipse(m.x, m.y, Math.max(6, m.rx), Math.max(6, m.ry), 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (m.t === 'x') {
      var r = 13;
      ctx.beginPath();
      ctx.moveTo(m.x - r, m.y - r); ctx.lineTo(m.x + r, m.y + r);
      ctx.moveTo(m.x + r, m.y - r); ctx.lineTo(m.x - r, m.y + r);
      ctx.stroke();
    } else if (m.t === 'note') {
      ctx.font = '600 16px "Archivo", system-ui, sans-serif';
      var pad = 5;
      var tw = ctx.measureText(m.text).width;
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = C.paper;
      ctx.fillRect(m.x - pad, m.y - 15, tw + pad * 2, 22);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = m.c || C.mark;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(m.x - pad, m.y - 15, tw + pad * 2, 22);
      ctx.fillStyle = m.c || C.mark;
      ctx.fillText(m.text, m.x, y0(m));
    }
    ctx.restore();
  }
  function y0(m) { return m.y; }

  /* Read theme colors off the document so the diagram follows light/dark. */
  C.refreshTheme = function () {
    var cs = getComputedStyle(document.documentElement);
    C.ink = (cs.getPropertyValue('--ink') || '#111').trim();
    C.line = (cs.getPropertyValue('--diagram-line') || '#8A93A3').trim();
    C.fill = (cs.getPropertyValue('--diagram-fill') || '#FFFFFF').trim();
    C.paper = (cs.getPropertyValue('--diagram-paper') || '#FFFFFF').trim();
    C.mark = (cs.getPropertyValue('--damage') || '#C0392B').trim();
  };

  /* Static renderer — used by the contract document and list thumbnails. */
  C.renderDamage = function (canvas, marks, opts) {
    opts = opts || {};
    C.refreshTheme();
    if (opts.mono) { C.line = '#4A4A4A'; C.fill = '#FFFFFF'; C.paper = '#FFFFFF'; C.ink = '#000000'; C.mark = '#000000'; }
    var ctx = hidpi(canvas, DMG_W, DMG_H);
    drawDiagram(ctx);
    (marks || []).forEach(function (m) { drawMark(ctx, m); });
  };

  /* ------------------------------------------------------------ DamagePad */

  C.DamagePad = function (canvas, marks, onChange) {
    var self = this;
    this.canvas = canvas;
    this.marks = (marks || []).slice();
    this.tool = 'pen';
    this.onChange = onChange || function () {};
    var ctx = null, drawing = false, current = null, startPt = null;

    function repaint() {
      ctx = ctx || hidpi(canvas, DMG_W, DMG_H);
      drawDiagram(ctx);
      self.marks.forEach(function (m) { drawMark(ctx, m); });
      if (current) drawMark(ctx, current);
    }

    this.resize = function () { C.refreshTheme(); ctx = hidpi(canvas, DMG_W, DMG_H); repaint(); };
    this.setTool = function (t) { self.tool = t; };
    this.undo = function () { self.marks.pop(); repaint(); self.onChange(self.marks); };
    this.clear = function () { self.marks = []; repaint(); self.onChange(self.marks); };
    this.getMarks = function () { return self.marks.slice(); };
    this.setMarks = function (m) { self.marks = (m || []).slice(); repaint(); };

    function down(e) {
      if (e.button !== undefined && e.button !== 0) return;
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
      var p = pointIn(canvas, e, DMG_W, DMG_H);
      startPt = p;
      drawing = true;
      if (self.tool === 'pen') current = { t: 'pen', pts: [[p.x, p.y]], c: C.mark, w: 3.5 };
      else if (self.tool === 'circle') current = { t: 'circle', x: p.x, y: p.y, rx: 6, ry: 6, c: C.mark, w: 3.5 };
      else if (self.tool === 'x') { self.marks.push({ t: 'x', x: p.x, y: p.y, c: C.mark, w: 3.5 }); drawing = false; repaint(); self.onChange(self.marks); }
      else if (self.tool === 'note') {
        drawing = false;
        var text = window.prompt('Note for this spot (e.g. "scuff, 4in"):', '');
        if (text && text.trim()) { self.marks.push({ t: 'note', x: p.x, y: p.y, text: text.trim().slice(0, 40), c: C.mark }); self.onChange(self.marks); }
        repaint();
      }
      repaint();
      e.preventDefault();
    }

    function move(e) {
      if (!drawing || !current) return;
      var p = pointIn(canvas, e, DMG_W, DMG_H);
      if (current.t === 'pen') {
        var last = current.pts[current.pts.length - 1];
        if (Math.abs(last[0] - p.x) + Math.abs(last[1] - p.y) > 1.2) current.pts.push([p.x, p.y]);
      } else if (current.t === 'circle') {
        current.x = (startPt.x + p.x) / 2;
        current.y = (startPt.y + p.y) / 2;
        current.rx = Math.abs(p.x - startPt.x) / 2;
        current.ry = Math.abs(p.y - startPt.y) / 2;
      }
      repaint();
      e.preventDefault();
    }

    function up(e) {
      if (!drawing) return;
      drawing = false;
      if (current) {
        var keep = current.t !== 'circle' || (current.rx > 5 && current.ry > 5);
        if (keep) self.marks.push(current);
        current = null;
        repaint();
        self.onChange(self.marks);
      }
      if (e) e.preventDefault();
    }

    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', up);

    C.refreshTheme();
    requestAnimationFrame(function () { self.resize(); });
    window.addEventListener('resize', function () { self.resize(); });
  };

  /* --------------------------------------------------------- SignaturePad */

  function renderSignature(ctx, strokes, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    (strokes || []).forEach(function (s) {
      if (!s.length) return;
      ctx.beginPath();
      ctx.moveTo(s[0][0], s[0][1]);
      for (var i = 1; i < s.length; i++) ctx.lineTo(s[i][0], s[i][1]);
      if (s.length === 1) ctx.lineTo(s[0][0] + 0.5, s[0][1] + 0.5);
      ctx.stroke();
    });
    ctx.restore();
  }

  C.renderSignature = function (canvas, strokes, opts) {
    opts = opts || {};
    var ctx = hidpi(canvas, SIG_W, SIG_H);
    ctx.clearRect(0, 0, SIG_W, SIG_H);
    if (opts.bg) { ctx.fillStyle = opts.bg; ctx.fillRect(0, 0, SIG_W, SIG_H); }
    renderSignature(ctx, strokes, opts.color || '#0B0B0B');
  };

  C.SignaturePad = function (canvas, onChange) {
    var self = this;
    this.strokes = [];
    var ctx = null, drawing = false, ink = '#0B0B0B';

    function repaint() {
      ctx = ctx || hidpi(canvas, SIG_W, SIG_H);
      ctx.clearRect(0, 0, SIG_W, SIG_H);
      renderSignature(ctx, self.strokes, ink);
    }

    this.resize = function () {
      ink = (getComputedStyle(document.documentElement).getPropertyValue('--signature-ink') || '#0B0B0B').trim();
      ctx = hidpi(canvas, SIG_W, SIG_H);
      repaint();
    };
    this.clear = function () { self.strokes = []; repaint(); onChange && onChange(self.strokes); };
    this.isEmpty = function () { return self.strokes.length === 0; };
    this.getStrokes = function () { return self.strokes.slice(); };
    this.setStrokes = function (s) { self.strokes = (s || []).slice(); repaint(); };

    canvas.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
      drawing = true;
      var p = pointIn(canvas, e, SIG_W, SIG_H);
      self.strokes.push([[p.x, p.y]]);
      repaint();
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      var p = pointIn(canvas, e, SIG_W, SIG_H);
      self.strokes[self.strokes.length - 1].push([p.x, p.y]);
      repaint();
      e.preventDefault();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (evt) {
      canvas.addEventListener(evt, function () {
        if (!drawing) return;
        drawing = false;
        onChange && onChange(self.strokes);
      });
    });

    requestAnimationFrame(function () { self.resize(); });
    window.addEventListener('resize', function () { self.resize(); });
  };

  /* ------------------------------------------------------------ fuel gauge */

  /* A real gauge face plus five labelled buttons. The gauge is the picture;
     the buttons are the control, so it works with a keyboard too. */
  C.fuelGauge = function (opts) {
    var value = opts.value === undefined ? 1 : opts.value;
    var readOnly = !!opts.readOnly;
    var wrap = U.el('div', { class: 'gauge' + (readOnly ? ' gauge--ro' : '') });
    var face = U.el('div', { class: 'gauge__face' });
    var row = U.el('div', { class: 'gauge__stops', role: readOnly ? null : 'radiogroup', 'aria-label': 'Fuel level' });
    var buttons = [];

    /* SVG angles run clockwise from +x with +y pointing down, so an arc across
       the top of the face sweeps 207 to 333 degrees - 126 degrees of travel. */
    var A0 = Math.PI * 1.15, A1 = Math.PI * 1.85;
    function pt(cx, cy, r, t) {
      var a = A0 + (A1 - A0) * t;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    }
    function arcPath(cx, cy, r, t0, t1) {
      var p0 = pt(cx, cy, r, t0), p1 = pt(cx, cy, r, t1);
      var large = (A1 - A0) * (t1 - t0) > Math.PI ? 1 : 0;
      return 'M ' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) +
             ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2);
    }

    function paint() {
      var cx = 100, cy = 84, r = 60;
      var ticks = '';
      [0, 0.25, 0.5, 0.75, 1].forEach(function (t) {
        var a = pt(cx, cy, r + 3, t), b = pt(cx, cy, r - 9, t);
        ticks += '<line x1="' + a[0].toFixed(2) + '" y1="' + a[1].toFixed(2) + '" x2="' + b[0].toFixed(2) +
                 '" y2="' + b[1].toFixed(2) + '" class="gauge__tick"/>';
      });
      var nd = pt(cx, cy, r - 14, value);
      var low = value <= 0.25;
      face.innerHTML =
        '<svg viewBox="0 0 200 126" role="img" aria-label="Fuel gauge reading ' + U.fuelLabel(value) + '">' +
        '<path d="' + arcPath(cx, cy, r, 0, 1) + '" class="gauge__track"/>' +
        '<path d="' + arcPath(cx, cy, r, 0, Math.max(value, 0.001)) + '" class="gauge__fill' + (low ? ' is-low' : '') + '"/>' +
        ticks +
        '<line x1="' + cx + '" y1="' + cy + '" x2="' + nd[0].toFixed(2) + '" y2="' + nd[1].toFixed(2) + '" class="gauge__needle"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="6" class="gauge__hub"/>' +
        '<text x="34" y="100" class="gauge__end">E</text>' +
        '<text x="166" y="100" class="gauge__end">F</text>' +
        '<text x="100" y="118" class="gauge__read">' + U.fuelLabel(value) + '</text>' +
        '</svg>';
      buttons.forEach(function (b) {
        var on = Math.abs(b.dataset.v - value) < 0.01;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
      });
    }

    U.FUEL.forEach(function (f) {
      if (readOnly) return;
      var b = U.el('button', {
        type: 'button', class: 'gauge__stop', role: 'radio', dataset: { v: f.v },
        'aria-label': f.label, text: f.short
      });
      b.addEventListener('click', function () { value = f.v; paint(); opts.onChange && opts.onChange(value); });
      b.addEventListener('keydown', function (e) {
        var i = U.FUEL.indexOf(f), next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(U.FUEL.length - 1, i + 1);
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(0, i - 1);
        if (next === null) return;
        e.preventDefault();
        value = U.FUEL[next].v; paint();
        buttons[next].focus();
        opts.onChange && opts.onChange(value);
      });
      buttons.push(b);
      row.appendChild(b);
    });

    wrap.appendChild(face);
    if (!readOnly) wrap.appendChild(row);
    paint();
    wrap.setValue = function (v) { value = v; paint(); };
    wrap.getValue = function () { return value; };
    return wrap;
  };

  root.NRT.canvas = C;
})(window);
