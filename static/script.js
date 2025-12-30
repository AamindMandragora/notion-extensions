async function loadData() {
  const res = await fetch("/api/winter_break_scores");
  return await res.json();
}

loadData().then(data => {
  const labels = ["Adi", "Aashima"];
  const values = [data.adi, data.aashima];
  new Chart(barChart, {
    type: "bar",
    data: { datasets: [{ data: data }] },
    options: { maintainAspectRatio: false }
  });

  new Chart(pieChart, {
    type: "pie",
    data: { labels, datasets: [{ data: values }] },
    options: { maintainAspectRatio: false }
  });
});