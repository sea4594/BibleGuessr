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
  const [selectedRoundSourceIndex, setSelectedRoundSourceIndex] = useState<number | null>(null);
  const totalScore = session.rounds.reduce((sum, r) => sum + r.score, 0);
  const maxPossible = session.totalRounds * 100;
  const accuracy = Math.max(0, Math.min(100, Math.round((totalScore / Math.max(maxPossible, 1)) * 100)));
  const isHotSeat = Boolean(session.multiplayer?.enabled && session.multiplayer?.lobbyType === 'hot-seat');

  const playerTotals = useMemo(() => {
    if (!session.multiplayer?.enabled) return [] as Array<{ player: string; percent: number }>;

    const totals = new Map<string, { score: number; rounds: number }>();
    for (const player of session.multiplayer.players) totals.set(player, { score: 0, rounds: 0 });
    for (const round of session.rounds) {
      if (!round.playerName) continue;
      const existing = totals.get(round.playerName) ?? { score: 0, rounds: 0 };
      totals.set(round.playerName, {
        score: existing.score + round.score,
        rounds: existing.rounds + 1,
      });
    }

    return Array.from(totals.entries())
      .map(([player, value]) => ({
        player,
        percent: value.rounds > 0
          ? Math.max(0, Math.min(100, Math.round((value.score / (value.rounds * 100)) * 100)))
          : 0,
      }))
      .sort((a, b) => b.percent - a.percent);
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

  const hotSeatGuessesByRound = useMemo(() => {
    if (!isHotSeat || !session.multiplayer?.enabled || session.multiplayer.players.length === 0) return null;

    const grouped = new Map<number, {
      verse: GameSession['rounds'][number]['verse'];
      byPlayer: Map<string, GameSession['rounds'][number]>;
    }>();

    session.rounds.forEach((round, idx) => {
      const playerIndex = session.multiplayer!.turnStyle === 'alternate'
        ? idx % session.multiplayer!.players.length
        : Math.floor(idx / session.multiplayer!.roundsPerPlayer);
      const logicalRound = session.multiplayer!.turnStyle === 'alternate'
        ? Math.floor(idx / session.multiplayer!.players.length) + 1
        : (idx % session.multiplayer!.roundsPerPlayer) + 1;
      const playerName = round.playerName ?? session.multiplayer!.players[Math.min(playerIndex, session.multiplayer!.players.length - 1)];

      if (!grouped.has(logicalRound)) {
        grouped.set(logicalRound, {
          verse: round.verse,
          byPlayer: new Map<string, GameSession['rounds'][number]>(),
        });
      }

      grouped.get(logicalRound)!.byPlayer.set(playerName, round);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([logicalRound, value]) => ({ logicalRound, verse: value.verse, byPlayer: value.byPlayer }));
  }, [isHotSeat, session.multiplayer, session.rounds]);

  const roundBreakdownRows = useMemo(() => {
    if (!isHotSeat || !session.multiplayer?.enabled || session.multiplayer.players.length === 0) {
      return session.rounds.map((round, idx) => ({
        key: `round-${idx + 1}`,
        displayRound: idx + 1,
        sourceIndex: idx,
        round,
        score: round.score,
      }));
    }

    const grouped = new Map<number, { sourceIndex: number; round: GameSession['rounds'][number]; score: number }>();
    const groupedCounts = new Map<number, number>();

    session.rounds.forEach((round, idx) => {
      const logicalRound = session.multiplayer!.turnStyle === 'alternate'
        ? Math.floor(idx / session.multiplayer!.players.length) + 1
        : (idx % session.multiplayer!.roundsPerPlayer) + 1;

      const existing = grouped.get(logicalRound);
      if (!existing) {
        grouped.set(logicalRound, { sourceIndex: idx, round, score: round.score });
        groupedCounts.set(logicalRound, 1);
      } else {
        existing.score += round.score;
        groupedCounts.set(logicalRound, (groupedCounts.get(logicalRound) ?? 1) + 1);
      }
    });

    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([displayRound, value]) => ({
        key: `logical-round-${displayRound}`,
        displayRound,
        sourceIndex: value.sourceIndex,
        round: value.round,
        score: Math.max(0, Math.min(100, Math.round(value.score / Math.max(groupedCounts.get(displayRound) ?? 1, 1)))),
      }));
  }, [isHotSeat, session.multiplayer, session.rounds]);

  const selectedRound = selectedRoundSourceIndex === null ? null : session.rounds[selectedRoundSourceIndex] ?? null;
  const selectedRoundRow = selectedRoundSourceIndex === null
    ? null
    : roundBreakdownRows.find(row => row.sourceIndex === selectedRoundSourceIndex) ?? null;
  const selectedHotSeatRound = selectedRoundRow && hotSeatGuessesByRound
    ? hotSeatGuessesByRound.find(entry => entry.logicalRound === selectedRoundRow.displayRound) ?? null
    : null;

  const renderColoredGuess = (round: GameSession['rounds'][number]) => {
    if (round.wasBlankGuess) {
      return <span style={{ color: '#ef4444' }}>No guess</span>;
    }

    const bookCorrect = round.scoreBreakdown.feedback.book === 'correct';
    const chapterCorrect = bookCorrect && round.scoreBreakdown.feedback.chapter === 'correct';
    const verseCorrect = chapterCorrect && round.scoreBreakdown.feedback.verse === 'correct';

    return (
      <>
        <span style={{ color: bookCorrect ? '#22c55e' : '#ef4444' }}>{round.guess.book}</span>
        <span>&nbsp;</span>
        <span style={{ color: chapterCorrect ? '#22c55e' : '#ef4444' }}>{round.guess.chapter}</span>
        <span style={{ color: chapterCorrect ? '#22c55e' : '#ef4444' }}>:</span>
        <span style={{ color: verseCorrect ? '#22c55e' : '#ef4444' }}>{round.guess.verse}</span>
      </>
    );
  };

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
            {roundBreakdownRows.map(row => (
              <button
                key={row.key}
                onClick={() => setSelectedRoundSourceIndex(row.sourceIndex)}
                className="summary-row border-t border-[var(--line)] first:border-0 w-full text-left hover:opacity-85 transition-opacity"
              >
                <span className="summary-round">Round {row.displayRound}</span>
                <span className="summary-ref">{row.round.verse.book} {row.round.verse.chapter}:{row.round.verse.verse}</span>
                <span className="summary-score">{Math.max(0, Math.min(100, Math.round(row.score)))}%</span>
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
                      <div key={`${entry.logicalRound}-${player}`} className="text-right text-sm font-semibold">{Math.max(0, Math.min(100, Math.round(entry.byPlayer.get(player) ?? 0)))}%</div>
                    ))}
                  </div>
                ))}

              </div>
            </div>
          )}

          {hotSeatGuessesByRound && (
            <div className="surface-card p-4 sm:p-5 mb-4 w-full">
              <h3 className="content-muted text-xs uppercase tracking-[0.18em] mb-3">Per Round Player Guesses</h3>
              <div className="grid gap-3">
                {hotSeatGuessesByRound.map(entry => (
                  <div key={`hotseat-guesses-${entry.logicalRound}`} className="border border-[var(--line)] rounded-xl p-3">
                    <p className="text-sm font-semibold mb-2">Round {entry.logicalRound}</p>
                    <p className="text-xs content-muted mb-2">{entry.verse.book} {entry.verse.chapter}:{entry.verse.verse}</p>
                    <div className="grid gap-2 text-sm">
                      {session.multiplayer?.players.map(player => {
                        const playerRound = entry.byPlayer.get(player);
                        return (
                          <div key={`guess-${entry.logicalRound}-${player}`} className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-2 first:border-0 first:pt-0">
                            <span className="font-semibold">{player}</span>
                            <span className="font-semibold whitespace-nowrap overflow-x-auto">
                              {playerRound ? renderColoredGuess(playerRound) : <span style={{ color: '#ef4444' }}>No guess</span>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isHotSeat && (
            <div className="surface-card text-center mb-4 p-6 w-full">
              <div className="text-[2.2rem] sm:text-[3.1rem] lg:text-[3.5rem] font-black leading-tight">
                Final Score: {accuracy}%
              </div>
            </div>
          )}

          {playerTotals.length > 0 && (
            <div className="surface-card p-4 sm:p-5 mb-4 w-full">
              <h3 className="content-muted text-xs uppercase tracking-[0.18em] mb-3">
                {isHotSeat ? 'FINAL SCORES' : 'Leaderboard'}
              </h3>
              {playerTotals.map((entry, idx) => (
                <div key={entry.player} className="flex items-center justify-between py-3 border-t border-[var(--line)] first:border-0">
                  <span className={isHotSeat ? 'text-base font-semibold' : 'text-sm'}>{idx + 1}. {entry.player}</span>
                  <span className={isHotSeat ? 'text-xl font-black' : 'font-bold'}>{entry.percent}%</span>
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
        <div className="pause-overlay" onClick={() => setSelectedRoundSourceIndex(null)}>
          <div className="pause-card fade-up text-left max-w-xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedRoundSourceIndex(null)} className="pause-close-btn" aria-label="Close round details">
              <X size={18} />
            </button>

            <h2 className="headline-serif text-3xl mb-2">Round {selectedRoundRow?.displayRound ?? 1}</h2>
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
                <span className="font-semibold">{isHotSeat ? 'GUESSES:' : 'YOU GUESSED:'}</span>
                <span className="font-semibold whitespace-nowrap overflow-x-auto">
                  {!isHotSeat && renderColoredGuess(selectedRound)}
                </span>
              </div>
              {isHotSeat && selectedHotSeatRound && session.multiplayer?.players.map(player => {
                const playerRound = selectedHotSeatRound.byPlayer.get(player);
                return (
                  <div key={`selected-round-${selectedHotSeatRound.logicalRound}-${player}`} className="flex items-center justify-between border-t border-[var(--line)] pt-2">
                    <span>{player}</span>
                    <span className="font-semibold whitespace-nowrap overflow-x-auto">
                      {playerRound ? renderColoredGuess(playerRound) : <span style={{ color: '#ef4444' }}>No guess</span>}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between border-t border-[var(--line)] pt-2">
                <span>Score</span>
                <span className="font-extrabold">
                  {Math.max(0, Math.min(100, Math.round(isHotSeat ? (selectedRoundRow?.score ?? selectedRound.score) : selectedRound.score)))}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
