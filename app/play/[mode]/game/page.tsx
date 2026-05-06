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
import { Pause } from 'lucide-react';

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
      const prevChapter = chapter - 1;
      const prevChData = bookData.chapters[prevChapter - 1];
      return { book, chapter: prevChapter, verse: parseInt(prevChData?.verses ?? '1', 10) };
    }
    if (bookIndex === 0) return null;
    const prevBook = bibleData[bookIndex - 1];
    const lastCh = prevBook.chapters[prevBook.chapters.length - 1];
    return { book: prevBook.book, chapter: prevBook.chapters.length, verse: parseInt(lastCh.verses, 10) };
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
  const [isLoadingVerse, setIsLoadingVerse] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [verseError, setVerseError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [previousVerses, setPreviousVerses] = useState<VerseInfo[]>([]);
  const [nextVerses, setNextVerses] = useState<VerseInfo[]>([]);
  const [loadingNeighbor, setLoadingNeighbor] = useState<NeighborDirection | null>(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  useEffect(() => {
    if (!session) router.replace('/');
  }, [session, router]);

  useEffect(() => {
    if (!session) return;
    if (session.gameState !== 'summary') return;
    if (session.multiplayer?.lobbyType !== 'hot-seat') return;
    const target = session.returnPath ?? '/multiplayer/hot-seat/gamemode';
    resetGame();
    router.replace(target);
  }, [session, resetGame, router]);

  const fetchVerseByReference = useCallback(async (reference: { book: string; chapter: number; verse: number }) => {
    const apiBook = reference.book.replace(/ /g, '+');
    const names = reference.book === 'Song of Solomon'
      ? [`${apiBook}+${reference.chapter}:${reference.verse}`, `Song+of+Songs+${reference.chapter}:${reference.verse}`]
      : [`${apiBook}+${reference.chapter}:${reference.verse}`];
    for (const name of names) {
      try {
        const res = await fetch(`https://bible-api.com/${name}?translation=kjv`);
        if (!res.ok) continue;
        const data = await res.json();
        if (!data.text) continue;
        return { book: reference.book, chapter: reference.chapter, verse: reference.verse, text: data.text.trim() } satisfies VerseInfo;
      } catch { /* try next */ }
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
      const t = setTimeout(() => void fetchVerse(session.modeConfig.books), 0);
      return () => clearTimeout(t);
    }
  }, [session?.currentRound, session?.gameState, fetchVerse, session?.modeConfig]);

  useEffect(() => {
    if (!currentVerse || isLoadingVerse || isPaused) return;
    const interval = setInterval(() => setElapsedSeconds(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, [currentVerse, isLoadingVerse, isPaused]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (!session) return null;

  const isAlternate = session.multiplayer?.enabled && session.multiplayer.turnStyle === 'alternate';
  const playerCount = session.multiplayer?.players.length ?? 1;
  const displayRound = isAlternate ? Math.ceil(session.currentRound / playerCount) : session.currentRound;
  const displayTotal = isAlternate ? (session.multiplayer?.roundsPerPlayer ?? session.totalRounds) : session.totalRounds;

  const getCurrentPlayerName = () => {
    if (!session.multiplayer?.enabled || session.multiplayer.players.length === 0) return null;
    const completedTurns = session.rounds.length;
    if (session.multiplayer.turnStyle === 'alternate') {
      return session.multiplayer.players[completedTurns % session.multiplayer.players.length];
    }
    const idx = Math.min(Math.floor(completedTurns / session.multiplayer.roundsPerPlayer), session.multiplayer.players.length - 1);
    return session.multiplayer.players[idx];
  };
  const currentPlayerName = getCurrentPlayerName();

  const handleAddNeighborVerse = async (direction: NeighborDirection) => {
    if (!currentVerse || loadingNeighbor) return;
    const seed = direction === 'previous' ? (previousVerses[0] ?? currentVerse) : (nextVerses[nextVerses.length - 1] ?? currentVerse);
    const targetRef = resolveNeighborVerse(seed.book, seed.chapter, seed.verse, direction);
    if (!targetRef) return;
    setLoadingNeighbor(direction);
    const data = await fetchVerseByReference(targetRef);
    if (data) {
      if (direction === 'previous') setPreviousVerses(p => [data, ...p]);
      else setNextVerses(p => [...p, data]);
    }
    setLoadingNeighbor(null);
  };

  const handleSubmitGuess = (guess: { book: string; chapter: number; verse: number }) => {
    if (!currentVerse) return;
    const bookData = session.modeConfig.books.find(b => b.book === currentVerse.book) ?? session.modeConfig.books[0];
    const breakdown = calculateScore(
      { book: currentVerse.book, chapter: currentVerse.chapter, verse: currentVerse.verse },
      guess,
      bookData,
      session.modeConfig.scoringType
    );
    const contextPenalty = (previousVerses.length + nextVerses.length) * 10;
    const adjustedTotal = Math.max(0, breakdown.total - contextPenalty);
    submitGuess(
      guess,
      currentVerse,
      { playerName: currentPlayerName ?? undefined, baseScore: breakdown.total, contextPenalty, contextVersesAdded: previousVerses.length + nextVerses.length },
      adjustedTotal,
      { ...breakdown, baseTotal: breakdown.total, contextPenalty, contextVersesAdded: previousVerses.length + nextVerses.length, total: adjustedTotal }
    );
  };

  const handleNextRound = () => {
    setCurrentVerse(null);
    setElapsedSeconds(0);
    setPreviousVerses([]);
    setNextVerses([]);
    nextRound();
  };

  const handleQuit = () => {
    const destination = session?.returnPath ?? '/';
    resetGame();
    router.push(destination);
  };

  const handlePlayAgain = () => {
    startGame({ mode: modeId, modeConfig: session.modeConfig, totalRounds: session.totalRounds, selectedBook: session.selectedBook });
  };

  if (session.gameState === 'summary') {
    return <GameSummary session={session} onPlayAgain={handlePlayAgain} onHome={handleQuit} />;
  }

  if (session.gameState === 'result') {
    const lastRound = session.rounds[session.rounds.length - 1];
    return (
      <RoundResult
        round={lastRound}
        roundNumber={session.currentRound}
        totalRounds={session.totalRounds}
        onNext={handleNextRound}
        onHome={handleQuit}
        isLastRound={session.currentRound >= session.totalRounds}
      />
    );
  }

  const contextPenalty = (previousVerses.length + nextVerses.length) * 10;

  return (
    <div className="app-screen game-shell">
      {/* Condensed top bar */}
      <header className="game-topbar">
        <span className="game-topbar-round">
          Round {displayRound}/{displayTotal}
          {currentPlayerName && <span className="game-topbar-player"> · {currentPlayerName}</span>}
        </span>
        <span className="game-topbar-time">{formatTime(elapsedSeconds)}</span>
        <button
          onClick={() => setIsPaused(true)}
          className="game-topbar-pause"
          aria-label="Pause"
        >
          <Pause size={15} />
        </button>
      </header>

      <div className="app-content app-content-fixed game-content">
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
                contextPenalty={contextPenalty}
              />
            )}
          </div>
        </div>
      </div>

      {/* Pause overlay */}
      {isPaused && (
        <div className="pause-overlay">
          <div className="pause-card fade-up">
            <h2 className="headline-serif text-2xl mb-1">Paused</h2>
            <p className="content-muted text-sm mb-5">Round {displayRound} of {displayTotal}</p>
            <button onClick={() => setIsPaused(false)} className="btn-primary block w-full py-3 mb-2">
              Resume
            </button>
            <Link href="/profile" className="btn-outline block w-full py-2.5 text-center mb-2">
              Settings
            </Link>
            <button
              onClick={() => setShowQuitConfirm(true)}
              className="btn-outline block w-full py-2.5 text-[var(--danger)]"
            >
              Quit
            </button>
          </div>
        </div>
      )}

      {/* Quit confirmation overlay */}
      {showQuitConfirm && (
        <div className="pause-overlay" style={{ zIndex: 60 }}>
          <div className="pause-card fade-up">
            <h2 className="headline-serif text-xl mb-2">Quit game?</h2>
            <p className="content-muted text-sm mb-5">Your progress will be lost.</p>
            <button onClick={handleQuit} className="btn-primary block w-full py-3 mb-2 bg-[var(--danger)] border-[var(--danger)]">
              Yes, Quit
            </button>
            <button onClick={() => setShowQuitConfirm(false)} className="btn-outline block w-full py-2.5">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
