import { BookData } from './bibleData';
import { getBookCategory, getBookTestament } from './gameModes';

export interface ScoreBreakdown {
  testamentPoints?: number;
  categoryPoints?: number;
  bookPoints: number;
  chapterPoints: number;
  versePoints: number;
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
    if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || !Number.isInteger(verseCount) || verseCount < 1) {
      continue;
    }

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

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score));
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

  const correctBookData = normalizedActiveBooks.find(book => book.book === correct.book);
  const chaptersInCorrectBook = correctBookData?.chapters.length ?? 1;
  const chapterGuaranteed = chaptersInCorrectBook <= 1;

  const guessBookIsCorrect = guess.book === correct.book;
  const chapterDiff = guessBookIsCorrect ? Math.abs(correct.chapter - guess.chapter) : 0;

  const correctOrdinal = correctBookData ? getBookVerseOrdinal(correctBookData, correct.chapter, correct.verse) : 1;
  const guessOrdinal = guessBookIsCorrect && correctBookData
    ? getBookVerseOrdinal(correctBookData, guess.chapter, guess.verse)
    : correctOrdinal;
  const textualVerseDistance = Math.abs(correctOrdinal - guessOrdinal);
  const versesOff = guessBookIsCorrect && guess.chapter === correct.chapter ? Math.abs(correct.verse - guess.verse) : 0;

  const B = N <= 1 ? 0 : 20 + (20 * Math.log(N)) / Math.log(66);
  const g = B / 40;

  const correctTestament = getBookTestament(correct.book);
  const guessTestament = getBookTestament(guess.book);
  const correctCategory = getBookCategory(correct.book);
  const guessCategory = getBookCategory(guess.book);

  let testamentPoints = 0;
  let categoryPoints = 0;
  let bookPoints = 0;
  let chapterPoints = 0;
  let versePoints = 0;
  let total = 0;

  if (!guessBookIsCorrect) {
    if (!testamentGuaranteed && guessTestament === correctTestament) {
      testamentPoints = 15 * g;
    }

    if (!categoryGuaranteed && guessCategory === correctCategory) {
      categoryPoints = 15 * g;
    }

    total = clampScore(testamentPoints + categoryPoints);

    return {
      testamentPoints: testamentGuaranteed ? undefined : testamentPoints,
      categoryPoints: categoryGuaranteed ? undefined : categoryPoints,
      bookPoints,
      chapterPoints,
      versePoints,
      total,
      feedback: {
        book: 'wrong',
        chapter: 'wrong',
        verse: 'wrong',
        chaptersOff: 0,
        versesOff: 0,
      },
    };
  }

  if (guess.chapter === correct.chapter && guess.verse === correct.verse) {
    return {
      bookPoints: B,
      chapterPoints: chapterGuaranteed ? 0 : 30,
      versePoints: 100 - B - (chapterGuaranteed ? 0 : 30),
      total: 100,
      feedback: {
        book: 'correct',
        chapter: 'correct',
        verse: 'correct',
        chaptersOff: 0,
        versesOff: 0,
      },
    };
  }

  const C = chapterGuaranteed ? 0 : 30;
  const V = 97 - B - C;
  const verseDecay = 1 + Math.pow(textualVerseDistance / 12, 1.5);

  if (guess.chapter === correct.chapter) {
    bookPoints = B;
    chapterPoints = C;
    versePoints = V / verseDecay;
    total = clampScore(bookPoints + chapterPoints + versePoints);

    return {
      bookPoints,
      chapterPoints,
      versePoints,
      total,
      feedback: {
        book: 'correct',
        chapter: 'correct',
        verse: versesOff <= 3 ? 'close' : 'wrong',
        chaptersOff: 0,
        versesOff,
      },
    };
  }

  bookPoints = B;
  chapterPoints = C > 0 ? (0.6 * C) / Math.pow(Math.max(chapterDiff, 1), 1.5) : 0;
  versePoints = (V + 5) / verseDecay;
  total = clampScore(bookPoints + chapterPoints + versePoints);

  return {
    bookPoints,
    chapterPoints,
    versePoints,
    total,
    feedback: {
      book: 'correct',
      chapter: chapterDiff <= 3 ? 'close' : 'wrong',
      verse: 'wrong',
      chaptersOff: chapterDiff,
      versesOff,
    },
  };
}
