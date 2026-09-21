'use client';

import { useEffect, useMemo, useRef } from 'react';
import { bibleData } from '@/lib/bibleData';
import { NEW_TESTAMENT_BOOK_NAMES, OLD_TESTAMENT_BOOK_NAMES } from '@/lib/gameModes';

interface Props {
  selectedBooks: string[];
  onChange: (books: string[]) => void;
  disabled?: boolean;
}

interface TestamentCheckboxProps {
  label: string;
  checked: boolean;
  indeterminate: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

function TestamentCheckbox({ label, checked, indeterminate, disabled, onToggle }: TestamentCheckboxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className="custom-books-row custom-books-testament-row">
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
      />
      <span>{label}</span>
    </label>
  );
}

export default function CustomBookSelector({ selectedBooks, onChange, disabled }: Props) {
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
        label="Old Testament"
        checked={allOldSelected}
        indeterminate={someOldSelected && !allOldSelected}
        disabled={disabled}
        onToggle={() => toggleGroup(oldTestamentBooks)}
      />

      <div className="custom-books-indent">
        {oldTestamentBooks.map(book => (
          <label key={book} className="custom-books-row">
            <input
              type="checkbox"
              checked={selectedSet.has(book)}
              disabled={disabled}
              onChange={() => toggleBook(book)}
            />
            <span>{book}</span>
          </label>
        ))}
      </div>

      <TestamentCheckbox
        label="New Testament"
        checked={allNewSelected}
        indeterminate={someNewSelected && !allNewSelected}
        disabled={disabled}
        onToggle={() => toggleGroup(newTestamentBooks)}
      />

      <div className="custom-books-indent">
        {newTestamentBooks.map(book => (
          <label key={book} className="custom-books-row">
            <input
              type="checkbox"
              checked={selectedSet.has(book)}
              disabled={disabled}
              onChange={() => toggleBook(book)}
            />
            <span>{book}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
