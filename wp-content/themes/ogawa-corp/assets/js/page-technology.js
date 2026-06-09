document.addEventListener('DOMContentLoaded', () => {

    // GSAP is loaded globally via functions.php

    // 1. Coordinates Randomization
    const coordX = document.querySelector('.js-coord-x');
    const coordY = document.querySelector('.js-coord-y');

    if (coordX && coordY) {
        window.addEventListener('scroll', () => {
            // Simple random fluctuation based on scroll
            let scrollY = window.scrollY;
            coordX.textContent = Math.floor(1000 + Math.random() * 100 + scrollY / 2);
            coordY.textContent = Math.floor(450 + Math.random() * 100 + scrollY / 3);
        });

        // Loop for idle randomization
        setInterval(() => {
            if (Math.random() > 0.7) { // occasional update
                coordX.textContent = Math.floor(1000 + Math.random() * 50);
                coordY.textContent = Math.floor(450 + Math.random() * 50);
            }
        }, 200);
    }


    // 2. Wireframe Line Drawing Animation
    const lines = document.querySelectorAll('.js-draw-line');
    const circles = document.querySelectorAll('.js-draw-circle');

    // Set initial Stroke Dash for lines
    lines.forEach(path => {
        const length = path.getTotalLength();
        gsap.set(path, {
            strokeDasharray: length,
            strokeDashoffset: length,
            opacity: 0.5
        });

        gsap.to(path, {
            strokeDashoffset: 0,
            duration: 3,
            ease: "power1.inOut",
            repeat: -1,
            yoyo: true,
            repeatDelay: 1,
            stagger: {
                each: 0.5,
                from: "random"
            }
        });
    });

    // Circles drawing
    circles.forEach(circle => {
        // Approximate length for circles logic if totalLength fails, usually it works
        const length = circle.getTotalLength();
        gsap.set(circle, {
            strokeDasharray: length,
            strokeDashoffset: length
        });

        gsap.to(circle, {
            strokeDashoffset: 0,
            duration: 4,
            ease: "none",
            repeat: -1,
            repeatDelay: 0
        });

        // Rotate circles
        gsap.to(circle, {
            rotation: 360,
            transformOrigin: "center",
            duration: 20,
            ease: "none",
            repeat: -1
        });
    });


    // 3. Plus Marks Rotation
    const plusMarks = document.querySelectorAll('.js-plus-marks path');

    gsap.to(plusMarks, {
        rotation: 360,
        transformOrigin: "center",
        duration: 10,
        ease: "none",
        repeat: -1,
        stagger: 0.5
    });

    // 4. Hero Title Reveal
    gsap.from('.p-tech-hero__title-en', {
        y: 50,
        opacity: 0,
        duration: 1.5,
        ease: "power3.out",
        delay: 0.5
    });


    gsap.from('.p-tech-hero__title-jp', {
        y: 20,
        opacity: 0,
        duration: 1.5,
        ease: "power3.out",
        delay: 0.8
    });

    // Register ScrollTrigger to be safe
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // 5. Message Block Scroll Animation
    const messageBlock = document.querySelector('.p-tech-message-block');
    if (messageBlock) {
        console.log("Message block found, attaching animation");
        gsap.to(messageBlock, {
            scrollTrigger: {
                trigger: messageBlock,
                start: 'top 90%', // Trigger earlier (when top of element hits 90% of viewport height)
                toggleActions: 'play none none reverse',
                // markers: true // Uncomment for debugging
            },
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out"
        });
        console.error("Message block not found");
    }

    // 6. Hero Recede Animation (Parallax effect)
    // The hero stays slightly and scales down as user scrolls
    gsap.to('.p-tech-hero', {
        scrollTrigger: {
            trigger: '.l-tech-main', // Trigger based on the main wrapper
            start: 'top top',
            end: 'bottom bottom',
            scrub: true
        },
        y: 100, // Move down slightly (parallax)
        scale: 0.9, // Shrink
        opacity: 0, // Fade out
        ease: "none"
    });

});
