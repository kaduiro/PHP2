(function () {
  'use strict';

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  class OkgSmartHeader {
    constructor() {
      this.root = document.querySelector('[data-okg-smart-header]');
      if (!this.root) {
        return;
      }

      this.inner = this.root.querySelector('.okg-smart-header__inner');
      this.dropdownItems = this.collectDropdownItems();

      this.menuToggle = this.root.querySelector('[data-okg-menu-toggle]');
      this.drawer = this.root.querySelector('[data-okg-mobile-drawer]');
      this.backdrop = this.root.querySelector('[data-okg-drawer-backdrop]');
      this.drawerBack = this.root.querySelector('[data-okg-drawer-back]');
      this.accordionItems = this.collectAccordionItems();

      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.dropdownHoverBufferTimer = null;
      this.pendingCloseKey = null;
      this.openDropdownKey = null;
      this.isMobileOpen = false;
      this.rafId = 0;

      this.initState();
      this.initCanvas();
      this.initGsap();
      this.bindEvents();
      this.initMobileDrawer();
      this.initAccessibility();
    }

    collectDropdownItems() {
      const itemNodes = Array.from(this.root.querySelectorAll('[data-okg-dropdown-item]'));
      return itemNodes
        .map((itemNode, index) => {
          const key = itemNode.getAttribute('data-okg-dropdown-key') || 'dropdown-' + index;
          const trigger = itemNode.querySelector('[data-okg-dropdown-trigger]');
          const panel = itemNode.querySelector('[data-okg-dropdown-panel]');
          const canvas = panel
            ? panel.querySelector('[data-okg-dropdown-canvas], [data-okg-blueprint-canvas]')
            : null;

          return {
            key: key,
            item: itemNode,
            trigger: trigger,
            panel: panel,
            canvas: canvas,
            ctx: null,
            timeline: null,
            subLinks: panel ? Array.from(panel.querySelectorAll('[data-okg-sub-link], a')) : [],
            blueprint: {
              progress: 0,
              pulse: 0,
              pointerX: 0.5,
              pointerY: 0.5,
              pointerForce: 0
            }
          };
        })
        .filter((entry) => !!(entry.item && entry.trigger && entry.panel));
    }

    collectAccordionItems() {
      const groupNodes = Array.from(this.root.querySelectorAll('[data-okg-accordion-group]'));
      return groupNodes
        .map((groupNode, index) => {
          const key = groupNode.getAttribute('data-okg-accordion-key') || 'accordion-' + index;
          return {
            key: key,
            group: groupNode,
            toggle: groupNode.querySelector('[data-okg-accordion-toggle]'),
            panel: groupNode.querySelector('[data-okg-accordion-panel]')
          };
        })
        .filter((entry) => !!(entry.group && entry.toggle && entry.panel));
    }

    initState() {
      this.syncScrollState();
      this.closeAllDropdowns(true);
      this.closeMobileDrawer(true);
    }

    initCanvas() {
      this.dropdownItems.forEach((item) => {
        if (!item.canvas) {
          return;
        }
        item.ctx = item.canvas.getContext('2d');
        this.resizeCanvas(item);
      });
    }

    resizeCanvas(item) {
      if (!item || !item.canvas || !item.panel) {
        return;
      }

      const rect = item.panel.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      item.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      item.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      item.canvas.style.width = rect.width + 'px';
      item.canvas.style.height = rect.height + 'px';

      if (item.ctx) {
        item.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }

    resizeCanvases() {
      this.dropdownItems.forEach((item) => this.resizeCanvas(item));
    }

    initGsap() {
      if (typeof window.gsap === 'undefined') {
        return;
      }

      this.dropdownItems.forEach((item) => {
        item.timeline = this.createDropdownTimeline(item);
      });
    }

    createDropdownTimeline(item) {
      if (!item.panel) {
        return null;
      }

      const timeline = window.gsap.timeline({
        paused: true,
        defaults: {
          duration: 0.46,
          ease: 'power3.out'
        }
      });

      timeline.fromTo(
        item.panel,
        { opacity: 0, y: -8, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1 },
        0
      );

      const inner = item.panel.querySelector('.okg-smart-header__dropdown-inner');
      if (inner) {
        timeline.fromTo(
          inner,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.35 },
          0.1
        );
      }

      timeline.to(
        item.blueprint,
        {
          progress: 1,
          duration: this.prefersReducedMotion ? 0.1 : 0.8,
          ease: 'power2.out',
          onUpdate: () => this.renderBlueprint(item)
        },
        0
      );

      timeline.eventCallback('onReverseComplete', () => {
        if (this.openDropdownKey === item.key) {
          return;
        }
        this.applyDropdownClosedState(item);
      });

      return timeline;
    }

    bindEvents() {
      window.addEventListener('scroll', () => this.syncScrollState(), { passive: true });
      window.addEventListener('resize', () => this.resizeCanvases());

      this.dropdownItems.forEach((item) => {
        item.item.addEventListener('mouseenter', () => this.openDropdown(item.key));
        item.item.addEventListener('mouseleave', () => this.deferCloseDropdown(item.key));

        item.trigger.addEventListener('click', (event) => {
          event.preventDefault();
          if (this.openDropdownKey === item.key) {
            this.closeDropdown(item.key);
            return;
          }
          this.openDropdown(item.key);
        });

        item.panel.addEventListener('mouseenter', () => this.cancelDeferredClose());
        item.panel.addEventListener('mouseleave', () => this.deferCloseDropdown(item.key));

        item.subLinks.forEach((link) => {
          link.addEventListener('mouseenter', (event) => this.handleSubLinkHover(event, item));
          link.addEventListener('mousemove', (event) => this.handleSubLinkHover(event, item));
        });
      });

      document.addEventListener('click', (event) => {
        if (!this.openDropdownKey) {
          return;
        }
        const active = this.getDropdownByKey(this.openDropdownKey);
        if (!active || !active.item.contains(event.target)) {
          this.closeAllDropdowns();
        }
      });
    }

    initMobileDrawer() {
      if (this.menuToggle) {
        this.menuToggle.addEventListener('click', () => {
          if (this.isMobileOpen) {
            this.closeMobileDrawer();
            return;
          }
          this.openMobileDrawer();
        });
      }

      if (this.backdrop) {
        this.backdrop.addEventListener('click', () => this.closeMobileDrawer());
      }

      if (this.drawerBack) {
        this.drawerBack.addEventListener('click', (event) => {
          event.preventDefault();
          this.closeMobileDrawer();
        });
      }

      if (this.drawer) {
        this.drawer.addEventListener('click', (event) => {
          const target = event.target;
          if (!(target instanceof HTMLElement)) {
            return;
          }

          const link = target.closest('a');
          if (link) {
            this.closeMobileDrawer();
          }
        });
      }

      document.addEventListener('pointerdown', (event) => {
        if (!this.isMobileOpen || !this.drawer) {
          return;
        }

        if (this.isEventInsideNode(event, this.drawer)) {
          return;
        }

        if (this.menuToggle && this.isEventInsideNode(event, this.menuToggle)) {
          return;
        }

        this.closeMobileDrawer();
      });

      this.accordionItems.forEach((item) => {
        item.toggle.addEventListener('click', () => this.toggleAccordion(item.key));
      });
    }

    initAccessibility() {
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          this.closeAllDropdowns();
          this.closeMobileDrawer();
        }
      });

      this.dropdownItems.forEach((item) => {
        item.trigger.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (this.openDropdownKey === item.key) {
              this.closeDropdown(item.key);
              return;
            }
            this.openDropdown(item.key);
          }
        });

        item.item.addEventListener('focusin', () => this.openDropdown(item.key));
        item.item.addEventListener('focusout', (event) => {
          if (!item.item.contains(event.relatedTarget)) {
            this.deferCloseDropdown(item.key);
          }
        });
      });
    }

    syncScrollState() {
      const y = window.pageYOffset || window.scrollY || 0;
      this.root.classList.toggle('is-scrolled', y > 40);
    }

    isEventInsideNode(event, node) {
      if (!event || !node) {
        return false;
      }

      if (event.target instanceof Node && node.contains(event.target)) {
        return true;
      }

      if (typeof event.composedPath === 'function') {
        const path = event.composedPath();
        return Array.isArray(path) && path.includes(node);
      }

      return false;
    }

    getDropdownByKey(key) {
      if (!key) {
        return null;
      }
      return this.dropdownItems.find((item) => item.key === key) || null;
    }

    openDropdown(key) {
      const target = this.getDropdownByKey(key);
      if (!target) {
        return;
      }

      this.cancelDeferredClose();

      if (this.openDropdownKey === key) {
        return;
      }

      if (this.openDropdownKey) {
        this.closeDropdown(this.openDropdownKey, true);
      }

      this.openDropdownKey = key;
      target.item.classList.add('is-active');
      this.root.classList.add('is-dropdown-open');
      target.trigger.setAttribute('aria-expanded', 'true');
      target.panel.setAttribute('aria-hidden', 'false');

      this.resizeCanvas(target);
      this.startRenderLoop();

      if (target.timeline) {
        target.timeline.play(0);
        return;
      }

      target.blueprint.progress = 1;
      this.renderBlueprint(target);
    }

    closeDropdown(key, immediate) {
      const target = this.getDropdownByKey(key);
      if (!target) {
        return;
      }

      this.cancelDeferredClose();
      if (this.openDropdownKey === key) {
        this.openDropdownKey = null;
      }

      target.trigger.setAttribute('aria-expanded', 'false');

      if (immediate) {
        this.applyDropdownClosedState(target);
        return;
      }

      if (target.timeline) {
        target.timeline.reverse();
        this.updateDropdownOpenClass();
        return;
      }

      this.applyDropdownClosedState(target);
    }

    closeAllDropdowns(immediate) {
      this.cancelDeferredClose();
      this.openDropdownKey = null;

      this.dropdownItems.forEach((item) => {
        item.trigger.setAttribute('aria-expanded', 'false');
        if (immediate) {
          this.applyDropdownClosedState(item);
          return;
        }
        if (item.timeline) {
          item.timeline.reverse();
          return;
        }
        this.applyDropdownClosedState(item);
      });

      this.updateDropdownOpenClass();
    }

    deferCloseDropdown(key) {
      this.cancelDeferredClose();
      this.pendingCloseKey = key;
      this.dropdownHoverBufferTimer = window.setTimeout(() => {
        const pendingKey = this.pendingCloseKey;
        this.pendingCloseKey = null;
        if (!pendingKey) {
          return;
        }
        this.closeDropdown(pendingKey);
      }, 120);
    }

    cancelDeferredClose() {
      if (this.dropdownHoverBufferTimer) {
        window.clearTimeout(this.dropdownHoverBufferTimer);
        this.dropdownHoverBufferTimer = null;
      }
      this.pendingCloseKey = null;
    }

    updateDropdownOpenClass() {
      const hasActive = this.dropdownItems.some((item) => item.item.classList.contains('is-active'));
      this.root.classList.toggle('is-dropdown-open', hasActive);
    }

    openMobileDrawer() {
      if (!this.drawer || !this.backdrop) {
        return;
      }

      this.isMobileOpen = true;
      this.root.classList.add('is-mobile-open');
      document.body.classList.add('okg-mobile-open');
      this.drawer.setAttribute('aria-hidden', 'false');
      this.backdrop.hidden = false;
      this.menuToggle && this.menuToggle.setAttribute('aria-expanded', 'true');
      this.menuToggle && this.menuToggle.setAttribute('aria-label', 'メニューを閉じる');
    }

    closeMobileDrawer(immediate) {
      if (!this.drawer || !this.backdrop) {
        return;
      }

      this.isMobileOpen = false;
      this.root.classList.remove('is-mobile-open');
      document.body.classList.remove('okg-mobile-open');
      this.drawer.setAttribute('aria-hidden', 'true');
      this.menuToggle && this.menuToggle.setAttribute('aria-expanded', 'false');
      this.menuToggle && this.menuToggle.setAttribute('aria-label', 'メニューを開く');

      if (immediate) {
        this.backdrop.hidden = true;
      } else {
        window.setTimeout(() => {
          if (!this.isMobileOpen) {
            this.backdrop.hidden = true;
          }
        }, 300);
      }

      this.closeAllAccordions();
    }

    getAccordionByKey(key) {
      if (!key) {
        return null;
      }
      return this.accordionItems.find((item) => item.key === key) || null;
    }

    toggleAccordion(key) {
      const target = this.getAccordionByKey(key);
      if (!target) {
        return;
      }

      const isOpen = target.group.classList.contains('is-open');
      if (isOpen) {
        this.closeAccordion(target);
        return;
      }
      this.openAccordion(target);
    }

    openAccordion(target) {
      this.accordionItems.forEach((item) => {
        this.setAccordionState(item, item.key === target.key);
      });
    }

    closeAccordion(target) {
      this.setAccordionState(target, false);
    }

    closeAllAccordions() {
      this.accordionItems.forEach((item) => this.setAccordionState(item, false));
    }

    setAccordionState(item, isOpen) {
      if (!item) {
        return;
      }

      item.group.classList.toggle('is-open', isOpen);
      item.toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      item.panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      const icon = item.toggle.querySelector('span[aria-hidden="true"]');
      if (icon) {
        icon.textContent = isOpen ? '−' : '＋';
      }
    }

    startRenderLoop() {
      if (this.rafId) {
        return;
      }

      const loop = () => {
        let shouldContinue = false;

        this.dropdownItems.forEach((item) => {
          const isActive = this.openDropdownKey === item.key || item.item.classList.contains('is-active');
          const isAnimating = item.blueprint.progress > 0.01 || item.blueprint.pulse > 0.01;
          if (!isActive && !isAnimating) {
            return;
          }
          this.renderBlueprint(item);
          shouldContinue = true;
        });

        if (shouldContinue) {
          this.rafId = window.requestAnimationFrame(loop);
          return;
        }

        this.rafId = 0;
      };

      this.rafId = window.requestAnimationFrame(loop);
    }

    handleSubLinkHover(event, item) {
      if (!item || !item.canvas) {
        return;
      }

      const rect = item.canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }

      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      this.updatePointerReactiveEffect(item, x, y, 1);

      if (typeof window.gsap !== 'undefined' && !this.prefersReducedMotion) {
        window.gsap.to(item.blueprint, {
          pulse: 1,
          duration: 0.14,
          overwrite: true,
          onComplete: () => {
            window.gsap.to(item.blueprint, { pulse: 0.25, duration: 0.35 });
          }
        });
      } else {
        item.blueprint.pulse = 0.55;
      }
    }

    updatePointerReactiveEffect(item, x, y, force) {
      item.blueprint.pointerX = x;
      item.blueprint.pointerY = y;
      item.blueprint.pointerForce = clamp(force, 0, 1);
      this.startRenderLoop();
    }

    applyDropdownClosedState(item) {
      if (!item) {
        return;
      }

      item.item.classList.remove('is-active');
      item.panel.setAttribute('aria-hidden', 'true');
      item.blueprint.progress = 0;
      this.renderBlueprint(item);
      this.updateDropdownOpenClass();
    }

    renderBlueprint(item) {
      if (!item || !item.ctx || !item.canvas) {
        return;
      }

      const width = item.canvas.clientWidth;
      const height = item.canvas.clientHeight;
      if (width <= 0 || height <= 0) {
        return;
      }

      const progress = clamp(item.blueprint.progress, 0, 1);
      const pulse = item.blueprint.pulse;
      const pointerX = item.blueprint.pointerX * width;
      const pointerY = item.blueprint.pointerY * height;

      item.ctx.clearRect(0, 0, width, height);

      const gradient = item.ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(23, 28, 40, 0.45)');
      gradient.addColorStop(1, 'rgba(23, 28, 40, 0.12)');
      item.ctx.fillStyle = gradient;
      item.ctx.fillRect(0, 0, width, height);

      item.ctx.strokeStyle = 'rgba(197, 160, 89, 0.45)';
      item.ctx.lineWidth = 0.8;

      const verticalCount = 15;
      const horizontalCount = 9;
      const pad = 24;
      const drawW = Math.max(1, width - pad * 2);
      const drawH = Math.max(1, height - pad * 2);

      for (let i = 0; i <= verticalCount; i++) {
        const x = pad + (drawW / verticalCount) * i;
        const startY = pad;
        const lineProgress = clamp(progress * 1.15 - i * 0.03, 0, 1);
        const endY = startY + drawH * lineProgress;

        item.ctx.beginPath();
        item.ctx.moveTo(x, startY);
        item.ctx.lineTo(x, endY);
        item.ctx.stroke();
      }

      for (let i = 0; i <= horizontalCount; i++) {
        const y = pad + (drawH / horizontalCount) * i;
        const startX = pad;
        const lineProgress = clamp(progress * 1.25 - i * 0.05, 0, 1);
        const endX = startX + drawW * lineProgress;

        item.ctx.beginPath();
        item.ctx.moveTo(startX, y);
        item.ctx.lineTo(endX, y);
        item.ctx.stroke();
      }

      if (progress > 0.06) {
        const glowRadius = 26 + pulse * 18;
        const glow = item.ctx.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, glowRadius);
        glow.addColorStop(0, 'rgba(197, 160, 89, 0.42)');
        glow.addColorStop(1, 'rgba(197, 160, 89, 0)');
        item.ctx.fillStyle = glow;
        item.ctx.beginPath();
        item.ctx.arc(pointerX, pointerY, glowRadius, 0, Math.PI * 2);
        item.ctx.fill();
      }

      item.blueprint.pulse *= 0.92;
      item.blueprint.pointerForce *= 0.94;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      new OkgSmartHeader();
    });
    return;
  }

  new OkgSmartHeader();
})();
