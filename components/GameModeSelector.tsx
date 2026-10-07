'use client';

import CustomBookSelectorPopup from '@/components/CustomBookSelectorPopup';
import { bibleData } from '@/lib/bibleData';
import { gameModes, type GameModeId } from '@/lib/gameModes';

interface Props {
  modeId: GameModeId;
  onModeChange: (modeId: GameModeId) => void;
  selectedBook: string;
  onBookChange: (book: string) => void;
  selectedBooks: string[];
  onSelectedBooksChange: (books: string[]) => void;
}

const modeOptions = Object.values(gameModes)
  .filter(mode => !mode.isSingleBook)
  .map(mode => ({ id: mode.id, name: mode.name }));

export default function GameModeSelector({
  modeId,
  onModeChange,
  selectedBook,
  onBookChange,
  selectedBooks,
  onSelectedBooksChange,
}: Props) {
  const hasSecondarySelection = modeId === 'book-selection' || modeId === 'custom';

  return (
    <div className="setup-mode-control">
      <p className="setup-control-label">Game Mode</p>
      <div className={`party-gamemode-row${hasSecondarySelection ? ' has-book' : ''}`}>
        <select
          value={modeId}
          onChange={event => onModeChange(event.target.value as GameModeId)}
          className="settings-input party-gamemode-select"
          aria-label="Game mode"
        >
          {modeOptions.map(option => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
          <option value="book-selection">Book</option>
        </select>

        {modeId === 'book-selection' && (
          <select
            value={selectedBook}
            onChange={event => onBookChange(event.target.value)}
            className="settings-input party-book-select"
            aria-label="Book"
          >
            {bibleData.map(book => (
              <option key={book.book} value={book.book}>{book.book}</option>
            ))}
          </select>
        )}

        {modeId === 'custom' && (
          <CustomBookSelectorPopup
            selectedBooks={selectedBooks}
            onChange={onSelectedBooksChange}
          />
        )}
      </div>
    </div>
  );
}
