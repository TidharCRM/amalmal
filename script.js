(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════
  // HERO — Canvas Scroll-Frame Animation
  // ═══════════════════════════════════════════════════════

  const FRAME_COUNT = 21;
  const FRAME_PATH = 'frames/ezgif-frame-';

  function initHeroAnimation() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const hero = document.getElementById('hero');
    const overlay = document.querySelector('.hero__overlay');
    const heroContent = document.querySelector('.hero__content');
    const scrollHint = document.getElementById('scroll-hint');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const frames = [];
    let loadedCount = 0;
    let currentFrame = 0;
    let ticking = false;

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

    var isMobile = window.matchMedia('(max-width: 768px)').matches;

    // ── Shared: apply progress → frame + overlay + content reveal ──
    function applyProgress(progress) {
      var frameIndex = Math.min(FRAME_COUNT - 1, Math.floor(progress * FRAME_COUNT));
      if (frameIndex !== currentFrame) {
        currentFrame = frameIndex;
        drawFrame(currentFrame);
      }

      var overlayBase;
      if (progress < 0.75) {
        overlayBase = 0.05 + progress * 0.35;
      } else {
        overlayBase = 0.31 + (progress - 0.75) * 2.6;
      }
      overlayBase = Math.min(overlayBase, 0.92);
      overlay.style.background =
        'radial-gradient(ellipse at center, ' +
        'rgba(5,5,8,' + (overlayBase * 0.3).toFixed(3) + ') 0%, ' +
        'rgba(5,5,8,' + overlayBase.toFixed(3) + ') 65%, ' +
        'rgba(5,5,8,' + Math.min(0.98, overlayBase * 1.15).toFixed(3) + ') 100%)';

      if (heroContent) {
        var REVEAL_START = 0.78;
        var REVEAL_END   = 0.96;
        var t = 0;
        if (progress >= REVEAL_START) {
          var raw = Math.min(1, (progress - REVEAL_START) / (REVEAL_END - REVEAL_START));
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
        if (loadedCount === FRAME_COUNT) drawFrame(0);
        if (isMobile && loadedCount >= 4 && !mobileAnimStarted) startMobileAnim();
      };
      frames.push(img);
    }

    // ── Reduced-motion: show content immediately ──
    if (prefersReducedMotion) {
      if (heroContent) {
        heroContent.style.opacity = '1';
        heroContent.style.transform = 'none';
        heroContent.style.transition = 'none';
      }
      resizeCanvas();
      return;
    }

    // ── MOBILE: time-based auto-play — no scroll trap ──
    var mobileAnimStarted = false;
    var mobileAnimStart = null;
    var MOBILE_ANIM_DURATION = 1600;

    function startMobileAnim() {
      if (mobileAnimStarted) return;
      mobileAnimStarted = true;
      resizeCanvas();
      requestAnimationFrame(stepMobile);
    }

    function stepMobile(now) {
      if (!mobileAnimStart) mobileAnimStart = now;
      var elapsed = now - mobileAnimStart;
      var progress = Math.min(1, elapsed / MOBILE_ANIM_DURATION);
      applyProgress(progress);
      if (progress < 1) requestAnimationFrame(stepMobile);
    }

    if (isMobile) {
      if (loadedCount >= 4) startMobileAnim();
      window.addEventListener('resize', resizeCanvas);
      return;
    }

    // ── DESKTOP: scroll-based scrubbing ──
    function onScroll() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(function () {
        const rect = hero.getBoundingClientRect();
        const scrollableHeight = hero.offsetHeight - window.innerHeight;
        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / scrollableHeight));

        applyProgress(progress);

        if (scrollHint) {
          scrollHint.classList.toggle('hidden', progress > 0.04);
        }

        var progressBar = document.getElementById('hero-progress');
        var progressFill = document.getElementById('hero-progress-fill');
        if (progressBar && progressFill) {
          if (progress > 0.01 && progress < 0.99) {
            progressBar.classList.add('hero__progress--visible');
            progressFill.style.width = (progress * 100) + '%';
          } else {
            progressBar.classList.remove('hero__progress--visible');
          }
        }

        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    onScroll();
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
        try {
          var saved = localStorage.getItem('courseDate');
          if (saved) dateInput.value = saved;
        } catch (err) {}
      } else {
        if (pinError) pinError.style.display = 'block';
        pinInput.value = '';
        pinInput.focus();
      }
    });

    saveBtn.addEventListener('click', function () {
      var date = dateInput.value;
      if (!date) return;
      try { localStorage.setItem('courseDate', date); } catch (err) {}
      initCountdown();
      closeModal();
    });

    clearBtn.addEventListener('click', function () {
      try { localStorage.removeItem('courseDate'); } catch (err) {}
      var section = document.getElementById('countdown');
      if (section) section.style.display = 'none';
      closeModal();
    });
  }

  // ═══════════════════════════════════════════════════════
  // COUNTDOWN — Public-facing timer
  // ═══════════════════════════════════════════════════════

  function initCountdown() {
    var section = document.getElementById('countdown');
    if (!section) return;

    var courseDate;
    try { courseDate = localStorage.getItem('courseDate'); } catch (err) {}

    if (!courseDate) {
      section.style.display = 'none';
      return;
    }

    var target = new Date(courseDate);
    var now = new Date();

    section.style.display = 'block';

    if (target <= now) {
      var display = document.getElementById('countdown-display');
      if (display) {
        display.innerHTML = '<span class="countdown__live">הקורס כבר התחיל — הצטרפי עכשיו!</span>';
      }
      return;
    }

    var intervalId = null;

    function tick() {
      var now = new Date();
      var diff = target - now;

      if (diff <= 0) {
        var display = document.getElementById('countdown-display');
        if (display) {
          display.innerHTML = '<span class="countdown__live">הקורס כבר התחיל — הצטרפי עכשיו!</span>';
        }
        clearInterval(intervalId);
        return;
      }

      var days    = Math.floor(diff / (1000 * 60 * 60 * 24));
      var hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((diff % (1000 * 60)) / 1000);

      var dEl = document.getElementById('cd-days');
      var hEl = document.getElementById('cd-hours');
      var mEl = document.getElementById('cd-minutes');
      var sEl = document.getElementById('cd-seconds');

      if (dEl) dEl.textContent = String(days).padStart(2, '0');
      if (hEl) hEl.textContent = String(hours).padStart(2, '0');
      if (mEl) mEl.textContent = String(minutes).padStart(2, '0');
      if (sEl) sEl.textContent = String(seconds).padStart(2, '0');
    }

    tick();
    intervalId = setInterval(tick, 1000);
  }

  // ═══════════════════════════════════════════════════════
  // BOOT
  // ═══════════════════════════════════════════════════════

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

  document.addEventListener('DOMContentLoaded', function () {
    initHeroAnimation();
    initNav();
    initStatsCounter();
    initScrollReveal();
    initCardShine();
    initSmoothScroll();
    initCursor();
    initAdmin();
    initCountdown();
    initSnekReveal();
  });
})();
