'use client';
import { useEffect, useMemo, useState } from 'react';
import { GameModeConfig, getBookCategory, type BookCategory } from '@/lib/gameModes';
import VerticalDragSlider from './VerticalDragSlider';


const BOOK_CATEGORY_COLORS: Record<Exclude<BookCategory, 'Unknown'>, { background: string; text: string }> = {
  'Pentateuch': { background: '#6D28D9', text: '#FFFFFF' },
  'Historical': { background: '#1D4ED8', text: '#FFFFFF' },
  'Wisdom': { background: '#0E7490', text: '#FFFFFF' },
  'Major Prophets': { background: '#047857', text: '#FFFFFF' },
  'Minor Prophets': { background: '#4D7C0F', text: '#FFFFFF' },
  'Gospels': { background: '#A16207', text: '#FFFFFF' },
  'Acts': { background: '#C2410C', text: '#FFFFFF' },
  'Pauline Epistles': { background: '#B91C1C', text: '#FFFFFF' },
  'General Epistles': { background: '#BE185D', text: '#FFFFFF' },
  'Apocalypse': { background: '#374151', text: '#FFFFFF' },
};

interface Props {
  modeConfig: GameModeConfig;
  onSubmit: (guess: { book: string; chapter: number; verse: number }) => void;
  onSelectionChange?: (selection: {
    guess: { book: string; chapter: number; verse: number } | null;
    hasInteracted: boolean;
  }) => void;
}

function getInitialSelection(modeConfig: GameModeConfig) {
  const onlyBook = modeConfig.books.length === 1 ? 0 : null;
  const initialBook = onlyBook === null ? null : modeConfig.books[onlyBook] ?? null;
  const initialChapter = initialBook && initialBook.chapters.length === 1 ? 1 : null;

  return {
    bookIdx: onlyBook,
    chapter: initialChapter,
    verse: null as number | null,
  };
}

function getCenteredOneBasedIndex(totalCount: number) {
  if (totalCount <= 0) return null;
  return Math.floor((totalCount + 1) / 2);
}

function parsePositiveInt(value: string | undefined) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default function GuessInterface({ modeConfig, onSubmit, onSelectionChange }: Props) {
  const [selection, setSelection] = useState(() => getInitialSelection(modeConfig));
  const [hasInteracted, setHasInteracted] = useState(false);

  const bookNames = useMemo(() => modeConfig.books.map(b => b.book), [modeConfig]);
  const bookCategoryColors = useMemo(() => {
    const categories = modeConfig.books.map(book => getBookCategory(book.book));
    const knownCategories = categories.filter((category): category is Exclude<BookCategory, 'Unknown'> => category !== 'Unknown');
    if (new Set(knownCategories).size <= 1) return undefined;
    return categories.map(category => category === 'Unknown' ? null : BOOK_CATEGORY_COLORS[category]);
  }, [modeConfig.books]);
  const selectedBook = selection.bookIdx === null ? null : modeConfig.books[selection.bookIdx] ?? null;

  const chaptersCount = selectedBook ? selectedBook.chapters.length : 0;
  const chapterItems = useMemo(
    () => Array.from({ length: chaptersCount }, (_, i) => String(i + 1)),
    [chaptersCount]
  );

  const chapterData = selectedBook && selection.chapter ? selectedBook.chapters[selection.chapter - 1] : null;
  const versesCount = chapterData ? parseInt(chapterData.verses, 10) : 0;
  const verseItems = useMemo(
    () => Array.from({ length: versesCount }, (_, i) => String(i + 1)),
    [versesCount]
  );

  const resolvedGuess = useMemo(() => (
    selectedBook && selection.chapter && selection.verse
      ? {
        book: selectedBook.book,
        chapter: selection.chapter,
        verse: selection.verse,
      }
      : null
  ), [selectedBook, selection.chapter, selection.verse]);

  useEffect(() => {
    onSelectionChange?.({
      guess: resolvedGuess,
      hasInteracted,
    });
  }, [hasInteracted, onSelectionChange, resolvedGuess]);

  const handleBookChange = (idx: number) => {
    const selectedNextBook = modeConfig.books[idx] ?? null;
    const centeredChapter = selectedNextBook
      ? getCenteredOneBasedIndex(selectedNextBook.chapters.length)
      : null;
    const centeredChapterData = selectedNextBook && centeredChapter
      ? selectedNextBook.chapters[centeredChapter - 1]
      : null;
    const centeredVerse = centeredChapterData
      ? getCenteredOneBasedIndex(parsePositiveInt(centeredChapterData.verses))
      : null;

    setSelection({
      bookIdx: idx,
      chapter: centeredChapter,
      verse: centeredVerse,
    });

    setHasInteracted(true);
  };

  const handleChapterChange = (idx: number) => {
    const nextChapter = idx + 1;
    const nextBook = selection.bookIdx === null ? null : modeConfig.books[selection.bookIdx] ?? null;
    const nextChapterData = nextBook?.chapters[nextChapter - 1] ?? null;
    const centeredVerse = nextChapterData
      ? getCenteredOneBasedIndex(parsePositiveInt(nextChapterData.verses))
      : null;

    setSelection(prev => ({
      ...prev,
      chapter: nextChapter,
      verse: centeredVerse,
    }));
    setHasInteracted(true);
  };

  const handleVerseChange = (idx: number) => {
    setSelection(prev => ({
      ...prev,
      verse: idx + 1,
    }));
    setHasInteracted(true);
  };

  const handleSubmit = () => {
    if (!resolvedGuess) return;
    onSubmit(resolvedGuess);
  };

  return (
    <div className="guess-interface">
      <div className="sliders-row">
        <VerticalDragSlider
          label="Book"
          items={bookNames}
          selectedIndex={selection.bookIdx}
          onChange={handleBookChange}
          disabled={bookNames.length <= 1}
          itemColors={bookCategoryColors}
        />
        <VerticalDragSlider
          label="Chapter"
          items={chapterItems}
          selectedIndex={selection.chapter === null ? null : selection.chapter - 1}
          onChange={handleChapterChange}
          disabled={!selectedBook}
        />
        <VerticalDragSlider
          label="Verse"
          items={verseItems}
          selectedIndex={selection.verse === null ? null : selection.verse - 1}
          onChange={handleVerseChange}
          disabled={!selectedBook || !selection.chapter}
        />
      </div>

      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={handleSubmit}
          disabled={!resolvedGuess}
          className="btn-primary flex-1 py-2.5"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
