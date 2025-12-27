# Quick Deployment Guide - All or Nothing PWA

## 🔥 Firebase Setup (Required for Multiplayer)

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Realtime Database** (NOT Firestore)
4. Choose a region and start in **test mode** initially

### 2. Configure Firebase in App
Copy `scripts/firebase-config.sample.js` to `scripts/firebase-config.js`:

```js
window.firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**Note:** These are public client keys - safe to commit and deploy.

### 3. Deploy Firebase RTDB Rules

Security rules restrict writes to room-scoped paths. Deploy via:

**Option A - Firebase CLI (Recommended):**
```bash
npm i -g firebase-tools
firebase login
firebase init database  # Select your project, use firebase-rules.sample.json
firebase deploy --only database
```

**Option B - Console:**
1. Go to Firebase Console → Realtime Database → Rules
2. Copy contents of `firebase-rules.sample.json` and paste
3. Click "Publish"

### 4. Free Tier Limits

Firebase Spark (free) plan includes:
- 1GB storage
- 10GB/month downloads
- 100 simultaneous connections

This is plenty for casual play. The app auto-prunes chat (50 messages max) and cleans up finished rooms to minimize storage.

---

## 🎮 Real-Time Multiplayer with Firebase RTDB

The app uses Firebase Realtime Database for:
- **Room creation/joining** - 6-character room codes
- **Game state sync** - Dice rolls, chips, turns, win detection
- **Real-time chat** - Instant messaging with throttling
- **Presence** - Shows when opponent disconnects

Legacy PeerJS code remains but is bypassed by the Firebase layer.

---

## Deployment Options

### Option 1: GitHub Pages (Easiest - 2 minutes)
1. Push your code to GitHub (including `firebase-config.js`)
2. Go to repository Settings → Pages
3. Set source to "main" branch (or "gh-pages")
4. Your app will be live at: `https://<username>.github.io/<repo-name>`

**Note:** GitHub Pages serves static files. Firebase handles all real-time functionality.

### Option 2: Netlify (Super Easy - 3 minutes)
1. Go to [netlify.com](https://netlify.com)
2. Drag & drop your project folder
3. Your app is live instantly!
4. Get a custom URL or use the provided netlify URL

### Option 3: Vercel (Professional - 3 minutes)
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Deploy with one click
4. Automatic HTTPS and custom domains

---

## How to Play with Your Cofounder

### Step 1: You (Host) Create a Room
1. Open the deployed app
2. Click "New Game"
3. Enter your name
4. Click "Generate Room"
5. Click "📋 Copy Link" button

### Step 2: Share with Your Cofounder
Send the copied link via Slack, Email, Text, etc.

### Step 3: Cofounder Joins
1. They click the link
2. They enter their name
3. Click "Start Game"
4. You're playing together in real-time!

---

## Testing Locally First

Before deploying, test it works:

```bash
npm start
```

Then open: `http://localhost:8080`

### Run Automated Tests
```bash
# Unit tests
npm test

# E2E tests (requires Playwright)
npx playwright install chromium
npm run test:e2e
```

---

## Data & Cost Management

### Auto-Cleanup
- Chat is pruned to last 50 messages per room
- Closed rooms should be manually deleted periodically

### Manual Cleanup Script (Optional)
You can periodically clean up old rooms via Firebase Console or a scheduled function:
- Delete rooms where `metadata.status === 'finished'` and `metadata.createdAt` < 24 hours ago

### Monitoring
- Firebase Console → Realtime Database → Usage tab
- Set up budget alerts in Google Cloud Console

## Troubleshooting

**"Copy Link" button doesn't work:**
- Some browsers block clipboard access
- Just copy the URL from the browser address bar

**Room code doesn't appear:**
- Make sure you clicked "Generate Room" first
- Check that the URL has `?room=XXXXXX` in it

**Want a shorter URL?**
- Use a URL shortener (bit.ly, tinyurl.com)
- Create a custom domain on Netlify/Vercel

## Quick Deployment Commands

```bash
# If using GitHub Pages
git add .
git commit -m "Ready for deployment"
git push origin main

# If using Netlify CLI
npm install -g netlify-cli
netlify deploy --prod

# If using Vercel CLI
npm install -g vercel
vercel --prod
```

---

**Ready to deploy!** Choose any option above and you'll be playing with your cofounder in minutes. 🎲
