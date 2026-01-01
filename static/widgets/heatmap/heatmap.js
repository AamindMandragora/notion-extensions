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
        const totalCols = Math.ceil(dates.length / ROWS);

        dates.forEach((d, idx) => {
            const date = new Date(d.date);
            if (date.getDate() !== 1) return;

            const colIndex = Math.floor(idx / ROWS);
            if (colIndex < 0 || colIndex >= totalCols) return;

            const label = document.createElement('span');
            label.className = 'month-label';
            label.textContent = date.toLocaleDateString('en-US', { month: 'short' });

            const leftPct = (colIndex / totalCols) * 100;
            label.style.left = `calc(3px + ${leftPct}%`;

            container.appendChild(label);
        });
    }
}