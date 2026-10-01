import { resolve } from "node:path";

// Bun charge automatiquement backend/.env; tous les chemins sont ancrés sur backend/.
const backendRoot = resolve(import.meta.dir, "../..");

export const config = {
  host: Bun.env.HOST ?? "localhost",
  port: Number(Bun.env.PORT ?? 3001),
  frontendUrl: Bun.env.FRONTEND_URL ?? "http://localhost:3000",
  sessionSecret: Bun.env.SESSION_SECRET ?? "development-only-change-me",
  nodeEnv: Bun.env.NODE_ENV ?? "development",
  databaseUrl: Bun.env.DATABASE_URL ?? null,
  databasePath: resolve(backendRoot, Bun.env.DATABASE_PATH ?? "./data/mokili.sqlite"),
  frontendPath: resolve(backendRoot, "../public"),
  sessionDurationDays: 7,
  maxAdmins: 5,
} as const;