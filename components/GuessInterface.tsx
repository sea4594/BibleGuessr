'use client';
import { useState } from 'react';
import { GameModeConfig } from '@/lib/gameModes';
import BookSlider from './BookSlider';
import ChapterVerseSlider from './ChapterVerseSlider';

interface Props {
  modeConfig: GameModeConfig;
  onSubmit: (guess: { book: string; chapter: number; verse: number }) => void;
}

export default function GuessInterface({ modeConfig, onSubmit }: Props) {
  const isSingleBook = modeConfig.isSingleBook;
  const defaultBook = modeConfig.books[0]?.book ?? '';

  const [selectedBook, setSelectedBook] = useState<string>(isSingleBook ? defaultBook : '');
  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState(1);

  const bookData = modeConfig.books.find(b => b.book === selectedBook) ?? null;
  const chaptersCount = bookData ? bookData.chapters.length : 1;
  const chapterData = bookData?.chapters.find(c => parseInt(c.chapter) === chapter);
  const versesCount = chapterData ? parseInt(chapterData.verses) : 1;

  const handleBookSelect = (book: string) => {
    setSelectedBook(book);
    setChapter(1);
    setVerse(1);
  };

  const handleChapterChange = (val: number) => {
    setChapter(val);
    setVerse(1);
  };

  const handleSubmit = () => {
    if (!isSingleBook && !selectedBook) return;
    onSubmit({ book: selectedBook || defaultBook, chapter, verse });
  };

  const canSubmit = isSingleBook ? true : !!selectedBook;

  return (
    <div className="surface-card p-4 sm:p-5 mt-5 sm:mt-6">
      <p className="eyebrow mb-3">Your Guess</p>
      <h3 className="headline-serif text-xl text-slate-100 mb-4">Choose The Location</h3>

      <div className="space-y-4">
        {!isSingleBook && (
          <BookSlider
            books={modeConfig.books}
            selectedBook={selectedBook || null}
            onSelect={handleBookSelect}
          />
        )}

        <ChapterVerseSlider
          label="Chapter"
          value={chapter}
          min={1}
          max={chaptersCount}
          disabled={!isSingleBook && !selectedBook}
          onChange={handleChapterChange}
        />

        <ChapterVerseSlider
          label="Verse"
          value={verse}
          min={1}
          max={Math.max(versesCount, 1)}
          disabled={!isSingleBook && !selectedBook}
          onChange={setVerse}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="btn-primary mt-5 w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
      >
        Submit Guess
      </button>
    </div>
  );
}
