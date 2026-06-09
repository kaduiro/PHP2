/**
 * Ogawa Information Theme - Animation Logic
 * Horizontal Scroll Timeline Version
 * (Particles & kw animations removed)
 */

(function () {
  'use strict';

  // Wait for GSAP to be loaded
  if (typeof gsap === 'undefined') {
    console.error('GSAP not loaded');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // ===== Fade-up Animations (with stagger support) =====
  const fadeUpElements = gsap.utils.toArray('.fade-up');

  // Set initial state to avoid FOUC
  gsap.set(fadeUpElements, { opacity: 0, y: 30 });

  fadeUpElements.forEach((el) => {
    // Calculate stagger delay from class (stagger-1, stagger-2, stagger-3)
    let staggerDelay = 0;
    if (el.classList.contains('stagger-1')) staggerDelay = 0;
    else if (el.classList.contains('stagger-2')) staggerDelay = 0.12;
    else if (el.classList.contains('stagger-3')) staggerDelay = 0.24;

    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      delay: staggerDelay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      }
    });
  });

  // ===== Keyword Underline Animation (no particles) =====
  const keywords = document.querySelectorAll('.kw');

  keywords.forEach(kw => {
    ScrollTrigger.create({
      trigger: kw,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        kw.classList.add('is-visible');
      }
    });
  });

  // ===== History Horizontal Scroll — Card Fade In =====
  const historyCards = document.querySelectorAll('.history-card');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    historyCards.forEach(card => {
      card.classList.add('is-visible');
    });
  } else {
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    });

    historyCards.forEach(card => {
      cardObserver.observe(card);
    });
  }

  // ===== History Navigation Buttons =====
  const eras = document.querySelectorAll('.history-era');

  eras.forEach(era => {
    const scroll = era.querySelector('.history-scroll');
    const prevBtn = era.querySelector('.history-nav-prev');
    const nextBtn = era.querySelector('.history-nav-next');

    if (!scroll || !prevBtn || !nextBtn) return;

    function getCardWidth() {
      const card = scroll.querySelector('.history-card');
      if (!card) return 400;
      return card.offsetWidth + 24;
    }

    function updateButtons() {
      const maxScroll = scroll.scrollWidth - scroll.clientWidth;
      prevBtn.disabled = scroll.scrollLeft <= 5;
      nextBtn.disabled = scroll.scrollLeft >= maxScroll - 5;
    }

    prevBtn.addEventListener('click', () => {
      scroll.scrollBy({ left: -getCardWidth(), behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      scroll.scrollBy({ left: getCardWidth(), behavior: 'smooth' });
    });

    scroll.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateButtons);

    updateButtons();

    // Keyboard Arrow Scroll
    scroll.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scroll.scrollBy({ left: -getCardWidth(), behavior: 'smooth' });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        scroll.scrollBy({ left: getCardWidth(), behavior: 'smooth' });
      }
    });

    // Mouse Drag to Scroll
    let isDown = false;
    let startX = 0;
    let scrollLeftStart = 0;

    scroll.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDown = true;
      scroll.style.cursor = 'grabbing';
      startX = e.pageX - scroll.offsetLeft;
      scrollLeftStart = scroll.scrollLeft;
      e.preventDefault();
    });

    scroll.addEventListener('mouseleave', () => {
      if (isDown) {
        isDown = false;
        scroll.style.cursor = 'grab';
      }
    });

    scroll.addEventListener('mouseup', () => {
      if (isDown) {
        isDown = false;
        scroll.style.cursor = 'grab';
      }
    });

    scroll.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - scroll.offsetLeft;
      const walk = (x - startX) * 1.5;
      scroll.scrollLeft = scrollLeftStart - walk;
    });
  });

  // ===== History More Buttons (Accordion) =====
  const moreBtns = document.querySelectorAll('.history-more-btn');
  moreBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      const targetId = btn.getAttribute('aria-controls');
      const targetContent = document.getElementById(targetId);

      if (targetContent) {
        btn.setAttribute('aria-expanded', !isExpanded);
        if (!isExpanded) {
          targetContent.style.display = 'block';
          btn.querySelector('.more-icon').textContent = '-';
        } else {
          targetContent.style.display = 'none';
          btn.querySelector('.more-icon').textContent = '+';
        }
      }
    });
  });

  // Force refresh after all setups
  ScrollTrigger.refresh();

})();
