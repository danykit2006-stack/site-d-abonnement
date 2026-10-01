// Les données métier sont demandées au serveur; le navigateur ne conserve que le choix en cours.
const formatDate = (value) => new Intl.DateTimeFormat("fr-CD", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
const formatAmount = (amount, currency) => currency === "CDF"
  ? `${Number(amount).toLocaleString("fr-CD")} FC`
  : `${Number(amount).toLocaleString("fr-CD")} $`;
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.querySelector(`#${button.dataset.passwordToggle}`);
    const reveal = input.type === "password";
    input.type = reveal ? "text" : "password";
    button.textContent = reveal ? "Masquer" : "Afficher";
    button.setAttribute("aria-label", reveal ? "Masquer le mot de passe" : "Afficher le mot de passe");
  });
});

const signupForm = document.querySelector("#signup-form");
if (signupForm) {
  const passwordInput = document.querySelector("#password");
  const strengthBar = document.querySelector("#strength-bar");
  const strengthText = document.querySelector("#strength-text");
  const formMessage = document.querySelector("#form-message");
  passwordInput.addEventListener("input", () => {
    const value = passwordInput.value;
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
    if (/\d/.test(value) || /[^\w\s]/.test(value)) score += 1;
    const levels = ["0%", "34%", "67%", "100%"];
    const messages = ["Utilisez au moins 8 caractères.", "Mot de passe simple.", "Mot de passe solide.", "Mot de passe très solide."];
    const colors = ["#ef6b5a", "#ef6b5a", "#e0ae20", "#78a907"];
    strengthBar.style.width = levels[score];
    strengthBar.style.background = colors[score];
    strengthText.textContent = messages[score];
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    formMessage.classList.remove("success");
    const data = new FormData(signupForm);
    const password = data.get("password");
    if (password !== data.get("confirmPassword")) {
      formMessage.textContent = "Les deux mots de passe ne correspondent pas.";
      return;
    }
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: data.get("username").trim(),
          email: data.get("email").trim(),
          phone: data.get("phone").replace(/\D/g, ""),
          password,
        }),
      });
      formMessage.textContent = "Compte créé. Ouverture des offres...";
      formMessage.classList.add("success");
      window.setTimeout(() => { window.location.href = "abonnement.html"; }, 450);
    } catch (error) {
      formMessage.textContent = error.message;
    }
  });
}

const loginForm = document.querySelector("#login-form");
if (loginForm) {
  const loginMessage = document.querySelector("#login-message");
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginMessage.classList.remove("success");
    const data = new FormData(loginForm);
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: data.get("username").trim(), password: data.get("password") }),
      });
      loginMessage.textContent = "Connexion réussie. Ouverture des offres...";
      loginMessage.classList.add("success");
      window.setTimeout(() => { window.location.href = "abonnement.html"; }, 400);
    } catch (error) {
      loginMessage.textContent = error.message;
    }
  });
}

// Le menu utilisateur affiche l'identité renvoyée par la session serveur.
const userMenuButton = document.querySelector("#user-menu-button");
const userMenu = document.querySelector("#user-menu");
if (userMenuButton && userMenu) {
  apiFetch("/api/auth/me").then(({ user }) => {
    const accountName = document.querySelector("#account-name");
    const avatar = document.querySelector("#user-avatar");
    if (accountName) accountName.textContent = user.username;
    if (avatar) avatar.textContent = user.username.charAt(0).toUpperCase();
    const greeting = document.querySelector("#dashboard-greeting");
    if (greeting) greeting.textContent = `${user.username}, retrouvez ici la durée restante de chacun de vos services.`;
  }).catch(() => {});
  userMenuButton.addEventListener("click", () => {
    userMenu.hidden = !userMenu.hidden;
    userMenuButton.setAttribute("aria-expanded", String(!userMenu.hidden));
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".user-menu-wrap")) {
      userMenu.hidden = true;
      userMenuButton.setAttribute("aria-expanded", "false");
    }
  });
}

document.querySelector("#logout-button")?.addEventListener("click", async () => {
  await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  window.location.href = "connexion.html";
});

const subscriptionContainer = document.querySelector("#subscription-products");
const giftContainer = document.querySelector("#gift-products");
const selectedProduct = document.querySelector("#selected-product");
const selectedPrice = document.querySelector("#selected-price");
const checkoutButton = document.querySelector("#checkout-button");
const paymentDialog = document.querySelector("#payment-dialog");

