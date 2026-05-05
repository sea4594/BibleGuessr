'use client';
import { useRef, useEffect } from 'react';
import { BookData } from '@/lib/bibleData';

interface Props {
  books: BookData[];
  selectedBook: string | null;
  onSelect: (book: string) => void;
}

export default function BookSlider({ books, selectedBook, onSelect }: Props) {
  const selectedIdx = books.findIndex(b => b.book === selectedBook);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedIdx >= 0 && containerRef.current) {
      const el = containerRef.current.children[selectedIdx] as HTMLElement;
      if (el) el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
  }, [selectedIdx]);

  return (
    <div>
      <label className="block text-slate-300 text-sm font-medium mb-2">Book</label>
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {books.map(book => (
          <button
            key={book.book}
            onClick={() => onSelect(book.book)}
            className={`flex-shrink-0 snap-center px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
              ${selectedBook === book.book
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
          >
            {book.book}
          </button>
        ))}
      </div>
    </div>
  );
}
