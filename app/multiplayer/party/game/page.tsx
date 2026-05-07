import { Suspense } from 'react';
import PartyGameClient from './PartyGameClient';

export default function PartyGamePage() {
  return (
    <Suspense
      fallback={
        <main className="app-screen">
          <div className="app-content app-content-scroll">
            <div className="page max-w-3xl">
              <section className="surface-card p-5">Loading party game…</section>
            </div>
          </div>
        </main>
      }
    >
      <PartyGameClient />
    </Suspense>
  );
}
