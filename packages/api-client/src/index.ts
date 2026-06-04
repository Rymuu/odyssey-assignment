// Point d'entrée du package : ré-exporte tout le code généré par Orval.
// Le frontend importe ses hooks et types depuis "@odyssey/api-client".
// Ré-exporte tout le code généré : types (models) ET hooks par domaine.
export * from "./generated/models";
export * from "./generated/menu/menu";
export * from "./generated/orders/orders";
export * from "./generated/crm/crm";
export * from "./generated/settings/settings";
export * from "./generated/stats/stats";