
    document.addEventListener('DOMContentLoaded', function () {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.js-fade-in, .js-fade-in-up').forEach(el => {
            el.style.opacity = '0';
            if (el.classList.contains('js-fade-in-up')) {
                el.style.transform = 'translateY(30px)';
            }
            el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            observer.observe(el);
        });

        // Add dynamic styles for is-visible
        const style = document.createElement('style');
        style.innerHTML = `
            .js-fade-in.is-visible { opacity: 1 !important; }
            .js-fade-in-up.is-visible { opacity: 1 !important; transform: translateY(0) !important; }
        `;
        document.head.appendChild(style);
    });

