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

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const frames = [];
    let loadedCount = 0;
    let currentFrame = 0;
    let ticking = false;

    // ── Set canvas resolution to match screen ──
    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
      drawFrame(currentFrame);
    }

    // ── Draw a single frame onto the canvas (cover-fit) ──
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
        // Canvas is wider → fit to width
        dw = cw;
        dh = cw / imgRatio;
        dx = 0;
        dy = (ch - dh) / 2;
      } else {
        // Canvas is taller → fit to height
        dh = ch;
        dw = ch * imgRatio;
        dy = 0;
        dx = (cw - dw) / 2;
      }

      ctx.drawImage(img, dx, dy, dw, dh);
    }

    // ── Preload every frame ──
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      const num = String(i).padStart(3, '0');
      img.src = FRAME_PATH + num + '.jpg';
      img.onload = function () {
        loadedCount++;
        if (loadedCount === 1) resizeCanvas();          // show first frame ASAP
        if (loadedCount === FRAME_COUNT) drawFrame(0);   // ensure clean first render
      };
      frames.push(img);
    }

    // ── Scroll handler — maps scroll position → frame index ──
    function onScroll() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(function () {
        const rect = hero.getBoundingClientRect();
        const scrollableHeight = hero.offsetHeight - window.innerHeight;
        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / scrollableHeight));

        // ── Frame scrubbing ──
        const frameIndex = Math.min(
          FRAME_COUNT - 1,
          Math.floor(progress * FRAME_COUNT)
        );

        if (frameIndex !== currentFrame) {
          currentFrame = frameIndex;
          drawFrame(currentFrame);
        }

        // ── Dynamic overlay ──
        //    Fully transparent at the top so animation is clean.
        //    Gets very dark at the end to create a backdrop for the text reveal.
        var overlayBase;
        if (progress < 0.75) {
          // During the animation: subtle vignette, mostly transparent
          overlayBase = 0.05 + progress * 0.35;
        } else {
          // Final phase: rapidly darken to create text backdrop
          overlayBase = 0.31 + (progress - 0.75) * 2.6;
        }
        overlayBase = Math.min(overlayBase, 0.92);
        overlay.style.background =
          'radial-gradient(ellipse at center, ' +
          'rgba(5,5,8,' + (overlayBase * 0.3).toFixed(3) + ') 0%, ' +
          'rgba(5,5,8,' + overlayBase.toFixed(3) + ') 65%, ' +
          'rgba(5,5,8,' + Math.min(0.98, overlayBase * 1.15).toFixed(3) + ') 100%)';

        // ── Hero content — REVEAL ONLY in final ~15% ──
        //    ZERO visibility from 0% to 82%.
        //    Fades in from 82% → 97% with translateY for mouth-emergence feel.
        if (heroContent) {
          var REVEAL_START = 0.82;  // text begins appearing
          var REVEAL_END   = 0.97;  // text fully visible
          var t = 0;

          if (progress >= REVEAL_START) {
            // Ease-out cubic for smooth natural emergence
            var raw = Math.min(1, (progress - REVEAL_START) / (REVEAL_END - REVEAL_START));
            t = 1 - Math.pow(1 - raw, 3);  // ease-out cubic
          }

          // translateY: 20px → 0 (slides up as if emerging from below)
          heroContent.style.opacity = t;
          heroContent.style.transform = 'translateY(' + (20 * (1 - t)) + 'px)';
        }

        // ── Scroll hint auto-hide ──
        if (scrollHint) {
          if (progress > 0.04) {
            scrollHint.classList.add('hidden');
          } else {
            scrollHint.classList.remove('hidden');
          }
        }

        ticking = false;
      });
    }

    // ── If reduced motion, skip scroll animation — just show first frame ──
    if (prefersReducedMotion) {
      resizeCanvas();
      return;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      resizeCanvas();
    });
    resizeCanvas();
    onScroll(); // initial state
  }

  // ═══════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════

  function initNav() {
    const nav = document.getElementById('main-nav');
    const toggle = document.getElementById('nav-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!nav) return;

    // ── Sticky background on scroll ──
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
        navTicking = false;
      });
    }, { passive: true });

    // ── Mobile hamburger toggle ──
    if (toggle && mobileMenu) {
      toggle.addEventListener('click', function () {
        toggle.classList.toggle('active');
        mobileMenu.classList.toggle('active');
      });

      // Close on link click
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
          // Ease-out cubic
          const eased = 1 - Math.pow(1 - t, 3);
          const value = Math.floor(eased * target);

          if (target >= 10000) {
            el.textContent = (value / 1000).toFixed(1) + 'K';
          } else {
            el.textContent = value.toLocaleString();
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
      '.course__content',
      '.course__visual',
      '.testimonial-card',
      '.contact__wrapper',
      '.section__tag',
      '.section__title'
    ];

    var elements = document.querySelectorAll(selectors.join(', '));

    elements.forEach(function (el) {
      // Only add if not already inside the hero
      if (el.closest('#hero')) return;
      el.classList.add('reveal');
    });

    // Stagger siblings in grids
    document.querySelectorAll(
      '.services__grid .service-card, .testimonials__grid .testimonial-card'
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
  // FORM
  // ═══════════════════════════════════════════════════════

  window.handleSubmit = function (e) {
    e.preventDefault();

    var form = document.getElementById('contact-form');
    var btn = document.getElementById('form-submit');
    var btnText = btn.querySelector('.btn__text');
    var btnLoading = btn.querySelector('.btn__loading');

    // Show loading
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    btn.disabled = true;

    // Simulate submission
    setTimeout(function () {
      form.innerHTML =
        '<div class="form-success">' +
        '  <div class="form-success__icon">✨</div>' +
        '  <h3 class="form-success__title">ההודעה נשלחה בהצלחה!</h3>' +
        '  <p class="form-success__text">אחזור אליכם בהקדם ❤️</p>' +
        '</div>';
    }, 1400);
  };

  // ═══════════════════════════════════════════════════════
  // BOOT
  // ═══════════════════════════════════════════════════════

  document.addEventListener('DOMContentLoaded', function () {
    initHeroAnimation();
    initNav();
    initStatsCounter();
    initScrollReveal();
    initCardShine();
    initSmoothScroll();
  });
})();
