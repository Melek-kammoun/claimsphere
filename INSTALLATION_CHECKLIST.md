# ✅ Guide Complet d'Intégration du Flux QR Code Constats

## 📦 Fichiers générés

### Backend NestJS (`backend-nest/src/constats/`)
- ✅ `entities/constat.entity.ts` - Entité TypeORM avec tous les champs
- ✅ `dto/create-constat.dto.ts` - DTO pour créer un constat
- ✅ `dto/complete-constat.dto.ts` - DTO pour compléter un constat
- ✅ `dto/constat-response.dto.ts` - DTO pour les réponses
- ✅ `dto/scan-qrcode.dto.ts` - DTO pour le scan QR
- ✅ `services/constats.service.ts` - Service principal avec logique métier (4 phases)
- ✅ `services/qrcode.service.ts` - Génération et validation QR Code
- ✅ `services/pdf.service.ts` - Génération PDF avec pdflib
- ✅ `services/email.service.ts` - Envoi d'emails SMTP
- ✅ `constats.controller.ts` - Routes API complètes
- ✅ `constats.module.ts` - Module NestJS
- ✅ `guards/validate-qr-token.guard.ts` - Guard pour validation du token
- ✅ `constats.service.spec.ts` - Tests unitaires
- ✅ `constats.controller.spec.ts` - Tests du controller

### Configuration et Database
- ✅ `src/app.module.ts` - Mise à jour pour inclure ConstatsModule
- ✅ `.env.example` - Variables d'environnement
- ✅ `database/constats_schema.sql` - Script SQL avec RLS
- ✅ `src/migrations/CreateConstatsTable1713206400000.ts` - Migration TypeORM

### Documentation
- ✅ `CONSTAT_QR_CODE_IMPLEMENTATION.md` - Documentation complète (4 phases, architecture, sécurité)
- ✅ `CONSTAT_API_EXAMPLES.md` - Exemples de requêtes cURL et JavaScript
- ✅ `CONSTAT_FRONTEND_INTEGRATION.md` - Services React, Hooks, composants exemples

## 🚀 Étapes d'installation

### Phase 1: Installation des dépendances

```bash
cd backend-nest

# Installer les packages npm
npm install uuid qrcode nodemailer pdflib

# Installer les types TypeScript
npm install --save-dev @types/qrcode @types/nodemailer
```

**Dépendances ajoutées:**
- `uuid` v4 - Génération des tokens QR
- `qrcode` - Génération des QR Codes
- `nodemailer` - Envoi d'emails SMTP
- `pdflib` - Génération de PDF

### Phase 2: Configuration Supabase

1. **Exécuter le script SQL:**
   - Ouvrir le SQL Editor de Supabase
   - Copier le contenu de `database/constats_schema.sql`
   - Exécuter le script
   - Vérifier que la table `constats` est créée avec tous les indexes

2. **Vérifier les permissions:**
   - Les politiques RLS doivent être activées
   - Les utilisateurs authentifiés peuvent voir leurs constats
   - Le endpoint `/constats/scan/:token` doit être public

### Phase 3: Configuration des variables d'environnement

```bash
# Copier le fichier exemple
cp .env.example .env.local

# Remplir les variables requises:
```

**Variables essentielles:**

```env
# Supabase
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Depuis Settings > API Keys

# Email (Gmail exemple)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # App Password (2FA requis)
SMTP_FROM="ClaimSphere <noreply@claimsphere.com>"

# API
API_BASE_URL=http://localhost:3000  # Change en prod
JWT_SECRET=votre-secret-jwt

# Optionnel
QR_CODE_EXPIRY_MINUTES=30
PDF_TEMP_DIR=/tmp/pdf
LOG_LEVEL=debug
```

### Phase 4: Mise à jour de l'application

1. **TypeORM - Enregistrer l'entité:**
   - ✅ Déjà fait: `src/app.module.ts` includes `Constat`

2. **Vérifier l'authentification JWT:**
   ```bash
   # Vérifier que le AuthGuard('jwt') est configuré
   npm list @nestjs/passport @nestjs/jwt
   ```

3. **Importer le module:**
   ```typescript
   // Dans app.module.ts (déjà fait)
   import { ConstatsModule } from './constats/constats.module';
   
   @Module({
     imports: [
       // ...
       ConstatsModule
     ]
   })
   ```

### Phase 5: Migration de la base de données

**Deux options:**

#### Option A: TypeORM (Recommandé)

```bash
# Générer les migrations
npm run typeorm migration:generate --name CreateConstatsTable

# Exécuter les migrations
npm run typeorm migration:run
```

