(function () {
  'use strict';

  var section = document.querySelector('.okg-business');
  if (!section) {
    return;
  }

  var cards = Array.prototype.slice.call(section.querySelectorAll('[data-business-card]'));
  if (!cards.length) {
    return;
  }

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var desktopMedia = window.matchMedia('(min-width: 768px)');
  var rafId = null;

  function clearActive() {
    cards.forEach(function (card) {
      card.classList.remove('is-active');
    });
  }

  function setInitialState() {
    clearActive();
    cards.forEach(function (card) {
      card.style.removeProperty('--okg-business-visibility');
    });

    if (!desktopMedia.matches || prefersReducedMotion.matches) {
      cards.forEach(function (card) {
        card.classList.add('is-active');
      });
      return;
    }

    cards[0].classList.add('is-active');
  }

  function updateActiveCard() {
    if (!desktopMedia.matches || prefersReducedMotion.matches) {
      return;
    }

    var viewportCenter = window.innerHeight * 0.46;
    var bestCard = cards[0];
    var bestScore = Number.POSITIVE_INFINITY;

    cards.forEach(function (card) {
      var rect = card.getBoundingClientRect();
      var cardCenter = rect.top + (rect.height * 0.42);
      var distance = Math.abs(cardCenter - viewportCenter);

      if (distance < bestScore) {
        bestScore = distance;
        bestCard = card;
      }
    });

    cards.forEach(function (card) {
      card.classList.toggle('is-active', card === bestCard);
    });
  }

  function requestTick() {
    if (rafId !== null) {
      return;
    }

    rafId = window.requestAnimationFrame(function () {
      rafId = null;
      updateActiveCard();
    });
  }

  function handleModeChange() {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }

    setInitialState();
    updateActiveCard();
  }

  setInitialState();
  updateActiveCard();

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);

  if (typeof desktopMedia.addEventListener === 'function') {
    desktopMedia.addEventListener('change', handleModeChange);
    prefersReducedMotion.addEventListener('change', handleModeChange);
  } else if (typeof desktopMedia.addListener === 'function') {
    desktopMedia.addListener(handleModeChange);
    prefersReducedMotion.addListener(handleModeChange);
  }
})();
