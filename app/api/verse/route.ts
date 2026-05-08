import { NextResponse } from 'next/server';

import { getChapterVersesByReference, getVerseTextByReference } from '@/lib/server/esvBlob';

export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const book = searchParams.get('book')?.trim();
  const chapter = Number(searchParams.get('chapter'));
  const verseParam = searchParams.get('verse');
  const verse = verseParam === null ? null : Number(verseParam);

  if (!book || !Number.isInteger(chapter) || chapter < 1) {
    return NextResponse.json({ error: 'Invalid book/chapter query parameters.' }, { status: 400 });
  }

  if (verse !== null && (!Number.isInteger(verse) || verse < 1)) {
    return NextResponse.json({ error: 'Invalid verse query parameter.' }, { status: 400 });
  }

  try {
    if (verse === null) {
      const verses = await getChapterVersesByReference(book, chapter);
      if (!verses) {
        return NextResponse.json({ error: 'Chapter not found.' }, { status: 404 });
      }

      return NextResponse.json(
        { book, chapter, verses },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300',
          },
        }
      );
    }

    const text = await getVerseTextByReference(book, chapter, verse);
    if (!text) {
      return NextResponse.json({ error: 'Verse not found.' }, { status: 404 });
    }

    return NextResponse.json(
      { book, chapter, verse, text },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load verse.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
