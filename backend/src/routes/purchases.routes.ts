import { Elysia } from "elysia";
import { requirePrincipal } from "../middleware/auth";
import { listUserPurchases } from "../services/subscription.service";

export const purchasesRoutes = new Elysia({ prefix: "/api/purchases" }).get("/me", async ({ request }) => {
  const user = await requirePrincipal(request, "user");
  return { purchases: await listUserPurchases(user.id) };
});