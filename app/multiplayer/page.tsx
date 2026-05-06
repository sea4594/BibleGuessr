'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainBottomNav from '@/components/MainBottomNav';
import { useUiSettings } from '@/lib/uiSettingsContext';
import { useGame } from '@/lib/gameContext';
import { gameModes, GameModeId } from '@/lib/gameModes';
import { bibleData } from '@/lib/bibleData';

export default function MultiplayerPage() {
  const router = useRouter();
  const { settings } = useUiSettings();
  const { startGame } = useGame();

  const [players, setPlayers] = useState(2);
  const [rounds, setRounds] = useState<5 | 10>(settings.preferredRounds);
  const [names, setNames] = useState<string[]>(['Player 1', 'Player 2']);
  const [modeId, setModeId] = useState<GameModeId>('full-bible');
  const [turnStyle, setTurnStyle] = useState<'alternate' | 'all-at-once'>('alternate');
  const [selectedBook, setSelectedBook] = useState(bibleData[0].book);

  const handlePlayersChange = (next: number) => {
    const normalized = Math.min(8, Math.max(2, next));
    setPlayers(normalized);
    setNames(prev => {
      const adjusted = prev.slice(0, normalized);
      while (adjusted.length < normalized) {
        adjusted.push(`Player ${adjusted.length + 1}`);
      }
      return adjusted;
    });
  };

  const [turnOrder, setTurnOrder] = useState<string[]>([]);

  const modeConfig = gameModes[modeId];

  const startMultiplayer = () => {
    const activePlayers = names
      .slice(0, players)
      .map((name, idx) => (name || `Player ${idx + 1}`).trim() || `Player ${idx + 1}`);

    const multiplayerModeConfig = modeConfig.isSingleBook
      ? { ...modeConfig, books: [bibleData.find(b => b.book === selectedBook)!] }
      : modeConfig;

    startGame({
      mode: modeId,
      modeConfig: multiplayerModeConfig,
      totalRounds: players * rounds,
      selectedBook: modeConfig.isSingleBook ? selectedBook : undefined,
      multiplayer: {
        enabled: true,
        players: activePlayers,
        roundsPerPlayer: rounds,
        turnStyle,
      },
    });

    router.push(`/play/${modeId}/game`);
  };

  const generateTurnOrder = () => {
    const source = names.slice(0, players);

    const order: string[] = [];
    if (turnStyle === 'alternate') {
      for (let round = 0; round < rounds; round++) {
        for (const name of source) {
          order.push(`R${round + 1}: ${name}`);
        }
      }
    } else {
      for (const name of source) {
        for (let round = 0; round < rounds; round++) {
          order.push(`${name} - Turn ${round + 1}`);
        }
      }
    }

    setTurnOrder(order);
  };

  return (
    <main className="app-screen">
      <header className="topbar">
        <Link href="/" className="btn-outline px-3 py-2 text-sm">Home</Link>
        <div className="font-semibold">Multiplayer</div>
        <Link href="/profile" className="btn-outline px-3 py-2 text-sm">Profile</Link>
      </header>

      <div className="app-content app-content-scroll">
      <div className="page max-w-3xl">
        <section className="surface-card p-5">
          <p className="eyebrow mb-2">Multiplayer</p>
          <h1 className="headline-serif text-3xl sm:text-4xl mb-3">Local Pass-and-Play</h1>
          <p className="content-muted mb-6">
            Multiplayer is configured as local pass-and-play. Each player takes turns on the same device.
          </p>

          <div className="settings-list">
            <label className="setting-row">
              <span>Players</span>
              <input
                type="number"
                min={2}
                max={8}
                value={players}
                onChange={e => handlePlayersChange(parseInt(e.target.value || '2', 10))}
                className="settings-input"
              />
            </label>

            <label className="setting-row">
              <span>Rounds per player</span>
              <div className="flex gap-2">
                {([5, 10] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => setRounds(n)}
                    className={rounds === n ? 'btn-primary px-3 py-1.5' : 'btn-outline px-3 py-1.5'}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </label>

            <label className="setting-row">
              <span>Mode</span>
              <select
                value={modeId}
                onChange={e => setModeId(e.target.value as GameModeId)}
                className="settings-input !w-48"
              >
                {Object.values(gameModes).map(mode => (
                  <option key={mode.id} value={mode.id}>{mode.name}</option>
                ))}
              </select>
            </label>

            {modeConfig.isSingleBook && (
              <label className="setting-row">
                <span>Book</span>
                <select
                  value={selectedBook}
                  onChange={e => setSelectedBook(e.target.value)}
                  className="settings-input !w-48"
                >
                  {bibleData.map(b => (
                    <option key={b.book} value={b.book}>{b.book}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="setting-row">
              <span>Hot Seat</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setTurnStyle('alternate')}
                  className={turnStyle === 'alternate' ? 'btn-primary px-3 py-1.5' : 'btn-outline px-3 py-1.5'}
                >
                  Alternate turns
                </button>
                <button
                  onClick={() => setTurnStyle('all-at-once')}
                  className={turnStyle === 'all-at-once' ? 'btn-primary px-3 py-1.5' : 'btn-outline px-3 py-1.5'}
                >
                  All turns at once
                </button>
              </div>
            </label>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold mb-2">Player Names</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {names.slice(0, players).map((name, idx) => (
                <input
                  key={idx}
                  value={name}
                  onChange={e => {
                    const next = names.slice();
                    next[idx] = e.target.value || `Player ${idx + 1}`;
                    setNames(next);
                  }}
                  className="settings-input !w-full"
                  aria-label={`Player ${idx + 1} name`}
                />
              ))}
            </div>
          </div>

          <div className="surface-card-soft p-4 mt-5">
            <p className="text-sm"><strong>Configured:</strong> {players} players, {rounds} rounds each, {modeConfig.name}.</p>
            <p className="text-sm mt-1 content-muted">Turn style: {turnStyle === 'alternate' ? 'Alternate turns' : 'All turns at once'}.</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={generateTurnOrder} className="btn-primary px-4 py-2">Generate Turn Order</button>
            <button onClick={startMultiplayer} className="btn-primary px-4 py-2">Start Multiplayer Round</button>
            {turnOrder.length > 0 && (
              <button onClick={() => setTurnOrder([])} className="btn-outline px-4 py-2">Clear</button>
            )}
          </div>

          {turnOrder.length > 0 && (
            <div className="surface-card-soft p-4 mt-4 max-h-64 overflow-y-auto">
              <p className="text-sm font-semibold mb-2">Turn Queue</p>
              <ol className="text-sm content-muted space-y-1">
                {turnOrder.map((entry, idx) => (
                  <li key={idx}>{idx + 1}. {entry}</li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/single-player" className="btn-outline px-4 py-2.5">Browse Single Modes</Link>
          </div>
        </section>
      </div>
      </div>
      <MainBottomNav />
    </main>
  );
}
