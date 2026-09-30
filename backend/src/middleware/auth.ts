import { db } from "../database/db";
import { HttpError } from "../utils/errors";
import { hashSessionId } from "../utils/session";

export type Principal = { id: number; role: "user" | "admin" };
type StoredSession = { user_id: number | null; admin_id: number | null; expires_at: string };

export const sessionCookieName = "mokili_session";

export function readSessionCookie(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const entry = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${sessionCookieName}=`));
  return entry ? decodeURIComponent(entry.slice(sessionCookieName.length + 1)) : null;
}

export async function requirePrincipal(request: Request, role: Principal["role"]): Promise<Principal> {
  const sessionId = readSessionCookie(request);
  if (!sessionId) throw new HttpError(401, "UNAUTHORIZED", "Connectez-vous pour continuer.");

  const session = await db.query<StoredSession>("SELECT user_id, admin_id, expires_at FROM sessions WHERE id = ?").get(hashSessionId(sessionId));
  if (!session) throw new HttpError(401, "UNAUTHORIZED", "Connectez-vous pour continuer.");
  if (Date.parse(String(session.expires_at)) <= Date.now()) {
    await db.query("DELETE FROM sessions WHERE id = ?").run(hashSessionId(sessionId));
    throw new HttpError(401, "SESSION_EXPIRED", "Votre session a expiré. Veuillez vous reconnecter.");
  }

  const principal = session.user_id !== null
    ? { id: Number(session.user_id), role: "user" as const }
    : { id: Number(session.admin_id), role: "admin" as const };
  if (principal.role !== role) throw new HttpError(403, "FORBIDDEN", "Vous n'avez pas accès à cette ressource.");
  return principal;
}