# Implémentation du Flux QR Code pour Constats

## 📋 Vue d'ensemble

Ce document décrit l'implémentation complète d'un flux de gestion de constats d'accident entre deux utilisateurs utilisant un code QR pour la liaison.

### Architecture

```
Phase 1: Création par Client A
├── Vérifier le contrat actif
├── Créer le constat avec statut "en_attente"
├── Générer QR token (UUID)
├── Générer QR Code
└── Retourner QR Code

Phase 2: Scan du QR Code par Client B
├── Valider le token
├── Vérifier l'expiration (30 min)
└── Récupérer les données de Client A

Phase 3: Complétion par Client B
├── Valider le token
├── Vérifier l'expiration
├── Ajouter données Client B
├── Mettre à jour le statut → "complet"
└── Déclencher la finalisation

Phase 4: Finalisation
├── Générer PDF avec signatures
├── Uploader le PDF à Supabase
├── Envoyer les emails avec PDF
└── Mettre à jour le statut → "valide"
```

## 🗄️ Schéma de données

### Table `constats`

```sql
- id: UUID (primaire)
- user_a_id: UUID (créateur)
- user_b_id: UUID (répondant, nullable)
- qr_token: VARCHAR unique (pour linking)
- qr_expires_at: TIMESTAMP (30 min après création)
- status: ENUM (en_attente, complet, valide, rejete)
- user_a_data: JSONB (nom, téléphone, email, permis)
- vehicle_a_data: JSONB (immatriculation, marque, modèle)
- insurance_a_data: JSONB (assurance, contrat)
- photos_a: TEXT[] (URLs des photos)
- signature_a: TEXT (Base64 ou URL)
- [même structure pour user_b_*]
- accident_details: JSONB (date, lieu, description, témoins)
- pdf_url: TEXT (URL du PDF généré)
- action_logs: JSONB[] (historique des actions)
```

## 🚀 Installation et Configuration

### 1. Installer les dépendances

```bash
cd backend-nest
npm install uuid qrcode nodemailer pdflib
npm install --save-dev @types/qrcode @types/nodemailer
```

### 2. Configuration Supabase

Exécuter le script SQL dans le SQL Editor de Supabase:

```bash
# Ouvrir /database/constats_schema.sql et l'exécuter dans Supabase
```

### 3. Configurer les variables d'environnement

Copier `.env.example` vers `.env` et remplir:

```bash
cp .env.example .env.local
```

Remplir les variables:
- `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`
- Configuration SMTP pour emails
- `API_BASE_URL` pour les QR Codes

### 4. Vérifier l'authentification JWT

Le projet doit avoir un guard JWT en place:

```typescript
@UseGuards(AuthGuard('jwt'))
```

## 📡 API Endpoints

### 1. Créer un constat (User A)

**POST** `/constats`
- **Auth**: Required (JWT)
- **Body**:

