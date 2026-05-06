'use client';
import Link from 'next/link';
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

  const playerTotals = useMemo(() => {
    if (!session.multiplayer?.enabled) return [] as Array<{ player: string; score: number }>;

    const totals = new Map<string, number>();
    for (const player of session.multiplayer.players) {
      totals.set(player, 0);
    }
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
        <button onClick={onHome} className="btn-outline px-3 py-2 text-sm">Home</button>
        <div className="font-semibold">Session Summary</div>
        <Link href="/profile" className="btn-outline px-3 py-2 text-sm settings-icon-btn" aria-label="Profile settings">⚙</Link>
      </header>

      <div className="app-content app-content-scroll">
      <div className="page max-w-lg">
        <div className="text-center mb-8 fade-up">
          <p className="eyebrow mb-2">Session Complete</p>
          <h2 className="headline-serif text-5xl mb-2">Game Over</h2>
          <p className="content-muted">{session.modeConfig.name}</p>
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
              className="flex items-center justify-between py-2.5 border-t border-[var(--line)] first:border-0"
            >
              <div>
                <span className="text-sm">Round {idx + 1}</span>
                {round.playerName && (
                  <span className="content-muted text-xs ml-2">{round.playerName}</span>
                )}
                <span className="content-muted text-xs ml-2">
                  {round.verse.book} {round.verse.chapter}:{round.verse.verse}
                </span>
              </div>
              <span className="font-bold">{round.score} pts</span>
            </div>
          ))}
        </div>

        {playerTotals.length > 0 && (
          <div className="surface-card p-4 sm:p-5 mb-6">
            <h3 className="content-muted text-xs uppercase tracking-[0.18em] mb-3">Leaderboard</h3>
            {playerTotals.map((entry, idx) => (
              <div
                key={entry.player}
                className="flex items-center justify-between py-2.5 border-t border-[var(--line)] first:border-0"
              >
                <span className="text-sm">{idx + 1}. {entry.player}</span>
                <span className="font-bold">{entry.score} pts</span>
              </div>
            ))}
          </div>
        )}

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
    </main>
  );
}
