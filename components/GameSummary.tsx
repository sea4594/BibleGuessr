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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-amber-400 mb-2">Game Over!</h2>
          <p className="text-slate-400">{session.modeConfig.name}</p>
        </div>

        <div className="text-center mb-8">
          <div className="text-7xl font-bold text-white">{totalScore}</div>
          <div className="text-slate-400 mt-1">Total Score</div>
          <div className="text-slate-500 text-sm mt-1">{accuracy}% accuracy</div>
        </div>

        {/* Per-round breakdown */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
          <h3 className="text-slate-400 text-xs uppercase mb-3">Round Breakdown</h3>
          {session.rounds.map((round, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 border-t border-slate-700 first:border-0"
            >
              <div>
                <span className="text-slate-300 text-sm">Round {idx + 1}</span>
                <span className="text-slate-500 text-xs ml-2">
                  {round.verse.book} {round.verse.chapter}:{round.verse.verse}
                </span>
              </div>
              <span className="text-amber-400 font-bold">{round.score} pts</span>
            </div>
          ))}
        </div>

        <button
          onClick={onPlayAgain}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-lg text-lg mb-3 transition-colors"
        >
          Play Again
        </button>
        <button
          onClick={onHome}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg mb-3 transition-colors"
        >
          Home
        </button>
      </div>
    </div>
  );
}
