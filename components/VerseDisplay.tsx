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
      <div className="flex-1 flex items-center justify-center min-h-52">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="content-muted">Loading verse...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-52">
        <div className="text-center">
          <p className="text-[var(--danger)] mb-3">{error}</p>
          <button
            onClick={onRetry}
            className="btn-primary py-2 px-4"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!verse) return null;

  const versesToDisplay = [...previousVerses, verse, ...nextVerses];

  return (
    <div className="fade-up">
      <button
        onClick={onAddPrevious}
        disabled={Boolean(isLoadingNeighbor)}
        className="btn-outline w-full py-2 text-sm mb-2 disabled:opacity-50"
      >
        Previous verse (-10 points)
      </button>

      <div className="surface-card relative p-4 sm:p-5">
        <div className="absolute -top-3 left-4 bg-[var(--accent)] text-[var(--text-main)] text-xs font-bold px-2 py-0.5 border border-[var(--line-strong)]">
          KJV
        </div>
        <div className="h-64 overflow-y-auto px-2 py-1">
          <div className="space-y-3">
            {versesToDisplay.map(item => (
              <p
                key={`${item.book}-${item.chapter}-${item.verse}`}
                className="headline-serif text-[var(--text-main)] text-lg sm:text-xl leading-relaxed text-center italic"
              >
                &ldquo;{item.text}&rdquo;
              </p>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onAddNext}
        disabled={Boolean(isLoadingNeighbor)}
        className="btn-outline w-full py-2 text-sm mt-2 disabled:opacity-50"
      >
        Next verse (-10 points)
      </button>

      <p className="content-muted text-sm text-center mt-3">Where is this verse found?</p>
    </div>
  );
}
