import { Elysia, t } from "elysia";
import { requirePrincipal } from "../middleware/auth";
import { simulatePurchase } from "../services/subscription.service";

const simulatePaymentBodySchema = t.Object({
  type: t.Union([t.Literal("subscription"), t.Literal("gift_card")]),
  productId: t.Integer({ minimum: 1 }),
  priceId: t.Integer({ minimum: 1 }),
});

// L'API ne contacte aucun prestataire financier: elle enregistre explicitement un paiement simulé.
export const paymentsRoutes = new Elysia({ prefix: "/api/payments" }).post("/simulate", async ({ request, body }) => {
  const user = await requirePrincipal(request, "user");
  const purchase = body as typeof simulatePaymentBodySchema.static;
  return { payment: await simulatePurchase(user.id, purchase.productId, purchase.priceId, purchase.type) };
}, {
  body: simulatePaymentBodySchema,
});