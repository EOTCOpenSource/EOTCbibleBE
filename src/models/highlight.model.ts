import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for Highlight
export interface IHighlight extends Document {
    userId: mongoose.Types.ObjectId;
    bookId: string;
    chapter: number;
    verseStart: number;
    verseCount: number;
    color: string;
    createdAt: Date;
    updatedAt: Date;
}

// Highlight schema
const highlightSchema = new Schema<IHighlight>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
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
    color: {
        type: String,
        required: [true, 'Highlight color is required'],
        enum: ['yellow', 'green', 'blue', 'pink', 'purple', 'orange', 'red'],
        default: 'yellow'
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
highlightSchema.index({ userId: 1, bookId: 1 });
highlightSchema.index({ userId: 1, bookId: 1, chapter: 1 });
highlightSchema.index({ userId: 1, color: 1 });
highlightSchema.index({ userId: 1, createdAt: -1 });

// Virtual for verse end
highlightSchema.virtual('verseEnd').get(function() {
    return this.verseStart + this.verseCount - 1;
});

// Virtual for verse reference
highlightSchema.virtual('verseReference').get(function() {
    const verseEnd = this.verseStart + this.verseCount - 1;
    return `${this.bookId} ${this.chapter}:${this.verseStart}${this.verseCount > 1 ? `-${verseEnd}` : ''}`;
});

// Method to check if highlight overlaps with another
highlightSchema.methods.overlapsWith = function(other: IHighlight): boolean {
    if (this.bookId !== other.bookId || this.chapter !== other.chapter) {
        return false;
    }
    
    const thisStart = this.verseStart;
    const thisEnd = this.verseStart + this.verseCount - 1;
    const otherStart = other.verseStart;
    const otherEnd = other.verseStart + other.verseCount - 1;
    
    return !(thisEnd < otherStart || thisStart > otherEnd);
};

// Static method to find highlights for a specific verse range
highlightSchema.statics.findByVerseRange = function(
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

// Static method to find highlights by color
highlightSchema.statics.findByColor = function(
    userId: mongoose.Types.ObjectId,
    color: string
) {
    return this.find({ userId, color }).sort({ createdAt: -1 });
};

// Static method to get highlight statistics
highlightSchema.statics.getStats = function(userId: mongoose.Types.ObjectId) {
    return this.aggregate([
        { $match: { userId } },
        {
            $group: {
                _id: '$color',
                count: { $sum: 1 },
                totalVerses: { $sum: '$verseCount' }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

export const Highlight = mongoose.model<IHighlight>('Highlight', highlightSchema);
