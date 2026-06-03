import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
  menuCategories,
  menuItems,
  customers,
  orders,
  orderItems,
  settings,
} from "./schema";

// ════════════════════════════════════════════════════════════
// SCHÉMAS DE BASE — générés automatiquement depuis Drizzle.
// "select" = forme d'une ligne lue en base.
// "insert" = forme attendue pour créer une ligne.
// On ne réécrit JAMAIS ces formes à la main : elles découlent
// du schéma, donc impossible qu'elles divergent de la base.
// ════════════════════════════════════════════════════════════

// MENU CATEGORIES
export const menuCategorySelectSchema = createSelectSchema(menuCategories);
export const menuCategoryInsertSchema = createInsertSchema(menuCategories);

// MENU ITEMS
export const menuItemSelectSchema = createSelectSchema(menuItems);
export const menuItemInsertSchema = createInsertSchema(menuItems);

// CUSTOMERS
export const customerSelectSchema = createSelectSchema(customers);
export const customerInsertSchema = createInsertSchema(customers);

// ORDERS
export const orderSelectSchema = createSelectSchema(orders);

// ORDER ITEMS
export const orderItemSelectSchema = createSelectSchema(orderItems);

// SETTINGS
export const settingsSelectSchema = createSelectSchema(settings);

// ════════════════════════════════════════════════════════════
// SCHÉMAS MÉTIER AFFINÉS — ce que l'API accepte réellement.
// Le payload qu'un client envoie n'est PAS la forme exacte d'une
// table. Ex : pour créer une commande, le client n'envoie pas le
// total (calculé côté serveur) ni le statut (toujours "pending"
// au départ). Il envoie juste le client et les lignes voulues.
// ════════════════════════════════════════════════════════════

// Une ligne demandée par le client : quel plat, en quelle quantité.
// Pas de prix ici : le serveur ira le chercher dans le catalogue.
export const createOrderItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

// Payload de création de commande.
export const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(createOrderItemSchema).min(1, "Une commande doit contenir au moins un article"),
});

// Payload de création d'un plat (prix en centimes, positif).
export const createMenuItemSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().positive(),
  available: z.boolean().optional(),
});

// Payload de mise à jour d'un plat (tous les champs optionnels).
export const updateMenuItemSchema = createMenuItemSchema.partial();

// Le cycle de vie d'une commande, comme schéma Zod réutilisable.
export const orderStatusSchema = z.enum([
  "pending",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "cancelled",
]);

// Payload pour changer le statut d'une commande.
export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
});

// ════════════════════════════════════════════════════════════
// TYPES TS dérivés des schémas Zod (z.infer).
// Ces types serviront côté backend ET seront la base de la
// génération du contrat OpenAPI puis des hooks frontend.
// ════════════════════════════════════════════════════════════
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type MenuItem = z.infer<typeof menuItemSelectSchema>;
export type Order = z.infer<typeof orderSelectSchema>;
export type Customer = z.infer<typeof customerSelectSchema>;