const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, '.tmp-scoring-tests');

fs.rmSync(outDir, { recursive: true, force: true });
process.on('exit', () => {
  fs.rmSync(outDir, { recursive: true, force: true });
});
execSync(
  `npx tsc lib/scoring.ts lib/bibleData.ts lib/gameModes.ts --module commonjs --target es2020 --esModuleInterop --skipLibCheck --outDir "${outDir}"`,
  { cwd: repoRoot, stdio: 'pipe' }
);

const { applyContextPenalty, calculateScore } = require(path.join(outDir, 'scoring.js'));
const { bibleData } = require(path.join(outDir, 'bibleData.js'));
const { NEW_TESTAMENT_BOOK_NAMES } = require(path.join(outDir, 'gameModes.js'));

const byName = new Map(bibleData.map(book => [book.book, book]));
const books = names => names.map(name => byName.get(name)).filter(Boolean);
const fullBible = bibleData;
const newTestament = books(NEW_TESTAMENT_BOOK_NAMES);
const gospels = books(['Matthew', 'Mark', 'Luke', 'John']);
const customGospels = books(['Matthew', 'Mark', 'Luke', 'John']);
const oneBookJohn = books(['John']);
const oneBookJude = books(['Jude']);

function score(correct, guess, pool) {
  return calculateScore(correct, guess, pool);
}

function approxEqual(actual, expected, tolerance = 1e-9) {
  return Math.abs(actual - expected) <= tolerance;
}

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest('whole Bible wrong-book scoring includes eligible Testament and Category only', () => {
  const breakdown = score(
    { book: 'Genesis', chapter: 1, verse: 10 },
    { book: 'Exodus', chapter: 1, verse: 10 },
    fullBible
  );

  assert.equal(breakdown.feedback.book, 'wrong');
  assert.equal(breakdown.possiblePoints.testament, true);
  assert.equal(breakdown.possiblePoints.category, true);
  assert.equal(breakdown.possiblePoints.book, false);
  assert.equal(breakdown.possiblePoints.chapter, false);
  assert.equal(breakdown.possiblePoints.verse, false);
  assert.ok(approxEqual(breakdown.total, 30));
});

runTest('new testament wrong-book does not award Testament when guaranteed', () => {
  const breakdown = score(
    { book: 'Luke', chapter: 2, verse: 10 },
    { book: 'Mark', chapter: 3, verse: 4 },
    newTestament
  );

  assert.equal(breakdown.feedback.book, 'wrong');
  assert.equal(breakdown.possiblePoints.testament, false);
  assert.equal(breakdown.possiblePoints.category, true);
  assert.equal(breakdown.testamentPoints, undefined);
  assert.ok((breakdown.categoryPoints ?? 0) > 0);
});

runTest('category mode hides guaranteed Testament and Category points', () => {
  const breakdown = score(
    { book: 'Luke', chapter: 2, verse: 10 },
    { book: 'Mark', chapter: 3, verse: 4 },
    gospels
  );

  assert.equal(breakdown.feedback.book, 'wrong');
  assert.equal(breakdown.possiblePoints.testament, false);
  assert.equal(breakdown.possiblePoints.category, false);
  assert.equal(breakdown.total, 0);
});

runTest('custom gospels behaves like active pool and awards no guaranteed high-level points', () => {
  const breakdown = score(
    { book: 'Matthew', chapter: 5, verse: 9 },
    { book: 'John', chapter: 3, verse: 16 },
    customGospels
  );

  assert.equal(breakdown.feedback.book, 'wrong');
  assert.equal(breakdown.possiblePoints.testament, false);
  assert.equal(breakdown.possiblePoints.category, false);
  assert.equal(breakdown.total, 0);
});

runTest('one-book mode makes Book guaranteed and scores chapter/verse only', () => {
  const breakdown = score(
    { book: 'John', chapter: 3, verse: 16 },
    { book: 'John', chapter: 3, verse: 15 },
    oneBookJohn
  );

  assert.equal(breakdown.feedback.book, 'correct');
  assert.equal(breakdown.possiblePoints.book, false);
  assert.equal(breakdown.bookPoints, 0);
  assert.equal(breakdown.possiblePoints.chapter, true);
  assert.equal(breakdown.possiblePoints.verse, true);
});

runTest('one-chapter books make Chapter guaranteed and score verse only', () => {
  const breakdown = score(
    { book: 'Jude', chapter: 1, verse: 10 },
    { book: 'Jude', chapter: 1, verse: 11 },
    oneBookJude
  );

  assert.equal(breakdown.feedback.book, 'correct');
  assert.equal(breakdown.possiblePoints.book, false);
  assert.equal(breakdown.possiblePoints.chapter, false);
  assert.equal(breakdown.chapterPoints, 0);
  assert.equal(breakdown.possiblePoints.verse, true);
  assert.ok(breakdown.versePoints > 0);
});

runTest('wrong-chapter scoring uses normalized closeness and keeps long-book near misses high', () => {
  const longBook = score(
    { book: 'Acts', chapter: 23, verse: 1 },
    { book: 'Acts', chapter: 21, verse: 1 },
    newTestament
  );

  const shortBook = score(
    { book: 'Titus', chapter: 3, verse: 10 },
    { book: 'Titus', chapter: 1, verse: 1 },
    newTestament
  );

  assert.equal(longBook.feedback.book, 'correct');
  assert.equal(shortBook.feedback.book, 'correct');
  assert.ok(longBook.total >= 80, `Expected long-book near miss to be >= 80, got ${longBook.total}`);
  assert.ok(longBook.total > shortBook.total, `Expected long-book near miss (${longBook.total}) > short-book near miss (${shortBook.total})`);
});


runTest('hybrid v11 exact reference scores 100', () => {
  const breakdown = score(
    { book: 'John', chapter: 3, verse: 16 },
    { book: 'John', chapter: 3, verse: 16 },
    fullBible
  );

  assert.equal(breakdown.total, 100);
  assert.ok(approxEqual(breakdown.bookPoints + breakdown.chapterPoints + breakdown.versePoints, 100));
});

runTest('hybrid v11 correct-book floor depends only on active book count', () => {
  const correct = { book: 'Genesis', chapter: 1, verse: 1 };
  const oppositeEnd = { book: 'Genesis', chapter: 50, verse: 26 };
  const twoBooks = books(['Genesis', 'Exodus']);
  const tenBooks = fullBible.slice(0, 10);

  assert.ok(approxEqual(score(correct, oppositeEnd, twoBooks).total, 30.417390607627198));
  assert.ok(approxEqual(score(correct, oppositeEnd, tenBooks).total, 40.03044518025827));
  assert.ok(approxEqual(score(correct, oppositeEnd, fullBible).total, 50));
});

runTest('hybrid v11 uses the 70 percent chapter and 30 percent verse blend', () => {
  const breakdown = score(
    { book: 'John', chapter: 3, verse: 16 },
    { book: 'John', chapter: 3, verse: 15 },
    fullBible
  );

  assert.ok(approxEqual(breakdown.total, 99.39013795527879));
  assert.ok(approxEqual(breakdown.bookPoints, 50));
  assert.ok(approxEqual(breakdown.chapterPoints, 34.58));
  assert.ok(approxEqual(breakdown.versePoints, 14.810137955278796));
});

runTest('context verses subtract 10 points each after base scoring', () => {
  assert.ok(approxEqual(applyContextPenalty(99.4, 2), 79.4));
  assert.equal(applyContextPenalty(12, 2), 0);
  assert.equal(applyContextPenalty(100, 0), 100);
});

console.log('All scoring tests passed.');
