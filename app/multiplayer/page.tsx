'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import AppTopBar from '@/components/AppTopBar';
import MainBottomNav from '@/components/MainBottomNav';
import HorizontalWheel from '@/components/HorizontalWheel';
import TimerSetupControls from '@/components/TimerSetupControls';
import { readHotSeatSettings, writeHotSeatSettings } from '@/lib/hotSeatSettings';
import { BookData } from '@/lib/bibleData';
import { gameModes, GameModeId } from '@/lib/gameModes';
import {
  endPartyLobby,
  hostParty,
  joinParty,
  leaveParty,
  type PartyLobbySettings,
  PartyRoom,
  PartyVerse,
  startPartyGame,
  subscribeToParty,
  updatePartyLobbySettings,
  upsertPartyMember,
} from '@/lib/partyEngine';
import { ensureFirebaseSession, getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebaseClient';
import { readClientId, readLocalProfile } from '@/lib/userProfile';
import { avatarToDataUri } from '@/lib/avatarSystem';
import { PARTY_TIMER_SECOND_OPTIONS, clampTimerSeconds } from '@/lib/timerOptions';
import { useAccountSync } from '@/lib/accountSync';
import { fetchVerseTextByReference } from '@/lib/verseClient';
import { bibleData } from '@/lib/bibleData';
import { buildVerseReferencePool, getShuffledAvailableVerseReferences } from '@/lib/verseSelection';

const PLAYER_VALUES = [2, 3, 4, 5, 6, 7, 8];
const ROUND_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const PARTY_TIMER_VALUES = PARTY_TIMER_SECOND_OPTIONS;
const MULTIPLAYER_TAB_STORAGE_KEY = 'bg-multiplayer-tab-v1';
const PARTY_CODE_STORAGE_KEY = 'bg-party-room-code-v1';

function readInitialMultiplayerTab() {
  if (typeof window === 'undefined') return 'hot-seat' as const;
  const stored = localStorage.getItem(MULTIPLAYER_TAB_STORAGE_KEY);
  return stored === 'party' ? 'party' : 'hot-seat';
}

function readInitialPartyCode() {
  if (typeof window === 'undefined') return null;
  const stored = (localStorage.getItem(PARTY_CODE_STORAGE_KEY) ?? '').toUpperCase().trim();
  return /^[A-Z]{4}$/.test(stored) ? stored : null;
}

function readInitialTabParam() {
  if (typeof window === 'undefined') return null;
  const requested = new URLSearchParams(window.location.search).get('tab');
  return requested === 'party' || requested === 'hot-seat' ? requested : null;
}

function readInitialCodeParam() {
  if (typeof window === 'undefined') return null;
  const requested = (new URLSearchParams(window.location.search).get('code') ?? '').toUpperCase().trim();
  return /^[A-Z]{4}$/.test(requested) ? requested : null;
}

async function buildRandomPartyVerse(books: BookData[]): Promise<PartyVerse | null> {
  const references = getShuffledAvailableVerseReferences(buildVerseReferencePool(books), new Set());
  for (const picked of references) {
    const text = await fetchVerseTextByReference(picked.book, picked.chapter, picked.verse);
    if (text) {
      return {
        book: picked.book,
        chapter: picked.chapter,
        verse: picked.verse,
        text,
      };
    }
  }

  return null;
}

export default function MultiplayerPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'hot-seat' | 'party'>(() => {
    const requestedTab = readInitialTabParam();
    if (requestedTab === 'party' || requestedTab === 'hot-seat') return requestedTab;
    return readInitialMultiplayerTab();
  });
  const initialHotSeat = useMemo(() => readHotSeatSettings(), []);
  const firebaseConfigured = isFirebaseConfigured();

  const [players, setPlayers] = useState(initialHotSeat.players);
  const [rounds, setRounds] = useState(initialHotSeat.rounds);
  const [turnStyle, setTurnStyle] = useState(initialHotSeat.turnStyle);
  const [names, setNames] = useState<string[]>(initialHotSeat.names);
  const [timerSeconds, setTimerSeconds] = useState(initialHotSeat.timerSeconds);

  const [room, setRoom] = useState<PartyRoom | null>(null);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(() => readInitialCodeParam() ?? readInitialPartyCode());
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState(['', '', '', '']);
  const joinRefs = useRef<Array<HTMLInputElement | null>>([]);

  const { appStateNonce, user } = useAccountSync();
  const [profile, setProfile] = useState(() => readLocalProfile());
  const clientId = useMemo(() => readClientId(), []);
  const [partyMemberId, setPartyMemberId] = useState(clientId);
  const [partyStartError, setPartyStartError] = useState('');
  const [partyStartPending, setPartyStartPending] = useState(false);
  const [partyLobbyError, setPartyLobbyError] = useState('');
  const [partyLobbyPending, setPartyLobbyPending] = useState(false);
  const [partyActionPending, setPartyActionPending] = useState(false);
  const suppressLobbyLeaveRef = useRef(false);

  const displayName = useMemo(() => {
    const accountName = user?.displayName?.trim();
    if (accountName) return accountName;
    return profile.name;
  }, [profile.name, user?.displayName]);

  const partyModeOptions = useMemo(
    () =>
      Object.values(gameModes)
        .filter(mode => !mode.isSingleBook)
        .map(mode => ({ id: mode.id, name: mode.name })),
    []
  );

  const isHost = Boolean(room?.hostId === partyMemberId);
  const isCurrentMember = Boolean(
    room?.members.some(member => member.id === partyMemberId || member.id === clientId)
  );
  const lobbySettings = room?.lobbySettings;
  const lobbyComplete = Boolean(
    lobbySettings?.modeId &&
    lobbySettings?.roundsPerPlayer &&
    lobbySettings?.timerDurationSeconds &&
    (lobbySettings.modeId !== 'book-selection' || lobbySettings.selectedBook)
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MULTIPLAYER_TAB_STORAGE_KEY, tab);
  }, [tab]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeRoomCode) {
      localStorage.setItem(PARTY_CODE_STORAGE_KEY, activeRoomCode);
      return;
    }
    localStorage.removeItem(PARTY_CODE_STORAGE_KEY);
  }, [activeRoomCode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProfile(readLocalProfile());
    }, 0);
    return () => clearTimeout(timer);
  }, [appStateNonce]);

  useEffect(() => {
    if (!firebaseConfigured) return;
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
  }, [clientId, firebaseConfigured, tab]);

  useEffect(() => {
    writeHotSeatSettings({
      players,
      rounds,
      turnStyle,
      names,
      timerSeconds: clampTimerSeconds(timerSeconds),
    });
  }, [players, rounds, turnStyle, names, timerSeconds]);

  useEffect(() => {
    if (tab !== 'party' || !firebaseConfigured) return;
    let unsubscribe: () => void = () => {};
    let cancelled = false;
    let retryTimer: number | null = null;

    const subscribeToRoom = (code: string) => {
      unsubscribe = subscribeToParty(code, next => {
        if (cancelled) return;
        if (!next) {
          setRoom(null);
          setActiveRoomCode(null);
          setPartyLobbyError('Party lobby unavailable. Recreating your code...');
          if (!retryTimer) {
            retryTimer = window.setTimeout(() => {
              retryTimer = null;
              setActiveRoomCode(null);
            }, 500);
          }
          return;
        }

        const stillMember = next.members.some(member => member.id === partyMemberId || member.id === clientId);
        if (!stillMember) {
          setRoom(null);
          setActiveRoomCode(null);
          setPartyLobbyError('You left that party.');
          return;
        }

        setRoom(next);

        setPartyLobbyError('');
      });
    };

    const run = async () => {
      setPartyLobbyPending(true);
      if (activeRoomCode) {
        subscribeToRoom(activeRoomCode);
        setPartyLobbyPending(false);
        return;
      }

      const hasSession = await ensureFirebaseSession();
      const authUid = getFirebaseAuth()?.currentUser?.uid;
      if ((!hasSession && !authUid) && !user) {
        if (!cancelled) {
          setPartyLobbyPending(false);
          setPartyLobbyError('Party hosting requires Firebase Authentication. Enable Anonymous sign-in in Firebase Auth (or log in with Google), then retry.');
        }
        return;
      }

      const created = await hostParty({
        id: partyMemberId,
        name: displayName,
        avatar: profile.avatar,
        isHost: true,
        joinedAt: Date.now(),
      });

      if (!cancelled && created) {
        setActiveRoomCode(created.code);
        setRoom(created);
        setPartyLobbyError('');
        subscribeToRoom(created.code);
      } else if (!cancelled) {
        const hasAuthUser = Boolean(getFirebaseAuth()?.currentUser);
        setPartyLobbyError(
          hasAuthUser
            ? 'Unable to create a party code. Firestore rules likely blocked write access to the parties collection.'
            : 'Unable to create a party code. Firebase Authentication is required (enable Anonymous auth or sign in).'
        );
      }

      if (!cancelled) setPartyLobbyPending(false);
    };

    void run();

    return () => {
      cancelled = true;
      unsubscribe();
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [tab, activeRoomCode, clientId, displayName, firebaseConfigured, partyMemberId, profile.avatar, user]);

  useEffect(() => {
    if (tab !== 'party' || !firebaseConfigured || !activeRoomCode || !isCurrentMember) return;

    const syncMember = () => {
      void upsertPartyMember(activeRoomCode, {
        id: partyMemberId,
        name: displayName,
        avatar: profile.avatar,
        isHost: room?.hostId === partyMemberId,
        joinedAt: Date.now(),
      });
    };

    syncMember();
    const heartbeat = window.setInterval(syncMember, 60_000);

    return () => window.clearInterval(heartbeat);
  }, [activeRoomCode, displayName, firebaseConfigured, isCurrentMember, partyMemberId, profile.avatar, room?.hostId, tab]);

  useEffect(() => {
    return () => {
      if (tab === 'party' && activeRoomCode && room?.game?.status === 'lobby' && !suppressLobbyLeaveRef.current) {
        void leaveParty(activeRoomCode, partyMemberId);
      }
    };
  }, [activeRoomCode, partyMemberId, room?.game?.status, tab]);

  useEffect(() => {
    if (tab !== 'party' || !room?.code) return;
    if (!room.game || room.game.status === 'lobby') return;
    router.push(`/multiplayer/party/game?code=${room.code}`);
  }, [room?.code, room?.game, router, tab]);

  useEffect(() => {
    if (joinOpen) queueMicrotask(() => joinRefs.current[0]?.focus());
  }, [joinOpen]);

  const applyPlayers = (value: number) => {
    const n = Math.min(8, Math.max(2, value));
    setPlayers(n);
    setNames(prev => {
      const adj = prev.slice(0, n);
      while (adj.length < n) adj.push(`Player ${adj.length + 1}`);
      return adj;
    });
  };

  const selectGamemode = () => router.push('/multiplayer/hot-seat/gamemode');

  const submitJoin = async () => {
    const code = joinCode.join('').toUpperCase();
    if (code.length !== 4 || !firebaseConfigured) return;

    const hasSession = await ensureFirebaseSession();
    const authUid = getFirebaseAuth()?.currentUser?.uid;
    if ((!hasSession && !authUid) && !user) {
      setPartyLobbyError('Joining a party requires Firebase Authentication. Enable Anonymous sign-in in Firebase Auth (or log in with Google).');
      return;
    }

    if (activeRoomCode && activeRoomCode !== code) {
      await leaveParty(activeRoomCode, partyMemberId);
    }

    const ok = await joinParty(code, { id: partyMemberId, name: displayName, avatar: profile.avatar, isHost: false, joinedAt: Date.now() });
    if (ok) {
      setPartyLobbyError('');
      setPartyStartError('');
      setJoinOpen(false);
      setJoinCode(['', '', '', '']);
      setActiveRoomCode(code);
    } else {
      setPartyLobbyError('Could not join that party code. Check the code and try again.');
    }
  };

  const retryPartyCode = () => {
    setPartyLobbyError('');
    setRoom(null);
    setActiveRoomCode(null);
  };

  const handleLeaveLobby = async () => {
    if (!activeRoomCode || !room || isHost || partyActionPending) return;

    setPartyActionPending(true);
    await leaveParty(activeRoomCode, partyMemberId);
    setRoom(null);
    setActiveRoomCode(null);
    setPartyLobbyError('');
    setPartyStartError('');
    setPartyActionPending(false);
  };

  const handleEndLobby = async () => {
    if (!activeRoomCode || !room || !isHost || partyActionPending) return;

    setPartyActionPending(true);
    const ok = await endPartyLobby(activeRoomCode, partyMemberId);
    if (!ok) {
      setPartyLobbyError('Unable to end the lobby. Please try again.');
      setPartyActionPending(false);
      return;
    }

    setRoom(null);
    setActiveRoomCode(null);
    setPartyLobbyError('');
    setPartyStartError('');
    setPartyActionPending(false);
  };

  const switchTab = async (next: 'hot-seat' | 'party') => {
    if (tab === 'party' && next !== 'party' && activeRoomCode && room?.game?.status === 'lobby') {
      await leaveParty(activeRoomCode, partyMemberId);
      setActiveRoomCode(null);
      setRoom(null);
    }
    setTab(next);
  };

  const applyLobbySettings = async (updates: Partial<PartyLobbySettings>) => {
    if (!room || !isHost) return;

    const ok = await updatePartyLobbySettings(room.code, partyMemberId, updates);
    if (!ok) {
      setPartyStartError('Could not update party settings. Please retry.');
      return;
    }

    setPartyStartError('');
  };

  const startParty = async () => {
    if (!room || !isHost || !lobbySettings?.modeId || !lobbySettings.roundsPerPlayer || !lobbySettings.timerDurationSeconds) {
      return;
    }

    setPartyStartError('');
    setPartyStartPending(true);

    const modeConfig = gameModes[lobbySettings.modeId];
    const selectedBookData = lobbySettings.modeId === 'book-selection'
      ? bibleData.find(book => book.book === lobbySettings.selectedBook)
      : null;
    const playableBooks = selectedBookData ? [selectedBookData] : modeConfig.books;
    const firstVerse = await buildRandomPartyVerse(playableBooks);

    if (!firstVerse) {
      setPartyStartPending(false);
      setPartyStartError('Could not load the first verse. Please try again.');
      return;
    }

    const ok = await startPartyGame(room.code, partyMemberId, {
      modeId: lobbySettings.modeId,
      roundsPerPlayer: lobbySettings.roundsPerPlayer,
      timerDurationSeconds: lobbySettings.timerDurationSeconds,
      selectedBook: selectedBookData?.book,
      firstVerse,
    });

    setPartyStartPending(false);

    if (!ok) {
      setPartyStartError('Unable to start party game. Please retry.');
      return;
    }

    suppressLobbyLeaveRef.current = true;
    router.push(`/multiplayer/party/game?code=${room.code}`);
  };

  const joinModal = joinOpen && typeof window !== 'undefined'
    ? createPortal(
      <div className="party-join-modal-backdrop" onClick={() => setJoinOpen(false)}>
        <div className="party-join-modal-card" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setJoinOpen(false)}
            className="party-join-modal-close"
            aria-label="Close join code dialog"
          >
            x
          </button>
          <h3 className="headline-serif text-2xl mb-4">Enter 4-letter code</h3>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {joinCode.map((value, idx) => (
              <input key={idx} ref={el => { joinRefs.current[idx] = el; }} value={value} maxLength={1} onChange={e => {
                const char = (e.target.value || '').toUpperCase().replace(/[^A-Z]/g, '');
                const next = joinCode.slice();
                next[idx] = char;
                setJoinCode(next);
                if (char && idx < 3) joinRefs.current[idx + 1]?.focus();
              }} className="settings-input !w-full text-center text-2xl font-bold" inputMode="text" />
            ))}
          </div>
          <div>
            <button onClick={() => void submitJoin()} className="btn-primary w-full py-2.5">Join</button>
          </div>
        </div>
      </div>,
      document.body
    )
    : null;

  return (
    <main className="app-screen">
      <AppTopBar title="Multiplayer" />

      <div className="app-content app-content-scroll">
        <div className="page max-w-4xl min-w-0">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={() => void switchTab('hot-seat')} className={tab === 'hot-seat' ? 'btn-primary py-2.5' : 'btn-outline py-2.5'}>Hot Seat</button>
            <button onClick={() => void switchTab('party')} className={tab === 'party' ? 'btn-primary py-2.5' : 'btn-outline py-2.5'}>Party</button>
          </div>

          {tab === 'hot-seat' && (
            <div className="hotseat-shell min-w-0">
              <div className="hotseat-rounds-turn-row">
                <div className="hotseat-wheel-slot">
                  <HorizontalWheel label="Rounds per player" values={ROUND_VALUES} selected={rounds} onChange={setRounds} />
                </div>
                <div className="hotseat-turn-buttons">
                  <button
                    onClick={() => setTurnStyle('alternate')}
                    className={turnStyle === 'alternate' ? 'btn-primary hotseat-turn-style-btn' : 'btn-outline hotseat-turn-style-btn'}
                  >
                    Alternate
                  </button>
                  <button
                    onClick={() => setTurnStyle('all-at-once')}
                    className={turnStyle === 'all-at-once' ? 'btn-primary hotseat-turn-style-btn' : 'btn-outline hotseat-turn-style-btn'}
                  >
                    All at once
                  </button>
                </div>
              </div>

              <div className="hotseat-wheel-slot">
                <HorizontalWheel label="Player count" values={PLAYER_VALUES} selected={players} onChange={applyPlayers} />
              </div>

              <TimerSetupControls
                embedded
                seconds={timerSeconds}
                onSecondsChange={setTimerSeconds}
              />

              <section className="hotseat-names-window">
                <p className="text-sm font-semibold mb-2">Player Names</p>
                <div className="grid gap-2 sm:grid-cols-2 hotseat-names-list">
                  {names.slice(0, players).map((name, idx) => (
                    <input key={idx} value={name} onChange={e => { const n = names.slice(); n[idx] = e.target.value; setNames(n); }} className="settings-input !w-full" />
                  ))}
                </div>
              </section>

              <button onClick={selectGamemode} className="btn-primary hotseat-select-gamemode-btn">Select Gamemode</button>
            </div>
          )}

          {tab === 'party' && (
            <section className="surface-card p-4">
              <div className="party-header-row mb-4">
                <div className="party-header-actions">
                  {room && isCurrentMember ? (
                    isHost && room.members.length > 1 ? (
                      <button
                        onClick={() => void handleEndLobby()}
                        disabled={partyActionPending}
                        className="btn-outline px-3 py-2 text-sm"
                      >
                        {partyActionPending ? 'Ending...' : 'End Lobby'}
                      </button>
                    ) : !isHost ? (
                      <button
                        onClick={() => void handleLeaveLobby()}
                        disabled={partyActionPending}
                        className="btn-outline px-3 py-2 text-sm"
                      >
                        {partyActionPending ? 'Leaving...' : 'Leave Lobby'}
                      </button>
                    ) : (
                      <button onClick={() => setJoinOpen(true)} className="btn-outline px-3 py-2 text-sm">Enter code to join</button>
                    )
                  ) : (
                    <button onClick={() => setJoinOpen(true)} className="btn-outline px-3 py-2 text-sm">Enter code to join</button>
                  )}
                </div>
              </div>
              {!firebaseConfigured && <div className="surface-card-soft p-4 text-sm">Add Firebase env vars to enable online party hosting and joining.</div>}
              {firebaseConfigured && !room && (
                <div className="surface-card-soft p-4 text-sm">
                  <p>{partyLobbyPending ? 'Preparing your party code…' : 'Creating your party lobby...'}</p>
                  {partyLobbyError && <p className="text-[var(--danger)] mt-2">{partyLobbyError}</p>}
                  {!partyLobbyPending && (
                    <button onClick={retryPartyCode} className="btn-outline px-3 py-1.5 text-sm mt-3">Retry</button>
                  )}
                </div>
              )}
              {firebaseConfigured && room && (
                <>
                  <div className="text-center mb-3">
                    <p className="content-muted text-sm">Party Code</p>
                    <p className="headline-serif text-4xl tracking-[0.18em] mt-1">{room.code}</p>
                  </div>

                  <div className="party-members-block mb-3">
                    <p className="font-semibold mb-2">Party Members</p>
                    <div className="grid gap-2">
                      {room.members.map(member => (
                        <div key={member.id} className="party-member-row">
                          <Image
                            src={avatarToDataUri(member.avatar)}
                            alt={`${member.name} avatar`}
                            width={48}
                            height={48}
                            unoptimized
                            className="w-12 h-12 border border-[var(--line)]"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{member.name}</p>
                            <p className="text-xs content-muted">{member.isHost ? 'Host' : 'Joined'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="party-host-controls mb-3">
                    <p className="eyebrow mb-2">Party Settings</p>

                    <label className="text-sm font-semibold block mb-1">Game Mode</label>
                    <div className={`party-gamemode-row mb-3 ${lobbySettings?.modeId === 'book-selection' ? 'has-book' : ''}`}>
                      <select
                        value={lobbySettings?.modeId ?? ''}
                        onChange={e => {
                          const value = e.target.value;
                          void applyLobbySettings({
                            modeId: value ? (value as GameModeId) : null,
                            selectedBook: value === 'book-selection' ? (lobbySettings?.selectedBook ?? bibleData[0].book) : null,
                          });
                        }}
                        className="settings-input party-gamemode-select"
                        disabled={!isHost}
                      >
                        <option value="">Select mode</option>
                        {partyModeOptions.map(option => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                        <option value="book-selection">Book</option>
                      </select>

                      {lobbySettings?.modeId === 'book-selection' && (
                        <select
                          value={lobbySettings.selectedBook || bibleData[0].book}
                          onChange={e => {
                            const value = e.target.value;
                            void applyLobbySettings({ selectedBook: value });
                          }}
                          className="settings-input party-book-select"
                          disabled={!isHost}
                        >
                          {bibleData.map(book => (
                            <option key={book.book} value={book.book}>{book.book}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <label className="text-sm font-semibold block mb-1">Rounds</label>
                    <select
                      value={lobbySettings?.roundsPerPlayer ?? ''}
                      onChange={e => {
                        const value = e.target.value;
                        void applyLobbySettings({ roundsPerPlayer: value ? Number(value) : null });
                      }}
                      className="settings-input !w-full mb-3"
                      disabled={!isHost}
                    >
                      <option value="">Select rounds</option>
                      {ROUND_VALUES.map(value => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>

                    <label className="text-sm font-semibold block mb-1">Timer (seconds)</label>
                    <select
                      value={lobbySettings?.timerDurationSeconds ?? ''}
                      onChange={e => {
                        const value = e.target.value;
                        void applyLobbySettings({ timerDurationSeconds: value ? Number(value) : null });
                      }}
                      className="settings-input !w-full"
                      disabled={!isHost}
                    >
                      <option value="">Select timer</option>
                      {PARTY_TIMER_VALUES.map(value => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>

                    {!isHost && (
                      <p className="text-xs content-muted mt-3">Only the host can edit these settings.</p>
                    )}
                  </div>

                  {partyStartError && <p className="text-xs text-[var(--danger)] mb-3">{partyStartError}</p>}

                  <div className="text-center">
                    <button
                      onClick={() => void startParty()}
                      className="btn-primary w-full py-2.5"
                      disabled={!isHost || !lobbyComplete || partyStartPending}
                    >
                      {isHost
                        ? partyStartPending
                          ? 'Starting...'
                          : 'Start Party Game'
                        : 'Waiting for host to start'}
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </div>

      {joinModal}
      <MainBottomNav />
    </main>
  );
}
