'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import AppTopBar from '@/components/AppTopBar';
import TimerSetupControls from '@/components/TimerSetupControls';
import { useGame } from '@/lib/gameContext';
import { gameModes, GameModeId, sectionModeIds } from '@/lib/gameModes';
import { readHotSeatSettings, writeHotSeatSettings } from '@/lib/hotSeatSettings';
import { toTimerDurationSeconds } from '@/lib/timerOptions';

export default function HotSeatSectionSetupPage() {
  const params = useParams();
  const router = useRouter();
  const { startGame } = useGame();
  const modeId = params.mode as GameModeId;
  const initialSettings = readHotSeatSettings();
  const [timerMinutes, setTimerMinutes] = useState(initialSettings.timerMinutes);
  const [timerSeconds, setTimerSeconds] = useState(initialSettings.timerSeconds);

  if (!sectionModeIds.includes(modeId)) {
    return (
      <main className="app-screen">
        <AppTopBar title="Section Setup" backHref="/multiplayer/hot-seat/gamemode/sections" />
        <div className="app-content app-content-scroll">
          <div className="page max-w-xl">
            <section className="surface-card p-5">Invalid section mode.</section>
          </div>
        </div>
      </main>
    );
  }

  const mode = gameModes[modeId];

  const handleStart = () => {
    const settings = readHotSeatSettings();
    const players = settings.names.slice(0, settings.players).map((name, idx) => name || `Player ${idx + 1}`);
    writeHotSeatSettings({ ...settings, timerMinutes, timerSeconds });

    startGame({
      mode: modeId,
      modeConfig: mode,
      totalRounds: settings.players * settings.rounds,
      timerDurationSeconds: toTimerDurationSeconds(timerMinutes, timerSeconds),
      returnPath: '/multiplayer/hot-seat/gamemode',
      multiplayer: {
        enabled: true,
        lobbyType: 'hot-seat',
        players,
        roundsPerPlayer: settings.rounds,
        turnStyle: settings.turnStyle,
      },
    });

    router.push(`/play/${modeId}/game`);
  };

  return (
    <main className="app-screen">
      <AppTopBar title={mode.name} backHref="/multiplayer/hot-seat/gamemode/sections" />
      <div className="app-content app-content-scroll">
        <div className="page max-w-xl">
          <section className="surface-card p-5">
            <h1 className="headline-serif text-3xl mb-4">{mode.name}</h1>
            <div className="mb-5">
              <TimerSetupControls
                minutes={timerMinutes}
                seconds={timerSeconds}
                onMinutesChange={setTimerMinutes}
                onSecondsChange={setTimerSeconds}
              />
            </div>
            <button onClick={handleStart} className="btn-primary w-full py-3 text-lg">Start</button>
          </section>
        </div>
      </div>
    </main>
  );
}
