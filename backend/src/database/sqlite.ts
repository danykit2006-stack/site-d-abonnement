import { Database, type SQLQueryBindings } from "bun:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "../config/config";

mkdirSync(dirname(config.databasePath), { recursive: true });
const connection = new Database(config.databasePath, { create: true, strict: true });
connection.exec("PRAGMA foreign_keys = ON;");
connection.exec("PRAGMA journal_mode = WAL;");
connection.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));

export const sqliteDb = {
  kind: "sqlite" as const,
  query<T = unknown>(sqlText: string) {
    const statement = connection.query(sqlText);
    return {
      get: (...args: SQLQueryBindings[]) => statement.get(...args) as T | undefined,
      all: (...args: SQLQueryBindings[]) => statement.all(...args) as T[],
      run: (...args: SQLQueryBindings[]) => statement.run(...args),
    };
  },
  async transaction<T>(fn: () => T | Promise<T>) {
    return await connection.transaction(() => Promise.resolve(fn()))();
  },
  close() {
    connection.close();
  },
  async ping() {
    return Boolean(connection.query("SELECT 1 AS connected").get());
  },
};

export default sqliteDb;
