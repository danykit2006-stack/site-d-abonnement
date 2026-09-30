import type { Context } from "elysia";
import { requirePrincipal } from "./auth";

// Les routes dashboard réutilisent cette vérification, sans accepter une session client.
export const requireAdmin = ({ request }: Context) => requirePrincipal(request, "admin");