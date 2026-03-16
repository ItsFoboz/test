# First Stand 2026 — Tournament Picker Setup

## Prerequisites

- Node.js 18+
- A Firebase project

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** with:
   - Email/Password provider
   - Google provider
4. Enable **Firestore Database** in production mode
5. Add this Firestore security rule:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /picks/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

6. Copy your Firebase config from Project Settings → Your apps → Web app

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Firebase config:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your Firebase values.

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploying

The easiest option is [Vercel](https://vercel.com):

1. Push to GitHub
2. Import repo in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!
