import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for verse reference
export interface IVerseReference {
    bookId: string;
    chapter: number;
    verseStart: number;
    verseCount: number;
}

// TypeScript interface for Topic
export interface ITopic extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    verses: IVerseReference[];
    createdAt: Date;
    updatedAt: Date;
}

// Verse reference schema
const verseReferenceSchema = new Schema<IVerseReference>({
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
}, { _id: false });

// Topic schema
const topicSchema = new Schema<ITopic>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    name: {
        type: String,
        required: [true, 'Topic name is required'],
        trim: true,
        maxlength: [100, 'Topic name cannot exceed 100 characters']
    },
    verses: {
        type: [verseReferenceSchema],
        default: [],
        validate: {
            validator: function (verses: IVerseReference[]) {
                return verses.length <= 1000; // Limit to 1000 verses per topic
            },
            message: 'Topic cannot contain more than 1000 verses'
        }
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
topicSchema.index({ userId: 1, name: 1 });
topicSchema.index({ userId: 1, createdAt: -1 });
topicSchema.index({ name: 'text' }); // Text search index

// Virtual for total verses count
topicSchema.virtual('totalVerses').get(function () {
    return this.verses.reduce((total, verse) => total + verse.verseCount, 0);
});

// Virtual for unique books count
topicSchema.virtual('uniqueBooks').get(function () {
    const books = new Set(this.verses.map(verse => verse.bookId));
    return books.size;
});

// Method to add a verse to the topic
topicSchema.methods.addVerse = function (verseRef: IVerseReference) {
    // Check if verse already exists
    const exists = this.verses.some((verse: IVerseReference) =>
        verse.bookId === verseRef.bookId &&
        verse.chapter === verseRef.chapter &&
        verse.verseStart === verseRef.verseStart &&
        verse.verseCount === verseRef.verseCount
    );

    if (!exists) {
        this.verses.push(verseRef);
    }

    return this.save();
};

// Method to remove a verse from the topic
topicSchema.methods.removeVerse = function (verseRef: IVerseReference) {
    this.verses = this.verses.filter((verse: IVerseReference) =>
        !(verse.bookId === verseRef.bookId &&
            verse.chapter === verseRef.chapter &&
            verse.verseStart === verseRef.verseStart &&
            verse.verseCount === verseRef.verseCount)
    );

    return this.save();
};

// Method to check if topic contains a specific verse
topicSchema.methods.containsVerse = function (bookId: string, chapter: number, verseStart: number, verseEnd?: number) {
    const end = verseEnd || verseStart;

    return this.verses.some((verse: IVerseReference) => {
        if (verse.bookId !== bookId || verse.chapter !== chapter) {
            return false;
        }

        const verseEnd = verse.verseStart + verse.verseCount - 1;
        return !(end < verse.verseStart || verseStart > verseEnd);
    });
};

// Static method to find topics by verse reference
topicSchema.statics.findByVerse = function (
    userId: mongoose.Types.ObjectId,
    bookId: string,
    chapter: number,
    verseStart: number,
    verseEnd?: number
) {
    const end = verseEnd || verseStart;

    return this.find({
        userId,
        'verses.bookId': bookId,
        'verses.chapter': chapter,
        $or: [
            {
                'verses.verseStart': { $lte: verseStart },
                $expr: { $gte: [{ $add: ['$verses.verseStart', '$verses.verseCount'] }, verseStart] }
            },
            {
                'verses.verseStart': { $lte: end },
                $expr: { $gte: [{ $add: ['$verses.verseStart', '$verses.verseCount'] }, end] }
            },
            {
                'verses.verseStart': { $gte: verseStart },
                $expr: { $lte: ['$verses.verseStart', end] }
            }
        ]
    });
};

// Static method to search topics by name
topicSchema.statics.searchByName = function (
    userId: mongoose.Types.ObjectId,
    searchTerm: string
) {
    return this.find({
        userId,
        $text: { $search: searchTerm }
    }).sort({ score: { $meta: 'textScore' } });
};

// Static method to get topic statistics
topicSchema.statics.getStats = function (userId: mongoose.Types.ObjectId) {
    return this.aggregate([
        { $match: { userId } },
        {
            $project: {
                name: 1,
                verseCount: { $size: '$verses' },
                totalVerses: {
                    $reduce: {
                        input: '$verses',
                        initialValue: 0,
                        in: { $add: ['$$value', '$$this.verseCount'] }
                    }
                }
            }
        },
        {
            $group: {
                _id: null,
                totalTopics: { $sum: 1 },
                totalVerses: { $sum: '$totalVerses' },
                avgVersesPerTopic: { $avg: '$verseCount' }
            }
        }
    ]);
};

export const Topic = mongoose.model<ITopic>('Topic', topicSchema);
