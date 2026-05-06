'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function MultiplayerPage() {
  const [players, setPlayers] = useState(2);
  const [rounds, setRounds] = useState(5);

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
                onChange={e => setPlayers(Math.min(8, Math.max(2, parseInt(e.target.value || '2', 10))))}
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

          <div className="surface-card-soft p-4 mt-5">
            <p className="text-sm"><strong>Configured:</strong> {players} players, {rounds} rounds each.</p>
            <p className="text-sm mt-1 content-muted">Start a standard mode from Single Player and rotate device turns manually for now.</p>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/single-player" className="btn-primary px-4 py-2.5">Go to Modes</Link>
            <Link href="/" className="btn-outline px-4 py-2.5">Back to Main Menu</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
