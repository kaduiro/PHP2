(function () {
    function initTeamworkInline() {
        const fadeTargets = document.querySelectorAll('.l-teamwork-main .js-fade-in, .l-teamwork-main .js-fade-in-up');
        const revealAll = () => {
            fadeTargets.forEach((element) => element.classList.add('is-visible'));
        };

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add('is-visible');
                });
            }, { threshold: 0.1 });

            fadeTargets.forEach((element) => {
                element.style.opacity = '0';
                if (element.classList.contains('js-fade-in-up')) {
                    element.style.transform = 'translateY(30px)';
                }
                element.style.transition = 'opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

                if (element.style.transitionDelay) {
                    element.style.transition = 'opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) ' + element.style.transitionDelay + ', transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) ' + element.style.transitionDelay;
                }

                observer.observe(element);
            });

            const bubbleObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add('is-visible');
                    bubbleObserver.unobserve(entry.target);
                });
            }, {
                threshold: 0.2,
                rootMargin: '0px 0px -10% 0px'
            });

            document.querySelectorAll('.l-teamwork-main .js-bubble').forEach((bubble) => {
                bubbleObserver.observe(bubble);
            });
        } else {
            revealAll();
            document.querySelectorAll('.l-teamwork-main .js-bubble').forEach((bubble) => {
                bubble.classList.add('is-visible');
            });
        }

        const style = document.createElement('style');
        style.innerHTML = '.l-teamwork-main .js-fade-in.is-visible { opacity: 1 !important; } .l-teamwork-main .js-fade-in-up.is-visible { opacity: 1 !important; transform: translateY(0) !important; }';
        document.head.appendChild(style);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTeamworkInline, { once: true });
        return;
    }

    initTeamworkInline();
})();
