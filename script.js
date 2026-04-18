(function () {
  'use strict';

  // Hero — frame scrubber
  var FRAME_COUNT = 161;
  var LOGO_START  = 0.82; // logo fades in at this scroll fraction

  var heroPin     = document.getElementById('hero-pin');
  var canvas      = document.getElementById('hero-canvas');
  var logoOverlay = document.getElementById('hero-logo-overlay');
  var heroHint    = document.getElementById('hero-hint');

  if (heroPin && canvas) {
    var ctx    = canvas.getContext('2d');
    var frames = new Array(FRAME_COUNT);
    var loaded = 0;
    var drawnIndex = -1;

    function frameSrc(i) {
      return 'frames/frame-' + String(i + 1).padStart(3, '0') + '.jpg';
    }

    function fitDraw(img) {
      var cw = canvas.width, ch = canvas.height;
      var iw = img.naturalWidth, ih = img.naturalHeight;
      // Cover: fill canvas fully, crop overflow — no black letterbox.
      var scale = Math.max(cw / iw, ch / ih);
      var dw = iw * scale, dh = ih * scale;
      var dx = (cw - dw) / 2;
      var dy = (ch - dh) / 2;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    function drawFrame(index) {
      if (index === drawnIndex) return;
      var img = frames[index];
      if (img && img.complete && img.naturalWidth) {
        fitDraw(img);
        drawnIndex = index;
      }
    }

    function resizeCanvas() {
      // Use window dimensions directly — most reliable across mobile browsers
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      if (drawnIndex >= 0 && frames[drawnIndex]) fitDraw(frames[drawnIndex]);
    }

    var navLogo = document.querySelector('.nav__logo');

    function updateHero() {
      var maxScroll = heroPin.offsetHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      var p = Math.max(0, Math.min(1, window.scrollY / maxScroll));

      var idx = Math.min(Math.round(p * (FRAME_COUNT - 1)), FRAME_COUNT - 1);
      drawFrame(idx);

      // Logo fades in over last ~18% of scroll
      var logoP = Math.max(0, (p - LOGO_START) / (1 - LOGO_START));
      logoOverlay.style.opacity = logoP.toFixed(3);

      // Hint fades out quickly
      heroHint.style.opacity = Math.max(0, 1 - p * 7).toFixed(2);

      // Nav logo: hide only while the hero's big logo is on screen
      if (navLogo) {
        var pinBottom = heroPin.getBoundingClientRect().bottom;
        var heroLogoShowing = logoP > 0.15 && pinBottom > 0;
        navLogo.classList.toggle('nav__logo--hidden', heroLogoShowing);
      }
    }

    // Preload all frames; redraw on each load so animation works during loading
    for (var fi = 0; fi < FRAME_COUNT; fi++) {
      (function(i) {
        var img = new Image();
        img.onload = function() {
          loaded++;
          // Draw frame 0 as soon as it's ready
          if (i === 0) { resizeCanvas(); drawFrame(0); }
          // Re-render current position as frames arrive
          updateHero();
        };
        img.src = frameSrc(i);
        frames[i] = img;
      })(fi);
    }

    resizeCanvas();
    window.addEventListener('scroll', updateHero, { passive: true });
    window.addEventListener('resize', function() { resizeCanvas(); updateHero(); }, { passive: true });
    updateHero();
  }

  // Scroll progress bar
  var progressBar = document.getElementById('scroll-progress-bar');
  if (progressBar) {
    function updateProgress() {
      var doc = document.documentElement;
      var max = (doc.scrollHeight - window.innerHeight) || 1;
      var p = Math.min(1, Math.max(0, window.scrollY / max));
      progressBar.style.width = (p * 100).toFixed(2) + '%';
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    updateProgress();
  }

  // Scroll reveal — fade + rise on enter
  (function(){
    if (!('IntersectionObserver' in window)) return;
    var selectors = [
      '.section-heading__title',
      '.section-heading__sub',
      '.path__heading',
      '.path__sub',
      '.bigcard__title',
      '.bigcard__desc',
      '.bigcard__list',
      '.about__tag',
      '.about__title',
      '.about__lead',
      '.about__p',
      '.faq__title',
      '.faq__item',
      '.contact__title',
      '.contact__sub',
      '.leadf__row',
      '.leadf__btn'
    ];
    var elements = [];
    selectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        el.classList.add('reveal');
        elements.push(el);
      });
    });
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    elements.forEach(function(el){ obs.observe(el); });
  })();

  // Scroll-spy: mark active nav link based on section in view
  (function(){
    var links = document.querySelectorAll('.nav__links a[href^="#"]');
    if (!links.length) return;
    var map = {
      hero: 'hero-pin',
      course: 'cards-pin',
      path: 'path-pin',
      about: 'about',
      contact: 'contact'
    };
    var sections = [];
    links.forEach(function(link){
      var id = link.getAttribute('href').slice(1);
      var targetId = map[id] || id;
      var el = document.getElementById(targetId);
      if (el) sections.push({ link: link, el: el, id: id });
    });
    function updateActive() {
      var anchor = window.scrollY + window.innerHeight * 0.35;
      var activeId = null;
      for (var i = 0; i < sections.length; i++) {
        var s = sections[i];
        var top = s.el.offsetTop;
        var bottom = top + s.el.offsetHeight;
        if (anchor >= top && anchor < bottom) { activeId = s.id; break; }
      }
      sections.forEach(function(s){ s.link.classList.toggle('is-active', s.id === activeId); });
    }
    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateActive, { passive: true });
    updateActive();
  })();

  // FAQ accordion
  document.querySelectorAll('.faq__item').forEach(function (item) {
    var btn = item.querySelector('.faq__q');
    btn.addEventListener('click', function () {
      var isOpen = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });

  // Testimonials deck — stacked card carousel
  var deck = document.getElementById('testi-deck');
  if (deck) {
    var cards = Array.from(deck.querySelectorAll('.tcard'));
    var current = 0;

    function layout() {
      cards.forEach(function (card, i) {
        var offset = (i - current + cards.length) % cards.length;
        var scale = 1 - offset * 0.04;
        var y = offset * 14;
        var z = cards.length - offset;
        card.style.transform = 'translateY(' + y + 'px) scale(' + scale + ')';
        card.style.zIndex = z;
        card.style.opacity = offset > 3 ? 0 : 1;
      });
    }

    function next() { current = (current + 1) % cards.length; layout(); }
    function prev() { current = (current - 1 + cards.length) % cards.length; layout(); }

    var auto = null;
    function startAuto() { stopAuto(); auto = setInterval(next, 6000); }
    function stopAuto() { if (auto) { clearInterval(auto); auto = null; } }

    document.getElementById('t-next').addEventListener('click', function(){ stopAuto(); next(); });
    document.getElementById('t-prev').addEventListener('click', function(){ stopAuto(); prev(); });

    layout();
    startAuto();
    deck.addEventListener('mouseenter', stopAuto);
    deck.addEventListener('touchstart', stopAuto, { passive: true });
  }

  // Lead form — handles submission via Formspree
  var form = document.getElementById('lead-form');
  var success = document.getElementById('lead-success');
  var submit = document.getElementById('lead-submit');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      submit.disabled = true;
      submit.textContent = 'שולח...';
      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (res.ok) {
          form.style.display = 'none';
          success.hidden = false;
        } else {
          submit.disabled = false;
          submit.textContent = 'שלחי לי פרטים';
          alert('שגיאה בשליחה, נסי שוב');
        }
      }).catch(function () {
        submit.disabled = false;
        submit.textContent = 'שלחי לי פרטים';
        alert('שגיאה בחיבור');
      });
    });
  }

  // Optional countdown — reads ?start=ISO date or a data attribute
  var params = new URLSearchParams(window.location.search);
  var startIso = params.get('start');
  if (startIso) {
    var cd = document.getElementById('countdown');
    if (cd) {
      cd.style.display = 'block';
      var target = new Date(startIso).getTime();
      function tick() {
        var diff = target - Date.now();
        if (diff <= 0) { cd.style.display = 'none'; return; }
        var d = Math.floor(diff / 86400000);
        var h = Math.floor((diff % 86400000) / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        document.getElementById('cd-days').textContent = String(d).padStart(2, '0');
        document.getElementById('cd-hours').textContent = String(h).padStart(2, '0');
        document.getElementById('cd-minutes').textContent = String(m).padStart(2, '0');
      }
      tick();
      setInterval(tick, 30000);
    }
  }

  // Zigzag path scroll animation
  (function () {
    var pin    = document.getElementById('path-pin');
    var stage  = document.getElementById('path-stage');
    var marker = document.getElementById('path-marker');
    var progressPath = document.getElementById('snake-progress');
    var info   = document.getElementById('path-info');
    var numEl  = document.getElementById('path-num');
    var titleEl = document.getElementById('path-title');
    var textEl  = document.getElementById('path-text');
    var nodeEls = document.querySelectorAll('.path__node');

    if (!pin || !stage || !marker || !info || !numEl || !titleEl || !textEl) return;

    var lessons = [
      { title: 'היכרות + סטוריטלינג',           text: 'פיתוח 3 רעיונות מהתוכן שלך + יסודות העריכה' },
      { title: 'עריכה למתחילים עד מתקדמים',      text: 'Keyframes, קצב ותנועה' },
      { title: 'עריכה מתקדמת',                   text: 'מסכות ואפקטים ויזואליים' },
      { title: 'AI בעריכה',                      text: 'יצירת אפקטים עם בינה מלאכותית' }
    ];

    // Waypoints in % coordinates matching the SVG path M 12,20 H 88 V 52 H 12 V 82 H 88
    var pts = [
      {x:12, y:20}, // Node 1
      {x:88, y:20}, // Node 2
      {x:88, y:52}, // corner
      {x:12, y:52}, // Node 3
      {x:12, y:82}, // corner
      {x:88, y:82}  // Node 4
    ];
    // Which pts index maps to each lesson node (0-based)
    var nodeIdx = [0, 1, 3, 5];

    var activeLesson = -1;
    var raf = null;
    var textTimer = null;
    var progressLen = 0;

    function setupProgressStroke() {
      if (!progressPath || typeof progressPath.getTotalLength !== 'function') return;
      progressLen = progressPath.getTotalLength();
      progressPath.style.stroke = '#F03228';
      progressPath.style.strokeDasharray = progressLen;
      progressPath.style.strokeDashoffset = progressLen;
      progressPath.style.transition = 'stroke-dashoffset .12s linear';
    }

    function computeSegs() {
      var W = stage.offsetWidth / 100;
      var H = stage.offsetHeight / 100;
      var segs = [];
      for (var i = 0; i < pts.length - 1; i++) {
        var dx = (pts[i+1].x - pts[i].x) * W;
        var dy = (pts[i+1].y - pts[i].y) * H;
        segs.push(Math.sqrt(dx*dx + dy*dy));
      }
      return segs;
    }

    function getState(progress) {
      var segs  = computeSegs();
      var total = segs.reduce(function(a, b) { return a + b; }, 0);
      var target = progress * total;

      // Dot x,y (in % of stage)
      var acc = 0, dotX = pts[0].x, dotY = pts[0].y;
      for (var s = 0; s < segs.length; s++) {
        if (acc + segs[s] >= target) {
          var t = segs[s] > 0 ? (target - acc) / segs[s] : 0;
          dotX = pts[s].x + t * (pts[s+1].x - pts[s].x);
          dotY = pts[s].y + t * (pts[s+1].y - pts[s].y);
          break;
        }
        acc += segs[s];
        if (s === segs.length - 1) { dotX = pts[pts.length-1].x; dotY = pts[pts.length-1].y; }
      }

      // Active lesson: highest node whose cumulative distance we've passed
      var nodeDists = nodeIdx.map(function(pi) {
        var d = 0;
        for (var i = 0; i < pi; i++) d += segs[i];
        return d;
      });
      var active = 0;
      for (var n = 0; n < nodeDists.length; n++) {
        if (target >= nodeDists[n]) active = n;
      }

      return { x: dotX, y: dotY, active: active };
    }

    function updateContent(lessonIndex) {
      if (lessonIndex === activeLesson) return;
      activeLesson = lessonIndex;
      var l = lessons[lessonIndex];
      info.classList.add('fading');
      if (textTimer) clearTimeout(textTimer);
      textTimer = setTimeout(function () {
        numEl.textContent   = String(lessonIndex + 1).padStart(2, '0');
        titleEl.textContent = l.title;
        textEl.textContent  = l.text;
        info.classList.remove('fading');
      }, 220);
    }

    function update() {
      var pinRect = pin.getBoundingClientRect();
      var scrolled = -pinRect.top;
      var range = pin.offsetHeight - window.innerHeight;
      if (range <= 0) return;
      var progress = Math.max(0, Math.min(1, scrolled / range));

      var state = getState(progress);

      marker.style.left = state.x + '%';
      marker.style.top  = state.y + '%';

      nodeEls.forEach(function (el, i) {
        el.classList.toggle('is-active', i === state.active);
        el.classList.toggle('is-done', i < state.active);
      });

      if (progressPath && progressLen > 0) {
        progressPath.style.strokeDashoffset = String(progressLen * (1 - progress));
      }

      updateContent(state.active);
    }

    window.addEventListener('scroll', function () {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }, { passive: true });

    window.addEventListener('resize', update, { passive: true });
    setupProgressStroke();
    update();
  })();

})();
