const useDirectPublicApi = process.env.NEXT_PUBLIC_IS_GITHUB_PAGES === 'true';
const publicBasePath = useDirectPublicApi ? '/BibleGuessr' : '';
const offlineBibleUrl = `${publicBasePath}/offline-bible/web.json`;

type OfflineBible = {
  books?: Record<string, Array<Array<string | null>>>;
};

let offlineBiblePromise: Promise<OfflineBible | null> | null = null;

function normalizeVerseText(text: unknown): string | null {
  if (typeof text !== 'string') return null;
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length ? cleaned : null;
}

async function loadOfflineBible(): Promise<OfflineBible | null> {
  if (!offlineBiblePromise) {
    offlineBiblePromise = fetch(offlineBibleUrl, { cache: 'force-cache' })
      .then(async response => {
        if (!response.ok) return null;
        return (await response.json()) as OfflineBible;
      })
      .catch(() => null);
  }
  return offlineBiblePromise;
}

async function fetchOfflineVerse(book: string, chapter: number, verse: number): Promise<string | null> {
  const bible = await loadOfflineBible();
  return normalizeVerseText(bible?.books?.[book]?.[chapter - 1]?.[verse - 1]);
}

async function fetchOfflineChapter(
  book: string,
  chapter: number
): Promise<Array<{ verse: number; text: string }> | null> {
  const bible = await loadOfflineBible();
  const chapterVerses = bible?.books?.[book]?.[chapter - 1];
  if (!Array.isArray(chapterVerses)) return null;

  const verses = chapterVerses
    .map((text, index) => {
      const normalized = normalizeVerseText(text);
      return normalized ? { verse: index + 1, text: normalized } : null;
    })
    .filter((item): item is { verse: number; text: string } => item !== null);

  return verses.length ? verses : null;
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
  if (useDirectPublicApi) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return fetchOfflineVerse(book, chapter, verse);
    }

    try {
      const onlineText = await fetchFromPublicApi(book, chapter, verse);
      if (onlineText) return onlineText;
    } catch {
      // Fall through to the bundled WEB copy when the network/API is unavailable.
    }

    return fetchOfflineVerse(book, chapter, verse);
  }

  try {
    return await fetchFromLocalApi(book, chapter, verse);
  } catch {
    return null;
  }
}

export async function fetchChapterVersesByReference(
  book: string,
  chapter: number
): Promise<Array<{ verse: number; text: string }> | null> {
  if (useDirectPublicApi) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return fetchOfflineChapter(book, chapter);
    }
    return null;
  }

  try {
    return await fetchChapterFromLocalApi(book, chapter);
  } catch {
    return null;
  }
}
