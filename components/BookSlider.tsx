'use client';
import { BookData } from '@/lib/bibleData';

interface Props {
  books: BookData[];
  selectedBook: string | null;
  onSelect: (book: string) => void;
}

export default function BookSlider({ books, selectedBook, onSelect }: Props) {
  const selectedIdx = Math.max(0, books.findIndex(b => b.book === selectedBook));
  const selectedName = books[selectedIdx]?.book ?? 'Select';
  const firstName = books[0]?.book ?? 'First';
  const lastName = books[books.length - 1]?.book ?? 'Last';

  const moveBy = (delta: number) => {
    if (books.length === 0) return;
    const nextIdx = Math.min(Math.max(selectedIdx + delta, 0), books.length - 1);
    onSelect(books[nextIdx].book);
  };

  return (
    <div className="guess-column">
      <p className="guess-label">Book</p>
      <p className="guess-value guess-book-value" title={selectedName}>{selectedName}</p>
      <p className="slider-meta">{Math.min(selectedIdx + 1, books.length)} / {books.length || 1}</p>
      <input
        type="range"
        min={0}
        max={Math.max(books.length - 1, 0)}
        step={1}
        value={selectedIdx}
        onChange={e => {
          const idx = parseInt(e.target.value, 10);
          if (books[idx]) {
            onSelect(books[idx].book);
          }
        }}
        className="vertical-range"
        aria-label="Book"
      />

      <div className="slider-step-controls">
        <button
          type="button"
          onClick={() => moveBy(-1)}
          disabled={selectedIdx <= 0}
          className="slider-step-btn"
          aria-label="Previous book"
        >
          -
        </button>
        <button
          type="button"
          onClick={() => moveBy(1)}
          disabled={selectedIdx >= books.length - 1}
          className="slider-step-btn"
          aria-label="Next book"
        >
          +
        </button>
      </div>

      <div className="guess-minmax">
        <span title={firstName}>{firstName}</span>
        <span title={lastName}>{lastName}</span>
      </div>
    </div>
  );
}
