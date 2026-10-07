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
    wasBlankGuess?: boolean;
    guessParts?: { book: string; chapter: number; verse: number };
    feedback?: {
      book: 'correct' | 'close' | 'wrong';
      chapter: 'correct' | 'close' | 'wrong';
      verse: 'correct' | 'close' | 'wrong';
    };
  }>;
};


function renderSummaryGuess(entry: MultiplayerSummaryRound['entries'][number]) {
  if (entry.wasBlankGuess || !entry.guessParts) {
    return <span style={{ color: '#ef4444' }}>{entry.guess}</span>;
  }
  if (!entry.feedback) return <>{entry.guess}</>;

  const bookCorrect = entry.feedback.book === 'correct';
  const chapterCorrect = bookCorrect && entry.feedback.chapter === 'correct';
  const verseCorrect = chapterCorrect && entry.feedback.verse === 'correct';

  return (
    <>
      <span style={{ color: bookCorrect ? '#22c55e' : '#ef4444' }}>{entry.guessParts.book}</span>
      <span>&nbsp;</span>
      <span style={{ color: chapterCorrect ? '#22c55e' : '#ef4444' }}>{entry.guessParts.chapter}</span>
      <span style={{ color: chapterCorrect ? '#22c55e' : '#ef4444' }}>:</span>
      <span style={{ color: verseCorrect ? '#22c55e' : '#ef4444' }}>{entry.guessParts.verse}</span>
    </>
  );
}

type Props = {
  players: MultiplayerSummaryPlayer[];
  rounds: MultiplayerSummaryRound[];
  showAvatars?: boolean;
  singlePlayer?: boolean;
};

export default function MultiplayerGameSummary({ players, rounds, showAvatars = true, singlePlayer = false }: Props) {
  const ranked = players.slice().sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return (
    <div className="multiplayer-summary">
      {singlePlayer ? (
        <section className="surface-card multiplayer-summary-solo-score">
          <div className="multiplayer-summary-solo-score-value">{Math.max(0, Math.min(100, Math.round(ranked[0]?.score ?? 0)))}%</div>
          <div className="result-progress-track" aria-label="Final score">
            <div
              className="result-progress-fill"
              style={{
                background: `linear-gradient(90deg, #22c55e 0%, #22c55e ${Math.max(0, Math.min(100, Math.round(ranked[0]?.score ?? 0)))}%, #ef4444 ${Math.max(0, Math.min(100, Math.round(ranked[0]?.score ?? 0)))}%, #ef4444 100%)`,
              }}
            />
          </div>
        </section>
      ) : (
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
      )}

      <h2 className="headline-serif multiplayer-summary-title">Round Summaries</h2>

      <div className="multiplayer-summary-rounds">
        {rounds.map(round => (
          <section key={round.id} className="surface-card multiplayer-summary-round-card">
            <p className="multiplayer-summary-answer">{round.correctAnswer}</p>
            <div className="multiplayer-summary-round-entries">
              {round.entries.map(entry => (
                <div key={`${round.id}-${entry.playerId}`} className={singlePlayer ? 'multiplayer-summary-entry single-player' : 'multiplayer-summary-entry'}>
                  {!singlePlayer && <span className="multiplayer-summary-entry-name">{entry.name}</span>}
                  <span className="multiplayer-summary-entry-guess">{renderSummaryGuess(entry)}</span>
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
