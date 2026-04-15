# Exemples d'utilisation de l'API QR Code Constats

Ce fichier contient des exemples de requêtes pour tester l'implémentation complète.

## 1️⃣ Créer un constat (User A)

### cURL

```bash
curl -X POST http://localhost:3000/constats \
  -H "Authorization: Bearer JWT_TOKEN_USER_A" \
  -H "Content-Type: application/json" \
  -d '{
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
      "vin": "VF39M8Z15...",
      "registration_date": "2020-05-15"
    },
    "insurance_a_data": {
      "company": "AXA",
      "policy_number": "POL-123456",
      "agent_name": "Agent Dupont",
      "agent_phone": "+33612345678"
    },
    "accident_details": {
      "date": "2026-04-15",
      "time": "14:30",
      "location": "Intersection Rue de la Paix et Rue de lÉglise, 75001 Paris",
      "description": "Collision frontale aux feux rouges. Autre véhicule n'a pas respecté le feu rouge.",
      "witnesses": ["Témoin 1", "Témoin 2"],
      "police_report": "Rapport N°123456"
    },
    "photos_a": [
      "https://bucket.supabase.co/documents/photos/photo1.jpg",
      "https://bucket.supabase.co/documents/photos/photo2.jpg"
    ],
    "signature_a": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

### JavaScript/Fetch

```javascript
const token = localStorage.getItem('jwt_token');

const response = await fetch('http://localhost:3000/constats', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_a_data: {
      full_name: 'Jean Dupont',
      phone: '+33612345678',
      email: 'jean@example.com',
      driving_license: '123456789'
    },
    vehicle_a_data: {
      plate: 'AB-123-CD',
      brand: 'Peugeot',
      model: '308',
      year: 2020,
      vin: 'VF39M8Z15...',
      registration_date: '2020-05-15'
    },
    insurance_a_data: {
      company: 'AXA',
      policy_number: 'POL-123456'
    },
    accident_details: {
      date: '2026-04-15',
      time: '14:30',
      location: 'Intersection Rue de la Paix',
      description: 'Collision frontale',
      witnesses: ['Témoin 1'],
      police_report: 'Rapport N°123456'
    },
    photos_a: ['https://bucket.supabase.co/photo1.jpg'],
    signature_a: 'data:image/png;base64,...'
  })
});

const { constat, qr_code } = await response.json();
console.log('Constat créé:', constat.id);
console.log('QR Code URL:', qr_code);

// Afficher le QR Code
const img = document.createElement('img');
img.src = qr_code;
document.body.appendChild(img);
```

### Réponse (201)

```json
{
  "constat": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "qr_token": "7a4b2c1e-f8d3-4e9f-b2a1-c3d5e6f7a8b9",
    "status": "en_attente",
    "user_a_data": {
      "full_name": "Jean Dupont",
      "phone": "+33612345678",
      "email": "jean@example.com"
    },
    "vehicle_a_data": {
      "plate": "AB-123-CD",
      "brand": "Peugeot",
      "model": "308"
    },
    "insurance_a_data": {
      "company": "AXA",
      "policy_number": "POL-123456"
    },
    "accident_details": {
      "date": "2026-04-15",
      "time": "14:30",
      "location": "Intersection Rue de la Paix et Rue de l'Église, 75001 Paris",
      "description": "Collision frontale aux feux rouges"
    },
    "created_at": "2026-04-15T14:30:00.000Z",
    "updated_at": "2026-04-15T14:30:00.000Z",
    "qr_expires_at": "2026-04-15T15:00:00.000Z",
    "pdf_url": null
  },
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAA..."
}
```

## 2️⃣ Scanner le QR Code (User B - PUBLIC)

### cURL

```bash
curl -X GET "http://localhost:3000/constats/scan/7a4b2c1e-f8d3-4e9f-b2a1-c3d5e6f7a8b9" \
  -H "Content-Type: application/json"
```

### JavaScript/Fetch

```javascript
const qrToken = '7a4b2c1e-f8d3-4e9f-b2a1-c3d5e6f7a8b9';

const response = await fetch(`http://localhost:3000/constats/scan/${qrToken}`);

const { constat, qr_code, ready_to_complete } = await response.json();

console.log('Constat de User A:', constat);
console.log('Prêt à compléter:', ready_to_complete);

