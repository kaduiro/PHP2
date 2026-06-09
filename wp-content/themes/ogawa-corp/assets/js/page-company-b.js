/**
 * Ogawa Information Theme - Animation Logic
 */

(function () {
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

  // ===== History Chronological Gradient =====
  const historyItems = document.querySelectorAll('.history-item');
  if (historyItems.length > 0) {
    const years = Array.from(historyItems).map(item => parseInt(item.dataset.year || 0));
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    historyItems.forEach(item => {
      const year = parseInt(item.dataset.year || 0);
      // Construct a normalized t (0 to 1) based on time progress
      // Clamp between 0 and 1 just in case
      let t = (year - minYear) / (maxYear - minYear);
      t = Math.max(0, Math.min(1, t));

      item.style.setProperty('--t', t.toFixed(2));
    });
  }

  // ===== Keyword Animations & Particles =====
  const keywords = document.querySelectorAll('.kw');

  keywords.forEach(kw => {
    // Determine particle type
    const isHeart = kw.classList.contains('kw--heart');
    const particleClass = isHeart ? 'particle--heart' : 'particle--star';

    ScrollTrigger.create({
      trigger: kw,
      start: "top 80%",
      once: true,
      onEnter: () => {
        kw.classList.add('is-visible');
        spawnParticles(kw, particleClass);
      },
      onEnterBack: () => {
        kw.classList.add('is-visible');
      }
    });
  });

  function spawnParticles(container, typeClass) {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const count = 12; // 10-16 particles

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.classList.add('particle', typeClass);
      if (typeClass === 'particle--heart') {
        p.classList.add(Math.random() > 0.5 ? 'is-light' : 'is-dark');
        p.innerHTML = '<span class="particle-shape" aria-hidden="true"></span>';
      }
      container.appendChild(p);

      // Random start position around center
      const startX = (Math.random() - 0.5) * 20;
      const startY = (Math.random() - 0.5) * 10;

      gsap.set(p, {
        xPercent: 0,
        yPercent: -50,
        x: startX,
        y: startY,
        scale: Math.random() * 0.5 + 0.5,
        rotation: Math.random() * 360
      });

      // Random destination
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 40; // 30-70px dispersal
      const destX = startX + Math.cos(angle) * dist;
      const destY = startY + Math.sin(angle) * dist;

      gsap.to(p, {
        x: destX,
        y: destY,
        opacity: 1,
        rotation: Math.random() * 720,
        duration: 1.6 + Math.random() * 0.4, // Slower (1.6-2.0s)
        ease: "power2.out",
        onStart: () => {
          // quick fade in
          gsap.to(p, { opacity: 0.8, duration: 0.3 });
        },
        onComplete: () => {
          // Fade out and remove
          gsap.to(p, {
            opacity: 0,
            duration: 0.8,
            onComplete: () => p.remove()
          });
        }
      });
    }
  }

  // ===== History Fade Up & Progress Line Logic =====
  // ===== History Fade Up & Progress Line Logic =====
  const historySection = document.querySelector('.history-section');
  const progressLine = document.querySelector('.history-progress-line');
  // historyItems is already defined at top of file
  const timeline = document.querySelector('.history-timeline');

  // Fade Up Trigger
  if (historyItems.length > 0) {
    historyItems.forEach(el => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        onEnter: () => el.classList.add('is-visible'),
        onLeaveBack: () => el.classList.remove('is-visible')
      });
    });
  }

  // Progress Line Logic (Scroll Listener)
  // IntersectionObserver is good for state, but exact line height needs ScrollListener or aggressive Observer
  // Use simple scroll listener for smoothness if safe, or requestAnimationFrame
  function updateProgress() {
    if (!progressLine || !timeline) return;

    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const timelineRect = timeline.getBoundingClientRect();
    const timelineTop = timelineRect.top + scrollY; // Absolute top

    // Calculate how far we've scrolled into the timeline
    // Let's say the line should reach the "center" of the viewport, 
    // OR track the last visible item.

    let maxActiveY = 0;
    let activeItem = null;

    historyItems.forEach(item => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;

      // Check if item center is above viewport bottom (minus some offset)
      // i.e. user has "reached" this item
      if (rect.top < viewportHeight * 0.8) {
        maxActiveY = (rect.top + scrollY) - timelineTop + 25; // 25px offset to hit dot center
        activeItem = item;
      }
    });

    // Update Line Height
    // Constrain height between 0 and full timeline
    if (maxActiveY < 0) maxActiveY = 0;
    if (maxActiveY > timelineRect.height) maxActiveY = timelineRect.height;

    progressLine.style.height = `${maxActiveY}px`;

    // Active Class Toggle
    historyItems.forEach(item => {
      if (item === activeItem) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // Throttle or RAF
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Initial check
  updateProgress();


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
          // Open
          targetContent.style.display = 'block';
          btn.querySelector('.more-icon').textContent = '-';
        } else {
          // Close
          targetContent.style.display = 'none';
          btn.querySelector('.more-icon').textContent = '+';
        }
      }
    });
  });

  // Force refresh after all setups
  ScrollTrigger.refresh();

})();
