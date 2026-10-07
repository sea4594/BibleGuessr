'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import CustomBookSelector from '@/components/CustomBookSelector';

interface Props {
  selectedBooks: string[];
  onChange: (books: string[]) => void;
  disabled?: boolean;
}

export default function CustomBookSelectorPopup({
  selectedBooks,
  onChange,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);

  const modal = open && typeof window !== 'undefined'
    ? createPortal(
      <div className="custom-books-modal-backdrop" onClick={() => setOpen(false)}>
        <div className="custom-books-modal-card" onClick={event => event.stopPropagation()}>
          <CustomBookSelector selectedBooks={selectedBooks} onChange={onChange} disabled={disabled} />
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
        disabled={disabled}
        className="btn-outline w-full py-2.5"
      >
        Select Books
      </button>
      <p className="text-xs content-muted mt-2">{selectedBooks.length} selected</p>
      {modal}
    </>
  );
}
