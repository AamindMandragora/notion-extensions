import { renderHeatmap } from '../heatmap.js';

document.addEventListener("DOMContentLoaded", async () => {
    const tooltip = document.getElementById("tooltip");

    try {
        const res = await fetch("/api/heatmap");
        const data = await res.json();
        if (data.error) return;

        const dates = data.dates;

        renderHeatmap({
            person: 'adi',
            dates,
            containerId: 'adi-heatmap-container',
            statsId: 'adi-stats',
            tooltip
        });

    } catch (err) {
        console.error("Failed to load heatmap data:", err);
    }
});