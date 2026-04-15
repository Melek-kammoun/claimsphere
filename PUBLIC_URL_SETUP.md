# Configuration d'une URL Publique pour ClaimSphere

L'application fonctionne actuellement en localhost. Pour que le QR code soit accessible sur Internet (notamment depuis un téléphone mobile), il faut configurer une URL publique.

## Option 1 : ngrok (Rapide - Pour Tests)

**ngrok** expose votre localhost à Internet instantanément avec une URL publique.

### Installation et configuration

1. **Installer ngrok** :
   ```bash
   # Sur macOS
   brew install ngrok/ngrok/ngrok
   
   # Sur Linux
   curl -s https://ngrok-agent.s3.amazonaws.com/ngrok-agent-v3-stable-linux-amd64.zip -o ngrok.zip
   unzip ngrok.zip
   sudo mv ngrok /usr/local/bin/
   
   # Sur Windows
   # Télécharger depuis https://ngrok.com/download
   ```

2. **S'inscrire sur ngrok** (gratuit) :
   - Aller sur https://ngrok.com
   - Créer un compte gratuit
   - Copier votre auth token

3. **Configurer ngrok** :
   ```bash
   ngrok config add-authtoken VOTRE_AUTH_TOKEN
   ```

4. **Démarrer ngrok sur le port 8081 (frontend)** :
   ```bash
   ngrok http 8081
   ```
   
   Vous verrez une sortie comme :
   ```
   Web Interface                 http://127.0.0.1:4040
   Forwarding                    https://abc-123-def.ngrok.io -> http://localhost:8081
   ```

5. **Copier l'URL publique** (ex: `https://abc-123-def.ngrok.io`)

6. **Mettre à jour le fichier `.env` du backend** :
   ```bash
   # Dans /backend-nest/.env
   PUBLIC_SCAN_BASE_URL=https://abc-123-def.ngrok.io
   FRONTEND_URL=https://abc-123-def.ngrok.io
   ```

7. **Redémarrer le backend** :
   ```bash
   npm --prefix /home/balouma/Bureau/claimsphere/backend-nest run start:dev
   ```

8. **Tester** :
   - Ouvrir `https://abc-123-def.ngrok.io` dans le navigateur
   - Remplir le formulaire du Client 1
   - Scanner le QR code depuis un téléphone (la URL du QR sera `https://abc-123-def.ngrok.io/constats/scan/...`)

### Important avec ngrok
- L'URL change à chaque redémarrage de ngrok
- Pour une URL fixe permanent, activer l'option payante
- ngrok crée automatiquement des redirections HTTPS sécurisées

---

## Option 2 : Déployer sur Railway / Render (Permanent)

Cette option est recommandée pour la production.

### Déployer sur Railway (simple, gratuit jusqu'à 5$USD/mois)

1. **Créer un compte** sur https://railway.app

2. **Installer Railway CLI** :
   ```bash
   npm install -g @railway/cli
   ```

3. **Créer le fichier `Procfile`** à la racine du backend-nest :
   ```bash
   echo "web: npm run start:prod" > /home/balouma/Bureau/claimsphere/backend-nest/Procfile
   ```

4. **Créer `.env.production`** dans backend-nest :
   ```
   DB_HOST=aws-1-eu-central-1.pooler.supabase.com
   DB_PORT=6543
   DB_USER=postgres.raizxiwxrkgnhnlccvcx
   DB_PASSWORD=CLAIM.claim123456
   DB_NAME=postgres
   PUBLIC_SCAN_BASE_URL=https://votre-app.railway.app
   FRONTEND_URL=https://votre-frontend.vercel.app
   ```

5. **Déployer** :
   ```bash
   cd /home/balouma/Bureau/claimsphere/backend-nest
   railway login
   railway link
   railway up
   ```

### Déployer le frontend sur Vercel

1. **Créer un compte** sur https://vercel.com

2. **Déployer** :
   ```bash
   npm install -g vercel
   cd /home/balouma/Bureau/claimsphere/claimsphere-frontside
   vercel
   ```

3. **Mettre à jour l'URL publique** dans `backend-nest/.env` avec la URL Vercel

---

## Configuration des URLs dans le code

Le code utilise automatiquement les variables d'environnement :

**Backend** (`constats.controller.ts`) :
```typescript
private resolveQrBaseUrl(req: any): string {
  const envBaseUrl = process.env.PUBLIC_SCAN_BASE_URL || process.env.FRONTEND_URL;
  // Utilise PUBLIC_SCAN_BASE_URL en priorité
}
```

**Frontend** (`ClaimsPage.tsx`) :
```typescript
const scanUrl = response.scan_url || `${window.location.origin}/constats/scan/${response.constat.qr_token}`;
// Utilise la URL publique si fournie
```

---

## Checklist de vérification

- ✅ Environnement configuré avec `PUBLIC_SCAN_BASE_URL`
- ✅ Backend redémarré après changement de `.env`
- ✅ Frontend accessible via l'URL publique
- ✅ QR code scannage fonctionne depuis un mobile
- ✅ Lien dans le QR pointe vers l'URL publique (pas localhost)

---

## Dépannage

**Le QR code pointe toujours vers localhost ?**
- Vérifier que `PUBLIC_SCAN_BASE_URL` est défini dans `.env` du backend
- Vérifier que le backend a été redémarré après le changement
- Vérifier dans l'onglet Network du navigateur que l'API retourne la bonne URL

**ngrok met "insecure browser warning" ?**
- C'est normal, cliquer sur "Visit Site" pour forcer
- Cette alerte disparaît une fois la page chargée

**Erreur CORS avec ngrok ?**
- Vérifier que le backend accepte l'origine ngrok
- Ajouter à `main.ts` du backend-nest :
  ```typescript
  app.enableCors({
    origin: [
      'http://localhost:8081',
      'https://*.ngrok.io', // Accepte tous les domaines ngrok
      'https://votre-domaine.com' // Votre domaine en production
    ]
  });
  ```
