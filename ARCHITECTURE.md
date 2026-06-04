# Architecture — Odyssey Dashboard

Ce document décrit la structure du projet et les choix techniques structurants.

## Vue d'ensemble

Odyssey est un dashboard d'administration de restaurant : un back-office où l'on
peut visualiser **et agir** sur les données (commandes, menu, clients, réglages).

Le projet est un **monorepo pnpm + Turborepo** organisé en quatre packages :

```
odyssey-assignment/
├── apps/
│   └── dashboard/        # Front Expo + React Native Web (@odyssey/dashboard)
├── services/
│   └── backend/          # API Hono sur Cloudflare Workers (@odyssey/backend)
└── packages/
    ├── api-client/       # Client + hooks générés par Orval (@odyssey/api-client)
    └── shared/           # Design system + helpers partagés (@odyssey/shared)
```

## La chaîne de types de bout en bout

Le cœur de l'architecture est une **chaîne de types unique**, de la base de
données jusqu'aux hooks du front. Aucun type n'est écrit à la main côté client :

```
Drizzle schema  →  drizzle-zod  →  Hono + OpenAPI  →  Orval  →  hooks React Query
   (schema.ts)      (validation)     (openapi.json)    (gen)     (useGetOrders…)
```

1. **Drizzle** définit le schéma PostgreSQL (`services/backend/src/db/schema.ts`).
2. Les **schémas Zod** des routes valident les entrées/sorties et alimentent l'OpenAPI.
3. **Hono + `@hono/zod-openapi`** exposent l'API et génèrent `openapi.json`.
4. **Orval** lit cette spec et génère le client typé + les hooks React Query
   (`packages/api-client/src/generated/`).
5. Le **dashboard** consomme ces hooks (`useGetOrders`, `usePostOrders`…).

Conséquence : une modification du schéma se propage automatiquement jusqu'au front
après `pnpm gen:contract`. Les types restent cohérents sans duplication.

## Backend (services/backend)

API REST sur **Hono** (runtime Cloudflare Workers), connectée à **PostgreSQL (Neon)**
via **Drizzle ORM** (driver `neon-http`).

- **Routes** (`src/routes/`) : un router par domaine (menu-items, orders, customers,
  settings, stats), monté dans `src/index.ts`.
- **Logique métier** (`src/services/orders.ts`) : isolée du HTTP, donc testable.
  Contient la **machine à états** des statuts de commande et la création de commande
  (calcul du total + snapshots de prix côté serveur).
- **Modèle de données** : 6 tables (menu_categories, menu_items, customers, orders,
  order_items, settings). Les commandes utilisent un **snapshot** du nom et du prix
  des plats au moment de l'achat (intégrité historique).

### Machine à états des commandes

Le statut d'une commande suit un cycle de vie strict, validé côté serveur :

```
pending → accepted → preparing → ready → completed
   └──────────┴───────────┴──→ cancelled
```

Toute transition invalide (ex. completed → pending) est rejetée. La logique est
centralisée dans `ORDER_TRANSITIONS` / `isValidTransition`.

## Design system (packages/shared)

Composants réutilisables et tokens de design centralisés, pour une cohérence
visuelle sur toutes les pages :

- **Tokens** (`theme/tokens.ts`) : couleurs, typographie, espacements, rayons, ombres.
- **Composants** : Button, Card, Badge, Text, Input, Select, Modal, Table,
  ConfirmDialog, Toast, Skeleton, BarChart, DonutChart.
- **Animation** (`animation/`) : helpers d'entrée (FadeInView), compteur animé
  (useCountUp), retour tactile (PressableScale) — via l'API Animated native.
- **Hooks** : useResponsive (breakpoints + padding adaptatif).

Les graphiques (BarChart, DonutChart) sont faits maison en SVG (react-native-svg),
animés via requestAnimationFrame.

## Front (apps/dashboard)

**Expo Router** (routing par fichiers) sur React Native Web.

- `app/` : les routes (index = Home, orders, crm, menu, settings, ui).
- `components/` : composants non-routables (Sidebar).
- `lib/` : logique métier pure et testable (panier, calculs de stats).

### Navigation croisée

Les entités sont reliées par des **paramètres d'URL** plutôt que par des routes
dédiées : cliquer sur une commande depuis n'importe où ouvre `/orders?id=xxx`
(détail), et la fiche d'un client mène à `/orders?customer=xxx` (liste filtrée).
Avantage : une seule page Orders, des URLs partageables, pas de logique dupliquée.

## Tests

- **Backend** (`services/backend/src/services/orders.test.ts`) : machine à états
  (transitions valides/invalides) et création de commande (total, validation des
  items), avec un mock de la couche Drizzle.
- **Front** (`apps/dashboard/lib/*.test.ts`) : logique du panier et calculs de stats,
  testés comme fonctions pures.

Lancés via Vitest (`pnpm test`, orchestré par Turborepo sur tout le monorepo).
