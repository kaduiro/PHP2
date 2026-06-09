(function () {
  const menuButton = document.querySelector('[data-okg-menu-button]');
  const mobileNav = document.getElementById('okg-mobile-nav');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      const expanded = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      mobileNav.hidden = expanded;
    });
  }
})();
