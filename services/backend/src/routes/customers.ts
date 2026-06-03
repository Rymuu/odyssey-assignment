import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq, desc, sql, count, sum } from "drizzle-orm";
import { createDb } from "../db";
import { customers, orders } from "../db/schema";
import type { Bindings } from "../types";

const CustomerWithStatsSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  orderCount: z.number().int(),
  totalSpentCents: z.number().int(),
}).openapi("CustomerWithStats");

const RecentOrderSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  totalCents: z.number().int(),
  createdAt: z.string(),
});

const CustomerDetailSchema = CustomerWithStatsSchema.extend({
  recentOrders: z.array(RecentOrderSchema),
}).openapi("CustomerDetail");

const ErrorSchema = z.object({ error: z.string() });
const IdParam = z.object({ id: z.string().uuid() });

export const customersRouter = new OpenAPIHono<{ Bindings: Bindings }>();

// GET / — liste des clients avec stats agrégées (nb commandes, total dépensé)
const listRoute = createRoute({
  method: "get", path: "/", tags: ["CRM"],
  summary: "Lister les clients avec statistiques",
  responses: {
    200: { content: { "application/json": { schema: z.array(CustomerWithStatsSchema) } }, description: "Clients + stats" },
  },
});
customersRouter.openapi(listRoute, async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  // Jointure gauche clients -> commandes, agrégée par client.
  // Seules les commandes non annulées comptent dans le total dépensé.
  const rows = await db
    .select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone,
      orderCount: count(orders.id),
      totalSpentCents: sql<number>`coalesce(sum(case when ${orders.status} <> 'cancelled' then ${orders.totalCents} else 0 end), 0)::int`,
    })
    .from(customers)
    .leftJoin(orders, eq(orders.customerId, customers.id))
    .groupBy(customers.id);

  return c.json(rows.map((r) => ({
    id: r.id, firstName: r.firstName, lastName: r.lastName,
    email: r.email, phone: r.phone,
    orderCount: Number(r.orderCount),
    totalSpentCents: Number(r.totalSpentCents),
  })));
});

// GET /:id — détail d'un client + ses commandes récentes
const detailRoute = createRoute({
  method: "get", path: "/{id}", tags: ["CRM"],
  summary: "Détail d'un client avec commandes récentes",
  request: { params: IdParam },
  responses: {
    200: { content: { "application/json": { schema: CustomerDetailSchema } }, description: "Détail client" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Introuvable" },
  },
});
customersRouter.openapi(detailRoute, async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const { id } = c.req.valid("param");
  const [customer] = await db.select().from(customers).where(eq(customers.id, id));
  if (!customer) return c.json({ error: "Client introuvable" }, 404);

  const customerOrders = await db
    .select().from(orders)
    .where(eq(orders.customerId, id))
    .orderBy(desc(orders.createdAt));

  const totalSpentCents = customerOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.totalCents, 0);

  return c.json({
    id: customer.id, firstName: customer.firstName, lastName: customer.lastName,
    email: customer.email, phone: customer.phone,
    orderCount: customerOrders.length,
    totalSpentCents,
    recentOrders: customerOrders.slice(0, 5).map((o) => ({
      id: o.id, status: o.status, totalCents: o.totalCents,
      createdAt: o.createdAt.toISOString(),
    })),
  }, 200);
});