interface VerseInfo {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface Props {
  verse: VerseInfo | null;
  previousVerses: VerseInfo[];
  nextVerses: VerseInfo[];
  isLoading: boolean;
  isLoadingNeighbor: 'previous' | 'next' | null;
  error: string | null;
  onAddPrevious: () => void;
  onAddNext: () => void;
  onRetry: () => void;
}

export default function VerseDisplay({
  verse,
  previousVerses,
  nextVerses,
  isLoading,
  isLoadingNeighbor,
  error,
  onAddPrevious,
  onAddNext,
  onRetry,
}: Props) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-40">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="content-muted text-sm">Loading verse…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-40">
        <div className="text-center">
          <p className="text-[var(--danger)] mb-3 text-sm">{error}</p>
          <button onClick={onRetry} className="btn-primary py-2 px-4 text-sm">Try Again</button>
        </div>
      </div>
    );
  }

  if (!verse) return null;

  const versesToDisplay = [...previousVerses, verse, ...nextVerses];

  return (
    <div className="verse-display-wrap">
      {/* Scrollable verse area */}
      <div className="verse-scroll-area">
        <div className="surface-card relative p-3 sm:p-4">
          <div className="space-y-3">
            {versesToDisplay.map(item => (
              <p
                key={`${item.book}-${item.chapter}-${item.verse}`}
                className="headline-serif text-[var(--text-main)] text-base sm:text-lg leading-relaxed text-center italic"
              >
                &ldquo;{item.text}&rdquo;
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Next button – sticky, does not scroll with text */}
      <button
        onClick={onAddNext}
        disabled={Boolean(isLoadingNeighbor)}
        className="btn-outline w-full py-1.5 text-xs mt-1 disabled:opacity-50 flex-shrink-0"
      >
        ↓ Next verse&nbsp;
        <span className="text-[var(--danger)] font-semibold">-10</span>
      </button>

      {/* Previous button – placed below next button */}
      <button
        onClick={onAddPrevious}
        disabled={Boolean(isLoadingNeighbor)}
        className="btn-outline w-full py-1.5 text-xs mt-1 disabled:opacity-50 flex-shrink-0"
      >
        ↑ Previous verse&nbsp;
        <span className="text-[var(--danger)] font-semibold">-10</span>
      </button>
    </div>
  );
}
