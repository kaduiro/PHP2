(function ($) {
  function getScrollTop() {
    const loco = window.locoScroll;
    if (loco && loco.scroll && loco.scroll.instance && loco.scroll.instance.scroll) {
      return loco.scroll.instance.scroll.y || 0;
    }
    return $(window).scrollTop();
  }

  function toggleTopBackground() {
    const isActive = getScrollTop() > 21;
    $('.topBg video, .topBg img').toggleClass('bgBlack', isActive);
  }

  $(window).on('scroll', toggleTopBackground);

  function bindLocoScroll() {
    const loco = window.locoScroll;
    if (!loco || typeof loco.on !== 'function') {
      return;
    }
    loco.on('scroll', toggleTopBackground);
    toggleTopBackground();
  }

  if (document.readyState === 'complete') {
    bindLocoScroll();
  } else {
    window.addEventListener('load', bindLocoScroll, { once: true });
  }

  toggleTopBackground();
})(jQuery);
