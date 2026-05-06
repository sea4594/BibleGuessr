'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppTopBar from '@/components/AppTopBar';
import MainBottomNav from '@/components/MainBottomNav';
import { defaultHotSeatSettings, readHotSeatSettings, writeHotSeatSettings } from '@/lib/hotSeatSettings';
import { hostParty, joinParty, PartyRoom, subscribeToParty } from '@/lib/partyEngine';
import { isFirebaseConfigured } from '@/lib/firebaseClient';
import { readClientId, readLocalProfile } from '@/lib/userProfile';
import { avatarToDataUri } from '@/lib/avatarSystem';

export default function MultiplayerPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'hot-seat' | 'party'>('hot-seat');
  const initialHotSeat = useMemo(() => readHotSeatSettings(), []);

  const [players, setPlayers] = useState(initialHotSeat.players);
  const [rounds, setRounds] = useState(initialHotSeat.rounds);
  const [turnStyle, setTurnStyle] = useState(initialHotSeat.turnStyle);
  const [names, setNames] = useState<string[]>(initialHotSeat.names);

  const [room, setRoom] = useState<PartyRoom | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState(['', '', '', '']);
  const joinRefs = useRef<Array<HTMLInputElement | null>>([]);

  const profile = useMemo(() => readLocalProfile(), []);
  const clientId = useMemo(() => readClientId(), []);

  useEffect(() => {
    writeHotSeatSettings({ players, rounds, turnStyle, names });
  }, [players, rounds, turnStyle, names]);

  useEffect(() => {
    if (tab !== 'party' || !isFirebaseConfigured()) return;

    let unsubscribe: () => void = () => {};
    let cancelled = false;

    const run = async () => {
      if (room?.code) {
        unsubscribe = subscribeToParty(room.code, next => {
          if (!cancelled) setRoom(next);
        });
        return;
      }

      const created = await hostParty({
        id: clientId,
        name: profile.name,
        avatar: profile.avatar,
        isHost: true,
        joinedAt: Date.now(),
      });

      if (!cancelled && created) {
        setRoom(created);
        unsubscribe = subscribeToParty(created.code, next => {
          if (!cancelled) setRoom(next);
        });
      }
    };

    void run();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [tab, clientId, profile.avatar, profile.name, room?.code]);

  useEffect(() => {
    if (joinOpen) {
      queueMicrotask(() => {
        joinRefs.current[0]?.focus();
      });
    }
  }, [joinOpen]);

  const applyPlayers = (value: number) => {
    const nextPlayers = Math.min(8, Math.max(2, value));
    setPlayers(nextPlayers);
    setNames(prev => {
      const adjusted = prev.slice(0, nextPlayers);
      while (adjusted.length < nextPlayers) {
        adjusted.push(`Player ${adjusted.length + 1}`);
      }
      return adjusted;
    });
  };

  const resetDefaults = () => {
    setPlayers(defaultHotSeatSettings.players);
    setRounds(defaultHotSeatSettings.rounds);
    setTurnStyle(defaultHotSeatSettings.turnStyle);
    setNames(defaultHotSeatSettings.names);
  };

  const selectGamemode = () => {
    router.push('/multiplayer/hot-seat/gamemode');
  };

  const submitJoin = async () => {
    const code = joinCode.join('').toUpperCase();
    if (code.length !== 4 || !isFirebaseConfigured()) return;

    const ok = await joinParty(code, {
      id: clientId,
      name: profile.name,
      avatar: profile.avatar,
      isHost: false,
      joinedAt: Date.now(),
    });

    if (ok) {
      setJoinOpen(false);
      setJoinCode(['', '', '', '']);
      subscribeToParty(code, next => setRoom(next));
    }
  };

  return (
    <main className="app-screen">
      <AppTopBar title="Multiplayer" />

      <div className="app-content app-content-scroll">
        <div className="page max-w-4xl">
          <section className="surface-card p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTab('hot-seat')}
                className={tab === 'hot-seat' ? 'btn-primary py-2.5' : 'btn-outline py-2.5'}
              >
                Hot Seat
              </button>
              <button
                onClick={() => setTab('party')}
                className={tab === 'party' ? 'btn-primary py-2.5' : 'btn-outline py-2.5'}
              >
                Party
              </button>
            </div>
          </section>

          {tab === 'hot-seat' && (
            <section className="surface-card p-5">
              <p className="eyebrow mb-2">Hot Seat Setup</p>
              <h2 className="headline-serif text-3xl mb-4">Local Multiplayer</h2>

              <div className="settings-list">
                <label className="setting-row">
                  <span>Players</span>
                  <input
                    type="number"
                    min={2}
                    max={8}
                    value={players}
                    onChange={e => applyPlayers(parseInt(e.target.value || '2', 10))}
                    className="settings-input"
                  />
                </label>

                <label className="setting-row">
                  <span>Rounds per player</span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={rounds}
                    onChange={e => setRounds(parseInt(e.target.value, 10))}
                    className="w-44"
                  />
                  <span className="font-semibold">{rounds}</span>
                </label>

                <label className="setting-row">
                  <span>Turn style</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTurnStyle('alternate')}
                      className={turnStyle === 'alternate' ? 'btn-primary px-3 py-1.5' : 'btn-outline px-3 py-1.5'}
                    >
                      Alternate
                    </button>
                    <button
                      onClick={() => setTurnStyle('all-at-once')}
                      className={turnStyle === 'all-at-once' ? 'btn-primary px-3 py-1.5' : 'btn-outline px-3 py-1.5'}
                    >
                      All at once
                    </button>
                  </div>
                </label>
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Player Names</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {names.slice(0, players).map((name, idx) => (
                    <input
                      key={idx}
                      value={name}
                      onChange={e => {
                        const next = names.slice();
                        next[idx] = e.target.value;
                        setNames(next);
                      }}
                      className="settings-input !w-full"
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <button onClick={resetDefaults} className="btn-outline py-2.5">Reset to defaults</button>
                <button onClick={selectGamemode} className="btn-primary py-2.5">Select Gamemode</button>
              </div>
            </section>
          )}

          {tab === 'party' && (
            <section className="surface-card p-5 relative">
              <button onClick={() => setJoinOpen(true)} className="btn-outline px-3 py-2 text-sm absolute right-5 top-5">
                Join by code
              </button>

              <p className="eyebrow mb-2">Party</p>
              <h2 className="headline-serif text-3xl mb-5">Hosted Party</h2>

              {!isFirebaseConfigured() && (
                <div className="surface-card-soft p-4 text-sm">
                  Add Firebase env vars to enable online party hosting and joining.
                </div>
              )}

              {isFirebaseConfigured() && room && (
                <>
                  <div className="surface-card-soft p-4 mb-4">
                    <p className="font-semibold mb-2">Party Members</p>
                    <div className="grid gap-2">
                      {room.members.map(member => (
                        <div key={member.id} className="surface-card p-3 flex items-center gap-3">
                          <img src={avatarToDataUri(member.avatar)} alt={`${member.name} avatar`} className="w-12 h-12 border border-[var(--line)]" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{member.name}</p>
                            <p className="text-xs content-muted">{member.isHost ? 'Host' : 'Joined'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="content-muted text-sm">Party Code</p>
                    <p className="headline-serif text-5xl tracking-[0.2em] mt-1">{room.code}</p>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </div>

      {joinOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="surface-card w-full max-w-sm p-5">
            <p className="eyebrow mb-2">Join Party</p>
            <h3 className="headline-serif text-2xl mb-4">Enter 4-letter code</h3>
            <div className="grid grid-cols-4 gap-2 mb-5">
              {joinCode.map((value, idx) => (
                <input
                  key={idx}
                  ref={el => {
                    joinRefs.current[idx] = el;
                  }}
                  value={value}
                  maxLength={1}
                  onChange={e => {
                    const char = (e.target.value || '').toUpperCase().replace(/[^A-Z]/g, '');
                    const next = joinCode.slice();
                    next[idx] = char;
                    setJoinCode(next);
                    if (char && idx < 3) joinRefs.current[idx + 1]?.focus();
                  }}
                  className="settings-input !w-full text-center text-2xl font-bold"
                  inputMode="text"
                />
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
