'use client';
import Link from 'next/link';
import { RoundData } from '@/lib/gameContext';

interface Props {
  round: RoundData;
  roundNumber: number;
  totalRounds: number;
  onNext: () => void;
  onHome: () => void;
  isLastRound: boolean;
}

// Utility function to get feedback styling
function getFeedbackStyles(status: 'correct' | 'close' | 'wrong') {
  const styles = {
    correct: { color: 'text-green-400', icon: '✓', label: 'Correct' },
    close: { color: 'text-yellow-400', icon: '~', label: 'Close' },
    wrong: { color: 'text-red-400', icon: '✗', label: 'Wrong' },
  };
  return styles[status];
}

function StatusBadge({ status }: { status: 'correct' | 'close' | 'wrong' }) {
  const style = getFeedbackStyles(status);
  return <span className={`font-bold ${style.color}`}>{style.icon}</span>;
}

interface FeedbackRowProps {
  category: string;
  correct: string | number;
  guess: string | number;
  status: 'correct' | 'close' | 'wrong';
  detail?: string;
}

function FeedbackRow({ category, correct, guess, status, detail }: FeedbackRowProps) {
  const style = getFeedbackStyles(status);
  return (
    <div className="grid grid-cols-3 gap-4 text-center py-2.5 border-t border-[var(--line)]">
      <div className="text-sm flex items-center justify-center gap-1">
        <StatusBadge status={status} /> {category}
      </div>
      <div className="font-medium text-sm">{correct}</div>
      <div className={`text-sm font-medium ${style.color}`}>
        {guess}
        {detail && <span className="text-xs ml-1">{detail}</span>}
      </div>
    </div>
  );
}

export default function RoundResult({ round, roundNumber, totalRounds, onNext, onHome, isLastRound }: Props) {
  const { verse, guess, score, scoreBreakdown } = round;
  const { feedback } = scoreBreakdown;

  return (
    <main className="app-screen">
      <header className="topbar">
        <button onClick={onHome} className="btn-outline px-3 py-2 text-sm">Home</button>
        <div className="font-semibold">Round Result</div>
        <Link href="/profile" className="btn-outline px-3 py-2 text-sm settings-icon-btn" aria-label="Profile settings">⚙</Link>
      </header>

      <div className="app-content app-content-scroll">
      <div className="page max-w-lg">
        <div className="text-center mb-7 fade-up">
          <p className="eyebrow">Round {roundNumber} of {totalRounds}</p>
          <h2 className="headline-serif text-4xl mt-1">Round Result</h2>
          {round.playerName && <p className="content-muted mt-2">Player: {round.playerName}</p>}
        </div>

        <div className="surface-card text-center mb-5 p-5 sm:p-6">
          <div className="text-6xl font-bold">{score}</div>
          <div className="content-muted text-sm mt-1">points</div>
        </div>

        <div className="surface-card p-4 sm:p-5 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center mb-2">
            <div className="content-muted text-xs uppercase tracking-[0.18em]">Category</div>
            <div className="content-muted text-xs uppercase tracking-[0.18em]">Correct</div>
            <div className="content-muted text-xs uppercase tracking-[0.18em]">Your Guess</div>
          </div>

          <FeedbackRow
            category="Book"
            correct={verse.book}
            guess={guess.book}
            status={feedback.book}
          />

          <FeedbackRow
            category="Chapter"
            correct={verse.chapter}
            guess={guess.chapter}
            status={feedback.chapter}
            detail={feedback.chaptersOff > 0 ? `(${feedback.chaptersOff} off)` : undefined}
          />

          <FeedbackRow
            category="Verse"
            correct={verse.verse}
            guess={guess.verse}
            status={feedback.verse}
            detail={feedback.versesOff > 0 ? `(${feedback.versesOff} off)` : undefined}
          />
        </div>

        <div className="surface-card p-4 sm:p-5 mb-6">
          <h3 className="content-muted text-xs uppercase tracking-[0.18em] mb-2">Score Breakdown</h3>
          {scoreBreakdown.testamentPoints !== undefined && (
            <div className="flex justify-between text-sm py-1">
              <span>Testament</span>
              <span className="font-semibold">+{scoreBreakdown.testamentPoints}</span>
            </div>
          )}
          <div className="flex justify-between text-sm py-1">
            <span>Book</span>
            <span className="font-semibold">+{Math.round(scoreBreakdown.bookPoints)}</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span>Chapter</span>
            <span className="font-semibold">+{Math.round(scoreBreakdown.chapterPoints)}</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span>Verse</span>
            <span className="font-semibold">+{Math.round(scoreBreakdown.versePoints)}</span>
          </div>
          {round.contextVersesAdded > 0 && (
            <div className="flex justify-between text-sm py-1 text-[var(--danger)]">
              <span>Context verses ({round.contextVersesAdded} x -10)</span>
              <span className="font-semibold">-{round.contextPenalty}</span>
            </div>
          )}
          <div className="flex justify-between text-sm py-1 border-t border-[var(--line)] mt-1 font-bold">
            <span>Total</span>
            <span>{score}</span>
          </div>
        </div>

        <button
          onClick={onNext}
          className="btn-primary w-full py-3 text-lg mb-3"
        >
          {isLastRound ? 'See Final Score' : 'Next Round →'}
        </button>
        <button
          onClick={onHome}
          className="btn-outline w-full py-2.5"
        >
          Exit to Home
        </button>
      </div>
      </div>
    </main>
  );
}
