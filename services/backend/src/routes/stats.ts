import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq, sql, desc } from "drizzle-orm";
import { createDb } from "../db";
import { orderItems, menuItems } from "../db/schema";
import type { Bindings } from "../types";

const PopularItemSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    priceCents: z.number().int(),
    imageUrl: z.string().nullable(),
    orderCount: z.number().int(),
  })
  .openapi("PopularItem");

export const statsRouter = new OpenAPIHono<{ Bindings: Bindings }>();

// GET /popular-items — top des plats par quantité commandée
const popularRoute = createRoute({
  method: "get",
  path: "/popular-items",
  tags: ["Stats"],
  summary: "Plats les plus commandés",
  responses: {
    200: {
      content: { "application/json": { schema: z.array(PopularItemSchema) } },
      description: "Top plats par quantité commandée",
    },
  },
});

statsRouter.openapi(popularRoute, async (c) => {
  const db = createDb(c.env.DATABASE_URL);

  // SUM(quantity) GROUP BY menu_item, joint à menu_items, trié desc, top 5
  const rows = await db
    .select({
      id: menuItems.id,
      name: menuItems.name,
      priceCents: menuItems.priceCents,
      imageUrl: menuItems.imageUrl,
      orderCount: sql<number>`cast(sum(${orderItems.quantity}) as int)`,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .groupBy(menuItems.id, menuItems.name, menuItems.priceCents, menuItems.imageUrl)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(5);

  return c.json(rows);
});