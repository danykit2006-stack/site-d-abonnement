export type DatabaseKind = "sqlite" | "postgres";

export function getDatabaseKind(): DatabaseKind {
  return Bun.env.DATABASE_URL ? "postgres" : "sqlite";
}

export const databaseKind = getDatabaseKind();

export * from "./db";
export * from "./postgres";