// Afficher les informations de User A
displayConstatInfo(constat);
```

### Réponse (200)

```json
{
  "constat": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "qr_token": "7a4b2c1e-f8d3-4e9f-b2a1-c3d5e6f7a8b9",
    "status": "en_attente",
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
      "vin": "VF39M8Z15..."
    },
    "insurance_a_data": {
      "company": "AXA",
      "policy_number": "POL-123456",
      "agent_name": "Agent Dupont"
    },
    "accident_details": {
      "date": "2026-04-15",
      "time": "14:30",
      "location": "Intersection Rue de la Paix et Rue de l'Église, 75001 Paris",
      "description": "Collision frontale aux feux rouges"
    }
  },
  "qr_code": "data:image/png;base64,...",
  "ready_to_complete": true
}
```

### Erreur - Token expiré (403)

```json
{
  "statusCode": 403,
  "message": "QR Code expiré",
  "error": "Forbidden"
}
```

## 3️⃣ Compléter le constat (User B)

### cURL

```bash
curl -X POST "http://localhost:3000/constats/complete/7a4b2c1e-f8d3-4e9f-b2a1-c3d5e6f7a8b9" \
  -H "Authorization: Bearer JWT_TOKEN_USER_B" \
  -H "Content-Type: application/json" \
  -d '{
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
      "policy_number": "POL-654321",
      "agent_name": "Agent Martin"
    },
    "photos_b": [
      "https://bucket.supabase.co/documents/photos/photo3.jpg",
      "https://bucket.supabase.co/documents/photos/photo4.jpg"
    ],
    "signature_b": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

### JavaScript/Fetch

```javascript
const token = localStorage.getItem('jwt_token_user_b');
const qrToken = '7a4b2c1e-f8d3-4e9f-b2a1-c3d5e6f7a8b9';

const response = await fetch(`http://localhost:3000/constats/complete/${qrToken}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_b_data: {
      full_name: 'Marie Martin',
      phone: '+33687654321',
      email: 'marie@example.com',
      driving_license: '987654321'
    },
    vehicle_b_data: {
      plate: 'XY-456-ZA',
      brand: 'Renault',
      model: 'Clio'
    },
    insurance_b_data: {
      company: 'Allianz',
      policy_number: 'POL-654321'
    },
    photos_b: ['https://bucket.supabase.co/photo3.jpg'],
    signature_b: 'data:image/png;base64,...'
  })
});

const constat = await response.json();
console.log('Constat complété avec statut:', constat.status);
console.log('PDF disponible à:', constat.pdf_url);

// Afficher le PDF
window.open(constat.pdf_url);
```

### Réponse (200)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "qr_token": "7a4b2c1e-f8d3-4e9f-b2a1-c3d5e6f7a8b9",
  "status": "valide",
  "user_a_data": { ... },
  "user_b_data": {
    "full_name": "Marie Martin",
    "phone": "+33687654321",
    "email": "marie@example.com"
  },
  "vehicle_b_data": {
    "plate": "XY-456-ZA",
    "brand": "Renault",
    "model": "Clio"
  },
  "insurance_b_data": {
    "company": "Allianz",
    "policy_number": "POL-654321"
  },
  "pdf_url": "https://bucket.supabase.co/constats/550e8400-e29b-41d4-a716-446655440000/constat.pdf",
  "completed_at": "2026-04-15T14:35:00.000Z"
}
```

## 4️⃣ Récupérer un constat par ID

### cURL

```bash
curl -X GET "http://localhost:3000/constats/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer JWT_TOKEN"
```

### Réponse (200)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "qr_token": "7a4b2c1e-f8d3-4e9f-b2a1-c3d5e6f7a8b9",
  "status": "valide",
  "user_a_data": { ... },
  "user_b_data": { ... },
  "pdf_url": "https://...",
  "created_at": "2026-04-15T14:30:00.000Z",
  "updated_at": "2026-04-15T14:35:00.000Z"
}
```

## 5️⃣ Lister les constats de l'utilisateur

### cURL

```bash
curl -X GET "http://localhost:3000/constats" \
  -H "Authorization: Bearer JWT_TOKEN"
```

### Réponse (200)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "valide",
    "created_at": "2026-04-15T14:30:00.000Z",
    "qr_expires_at": "2026-04-15T15:00:00.000Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "status": "en_attente",
    "created_at": "2026-04-14T10:15:00.000Z",
    "qr_expires_at": "2026-04-14T10:45:00.000Z"
  }
]
```

## 6️⃣ Renvoyer le QR Code

### cURL

```bash
curl -X POST "http://localhost:3000/constats/550e8400-e29b-41d4-a716-446655440000/resend-qr" \
  -H "Authorization: Bearer JWT_TOKEN_USER_A"
```

### Réponse (200)

```json
{
  "qr_token": "9c5f1a2e-3d8b-4c6e-a9f2-b7d1e3f5a2c4",
  "qr_code": "data:image/png;base64,...",
  "expires_at": "2026-04-15T15:45:00.000Z"
}
```

## 🔴 Codes d'erreur

### 400 - Bad Request

```json
{
  "statusCode": 400,
  "message": "Format de QR token invalide",
  "error": "Bad Request"
}
```

### 403 - Forbidden

```json
{
  "statusCode": 403,
  "message": "QR Code expiré",
  "error": "Forbidden"
}
```

### 404 - Not Found

```json
{
  "statusCode": 404,
  "message": "Constat introuvable",
  "error": "Not Found"
}
```

### 401 - Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

## 📝 Notes

- Remplacer `JWT_TOKEN` par le token JWT réel
- Remplacer les URLs Supabase par vos véritables URLs
- Les signatures peuvent être des data URLs Base64 ou des URLs directes
- Le QR Code est valide pendant 30 minutes par défaut
- Une fois complété, le constat génère automatiquement un PDF
