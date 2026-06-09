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

  // ===== Keyword Underline Animation (replay enabled) =====
  const keywords = document.querySelectorAll('.kw');

  function replayKeywordAnimation(el) {
    // Remove + re-add class to retrigger CSS transition/keyframe.
    el.classList.remove('is-visible');
    void el.offsetWidth;
    el.classList.add('is-visible');
  }

  keywords.forEach(kw => {
    ScrollTrigger.create({
      trigger: kw,
      start: 'top 80%',
      onEnter: () => replayKeywordAnimation(kw),
      onEnterBack: () => replayKeywordAnimation(kw),
      onLeaveBack: () => {
        // Reset when section is scrolled above trigger point.
        kw.classList.remove('is-visible');
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

  // ===== Philosophy Background Canvas Animation (Glamorous Light Blue Bokeh) =====
  const philosophyCanvas = document.getElementById('philosophy-canvas');
  if (philosophyCanvas && !prefersReducedMotion) {
    const ctx = philosophyCanvas.getContext('2d');
    let width, height;
    let particles = [];

    function resizeCanvas() {
      const section = philosophyCanvas.parentElement;
      width = section.offsetWidth;
      height = section.offsetHeight;
      philosophyCanvas.width = width;
      philosophyCanvas.height = height;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class BokehParticle {
      constructor() {
        this.reset();
        this.y = Math.random() * height; // Initial random height
      }
      
      reset() {
        this.size = Math.random() * 150 + 80; // 80 to 230
        this.x = Math.random() * width;
        this.y = height + this.size + Math.random() * 200;
        this.speedY = Math.random() * 0.6 + 0.2;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.baseOpacity = Math.random() * 0.15 + 0.05; // 0.05 to 0.20
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.02;
      }
      
      update() {
        this.y -= this.speedY;
        this.angle += this.spin;
        this.x += Math.sin(this.angle) * 0.5;

        // Reset if moved off screen
        if (this.y < -this.size * 2) {
          this.reset();
        }
      }
      
      draw() {
        ctx.save();
        // Screen blend mode to create glowing overlapping effect
        ctx.globalCompositeOperation = 'screen';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        // Soft gradient circle
        const gradient = ctx.createRadialGradient(this.x, this.y, this.size * 0.1, this.x, this.y, this.size);
        // #3E92CC is the accent color
        gradient.addColorStop(0, `rgba(135, 206, 250, ${this.baseOpacity})`);
        gradient.addColorStop(0.6, `rgba(62, 146, 204, ${this.baseOpacity * 0.5})`);
        gradient.addColorStop(1, `rgba(62, 146, 204, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
      }
    }

    const particleCount = Math.min(Math.floor(window.innerWidth / 100), 10);
    for (let i = 0; i < particleCount; i++) {
      particles.push(new BokehParticle());
    }

    let animationFrameId;
    function animateParticles() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animateParticles);
    }
    
    // Only animate when visible to save performance
    let isVisible = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!isVisible) {
            isVisible = true;
            animateParticles();
          }
        } else {
          if (isVisible) {
            isVisible = false;
            cancelAnimationFrame(animationFrameId);
          }
        }
      });
    }, { threshold: 0 });
    
    observer.observe(philosophyCanvas.parentElement);
  }

  // Force refresh after all setups
  ScrollTrigger.refresh();

})();
