(function () {
  'use strict';

  document.documentElement.classList.add('has-js');

  function initLoader() {
    var loader = document.querySelector('[data-ogawa-loader]');
    var hero = document.querySelector('[data-ogawa-hero]');
    var heroVideo = document.querySelector('[data-ogawa-hero-video]');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var startedAt = Date.now();
    var loaderDuration = 4000;
    var completed = false;

    if (!loader) {
      return;
    }

    document.documentElement.classList.add('okg-home-is-loading');

    function complete() {
      if (completed) {
        return;
      }

      completed = true;
      var remaining = Math.max(0, loaderDuration - (Date.now() - startedAt));

      window.setTimeout(function () {
        loader.classList.add('is-complete');
        document.documentElement.classList.remove('okg-home-is-loading');

        window.setTimeout(function () {
          if (loader.parentNode) {
            loader.parentNode.removeChild(loader);
          }
        }, 900);
      }, remaining);
    }

    function useHeroFallback() {
      if (hero) {
        hero.classList.add(reducedMotion ? 'is-video-reduced' : 'is-video-failed');
      }
      complete();
    }

    if (heroVideo) {
      if (reducedMotion) {
        useHeroFallback();
      } else {
        heroVideo.addEventListener('canplay', complete, { once: true });
        heroVideo.addEventListener('error', useHeroFallback, { once: true });

        if (heroVideo.readyState >= 3) {
          complete();
        }
      }
    }

    window.addEventListener('load', complete, { once: true });
    window.setTimeout(complete, loaderDuration);
  }

  function initCarousel() {
    var hero = document.querySelector('[data-ogawa-hero]');
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-ogawa-hero-slide]'));
    var newsItems = Array.prototype.slice.call(document.querySelectorAll('[data-ogawa-news-item]'));
    var newsCount = document.querySelector('[data-ogawa-news-count]');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var index = 0;
    var timer = null;

    function activate(nextIndex) {
      if (slides.length > 0) {
        index = nextIndex % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle('is-active', slideIndex === index);
        });
      }

      if (newsItems.length > 0) {
        var newsIndex = index % newsItems.length;
        newsItems.forEach(function (item, itemIndex) {
          var active = itemIndex === newsIndex;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-hidden', active ? 'false' : 'true');
        });

        if (newsCount) {
          newsCount.textContent = String(newsIndex + 1).padStart(2, '0');
        }
      }
    }

    function start() {
      if (reducedMotion || slides.length < 2 || timer !== null) {
        return;
      }

      timer = window.setInterval(function () {
        activate(index + 1);
      }, 5500);
    }

    function stop() {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });

    activate(0);
    start();
  }

  function initReveal() {
    var targets = document.querySelectorAll('[data-okg-reveal]');
    if (!targets.length) {
      return;
    }

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach(function (target) {
        target.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

    targets.forEach(function (target) {
      observer.observe(target);
    });
  }

  function init() {
    initLoader();
    initCarousel();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
