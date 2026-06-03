import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq, desc } from "drizzle-orm";
import { createDb } from "../db";
import { orders, orderItems } from "../db/schema";
import type { Bindings } from "../types";
import {
  createOrder,
  updateOrderStatus,
  OrderError,
} from "../services/orders";

// ── Schémas ──
const orderStatusEnum = z.enum([
  "pending", "accepted", "preparing", "ready", "completed", "cancelled",
]);

const OrderSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  status: orderStatusEnum,
  totalCents: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi("Order");

const CreateOrderSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
}).openapi("CreateOrder");

const UpdateStatusSchema = z.object({
  status: orderStatusEnum,
}).openapi("UpdateOrderStatus");

const ErrorSchema = z.object({ error: z.string(), code: z.string().optional() });
const IdParam = z.object({ id: z.string().uuid() });

export const ordersRouter = new OpenAPIHono<{ Bindings: Bindings }>();

function serializeOrder(o: typeof orders.$inferSelect) {
  return {
    id: o.id, customerId: o.customerId, status: o.status,
    totalCents: o.totalCents,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

// GET / — lister les commandes, filtre optionnel par statut
const listRoute = createRoute({
  method: "get", path: "/", tags: ["Orders"],
  summary: "Lister les commandes",
  request: { query: z.object({ status: orderStatusEnum.optional() }) },
  responses: {
    200: { content: { "application/json": { schema: z.array(OrderSchema) } }, description: "Liste des commandes" },
  },
});
ordersRouter.openapi(listRoute, async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const { status } = c.req.valid("query");
  const rows = status
    ? await db.select().from(orders).where(eq(orders.status, status)).orderBy(desc(orders.createdAt))
    : await db.select().from(orders).orderBy(desc(orders.createdAt));
  return c.json(rows.map(serializeOrder));
});

// GET /:id — détail d'une commande avec ses lignes
const OrderDetailSchema = OrderSchema.extend({
  items: z.array(z.object({
    id: z.string().uuid(),
    menuItemId: z.string().uuid(),
    nameSnapshot: z.string(),
    unitPriceCents: z.number().int(),
    quantity: z.number().int(),
  })),
}).openapi("OrderDetail");

const detailRoute = createRoute({
  method: "get", path: "/{id}", tags: ["Orders"],
  summary: "Détail d'une commande",
  request: { params: IdParam },
  responses: {
    200: { content: { "application/json": { schema: OrderDetailSchema } }, description: "Détail" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Introuvable" },
  },
});
ordersRouter.openapi(detailRoute, async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const { id } = c.req.valid("param");
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) return c.json({ error: "Commande introuvable" }, 404);
  const lines = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  return c.json({
    ...serializeOrder(order),
    items: lines.map((l) => ({
      id: l.id, menuItemId: l.menuItemId, nameSnapshot: l.nameSnapshot,
      unitPriceCents: l.unitPriceCents, quantity: l.quantity,
    })),
  }, 200);
});

// POST / — créer une commande
const createRoute_ = createRoute({
  method: "post", path: "/", tags: ["Orders"],
  summary: "Créer une commande",
  request: { body: { content: { "application/json": { schema: CreateOrderSchema } } } },
  responses: {
    201: { content: { "application/json": { schema: OrderSchema } }, description: "Commande créée" },
    400: { content: { "application/json": { schema: ErrorSchema } }, description: "Payload invalide" },
  },
});
ordersRouter.openapi(createRoute_, async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const body = c.req.valid("json");
  try {
    const order = await createOrder(db, body);
    return c.json(serializeOrder(order), 201);
  } catch (e) {
    if (e instanceof OrderError) return c.json({ error: e.message, code: e.code }, 400);
    throw e;
  }
});

// PATCH /:id/status — changer le statut (machine à états)
const statusRoute = createRoute({
  method: "patch", path: "/{id}/status", tags: ["Orders"],
  summary: "Changer le statut d'une commande",
  request: {
    params: IdParam,
    body: { content: { "application/json": { schema: UpdateStatusSchema } } },
  },
  responses: {
    200: { content: { "application/json": { schema: OrderSchema } }, description: "Statut mis à jour" },
    400: { content: { "application/json": { schema: ErrorSchema } }, description: "Transition invalide" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Introuvable" },
  },
});
ordersRouter.openapi(statusRoute, async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const { id } = c.req.valid("param");
  const { status } = c.req.valid("json");
  try {
    const updated = await updateOrderStatus(db, id, status);
    return c.json(serializeOrder(updated), 200);
  } catch (e) {
    if (e instanceof OrderError) {
      const code = e.code === "ORDER_NOT_FOUND" ? 404 : 400;
      return c.json({ error: e.message, code: e.code }, code);
    }
    throw e;
  }
});