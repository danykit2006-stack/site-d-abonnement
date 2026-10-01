import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

// Les tests utilisent une base indépendante pour ne jamais modifier les données de développement.
Bun.env.DATABASE_PATH = "./data/mokili-test.sqlite";
const { app } = await import("../src/app");
const { db } = await import("../src/database/db");
const { hashSessionId } = await import("../src/utils/session");
const testDatabase = resolve(import.meta.dir, "../data/mokili-test.sqlite");

const request = (path: string, options: RequestInit = {}) => app.handle(new Request(`http://localhost${path}`, options));
const sessionCookie = (response: Response) => response.headers.get("set-cookie")!.split(";")[0];

beforeAll(() => {
  const service = db.query("INSERT INTO products (name, category, description, type) VALUES ('Test Service', 'Test', 'Test', 'subscription')").run();
  db.query("INSERT INTO product_prices (product_id, currency, amount, duration_days) VALUES (?, 'USD', 12, 30)").run(service.lastInsertRowid);
  const gift = db.query("INSERT INTO products (name, category, description, type) VALUES ('Test Gift', 'Gift', 'Test', 'gift_card')").run();
  db.query("INSERT INTO product_prices (product_id, currency, amount) VALUES (?, 'USD', 5)").run(gift.lastInsertRowid);
});

afterAll(() => {
  db.close();
  for (const suffix of ["", "-shm", "-wal"]) {
    try { rmSync(`${testDatabase}${suffix}`); } catch {}
  }
});

