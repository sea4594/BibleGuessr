'use client';

import { useEffect, useMemo } from 'react';
import { GameSession } from '@/lib/gameContext';
import { addGameRecord } from '@/lib/gameStats';
import MultiplayerGameSummary from '@/components/MultiplayerGameSummary';

interface Props {
  session: GameSession;
  onPlayAgain: () => void;
  onHome: () => void;
  onSelectGameMode?: () => void;
}

export default function GameSummary({ session, onPlayAgain, onHome, onSelectGameMode }: Props) {
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


  useEffect(() => {
    addGameRecord({
      timestamp: Date.now(),
      modeId: session.mode,
      modeName: session.modeConfig.name,
      totalScore: accuracy,
      accuracy,
      rounds: session.totalRounds,
    });
  }, [session.mode, session.modeConfig.name, session.totalRounds, totalScore, accuracy]);

  if (isHotSeat && session.multiplayer?.enabled && hotSeatGuessesByRound) {
    const hotSeatPlayers = playerTotals.map(entry => ({
      id: entry.player,
      name: entry.player,
      score: entry.percent,
    }));
    const hotSeatRounds = hotSeatGuessesByRound.map(entry => ({
      id: String(entry.logicalRound),
      correctAnswer: `${entry.verse.book} ${entry.verse.chapter}:${entry.verse.verse}`,
      entries: session.multiplayer!.players.map(player => {
        const playerRound = entry.byPlayer.get(player);
        return {
          playerId: player,
          name: player,
          guess: !playerRound || playerRound.wasBlankGuess
            ? 'No guess'
            : `${playerRound.guess.book} ${playerRound.guess.chapter}:${playerRound.guess.verse}`,
          score: playerRound?.score ?? 0,
          wasBlankGuess: !playerRound || Boolean(playerRound.wasBlankGuess),
          guessParts: playerRound && !playerRound.wasBlankGuess ? playerRound.guess : undefined,
          feedback: playerRound && !playerRound.wasBlankGuess ? playerRound.scoreBreakdown.feedback : undefined,
        };
      }),
    }));

    return (
      <main className="app-screen">
        <header className="topbar">
          <button onClick={onHome} className="btn-outline px-3 py-2 text-sm">Exit</button>
          <div className="font-semibold">Game Summary</div>
          <span className="topbar-placeholder" aria-hidden="true" />
        </header>

        <div className="app-content app-content-scroll">
          <div className="page max-w-lg">
            <MultiplayerGameSummary players={hotSeatPlayers} rounds={hotSeatRounds} showAvatars={false} />
          </div>
        </div>

        <div className="round-screen-footer">
          <div className="footer-inner">
            {onSelectGameMode ? (
              <div className="grid gap-2">
                <button onClick={onSelectGameMode} className="btn-outline w-full py-3 text-base">Select Game Mode</button>
                <button onClick={onPlayAgain} className="btn-primary w-full py-4 text-lg">Play Again</button>
              </div>
            ) : (
              <button onClick={onPlayAgain} className="btn-primary w-full py-4 text-lg">Play Again</button>
            )}
          </div>
        </div>
      </main>
    );
  }


  const singlePlayerRounds = session.rounds.map((round, idx) => ({
    id: String(idx + 1),
    correctAnswer: `${round.verse.book} ${round.verse.chapter}:${round.verse.verse}`,
    entries: [{
      playerId: 'single-player',
      name: '',
      guess: round.wasBlankGuess ? 'No guess' : `${round.guess.book} ${round.guess.chapter}:${round.guess.verse}`,
      score: round.score,
      wasBlankGuess: Boolean(round.wasBlankGuess),
      guessParts: round.wasBlankGuess ? undefined : round.guess,
      feedback: round.wasBlankGuess ? undefined : round.scoreBreakdown.feedback,
    }],
  }));

  return (
    <main className="app-screen">
      <header className="topbar">
        <button onClick={onHome} className="btn-outline px-3 py-2 text-sm">Exit</button>
        <div className="font-semibold">Game Summary</div>
        <span className="topbar-placeholder" aria-hidden="true" />
      </header>

      <div className="app-content app-content-scroll">
        <div className="page max-w-lg">
          <MultiplayerGameSummary
            players={[{ id: 'single-player', name: '', score: accuracy }]}
            rounds={singlePlayerRounds}
            showAvatars={false}
            singlePlayer
          />
        </div>
      </div>

      <div className="round-screen-footer">
        <div className="footer-inner">
          {onSelectGameMode ? (
            <div className="grid gap-2">
              <button onClick={onSelectGameMode} className="btn-outline w-full py-3 text-base">Select Game Mode</button>
              <button onClick={onPlayAgain} className="btn-primary w-full py-4 text-lg">Play Again</button>
            </div>
          ) : (
            <button onClick={onPlayAgain} className="btn-primary w-full py-4 text-lg">Play Again</button>
          )}
        </div>
      </div>
    </main>
  );

}
