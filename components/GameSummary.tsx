'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { GameSession } from '@/lib/gameContext';
import { addGameRecord } from '@/lib/gameStats';

interface Props {
  session: GameSession;
  onPlayAgain: () => void;
  onHome: () => void;
  onSelectGameMode?: () => void;
}

export default function GameSummary({ session, onPlayAgain, onHome, onSelectGameMode }: Props) {
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number | null>(null);
  const totalScore = session.rounds.reduce((sum, r) => sum + r.score, 0);
  const maxPossible = session.totalRounds * 100;
  const accuracy = Math.round((totalScore / Math.max(maxPossible, 1)) * 100);

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

  const multiplayerByRound = useMemo(() => {
    if (!session.multiplayer?.enabled || session.multiplayer.players.length === 0) return null;

    const grouped = new Map<number, Map<string, number>>();
    session.rounds.forEach((round, idx) => {
      const playerIndex = session.multiplayer!.turnStyle === 'alternate'
        ? idx % session.multiplayer!.players.length
        : Math.floor(idx / session.multiplayer!.roundsPerPlayer);
      const logicalRound = session.multiplayer!.turnStyle === 'alternate'
        ? Math.floor(idx / session.multiplayer!.players.length) + 1
        : (idx % session.multiplayer!.roundsPerPlayer) + 1;
      const playerName = round.playerName ?? session.multiplayer!.players[Math.min(playerIndex, session.multiplayer!.players.length - 1)];

      if (!grouped.has(logicalRound)) grouped.set(logicalRound, new Map<string, number>());
      grouped.get(logicalRound)!.set(playerName, round.score);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([logicalRound, byPlayer]) => ({ logicalRound, byPlayer }));
  }, [session.multiplayer, session.rounds]);

  const selectedRound = selectedRoundIndex === null ? null : session.rounds[selectedRoundIndex] ?? null;

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
        <div className="page max-w-lg">
          <p className="content-muted mb-3">{session.modeConfig.name}</p>

          <div className="surface-card p-4 sm:p-5 mb-4 w-full">
            <h3 className="content-muted text-xs uppercase tracking-[0.18em] mb-3">Round Breakdown</h3>
            {session.rounds.map((round, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedRoundIndex(idx)}
                className="summary-row border-t border-[var(--line)] first:border-0 w-full text-left hover:opacity-85 transition-opacity"
              >
                <span className="summary-round">Round {idx + 1}</span>
                <span className="summary-ref">{round.verse.book} {round.verse.chapter}:{round.verse.verse}</span>
                <span className="summary-score">{round.score}</span>
              </button>
            ))}
          </div>

          {multiplayerByRound && (
            <div className="surface-card p-4 sm:p-5 mb-4 w-full">
              <h3 className="content-muted text-xs uppercase tracking-[0.18em] mb-3">Per Round Player Totals</h3>

              <div className="grid gap-2">
                <div className="grid" style={{ gridTemplateColumns: `5.6rem repeat(${session.multiplayer?.players.length ?? 0}, minmax(0, 1fr))` }}>
                  <div className="text-xs font-bold uppercase tracking-[0.12em] content-muted">Round</div>
                  {session.multiplayer?.players.map(player => (
                    <div key={`head-${player}`} className="text-xs font-bold uppercase tracking-[0.12em] content-muted text-right">{player}</div>
                  ))}
                </div>

                {multiplayerByRound.map(entry => (
                  <div key={entry.logicalRound} className="grid border-t border-[var(--line)] pt-2" style={{ gridTemplateColumns: `5.6rem repeat(${session.multiplayer?.players.length ?? 0}, minmax(0, 1fr))` }}>
                    <div className="text-sm font-semibold">Round {entry.logicalRound}</div>
                    {session.multiplayer?.players.map(player => (
                      <div key={`${entry.logicalRound}-${player}`} className="text-right text-sm font-semibold">{entry.byPlayer.get(player) ?? 0}</div>
                    ))}
                  </div>
                ))}

                <div className="grid border-t border-[var(--line)] pt-2" style={{ gridTemplateColumns: `5.6rem repeat(${session.multiplayer?.players.length ?? 0}, minmax(0, 1fr))` }}>
                  <div className="text-base font-extrabold">Total</div>
                  {session.multiplayer?.players.map(player => (
                    <div key={`total-${player}`} className="text-right text-base font-extrabold">{playerTotals.find(entry => entry.player === player)?.score ?? 0}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="surface-card text-center mb-4 p-6 w-full">
            <div className="text-[2.2rem] sm:text-[3.1rem] lg:text-[3.5rem] font-black leading-tight">
              Total Score: {totalScore}
            </div>
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

        </div>
      </div>

      <div className="round-screen-footer">
        <div className="footer-inner">
          {onSelectGameMode ? (
            <div className="grid gap-2">
              <button onClick={onSelectGameMode} className="btn-outline w-full py-3 text-base">
                Select Game Mode
              </button>
              <button onClick={onPlayAgain} className="btn-primary w-full py-4 text-lg">
                Play Again
              </button>
            </div>
          ) : (
            <button onClick={onPlayAgain} className="btn-primary w-full py-4 text-lg">
              Play Again
            </button>
          )}
        </div>
      </div>

      {selectedRound && (
        <div className="pause-overlay" onClick={() => setSelectedRoundIndex(null)}>
          <div className="pause-card fade-up text-left max-w-xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedRoundIndex(null)} className="pause-close-btn" aria-label="Close round details">
              <X size={18} />
            </button>

            <h2 className="headline-serif text-3xl mb-2">Round {selectedRoundIndex! + 1}</h2>
            <p className="content-muted mb-3">{selectedRound.verse.book} {selectedRound.verse.chapter}:{selectedRound.verse.verse}</p>
            <p className="text-sm leading-relaxed mb-4 italic">&ldquo;{selectedRound.verse.text}&rdquo;</p>

            <div className="grid gap-2 text-sm">
              {session.multiplayer?.enabled && (
                <div className="flex items-center justify-between border-t border-[var(--line)] pt-2">
                  <span>Player</span>
                  <span className="font-semibold">{selectedRound.playerName ?? 'Player'}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-[var(--line)] pt-2">
                <span className="font-semibold">YOU GUESSED:</span>
                <span className="font-semibold whitespace-nowrap overflow-x-auto">
                  {selectedRound.wasBlankGuess ? (
                    <span style={{ color: '#ef4444' }}>No guess</span>
                  ) : (
                    (() => {
                      const bookCorrect = selectedRound.scoreBreakdown.feedback.book === 'correct';
                      const chapterCorrect = bookCorrect && selectedRound.scoreBreakdown.feedback.chapter === 'correct';
                      const verseCorrect = chapterCorrect && selectedRound.scoreBreakdown.feedback.verse === 'correct';

                      return (
                        <>
                          <span style={{ color: bookCorrect ? '#22c55e' : '#ef4444' }}>{selectedRound.guess.book}</span>
                          <span>&nbsp;</span>
                          <span style={{ color: chapterCorrect ? '#22c55e' : '#ef4444' }}>{selectedRound.guess.chapter}</span>
                          <span style={{ color: chapterCorrect ? '#22c55e' : '#ef4444' }}>:</span>
                          <span style={{ color: verseCorrect ? '#22c55e' : '#ef4444' }}>{selectedRound.guess.verse}</span>
                        </>
                      );
                    })()
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--line)] pt-2">
                <span>Score</span>
                <span className="font-extrabold">{selectedRound.score}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