describe("API Mokili+", () => {
  it("serves the frontend entry point and its static assets", async () => {
    const page = await request("/");
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('href="styles.css"');

    const stylesheet = await request("/styles.css");
    expect(stylesheet.status).toBe(200);
    expect(await stylesheet.text()).toContain(".auth-layout");

    const script = await request("/app.js");
    expect(script.status).toBe(200);
    expect(await script.text()).toContain("#signup-form");
  });

  it("persists accounts, simulates paid orders and keeps roles isolated", async () => {
    const health = await request("/api/health");
    expect(await health.json()).toEqual({ status: "ok", database: "connected" });

    const catalog = await request("/api/products/");
    expect((await catalog.json()).subscriptions).toHaveLength(1);

    const registration = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "test-user", email: "test@example.com", phone: "812345678", password: "password123" }),
    });
    expect(registration.status).toBe(200);
    const userCookie = sessionCookie(registration);
    const registrationBody = await registration.json();
    expect(registrationBody.user.phone).toBe("+243812345678");
    expect(JSON.stringify(registrationBody)).not.toContain("password");
    expect((db.query("SELECT password_hash FROM users WHERE id = 1").get() as { password_hash: string }).password_hash).not.toBe("password123");

    const duplicate = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "test-user", email: "other@example.com", phone: "812345678", password: "password123" }),
    });
    expect(duplicate.status).toBe(409);

    const duplicateEmail = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "another-user", email: "test@example.com", phone: "812345678", password: "password123" }),
    });
    expect(duplicateEmail.status).toBe(409);

    const invalidLogin = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "test-user", password: "incorrect" }),
    });
    expect(invalidLogin.status).toBe(401);
    const secondLogin = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "test-user", password: "password123" }),
    });
    const expiringCookie = sessionCookie(secondLogin);
    const expiringSessionId = decodeURIComponent(expiringCookie.split("=")[1]);
    db.query("UPDATE sessions SET expires_at = ? WHERE id = ?").run(new Date(0).toISOString(), hashSessionId(expiringSessionId));
    const expiredSession = await request("/api/auth/me", { headers: { cookie: expiringCookie } });
    expect(expiredSession.status).toBe(401);
    expect((await expiredSession.json()).error.code).toBe("SESSION_EXPIRED");

    const me = await request("/api/auth/me", { headers: { cookie: userCookie } });
    expect((await me.json()).user.username).toBe("test-user");

    const subscription = await request("/api/payments/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ type: "subscription", productId: 1, priceId: 1 }),
    });
    expect((await subscription.json()).payment.status).toBe("active");
    expect(db.query("SELECT COUNT(*) AS count FROM payments WHERE status = 'paid'").get()!.count).toBe(1);

    const missingPrice = await request("/api/payments/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ type: "subscription", productId: 1, priceId: 999 }),
    });
    expect(missingPrice.status).toBe(404);
    const mismatchedType = await request("/api/payments/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ type: "subscription", productId: 2, priceId: 2 }),
    });
    expect(mismatchedType.status).toBe(400);

    const giftPurchase = await request("/api/payments/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ type: "gift_card", productId: 2, priceId: 2 }),
    });
    expect((await giftPurchase.json()).payment.status).toBe("paid");
    expect((await (await request("/api/purchases/me", { headers: { cookie: userCookie } })).json()).purchases).toHaveLength(1);

    const secondUser = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "other-user", email: "other@example.com", phone: "812345679", password: "password123" }),
    });
    const otherCookie = sessionCookie(secondUser);
    expect((await (await request("/api/subscriptions/me", { headers: { cookie: otherCookie } })).json()).subscriptions).toHaveLength(0);
    expect((await (await request("/api/purchases/me", { headers: { cookie: otherCookie } })).json()).purchases).toHaveLength(0);
    const directSubscription = await request("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: otherCookie },
      body: JSON.stringify({ productId: 1, priceId: 1 }),
    });
    expect((await directSubscription.json()).subscription.amount).toBe(12);

    db.query("UPDATE subscriptions SET expires_at = ? WHERE user_id = 1").run(new Date(Date.now() - 1000).toISOString());
    const expiredSubscription = await request("/api/subscriptions/me", { headers: { cookie: userCookie } });
    expect((await expiredSubscription.json()).subscriptions[0].status).toBe("expired");

    const adminRegistration = await request("/api/admin/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "test-admin", email: "admin@example.com", adminCode: "admin-code" }),
    });
    expect(adminRegistration.status).toBe(200);
    const adminLogin = await request("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "test-admin", adminCode: "admin-code" }),
    });
    const adminCookie = sessionCookie(adminLogin);
    const dashboard = await request("/api/admin/dashboard", { headers: { cookie: adminCookie } });
    expect(dashboard.status).toBe(200);
    const dashboardBody = await dashboard.json();
    expect(dashboardBody.users).toBe(2);
    expect(dashboardBody.subscriptions.expired).toBe(1);
    expect(dashboardBody.subscriptions.active).toBe(1);
    expect(dashboardBody.revenue.usd).toBe(29);
    expect(dashboardBody.topSubscription.product).toBe("Test Service");
    const mrr = await request("/api/admin/analytics/mrr", { headers: { cookie: adminCookie } });
    expect((await mrr.json()).mrr[0].usd).toBe(12);
    expect((await request("/api/admin/dashboard", { headers: { cookie: userCookie } })).status).toBe(403);
    expect((await request("/api/auth/me", { headers: { cookie: adminCookie } })).status).toBe(403);

    await request("/api/auth/logout", { method: "POST", headers: { cookie: userCookie } });
    expect((await request("/api/auth/me", { headers: { cookie: userCookie } })).status).toBe(401);
  });

  it("enforces the five-admin limit in SQLite and through the API", async () => {
    const initialCount = await request("/api/admin/count");
    expect((await initialCount.json()).count).toBe(1);
    const insertAdmin = db.query("INSERT INTO admins (username, email, password_hash) VALUES (?, ?, 'test-hash')");
    const existingCount = Number((db.query("SELECT COUNT(*) AS count FROM admins").get() as { count: number }).count);
    for (let index = existingCount + 1; index <= 5; index += 1) {
      insertAdmin.run(`extra-${index}`, `extra-${index}@example.com`);
    }
    expect(() => insertAdmin.run("sixth", "sixth@example.com")).toThrow("ADMIN_LIMIT_REACHED");
    const sixthAdmin = await request("/api/admin/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "sixth-admin", email: "sixth-admin@example.com", adminCode: "admin-code" }),
    });
    expect(sixthAdmin.status).toBe(409);
  });
});