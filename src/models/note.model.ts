import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for Note
export interface INote extends Document {
    userId: mongoose.Types.ObjectId;
    bookId: string;
    chapter: number;
    verseStart: number;
    verseCount: number;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

// Note schema
const noteSchema = new Schema<INote>({
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
    },
    content: {
        type: String,
        required: [true, 'Note content is required'],
        trim: true,
        maxlength: [10000, 'Note content cannot exceed 10,000 characters']
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
noteSchema.index({ userId: 1, bookId: 1 });
noteSchema.index({ userId: 1, bookId: 1, chapter: 1 });
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ content: 'text' }); // Text search index

// Virtual for verse end
noteSchema.virtual('verseEnd').get(function() {
    return this.verseStart + this.verseCount - 1;
});

// Virtual for verse reference
noteSchema.virtual('verseReference').get(function() {
    const verseEnd = this.verseStart + this.verseCount - 1;
    return `${this.bookId} ${this.chapter}:${this.verseStart}${this.verseCount > 1 ? `-${verseEnd}` : ''}`;
});

// Method to check if note overlaps with another
noteSchema.methods.overlapsWith = function(other: INote): boolean {
    if (this.bookId !== other.bookId || this.chapter !== other.chapter) {
        return false;
    }
    
    const thisStart = this.verseStart;
    const thisEnd = this.verseStart + this.verseCount - 1;
    const otherStart = other.verseStart;
    const otherEnd = other.verseStart + other.verseCount - 1;
    
    return !(thisEnd < otherStart || thisStart > otherEnd);
};

// Static method to find notes for a specific verse range
noteSchema.statics.findByVerseRange = function(
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
    }).sort({ createdAt: -1 });
};

// Static method to search notes by content
noteSchema.statics.searchByContent = function(
    userId: mongoose.Types.ObjectId,
    searchTerm: string
) {
    return this.find({
        userId,
        $text: { $search: searchTerm }
    }).sort({ score: { $meta: 'textScore' } });
};

export const Note = mongoose.model<INote>('Note', noteSchema);
