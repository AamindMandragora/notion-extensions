document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("/api/task_counts");
  const data = await res.json();

  const dates = data.dates;
  const adi_daily = data.adi.daily;
  const aashima_daily = data.aashima.daily;
  const adi_cum = data.adi.cumulative;
  const aashima_cum = data.aashima.cumulative;

  new Chart(document.getElementById("cumulativeChart"), {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        { label: "Adi", data: adi_cum, borderColor: "#34d399", tension: 0.2 },
        { label: "Aashima", data: aashima_cum, borderColor: "#60a5fa", tension: 0.2 }
      ]
    },
    options: { maintainAspectRatio: false }
  });

  new Chart(document.getElementById("dailyChart"), {
    type: "bar",
    data: {
      labels: dates,
      datasets: [
        { label: "Aashima", data: aashima_daily, backgroundColor: "#60a5fa", order: 1 },
        { label: "Adi", data: adi_daily, backgroundColor: "#34d399", order: 2}
      ]
    },
    options: {x: {stacked: true}, y: {stacked: true}},
  });
});