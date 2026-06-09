/**
 * Ogawa Information Theme - Animation Logic
 */

(function() {
  'use strict';

  // Wait for GSAP to be loaded
  if (typeof gsap === 'undefined') {
      console.error('GSAP not loaded');
      return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // ===== Fade-up Animations =====
  const fadeUpElements = gsap.utils.toArray('.fade-up');

  // Set initial state to avoid FOUC
  gsap.set(fadeUpElements, { opacity: 0, y: 30 });

  fadeUpElements.forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%', // Trigger slightly earlier
        toggleActions: 'play none none reverse',
      }
    });
  });

  // Force refresh after all setups
  ScrollTrigger.refresh();

})();
