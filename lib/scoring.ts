import { BookData } from './bibleData';
import { getBookCategory, getBookTestament } from './gameModes';

export interface ScoreBreakdown {
  testamentPoints?: number;
  categoryPoints?: number;
  bookPoints: number;
  chapterPoints: number;
  versePoints: number;
  possiblePoints: {
    testament: boolean;
    category: boolean;
    book: boolean;
    chapter: boolean;
    verse: boolean;
  };
  baseTotal?: number;
  contextPenalty?: number;
  contextVersesAdded?: number;
  total: number;
  feedback: {
    book: 'correct' | 'close' | 'wrong';
    chapter: 'correct' | 'close' | 'wrong';
    verse: 'correct' | 'close' | 'wrong';
    chaptersOff: number;
    versesOff: number;
  };
}

function getBookVerseOrdinal(bookData: BookData, chapter: number, verse: number): number {
  let ordinal = 0;

  for (const chapterData of bookData.chapters) {
    const chapterNumber = parseInt(chapterData.chapter, 10);
    const verseCount = parseInt(chapterData.verses, 10);
    if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || !Number.isInteger(verseCount) || verseCount < 1) continue;
    if (chapterNumber < chapter) {
      ordinal += verseCount;
      continue;
    }
    if (chapterNumber === chapter) {
      const clampedVerse = Math.min(Math.max(verse, 1), verseCount);
      return ordinal + clampedVerse;
    }
    break;
  }

  const totalVersesInBook = bookData.chapters.reduce((sum, chapterData) => {
    const verseCount = parseInt(chapterData.verses, 10);
    return Number.isInteger(verseCount) && verseCount > 0 ? sum + verseCount : sum;
  }, 0);
  return Math.max(totalVersesInBook, 1);
}

function getTotalVersesInBook(bookData: BookData): number {
  const total = bookData.chapters.reduce((sum, chapterData) => {
    const verseCount = parseInt(chapterData.verses, 10);
    return Number.isInteger(verseCount) && verseCount > 0 ? sum + verseCount : sum;
  }, 0);
  return Math.max(total, 1);
}

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score));
}

export function applyContextPenalty(baseScore: number, contextVersesAdded: number): number {
  return Math.max(0, baseScore - Math.max(0, contextVersesAdded) * 10);
}

