'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGame } from '@/lib/gameContext';
import { GameModeId } from '@/lib/gameModes';
import { calculateScore } from '@/lib/scoring';
import { BookData } from '@/lib/bibleData';
import GuessInterface from '@/components/GuessInterface';
import VerseDisplay from '@/components/VerseDisplay';
import RoundResult from '@/components/RoundResult';
import GameSummary from '@/components/GameSummary';

interface VerseInfo {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

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

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { session, startGame, submitGuess, nextRound, resetGame } = useGame();
  const modeId = params.mode as GameModeId;

  const [currentVerse, setCurrentVerse] = useState<VerseInfo | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [verseError, setVerseError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.replace(`/play/${modeId}`);
    }
  }, [session, modeId, router]);

  const fetchVerse = useCallback(async (books: BookData[]) => {
    setIsLoadingVerse(true);
    setVerseError(null);

    let attempts = 0;
    while (attempts < 5) {
      const { book, chapter, verse } = pickRandomVerse(books);
      const apiBook = getApiBookName(book.book);
      // Try alternate name for Song of Solomon
      const apiNames = book.book === 'Song of Solomon'
        ? [`${apiBook}+${chapter}:${verse}`, `Song+of+Songs+${chapter}:${verse}`]
        : [`${apiBook}+${chapter}:${verse}`];

      for (const name of apiNames) {
        try {
          const res = await fetch(`https://bible-api.com/${name}?translation=kjv`);
          if (res.ok) {
            const data = await res.json();
            if (data.text) {
              setCurrentVerse({ book: book.book, chapter, verse, text: data.text.trim() });
              setIsLoadingVerse(false);
              return;
            }
          }
        } catch {
          // try next name or attempt
        }
      }
      attempts++;
    }
    setVerseError('Failed to load verse. Please try again.');
    setIsLoadingVerse(false);
  }, []);

  useEffect(() => {
    if (session?.gameState === 'playing' && session.modeConfig) {
      const timer = setTimeout(() => {
        void fetchVerse(session.modeConfig.books);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [session?.currentRound, session?.gameState, fetchVerse, session?.modeConfig]);

  if (!session) return null;

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
    submitGuess(guess, currentVerse, breakdown.total, breakdown);
  };

  const handleNextRound = () => {
    setCurrentVerse(null);
    nextRound();
  };

  const handleExitToHome = () => {
    resetGame();
    router.push('/');
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
    <div className="min-h-screen flex flex-col">
      <header className="mx-auto w-full max-w-5xl px-4 pt-5 sm:px-6 sm:pt-7">
        <div className="surface-card flex items-center justify-between p-3 sm:p-4">
          <button
            onClick={handleExitToHome}
            className="btn-ghost inline-flex items-center gap-2 px-2 py-1"
          >
            <span>✕</span> Exit
          </button>
          <span className="text-amber-100 font-semibold text-sm sm:text-base">
            Round {session.currentRound} of {session.totalRounds}
          </span>
          <button
            onClick={() => setIsPaused(true)}
            className="btn-outline px-3 py-1.5 text-sm"
          >
            Pause
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-5xl mx-auto w-full">
        <VerseDisplay
          verse={currentVerse}
          isLoading={isLoadingVerse}
          error={verseError}
          onRetry={() => session.modeConfig && fetchVerse(session.modeConfig.books)}
        />

        {currentVerse && !isLoadingVerse && (
          <GuessInterface modeConfig={session.modeConfig} onSubmit={handleSubmitGuess} />
        )}
      </div>

      {isPaused && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="surface-card w-full max-w-md p-7 text-center fade-up">
            <p className="eyebrow mb-2">Pause</p>
            <h2 className="headline-serif text-3xl text-amber-100 mb-5">Game Paused</h2>
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
