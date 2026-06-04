# Odyssey — Dashboard d'administration de restaurant

Back-office permettant de visualiser et de **gérer** l'activité d'un restaurant :
tableau de bord (KPIs, graphiques, plats populaires), commandes (liste, filtres,
recherche, détail, changement de statut, création), clients (CRM), menu (CRUD avec
images et disponibilité) et réglages (service, temps de préparation, horaires).

Monorepo **pnpm + Turborepo** : front Expo / React Native Web, API Hono sur
Cloudflare Workers, PostgreSQL via Drizzle, et un client typé généré par Orval.

> Pour les choix techniques, voir [`ARCHITECTURE.md`](./ARCHITECTURE.md).
> Pour les compromis assumés, voir [`TRADEOFFS.md`](./TRADEOFFS.md).

## Prérequis

- **Node.js** ≥ 20
- **pnpm** 11 (`npm install -g pnpm`)
- Un compte **Neon** (PostgreSQL serverless, gratuit) : https://neon.tech

## 1. Installation

```bash
git clone https://github.com/Rymuu/odyssey-assignment.git
cd odyssey-assignment
pnpm install
```

## 2. Base de données (Neon)

1. Créez un projet sur [Neon](https://neon.tech) et copiez la **connection string**
   (celle du *pooler*, format `postgresql://user:password@…-pooler.…neon.tech/db?sslmode=require`).
2. Configurez les variables d'environnement du backend en copiant les fichiers
   d'exemple :

   ```bash
   cd services/backend
   cp .env.example .env
   cp .dev.vars.example .dev.vars
   ```

3. Renseignez votre `DATABASE_URL` dans **les deux** fichiers :
   - `.env` — utilisé par les scripts Node (migrations, seed)
   - `.dev.vars` — utilisé par le runtime Cloudflare Workers (dev local)

   `.dev.vars` contient aussi `CORS_ORIGIN="http://localhost:8081"` (l'origine du
   front en développement).

## 3. Schéma & données de démonstration

Toujours dans `services/backend` :

```bash
pnpm db:generate   # génère les fichiers de migration depuis le schéma Drizzle
pnpm db:migrate    # applique le schéma à la base Neon
pnpm db:seed       # peuple la base (catégories, plats, clients, commandes, réglages)
```

> Le seed génère des commandes réparties sur les 7 derniers jours, avec des chiffres
> aléatoires : chaque exécution produit un jeu de données légèrement différent.

## 4. Lancer le projet

Depuis la **racine** du monorepo, dans deux terminaux :

```bash
pnpm dev:backend     # API sur http://localhost:8787
pnpm dev:dashboard   # front sur http://localhost:8081
```

Ouvrez **http://localhost:8081** dans le navigateur.

## 5. Régénérer le client API (si le backend change)

Le client et les hooks React Query sont générés à partir de la spec OpenAPI du
backend. Après toute modification d'une route ou du schéma :

```bash
pnpm gen:contract
```

Cette commande exporte `openapi.json` depuis le backend puis lance Orval pour
régénérer `packages/api-client/src/generated/`.

## Scripts disponibles (racine)

| Commande | Description |
|---|---|
| `pnpm dev:dashboard` | Lance le front (Expo Web) |
| `pnpm dev:backend` | Lance l'API (Hono / Workers) |
| `pnpm gen:contract` | Régénère le client typé (OpenAPI → Orval) |
| `pnpm lint` | Linte le code (backend) |
| `pnpm typecheck` | Vérifie les types sur tout le monorepo |
| `pnpm test` | Lance tous les tests (backend + front) |

## Structure du projet

```
odyssey-assignment/
├── apps/
│   └── dashboard/        # Front Expo + React Native Web
│       ├── app/          # Pages (Home, Orders, CRM, Menu, Settings)
│       ├── components/    # Composants non-routables (Sidebar)
│       └── lib/          # Logique pure testée (panier, stats)
├── services/
│   └── backend/          # API Hono / Cloudflare Workers
│       └── src/
│           ├── db/        # Schéma Drizzle + seed
│           ├── routes/    # Routes par domaine
│           └── services/  # Logique métier (machine à états, création commande)
└── packages/
    ├── api-client/       # Client + hooks générés par Orval
    └── shared/           # Design system, animations, hooks
```

## Tests

```bash
pnpm test
```

- **Backend** : machine à états des statuts de commande, calcul du total, validation
  des plats (`services/backend/src/services/orders.test.ts`).
- **Front** : logique du panier et calculs de statistiques
  (`apps/dashboard/lib/*.test.ts`).

## Stack

Expo · React Native Web · Expo Router · Hono · Cloudflare Workers · Drizzle ORM ·
drizzle-zod · OpenAPI · Orval · React Query · PostgreSQL (Neon) · Vitest ·
pnpm · Turborepo · TypeScript.
