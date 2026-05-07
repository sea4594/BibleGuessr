const useDirectPublicApi = process.env.NEXT_PUBLIC_IS_GITHUB_PAGES === 'true';

function normalizeVerseText(text: unknown): string | null {
  if (typeof text !== 'string') return null;
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length ? cleaned : null;
}

async function fetchFromLocalApi(book: string, chapter: number, verse: number): Promise<string | null> {
  const params = new URLSearchParams({
    book,
    chapter: String(chapter),
    verse: String(verse),
  });
  const res = await fetch(`/api/verse/?${params.toString()}`);
  if (!res.ok) return null;

  const data = (await res.json()) as { text?: unknown };
  return normalizeVerseText(data.text);
}

async function fetchChapterFromLocalApi(
  book: string,
  chapter: number
): Promise<Array<{ verse: number; text: string }> | null> {
  const params = new URLSearchParams({
    book,
    chapter: String(chapter),
  });
  const res = await fetch(`/api/verse/?${params.toString()}`);
  if (!res.ok) return null;

  const data = (await res.json()) as { verses?: Array<{ verse?: unknown; text?: unknown }> };
  if (!Array.isArray(data.verses)) return null;

  const verses = data.verses
    .map(item => {
      const verseNum = typeof item.verse === 'number' ? item.verse : Number(item.verse);
      const text = normalizeVerseText(item.text);
      if (!Number.isInteger(verseNum) || verseNum < 1 || !text) return null;
      return { verse: verseNum, text };
    })
    .filter((item): item is { verse: number; text: string } => item !== null);

  return verses.length ? verses : null;
}

async function fetchFromPublicApi(book: string, chapter: number, verse: number): Promise<string | null> {
  const encodedRef = encodeURIComponent(`${book} ${chapter}:${verse}`).replace(/%20/g, '+');
  const res = await fetch(`https://bible-api.com/${encodedRef}`);
  if (!res.ok) return null;

  const data = (await res.json()) as { text?: unknown };
  return normalizeVerseText(data.text);
}

export async function fetchVerseTextByReference(
  book: string,
  chapter: number,
  verse: number
): Promise<string | null> {
  try {
    if (useDirectPublicApi) {
      return await fetchFromPublicApi(book, chapter, verse);
    }

    return await fetchFromLocalApi(book, chapter, verse);
  } catch {
    return null;
  }
}

export async function fetchChapterVersesByReference(
  book: string,
  chapter: number
): Promise<Array<{ verse: number; text: string }> | null> {
  try {
    if (useDirectPublicApi) {
      return null;
    }

    return await fetchChapterFromLocalApi(book, chapter);
  } catch {
    return null;
  }
}
