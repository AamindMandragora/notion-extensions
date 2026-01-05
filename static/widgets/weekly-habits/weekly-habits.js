document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("/api/habits/weekly");
  const data = await res.json();

  const dates = data.map(d =>
    new Date(d.date).toLocaleDateString("en-US", { weekday: "short" })
  );

  const adi = data.map(d => d.adi);
  const aashima = data.map(d => d.aashima);

  Chart.defaults.color = '#9ca3af';
  Chart.defaults.font.family = "'PT Serif', serif";

  new Chart(document.getElementById("habitsChart"), {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        {
          label: "Aashima",
          data: aashima,
          borderColor: "#ff4d4d",
          backgroundColor: "rgba(255, 77, 77, 0.15)",
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          order: 1
        },
        {
          label: "Adi",
          data: adi,
          borderColor: "#ffffff",
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          order: 2
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      layout: {
        padding: {
          top: 10,
          bottom: 0,
          left: 10,
          right: 15
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        title: {
          display: true,
          text: '7-Day Habit Consistency',
          font: {
            family: "'PT Serif', serif",
            size: (ctx) => {
              const width = ctx.chart.width;
              return width < 400 ? 16 : 22;
            },
            weight: '700'
          },
          color: '#ffffff',
          padding: { top: 10, bottom: 20 }
        },
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 15,
            usePointStyle: true,
            pointStyle: 'rectRounded',
            font: {
              size: (ctx) => {
                const width = ctx.chart.width;
                return width < 400 ? 11 : 13;
              }
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(20, 20, 20, 0.95)',
          padding: 12,
          cornerRadius: 8,
          titleFont: { size: 14, weight: '700' },
          bodyFont: { size: 13 },
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          callbacks: {
            label: ctx =>
              `${ctx.dataset.label}: ${(ctx.raw * 100).toFixed(1)}%`
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#888',
            font: {
              size: (ctx) => {
                const width = ctx.chart.width;
                return width < 400 ? 10 : 11;
              }
            },
            maxRotation: 0
          },
          border: {
            display: false
          }
        },
        y: {
          min: 0,
          max: 1,
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            lineWidth: 1
          },
          ticks: {
            callback: v => `${Math.round(v * 100)}%`,
            color: '#888',
            font: {
              size: (ctx) => {
                const width = ctx.chart.width;
                return width < 400 ? 10 : 11;
              }
            },
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