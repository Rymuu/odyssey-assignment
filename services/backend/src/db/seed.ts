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

// ── Helpers de génération ──
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

// Statuts pondérés : surtout completed, un peu de pending/preparing/ready, peu de cancelled
const STATUS_POOL = [
  "completed", "completed", "completed", "completed", "completed",
  "preparing", "pending", "ready", "accepted", "cancelled",
] as const;

async function seed() {
  console.log("Nettoyage des tables…");
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(menuItems);
  await db.delete(menuCategories);
  await db.delete(customers);
  await db.delete(settings);

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

  console.log("Insertion des plats…");
  const insertedItems = await db
    .insert(menuItems)
    .values([
      { categoryId: entrees.id, name: "Salade César", description: "Salade, poulet, parmesan, croûtons", priceCents: 950, available: true, imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400" },
      { categoryId: entrees.id, name: "Soupe à l'oignon", description: "Gratinée au fromage", priceCents: 800, available: true, imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400" },
      { categoryId: plats.id, name: "Burger maison", description: "Bœuf, cheddar, frites", priceCents: 1650, available: true, imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
      { categoryId: plats.id, name: "Pizza Margherita", description: "Tomate, mozzarella, basilic", priceCents: 1200, available: true, imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400" },
      { categoryId: plats.id, name: "Risotto aux champignons", description: "Champignons de saison", priceCents: 1400, available: false, imageUrl: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400" },
      { categoryId: desserts.id, name: "Tiramisu", description: "Recette maison", priceCents: 700, available: true, imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400" },
      { categoryId: desserts.id, name: "Fondant au chocolat", description: "Cœur coulant", priceCents: 750, available: true, imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400" },
      { categoryId: boissons.id, name: "Coca-Cola", priceCents: 350, available: true, imageUrl: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400" },
      { categoryId: boissons.id, name: "Eau minérale", priceCents: 250, available: true, imageUrl: "https://images.unsplash.com/photo-1560023907-5f339617ea30?w=400" },
    ])
    .returning();

  // Plats disponibles seulement (pour composer les commandes)
  const availableItems = insertedItems.filter((i) => i.available);

  console.log("Insertion des clients…");
  const insertedCustomers = await db
    .insert(customers)
    .values([
      { firstName: "Marie", lastName: "Dupont", email: "marie.dupont@example.com", phone: "0601020304" },
      { firstName: "Ahmed", lastName: "Benali", email: "ahmed.benali@example.com", phone: "0605060708" },
      { firstName: "Sophie", lastName: "Martin", email: "sophie.martin@example.com", phone: null },
      { firstName: "Lucas", lastName: "Bernard", email: "lucas.bernard@example.com", phone: "0610111213" },
      { firstName: "Emma", lastName: "Petit", email: "emma.petit@example.com", phone: "0614151617" },
      { firstName: "Yanis", lastName: "Roux", email: "yanis.roux@example.com", phone: null },
      { firstName: "Camille", lastName: "Garnier", email: "camille.garnier@example.com", phone: "0618192021" },
      { firstName: "Noah", lastName: "Lefevre", email: "noah.lefevre@example.com", phone: "0622232425" },
    ])
    .returning();

  // ── Génération des commandes réparties sur 7 jours ──
  console.log("Génération des commandes…");
  let orderCount = 0;

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const ordersThisDay = randomInt(2, 6);

    for (let i = 0; i < ordersThisDay; i++) {
      // Date dans le passé (jour + heure de service réaliste)
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - dayOffset);
      createdAt.setHours(randomInt(11, 22), randomInt(0, 59), 0, 0);

      // Composer la commande : 1 à 4 lignes
      const nbLines = randomInt(1, 4);
      const lines: { item: typeof availableItems[number]; qty: number }[] = [];
      let totalCents = 0;
      for (let j = 0; j < nbLines; j++) {
        const item = pick(availableItems);
        const qty = randomInt(1, 3);
        lines.push({ item, qty });
        totalCents += item.priceCents * qty;
      }

      const status = pick(STATUS_POOL);
      const customer = pick(insertedCustomers);

      // Insérer la commande avec createdAt forcé
      const [order] = await db
        .insert(orders)
        .values([
          {
            customerId: customer.id,
            status,
            totalCents,
            createdAt,
            updatedAt: createdAt,
          },
        ])
        .returning();

      // Insérer ses lignes (avec snapshots)
      await db.insert(orderItems).values(
        lines.map((l) => ({
          orderId: order.id,
          menuItemId: l.item.id,
          nameSnapshot: l.item.name,
          unitPriceCents: l.item.priceCents,
          quantity: l.qty,
        }))
      );

      orderCount++;
    }
  }
  console.log(`${orderCount} commandes insérées sur 7 jours.`);

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