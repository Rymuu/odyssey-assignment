// Logique pure du panier de création de commande.
// Extraite des composants pour être testable et réutilisable.

export type CartLine = { menuItemId: string; quantity: number };
export type PricedItem = { id: string; priceCents: number };

/** Ajoute un plat au panier (ou incrémente sa quantité s'il y est déjà). */
export function addToCart(cart: CartLine[], menuItemId: string): CartLine[] {
  const existing = cart.find((l) => l.menuItemId === menuItemId);
  if (existing) {
    return cart.map((l) =>
      l.menuItemId === menuItemId ? { ...l, quantity: l.quantity + 1 } : l
    );
  }
  return [...cart, { menuItemId, quantity: 1 }];
}

/** Modifie la quantité d'une ligne ; retire la ligne si la quantité tombe à 0. */
export function changeQty(cart: CartLine[], menuItemId: string, delta: number): CartLine[] {
  return cart
    .map((l) => (l.menuItemId === menuItemId ? { ...l, quantity: l.quantity + delta } : l))
    .filter((l) => l.quantity > 0);
}

/** Calcule le total du panier en centimes, à partir des prix des plats. */
export function cartTotal(cart: CartLine[], items: PricedItem[]): number {
  return cart.reduce((sum, line) => {
    const item = items.find((i) => i.id === line.menuItemId);
    return sum + (item ? item.priceCents * line.quantity : 0);
  }, 0);
}