#### Option B: SQL Direct (Supabase)

```bash
# Juste exécuter constats_schema.sql dans le SQL Editor
```

### Phase 6: Tests locaux

```bash
# 1. Démarrer le serveur
npm run start:dev

# 2. Vérifier les logs
# Vous devriez voir: "ConstatsModule loaded"
# Et: "SupabaseModule loaded"

# 3. Tester les endpoints
npm run test -- src/constats/

# 4. E2E tests
npm run test:e2e -- constat
```

### Phase 7: Intégration Frontend

**Dans `claimsphere-frontside/`:**

```bash
# 1. Copier les fichiers de service/hook
cp ../CONSTAT_FRONTEND_INTEGRATION.md src/services/
cp ../CONSTAT_FRONTEND_INTEGRATION.md src/hooks/

# 2. Installer les dépendances (si besoin)
npm install jsqr  # Pour le scan QR code

# 3. Importer dans vos composants
import { useConstat } from '@/hooks/useConstat';
import { useQrCodeScanner } from '@/hooks/useQrCodeScanner';
```

## 🔐 Sécurité - Checklist

- [ ] JWT enabled sur tous les endpoints (sauf public `/constats/scan/:token`)
- [ ] Variables d'environnement sensibles dans `.env.local` (jamais commitées)
- [ ] CORS configuré pour domaine frontend uniquement
- [ ] RLS activé sur table `constats` dans Supabase
- [ ] Validations d'input sur toutes les DTOs
- [ ] HTTPS en production (`API_BASE_URL=https://...`)
- [ ] Rate limiting sur endpoint `/constats/scan/:token`
- [ ] Logs des actions dans `action_logs` JSONB

## 📊 Architecture complète

```
HTTP Request
    ↓
[Controller] → [Service] → [Database/Supabase]
    ↓
[Guard JWT]
    ↓
[Validate Token]
    ↓
[Business Logic]
    ↓
[Generate PDF/Email]
    ↓
HTTP Response
```

### Flux de données

```
User A Creates Constat
├── CreateConstatDto validation
├── ActiveContract check
├── Generate QR Token (UUID)
├── Create Constat (status: en_attente)
├── Generate QR Code (PNG data URL)
└── Return: { constat, qr_code }

User B Scans QR
├── Validate QR Token format
├── Get Constat by token
├── Check expiration (30 min)
├── Check status (must be pending)
└── Return: { constat, qr_code, ready_to_complete }

User B Completes
├── Validate token again
├── Check not expired
├── Check not already completed
├── Add User B data
├── Update status → "complet"
├── Trigger finalization
└── Return: updated constat

Finalization (Auto)
├── Generate PDF (pdflib)
├── Upload to Supabase Storage
├── Send emails to both parties
├── Update status → "valide"
└── Log action
```

## 🧪 Tests à effectuer

### Test 1: Création de constat

```bash
curl -X POST http://localhost:3000/constats \
  -H "Authorization: Bearer JWT_USER_A" \
  -H "Content-Type: application/json" \
  -d @request_create_constat.json

# Vérifier:
# - Status 201
# - qr_code présent
# - constat.status == "en_attente"
# - constat.qr_expires_at dans 30 min
```

### Test 2: Scan public

```bash
curl -X GET "http://localhost:3000/constats/scan/[QR_TOKEN]"

# Vérifier:
# - Status 200 (sans JWT!)
# - constat.user_a_data présent
# - ready_to_complete == true
```

### Test 3: Complétion

```bash
curl -X POST "http://localhost:3000/constats/complete/[QR_TOKEN]" \
  -H "Authorization: Bearer JWT_USER_B" \
  -H "Content-Type: application/json" \
  -d @request_complete_constat.json

# Vérifier:
# - Status 200
# - constat.status == "valide"
# - constat.user_b_data présent
# - constat.pdf_url présent
# - Email reçu ✉️
```

### Test 4: Vérifier les logs

```sql
-- Dans Supabase SQL Editor
SELECT id, status, action_logs FROM constats LIMIT 1;

-- action_logs doit contenir:
-- - constat_created
-- - qr_scanned
-- - constat_completed
-- - constat_finalized
```

## 📧 Configuration Email (Gmail)

