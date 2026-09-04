# PSG News (site web)

Site perso (Next.js/React) qui agrège les actus PSG de plusieurs sources RSS dans un
seul flux, avec lecture du texte complet dans le site. Remplace la version Android
Kotlin/Compose explorée plus tôt dans le projet (abandonnée au profit du web).

## État du projet

Écrit avec soin mais **jamais installé ni buildé** : cet environnement de développement
n'a pas accès au registre npm (bloqué par la politique réseau du sandbox — même en
connexion directe, `registry.npmjs.org` renvoie une 403). Ton premier `npm install` +
`npm run build` en local sera donc le premier vrai test. Rien d'exotique attendu (le
code suit les patterns standards Next.js App Router), mais prévois de corriger
d'éventuelles erreurs de compilation.

## Pour le lancer en local

```bash
npm install
npm run dev
```

Puis ouvre http://localhost:3000.

## Déploiement gratuit (Vercel)

1. Pousse ce dossier dans un repo GitHub (public ou privé, peu importe).
2. Va sur [vercel.com](https://vercel.com), connecte-toi avec GitHub, "Add New Project"
   → sélectionne le repo. Vercel détecte Next.js automatiquement, aucune config
   nécessaire.
3. Déploie. Le cron (`vercel.json`) se met en place automatiquement sur le tier
   gratuit — limité à 1 exécution/jour sur le plan Hobby (contrainte Vercel, pas
   négociable sans passer Pro), réglé sur 6h du matin. Pour un vrai refresh horaire,
   utilise un service de cron externe gratuit (ex. [cron-job.org](https://cron-job.org))
   qui appelle `/api/refresh` en POST toutes les heures, indépendamment de Vercel — ou
   utilise simplement le bouton "Rafraîchir" de l'interface.
4. (Optionnel mais recommandé) Dans les paramètres du projet Vercel → Environment
   Variables, ajoute `CRON_SECRET` avec une valeur aléatoire. Vercel l'utilise
   automatiquement pour authentifier ses propres appels cron vers `/api/refresh` (voir
   `app/api/refresh/route.ts`) — ça évite que n'importe qui sur Internet puisse
   déclencher un rafraîchissement en trouvant l'URL.

## Architecture

```
lib/
  sources.ts     Les 5 sources RSS retenues (Foot Parisien exclu, voir tableau plus bas)
  articles.ts     Récupération + parsing des flux (rss-parser), mis en cache par Next.js
  extract.ts      Extraction du texte complet à la demande (Readability + jsdom),
                  seulement quand on ouvre la page d'un article, caché ~30 jours
  format.ts       "il y a 2 h" etc.
app/
  page.tsx                Page liste (Server Component)
  article/[id]/page.tsx   Page détail d'un article
  api/refresh/route.ts    Invalide le cache des flux (cron + bouton)
components/
  ArticleList.tsx    Filtres par source + liste (Client Component, filtre en mémoire)
  ArticleCard.tsx     Carte "à la une" + ligne compacte
  RefreshButton.tsx   Bouton "Rafraîchir" dans l'en-tête
```

**Comment marche la régénération** : la page liste (`/`) est mise en cache par Next.js
(Data Cache sur les appels `fetch` des flux RSS, tag `"feeds"`). Le cache se
renouvelle tout seul au bout d'une heure, ou immédiatement si `/api/refresh` est
appelé (`revalidateTag("feeds")`) — ce qui arrive soit via le cron Vercel
(`vercel.json`), soit via le bouton "Rafraîchir" de l'interface. Le texte complet
extrait d'un article (`lib/extract.ts`) a son propre cache, séparé et bien plus long
(30 jours) : un article déjà publié ne change pour ainsi dire jamais, pas besoin de le
ré-extraire à chaque rafraîchissement de la liste.

## État des flux RSS (vérifié début septembre 2026)

| Source | Flux | Statut |
|---|---|---|
| Planète PSG | `planetepsg.com/feed/` | ✅ vérifié, RSS 2.0 valide |
| Les Titis du PSG | `lestitisdupsg.fr/feed/` | ✅ vérifié, RSS 2.0 valide |
| ParisFans | `parisfans.fr/feed` | ✅ vérifié, RSS 2.0 valide |
| Canal Supporters | `canal-supporters.com/feed/` (⚠️ domaine avec un tiret) | ⚠️ très probable mais rate-limité au moment du test — à reconfirmer toi-même dans un navigateur |
| RMC Sport | `rmcsport.bfmtv.com/rss/football/ligue-1/` | ⚠️ pas de flux PSG dédié — flux Ligue 1 général, filtré côté serveur sur "psg"/"paris" |
| Foot Parisien | — | ❌ exclu : pas de flux RSS propre, republie du contenu d'autres sources (dont Planète PSG) → doublons |

## Prochaines étapes possibles

- Vérifier/corriger le flux Canal Supporters si besoin (`lib/sources.ts`).
- Mode sombre, favicon, image Open Graph pour le partage sur les réseaux.
- Protéger `/api/refresh` plus sérieusement si le site devient public et très visité
  (pour l'instant : `CRON_SECRET` protège l'appel cron, mais le bouton en POST reste
  ouvert — acceptable pour un site perso à faible trafic).
