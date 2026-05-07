'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GuessInterface from '@/components/GuessInterface';
import VerseDisplay from '@/components/VerseDisplay';
import {
  hostAdvancePartyRound,
  PartyRoom,
  PartyVerse,
  submitPartyRound,
  subscribeToParty,
} from '@/lib/partyEngine';
import { readClientId, readLocalProfile } from '@/lib/userProfile';
import { gameModes } from '@/lib/gameModes';
import { BookData } from '@/lib/bibleData';
import { calculateScore } from '@/lib/scoring';
import { fetchVerseTextByReference } from '@/lib/verseClient';

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

  const [room, setRoom] = useState<PartyRoom | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const timeoutSubmittedRoundRef = useRef<number | null>(null);

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

  const game = room?.game;
  const myMember = useMemo(() => room?.members.find(member => member.id === clientId) ?? null, [clientId, room?.members]);
  const isHost = Boolean(myMember?.isHost || room?.hostId === clientId);

  const modeConfig = useMemo(() => {
    if (!game) return null;
    return gameModes[game.modeId] ?? null;
  }, [game]);

  const verse = game?.roundVerse ?? null;
  const mySubmission = game?.submissions?.[clientId] ?? null;

  useEffect(() => {
    if (!game || game.status !== 'in-round') {
      timeoutSubmittedRoundRef.current = null;
      return;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - game.roundStartedAt) / 1000);
      const next = Math.max(0, game.timerDurationSeconds - elapsed);
      setRemainingSeconds(next);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [game, game?.currentRound, game?.roundStartedAt, game?.status, game?.timerDurationSeconds]);

  const submitRoundScore = useCallback(async (score: number, baseScore: number, wasBlankGuess = false) => {
    if (!code || !myMember) return;

    const ok = await submitPartyRound(code, clientId, {
      playerName: myMember.name || profile.name,
      score,
      baseScore,
      wasBlankGuess,
    });

    if (!ok) {
      setError('Failed to submit round score. Please try again.');
    }
  }, [clientId, code, myMember, profile.name]);

  useEffect(() => {
    if (!game || !verse || !modeConfig) return;
    if (game.status !== 'in-round') return;
    if (mySubmission) return;
    if (remainingSeconds > 0) return;
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
      const ok = await hostAdvancePartyRound(room.code, clientId);
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

    const ok = await hostAdvancePartyRound(room.code, clientId, nextVerse);
    if (!ok) setError('Unable to move to next round. Please try again.');
    setIsAdvancing(false);
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
              <button onClick={() => router.push('/multiplayer')} className="btn-primary px-4 py-2">Go to Multiplayer</button>
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
          <button onClick={() => router.push('/multiplayer')} className="btn-outline px-3 py-1.5 text-sm">Back</button>
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
              <h2 className="headline-serif text-3xl mb-2">Party Game Complete</h2>
              <p className="content-muted mb-4">Final scores</p>

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

              <button onClick={() => router.push('/multiplayer')} className="btn-primary w-full py-3 text-lg">
                Back to Party Lobby
              </button>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
