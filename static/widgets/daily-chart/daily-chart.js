document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("/api/task_counts");
  const data = await res.json();

  const dates = data.dates;
  const adi_daily = data.adi.daily;
  const aashima_daily = data.aashima.daily;

  Chart.defaults.color = '#9ca3af';
  Chart.defaults.font.family = "'PT Serif', serif";

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
          text: 'Daily Breakdown',
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
          borderWidth: 1
        }
      },
      scales: {
        x: {
          stacked: true,
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
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 7
          },
          border: {
            display: false
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
            color: '#888',
            font: {
              size: (ctx) => {
                const width = ctx.chart.width;
                return width < 400 ? 10 : 11;
              }
            },
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