```json
{
  "user_a_data": {
    "full_name": "Jean Dupont",
    "phone": "+33612345678",
    "email": "jean@example.com",
    "driving_license": "123456789"
  },
  "vehicle_a_data": {
    "plate": "AB-123-CD",
    "brand": "Peugeot",
    "model": "308",
    "year": 2020,
    "vin": "VF39...",
    "registration_date": "2020-05-15"
  },
  "insurance_a_data": {
    "company": "AXA",
    "policy_number": "POL-123456",
    "agent_name": "Agent Name",
    "agent_phone": "+33612345678"
  },
  "accident_details": {
    "date": "2026-04-15",
    "time": "14:30",
    "location": "Intersection Rue de la Paix et Rue de l'Église, Paris",
    "description": "Collision frontale aux feux rouges",
    "witnesses": ["Témoin 1", "Témoin 2"],
    "police_report": "Rapport N°123456"
  },
  "photos_a": [
    "https://bucket.supabase.co/photo1.jpg",
    "https://bucket.supabase.co/photo2.jpg"
  ],
  "signature_a": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

- **Response** (201):

```json
{
  "constat": {
    "id": "uuid-123",
    "qr_token": "uuid-456",
    "status": "en_attente",
    "created_at": "2026-04-15T14:30:00Z",
    "qr_expires_at": "2026-04-15T15:00:00Z"
  },
  "qr_code": "data:image/png;base64,iVBORw0KGgo..."
}
```

### 2. Scanner le QR Code (User B - Public)

**GET** `/constats/scan/:token`
- **Auth**: Not required
- **Params**: `token` = QR token (UUID)

- **Response** (200):

```json
{
  "constat": {
    "id": "uuid-123",
    "user_a_data": { ... },
    "vehicle_a_data": { ... },
    "insurance_a_data": { ... },
    "accident_details": { ... }
  },
  "qr_code": "data:image/png;base64,..."
}
```

- **Errors**:
  - `400` - Token invalide ou expiré
  - `403` - Constat déjà complété

### 3. Compléter le constat (User B)

**POST** `/constats/complete/:token`
- **Auth**: Required (JWT)
- **Params**: `token` = QR token (UUID)
- **Body**:

```json
{
  "user_b_data": {
    "full_name": "Marie Martin",
    "phone": "+33687654321",
    "email": "marie@example.com",
    "driving_license": "987654321"
  },
  "vehicle_b_data": {
    "plate": "XY-456-ZA",
    "brand": "Renault",
    "model": "Clio",
    "year": 2021,
    "vin": "VF1JF8Z..."
  },
  "insurance_b_data": {
    "company": "Allianz",
    "policy_number": "POL-654321"
  },
  "photos_b": ["https://bucket.supabase.co/photo3.jpg"],
  "signature_b": "data:image/png;base64,..."
}
```

- **Response** (200):

```json
{
  "id": "uuid-123",
  "status": "complet",
  "user_a_data": { ... },
  "user_b_data": { ... },
  "pdf_url": "https://bucket.supabase.co/constats/uuid-123/final.pdf",
  "updated_at": "2026-04-15T15:00:00Z"
}
```

**Après complétion**:
- PDF généré automatiquement
- Emails envoyés aux deux parties
- Status changé à `valide`

### 4. Récupérer un constat

**GET** `/constats/:id`
- **Auth**: Required (JWT)
- **Response**: Constat complet (si l'utilisateur a accès)

### 5. Lister les constats de l'utilisateur

**GET** `/constats`
- **Auth**: Required (JWT)
- **Response**: Array de constats (créés ou répondus)

### 6. Renvoyer le QR Code

**POST** `/constats/:id/resend-qr`
- **Auth**: Required (JWT)
- **Response**:

```json
{
  "qr_token": "new-uuid-token",
  "qr_code": "data:image/png;base64,...",
  "expires_at": "2026-04-15T15:30:00Z"
}
```

## 🔒 Sécurité

### Authentification

- ✅ Tous les endpoints (sauf scan QR) requièrent JWT
- ✅ Token JWT avec expiration
- ✅ Validation des permissions (User A vs User B)

### Validation des données

- ✅ Guard `ValidateQrTokenGuard` pour validation du token
- ✅ Vérification de l'expiration (30 minutes)
- ✅ Vérification du statut du constat
- ✅ Vérification que User A ≠ User B

### Row Level Security (RLS)

Les politiques Supabase limitent l'accès:

```sql
-- Users can only see their own constats
SELECT → user_a_id = auth.uid() OR user_b_id = auth.uid()

-- Users can only update their own constats
UPDATE → user_a_id = auth.uid() OR user_b_id = auth.uid()
```

### Logging

Toutes les actions sont loggées dans `action_logs`:

```json
{
  "action": "constat_created|qr_scanned|constat_completed|constat_finalized",
  "user_id": "uuid-user",
  "timestamp": "2026-04-15T14:30:00Z",
  "details": { ... }
}
```

## 📧 Email

### Configuration SMTP

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-password (not regular password)
```

