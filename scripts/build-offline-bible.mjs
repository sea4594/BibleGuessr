import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// This is the public-domain WEB source used by bible-api.com itself.
const SOURCE_URL = 'https://raw.githubusercontent.com/seven1m/open-bibles/cf5da281ba9f92508e6cf8d950e031f2acb82335/eng-web.usfx.xml';
const OUTPUT_PATH = path.resolve('public/offline-bible/web.json');
const BOOK_IDS = {
  GEN:'Genesis',EXO:'Exodus',LEV:'Leviticus',NUM:'Numbers',DEU:'Deuteronomy',JOS:'Joshua',JDG:'Judges',RUT:'Ruth',
  '1SA':'1 Samuel','2SA':'2 Samuel','1KI':'1 Kings','2KI':'2 Kings','1CH':'1 Chronicles','2CH':'2 Chronicles',
  EZR:'Ezra',NEH:'Nehemiah',EST:'Esther',JOB:'Job',PSA:'Psalms',PRO:'Proverbs',ECC:'Ecclesiastes',SNG:'Song of Solomon',
  ISA:'Isaiah',JER:'Jeremiah',LAM:'Lamentations',EZK:'Ezekiel',DAN:'Daniel',HOS:'Hosea',JOL:'Joel',AMO:'Amos',
  OBA:'Obadiah',JON:'Jonah',MIC:'Micah',NAM:'Nahum',HAB:'Habakkuk',ZEP:'Zephaniah',HAG:'Haggai',ZEC:'Zechariah',
  MAL:'Malachi',MAT:'Matthew',MRK:'Mark',LUK:'Luke',JHN:'John',ACT:'Acts',ROM:'Romans','1CO':'1 Corinthians',
  '2CO':'2 Corinthians',GAL:'Galatians',EPH:'Ephesians',PHP:'Philippians',COL:'Colossians','1TH':'1 Thessalonians',
  '2TH':'2 Thessalonians','1TI':'1 Timothy','2TI':'2 Timothy',TIT:'Titus',PHM:'Philemon',HEB:'Hebrews',JAS:'James',
  '1PE':'1 Peter','2PE':'2 Peter','1JN':'1 John','2JN':'2 John','3JN':'3 John',JUD:'Jude',REV:'Revelation',
};

function decodeXml(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
    const lower = entity.toLowerCase();
    if (lower === 'amp') return '&';
    if (lower === 'lt') return '<';
    if (lower === 'gt') return '>';
    if (lower === 'quot') return '"';
    if (lower === 'apos') return "'";
    if (lower.startsWith('#x')) return String.fromCodePoint(Number.parseInt(lower.slice(2), 16));
    if (lower.startsWith('#')) return String.fromCodePoint(Number.parseInt(lower.slice(1), 10));
    return _;
  });
}

function normalizeText(value) {
  return decodeXml(value).replace(/\s+/g, ' ').trim();
}

function idAttribute(tag) {
  return tag.match(/\bid\s*=\s*["']([^"']+)["']/i)?.[1] ?? '';
}

function parseBook(bookXml) {
  const chapters = [];
  let chapter = 0;
  let verse = 0;
  let text = '';
  let skipDepth = 0;

  const finishVerse = () => {
    if (chapter < 1 || verse < 1) return;
    const cleaned = normalizeText(text);
    if (cleaned) {
      const chapterIndex = chapter - 1;
      if (!chapters[chapterIndex]) chapters[chapterIndex] = [];
      chapters[chapterIndex][verse - 1] = cleaned;
    }
    verse = 0;
    text = '';
  };

  for (const token of bookXml.match(/<[^>]+>|[^<]+/g) ?? []) {
    if (!token.startsWith('<')) {
      if (verse > 0 && skipDepth === 0) text += token;
      continue;
    }

    if (/^<\s*(f|x)(\s|>)/i.test(token)) {
      skipDepth += 1;
      continue;
    }
    if (/^<\s*\/\s*(f|x)\s*>/i.test(token)) {
      skipDepth = Math.max(0, skipDepth - 1);
      continue;
    }
    if (skipDepth > 0) continue;

    if (/^<\s*c(\s|\/?>)/i.test(token)) {
      finishVerse();
      chapter = Number.parseInt(idAttribute(token), 10) || 0;
      continue;
    }
    if (/^<\s*v(\s|\/?>)/i.test(token)) {
      finishVerse();
      verse = Number.parseInt(idAttribute(token), 10) || 0;
      text = '';
      continue;
    }
    if (/^<\s*ve(\s|\/?>)/i.test(token)) {
      finishVerse();
    }
  }

  finishVerse();
  return chapters;
}

async function fetchSource() {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(SOURCE_URL, { headers: { 'User-Agent': 'BibleGuessr-offline-build' } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 750));
    }
  }
  throw lastError;
}

const xml = await fetchSource();
const books = {};
for (const match of xml.matchAll(/<book\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/book>/gi)) {
  const bookName = BOOK_IDS[match[1].toUpperCase()];
  if (!bookName) continue;
  books[bookName] = parseBook(match[2]);
}

const missingBooks = Object.values(BOOK_IDS).filter(book => !books[book]);
if (missingBooks.length) throw new Error(`Offline WEB build is missing: ${missingBooks.join(', ')}`);
const verseCount = Object.values(books).reduce(
  (total, chapters) => total + chapters.reduce((bookTotal, verses) => bookTotal + (verses?.filter(Boolean).length ?? 0), 0),
  0
);
if (verseCount < 30_000) throw new Error(`Offline WEB build parsed only ${verseCount} verses`);
if (!books.John?.[2]?.[15]?.includes('God so loved the world')) {
  throw new Error('Offline WEB validation failed for John 3:16');
}

const payload = {
  translation: 'World English Bible',
  translationId: 'web',
  license: 'Public Domain',
  source: 'https://github.com/seven1m/open-bibles/blob/cf5da281ba9f92508e6cf8d950e031f2acb82335/eng-web.usfx.xml',
  books,
};
await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, JSON.stringify(payload));
console.log(`Wrote ${verseCount} offline WEB verses across ${Object.keys(books).length} books to ${OUTPUT_PATH}`);
