# SMAS Production Deployment Guide

## 1. Check Firebase Project
- Open `.env.production` and find `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.
- Go to [Firebase Console](https://console.firebase.google.com/).
- Confirm a project with this ID exists and is configured (Firestore, Auth (Spotify), Storage enabled).

## 2. Set Environment Variables
- Copy `.env.production` to Vercel dashboard (Project > Settings > Environment Variables).
- Fill in all values from your Firebase and Spotify project settings.
- Never commit secrets to git.
- For local testing, copy `.env.production` to `.env.local` and fill in values.

## 3. Deploy to Vercel
- Connect your GitHub repo to Vercel (if not already).
- Set production branch (usually `main`).
- Add your custom domain (e.g. `smas.app`) in Vercel > Domains.
- Deploy. Vercel will build and host your app automatically.
- Enable Vercel Analytics in the Vercel dashboard.

## 4. Security & Monitoring Checklist
- **Rate Limiting:** Ensure API endpoints use rate limiting (see `src/lib/rate-limiter.ts`).
- **CORS:** Restrict API routes to your production domain.
- **Input Validation:** Validate all API inputs (manual or with Zod).
- **Secure Headers:** Use Next.js headers config for security (see `next.config.ts`).
- **Firebase Rules:** Lock down Firestore/Storage rules to authenticated users.
- **Monitoring:** Use Vercel Analytics for traffic and performance.

## 5. Rollback & Troubleshooting
- To rollback, redeploy a previous commit from the Vercel dashboard.
- Check Vercel build logs for errors.
- Check Firebase Console for security rule or quota issues.
- For auth issues, verify all OAuth and Firebase variables are correct.
- For analytics, check Vercel Analytics dashboard.

---

**Reference:** See `.env.production` for all required environment variables. 