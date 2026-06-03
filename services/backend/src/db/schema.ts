import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ────────────────────────────────────────────────────────────
// ENUMS
// ────────────────────────────────────────────────────────────

// Le cycle de vie d'une commande. Stocké comme un type enum Postgres,
// ce qui interdit au niveau base toute valeur hors de cette liste.
export const orderStatus = pgEnum("order_status", [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "cancelled",
]);

// ────────────────────────────────────────────────────────────
// MENU CATEGORIES — les rubriques de la carte (Entrées, Plats…)
// ────────────────────────────────────────────────────────────
export const menuCategories = pgTable("menu_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // position d'affichage de la catégorie dans la carte
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ────────────────────────────────────────────────────────────
// MENU ITEMS — le catalogue : les plats proposés
// ────────────────────────────────────────────────────────────
export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => menuCategories.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"), 
  // PRIX EN CENTIMES (integer) — jamais en flottant, pour éviter
  // les erreurs d'arrondi monétaires. 12,50 € => 1250.
  priceCents: integer("price_cents").notNull(),
  // disponibilité TEMPORAIRE (rupture, plat du jour épuisé…)
  available: boolean("available").notNull().default(true),
  // SOFT DELETE : null = actif, une date = archivé/retiré de la carte.
  // On ne supprime jamais physiquement un plat, pour préserver
  // l'intégrité de l'historique des commandes qui le référencent.
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ────────────────────────────────────────────────────────────
// CUSTOMERS — les clients
// ────────────────────────────────────────────────────────────
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ────────────────────────────────────────────────────────────
// ORDERS — les commandes
// ────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  status: orderStatus("status").notNull().default("pending"),
  // total recalculé/vérifié côté serveur, jamais fait confiance au client
  totalCents: integer("total_cents").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ────────────────────────────────────────────────────────────
// ORDER ITEMS — les lignes d'une commande
// ────────────────────────────────────────────────────────────
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: uuid("menu_item_id")
    .notNull()
    .references(() => menuItems.id, { onDelete: "restrict" }),
  // SNAPSHOT du nom et du prix au moment de la commande, pour que
  // modifier le catalogue plus tard ne réécrive pas l'historique.
  nameSnapshot: text("name_snapshot").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull(),
});

// ────────────────────────────────────────────────────────────
// SETTINGS — réglages liés à la prise de commande (ligne unique)
// ────────────────────────────────────────────────────────────
export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  prepTimeMinutes: integer("prep_time_minutes").notNull().default(20),
  autoAccept: boolean("auto_accept").notNull().default(false),
  acceptingOrders: boolean("accepting_orders").notNull().default(true),
  // horaires d'ouverture stockés en JSON souple
  openingHours: jsonb("opening_hours"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ────────────────────────────────────────────────────────────
// RELATIONS — déclarées pour les requêtes typées avec jointures
// ────────────────────────────────────────────────────────────
export const menuCategoriesRelations = relations(menuCategories, ({ many }) => ({
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));