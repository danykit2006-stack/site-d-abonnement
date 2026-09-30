import { existsSync } from "node:fs";
import { Database } from "bun:sqlite";
import { resolve } from "node:path";
import { sql } from "./postgres";

const localDbPath = resolve(import.meta.dir, "../../data/mokili.sqlite");
if (!existsSync(localDbPath)) {
  console.warn(`Local SQLite database not found at ${localDbPath}. Nothing to migrate.`);
  process.exit(0);
}

const localDb = new Database(localDbPath, { readonly: true });

const tables = [
  "users",
  "admins",
  "products",
  "product_prices",
  "sessions",
  "subscriptions",
  "purchases",
  "payments",
] as const;

for (const table of tables) {
  const rows = localDb.query(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number } | undefined;
  console.log(`${table}: ${rows?.count ?? 0} row(s)`);
}

const users = localDb.query("SELECT id, username, email, phone, password_hash, created_at, updated_at FROM users").all() as Array<Record<string, unknown>>;
const admins = localDb.query("SELECT id, username, email, password_hash, created_at FROM admins").all() as Array<Record<string, unknown>>;
const products = localDb.query("SELECT id, name, category, description, type, active, created_at FROM products").all() as Array<Record<string, unknown>>;
const prices = localDb.query("SELECT id, product_id, currency, amount, duration_days FROM product_prices").all() as Array<Record<string, unknown>>;

if (users.length > 0) {
  for (const user of users) {
    await sql`
      INSERT INTO users (username, email, phone, password_hash, created_at, updated_at)
      VALUES (${String(user.username)}, ${String(user.email)}, ${String(user.phone)}, ${String(user.password_hash)}, ${String(user.created_at)}, ${String(user.updated_at)})
      ON CONFLICT (email) DO NOTHING;
    `;
  }
}

if (admins.length > 0) {
  for (const admin of admins) {
    await sql`
      INSERT INTO admins (username, email, password_hash, created_at)
      VALUES (${String(admin.username)}, ${String(admin.email)}, ${String(admin.password_hash)}, ${String(admin.created_at)})
      ON CONFLICT (email) DO NOTHING;
    `;
  }
}

if (products.length > 0) {
  for (const product of products) {
    const description = product.description === null || product.description === undefined ? null : String(product.description);
    await sql`
      INSERT INTO products (name, category, description, type, active, created_at)
      VALUES (${String(product.name)}, ${String(product.category)}, ${description}, ${String(product.type)}, ${Number(product.active) === 1}, ${String(product.created_at)})
      ON CONFLICT (name) DO NOTHING;
    `;
  }
}

if (prices.length > 0) {
  for (const price of prices) {
    const durationDays = price.duration_days === null || price.duration_days === undefined ? null : Number(price.duration_days);
    await sql`
      INSERT INTO product_prices (product_id, currency, amount, duration_days)
      VALUES (${Number(price.product_id)}, ${String(price.currency)}, ${Number(price.amount)}, ${durationDays})
      ON CONFLICT DO NOTHING;
    `;
  }
}

console.log("SQLite migration scaffold completed. Review strict constraints and finalize the full migration before production. ");
localDb.close();
