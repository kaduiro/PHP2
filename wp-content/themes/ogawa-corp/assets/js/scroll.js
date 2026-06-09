// Scroll state handling
(function ($) {
  if (!$ || !$.fn) {
    return;
  }

  $(function () {
    const w = $(window);
    const b = $('body');
    let scrollTop;

    function getScrollTop() {
      const loco = window.locoScroll;
      if (loco && loco.scroll && loco.scroll.instance && loco.scroll.instance.scroll) {
        return loco.scroll.instance.scroll.y || 0;
      }
      return w.scrollTop();
    }

    function applyScrollState() {
      scrollTop = getScrollTop();

      if (30 <= scrollTop) {
        b.addClass('is_init');
      } else {
        b.removeClass('is_init');
      }

      if (100 <= scrollTop) {
        b.addClass('is_active');
      } else {
        b.removeClass('is_active');
      }
    }

    function bindLocoScroll() {
      const loco = window.locoScroll;
      if (!loco || typeof loco.on !== 'function') {
        return;
      }
      loco.on('scroll', applyScrollState);
      applyScrollState();
    }

    w.on('scroll', applyScrollState);
    if (document.readyState === 'complete') {
      bindLocoScroll();
    } else {
      window.addEventListener('load', bindLocoScroll, { once: true });
    }

    /*  Smooth Scroll  */
    $('#pagetop').find('a').on('click', function (e) {
      e.preventDefault();
      var href = $(this).attr('href');
      var target = $(href === '#' || href === '' ? 'html' : href);
      var position = target.offset().top;

      if (window.locoScroll && typeof window.locoScroll.scrollTo === 'function') {
        if (href === '#' || href === '') {
          window.locoScroll.scrollTo(0, { duration: 400 });
        } else {
          window.locoScroll.scrollTo(target.get(0), { duration: 400 });
        }
      } else {
        $('html, body').animate({ scrollTop: position }, 400, 'swing');
      }

      $('body').removeClass('is-open');
      return false;
    });

    applyScrollState();
  });
})(window.jQuery);
