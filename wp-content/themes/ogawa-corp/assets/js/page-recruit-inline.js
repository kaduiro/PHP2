(function () {
    function initRecruitInline() {
        document.documentElement.classList.add('is-recruit-animations-ready');

        const centerTriggerOptions = {
            threshold: 0.01,
            rootMargin: '-45% 0px -45% 0px'
        };

        const fadeTargets = document.querySelectorAll('.l-recruit-main .js-fade-in, .l-recruit-main .js-fade-in-up');
        const revealAll = (elements) => {
            elements.forEach((element) => element.classList.add('is-visible'));
        };

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                });
            }, centerTriggerOptions);

            fadeTargets.forEach((element) => observer.observe(element));

            const interviewTriggers = document.querySelectorAll('.l-recruit-main .js-interview-pop-trigger');
            if (interviewTriggers.length > 0) {
                const interviewObserver = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) {
                            return;
                        }

                        const interviewCard = entry.target.querySelector('.js-interview-pop');
                        if (interviewCard) {
                            interviewCard.classList.add('is-visible');
                        }
                        interviewObserver.unobserve(entry.target);
                    });
                }, centerTriggerOptions);

                interviewTriggers.forEach((trigger) => interviewObserver.observe(trigger));
            }

            const benefitTriggers = document.querySelectorAll('.l-recruit-main .js-benefit-pop-trigger');
            if (benefitTriggers.length > 0) {
                const benefitObserver = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) {
                            return;
                        }

                        const benefitCard = entry.target.querySelector('.js-benefit-pop');
                        if (benefitCard) {
                            benefitCard.classList.add('is-visible');
                        }
                        benefitObserver.unobserve(entry.target);
                    });
                }, {
                    threshold: 0.01,
                    rootMargin: '-10% 0px -10% 0px'
                });

                benefitTriggers.forEach((trigger) => benefitObserver.observe(trigger));
            }

            const cultureCards = document.querySelectorAll('.l-recruit-main .js-culture-pop');
            const cultureGrid = document.querySelector('.l-recruit-main .p-recruit-concept__grid');
            if (cultureGrid && cultureCards.length > 0) {
                const cultureObserver = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) {
                            return;
                        }

                        cultureCards.forEach((card) => card.classList.add('is-visible'));
                        cultureObserver.unobserve(cultureGrid);
                    });
                }, centerTriggerOptions);

                cultureObserver.observe(cultureGrid);
            }

            const counters = document.querySelectorAll('.l-recruit-main .js-counter');
            if (counters.length > 0) {
                const numObserver = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) {
                            return;
                        }

                        const counter = entry.target;
                        const target = parseInt(counter.getAttribute('data-target'), 10);
                        if (Number.isNaN(target)) {
                            numObserver.unobserve(counter);
                            return;
                        }

                        let count = 0;
                        const duration = 2000;
                        const increment = target / (duration / 16);

                        const updateCount = () => {
                            count += increment;
                            if (count < target) {
                                counter.innerText = Math.ceil(count);
                                requestAnimationFrame(updateCount);
                                return;
                            }

                            counter.innerText = String(target);
                        };

                        updateCount();
                        numObserver.unobserve(counter);
                    });
                }, { threshold: 0.5 });

                counters.forEach((counter) => numObserver.observe(counter));
            }
        } else {
            revealAll(fadeTargets);
            document.querySelectorAll('.l-recruit-main .js-interview-pop, .l-recruit-main .js-benefit-pop, .l-recruit-main .js-culture-pop').forEach((element) => {
                element.classList.add('is-visible');
            });
            document.querySelectorAll('.l-recruit-main .js-counter').forEach((counter) => {
                const target = parseInt(counter.getAttribute('data-target'), 10);
                if (!Number.isNaN(target)) {
                    counter.innerText = String(target);
                }
            });
        }

        const conceptModal = document.getElementById('recruit-concept-modal');
        if (!conceptModal) {
            return;
        }

        const conceptPanels = Array.from(conceptModal.querySelectorAll('[data-concept-panel]'));
        const conceptOpeners = document.querySelectorAll('.l-recruit-main [data-concept-open]');
        const conceptClosers = conceptModal.querySelectorAll('[data-concept-close]');
        let lastFocusedElement = null;

        const closeConceptModal = () => {
            conceptModal.classList.remove('is-open');
            conceptModal.setAttribute('aria-hidden', 'true');
            document.documentElement.classList.remove('is-recruit-modal-open');
            document.body.classList.remove('is-recruit-modal-open');

            conceptPanels.forEach((panel) => {
                panel.hidden = true;
            });

            if (lastFocusedElement instanceof HTMLElement) {
                lastFocusedElement.focus();
            }
        };

        const openConceptModal = (slug, trigger) => {
            const targetPanel = conceptModal.querySelector('[data-concept-panel="' + slug + '"]');
            if (!targetPanel) {
                return;
            }

            conceptPanels.forEach((panel) => {
                panel.hidden = panel !== targetPanel;
            });

            lastFocusedElement = trigger;
            conceptModal.classList.add('is-open');
            conceptModal.setAttribute('aria-hidden', 'false');
            document.documentElement.classList.add('is-recruit-modal-open');
            document.body.classList.add('is-recruit-modal-open');

            const closeButton = conceptModal.querySelector('.p-recruit-concept-modal__close');
            if (closeButton instanceof HTMLElement) {
                closeButton.focus();
            }
        };

        conceptOpeners.forEach((opener) => {
            opener.addEventListener('click', () => {
                openConceptModal(opener.getAttribute('data-concept-open'), opener);
            });
        });

        conceptClosers.forEach((closer) => {
            closer.addEventListener('click', closeConceptModal);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && conceptModal.classList.contains('is-open')) {
                closeConceptModal();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRecruitInline, { once: true });
        return;
    }

    initRecruitInline();
})();
