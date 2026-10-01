const adminLoginForm = document.querySelector("#admin-login-form");
const adminLoginMessage = document.querySelector("#admin-login-message");

document.querySelector("[data-admin-login-code-toggle]").addEventListener("click", (event) => {
  const codeInput = document.querySelector("#admin-login-code");
  const isHidden = codeInput.type === "password";
  codeInput.type = isHidden ? "text" : "password";
  event.currentTarget.textContent = isHidden ? "Masquer" : "Afficher";
  event.currentTarget.setAttribute("aria-label", isHidden ? "Masquer le code administrateur" : "Afficher le code administrateur");
});

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  adminLoginMessage.classList.remove("success");
  const data = new FormData(adminLoginForm);
  const username = data.get("username").trim();
  const adminCode = data.get("adminCode").trim();
  try {
    await apiFetch("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, adminCode }),
    });
    adminLoginMessage.textContent = "Connexion réussie. Ouverture du tableau de bord...";
    adminLoginMessage.classList.add("success");
    window.setTimeout(() => { window.location.href = "acceuil_admin.html"; }, 450);
  } catch (error) {
    adminLoginMessage.textContent = error.message;
  }
});