if (subscriptionContainer && giftContainer && selectedProduct && selectedPrice && checkoutButton && paymentDialog) {
  let choice = null;
  const paymentStep = document.querySelector("#payment-step");
  const paymentSuccess = document.querySelector("#payment-success");
  const paymentMessage = document.querySelector("#payment-message");
  const simulatePayment = document.querySelector("#simulate-payment");

  const choosePrice = (product, price, type, card) => {
    choice = { product, price, type };
    document.querySelectorAll(".plan-card").forEach((item) => item.classList.remove("is-selected"));
    if (card) card.classList.add("is-selected");
    selectedProduct.textContent = product.name;
    selectedPrice.textContent = formatAmount(price.amount, price.currency);
    checkoutButton.disabled = false;
  };

  const serviceClass = (name) => ({
    "Apple Music": "plan-apple", Spotify: "plan-spotify", Netflix: "plan-netflix",
    "Prime Video": "plan-prime", "Snapchat+": "plan-snapchat", "X Premium": "plan-x",
  }[name] || "");
  const serviceMark = (name) => ({
    "Apple Music": "AM", Spotify: "SP", Netflix: "N", "Prime Video": "PV", "Snapchat+": "S+", "X Premium": "X",
  }[name] || name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase());

  const renderCatalog = ({ subscriptions, giftCards }) => {
    document.querySelector("#service-count").textContent = subscriptions.length + giftCards.length;
    subscriptionContainer.replaceChildren();
    for (const product of subscriptions) {
      const card = document.createElement("article");
      card.className = `plan-card ${serviceClass(product.name)}`;
      const usd = product.prices.find((price) => price.currency === "USD");
      const cdf = product.prices.find((price) => price.currency === "CDF");
      card.innerHTML = `<div class="service-mark">${escapeHtml(serviceMark(product.name))}</div>
        <div class="plan-topline"><h3>${escapeHtml(product.name)}</h3><span>${escapeHtml(product.category)}</span></div>
        <p class="plan-description">${escapeHtml(product.description || "")}</p>
        <p class="plan-price"><strong>${usd ? escapeHtml(formatAmount(usd.amount, usd.currency)) : ""}</strong><span>${cdf ? `ou ${escapeHtml(formatAmount(cdf.amount, cdf.currency))}` : ""}</span></p>
        <div class="plan-choice-actions"></div>`;
      const actions = card.querySelector(".plan-choice-actions");
      for (const price of product.prices) {
        const button = document.createElement("button");
        button.className = "secondary-button select-plan";
        button.type = "button";
        button.textContent = `Choisir ${price.currency}`;
        button.addEventListener("click", () => choosePrice(product, price, "subscription", card));
        actions.append(button);
      }
      subscriptionContainer.append(card);
    }

    giftContainer.replaceChildren();
    for (const product of giftCards) {
      const card = document.createElement("article");
      card.className = product.name === "PSN" ? "gift-card psn-card" : "gift-card steam-card";
      const selectId = `gift-value-${product.id}`;
      const options = product.prices.map((price) => `<option value="${price.id}">${escapeHtml(formatAmount(price.amount, price.currency))}</option>`).join("");
      const label = product.name === "PSN" ? "PlayStation Network" : "Steam";
      const description = product.name === "PSN" ? "Rechargez votre univers PlayStation." : "Votre prochaine aventure de jeu commence ici.";
      card.innerHTML = `<div class="gift-card-copy"><span class="gift-label">${label}</span><h3>${escapeHtml(product.name)}</h3><p>${description}</p></div>
        <div class="gift-card-actions"><label for="${selectId}">Valeur de la carte</label><select id="${selectId}" class="gift-value">${options}</select>
        <button class="light-button select-gift" type="button">Choisir cette carte</button></div>`;
      const select = card.querySelector("select");
      card.querySelector("button").addEventListener("click", () => {
        const price = product.prices.find((item) => item.id === Number(select.value));
        choosePrice(product, price, "gift_card", null);
      });
      giftContainer.append(card);
    }
  };

  apiFetch("/api/products/").then(renderCatalog).catch((error) => {
    subscriptionContainer.textContent = error.message;
    giftContainer.replaceChildren();
  });

  const closeDialog = () => { paymentDialog.hidden = true; };
  checkoutButton.addEventListener("click", () => {
    if (!choice) return;
    document.querySelector("#dialog-summary").textContent = `${choice.product.name} · ${formatAmount(choice.price.amount, choice.price.currency)}. Confirmez ci-dessous pour lancer la simulation.`;
    paymentStep.hidden = false;
    paymentSuccess.hidden = true;
    paymentMessage.textContent = "Aucune transaction réelle ne sera effectuée.";
    paymentMessage.classList.remove("is-loading");
    simulatePayment.disabled = false;
    paymentDialog.hidden = false;
    document.querySelector("#close-dialog").focus();
  });
  simulatePayment.addEventListener("click", async () => {
    if (!choice) return;
    simulatePayment.disabled = true;
    paymentMessage.textContent = "Simulation du paiement en cours...";
    paymentMessage.classList.add("is-loading");
    try {
      const { payment } = await apiFetch("/api/payments/simulate", {
        method: "POST",
        body: JSON.stringify({ type: choice.type, productId: choice.product.id, priceId: choice.price.id }),
      });
      const successText = payment.type === "subscription"
        ? `${payment.product} est maintenant actif jusqu'au ${formatDate(payment.expiresAt)}.`
        : `${payment.product} a été ajouté à vos commandes récentes.`;
      paymentSuccess.querySelector(".payment-success-text").textContent = successText;
      paymentStep.hidden = true;
      paymentSuccess.hidden = false;
      window.setTimeout(() => { window.location.href = "acceuil.html"; }, 1000);
    } catch (error) {
      paymentMessage.textContent = error.message;
      paymentMessage.classList.remove("is-loading");
      simulatePayment.disabled = false;
    }
  });
  document.querySelector("#close-dialog").addEventListener("click", closeDialog);
  paymentDialog.addEventListener("click", (event) => { if (event.target === paymentDialog) closeDialog(); });
}