export function calculateScore(
  correct: { book: string; chapter: number; verse: number },
  guess: { book: string; chapter: number; verse: number },
  activeBooks: BookData[]
): ScoreBreakdown {
  const normalizedActiveBooks = activeBooks.length > 0 ? activeBooks : [];
  const N = normalizedActiveBooks.length;
  const activeTestaments = new Set(normalizedActiveBooks.map(book => getBookTestament(book.book)));
  const activeCategories = new Set(normalizedActiveBooks.map(book => getBookCategory(book.book)));
  const testamentGuaranteed = activeTestaments.size <= 1;
  const categoryGuaranteed = activeCategories.size <= 1;
  const bookGuaranteed = N <= 1;

  // Hybrid scoring v11: retain the original wrong-book partial-credit scaling.
  const B = N <= 1 ? 0 : 20 + (20 * Math.log(N)) / Math.log(66);
  const g = B / 40;
  const guessBookIsCorrect = guess.book === correct.book;
  const correctTestament = getBookTestament(correct.book);
  const guessTestament = getBookTestament(guess.book);
  const correctCategory = getBookCategory(correct.book);
  const guessCategory = getBookCategory(guess.book);

  if (!guessBookIsCorrect) {
    const testamentPoints = !testamentGuaranteed && guessTestament === correctTestament ? 15 * g : 0;
    const categoryPoints = !categoryGuaranteed && guessCategory === correctCategory ? 15 * g : 0;
    return {
      testamentPoints: testamentGuaranteed ? undefined : testamentPoints,
      categoryPoints: categoryGuaranteed ? undefined : categoryPoints,
      bookPoints: 0,
      chapterPoints: 0,
      versePoints: 0,
      possiblePoints: { testament: !testamentGuaranteed, category: !categoryGuaranteed, book: false, chapter: false, verse: false },
      total: clampScore(testamentPoints + categoryPoints),
      feedback: { book: 'wrong', chapter: 'wrong', verse: 'wrong', chaptersOff: 0, versesOff: 0 },
    };
  }

  const correctBookData = normalizedActiveBooks.find(book => book.book === correct.book);
  if (!correctBookData) {
    return {
      bookPoints: 0,
      chapterPoints: 0,
      versePoints: 0,
      possiblePoints: { testament: false, category: false, book: false, chapter: false, verse: false },
      total: 0,
      feedback: { book: 'correct', chapter: 'wrong', verse: 'wrong', chaptersOff: 0, versesOff: 0 },
    };
  }

  const correctOrdinal = getBookVerseOrdinal(correctBookData, correct.chapter, correct.verse);
  const guessOrdinal = getBookVerseOrdinal(correctBookData, guess.chapter, guess.verse);
  const verseDistance = Math.abs(correctOrdinal - guessOrdinal);
  const chapterDistance = Math.abs(correct.chapter - guess.chapter);
  const totalVerses = getTotalVersesInBook(correctBookData);
  const totalChapters = Math.max(1, correctBookData.chapters.length);
  const chapterGuaranteed = totalChapters <= 1;
  const versesOff = guess.chapter === correct.chapter ? Math.abs(correct.verse - guess.verse) : 0;

  const correctBookFloor = (() => {
    if (N <= 1) return 0;
    const poolDifficulty = Math.log(N) / Math.log(66);
    return 25 + 25 * Math.pow(poolDifficulty, 0.85);
  })();

  const possiblePoints = {
    testament: false,
    category: false,
    book: !bookGuaranteed,
    chapter: !chapterGuaranteed,
    verse: true,
  };

  if (verseDistance === 0) {
    const remaining = 100 - correctBookFloor;
    const chapterPoints = chapterGuaranteed ? 0 : 0.70 * remaining;
    const versePoints = chapterGuaranteed ? remaining : 0.30 * remaining;
    return {
      bookPoints: correctBookFloor,
      chapterPoints,
      versePoints,
      possiblePoints,
      total: 100,
      feedback: { book: 'correct', chapter: 'correct', verse: 'correct', chaptersOff: 0, versesOff: 0 },
    };
  }

  const nonExactCeiling = 99.4;
  const verseScale = Math.max(30, Math.min(55, 30 + 0.01 * totalVerses));
  const maxVerseSpan = Math.max(1, totalVerses - 1);
  const verseRaw = 1 / (1 + Math.pow(verseDistance / verseScale, 2));
  const verseRawAtFullSpan = 1 / (1 + Math.pow(maxVerseSpan / verseScale, 2));
  const verseProximity = Math.max(0, Math.min(1, (verseRaw - verseRawAtFullSpan) / (1 - verseRawAtFullSpan)));
  const availablePoints = nonExactCeiling - correctBookFloor;

  let chapterPoints = 0;
  let versePoints = 0;
  if (chapterGuaranteed) {
    versePoints = availablePoints * verseProximity;
  } else {
    const maxChapterSpan = totalChapters - 1;
    const chapterFraction = Math.max(0, Math.min(1, chapterDistance / maxChapterSpan));
    const chapterProximity = Math.max(0, Math.min(1, 1 - Math.pow(chapterFraction, 0.90)));
    chapterPoints = availablePoints * 0.70 * chapterProximity;
    versePoints = availablePoints * 0.30 * verseProximity;
  }

  const total = clampScore(correctBookFloor + chapterPoints + versePoints);
  return {
    bookPoints: correctBookFloor,
    chapterPoints,
    versePoints,
    possiblePoints,
    total,
    feedback: {
      book: 'correct',
      chapter: guess.chapter === correct.chapter ? 'correct' : chapterDistance <= 3 ? 'close' : 'wrong',
      verse: guess.chapter === correct.chapter && versesOff <= 3 ? 'close' : 'wrong',
      chaptersOff: chapterDistance,
      versesOff,
    },
  };
}
