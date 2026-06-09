document.addEventListener('DOMContentLoaded', () => {

    // 1. Setup Container
    const containerId = 'js-grid-trail-container';
    let container = document.getElementById(containerId);

    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        document.body.prepend(container); // Prepend to ensure it's at the top of DOM (z-index handles visual layer)
    }

    // 2. Configuration
    const cellSize = 50; // px (Target size)
    let cols = 0;
    let rows = 0;
    let cells = []; // Array to store DOM elements for fast access

    // 3. Color Logic (Infinite Blue)
    // Hue: 190 (Cyan) - 240 (Blue)
    // Sat: 60% - 100%
    // Light: 40% - 80%
    // Alpha: 0.3 - 0.6
    function getRandomBlueColor() {
        const h = Math.floor(Math.random() * (240 - 190 + 1)) + 190;
        const s = Math.floor(Math.random() * (100 - 60 + 1)) + 60;
        const l = Math.floor(Math.random() * (80 - 40 + 1)) + 40;
        const a = (Math.random() * (0.6 - 0.3) + 0.3).toFixed(2);
        return `hsla(${h}, ${s}%, ${l}%, ${a})`;
    }

    // 4. Grid Generation
    function initGrid() {
        // Clear existing
        container.innerHTML = '';
        cells = [];

        // Calculate columns and rows
        const width = window.innerWidth;
        const height = window.innerHeight;

        cols = Math.ceil(width / cellSize);
        rows = Math.ceil(height / cellSize);

        // Adjust cell size slightly to fit perfectly? 
        // Or just overflow. Overflow is easier.
        // Let's stick to fixed cell size for simpler math in mousemove.

        const totalCells = cols * rows;
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-trail-cell');
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
            fragment.appendChild(cell);
            cells.push(cell);
        }

        container.style.width = `${cols * cellSize}px`; // Ensure container wraps correctly? 
        // Actually, flex-wrap with fixed width container might be better...
        // CSS Grid is simpler for "filling".
        // But the user said "divs or CSS Grid".
        // Let's use CSS Grid on the container for perfect alignment.
        container.style.display = 'grid';
        container.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
        container.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;

        container.appendChild(fragment);
    }

    // 5. Mouse Interaction
    // Using global mouse move to avoid blocking clicks (pointer-events: none on container)
    let lastIndex = -1;

    window.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;

        // Calculate index
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        // Bounds check
        if (col < 0 || col >= cols || row < 0 || row >= rows) return;

        const index = row * cols + col;

        // Optimization: Don't re-trigger if same cell (optional, but good for blink reduction)
        // User said "as mouse moves", so re-triggering on same cell might be okay or not.
        if (index === lastIndex) return;
        lastIndex = index;

        const cell = cells[index];
        if (cell) {
            activateCell(cell);
        }
    });

    function activateCell(cell) {
        // Instant ON
        cell.style.transition = 'none';
        cell.style.backgroundColor = getRandomBlueColor();

        // Trigger Fade OUT
        // We need a slight delay or requestAnimationFrame to allow the 'none' transition to register
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                cell.style.transition = 'background-color 1.5s ease-out';
                cell.style.backgroundColor = 'transparent';
            });
        });
    }

    // 6. Resize Handling
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(initGrid, 200); // 200ms debounce
    });

    // Initialize
    initGrid();
    console.log('Grid Trail initialized');
});
