// Les pages privées vérifient la session serveur appropriée avant d'être affichées.
const protectCurrentPage = async () => {
  const body = document.body;
  if (body.dataset.protectedPage === "true") {
    try {
      await apiFetch("/api/auth/me");
    } catch {
      window.location.replace("connexion.html");
    }
    return;
  }
  if (body.dataset.adminProtectedPage === "true") {
    try {
      await apiFetch("/api/admin/me");
    } catch {
      window.location.replace("connexion_admin.html");
    }
  }
};

protectCurrentPage();
