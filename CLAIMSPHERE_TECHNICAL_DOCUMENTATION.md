# ClaimSphere

## Documentation Technique

Projet : Plateforme intelligente de gestion de contrats et de sinistres automobiles

---

# 1. Presentation du Projet

**Nom du projet :** ClaimSphere  
**Type :** Plateforme web de gestion de contrats d'assurance auto et de traitement de sinistres assiste par IA  
**Objectif :** Digitaliser tout le cycle de vie d'un sinistre auto, depuis la declaration client jusqu'a la decision agent, en integrant constat via QR code, OCR de documents, analyse de dommages et orchestration metier.

## 1.1 Objectifs Cles

- Permettre au client de declarer un sinistre en ligne de maniere guidee
- Generer un constat partageable par QR code pour la seconde partie
- Centraliser les pieces du dossier: PV police, images, devis, rapport expert
- Consolider automatiquement les donnees du dossier dans un resultat structure
- Aider l'agent a prendre une decision grace a des controles de coherence, une analyse de couverture et un scoring de risque
- Reexecuter l'analyse lorsqu'un client ajoute de nouvelles pieces

## 1.2 Fonctionnalites Principales

- Authentification utilisateur et gestion par role
- Souscription de contrats d'assurance auto
- Dashboard client pour contrats, offres et sinistres
- Dashboard agent pour contrats et dossiers de sinistres
- Workflow complet de declaration de sinistre
- Generation et scan de QR code pour le constat amiable
- Upload et stockage des documents dans Supabase Storage
- OCR des documents: PV police, devis, rapport expert
- Analyse des images d'accident via le module damage-analysis
- Decision enrichie par damage-agent
- Orchestrateur metier pour fusionner les donnees et produire une recommandation
- Notifications pour les decisions agent et demandes de pieces

## 1.3 Lien GitHub

Le document de reference utilise une section GitHub.  
Pour ClaimSphere, ajoute ici l'URL finale de ton depot si tu veux une version prete a rendre.

Exemple :

`https://github.com/<votre-compte>/<votre-repo>`

---

# 2. Architecture Generale

La plateforme repose sur une architecture modulaire separee en frontend, backend applicatif, services IA et base de donnees.  
Le frontend React communique avec un backend NestJS. Le backend orchestre les modules metier et s'appuie sur PostgreSQL et Supabase pour la persistance et le stockage.

## 2.1 Vue d'Ensemble

### Frontend

- Application React + TypeScript + Vite
- Interfaces client, agent et admin
- Consomme les API REST exposees par NestJS

### Backend API

- Application NestJS modulaire
- Expose les routes d'authentification, contrats, constats, sinistres, OCR, documents, orchestrateur
- Contient la logique metier du workflow de sinistre

### Services IA

L'intelligence artificielle n'est pas centralisee dans un seul microservice local, mais dans plusieurs modules:

- `ocr.service.ts` pour l'extraction structuree de PV police, devis et rapport expert
- `damage-analysis` pour l'analyse des images d'accident
- `damage-agent` pour la decision enrichie a partir des resultats de dommages
- `orchestrator.service.ts` pour la fusion des donnees et la recommandation finale

### Base de Donnees et stockage

- PostgreSQL via TypeORM pour les entites principales
- Supabase pour l'acces aux donnees et au stockage de fichiers
- Tables principales: `claims`, `contracts`, `constats`, `constat_parties`, `documents`, `pv_police`, `rapport_expert`, `devis`, `ai_scores`, `notifications`

## 2.2 Description des Composants

### Frontend

Le frontend fournit:

- les pages publiques d'offres
- l'authentification
- le dashboard client
- le dashboard agent
- la declaration de sinistre avec QR code
- la consultation des details du dossier

Routes majeures relevees dans [App.tsx](C:/Users/Melek/Desktop/ppp/claimsphere-frontside/src/App.tsx):

- `/`
- `/auth`
- `/constats/scan/:token`
- `/dashboard/contracts`
- `/dashboard/contracts/new`
- `/dashboard/claims`
- `/dashboard/offers`
- `/dashboard/offers/:id`
- `/agent`
- `/admin`

