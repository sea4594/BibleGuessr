'use client';

import { useState } from 'react';
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
  const isHotSeat = Boolean(multiplayer?.enabled);


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

            <div className="result-guess-score-row">
              <p className="result-guess-line">
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
              <div className="result-round-score">{scorePercent}%</div>
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
