import { getChaptersBetween, IChapterRef } from './bibleData';

export interface IDistributedDailyReading {
    dayNumber: number;
    readings: {
        book: string;
        startChapter: number;
        endChapter: number;
    }[];
}

export const distributeReadings = (
    startBook: string,
    startChapter: number,
    endBook: string,
    endChapter: number | undefined,
    durationInDays: number
): IDistributedDailyReading[] => {
    // 1. Get all chapters to be read as a flat list
    const allChapters: IChapterRef[] = getChaptersBetween(startBook, startChapter, endBook, endChapter);
    const totalChapters = allChapters.length;

    if (totalChapters === 0 || durationInDays <= 0) {
        return [];
    }

    // 2. Calculate distribution
    const baseChaptersPerDay = Math.floor(totalChapters / durationInDays);
    const remainder = totalChapters % durationInDays;

    const dailyReadings: IDistributedDailyReading[] = [];
    let currentChapterIndex = 0;

    for (let day = 1; day <= durationInDays; day++) {
        // Distribute remainder one by one to the first 'remainder' days
        const countForToday = baseChaptersPerDay + (day <= remainder ? 1 : 0);

        if (countForToday === 0 && currentChapterIndex >= totalChapters) {
            // If duration is longer than chapters (e.g. 5 chapters in 10 days), 
            // some days might have 0 readings if we strictly integer divide
            // Wait, if 5 chaps / 10 days => base 0, rem 5.
            // Day 1-5 get 1, Day 6-10 get 0.
            // This is technically correct behavior (some rest days), but logic handles it.
            // We should just push empty readings or handle as "completed early"?
            // Plan says "Distribute evenly". Rest days at end are fine.
        }

        const todaysChapters = allChapters.slice(currentChapterIndex, currentChapterIndex + countForToday);
        currentChapterIndex += countForToday;

        if (todaysChapters.length === 0) {
            // Days with no readings
            dailyReadings.push({
                dayNumber: day,
                readings: []
            });
            continue;
        }

        // Group by book for cleaner output
        // e.g. Genesis 1, Genesis 2, Exodus 1 -> [{book: Gen, 1-2}, {book: Ex, 1-1}]
        const groupedReadings: { book: string; startChapter: number; endChapter: number }[] = [];

        let currentGroup: { book: string; start: number; end: number } | null = null;

        for (const chap of todaysChapters) {
            if (!currentGroup) {
                currentGroup = { book: chap.book, start: chap.chapter, end: chap.chapter };
            } else {
                if (currentGroup.book === chap.book && chap.chapter === currentGroup.end + 1) {
                    // Contiguous chapter in same book
                    currentGroup.end = chap.chapter;
                } else {
                    // New book or non-contiguous (though getChaptersBetween returns contiguous)
                    groupedReadings.push({
                        book: currentGroup.book,
                        startChapter: currentGroup.start,
                        endChapter: currentGroup.end
                    });
                    currentGroup = { book: chap.book, start: chap.chapter, end: chap.chapter };
                }
            }
        }
        if (currentGroup) {
            groupedReadings.push({
                book: currentGroup.book,
                startChapter: currentGroup.start,
                endChapter: currentGroup.end
            });
        }

        dailyReadings.push({
            dayNumber: day,
            readings: groupedReadings
        });
    }

    return dailyReadings;
};
