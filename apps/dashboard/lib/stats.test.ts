import { describe, it, expect } from "vitest";
import { totalRevenue, completionRate, averageBasket, type OrderStat } from "./stats";

const ORDERS: OrderStat[] = [
  { status: "completed", totalCents: 2000 },
  { status: "completed", totalCents: 1000 },
  { status: "pending", totalCents: 1500 },
  { status: "cancelled", totalCents: 9999 },
];

describe("totalRevenue", () => {
  it("somme les totaux hors commandes annulées", () => {
    // 2000 + 1000 + 1500 = 4500 (le cancelled à 9999 est exclu)
    expect(totalRevenue(ORDERS)).toBe(4500);
  });

  it("renvoie 0 sans commande", () => {
    expect(totalRevenue([])).toBe(0);
  });
});

describe("completionRate", () => {
  it("calcule le pourcentage de commandes terminées", () => {
    // 2 completed sur 4 = 50%
    expect(completionRate(ORDERS)).toBe(50);
  });

  it("renvoie 0 sans commande", () => {
    expect(completionRate([])).toBe(0);
  });
});

describe("averageBasket", () => {
  it("calcule le panier moyen hors annulées", () => {
    // (2000+1000+1500) / 3 = 1500
    expect(averageBasket(ORDERS)).toBe(1500);
  });

  it("renvoie 0 sans commande valide", () => {
    expect(averageBasket([{ status: "cancelled", totalCents: 500 }])).toBe(0);
  });
});