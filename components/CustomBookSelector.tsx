'use client';

import { useEffect, useId, useMemo, useRef } from 'react';
import { bibleData } from '@/lib/bibleData';
import { NEW_TESTAMENT_BOOK_NAMES, OLD_TESTAMENT_BOOK_NAMES } from '@/lib/gameModes';

interface Props {
  selectedBooks: string[];
  onChange: (books: string[]) => void;
  disabled?: boolean;
}

interface TestamentCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  indeterminate: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

function TestamentCheckbox({ id, label, checked, indeterminate, disabled, onToggle }: TestamentCheckboxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <div className="custom-books-row custom-books-testament-row">
      <input
        id={id}
        ref={inputRef}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

export default function CustomBookSelector({ selectedBooks, onChange, disabled }: Props) {
  const idPrefix = useId();
  const allBookNames = useMemo(() => bibleData.map(book => book.book), []);
  const selectedSet = useMemo(() => new Set(selectedBooks), [selectedBooks]);

  const oldTestamentBooks = useMemo(
    () => OLD_TESTAMENT_BOOK_NAMES.filter(book => allBookNames.includes(book)),
    [allBookNames]
  );

  const newTestamentBooks = useMemo(
    () => NEW_TESTAMENT_BOOK_NAMES.filter(book => allBookNames.includes(book)),
    [allBookNames]
  );

  const updateSelection = (nextSelection: Set<string>) => {
    const nextOrdered = allBookNames.filter(book => nextSelection.has(book));
    onChange(nextOrdered);
  };

  const toggleBook = (book: string) => {
    const next = new Set(selectedSet);
    if (next.has(book)) next.delete(book);
    else next.add(book);
    updateSelection(next);
  };

  const toggleGroup = (books: string[]) => {
    const allSelected = books.every(book => selectedSet.has(book));
    const next = new Set(selectedSet);

    for (const book of books) {
      if (allSelected) next.delete(book);
      else next.add(book);
    }

    updateSelection(next);
  };

  const allOldSelected = oldTestamentBooks.length > 0 && oldTestamentBooks.every(book => selectedSet.has(book));
  const someOldSelected = oldTestamentBooks.some(book => selectedSet.has(book));
  const allNewSelected = newTestamentBooks.length > 0 && newTestamentBooks.every(book => selectedSet.has(book));
  const someNewSelected = newTestamentBooks.some(book => selectedSet.has(book));

  return (
    <div className="custom-books-tree">
      <TestamentCheckbox
        id={`${idPrefix}-ot`}
        label="Old Testament"
        checked={allOldSelected}
        indeterminate={someOldSelected && !allOldSelected}
        disabled={disabled}
        onToggle={() => toggleGroup(oldTestamentBooks)}
      />

      <div className="custom-books-indent">
        {oldTestamentBooks.map(book => (
          <div key={book} className="custom-books-row">
            <input
              id={`${idPrefix}-book-${book.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`}
              type="checkbox"
              checked={selectedSet.has(book)}
              disabled={disabled}
              onChange={() => toggleBook(book)}
            />
            <label htmlFor={`${idPrefix}-book-${book.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`}>{book}</label>
          </div>
        ))}
      </div>

      <TestamentCheckbox
        id={`${idPrefix}-nt`}
        label="New Testament"
        checked={allNewSelected}
        indeterminate={someNewSelected && !allNewSelected}
        disabled={disabled}
        onToggle={() => toggleGroup(newTestamentBooks)}
      />

      <div className="custom-books-indent">
        {newTestamentBooks.map(book => (
          <div key={book} className="custom-books-row">
            <input
              id={`${idPrefix}-book-${book.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`}
              type="checkbox"
              checked={selectedSet.has(book)}
              disabled={disabled}
              onChange={() => toggleBook(book)}
            />
            <label htmlFor={`${idPrefix}-book-${book.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`}>{book}</label>
          </div>
        ))}
      </div>
    </div>
  );
}
