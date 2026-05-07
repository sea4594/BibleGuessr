'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Settings, X } from 'lucide-react';
import { RoundData } from '@/lib/gameContext';
import { useSettingsModal } from './SettingsModalProvider';
import { fetchChapterVersesByReference } from '@/lib/verseClient';

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
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterVerses, setChapterVerses] = useState<Array<{ verse: number; text: string }>>([]);
  const [chapterVersesKey, setChapterVersesKey] = useState('');
  const [isChapterLoading, setIsChapterLoading] = useState(false);
  const [chapterError, setChapterError] = useState<string | null>(null);
  const chapterVerseRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const { openSettings } = useSettingsModal();

  const bookCorrect = feedback.book === 'correct';
  const chapterCorrect = bookCorrect && feedback.chapter === 'correct';
  const verseCorrect = chapterCorrect && feedback.verse === 'correct';
  const correctnessUnits = (bookCorrect ? 1 : 0) + (chapterCorrect ? 1 : 0) + (verseCorrect ? 1 : 0);
  const correctnessPercent = Math.round((correctnessUnits / 3) * 100);

  const runningTotal = rounds.reduce((sum, r) => sum + r.score, 0);
  const isHotSeat = Boolean(multiplayer?.enabled);
  const chapterKey = `${verse.book}|${verse.chapter}`;

  useEffect(() => {
    if (!showChapterModal || chapterVerses.length === 0) return;
    const timer = setTimeout(() => {
      chapterVerseRefs.current[verse.verse]?.scrollIntoView({ block: 'center' });
    }, 0);
    return () => clearTimeout(timer);
  }, [chapterVerses, showChapterModal, verse.verse]);

  const openChapterModal = () => {
    setShowChapterModal(true);

    if (chapterVersesKey === chapterKey && chapterVerses.length > 0) return;

    setIsChapterLoading(true);
    setChapterError(null);
    void fetchChapterVersesByReference(verse.book, verse.chapter)
      .then(data => {
        if (!data) {
          setChapterError('Could not load this chapter.');
          return;
        }

        setChapterVerses(data);
        setChapterVersesKey(chapterKey);
      })
      .finally(() => setIsChapterLoading(false));
  };

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
          <button onClick={openChapterModal} className="surface-card p-4 sm:p-5 mb-4 text-left w-full">
            <p className="text-xs uppercase tracking-[0.12em] content-muted mb-2">Round Verse</p>
            <p className="text-base sm:text-lg leading-relaxed italic mb-3">&ldquo;{verse.text}&rdquo;</p>
            <p className="text-xs content-muted">Tap to open full chapter</p>
          </button>

          <div className="surface-card p-4 sm:p-5 mb-4">
            <p className="text-5xl sm:text-6xl font-extrabold mb-3">{verse.book} {verse.chapter}:{verse.verse}</p>

            <div className="result-progress-track mb-4" aria-label="Guess correctness progress">
              <div
                className="result-progress-fill"
                style={{
                  background: `linear-gradient(90deg, #22c55e 0%, #22c55e ${correctnessPercent}%, #ef4444 ${correctnessPercent}%, #ef4444 100%)`,
                }}
              />
            </div>

            <p className="text-xs uppercase tracking-[0.12em] content-muted mb-1">YOU GUESSED</p>
            <p className="text-base sm:text-lg font-semibold mb-4">
              {round.wasBlankGuess ? 'No guess (time expired)' : `${guess.book} ${guess.chapter}:${guess.verse}`}
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
            <div className="flex justify-between text-xl py-3 border-t border-[var(--line)] mt-1 font-extrabold">
              <span>Total</span>
              <span>{score}</span>
            </div>
          </div>

          <div className="surface-card p-4 sm:p-5 mb-6">
            <h3 className="content-muted text-xs uppercase tracking-[0.18em] mb-3">Round Scores</h3>
            {groupedRoundRows ? groupedRoundRows.map(({ logicalRound, byPlayer }) => (
              <div key={logicalRound} className="border-t border-[var(--line)] first:border-0 py-2">
                <div className="text-sm font-semibold mb-1">Round {logicalRound}</div>
                {multiplayer?.players.map(player => (
                  <div key={`${logicalRound}-${player}`} className="flex justify-between text-sm py-1">
                    <span>{player}</span>
                    <span className="font-semibold">{byPlayer.get(player) ?? 0}</span>
                  </div>
                ))}
              </div>
            )) : rounds.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1.5 border-t border-[var(--line)] first:border-0">
                <span>Round {idx + 1}</span>
                <span className="font-semibold">{item.score}</span>
              </div>
            ))}
            <div className="flex justify-between text-xl py-3 mt-1 border-t border-[var(--line)] font-extrabold">
              <span>Current Total</span>
              <span>{runningTotal}</span>
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

      {showChapterModal && (
        <div className="pause-overlay" onClick={() => setShowChapterModal(false)}>
          <div className="chapter-modal surface-card fade-up" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowChapterModal(false)} className="pause-close-btn" aria-label="Close chapter window">
              <X size={18} />
            </button>

            <h2 className="headline-serif text-3xl mb-1">{verse.book} {verse.chapter}</h2>
            <p className="content-muted text-sm mb-4">Verse {verse.verse} highlighted</p>

            {isChapterLoading ? (
              <p className="content-muted text-sm">Loading chapter...</p>
            ) : chapterError ? (
              <p className="text-[var(--danger)] text-sm">{chapterError}</p>
            ) : (
              <div className="chapter-modal-scroll">
                {chapterVerses.map(item => (
                  <div
                    key={item.verse}
                    ref={el => {
                      chapterVerseRefs.current[item.verse] = el;
                    }}
                    className={`chapter-verse-row${item.verse === verse.verse ? ' chapter-verse-row-active' : ''}`}
                  >
                    <span className="chapter-verse-num">{item.verse}</span>
                    <span className="chapter-verse-text">{item.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
