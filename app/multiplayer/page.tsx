'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AppTopBar from '@/components/AppTopBar';
import MainBottomNav from '@/components/MainBottomNav';
import HorizontalWheel from '@/components/HorizontalWheel';
import TimerSetupControls from '@/components/TimerSetupControls';
import { readHotSeatSettings, writeHotSeatSettings } from '@/lib/hotSeatSettings';
import { BookData } from '@/lib/bibleData';
import { gameModes, GameModeId } from '@/lib/gameModes';
import {
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
import { isFirebaseConfigured } from '@/lib/firebaseClient';
import { readClientId, readLocalProfile } from '@/lib/userProfile';
import { avatarToDataUri } from '@/lib/avatarSystem';
import { clampTimerMinutes, clampTimerSeconds } from '@/lib/timerOptions';
import { useAccountSync } from '@/lib/accountSync';
import { fetchVerseTextByReference } from '@/lib/verseClient';

const PLAYER_VALUES = [2, 3, 4, 5, 6, 7, 8];
const ROUND_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const PARTY_TIMER_VALUES = Array.from({ length: 18 }, (_, idx) => (idx + 1) * 5);

function pickRandomVerse(books: BookData[]): { book: BookData; chapter: number; verse: number } {
  const book = books[Math.floor(Math.random() * books.length)];
  const chapterData = book.chapters[Math.floor(Math.random() * book.chapters.length)];
  const chapter = parseInt(chapterData.chapter, 10);
  const verseCount = parseInt(chapterData.verses, 10);
  const verse = Math.floor(Math.random() * verseCount) + 1;
  return { book, chapter, verse };
}

async function buildRandomPartyVerse(books: BookData[]): Promise<PartyVerse | null> {
  for (let attempts = 0; attempts < 8; attempts += 1) {
    const picked = pickRandomVerse(books);
    const text = await fetchVerseTextByReference(picked.book.book, picked.chapter, picked.verse);
    if (text) {
      return {
        book: picked.book.book,
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
  const [tab, setTab] = useState<'hot-seat' | 'party'>('hot-seat');
  const initialHotSeat = useMemo(() => readHotSeatSettings(), []);
  const firebaseConfigured = isFirebaseConfigured();

  const [players, setPlayers] = useState(initialHotSeat.players);
  const [rounds, setRounds] = useState(initialHotSeat.rounds);
  const [turnStyle, setTurnStyle] = useState(initialHotSeat.turnStyle);
  const [names, setNames] = useState<string[]>(initialHotSeat.names);
  const [timerMinutes, setTimerMinutes] = useState(initialHotSeat.timerMinutes);
  const [timerSeconds, setTimerSeconds] = useState(initialHotSeat.timerSeconds);

  const [room, setRoom] = useState<PartyRoom | null>(null);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState(['', '', '', '']);
  const joinRefs = useRef<Array<HTMLInputElement | null>>([]);

  const { appStateNonce, user } = useAccountSync();
  const [profile, setProfile] = useState(() => readLocalProfile());
  const clientId = useMemo(() => readClientId(), []);
  const [partyStartError, setPartyStartError] = useState('');
  const [partyStartPending, setPartyStartPending] = useState(false);

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

  const isHost = Boolean(room?.hostId === clientId);
  const lobbySettings = room?.lobbySettings;
  const lobbyComplete = Boolean(
    lobbySettings?.modeId &&
    lobbySettings?.roundsPerPlayer &&
    lobbySettings?.timerDurationSeconds
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setProfile(readLocalProfile());
    }, 0);
    return () => clearTimeout(timer);
  }, [appStateNonce]);

  useEffect(() => {
    writeHotSeatSettings({
      players,
      rounds,
      turnStyle,
      names,
      timerMinutes: clampTimerMinutes(timerMinutes),
      timerSeconds: clampTimerSeconds(timerSeconds),
    });
  }, [players, rounds, turnStyle, names, timerMinutes, timerSeconds]);

  useEffect(() => {
    if (tab !== 'party' || !firebaseConfigured) return;
    let unsubscribe: () => void = () => {};
    let cancelled = false;

    const subscribeToRoom = (code: string) => {
      unsubscribe = subscribeToParty(code, next => {
        if (cancelled) return;
        setRoom(next);
        if (!next) {
          setActiveRoomCode(null);
        }
      });
    };

    const run = async () => {
      if (activeRoomCode) {
        subscribeToRoom(activeRoomCode);
        return;
      }

      const created = await hostParty({
        id: clientId,
        name: displayName,
        avatar: profile.avatar,
        isHost: true,
        joinedAt: Date.now(),
      });

      if (!cancelled && created) {
        setActiveRoomCode(created.code);
        setRoom(created);
        subscribeToRoom(created.code);
      }
    };

    void run();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [tab, activeRoomCode, clientId, displayName, firebaseConfigured, profile.avatar]);

  useEffect(() => {
    if (tab !== 'party' || !firebaseConfigured || !activeRoomCode) return;

    const syncMember = () => {
      void upsertPartyMember(activeRoomCode, {
        id: clientId,
        name: displayName,
        avatar: profile.avatar,
        isHost: room?.hostId === clientId,
        joinedAt: Date.now(),
      });
    };

    syncMember();
    const heartbeat = window.setInterval(syncMember, 60_000);

    return () => window.clearInterval(heartbeat);
  }, [activeRoomCode, clientId, displayName, firebaseConfigured, profile.avatar, room?.hostId, tab]);

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

    if (activeRoomCode && activeRoomCode !== code) {
      await leaveParty(activeRoomCode, clientId);
    }

    const ok = await joinParty(code, { id: clientId, name: displayName, avatar: profile.avatar, isHost: false, joinedAt: Date.now() });
    if (ok) {
      setPartyStartError('');
      setJoinOpen(false);
      setJoinCode(['', '', '', '']);
      setActiveRoomCode(code);
    }
  };

  const applyLobbySettings = async (updates: Partial<PartyLobbySettings>) => {
    if (!room || !isHost) return;

    const ok = await updatePartyLobbySettings(room.code, clientId, updates);
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
    const firstVerse = await buildRandomPartyVerse(modeConfig.books);

    if (!firstVerse) {
      setPartyStartPending(false);
      setPartyStartError('Could not load the first verse. Please try again.');
      return;
    }

    const ok = await startPartyGame(room.code, clientId, {
      modeId: lobbySettings.modeId,
      roundsPerPlayer: lobbySettings.roundsPerPlayer,
      timerDurationSeconds: lobbySettings.timerDurationSeconds,
      firstVerse,
    });

    setPartyStartPending(false);

    if (!ok) {
      setPartyStartError('Unable to start party game. Please retry.');
      return;
    }

    router.push(`/multiplayer/party/game?code=${room.code}`);
  };

  return (
    <main className="app-screen">
      <AppTopBar title="Multiplayer" />

      <div className="app-content app-content-scroll">
        <div className="page max-w-4xl">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={() => setTab('hot-seat')} className={tab === 'hot-seat' ? 'btn-primary py-2.5' : 'btn-outline py-2.5'}>Hot Seat</button>
            <button onClick={() => setTab('party')} className={tab === 'party' ? 'btn-primary py-2.5' : 'btn-outline py-2.5'}>Party</button>
          </div>

          {tab === 'hot-seat' && (
            <div className="hotseat-shell min-w-0">
              <div className="hotseat-rounds-turn-row">
                <div className="min-w-0">
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

              <HorizontalWheel label="Player count" values={PLAYER_VALUES} selected={players} onChange={applyPlayers} />

              <TimerSetupControls
                embedded
                minutes={timerMinutes}
                seconds={timerSeconds}
                onMinutesChange={setTimerMinutes}
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
            <section className="surface-card p-5">
              <div className="party-header-row mb-4">
                <h2 className="headline-serif text-3xl">Hosted Party</h2>
                <div className="party-header-actions">
                  <button onClick={() => setJoinOpen(true)} className="btn-outline px-3 py-2 text-sm">Join by code</button>
                </div>
              </div>
              {!firebaseConfigured && <div className="surface-card-soft p-4 text-sm">Add Firebase env vars to enable online party hosting and joining.</div>}
              {firebaseConfigured && !room && <div className="surface-card-soft p-4 text-sm">Preparing your party code…</div>}
              {firebaseConfigured && room && (
                <>
                  <div className="text-center mb-4">
                    <p className="content-muted text-sm">Party Code</p>
                    <p className="headline-serif text-5xl tracking-[0.2em] mt-1">{room.code}</p>
                  </div>

                  <div className="party-members-block mb-4">
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

                  <div className="party-host-controls mb-4">
                    <p className="eyebrow mb-2">Party Settings</p>

                    <label className="text-sm font-semibold block mb-1">Game Mode</label>
                    <select
                      value={lobbySettings?.modeId ?? ''}
                      onChange={e => {
                        const value = e.target.value;
                        void applyLobbySettings({ modeId: value ? (value as GameModeId) : null });
                      }}
                      className="settings-input !w-full mb-3"
                      disabled={!isHost}
                    >
                      <option value="">Select mode</option>
                      {partyModeOptions.map(option => (
                        <option key={option.id} value={option.id}>{option.name}</option>
                      ))}
                    </select>

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

      {joinOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={() => setJoinOpen(false)}>
          <div className="surface-card w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
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
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setJoinOpen(false)} className="btn-outline py-2.5">Cancel</button>
              <button onClick={() => void submitJoin()} className="btn-primary py-2.5">Join</button>
            </div>
          </div>
        </div>
      )}
      <MainBottomNav />
    </main>
  );
}
