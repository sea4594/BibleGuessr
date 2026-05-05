# BibleGuessr

A GeoGuessr-style Bible verse guessing game. Read a verse from the KJV Bible and guess which book, chapter, and verse it comes from.

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
- Bible verses fetched from [bible-api.com](https://bible-api.com)

## Build

```bash
npm run build
```
