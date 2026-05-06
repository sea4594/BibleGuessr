import 'server-only';

import { get } from '@vercel/blob';

type VerseTuple = [book: string, chapter: number, verse: number, text: string];

interface EsvPayload {
  v: VerseTuple[];
}

const verseKey = (book: string, chapter: number, verse: number) => `${book}|${chapter}|${verse}`;

let verseMapPromise: Promise<Map<string, string>> | null = null;

async function loadVerseMap(): Promise<Map<string, string>> {
  const blobPath = process.env.ESV_BLOB_KEY;
  if (!blobPath) {
    throw new Error('Missing ESV_BLOB_KEY environment variable.');
  }

  const blob = await get(blobPath, { access: 'private' });
  if (!blob || blob.statusCode !== 200 || !blob.stream) {
    throw new Error(`Unable to load ESV blob from path: ${blobPath}`);
  }

  const payloadText = await new Response(blob.stream).text();
  const payload = JSON.parse(payloadText) as EsvPayload;

  if (!payload || !Array.isArray(payload.v)) {
    throw new Error('Invalid ESV payload format. Expected { v: [...] }.');
  }

  const map = new Map<string, string>();
  for (const row of payload.v) {
    if (!Array.isArray(row) || row.length < 4) continue;
    const [book, chapter, verse, text] = row;
    map.set(verseKey(book, chapter, verse), String(text ?? ''));
  }

  return map;
}

async function getVerseMap(): Promise<Map<string, string>> {
  if (!verseMapPromise) {
    verseMapPromise = loadVerseMap();
  }
  return verseMapPromise;
}

export async function getVerseTextByReference(book: string, chapter: number, verse: number): Promise<string | null> {
  const verseMap = await getVerseMap();
  return verseMap.get(verseKey(book, chapter, verse)) ?? null;
}
