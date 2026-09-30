import { Elysia, t } from "elysia";
import { requirePrincipal } from "../middleware/auth";
import { simulatePurchase } from "../services/subscription.service";

// L'API ne contacte aucun prestataire financier: elle enregistre explicitement un paiement simulé.
export const paymentsRoutes = new Elysia({ prefix: "/api/payments" }).post("/simulate", async ({ request, body }) => {
  const user = await requirePrincipal(request, "user");
  return { payment: await simulatePurchase(user.id, body.productId, body.priceId, body.type) };
}, {
  body: t.Object({
    type: t.Union([t.Literal("subscription"), t.Literal("gift_card")]),
    productId: t.Integer({ minimum: 1 }),
    priceId: t.Integer({ minimum: 1 }),
  }),
});