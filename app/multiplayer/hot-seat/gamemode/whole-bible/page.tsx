'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AppTopBar from '@/components/AppTopBar';
import HorizontalWheel from '@/components/HorizontalWheel';
import TimerSetupControls from '@/components/TimerSetupControls';
import { useGame } from '@/lib/gameContext';
import { gameModes } from '@/lib/gameModes';
import { readHotSeatSettings, writeHotSeatSettings } from '@/lib/hotSeatSettings';
import { toTimerDurationSeconds } from '@/lib/timerOptions';

const MODE = gameModes['full-bible'];
const ROUND_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function HotSeatWholeBiblePage() {
  const router = useRouter();
  const { startGame } = useGame();
  const [rounds, setRounds] = useState(1);
  const initialSettings = readHotSeatSettings();
  const [timerMinutes, setTimerMinutes] = useState(initialSettings.timerMinutes);
  const [timerSeconds, setTimerSeconds] = useState(initialSettings.timerSeconds);

  const handleStart = () => {
    const settings = readHotSeatSettings();
    const players = settings.names.slice(0, settings.players).map((name, idx) => name || `Player ${idx + 1}`);
    writeHotSeatSettings({ ...settings, timerMinutes, timerSeconds });
    startGame({
      mode: 'full-bible',
      modeConfig: MODE,
      totalRounds: settings.players * rounds,
      timerDurationSeconds: toTimerDurationSeconds(timerMinutes, timerSeconds),
      returnPath: '/multiplayer/hot-seat/gamemode',
      multiplayer: {
        enabled: true,
        lobbyType: 'hot-seat',
        players,
        roundsPerPlayer: rounds,
        turnStyle: settings.turnStyle,
      },
    });
    router.push('/play/full-bible/game');
  };

  return (
    <main className="app-screen">
      <AppTopBar title="Whole Bible" backHref="/multiplayer/hot-seat/gamemode" />
      <div className="app-content app-content-scroll">
        <div className="page max-w-xl setup-page">
          <h1 className="headline-serif text-4xl mb-4">Whole Bible</h1>

          <section className="setup-panel">
            <div className="setup-panel-section">
              <HorizontalWheel label="Rounds per player" values={ROUND_VALUES} selected={rounds} onChange={setRounds} />
            </div>

            <div className="setup-panel-section">
              <TimerSetupControls
                embedded
                minutes={timerMinutes}
                seconds={timerSeconds}
                onMinutesChange={setTimerMinutes}
                onSecondsChange={setTimerSeconds}
              />
            </div>
          </section>

          <button onClick={handleStart} className="btn-primary setup-start-btn">Start Game</button>
        </div>
      </div>
    </main>
  );
}
