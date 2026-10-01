import { Elysia } from "elysia";
import { db } from "../database/db";

// Le catalogue et ses prix sont lus depuis la base active sélectionnée par l’environnement.
export const productsRoutes = new Elysia({ prefix: "/api/products" }).get("/", async () => {
  const products = await db.query<{ id: number; name: string; category: string; description: string | null; type: string }>(
    `SELECT id, name, category, description, type FROM products WHERE active = TRUE ORDER BY id`,
  ).all();
  const prices = await db.query<{ id: number; productId: number; currency: string; amount: number; durationDays: number | null }>(
    'SELECT id, product_id AS "productId", currency, amount, duration_days AS "durationDays" FROM product_prices ORDER BY amount, currency',
  ).all();
  const withPrices = products.map((product) => ({ ...product, prices: prices.filter((price) => price.productId === product.id) }));
  return {
    subscriptions: withPrices.filter((product) => product.type === "subscription"),
    giftCards: withPrices.filter((product) => product.type === "gift_card"),
  };
});