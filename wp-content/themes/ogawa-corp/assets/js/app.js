(function() {
  'use strict';

  /* ===== 繝ｭ繝ｼ繝・ぅ繝ｳ繧ｰ・・oading.mp4 竊・繝輔ぉ繝ｼ繝峨い繧ｦ繝・竊・譛ｬ邱ｨ繝偵・繝ｭ繝ｼ蜍慕判蜀咲函・・===== */
  var loadingEl = document.getElementById('loading');
  var loadWrap = document.getElementById('loadWrap');
  var LOADER_MIN_MS = 7000;
  var LOADER_MAX_MS = 14000;
  var loaderStartedAt = Date.now();
  var loaderFinished = false;
  var loaderFinishQueued = false;
  var loaderHardTimeoutId = null;

  function initLoader() {
    if (!loadingEl || !loadWrap) return;
    loadingEl.classList.add('load_init');
  }

  function markLoaded() {
    if (loaderFinished) return;
    loaderFinished = true;
    if (loaderHardTimeoutId) {
      clearTimeout(loaderHardTimeoutId);
      loaderHardTimeoutId = null;
    }
    document.body.classList.add('is-loaded');
    if (loadingEl) {
      loadingEl.setAttribute('aria-hidden', 'true');
    }
  }

  function finishLoader() {
    if (loaderFinished) return;
    if (!loadWrap || !loadingEl) {
      markLoaded();
      return;
    }
    loadWrap.style.opacity = '0';
    loadWrap.style.transform = 'scale(1.08)';
    loadWrap.style.filter = 'blur(10px)';
    loadWrap.style.transitionDuration = '0.5s';

    var transitionHandled = false;
    function onTransitionEnd() {
      if (transitionHandled) return;
      transitionHandled = true;
      markLoaded();
    }

    loadWrap.addEventListener('transitionend', onTransitionEnd, { once: true });
    setTimeout(onTransitionEnd, 600);
  }

  function queueLoaderFinish() {
    if (loaderFinishQueued || loaderFinished) return;
    loaderFinishQueued = true;
    var elapsed = Date.now() - loaderStartedAt;
    var wait = Math.max(0, LOADER_MIN_MS - elapsed);
    setTimeout(finishLoader, wait);
  }

  if (loadingEl) {
    initLoader();
    loaderHardTimeoutId = setTimeout(finishLoader, LOADER_MAX_MS);

    if (document.readyState === 'complete') {
      queueLoaderFinish();
    } else {
      window.addEventListener('load', function() {
        window.scrollTo(0, 0);
        queueLoaderFinish();
      }, { once: true });

      // Fallback: do not keep loader forever if `load` is delayed by media/network.
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(queueLoaderFinish, 1200);
      }, { once: true });
    }
  }

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasSmartHeader = !!document.querySelector('[data-okg-smart-header]');

  var SCROLL_THRESHOLD = 50;
  var header = hasSmartHeader ? null : (document.querySelector('.site-header') || document.querySelector('.h'));
  var drawerNav = hasSmartHeader ? null : (document.getElementById('drawer-nav') || document.getElementById('drawer_nav'));
  var drawerOverlay = hasSmartHeader ? null : (document.querySelector('.drawer-overlay') || document.querySelector('.drawer_overlay'));
  var hamburgerBtn = hasSmartHeader ? null : (document.querySelector('.hamburger-btn') || document.getElementById('js_navbtn'));
  var pageTopLink = document.querySelector('.page-top-link') || document.querySelector('.pagetop a');
  var SCROLL_CONTAINER_SELECTOR = '[data-scroll-container]';

  function getLocoScroll() {
    if (window.locoScroll && typeof window.locoScroll.on === 'function') {
      return window.locoScroll;
    }
    return null;
  }

  function getCurrentScrollY() {
    var loco = getLocoScroll();
    if (loco && loco.scroll && loco.scroll.instance && loco.scroll.instance.scroll) {
      return loco.scroll.instance.scroll.y || 0;
    }
    return window.pageYOffset || window.scrollY || 0;
  }

  function scrollToTarget(target) {
    var loco = getLocoScroll();
    if (loco) {
      loco.scrollTo(target, { duration: 800, disableLerp: false });
      return;
    }
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: 'smooth' });
    } else if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function stopPageScroll() {
    var loco = getLocoScroll();
    if (loco && typeof loco.stop === 'function') {
      loco.stop();
    }
    document.body.style.overflow = 'hidden';
  }

  function startPageScroll() {
    var loco = getLocoScroll();
    if (loco && typeof loco.start === 'function') {
      loco.start();
      if (typeof loco.update === 'function') {
        loco.update();
      }
    }
    document.body.style.overflow = '';
  }

  function updateScrolled() {
    if (!header) return;
    var y = getCurrentScrollY();
    if (y > SCROLL_THRESHOLD) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('load', function() {
    var loco = getLocoScroll();
    if (loco) {
      loco.on('scroll', function() {
        updateScrolled();
      });
      updateScrolled();
      return;
    }
    window.addEventListener('scroll', updateScrolled, { passive: true });
    updateScrolled();
  }, { once: true });

  function openDrawer() {
    if (drawerNav) drawerNav.classList.add('is-open');
    if (drawerOverlay) drawerOverlay.classList.add('is-open');
    if (hamburgerBtn) {
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      hamburgerBtn.setAttribute('aria-label', 'Close menu');
    }
    if (drawerNav) drawerNav.setAttribute('aria-hidden', 'false');
    if (drawerOverlay) drawerOverlay.setAttribute('aria-hidden', 'false');
    stopPageScroll();
  }

  function closeDrawer() {
    if (drawerNav) drawerNav.classList.remove('is-open');
    if (drawerOverlay) drawerOverlay.classList.remove('is-open');
    if (hamburgerBtn) {
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      hamburgerBtn.setAttribute('aria-label', 'Open menu');
    }
    if (drawerNav) drawerNav.setAttribute('aria-hidden', 'true');
    if (drawerOverlay) drawerOverlay.setAttribute('aria-hidden', 'true');
    startPageScroll();
  }

  if (hamburgerBtn && drawerNav) {
    hamburgerBtn.addEventListener('click', function() {
      var isOpen = drawerNav.classList.contains('is-open');
      if (isOpen) closeDrawer();
      else openDrawer();
    });
  }
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeDrawer);
  }

  if (pageTopLink) {
    pageTopLink.addEventListener('click', function(e) {
      e.preventDefault();
      scrollToTarget(0);
    });
  }

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion) {
    gsap.registerPlugin(ScrollTrigger);
    if (document.querySelector(SCROLL_CONTAINER_SELECTOR)) {
      ScrollTrigger.defaults({ scroller: SCROLL_CONTAINER_SELECTOR });
    }

    var fadeUpElements = gsap.utils.toArray('.fade-up');
    gsap.set(fadeUpElements, { opacity: 0, y: 40 });
    fadeUpElements.forEach(function(el) {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      });
    });

    // ===== NEWS 繧ｻ繧ｯ繧ｷ繝ｧ繝ｳ - 繝ｪ繧ｹ繝医い繧､繝・Β繧ｹ繧ｿ繧ｬ繝ｼ =====
    var newsItems = document.querySelectorAll('.news-list li');
    var newsSection = document.getElementById('news-section');
    if (newsItems.length > 0) {
      gsap.fromTo(newsItems,
        { x: -30, opacity: 0 },
        {
          x: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out',
          scrollTrigger: {
            trigger: newsSection || newsItems[0],
            start: 'top 70%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    // ===== message-section / news-section: ScrollTrigger で確実に表示 =====
    // IntersectionObserver は Lenis との相性問題があるため ScrollTrigger に切り替え
    var bizInners = gsap.utils.toArray('#message-section .t_biz__inner, #news-section .t_biz__inner');
    bizInners.forEach(function(el, i) {
      gsap.fromTo(el,
        { opacity: 0, y: 32 },
        {
          opacity: 1, y: 0,
          duration: 0.88,
          delay: i * 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true
          }
        }
      );
    });

    var parallaxBgs = gsap.utils.toArray('.parallax-bg');
    parallaxBgs.forEach(function(bg) {
      gsap.to(bg, {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: bg.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    // ===== Dark Scroll Transition =====
    var darkScrollSection = document.getElementById('okg-dark-scroll');
    var darkScrollTexts = darkScrollSection ? gsap.utils.toArray('#okg-dark-scroll .okg-dark-scroll__text') : [];

    /*
     * CSS sticky が位置固定を担うため、GSAP pin は廃止。
     * wrapper (.okg-dark-scroll-wrapper) をトリガーにして
     * wrapper 全体のスクロール量 (420vh) にわたってテキストをアニメーション。
     */
    var darkScrollWrapper = darkScrollSection ? darkScrollSection.closest('.okg-dark-scroll-wrapper') : null;

    if (darkScrollSection && darkScrollTexts.length > 0) {
      gsap.set(darkScrollTexts, { opacity: 0, y: 96 });

      var darkTl = gsap.timeline({
        scrollTrigger: {
          trigger: darkScrollWrapper || darkScrollSection,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        }
      });

      darkScrollTexts.forEach(function(text) {
        darkTl
          .fromTo(text,
            { opacity: 0, y: 96 },
            { opacity: 1, y: 0, duration: 0.34, ease: 'power2.out' }
          )
          .to(text, { duration: 0.32 })
          .to(text, { opacity: 0, y: -96, duration: 0.34, ease: 'power2.in' });
      });
    }

  } else if (prefersReducedMotion && typeof gsap !== 'undefined') {
    gsap.set('.fade-up', { opacity: 1, y: 0 });
  }

  function initHomeBlueMotion() {
    if (!document.body || (!document.body.classList.contains('home') && !document.body.classList.contains('front-page'))) {
      return;
    }

    var motionTargets = document.querySelectorAll([
      '.okg-home-essence__header',
      '.okg-home-essence__card',
      '.okg-biz__entry-copy',
      '.okg-biz__entry-media',
      '.okg-home-prefooter__inner'
    ].join(','));

    if (!motionTargets.length) {
      return;
    }

    document.documentElement.classList.add('is-home-blue-ready');

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      motionTargets.forEach(function(target) {
        target.classList.add('okg-home-blue-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('okg-home-blue-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.08,
      rootMargin: '-8% 0px -10% 0px'
    });

    motionTargets.forEach(function(target, index) {
      target.style.transitionDelay = Math.min(index % 3, 2) * 90 + 'ms';
      observer.observe(target);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeBlueMotion, { once: true });
  } else {
    initHomeBlueMotion();
  }

  var youtubeModal = document.getElementById('youtube-modal');
  var youtubeIframe = document.getElementById('youtube-iframe');
  var youtubeOpenBtns = document.querySelectorAll('.js-youtube-open');
  var youtubeCloseBtns = document.querySelectorAll('.js-youtube-close');

  function openYoutubeModal(videoId) {
    if (!youtubeModal || !youtubeIframe) return;
    var src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';
    youtubeIframe.setAttribute('src', src);
    youtubeModal.classList.add('is-open');
    youtubeModal.setAttribute('aria-hidden', 'false');
    stopPageScroll();
  }

  function closeYoutubeModal() {
    if (!youtubeModal || !youtubeIframe) return;
    youtubeIframe.setAttribute('src', '');
    youtubeModal.classList.remove('is-open');
    youtubeModal.setAttribute('aria-hidden', 'true');
    startPageScroll();
  }

  youtubeOpenBtns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var id = btn.getAttribute('data-youtube-id');
      if (id) openYoutubeModal(id);
    });
  });
  youtubeCloseBtns.forEach(function(btn) {
    btn.addEventListener('click', closeYoutubeModal);
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && youtubeModal && youtubeModal.classList.contains('is-open')) {
      closeYoutubeModal();
    }
  });
})();

