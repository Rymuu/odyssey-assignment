# Tradeoffs & décisions techniques

Ce document recense les compromis assumés pendant le développement, avec leur
justification et les pistes d'amélioration. L'objectif est d'être transparent sur
ce qui a été priorisé dans le cadre d'un exercice limité en temps.

## Base de données & transactions

**Choix : `neon-http` sans transactions multi-requêtes.**
Le driver HTTP de Neon ne supporte pas les transactions sur plusieurs requêtes.
Pour la création de commande (insérer la commande puis ses lignes), j'ai mis en
place une **compensation manuelle** : si l'insertion des lignes échoue, la commande
est supprimée. 
*Amélioration* : passer au driver `neon-serverless` (WebSocket) qui supporte les
transactions, ou regrouper en une seule requête.

## URL de l'API en dur

**Choix : `baseUrl` Orval fixé à `http://localhost:8787`.**
Pour rester simple en développement local. 
*Amélioration* : externaliser via un mutator Orval lisant une variable
d'environnement, pour gérer plusieurs environnements (dev/préprod/prod).

## Lint partiel

**Choix : ESLint configuré uniquement sur le backend.**
Le front et les packages partagés sont couverts par le **typecheck strict**
(`tsc --noEmit`), mais pas par ESLint (pas de config ESLint dédiée).
*Amélioration* : ajouter une config ESLint partagée à la racine et l'étendre à
tous les packages.

## Tests : unitaires plutôt qu'intégration

**Choix : tests unitaires sur la logique métier isolée.**
La logique critique (machine à états, calcul de total, panier, stats) est testée
en isolation, avec un mock de la couche Drizzle côté backend. Pas de tests
d'intégration avec une vraie base.
*Justification* : rapides, déterministes, sans dépendance à une DB de test.
*Amélioration* : ajouter des tests d'intégration sur une base éphémère (ex.
PGlite ou un conteneur Postgres) et des tests de composants front.

## Authentification absente

**Choix : pas d'authentification.**
Hors périmètre de l'exercice. La spec OpenAPI est publique en local.
*Amélioration* : ajouter une couche d'auth (l'architecture initiale prévoyait
Keycloak/JWT) avant toute mise en production.

## Client Orval versionné

**Choix : le code généré par Orval est commité dans le dépôt.**
Le dépôt est ainsi directement lisible et exécutable sans étape de génération.
*Alternative* : l'ignorer et le régénérer à l'installation (`postinstall`).

## Barrel manuel de l'api-client

**Choix : `packages/api-client/src/index.ts` est maintenu à la main.**
Chaque nouveau domaine backend nécessite d'ajouter sa ligne d'export.
*Amélioration* : générer ce barrel automatiquement.

## Graphiques faits maison

**Choix : BarChart et DonutChart en SVG (react-native-svg), sans librairie de
charts.**
Évite une dépendance lourde pour deux graphiques simples, et garantit un contrôle
total sur le style et les animations (requestAnimationFrame). 
*Limite* : moins de fonctionnalités qu'une librairie dédiée si les besoins
grandissent.

## Animations via l'API Animated native

**Choix : animations avec `Animated` (React Native) plutôt que Reanimated.**
Évite une dépendance supplémentaire et sa configuration Babel, sur un projet
web-first. `useNativeDriver: false` est utilisé pour la compatibilité
react-native-web. 
*Amélioration* : Reanimated apporterait des animations pilotées sur le thread UI
(plus fluides sur mobile natif).

## Select en overlay centré

**Choix : le composant Select ouvre un menu centré (Modal) plutôt qu'ancré sous
le déclencheur.**
Plus fiable en cross-platform que la gestion du z-index/positionnement absolu.
*Amélioration* : un menu ancré (popover) pour une UX plus classique sur desktop.

## Warnings de dépréciation non tous traités

Quelques warnings react-native-web subsistent (ex. `shadow*` → `boxShadow`).
Bénins et sans impact fonctionnel ; non traités par priorisation.

## SDK Expo en beta

Le projet utilise Expo SDK 56 (beta), d'où quelques avertissements de peer
dependencies (ex. react-native-worklets). Sans impact observé sur le
fonctionnement web.

## openingHours typé large

Le champ `openingHours` (jsonb) est typé de façon permissive côté backend.
*Amélioration* : un schéma Zod strict (jours → { open, close, closed }) validerait
la structure de bout en bout.
