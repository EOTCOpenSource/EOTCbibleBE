const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    book: {
        type: String,
        required: [true, 'Book is required'],
        trim: true
    },
    chapter: {
        type: Number,
        required: [true, 'Chapter is required'],
        min: [1, 'Chapter must be at least 1']
    },
    verse: {
        type: Number,
        required: [true, 'Verse is required'],
        min: [1, 'Verse must be at least 1']
    },
    progressType: {
        type: String,
        enum: ['reading', 'completed', 'bookmarked', 'highlighted', 'noted'],
        default: 'reading'
    },
    readAt: {
        type: Date,
        default: Date.now
    },
    timeSpent: {
        type: Number, // in seconds
        default: 0,
        min: [0, 'Time spent cannot be negative']
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [50, 'Tag cannot exceed 50 characters']
    }],
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    understanding: {
        type: Number,
        min: [1, 'Understanding must be at least 1'],
        max: [5, 'Understanding cannot exceed 5'],
        default: 3
    },
    emotionalResponse: {
        type: String,
        enum: ['inspired', 'challenged', 'confused', 'peaceful', 'other'],
        default: 'other'
    },
    prayerPoints: [{
        type: String,
        trim: true,
        maxlength: [200, 'Prayer point cannot exceed 200 characters']
    }],
    actionItems: [{
        type: String,
        trim: true,
        maxlength: [200, 'Action item cannot exceed 200 characters']
    }],
    shareWithGroup: {
        type: Boolean,
        default: false
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        default: null
    },
    deviceInfo: {
        platform: String,
        appVersion: String,
        deviceId: String
    },
    location: {
        latitude: Number,
        longitude: Number,
        city: String,
        country: String
    },
    weather: {
        condition: String,
        temperature: Number
    },
    mood: {
        type: String,
        enum: ['happy', 'sad', 'anxious', 'peaceful', 'excited', 'tired', 'other'],
        default: 'other'
    },
    energyLevel: {
        type: Number,
        min: [1, 'Energy level must be at least 1'],
        max: [10, 'Energy level cannot exceed 10'],
        default: 5
    },
    distractions: [{
        type: String,
        trim: true,
        maxlength: [100, 'Distraction cannot exceed 100 characters']
    }],
    focusLevel: {
        type: Number,
        min: [1, 'Focus level must be at least 1'],
        max: [10, 'Focus level cannot exceed 10'],
        default: 5
    },
    insights: [{
        type: String,
        trim: true,
        maxlength: [500, 'Insight cannot exceed 500 characters']
    }],
    questions: [{
        type: String,
        trim: true,
        maxlength: [300, 'Question cannot exceed 300 characters']
    }],
    relatedVerses: [{
        book: String,
        chapter: Number,
        verse: Number,
        relevance: {
            type: String,
            enum: ['direct', 'thematic', 'contextual', 'cross-reference'],
            default: 'thematic'
        }
    }],
    studyResources: [{
        type: String,
        enum: ['commentary', 'concordance', 'dictionary', 'map', 'timeline', 'other'],
        default: 'other'
    }],
    memorizationStatus: {
        type: String,
        enum: ['not_started', 'in_progress', 'memorized', 'reviewing'],
        default: 'not_started'
    },
    memorizationScore: {
        type: Number,
        min: [0, 'Memorization score cannot be negative'],
        max: [100, 'Memorization score cannot exceed 100'],
        default: 0
    },
    lastReviewed: {
        type: Date,
        default: null
    },
    reviewSchedule: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'custom'],
        default: 'daily'
    },
    nextReview: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for verse reference
progressSchema.virtual('verseReference').get(function () {
    return `${this.book} ${this.chapter}:${this.verse}`;
});

// Virtual for reading duration in minutes
progressSchema.virtual('readingDurationMinutes').get(function () {
    return Math.round(this.timeSpent / 60 * 100) / 100;
});

// Compound index for efficient queries
progressSchema.index({ userId: 1, book: 1, chapter: 1, verse: 1 });
progressSchema.index({ userId: 1, progressType: 1 });
progressSchema.index({ userId: 1, readAt: -1 });
progressSchema.index({ userId: 1, isCompleted: 1 });

// Pre-save middleware to set completedAt when marked as completed
progressSchema.pre('save', function (next) {
    if (this.isCompleted && !this.completedAt) {
        this.completedAt = new Date();
    }
    next();
});

// Static method to get user's reading progress
progressSchema.statics.getUserProgress = function (userId, options = {}) {
    const query = { userId };

    if (options.book) query.book = options.book;
    if (options.chapter) query.chapter = options.chapter;
    if (options.progressType) query.progressType = options.progressType;
    if (options.isCompleted !== undefined) query.isCompleted = options.isCompleted;

    return this.find(query)
        .sort({ readAt: -1 })
        .limit(options.limit || 50);
};

// Static method to get reading statistics
progressSchema.statics.getReadingStats = function (userId) {
    return this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalVersesRead: { $sum: 1 },
                totalTimeSpent: { $sum: '$timeSpent' },
                completedVerses: { $sum: { $cond: ['$isCompleted', 1, 0] } },
                averageUnderstanding: { $avg: '$understanding' },
                averageFocusLevel: { $avg: '$focusLevel' }
            }
        }
    ]);
};

// Instance method to mark as completed
progressSchema.methods.markAsCompleted = function () {
    this.isCompleted = true;
    this.completedAt = new Date();
    return this.save();
};

// Instance method to update understanding
progressSchema.methods.updateUnderstanding = function (level) {
    if (level >= 1 && level <= 5) {
        this.understanding = level;
        return this.save();
    }
    throw new Error('Understanding level must be between 1 and 5');
};

module.exports = mongoose.model('Progress', progressSchema);
