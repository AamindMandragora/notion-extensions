import { renderHeatmap } from '../heatmap.js';

document.addEventListener("DOMContentLoaded", async () => {
    const tooltip = document.getElementById("tooltip");

    try {
        const res = await fetch("/api/heatmap");
        const data = await res.json();
        if (data.error) return;

        const dates = data.dates;

        renderHeatmap({
            person: 'aashima',
            dates,
            containerId: 'aashima-heatmap-container',
            statsId: 'aashima-stats',
            tooltip
        });

    } catch (err) {
        console.error("Failed to load heatmap data:", err);
    }
});