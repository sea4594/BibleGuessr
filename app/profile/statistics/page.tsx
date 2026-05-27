'use client';

import { useEffect, useState } from 'react';
import AppTopBar from '@/components/AppTopBar';
import MainBottomNav from '@/components/MainBottomNav';
import { ModeStatsRecord, readModeStats } from '@/lib/gameStats';
import { useAccountSync } from '@/lib/accountSync';

function formatPercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

export default function ProfileStatisticsPage() {
  const { appStateNonce } = useAccountSync();
  const [modeStats, setModeStats] = useState<ModeStatsRecord[]>(() => readModeStats());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setModeStats(readModeStats());
    }, 0);
    return () => window.clearTimeout(timer);
  }, [appStateNonce]);

  return (
    <main className="app-screen">
      <AppTopBar title="Statistics" backHref="/profile" backLabel="Profile" />
      <div className="app-content app-content-scroll">
        <div className="page max-w-xl">
          <section className="surface-card p-5">
            <p className="eyebrow mb-2">Per Mode Averages</p>
            {modeStats.length === 0 ? (
              <p className="content-muted text-sm">No completed games yet.</p>
            ) : (
              <div className="grid gap-3">
                {modeStats.map(stat => (
                  <div key={stat.modeId} className="surface-card-soft p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-semibold text-base">{stat.modeName}</p>
                      <p className="text-xs content-muted">{stat.gamesPlayed} games</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="content-muted text-xs">Average score</p>
                        <p className="font-bold">{formatPercent(stat.averageScore)}</p>
                      </div>
                      <div>
                        <p className="content-muted text-xs">Average accuracy</p>
                        <p className="font-bold">{formatPercent(stat.averageAccuracy)}</p>
                      </div>
                      <div>
                        <p className="content-muted text-xs">Best score</p>
                        <p className="font-semibold">{formatPercent(stat.bestScore)}</p>
                      </div>
                      <div>
                        <p className="content-muted text-xs">Best accuracy</p>
                        <p className="font-semibold">{formatPercent(stat.bestAccuracy)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      <MainBottomNav />
    </main>
  );
}
