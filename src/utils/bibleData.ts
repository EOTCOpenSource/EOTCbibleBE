
import { COMM_BIBLE_DATA, IBibleBookMetadata } from './bibleMetadata';

export interface IChapterRef {
    book: string;
    chapter: number;
}

export interface IRangeValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Helper to find book metadata by name (case-insensitive)
 */
const findBook = (name: string): IBibleBookMetadata | undefined => {
    return COMM_BIBLE_DATA.find(b => b.book_name_en.toLowerCase() === name.toLowerCase());
};

/**
 * Validates a reading range.
 * @param startBook Name of the starting book
 * @param startChapter Starting chapter number
 * @param endBook Name of the ending book
 * @param endChapter Ending chapter number (optional)
 */
export const validateRange = (
    startBook: string,
    startChapter: number,
    endBook: string,
    endChapter?: number
): IRangeValidationResult => {
    const sBook = findBook(startBook);
    const eBook = findBook(endBook);

    if (!sBook) {
        return { valid: false, error: `Invalid start book: ${startBook}` };
    }
    if (!eBook) {
        return { valid: false, error: `Invalid end book: ${endBook}` };
    }

    if (startChapter < 1 || startChapter > sBook.total_chapters) {
        return { valid: false, error: `Start chapter ${startChapter} is out of range for ${sBook.book_name_en} (1-${sBook.total_chapters})` };
    }

    if (endChapter !== undefined) {
        if (endChapter < 1 || endChapter > eBook.total_chapters) {
            return { valid: false, error: `End chapter ${endChapter} is out of range for ${eBook.book_name_en} (1-${eBook.total_chapters})` };
        }
    }

    // Check order
    const sIndex = COMM_BIBLE_DATA.findIndex(b => b.book_name_en.toLowerCase() === startBook.toLowerCase());
    const eIndex = COMM_BIBLE_DATA.findIndex(b => b.book_name_en.toLowerCase() === endBook.toLowerCase());

    if (sIndex > eIndex) {
        return { valid: false, error: 'End book cannot be before start book' };
    }

    if (sIndex === eIndex) {
        // Same book
        const finalEndChapter = endChapter ?? eBook.total_chapters;
        if (finalEndChapter < startChapter) {
            return { valid: false, error: 'End chapter cannot be before start chapter in the same book' };
        }
    }

    return { valid: true };
};

/**
 * Generates a list of all chapters included in the range.
 */
export const getChaptersBetween = (
    startBook: string,
    startChapter: number,
    endBook: string,
    endChapter?: number
): IChapterRef[] => {
    const chapters: IChapterRef[] = [];

    const sBookName = startBook.toLowerCase();
    const eBookName = endBook.toLowerCase();

    let started = false;
    let finished = false;

    for (const book of COMM_BIBLE_DATA) {
        const currentName = book.book_name_en.toLowerCase();

        // Optimize loop: if we haven't started and this isn't the start book, skip
        if (!started && currentName !== sBookName) {
            continue;
        }

        // We found the start book (or we are already traversing)
        started = true;

        const isStartBook = currentName === sBookName;
        const isEndBook = currentName === eBookName;

        const startChap = isStartBook ? startChapter : 1;
        // If it's the end book, end at endChapter. If endChapter is undefined, go to end of book.
        // If NOT end book, go to end of book.
        let endChap = book.total_chapters;
        if (isEndBook && endChapter !== undefined) {
            endChap = endChapter;
        }

        for (let c = startChap; c <= endChap; c++) {
            chapters.push({
                book: book.book_name_en, // Use canonical name
                chapter: c
            });
        }

        if (isEndBook) {
            finished = true;
            break;
        }
    }

    return chapters;
};
