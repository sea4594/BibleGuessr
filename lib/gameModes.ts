import { bibleData, BookData } from './bibleData';

export type GameModeId =
  | 'old-testament' | 'new-testament' | 'pentateuch' | 'historical'
  | 'wisdom' | 'major-prophets' | 'minor-prophets' | 'gospels'
  | 'pauline-epistles' | 'general-epistles' | 'all-epistles'
  | 'book-selection' | 'full-bible' | 'custom';

export const sectionModeIds: GameModeId[] = [
  'old-testament',
  'new-testament',
  'pentateuch',
  'historical',
  'wisdom',
  'major-prophets',
  'minor-prophets',
  'gospels',
  'pauline-epistles',
  'general-epistles',
  'all-epistles',
];

export interface GameModeConfig {
  id: GameModeId;
  name: string;
  description: string;
  books: BookData[];
  isSingleBook: boolean;
  scoringType: 'full-bible' | 'multi-book' | 'single-book';
}

export const OLD_TESTAMENT_BOOK_NAMES = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy',
  'Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings',
  '1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther',
  'Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon',
  'Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel',
  'Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum',
  'Habakkuk','Zephaniah','Haggai','Zechariah','Malachi',
];
export const NEW_TESTAMENT_BOOK_NAMES = [
  'Matthew','Mark','Luke','John','Acts',
  'Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians',
  'Philippians','Colossians','1 Thessalonians','2 Thessalonians',
  '1 Timothy','2 Timothy','Titus','Philemon',
  'Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation',
];

export type Testament = 'OT' | 'NT';

export type BookCategory =
  | 'Pentateuch'
  | 'Historical'
  | 'Wisdom'
  | 'Major Prophets'
  | 'Minor Prophets'
  | 'Gospels'
  | 'Acts'
  | 'Pauline Epistles'
  | 'General Epistles'
  | 'Apocalypse'
  | 'Unknown';

const BOOK_CATEGORY_BY_NAME: Record<string, BookCategory> = {
  Genesis: 'Pentateuch',
  Exodus: 'Pentateuch',
  Leviticus: 'Pentateuch',
  Numbers: 'Pentateuch',
  Deuteronomy: 'Pentateuch',
  Joshua: 'Historical',
  Judges: 'Historical',
  Ruth: 'Historical',
  '1 Samuel': 'Historical',
  '2 Samuel': 'Historical',
  '1 Kings': 'Historical',
  '2 Kings': 'Historical',
  '1 Chronicles': 'Historical',
  '2 Chronicles': 'Historical',
  Ezra: 'Historical',
  Nehemiah: 'Historical',
  Esther: 'Historical',
  Job: 'Wisdom',
  Psalms: 'Wisdom',
  Proverbs: 'Wisdom',
  Ecclesiastes: 'Wisdom',
  'Song of Solomon': 'Wisdom',
  Isaiah: 'Major Prophets',
  Jeremiah: 'Major Prophets',
  Lamentations: 'Major Prophets',
  Ezekiel: 'Major Prophets',
  Daniel: 'Major Prophets',
  Hosea: 'Minor Prophets',
  Joel: 'Minor Prophets',
  Amos: 'Minor Prophets',
  Obadiah: 'Minor Prophets',
  Jonah: 'Minor Prophets',
  Micah: 'Minor Prophets',
  Nahum: 'Minor Prophets',
  Habakkuk: 'Minor Prophets',
  Zephaniah: 'Minor Prophets',
  Haggai: 'Minor Prophets',
  Zechariah: 'Minor Prophets',
  Malachi: 'Minor Prophets',
  Matthew: 'Gospels',
  Mark: 'Gospels',
  Luke: 'Gospels',
  John: 'Gospels',
  Acts: 'Acts',
  Romans: 'Pauline Epistles',
  '1 Corinthians': 'Pauline Epistles',
  '2 Corinthians': 'Pauline Epistles',
  Galatians: 'Pauline Epistles',
  Ephesians: 'Pauline Epistles',
  Philippians: 'Pauline Epistles',
  Colossians: 'Pauline Epistles',
  '1 Thessalonians': 'Pauline Epistles',
  '2 Thessalonians': 'Pauline Epistles',
  '1 Timothy': 'Pauline Epistles',
  '2 Timothy': 'Pauline Epistles',
  Titus: 'Pauline Epistles',
  Philemon: 'Pauline Epistles',
  Hebrews: 'General Epistles',
  James: 'General Epistles',
  '1 Peter': 'General Epistles',
  '2 Peter': 'General Epistles',
  '1 John': 'General Epistles',
  '2 John': 'General Epistles',
  '3 John': 'General Epistles',
  Jude: 'General Epistles',
  Revelation: 'Apocalypse',
};

