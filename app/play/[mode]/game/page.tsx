'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGame, type GameSession, type RoundData } from '@/lib/gameContext';
import { GameModeId } from '@/lib/gameModes';
import { applyContextPenalty, calculateScore } from '@/lib/scoring';
import { bibleData, BookData } from '@/lib/bibleData';
import GuessInterface from '@/components/GuessInterface';
import VerseDisplay from '@/components/VerseDisplay';
import RoundResult from '@/components/RoundResult';
import GameSummary from '@/components/GameSummary';
import ScoreBar from '@/components/ScoreBar';
import { fetchVerseTextByReference } from '@/lib/verseClient';
import {
  buildVerseReferencePool,
  getShuffledAvailableVerseReferences,
  verseReferenceKey,
} from '@/lib/verseSelection';
import { Pause, X } from 'lucide-react';
import { useSettingsModal } from '@/components/SettingsModalProvider';

interface VerseInfo {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface PendingSelection {
  guess: { book: string; chapter: number; verse: number } | null;
  hasInteracted: boolean;
}

type NeighborDirection = 'previous' | 'next';

function resolveNeighborVerse(
  book: string,
  chapter: number,
  verse: number,
  direction: NeighborDirection
): { book: string; chapter: number; verse: number } | null {
  const bookIndex = bibleData.findIndex(b => b.book === book);
  if (bookIndex < 0) return null;

  const bookData = bibleData[bookIndex];
  const chapterData = bookData.chapters[chapter - 1];
  const maxVerse = chapterData ? parseInt(chapterData.verses, 10) : 1;

  if (direction === 'previous') {
    if (verse > 1) return { book, chapter, verse: verse - 1 };
    if (chapter > 1) {
      const previousChapter = chapter - 1;
      const previousChapterData = bookData.chapters[previousChapter - 1];
      return {
        book,
        chapter: previousChapter,
        verse: previousChapterData ? parseInt(previousChapterData.verses, 10) : 1,
      };
    }
    if (bookIndex === 0) return null;
    const previousBook = bibleData[bookIndex - 1];
    const previousBookChapterCount = previousBook.chapters.length;
    const previousBookFinalChapter = previousBook.chapters[previousBookChapterCount - 1];
    return {
      book: previousBook.book,
      chapter: previousBookChapterCount,
      verse: parseInt(previousBookFinalChapter.verses, 10),
    };
  }

  if (verse < maxVerse) return { book, chapter, verse: verse + 1 };
  if (chapter < bookData.chapters.length) return { book, chapter: chapter + 1, verse: 1 };
  if (bookIndex >= bibleData.length - 1) return null;
  return { book: bibleData[bookIndex + 1].book, chapter: 1, verse: 1 };
}

function renderHotSeatGuess(round?: RoundData) {
  if (!round || round.wasBlankGuess) return <span style={{ color: '#ef4444' }}>No guess</span>;

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
}

function HotSeatRoundSummary({
  session,
  roundNumber,
  onNext,
  onHome,
}: {
  session: GameSession;
  roundNumber: number;
  onNext: () => void;
  onHome: () => void;
}) {
  const multiplayer = session.multiplayer;
  if (!multiplayer?.enabled) return null;

  const entries = session.rounds
    .map((round, idx) => ({
      round,
      logicalRound: multiplayer.turnStyle === 'alternate'
        ? Math.floor(idx / multiplayer.players.length) + 1
        : (idx % multiplayer.roundsPerPlayer) + 1,
    }))
    .filter(entry => entry.logicalRound === roundNumber);
  const verse = entries[0]?.round.verse;
  if (!verse) return null;

  const rows = multiplayer.players.map((player, idx) => {
    const round = entries.find(entry => entry.round.playerName === player)?.round;
    const completed = session.rounds.filter(item => item.playerName === player);
    const total = completed.reduce((sum, item) => sum + item.score, 0);
    return {
      id: `${idx}-${player}`,
      player,
      round,
      roundScore: round?.score ?? 0,
      totalPercent: completed.length > 0 ? Math.round(total / completed.length) : 0,
    };
  }).sort((a, b) => b.totalPercent - a.totalPercent || b.roundScore - a.roundScore || a.player.localeCompare(b.player));

  return (
    <main className="app-screen game-shell">
      <header className="game-topbar">
        <div className="game-topbar-exit">
          <button onClick={onHome} className="btn-outline px-3 py-1.5 text-sm">Exit</button>
        </div>
        <p className="game-topbar-round">Round {roundNumber}/{multiplayer.roundsPerPlayer} Summary</p>
        <div className="game-topbar-actions" aria-hidden="true"><span className="topbar-placeholder" /></div>
      </header>

      <div className="app-content app-content-fixed game-content">
        <div className="page !max-w-6xl w-full">
          <section className="party-round-summary-fixed">
            <div className="party-round-summary-header">
              <section className="surface-card party-round-verse-card">
                <p className="text-base sm:text-lg leading-relaxed italic">&ldquo;{verse.text}&rdquo;</p>
              </section>
              <section className="surface-card party-round-answer-card">
                <p className="text-center text-[2rem] sm:text-[2.7rem] lg:text-[3rem] font-black leading-[0.98]">
                  {verse.book} {verse.chapter}:{verse.verse}
                </p>
              </section>
            </div>

            <div className="party-round-scores-scroll">
              {rows.map(({ id, player, round, roundScore, totalPercent }) => (
                <div key={id} className="party-round-table-row">
                  <div className="party-round-table-meta">
                    <p className="text-sm font-semibold">{player}</p>
                    <p className="text-sm whitespace-nowrap overflow-x-auto">
                      <span className="content-muted">Guess:&nbsp;</span>
                      {renderHotSeatGuess(round)}
                    </p>
                  </div>
                  <div className="party-round-score-stack">
                    <p className="party-round-table-score">{Math.max(0, Math.min(100, Math.round(roundScore)))}%</p>
                    <ScoreBar score={roundScore} className="score-bar-compact" label={`${player} round score`} />
                    <p className="text-xs content-muted">total {Math.max(0, Math.min(100, totalPercent))}%</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="party-round-summary-footer">
              <button onClick={onNext} className="btn-primary w-full py-3 text-lg">
                {session.currentRound >= session.totalRounds ? 'Game Summary' : 'Start Next Round'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { session, startGame, submitGuess, nextRound, resetGame } = useGame();
  const modeId = params.mode as GameModeId;

  const [currentVerse, setCurrentVerse] = useState<VerseInfo | null>(null);
  const [sharedVerseByRound, setSharedVerseByRound] = useState<Record<number, VerseInfo>>({});
  const [isLoadingVerse, setIsLoadingVerse] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [verseError, setVerseError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [previousVerses, setPreviousVerses] = useState<VerseInfo[]>([]);
  const [nextVerses, setNextVerses] = useState<VerseInfo[]>([]);
  const [loadingNeighbor, setLoadingNeighbor] = useState<NeighborDirection | null>(null);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection>({
    guess: null,
    hasInteracted: false,
  });
  const [unlockedHotSeatRound, setUnlockedHotSeatRound] = useState<number | null>(null);
  const suppressEmptySessionRedirectRef = useRef(false);
  const timeoutSubmittedRef = useRef(false);
  const usedVerseKeysRef = useRef<Set<string>>(new Set());
  const { openSettings } = useSettingsModal();

  useEffect(() => {
    if (!session) {
      if (suppressEmptySessionRedirectRef.current) return;
      router.replace('/');
    }
  }, [session, router]);

  const fetchVerseByReference = useCallback(async (reference: { book: string; chapter: number; verse: number }) => {
    const text = await fetchVerseTextByReference(reference.book, reference.chapter, reference.verse);
    if (!text) return null;

    return {
      book: reference.book,
      chapter: reference.chapter,
      verse: reference.verse,
      text,
    } satisfies VerseInfo;
  }, []);

  const fetchVerse = useCallback(async (books: BookData[]) => {
    if (!session) return;

    setIsLoadingVerse(true);
    setVerseError(null);
    setPreviousVerses([]);
    setNextVerses([]);
    setPendingSelection({ guess: null, hasInteracted: false });

    const playerCount = session.multiplayer?.players.length ?? 1;
    const isAlternate = session.multiplayer?.enabled && session.multiplayer.turnStyle === 'alternate';
    const isAllAtOnce = session.multiplayer?.enabled && session.multiplayer.turnStyle === 'all-at-once';
    const roundsPerPlayer = session.multiplayer?.roundsPerPlayer ?? 1;

    let logicalRound = session.currentRound;
    if (isAlternate) {
      logicalRound = Math.ceil(session.currentRound / playerCount);
    } else if (isAllAtOnce) {
      logicalRound = ((session.currentRound - 1) % roundsPerPlayer) + 1;
    }

    if (session.multiplayer?.enabled && sharedVerseByRound[logicalRound]) {
      const shared = sharedVerseByRound[logicalRound];
      usedVerseKeysRef.current.add(verseReferenceKey(shared));
      setCurrentVerse(shared);
      setRemainingSeconds(session.timerDurationSeconds ?? 0);
      timeoutSubmittedRef.current = false;
      setIsLoadingVerse(false);
      return;
    }

    const pool = buildVerseReferencePool(books);
    const availableReferences = getShuffledAvailableVerseReferences(pool, usedVerseKeysRef.current);

    for (const reference of availableReferences) {
      const data = await fetchVerseByReference(reference);
      if (data) {
        usedVerseKeysRef.current.add(verseReferenceKey(reference));
        setCurrentVerse(data);
        setRemainingSeconds(session.timerDurationSeconds ?? 0);
        timeoutSubmittedRef.current = false;
        setIsLoadingVerse(false);
        if (session.multiplayer?.enabled) {
          setSharedVerseByRound(prev => ({ ...prev, [logicalRound]: data }));
        }
        return;
      }
    }

    setVerseError('Failed to load a unique verse. Please try again.');
    setIsLoadingVerse(false);
  }, [fetchVerseByReference, session, sharedVerseByRound]);

  const isHotSeatGame = Boolean(session?.multiplayer?.enabled && session?.multiplayer?.lobbyType === 'hot-seat');
  const roundCanStart = !isHotSeatGame || unlockedHotSeatRound === session?.currentRound;
  const timerDurationSeconds = session?.timerDurationSeconds ?? 0;

  useEffect(() => {
    if (!isHotSeatGame || session?.gameState !== 'playing') return;
    setCurrentVerse(null);
    setRemainingSeconds(timerDurationSeconds);
    timeoutSubmittedRef.current = false;
    setPreviousVerses([]);
    setNextVerses([]);
    setPendingSelection({ guess: null, hasInteracted: false });
  }, [isHotSeatGame, session?.currentRound, session?.gameState, timerDurationSeconds]);

  useEffect(() => {
    if (session?.gameState === 'playing' && session.modeConfig && roundCanStart) {
      const timer = setTimeout(() => {
        void fetchVerse(session.modeConfig.books);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [session?.currentRound, session?.gameState, session?.modeConfig, fetchVerse, roundCanStart]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCurrentPlayerName = useCallback(() => {
    if (!session?.multiplayer?.enabled || session.multiplayer.players.length === 0) return null;

    const completedTurns = session.rounds.length;
    if (session.multiplayer.turnStyle === 'alternate') {
      const index = completedTurns % session.multiplayer.players.length;
      return session.multiplayer.players[index];
    }

    const groupedIndex = Math.floor(completedTurns / session.multiplayer.roundsPerPlayer);
    const boundedIndex = Math.min(groupedIndex, session.multiplayer.players.length - 1);
    return session.multiplayer.players[boundedIndex];
  }, [session]);

  const submitResolvedGuess = useCallback((
    guess: { book: string; chapter: number; verse: number },
    wasBlankGuess: boolean
  ) => {
    if (!session || !currentVerse) return;

    if (wasBlankGuess) {
      const blankBreakdown = calculateScore(
        { book: currentVerse.book, chapter: currentVerse.chapter, verse: currentVerse.verse },
        { book: '', chapter: 0, verse: 0 },
        session.modeConfig.books
      );

      submitGuess(
        { book: '', chapter: 0, verse: 0 },
        currentVerse,
        {
          playerName: getCurrentPlayerName() ?? undefined,
          baseScore: 0,
          contextPenalty: 0,
          contextVersesAdded: 0,
          wasBlankGuess: true,
        },
        0,
        {
          ...blankBreakdown,
          baseTotal: 0,
          contextPenalty: 0,
          contextVersesAdded: 0,
          total: 0,
        }
      );
      return;
    }

    const breakdown = calculateScore(
      { book: currentVerse.book, chapter: currentVerse.chapter, verse: currentVerse.verse },
      guess,
      session.modeConfig.books
    );

    const contextVersesAdded = previousVerses.length + nextVerses.length;
    const contextPenalty = contextVersesAdded * 10;
    const adjustedTotal = applyContextPenalty(breakdown.total, contextVersesAdded);

    submitGuess(
      guess,
      currentVerse,
      {
        playerName: getCurrentPlayerName() ?? undefined,
        baseScore: breakdown.total,
        contextPenalty,
        contextVersesAdded,
      },
      adjustedTotal,
      {
        ...breakdown,
        baseTotal: breakdown.total,
        contextPenalty,
        contextVersesAdded,
        total: adjustedTotal,
      }
    );
  }, [currentVerse, getCurrentPlayerName, nextVerses.length, previousVerses.length, session, submitGuess]);

  const handleSubmitGuess = useCallback((guess: { book: string; chapter: number; verse: number }) => {
    if (!currentVerse || timeoutSubmittedRef.current) return;
    timeoutSubmittedRef.current = true;
    submitResolvedGuess(guess, false);
  }, [currentVerse, submitResolvedGuess]);

  const handleTimerExpired = useCallback(() => {
    if (!session || !currentVerse || timeoutSubmittedRef.current) return;

    timeoutSubmittedRef.current = true;
    const timeoutGuess = pendingSelection.guess;
    if (timeoutGuess) {
      submitResolvedGuess(timeoutGuess, false);
      return;
    }

    submitResolvedGuess({ book: '', chapter: 0, verse: 0 }, true);
  }, [currentVerse, pendingSelection.guess, session, submitResolvedGuess]);

  useEffect(() => {
    if (!currentVerse || isLoadingVerse || isPaused || !roundCanStart || timerDurationSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentVerse, isLoadingVerse, isPaused, roundCanStart, timerDurationSeconds]);

  useEffect(() => {
    if (!currentVerse || isLoadingVerse || isPaused || !roundCanStart || timerDurationSeconds <= 0) return;
    if (remainingSeconds > 0 || timeoutSubmittedRef.current) return;

    const timer = setTimeout(() => {
      handleTimerExpired();
    }, 0);

    return () => clearTimeout(timer);
  }, [currentVerse, handleTimerExpired, isLoadingVerse, isPaused, remainingSeconds, roundCanStart, timerDurationSeconds]);

  if (!session) return null;

  const currentPlayerName = getCurrentPlayerName();

  const playerCount = session.multiplayer?.players.length ?? 1;
  const isAlternate = session.multiplayer?.enabled && session.multiplayer.turnStyle === 'alternate';
  const isAllAtOnce = session.multiplayer?.enabled && session.multiplayer.turnStyle === 'all-at-once';
  const displayRound = isAlternate
    ? Math.ceil(session.currentRound / playerCount)
    : isAllAtOnce
      ? ((session.currentRound - 1) % session.multiplayer!.roundsPerPlayer) + 1
      : session.currentRound;
  const displayTotalRounds = session.multiplayer?.enabled
    ? session.multiplayer.roundsPerPlayer
    : session.totalRounds;

  const handleAddNeighborVerse = async (direction: NeighborDirection) => {
    if (!currentVerse || loadingNeighbor) return;

    const seedVerse = direction === 'previous'
      ? previousVerses[0] ?? currentVerse
      : nextVerses[nextVerses.length - 1] ?? currentVerse;

    const targetRef = resolveNeighborVerse(seedVerse.book, seedVerse.chapter, seedVerse.verse, direction);
    if (!targetRef) return;

    setLoadingNeighbor(direction);
    const data = await fetchVerseByReference(targetRef);
    if (data) {
      if (direction === 'previous') setPreviousVerses(prev => [data, ...prev]);
      else setNextVerses(prev => [...prev, data]);
    }
    setLoadingNeighbor(null);
  };

  const handleNextRound = () => {
    setCurrentVerse(null);
    setRemainingSeconds(timerDurationSeconds);
    timeoutSubmittedRef.current = false;
    setPreviousVerses([]);
    setNextVerses([]);
    setPendingSelection({ guess: null, hasInteracted: false });
    if (isHotSeatGame) setUnlockedHotSeatRound(null);
    nextRound();
  };

  const handleExitToHome = () => {
    const destination = session?.returnPath ?? '/';
    suppressEmptySessionRedirectRef.current = true;
    resetGame();
    router.push(destination);
  };

  const handleExitSummaryToHome = () => {
    suppressEmptySessionRedirectRef.current = true;
    resetGame();
    router.push('/');
  };

  const handlePlayAgain = () => {
    usedVerseKeysRef.current = new Set();
    setSharedVerseByRound({});
    setPendingSelection({ guess: null, hasInteracted: false });
    setUnlockedHotSeatRound(null);
    const shouldRandomizeBook = session.mode === 'book-selection' && session.randomizeBookOnReplay;
    const randomBook = shouldRandomizeBook
      ? bibleData[Math.floor(Math.random() * bibleData.length)]
      : undefined;

    startGame({
      mode: modeId,
      modeConfig: shouldRandomizeBook && randomBook
        ? { ...session.modeConfig, books: [randomBook] }
        : session.modeConfig,
      totalRounds: session.totalRounds,
      timerDurationSeconds: session.timerDurationSeconds,
      selectedBook: shouldRandomizeBook && randomBook ? randomBook.book : session.selectedBook,
      randomizeBookOnReplay: Boolean(session.randomizeBookOnReplay),
      returnPath: session.returnPath,
      multiplayer: session.multiplayer,
    });
  };

  if (session.gameState === 'summary') {
    return (
      <GameSummary
        session={session}
        onPlayAgain={handlePlayAgain}
        onHome={isHotSeatGame ? handleExitSummaryToHome : handleExitToHome}
      />
    );
  }

  if (session.gameState === 'result') {
    if (isHotSeatGame) {
      return (
        <HotSeatRoundSummary
          session={session}
          roundNumber={displayRound}
          onNext={handleNextRound}
          onHome={handleExitToHome}
        />
      );
    }

    const lastRound = session.rounds[session.rounds.length - 1];
    return (
      <RoundResult
        round={lastRound}
        roundNumber={displayRound}
        onNext={handleNextRound}
        onHome={handleExitToHome}
        isLastRound={session.currentRound >= session.totalRounds}
        rounds={session.rounds}
        multiplayer={session.multiplayer}
      />
    );
  }

  const contextPenalty = (previousVerses.length + nextVerses.length) * 10;

  return (
    <div className="app-screen game-shell">
      <header className="game-topbar">
        <div className="game-topbar-exit">
          <button onClick={() => setShowQuitConfirm(true)} className="btn-outline px-3 py-1.5 text-sm">Exit</button>
        </div>
        <p className="game-topbar-round">
          Round {displayRound}/{displayTotalRounds}{contextPenalty > 0 && <span className="text-[var(--danger)]"> (-{contextPenalty})</span>}
          {currentPlayerName && <span className="game-topbar-player"> · {currentPlayerName}</span>}
        </p>
        <div className="game-topbar-actions">
          <p className="game-topbar-time">{timerDurationSeconds > 0 ? formatTime(Math.max(0, remainingSeconds)) : 'None'}</p>
          <button onClick={() => setIsPaused(true)} className="game-topbar-pause" aria-label="Pause game">
            <Pause size={15} />
          </button>
        </div>
      </header>

      <div className="app-content app-content-fixed game-content">
        <div className="page !max-w-6xl w-full">
          <div className="play-layout">
            <div className="play-verse">
              <VerseDisplay
                verse={currentVerse}
                previousVerses={previousVerses}
                nextVerses={nextVerses}
                isLoading={isLoadingVerse}
                error={verseError}
                isLoadingNeighbor={loadingNeighbor}
                onAddPrevious={() => void handleAddNeighborVerse('previous')}
                onAddNext={() => void handleAddNeighborVerse('next')}
                onRetry={() => session.modeConfig && fetchVerse(session.modeConfig.books)}
              />
            </div>

            <div className="play-guess">
              {currentVerse && !isLoadingVerse && (
                <GuessInterface
                  modeConfig={session.modeConfig}
                  onSubmit={handleSubmitGuess}
                  onSelectionChange={setPendingSelection}
                />
              )}
            </div>
          </div>

          {isHotSeatGame && !roundCanStart && session.gameState === 'playing' && (
            <div className="pause-overlay" onClick={e => e.stopPropagation()}>
              <div className="pause-card fade-up turn-gate-card">
                <h2 className="headline-serif text-3xl mb-2">Pass device</h2>
                <p className="content-muted mb-6">Pass the device to the next player.</p>
                <button onClick={() => setUnlockedHotSeatRound(session.currentRound)} className="btn-primary block w-full py-4 text-lg">
                  I&apos;m {currentPlayerName ?? 'Player'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isPaused && (
        <div className="pause-overlay" onClick={() => setIsPaused(false)}>
          <div className="pause-card fade-up" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsPaused(false)} className="pause-close-btn" aria-label="Close pause menu">
              <X size={18} />
            </button>

            <h2 className="headline-serif text-3xl mb-5">Paused</h2>

            <button
              onClick={() => {
                setIsPaused(false);
                openSettings();
              }}
              className="btn-outline block w-full py-3 mb-2 text-center"
            >
              Settings
            </button>
          </div>
        </div>
      )}

      {showQuitConfirm && (
        <div className="pause-overlay" onClick={() => setShowQuitConfirm(false)}>
          <div className="pause-card fade-up" onClick={e => e.stopPropagation()}>
            <h2 className="headline-serif text-2xl mb-2">Exit game?</h2>
            <p className="content-muted mb-5">Your current progress will be lost.</p>
            <button onClick={handleExitToHome} className="btn-primary block w-full py-3 mb-2">Yes, Exit</button>
            <button onClick={() => setShowQuitConfirm(false)} className="btn-outline block w-full py-3">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
