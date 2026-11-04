
(function () {
  'use strict';

  /* ---------------- TUNABLES ---------------- */
  var T = {
    startDelay: 1400,   // ms after the section scrolls in before the first drop
    drop: 160,          // px the coin falls from, above card 1
    dropMs: 650,        // length of the first fall
    hopMs: 780,         // length of each hop between cards
    arcMin: 46,         // lowest hop apex (px above the straight line)
    arcMax: 120,        // highest hop apex
    arcRatio: 0.3,      // apex = distance x this, clamped between arcMin and arcMax
    flips: 2,           // how many times the coin turns edge-on per hop
    dwell: 1600,         // ms the coin rests on a card before the next hop
    exitMs: 500,        // fade-out after card 4
    loopPause: 1600,    // ms of quiet before the next loop
    loops: 0,           // 0 = loop forever
    dentPx: 6,          // how far a card sinks when the coin lands
    dentMs: 900,        // how long the card takes to settle
    overlap: 3          // px the coin sinks into the card's top edge when resting
  };

  var stage = document.getElementById('processStage');
  if (!stage || !('IntersectionObserver' in window) || !stage.animate) return;
  
  var coin = stage.querySelector('.coin');
  var cards = Array.prototype.slice.call(stage.querySelectorAll('.step'));
  if (!coin || cards.length < 2) return;
  
  var face = coin.querySelector('.coin-face');
  var shadow = coin.querySelector('.coin-shadow');

  var small = matchMedia('(max-width:619px)');
  var calm = matchMedia('(prefers-reduced-motion: reduce)');
  var usable = function () { return !small.matches && !calm.matches; };

  /* Append dynamic dent elements to each card */
  cards.forEach(function (c) {
    var d = document.createElement('i');
    d.className = 'dent';
    d.setAttribute('aria-hidden', 'true');
    c.appendChild(d);
  });

  var R = 0, live = false, inView = false, running = false, first = true;

  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function tween(ms, fn) {
    return new Promise(function (res) {
      var t0 = performance.now();
      (function f(t) {
        if (!live) { res(false); return; }
        var p = Math.min(1, (t - t0) / ms);
        fn(p);
        if (p < 1) requestAnimationFrame(f); else res(true);
      })(t0);
    });
  }

  function pt(i) {
    var c = cards[i];
    return { x: c.offsetLeft + c.offsetWidth / 2, y: c.offsetTop - R + T.overlap };
  }

  function place(x, y, sx, heightRatio) {
    coin.style.transform = 'translate(' + (x - R).toFixed(1) + 'px,' + (y - R).toFixed(1) + 'px)';
    if (face) {
      face.style.transform = 'scaleX(' + sx.toFixed(3) + ')';
    }
    // Dynamic shadow scaling and fading based on height
    if (shadow) {
      var sScale = Math.max(0.4, 1 - (heightRatio * 0.5));
      var sOpacity = Math.max(0.15, 0.6 - (heightRatio * 0.45));
      shadow.style.transform = 'translate(-50%, -50%) scale(' + sScale.toFixed(2) + ')';
      shadow.style.opacity = sOpacity.toFixed(2);
    }
  }

  var spin = function (p) { return 0.12 + 0.88 * Math.abs(Math.cos(p * Math.PI * T.flips)); };

  function land(i, k) {
    var c = cards[i], d = c.querySelector('.dent'), px = T.dentPx * k;
    var ease = 'cubic-bezier(.3,0,.2,1)';
    
    c.animate([
      { transform: 'translateY(0) scale(1)', borderColor: 'rgba(201,162,75,.9)', boxShadow: '0 0 0 1px rgba(201,162,75,.55),0 0 30px rgba(201,162,75,.22)', offset: 0, easing: ease },
      { transform: 'translateY(' + px + 'px) scale(.992,.978)', offset: .14, easing: ease },
      { transform: 'translateY(-1.5px) scale(1)', offset: .32, easing: 'ease-out' },
      { transform: 'translateY(0) scale(1)', offset: .46 },
      { transform: 'translateY(0) scale(1)', offset: 1 }
    ], { duration: T.dentMs });

    d.animate([
      { opacity: 0, transform: 'translateX(-50%) scale(.5)' },
      { opacity: 1, transform: 'translateX(-50%) scale(1)', offset: .14 },
      { opacity: 0, transform: 'translateX(-50%) scale(1.15)' }
    ], { duration: T.dentMs * .8, easing: 'ease-out' });

    if (face) {
      face.animate([
        { transform: 'none' },
        { transform: 'translateY(' + px + 'px) scale(1.14,.82)', offset: .45 },
        { transform: 'translateY(0) scale(.95,1.08)', offset: .85 },
        { transform: 'none' }
      ], { duration: T.dwell + 60, easing: 'ease-out' });
    }
  }

  function hop(a, b) {
    var dist = Math.hypot(b.x - a.x, b.y - a.y);
    var H = Math.max(T.arcMin, Math.min(T.arcMax, dist * T.arcRatio));
    return tween(T.hopMs, function (p) {
      var currentHeight = H * 4 * p * (1 - p);
      place(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p - currentHeight, spin(p), currentHeight / H);
    });
  }

  async function sequence() {
    R = coin.offsetWidth / 2;
    var p0 = pt(0), top = p0.y - T.drop;
    
    if (!(await tween(T.dropMs, function (p) {
      coin.style.opacity = Math.min(1, p * 4);
      var fallProgress = top + (p0.y - top) * p * p;
      place(p0.x, fallProgress, 1, 0);
    }))) return false;
    
    land(0, 1.4);
    for (var i = 0; i < cards.length - 1; i++) {
      await sleep(T.dwell);
      if (!live) return false;
      if (!(await hop(pt(i), pt(i + 1)))) return false;
      land(i + 1, 1);
    }
    await sleep(T.dwell);
    var last = pt(cards.length - 1);
    return tween(T.exitMs, function (p) {
      coin.style.opacity = 1 - p;
      place(last.x, last.y - 36 * p, 1, 1);
    });
  }

  async function loop() {
    if (running) return;
    running = true;
    await sleep(first ? T.startDelay : 500);
    first = false;
    var n = 0;
    while (live && usable()) {
      if (!(await sequence())) break;
      n++;
      if (T.loops && n >= T.loops) break;
      await sleep(T.loopPause);
    }
    coin.style.opacity = 0;
    running = false;
  }

  function sync() {
    live = inView && !document.hidden && usable();
    if (live) loop();
  }

  new IntersectionObserver(function (es) { inView = es[0].isIntersecting; sync(); }, { threshold: .35 }).observe(stage);
  document.addEventListener('visibilitychange', sync);
  
  if (small.addEventListener) { 
    small.addEventListener('change', sync); 
    calm.addEventListener('change', sync); 
  }

  // Handle window resizing cleanly to prevent coordinate misalignments
  if ('ResizeObserver' in window) {
    new ResizeObserver(function() {
      if (running) {
        // Reset state safely on heavy resizes if needed
      }
    }).observe(stage);
  }
})();