(function () {
  'use strict';

  // Firebase Realtime Database reference (populated after Firebase CDN loads)
  var db = (typeof firebase !== 'undefined') ? firebase.database() : null;

  // ═══════════════════════════════════════════════════════
  // HERO — Canvas Scroll-Frame Animation
  // ═══════════════════════════════════════════════════════

  const FRAME_COUNT = 129;
  const FRAME_PATH = 'frames/ezgif-frame-';

  function initHeroAnimation() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const hero = document.getElementById('hero');
    const overlay = document.querySelector('.hero__overlay');
    const heroContent = document.querySelector('.hero__content');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    const frames = [];
    let loadedCount = 0;
    let currentFrame = 0;
    let ticking = false;
    let heroComplete = false;

    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
      drawFrame(currentFrame);
    }

    function drawFrame(index) {
      const img = frames[index];
      if (!img || !img.complete || !img.naturalWidth) return;

      const cw = window.innerWidth;
      const ch = window.innerHeight;
      ctx.clearRect(0, 0, cw, ch);

      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = cw / ch;
      let dw, dh, dx, dy;

      if (canvasRatio > imgRatio) {
        dw = cw;
        dh = cw / imgRatio;
        dx = 0;
        dy = (ch - dh) / 2;
      } else {
        dh = ch;
        dw = ch * imgRatio;
        dy = 0;
        dx = (cw - dw) / 2;
      }

      ctx.drawImage(img, dx, dy, dw, dh);
    }

    // ── Shared: apply progress → frame + overlay + content reveal ──
    function applyProgress(progress) {
      const frameIndex = Math.min(FRAME_COUNT - 1, Math.floor(progress * FRAME_COUNT));
      if (frameIndex !== currentFrame) {
        currentFrame = frameIndex;
        drawFrame(currentFrame);
      }
      let overlayBase;
      if (progress < 0.75) {
        overlayBase = progress * 0.2;
      } else {
        overlayBase = 0.15 + (progress - 0.75) * 1.8;
      }
      overlayBase = Math.min(overlayBase, 0.75);
      overlay.style.background =
        'radial-gradient(ellipse at center, ' +
        'rgba(5,5,8,' + (overlayBase * 0.25).toFixed(3) + ') 0%, ' +
        'rgba(5,5,8,' + overlayBase.toFixed(3) + ') 65%, ' +
        'rgba(5,5,8,' + Math.min(0.85, overlayBase * 1.1).toFixed(3) + ') 100%)';
      if (heroContent) {
        const REVEAL_START = 0.78, REVEAL_END = 0.96;
        let t = 0;
        if (progress >= REVEAL_START) {
          const raw = Math.min(1, (progress - REVEAL_START) / (REVEAL_END - REVEAL_START));
          t = 1 - Math.pow(1 - raw, 3);
        }
        heroContent.style.opacity = t;
        heroContent.style.transform = 'translateY(' + (20 * (1 - t)) + 'px)';
      }
    }

    // ── Preload every frame ──
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      const num = String(i).padStart(3, '0');
      img.src = FRAME_PATH + num + '.jpg';
      img.onload = function () {
        loadedCount++;
        if (loadedCount === 1) resizeCanvas();
        if (loadedCount === FRAME_COUNT) drawFrame(currentFrame);
      };
      frames.push(img);
    }

    if (prefersReducedMotion) {
      if (heroContent) {
        heroContent.style.opacity = '1';
        heroContent.style.transform = 'none';
        heroContent.style.transition = 'none';
      }
      resizeCanvas();
      return;
    }

    function updateVh() {
      document.documentElement.style.setProperty('--real-vh', window.innerHeight + 'px');
    }

    resizeCanvas();
    window.addEventListener('resize', function () {
      updateVh();
      scrollableH = hero.offsetHeight - window.innerHeight;
      resizeCanvas();
    }, { passive: true });

    // ── Shared virtual scroll state (desktop wheel + mobile touch) ──
    let virtualY = 0;
    let touchLastY = 0;
    let scrollableH = hero.offsetHeight - window.innerHeight;

    function finishHero() {
      if (heroComplete) return;
      heroComplete = true;
      applyProgress(1);
      document.body.classList.remove('body--hero-lock');
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      window.removeEventListener('wheel', onWheel);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);

      // After unlock: keep animation in sync with real scroll (enables reverse)
      var postTicking = false;
      window.addEventListener('scroll', function () {
        if (postTicking) return;
        postTicking = true;
        requestAnimationFrame(function () {
          var sh = hero.offsetHeight - window.innerHeight;
          var progress = Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / sh));
          applyProgress(progress);
          postTicking = false;
        });
      }, { passive: true });

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          window.scrollTo(0, hero.offsetTop + hero.offsetHeight - window.innerHeight);
        });
      });
    }

    function onWheel(e) {
      if (heroComplete) return;
      e.preventDefault();
      virtualY = Math.max(0, Math.min(scrollableH, virtualY + e.deltaY));
      if (virtualY >= scrollableH * 0.99) { finishHero(); return; }
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          applyProgress(scrollableH > 0 ? virtualY / scrollableH : 0);
          ticking = false;
        });
      }
    }

    function onTouchStart(e) {
      if (heroComplete) return;
      touchLastY = e.touches[0].clientY;
    }

    function onTouchMove(e) {
      if (heroComplete) return;
      e.preventDefault();
      var cy = e.touches[0].clientY;
      var delta = touchLastY - cy;
      touchLastY = cy;
      virtualY = Math.max(0, Math.min(scrollableH, virtualY + delta * 3));
      if (virtualY >= scrollableH * 0.99) { finishHero(); return; }
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          applyProgress(scrollableH > 0 ? virtualY / scrollableH : 0);
          ticking = false;
        });
      }
    }

    // Lock scroll on all devices — desktop uses wheel, mobile uses touch
    document.body.classList.add('body--hero-lock');
    document.body.style.touchAction = 'none';

    if (isMobile) {
      document.addEventListener('touchstart', onTouchStart, { passive: true });
      document.addEventListener('touchmove', onTouchMove, { passive: false });
    } else {
      window.addEventListener('wheel', onWheel, { passive: false });
    }
  }

  // ═══════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════

  function initNav() {
    const nav = document.getElementById('main-nav');
    const toggle = document.getElementById('nav-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!nav) return;

    var mobileCta = document.getElementById('mobile-cta-bar');
    let navTicking = false;
    window.addEventListener('scroll', function () {
      if (navTicking) return;
      navTicking = true;
      requestAnimationFrame(function () {
        if (window.scrollY > 60) {
          nav.classList.add('nav--scrolled');
        } else {
          nav.classList.remove('nav--scrolled');
        }
        if (mobileCta) {
          var hero = document.getElementById('hero');
          var heroBottom = hero ? hero.offsetTop + hero.offsetHeight : 600;
          if (window.scrollY > heroBottom * 0.15) {
            mobileCta.classList.add('visible');
            mobileCta.removeAttribute('aria-hidden');
          } else {
            mobileCta.classList.remove('visible');
            mobileCta.setAttribute('aria-hidden', 'true');
          }
        }
        navTicking = false;
      });
    }, { passive: true });

    if (toggle && mobileMenu) {
      toggle.addEventListener('click', function () {
        toggle.classList.toggle('active');
        mobileMenu.classList.toggle('active');
      });

      mobileMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          toggle.classList.remove('active');
          mobileMenu.classList.remove('active');
        });
      });
    }
  }

  // ═══════════════════════════════════════════════════════
  // STATS — Animated Counter
  // ═══════════════════════════════════════════════════════

  function initStatsCounter() {
    const numbers = document.querySelectorAll('.stats__number[data-target]');
    if (!numbers.length) return;

    let animated = false;

    function animateCounters() {
      numbers.forEach(function (el) {
        const target = parseInt(el.dataset.target, 10);
        const duration = 2200;
        const startTime = performance.now();

        function tick(now) {
          const elapsed = now - startTime;
          const t = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          const value = Math.floor(eased * target);

          if (target >= 10000) {
            el.textContent = (value / 1000).toFixed(1) + 'K+';
          } else {
            el.textContent = value.toLocaleString() + '+';
          }

          if (t < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
      });
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !animated) {
            animated = true;
            animateCounters();
          }
        });
      },
      { threshold: 0.3 }
    );

    var statsSection = document.getElementById('stats');
    if (statsSection) observer.observe(statsSection);
  }

  // ═══════════════════════════════════════════════════════
  // SCROLL REVEAL
  // ═══════════════════════════════════════════════════════

  function initScrollReveal() {
    var selectors = [
      '.about__visual',
      '.about__text',
      '.service-card',
      '.myth__col',
      '.promise__item',
      '.testimonial-card',
      '.contact__wrapper',
      '.section__tag',
      '.section__title'
    ];

    var elements = document.querySelectorAll(selectors.join(', '));

    elements.forEach(function (el) {
      if (el.closest('#hero')) return;
      el.classList.add('reveal');
    });

    document.querySelectorAll(
      '.modules__grid .service-card, .testimonials__grid .testimonial-card, .promise__grid .promise__item'
    ).forEach(function (el, i) {
      var delay = (i % 3) + 1;
      if (delay <= 3) el.classList.add('reveal-delay-' + delay);
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  }

  // ═══════════════════════════════════════════════════════
  // SERVICE CARD — Mouse Shine Effect
  // ═══════════════════════════════════════════════════════

  function initCardShine() {
    document.querySelectorAll('.service-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', x + '%');
        card.style.setProperty('--mouse-y', y + '%');
      });
    });
  }

  // ═══════════════════════════════════════════════════════
  // SMOOTH SCROLL — for anchor links
  // ═══════════════════════════════════════════════════════

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;
        var target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();
        var offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;

        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  // ═══════════════════════════════════════════════════════
  // CUSTOM CURSOR
  // ═══════════════════════════════════════════════════════

  function initCursor() {
    var cursor = document.getElementById('cursor');
    var dot = document.getElementById('cursor-dot');
    if (!cursor) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var mx = -100, my = -100;
    var cx = -100, cy = -100;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    });

    (function animateCursor() {
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      cursor.style.left = cx + 'px';
      cursor.style.top = cy + 'px';
      requestAnimationFrame(animateCursor);
    })();

    document.querySelectorAll('a, button').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('cursor--hover'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('cursor--hover'); });
    });
  }

  // ═══════════════════════════════════════════════════════
  // ADMIN — Hidden PIN-gated panel
  // ═══════════════════════════════════════════════════════

  function initAdmin() {
    var trigger  = document.getElementById('admin-trigger');
    var modal    = document.getElementById('admin-modal');
    var backdrop = document.getElementById('admin-backdrop');
    var closeBtn = document.getElementById('admin-close');
    var pinInput  = document.getElementById('pin-input');
    var pinSubmit = document.getElementById('pin-submit');
    var pinError  = document.getElementById('pin-error');
    var pinScreen = document.getElementById('admin-pin-screen');
    var adminPanel = document.getElementById('admin-panel');
    var dateInput  = document.getElementById('admin-date-input');
    var saveBtn    = document.getElementById('admin-save-btn');
    var clearBtn   = document.getElementById('admin-clear-btn');

    if (!trigger || !modal) return;

    var CORRECT_PIN = '1234';

    function openModal() {
      pinScreen.style.display = 'block';
      adminPanel.style.display = 'none';
      pinInput.value = '';
      if (pinError) pinError.style.display = 'none';
      modal.classList.add('active');
      modal.removeAttribute('aria-hidden');
      setTimeout(function () { pinInput.focus(); }, 120);
    }

    function closeModal() {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }

    trigger.addEventListener('click', openModal);
    backdrop.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    pinInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') pinSubmit.click();
    });

    pinSubmit.addEventListener('click', function () {
      if (pinInput.value === CORRECT_PIN) {
        pinScreen.style.display = 'none';
        adminPanel.style.display = 'block';
        if (db) {
          db.ref('/countdownDate').once('value').then(function (snap) {
            if (snap.val()) dateInput.value = snap.val();
          });
        }
      } else {
        if (pinError) pinError.style.display = 'block';
        pinInput.value = '';
        pinInput.focus();
      }
    });

    saveBtn.addEventListener('click', function () {
      var date = dateInput.value;
      if (!date) return;
      if (db) {
        db.ref('/countdownDate').set(date).then(closeModal).catch(closeModal);
      } else {
        closeModal();
      }
    });

    clearBtn.addEventListener('click', function () {
      if (db) {
        db.ref('/countdownDate').set(null).then(closeModal).catch(closeModal);
      } else {
        closeModal();
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  // COUNTDOWN — Public-facing timer
  // ═══════════════════════════════════════════════════════

  function initCountdown() {
    var section = document.getElementById('countdown');
    if (!section) return;

    var intervalId = null;

    function startTimer(courseDate) {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }

      if (!courseDate) { section.style.display = 'none'; return; }

      var target = new Date(courseDate);
      section.style.display = 'block';

      var display = document.getElementById('countdown-display');

      function tick() {
        var diff = target - new Date();
        if (diff <= 0) {
          if (display) display.innerHTML = '<span class="countdown__live">הקורס כבר התחיל — הצטרפי עכשיו!</span>';
          clearInterval(intervalId);
          return;
        }
        var dEl = document.getElementById('cd-days');
        var hEl = document.getElementById('cd-hours');
        var mEl = document.getElementById('cd-minutes');
        var sEl = document.getElementById('cd-seconds');
        if (dEl) dEl.textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
        if (hEl) hEl.textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
        if (mEl) mEl.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        if (sEl) sEl.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      }

      tick();
      intervalId = setInterval(tick, 1000);
    }

    if (db) {
      // Real-time sync: all devices see the same countdown instantly
      db.ref('/countdownDate').on('value', function (snap) {
        startTimer(snap.val());
      });
    } else {
      section.style.display = 'none';
    }
  }

  // ═══════════════════════════════════════════════════════
  // BOOT
  // ═══════════════════════════════════════════════════════

  function initFaq() {
    document.querySelectorAll('[data-faq]').forEach(function (item) {
      var btn = item.querySelector('.faq__q');
      var ans = item.querySelector('.faq__a');
      if (!btn || !ans) return;
      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        document.querySelectorAll('[data-faq].open').forEach(function (other) {
          other.classList.remove('open');
          other.querySelector('.faq__a').style.maxHeight = '0';
          other.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('open');
          ans.style.maxHeight = ans.scrollHeight + 'px';
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  function initSnekReveal() {
    var steps = document.querySelectorAll('[data-snek-step]');
    if (!steps.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    steps.forEach(function (el) { obs.observe(el); });
  }

  function initTestimonialsCarousel() {
    var deck = document.getElementById('testimonials-deck');
    if (!deck) return;

    var cards = Array.from(deck.querySelectorAll('.tcard'));
    var total = cards.length;
    var animating = false;

    function getPos(card) { return parseInt(card.dataset.pos, 10); }

    function advance() {
      if (animating) return;
      animating = true;

      var front = cards.find(function (c) { return getPos(c) === 0; });
      front.classList.add('tcard--exit');

      setTimeout(function () {
        front.classList.remove('tcard--exit');
        cards.forEach(function (c) {
          var p = getPos(c);
          c.dataset.pos = (p - 1 + total) % total;
        });
        animating = false;
      }, 450);
    }

    function retreat() {
      if (animating) return;
      animating = true;

      cards.forEach(function (c) {
        var p = getPos(c);
        c.dataset.pos = (p + 1) % total;
      });

      var newFront = cards.find(function (c) { return getPos(c) === 0; });
      newFront.classList.add('tcard--exit');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          newFront.classList.remove('tcard--exit');
          animating = false;
        });
      });
    }

    document.getElementById('tnext').addEventListener('click', advance);
    document.getElementById('tprev').addEventListener('click', retreat);

    /* swipe support */
    var touchStartX = 0;
    deck.addEventListener('touchstart', function (e) { touchStartX = e.touches[0].clientX; }, { passive: true });
    deck.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) { dx < 0 ? advance() : retreat(); }
    });
  }

  function initStickyCards() {
    var navH = 72;
    var dwell = Math.round(window.innerHeight * 0.55);

    document.querySelectorAll('.card-scene').forEach(function (scene) {
      var card = scene.querySelector('.stack-card');
      if (!card) return;

      card.style.position = 'absolute';
      card.style.left = '0';
      card.style.right = '0';
      card.style.top = '0';

      // Scene height = card height + dwell so next card enters after dwell scroll
      scene.style.minHeight = (card.offsetHeight + dwell) + 'px';
    });

    function update() {
      document.querySelectorAll('.card-scene').forEach(function (scene) {
        var card = scene.querySelector('.stack-card');
        if (!card) return;
        var rect = scene.getBoundingClientRect();
        var cardH = card.offsetHeight;
        var sceneH = scene.offsetHeight;
        // How far the scene top has scrolled past the sticky threshold
        var offset = Math.max(0, Math.min(sceneH - cardH, navH - rect.top));
        card.style.top = offset + 'px';
      });
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', function () {
      // Recalculate scene heights on resize
      document.querySelectorAll('.card-scene').forEach(function (scene) {
        var card = scene.querySelector('.stack-card');
        if (!card) return;
        scene.style.minHeight = (card.offsetHeight + dwell) + 'px';
      });
      update();
    });
    update();
  }

  function initJourney() {
    var rail = document.getElementById('journey-rail');
    var fill = document.getElementById('journey-road-fill');
    var avatar = document.getElementById('journey-avatar');
    var section = document.getElementById('journey');
    if (!rail || !fill || !section) return;

    var milestones = Array.from(rail.querySelectorAll('.jm'));

    function update() {
      var sRect = section.getBoundingClientRect();
      var sH = section.offsetHeight;
      var vpH = window.innerHeight;
      // Progress 0→1 as section scrolls from bottom of viewport to above viewport
      var raw = (-sRect.top) / (sH - vpH);
      var progress = Math.max(0, Math.min(1, raw));

      // Grow the road fill
      fill.style.height = (progress * 100) + '%';

      // Move avatar along the rail
      if (avatar) {
        var railH = rail.offsetHeight;
        avatar.style.top = (progress * railH) + 'px';
      }

      // Reveal milestone cards as fill passes each one
      var railRect = rail.getBoundingClientRect();
      milestones.forEach(function (jm) {
        var card = jm.querySelector('.jm__card');
        if (!card) return;
        var jmRect = jm.getBoundingClientRect();
        var jmRelY = (jmRect.top + jmRect.height / 2 - railRect.top) / rail.offsetHeight;
        if (progress >= jmRelY - 0.05) {
          card.classList.add('jm--visible');
        }
      });
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function initReadingProgress() {
    var bar = document.getElementById('reading-bar');
    if (!bar) return;
    function update() {
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = docH > 0 ? Math.min(100, window.scrollY / docH * 100) + '%' : '0%';
    }
    window.addEventListener('scroll', update, { passive: true });
  }

  function initLeadForm() {
    var form = document.getElementById('lead-form');
    var success = document.getElementById('lead-success');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = document.getElementById('lead-submit');
      btn.disabled = true;
      btn.textContent = 'שולח...';
      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function (r) {
        if (r.ok) {
          form.style.display = 'none';
          success.removeAttribute('hidden');
        } else {
          btn.disabled = false;
          btn.textContent = 'שלחי לי פרטים';
        }
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = 'שלחי לי פרטים';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initReadingProgress();
    initHeroAnimation();
    initJourney();
    initStickyCards();
    initNav();
    initStatsCounter();
    initScrollReveal();
    initCardShine();
    initSmoothScroll();
    initCursor();
    initAdmin();
    initCountdown();
    initSnekReveal();
    initFaq();
    initTestimonialsCarousel();
    initLeadForm();
  });
})();
