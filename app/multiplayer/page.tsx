'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AppTopBar from '@/components/AppTopBar';
import MainBottomNav from '@/components/MainBottomNav';
import HorizontalWheel from '@/components/HorizontalWheel';
import TimerSetupControls from '@/components/TimerSetupControls';
import { readHotSeatSettings, writeHotSeatSettings } from '@/lib/hotSeatSettings';
import { hostParty, joinParty, PartyRoom, subscribeToParty } from '@/lib/partyEngine';
import { isFirebaseConfigured } from '@/lib/firebaseClient';
import { readClientId, readLocalProfile } from '@/lib/userProfile';
import { avatarToDataUri } from '@/lib/avatarSystem';
import { clampTimerMinutes, clampTimerSeconds } from '@/lib/timerOptions';
import { useAccountSync } from '@/lib/accountSync';

const PLAYER_VALUES = [2, 3, 4, 5, 6, 7, 8];
const ROUND_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function MultiplayerPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'hot-seat' | 'party'>('hot-seat');
  const initialHotSeat = useMemo(() => readHotSeatSettings(), []);

  const [players, setPlayers] = useState(initialHotSeat.players);
  const [rounds, setRounds] = useState(initialHotSeat.rounds);
  const [turnStyle, setTurnStyle] = useState(initialHotSeat.turnStyle);
  const [names, setNames] = useState<string[]>(initialHotSeat.names);
  const [timerMinutes, setTimerMinutes] = useState(initialHotSeat.timerMinutes);
  const [timerSeconds, setTimerSeconds] = useState(initialHotSeat.timerSeconds);

  const [room, setRoom] = useState<PartyRoom | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState(['', '', '', '']);
  const joinRefs = useRef<Array<HTMLInputElement | null>>([]);

  const { appStateNonce } = useAccountSync();
  const [profile, setProfile] = useState(() => readLocalProfile());
  const clientId = useMemo(() => readClientId(), []);

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
    if (code.length !== 4 || !isFirebaseConfigured()) return;
    const ok = await joinParty(code, { id: clientId, name: profile.name, avatar: profile.avatar, isHost: false, joinedAt: Date.now() });
    if (ok) {
      setJoinOpen(false);
      setJoinCode(['', '', '', '']);
      subscribeToParty(code, next => setRoom(next));
    }
  };

  return (
    <main className="app-screen">
      <AppTopBar title="Multiplayer" />

      <div className={`app-content ${tab === 'hot-seat' ? 'app-content-fixed' : 'app-content-scroll'}`}>
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

              <div className="grid gap-4 min-w-0">
                <HorizontalWheel label="Player count" values={PLAYER_VALUES} selected={players} onChange={applyPlayers} />

                <TimerSetupControls
                  minutes={timerMinutes}
                  seconds={timerSeconds}
                  onMinutesChange={setTimerMinutes}
                  onSecondsChange={setTimerSeconds}
                />
              </div>

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
            <section className="surface-card p-5 relative">
              <button onClick={() => setJoinOpen(true)} className="btn-outline px-3 py-2 text-sm absolute right-5 top-5">Join by code</button>
              <h2 className="headline-serif text-3xl mb-5">Hosted Party</h2>
              {!isFirebaseConfigured() && <div className="surface-card-soft p-4 text-sm">Add Firebase env vars to enable online party hosting and joining.</div>}
              {isFirebaseConfigured() && room && (
                <>
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
