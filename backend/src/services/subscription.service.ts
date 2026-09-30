import { db } from "../database/db";
import { HttpError } from "../utils/errors";
import { isoAfterDays } from "../utils/validation";

type Price = { id: number; product_id: number; currency: string; amount: number; duration_days: number | null; product_type: string; product_name: string; active: number };

export async function getPrice(productId: number, priceId: number): Promise<Price> {
  const price = await db.query<Price>(
    `SELECT pp.id, pp.product_id, pp.currency, pp.amount, pp.duration_days,
            p.type AS product_type, p.name AS product_name, p.active
     FROM product_prices pp JOIN products p ON p.id = pp.product_id
     WHERE p.id = ? AND pp.id = ?`,
  ).get(productId, priceId);
  if (!price) throw new HttpError(404, "PRICE_NOT_FOUND", "Le prix sélectionné est introuvable.");
  if (!price.active) throw new HttpError(404, "PRODUCT_NOT_FOUND", "Ce produit n'est pas disponible.");
  return price;
}

export async function simulatePurchase(userId: number, productId: number, priceId: number, expectedType: "subscription" | "gift_card") {
  const price = await getPrice(productId, priceId);
  if (price.product_type !== expectedType) {
    throw new HttpError(400, "INVALID_PRODUCT_TYPE", "Le produit ne correspond pas au type de commande.");
  }
  const reference = `SIM-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;

  return await db.transaction(async () => {
    if (expectedType === "subscription") {
      const durationDays = price.duration_days ?? 30;
      const startedAt = new Date();
      const expiresAt = isoAfterDays(startedAt, durationDays);
      const subscription = await db.query(
        `INSERT INTO subscriptions (user_id, product_id, price_id, status, currency, amount, started_at, expires_at)
         VALUES (?, ?, ?, 'active', ?, ?, ?, ?)`,
      ).run(userId, productId, priceId, price.currency, price.amount, startedAt.toISOString(), expiresAt);
      const subscriptionId = Number((subscription as { lastInsertRowid: number | bigint }).lastInsertRowid);
      await db.query(
        `INSERT INTO payments (user_id, subscription_id, provider, currency, amount, status, transaction_reference)
         VALUES (?, ?, 'simulated', ?, ?, 'paid', ?)`,
      ).run(userId, subscriptionId, price.currency, price.amount, reference);
      return { type: expectedType, id: subscriptionId, product: price.product_name, amount: price.amount, currency: price.currency, status: "active", expiresAt, paymentReference: reference };
    }

    const purchase = await db.query(
      `INSERT INTO purchases (user_id, product_id, price_id, currency, amount, status)
       VALUES (?, ?, ?, ?, ?, 'paid')`,
    ).run(userId, productId, priceId, price.currency, price.amount);
    const purchaseId = Number((purchase as { lastInsertRowid: number | bigint }).lastInsertRowid);
    await db.query(
      `INSERT INTO payments (user_id, purchase_id, provider, currency, amount, status, transaction_reference)
       VALUES (?, ?, 'simulated', ?, ?, 'paid', ?)`,
    ).run(userId, purchaseId, price.currency, price.amount, reference);
    return { type: expectedType, id: purchaseId, product: price.product_name, amount: price.amount, currency: price.currency, status: "paid", paymentReference: reference };
  });
}

export async function updateExpiredSubscriptions() {
  await db.query("UPDATE subscriptions SET status = 'expired' WHERE status = 'active' AND expires_at <= ?").run(new Date().toISOString());
}

export async function listUserSubscriptions(userId: number) {
  await updateExpiredSubscriptions();
  const rows = await db.query<Array<{ id: number; product: string; amount: number; currency: string; status: string; startedAt: string; expiresAt: string }>>(
    `SELECT s.id, p.name AS product, s.amount, s.currency, s.status, s.started_at AS startedAt, s.expires_at AS expiresAt
     FROM subscriptions s JOIN products p ON p.id = s.product_id
     WHERE s.user_id = ? ORDER BY s.created_at DESC`,
  ).all(userId);
  return rows.map((row) => {
    const daysRemaining = row.status === "active" ? Math.max(0, Math.ceil((Date.parse(row.expiresAt) - Date.now()) / 86400000)) : 0;
    return { ...row, daysRemaining, progress: Math.max(0, Math.min(100, Math.round(daysRemaining / 30 * 100))) };
  });
}

export async function listUserPurchases(userId: number) {
  return await db.query<Array<{ id: number; product: string; amount: number; currency: string; status: string; purchasedAt: string }>>(
    `SELECT pu.id, p.name AS product, pu.amount, pu.currency, pu.status, pu.created_at AS purchasedAt
     FROM purchases pu JOIN products p ON p.id = pu.product_id
     WHERE pu.user_id = ? ORDER BY pu.created_at DESC LIMIT 3`,
  ).all(userId);
}