### Backend API

Le backend est structure par modules metier, notamment:

- `auth`
- `claims`
- `contrats`
- `constats`
- `documents`
- `ocr`
- `orchestrator`
- `damage-analysis`
- `damage-agent`
- `ai-scores`
- `notifications`
- `supabase`

Le point d'entree principal est [main.ts](C:/Users/Melek/Desktop/ppp/backend-nest/src/main.ts), qui demarre NestJS sur le port `5000` par defaut.

### Orchestrateur de sinistre

Le coeur analytique du projet se trouve dans [orchestrator.service.ts](C:/Users/Melek/Desktop/ppp/backend-nest/src/orchestrator/orchestrator.service.ts).

L'orchestrateur:

- recupere les donnees du claim
- recupere le constat
- recupere les resultats OCR
- recupere les resultats d'analyse de dommages
- verifie la coherence entre les differentes sources
- analyse la couverture du contrat
- calcule un score de fraude, un score de coherence et un montant recommande
- produit une suggestion destinee a l'agent

### OCR

Le module [ocr.service.ts](C:/Users/Melek/Desktop/ppp/backend-nest/src/ocr/services/ocr.service.ts) :

- extrait le texte des PDF
- utilise OCR quand le document est scanne
- structure les donnees avec OpenAI
- persiste les resultats dans:
  - `pv_police`
  - `rapport_expert`
  - `devis`

### Damage Analysis et Damage Agent

- `damage-analysis` produit une lecture technique des images
- `damage-agent` enrichit ensuite la decision avec une logique LLM et des regles metier

### Base de Donnees

Le backend utilise TypeORM avec PostgreSQL. La configuration est definie dans [app.module.ts](C:/Users/Melek/Desktop/ppp/backend-nest/src/app.module.ts).

---

# 3. Organisation du Code

## 3.1 Structure du Depot

```text
ppp/
├── backend-nest/
├── claimsphere-frontside/
├── database/
├── CONSTAT_API_EXAMPLES.md
├── CONSTAT_ARCHITECTURE.md
├── CONSTAT_FLOW_GUIDE.md
├── CONSTAT_FRONTEND_INTEGRATION.md
├── CONSTAT_QR_CODE_IMPLEMENTATION.md
├── INSTALLATION_CHECKLIST.md
├── PUBLIC_URL_SETUP.md
└── README.md
```

## 3.2 Structure du Backend

```text
backend-nest/src/
├── agents/
├── ai-scores/
├── ai_scores/
├── auth/
├── claims/
├── constats/
├── contrats/
├── damage-agent/
├── damage-analysis/
├── documents/
├── estimate/
├── migrations/
├── notifications/
├── ocr/
├── orchestrator/
├── profiles/
├── supabase/
├── users/
├── app.module.ts
└── main.ts
```

Modules cles pour le projet:

- `claims`: creation, suivi et actions sur les dossiers
- `claims-workflow.service.ts`: workflow complet de declaration
- `constats`: gestion du constat et du QR code
- `documents`: stockage et metadonnees des fichiers
- `ocr`: extraction et structuration des documents PDF
- `orchestrator`: consolidation et recommandation

## 3.3 Structure du Frontend

```text
claimsphere-frontside/src/
├── api/
├── assets/
├── components/
├── hooks/
├── layouts/
├── lib/
├── pages/
├── services/
├── test/
├── App.tsx
├── main.tsx
└── supabase-client.ts
```

Pages importantes:

- `pages/client/dashboard/ClaimsPage.tsx`
- `pages/client/dashboard/ContractsPage.tsx`
- `pages/client/dashboard/ContractRequestPage.tsx`
- `pages/client/OfferDetailPage.tsx`
- `pages/client/ConstatScanPage.tsx`
- `pages/agent/AgentDashboard.tsx`
- `pages/admin/AdminAgentsPage.tsx`

## 3.4 Organisation de la logique IA

ClaimSphere ne contient pas un dossier `ai/` unique comme dans le document modele.  
A la place, la logique IA est distribuee dans:

