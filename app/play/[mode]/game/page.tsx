'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGame } from '@/lib/gameContext';
import { GameModeId } from '@/lib/gameModes';
import { calculateScore } from '@/lib/scoring';
import { bibleData, BookData } from '@/lib/bibleData';
import GuessInterface from '@/components/GuessInterface';
import VerseDisplay from '@/components/VerseDisplay';
import RoundResult from '@/components/RoundResult';
import GameSummary from '@/components/GameSummary';
import { X, Settings } from 'lucide-react';

interface VerseInfo {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

type NeighborDirection = 'previous' | 'next';

function pickRandomVerse(books: BookData[]): { book: BookData; chapter: number; verse: number } {
  const book = books[Math.floor(Math.random() * books.length)];
  const chapterData = book.chapters[Math.floor(Math.random() * book.chapters.length)];
  const chapter = parseInt(chapterData.chapter);
  const verseCount = parseInt(chapterData.verses);
  const verse = Math.floor(Math.random() * verseCount) + 1;
  return { book, chapter, verse };
}

function getApiBookName(bookName: string): string {
  return bookName.replace(/ /g, '+');
}

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
    if (verse > 1) {
      return { book, chapter, verse: verse - 1 };
    }

    if (chapter > 1) {
      const previousChapter = chapter - 1;
      const previousChapterData = bookData.chapters[previousChapter - 1];
      const previousChapterVerses = previousChapterData ? parseInt(previousChapterData.verses, 10) : 1;
      return { book, chapter: previousChapter, verse: previousChapterVerses };
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

  if (verse < maxVerse) {
    return { book, chapter, verse: verse + 1 };
  }

  if (chapter < bookData.chapters.length) {
    return { book, chapter: chapter + 1, verse: 1 };
  }

  if (bookIndex >= bibleData.length - 1) return null;
  return { book: bibleData[bookIndex + 1].book, chapter: 1, verse: 1 };
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { session, startGame, submitGuess, nextRound, resetGame } = useGame();
  const modeId = params.mode as GameModeId;

  const [currentVerse, setCurrentVerse] = useState<VerseInfo | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [verseError, setVerseError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [skipsUsed, setSkipsUsed] = useState(0);
  const [previousVerses, setPreviousVerses] = useState<VerseInfo[]>([]);
  const [nextVerses, setNextVerses] = useState<VerseInfo[]>([]);
  const [loadingNeighbor, setLoadingNeighbor] = useState<NeighborDirection | null>(null);

  useEffect(() => {
    if (!session) {
      router.replace('/');
    }
  }, [session, modeId, router]);

  useEffect(() => {
    if (!session) return;
    if (session.gameState !== 'summary') return;
    if (session.multiplayer?.lobbyType !== 'hot-seat') return;

    const target = session.returnPath ?? '/multiplayer/hot-seat/gamemode';
    resetGame();
    router.replace(target);
  }, [session, resetGame, router]);

  const fetchVerseByReference = useCallback(async (reference: { book: string; chapter: number; verse: number }) => {
    const apiBook = getApiBookName(reference.book);
    const apiNames = reference.book === 'Song of Solomon'
      ? [`${apiBook}+${reference.chapter}:${reference.verse}`, `Song+of+Songs+${reference.chapter}:${reference.verse}`]
      : [`${apiBook}+${reference.chapter}:${reference.verse}`];

    for (const name of apiNames) {
      try {
        const res = await fetch(`https://bible-api.com/${name}?translation=kjv`);
        if (!res.ok) continue;
        const data = await res.json();
        if (!data.text) continue;
        return {
          book: reference.book,
          chapter: reference.chapter,
          verse: reference.verse,
          text: data.text.trim(),
        } satisfies VerseInfo;
      } catch {
        // keep trying alternate names
      }
    }

    return null;
  }, []);

  const fetchVerse = useCallback(async (books: BookData[]) => {
    setIsLoadingVerse(true);
    setVerseError(null);
    setPreviousVerses([]);
    setNextVerses([]);

    let attempts = 0;
    while (attempts < 5) {
      const { book, chapter, verse } = pickRandomVerse(books);
      const data = await fetchVerseByReference({ book: book.book, chapter, verse });
      if (data) {
        setCurrentVerse(data);
        setElapsedSeconds(0);
        setShowHint(false);
        setIsLoadingVerse(false);
        return;
      }
      attempts++;
    }
    setVerseError('Failed to load verse. Please try again.');
    setIsLoadingVerse(false);
  }, [fetchVerseByReference]);

  useEffect(() => {
    if (session?.gameState === 'playing' && session.modeConfig) {
      const timer = setTimeout(() => {
        void fetchVerse(session.modeConfig.books);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [session?.currentRound, session?.gameState, fetchVerse, session?.modeConfig]);

  useEffect(() => {
    if (!currentVerse || isLoadingVerse || isPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentVerse, isLoadingVerse, isPaused]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTestament = (book: string) => {
    const idx = bibleData.findIndex(b => b.book === book);
    if (idx === -1) return 'Unknown';
    return idx <= 38 ? 'Old Testament' : 'New Testament';
  };

  if (!session) return null;

  const getCurrentPlayerName = () => {
    if (!session.multiplayer?.enabled || session.multiplayer.players.length === 0) {
      return null;
    }

    const completedTurns = session.rounds.length;
    if (session.multiplayer.turnStyle === 'alternate') {
      const index = completedTurns % session.multiplayer.players.length;
      return session.multiplayer.players[index];
    }

    const groupedIndex = Math.floor(completedTurns / session.multiplayer.roundsPerPlayer);
    const boundedIndex = Math.min(groupedIndex, session.multiplayer.players.length - 1);
    return session.multiplayer.players[boundedIndex];
  };

  const currentPlayerName = getCurrentPlayerName();

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
      if (direction === 'previous') {
        setPreviousVerses(prev => [data, ...prev]);
      } else {
        setNextVerses(prev => [...prev, data]);
      }
    }
    setLoadingNeighbor(null);
  };

  const handleSubmitGuess = (guess: { book: string; chapter: number; verse: number }) => {
    if (!currentVerse) return;
    const bookData =
      session.modeConfig.books.find(b => b.book === currentVerse.book) ??
      session.modeConfig.books[0];
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
        playerName: currentPlayerName ?? undefined,
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
  };

  const handleNextRound = () => {
    setCurrentVerse(null);
    setElapsedSeconds(0);
    setShowHint(false);
    setPreviousVerses([]);
    setNextVerses([]);
    nextRound();
  };

  const handleSkipVerse = () => {
    if (!session.modeConfig || skipsUsed >= 1) return;
    setSkipsUsed(prev => prev + 1);
    setCurrentVerse(null);
    setElapsedSeconds(0);
    setShowHint(false);
    setPreviousVerses([]);
    setNextVerses([]);
    void fetchVerse(session.modeConfig.books);
  };

  const handleExitToHome = () => {
    const destination = session?.returnPath ?? '/';
    resetGame();
    router.push(destination);
  };

  const handlePlayAgain = () => {
    startGame({
      mode: modeId,
      modeConfig: session.modeConfig,
      totalRounds: session.totalRounds,
      selectedBook: session.selectedBook,
    });
  };

  if (session.gameState === 'summary') {
    return (
      <GameSummary session={session} onPlayAgain={handlePlayAgain} onHome={handleExitToHome} />
    );
  }

  if (session.gameState === 'result') {
    const lastRound = session.rounds[session.rounds.length - 1];
    return (
      <RoundResult
        round={lastRound}
        roundNumber={session.currentRound}
        totalRounds={session.totalRounds}
        onNext={handleNextRound}
        onHome={handleExitToHome}
        isLastRound={session.currentRound >= session.totalRounds}
      />
    );
  }

  return (
    <div className="app-screen game-shell">
      <header className="topbar">
        <button
          onClick={handleExitToHome}
          className="btn-ghost inline-flex items-center gap-2 px-2 py-1"
        >
          <X size={16} /> Exit
        </button>
        <div className="text-center">
          <p className="font-semibold text-sm sm:text-base">Round {session.currentRound} of {session.totalRounds}</p>
          <p className="content-muted text-xs">Time: {formatTime(elapsedSeconds)}</p>
          {currentPlayerName && <p className="content-muted text-xs">Current: {currentPlayerName}</p>}
        </div>
        <Link href="/profile" className="btn-outline px-3 py-1.5 text-sm settings-icon-btn" aria-label="Profile settings"><Settings size={16}/></Link>
      </header>

      <div className="app-content app-content-fixed">
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
              <>
                <div className="surface-card-soft p-3 mb-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsPaused(true)}
                    className="btn-outline px-3 py-1.5 text-sm"
                  >
                    Pause
                  </button>
                  <button
                    onClick={() => setShowHint(prev => !prev)}
                    className="btn-outline px-3 py-1.5 text-sm"
                  >
                    {showHint ? 'Hide Hint' : 'Show Testament Hint'}
                  </button>
                  <button
                    onClick={handleSkipVerse}
                    disabled={skipsUsed >= 1}
                    className="btn-outline px-3 py-1.5 text-sm disabled:opacity-45"
                  >
                    Skip Verse ({Math.max(0, 1 - skipsUsed)} left)
                  </button>
                  {showHint && currentVerse && (
                    <span className="text-sm font-semibold">Hint: {getTestament(currentVerse.book)}</span>
                  )}
                  <span className="text-sm content-muted ml-auto">
                    Context penalty: -{(previousVerses.length + nextVerses.length) * 10}
                  </span>
                </div>
                <GuessInterface modeConfig={session.modeConfig} onSubmit={handleSubmitGuess} />
              </>
            )}
          </div>
        </div>
      </div>
      </div>

      {isPaused && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="surface-card w-full max-w-md p-7 text-center fade-up">
            <p className="eyebrow mb-2">Pause</p>
            <h2 className="headline-serif text-3xl mb-5">Game Paused</h2>
            <button
              onClick={() => setIsPaused(false)}
              className="btn-primary block w-full py-3 mb-3"
            >
              Resume
            </button>
            <button
              onClick={handleExitToHome}
              className="btn-outline block w-full py-2.5"
            >
              Exit to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
