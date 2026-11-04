/* =====================================================================
   sections.js  |  ADDITIONS ONLY. Load with:  <script src="js/sections.js" defer></script>
   Does not touch js/script.js. Safe on pages that have no hero or quiz.
   ===================================================================== */
(function () {
  if (!document.getElementById('pre')) { try { sessionStorage.setItem('dmassPreloaded','true'); } catch(e){} }
  'use strict';

  /* ---------------- TUNABLES ---------------- */
  var CFG = {
    whatsapp: '263776456095',     // digits only, no + or spaces
    endpoint: '',                 // form backend URL. Empty = forms hand off to WhatsApp
    readyMin: 5,                  // score 5 to 6 = Ready
    almostMin: 3,                 // score 3 to 4 = Almost there, 0 to 2 = Not yet
    autoAdvanceMs: 280,           // pause before a tapped answer moves on
    countMs: 1400,                // stat counter duration
    revealMargin: '0px 0px -8% 0px', // reveal when an element is this far into the screen
    floatAfterPx: 500             // WhatsApp button appears after this much scroll
  };

  /* quiz copy lives here so you can edit it without touching logic */
  var Q = [
    { id: 'need', q: 'What do you need funding for?', type: 'radio', opts: [
      { v: 'cash',      t: 'Day-to-day cash flow, such as stock, salaries or suppliers', f: 'Working Capital or Overdraft funding' },
      { v: 'assets',    t: 'Vehicles, machinery or equipment',                           f: 'Asset-Based or Vehicle Asset finance' },
      { v: 'materials', t: 'Buying raw materials from suppliers',                        f: 'a Letter of Credit facility' },
      { v: 'contract',  t: 'Winning or delivering a large contract',                     f: 'a Bank Guarantee facility' },
      { v: 'unsure',    t: 'I am not sure yet',                                          f: '' }
    ]},
    { id: 'amount', q: 'How much do you need?', type: 'radio', opts: [
      { v: 's',  t: 'Under $20,000',        fee: 'flat' },
      { v: 'm',  t: '$20,000 to $99,999',   fee: 'flat' },
      { v: 'l',  t: '$100,000 to $500,000', fee: 'pct' },
      { v: 'xl', t: 'Over $500,000',        fee: 'pct' },
      { v: 'u',  t: 'Not sure yet',         fee: 'unsure' }
    ]},
    { id: 'have', q: 'What do you already have in place?', hint: 'Select all that apply.', type: 'check', opts: [
      { v: 'reg',  t: 'Registered business with company documents' },
      { v: 'age',  t: 'Operating for 12 months or more' },
      { v: 'bank', t: 'Business bank account with 6 months or more of activity' },
      { v: 'fin',  t: 'Financial statements or management accounts from the past year' },
      { v: 'tax',  t: 'Tax affairs in order with ZIMRA' },
      { v: 'sec',  t: 'Assets, equipment or stock that could back a loan' },
      { v: 'none', t: 'None of these yet', none: true }
    ]}
  ];
  var FEE = {
    flat:   'Funding under $100,000: a flat fee of $3,000, paid 50% to start and 50% when your offer letter is issued.',
    pct:    'Funding of $100,000 and above: a percentage of the amount secured, up to 5%, agreed with you in writing before we begin.',
    unsure: 'Our fee depends on the amount. We confirm it in writing before we begin.'
  };
  /* hero card name (from script.js) -> Q1 answer, used by the "Check eligibility" chip */
  var CHIP_MAP = { 'Working Capital': 'cash', 'Overdraft': 'cash', 'Asset-Based Finance': 'assets',
                   'Vehicle Finance': 'assets', 'Letter of Credit': 'materials', 'Guarantee': 'contract' };

  /* ---------------- helpers ---------------- */
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.setAttribute('data-rv', '1');   // tells the head fallback that this script ran

  function wa(msg) { return 'https://wa.me/' + CFG.whatsapp + (msg ? '?text=' + encodeURIComponent(msg) : ''); }

  /* ---------------- whatsapp links ---------------- */
  $$('[data-wa]').forEach(function (a) {
    a.href = wa(a.getAttribute('data-wa'));
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* ---------------- mobile menu ---------------- */
  var mb = $('.menu-btn'), nav = $('#siteNav');
  if (mb && nav) {
    var setMenu = function (o) { nav.classList.toggle('open', o); mb.setAttribute('aria-expanded', String(o)); };
    mb.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------------- floating whatsapp + year ---------------- */
  var fl = $('.wa-float');
  if (fl) {
    var onScroll = function () { fl.classList.toggle('show', window.scrollY > CFG.floatAfterPx); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  $$('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });

  /* ---------------- scroll reveal with stagger ----------------
     [data-reveal]            reveals itself (optional value: left | right | fade)
     [data-stagger]           its direct children reveal; siblings that enter together are staggered */
  function count(el) {
    if (el._c) return; el._c = 1;
    var to = parseFloat(el.getAttribute('data-count')), dec = +(el.getAttribute('data-dec') || 0),
        pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '';
    var fmt = function (v) { return pre + v.toFixed(dec) + suf; };
    if (reduce) { el.textContent = fmt(to); return; }
    var t0 = performance.now();
    (function tick(t) {
      var p = Math.min(1, (t - t0) / CFG.countMs), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * e);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  function show(el) {
    el.classList.add('in');
    if (el.hasAttribute('data-count')) count(el);
    $$('[data-count]', el).forEach(count);
  }
  var targets = $$('[data-reveal]');
  $$('[data-stagger]').forEach(function (p) { targets = targets.concat(Array.prototype.slice.call(p.children)); });

  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(show);
  } else {
    var io = new IntersectionObserver(function (entries) {
      var hits = entries.filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) {
          var A = a.boundingClientRect, B = b.boundingClientRect;
          return (A.top - B.top) || (A.left - B.left);
        });
      hits.forEach(function (e, i) {
        e.target.style.setProperty('--i', i);   // position in this batch drives the stagger delay
        show(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0, rootMargin: CFG.revealMargin });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------------- lead forms ---------------- */
  function labelFor(form, name) {
    var el = form.elements[name];
    if (el && el.length && !el.tagName) el = el[0];
    var f = el && el.closest && el.closest('.fld');
    var l = f && (f.querySelector('legend') || f.querySelector('span'));
    return l ? l.textContent.trim() : name;
  }
  function bindForm(form, extra) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var fd = new FormData(form);
      if (fd.get('website')) return;                       // honeypot
      var data = {}, lines = [];
      fd.forEach(function (v, k) {
        v = String(v).trim();
        if (k === 'website' || !v) return;
        data[k] = v;
        lines.push(labelFor(form, k) + ': ' + v);
      });
      var summary = extra ? extra() : '';
      var msg = (form.getAttribute('data-intro') || 'Hello DmassWay.') + '\n' + (summary ? summary + '\n' : '') + lines.join('\n');
      var out = $('.form-msg', form), btn = $('[type=submit]', form);

      if (!CFG.endpoint) {                                  // no backend yet: hand the details to WhatsApp
        window.open(wa(msg), '_blank', 'noopener');
        out.textContent = 'WhatsApp is opening with your details. Press send there and we will reply.';
        return;
      }
      btn.disabled = true; out.textContent = 'Sending...';
      fetch(CFG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ form: form.id || 'lead', page: location.href, summary: summary, fields: data })
      }).then(function (r) {
        if (!r.ok) throw new Error('bad status');
        out.textContent = 'Thank you. We will respond on your preferred channel shortly.';
        form.reset();
      }).catch(function () {
        out.innerHTML = 'That did not go through. Please <a href="' + wa(msg) + '" target="_blank" rel="noopener">send it on WhatsApp</a> instead.';
        btn.disabled = false;
      });
    });
  }
  $$('form[data-lead]').forEach(function (f) { if (f.id !== 'rcForm') bindForm(f); });

  /* ---------------- readiness check ---------------- */
  var rc = $('#rc');
  if (rc) {
    var intro = $('#rcIntro'), app = $('#rcApp');
    var ans, step;

    var find = function (qi, v) { return Q[qi].opts.filter(function (o) { return o.v === v; })[0]; };

    var start = function (pre) {
      ans = { need: pre || null, amount: null, have: [] };
      intro.hidden = true; app.hidden = false;
      go(0);
    };

    var go = function (n) {
      step = n;
      if (n > 2) return result();
      var q = Q[n], sel = n === 2 ? ans.have : [ans[q.id]];
      var html = '<div class="rc-step" tabindex="-1">' +
        '<div class="rc-top"><span class="rc-count">Question ' + (n + 1) + ' of 3</span>' +
        '<div class="rc-bar"><i style="width:' + ((n + 1) / 3 * 100) + '%"></i></div></div>' +
        '<fieldset><legend>' + q.q + '</legend>' + (q.hint ? '<p class="hint">' + q.hint + '</p>' : '') + '<div class="opts">';
      q.opts.forEach(function (o) {
        html += '<label class="opt' + (q.type === 'check' ? ' chk' : '') + '"><input type="' + (q.type === 'check' ? 'checkbox' : q.type) + '" name="' + q.id + '" value="' + o.v + '"' +
          (sel.indexOf(o.v) > -1 ? ' checked' : '') + '><span>' + o.t + '</span></label>';
      });
      html += '</div></fieldset><div class="rc-nav">' +
        '<button type="button" class="link-btn" data-act="back">' + (n ? 'Back' : 'Cancel') + '</button>' +
        '<button type="button" class="btn btn-gold" data-act="next"' + (sel.length ? '' : ' disabled') + '>' + (n === 2 ? 'See My Result' : 'Next') + '</button></div></div>';
      app.innerHTML = html;
      $('.rc-step', app).focus({ preventScroll: true });
    };

    var advance = function () { go(step + 1); };

    app.addEventListener('change', function (e) {
      var i = e.target; if (i.tagName !== 'INPUT') return;
      if (step === 2) {
        var none = Q[2].opts[6].v;
        if (i.value === none && i.checked) { $$('input', app).forEach(function (x) { if (x !== i) x.checked = false; }); }
        else if (i.checked) { $$('input', app).forEach(function (x) { if (x.value === none) x.checked = false; }); }
        ans.have = $$('input:checked', app).map(function (x) { return x.value; });
        $('[data-act=next]', app).disabled = !ans.have.length;
      } else {
        ans[Q[step].id] = i.value;
        $('[data-act=next]', app).disabled = false;
      }
    });
    app.addEventListener('click', function (e) {
      var i = e.target;
      if (i.tagName === 'INPUT' && i.type === 'radio' && e.detail > 0) {   // real tap or click, not arrow keys
        var from = step;
        setTimeout(function () { if (step === from) advance(); }, CFG.autoAdvanceMs);
        return;
      }
      var b = i.closest('[data-act]'); if (!b) return;
      if (b.getAttribute('data-act') === 'next') advance();
      if (b.getAttribute('data-act') === 'back') {
        if (step === 0) { app.hidden = true; intro.hidden = false; } else go(step - 1);
      }
      if (b.getAttribute('data-act') === 'restart') start();
      if (b.getAttribute('data-act') === 'skip') {
        $('.rc-lead', app).innerHTML = '<p class="txt">No problem. Message us any time on <a href="' + wa('Hello DmassWay, I completed the readiness check.') + '" target="_blank" rel="noopener" style="color:var(--gold)">WhatsApp</a> or use the buttons above.</p>';
      }
    });

    var result = function () {
      var have = ans.have.filter(function (v) { return v !== 'none'; });
      var score = have.length;
      var need = find(0, ans.need), amt = find(1, ans.amount);
      var fac = need && need.f;
      var band = score >= CFG.readyMin ? 'ready' : score >= CFG.almostMin ? 'almost' : 'not';
      var label = { ready: 'Ready', almost: 'Almost there', not: 'Not yet' }[band];
      var gaps = Q[2].opts.filter(function (o) { return !o.none && have.indexOf(o.v) < 0; });
      var summary = 'Readiness check result: ' + label + ' (' + score + ' of 6). Funding for: ' + need.t + '. Amount: ' + amt.t + '.';
      var tailFac = fac ? ' for ' + fac + '.' : '.';
      var noFac = ' We will recommend the best-fit facility when we speak.';
      var title, body, extraList = '', ctas;
      var A = function (txt, href, cls, isWa) {
        return '<a class="btn ' + cls + '" href="' + href + '"' + (isWa ? ' target="_blank" rel="noopener"' : '') + '>' + txt + '</a>';
      };

      if (band === 'ready') {
        title = 'You look well placed for bank funding.';
        body = 'You already have most of what banks look for. Next, we review your documents and build a strong application' + (fac ? tailFac : '.' + noFac);
        ctas = A('Book Your Consultation', 'about.html#consultation', 'btn-gold') + A('Chat on WhatsApp', wa('Hello DmassWay. ' + summary), 'btn-ghost', 1);
      } else if (band === 'almost') {
        title = 'You are closer than you think.';
        body = 'You have a solid base. A few gaps, listed below, are what most often hold applications back. We close them, then ' + (fac ? 'take you to ' + fac + '.' : 'we will recommend the best-fit facility when we speak.');
        extraList = '<ul class="rc-gaps">' + gaps.map(function (g) { return '<li>' + g.t + '</li>'; }).join('') + '</ul>';
        ctas = A('Get Your Document Checklist', wa('Hello DmassWay. ' + summary + ' Please send me my document checklist.'), 'btn-gold', 1) + A('Talk to Us About Next Steps', 'about.html#consultation', 'btn-ghost');
      } else {
        title = 'Let’s build your foundation first.';
        body = 'Banks need a few things in place before they will look at an application. That is fixable, and we do it every day: financial statements, tax compliance, clean records. Get these right and you apply from strength.';
        ctas = A('Talk to Us on WhatsApp', wa('Hello DmassWay. ' + summary), 'btn-gold', 1) + A('Request an Accounting Quote', wa('Hello DmassWay. ' + summary + ' I would like a quote for accounting and ZIMRA support.'), 'btn-ghost', 1);
      }
      var fee = band === 'not' ? '' : '<p class="rc-fee">' + FEE[amt.fee] + '</p>';
      var meter = '<div class="meter" aria-hidden="true">' + [0, 1, 2, 3, 4, 5].map(function (i) { return '<i' + (i < score ? ' class="on"' : '') + '></i>'; }).join('') + '</div>';

      app.innerHTML = '<div class="rc-step" tabindex="-1">' +
        '<span class="pill">' + label + '</span>' + meter +
        '<p class="small" style="margin:0 0 18px">' + score + ' of 6 in place</p>' +
        '<h2>' + title + '</h2><p class="lead">' + body + '</p>' + extraList + fee +
        '<div class="btn-row">' + ctas + '</div>' +
        '<p class="small" style="margin-top:16px">This is an indicative result only. The bank makes the final decision.</p>' +
        '<div class="rc-lead"><h3>Want us to send you your next steps?</h3>' +
        '<form id="rcForm" data-lead data-intro="Hello DmassWay, please send me my readiness check next steps." novalidate>' +
        '<div class="form-grid">' +
        '<label class="fld"><span>Name</span><input name="name" autocomplete="name" required></label>' +
        '<label class="fld"><span>WhatsApp number</span><input name="whatsapp" type="tel" inputmode="tel" autocomplete="tel" required></label>' +
        '<label class="fld"><span>Business name</span><input name="business" autocomplete="organization" required></label>' +
        '<label class="fld"><span>Industry (optional)</span><input name="industry"></label>' +
        '<div class="hp" aria-hidden="true"><input name="website" tabindex="-1" autocomplete="off"></div></div>' +
        '<div class="btn-row"><button class="btn btn-gold" type="submit">Send Me My Results</button>' +
        '<button class="link-btn" type="button" data-act="skip">No thanks, I’ll contact you myself</button></div>' +
        '<p class="form-msg" role="status"></p>' +
        '<p class="small">Your information stays confidential and is used only to respond to you.</p></form></div>' +
        '<div class="rc-nav"><button type="button" class="link-btn" data-act="restart">Start again</button></div></div>';

      var f = $('#rcForm', app);
      f.removeAttribute('novalidate');
      bindForm(f, function () { return summary; });
      $('.rc-step', app).focus({ preventScroll: true });
      rc.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    };

    $('#rcStart').addEventListener('click', function () { start(); });

    /* the hero chip ("Check eligibility: Working Capital") starts the check with that need pre-selected */
    var chip = $('#chip');
    if (chip) chip.addEventListener('click', function () {
      var name = chip.textContent.replace('Check eligibility:', '').trim();
      start(CHIP_MAP[name] || null);
    });
  }
})();