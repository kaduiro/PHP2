document.addEventListener('DOMContentLoaded', () => {
    console.log("Recruit JS loaded - initiating grid animation");

    const animContainer = document.getElementById('js-recruit-grid-anim');
    if (!animContainer) {
        console.error("Animation container #js-recruit-grid-anim not found");
        return;
    }

    // Grid size (must match CSS background-size)
    const gridSize = 30;

    // Configuration
    const simultaneousHighlights = 3; // Max number of highlights at once
    const highlightDuration = 2000; // Duration of highlight (fade in/out) in ms
    const minInterval = 1000; // Min time between new highlights
    const maxInterval = 3000; // Max time between new highlights

    function createHighlight() {
        if (!animContainer) return;

        // Get container dimensions
        const rect = animContainer.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Calculate max grid cells
        const maxCols = Math.floor(width / gridSize);
        const maxRows = Math.floor(height / gridSize);

        // Pick random cell
        const randomCol = Math.floor(Math.random() * maxCols);
        const randomRow = Math.floor(Math.random() * maxRows);

        const x = randomCol * gridSize;
        const y = randomRow * gridSize;

        // Create highlight element
        const highlight = document.createElement('div');
        highlight.classList.add('p-recruit-concept__glimmer');
        highlight.style.width = `${gridSize}px`;
        highlight.style.height = `${gridSize}px`;
        highlight.style.left = `${x}px`;
        highlight.style.top = `${y}px`;

        animContainer.appendChild(highlight);

        // Remove after animation completes (wait for CSS transition/animation)
        // CSS animation duration should match highlightDuration roughly, or be handled by CSS entirely
        setTimeout(() => {
            if (highlight.parentNode) {
                highlight.parentNode.removeChild(highlight);
            }
        }, highlightDuration + 500); // slightly longer buffer
    }

    // Loop to create highlights
    function scheduleNextHighlight() {
        const interval = Math.floor(Math.random() * (maxInterval - minInterval + 1) + minInterval);

        setTimeout(() => {
            // Check if we have too many active highlights? 
            // Implementation: just simpler to fire based on interval.
            // If strict limit needed, count children.
            const activeHighlights = animContainer.querySelectorAll('.p-recruit-concept__glimmer').length;

            if (activeHighlights < simultaneousHighlights) {
                createHighlight();
            }

            scheduleNextHighlight();
        }, interval);
    }

    // Start loop
    createHighlight(); // Force one immediately
    scheduleNextHighlight();
});
