import { createHmac } from "node:crypto";
import { config } from "../config/config";

// Une fuite SQLite seule ne révèle pas les jetons de session envoyés par les navigateurs.
export const hashSessionId = (sessionId: string) =>
  createHmac("sha256", config.sessionSecret).update(sessionId).digest("hex");