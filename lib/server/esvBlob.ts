import 'server-only';

import { get } from '@vercel/blob';
import { bibleData } from '@/lib/bibleData';

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

export async function getChapterVersesByReference(
  book: string,
  chapter: number
): Promise<Array<{ verse: number; text: string }> | null> {
  const bookData = bibleData.find(item => item.book === book);
  if (!bookData) return null;

  const chapterData = bookData.chapters[chapter - 1];
  if (!chapterData) return null;

  const verseCount = parseInt(chapterData.verses, 10);
  if (!Number.isInteger(verseCount) || verseCount < 1) return null;

  const verseMap = await getVerseMap();
  const verses: Array<{ verse: number; text: string }> = [];

  for (let verse = 1; verse <= verseCount; verse += 1) {
    const text = verseMap.get(verseKey(book, chapter, verse));
    if (!text) continue;
    verses.push({ verse, text });
  }

  return verses.length > 0 ? verses : null;
}
