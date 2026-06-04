import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq, isNull, and } from "drizzle-orm";
import { createDb } from "../db";
import { menuItems } from "../db/schema";
import type { Bindings } from "../types";

const MenuItemSchema = z
  .object({
    id: z.string().uuid(),
    categoryId: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    priceCents: z.number().int(),
    available: z.boolean(),
    imageUrl: z.string().nullable(),
    createdAt: z.string(),
  })
  .openapi("MenuItem");

const CreateMenuItemSchema = z
  .object({
    categoryId: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().optional(),
    priceCents: z.number().int().positive(),
    available: z.boolean().optional(),
    imageUrl: z.string().optional(),
  })
  .openapi("CreateMenuItem");

const UpdateMenuItemSchema = CreateMenuItemSchema.partial().openapi("UpdateMenuItem");

const IdParam = z.object({ id: z.string().uuid() });

export const menuItemsRouter = new OpenAPIHono<{ Bindings: Bindings }>();

// GET / — lister les plats actifs (non soft-deleted)
const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Menu"],
  summary: "Lister les plats actifs",
  responses: {
    200: {
      content: { "application/json": { schema: z.array(MenuItemSchema) } },
      description: "Plats non archivés",
    },
  },
});

menuItemsRouter.openapi(listRoute, async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const rows = await db.select().from(menuItems).where(isNull(menuItems.deletedAt));
  return c.json(rows.map(serialize));
});

// POST / — créer un plat
const createRoute_ = createRoute({
  method: "post",
  path: "/",
  tags: ["Menu"],
  summary: "Créer un plat",
  request: {
    body: { content: { "application/json": { schema: CreateMenuItemSchema } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: MenuItemSchema } },
      description: "Plat créé",
    },
  },
});

menuItemsRouter.openapi(createRoute_, async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const body = c.req.valid("json");
  const [created] = await db.insert(menuItems).values(body).returning();
  return c.json(serialize(created), 201);
});

// PATCH /:id — modifier un plat
const updateRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Menu"],
  summary: "Modifier un plat",
  request: {
    params: IdParam,
    body: { content: { "application/json": { schema: UpdateMenuItemSchema } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: MenuItemSchema } },
      description: "Plat modifié",
    },
    404: {
      content: { "application/json": { schema: z.object({ error: z.string() }) } },
      description: "Plat introuvable",
    },
  },
});

menuItemsRouter.openapi(updateRoute, async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const [updated] = await db
    .update(menuItems)
    .set(body)
    .where(and(eq(menuItems.id, id), isNull(menuItems.deletedAt)))
    .returning();
  if (!updated) return c.json({ error: "Plat introuvable" }, 404);
  return c.json(serialize(updated), 200);
});

// DELETE /:id — soft delete
const deleteRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Menu"],
  summary: "Archiver un plat (soft delete)",
  request: { params: IdParam },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ success: z.boolean() }) } },
      description: "Plat archivé",
    },
    404: {
      content: { "application/json": { schema: z.object({ error: z.string() }) } },
      description: "Plat introuvable",
    },
  },
});

menuItemsRouter.openapi(deleteRoute, async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const { id } = c.req.valid("param");
  const [archived] = await db
    .update(menuItems)
    .set({ deletedAt: new Date() })
    .where(and(eq(menuItems.id, id), isNull(menuItems.deletedAt)))
    .returning();
  if (!archived) return c.json({ error: "Plat introuvable" }, 404);
  return c.json({ success: true }, 200);
});

function serialize(r: typeof menuItems.$inferSelect) {
  return {
    id: r.id,
    categoryId: r.categoryId,
    name: r.name,
    description: r.description,
    priceCents: r.priceCents,
    available: r.available,
    imageUrl: r.imageUrl,
    createdAt: r.createdAt.toISOString(),
  };
}