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
