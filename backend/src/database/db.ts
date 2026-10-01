import { config } from "../config/config";
import { postgresDb } from "./postgres";

export const db = config.databaseUrl ? postgresDb : (await import("./sqlite")).sqliteDb;
export const databaseKind = db.kind;
export default db;