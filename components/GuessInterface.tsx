'use client';
import { useEffect, useMemo, useState } from 'react';
import { GameModeConfig } from '@/lib/gameModes';
import VerticalDragSlider from './VerticalDragSlider';

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

  return {
    bookIdx: onlyBook,
    chapter: null as number | null,
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
    const isFirstSelection = !hasInteracted && selection.chapter === null && selection.verse === null;

    if (isFirstSelection && selectedNextBook) {
      const centeredChapter = getCenteredOneBasedIndex(selectedNextBook.chapters.length);
      const centeredChapterData = centeredChapter ? selectedNextBook.chapters[centeredChapter - 1] : null;
      const centeredVerse = centeredChapterData
        ? getCenteredOneBasedIndex(parsePositiveInt(centeredChapterData.verses))
        : null;

      setSelection({
        bookIdx: idx,
        chapter: centeredChapter,
        verse: centeredVerse,
      });
    } else {
      setSelection({
        bookIdx: idx,
        chapter: null,
        verse: null,
      });
    }

    setHasInteracted(true);
  };

  const handleChapterChange = (idx: number) => {
    const nextChapter = idx + 1;
    const nextBook = selection.bookIdx === null ? null : modeConfig.books[selection.bookIdx] ?? null;
    const nextChapterData = nextBook?.chapters[nextChapter - 1] ?? null;
    const isFirstSelection = !hasInteracted && selection.chapter === null && selection.verse === null;
    const centeredVerse = nextChapterData
      ? getCenteredOneBasedIndex(parsePositiveInt(nextChapterData.verses))
      : null;

    setSelection(prev => ({
      ...prev,
      chapter: nextChapter,
      verse: isFirstSelection ? centeredVerse : null,
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
