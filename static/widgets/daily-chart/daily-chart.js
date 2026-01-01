document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("/api/task_counts");
  const data = await res.json();

  const dates = data.dates;
  const adi_daily = data.adi.daily;
  const aashima_daily = data.aashima.daily;

  Chart.defaults.color = '#9ca3af';
  Chart.defaults.font.family = "'PT Serif', serif";
  Chart.defaults.font.size = 13;

  new Chart(document.getElementById("dailyChart"), {
    type: "bar",
    data: {
      labels: dates,
      datasets: [
        {
          label: "Aashima",
          data: aashima_daily,
          backgroundColor: "rgba(255, 77, 77, 0.85)",
          borderColor: "#ff4d4d",
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
          order: 1
        },
        {
          label: "Adi",
          data: adi_daily,
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          borderColor: "white",
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
          order: 2
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
          text: 'Daily Breakdown',
          font: {
            family: "'PT Serif', serif",
            size: 18,
            weight: '600'
          },
          color: '#f3f4f6',
          padding: { bottom: 24 }
        },
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyle: 'rect',
            font: { size: 13 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8,
          titleFont: { size: 14, weight: '600' },
          bodyFont: { size: 13 }
        }
      },
      scales: {
        x: {
          stacked: true,
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
          stacked: true,
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            lineWidth: 1
          },
          ticks: {
            color: '#9ca3af',
            font: { size: 12 },
            padding: 8,
            stepSize: 1
          },
          border: {
            display: false
          }
        }
      }
    }
  });
});