# Mokili+

Application HTML/CSS/JavaScript vanilla connectée à une API Bun, Elysia et SQLite. Le serveur sert aussi les pages statiques pour éviter une configuration frontend séparée en développement.

## Prérequis et démarrage

Installer [Bun](https://bun.sh), puis depuis `backend/` :

```powershell
bun install
bun run db:seed
bun run dev
```

Ouvrir ensuite `http://localhost:3001`. Le serveur crée `backend/data/mokili.sqlite` et applique le schéma à son premier démarrage. `bun run db:seed` est répétable sans dupliquer le catalogue. En production, utiliser `bun run start`, définir des variables d'environnement de production et remplacer `SESSION_SECRET`.

Le fichier `backend/.env` est local et ignoré par Git. Les valeurs de référence sont dans `backend/.env.example`.

## Architecture

- `backend/src/routes/`: validation des requêtes et routes REST.
- `backend/src/services/`: authentification, commandes, abonnements et statistiques.
- `backend/src/database/`: schéma SQLite, connexion et seed.
- `backend/src/middleware/`: sessions et contrôle des rôles.
- `frontend/`: interface originale, connectée via `api.js` et des cookies HTTP-only.

Les mots de passe et codes admin sont hashés avec Argon2id via `Bun.password`. Les identifiants de session aléatoires sont stockés en SQLite; les cookies sont HTTP-only et SameSite=Lax. Aucun paiement réel n'est déclenché.

## API

Les réponses d'erreur suivent `{ "success": false, "error": { "code": "...", "message": "..." } }`. Les routes protégées répondent `401` sans session et `403` avec un rôle inadapté.

| Méthode | URL | Authentification | Corps / réponse |
| --- | --- | --- | --- |
| GET | `/api/health` | Aucune | État du serveur et SQLite. |
| POST | `/api/auth/register` | Aucune | `username`, `email`, `phone` (9 chiffres), `password`; crée un utilisateur et une session. |
| POST | `/api/auth/login` | Aucune | `username`, `password`; ouvre une session client. |
| GET | `/api/auth/me` | Client | Profil public de la session. |
| POST | `/api/auth/logout` | Cookie optionnel | Invalide la session et supprime le cookie. |
| GET | `/api/admin/count` | Aucune | Nombre d'administrateurs, limite et places disponibles. |
| POST | `/api/admin/register` | Aucune | `username`, `email`, `adminCode`; limite serveur de cinq. |
| POST | `/api/admin/login` | Aucune | `username`, `adminCode`; ouvre une session admin isolée. |
| GET | `/api/admin/me` | Admin | Profil public de l'administrateur. |
| GET | `/api/admin/dashboard` | Admin | Utilisateurs, abonnements et revenus agrégés depuis SQLite. |
| GET | `/api/admin/analytics/mrr` | Admin | Revenu mensuel récurrent estimé des abonnements actifs de 30 jours. |
| GET | `/api/products` | Aucune | Catalogue actif et prix issus de SQLite. |
| POST | `/api/subscriptions` | Client | `productId`, `priceId`; crée un abonnement et son paiement simulé transactionnel. |
| GET | `/api/subscriptions/me` | Client | Abonnements du compte connecté avec échéance et durée restante. |
| GET | `/api/purchases/me` | Client | Trois dernières cartes cadeaux du compte. |
| POST | `/api/payments/simulate` | Client | `type` (`subscription` ou `gift_card`), `productId`, `priceId`; crée paiement et commande atomiquement. |

Les montants et dates d'expiration sont calculés depuis `product_prices`; les identifiants de produit/prix envoyés par le client sont vérifiés ensemble.

## Vercel / Neon

Pour préparer la migration de la version locale vers Vercel avec PostgreSQL Neon :

Le point d'entrée racine `app.ts` exporte l'application Elysia pour que le preset Elysiajs de Vercel la détecte automatiquement. Dans les paramètres Vercel, la racine du projet doit rester la racine du dépôt.

### Développement local

```powershell
cd backend
bun install
bun run dev
```

### Test local Vercel

```powershell
bun install
bun run vercel:dev
```

### Déploiement

```powershell
vercel
```

Configure ensuite les variables d'environnement dans Vercel :

- `DATABASE_URL`
- `SESSION_SECRET`
- `FRONTEND_URL`
- `NODE_ENV`

La version locale conserve SQLite; la version Vercel doit utiliser Neon PostgreSQL et les cookies HTTP-only restent inchangés.

## Vérifications

```powershell
cd backend
bun test
```

Les tests d'intégration utilisent une base SQLite distincte de la base de développement.