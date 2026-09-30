const adminForm = document.querySelector("#admin-signup-form");
const adminCount = document.querySelector("#admin-count");
const adminMessage = document.querySelector("#admin-form-message");
const adminSubmitButton = document.querySelector("#admin-submit-button");

// Le nombre d'accès disponibles est fourni par le serveur, qui applique aussi la limite.
const updateAdministratorCount = async () => {
  try {
    const result = await apiFetch("/api/admin/count");
    adminCount.textContent = result.count;
    adminSubmitButton.disabled = result.available === 0;
  } catch (error) {
    adminMessage.textContent = error.message;
    adminSubmitButton.disabled = true;
  }
};

// Permet de vérifier le code saisi sans modifier sa valeur.
document.querySelector("[data-admin-code-toggle]").addEventListener("click", (event) => {
  const codeInput = document.querySelector("#admin-code");
  const isHidden = codeInput.type === "password";
  codeInput.type = isHidden ? "text" : "password";
  event.currentTarget.textContent = isHidden ? "Masquer" : "Afficher";
  event.currentTarget.setAttribute("aria-label", isHidden ? "Masquer le code administrateur" : "Afficher le code administrateur");
});

// Le serveur valide les doublons, hash le code et protège la limite globale.
adminForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  adminMessage.classList.remove("success");
  const data = new FormData(adminForm);
  const username = data.get("username").trim();
  const email = data.get("email").trim().toLowerCase();
  const adminCode = data.get("adminCode").trim();

  if (username.length < 3) {
    adminMessage.textContent = "Le nom d'utilisateur doit contenir au moins 3 caractères.";
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    adminMessage.textContent = "Saisissez une adresse e-mail valide.";
    return;
  }
  if (adminCode.length < 6) {
    adminMessage.textContent = "Le code administrateur doit contenir au moins 6 caractères.";
    return;
  }
  try {
    await apiFetch("/api/admin/register", {
      method: "POST",
      body: JSON.stringify({ username, email, adminCode }),
    });
    adminForm.reset();
    await updateAdministratorCount();
    adminMessage.textContent = "Accès administrateur créé. Redirection vers la connexion...";
    adminMessage.classList.add("success");
    window.setTimeout(() => { window.location.href = "connexion_admin.html"; }, 500);
  } catch (error) {
    adminMessage.textContent = error.message;
    await updateAdministratorCount();
  }
});

// Initialise le compteur à partir des données persistées.
updateAdministratorCount();
