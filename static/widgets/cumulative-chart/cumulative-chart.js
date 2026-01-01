document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("/api/task_counts");
  const data = await res.json();

  const dates = data.dates;
  const adi_cum = data.adi.cumulative;
  const aashima_cum = data.aashima.cumulative;

  Chart.defaults.color = '#9ca3af';
  Chart.defaults.font.family = "'PT Serif', serif";

  new Chart(document.getElementById("cumulativeChart"), {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        {
          label: "Adi",
          data: adi_cum,
          borderColor: "rgba(255, 255, 255, 0.9)",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "white",
          pointBorderColor: "white",
          pointBorderWidth: 2,
          fill: false
        },
        {
          label: "Aashima",
          data: aashima_cum,
          borderColor: "#ff4d4d",
          backgroundColor: "rgba(255, 77, 77, 0.1)",
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#ff4d4d",
          pointBorderColor: "#ff4d4d",
          pointBorderWidth: 2,
          fill: false
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        title: {
          display: true,
          text: 'Cumulative Progress',
          font: {
            family: "'PT Serif', serif",
            size: 24,
            weight: '600'
          },
          color: '#f3f4f6',
          padding: { top: 24, bottom: 24 }
        },
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: 16 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8,
          titleFont: { size: 16, weight: '600' },
          bodyFont: { size: 16 }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#9ca3af',
            font: { size: 12 }
          },
          border: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            lineWidth: 1
          },
          ticks: {
            color: '#9ca3af',
            font: { size: 12 },
            padding: 8
          },
          border: {
            display: false
          }
        }
      }
    }
  });
});