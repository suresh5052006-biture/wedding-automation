Firebase Deploy workflow

This repository includes a GitHub Actions workflow at .github/workflows/firebase-deploy.yml that builds the frontend and Cloud Functions and deploys them to Firebase Hosting and Functions.

Required repository secrets (Settings → Secrets & variables → Actions):

- FIREBASE_TOKEN (Required): CI token from `firebase login:ci`. Create it locally and add it as a secret so the Action can authenticate to Firebase.
- FIREBASE_PROJECT (Optional): The Firebase project ID to target. If omitted, the default in firebase.json is used.

How to create a FIREBASE_TOKEN locally:

1. Install Firebase CLI and log in: `npm install -g firebase-tools` then `firebase login`.
2. Create a CI token: `firebase login:ci` — it prints a token string.
3. Add that token to your GitHub repository secrets as `FIREBASE_TOKEN`.

Notes:
- The workflow triggers on pull_request to the main branch (changeable in .github/workflows/firebase-deploy.yml).
- Ensure the functions build (TypeScript) produces lib/index.js. The workflow runs `npm ci` and `npm run build` in the functions/ directory.
- If you prefer to trigger on push to main instead, update the workflow's `on:` section accordingly.