export function getBookTestament(book: string): Testament {
  return OLD_TESTAMENT_BOOK_NAMES.includes(book) ? 'OT' : 'NT';
}

export function getBookCategory(book: string): BookCategory {
  return BOOK_CATEGORY_BY_NAME[book] ?? 'Unknown';
}

function getBooks(names: string[]): BookData[] {
  return names
    .map(name => bibleData.find(b => b.book === name))
    .filter((b): b is BookData => Boolean(b));
}

export const gameModes: Record<GameModeId, GameModeConfig> = {
  'full-bible': {
    id: 'full-bible',
    name: 'Full Bible',
    description: 'All 66 books of the Bible',
    books: bibleData,
    isSingleBook: false,
    scoringType: 'full-bible',
  },
  'old-testament': {
    id: 'old-testament',
    name: 'Old Testament',
    description: 'All 39 books of the Old Testament',
    books: getBooks(OLD_TESTAMENT_BOOK_NAMES),
    isSingleBook: false,
    scoringType: 'multi-book',
  },
  'new-testament': {
    id: 'new-testament',
    name: 'New Testament',
    description: 'All 27 books of the New Testament',
    books: getBooks(NEW_TESTAMENT_BOOK_NAMES),
    isSingleBook: false,
    scoringType: 'multi-book',
  },
  'pentateuch': {
    id: 'pentateuch',
    name: 'Pentateuch',
    description: 'The first 5 books of Moses',
    books: getBooks(['Genesis','Exodus','Leviticus','Numbers','Deuteronomy']),
    isSingleBook: false,
    scoringType: 'multi-book',
  },
  'historical': {
    id: 'historical',
    name: 'Historical Books',
    description: 'Joshua through Esther',
    books: getBooks(['Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther']),
    isSingleBook: false,
    scoringType: 'multi-book',
  },
  'wisdom': {
    id: 'wisdom',
    name: 'Wisdom Literature',
    description: 'Job, Psalms, Proverbs, Ecclesiastes, Song of Solomon',
    books: getBooks(['Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon']),
    isSingleBook: false,
    scoringType: 'multi-book',
  },
  'major-prophets': {
    id: 'major-prophets',
    name: 'Major Prophets',
    description: 'Isaiah through Daniel',
    books: getBooks(['Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel']),
    isSingleBook: false,
    scoringType: 'multi-book',
  },
  'minor-prophets': {
    id: 'minor-prophets',
    name: 'Minor Prophets',
    description: 'Hosea through Malachi',
    books: getBooks(['Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi']),
    isSingleBook: false,
    scoringType: 'multi-book',
  },
  'gospels': {
    id: 'gospels',
    name: 'The Gospels',
    description: 'Matthew, Mark, Luke, John',
    books: getBooks(['Matthew','Mark','Luke','John']),
    isSingleBook: false,
    scoringType: 'multi-book',
  },
  'pauline-epistles': {
    id: 'pauline-epistles',
    name: 'Pauline Epistles',
    description: "Paul's letters: Romans through Philemon",
    books: getBooks(['Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon']),
    isSingleBook: false,
    scoringType: 'multi-book',
  },
  'general-epistles': {
    id: 'general-epistles',
    name: 'General Epistles',
    description: 'Hebrews through Jude',
    books: getBooks(['Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude']),
    isSingleBook: false,
    scoringType: 'multi-book',
  },
  'all-epistles': {
    id: 'all-epistles',
    name: 'All Epistles',
    description: 'All New Testament letters',
    books: getBooks(['Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude']),
    isSingleBook: false,
    scoringType: 'multi-book',
  },
  'book-selection': {
    id: 'book-selection',
    name: 'Book Selection',
    description: 'Choose a specific book to study',
    books: bibleData,
    isSingleBook: true,
    scoringType: 'single-book',
  },
  'custom': {
    id: 'custom',
    name: 'Custom',
    description: 'Pick exactly which books are included in this game',
    books: bibleData,
    isSingleBook: false,
    scoringType: 'multi-book',
  },
};