1. **Activer 2FA sur votre compte Gmail**
2. **Générer un App Password:**
   - Aller à [Google Account Security](https://myaccount.google.com/security)
   - App passwords
   - Select Mail + Windows
   - Copier le mot de passe généré
3. **Ajouter à `.env.local`:**
   ```env
   SMTP_USER=votre-email@gmail.com
   SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx
   ```

## 🐛 Troubleshooting

### "Module not found: ConstatsModule"
```bash
# Vérifier que l'import est dans app.module.ts
# Rebuild: npm run build
```

### "QrCodeService not provided"
```bash
# Vérifier que QrCodeService est dans le providers du ConstatsModule
# Vérifier les imports dans constats.module.ts
```

### "SMTP connection failed"
```bash
# Vérifier les credentials dans .env.local
# Tester avec: npm run test -- email.service.spec.ts
# Vérifier 2FA + App Password pour Gmail
```

### "PDF génération échoue"
```bash
# Vérifier que pdflib est installé: npm list pdflib
# Vérifier les permissions du répertoire PDF_TEMP_DIR
# Vérifier que les images du QR Code sont accessibles
```

### "RLS empêche l'accès"
```sql
-- Dans Supabase, vérifier les politiques RLS:
SELECT * FROM pg_policies WHERE tablename = 'constats';

-- Vérifier que auth.uid() est disponible
-- Vérifier que les users ont les permissions requises
```

## 📈 Performance

### Indexes créés
- ✅ `idx_constats_user_a_id` - Pour récupérer les constats d'un user A
- ✅ `idx_constats_user_b_id` - Pour récupérer les constats d'un user B
- ✅ `idx_constats_qr_token` - Pour les scans QR (UNIQUE)
- ✅ `idx_constats_status` - Pour filter par status
- ✅ `idx_constats_created_at` - Pour les listes triées
- ✅ `idx_constats_qr_expires_at` - Pour cleanup des tokens expirés

### Requêtes optimisées
```typescript
// Récupérer avec index
await constatRepository.findOne({ where: { qr_token } });
await constatRepository.findOne({ where: { id } });
await constatRepository.find({ where: [{ user_a_id }, { user_b_id }] });
```

## 🔄 Workflow des phases

```
Phase 1: User A crée
├── POST /constats
├── Generate QR Token
└── Return QR Code

Phase 2: User B scanne
├── GET /constats/scan/:token (PUBLIC)
├── Voir les infos User A
└── Prêt à compléter

Phase 3: User B complète
├── POST /constats/complete/:token
├── Add User B data
└── Status → complete

Phase 4: Finalisation AUTO
├── Generate PDF
├── Upload Supabase
├── Send emails
├── Status → valid
└── Return PDF URL
```

## 📞 Support et dépannage

1. **Logs d'erreur:**
   ```bash
   # Vérifier la console du serveur
   npm run start:dev
   # Chercher ERROR ou exceptions
   ```

2. **Base de données:**
   ```sql
   -- Vérifier l'état des constats
   SELECT id, status, qr_expires_at, created_at 
   FROM constats 
   ORDER BY created_at DESC;
   ```

3. **Actions logs:**
   ```sql
   -- Vérifier l'historique des actions
   SELECT id, action_logs->0->>'action' as last_action 
   FROM constats;
   ```

## ✅ Checklist finale avant production

- [ ] Toutes les dépendances installées
- [ ] Variables d'env configurées (pas de valeurs par défaut sensibles)
- [ ] Database migrations exécutées
- [ ] Tests unitaires passent: `npm run test`
- [ ] E2E tests passent: `npm run test:e2e`
- [ ] Endpoints testés avec Postman/Thunder Client
- [ ] Frontend intégré et fonctionne
- [ ] Emails reçus lors de tests
- [ ] PDFs générés correctement
- [ ] Logs activés et formatés
- [ ] CORS configuré correctement
- [ ] HTTPS activé en production
- [ ] Backups Supabase configurés
- [ ] Monitoring/Sentry configuré
- [ ] Documentation pour équipe tech

## 🎉 Prochaines étapes

1. **Amélioration UI:** Ajouter une interface de scan QR code (caméra)
2. **SMS:** Ajouter notifications SMS au lieu d'email uniquement
3. **Signature électronique:** Intégrer une librairie de signature graphique
4. **Multi-langue:** i18n pour FR/EN/DE
5. **Webhooks:** Notifier des systèmes externes via webhooks
6. **Analytics:** Tracker le temps de complétion moyen
7. **Rappels:** Envoyer des emails de rappel si constat non complété après X heures
8. **Batch:** Permettre les constats multi-parties (>2)

---

**Créé le:** 15 avril 2026  
**Version:** 1.0.0  
**Dernière mise à jour:** 15 avril 2026
