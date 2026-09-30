import { db } from "../database/db";
import { config } from "../config/config";
import { HttpError } from "../utils/errors";
import { createSessionId, hashPassword, verifyPassword } from "../utils/password";
import { hashSessionId } from "../utils/session";
import { normalizePhone, validEmail } from "../utils/validation";

export type PublicUser = { id: number; username: string; email: string; phone: string };
export type PublicAdmin = { id: number; username: string; email: string };

async function createSession(owner: { userId?: number; adminId?: number }) {
  const id = createSessionId();
  const expiresAt = new Date(Date.now() + config.sessionDurationDays * 86400000).toISOString();
  await db.query("INSERT INTO sessions (id, user_id, admin_id, expires_at) VALUES (?, ?, ?, ?)")
    .run(hashSessionId(id), owner.userId ?? null, owner.adminId ?? null, expiresAt);
  return id;
}

export function sessionCookie(id: string) {
  const secure = config.nodeEnv === "production" ? "; Secure" : "";
  return `mokili_session=${encodeURIComponent(id)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${config.sessionDurationDays * 86400}${secure}`;
}

export const clearedSessionCookie = () => `mokili_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${config.nodeEnv === "production" ? "; Secure" : ""}`;

export async function registerUser(input: { username: string; email: string; phone: string; password: string }) {
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  const phone = normalizePhone(input.phone.trim());
  if (username.length < 3 || !validEmail(email) || !phone || input.password.length < 8) {
    throw new HttpError(400, "VALIDATION_ERROR", "Vérifiez le nom, l'adresse e-mail, le téléphone et le mot de passe.");
  }
  if (await db.query("SELECT 1 FROM users WHERE username = ?").get(username)) {
    throw new HttpError(409, "USERNAME_ALREADY_EXISTS", "Ce nom d'utilisateur est déjà utilisé.");
  }
  if (await db.query("SELECT 1 FROM users WHERE email = ?").get(email)) {
    throw new HttpError(409, "EMAIL_ALREADY_EXISTS", "Cette adresse e-mail est déjà utilisée.");
  }

  const passwordHash = await hashPassword(input.password);
  const created = await db.transaction(async () => {
    const result = await db.query("INSERT INTO users (username, email, phone, password_hash) VALUES (?, ?, ?, ?)")
      .run(username, email, phone, passwordHash);
    const user = { id: Number((result as { lastInsertRowid: number | bigint }).lastInsertRowid), username, email, phone };
    return { user, sessionId: await createSession({ userId: user.id }) };
  });
  return created;
}

export async function loginUser(username: string, password: string) {
  const userRow = await db.query<{ id: number; username: string; email: string; phone: string; password_hash: string }>(
    "SELECT id, username, email, phone, password_hash FROM users WHERE username = ?",
  ).get(username.trim());
  if (!userRow || !(await verifyPassword(password, userRow.password_hash))) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Nom d'utilisateur ou mot de passe incorrect.");
  }
  const { password_hash: _passwordHash, ...user } = userRow;
  return { user, sessionId: await createSession({ userId: user.id }) };
}

export async function registerAdmin(input: { username: string; email: string; adminCode: string }) {
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  if (username.length < 3 || !validEmail(email) || input.adminCode.length < 6) {
    throw new HttpError(400, "VALIDATION_ERROR", "Vérifiez le nom, l'adresse e-mail et le code administrateur.");
  }
  const administratorCount = Number((await db.query<{ count: number }>("SELECT COUNT(*) AS count FROM admins").get())?.count ?? 0);
  if (administratorCount >= config.maxAdmins) {
    throw new HttpError(409, "ADMIN_LIMIT_REACHED", "La limite de 5 administrateurs est atteinte.");
  }
  if (await db.query("SELECT 1 FROM admins WHERE username = ?").get(username)) {
    throw new HttpError(409, "USERNAME_ALREADY_EXISTS", "Ce nom d'utilisateur est déjà utilisé.");
  }
  if (await db.query("SELECT 1 FROM admins WHERE email = ?").get(email)) {
    throw new HttpError(409, "EMAIL_ALREADY_EXISTS", "Cette adresse e-mail est déjà utilisée.");
  }

  const passwordHash = await hashPassword(input.adminCode);
  try {
    const result = await db.query("INSERT INTO admins (username, email, password_hash) VALUES (?, ?, ?)")
      .run(username, email, passwordHash);
    return { id: Number((result as { lastInsertRowid: number | bigint }).lastInsertRowid), username, email } satisfies PublicAdmin;
  } catch (error) {
    if (String(error).includes("ADMIN_LIMIT_REACHED")) {
      throw new HttpError(409, "ADMIN_LIMIT_REACHED", "La limite de 5 administrateurs est atteinte.");
    }
    throw error;
  }
}

export async function loginAdmin(username: string, adminCode: string) {
  const adminRow = await db.query<{ id: number; username: string; email: string; password_hash: string }>(
    "SELECT id, username, email, password_hash FROM admins WHERE username = ?",
  ).get(username.trim());
  if (!adminRow || !(await verifyPassword(adminCode, adminRow.password_hash))) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Nom d'utilisateur ou code administrateur incorrect.");
  }
  const { password_hash: _passwordHash, ...admin } = adminRow;
  return { admin, sessionId: await createSession({ adminId: admin.id }) };
}