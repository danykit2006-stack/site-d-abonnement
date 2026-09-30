import { Elysia, t } from "elysia";
import { requirePrincipal } from "../middleware/auth";
import { listUserSubscriptions, simulatePurchase } from "../services/subscription.service";

export const subscriptionsRoutes = new Elysia({ prefix: "/api/subscriptions" })
  .get("/me", async ({ request }) => {
    const user = await requirePrincipal(request, "user");
    return { subscriptions: await listUserSubscriptions(user.id) };
  })
  .post("/", async ({ request, body }) => {
    const user = await requirePrincipal(request, "user");
    return { subscription: await simulatePurchase(user.id, body.productId, body.priceId, "subscription") };
  }, { body: t.Object({ productId: t.Integer({ minimum: 1 }), priceId: t.Integer({ minimum: 1 }) }) });