// L'accueil assemble uniquement les abonnements et commandes du compte connecté.
const activeSubscriptions = document.querySelector("#active-subscriptions");
if (activeSubscriptions) {
  const activeCount = document.querySelector("#active-count");
  const historySection = document.querySelector("#gift-history-section");
  const history = document.querySelector("#gift-history");
  Promise.all([apiFetch("/api/subscriptions/me"), apiFetch("/api/purchases/me")]).then(([subscriptionData, purchaseData]) => {
    const subscriptions = subscriptionData.subscriptions.filter((item) => item.status === "active");
    activeCount.textContent = `${subscriptions.length} abonnement${subscriptions.length > 1 ? "s" : ""} actif${subscriptions.length > 1 ? "s" : ""}`;
    activeSubscriptions.replaceChildren();
    if (!subscriptions.length) {
      activeSubscriptions.innerHTML = '<div class="empty-state"><h3>Aucun abonnement actif</h3><p>Choisissez un service et simulez votre paiement pour le voir apparaître ici.</p><a class="primary-button" href="abonnement.html">Voir les offres</a></div>';
    } else {
      for (const subscription of subscriptions) {
        const card = document.createElement("article");
        card.className = "active-card";
        const initials = subscription.product.split(" ").map((word) => word[0]).join("").slice(0, 2);
        card.innerHTML = `<div class="active-mark">${escapeHtml(initials)}</div><h3>${escapeHtml(subscription.product)}</h3>
          <p class="active-price">${escapeHtml(formatAmount(subscription.amount, subscription.currency))}</p>
          <div class="expiry-row"><strong>${subscription.daysRemaining} jour${subscription.daysRemaining > 1 ? "s" : ""}</strong><span>Expire le<br>${escapeHtml(formatDate(subscription.expiresAt))}</span></div>
          <div class="expiry-track"><span style="width: ${subscription.progress}%"></span></div>`;
        activeSubscriptions.append(card);
      }
    }
    if (purchaseData.purchases.length) {
      historySection.hidden = false;
      history.replaceChildren();
      for (const purchase of purchaseData.purchases) {
        const row = document.createElement("div");
        row.className = "gift-history-item";
        row.innerHTML = `<strong>${escapeHtml(purchase.product)}</strong><span>${escapeHtml(formatAmount(purchase.amount, purchase.currency))} · ${escapeHtml(formatDate(purchase.purchasedAt))}</span>`;
        history.append(row);
      }
    }
  }).catch((error) => {
    activeCount.textContent = error.message;
  });
}