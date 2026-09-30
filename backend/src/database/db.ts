import { config } from "../config/config";
import { postgresDb } from "./postgres";
import { sqliteDb } from "./sqlite";

export const db = config.databaseUrl ? postgresDb : sqliteDb;
export const databaseKind = db.kind;
export default db;