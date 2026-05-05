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
      <div className="flex-1 flex items-center justify-center min-h-48">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Loading verse...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-48">
        <div className="text-center">
          <p className="text-red-400 mb-3">{error}</p>
          <button
            onClick={onRetry}
            className="bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!verse) return null;

  return (
    <div className="my-6">
      <div className="border border-amber-500/30 rounded-xl bg-slate-800/80 p-6 relative">
        <div className="absolute -top-3 left-6 bg-amber-500 text-slate-900 text-xs font-bold px-2 py-0.5 rounded">
          KJV
        </div>
        <p className="text-white text-lg leading-relaxed text-center italic">
          &ldquo;{verse.text}&rdquo;
        </p>
      </div>
      <p className="text-slate-500 text-sm text-center mt-2">Where is this verse found?</p>
    </div>
  );
}
