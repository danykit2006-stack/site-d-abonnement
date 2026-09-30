import { Elysia, t } from "elysia";
import { db } from "../database/db";
import { readSessionCookie, requirePrincipal } from "../middleware/auth";
import { loginUser, registerUser, sessionCookie, clearedSessionCookie } from "../services/auth.service";
import { HttpError } from "../utils/errors";
import { hashSessionId } from "../utils/session";

// Authentification client: seules les données publiques quittent le serveur.
export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .post("/register", async ({ body, set }) => {
    const result = await registerUser(body);
    set.headers["Set-Cookie"] = sessionCookie(result.sessionId);
    return { user: result.user };
  }, {
    body: t.Object({ username: t.String({ minLength: 3, maxLength: 50 }), email: t.String({ minLength: 3, maxLength: 254 }), phone: t.String({ minLength: 9, maxLength: 13 }), password: t.String({ minLength: 8, maxLength: 200 }) }),
  })
  .post("/login", async ({ body, set, request }) => {
    // Une limite simple par IP ralentit les essais automatisés sans stocker de données client.
    enforceLoginLimit(request);
    const result = await loginUser(body.username, body.password);
    set.headers["Set-Cookie"] = sessionCookie(result.sessionId);
    return { user: result.user };
  }, { body: t.Object({ username: t.String({ minLength: 1, maxLength: 50 }), password: t.String({ minLength: 1, maxLength: 200 }) }) })
  .get("/me", async ({ request }) => {
    const principal = await requirePrincipal(request, "user");
    const user = await db.query<{ id: number; username: string; email: string; phone: string }>(
      "SELECT id, username, email, phone FROM users WHERE id = ?",
    ).get(principal.id);
    if (!user) throw new HttpError(401, "UNAUTHORIZED", "Utilisateur introuvable.");
    return { user };
  })
  .post("/logout", async ({ request, set }) => {
    const sessionId = readSessionCookie(request);
    if (sessionId) await db.query("DELETE FROM sessions WHERE id = ?").run(hashSessionId(sessionId));
    set.headers["Set-Cookie"] = clearedSessionCookie();
    return { success: true };
  });

const loginAttempts = new Map<string, { count: number; startedAt: number }>();
function enforceLoginLimit(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const current = loginAttempts.get(ip);
  if (!current || now - current.startedAt > 60000) {
    loginAttempts.set(ip, { count: 1, startedAt: now });
    return;
  }
  current.count += 1;
  if (current.count > 10) throw new HttpError(429, "RATE_LIMITED", "Trop de tentatives. Réessayez dans une minute.");
}