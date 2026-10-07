'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GuessInterface from '@/components/GuessInterface';
import VerseDisplay from '@/components/VerseDisplay';
import PartyGameSummary from '@/components/PartyGameSummary';
import ScoreBar from '@/components/ScoreBar';
import {
  finalizeExpiredPartyRound,
  getPartyRoom,
  hostAdvancePartyRound,
  hostReturnPartyToLobby,
  leaveParty,
  PARTY_ROUND_START_DELAY_MS,
  PartyRoom,
  PartySubmission,
  PartyVerse,
  submitPartyRound,
  subscribeToParty,
} from '@/lib/partyEngine';
import { ensureFirebaseSession, getFirebaseAuth } from '@/lib/firebaseClient';
import { readClientId, readLocalProfile } from '@/lib/userProfile';
import { gameModes } from '@/lib/gameModes';
import { bibleData, BookData } from '@/lib/bibleData';
import { calculateScore } from '@/lib/scoring';
import { fetchVerseTextByReference } from '@/lib/verseClient';
import {
  buildVerseReferencePool,
  getShuffledAvailableVerseReferences,
  verseReferenceKey,
} from '@/lib/verseSelection';

const PARTY_CODE_STORAGE_KEY = 'bg-party-room-code-v1';

type PartyGuess = {
  book: string;
  chapter: number;
  verse: number;
};

type VerseInfo = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

type PendingSelection = {
  guess: PartyGuess | null;
  hasInteracted: boolean;
};

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

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toOverallPercent(totalScore: number, roundsPlayed: number) {
  if (roundsPlayed <= 0) return 0;
  return clampPercent((totalScore / (roundsPlayed * 100)) * 100);
}

function resolveRoundServerStartedAtMs(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (value && typeof value === 'object') {
    const valueWithToMillis = value as { toMillis?: unknown };
    if (typeof valueWithToMillis.toMillis === 'function') {
      return valueWithToMillis.toMillis();
    }

    const timestampLike = value as { seconds?: unknown; nanoseconds?: unknown };
    if (typeof timestampLike.seconds === 'number') {
      const nanos = typeof timestampLike.nanoseconds === 'number' ? timestampLike.nanoseconds : 0;
      return timestampLike.seconds * 1000 + Math.floor(nanos / 1_000_000);
    }
  }

  return null;
}

function resolveSharedRoundStartMs(game: { roundStartedAt: number; roundServerStartedAt?: unknown }) {
  const serverStartedAtMs = resolveRoundServerStartedAtMs(game.roundServerStartedAt);
  if (typeof serverStartedAtMs === 'number') {
    return serverStartedAtMs + PARTY_ROUND_START_DELAY_MS;
  }

  return game.roundStartedAt;
}

async function buildRandomPartyVerseFromPool(
  books: BookData[],
  excludedKeys: Set<string>
): Promise<PartyVerse | null> {
  const references = getShuffledAvailableVerseReferences(buildVerseReferencePool(books), excludedKeys);
  for (const pick of references) {
    const text = await fetchVerseTextByReference(pick.book, pick.chapter, pick.verse);
    if (text) {
      return {
        book: pick.book,
        chapter: pick.chapter,
        verse: pick.verse,
        text,
      };
    }
  }
  return null;
}

