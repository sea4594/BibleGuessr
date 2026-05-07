"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUiSettings } from "@/lib/uiSettingsContext";
import { useGame } from "@/lib/gameContext";
import { gameModes, GameModeId } from "@/lib/gameModes";
import { bibleData } from "@/lib/bibleData";
import { fetchVerseTextByReference } from "@/lib/verseClient";
import MainBottomNav from "@/components/MainBottomNav";
import AppTopBar from "@/components/AppTopBar";
import { Zap } from "lucide-react";
import { useSettingsModal } from "@/components/SettingsModalProvider";

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
  const { settings } = useUiSettings();
  const { startGame } = useGame();
  const { openSettings } = useSettingsModal();
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

  const handleQuickPlay = () => {
    const modeId: GameModeId = (settings.preferredGameMode in gameModes)
      ? (settings.preferredGameMode as GameModeId)
      : "full-bible";
    const modeConfig = gameModes[modeId];
    startGame({ mode: modeId, modeConfig, totalRounds: settings.preferredRounds });
    router.push(`/play/${modeId}/game`);
  };

  return (
    <main className="app-screen fade-up">
      <AppTopBar title="BibleGuessr" />
      <div className="app-content app-content-scroll">
        <div className="page max-w-xl">
          <section className="surface-card p-5">
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

          <button
            onClick={handleQuickPlay}
            className="btn-primary w-full py-5 text-xl font-bold inline-flex items-center justify-center gap-3"
          >
            <Zap size={24} /> Quick Play
          </button>
          <p className="content-muted text-xs text-center -mt-1">
            {settings.preferredRounds} rounds &middot; {settings.preferredGameMode.replace(/-/g, " ")}
            {" - "}
            <span className="underline cursor-pointer" onClick={openSettings}>
              change in settings
            </span>
          </p>
        </div>
      </div>
      <MainBottomNav />
    </main>
  );
}
