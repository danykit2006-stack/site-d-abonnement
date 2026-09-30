import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL ?? Bun.env.DATABASE_URL ?? null;

export const sql = databaseUrl ? neon(databaseUrl) : null;

const assertPostgresConfigured = () => {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured for the Neon/PostgreSQL runtime.");
  }
};

const convertSqlitePlaceholders = (query: string) => {
  let index = 0;
  const rewritten = query.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
  return rewritten;
};

let activeTransaction: { unsafe: (sql: string, params: any[]) => Promise<any[]> } | null = null;

const executeQuery = async (queryText: string, args: unknown[]) => {
  assertPostgresConfigured();
  const normalized = convertSqlitePlaceholders(queryText);
  if (activeTransaction) {
    return await activeTransaction.unsafe(normalized, args as never[]);
  }
  return await sql!.unsafe(normalized, args as never[]);
};

const initializePostgresSchema = async () => {
  if (!databaseUrl || !sql) return;
  const schema = await Bun.file(new URL("./postgres-schema.sql", import.meta.url)).text();
  await sql.unsafe(schema);
};

void initializePostgresSchema();

export const postgresDb = {
  kind: "postgres" as const,
  query<T = unknown>(sqlText: string) {
    return {
      get: async (...args: unknown[]) => {
        const rows = await executeQuery(sqlText, args.flat());
        return (rows[0] ?? null) as T | null;
      },
      all: async (...args: unknown[]) => {
        const rows = await executeQuery(sqlText, args.flat());
        return rows as T[];
      },
      run: async (...args: unknown[]) => {
        await executeQuery(sqlText, args.flat());
        return { lastInsertRowid: null };
      },
    };
  },
  async transaction<T>(fn: () => Promise<T> | T) {
    assertPostgresConfigured();
    return await sql!.begin(async (tx) => {
      const previous = activeTransaction;
      activeTransaction = tx as any;
      try {
        return await fn();
      } finally {
        activeTransaction = previous;
      }
    });
  },
  close() {
    // Neon handles connection lifetime on the serverless platform.
  },
  async ping() {
    if (!databaseUrl) return false;
    const rows = await sql!`SELECT 1 AS connected`;
    return Number(rows[0]?.connected ?? 0) === 1;
  },
};

export default postgresDb;
