// Tous les appels API partagent les cookies HTTP-only de session et les erreurs JSON.
window.apiFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || "Erreur serveur");
    error.code = data.error?.code || "SERVER_ERROR";
    error.status = response.status;
    throw error;
  }
  return data;
};