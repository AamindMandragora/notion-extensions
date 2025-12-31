export async function renderHeatmap({ person, dates, containerId, statsId, tooltip }) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    const values = dates.map(d => d[person]);
    const total = values.reduce((a, b) => a + b, 0);
    const max = Math.max(...values);
    const avg = (total / dates.length).toFixed(1);

    updateStats(statsId, [total, avg, max]);

    const ROWS = 5;
    const midPoint = Math.ceil(dates.length / 2);
    const segments = [dates.slice(0, midPoint), dates.slice(midPoint)];

    segments.forEach(chunk => {
        const segmentWrapper = document.createElement('div');
        segmentWrapper.className = 'segment-wrapper';
        container.appendChild(segmentWrapper);

        const monthLabels = document.createElement('div');
        monthLabels.className = 'month-labels';
        segmentWrapper.appendChild(monthLabels);

        const grid = document.createElement('div');
        grid.className = 'heatmap-grid';
        chunk.forEach(d => {
            const cell = createHeatmapCell(d.date, d[person], max, tooltip);
            grid.appendChild(cell);
        });
        segmentWrapper.appendChild(grid);

        generateMonthLabelsForSegment(monthLabels, chunk);
    });

    adjustHeatmapColumns(container);
    window.addEventListener('resize', () => adjustHeatmapColumns(container));

    // ------------------------
    function updateStats(containerId, values) {
        const el = document.getElementById(containerId);
        for (let i = 0; i < 3; i++) {
            el.children[i].querySelector('.stat-value').textContent = values[i];
        }
    }

    function createHeatmapCell(date, count, maxCount, tooltip) {
        const cell = document.createElement('div');
        const level = getLevel(count, maxCount);
        cell.className = `heatmap-cell level-${level}`;

        cell.addEventListener('mouseenter', e => {
            const dateObj = new Date(`${date}T00:00:00`);
            tooltip.textContent =
                `${dateObj.toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                })}: ${count} task${count !== 1 ? 's' : ''}`;
            tooltip.style.display = 'block';
            updateTooltipPosition(e, tooltip);
        });
        cell.addEventListener('mousemove', e => updateTooltipPosition(e, tooltip));
        cell.addEventListener('mouseleave', () => tooltip.style.display = 'none');

        return cell;
    }

    function getLevel(count, maxCount) {
        if (!count || !maxCount) return 0;
        return Math.min(4, Math.floor(4 * Math.sqrt(count / maxCount)));
    }

    function updateTooltipPosition(e, tooltip) {
        tooltip.style.left = `${e.clientX + 10}px`;
        tooltip.style.top = `${e.clientY + 10}px`;
    }

    function getTextWidth(text, font) {
        const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'));
        const ctx = canvas.getContext('2d');
        ctx.font = font;
        return ctx.measureText(text).width;
    }

    function generateMonthLabelsForSegment(container, dates) {
        container.innerHTML = '';
        if (!dates.length) return;

        const ROWS = 5;
        const COLS = 73;
        const startDate = new Date(dates[0].date);
        startDate.setHours(0, 0, 0, 0);

        const cellWidth = 12;
        const gap = 2.5;
        const columnWidth = cellWidth + gap;
        const font = getComputedStyle(document.querySelector('.month-labels')).font;

        let prevCol = null;
        let prevTextWidth = 0;

        dates.forEach(d => {
            const date = new Date(d.date);
            date.setHours(0, 0, 0, 0);
            if (date.getDate() !== 1) return;

            const dayOffset = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
            const colIndex = Math.floor(dayOffset / ROWS);
            if (colIndex < 0 || colIndex >= COLS) return;

            const monthText = date.toLocaleDateString('en-US', { month: 'short' });
            const textWidth = getTextWidth(monthText, font);

            const label = document.createElement('span');
            label.className = 'month-label';
            label.textContent = monthText;
            label.style.width = 'max-content';

            if (prevCol === null) {
                label.style.paddingLeft = `${colIndex * columnWidth}px`;
            } else {
                const deltaCols = colIndex - prevCol;
                const deltaPx = deltaCols * columnWidth - prevTextWidth;
                label.style.paddingLeft = `${deltaPx}px`;
            }

            container.appendChild(label);
            prevCol = colIndex;
            prevTextWidth = textWidth;
        });
    }
}