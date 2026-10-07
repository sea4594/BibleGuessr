"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUiSettings } from "@/lib/uiSettingsContext";
import { useGame } from "@/lib/gameContext";
import { gameModes, GameModeId } from "@/lib/gameModes";
import { bibleData } from "@/lib/bibleData";
import { fetchVerseTextByReference } from "@/lib/verseClient";
import MainBottomNav from "@/components/MainBottomNav";
import GameModeSelector from "@/components/GameModeSelector";
import { Zap } from "lucide-react";
import {
  formatTimerOptionLabel,
  QUICK_PLAY_TIMER_SECOND_OPTIONS,
  toTimerDurationSeconds,
} from "@/lib/timerOptions";
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
  const {
    settings,
    setPreferredBook,
    setPreferredCustomBooks,
    setPreferredGameMode,
    setPreferredRounds,
    setQuickPlayTimerSeconds,
  } = useUiSettings();
  const { startGame } = useGame();
  const router = useRouter();
  const [verseOfDay, setVerseOfDay] = useState<VerseOfDay | null>(null);
  const [loadingVerse, setLoadingVerse] = useState(true);

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

  const quickPlayModeId: GameModeId = settings.preferredGameMode in gameModes
    ? settings.preferredGameMode as GameModeId
    : 'full-bible';

  const handleQuickPlay = () => {
    const modeId = quickPlayModeId;
    const selectedCustomBooks = modeId === "custom"
      ? bibleData.filter(book => settings.preferredCustomBooks.includes(book.book))
      : [];
    const selectedBookData = modeId === "book-selection"
      ? bibleData.find(book => book.book === settings.preferredBook) ?? bibleData[0]
      : null;
    const modeConfig = modeId === "book-selection" && selectedBookData
      ? { ...gameModes[modeId], books: [selectedBookData] }
      : modeId === "custom"
        ? {
            ...gameModes[modeId],
            books: selectedCustomBooks.length > 0 ? selectedCustomBooks : gameModes[modeId].books,
          }
        : gameModes[modeId];

    startGame({
      mode: modeId,
      modeConfig,
      totalRounds: settings.preferredRounds,
      timerDurationSeconds: toTimerDurationSeconds(settings.quickPlayTimerSeconds),
      selectedBook: selectedBookData?.book,
    });
    router.push(`/play/${modeId}/game`);
  };

  return (
    <main className="app-screen primary-nav-screen fade-up">
      <div className="app-content app-content-scroll">
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

          <div className="home-quickplay-stack setup-controls-stack">
            <GameModeSelector
              modeId={quickPlayModeId}
              onModeChange={mode => setPreferredGameMode(mode)}
              selectedBook={settings.preferredBook}
              onBookChange={setPreferredBook}
              selectedBooks={settings.preferredCustomBooks}
              onSelectedBooksChange={setPreferredCustomBooks}
            />

            <HorizontalWheel
              label="Rounds"
              values={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
              selected={settings.preferredRounds}
              onChange={setPreferredRounds}
            />

            <HorizontalWheel
              label="Timer (seconds)"
              values={QUICK_PLAY_TIMER_SECOND_OPTIONS}
              selected={settings.quickPlayTimerSeconds}
              onChange={setQuickPlayTimerSeconds}
              formatValue={formatTimerOptionLabel}
            />

            <button
              onClick={handleQuickPlay}
              className="btn-primary setup-start-btn home-quickplay-start inline-flex items-center justify-center gap-3"
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
