'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGame } from '@/lib/gameContext';
import { GameModeId } from '@/lib/gameModes';
import { calculateScore } from '@/lib/scoring';
import { bibleData, BookData } from '@/lib/bibleData';
import GuessInterface from '@/components/GuessInterface';
import VerseDisplay from '@/components/VerseDisplay';
import RoundResult from '@/components/RoundResult';
import GameSummary from '@/components/GameSummary';
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
  const [canStartRound, setCanStartRound] = useState(false);
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
  const roundCanStart = !isHotSeatGame || canStartRound;
  const timerDurationSeconds = session?.timerDurationSeconds ?? 0;

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
          bookPoints: 0,
          chapterPoints: 0,
          versePoints: 0,
          baseTotal: 0,
          contextPenalty: 0,
          contextVersesAdded: 0,
          total: 0,
          feedback: {
            book: 'wrong',
            chapter: 'wrong',
            verse: 'wrong',
            chaptersOff: 0,
            versesOff: 0,
          },
        }
      );
      return;
    }

    const bookData = session.modeConfig.books.find(b => b.book === currentVerse.book) ?? session.modeConfig.books[0];
    const breakdown = calculateScore(
      { book: currentVerse.book, chapter: currentVerse.chapter, verse: currentVerse.verse },
      guess,
      bookData,
      session.modeConfig.scoringType
    );

    const contextVersesAdded = previousVerses.length + nextVerses.length;
    const contextPenalty = contextVersesAdded * 10;
    const adjustedTotal = Math.max(0, breakdown.total - contextPenalty);

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
    const timeoutGuess = pendingSelection.hasInteracted ? pendingSelection.guess : null;
    if (timeoutGuess) {
      submitResolvedGuess(timeoutGuess, false);
      return;
    }

    submitResolvedGuess({ book: '', chapter: 0, verse: 0 }, true);
  }, [currentVerse, pendingSelection.guess, pendingSelection.hasInteracted, session, submitResolvedGuess]);

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
  const displayRound = isAlternate ? Math.ceil(session.currentRound / playerCount) : session.currentRound;
  const displayTotalRounds = isAlternate ? (session.multiplayer?.roundsPerPlayer ?? session.totalRounds) : session.totalRounds;

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
    if (isHotSeatGame) setCanStartRound(false);
    nextRound();
  };

  const handleExitToHome = () => {
    const destination = session?.returnPath ?? '/';
    resetGame();
    router.push(destination);
  };

  const handleExitSummaryToHome = () => {
    resetGame();
    router.push('/');
  };

  const handleSelectGameMode = () => {
    suppressEmptySessionRedirectRef.current = true;
    router.push('/multiplayer/hot-seat/gamemode');
    resetGame();
  };

  const handlePlayAgain = () => {
    usedVerseKeysRef.current = new Set();
    setSharedVerseByRound({});
    setPendingSelection({ guess: null, hasInteracted: false });
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
        onSelectGameMode={isHotSeatGame ? handleSelectGameMode : undefined}
      />
    );
  }

  if (session.gameState === 'result') {
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
          Round {displayRound}/{displayTotalRounds} <span className="text-[var(--danger)]">(-{contextPenalty})</span>
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
                <button onClick={() => setCanStartRound(true)} className="btn-primary block w-full py-4 text-lg">
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
