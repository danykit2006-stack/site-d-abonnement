import { Elysia, t } from "elysia";
import { db } from "../database/db";
import { requirePrincipal } from "../middleware/auth";
import { getAdminDashboard, getMrr } from "../services/dashboard.service";
import { loginAdmin, registerAdmin, sessionCookie } from "../services/auth.service";
import { config } from "../config/config";
import { HttpError } from "../utils/errors";

// Les endpoints de création et compteur sont publics; les statistiques exigent une session admin.
export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  .get("/count", async () => {
    const count = Number((await db.query<{ count: number }>("SELECT COUNT(*) AS count FROM admins").get())?.count ?? 0);
    return { count, max: config.maxAdmins, available: Math.max(0, config.maxAdmins - count) };
  })
  .post("/register", async ({ body }) => ({ admin: await registerAdmin(body) }), {
    body: t.Object({ username: t.String({ minLength: 3, maxLength: 50 }), email: t.String({ minLength: 3, maxLength: 254 }), adminCode: t.String({ minLength: 6, maxLength: 200 }) }),
  })
  .post("/login", async ({ body, set }) => {
    const result = await loginAdmin(body.username, body.adminCode);
    set.headers["Set-Cookie"] = sessionCookie(result.sessionId);
    return { admin: result.admin };
  }, { body: t.Object({ username: t.String({ minLength: 1, maxLength: 50 }), adminCode: t.String({ minLength: 1, maxLength: 200 }) }) })
  .get("/me", async ({ request }) => {
    const principal = await requirePrincipal(request, "admin");
    const admin = await db.query<{ id: number; username: string; email: string }>(
      "SELECT id, username, email FROM admins WHERE id = ?",
    ).get(principal.id);
    if (!admin) throw new HttpError(401, "UNAUTHORIZED", "Administrateur introuvable.");
    return { admin };
  })
  .get("/dashboard", async ({ request }) => {
    await requirePrincipal(request, "admin");
    return await getAdminDashboard();
  })
  .get("/analytics/mrr", async ({ request }) => {
    await requirePrincipal(request, "admin");
    return { mrr: await getMrr() };
  });