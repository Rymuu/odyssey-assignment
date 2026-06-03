import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { createDb } from "../db";
import { settings } from "../db/schema";
import type { Bindings } from "../types";

const SettingsSchema = z.object({
  id: z.string().uuid(),
  prepTimeMinutes: z.number().int(),
  autoAccept: z.boolean(),
  acceptingOrders: z.boolean(),
  openingHours: z.any().nullable(),
  updatedAt: z.string(),
}).openapi("Settings");

const UpdateSettingsSchema = z.object({
  prepTimeMinutes: z.number().int().positive().optional(),
  autoAccept: z.boolean().optional(),
  acceptingOrders: z.boolean().optional(),
  openingHours: z.any().optional(),
}).openapi("UpdateSettings");

const ErrorSchema = z.object({ error: z.string() });

export const settingsRouter = new OpenAPIHono<{ Bindings: Bindings }>();

function serialize(s: typeof settings.$inferSelect) {
  return {
    id: s.id, prepTimeMinutes: s.prepTimeMinutes, autoAccept: s.autoAccept,
    acceptingOrders: s.acceptingOrders, openingHours: s.openingHours,
    updatedAt: s.updatedAt.toISOString(),
  };
}

// GET / — lire les réglages (ligne unique)
const getRoute = createRoute({
  method: "get", path: "/", tags: ["Settings"],
  summary: "Lire les réglages",
  responses: {
    200: { content: { "application/json": { schema: SettingsSchema } }, description: "Réglages" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Aucun réglage" },
  },
});
settingsRouter.openapi(getRoute, async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const [row] = await db.select().from(settings).limit(1);
  if (!row) return c.json({ error: "Aucun réglage configuré" }, 404);
  return c.json(serialize(row), 200);
});

// PATCH / — mettre à jour les réglages
const updateRoute = createRoute({
  method: "patch", path: "/", tags: ["Settings"],
  summary: "Mettre à jour les réglages",
  request: { body: { content: { "application/json": { schema: UpdateSettingsSchema } } } },
  responses: {
    200: { content: { "application/json": { schema: SettingsSchema } }, description: "Réglages mis à jour" },
    404: { content: { "application/json": { schema: ErrorSchema } }, description: "Aucun réglage" },
  },
});
settingsRouter.openapi(updateRoute, async (c) => {
  const db = createDb(c.env.DATABASE_URL);
  const body = c.req.valid("json");
  const [existing] = await db.select().from(settings).limit(1);
  if (!existing) return c.json({ error: "Aucun réglage configuré" }, 404);
  const [updated] = await db
    .update(settings)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(settings.id, existing.id))
    .returning();
  return c.json(serialize(updated), 200);
});