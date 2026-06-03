// ════════════════════════════════════════════════════════════
// SERVICE COMMANDES — logique métier pure, sans HTTP.
// Testable en isolation, réutilisable par les routes.
// ════════════════════════════════════════════════════════════
import { eq, and, isNull, inArray } from "drizzle-orm";
import { menuItems, orders, orderItems } from "../db/schema";
import type { Db } from "../db";

// ── La machine à états des statuts de commande ──
// Pour chaque statut, la liste des statuts vers lesquels on peut aller.
export const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

export function isValidTransition(from: string, to: string): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Erreurs métier typées ──
export class OrderError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export type CreateOrderInput = {
  customerId: string;
  items: { menuItemId: string; quantity: number }[];
};

// ── Création d'une commande ──
export async function createOrder(db: Db, input: CreateOrderInput) {
  const ids = input.items.map((i) => i.menuItemId);

  // 1. Récupérer les plats demandés, actifs uniquement
  const found = await db
    .select()
    .from(menuItems)
    .where(and(inArray(menuItems.id, ids), isNull(menuItems.deletedAt)));

  const byId = new Map(found.map((m) => [m.id, m]));

  // 2. Valider chaque ligne
  for (const line of input.items) {
    const item = byId.get(line.menuItemId);
    if (!item) {
      throw new OrderError("ITEM_NOT_FOUND", `Plat introuvable : ${line.menuItemId}`);
    }
    if (!item.available) {
      throw new OrderError("ITEM_UNAVAILABLE", `Plat indisponible : ${item.name}`);
    }
  }

  // 3. Construire les lignes avec snapshots + calculer le total côté serveur
  const lines = input.items.map((line) => {
    const item = byId.get(line.menuItemId)!;
    return {
      menuItemId: item.id,
      nameSnapshot: item.name,
      unitPriceCents: item.priceCents,
      quantity: line.quantity,
    };
  });
  const totalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);

  // 4. Insérer la commande (statut forcé à "pending")
  const [order] = await db
    .insert(orders)
    .values({ customerId: input.customerId, status: "pending", totalCents })
    .returning();

  // 5. Insérer les lignes. Si ça échoue, on annule la commande (compensation
  //    manuelle, car neon-http ne supporte pas les transactions multi-requêtes).
  try {
    await db.insert(orderItems).values(lines.map((l) => ({ ...l, orderId: order.id })));
  } catch (e) {
    await db.delete(orders).where(eq(orders.id, order.id));
    throw e;
  }

  return order;
}

// ── Changement de statut ──
export async function updateOrderStatus(db: Db, orderId: string, newStatus: string) {
  const [current] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!current) {
    throw new OrderError("ORDER_NOT_FOUND", "Commande introuvable");
  }
  if (!isValidTransition(current.status, newStatus)) {
    throw new OrderError(
      "INVALID_TRANSITION",
      `Transition interdite : ${current.status} → ${newStatus}`
    );
  }
  const [updated] = await db
    .update(orders)
    .set({ status: newStatus as typeof current.status, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
  return updated;
}