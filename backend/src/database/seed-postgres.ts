import { postgresSchemaReady, sql } from "./postgres";

if (!sql) {
  throw new Error("DATABASE_URL is not configured for the Neon/PostgreSQL runtime.");
}

await postgresSchemaReady;

const products = [
  { id: 1, name: "Apple Music", category: "subscription", description: "Abonnement Apple Music", type: "subscription" },
  { id: 2, name: "Spotify", category: "subscription", description: "Abonnement Spotify", type: "subscription" },
  { id: 3, name: "Netflix", category: "subscription", description: "Abonnement Netflix", type: "subscription" },
  { id: 4, name: "Prime Video", category: "subscription", description: "Abonnement Prime Video", type: "subscription" },
  { id: 5, name: "Snapchat+", category: "subscription", description: "Abonnement Snapchat+", type: "subscription" },
  { id: 6, name: "X Premium", category: "subscription", description: "Abonnement X Premium", type: "subscription" },
  { id: 7, name: "PSN", category: "gift_card", description: "Carte PSN", type: "gift_card" },
  { id: 8, name: "Steam", category: "gift_card", description: "Carte Steam", type: "gift_card" },
] as const;

const productPrices = [
  { name: "Apple Music", currency: "USD", amount: 4, duration_days: 30 },
  { name: "Apple Music", currency: "CDF", amount: 10000, duration_days: 30 },
  { name: "Spotify", currency: "USD", amount: 3, duration_days: 30 },
  { name: "Spotify", currency: "CDF", amount: 7500, duration_days: 30 },
  { name: "Netflix", currency: "USD", amount: 5, duration_days: 30 },
  { name: "Netflix", currency: "CDF", amount: 12000, duration_days: 30 },
  { name: "Prime Video", currency: "USD", amount: 6, duration_days: 30 },
  { name: "Prime Video", currency: "CDF", amount: 15000, duration_days: 30 },
  { name: "Snapchat+", currency: "USD", amount: 5, duration_days: 30 },
  { name: "Snapchat+", currency: "CDF", amount: 12000, duration_days: 30 },
  { name: "X Premium", currency: "USD", amount: 4, duration_days: 30 },
  { name: "X Premium", currency: "CDF", amount: 10000, duration_days: 30 },
  { name: "PSN", currency: "USD", amount: 5, duration_days: null },
  { name: "PSN", currency: "CDF", amount: 10000, duration_days: null },
  { name: "Steam", currency: "USD", amount: 10, duration_days: null },
  { name: "Steam", currency: "CDF", amount: 25000, duration_days: null },
] as const;

for (const product of products) {
  await sql`INSERT INTO products (name, category, description, type, active, created_at)
    VALUES (${product.name}, ${product.category}, ${product.description}, ${product.type}, true, NOW())
    ON CONFLICT (name) DO NOTHING;
  `;
}

const productRows = await sql<Array<{ id: number; name: string }>>`SELECT id, name FROM products WHERE name = ANY(${products.map((product) => product.name)});`;
const productMap = new Map(productRows.map((row) => [row.name, row.id]));

for (const price of productPrices) {
  const productId = productMap.get(price.name);
  if (!productId) continue;

  await sql`INSERT INTO product_prices (product_id, currency, amount, duration_days)
    VALUES (${productId}, ${price.currency}, ${price.amount}, ${price.duration_days})
    ON CONFLICT (product_id, currency, amount) DO NOTHING;
  `;
}

console.log("Postgres seed completed.");
