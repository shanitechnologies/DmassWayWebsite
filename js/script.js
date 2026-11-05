

(function(){
  /* ---------- Preloader: min 1200ms, assets loaded, and fonts ready ---------- */
  if (document.documentElement.classList.contains('no-pre')) {
  document.body.classList.add('ready');          // hero fades in straight away
  var p0 = document.getElementById('pre'); if (p0) p0.remove();
  return;                                        // skips typewriter and timers
}
  var MIN_MS = 1200;
  var minT = new Promise(function(r){ setTimeout(r, MIN_MS); });
  var loaded = new Promise(function(r){ document.readyState === 'complete' ? r() : window.addEventListener('load', r); });
  var fonts = (document.fonts && document.fonts.ready) || Promise.resolve();



  /* ---------- Preloader Exit Trigger ---------- */
  Promise.all([minT, loaded, fonts]).then(function(){
    var preloader = document.getElementById('pre');
    if (preloader) {
      preloader.classList.add('slide-up'); // Matches your CSS transition class
    }
    setTimeout(function(){ 
      document.body.classList.add('ready'); 
    }, 350);
    setTimeout(function(){ 
      var p = document.getElementById('pre');
      if (p) p.style.display = 'none'; 
    }, 900);
  });
})();

  (function(){
  /* ---------- Services ---------- */
  var S=[
    {n:'Working Capital',c:'#59ea3c',i:'i-wc'},
    {n:'Overdraft',c:'#2072c5',i:'i-od'},
    {n:'Asset-Based Finance',c:'#df0c0c',i:'i-ab'},
    {n:'Vehicle Finance',c:'#e072c8',i:'i-vf'},
    {n:'Letter of Credit',c:'#772ee5',i:'i-lc'},
    {n:'Guarantee',c:'#fbf133',i:'i-gu'}
  ];
    var N=S.length;
    var GAP=198;
    var DROP=.15;
    var TUCK=58;
    var HOLD=2200;    /* ms a card stays in the portfolio */
    var MOVE=900;     /* ms for each slide to the next card */
    var SWITCH=.3;    /* portfolio takes the card's identity when within this distance of centre (0.1 = later, 0.5 = halfway) */          
    var arc=document.getElementById('arc'),stage=document.getElementById('stage'),
      folder=document.getElementById('folder'),chip=document.getElementById('chip'),
      fIcon=document.getElementById('fIcon'),fTitle=document.getElementById('fTitle').children,
      root=document.documentElement,mm=matchMedia('(max-width:919px)');
  var NS='http://www.w3.org/2000/svg',cards=[];

  S.forEach(function(s,i){
    var b=document.createElement('button');b.className='card';b.type='button';
    b.style.setProperty('--cc',s.c);
    b.innerHTML='<svg><use href="#'+s.i+'"/></svg>'+s.n;
    b.addEventListener('mouseenter',function(){paused=true});
    b.addEventListener('mouseleave',function(){paused=false});
    b.addEventListener('click',function(){select(i)});
    arc.appendChild(b);cards.push(b);
  });

  var pos=0,paused=false,tween=null,hold=0,active=-1,last=performance.now();
  function wrap(d){return((d+N/2)%N+N)%N-N/2}

  function setActive(i){
    if(i===active)return;active=i;var s=S[i];
    root.style.setProperty('--c',s.c);
    fIcon.setAttribute('href','#'+s.i);
    var w=s.n.split(' '),a=s.n,b='';
    if(w.length>1){var best=1,diff=1e9;for(var k=1;k<w.length;k++){var d=Math.abs(w.slice(0,k).join(' ').length-w.slice(k).join(' ').length);if(d<diff){diff=d;best=k}}
      a=w.slice(0,best).join(' ');b=w.slice(best).join(' ')}
    fTitle[0].textContent=a;fTitle[1].textContent=b;
    chip.textContent='Check eligibility: '+s.n;
    cards.forEach(function(c,j){c.classList.toggle('active',j===i)});
  }

  function layout(){
    if(mm.matches){cards.forEach(function(c){c.style.transform='';c.style.opacity='';c.style.zIndex=''});arc.style.top='';return}
    var W=stage.clientWidth,sp=Math.min(cards[0].offsetWidth+GAP,W/4.2),k=sp*DROP;
    arc.style.top=(folder.offsetHeight-TUCK)+'px';
    cards.forEach(function(c,i){
      var t=wrap(i-pos),a=Math.abs(t);
      var o=Math.max(0,Math.min(1,1-(a-2.1)/.9));
      c.style.transform='translate(calc(-50% + '+(t*sp).toFixed(1)+'px),'+(k*t*t).toFixed(1)+'px)';
      c.style.opacity=o.toFixed(2);
      c.style.pointerEvents=o<.25?'none':'auto';
      c.style.zIndex=Math.round(10-a*2);
    });
    var r=Math.round(pos);
    if(Math.abs(pos-r)<SWITCH)setActive(((r%N)+N)%N);
  }

  function select(i){
    if(mm.matches){setActive(i);cards[i].scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});return}
    tween={from:pos,delta:wrap(i-pos),e:0,dur:650};
  }

  function frame(now){
  var dt=Math.min(50,now-last);last=now;            /* ms */
  if(!mm.matches){
    if(tween){
      tween.e+=dt;
      var p=Math.min(1,tween.e/tween.dur),e=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
      pos=tween.from+tween.delta*e;
      if(p>=1){pos=tween.from+tween.delta;tween=null;hold=0}
    }else if(!paused){
      hold+=dt;
      if(hold>=HOLD)tween={from:pos,delta:1,e:0,dur:MOVE};
    }
    layout();
  }
  requestAnimationFrame(frame);
}
  mm.addEventListener&&mm.addEventListener('change',function(){setActive(active<0?0:active);layout()});
  setActive(0);layout();requestAnimationFrame(frame);
})();

