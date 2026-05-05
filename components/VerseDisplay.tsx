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
          <div className="w-10 h-10 border-4 border-[#e0c989] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-300">Loading verse...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-52">
        <div className="text-center">
          <p className="text-rose-300 mb-3">{error}</p>
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
    <div className="my-5 sm:my-7 fade-up">
      <div className="surface-card relative p-6 sm:p-8">
        <div className="absolute -top-3 left-6 bg-[#e0c989] text-[#1e2a3f] text-xs font-bold px-2 py-0.5 rounded-md">
          KJV
        </div>
        <p className="headline-serif text-slate-100 text-xl sm:text-2xl leading-relaxed text-center italic">
          &ldquo;{verse.text}&rdquo;
        </p>
      </div>
      <p className="text-slate-300 text-sm text-center mt-3">Where is this verse found?</p>
    </div>
  );
}