### Emails envoyés

1. **À la finalisation**:
   - Email à User A avec PDF attaché
   - Email à User B avec PDF attaché
   - Sujet: "Constat d'accident [UUID] - À consulter"

2. **Format**: HTML avec template formaté

## 📄 PDF Generation

### Contenu du PDF

- ✅ Numéro et date du constat
- ✅ Informations User A
  - Nom, téléphone, permis
  - Véhicule (marque, modèle, immatriculation, VIN)
  - Assurance (compagnie, numéro de contrat)
- ✅ Informations User B (même structure)
- ✅ Circonstances de l'accident
  - Lieu, date, heure
  - Description, témoins
- ✅ QR Code pour accès futur
- ✅ Zones de signature

### Librairie: pdflib

Installé avec `npm install pdflib`

Exemple d'utilisation dans `PdfService`:

```typescript
const pdfDoc = await PDFDocument.create();
const page = pdfDoc.addPage([595, 842]); // A4
// ... remplir le PDF
const pdfBytes = await pdfDoc.save();
```

## 🗂️ Structure des fichiers

```
src/constats/
├── entities/
│   └── constat.entity.ts (entité TypeORM)
├── dto/
│   ├── create-constat.dto.ts
│   ├── complete-constat.dto.ts
│   └── constat-response.dto.ts
├── services/
│   ├── constats.service.ts (logique métier)
│   ├── qrcode.service.ts (génération QR)
│   ├── pdf.service.ts (génération PDF)
│   └── email.service.ts (envoi d'emails)
├── guards/
│   └── validate-qr-token.guard.ts
├── constats.controller.ts (routes API)
└── constats.module.ts (module NestJS)
```

## ✅ Checklist d'intégration

- [ ] Installer les dépendances npm
- [ ] Exécuter le schéma SQL dans Supabase
- [ ] Copier `.env.example` vers `.env.local`
- [ ] Configurer les variables d'environnement (Supabase, SMTP, etc)
- [ ] Vérifier que Jest/Passport/JWT sont configurés
- [ ] Tester les endpoints avec Postman/Thunder Client
- [ ] Vérifier les logs dans la base de données
- [ ] Configurer les règles CORS si frontend externe

## 🧪 Tests

### Unit Tests

```bash
npm run test -- src/constats/services/constats.service.spec.ts
```

### E2E Tests

```bash
npm run test:e2e -- constat
```

### Endpoints à tester

1. **POST /constats** - Créer constat
2. **GET /constats/scan/:token** - Scanner QR
3. **POST /constats/complete/:token** - Compléter
4. **GET /constats/:id** - Consulter
5. **GET /constats** - Lister
6. **POST /constats/:id/resend-qr** - Renvoyer QR

## 🐛 Troubleshooting

### Le QR Code ne se génère pas

```typescript
// Vérifier que qrcode est installé
npm list qrcode

// Importer correctement
import * as QRCode from 'qrcode';
```

### Les emails ne sont pas envoyés

```typescript
// Vérifier les variables SMTP dans .env
console.log(process.env.SMTP_HOST); // doit être défini

// Vérifier les logs
logger.log("Email sent to...");
```

### Token QR arrive à expiration trop vite

```typescript
// Dans constats.service.ts
private readonly QR_CODE_EXPIRY_MINUTES = 30; // Modifier si besoin
```

## 📚 Ressources

- [pdflib Documentation](https://pdfkit.org/)
- [QRCode Documentation](https://davidshimjs.github.io/qrcodejs/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [TypeORM Relations](https://typeorm.io/relations)

## 📞 Support

Pour toute question ou problème:
1. Vérifier les logs d'erreur
2. Consulter les action_logs du constat
3. Vérifier les configurations d'environment
4. Tester avec Postman avant le frontend
