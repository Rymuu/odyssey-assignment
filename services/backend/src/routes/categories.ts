import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { createDb } from "../db";
import { menuCategories } from "../db/schema";
import type { Bindings } from "../types";

const CategorySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    sortOrder: z.number().int(),
    createdAt: z.string(),
  })
  .openapi("Category");

const listCategoriesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Menu"],
  summary: "Lister les catégories du menu",
  responses: {
    200: {
      content: { "application/json": { schema: z.array(CategorySchema) } },
      description: "Catégories triées par ordre d'affichage",
    },
  },
});

export const categoriesRouter = new OpenAPIHono<{ Bindings: Bindings }>();

categoriesRouter.openapi(listCategoriesRoute, async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const rows = await db.select().from(menuCategories).orderBy(menuCategories.sortOrder);
  return c.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      sortOrder: r.sortOrder,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});