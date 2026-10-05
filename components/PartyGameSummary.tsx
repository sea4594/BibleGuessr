'use client';

import { useMemo } from 'react';
import MultiplayerGameSummary from '@/components/MultiplayerGameSummary';
import type { PartyGameState, PartyRoom, PartySubmission } from '@/lib/partyEngine';
import { avatarToDataUri } from '@/lib/avatarSystem';

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

function guessText(submission?: PartySubmission) {
  if (!submission?.guess) return 'No guess';
  return `${submission.guess.book} ${submission.guess.chapter}:${submission.guess.verse}`;
}

export default function PartyGameSummary({ room, game, isHost, isReturningToLobby, onReturnToLobby }: Props) {
  const history = game.roundHistory ?? [];
  const players = useMemo(
    () => room.members.map(member => ({
      id: member.id,
      name: member.name,
      avatarSrc: avatarToDataUri(member.avatar),
      score: clampPercent((game.scores[member.id] ?? 0) / Math.max(game.totalRounds, 1)),
    })),
    [game.scores, game.totalRounds, room.members]
  );
  const rounds = useMemo(
    () => history.map(entry => ({
      id: String(entry.round),
      correctAnswer: `${entry.verse.book} ${entry.verse.chapter}:${entry.verse.verse}`,
      entries: room.members.map(member => {
        const submission = entry.submissions?.[member.id];
        return {
          playerId: member.id,
          name: member.name,
          guess: guessText(submission),
          score: entry.roundScores?.[member.id] ?? submission?.score ?? 0,
        };
      }),
    })),
    [history, room.members]
  );

  return (
    <section className="party-game-summary w-full">
      <MultiplayerGameSummary players={players} rounds={rounds} />
      {isHost ? (
        <button onClick={onReturnToLobby} disabled={isReturningToLobby} className="btn-primary w-full py-3 text-lg">
          {isReturningToLobby ? 'Returning...' : 'Back to Party Lobby'}
        </button>
      ) : (
        <p className="content-muted text-sm text-center">Waiting for host to return everyone to the party lobby.</p>
      )}
    </section>
  );
}
