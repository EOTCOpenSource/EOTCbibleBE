import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for Progress
export interface IProgress extends Document {
    userId: mongoose.Types.ObjectId;
    chaptersRead: Map<string, number[]>;
}

// Progress schema
const progressSchema = new Schema<IProgress>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    chaptersRead: {
        type: Map,
        of: [Number],
        default: new Map()
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
progressSchema.index({ userId: 1 });

// Virtual for getting total chapters read
progressSchema.virtual('totalChaptersRead').get(function() {
    let total = 0;
    this.chaptersRead.forEach((verses: number[]) => {
        total += verses.length;
    });
    return total;
});

// Method to add a chapter read
progressSchema.methods.addChapterRead = function(bookId: string, chapter: number, verse: number) {
    const key = `${bookId}:${chapter}`;
    if (!this.chaptersRead.has(key)) {
        this.chaptersRead.set(key, []);
    }
    const verses = this.chaptersRead.get(key) || [];
    if (!verses.includes(verse)) {
        verses.push(verse);
        this.chaptersRead.set(key, verses);
    }
    return this.save();
};

// Method to get chapters read for a specific book
progressSchema.methods.getChaptersForBook = function(bookId: string) {
    const chapters: { [key: number]: number[] } = {};
    this.chaptersRead.forEach((verses: number[], key: string) => {
        if (key.startsWith(`${bookId}:`)) {
            const chapterStr = key.split(':')[1];
            if (chapterStr) {
                const chapter = parseInt(chapterStr);
                chapters[chapter] = verses;
            }
        }
    });
    return chapters;
};

export const Progress = mongoose.model<IProgress>('Progress', progressSchema);
