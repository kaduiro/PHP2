(function () {
  'use strict';

  var section = document.querySelector('.okg-cv');
  if (!section) return;

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  var art = section.querySelector('[data-cv-art]');
  var pulse = section.querySelector('[data-cv-pulse]');

  function showImmediate() {
    if (art) {
      art.style.opacity = '1';
      art.style.transform = 'none';
    }
  }

  if (!hasGsap || prefersReducedMotion) {
    showImmediate();
    return;
  }

  window.gsap.registerPlugin(window.ScrollTrigger);

  if (pulse) {
    window.gsap.set(pulse, { xPercent: -50, yPercent: -50, scale: 0 });
  }

  var tl = window.gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 60%',
      once: true,
    },
    defaults: { ease: 'power2.out' },
  });

  if (art) {
    tl.fromTo(art,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.78, ease: 'power3.out' }
    );
  }

  if (pulse) {
    tl.fromTo(pulse,
      { scale: 0, opacity: 0 },
      { scale: 4.4, opacity: 1, duration: 0.46, ease: 'power1.out' },
      '-=0.28'
    );
    tl.to(pulse, { opacity: 0, duration: 0.48, ease: 'power2.in' }, '-=0.25');
  }

})();
