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