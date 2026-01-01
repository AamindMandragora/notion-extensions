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
          text: 'Cumulative Progress',
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
            pointStyle: 'circle',
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