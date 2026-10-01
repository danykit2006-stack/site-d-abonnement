import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { resolve, sep } from "node:path";
import { config } from "./config/config";
import { db } from "./database/db";
import { adminRoutes } from "./routes/admin.routes";
import { authRoutes } from "./routes/auth.routes";
import { paymentsRoutes } from "./routes/payments.routes";
import { productsRoutes } from "./routes/products.routes";
import { purchasesRoutes } from "./routes/purchases.routes";
import { subscriptionsRoutes } from "./routes/subscriptions.routes";
import { errorBody, HttpError } from "./utils/errors";

const subscriptionCatalog = [
  { name: "Apple Music", category: "Musique", description: "Vos titres et playlists, sans interruption.", usd: 4, cdf: 10000 },
  { name: "Spotify", category: "Musique", description: "Vos artistes préférés, où que vous soyez.", usd: 3, cdf: 7500 },
  { name: "Netflix", category: "Films & séries", description: "Une soirée cinéma commence ici.", usd: 5, cdf: 12000 },
  { name: "Prime Video", category: "Films & séries", description: "Des films, séries et découvertes à regarder.", usd: 6, cdf: 15000 },
  { name: "Snapchat+", category: "Réseau social", description: "Des fonctions exclusives pour votre compte.", usd: 5, cdf: 12000 },
  { name: "X Premium", category: "Réseau social", description: "Le niveau Premium de X, anciennement Twitter.", usd: 4, cdf: 10000 },
];
const giftCatalog = [
  { name: "PSN", values: [5, 10, 20, 25, 50, 75, 100] },
  { name: "Steam", values: [5, 10, 20, 25, 50, 75, 100] },
];

async function ensureCatalogSeeded() {
  const count = Number((await db.query<{ count: number }>("SELECT COUNT(*) AS count FROM products").get())?.count ?? 0);
  if (count >= subscriptionCatalog.length + giftCatalog.length) return;

  await db.transaction(async () => {
    for (const product of subscriptionCatalog) {
      await db.query("INSERT OR IGNORE INTO products (name, category, description, type, active) VALUES (?, ?, ?, 'subscription', TRUE)")
        .run(product.name, product.category, product.description);
      const row = await db.query<{ id: number }>("SELECT id FROM products WHERE name = ?").get(product.name);
      if (!row) continue;
      await db.query("INSERT OR IGNORE INTO product_prices (product_id, currency, amount, duration_days) VALUES (?, 'USD', ?, 30)").run(row.id, product.usd);
      await db.query("INSERT OR IGNORE INTO product_prices (product_id, currency, amount, duration_days) VALUES (?, 'CDF', ?, 30)").run(row.id, product.cdf);
    }

    for (const product of giftCatalog) {
      await db.query("INSERT OR IGNORE INTO products (name, category, description, type, active) VALUES (?, 'Cartes cadeaux', ?, 'gift_card', TRUE)")
        .run(product.name, `Carte cadeau ${product.name}.`);
      const row = await db.query<{ id: number }>("SELECT id FROM products WHERE name = ?").get(product.name);
      if (!row) continue;
      for (const value of product.values) {
        await db.query("INSERT OR IGNORE INTO product_prices (product_id, currency, amount, duration_days) VALUES (?, 'USD', ?, NULL)").run(row.id, value);
      }
    }
  });
}

if (config.nodeEnv === "production") {
  await ensureCatalogSeeded();
}

const allowedOrigins = [config.frontendUrl, `http://localhost:${config.port}`, `http://127.0.0.1:${config.port}`];

export const app = new Elysia()
  .use(cors({ origin: allowedOrigins, credentials: true, methods: ["GET", "POST", "OPTIONS"], allowedHeaders: ["Content-Type"] }))
  .onError(({ code, error, set }) => {
    if (error instanceof HttpError) {
      set.status = error.status;
      return errorBody(error.code, error.message);
    }
    if (code === "VALIDATION") {
      set.status = 400;
      return errorBody("VALIDATION_ERROR", "Les données envoyées sont invalides.");
    }
    console.error("Erreur API:", error);
    set.status = 500;
    return errorBody("INTERNAL_ERROR", "Une erreur interne est survenue.");
  })
  .use(authRoutes)
  .use(adminRoutes)
  .use(productsRoutes)
  .use(subscriptionsRoutes)
  .use(purchasesRoutes)
  .use(paymentsRoutes)
  .get("/api/health", async ({ set }) => {
    const connected = await db.ping();
    if (!connected) {
      set.status = 503;
      return {
        status: "error",
        database: "disconnected",
      };
    }
    return {
      status: "ok",
      database: "connected",
    };
  })
  .get("/", () => Bun.file(resolve(config.frontendPath, "index.html")))
  .get("/index.html", () => Bun.file(resolve(config.frontendPath, "index.html")))
  .get("/abonnement.html", () => Bun.file(resolve(config.frontendPath, "abonnement.html")))
  .get("/acceuil.html", () => Bun.file(resolve(config.frontendPath, "acceuil.html")))
  .get("/acceuil_admin.html", () => Bun.file(resolve(config.frontendPath, "acceuil_admin.html")))
  .get("/connexion.html", () => Bun.file(resolve(config.frontendPath, "connexion.html")))
  .get("/connexion_admin.html", () => Bun.file(resolve(config.frontendPath, "connexion_admin.html")))
  .get("/index_admin.html", () => Bun.file(resolve(config.frontendPath, "index_admin.html")))
  .get("/styles.css", () => Bun.file(resolve(config.frontendPath, "styles.css")))
  .get("/admin.css", () => Bun.file(resolve(config.frontendPath, "admin.css")))
  .get("/admin_dashboard.css", () => Bun.file(resolve(config.frontendPath, "admin_dashboard.css")))
  .get("/api.js", () => Bun.file(resolve(config.frontendPath, "api.js")))
  .get("/app.js", () => Bun.file(resolve(config.frontendPath, "app.js")))
  .get("/access_control.js", () => Bun.file(resolve(config.frontendPath, "access_control.js")))
  .get("/admin.js", () => Bun.file(resolve(config.frontendPath, "admin.js")))
  .get("/admin_dashboard.js", () => Bun.file(resolve(config.frontendPath, "admin_dashboard.js")))
  .get("/admin_login.js", () => Bun.file(resolve(config.frontendPath, "admin_login.js")))
  .get("/*", async ({ params, set, request }) => {
    const pathname = new URL(request.url).pathname;
    if (pathname.startsWith("/api/")) {
      set.status = 404;
      return errorBody("NOT_FOUND", "Cette route API n'existe pas.");
    }
    const requested = params["*"] || "index.html";
    const target = resolve(config.frontendPath, requested);
    if (!target.startsWith(`${config.frontendPath}${sep}`)) {
      set.status = 404;
      return errorBody("NOT_FOUND", "Fichier introuvable.");
    }
    const file = Bun.file(target);
    if (!(await file.exists())) {
      set.status = 404;
      return errorBody("NOT_FOUND", "Fichier introuvable.");
    }
    return file;
  });