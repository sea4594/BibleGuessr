'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function MultiplayerPage() {
  const [players, setPlayers] = useState(2);
  const [rounds, setRounds] = useState(5);
  const [names, setNames] = useState<string[]>(['Player 1', 'Player 2']);

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

  const generateTurnOrder = () => {
    const source = names.slice(0, players);
    for (let i = source.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [source[i], source[j]] = [source[j], source[i]];
    }

    const order: string[] = [];
    for (let round = 0; round < rounds; round++) {
      for (const name of source) {
        order.push(`R${round + 1}: ${name}`);
      }
    }
    setTurnOrder(order);
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="max-w-3xl mx-auto">
        <section className="surface-card p-6 sm:p-8">
          <p className="eyebrow mb-2">Multiplayer</p>
          <h1 className="headline-serif text-4xl sm:text-5xl mb-3">Local Pass-and-Play</h1>
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
                {[5, 10].map(n => (
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
            <p className="text-sm"><strong>Configured:</strong> {players} players, {rounds} rounds each.</p>
            <p className="text-sm mt-1 content-muted">Generate an order and use any single-player mode as your verse source.</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={generateTurnOrder} className="btn-primary px-4 py-2">Generate Turn Order</button>
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
            <Link href="/single-player" className="btn-primary px-4 py-2.5">Go to Modes</Link>
            <Link href="/" className="btn-outline px-4 py-2.5">Back to Main Menu</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