- `backend-nest/src/ocr/`
- `backend-nest/src/damage-analysis/`
- `backend-nest/src/damage-agent/`
- `backend-nest/src/orchestrator/`
- `backend-nest/src/ai-scores/`

---

# 4. Technologies Utilisees

## Frontend

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Radix UI
- Framer Motion
- React Query

## Backend

- NestJS
- TypeScript
- TypeORM
- PostgreSQL
- Supabase
- Multer
- Passport JWT
- Class Validator

## IA et traitement documentaire

- OpenAI API
- Tesseract OCR
- pdf-parse
- damage-analysis
- damage-agent

## Outils complementaires

- Nodemailer
- QRCode
- pdf-lib

---

# 5. Prerequis

Avant d'executer le projet, il faut disposer de:

- Node.js 18+ ou version compatible recente
- npm
- Une base PostgreSQL accessible
- Un projet Supabase configure
- Une cle OpenAI valide
- Une URL accessible pour `COLAB_DAMAGE_API_URL` si le module damage-analysis repose sur un service externe

---

# 6. Variables d'Environnement

## 6.1 Backend - `backend-nest/.env`

Variables identifiees dans [backend-nest/.env.example](C:/Users/Melek/Desktop/ppp/backend-nest/.env.example):

```env
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=
COLAB_DAMAGE_API_URL=

PUBLIC_SCAN_BASE_URL=http://localhost:8080
FRONTEND_URL=http://localhost:8080
```

Rôle des variables:

- `DB_*`: connexion PostgreSQL pour TypeORM
- `SUPABASE_URL`: URL du projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: acces serveur a Supabase
- `OPENAI_API_KEY`: utilisee par OCR et damage-agent
- `COLAB_DAMAGE_API_URL`: endpoint d'analyse des images
- `PUBLIC_SCAN_BASE_URL`: base publique pour le scan des QR codes
- `FRONTEND_URL`: URL du frontend

## 6.2 Frontend - `claimsphere-frontside/.env`

Le frontend utilise principalement:

```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Remarque importante:

Le fichier [claimsphere-frontside/.env.example](C:/Users/Melek/Desktop/ppp/claimsphere-frontside/.env.example) contient actuellement un conflit Git non resolu. Il doit etre nettoye avant livraison finale.

## 6.3 Services IA et externes

Dans l'etat actuel du projet, il n'y a pas de dossier `ai/.env` local distinct.  
Les dependances IA sont pilotees essentiellement depuis le backend via:

- `OPENAI_API_KEY`
- `COLAB_DAMAGE_API_URL`

---

# 7. Preparation Initiale des Services IA

Pour que l'analyse fonctionne correctement:

1. Verifier que `OPENAI_API_KEY` est defini
2. Verifier que `COLAB_DAMAGE_API_URL` pointe vers un service actif
3. Verifier que Supabase Storage contient le bucket attendu pour les documents
4. Verifier que les tables OCR et documents ont les bonnes colonnes

Modules concernes:

- [ocr.service.ts](C:/Users/Melek/Desktop/ppp/backend-nest/src/ocr/services/ocr.service.ts)
- [damage-agent.service.ts](C:/Users/Melek/Desktop/ppp/backend-nest/src/damage-agent/damage-agent.service.ts)
- [orchestrator.service.ts](C:/Users/Melek/Desktop/ppp/backend-nest/src/orchestrator/orchestrator.service.ts)

---

# 8. Execution avec Docker Compose

Le document modele contient une section Docker Compose.  
Dans ClaimSphere, le fichier [docker-compose.yml](C:/Users/Melek/Desktop/ppp/docker-compose.yml) est actuellement vide.

Cela signifie que:

- aucune orchestration Docker complete n'est encore prete dans le depot
- cette section peut etre gardee dans un rendu, mais doit etre mentionnee comme `non finalisee` ou `a venir`

## 8.1 Etat actuel

- Docker Compose non configure dans le depot

## 8.2 Recommandation

Pour une version finale, il faudrait ajouter:

- un service backend NestJS
- un service frontend Vite ou une version build + serveur statique
- un service PostgreSQL si non externalise
- une configuration des variables d'environnement

---

# 9. Installation et Execution en Local

## 9.1 Lancer le Backend

```bash
cd backend-nest
npm install
npm run start:dev
```

Backend disponible sur:

`http://localhost:5000`

