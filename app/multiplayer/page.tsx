'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AppTopBar from '@/components/AppTopBar';
import MainBottomNav from '@/components/MainBottomNav';
import HorizontalWheel from '@/components/HorizontalWheel';
import TimerSetupControls from '@/components/TimerSetupControls';
import CustomBookSelectorPopup from '@/components/CustomBookSelectorPopup';
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
import { PARTY_TIMER_SECOND_OPTIONS, clampTimerSeconds, formatTimerOptionLabel } from '@/lib/timerOptions';
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
  if (typeof window === 'undefined') return 'party' as const;
  const stored = localStorage.getItem(MULTIPLAYER_TAB_STORAGE_KEY);
  return stored === 'hot-seat' ? 'hot-seat' : 'party';
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
  const [partyJoinPending, setPartyJoinPending] = useState(false);
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
  const showPartyLobbyAction = Boolean(
    room && isCurrentMember && ((isHost && room.members.length > 1) || !isHost)
  );
  const lobbySettings = room?.lobbySettings;
  const lobbyComplete = Boolean(
    lobbySettings?.modeId &&
    lobbySettings?.roundsPerPlayer &&
    lobbySettings?.timerDurationSeconds !== null &&
    lobbySettings?.timerDurationSeconds !== undefined &&
    (lobbySettings.modeId !== 'book-selection' || lobbySettings.selectedBook) &&
    (lobbySettings.modeId !== 'custom' || (lobbySettings.selectedBooks?.length ?? 0) > 0)
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
      unsubscribe = subscribeToParty(
        code,
        next => {
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
        },
        () => {
          if (cancelled) return;
          setPartyLobbyError('Realtime connection to this party was interrupted. Retrying...');
        }
      );
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
    if (code.length !== 4 || !firebaseConfigured || partyJoinPending) return;

    setPartyJoinPending(true);

    const hasSession = await ensureFirebaseSession();
    const authUid = getFirebaseAuth()?.currentUser?.uid;
    if ((!hasSession && !authUid) && !user) {
      setPartyLobbyError('Joining a party requires Firebase Authentication. Enable Anonymous sign-in in Firebase Auth (or log in with Google).');
      setPartyJoinPending(false);
      return;
    }

    if (activeRoomCode && activeRoomCode !== code) {
      await leaveParty(activeRoomCode, partyMemberId);
    }

    const ok = await joinParty(code, { id: partyMemberId, name: displayName, avatar: profile.avatar, isHost: false, joinedAt: 0 });
    if (ok) {
      setPartyLobbyError('');
      setPartyStartError('');
      setJoinCode(['', '', '', '']);
      setActiveRoomCode(code);
    } else {
      setPartyLobbyError('Could not join that party code. Check the code and try again.');
    }

    setPartyJoinPending(false);
  };

  const updateJoinCodeSlot = (index: number, value: string) => {
    const char = (value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
    const next = joinCode.slice();
    next[index] = char;
    setJoinCode(next);

    if (char && index < 3) {
      joinRefs.current[index + 1]?.focus();
    }

    if (char && index === 3 && next.every(slot => slot.length === 1)) {
      queueMicrotask(() => {
        void submitJoin();
      });
    }
  };

  const handleJoinCodeKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !joinCode[index] && index > 0) {
      joinRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      void submitJoin();
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
    if (
      !room ||
      !isHost ||
      !lobbySettings?.modeId ||
      !lobbySettings.roundsPerPlayer ||
      lobbySettings.timerDurationSeconds === null ||
      lobbySettings.timerDurationSeconds === undefined
    ) {
      return;
    }

    setPartyStartError('');
    setPartyStartPending(true);

    const modeConfig = gameModes[lobbySettings.modeId];
    const selectedBookData = lobbySettings.modeId === 'book-selection'
      ? bibleData.find(book => book.book === lobbySettings.selectedBook)
      : null;
    const selectedCustomBooks = lobbySettings.modeId === 'custom'
      ? bibleData.filter(book => (lobbySettings.selectedBooks ?? []).includes(book.book))
      : [];
    const playableBooks = selectedBookData
      ? [selectedBookData]
      : selectedCustomBooks.length > 0
        ? selectedCustomBooks
        : modeConfig.books;
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
      selectedBooks: selectedCustomBooks.map(book => book.book),
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

  return (
    <main className="app-screen">
      <AppTopBar title="Multiplayer" />

      <div className="app-content app-content-scroll">
        <div className="page max-w-4xl min-w-0">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={() => void switchTab('party')} className={tab === 'party' ? 'btn-primary py-2.5' : 'btn-outline py-2.5'}>Party</button>
            <button onClick={() => void switchTab('hot-seat')} className={tab === 'hot-seat' ? 'btn-primary py-2.5' : 'btn-outline py-2.5'}>Hot Seat</button>
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
              <div className="party-header-row mb-3">
                <div className="party-header-half party-host-half">
                  <p className="content-muted text-xs">Host</p>
                  <p className="headline-serif party-code-value">{firebaseConfigured && room ? room.code : '....'}</p>
                </div>

                <div className="party-header-half party-join-half">
                  <p className="content-muted text-xs">Join</p>
                  <div className="party-join-slot-row" role="group" aria-label="Enter party join code">
                    {joinCode.map((value, idx) => (
                      <input
                        key={idx}
                        ref={el => {
                          joinRefs.current[idx] = el;
                        }}
                        value={value}
                        maxLength={1}
                        onChange={event => updateJoinCodeSlot(idx, event.target.value)}
                        onKeyDown={event => handleJoinCodeKeyDown(idx, event)}
                        className="party-join-slot-input"
                        inputMode="text"
                        autoCapitalize="characters"
                        aria-label={`Join code letter ${idx + 1}`}
                        disabled={!firebaseConfigured || partyJoinPending}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (!partyJoinPending) void submitJoin();
                    }}
                    className="btn-outline party-join-action-btn"
                    disabled={!firebaseConfigured || joinCode.some(char => !char) || partyJoinPending}
                  >
                    {partyJoinPending ? 'Joining...' : 'Join Party'}
                  </button>
                </div>
              </div>

              {showPartyLobbyAction && (
                <div className="party-header-actions mb-4">
                  {isHost && (room?.members.length ?? 0) > 1 ? (
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
                  ) : null}
                </div>
              )}

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
                            selectedBooks: value === 'custom'
                              ? (lobbySettings?.selectedBooks?.length ? lobbySettings.selectedBooks : bibleData.map(book => book.book))
                              : null,
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

                    {lobbySettings?.modeId === 'custom' && (
                      <div className="mb-3">
                        <label className="text-sm font-semibold block mb-2">Books</label>
                        <CustomBookSelectorPopup
                          selectedBooks={lobbySettings.selectedBooks ?? []}
                          onChange={books => {
                            void applyLobbySettings({ selectedBooks: books });
                          }}
                          disabled={!isHost}
                        />
                        {(lobbySettings.selectedBooks?.length ?? 0) === 0 && (
                          <p className="text-xs text-[var(--danger)] mt-2">Select at least one book.</p>
                        )}
                      </div>
                    )}

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
                        <option key={value} value={value}>{formatTimerOptionLabel(value)}</option>
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

      <MainBottomNav />
    </main>
  );
}
