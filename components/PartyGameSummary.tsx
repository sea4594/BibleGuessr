'use client';

import { useMemo } from 'react';
import type { PartyGameState, PartyRoom, PartySubmission } from '@/lib/partyEngine';
import { gameModes } from '@/lib/gameModes';

type Props = {
  room: PartyRoom;
  game: PartyGameState;
  isHost: boolean;
  isReturningToLobby: boolean;
  onReturnToLobby: () => void;
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function overallPercent(total: number, rounds: number) {
  return clampPercent(total / Math.max(rounds, 1));
}

function guessText(submission?: PartySubmission) {
  if (!submission?.guess) return 'No guess';
  return `${submission.guess.book} ${submission.guess.chapter}:${submission.guess.verse}`;
}

export default function PartyGameSummary({ room, game, isHost, isReturningToLobby, onReturnToLobby }: Props) {
  const history = game.roundHistory ?? [];
  const participants = useMemo(() => {
    const ids = new Set<string>(Object.keys(game.scores ?? {}));
    history.forEach(entry => Object.keys(entry.submissions ?? {}).forEach(id => ids.add(id)));
    const memberById = new Map(room.members.map(member => [member.id, member]));
    const nameById = new Map<string, string>();
    history.forEach(entry => Object.entries(entry.submissions ?? {}).forEach(([id, submission]) => {
      if (submission?.playerName) nameById.set(id, submission.playerName);
    }));
    return Array.from(ids).map(id => ({
      id,
      name: memberById.get(id)?.name ?? nameById.get(id) ?? 'Player',
    }));
  }, [game.scores, history, room.members]);

  const ranked = participants.slice().sort((a, b) => (game.scores[b.id] ?? 0) - (game.scores[a.id] ?? 0));
  const modeName = gameModes[game.modeId]?.name ?? 'Party';

  return (
    <section className="party-game-summary w-full">
      <p className="content-muted mb-3">{modeName}</p>

      <div className="surface-card p-4 sm:p-5 mb-4 w-full">
        <h3 className="content-muted text-xs uppercase tracking-[0.18em] mb-3">Per Round Player Totals</h3>
        <div className="grid gap-2">
          <div className="grid" style={{ gridTemplateColumns: `5.6rem repeat(${participants.length}, minmax(0, 1fr))` }}>
            <div className="text-xs font-bold uppercase tracking-[0.12em] content-muted">Round</div>
            {participants.map(player => <div key={`head-${player.id}`} className="text-xs font-bold uppercase tracking-[0.12em] content-muted text-right">{player.name}</div>)}
          </div>
          {history.map(entry => (
            <div key={entry.round} className="grid border-t border-[var(--line)] pt-2" style={{ gridTemplateColumns: `5.6rem repeat(${participants.length}, minmax(0, 1fr))` }}>
              <div className="text-sm font-semibold">Round {entry.round}</div>
              {participants.map(player => <div key={`${entry.round}-${player.id}`} className="text-right text-sm font-semibold">{clampPercent(entry.roundScores?.[player.id] ?? 0)}%</div>)}
            </div>
          ))}
        </div>
      </div>

      <div className="surface-card p-4 sm:p-5 mb-4 w-full">
        <h3 className="content-muted text-xs uppercase tracking-[0.18em] mb-3">Per Round Player Guesses</h3>
        <div className="grid gap-3">
          {history.map(entry => (
            <div key={`guesses-${entry.round}`} className="border border-[var(--line)] rounded-xl p-3">
              <p className="text-sm font-semibold mb-2">Round {entry.round}</p>
              <p className="text-xs content-muted mb-2">{entry.verse.book} {entry.verse.chapter}:{entry.verse.verse}</p>
              <div className="grid gap-2 text-sm">
                {participants.map(player => {
                  const submission = entry.submissions?.[player.id];
                  return (
                    <div key={`guess-${entry.round}-${player.id}`} className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-2 first:border-0 first:pt-0">
                      <span className="font-semibold">{player.name}</span>
                      <span className={`font-semibold whitespace-nowrap overflow-x-auto ${submission?.guess ? '' : 'text-[var(--danger)]'}`}>{guessText(submission)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="surface-card p-4 sm:p-5 mb-4 w-full">
        <h3 className="content-muted text-xs uppercase tracking-[0.18em] mb-3">FINAL SCORES</h3>
        {ranked.map((player, idx) => (
          <div key={player.id} className="flex items-center justify-between py-3 border-t border-[var(--line)] first:border-0">
            <span className="text-base font-semibold">{idx + 1}. {player.name}</span>
            <span className="text-xl font-black">{overallPercent(game.scores[player.id] ?? 0, game.totalRounds)}%</span>
          </div>
        ))}
      </div>

      {isHost ? (
        <button onClick={onReturnToLobby} disabled={isReturningToLobby} className="btn-primary w-full py-3 text-lg">
          {isReturningToLobby ? 'Returning...' : 'Back to Party Lobby'}
        </button>
      ) : (
        <p className="content-muted text-sm">Waiting for host to return everyone to the party lobby.</p>
      )}
    </section>
  );
}
