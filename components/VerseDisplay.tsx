interface VerseInfo {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface Props {
  verse: VerseInfo | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export default function VerseDisplay({ verse, isLoading, error, onRetry }: Props) {
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

  return (
    <div className="fade-up">
      <div className="surface-card relative p-6 sm:p-8 min-h-60 flex items-center">
        <div className="absolute -top-3 left-6 bg-[var(--accent)] text-[var(--accent-ink)] text-xs font-bold px-2 py-0.5 rounded-md">
          KJV
        </div>
        <p className="headline-serif text-[var(--text-main)] text-xl sm:text-2xl leading-relaxed text-center italic w-full">
          &ldquo;{verse.text}&rdquo;
        </p>
      </div>
      <p className="content-muted text-sm text-center mt-3">Where is this verse found?</p>
    </div>
  );
}
