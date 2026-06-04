import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import type { Bindings } from "./types";
import { categoriesRouter } from "./routes/categories";
import { menuItemsRouter } from "./routes/menu-items";
import { ordersRouter } from "./routes/orders";
import { customersRouter } from "./routes/customers";
import { settingsRouter } from "./routes/settings";
import { statsRouter } from "./routes/stats";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

// CORS : ne s'applique que dans un contexte Worker (où c.env existe).
// Quand l'app est appelée hors Worker (script d'export de spec),
// c.env est absent : on saute le CORS proprement au lieu de planter.
app.use("*", (c, next) => {
  if (!c.env?.CORS_ORIGIN) {
    return next();
  }
  const corsMiddleware = cors({
    origin: c.env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  });
  return corsMiddleware(c, next);
});

app.route("/categories", categoriesRouter);
app.route("/menu-items", menuItemsRouter);
app.route("/orders", ordersRouter);
app.route("/customers", customersRouter);
app.route("/settings", settingsRouter);
app.route("/stats", statsRouter);

app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: { title: "Odyssey Restaurant API", version: "1.0.0" },
});

export default app;