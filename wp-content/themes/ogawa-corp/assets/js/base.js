(function () {
  'use strict';

  var body = document.body;
  if (!body) return;
  if (document.querySelector('[data-okg-smart-header]')) return;

  var navBtn = document.getElementById('js_navbtn');
  var navPanel = document.getElementById('js-nav');
  var navOverlay = document.querySelector('.spnav_bg');
  var navLinks = navPanel ? navPanel.querySelectorAll('a') : [];
  var header = document.querySelector('.okg-global-header') || document.querySelector('.h');

  function setHeaderScrollState() {
    if (!header) return;
    var y = window.pageYOffset || window.scrollY || 0;
    if (y > 40) {
      header.classList.add('is-scrolled');
      return;
    }
    header.classList.remove('is-scrolled');
  }

  function openNav() {
    body.classList.add('is_open');
    body.classList.remove('is_close');
    if (navBtn) navBtn.setAttribute('aria-expanded', 'true');
  }

  function closeNav() {
    body.classList.remove('is_open');
    body.classList.add('is_close');
    if (navBtn) navBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleNav() {
    if (body.classList.contains('is_open')) {
      closeNav();
      return;
    }
    openNav();
  }

  if (navBtn) {
    navBtn.addEventListener('click', toggleNav);
  }

  if (navOverlay) {
    navOverlay.addEventListener('click', closeNav);
  }

  if (navLinks.length > 0) {
    navLinks.forEach(function (link) {
      link.addEventListener('click', closeNav);
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && body.classList.contains('is_open')) {
      closeNav();
    }
  });

  window.addEventListener('scroll', setHeaderScrollState, { passive: true });
  window.addEventListener('load', setHeaderScrollState, { once: true });
  setHeaderScrollState();
})();
