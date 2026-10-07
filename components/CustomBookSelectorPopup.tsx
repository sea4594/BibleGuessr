'use client';

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import CustomBookSelector from '@/components/CustomBookSelector';
import { bibleData } from '@/lib/bibleData';

interface Props {
  selectedBooks: string[];
  onChange: (books: string[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
  buttonLabel?: string;
  buttonClassName?: string;
}

export default function CustomBookSelectorPopup({
  selectedBooks,
  onChange,
  disabled,
  readOnly = false,
  buttonLabel,
  buttonClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const selectedSet = useMemo(() => new Set(selectedBooks), [selectedBooks]);

  const modal = open && typeof window !== 'undefined'
    ? createPortal(
      <div className="custom-books-modal-backdrop" onClick={() => setOpen(false)}>
        <div className="custom-books-modal-card" onClick={event => event.stopPropagation()}>
          {readOnly ? (
            <div className="party-readonly-book-list" aria-label="Selected books">
              {bibleData.map(book => {
                const selected = selectedSet.has(book.book);
                return (
                  <div key={book.book} className={selected ? 'party-readonly-book-row is-selected' : 'party-readonly-book-row'}>
                    <span>{book.book}</span>
                    <span className="party-readonly-book-state">{selected ? 'Selected' : ''}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <CustomBookSelector selectedBooks={selectedBooks} onChange={onChange} disabled={disabled} />
          )}
          <button onClick={() => setOpen(false)} className="btn-primary w-full mt-4 py-2.5">Done</button>
        </div>
      </div>,
      document.body
    )
    : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled && !readOnly}
        className={buttonClassName ?? 'btn-outline w-full py-2.5'}
      >
        {buttonLabel ?? `Select Books (${selectedBooks.length} selected)`}
      </button>
      {modal}
    </>
  );
}
