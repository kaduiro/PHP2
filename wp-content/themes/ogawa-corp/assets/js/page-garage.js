(function () {
  var body = document.body;
  var header = document.querySelector('.okfp-header, .site-header');
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.getElementById('okfp-nav') || document.getElementById('site-nav');
  var openClass = nav && nav.id === 'okfp-nav' ? 'okfp-nav-open' : 'nav-open';
  var desktopNavMedia = window.matchMedia ? window.matchMedia('(min-width: 992px)') : null;

  function closeNav() {
    body.classList.remove(openClass);
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
    }
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = body.classList.toggle(openClass);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    nav.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function () {
        closeNav();
      });
    });

    window.addEventListener('resize', function () {
      var isDesktop = desktopNavMedia ? desktopNavMedia.matches : window.innerWidth >= 992;
      if (isDesktop) {
        closeNav();
      }
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
      var targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') {
        return;
      }

      var target = document.querySelector(targetId);
      if (!target) {
        return;
      }

      event.preventDefault();
      var headerHeight = header ? header.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 8;

      window.scrollTo({
        top: Math.max(top, 0),
        behavior: 'smooth'
      });
    });
  });

  window.addEventListener('scroll', function () {
    if (!header) {
      return;
    }
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  });
})();
