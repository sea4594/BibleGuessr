import { BookData } from './bibleData';

export interface VerseReference {
  book: string;
  chapter: number;
  verse: number;
}

export function verseReferenceKey(reference: VerseReference) {
  return `${reference.book}|${reference.chapter}|${reference.verse}`;
}

export function buildVerseReferencePool(books: BookData[]): VerseReference[] {
  const pool: VerseReference[] = [];

  for (const book of books) {
    for (const chapterData of book.chapters) {
      const chapter = parseInt(chapterData.chapter, 10);
      const verseCount = parseInt(chapterData.verses, 10);
      if (!Number.isInteger(chapter) || chapter < 1 || !Number.isInteger(verseCount) || verseCount < 1) {
        continue;
      }

      for (let verse = 1; verse <= verseCount; verse += 1) {
        pool.push({
          book: book.book,
          chapter,
          verse,
        });
      }
    }
  }

  return pool;
}

function shuffleInPlace<T>(items: T[]) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
}

export function getShuffledAvailableVerseReferences(
  pool: VerseReference[],
  excludedKeys: Set<string>
): VerseReference[] {
  const available = pool.filter(reference => !excludedKeys.has(verseReferenceKey(reference)));
  shuffleInPlace(available);
  return available;
}