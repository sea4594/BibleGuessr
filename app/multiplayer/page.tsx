'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import MainBottomNav from '@/components/MainBottomNav';
import AvatarEditor from '@/components/AvatarEditor';
import HorizontalWheel from '@/components/HorizontalWheel';
import GameModeSelector from '@/components/GameModeSelector';
import CustomBookSelectorPopup from '@/components/CustomBookSelectorPopup';
import { defaultHotSeatSettings, readHotSeatSettings, writeHotSeatSettings, type HotSeatSettings } from '@/lib/hotSeatSettings';
import { BookData } from '@/lib/bibleData';
import { gameModes, GameModeId } from '@/lib/gameModes';
import { useGame } from '@/lib/gameContext';
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
import { DISPLAY_NAME_MAX_LENGTH, normalizeDisplayName, readClientId, readLocalProfile, writeLocalProfile, type UserProfile } from '@/lib/userProfile';
import { avatarToDataUri, type AvatarSpec } from '@/lib/avatarSystem';
import { PARTY_TIMER_SECOND_OPTIONS, clampTimerSeconds, formatTimerOptionLabel, toTimerDurationSeconds } from '@/lib/timerOptions';
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
  const { startGame } = useGame();
  const [tab, setTab] = useState<'hot-seat' | 'party'>(() => {
    const requestedTab = readInitialTabParam();
    if (requestedTab === 'party' || requestedTab === 'hot-seat') return requestedTab;
    return readInitialMultiplayerTab();
  });
  const firebaseConfigured = isFirebaseConfigured();

  // Keep the server/client first render identical. Device-local Hot Seat settings are
  // restored once after mount below, before persistence is enabled.
  const [players, setPlayers] = useState(defaultHotSeatSettings.players);
  const [rounds, setRounds] = useState(defaultHotSeatSettings.rounds);
  const [turnStyle, setTurnStyle] = useState(defaultHotSeatSettings.turnStyle);
  const [names, setNames] = useState<string[]>(defaultHotSeatSettings.names);
  const [timerSeconds, setTimerSeconds] = useState(defaultHotSeatSettings.timerSeconds);
  const [hotSeatModeId, setHotSeatModeId] = useState<GameModeId>(defaultHotSeatSettings.modeId);
  const [hotSeatBook, setHotSeatBook] = useState(defaultHotSeatSettings.selectedBook);
  const [hotSeatBooks, setHotSeatBooks] = useState(defaultHotSeatSettings.selectedBooks);
  const [hotSeatSettingsReady, setHotSeatSettingsReady] = useState(false);

  const [room, setRoom] = useState<PartyRoom | null>(null);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(() => readInitialCodeParam() ?? readInitialPartyCode());
  const [joinCode, setJoinCode] = useState(['', '', '', '']);
  const joinRefs = useRef<Array<HTMLInputElement | null>>([]);
  const pendingJoinFocusRef = useRef<number | null>(null);
  const [showPartyAvatarEditor, setShowPartyAvatarEditor] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState<AvatarSpec | null>(null);
  const avatarDraftRef = useRef<AvatarSpec | null>(null);
  const [editingPartyName, setEditingPartyName] = useState(false);
  const [partyNameDraft, setPartyNameDraft] = useState('');
  const navigatingToPartyGameRef = useRef(false);

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
  const [partyIdentityReady, setPartyIdentityReady] = useState(!firebaseConfigured);
  const suppressLobbyLeaveRef = useRef(false);
  const leavingPartyRef = useRef(false);
  const partyJoinPendingRef = useRef(false);
  const joiningPartyCodeRef = useRef<string | null>(null);
  const partyLifecycleRef = useRef<{ tab: 'hot-seat' | 'party'; activeRoomCode: string | null; partyMemberId: string; gameStatus: 'lobby' | 'in-round' | 'round-complete' | 'finished' | undefined }>({
    tab, activeRoomCode, partyMemberId, gameStatus: room?.game?.status,
  });

  const displayName = useMemo(() => {
    const profileName = normalizeDisplayName(profile.name);
    if (profileName) return profileName;
    return normalizeDisplayName(user?.displayName ?? '') || 'Player';
  }, [profile.name, user?.displayName]);

  const accountUid = user?.uid ?? null;
  const isSelfMemberId = useCallback((memberId: string) => (
    memberId === partyMemberId || memberId === clientId || Boolean(accountUid && memberId === accountUid)
  ), [accountUid, clientId, partyMemberId]);
  const isHost = Boolean(room?.hostId && isSelfMemberId(room.hostId));
  const isCurrentMember = Boolean(room?.members.some(member => isSelfMemberId(member.id)));
  const currentPartyMember = room?.members.find(member => isSelfMemberId(member.id)) ?? null;

  partyLifecycleRef.current = {
    tab,
    activeRoomCode,
    partyMemberId: accountUid ?? partyMemberId,
    gameStatus: room?.game?.status,
  };

  const persistPartyProfile = useCallback(async (nextProfile: UserProfile) => {
    const normalizedProfile = { ...nextProfile, name: normalizeDisplayName(nextProfile.name) || 'Player' };
    setProfile(normalizedProfile);
    writeLocalProfile(normalizedProfile);
    if (activeRoomCode && firebaseConfigured && isCurrentMember && !leavingPartyRef.current) {
      await upsertPartyMember(activeRoomCode, {
        id: accountUid ?? partyMemberId,
        name: normalizedProfile.name,
        avatar: normalizedProfile.avatar,
        isHost: Boolean(room?.hostId && isSelfMemberId(room.hostId)),
        joinedAt: currentPartyMember?.joinedAt ?? Date.now(),
      });
    }
  }, [activeRoomCode, currentPartyMember?.joinedAt, firebaseConfigured, isCurrentMember, accountUid, isSelfMemberId, partyMemberId, room?.hostId]);

  const commitPartyName = useCallback(async () => {
    const trimmed = normalizeDisplayName(partyNameDraft);
    setEditingPartyName(false);
    if (!trimmed || trimmed === profile.name) {
      setPartyNameDraft(profile.name);
      return;
    }
    await persistPartyProfile({ ...profile, name: trimmed });
  }, [partyNameDraft, persistPartyProfile, profile]);

  const savePartyAvatar = useCallback(async (avatar: AvatarSpec) => {
    avatarDraftRef.current = null;
    setAvatarDraft(null);
    await persistPartyProfile({ ...profile, avatar });
  }, [persistPartyProfile, profile]);

  const flushPartyIdentityEdits = useCallback(async () => {
    let nextProfile = profile;
    let changed = false;
    if (editingPartyName) {
      const trimmed = normalizeDisplayName(partyNameDraft);
      if (trimmed && trimmed !== nextProfile.name) {
        nextProfile = { ...nextProfile, name: trimmed };
        changed = true;
      }
    }
    if (showPartyAvatarEditor && avatarDraftRef.current) {
      nextProfile = { ...nextProfile, avatar: avatarDraftRef.current };
      changed = true;
    }
    setEditingPartyName(false);
    setShowPartyAvatarEditor(false);
    setAvatarDraft(null);
    avatarDraftRef.current = null;
    if (changed) await persistPartyProfile(nextProfile);
    return nextProfile;
  }, [editingPartyName, partyNameDraft, persistPartyProfile, profile, showPartyAvatarEditor]);
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
    const stored = readHotSeatSettings();
    setPlayers(stored.players);
    setRounds(stored.rounds);
    setTurnStyle(stored.turnStyle);
    setNames(stored.names);
    setTimerSeconds(stored.timerSeconds);
    setHotSeatModeId(stored.modeId);
    setHotSeatBook(stored.selectedBook);
    setHotSeatBooks(stored.selectedBooks);
    setHotSeatSettingsReady(true);
  }, []);

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
    if (!firebaseConfigured) {
      setPartyIdentityReady(true);
      return;
    }
    let cancelled = false;
    setPartyIdentityReady(false);

    const resolveId = async () => {
      while (!cancelled) {
        await ensureFirebaseSession();
        const authUid = getFirebaseAuth()?.currentUser?.uid;
        if (authUid) {
          if (!cancelled) {
            setPartyMemberId(authUid);
            setPartyIdentityReady(true);
            setPartyLobbyError('');
          }
          return;
        }
        await new Promise(resolve => window.setTimeout(resolve, 900));
      }
    };

    void resolveId();
    return () => { cancelled = true; };
  }, [clientId, firebaseConfigured]);


  useEffect(() => {
    if (!hotSeatSettingsReady) return;
    writeHotSeatSettings({
      players,
      rounds,
      turnStyle,
      names,
      timerSeconds: clampTimerSeconds(timerSeconds),
      modeId: hotSeatModeId,
      selectedBook: hotSeatBook,
      selectedBooks: hotSeatBooks,
    });
  }, [hotSeatSettingsReady, players, rounds, turnStyle, names, timerSeconds, hotSeatModeId, hotSeatBook, hotSeatBooks]);

  const persistHotSeatSettingsNow = useCallback((patch: Partial<HotSeatSettings> = {}) => {
    writeHotSeatSettings({
      players,
      rounds,
      turnStyle,
      names,
      timerSeconds: clampTimerSeconds(timerSeconds),
      modeId: hotSeatModeId,
      selectedBook: hotSeatBook,
      selectedBooks: hotSeatBooks,
      ...patch,
    });
  }, [players, rounds, turnStyle, names, timerSeconds, hotSeatModeId, hotSeatBook, hotSeatBooks]);

  useEffect(() => {
    if (tab !== 'party' || !firebaseConfigured || !partyIdentityReady) return;
    let unsubscribe: () => void = () => {};
    let cancelled = false;
    let retryTimer: number | null = null;

    const scheduleRetry = (callback: () => void, delay = 900) => {
      if (cancelled || retryTimer !== null) return;
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        if (!cancelled) callback();
      }, delay);
    };

    const subscribeToRoom = (code: string) => {
      unsubscribe();
      setPartyLobbyPending(true);
      unsubscribe = subscribeToParty(
        code,
        next => {
          if (cancelled) return;
          if (!next) {
            // Leaving the automatically-created host room deletes it when this device
            // is its only member. Ignore that old room's final null snapshot while a
            // guest join is in flight, or it will clear the target code and auto-host
            // a brand-new room underneath the successful join.
            if (joiningPartyCodeRef.current && joiningPartyCodeRef.current !== code) return;
            setRoom(null);
            setPartyLobbyPending(true);
            setPartyLobbyError('');
            if (joiningPartyCodeRef.current === code) {
              scheduleRetry(() => subscribeToRoom(code), 350);
            } else {
              setActiveRoomCode(null);
            }
            return;
          }

          const authUid = getFirebaseAuth()?.currentUser?.uid;
          const stillMember = next.members.some(member =>
            member.id === partyMemberId || member.id === clientId || Boolean(authUid && member.id === authUid)
          );
          if (!stillMember) {
            // While intentionally switching from our automatically-created host room
            // into another party, ignore the old room's final membership update.
            // Clearing activeRoomCode here would otherwise immediately create a new host
            // room and make a successful guest join look like it failed.
            if (joiningPartyCodeRef.current && joiningPartyCodeRef.current !== code) return;
            setRoom(null);
            setPartyLobbyPending(true);
            setPartyLobbyError('');
            if (!joiningPartyCodeRef.current) setActiveRoomCode(null);
            return;
          }

          if (joiningPartyCodeRef.current === code) joiningPartyCodeRef.current = null;
          leavingPartyRef.current = false;
          setRoom(next);
          setPartyLobbyPending(false);
          setPartyLobbyError('');
        },
        () => {
          if (cancelled) return;
          setPartyLobbyPending(true);
          setPartyLobbyError('');
          scheduleRetry(() => subscribeToRoom(code));
        }
      );
    };

    const createRoom = async () => {
      if (cancelled) return;
      setPartyLobbyPending(true);
      setPartyLobbyError('');

      const hasSession = await ensureFirebaseSession();
      if (cancelled) return;
      const authUid = getFirebaseAuth()?.currentUser?.uid;
      if (!hasSession || !authUid) {
        scheduleRetry(() => { void createRoom(); });
        return;
      }

      const created = await hostParty({
        id: partyMemberId,
        name: displayName,
        avatar: profile.avatar,
        isHost: true,
        joinedAt: Date.now(),
      });
      if (cancelled) return;

      if (!created) {
        scheduleRetry(() => { void createRoom(); });
        return;
      }

      leavingPartyRef.current = false;
      setActiveRoomCode(created.code);
      setRoom(created);
      setPartyLobbyPending(false);
      setPartyLobbyError('');
      subscribeToRoom(created.code);
    };

    if (activeRoomCode) subscribeToRoom(activeRoomCode);
    else if (!joiningPartyCodeRef.current) void createRoom();

    return () => {
      cancelled = true;
      unsubscribe();
      if (retryTimer !== null) window.clearTimeout(retryTimer);
    };
  }, [tab, activeRoomCode, clientId, displayName, firebaseConfigured, partyIdentityReady, partyMemberId, profile.avatar]);


  useEffect(() => {
    if (tab !== 'party' || !firebaseConfigured || !activeRoomCode || !isCurrentMember) return;

    const syncMember = () => {
      if (leavingPartyRef.current) return;
      void upsertPartyMember(activeRoomCode, {
        id: accountUid ?? partyMemberId,
        name: displayName,
        avatar: profile.avatar,
        isHost: Boolean(room?.hostId && isSelfMemberId(room.hostId)),
        joinedAt: currentPartyMember?.joinedAt ?? Date.now(),
      });
    };

    syncMember();
    const heartbeat = window.setInterval(syncMember, 60_000);

    return () => window.clearInterval(heartbeat);
  }, [activeRoomCode, currentPartyMember?.joinedAt, displayName, firebaseConfigured, isCurrentMember, accountUid, isSelfMemberId, partyMemberId, profile.avatar, room?.hostId, tab]);

  useEffect(() => {
    // Leave only when this page actually unmounts. The previous dependency-based
    // cleanup also ran during ordinary room/member/status changes, which could remove
    // a guest immediately after a successful join or exactly when a game started.
    return () => {
      const current = partyLifecycleRef.current;
      if (
        current.tab === 'party' &&
        current.activeRoomCode &&
        current.gameStatus === 'lobby' &&
        !suppressLobbyLeaveRef.current
      ) {
        leavingPartyRef.current = true;
        void leaveParty(current.activeRoomCode, current.partyMemberId);
      }
    };
  }, []);

  useEffect(() => {
    if (tab !== 'party' || !room?.code || !room.game || room.game.status === 'lobby') return;
    if (navigatingToPartyGameRef.current) return;
    navigatingToPartyGameRef.current = true;
    void (async () => {
      await flushPartyIdentityEdits();
      suppressLobbyLeaveRef.current = true;
      router.push(`/multiplayer/party/game?code=${room.code}`);
    })();
  }, [flushPartyIdentityEdits, room?.code, room?.game, router, tab]);

  const applyPlayers = (value: number) => {
    const n = Math.min(8, Math.max(2, value));
    const adjustedNames = names.slice(0, n);
    while (adjustedNames.length < n) adjustedNames.push(`Player ${adjustedNames.length + 1}`);
    setPlayers(n);
    setNames(adjustedNames);
    persistHotSeatSettingsNow({ players: n, names: adjustedNames });
  };

  const startHotSeat = () => {
    const selectedBookData = hotSeatModeId === 'book-selection'
      ? bibleData.find(book => book.book === hotSeatBook) ?? bibleData[0]
      : null;
    const selectedCustomBooks = hotSeatModeId === 'custom'
      ? bibleData.filter(book => hotSeatBooks.includes(book.book))
      : [];
    if (hotSeatModeId === 'custom' && selectedCustomBooks.length === 0) return;

    const modeConfig = hotSeatModeId === 'book-selection' && selectedBookData
      ? { ...gameModes[hotSeatModeId], books: [selectedBookData] }
      : hotSeatModeId === 'custom'
        ? { ...gameModes[hotSeatModeId], books: selectedCustomBooks }
        : gameModes[hotSeatModeId];
    const hotSeatPlayers = names.slice(0, players).map((name, idx) => name.trim() || `Player ${idx + 1}`);

    persistHotSeatSettingsNow();
    startGame({
      mode: hotSeatModeId,
      modeConfig,
      totalRounds: players * rounds,
      timerDurationSeconds: toTimerDurationSeconds(timerSeconds),
      selectedBook: selectedBookData?.book,
      returnPath: '/multiplayer?tab=hot-seat',
      multiplayer: {
        enabled: true,
        lobbyType: 'hot-seat',
        players: hotSeatPlayers,
        roundsPerPlayer: rounds,
        turnStyle,
      },
    });
    router.push(`/play/${hotSeatModeId}/game`);
  };

  const submitJoin = async () => {
    const code = joinCode.join('').toUpperCase();
    if (code.length !== 4 || !firebaseConfigured || partyJoinPendingRef.current) return;

    partyJoinPendingRef.current = true;
    setPartyJoinPending(true);
    joiningPartyCodeRef.current = code;

    try {
      const hasSession = await ensureFirebaseSession();
      const authUid = getFirebaseAuth()?.currentUser?.uid;
      if (!hasSession || !authUid) {
        joiningPartyCodeRef.current = null;
        setPartyLobbyError('Unable to connect to Party right now. Please try again.');
        return;
      }

      // Join and subscribe with one stable identity. partyMemberId can still contain
      // the device client id for a render while Firebase auth finishes restoring.
      // Using the auth UID here prevents the room from writing one id and the local
      // membership check immediately looking for another.
      const joiningMemberId = authUid;
      if (partyMemberId !== joiningMemberId) setPartyMemberId(joiningMemberId);

      if (activeRoomCode && activeRoomCode !== code) {
        leavingPartyRef.current = true;
        await leaveParty(activeRoomCode, joiningMemberId);
      }

      const ok = await joinParty(code, {
        id: joiningMemberId,
        name: displayName,
        avatar: profile.avatar,
        isHost: false,
        joinedAt: 0,
      });
      if (ok) {
        leavingPartyRef.current = false;
        setPartyLobbyError('');
        setPartyStartError('');
        setJoinCode(['', '', '', '']);
        setRoom(null);
        setActiveRoomCode(code);
      } else {
        joiningPartyCodeRef.current = null;
        setPartyLobbyError('Could not join that party code. Check the code and try again.');
      }
    } finally {
      partyJoinPendingRef.current = false;
      setPartyJoinPending(false);
    }
  };

  const updateJoinCodeSlot = (index: number, value: string) => {
    const char = (value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
    const next = joinCode.slice();
    next[index] = char;
    setJoinCode(next);

    if (char && index < 3) {
      const nextIndex = index + 1;
      pendingJoinFocusRef.current = nextIndex;
      requestAnimationFrame(() => {
        const target = joinRefs.current[nextIndex];
        target?.focus();
        target?.setSelectionRange(0, 0);
      });
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

  const handleJoinCodeFocus = (index: number, input: HTMLInputElement) => {
    if (pendingJoinFocusRef.current === index) {
      pendingJoinFocusRef.current = null;
      return;
    }

    const firstEmpty = joinCode.findIndex(slot => !slot);
    if (!joinCode[index] && firstEmpty >= 0 && firstEmpty !== index) {
      requestAnimationFrame(() => {
        const target = joinRefs.current[firstEmpty];
        target?.focus();
        target?.select();
      });
      return;
    }

    requestAnimationFrame(() => input.select());
  };

  const handleLeaveLobby = () => {
    if (!activeRoomCode || !room || isHost) return;
    const codeToLeave = activeRoomCode;
    joiningPartyCodeRef.current = null;
    partyJoinPendingRef.current = false;
    leavingPartyRef.current = true;
    setRoom(null);
    setActiveRoomCode(null);
    setPartyLobbyError('');
    setPartyStartError('');
    setPartyActionPending(false);
    void leaveParty(codeToLeave, partyMemberId).then(ok => {
      if (!ok) console.warn('Unable to remove this member from the lobby after leaving.');
    });
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
      leavingPartyRef.current = true;
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
    await flushPartyIdentityEdits();

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

    navigatingToPartyGameRef.current = true;
    suppressLobbyLeaveRef.current = true;
    router.push(`/multiplayer/party/game?code=${room.code}`);
  };

  return (
    <main className="app-screen primary-nav-screen">
      {showPartyAvatarEditor && (
        <AvatarEditor
          avatar={avatarDraft ?? profile.avatar}
          onDraftChange={avatar => { avatarDraftRef.current = avatar; setAvatarDraft(avatar); }}
          onSave={savePartyAvatar}
          onClose={() => { setShowPartyAvatarEditor(false); setAvatarDraft(null); avatarDraftRef.current = null; }}
        />
      )}

      <div className={tab === 'party' ? 'app-content app-content-fixed multiplayer-party-content' : 'app-content app-content-fixed multiplayer-hotseat-content'}>
        <div className={tab === 'party' ? 'page max-w-4xl min-w-0 multiplayer-party-page' : 'page max-w-4xl min-w-0 multiplayer-hotseat-page'}>
          <div className="multiplayer-tab-row grid grid-cols-2 gap-2">
            <button onClick={() => void switchTab('party')} className={tab === 'party' ? 'btn-primary py-2.5' : 'btn-outline py-2.5'}>Party</button>
            <button onClick={() => void switchTab('hot-seat')} className={tab === 'hot-seat' ? 'btn-primary py-2.5' : 'btn-outline py-2.5'}>Hot Seat</button>
          </div>

          {tab === 'hot-seat' && (
            <div className="hotseat-shell setup-controls-stack min-w-0">
              <GameModeSelector
                modeId={hotSeatModeId}
                onModeChange={mode => { setHotSeatModeId(mode); persistHotSeatSettingsNow({ modeId: mode }); }}
                selectedBook={hotSeatBook}
                onBookChange={book => { setHotSeatBook(book); persistHotSeatSettingsNow({ selectedBook: book }); }}
                selectedBooks={hotSeatBooks}
                onSelectedBooksChange={books => { setHotSeatBooks(books); persistHotSeatSettingsNow({ selectedBooks: books }); }}
              />

              <HorizontalWheel
                label="Rounds per player"
                values={ROUND_VALUES}
                selected={rounds}
                onChange={value => { setRounds(value); persistHotSeatSettingsNow({ rounds: value }); }}
              />

              <div className="hotseat-turn-buttons" aria-label="Turn order">
                <button
                  onClick={() => { setTurnStyle('alternate'); persistHotSeatSettingsNow({ turnStyle: 'alternate' }); }}
                  className={turnStyle === 'alternate' ? 'btn-primary hotseat-turn-style-btn' : 'btn-outline hotseat-turn-style-btn'}
                >
                  Alternate
                </button>
                <button
                  onClick={() => { setTurnStyle('all-at-once'); persistHotSeatSettingsNow({ turnStyle: 'all-at-once' }); }}
                  className={turnStyle === 'all-at-once' ? 'btn-primary hotseat-turn-style-btn' : 'btn-outline hotseat-turn-style-btn'}
                >
                  All at once
                </button>
              </div>

              <HorizontalWheel
                label="Timer (seconds)"
                values={PARTY_TIMER_VALUES}
                selected={timerSeconds}
                onChange={value => { setTimerSeconds(value); persistHotSeatSettingsNow({ timerSeconds: clampTimerSeconds(value) }); }}
                formatValue={formatTimerOptionLabel}
              />

              <HorizontalWheel label="Player count" values={PLAYER_VALUES} selected={players} onChange={applyPlayers} />

              <section className="hotseat-names-window">
                <p className="setup-control-label mb-2">Player Names</p>
                <div className="grid gap-2 sm:grid-cols-2 hotseat-names-list">
                  {names.slice(0, players).map((name, idx) => (
                    <input
                      key={idx}
                      value={name}
                      onChange={e => {
                        const nextNames = names.slice();
                        nextNames[idx] = e.target.value;
                        setNames(nextNames);
                        persistHotSeatSettingsNow({ names: nextNames });
                      }}
                      className="settings-input !w-full"
                      maxLength={DISPLAY_NAME_MAX_LENGTH}
                    />
                  ))}
                </div>
              </section>

              {hotSeatModeId === 'custom' && hotSeatBooks.length === 0 && (
                <p className="text-xs text-[var(--danger)]">Select at least one book.</p>
              )}

              <button
                onClick={startHotSeat}
                disabled={hotSeatModeId === 'custom' && hotSeatBooks.length === 0}
                className="btn-primary setup-start-btn hotseat-start-btn"
              >
                Start
              </button>
            </div>
          )}

          {tab === 'party' && (
            <section className="party-lobby-shell">
              {room && isCurrentMember && !isHost ? (
                <div className="party-lobby-status-card party-header-half mb-3">
                  <p className="content-muted text-xs">Joined Lobby</p>
                  <p className="headline-serif party-code-value">{room.code}</p>
                  <button onClick={handleLeaveLobby} className="btn-outline party-lobby-corner-action">Leave Lobby</button>
                </div>
              ) : room && isHost && room.members.length > 1 ? (
                <div className="party-lobby-status-card party-header-half mb-3">
                  <p className="content-muted text-xs">Hosting</p>
                  <p className="headline-serif party-code-value">{room.code}</p>
                  <button
                    onClick={() => void handleEndLobby()}
                    disabled={partyActionPending}
                    className="btn-outline party-lobby-corner-action"
                  >
                    {partyActionPending ? 'Ending...' : 'End Lobby'}
                  </button>
                </div>
              ) : (
              <div className="party-header-row">
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
                        onFocus={event => handleJoinCodeFocus(idx, event.currentTarget)}
                        onClick={event => handleJoinCodeFocus(idx, event.currentTarget)}
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
              )}

              {!firebaseConfigured && <div className="surface-card-soft p-4 text-sm">Add Firebase env vars to enable online party hosting and joining.</div>}
              {firebaseConfigured && !room && (
                <div className="surface-card-soft p-4 text-sm">
                  <p>Preparing your party code…</p>
                  {partyLobbyError && <p className="text-[var(--danger)] mt-2">{partyLobbyError}</p>}
                </div>
              )}
              {firebaseConfigured && room && (
                <>
                  <div className="party-lobby-main">
                    <div className="party-members-block">
                    <div className="party-members-list grid gap-1.5">
                      {room.members.map(member => {
                        const isSelf = isSelfMemberId(member.id);
                        return (
                          <div key={member.id} className={isSelf ? 'party-member-row is-self' : 'party-member-row'}>
                            {isSelf ? (
                              <button
                                type="button"
                                className="party-member-avatar-button"
                                aria-label="Edit your avatar"
                                onClick={() => {
                                  avatarDraftRef.current = profile.avatar;
                                  setAvatarDraft(profile.avatar);
                                  setShowPartyAvatarEditor(true);
                                }}
                              >
                                <Image
                                  src={avatarToDataUri(member.avatar)}
                                  alt={`${member.name} avatar`}
                                  width={36}
                                  height={36}
                                  unoptimized
                                  className="w-9 h-9"
                                />
                              </button>
                            ) : (
                              <Image
                                src={avatarToDataUri(member.avatar)}
                                alt={`${member.name} avatar`}
                                width={36}
                                height={36}
                                unoptimized
                                className="w-9 h-9"
                              />
                            )}
                            <div className="party-member-main">
                              <div className="party-member-name-wrap">
                                {isSelf && editingPartyName ? (
                                  <input
                                    value={partyNameDraft}
                                    onChange={event => setPartyNameDraft(event.target.value)}
                                    onBlur={() => void commitPartyName()}
                                    onKeyDown={event => {
                                      if (event.key === 'Enter') event.currentTarget.blur();
                                      if (event.key === 'Escape') {
                                        setPartyNameDraft(profile.name);
                                        setEditingPartyName(false);
                                      }
                                    }}
                                    className="party-member-name-input"
                                    maxLength={DISPLAY_NAME_MAX_LENGTH}
                                    autoFocus
                                    aria-label="Edit your display name"
                                  />
                                ) : isSelf ? (
                                  <button
                                    type="button"
                                    className="party-member-name-button"
                                    onClick={() => { setPartyNameDraft(profile.name || member.name); setEditingPartyName(true); }}
                                  >
                                    {member.name}
                                  </button>
                                ) : (
                                  <p className="party-member-name-text">{member.name}</p>
                                )}
                              </div>
                              {(isSelf || member.isHost) && (
                                <span className="party-member-role">{isSelf ? (member.isHost ? 'You - Host' : 'You') : 'Host'}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                    <div className="party-host-controls setup-controls-stack">
                      {isHost ? (
                        <>
                          <GameModeSelector
                            modeId={lobbySettings?.modeId ?? 'full-bible'}
                            onModeChange={mode => {
                              void applyLobbySettings({
                                modeId: mode,
                                selectedBook: mode === 'book-selection' ? (lobbySettings?.selectedBook ?? bibleData[0].book) : null,
                                selectedBooks: mode === 'custom'
                                  ? (lobbySettings?.selectedBooks?.length ? lobbySettings.selectedBooks : bibleData.map(book => book.book))
                                  : null,
                              });
                            }}
                            selectedBook={lobbySettings?.selectedBook ?? bibleData[0].book}
                            onBookChange={book => { void applyLobbySettings({ selectedBook: book }); }}
                            selectedBooks={lobbySettings?.selectedBooks ?? bibleData.map(book => book.book)}
                            onSelectedBooksChange={books => { void applyLobbySettings({ selectedBooks: books }); }}
                          />

                          <HorizontalWheel
                            label="Rounds"
                            values={ROUND_VALUES}
                            selected={lobbySettings?.roundsPerPlayer ?? 5}
                            onChange={value => { void applyLobbySettings({ roundsPerPlayer: value }); }}
                          />

                          <HorizontalWheel
                            label="Timer (seconds)"
                            values={PARTY_TIMER_VALUES}
                            selected={lobbySettings?.timerDurationSeconds ?? 30}
                            onChange={value => { void applyLobbySettings({ timerDurationSeconds: value }); }}
                            formatValue={formatTimerOptionLabel}
                          />

                          {lobbySettings?.modeId === 'custom' && (lobbySettings.selectedBooks?.length ?? 0) === 0 && (
                            <p className="text-xs text-[var(--danger)]">Select at least one book.</p>
                          )}
                        </>
                      ) : (
                        <div className="party-settings-readonly">
                          <p>
                            <span>Game Mode:</span>{' '}
                            {lobbySettings?.modeId === 'book-selection'
                              ? (lobbySettings.selectedBook ?? '—')
                              : lobbySettings?.modeId
                                ? gameModes[lobbySettings.modeId].name
                                : '—'}
                          </p>
                          {lobbySettings?.modeId === 'custom' && (
                            <div className="party-readonly-books-row">
                              <span>Books:</span>
                              <CustomBookSelectorPopup
                                selectedBooks={lobbySettings.selectedBooks ?? []}
                                onChange={() => undefined}
                                readOnly
                                buttonLabel={`${lobbySettings.selectedBooks?.length ?? 0} selected`}
                                buttonClassName="party-readonly-books-button"
                              />
                            </div>
                          )}
                          <p><span>Rounds:</span> {lobbySettings?.roundsPerPlayer ?? '—'}</p>
                          <p><span>Timer:</span> {lobbySettings?.timerDurationSeconds === 0 ? 'None' : lobbySettings?.timerDurationSeconds ? `${lobbySettings.timerDurationSeconds} seconds` : '—'}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {partyStartError && <p className="party-start-error text-xs text-[var(--danger)]">{partyStartError}</p>}

                  <div className="party-start-dock">
                    <button
                      onClick={() => void startParty()}
                      className="btn-primary w-full party-start-btn"
                      disabled={!isHost || !lobbyComplete || partyStartPending}
                    >
                      {isHost
                        ? partyStartPending
                          ? 'Starting...'
                          : 'Start'
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
