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

  return (
    <div className="guess-column">
      <p className="guess-label">Book</p>
      <p className="guess-value guess-book-value" title={selectedName}>{selectedName}</p>
      <input
        type="range"
        min={0}
        max={Math.max(books.length - 1, 0)}
        value={selectedIdx}
        onChange={e => onSelect(books[parseInt(e.target.value, 10)].book)}
        className="vertical-range"
        aria-label="Book"
      />
      <div className="guess-minmax">
        <span>{firstName}</span>
        <span>{lastName}</span>
      </div>
    </div>
  );
}
