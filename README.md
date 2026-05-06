# BibleGuessr

A GeoGuessr-style Bible verse guessing game. Read a verse and guess which book, chapter, and verse it comes from.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Game Modes

- **Full Bible** – All 66 books
- **Old Testament / New Testament** – 39 or 27 books
- **Pentateuch, Historical Books, Wisdom Literature**
- **Major / Minor Prophets**
- **The Gospels, Pauline Epistles, General Epistles, All Epistles**
- **Book Selection** – Pick a single book to focus on

## Tech Stack

- Next.js 16 (App Router) with TypeScript
- Tailwind CSS
- Bible verses served from a private Vercel Blob through a server API route

## Private ESV Setup (Vercel Blob)

1. Create a private Blob store in your Vercel project.
2. Upload your `bible_esv.json` file to that store (do not commit it to this repo).
3. Add these environment variables in Vercel Project Settings:
	- `BLOB_READ_WRITE_TOKEN`
	- `ESV_BLOB_KEY` (the blob pathname, for example `esv/bible_esv.json`)
4. Redeploy after adding env vars.

For local development, pull env vars with:

```bash
vercel env pull .env.local
```

Verse lookups are handled by:

- `GET /api/verse?book=Genesis&chapter=1&verse=1`

## Build

```bash
npm run build
```

## Firebase Setup (Party + Accounts)

To enable online party hosting/joining and cloud-synced profile data, create a `.env.local` file:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Features still work in guest mode without Firebase, but realtime party networking requires these values.
