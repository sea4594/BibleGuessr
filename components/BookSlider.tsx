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
      <label className="block text-slate-200 text-sm font-semibold mb-2">Book</label>
      <div
        ref={containerRef}
        className="no-scrollbar flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory"
      >
        {books.map(book => (
          <button
            key={book.book}
            onClick={() => onSelect(book.book)}
            className={`flex-shrink-0 snap-center px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap border
              ${selectedBook === book.book
                ? 'bg-[#ddc68d] text-[#1c283d] border-[#f2e1b8]'
                : 'bg-[rgba(32,49,71,0.72)] text-slate-200 border-[#506280] hover:bg-[rgba(56,77,106,0.82)]'
              }`}
          >
            {book.book}
          </button>
        ))}
      </div>
    </div>
  );
}
