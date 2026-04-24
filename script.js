(function () {
  'use strict';

  // Hero — frame scrubber
  var FRAME_COUNT = 81;
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
      return 'hero-frames/hf_20260422_191853_c322019f-7351-45ae-945a-e3c014be3017_frames/hf_20260422_191853_c322019f-7351-45ae-945a-e3c014be3017_' + String(i + 1).padStart(3, '0') + '.jpg';
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

  // Next-cycle state (synced via Firebase RTDB + Auth)
  var CYCLE_DEFAULT = new Date('2026-06-01T10:00:00').getTime();
  var cycleTarget = CYCLE_DEFAULT;
  var spotsLeft = null;

  function getCycleTarget(){ return cycleTarget; }
  function getSpotsLeft(){ return spotsLeft; }

  function updateSpotsDisplay(){
    var el = document.getElementById('bc-spots');
    if (!el) return;
    el.textContent = (spotsLeft === null || spotsLeft === undefined) ? '—' : String(spotsLeft);
  }

  function subscribeFirebase(){
    var fb = window.__cutitFb;
    if (!fb) return;
    fb.onValue(fb.ref(fb.db, 'countdownDate'), function(snap){
      var data = snap.val();
      if (typeof data === 'string') {
        var d = new Date(data);
        if (!isNaN(d.getTime())) {
          cycleTarget = d.getTime();
          if (window.__cutitTickCountdown) window.__cutitTickCountdown();
        }
      }
    });
    fb.onValue(fb.ref(fb.db, 'spotsLeft'), function(snap){
      var data = snap.val();
      if (typeof data === 'number') {
        spotsLeft = data;
        updateSpotsDisplay();
      } else if (typeof data === 'string' && data !== '') {
        var n = parseInt(data, 10);
        if (!isNaN(n)) { spotsLeft = n; updateSpotsDisplay(); }
      }
    });
  }
  if (window.__cutitFb) subscribeFirebase();
  else window.addEventListener('cutit-fb-ready', subscribeFirebase);

  // Bigcard countdown
  (function(){
    var dEl = document.getElementById('bc-days');
    var hEl = document.getElementById('bc-hours');
    var mEl = document.getElementById('bc-minutes');
    var sEl = document.getElementById('bc-seconds');
    if (!dEl || !hEl || !mEl || !sEl) return;
    function pad(n){ return String(n).padStart(2, '0'); }
    window.__cutitTickCountdown = function(){
      var diff = Math.max(0, getCycleTarget() - Date.now());
      dEl.textContent = pad(Math.floor(diff / 86400000));
      hEl.textContent = pad(Math.floor((diff / 3600000) % 24));
      mEl.textContent = pad(Math.floor((diff / 60000) % 60));
      sEl.textContent = pad(Math.floor((diff / 1000) % 60));
    };
    window.__cutitTickCountdown();
    setInterval(window.__cutitTickCountdown, 1000);
  })();

  // Admin — Firebase Auth sign-in + edit
  (function(){
    var adminBtn = document.getElementById('admin-btn');
    var modal = document.getElementById('admin-modal');
    if (!adminBtn || !modal) return;

    var stepPw = document.getElementById('admin-step-password');
    var stepEdit = document.getElementById('admin-step-edit');
    var emailInput = document.getElementById('admin-email');
    var pwInput = document.getElementById('admin-password');
    var pwError = document.getElementById('admin-pw-error');
    var dateInput = document.getElementById('admin-date');
    var spotsInput = document.getElementById('admin-spots');
    var saveStatus = document.getElementById('admin-save-status');

    function pad2(n){ return String(n).padStart(2,'0'); }
    function toDatetimeLocal(ts){
      var d = new Date(ts);
      return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate()) + 'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    }

    function showEditStep(){
      dateInput.value = toDatetimeLocal(getCycleTarget());
      spotsInput.value = (getSpotsLeft() === null || getSpotsLeft() === undefined) ? '' : String(getSpotsLeft());
      stepPw.hidden = true;
      stepEdit.hidden = false;
      setTimeout(function(){ dateInput.focus(); }, 50);
    }

    function openModal(){
      var fb = window.__cutitFb;
      if (fb && fb.auth.currentUser) {
        showEditStep();
      } else {
        stepPw.hidden = false;
        stepEdit.hidden = true;
        emailInput.value = '';
        pwInput.value = '';
        pwError.hidden = true;
        setTimeout(function(){ emailInput.focus(); }, 50);
      }
      saveStatus.textContent = '';
      saveStatus.classList.remove('is-error');
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
    }
    function closeModal(){
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
    }

    adminBtn.addEventListener('click', function(e){
      e.preventDefault();
      openModal();
    });

    modal.addEventListener('click', function(e){
      if (e.target.getAttribute('data-close') === '1') closeModal();
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && !modal.hidden) closeModal();
    });

    stepPw.addEventListener('submit', function(e){
      e.preventDefault();
      var fb = window.__cutitFb;
      if (!fb) {
        pwError.textContent = 'Firebase לא נטען';
        pwError.hidden = false;
        return;
      }
      pwError.hidden = true;
      var submitBtn = stepPw.querySelector('button[type="submit"]');
      var origText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'מתחבר...';
      fb.signIn(fb.auth, emailInput.value.trim(), pwInput.value)
        .then(function(){
          submitBtn.disabled = false;
          submitBtn.textContent = origText;
          showEditStep();
        })
        .catch(function(err){
          submitBtn.disabled = false;
          submitBtn.textContent = origText;
          var msg = 'פרטי התחברות שגויים';
          if (err && err.code === 'auth/too-many-requests') msg = 'נחסמת זמנית, נסי שוב עוד מעט';
          else if (err && err.code === 'auth/network-request-failed') msg = 'בעיית רשת';
          pwError.textContent = msg;
          pwError.hidden = false;
        });
    });

    stepEdit.addEventListener('submit', function(e){
      e.preventDefault();
      var fb = window.__cutitFb;
      if (!fb) return;
      var dateVal = dateInput.value;
      var spotsVal = parseInt(spotsInput.value, 10);
      if (!dateVal) return;
      var d = new Date(dateVal);
      if (isNaN(d.getTime())) { saveStatus.textContent = 'תאריך לא תקין'; saveStatus.classList.add('is-error'); return; }
      if (isNaN(spotsVal) || spotsVal < 0) { saveStatus.textContent = 'מקומות לא תקינים'; saveStatus.classList.add('is-error'); return; }
      saveStatus.classList.remove('is-error');
      saveStatus.textContent = 'שומר...';

      Promise.all([
        fb.set(fb.ref(fb.db, 'countdownDate'), dateVal),
        fb.set(fb.ref(fb.db, 'spotsLeft'), spotsVal)
      ]).then(function(){
        cycleTarget = d.getTime();
        spotsLeft = spotsVal;
        if (window.__cutitTickCountdown) window.__cutitTickCountdown();
        updateSpotsDisplay();
        saveStatus.textContent = 'נשמר בהצלחה';
        setTimeout(closeModal, 900);
      }).catch(function(err){
        var msg = 'שגיאה בשמירה';
        if (err && err.code === 'PERMISSION_DENIED') msg = 'אין הרשאה — בדוק את הכללים ב-Firebase';
        saveStatus.textContent = msg;
        saveStatus.classList.add('is-error');
      });
    });
  })();

  // Testimonials deck — stacked card carousel with tilt + slide animation
  var deck = document.getElementById('testi-deck');
  if (deck) {
    var cards = Array.from(deck.querySelectorAll('.tcard'));
    var current = 0;
    var direction = 1; // 1 = next, -1 = prev
    // Subtle rotation variation per card so the stack feels hand-placed
    var rots = [-2.5, 1.8, -1.2, 2.2, -2, 1.5, -1.8, 2];

    function layout() {
      cards.forEach(function (card, i) {
        var offset = (i - current + cards.length) % cards.length;
        var z = cards.length - offset;
        card.style.zIndex = z;

        if (offset === 0) {
          // Active card — front and centered with a tiny tilt
          card.style.transform = 'translate(0, 0) rotate(' + (rots[i] * 0.2) + 'deg) scale(1)';
          card.style.opacity = 1;
          card.style.pointerEvents = 'auto';
        } else if (offset <= 3) {
          // Stacked behind — scaled down, pushed back, slight tilt
          var scale = 1 - offset * 0.05;
          var y = offset * 18;
          var rot = rots[i] || 0;
          card.style.transform = 'translate(0, ' + y + 'px) rotate(' + rot + 'deg) scale(' + scale + ')';
          card.style.opacity = 1 - offset * 0.15;
          card.style.pointerEvents = 'none';
        } else {
          // Far cards — off-screen on the exit side
          var exitX = direction > 0 ? -140 : 140;
          card.style.transform = 'translate(' + exitX + '%, 40px) rotate(' + (direction * -12) + 'deg) scale(.85)';
          card.style.opacity = 0;
          card.style.pointerEvents = 'none';
        }
      });
    }

    function next() { direction = 1;  current = (current + 1) % cards.length; layout(); }
    function prev() { direction = -1; current = (current - 1 + cards.length) % cards.length; layout(); }

    var auto = null;
    function startAuto() { stopAuto(); auto = setInterval(next, 6000); }
    function stopAuto() { if (auto) { clearInterval(auto); auto = null; } }

    document.getElementById('t-next').addEventListener('click', function(){ stopAuto(); next(); });
    document.getElementById('t-prev').addEventListener('click', function(){ stopAuto(); prev(); });

    layout();
    startAuto();
    deck.addEventListener('mouseenter', stopAuto);

    // Swipe support — any direction advances to next; opposite goes back
    var touchStartX = 0, touchStartY = 0, touchActive = false;
    deck.addEventListener('touchstart', function (e) {
      stopAuto();
      touchActive = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    deck.addEventListener('touchend', function (e) {
      if (!touchActive) return;
      touchActive = false;
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      var absX = Math.abs(dx), absY = Math.abs(dy);
      if (Math.max(absX, absY) < 30) return; // ignore taps/tiny moves
      // Horizontal swipe → direction; vertical swipe also navigates (up = next, down = prev)
      if (absX > absY) {
        // RTL: swipe left (dx<0) = next; swipe right = prev
        if (dx < 0) next(); else prev();
      } else {
        if (dy < 0) next(); else prev();
      }
    }, { passive: true });

    // Mouse drag support for desktop
    var mouseDown = false, mouseStartX = 0, mouseStartY = 0;
    deck.addEventListener('mousedown', function (e) {
      stopAuto();
      mouseDown = true;
      mouseStartX = e.clientX;
      mouseStartY = e.clientY;
    });
    window.addEventListener('mouseup', function (e) {
      if (!mouseDown) return;
      mouseDown = false;
      var dx = e.clientX - mouseStartX;
      var dy = e.clientY - mouseStartY;
      var absX = Math.abs(dx), absY = Math.abs(dy);
      if (Math.max(absX, absY) < 30) return;
      if (absX > absY) {
        if (dx < 0) next(); else prev();
      } else {
        if (dy < 0) next(); else prev();
      }
    });
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

      // Direction of current segment (normalized, in % units)
      var dirX = 0, dirY = 0;
      for (var sd = 0; sd < segs.length; sd++) {
        var accD = 0;
        for (var k = 0; k < sd; k++) accD += segs[k];
        if (target <= accD + segs[sd]) {
          var rawDx = pts[sd+1].x - pts[sd].x;
          var rawDy = pts[sd+1].y - pts[sd].y;
          var len = Math.sqrt(rawDx*rawDx + rawDy*rawDy);
          if (len > 0) { dirX = rawDx / len; dirY = rawDy / len; }
          break;
        }
      }

      return { x: dotX, y: dotY, dirX: dirX, dirY: dirY, active: active };
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

      // Use getPointAtLength for accurate smooth-curve positioning
      var trackPath = document.getElementById('snake-track');
      if (trackPath && trackPath.getTotalLength) {
        var tl = trackPath.getTotalLength();
        var len = progress * tl;
        var pt  = trackPath.getPointAtLength(len);
        var pt2 = trackPath.getPointAtLength(Math.min(len + 2, tl));
        var W = stage.offsetWidth, H = stage.offsetHeight;
        var dxPx = (pt2.x - pt.x) * (W / 100);
        var dyPx = (pt2.y - pt.y) * (H / 100);
        var dlen = Math.sqrt(dxPx * dxPx + dyPx * dyPx);
        if (dlen > 0) { dxPx /= dlen; dyPx /= dlen; }
        var leadPx = 26;
        var offX = W > 0 ? dxPx * leadPx / (W / 100) : 0;
        var offY = H > 0 ? dyPx * leadPx / (H / 100) : 0;
        marker.style.left = (pt.x + offX) + '%';
        marker.style.top  = (pt.y + offY) + '%';
      }

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

  /* ---------------------------------------------------------------
     SCRAMBLE / DECRYPT TEXT REVEAL
     ---------------------------------------------------------------
     Usage (HTML):
       <span data-scramble>Hello</span>

     Optional attributes (all optional):
       data-scramble-duration="1400"   // total animation ms (default 1400)
       data-scramble-char-delay="48"   // stagger between chars ms  (default 48)
       data-scramble-tick="52"         // ms between glyph changes (default 52, higher = calmer)
       data-scramble-chars="abc0123456789!@$%"   // override pool (default matches this)
       data-scramble-trigger="view"    // "view" | "immediate" | "none"
       data-scramble-hover="true"      // replay on mouseenter
       data-scramble-loop="true"       // auto replay forever (every ~1.8s)

     Works in RTL (Hebrew): the string is iterated in logical order,
     so the reveal flows naturally from the start of the word to its end.
  --------------------------------------------------------------- */
  (function(){
    // Decoy glyphs only — Latin a/b/c, digits, and !@$% (exactly one char per slot; same length as final string).
    var DEFAULT_CHARS = 'abc0123456789!@$%';

    function Scramble(el, opts){
      opts = opts || {};
      this.el        = el;
      this.finalText = (opts.text != null ? opts.text : el.textContent) || '';
      this.duration  = opts.duration  != null ? opts.duration  : 1400;
      this.charDelay = opts.charDelay != null ? opts.charDelay : 48;
      this.tickMs    = opts.tickMs != null ? opts.tickMs : 52;
      this.chars     = opts.chars || DEFAULT_CHARS;
      this.loop      = !!opts.loop;
      this.running   = false;
      this._loopTimer = null;
      el.classList.add('scramble');
    }
    Scramble.prototype.play = function(){
      if (this.running) return;
      this.running = true;

      var self = this;
      var text = this.finalText;
      var len  = text.length;
      var chars = this.chars;
      var duration = this.duration;
      var charDelay = this.charDelay;
      var tickMs = this.tickMs;

      // Per-character "lock time" — base stagger + small random jitter.
      var lockTimes = new Array(len);
      var maxLock = 0;
      for (var i = 0; i < len; i++){
        var base = i * charDelay;
        var jitter = Math.random() * (duration * 0.18);
        lockTimes[i] = base + jitter;
        if (lockTimes[i] > maxLock) maxLock = lockTimes[i];
      }
      // Normalize so the last char always locks near `duration` (ease-out feel).
      var scale = (duration - 40) / Math.max(maxLock, 1);
      for (var j = 0; j < len; j++) lockTimes[j] *= scale;

      var start = performance.now();
      var lastGlyphTick = 0;
      var glyphBuf = new Array(len);
      for (var g0 = 0; g0 < len; g0++) {
        var c0 = text.charAt(g0);
        glyphBuf[g0] = (c0 === ' ' || c0 === '\u00A0' || c0 === '\n' || c0 === '\t')
          ? c0
          : chars.charAt(Math.floor(Math.random() * chars.length));
      }
      self.el.classList.remove('is-revealed');
      self.el.classList.add('is-scrambling');

      function frame(now){
        var t = now - start;
        if (now - lastGlyphTick >= tickMs) {
          lastGlyphTick = now;
          for (var g = 0; g < len; g++) {
            var ch = text.charAt(g);
            if (ch === ' ' || ch === '\u00A0' || ch === '\n' || ch === '\t') continue;
            if (t < lockTimes[g]) {
              glyphBuf[g] = chars.charAt(Math.floor(Math.random() * chars.length));
            }
          }
        }
        var out = '';
        var allLocked = true;
        for (var k = 0; k < len; k++){
          var fc = text.charAt(k);
          // Preserve whitespace and line breaks as-is.
          if (fc === ' ' || fc === '\u00A0' || fc === '\n' || fc === '\t') {
            out += fc;
            continue;
          }
          if (t >= lockTimes[k]) {
            out += fc;
          } else {
            allLocked = false;
            out += glyphBuf[k];
          }
        }
        // Always exactly `len` UTF-16 code units — never longer/shorter than the real phrase.
        self.el.textContent = out;

        if (!allLocked) {
          requestAnimationFrame(frame);
        } else {
          self.el.textContent = text;
          self.el.classList.remove('is-scrambling');
          self.el.classList.add('is-revealed');
          setTimeout(function(){ self.el.classList.remove('is-revealed'); }, 650);
          self.running = false;
          if (self.loop) {
            self._loopTimer = setTimeout(function(){ self.play(); }, 1800);
          }
        }
      }
      requestAnimationFrame(frame);
    };

    /** Lock layout to final copy: invisible span sets width/height; animated text is overlaid (no width jump). */
    function installScrambleShell(el){
      if (el.parentNode && el.parentNode.classList.contains('scramble-wrap')) return;
      var raw = (el.textContent || '').trim();
      if (!raw) return;

      var wrap = document.createElement('span');
      wrap.className = 'scramble-wrap';

      var size = document.createElement('span');
      size.className = 'scramble__size';
      size.setAttribute('aria-hidden', 'true');
      size.textContent = raw;

      var parent = el.parentNode;
      if (!parent) return;
      parent.insertBefore(wrap, el);
      el.classList.add('scramble--face');
      wrap.appendChild(size);
      wrap.appendChild(el);
      el.textContent = '';
    }

    function getScrambleFinalText(el){
      var p = el.parentNode;
      if (p && p.classList.contains('scramble-wrap')) {
        var sz = p.firstElementChild;
        if (sz && sz.classList.contains('scramble__size')) return sz.textContent || '';
      }
      return (el.textContent || '').trim();
    }

    function boot(){
      var nodes = document.querySelectorAll('[data-scramble]');
      if (!nodes.length) return;

      nodes.forEach(function(el){ installScrambleShell(el); });

      var items = [];
      nodes.forEach(function(el){
        var duration  = parseInt(el.getAttribute('data-scramble-duration'), 10);
        var charDelay = parseInt(el.getAttribute('data-scramble-char-delay'), 10);
        var tickMs    = parseInt(el.getAttribute('data-scramble-tick'), 10);
        var trigger   = el.getAttribute('data-scramble-trigger') || 'view';
        var loop      = el.getAttribute('data-scramble-loop') === 'true';
        var hover     = el.getAttribute('data-scramble-hover') === 'true';
        var chars     = el.getAttribute('data-scramble-chars') || undefined;

        el.setAttribute('spellcheck', 'false');

        var inst = new Scramble(el, {
          text: getScrambleFinalText(el),
          duration:  isNaN(duration)  ? undefined : duration,
          charDelay: isNaN(charDelay) ? undefined : charDelay,
          tickMs:    isNaN(tickMs)    ? undefined : tickMs,
          chars: chars,
          loop: loop
        });
        items.push({ el: el, inst: inst, trigger: trigger });

        if (hover) {
          el.addEventListener('mouseenter', function(){ inst.play(); });
        }
        if (trigger === 'immediate') inst.play();
      });

      // Trigger on viewport enter — one-shot per element.
      if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function(entries){
          entries.forEach(function(entry){
            if (!entry.isIntersecting) return;
            for (var i = 0; i < items.length; i++) {
              if (items[i].el !== entry.target) continue;
              var it = items[i];
              if (it.trigger !== 'view') { obs.unobserve(entry.target); return; }
              // Gentle stagger for sibling scrambles in the same section.
              setTimeout(function(s){ return function(){ s.inst.play(); }; }(it), i * 200);
              obs.unobserve(entry.target);
              return;
            }
          });
        }, { threshold: 0.35, rootMargin: '0px 0px -10% 0px' });

        items.forEach(function(it){
          if (it.trigger === 'view') obs.observe(it.el);
        });
      } else {
        items.forEach(function(it){ if (it.trigger === 'view') it.inst.play(); });
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  })();

})();
