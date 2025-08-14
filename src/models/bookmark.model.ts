import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for Bookmark
export interface IBookmark extends Document {
    userId: mongoose.Types.ObjectId;
    bookId: string;
    chapter: number;
    verseStart: number;
    verseCount: number;
    createdAt: Date;
    updatedAt: Date;
}

// Bookmark schema
const bookmarkSchema = new Schema<IBookmark>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    bookId: {
        type: String,
        required: [true, 'Book ID is required'],
        trim: true
    },
    chapter: {
        type: Number,
        required: [true, 'Chapter is required'],
        min: [1, 'Chapter must be at least 1']
    },
    verseStart: {
        type: Number,
        required: [true, 'Verse start is required'],
        min: [1, 'Verse start must be at least 1']
    },
    verseCount: {
        type: Number,
        required: [true, 'Verse count is required'],
        min: [1, 'Verse count must be at least 1'],
        default: 1
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
bookmarkSchema.index({ userId: 1, bookId: 1 });
bookmarkSchema.index({ userId: 1, bookId: 1, chapter: 1 });
bookmarkSchema.index({ userId: 1, createdAt: -1 });

// Virtual for verse end
bookmarkSchema.virtual('verseEnd').get(function() {
    return this.verseStart + this.verseCount - 1;
});

// Method to check if bookmark overlaps with another
bookmarkSchema.methods.overlapsWith = function(other: IBookmark): boolean {
    if (this.bookId !== other.bookId || this.chapter !== other.chapter) {
        return false;
    }
    
    const thisStart = this.verseStart;
    const thisEnd = this.verseStart + this.verseCount - 1;
    const otherStart = other.verseStart;
    const otherEnd = other.verseStart + other.verseCount - 1;
    
    return !(thisEnd < otherStart || thisStart > otherEnd);
};

// Static method to find bookmarks for a specific verse range
bookmarkSchema.statics.findByVerseRange = function(
    userId: mongoose.Types.ObjectId,
    bookId: string,
    chapter: number,
    verseStart: number,
    verseEnd: number
) {
    return this.find({
        userId,
        bookId,
        chapter,
        $or: [
            {
                verseStart: { $lte: verseStart },
                $expr: { $gte: [{ $add: ['$verseStart', '$verseCount'] }, verseStart] }
            },
            {
                verseStart: { $lte: verseEnd },
                $expr: { $gte: [{ $add: ['$verseStart', '$verseCount'] }, verseEnd] }
            },
            {
                verseStart: { $gte: verseStart },
                $expr: { $lte: ['$verseStart', verseEnd] }
            }
        ]
    });
};

export const Bookmark = mongoose.model<IBookmark>('Bookmark', bookmarkSchema);
