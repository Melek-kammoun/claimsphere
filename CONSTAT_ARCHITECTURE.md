# ✨ Flux Constat Amiable Numérique - Architecture Vertuelle

## 🔄 Flux Séquentiel Complet

```
╔════════════════════════════════════════════════════════════════════════════╗
║                        CLIENT 1 (CONDUCTEUR A)                             ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  1️⃣  PAGE: /dashboard/claims                                             ║
║      └─ Bouton "Déclarer un sinistre"                                    ║
║                                                                            ║
║  2️⃣  FORMULAIRE MODAL: Constat Client 1                                  ║
║      ├─ Informations personnelles (nom, phone, email)                    ║
║      ├─ Infos véhicule (immat, marque, modèle, année)                   ║
║      ├─ Assurance (compagnie, police)                                   ║
║      └─ Accident (date, heure, lieu, description)                       ║
║                                                                            ║
║  3️⃣  ACTION: "Créer le constat"                                          ║
║      └─ POST /constats                                                   ║
║         ├─ Body: {user_a_data, vehicle_a_data, insurance_a_data, ...}  ║
║         └─ Response: {qr_code: "image", scan_url: "https://...", ...}   ║
║                                                                            ║
║  4️⃣  RÉSULTAT: QR Code généré ✅                                         ║
║      ├─ Image QR code affichée                                           ║
║      ├─ URL directe: https://app.com/constats/scan/{qr_token}           ║
║      └─ Bouton "Copier le lien"                                         ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
                                    ↓
                       Client 1 partage le QR code
                              (Par SMS/Mail)
                                    ↓
╔════════════════════════════════════════════════════════════════════════════╗
║                        CLIENT 2 (CONDUCTEUR B)                             ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  1️⃣  ACTION: Scanne le QR code                                           ║
║      └─ Avec la caméra du téléphone                                     ║
║         OU accède au lien direct                                         ║
║                                                                            ║
║  2️⃣  PAGE: /constats/scan/{qr_token}                                     ║
║      └─ GET /constats/scan/{qr_token}                                   ║
║         └─ Response: {constat, parties: [Client1Info], ready_to_complete} ║
║                                                                            ║
║  3️⃣  AFFICHAGE: Infos du Client 1                                       ║
║      ├─ Référence, état, date/heure                                     ║
║      ├─ Infos du Client 1 (nom, véhicule, assurance)                   ║
║      └─ Bouton "Masquer/Afficher"                                       ║
║                                                                            ║
║  4️⃣  FORMULAIRE: Constat Client 2                                       ║
║      ├─ Informations personnelles (nom, phone, email)                   ║
║      ├─ Infos véhicule (immat, marque, modèle, année)                  ║
║      └─ Assurance (compagnie, police)                                   ║
║                                                                            ║
║  5️⃣  ACTION: "Valider et enregistrer"                                   ║
║      └─ POST /constats/complete/{qr_token}                              ║
║         ├─ Body: {user_b_data, vehicle_b_data, insurance_b_data, ...}  ║
║         └─ Response: {constat: {..., statut: "COMPLETED"}}              ║
║                                                                            ║
║  6️⃣  RÉSULTAT: Constat enregistré ✅                                     ║
║      └─ Données en BD avec statut COMPLETED                             ║
║         ├─ Table: constats (statut = COMPLETED)                         ║
║         └─ Table: constat_parties (role A + role B)                     ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## 🗄️ Modèle de Données

### **Constat (Table)**
```sql
id: UUID
reference: STRING (CST-{timestamp})
statut: ENUM (PENDING → COMPLETED)
qr_token: UUID (unique, 30 min expiry)
qr_expires_at: TIMESTAMP
date_accident: TIMESTAMP
lieu_accident: STRING
description_accident: TEXT
metadata: JSON
action_logs: JSONB[]
created_at: TIMESTAMP
```

### **ConstatParty (Table - Relation 1:N)**
```sql
id: UUID
constat_id: UUID (FK → constats.id)
role: ENUM ('A' ou 'B')
user_id: UUID
nom: STRING
prenom: STRING
telephone: STRING
num_permis: STRING
num_assurance: STRING
compagnie_assurance: STRING
immatriculation: STRING
marque: STRING
modele: STRING
annee: INTEGER
signature: STRING (base64)
photos: JSONB[] (URLs)
rempli_le: TIMESTAMP
```

---

## 🔐 Sécurité

### **QR Token**
- ✅ UUID v4 unique
- ✅ Expiré après 30 minutes
- ✅ Stocké en BD
- ❌ PAS d'authentification requise (endpoint public)

### **Accès Publique**
- ✅ `/constats/scan/{token}` = public (GET)
- ✅ `/constats/complete/{token}` = public (POST)
- ⚠️ Protégé par token d'expiration, pas par permission d'utilisateur

### **Données en BD**
- ✅ Enregistrées en Supabase
- ✅ Traces d'action (action_logs)
- ✅ Métadonnées (IP, User-Agent)

---

## 🎯 Endpoints API

### **1. Créer un constat (Client 1)**
```
POST /constats
Headers:
  x-user-id: {uuid} // ou JWT
