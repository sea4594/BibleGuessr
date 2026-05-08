"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUiSettings } from "@/lib/uiSettingsContext";
import { useGame } from "@/lib/gameContext";
import { gameModes, GameModeId } from "@/lib/gameModes";
import { bibleData } from "@/lib/bibleData";
import { fetchVerseTextByReference } from "@/lib/verseClient";
import MainBottomNav from "@/components/MainBottomNav";
import AppTopBar from "@/components/AppTopBar";
import { Zap } from "lucide-react";
import { QUICK_PLAY_TIMER_SECOND_OPTIONS } from "@/lib/timerOptions";
import HorizontalWheel from "@/components/HorizontalWheel";

interface VerseOfDay {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

function getDailyVerseRef(): { book: string; chapter: number; verse: number } {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const bookIdx = seed % bibleData.length;
  const book = bibleData[bookIdx];
  const chapIdx = Math.floor(seed / 100) % book.chapters.length;
  const chap = book.chapters[chapIdx];
  const verseCount = parseInt(chap.verses, 10);
  const verseIdx = Math.floor(seed / 10000) % verseCount;
  return { book: book.book, chapter: parseInt(chap.chapter, 10), verse: Math.max(1, verseIdx) };
}

export default function HomePage() {
  const { settings, setPreferredGameMode, setPreferredRounds, setQuickPlayTimerSeconds } = useUiSettings();
  const { startGame } = useGame();
  const router = useRouter();
  const [verseOfDay, setVerseOfDay] = useState<VerseOfDay | null>(null);
  const [loadingVerse, setLoadingVerse] = useState(true);

  const modeOptions = useMemo(
    () =>
      Object.entries(gameModes)
        .filter(([, mode]) => !mode.isSingleBook)
        .map(([id, mode]) => ({ id, name: mode.name })),
    []
  );

  useEffect(() => {
    const ref = getDailyVerseRef();
    void fetchVerseTextByReference(ref.book, ref.chapter, ref.verse)
      .then(text => {
        if (text) {
          setVerseOfDay({ ...ref, text });
        }
      })
      .finally(() => setLoadingVerse(false));
  }, []);

  const handleQuickPlay = () => {
    const modeId: GameModeId = (settings.preferredGameMode in gameModes)
      ? (settings.preferredGameMode as GameModeId)
      : "full-bible";
    const modeConfig = gameModes[modeId];
    startGame({
      mode: modeId,
      modeConfig,
      totalRounds: settings.preferredRounds,
      timerDurationSeconds: settings.quickPlayTimerSeconds,
    });
    router.push(`/play/${modeId}/game`);
  };

  return (
    <main className="app-screen fade-up">
      <AppTopBar title="BibleGuessr" />
      <div className="app-content app-content-fixed">
        <div className="page max-w-xl setup-page home-page min-w-0">
          <section className="surface-card p-5 min-w-0">
            <p className="eyebrow mb-2">(random) VERSE OF THE DAY</p>
            {loadingVerse ? (
              <p className="content-muted text-sm animate-pulse">Loading verse...</p>
            ) : verseOfDay ? (
              <>
                <p className="text-base leading-relaxed mb-3 italic">&ldquo;{verseOfDay.text}&rdquo;</p>
                <p className="eyebrow text-xs">
                  {verseOfDay.book} {verseOfDay.chapter}:{verseOfDay.verse}
                </p>
              </>
            ) : (
              <p className="content-muted text-sm">Could not load verse.</p>
            )}
          </section>

          <div className="home-quickplay-stack grid gap-3">
            <section className="surface-card p-5 min-w-0">
              <p className="eyebrow mb-2">QUICK PLAY</p>

              <select
                value={settings.preferredGameMode}
                onChange={e => setPreferredGameMode(e.target.value)}
                className="settings-input !w-full mb-4"
              >
                {modeOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>

              <div className="mb-4 min-w-0">
                <HorizontalWheel
                  label="Rounds"
                  values={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                  selected={settings.preferredRounds}
                  onChange={value => setPreferredRounds(value)}
                />
              </div>

              <div className="timer-inline-row">
                <p className="text-sm font-semibold">Timer</p>
                <div className="timer-inline-controls">
                  <label className="timer-inline-label">
                    <select
                      value={settings.quickPlayTimerSeconds}
                      onChange={e => setQuickPlayTimerSeconds(Number(e.target.value))}
                      className="settings-input timer-inline-select"
                    >
                      {QUICK_PLAY_TIMER_SECOND_OPTIONS.map(value => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                    <span>Seconds</span>
                  </label>
                </div>
              </div>
            </section>

            <button
              onClick={handleQuickPlay}
              className="btn-primary w-full py-5 text-xl font-bold inline-flex items-center justify-center gap-3"
            >
              <Zap size={24} /> Start
            </button>
          </div>
        </div>
      </div>
      <MainBottomNav />
    </main>
  );
}
