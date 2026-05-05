'use client';
import { GameSession } from '@/lib/gameContext';

interface Props {
  session: GameSession;
  onPlayAgain: () => void;
  onHome: () => void;
}

export default function GameSummary({ session, onPlayAgain, onHome }: Props) {
  const totalScore = session.rounds.reduce((sum, r) => sum + r.score, 0);
  const maxPossible = session.totalRounds * 100;
  const accuracy = Math.round((totalScore / maxPossible) * 100);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8 fade-up">
          <p className="eyebrow mb-2">Session Complete</p>
          <h2 className="headline-serif text-5xl text-amber-100 mb-2">Game Over</h2>
          <p className="text-slate-300">{session.modeConfig.name}</p>
        </div>

        <div className="surface-card text-center mb-6 p-6">
          <div className="text-7xl font-bold text-slate-50">{totalScore}</div>
          <div className="text-slate-300 mt-1">Total Score</div>
          <div className="text-amber-100 text-sm mt-1">{accuracy}% accuracy</div>
        </div>

        <div className="surface-card p-4 sm:p-5 mb-6">
          <h3 className="text-slate-300 text-xs uppercase tracking-[0.18em] mb-3">Round Breakdown</h3>
          {session.rounds.map((round, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2.5 border-t border-[rgba(199,214,242,0.14)] first:border-0"
            >
              <div>
                <span className="text-slate-200 text-sm">Round {idx + 1}</span>
                <span className="text-slate-400 text-xs ml-2">
                  {round.verse.book} {round.verse.chapter}:{round.verse.verse}
                </span>
              </div>
              <span className="text-amber-100 font-bold">{round.score} pts</span>
            </div>
          ))}
        </div>

        <button
          onClick={onPlayAgain}
          className="btn-primary w-full py-3 text-lg mb-3"
        >
          Play Again
        </button>
        <button
          onClick={onHome}
          className="btn-outline w-full py-3 mb-3"
        >
          Home
        </button>
      </div>
    </div>
  );
}