Content-Type: application/json

Body: {
  user_a_data: {
    full_name: "Jean Dupont",
    phone: "+212611223344",
    email: "jean@example.com"
  },
  vehicle_a_data: {
    plate: "DL-666-AA",
    brand: "Dacia",
    model: "Logan",
    year: 2023
  },
  insurance_a_data: {
    company: "ClaimSphere Assurance",
    policy_number: "POL-2026-0001"
  },
  accident_details: {
    date: "2026-04-15",
    time: "14:30",
    location: "Casablanca",
    description: "Collision arrière"
  },
  photos_a: [],
  signature_a: ""
}

Response: 201 CREATED
{
  constat: {
    id: "uuid",
    reference: "CST-1713184234000",
    statut: "PENDING",
    qr_token: "uuid",
    ...
  },
  qr_code: "data:image/png;base64,...",
  scan_url: "https://app.com/constats/scan/uuid"
}
```

### **2. Récupérer les infos du constat (Client 2 - Scan)**
```
GET /constats/scan/{qr_token}
⚠️  PUBLIC - Pas d'authentification

Response: 200 OK
{
  constat: {
    id: "uuid",
    reference: "CST-1713184234000",
    statut: "PENDING",
    date_accident: "2026-04-15T14:30:00Z",
    lieu_accident: "Casablanca",
    description_accident: "Collision arrière"
  },
  parties: [
    {
      id: "uuid",
      role: "A",
      nom: "Dupont",
      prenom: "Jean",
      immatriculation: "DL-666-AA",
      marque: "Dacia",
      modele: "Logan",
      ...
    }
  ],
  ready_to_complete: true
}
```

### **3. Compléter le constat (Client 2 - Soumettre)**
```
POST /constats/complete/{qr_token}
Headers:
  x-user-id: {uuid}
Content-Type: application/json
⚠️  PUBLIC - Pas d'authentification

Body: {
  user_b_data: {
    full_name: "Marie Martin",
    phone: "+212622334455",
    email: "marie@example.com"
  },
  vehicle_b_data: {
    plate: "AA-123-BB",
    brand: "Renault",
    model: "Clio",
    year: 2021
  },
  insurance_b_data: {
    company: "AXA",
    policy_number: "POL-2026-0002"
  },
  photos_b: [],
  signature_b: ""
}

Response: 200 OK
{
  constat: {
    id: "uuid",
    reference: "CST-1713184234000",
    statut: "COMPLETED",  // ← Changé de PENDING
    ...
  },
  parties: [
    { role: "A", ... },
    { role: "B", ... }
  ]
}
```

---

## 🚀 Déploiement & Accès

### **Environnement Local**
```bash
Frontend: http://localhost:5173/constats/scan/{token}
Backend: http://localhost:3000/constats/scan/{token}
```

### **Production**
```bash
PUBLIC_SCAN_BASE_URL=https://monapp.com
Frontend: https://monapp.com/constats/scan/{token}
Backend: https://api.monapp.com/constats/scan/{token}
```

### **Configuration**
```env
# Backend .env
PUBLIC_SCAN_BASE_URL=https://monapp.com
FRONTEND_URL=https://monapp.com
```

---

## 📊 État du Constat

```
PENDING      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  COMPLETED
  ↑                                                                    ↑
Client 1 remplit          Client 2 remplit            Constat finalisé
et crée le constat        et valide ses infos         (prêt pour traitement)
```

---

## ✅ Checklist Validation

- [x] Client 1 remplit le VRAI formulaire (pas dummy data)
- [x] QR généré APRÈS soumission (pas avant)
- [x] URL du QR est publique (pas localhost)
- [x] Client 2 peut accéder via téléphone
- [x] Client 2 voit les infos du Client 1
- [x] Client 2 remplit ses propres infos
- [x] Données enregistrées en BD avec statut COMPLETED
- [x] Trace des actions (action_logs)

---

## 🐛 Debugging

### **Vérifier le QR Token en BD**
```sql
SELECT 
  id, reference, statut, qr_token, qr_expires_at, 
  created_at
FROM constats
ORDER BY created_at DESC
LIMIT 10;
```

### **Vérifier les Parties**
```sql
SELECT 
  c.reference, p.role, p.nom, p.prenom, 
  p.marque, p.immatriculation
FROM constats c
JOIN constat_parties p ON p.constat_id = c.id
WHERE c.id = 'uuid'
ORDER BY p.role;
```

### **Vérifier les Action Logs**
```sql
SELECT 
  id, reference, action_logs
FROM constats
WHERE id = 'uuid';
```