export default function PartyGameClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = (searchParams.get('code') ?? '').toUpperCase();

  const profile = useMemo(() => readLocalProfile(), []);
  const clientId = useMemo(() => readClientId(), []);
  const [partyMemberId, setPartyMemberId] = useState(clientId);

  const [room, setRoom] = useState<PartyRoom | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isReturningToLobby, setIsReturningToLobby] = useState(false);
  const [previousVerses, setPreviousVerses] = useState<VerseInfo[]>([]);
  const [nextVerses, setNextVerses] = useState<VerseInfo[]>([]);
  const [loadingNeighbor, setLoadingNeighbor] = useState<NeighborDirection | null>(null);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection>({
    guess: null,
    hasInteracted: false,
  });

  const timeoutSubmittedRoundRef = useRef<number | null>(null);
  const previousRoundRef = useRef<number | null>(null);
  const submissionInFlightRoundRef = useRef<number | null>(null);

  useEffect(() => {
    if (!code) return;

    const unsubscribe = subscribeToParty(
      code,
      nextRoom => {
        setRoom(nextRoom);
        setLoaded(true);
        if (!nextRoom) setError('Party room not found.');
        else setError(null);
      },
      () => {
        setLoaded(true);
        setError('Realtime connection to this party was interrupted. Retrying…');
      }
    );

    return () => unsubscribe();
  }, [code]);

  useEffect(() => {
    let cancelled = false;

    const resolveId = async () => {
      await ensureFirebaseSession();
      const authUid = getFirebaseAuth()?.currentUser?.uid;
      if (!cancelled) {
        setPartyMemberId(authUid ?? clientId);
      }
    };

    void resolveId();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const game = room?.game;
  const myMember = useMemo(() => room?.members.find(member => member.id === partyMemberId) ?? null, [partyMemberId, room?.members]);
  const isHost = Boolean(myMember?.isHost || room?.hostId === partyMemberId);

  const modeConfig = useMemo(() => {
    if (!game) return null;
    const baseMode = gameModes[game.modeId] ?? null;
    if (!baseMode) return null;

    if (game.modeId === 'book-selection' && game.selectedBook) {
      const selectedBookData = bibleData.find(book => book.book === game.selectedBook);
      if (selectedBookData) {
        return {
          ...baseMode,
          books: [selectedBookData],
        };
      }
    }

    if (game.modeId === 'custom' && Array.isArray(game.selectedBooks) && game.selectedBooks.length > 0) {
      const selectedBooks = bibleData.filter(book => game.selectedBooks?.includes(book.book));
      if (selectedBooks.length > 0) {
        return {
          ...baseMode,
          books: selectedBooks,
        };
      }
    }

    return baseMode;
  }, [game]);

  const verse = game?.roundVerse ?? null;
  const mySubmission = game?.submissions?.[partyMemberId] ?? null;
  const contextPenalty = (previousVerses.length + nextVerses.length) * 10;
  const hasTimer = (game?.timerDurationSeconds ?? 0) > 0;


  const refreshPartyRoom = useCallback(async () => {
    if (!code) return;
    const latest = await getPartyRoom(code);
    if (latest) {
      setRoom(latest);
      setLoaded(true);
      setError(null);
    }
  }, [code]);

  useEffect(() => {
    if (!code || !game) return;
    const refresh = () => { void refreshPartyRoom(); };
    const onVisibility = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    const shouldPoll = game.status === 'round-complete' || Boolean(mySubmission);
    const interval = shouldPoll ? window.setInterval(refresh, 1500) : null;
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
      if (interval !== null) window.clearInterval(interval);
    };
  }, [code, game, mySubmission, refreshPartyRoom]);

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

  useEffect(() => {
    const resetRoundUi = () => {
      setPreviousVerses([]);
      setNextVerses([]);
      setLoadingNeighbor(null);
      setPendingSelection({ guess: null, hasInteracted: false });
    };

    if (!game || game.status !== 'in-round') {
      previousRoundRef.current = null;
      const timer = window.setTimeout(resetRoundUi, 0);
      return () => window.clearTimeout(timer);
    }

    if (previousRoundRef.current !== game.currentRound) {
      previousRoundRef.current = game.currentRound;
      const timer = window.setTimeout(resetRoundUi, 0);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [game, game?.currentRound, game?.status]);

  useEffect(() => {
    if (!game || game.status !== 'in-round') {
      timeoutSubmittedRoundRef.current = null;
      return;
    }

    if (game.timerDurationSeconds <= 0) {
      return;
    }

    const tick = () => {
      const sharedRoundStartMs = resolveSharedRoundStartMs(game);
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - sharedRoundStartMs) / 1000));
      const next = Math.max(0, game.timerDurationSeconds - elapsedSeconds);
      setRemainingSeconds(next);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [game, game?.currentRound, game?.roundStartedAt, game?.status, game?.timerDurationSeconds]);

  const submitRoundScore = useCallback(async (
    score: number,
    baseScore: number,
    wasBlankGuess = false,
    guess?: PartyGuess,
    feedback?: {
      book: 'correct' | 'close' | 'wrong';
      chapter: 'correct' | 'close' | 'wrong';
      verse: 'correct' | 'close' | 'wrong';
      chaptersOff: number;
      versesOff: number;
    }
  ): Promise<boolean> => {
    if (!code || !game) return false;
    const round = game.currentRound;
    if (submissionInFlightRoundRef.current === round) return true;
    submissionInFlightRoundRef.current = round;

    try {
      const ok = await submitPartyRound(code, partyMemberId, round, {
        playerName: myMember?.name || profile.name,
        score,
        baseScore,
        wasBlankGuess,
        guess,
        feedback,
      });
      if (ok) {
        setError(null);
        return true;
      }

      console.warn('Round score was not accepted; retrying as zero points.');
      const zeroOk = await submitPartyRound(code, partyMemberId, round, {
        playerName: myMember?.name || profile.name,
        score: 0,
        baseScore: 0,
        wasBlankGuess: true,
      });
      setError(null);
      return zeroOk;
    } catch (submitError) {
      console.warn('Round score submission failed; retrying as zero points.', submitError);
      try {
        const zeroOk = await submitPartyRound(code, partyMemberId, round, {
          playerName: myMember?.name || profile.name,
          score: 0,
          baseScore: 0,
          wasBlankGuess: true,
        });
        setError(null);
        return zeroOk;
      } catch (zeroError) {
        console.warn('Zero-point fallback submission also failed.', zeroError);
        setError(null);
        return false;
      }
    } finally {
      if (submissionInFlightRoundRef.current === round) submissionInFlightRoundRef.current = null;
    }
  }, [code, game, myMember?.name, partyMemberId, profile.name])

  useEffect(() => {
    if (!game || !verse || !modeConfig) return;
    if (game.status !== 'in-round') return;
    if (game.timerDurationSeconds <= 0) return;
    if (mySubmission) return;
    const sharedRoundStartMs = resolveSharedRoundStartMs(game);
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - sharedRoundStartMs) / 1000));
    const secondsLeft = Math.max(0, game.timerDurationSeconds - elapsedSeconds);
    if (secondsLeft > 0) return;
    if (timeoutSubmittedRoundRef.current === game.currentRound) return;

    const timer = window.setTimeout(() => {
      timeoutSubmittedRoundRef.current = game.currentRound;

      const runTimeoutSubmit = async () => {
        const timeoutGuess = pendingSelection.guess;
        let submitted = false;

        if (timeoutGuess) {
          const breakdown = calculateScore(
            { book: verse.book, chapter: verse.chapter, verse: verse.verse },
            timeoutGuess,
            modeConfig.books
          );

          const contextVersesAdded = previousVerses.length + nextVerses.length;
          const penalty = contextVersesAdded * 10;
          const adjustedTotal = Math.max(0, breakdown.total - penalty);
          submitted = await submitRoundScore(adjustedTotal, breakdown.total, false, timeoutGuess, breakdown.feedback);
        } else {
          submitted = await submitRoundScore(0, 0, true);
        }

        if (!submitted && timeoutSubmittedRoundRef.current === game.currentRound) {
          timeoutSubmittedRoundRef.current = null;
        }
      };

      void runTimeoutSubmit();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    game,
    modeConfig,
    mySubmission,
    nextVerses.length,
    pendingSelection.guess,
    previousVerses.length,
    remainingSeconds,
    submitRoundScore,
    verse,
  ]);

  useEffect(() => {
    if (!code || !game || game.status !== 'in-round') return;
    if (game.timerDurationSeconds <= 0 || remainingSeconds > 0) return;
    const round = game.currentRound;
    const timer = window.setTimeout(() => {
      void (async () => {
        await finalizeExpiredPartyRound(code, partyMemberId, round);
        await refreshPartyRoom();
      })();
    }, 650);
    return () => window.clearTimeout(timer);
  }, [code, game, partyMemberId, refreshPartyRoom, remainingSeconds]);

  const handleAddNeighborVerse = useCallback(async (direction: NeighborDirection) => {
    if (!verse || loadingNeighbor || game?.status !== 'in-round') return;

    const seedVerse = direction === 'previous'
      ? previousVerses[0] ?? verse
      : nextVerses[nextVerses.length - 1] ?? verse;

    const targetRef = resolveNeighborVerse(seedVerse.book, seedVerse.chapter, seedVerse.verse, direction);
    if (!targetRef) return;

    setLoadingNeighbor(direction);
    const data = await fetchVerseByReference(targetRef);
    if (data) {
      if (direction === 'previous') setPreviousVerses(prev => [data, ...prev]);
      else setNextVerses(prev => [...prev, data]);
    }
    setLoadingNeighbor(null);
  }, [fetchVerseByReference, game?.status, loadingNeighbor, nextVerses, previousVerses, verse]);

  const handleSubmitGuess = useCallback(async (guess: { book: string; chapter: number; verse: number }) => {
    if (!game || !verse || !modeConfig || !myMember) return;

    const breakdown = calculateScore(
      { book: verse.book, chapter: verse.chapter, verse: verse.verse },
      guess,
      modeConfig.books
    );

    const contextVersesAdded = previousVerses.length + nextVerses.length;
    const penalty = contextVersesAdded * 10;
    const adjustedTotal = Math.max(0, breakdown.total - penalty);

    await submitRoundScore(adjustedTotal, breakdown.total, false, guess, breakdown.feedback);
  }, [game, modeConfig, myMember, nextVerses.length, previousVerses.length, submitRoundScore, verse]);

  const handleHostAdvance = async () => {
    if (!room || !game || !modeConfig || !isHost) return;

    setIsAdvancing(true);

    if (game.currentRound >= game.totalRounds) {
      const ok = await hostAdvancePartyRound(room.code, partyMemberId);
      if (!ok) setError('Unable to finish game. Please try again.');
      setIsAdvancing(false);
      return;
    }

    const excluded = new Set<string>(Array.isArray(game.usedVerseKeys) ? game.usedVerseKeys : []);
    excluded.add(verseReferenceKey(game.roundVerse));
    const nextVerse = await buildRandomPartyVerseFromPool(modeConfig.books, excluded);
    if (!nextVerse) {
      setError('Failed to load a unique verse for the next round.');
      setIsAdvancing(false);
      return;
    }

    const ok = await hostAdvancePartyRound(room.code, partyMemberId, nextVerse);
    if (!ok) setError('Unable to move to next round. Please try again.');
    setIsAdvancing(false);
  };

  const handleHostReturnToLobby = async () => {
    if (!room || !isHost) return;

    setIsReturningToLobby(true);
    const ok = await hostReturnPartyToLobby(room.code, partyMemberId);
    if (!ok) {
      setError('Unable to return party to lobby. Please try again.');
      setIsReturningToLobby(false);
      return;
    }

    setIsReturningToLobby(false);
  };

  const handleExitParty = async () => {
    if (!room) return;

    const shouldLeave = window.confirm('Are you sure you want to leave the lobby?');
    if (!shouldLeave) return;

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(PARTY_CODE_STORAGE_KEY);
    }
    try {
      await leaveParty(room.code, partyMemberId);
    } catch (error) {
      console.error('Unable to leave party cleanly before navigation:', error);
    } finally {
      router.push('/multiplayer?tab=party');
    }
  };

  useEffect(() => {
    if (!room || !room.code) return;
    if (room.game) return;
    router.push(`/multiplayer?tab=party&code=${room.code}`);
  }, [room, router]);

  const submittedCount = Object.keys(game?.submissions ?? {}).length;
  const totalPlayers = room?.members.length ?? 0;
  const roundRows = useMemo(() => {
    if (!room || !game) return [];

    return room.members
      .map(member => {
        const submission = game.submissions[member.id];
        return {
          member,
          submission,
          roundScore: game.roundScores[member.id] ?? submission?.score ?? 0,
          totalScore: game.scores[member.id] ?? 0,
        };
      })
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (b.roundScore !== a.roundScore) return b.roundScore - a.roundScore;
        return a.member.name.localeCompare(b.member.name);
      });
  }, [game, room]);

  const renderSubmissionGuess = (submission: PartySubmission, revealAccuracy: boolean) => {
    if (submission.wasBlankGuess || !submission.guess || !submission.feedback) {
      return revealAccuracy
        ? <span style={{ color: '#ef4444' }}>No guess (time expired)</span>
        : <span className="content-muted">No guess (time expired)</span>;
    }

    if (!revealAccuracy) {
      return <>{submission.guess.book} {submission.guess.chapter}:{submission.guess.verse}</>;
    }

    const bookCorrect = submission.feedback.book === 'correct';
    const chapterCorrect = bookCorrect && submission.feedback.chapter === 'correct';
    const verseCorrect = chapterCorrect && submission.feedback.verse === 'correct';

    return (
      <>
        <span style={{ color: bookCorrect ? '#22c55e' : '#ef4444' }}>{submission.guess.book}</span>
        <span>&nbsp;</span>
        <span style={{ color: chapterCorrect ? '#22c55e' : '#ef4444' }}>{submission.guess.chapter}</span>
        <span style={{ color: chapterCorrect ? '#22c55e' : '#ef4444' }}>:</span>
        <span style={{ color: verseCorrect ? '#22c55e' : '#ef4444' }}>{submission.guess.verse}</span>
      </>
    );
  };

  if (!code) {
    return (
      <main className="app-screen">
        <div className="app-content app-content-scroll">
          <div className="page max-w-3xl">
            <section className="surface-card p-5">Missing party code. Open Multiplayer and join a party first.</section>
          </div>
        </div>
      </main>
    );
  }

  if (!loaded) {
    return (
      <main className="app-screen">
        <div className="app-content app-content-scroll">
          <div className="page max-w-3xl">
            <section className="surface-card p-5">Loading party game…</section>
          </div>
        </div>
      </main>
    );
  }

  if (!room || !game || !modeConfig) {
    return (
      <main className="app-screen">
        <header className="topbar">
          <button onClick={() => router.push('/multiplayer')} className="btn-outline px-3 py-2 text-sm">Back</button>
          <div className="font-semibold">Party Game</div>
          <span className="topbar-placeholder" aria-hidden="true" />
        </header>
        <div className="app-content app-content-scroll">
          <div className="page max-w-3xl">
            <section className="surface-card p-5">
              <p className="font-semibold mb-2">No active party game.</p>
              <p className="content-muted text-sm mb-4">Have the host start a game from the Party tab in Multiplayer.</p>
              <button onClick={() => router.push(code ? `/multiplayer?tab=party&code=${code}` : '/multiplayer?tab=party')} className="btn-primary px-4 py-2">Go to Multiplayer</button>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-screen game-shell">
      <header className="game-topbar">
        <div className="game-topbar-exit">
          <button
            onClick={() => void (isHost ? handleHostReturnToLobby() : handleExitParty())}
            className="btn-outline px-3 py-1.5 text-sm"
          >
            {isHost ? 'End Game' : 'Exit'}
          </button>
        </div>
        <p className="game-topbar-round">
          {game.status === 'finished' ? (
            'Game Summary'
          ) : (
            <>{modeConfig.name} · Round {game.currentRound}/{game.totalRounds} {contextPenalty > 0 && <span className="text-[var(--danger)]"> (-{contextPenalty})</span>}</>
          )}
        </p>
        <div className="game-topbar-actions">
          <p className="game-topbar-time">{game.status === 'in-round' ? (hasTimer ? formatTime(remainingSeconds) : 'None') : '--:--'}</p>
        </div>
      </header>

      <div className={`app-content ${game.status === 'finished' ? 'app-content-scroll' : 'app-content-fixed'} game-content`}>
        <div className="page !max-w-6xl w-full">
          {error && (
            <section className="surface-card p-3">
              <p className="text-sm text-[var(--danger)]">{error}</p>
            </section>
          )}

          {game.status === 'in-round' && verse && (
            mySubmission ? (
              <section className="party-round-summary-fixed">
                <div className="party-round-summary-header">
                  <section className="surface-card party-round-verse-card">
                    <p className="text-base sm:text-lg leading-relaxed italic">&ldquo;{verse.text}&rdquo;</p>
                  </section>
                  <section className="surface-card party-round-answer-card">
                    <p className="text-center text-[2rem] sm:text-[2.7rem] lg:text-[3rem] font-black leading-[0.98] tracking-[0.08em]">
                      ________
                    </p>
                  </section>
                </div>

                <div className="party-round-scores-scroll">
                  {roundRows.map(({ member, submission, roundScore, totalScore }) => (
                    <div key={member.id} className="party-round-table-row">
                      <div className="party-round-table-meta">
                        <p className="text-sm font-semibold">{member.name}</p>
                        <p className="text-sm whitespace-nowrap overflow-x-auto">
                          {submission ? renderSubmissionGuess(submission, false) : <span className="content-muted">Waiting…</span>}
                        </p>
                      </div>
                      {submission ? (
                        <div className="party-round-score-stack">
                          <p className="party-round-table-score">{clampPercent(roundScore)}%</p>
                          <ScoreBar score={roundScore} className="score-bar-compact" label={`${member.name} round score`} />
                          <p className="text-xs content-muted">total {toOverallPercent(totalScore, game.currentRound)}%</p>
                        </div>
                      ) : (
                        <span className="party-round-table-score content-muted">--</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <div className="play-layout">
                <div className="play-verse">
                  <VerseDisplay
                    verse={verse}
                    previousVerses={previousVerses}
                    nextVerses={nextVerses}
                    isLoading={false}
                    error={null}
                    isLoadingNeighbor={loadingNeighbor}
                    onAddPrevious={() => void handleAddNeighborVerse('previous')}
                    onAddNext={() => void handleAddNeighborVerse('next')}
                    onRetry={() => undefined}
                  />
                </div>

                <div className="play-guess">
                  <GuessInterface
                    modeConfig={modeConfig}
                    onSubmit={guess => void handleSubmitGuess(guess)}
                    onSelectionChange={setPendingSelection}
                  />
                </div>
              </div>
            )
          )}

          {game.status === 'round-complete' && (
            <section className="party-round-summary-fixed">
              <div className="party-round-summary-header">
                <section className="surface-card party-round-verse-card">
                  <p className="text-base sm:text-lg leading-relaxed italic">&ldquo;{verse?.text}&rdquo;</p>
                </section>
                <section className="surface-card party-round-answer-card">
                  <p className="text-center text-[2rem] sm:text-[2.7rem] lg:text-[3rem] font-black leading-[0.98]">
                    {verse?.book} {verse?.chapter}:{verse?.verse}
                  </p>
                </section>
              </div>

              <div className="party-round-scores-scroll">
                {roundRows.map(({ member, submission, roundScore, totalScore }) => (
                  <div key={member.id} className="party-round-table-row">
                    <div className="party-round-table-meta">
                      <p className="text-sm font-semibold">{member.name}</p>
                      <p className="text-sm whitespace-nowrap overflow-x-auto">
                        {submission ? renderSubmissionGuess(submission, true) : <span style={{ color: '#ef4444' }}>No guess</span>}
                      </p>
                    </div>
                    <div className="party-round-score-stack">
                      <p className="party-round-table-score">{clampPercent(roundScore)}%</p>
                      <ScoreBar score={roundScore} className="score-bar-compact" label={`${member.name} round score`} />
                      <p className="text-xs content-muted">total {toOverallPercent(totalScore, game.currentRound)}%</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="party-round-summary-footer">
                {isHost ? (
                  <button
                    onClick={() => void handleHostAdvance()}
                    disabled={isAdvancing}
                    className="btn-primary w-full py-3 text-lg"
                  >
                    {isAdvancing
                      ? 'Preparing...'
                      : game.currentRound >= game.totalRounds
                        ? 'Game Summary'
                        : 'Start Next Round'}
                  </button>
                ) : (
                  <p className="content-muted text-sm text-center">Waiting for host to continue...</p>
                )}
              </div>
            </section>
          )}

          {game.status === 'finished' && (
            <PartyGameSummary
              room={room}
              game={game}
              isHost={isHost}
              isReturningToLobby={isReturningToLobby}
              onReturnToLobby={() => void handleHostReturnToLobby()}
            />
          )}
        </div>
      </div>
    </main>
  );
}
