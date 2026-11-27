# MCA Batch Hub

Mock-first Progressive Web App prototype for an MCA class.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 and sign in with any email. Use `cr@batch.test` for the CR account. Pick an unused roll number from 01–24.

## Timetable

The app is synced to the classwise timetable for **MCA-AIML-DS-I-B**, session 2026–27:

- Monday–Friday classes run 09:00–13:00 and 14:00–16:00
- Saturday classes run 09:00–11:00
- College time is interpreted in `Asia/Kolkata`
- Home shows today’s schedule, the current slot, and the next class
- The CR roll-call subject auto-selects from the live timetable slot
- A timetable slot can only be marked once per college day
- **AI for Everyone** and **Advanced Computer Systems and Architecture** are taught by **Ms. Shraddha Advait**
- The CR can edit any day’s subject, faculty, room, or break flag from **CR → Edit timetable**; changes are stored locally and apply to Home, roll call, and AI Tutor immediately
- **Reset day** restores one day, **Restore original timetable** restores all six

Timetable source: `src/data/timetable.ts`; CR overrides live in `db.timetable`.

## Broadcasts

- Urgent broadcasts take over the screen until acknowledged; acknowledged alerts never reappear for that student.
- New broadcasts are automatically marked as read for the CR who sent them, so the CR is not interrupted by their own alert.
- **CR → Broadcast manager** lists every broadcast with its live/removed state and read count.
- The CR can **Keep only this**, **Remove**, **Restore**, **Delete**, or **Remove all live broadcasts**. Removed alerts stop appearing for the whole batch until restored.

## AI tutor

- The deployed app uses **Groq** with the `openai/gpt-oss-20b` model through the `aiTutor` Cloud Function.
- The `GROQ_API_KEY` is stored as a Firebase Functions secret and is never exposed to the browser.
- There is **no 20/day app-level cap**. Groq's own free-tier limits currently allow roughly 30 requests/minute and 1,000 requests/day, so only extreme bulk use will hit a provider rate limit.
- When Firebase Auth is configured and a user is signed in, `askAI` calls the Cloud Function. The mock-first local demo falls back to instant templates.
- For **real Groq answers during local development**, copy `.env.example` to `.env.local`, set `GROQ_API_KEY=...`, and restart `npm run dev`. Vite runs a dev-only server middleware at `/api/ai-tutor`, so the key is never exposed to the browser.

## What is mocked

- Firebase Auth, Firestore and FCM are represented by a localStorage-backed service layer in the local demo.
- Data persists in the browser under `mca-batch-hub-v1`.
- Offline AI responses are generated locally with realistic templates.
- The Firebase Cloud Function source is in `functions/index.ts` and is ready for a real Groq key.

## Going live

1. Create a Firebase project and enable Auth, Firestore, Messaging and Functions.
2. Copy `.env.example` to `.env.local` and fill the Firebase web config and VAPID key.
3. Set the server-only Groq secret: `firebase functions:secrets:set GROQ_API_KEY`.
4. Replace the placeholder FCM config in `public/firebase-messaging-sw.js`.
5. Deploy `firestore.rules` and `functions/index.ts`.

## Notes

- Polls and grievances are anonymous in the UI. UIDs are stored only to prevent duplicate votes/upvotes.
- Animations respect `prefers-reduced-motion`.
- The app is constrained to a centered mobile container and is installable via Add to Home Screen.
