(function () {
  'use strict';

  var pageTop = document.getElementById('pagetop');
  if (!pageTop) {
    return;
  }

  var link = pageTop.querySelector('a');
  var threshold = 100;
  var ticking = false;

  function getScrollY() {
    var loco = window.locoScroll;
    if (loco && loco.scroll && loco.scroll.instance && loco.scroll.instance.scroll) {
      return loco.scroll.instance.scroll.y || 0;
    }
    return window.pageYOffset || window.scrollY || 0;
  }

  function updateVisibility() {
    pageTop.classList.toggle('is-visible', getScrollY() >= threshold);
  }

  function requestUpdate() {
    if (ticking) {
      return;
    }
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      updateVisibility();
    });
  }

  document.addEventListener('DOMContentLoaded', updateVisibility, { once: true });
  window.addEventListener('load', updateVisibility, { once: true });
  window.addEventListener('scroll', requestUpdate, { passive: true });

  var locoScroll = window.locoScroll;
  if (locoScroll && typeof locoScroll.on === 'function') {
    locoScroll.on('scroll', requestUpdate);
  }

  if (!link) {
    return;
  }

  link.addEventListener('click', function (event) {
    event.preventDefault();

    var loco = window.locoScroll;
    if (loco && typeof loco.scrollTo === 'function') {
      loco.scrollTo(0, { duration: 800 });
      return;
    }

    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      window.scrollTo(0, 0);
    }
  });
})();
