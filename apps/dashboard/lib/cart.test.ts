import { describe, it, expect } from "vitest";
import { addToCart, changeQty, cartTotal, type CartLine } from "./cart";

const MENU = [
  { id: "pizza", priceCents: 1200 },
  { id: "coca", priceCents: 350 },
  { id: "burger", priceCents: 1650 },
];

describe("addToCart", () => {
  it("ajoute un nouveau plat avec quantité 1", () => {
    expect(addToCart([], "pizza")).toEqual([{ menuItemId: "pizza", quantity: 1 }]);
  });

  it("incrémente la quantité si le plat est déjà au panier", () => {
    const cart: CartLine[] = [{ menuItemId: "pizza", quantity: 1 }];
    expect(addToCart(cart, "pizza")).toEqual([{ menuItemId: "pizza", quantity: 2 }]);
  });

  it("ne modifie pas le panier d'origine (immutabilité)", () => {
    const cart: CartLine[] = [{ menuItemId: "pizza", quantity: 1 }];
    addToCart(cart, "pizza");
    expect(cart).toEqual([{ menuItemId: "pizza", quantity: 1 }]);
  });
});

describe("changeQty", () => {
  it("incrémente et décrémente une ligne", () => {
    const cart: CartLine[] = [{ menuItemId: "coca", quantity: 2 }];
    expect(changeQty(cart, "coca", 1)).toEqual([{ menuItemId: "coca", quantity: 3 }]);
    expect(changeQty(cart, "coca", -1)).toEqual([{ menuItemId: "coca", quantity: 1 }]);
  });

  it("retire la ligne quand la quantité tombe à 0", () => {
    const cart: CartLine[] = [{ menuItemId: "coca", quantity: 1 }];
    expect(changeQty(cart, "coca", -1)).toEqual([]);
  });
});

describe("cartTotal", () => {
  it("calcule le total à partir des prix", () => {
    const cart: CartLine[] = [
      { menuItemId: "pizza", quantity: 2 },
      { menuItemId: "coca", quantity: 3 },
    ];
    // 2*1200 + 3*350 = 3450
    expect(cartTotal(cart, MENU)).toBe(3450);
  });

  it("renvoie 0 pour un panier vide", () => {
    expect(cartTotal([], MENU)).toBe(0);
  });

  it("ignore les plats inconnus", () => {
    const cart: CartLine[] = [{ menuItemId: "inconnu", quantity: 5 }];
    expect(cartTotal(cart, MENU)).toBe(0);
  });
});