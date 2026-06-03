import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  menuCategories,
  menuItems,
  customers,
  orders,
  orderItems,
  settings,
} from "./schema";

// Ce script tourne via tsx/Node (pas dans un Worker),
// donc process.env est disponible. Le .env est chargé via
// le flag --env-file dans le script package.json.
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL manquant. Vérifie ton fichier .env");
}

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function seed() {
  // ── Nettoyage (ordre inverse des dépendances : enfants d'abord) ──
  // Permet de relancer le seed sans empiler les doublons.
  console.log("Nettoyage des tables…");
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(menuItems);
  await db.delete(menuCategories);
  await db.delete(customers);
  await db.delete(settings);

  // ── Catégories ──
  console.log("Insertion des catégories…");
  const [entrees, plats, desserts, boissons] = await db
    .insert(menuCategories)
    .values([
      { name: "Entrées", sortOrder: 1 },
      { name: "Plats", sortOrder: 2 },
      { name: "Desserts", sortOrder: 3 },
      { name: "Boissons", sortOrder: 4 },
    ])
    .returning();

  // ── Plats (prix en centimes) ──
  console.log("Insertion des plats…");
  const insertedItems = await db
    .insert(menuItems)
    .values([
      { categoryId: entrees.id, name: "Salade César", description: "Salade, poulet, parmesan, croûtons", priceCents: 950, available: true },
      { categoryId: entrees.id, name: "Soupe à l'oignon", description: "Gratinée au fromage", priceCents: 800, available: true },
      { categoryId: plats.id, name: "Burger maison", description: "Bœuf, cheddar, frites", priceCents: 1650, available: true },
      { categoryId: plats.id, name: "Pizza Margherita", description: "Tomate, mozzarella, basilic", priceCents: 1200, available: true },
      { categoryId: plats.id, name: "Risotto aux champignons", description: "Champignons de saison", priceCents: 1400, available: false },
      { categoryId: desserts.id, name: "Tiramisu", description: "Recette maison", priceCents: 700, available: true },
      { categoryId: desserts.id, name: "Fondant au chocolat", description: "Cœur coulant", priceCents: 750, available: true },
      { categoryId: boissons.id, name: "Coca-Cola", priceCents: 350, available: true },
      { categoryId: boissons.id, name: "Eau minérale", priceCents: 250, available: true },
    ])
    .returning();

  // ── Clients ──
  console.log("Insertion des clients…");
  const insertedCustomers = await db
    .insert(customers)
    .values([
      { firstName: "Marie", lastName: "Dupont", email: "marie.dupont@example.com", phone: "0601020304" },
      { firstName: "Ahmed", lastName: "Benali", email: "ahmed.benali@example.com", phone: "0605060708" },
      { firstName: "Sophie", lastName: "Martin", email: "sophie.martin@example.com", phone: null },
    ])
    .returning();

  // ── Une commande de démo (avec snapshots de prix) ──
  console.log("Insertion d'une commande de démo…");
  const burger = insertedItems.find((i) => i.name === "Burger maison")!;
  const coca = insertedItems.find((i) => i.name === "Coca-Cola")!;
  const marie = insertedCustomers[0];

  const totalCents = burger.priceCents * 1 + coca.priceCents * 2;

  const [demoOrder] = await db
    .insert(orders)
    .values([
      { customerId: marie.id, status: "completed", totalCents },
    ])
    .returning();

  await db.insert(orderItems).values([
    { orderId: demoOrder.id, menuItemId: burger.id, nameSnapshot: burger.name, unitPriceCents: burger.priceCents, quantity: 1 },
    { orderId: demoOrder.id, menuItemId: coca.id, nameSnapshot: coca.name, unitPriceCents: coca.priceCents, quantity: 2 },
  ]);

  // ── Settings (ligne unique) ──
  console.log("Insertion des réglages…");
  await db.insert(settings).values([
    { prepTimeMinutes: 20, autoAccept: false, acceptingOrders: true },
  ]);

  console.log("Seed terminé ✓");
}

seed().catch((e) => {
  console.error("Seed échoué:", e);
  process.exit(1);
});