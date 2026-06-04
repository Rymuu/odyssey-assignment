// Calculs purs des indicateurs du tableau de bord.
// Extraits pour être testables indépendamment du rendu.

export type OrderStat = { status: string; totalCents: number };

/** Revenu total : somme des totaux, hors commandes annulées. */
export function totalRevenue(orders: OrderStat[]): number {
  return orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.totalCents ?? 0), 0);
}

/** Taux de complétion (%) : part des commandes terminées sur le total. */
export function completionRate(orders: OrderStat[]): number {
  if (orders.length === 0) return 0;
  const completed = orders.filter((o) => o.status === "completed").length;
  return Math.round((completed / orders.length) * 100);
}

/** Panier moyen en centimes : revenu valide / nombre de commandes valides. */
export function averageBasket(orders: OrderStat[]): number {
  const valid = orders.filter((o) => o.status !== "cancelled");
  if (valid.length === 0) return 0;
  const total = valid.reduce((sum, o) => sum + (o.totalCents ?? 0), 0);
  return Math.round(total / valid.length);
}