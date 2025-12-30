document.addEventListener("DOMContentLoaded", async () => {
    const tooltip = document.getElementById("tooltip");

    try {
        const res = await fetch("/api/heatmap");
        const data = await res.json();

        if (data.error) {
            console.error("Error fetching heatmap data:", data.error);
            return;
        }

        const dates = data.dates;

        const adiTotal = dates.reduce((sum, d) => sum + d.adi, 0);
        const aashimaTotal = dates.reduce((sum, d) => sum + d.aashima, 0);
        const adiMax = Math.max(...dates.map(d => d.adi));
        const aashimaMax = Math.max(...dates.map(d => d.aashima));
        const adiAvg = (adiTotal / dates.length).toFixed(1);
        const aashimaAvg = (aashimaTotal / dates.length).toFixed(1);

        document.getElementById("adi-stats").innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Total Tasks</span>
        <span class="stat-value">${adiTotal}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Daily Average</span>
        <span class="stat-value">${adiAvg}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Best Day</span>
        <span class="stat-value">${adiMax}</span>
      </div>
    `;

        document.getElementById("aashima-stats").innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Total Tasks</span>
        <span class="stat-value">${aashimaTotal}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Daily Average</span>
        <span class="stat-value">${aashimaAvg}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Best Day</span>
        <span class="stat-value">${aashimaMax}</span>
      </div>
    `;

        const rows = 5;
        const cols = 73;

        const adiHeatmap = document.getElementById("adi-heatmap");
        const aashimaHeatmap = document.getElementById("aashima-heatmap");

        const dataMap = {};
        dates.forEach(d => {
            dataMap[d.date] = { adi: d.adi, aashima: d.aashima };
        });

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const idx = row * cols + col + 1;
                let dayData = dates[idx] || { date: null, adi: 0, aashima: 0 };

                if (dayData['date'] == null) {
                    break;
                }

                const adiCell = createHeatmapCell(
                    dayData.date,
                    dayData.adi,
                    "adi",
                    adiMax
                );
                adiHeatmap.appendChild(adiCell);

                const aashimaCell = createHeatmapCell(
                    dayData.date,
                    dayData.aashima,
                    "aashima",
                    aashimaMax
                );
                aashimaHeatmap.appendChild(aashimaCell);
            }
        }

        generateMonthLabels("adi-months", dates);
        generateMonthLabels("aashima-months", dates);

    } catch (error) {
        console.error("Error loading heatmap:", error);
    }

    function createHeatmapCell(date, count, person, maxCount) {
        const cell = document.createElement("div");
        const level = getLevel(count, maxCount);
        cell.className = `heatmap-cell ${person}-level-${level}`;
        cell.dataset.date = date;
        cell.dataset.count = count;
        cell.dataset.person = person;

        cell.addEventListener("mouseenter", (e) => {
            const dateObj = new Date(date);
            const formattedDate = dateObj.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            tooltip.textContent = `${formattedDate}: ${count} task${count !== 1 ? 's' : ''}`;
            tooltip.style.display = "block";
            updateTooltipPosition(e);
        });

        cell.addEventListener("mousemove", updateTooltipPosition);

        cell.addEventListener("mouseleave", () => {
            tooltip.style.display = "none";
        });

        return cell;
    }

    function getLevel(count, maxCount) {
        if (count === 0) return 0;
        if (maxCount === 0) return 0;

        return Math.min(4, Math.floor(4 * Math.sqrt(count / maxCount)));
    }

    function updateTooltipPosition(e) {
        const offset = 10;
        tooltip.style.left = (e.clientX + offset) + "px";
        tooltip.style.top = (e.clientY + offset) + "px";
    }

    function getTextWidth(text, font) {
        const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
        const ctx = canvas.getContext("2d");
        ctx.font = font;
        return ctx.measureText(text).width;
    }

    function generateMonthLabels(containerId, dates) {
        const container = document.getElementById(containerId);
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

            const dayOffset = Math.floor(
                (date - startDate) / (1000 * 60 * 60 * 24)
            );

            const colIndex = Math.floor(dayOffset / ROWS);
            if (colIndex < 0 || colIndex >= COLS) return;

            const monthText = date.toLocaleDateString('en-US', { month: 'short' });
            const textWidth = getTextWidth(monthText, font);

            const label = document.createElement("span");
            label.className = "month-label";
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

        container.style.width = 'fit-content';
    }
    
});
