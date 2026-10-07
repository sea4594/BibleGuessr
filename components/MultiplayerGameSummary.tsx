'use client';

import Image from 'next/image';

export type MultiplayerSummaryPlayer = {
  id: string;
  name: string;
  avatarSrc?: string;
  score: number;
};

export type MultiplayerSummaryRound = {
  id: string;
  correctAnswer: string;
  entries: Array<{
    playerId: string;
    name: string;
    guess: string;
    score: number;
  }>;
};

type Props = {
  players: MultiplayerSummaryPlayer[];
  rounds: MultiplayerSummaryRound[];
  showAvatars?: boolean;
};

export default function MultiplayerGameSummary({ players, rounds, showAvatars = true }: Props) {
  const ranked = players.slice().sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return (
    <div className="multiplayer-summary">
      <section className="surface-card multiplayer-summary-leaderboard">
        {ranked.map(player => (
          <div key={player.id} className={showAvatars ? 'multiplayer-summary-player' : 'multiplayer-summary-player no-avatar'}>
            {showAvatars && player.avatarSrc && (
              <Image
                src={player.avatarSrc}
                alt={`${player.name} avatar`}
                width={44}
                height={44}
                unoptimized
                className="multiplayer-summary-avatar"
              />
            )}
            <span className="multiplayer-summary-player-name">{player.name}</span>
            <span className="multiplayer-summary-final-score">{Math.max(0, Math.min(100, Math.round(player.score)))}%</span>
          </div>
        ))}
      </section>

      <h2 className="headline-serif multiplayer-summary-title">Round Summaries</h2>

      <div className="multiplayer-summary-rounds">
        {rounds.map(round => (
          <section key={round.id} className="surface-card multiplayer-summary-round-card">
            <p className="multiplayer-summary-answer">{round.correctAnswer}</p>
            <div className="multiplayer-summary-round-entries">
              {round.entries.map(entry => (
                <div key={`${round.id}-${entry.playerId}`} className="multiplayer-summary-entry">
                  <span className="multiplayer-summary-entry-name">{entry.name}</span>
                  <span className="multiplayer-summary-entry-guess">{entry.guess}</span>
                  <span className="multiplayer-summary-entry-score">{Math.max(0, Math.min(100, Math.round(entry.score)))}%</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
