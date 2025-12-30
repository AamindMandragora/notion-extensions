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

        generateLegend("adi", adiMax);
        generateLegend("aashima", aashimaMax);

        const startDate = new Date(dates[0].date);
        const dayOfWeek = startDate.getDay();

        const adiHeatmap = document.getElementById("adi-heatmap");
        const aashimaHeatmap = document.getElementById("aashima-heatmap");

        const monthsAdi = [];
        const monthsAashima = [];
        let currentMonth = null;
        let weekCount = 0;

        for (let i = 0; i < dayOfWeek; i++) {
            const emptyAdi = document.createElement("div");
            emptyAdi.className = "heatmap-cell";
            emptyAdi.style.visibility = "hidden";
            adiHeatmap.appendChild(emptyAdi);

            const emptyAashima = document.createElement("div");
            emptyAashima.className = "heatmap-cell";
            emptyAashima.style.visibility = "hidden";
            aashimaHeatmap.appendChild(emptyAashima);
        }

        dates.forEach((dayData, index) => {
            const date = new Date(dayData.date);
            const dateObj = new Date(dayData.date);
            const dayOfWeek = dateObj.getDay();

            const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
            if (monthName !== currentMonth && dayOfWeek === 0) {
                currentMonth = monthName;
                monthsAdi.push({ month: monthName, week: weekCount });
            }

            if (dayOfWeek === 0 && index > 0) {
                weekCount++;
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
        });

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

        const percentage = count / maxCount;
        if (percentage <= 0.25) return 1;
        if (percentage <= 0.5) return 2;
        if (percentage <= 0.75) return 3;
        return 4;
    }

    function updateTooltipPosition(e) {
        const offset = 10;
        tooltip.style.left = (e.clientX + offset) + "px";
        tooltip.style.top = (e.clientY + offset) + "px";
    }

    function generateLegend(person, maxCount) {
        const legendContainer = document.getElementById(`${person}-legend`);
        for (let i = 0; i <= 4; i++) {
            const box = document.createElement("div");
            box.className = `legend-box ${person}-level-${i}`;
            legendContainer.appendChild(box);
        }
    }

    function generateMonthLabels(containerId, dates) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        const months = [];

        let currentMonth = null;
        let currentYear = null;

        const firstDate = new Date(dates[0].date);
        const startDay = firstDate.getDay();

        let weekIndex = startDay === 0 ? 0 : 1;
        let monthStartWeek = weekIndex;

        dates.forEach((dayData, index) => {
            const date = new Date(dayData.date);
            const month = date.getMonth();
            const year = date.getFullYear();
            const dayOfWeek = date.getDay();

            if (dayOfWeek === 0 && index > 0) {
                weekIndex++;
            }

            if (month !== currentMonth || year !== currentYear) {
                if (currentMonth !== null) {
                    months.push({
                        name: new Date(dates[index - 1].date)
                            .toLocaleDateString('en-US', { month: 'short' }),
                        startWeek: monthStartWeek,
                        weekCount: weekIndex - monthStartWeek
                    });
                }

                currentMonth = month;
                currentYear = year;
                monthStartWeek = weekIndex;
            }
        });

        months.push({
            name: new Date(dates[dates.length - 1].date)
                .toLocaleDateString('en-US', { month: 'short' }),
            startWeek: monthStartWeek,
            weekCount: weekIndex - monthStartWeek + 1
        });

        months.forEach(({ name, startWeek, weekCount }) => {
            if (weekCount >= 2) {
                const label = document.createElement("span");
                label.className = "month-label";
                label.textContent = name;

                const cellWidth = 14;
                const gap = 3;
                label.style.left = `${startWeek * (cellWidth + gap)}px`;

                label.style.gridColumn = `${startWeek + 1} / span ${weekCount}`;

                container.appendChild(label);
            }
        });
    }

});
