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

function StatusBadge({ status }: { status: 'correct' | 'close' | 'wrong' }) {
  const styles = { correct: 'text-green-400', close: 'text-yellow-400', wrong: 'text-red-400' };
  const icons = { correct: '✓', close: '~', wrong: '✗' };
  return <span className={`font-bold ${styles[status]}`}>{icons[status]}</span>;
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

          <div className="grid grid-cols-3 gap-4 text-center py-2.5 border-t border-[var(--line)]">
            <div className="text-sm flex items-center justify-center gap-1">
              <StatusBadge status={feedback.book} /> Book
            </div>
            <div className="font-medium text-sm">{verse.book}</div>
            <div className={`text-sm font-medium ${feedback.book === 'correct' ? 'text-green-400' : feedback.book === 'close' ? 'text-yellow-400' : 'text-red-400'}`}>
              {guess.book}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center py-2.5 border-t border-[var(--line)]">
            <div className="text-sm flex items-center justify-center gap-1">
              <StatusBadge status={feedback.chapter} /> Chapter
            </div>
            <div className="font-medium text-sm">{verse.chapter}</div>
            <div className={`text-sm font-medium ${feedback.chapter === 'correct' ? 'text-green-400' : feedback.chapter === 'close' ? 'text-yellow-400' : 'text-red-400'}`}>
              {guess.chapter}
              {feedback.chaptersOff > 0 && (
                <span className="text-xs ml-1">({feedback.chaptersOff} off)</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center py-2.5 border-t border-[var(--line)]">
            <div className="text-sm flex items-center justify-center gap-1">
              <StatusBadge status={feedback.verse} /> Verse
            </div>
            <div className="font-medium text-sm">{verse.verse}</div>
            <div className={`text-sm font-medium ${feedback.verse === 'correct' ? 'text-green-400' : feedback.verse === 'close' ? 'text-yellow-400' : 'text-red-400'}`}>
              {guess.verse}
              {feedback.versesOff > 0 && (
                <span className="text-xs ml-1">({feedback.versesOff} off)</span>
              )}
            </div>
          </div>
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
