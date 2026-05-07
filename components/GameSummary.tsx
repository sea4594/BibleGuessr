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
  const accuracy = Math.round((totalScore / Math.max(maxPossible, 1)) * 100);
  const avgRoundScore = Math.round(totalScore / Math.max(session.rounds.length, 1));

  const playerTotals = useMemo(() => {
    if (!session.multiplayer?.enabled) return [] as Array<{ player: string; score: number }>;

    const totals = new Map<string, number>();
    for (const player of session.multiplayer.players) totals.set(player, 0);
    for (const round of session.rounds) {
      if (!round.playerName) continue;
      totals.set(round.playerName, (totals.get(round.playerName) ?? 0) + round.score);
    }

    return Array.from(totals.entries())
      .map(([player, score]) => ({ player, score }))
      .sort((a, b) => b.score - a.score);
  }, [session.multiplayer, session.rounds]);

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
    <main className="app-screen">
      <header className="topbar">
        <button onClick={onHome} className="btn-outline px-3 py-2 text-sm">Exit</button>
        <div className="font-semibold">Game Summary</div>
        <span className="topbar-placeholder" aria-hidden="true" />
      </header>

      <div className="app-content app-content-scroll">
        <div className="page max-w-lg setup-page">
          <p className="content-muted mb-3">{session.modeConfig.name}</p>

          <div className="surface-card p-4 sm:p-5 mb-4 w-full">
            <h3 className="content-muted text-xs uppercase tracking-[0.18em] mb-3">Round Breakdown</h3>
            {session.rounds.map((round, idx) => (
              <div key={idx} className="summary-row border-t border-[var(--line)] first:border-0">
                <span className="summary-round">Round {idx + 1}</span>
                <span className="summary-ref">{round.verse.book} {round.verse.chapter}:{round.verse.verse}</span>
                <span className="summary-score">{round.score}</span>
              </div>
            ))}
          </div>

          <div className="surface-card text-center mb-4 p-6 w-full">
            <div className="text-7xl font-bold">{totalScore}</div>
            <div className="content-muted mt-1">Total Score</div>
            <div className="text-sm mt-1 content-muted">{avgRoundScore} average per round</div>
          </div>

          {playerTotals.length > 0 && (
            <div className="surface-card p-4 sm:p-5 mb-4 w-full">
              <h3 className="content-muted text-xs uppercase tracking-[0.18em] mb-3">Leaderboard</h3>
              {playerTotals.map((entry, idx) => (
                <div key={entry.player} className="flex items-center justify-between py-2.5 border-t border-[var(--line)] first:border-0">
                  <span className="text-sm">{idx + 1}. {entry.player}</span>
                  <span className="font-bold">{entry.score}</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={onPlayAgain} className="btn-primary setup-start-btn">
            Play Again
          </button>
        </div>
      </div>
    </main>
  );
}
