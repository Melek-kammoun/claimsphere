# Guide d'utilisation - Flux Constat Amiable Numérique

## 📋 Vue d'ensemble du flux

Le processus est maintenant **correctement séquencé** :

```
Client 1 (Conducteur A)
  ├─ Accède à /dashboard/claims
  ├─ Clique sur "Déclarer un sinistre"
  ├─ **Remplit le formulaire avec SES VRAIES INFOS**
  └─ Soumet le formulaire → QR Code généré → URL publique affichée

        ↓

Client 2 (Conducteur B) 
  ├─ Scanne le QR Code (même avec son téléphone)
  ├─ Accède à /constats/scan/{token}
  ├─ Voit les infos du Client 1
  ├─ **Remplit le formulaire avec SES INFOS**
  └─ Valide → Données enregistrées en BD ✅
```

---

## 🚀 Étapes de test

### **Étape 1 : Client 1 crée le constat**

1. Accès à l'application → Go to `/dashboard/claims`
2. Cliquez sur **"Déclarer un sinistre"**
3. Remplissez le formulaire (vos vraies infos pour Client 1) :
   - **Informations personnelles**
     - Nom : Jean Dupont
     - Téléphone : +212611223344
     - Email : jean@example.com
   - **Véhicule**
     - Immatriculation : DL-666-AA
     - Marque : Dacia
     - Modèle : Logan
     - Année : 2023
   - **Assurance**
     - Compagnie : ClaimSphere Assurance
     - Numéro de police : POL-2026-0001
   - **Accident**
     - Date : {date du jour}
     - Heure : {heure du jour}
     - Lieu : Casablanca
     - Description : Collision à l'arrière au feu rouge

4. **Cliquez "Créer le constat"**

   ✅ Le constat est créé et **le QR Code apparaît** avec :
   - Image QR code à scanner
   - URL directe : `https://votre-domaine/constats/scan/{token}`

---

### **Étape 2 : Client 2 scanne et complète**

#### Option A : Depuis le PC (test rapide)
- Copiez l'URL directe affichée
- Ouvrez dans un nouvel onglet

#### Option B : Depuis un téléphone (production)
- Scannez le QR Code avec la caméra
- Cela ouvre l'URL dans le navigateur du téléphone

#### Sur la page ConstatScanPage :
- Vous voyez les infos du Client 1
- Remplissez **le formulaire Client 2** avec VOS infos :
  - Nom : Marie Martin
  - Téléphone : +212622334455
  - Email : marie@example.com
  - Véhicule : AA-123-BB, Renault, Clio, 2021
  - Assurance : AXA, POL-2026-0002
- Cliquez **"Valider et enregistrer"**

   ✅ Le constat est **complété et enregistré** en BD

---

## 🔧 Changements techniques implémentés

### **ClaimsPage.tsx** (Client 1)
```typescript
// AVANT : Générait QR avec données fictives
handleGenerateQrCode() → POSTait avec dummy data

// MAINTENANT : Génère QR après soumission réelle
handleSubmitClaim() 
  ├─ Récupère les données du formulaire
  ├─ POST /constats avec vraies données
  └─ Affiche QR avec URL publique
```

### **ConstatScanPage.tsx** (Client 2)
```typescript
// AVANT : Affichait juste les infos Client 1
GET /constats/scan/{token} → Affichait résumé

// MAINTENANT : Affichage + Formulaire Client 2
GET /constats/scan/{token} → Affichage
POST /constats/complete/{token} → Soumission Client 2
```

---

## 📱 Accès via téléphone

**L'URL du QR code est maintenant complètement publique :**

```
https://votre-frontend.com/constats/scan/{qr_token}
```

✅ Aucune authentification requise  
✅ Fonctionne sur n'importe quel navigateur  
✅ Accessible depuis un téléphone sans app  

---

## 🗄️ Données enregistrées en BD

### **Phase 1 (Client 1)**
```
Constat créé avec :
- user_a_data : {full_name, phone, email}
- vehicle_a_data : {plate, brand, model, year}
- insurance_a_data : {company, policy_number}
- accident_details : {date, time, location, description}
- qr_token : {uuid}
- statut : PENDING
```

### **Phase 2 (Client 2)**
```
Constat complété avec :
- user_b_data : {full_name, phone, email}
- vehicle_b_data : {plate, brand, model, year}
- insurance_b_data : {company, policy_number}
- statut : COMPLETED
```

---

## ✅ Checklist de fonctionnement

- [ ] Client 1 remplit le formulaire → Pas de données fictives
- [ ] Client 1 soumet → QR Code généré **APRÈS** soumission
- [ ] URL du QR est publique (pas localhost uniquement)
- [ ] Client 2 scanne le QR depuis le téléphone
- [ ] Client 2 voit les infos du Client 1
- [ ] Client 2 remplit le formulaire → pas pré-rempli
- [ ] Client 2 soumet → Données enregistrées en BD
- [ ] Statut passe de PENDING à COMPLETED

---

## 🐛 Troubleshooting

### QR Code ne s'affiche pas
- Vérifiez que la soumission du formulaire réussit (check toast)
- Vérifiez la console du navigateur pour les erreurs API
- Assurez-vous que `PUBLIC_SCAN_BASE_URL` ou `FRONTEND_URL` est configuré au backend

### Client 2 voit un message d'erreur à `/constats/scan/{token}`
- Vérifiez que le token est correct
- Le token pourrait être expiré (30 min par défaut)
- Vérifiez les logs du backend pour les détails

### Les données ne sont pas enregistrées en BD
- Vérifiez qu'une base de données Supabase est connectée au backend
- Vérifiez les migrations de BD
- Consultez les logs du backend pour les erreurs SQL

---

## 📝 Notes

- Les données du formulaire sont **réelles**, pas fictives
- Le QR Code est généré **après** la soumission du formulaire du Client 1
- L'URL du QR est **publique et ne nécessite pas d'auth**
- Le flux est **complètement numérique** et **sans papier** 📄➡️✨