## 9.2 Lancer le Frontend

```bash
cd claimsphere-frontside
npm install
npm run dev
```

Frontend disponible sur:

`http://localhost:8080`

Cette URL est confirmee par [vite.config.ts](C:/Users/Melek/Desktop/ppp/claimsphere-frontside/vite.config.ts).

## 9.3 Services externes necessaires

En plus du backend et du frontend, il faut s'assurer que les dependances suivantes sont operationnelles:

- base PostgreSQL
- Supabase
- OpenAI API
- service `damage-analysis` accessible via `COLAB_DAMAGE_API_URL`

## 9.4 Workflow local de test du sinistre

1. Ouvrir le frontend
2. Se connecter avec un compte client
3. Aller sur `Dashboard > Claims`
4. Cliquer sur `Declarer sinistre`
5. Saisir les donnees du dossier et du constat
6. Generer le QR code
7. Upload du PV police et des images
8. Finaliser le dossier
9. Ouvrir le dashboard agent pour analyser la recommandation

---

# 10. Demonstration et Etat d'Avancement

## 10.1 Demonstration locale

Dans l'etat actuel du projet, la demonstration la plus fiable est locale:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:5000`

## 10.2 Points forts du projet

- workflow de sinistre de bout en bout
- constat avec QR code
- OCR des documents
- orchestration metier centralisee
- dashboard agent et dashboard client
- prise en compte des pieces complementaires avec reanalyse

## 10.3 Points a mentionner dans un rendu final

- Docker Compose n'est pas encore finalise
- la configuration frontend `.env.example` doit etre nettoyee
- certaines parties IA dependent de services externes
- la qualite des resultats depend des donnees OCR, des images et des schemas de base de donnees

---

# 11. Focus Technique - Analyse d'un Sinistre

Comme c'est le coeur de ClaimSphere, cette section peut etre utile dans ton rendu.

## 11.1 Demarrage du workflow

Le workflow commence dans:

- [claims.controller.ts](C:/Users/Melek/Desktop/ppp/backend-nest/src/claims/claims.controller.ts)
- [claims-workflow.service.ts](C:/Users/Melek/Desktop/ppp/backend-nest/src/claims/claims-workflow.service.ts)

Deux etapes principales:

- `POST /api/claims/workflow/start`
- `POST /api/claims/workflow/complete`

## 11.2 Orchestration

L'analyse principale est faite dans:

- [orchestrator.service.ts](C:/Users/Melek/Desktop/ppp/backend-nest/src/orchestrator/orchestrator.service.ts)

Methodes importantes:

- `processClaimSubmission(...)`
- `orchestrateClaim(...)`
- `buildAndPersistResult(...)`
- `buildCoherenceChecks(...)`
- `buildOfferCoverageAnalysis(...)`
- `computeDecisionSupport(...)`
- `buildAgentSuggestion(...)`

## 11.3 Resultat final

Le resultat consolide est stocke dans:

- `claims.documents.consolidated_result`

Ce resultat contient:

- les donnees consolidees du claim
- les donnees OCR
- les resultats damage-analysis
- les controles de coherence
- l'analyse de couverture
- la recommandation finale pour l'agent

---

# 12. Conclusion

ClaimSphere est une plateforme complete de gestion de sinistres automobiles qui combine:

- une interface moderne pour le client et l'agent
- une architecture backend modulaire
- un stockage centralise des pieces
- des modules IA pour OCR et analyse des dommages
- un orchestrateur metier pour transformer des donnees dispersees en decision exploitable

Le projet est deja tres riche fonctionnellement et peut etre presente comme une solution intelligente d'assurance auto, avec une base technique solide et une logique metier claire.
