import { BookData } from './bibleData';

export interface ScoreBreakdown {
  testamentPoints?: number;
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

const OT_BOOKS = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy',
  'Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings',
  '1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther',
  'Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon',
  'Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel',
  'Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum',
  'Habakkuk','Zephaniah','Haggai','Zechariah','Malachi',
];

function getTestament(book: string): 'OT' | 'NT' {
  return OT_BOOKS.includes(book) ? 'OT' : 'NT';
}

export function calculateScore(
  correct: { book: string; chapter: number; verse: number },
  guess: { book: string; chapter: number; verse: number },
  bookData: BookData,
  scoringType: 'full-bible' | 'multi-book' | 'single-book'
): ScoreBreakdown {
  const chaptersInBook = bookData.chapters.length;
  const correctChapterData = bookData.chapters.find(c => parseInt(c.chapter) === correct.chapter);
  const versesInChapter = correctChapterData ? parseInt(correctChapterData.verses) : 1;

  const chaptersOff = Math.abs(correct.chapter - guess.chapter);
  const versesOff = Math.abs(correct.verse - guess.verse);

  const chapterProximity = (basePoints: number): number =>
    basePoints * Math.max(1 - chaptersOff / (chaptersInBook / 4), 0);
  const verseProximity = (basePoints: number): number =>
    basePoints * Math.max(1 - versesOff / (versesInChapter / 4), 0);

  let bookPoints = 0;
  let testamentPoints: number | undefined;
  let chapterPoints = 0;
  let versePoints = 0;

  if (scoringType === 'full-bible') {
    const correctTestament = getTestament(correct.book);
    const guessTestament = getTestament(guess.book);

    if (guessTestament !== correctTestament) {
      return {
        testamentPoints: 0,
        bookPoints: 0,
        chapterPoints: 0,
        versePoints: 0,
        total: 0,
        feedback: {
          book: 'wrong',
          chapter: 'wrong',
          verse: 'wrong',
          chaptersOff,
          versesOff,
        },
      };
    }

    testamentPoints = 5;

    if (guess.book === correct.book) {
      bookPoints = 25;
      chapterPoints = chapterProximity(25);
      if (guess.chapter === correct.chapter) {
        chapterPoints = 25 + 10;
        versePoints = verseProximity(25);
        if (guess.verse === correct.verse) {
          versePoints = 25 + 10;
        }
      }
    }
  } else if (scoringType === 'multi-book') {
    if (guess.book === correct.book) {
      bookPoints = 20;
      chapterPoints = chapterProximity(30);
      if (guess.chapter === correct.chapter) {
        chapterPoints = 30 + 10;
        versePoints = verseProximity(30);
        if (guess.verse === correct.verse) {
          versePoints = 30 + 10;
        }
      }
    }
  } else {
    // single-book
    chapterPoints = chapterProximity(35);
    if (guess.chapter === correct.chapter) {
      chapterPoints = 35 + 15;
      versePoints = verseProximity(35);
      if (guess.verse === correct.verse) {
        versePoints = 35 + 15;
      }
    }
  }

  const total = (testamentPoints ?? 0) + bookPoints + chapterPoints + versePoints;

  const bookFeedback = (): 'correct' | 'close' | 'wrong' => {
    if (guess.book === correct.book) return 'correct';
    if (getTestament(guess.book) === getTestament(correct.book)) return 'close';
    return 'wrong';
  };

  return {
    testamentPoints,
    bookPoints,
    chapterPoints,
    versePoints,
    total: Math.round(total),
    feedback: {
      book: bookFeedback(),
      chapter: guess.chapter === correct.chapter ? 'correct' : chaptersOff <= 3 ? 'close' : 'wrong',
      verse: guess.verse === correct.verse ? 'correct' : versesOff <= 3 ? 'close' : 'wrong',
      chaptersOff,
      versesOff,
    },
  };
}
