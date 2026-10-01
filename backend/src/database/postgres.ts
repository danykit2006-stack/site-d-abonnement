import { AsyncLocalStorage } from "node:async_hooks";
import { neon, Pool, type PoolClient } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL ?? Bun.env.DATABASE_URL ?? null;

export const sql = databaseUrl ? neon(databaseUrl) : null;
const transactionClient = new AsyncLocalStorage<PoolClient>();

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

const executeQuery = async (queryText: string, args: unknown[]) => {
  assertPostgresConfigured();
  await postgresSchemaReady;
  const normalized = convertSqlitePlaceholders(queryText);
  const client = transactionClient.getStore();
  if (client) {
    return (await client.query(normalized, args as never[])).rows;
  }
  return await sql!.query(normalized, args as never[]);
};

const initializePostgresSchema = async () => {
  if (!sql) return;
  const schema = await Bun.file(new URL("./postgres-schema.sql", import.meta.url)).text();
  for (const statement of schema.split(";").map((part) => part.trim()).filter(Boolean)) {
    await sql.query(statement);
  }
};

export const postgresSchemaReady = initializePostgresSchema();

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
    const pool = new Pool({ connectionString: databaseUrl! });
    let client: PoolClient | undefined;
    let transactionStarted = false;
    try {
      client = await pool.connect();
      await client.query("BEGIN");
      transactionStarted = true;
      const result = await transactionClient.run(client, fn);
      await client.query("COMMIT");
      transactionStarted = false;
      return result;
    } catch (error) {
      if (client && transactionStarted) await client.query("ROLLBACK");
      throw error;
    } finally {
      client?.release();
      await pool.end();
    }
  },
  close() {
    // Neon handles connection lifetime on the serverless platform.
  },
  async ping() {
    if (!databaseUrl) return false;
    await postgresSchemaReady;
    const rows = await sql!`SELECT 1 AS connected`;
    return Number(rows[0]?.connected ?? 0) === 1;
  },
};

export default postgresDb;
