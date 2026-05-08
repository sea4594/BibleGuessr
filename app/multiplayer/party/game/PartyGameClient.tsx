'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GuessInterface from '@/components/GuessInterface';
import VerseDisplay from '@/components/VerseDisplay';
import {
  hostAdvancePartyRound,
  hostReturnPartyToLobby,
  leaveParty,
  PartyRoom,
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

const PARTY_CODE_STORAGE_KEY = 'bg-party-room-code-v1';

function pickRandomVerse(books: BookData[]): { book: BookData; chapter: number; verse: number } {
  const book = books[Math.floor(Math.random() * books.length)];
  const chapterData = book.chapters[Math.floor(Math.random() * book.chapters.length)];
  const chapter = parseInt(chapterData.chapter, 10);
  const verseCount = parseInt(chapterData.verses, 10);
  const verse = Math.floor(Math.random() * verseCount) + 1;
  return { book, chapter, verse };
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

async function buildRandomPartyVerse(books: BookData[]): Promise<PartyVerse | null> {
  let attempts = 0;
  while (attempts < 8) {
    const pick = pickRandomVerse(books);
    const text = await fetchVerseTextByReference(pick.book.book, pick.chapter, pick.verse);
    if (text) {
      return {
        book: pick.book.book,
        chapter: pick.chapter,
        verse: pick.verse,
        text,
      };
    }
    attempts += 1;
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

  const timeoutSubmittedRoundRef = useRef<number | null>(null);
  const localRoundSeenRef = useRef<{ round: number; seenAt: number } | null>(null);

  useEffect(() => {
    if (!code) return;

    const unsubscribe = subscribeToParty(code, nextRoom => {
      setRoom(nextRoom);
      setLoaded(true);
      if (!nextRoom) setError('Party room not found.');
      else setError(null);
    });

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

    return baseMode;
  }, [game]);

  const verse = game?.roundVerse ?? null;
  const mySubmission = game?.submissions?.[partyMemberId] ?? null;

  useEffect(() => {
    if (!game || game.status !== 'in-round') {
      localRoundSeenRef.current = null;
      return;
    }

    if (!localRoundSeenRef.current || localRoundSeenRef.current.round !== game.currentRound) {
      localRoundSeenRef.current = {
        round: game.currentRound,
        seenAt: Date.now(),
      };
    }
  }, [game, game?.currentRound, game?.status]);

  useEffect(() => {
    if (!game || game.status !== 'in-round') {
      timeoutSubmittedRoundRef.current = null;
      return;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - game.roundStartedAt) / 1000);
      const localSeenAt = localRoundSeenRef.current?.round === game.currentRound
        ? localRoundSeenRef.current.seenAt
        : Date.now();
      const localElapsed = Math.floor((Date.now() - localSeenAt) / 1000);
      const sharedRemaining = game.timerDurationSeconds - elapsed;
      const localRemaining = game.timerDurationSeconds - localElapsed;
      const next = Math.max(0, Math.max(sharedRemaining, localRemaining));
      setRemainingSeconds(next);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [game, game?.currentRound, game?.roundStartedAt, game?.status, game?.timerDurationSeconds]);

  const submitRoundScore = useCallback(async (score: number, baseScore: number, wasBlankGuess = false) => {
    if (!code || !myMember) return;

    const ok = await submitPartyRound(code, partyMemberId, {
      playerName: myMember.name || profile.name,
      score,
      baseScore,
      wasBlankGuess,
    });

    if (!ok) {
      setError('Failed to submit round score. Please try again.');
    }
  }, [code, myMember, partyMemberId, profile.name]);

  useEffect(() => {
    if (!game || !verse || !modeConfig) return;
    if (game.status !== 'in-round') return;
    if (mySubmission) return;
    const secondsLeftNow = Math.max(0, game.timerDurationSeconds - Math.floor((Date.now() - game.roundStartedAt) / 1000));
    const localSeenAt = localRoundSeenRef.current?.round === game.currentRound
      ? localRoundSeenRef.current.seenAt
      : Date.now();
    const locallyExpired = (Date.now() - localSeenAt) >= game.timerDurationSeconds * 1000;
    if (secondsLeftNow > 0 || !locallyExpired) return;
    if (timeoutSubmittedRoundRef.current === game.currentRound) return;

    timeoutSubmittedRoundRef.current = game.currentRound;
    void submitRoundScore(0, 0, true);
  }, [game, modeConfig, mySubmission, remainingSeconds, submitRoundScore, verse]);

  const handleSubmitGuess = async (guess: { book: string; chapter: number; verse: number }) => {
    if (!game || !verse || !modeConfig || !myMember) return;

    const bookData = modeConfig.books.find(b => b.book === verse.book) ?? modeConfig.books[0];
    const breakdown = calculateScore(
      { book: verse.book, chapter: verse.chapter, verse: verse.verse },
      guess,
      bookData,
      modeConfig.scoringType
    );

    await submitRoundScore(breakdown.total, breakdown.total, false);
  };

  const handleHostAdvance = async () => {
    if (!room || !game || !modeConfig || !isHost) return;

    setIsAdvancing(true);

    if (game.currentRound >= game.totalRounds) {
      const ok = await hostAdvancePartyRound(room.code, partyMemberId);
      if (!ok) setError('Unable to finish game. Please try again.');
      setIsAdvancing(false);
      return;
    }

    const nextVerse = await buildRandomPartyVerse(modeConfig.books);
    if (!nextVerse) {
      setError('Failed to load a verse for the next round.');
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
    if (!room || isHost) return;

    const shouldLeave = window.confirm('Are you sure you want to leave the party?');
    if (!shouldLeave) return;

    await leaveParty(room.code, partyMemberId);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(PARTY_CODE_STORAGE_KEY);
    }
    router.push('/multiplayer?tab=party');
  };

  useEffect(() => {
    if (!room || !room.code) return;
    if (room.game) return;
    router.push(`/multiplayer?tab=party&code=${room.code}`);
  }, [room, router]);

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

  const submittedCount = Object.keys(game.submissions ?? {}).length;
  const totalPlayers = room.members.length;

  return (
    <main className="app-screen game-shell">
      <header className="game-topbar">
        <div className="game-topbar-exit">
          {!isHost ? (
            <button onClick={() => void handleExitParty()} className="btn-outline px-3 py-1.5 text-sm">Exit</button>
          ) : (
            <span className="topbar-placeholder" aria-hidden="true" />
          )}
        </div>
        <p className="game-topbar-round">
          {modeConfig.name} · Round {game.currentRound}/{game.totalRounds}
        </p>
        <div className="game-topbar-actions">
          <p className="game-topbar-time">{game.status === 'in-round' ? formatTime(remainingSeconds) : '--:--'}</p>
        </div>
      </header>

      <div className="app-content app-content-fixed game-content">
        <div className="page !max-w-6xl w-full">
          {error && (
            <section className="surface-card p-3">
              <p className="text-sm text-[var(--danger)]">{error}</p>
            </section>
          )}

          {game.status === 'in-round' && verse && (
            <div className="play-layout">
              <div className="play-verse">
                <VerseDisplay
                  verse={verse}
                  previousVerses={[]}
                  nextVerses={[]}
                  isLoading={false}
                  error={null}
                  isLoadingNeighbor={null}
                  onAddPrevious={() => undefined}
                  onAddNext={() => undefined}
                  onRetry={() => undefined}
                  showContextControls={false}
                />
              </div>

              <div className="play-guess">
                {!mySubmission ? (
                  <>
                    <GuessInterface modeConfig={modeConfig} onSubmit={guess => void handleSubmitGuess(guess)} />
                    <p className="content-muted text-xs mt-2">All players answer this round simultaneously.</p>
                  </>
                ) : (
                  <section className="surface-card p-5 party-wait-card">
                    <h2 className="headline-serif text-2xl mb-2">Submitted</h2>
                    <p className="content-muted mb-4">Your score for this round: <strong>{mySubmission.score}</strong></p>
                    <p className="text-sm font-semibold mb-2">Waiting for other players ({submittedCount}/{totalPlayers})</p>
                    <div className="grid gap-2">
                      {room.members.map(member => {
                        const submission = game.submissions[member.id];
                        return (
                          <div key={member.id} className="party-score-row">
                            <span>{member.name}</span>
                            <span className="font-semibold">{submission ? submission.score : 'Waiting…'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            </div>
          )}

          {game.status === 'round-complete' && (
            <section className="surface-card p-5 party-round-summary">
              <h2 className="headline-serif text-3xl mb-2">Round {game.currentRound} Complete</h2>
              <p className="content-muted mb-4">Round scores update live as each player submits.</p>

              <div className="grid gap-2 mb-4">
                {room.members.map(member => (
                  <div key={member.id} className="party-score-row">
                    <span>{member.name}</span>
                    <span className="font-semibold">Round {game.roundScores[member.id] ?? 0} · Total {game.scores[member.id] ?? 0}</span>
                  </div>
                ))}
              </div>

              {isHost ? (
                <button
                  onClick={() => void handleHostAdvance()}
                  disabled={isAdvancing}
                  className="btn-primary w-full py-3 text-lg"
                >
                  {isAdvancing
                    ? 'Preparing...'
                    : game.currentRound >= game.totalRounds
                      ? 'Finish Game'
                      : 'Start Next Round'}
                </button>
              ) : (
                <p className="content-muted text-sm">Waiting for host to start the next round…</p>
              )}
            </section>
          )}

          {game.status === 'finished' && (
            <section className="surface-card p-5 party-round-summary">
              <h2 className="headline-serif text-3xl mb-2">Final Scores</h2>

              <div className="grid gap-2 mb-5">
                {room.members
                  .slice()
                  .sort((a, b) => (game.scores[b.id] ?? 0) - (game.scores[a.id] ?? 0))
                  .map(member => (
                    <div key={member.id} className="party-score-row">
                      <span>{member.name}</span>
                      <span className="font-semibold">{game.scores[member.id] ?? 0}</span>
                    </div>
                  ))}
              </div>

              {isHost ? (
                <button
                  onClick={() => void handleHostReturnToLobby()}
                  disabled={isReturningToLobby}
                  className="btn-primary w-full py-3 text-lg"
                >
                  {isReturningToLobby ? 'Returning...' : 'Back to Party Lobby'}
                </button>
              ) : (
                <p className="content-muted text-sm">Waiting for host to return everyone to the party lobby.</p>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
