// Toutes les statistiques sont agrégées côté serveur à partir des paiements et abonnements SQLite.
const dashboardDate = new Intl.DateTimeFormat("fr-CD", { day: "numeric", month: "short", year: "numeric" }).format(new Date());
const currencyValue = (amount, currency) => `${Number(amount || 0).toLocaleString("fr-CD")} ${currency === "CDF" ? "FC" : "$"}`;

apiFetch("/api/admin/dashboard").then((data) => {
  const subscriptions = data.subscriptions;
  const top = data.topSubscription;
  const usdRevenue = Number(data.revenue.usd || 0);

  document.querySelector("#registered-users").textContent = data.users;
  document.querySelector("#top-subscription").textContent = top?.product || "Aucun";
  document.querySelector("#top-subscription-count").textContent = top
    ? `${top.count} souscription${top.count > 1 ? "s" : ""}`
    : "Aucune souscription";
  document.querySelector("#total-revenue").textContent = currencyValue(usdRevenue, "USD");
  document.querySelector("#usage-total").textContent = `${subscriptions.total} souscription${subscriptions.total > 1 ? "s" : ""}`;
  document.querySelector("#dashboard-updated").textContent = `Mise à jour serveur · ${dashboardDate}`;

  const labels = data.subscriptionsByProduct.map((item) => item.product);
  const values = data.subscriptionsByProduct.map((item) => item.count);
  const usdProducts = data.revenueByProduct.filter((item) => item.currency === "USD");
  const chartColors = ["#125cc8", "#c9ec45", "#ef6b5a", "#e0ae20", "#1d9d67", "#6b7280"];

  if (window.Chart) {
    Chart.defaults.font.family = "Inter, ui-sans-serif, system-ui, sans-serif";
    Chart.defaults.color = "#64707c";

    new Chart(document.querySelector("#subscription-usage-chart"), {
      type: "doughnut",
      data: {
        labels: labels.length ? labels : ["Aucun abonnement"],
        datasets: [{ data: values.length ? values : [1], backgroundColor: chartColors, borderWidth: 3, borderColor: "#ffffff", hoverOffset: 5 }],
      },
      options: {
        maintainAspectRatio: false,
        cutout: "67%",
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, padding: 16, usePointStyle: true } },
          tooltip: { enabled: subscriptions.total > 0 },
        },
      },
    });

    new Chart(document.querySelector("#revenue-chart"), {
      type: "bar",
      data: {
        labels: usdProducts.length ? usdProducts.map((item) => item.product) : ["Aucun paiement USD"],
        datasets: [{ label: "Revenu simulé (USD)", data: usdProducts.length ? usdProducts.map((item) => item.revenue) : [0], backgroundColor: "#125cc8", borderRadius: 4, maxBarThickness: 52 }],
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 35, minRotation: 0 } },
          y: { beginAtZero: true, ticks: { callback: (value) => `${value} $` }, border: { display: false } },
        },
        plugins: { legend: { display: false } },
      },
    });
  }
}).catch((error) => {
  document.querySelector("#dashboard-updated").textContent = error.message;
});

document.querySelector("#admin-logout-button")?.addEventListener("click", async () => {
  await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  window.location.href = "connexion_admin.html";
});