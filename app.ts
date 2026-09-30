import { Elysia } from "elysia";
import { app } from "./backend/src/app";

export default new Elysia().use(app);
