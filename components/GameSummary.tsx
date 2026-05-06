'use client';
import { useEffect, useMemo } from 'react';
import { GameSession } from '@/lib/gameContext';
import { addGameRecord } from '@/lib/gameStats';

interface Props {
  session: GameSession;
  onPlayAgain: () => void;
  onHome: () => void;
}

export default function GameSummary({ session, onPlayAgain, onHome }: Props) {
  const totalScore = session.rounds.reduce((sum, r) => sum + r.score, 0);
  const maxPossible = session.totalRounds * 100;
  const accuracy = Math.round((totalScore / maxPossible) * 100);
  const avgRoundScore = Math.round(totalScore / Math.max(session.rounds.length, 1));
  const bestRound = useMemo(() => {
    if (session.rounds.length === 0) return 0;
    return Math.max(...session.rounds.map(r => r.score));
  }, [session.rounds]);

  useEffect(() => {
    addGameRecord({
      timestamp: Date.now(),
      modeId: session.mode,
      modeName: session.modeConfig.name,
      totalScore,
      accuracy,
      rounds: session.totalRounds,
    });
  }, [session.mode, session.modeConfig.name, session.totalRounds, totalScore, accuracy]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8 fade-up">
          <p className="eyebrow mb-2">Session Complete</p>
          <h2 className="headline-serif text-5xl text-amber-100 mb-2">Game Over</h2>
          <p className="text-slate-300">{session.modeConfig.name}</p>
        </div>

        <div className="surface-card text-center mb-6 p-6">
          <div className="text-7xl font-bold">{totalScore}</div>
          <div className="content-muted mt-1">Total Score</div>
          <div className="text-sm mt-1">{accuracy}% accuracy</div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="surface-card-soft p-3 text-center">
            <p className="text-xs content-muted">Avg/Round</p>
            <p className="text-xl font-bold">{avgRoundScore}</p>
          </div>
          <div className="surface-card-soft p-3 text-center">
            <p className="text-xs content-muted">Best Round</p>
            <p className="text-xl font-bold">{bestRound}</p>
          </div>
          <div className="surface-card-soft p-3 text-center">
            <p className="text-xs content-muted">Rounds</p>
            <p className="text-xl font-bold">{session.totalRounds}</p>
          </div>
        </div>

        <div className="surface-card p-4 sm:p-5 mb-6">
          <h3 className="content-muted text-xs uppercase tracking-[0.18em] mb-3">Round Breakdown</h3>
          {session.rounds.map((round, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2.5 border-t border-[rgba(199,214,242,0.14)] first:border-0"
            >
              <div>
                <span className="text-sm">Round {idx + 1}</span>
                <span className="content-muted text-xs ml-2">
                  {round.verse.book} {round.verse.chapter}:{round.verse.verse}
                </span>
              </div>
              <span className="font-bold">{round.score} pts</span>
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