(function () {
  'use strict';
  var heading = document.getElementById('typewriter-heading');
  if (!heading || !('IntersectionObserver' in window)) return;

  var fullText = heading.textContent;
  heading.textContent = ''; // Clear text initially
  var index = 0;
  var typed = false;

  function typeWriter() {
    if (index < fullText.length) {
      heading.textContent += fullText.charAt(index);
      index++;
      setTimeout(typeWriter, 40); // Speed of typing in milliseconds (lower = faster)
    } else {
      // Remove cursor after typing finishes (optional)
      // heading.style.borderRight = 'none';
    }
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !typed) {
        typed = true;
        setTimeout(typeWriter, 300); // Small delay after scrolling into view
      }
    });
  }, { threshold: 0.5 });

  observer.observe(heading);
})();

(function () {
  'use strict';
  var heading = document.getElementById('typewriter-readiness');
  if (!heading || !('IntersectionObserver' in window)) return;

  var fullText = heading.textContent;
  heading.textContent = ''; // Clear text initially
  var index = 0;
  var typed = false;

  function typeWriter() {
    if (index < fullText.length) {
      heading.textContent += fullText.charAt(index);
      index++;
      setTimeout(typeWriter, 40); // Typing speed in milliseconds
    }
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !typed) {
        typed = true;
        setTimeout(typeWriter, 300); // Delay after scrolling into view
      }
    });
  }, { threshold: 0.5 });

  observer.observe(heading);
})();

(function(){
  'use strict';

  var preloader = document.getElementById('pre');

  /* ---------- Instant Session Check ---------- */
  if (sessionStorage.getItem('dmassPreloaded')) {
    if (preloader) preloader.style.display = 'none';
    document.documentElement.style.visibility = 'visible'; // Ensures immediate paint
    document.addEventListener('DOMContentLoaded', function() {
      document.body.classList.add('ready');
    });
    return; // Stops execution immediately so no animation triggers
  }

  /* ---------- Preloader: min 1200ms, assets loaded, and fonts ready ---------- */
  var MIN_MS = 1200;
  var minT = new Promise(function(r){ setTimeout(r, MIN_MS); });
  var loaded = new Promise(function(r){ document.readyState === 'complete' ? r() : window.addEventListener('load', r); });
  var fonts = (document.fonts && document.fonts.ready) || Promise.resolve();

  /* ---------- Typewriter Effect ---------- */
  const textToType = "DMASSWAY";
  const typeTarget = document.getElementById('typewriter');
  let charIdx = 0;

  const typing = setInterval(() => {
    if (typeTarget && charIdx < textToType.length) {
      typeTarget.textContent += textToType.charAt(charIdx);
      charIdx++;
    } else {
      clearInterval(typing);
    }
  }, 100);

  /* ---------- Preloader Exit Trigger ---------- */
  Promise.all([minT, loaded, fonts]).then(function(){
    // Mark as preloaded for this browser session immediately
    try { sessionStorage.setItem('dmassPreloaded', 'true'); } catch (e) {}

    if (preloader) {
      preloader.classList.add('slide-up');
    }
    setTimeout(function(){ 
      document.body.classList.add('ready'); 
    }, 350);
    setTimeout(function(){ 
      if (preloader) preloader.style.display = 'none'; 
    }, 900);
  });
})();