/**
 * 木造アパート新築工事 LP — page-mokuzo-apartment.js
 *
 * 1. スムーススクロール（ヘッダー + TOC オフセット対応）
 * 2. 固定CTAの表示制御（FV通過後にフェードイン）
 * 3. TOCアクティブリンク管理
 */
(function () {
    'use strict';

    function getHeaderHeight() {
        var header = document.querySelector('.okg-smart-header, .site-header, .okfp-header, .h');
        return header ? header.offsetHeight : 0;
    }

    function syncHeaderOffsetVar() {
        var root = document.documentElement;
        if (!root) return;
        var headerHeight = getHeaderHeight();
        if (headerHeight > 0) {
            root.style.setProperty('--lp-header-offset', headerHeight + 'px');
        }
    }

    function getAnchorOffset(extra) {
        var toc = document.getElementById('toc');
        var tocH = toc ? toc.offsetHeight : 0;
        return getHeaderHeight() + tocH + extra;
    }

    /* ──────────────────────────────────────
       1. Smooth scroll for anchor links
       ────────────────────────────────────── */
    document.addEventListener('click', function (e) {
        var link = e.target.closest('a[href^="#"]');
        if (!link) return;
        var href = link.getAttribute('href');
        if (href === '#') return;

        var target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        var offset = getAnchorOffset(12);
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;

        window.scrollTo({ top: top, behavior: 'smooth' });

        if (history.replaceState) {
            history.replaceState(null, '', href);
        }
    });

    /* ──────────────────────────────────────
       2. Fixed CTA visibility
       ────────────────────────────────────── */
    var fixedCta = document.getElementById('fixedCta');
    var heroEl = document.querySelector('.lp-hero');

    function toggleFixedCta() {
        if (!fixedCta || !heroEl) return;
        var heroBottom = heroEl.getBoundingClientRect().bottom;
        fixedCta.classList.toggle('is-visible', heroBottom < 0);
    }

    /* ──────────────────────────────────────
       3. TOC active state
       ────────────────────────────────────── */
    var tocLinks = document.querySelectorAll('.lp-toc__link');
    var sectionIds = [];
    tocLinks.forEach(function (link) {
        var id = link.getAttribute('href').replace('#', '');
        if (id) sectionIds.push(id);
    });

    function updateTocActive() {
        var offset = getAnchorOffset(48);
        var current = '';

        for (var i = 0; i < sectionIds.length; i++) {
            var section = document.getElementById(sectionIds[i]);
            if (!section) continue;
            if (section.getBoundingClientRect().top <= offset) {
                current = sectionIds[i];
            }
        }

        tocLinks.forEach(function (link) {
            var id = link.getAttribute('href').replace('#', '');
            link.classList.toggle('is-active', id === current);
        });
    }

    /* 笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏
       4. FEATURES cards scroll animation (GSAP + ScrollTrigger)
       笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏 */
    function initFeaturesAnimation() {
        var featureSection = document.querySelector('.lp-section--features-photo');
        if (!featureSection) return;

        var cards = Array.prototype.slice.call(featureSection.querySelectorAll('.js-feature-card'));
        if (!cards.length) return;

        var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            cards.forEach(function (card) {
                card.style.opacity = '1';
                card.style.transform = 'none';
            });
            return;
        }

        if (!window.gsap || !window.ScrollTrigger) return;
        gsap.registerPlugin(ScrollTrigger);

        var mm = gsap.matchMedia();
        mm.add(
            {
                desktop: '(min-width: 769px)',
                mobile: '(max-width: 768px)'
            },
            function (context) {
                var isDesktop = !!context.conditions.desktop;

                gsap.set(cards, {
                    opacity: 0,
                    x: function (index) {
                        if (!isDesktop) return 0;
                        return index % 2 === 0 ? -48 : 48;
                    },
                    y: isDesktop ? 20 : 38,
                    willChange: 'transform, opacity'
                });

                ScrollTrigger.batch(cards, {
                    start: 'top 88%',
                    once: true,
                    onEnter: function (batch) {
                        gsap.to(batch, {
                            opacity: 1,
                            x: 0,
                            y: 0,
                            duration: isDesktop ? 0.72 : 0.62,
                            stagger: 0.1,
                            ease: 'power2.out',
                            overwrite: true,
                            onComplete: function () {
                                batch.forEach(function (card) {
                                    card.style.willChange = 'auto';
                                });
                            }
                        });
                    }
                });
            }
        );
    }

    /* ──────────────────────────────────────
       5. ABOUT media reveal (left -> right)
       ────────────────────────────────────── */
    function initAboutMediaReveal() {
        var media = document.querySelector('.about-wood .mk-step__media');
        if (!media) return;

        var items = Array.prototype.slice.call(media.querySelectorAll('.mk-step__media-item'));
        if (!items.length) return;

        var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            items.forEach(function (item) {
                item.style.opacity = '1';
                item.style.transform = 'none';
                item.style.clipPath = 'none';
            });
            return;
        }

        if (!window.gsap || !window.ScrollTrigger) return;
        gsap.registerPlugin(ScrollTrigger);

        gsap.set(items, {
            opacity: 0,
            x: -72,
            clipPath: 'inset(0 100% 0 0)',
            willChange: 'transform, opacity, clip-path'
        });

        gsap.timeline({
            scrollTrigger: {
                trigger: media,
                start: 'top 82%',
                once: true
            }
        }).to(items, {
            opacity: 1,
            x: 0,
            clipPath: 'inset(0 0% 0 0)',
            duration: 0.82,
            ease: 'power2.out',
            stagger: 0.18,
            overwrite: true,
            onComplete: function () {
                items.forEach(function (item) {
                    item.style.willChange = 'auto';
                });
            }
        });
    }

    /* ──────────────────────────────────────
       6. Performance accordion
       ────────────────────────────────────── */
    function initMkPerformanceAccordion() {
        var section = document.querySelector('.mk-performance');
        if (!section) return;

        var items = Array.prototype.slice.call(section.querySelectorAll('.js-mk-performance-item'));
        if (!items.length) return;

        function setOpenState(item, open) {
            var trigger = item.querySelector('.js-mk-performance-trigger');
            var panel = item.querySelector('.js-mk-performance-panel');
            if (!trigger || !panel) return;

            item.classList.toggle('is-open', open);
            trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
            panel.setAttribute('aria-hidden', open ? 'false' : 'true');
        }

        items.forEach(function (item) {
            var trigger = item.querySelector('.js-mk-performance-trigger');
            if (!trigger) return;

            trigger.addEventListener('click', function () {
                var isOpen = item.classList.contains('is-open');
                setOpenState(item, !isOpen);
            });
        });
    }

    /* ──────────────────────────────────────
       7. SCOPE background marquee
       ────────────────────────────────────── */
    function initScopeMarquee() {
        var track = document.querySelector('.js-scope-marquee');
        if (!track) return;

        var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        if (!window.gsap) return;
        gsap.set(track, { xPercent: 0, force3D: true });
        gsap.to(track, {
            xPercent: -50,
            duration: 42,
            ease: 'none',
            repeat: -1
        });
    }

    /* ──────────────────────────────────────
       8. PERFORMANCE poster-flow cards
       ────────────────────────────────────── */
    /* ──────────────────────────────────────
       8. PERFORMANCE poster-flow cards (Redesigned)
       ────────────────────────────────────── */
    function initPerformancePosterFlow() {
        var section = document.querySelector('.lp-section--perf-posters');
        if (!section) return;

        var stage = section.querySelector('.lp-perf');
        if (!stage) return;

        var cards = Array.prototype.slice.call(section.querySelectorAll('.js-perf-card'));
        if (!cards.length) return;

        var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion || !window.gsap) return;

        if (window.ScrollTrigger) {
            gsap.registerPlugin(ScrollTrigger);
        }

        var mm = gsap.matchMedia();

        // Desktop Animation (>= 1024px)
        // Implements "Poster Style": Cards float in corners, Hover -> Move to Center
        mm.add("(min-width: 1024px)", function (context) {

            // 1. Initial State Setup (Hidden, pushed out)
            // Save original CSS vars to data attributes if needed, or just offset them in 'from' tween

            // Define positions per index (matching CSS roughly for reference, but GSAP controls the 'drift')
            // Using CSS vars: --x, --y, --r etc. are base. 
            // We animate --in-x/y for entry.
            // We animate --float-x/y for idle.
            // We animate --x/--y/--r/--s TO 0/0/0/1.05 for Active.

            // Reset any previous styles
            gsap.set(cards, { clearProps: "all" });

            // Entry Animation Timeline
            var introTl = gsap.timeline({ paused: true });

            cards.forEach(function (card, i) {
                // Randomize entry direction
                var xDir = i % 2 === 0 ? -1 : 1;
                var yDir = i < 2 ? -1 : 1;

                // Set initial "out" state using customizable properties
                gsap.set(card, {
                    '--in-x': (xDir * 150) + 'px',
                    '--in-y': (yDir * 100) + 'px',
                    '--in-o': 0,
                    '--in-s': 0.8
                });

                // Animate to neutral state
                introTl.to(card, {
                    '--in-x': '0px',
                    '--in-y': '0px',
                    '--in-o': 1,
                    '--in-s': 1,
                    duration: 1.0,
                    ease: "power3.out",
                    stagger: 0.1
                }, i * 0.1);
            });

            // Idle Animation (Drift)
            // Create independent timelines for each card so they de-sync naturally
            var driftTweens = [];
            cards.forEach(function (card, i) {
                // Random subtle movement
                var rX = (Math.random() * 15 + 5) * (i % 2 == 0 ? 1 : -1);
                var rY = (Math.random() * 15 + 5) * (i % 2 == 0 ? -1 : 1);
                var rR = (Math.random() * 2 + 0.5) * (i % 2 == 0 ? 1 : -1);
                var dur = 10 + Math.random() * 10; // 10-20s slow drift

                var drift = gsap.to(card, {
                    '--float-x': rX + 'px',
                    '--float-y': rY + 'px',
                    '--float-r': rR + 'deg',
                    duration: dur,
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: -1,
                    delay: Math.random() * 2
                });
                driftTweens.push(drift);
            });

            // ScrollTrigger for Entry
            ScrollTrigger.create({
                trigger: section,
                start: "top 70%",
                once: true,
                onEnter: function () {
                    introTl.play();
                }
            });

            // Interaction (Hover/Focus)
            // When hovering a card:
            // 1. That card moves to Center (x=0, y=0, r=0, s=1.05, z=100)
            // 2. We achieve this by animating the CSS variables --x, --y, --r, --s overrides using GSAP
            //    Wait, CSS has --x set to corner positions.
            //    To center it, we must negate --x. E.g. if --x is -300px, we need to animate to --x: 0px? 
            //    No, the base CSS rule sets --x. To move to center, we should animate the CSS properties themselves?
            //    Easier: Animate 'x', 'y', 'rotation', 'scale' directly with GSAP, which overrides transform?
            //    No, we set up transform to use vars. Let's animate the vars.
            //    Target: Center of container.
            //    Since .lp-perf__item is absolutely positioned from center, to center it we just need x:0, y:0.
            //    BUT --x and --y are set in CSS to place it in corner.
            //    So we need to tween --x to 0, --y to 0, --r to 0.

            // Store original values (from CSS) is hard via JS without parsing.
            // Better strategy:
            // Use a specific "Active" state class or tween.
            // Let's use GSAP to tween properties to "0" (Center) or "Original" (Corner).
            // We need to know "Original".
            // Let's hardcode offsets here again to match CSS or read them?
            // Hardcoding is robust enough for this specific design.

            var offsets = [
                { x: -340, y: -140, r: -6 }, // 1
                { x: 340, y: -120, r: 5 },  // 2
                { x: -280, y: 180, r: 3 },  // 3
                { x: 280, y: 200, r: -4 }   // 4
            ];

            // Set main card active initially (e.g. Card 2)
            var initialActiveIndex = 1;

            // Function to activate a card
            function setActive(targetIndex) {
                stage.classList.add('has-active');

                cards.forEach(function (c, i) {
                    var isTarget = (i === targetIndex);

                    if (isTarget) {
                        // Active Card: Move to Center
                        c.classList.add('is-active');
                        gsap.to(c, {
                            '--x': '0px',
                            '--y': '0px',
                            '--r': '0deg',
                            '--s': 1.05,
                            '--o': 1,
                            zIndex: 100,
                            duration: 0.6,
                            ease: "power3.out",
                            overwrite: true
                        });
                        // Pause drift for active
                        // driftTweens[i].pause(); 
                    } else {
                        // Inactive Card: Move to its Corner Position
                        c.classList.remove('is-active');
                        var pos = offsets[i];
                        gsap.to(c, {
                            '--x': pos.x + 'px',
                            '--y': pos.y + 'px',
                            '--r': pos.r + 'deg',
                            '--s': 0.95, // shrink slightly
                            '--o': 0.6, // dim
                            zIndex: 10,
                            duration: 0.6,
                            ease: "power3.out",
                            overwrite: true
                        });
                        // Resume drift
                        // driftTweens[i].play();
                    }
                });
            }

            // Function to reset (All return to corners? Or keep last active?)
            // "Keep last active" is better UX, stops jumping.
            // But if user leaves section, maybe reset? None.

            // Initial Set (After intro?) - Wait for intro to finish? 
            // Or just set the values immediately but let intro slide them in.
            // Actually, if we set CSS vars to 0 for active card, it might jump intro.
            // Let's rely on Hover mainly.

            // Interaction Listeners
            cards.forEach(function (card, i) {
                card.addEventListener('mouseenter', function () {
                    setActive(i);
                });

                card.addEventListener('focus', function () {
                    setActive(i);
                });
            });

            // Set initial active state AFTER intro?
            // Or just let them sit in corners until interaction?
            // User requested: "主役カードは初期で2枚目などに固定でOK" (Main card fixed initially, e.g. 2nd)

            // We set the initial state manually to match "Active #2, others Corner"
            // But we must do this without breaking the Intro animation.
            // Intro animate --in-x/y. 
            // We can set base --x/--y to Active/Corner configs immediately.
            setActive(1); // Set 2nd card as active initially

            return function () {
                // Cleanup
                driftTweens.forEach(function (t) { t.kill(); });
                introTl.kill();
                gsap.set(cards, { clearProps: "all" });
            };
        });

        // Tablet/Mobile Cleanup (Reset to clean state)
        mm.add("(max-width: 1023px)", function () {
            gsap.set(cards, { clearProps: "all" });
            // Simple scroll fade-in for mobile
            ScrollTrigger.batch(cards, {
                start: 'top 90%',
                onEnter: function (batch) {
                    gsap.to(batch, {
                        opacity: 1,
                        x: 0,
                        y: 0,
                        stagger: 0.1,
                        overwrite: true
                    });
                }
            });
        });
    }

    /* ──────────────────────────────────────
       Throttled scroll handler
       ────────────────────────────────────── */
    var ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(function () {
                syncHeaderOffsetVar();
                toggleFixedCta();
                updateTocActive();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    window.addEventListener('resize', syncHeaderOffsetVar, { passive: true });
    window.addEventListener('orientationchange', syncHeaderOffsetVar, { passive: true });
    window.addEventListener('load', syncHeaderOffsetVar);
    if (document.fonts && typeof document.fonts.ready === 'object') {
        document.fonts.ready.then(syncHeaderOffsetVar).catch(function () { });
    }

    // Init
    syncHeaderOffsetVar();
    toggleFixedCta();
    updateTocActive();
    initFeaturesAnimation();
    initAboutMediaReveal();
    initMkPerformanceAccordion();
    initScopeMarquee();
    initPerformancePosterFlow();
})();
