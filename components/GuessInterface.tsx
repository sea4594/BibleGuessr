'use client';
import { useMemo, useState } from 'react';
import { GameModeConfig } from '@/lib/gameModes';
import VerticalDragSlider from './VerticalDragSlider';

interface Props {
  modeConfig: GameModeConfig;
  onSubmit: (guess: { book: string; chapter: number; verse: number }) => void;
}

export default function GuessInterface({ modeConfig, onSubmit }: Props) {
  const defaultBook = modeConfig.books[0]?.book ?? '';
  const [bookIdx, setBookIdx] = useState(0);
  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState(1);

  const bookNames = useMemo(() => modeConfig.books.map(b => b.book), [modeConfig]);
  const selectedBook = modeConfig.books[bookIdx];

  const chaptersCount = selectedBook ? selectedBook.chapters.length : 1;
  const chapterItems = useMemo(
    () => Array.from({ length: chaptersCount }, (_, i) => String(i + 1)),
    [chaptersCount]
  );

  const chapterData = selectedBook?.chapters[chapter - 1];
  const versesCount = chapterData ? parseInt(chapterData.verses, 10) : 1;
  const verseItems = useMemo(
    () => Array.from({ length: versesCount }, (_, i) => String(i + 1)),
    [versesCount]
  );

  const handleBookChange = (idx: number) => {
    setBookIdx(idx);
    setChapter(1);
    setVerse(1);
  };

  const handleChapterChange = (idx: number) => {
    setChapter(idx + 1);
    setVerse(1);
  };

  const handleVerseChange = (idx: number) => {
    setVerse(idx + 1);
  };

  const handleSubmit = () => {
    onSubmit({
      book: selectedBook?.book ?? defaultBook,
      chapter,
      verse,
    });
  };

  return (
    <div className="guess-interface">
      <div className="sliders-row">
        <VerticalDragSlider
          label="Book"
          items={bookNames}
          selectedIndex={bookIdx}
          onChange={handleBookChange}
          listMode
        />
        <VerticalDragSlider
          label="Chapter"
          items={chapterItems}
          selectedIndex={chapter - 1}
          onChange={handleChapterChange}
          disabled={!defaultBook}
        />
        <VerticalDragSlider
          label="Verse"
          items={verseItems}
          selectedIndex={verse - 1}
          onChange={handleVerseChange}
          disabled={!defaultBook}
        />
      </div>

      <button
        onClick={handleSubmit}
        className="btn-primary w-full py-2.5 mt-2"
      >
        Submit Guess
      </button>
    </div>
  );
}
