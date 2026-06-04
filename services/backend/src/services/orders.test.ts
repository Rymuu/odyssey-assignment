import { describe, it, expect } from "vitest";
import {
  isValidTransition,
  ORDER_TRANSITIONS,
  createOrder,
  OrderError,
} from "./orders";
import type { Db } from "../db";

// ─────────────────────────────────────────────────────────────
// Tests de la machine à états des statuts (logique pure, sans DB)
// ─────────────────────────────────────────────────────────────
describe("isValidTransition — machine à états des statuts", () => {
  it("autorise les transitions valides du cycle de vie", () => {
    expect(isValidTransition("pending", "accepted")).toBe(true);
    expect(isValidTransition("accepted", "preparing")).toBe(true);
    expect(isValidTransition("preparing", "ready")).toBe(true);
    expect(isValidTransition("ready", "completed")).toBe(true);
  });

  it("autorise l'annulation depuis les statuts actifs", () => {
    expect(isValidTransition("pending", "cancelled")).toBe(true);
    expect(isValidTransition("accepted", "cancelled")).toBe(true);
    expect(isValidTransition("preparing", "cancelled")).toBe(true);
  });

  it("rejette les transitions qui sautent des étapes ou reviennent en arrière", () => {
    expect(isValidTransition("pending", "ready")).toBe(false);
    expect(isValidTransition("pending", "completed")).toBe(false);
    expect(isValidTransition("completed", "pending")).toBe(false);
    expect(isValidTransition("ready", "preparing")).toBe(false);
  });

  it("n'autorise aucune sortie depuis les statuts terminaux", () => {
    expect(ORDER_TRANSITIONS.completed).toEqual([]);
    expect(ORDER_TRANSITIONS.cancelled).toEqual([]);
    expect(isValidTransition("completed", "cancelled")).toBe(false);
    // 'ready' ne peut plus être annulé (seulement complété)
    expect(isValidTransition("ready", "cancelled")).toBe(false);
  });

  it("rejette un statut de départ inconnu", () => {
    expect(isValidTransition("inconnu", "pending")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// Tests de createOrder : calcul du total + validation des items.
// On mocke `db` pour reproduire la chaîne Drizzle sans vraie base.
// ─────────────────────────────────────────────────────────────
function makeMockDb(menuRows: unknown[]) {
  return {
    // select().from().where()  → renvoie les plats fournis
    select: () => ({ from: () => ({ where: () => Promise.resolve(menuRows) }) }),
    // insert().values().returning()  → renvoie la commande créée
    insert: () => ({
      values: (vals: { customerId?: string; status?: string; totalCents?: number }) => ({
        returning: () =>
          Promise.resolve([
            { id: "order-1", customerId: vals.customerId, status: vals.status, totalCents: vals.totalCents },
          ]),
      }),
    }),
    // delete().where()  → compensation (no-op dans le mock)
    delete: () => ({ where: () => Promise.resolve() }),
  } as unknown as Db;
}

describe("createOrder — calcul du total et validation des plats", () => {
  const pizza = { id: "pizza", name: "Pizza", priceCents: 1200, available: true, deletedAt: null };
  const coca = { id: "coca", name: "Coca", priceCents: 350, available: true, deletedAt: null };

  it("calcule le total côté serveur = somme des prix × quantités", async () => {
    const db = makeMockDb([pizza, coca]);
    const order = await createOrder(db, {
      customerId: "cust-1",
      items: [
        { menuItemId: "pizza", quantity: 2 },
        { menuItemId: "coca", quantity: 3 },
      ],
    });
    // 2 × 1200 + 3 × 350 = 3450
    expect(order.totalCents).toBe(3450);
  });

  it("force le statut initial à 'pending'", async () => {
    const db = makeMockDb([pizza]);
    const order = await createOrder(db, {
      customerId: "cust-1",
      items: [{ menuItemId: "pizza", quantity: 1 }],
    });
    expect(order.status).toBe("pending");
  });

  it("rejette une commande contenant un plat introuvable", async () => {
    const db = makeMockDb([pizza]); // 'inconnu' n'est pas renvoyé
    await expect(
      createOrder(db, { customerId: "cust-1", items: [{ menuItemId: "inconnu", quantity: 1 }] })
    ).rejects.toThrow(OrderError);
  });

  it("rejette une commande contenant un plat indisponible", async () => {
    const indispo = { id: "burger", name: "Burger", priceCents: 1650, available: false, deletedAt: null };
    const db = makeMockDb([indispo]);
    await expect(
      createOrder(db, { customerId: "cust-1", items: [{ menuItemId: "burger", quantity: 1 }] })
    ).rejects.toThrow("indisponible");
  });
});