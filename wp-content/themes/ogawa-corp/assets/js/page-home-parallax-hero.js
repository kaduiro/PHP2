/* ========================================
   RECRUIT SLASH HERO SCRIPT
   ======================================== */

(function () {
    'use strict';

    var hero = document.getElementById('ogawa-parallax-hero');
    var frontLayer;
    var backLayer;
    var frontImage;
    var backImage;
    var revealItems;
    var prefersReducedMotion;

    if (!hero) {
        return;
    }

    frontLayer = hero.querySelector('[data-layer="front"]');
    backLayer = hero.querySelector('[data-layer="back"]');

    if (!frontLayer || !backLayer) {
        return;
    }

    frontImage = hero.getAttribute('data-front-image');
    backImage = hero.getAttribute('data-back-image');
    revealItems = hero.querySelectorAll('[data-hero-reveal]');
    prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (frontImage && frontLayer.querySelector('img')) {
        frontLayer.querySelector('img').src = frontImage;
    }

    if (backImage && backLayer.querySelector('img')) {
        backLayer.querySelector('img').src = backImage;
    }

    if (typeof window.gsap === 'undefined') {
        return;
    }

    if (prefersReducedMotion) {
        window.gsap.set([frontLayer, backLayer], { opacity: 1 });
        window.gsap.set(revealItems, { opacity: 1, y: 0 });
        return;
    }

    window.gsap.from([backLayer, frontLayer], {
        opacity: 0,
        y: 18,
        duration: 0.82,
        ease: 'power2.out',
        stagger: 0.08
    });

    if (revealItems.length > 0) {
        window.gsap.from(revealItems, {
            y: 18,
            opacity: 0,
            duration: 0.72,
            delay: 0.18,
            stagger: 0.07,
            ease: 'power2.out'
        });
    }
})();
