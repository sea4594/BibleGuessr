import { NextResponse } from 'next/server';

import { getVerseTextByReference } from '@/lib/server/esvBlob';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const book = searchParams.get('book')?.trim();
  const chapter = Number(searchParams.get('chapter'));
  const verse = Number(searchParams.get('verse'));

  if (!book || !Number.isInteger(chapter) || chapter < 1 || !Number.isInteger(verse) || verse < 1) {
    return NextResponse.json({ error: 'Invalid book/chapter/verse query parameters.' }, { status: 400 });
  }

  try {
    const text = await getVerseTextByReference(book, chapter, verse);
    if (!text) {
      return NextResponse.json({ error: 'Verse not found.' }, { status: 404 });
    }

    return NextResponse.json(
      { book, chapter, verse, text },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load verse.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
