import { db } from "../database/db";
import { updateExpiredSubscriptions } from "./subscription.service";

export async function getAdminDashboard() {
  await updateExpiredSubscriptions();
  const users = Number((await db.query<{ count: number }>("SELECT COUNT(*) AS count FROM users").get())?.count ?? 0);
  const subscriptions = await db.query<{ total: number; active: number | null; expired: number | null }>(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) AS expired
     FROM subscriptions`,
  ).get() ?? { total: 0, active: 0, expired: 0 };
  const topSubscription = await db.query(
    `SELECT p.name AS product, COUNT(*) AS count FROM subscriptions s
     JOIN products p ON p.id = s.product_id GROUP BY p.id ORDER BY count DESC, p.name LIMIT 1`,
  ).get() ?? null;
  const revenue = await db.query<{ currency: string; total: number }>(
    `SELECT currency, SUM(amount) AS total FROM payments WHERE status = 'paid' GROUP BY currency`,
  ).all();
  const revenueByProduct = await db.query(
    `SELECT p.name AS product, pa.currency, SUM(pa.amount) AS revenue, COUNT(*) AS count
     FROM payments pa LEFT JOIN subscriptions s ON s.id = pa.subscription_id
     LEFT JOIN purchases pu ON pu.id = pa.purchase_id
     JOIN products p ON p.id = COALESCE(s.product_id, pu.product_id)
     WHERE pa.status = 'paid' GROUP BY p.id, pa.currency ORDER BY revenue DESC`,
  ).all();
  const subscriptionsByProduct = await db.query(
    `SELECT p.name AS product, COUNT(s.id) AS count FROM products p
     LEFT JOIN subscriptions s ON s.product_id = p.id GROUP BY p.id ORDER BY count DESC, p.name`,
  ).all();

  return {
    users,
    subscriptions: { total: subscriptions.total ?? 0, active: subscriptions.active ?? 0, expired: subscriptions.expired ?? 0 },
    topSubscription,
    revenue: { usd: revenue.find((item) => item.currency === "USD")?.total ?? 0, cdf: revenue.find((item) => item.currency === "CDF")?.total ?? 0 },
    revenueByProduct,
    subscriptionsByProduct,
  };
}

export async function getMrr() {
  await updateExpiredSubscriptions();
  return await db.query(
    `SELECT s.currency, SUM(CASE WHEN s.currency = 'USD' THEN s.amount ELSE 0 END) AS usd,
            SUM(CASE WHEN s.currency = 'CDF' THEN s.amount ELSE 0 END) AS cdf
     FROM subscriptions s WHERE s.status = 'active' GROUP BY s.currency`,
  ).all();
}