'use client';

import { useMemo, useState } from 'react';
import { Settings } from 'lucide-react';
import { RoundData } from '@/lib/gameContext';
import { useSettingsModal } from './SettingsModalProvider';

interface Props {
  round: RoundData;
  roundNumber: number;
  onNext: () => void;
  onHome: () => void;
  isLastRound: boolean;
  rounds?: RoundData[];
  multiplayer?: {
    enabled: boolean;
    players: string[];
    roundsPerPlayer: number;
    turnStyle: 'alternate' | 'all-at-once';
  };
}

export default function RoundResult({
  round,
  roundNumber,
  onNext,
  onHome,
  isLastRound,
  rounds = [round],
  multiplayer,
}: Props) {
  const { verse, guess, score, scoreBreakdown } = round;
  const { feedback } = scoreBreakdown;
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const { openSettings } = useSettingsModal();

  const bookCorrect = feedback.book === 'correct';
  const chapterCorrect = bookCorrect && feedback.chapter === 'correct';
  const verseCorrect = chapterCorrect && feedback.verse === 'correct';
  const scorePercent = Math.max(0, Math.min(100, Math.round(score)));

  const runningTotal = rounds.reduce((sum, r) => sum + r.score, 0);
  const runningPercent = Math.max(0, Math.min(100, Math.round((runningTotal / Math.max(rounds.length * 100, 1)) * 100)));
  const isHotSeat = Boolean(multiplayer?.enabled);

  const groupedRoundRows = useMemo(() => {
    if (!multiplayer?.enabled || multiplayer.players.length === 0) return null;

    const grouped = new Map<number, Map<string, number>>();
    rounds.forEach((item, idx) => {
      const playerIndex = multiplayer.turnStyle === 'alternate'
        ? idx % multiplayer.players.length
        : Math.floor(idx / multiplayer.roundsPerPlayer);
      const logicalRound = multiplayer.turnStyle === 'alternate'
        ? Math.floor(idx / multiplayer.players.length) + 1
        : (idx % multiplayer.roundsPerPlayer) + 1;
      const playerName = item.playerName ?? multiplayer.players[Math.min(playerIndex, multiplayer.players.length - 1)];

      if (!grouped.has(logicalRound)) grouped.set(logicalRound, new Map<string, number>());
      grouped.get(logicalRound)!.set(playerName, item.score);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([logicalRound, byPlayer]) => ({ logicalRound, byPlayer }));
  }, [multiplayer, rounds]);

  return (
    <main className="app-screen">
      <header className="topbar">
        <button onClick={() => setShowExitConfirm(true)} className="btn-outline px-3 py-2 text-sm">Exit</button>
        <div className="font-semibold">Round {roundNumber} Score</div>
        <button onClick={openSettings} className="btn-outline px-3 py-2 text-sm settings-icon-btn inline-flex items-center justify-center" aria-label="Open settings">
          <Settings size={16} />
        </button>
      </header>

      <div className="app-content app-content-scroll">
        <div className="page max-w-lg">
          <section className="surface-card p-4 sm:p-5 mb-4 text-left w-full">
            <p className="text-xs uppercase tracking-[0.12em] content-muted mb-2">Round Verse</p>
            <p className="text-base sm:text-lg leading-relaxed italic">&ldquo;{verse.text}&rdquo;</p>
          </section>

          <div className="surface-card p-4 sm:p-5 mb-4">
            <p className="text-center text-[2.4rem] sm:text-[3.3rem] lg:text-[3.8rem] font-black mb-3 leading-[0.98]">{verse.book} {verse.chapter}:{verse.verse}</p>

            <div className="result-progress-track mb-4" aria-label="Guess correctness progress">
              <div
                className="result-progress-fill"
                style={{
                  background: `linear-gradient(90deg, #22c55e 0%, #22c55e ${scorePercent}%, #ef4444 ${scorePercent}%, #ef4444 100%)`,
                }}
              />
            </div>

            <p className="text-sm sm:text-base font-bold mb-4 whitespace-nowrap overflow-x-auto">
              <span className="content-muted">YOU GUESSED:&nbsp;</span>
              {round.wasBlankGuess ? (
                <span style={{ color: '#ef4444' }}>No guess (time expired)</span>
              ) : (
                <>
                  <span style={{ color: bookCorrect ? '#22c55e' : '#ef4444' }}>{guess.book}</span>
                  <span>&nbsp;</span>
                  <span style={{ color: chapterCorrect ? '#22c55e' : '#ef4444' }}>{guess.chapter}</span>
                  <span style={{ color: chapterCorrect ? '#22c55e' : '#ef4444' }}>:</span>
                  <span style={{ color: verseCorrect ? '#22c55e' : '#ef4444' }}>{guess.verse}</span>
                </>
              )}
            </p>
          </div>

          <div className="surface-card p-4 sm:p-5 mb-4">
            <h3 className="content-muted text-xs uppercase tracking-[0.18em] mb-2">Score Breakdown</h3>
            {scoreBreakdown.testamentPoints !== undefined && (
              <div className="flex justify-between text-sm py-1">
                <span>Testament</span>
                <span className="font-semibold">+{scoreBreakdown.testamentPoints}</span>
              </div>
            )}
            <div className="flex justify-between text-sm py-1">
              <span>Book</span>
              <span className="font-semibold">+{Math.round(scoreBreakdown.bookPoints)}</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span>Chapter</span>
              <span className="font-semibold">+{Math.round(scoreBreakdown.chapterPoints)}</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span>Verse</span>
              <span className="font-semibold">+{Math.round(scoreBreakdown.versePoints)}</span>
            </div>
            {round.contextVersesAdded > 0 && (
              <div className="flex justify-between text-sm py-1 text-[var(--danger)]">
                <span>Context verses ({round.contextVersesAdded} x -10)</span>
                <span className="font-semibold">-{round.contextPenalty}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-[1.55rem] sm:text-[1.75rem] py-3 border-t border-[var(--line)] mt-1 font-extrabold">
              <span>Total</span>
              <span>{scorePercent}%</span>
            </div>
          </div>

          <div className="surface-card p-4 sm:p-5 mb-6">
            <h3 className="content-muted text-xs uppercase tracking-[0.18em] mb-3">Round Scores</h3>
            {groupedRoundRows ? groupedRoundRows.map(({ logicalRound, byPlayer }) => (
              <div key={logicalRound} className="border-t border-[var(--line)] first:border-0 py-2">
                <div className="text-xs uppercase tracking-[0.14em] content-muted mb-1">Round {logicalRound}</div>
                {multiplayer?.players
                  .filter(player => byPlayer.has(player))
                  .map(player => (
                  <div key={`${logicalRound}-${player}`} className="flex justify-between text-sm py-1 pl-4">
                    <span>{player}</span>
                    <span className="font-semibold">{Math.max(0, Math.min(100, Math.round(byPlayer.get(player) ?? 0)))}%</span>
                  </div>
                ))}
              </div>
            )) : rounds.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1.5 border-t border-[var(--line)] first:border-0">
                <span>Round {idx + 1}</span>
                <span className="font-semibold">{Math.max(0, Math.min(100, Math.round(item.score)))}%</span>
              </div>
            ))}
            <div className="flex justify-between items-center text-[1.55rem] sm:text-[1.75rem] py-3 mt-1 border-t border-[var(--line)] font-extrabold">
              <span>Current total</span>
              <span>{runningPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="round-screen-footer">
        <div className="footer-inner">
          <button onClick={onNext} className="btn-primary w-full py-4 text-lg">
            {isLastRound ? 'See Final Score' : isHotSeat ? 'Next Player' : 'Next Round'}
          </button>
        </div>
      </div>

      {showExitConfirm && (
        <div className="pause-overlay" onClick={() => setShowExitConfirm(false)}>
          <div className="pause-card fade-up" onClick={e => e.stopPropagation()}>
            <h2 className="headline-serif text-2xl mb-2">Exit game?</h2>
            <p className="content-muted mb-5">Your current progress will be lost.</p>
            <button onClick={onHome} className="btn-primary block w-full py-3 mb-2">Yes, Exit</button>
            <button onClick={() => setShowExitConfirm(false)} className="btn-outline block w-full py-3">Cancel</button>
          </div>
        </div>
      )}
    </main>
  );
}
