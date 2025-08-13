const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema({
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
    endVerse: {
        type: Number,
        min: [1, 'End verse must be at least 1'],
        default: null
    },
    color: {
        type: String,
        required: [true, 'Color is required'],
        default: '#ffeb3b',
        match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color']
    },
    type: {
        type: String,
        enum: ['highlight', 'underline', 'strikethrough', 'box', 'circle', 'arrow', 'other'],
        default: 'highlight'
    },
    style: {
        type: String,
        enum: ['solid', 'dashed', 'dotted', 'wavy', 'double'],
        default: 'solid'
    },
    opacity: {
        type: Number,
        min: [0.1, 'Opacity must be at least 0.1'],
        max: [1.0, 'Opacity cannot exceed 1.0'],
        default: 0.3
    },
    category: {
        type: String,
        enum: ['important', 'favorite', 'study', 'prayer', 'promise', 'command', 'warning', 'comfort', 'other'],
        default: 'important'
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [50, 'Tag cannot exceed 50 characters']
    }],
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    isShared: {
        type: Boolean,
        default: false
    },
    sharedWith: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        permission: {
            type: String,
            enum: ['view', 'edit', 'admin'],
            default: 'view'
        },
        sharedAt: {
            type: Date,
            default: Date.now
        }
    }],
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        default: null
    },
    mood: {
        type: String,
        enum: ['inspired', 'challenged', 'comforted', 'convicted', 'grateful', 'confused', 'curious', 'other'],
        default: 'other'
    },
    importance: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    context: {
        type: String,
        enum: ['personal_study', 'group_study', 'sermon', 'devotional', 'counseling', 'teaching', 'other'],
        default: 'personal_study'
    },
    language: {
        type: String,
        enum: ['en', 'am', 'or'],
        default: 'en'
    },
    translation: {
        type: String,
        default: 'NIV',
        trim: true
    },
    verseText: {
        type: String,
        trim: true,
        maxlength: [2000, 'Verse text cannot exceed 2000 characters']
    },
    selectedText: {
        type: String,
        trim: true,
        maxlength: [1000, 'Selected text cannot exceed 1000 characters']
    },
    startPosition: {
        type: Number,
        min: [0, 'Start position cannot be negative'],
        default: 0
    },
    endPosition: {
        type: Number,
        min: [0, 'End position cannot be negative'],
        default: 0
    },
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
    insights: [{
        type: String,
        trim: true,
        maxlength: [300, 'Insight cannot exceed 300 characters']
    }],
    questions: [{
        type: String,
        trim: true,
        maxlength: [300, 'Question cannot exceed 300 characters']
    }],
    applications: [{
        type: String,
        trim: true,
        maxlength: [300, 'Application cannot exceed 300 characters']
    }],
    personalReflection: {
        type: String,
        maxlength: [1000, 'Personal reflection cannot exceed 1000 characters']
    },
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
    reviewCount: {
        type: Number,
        default: 0,
        min: [0, 'Review count cannot be negative']
    },
    reminder: {
        enabled: {
            type: Boolean,
            default: false
        },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'custom'],
            default: 'daily'
        },
        nextReminder: {
            type: Date,
            default: null
        }
    },
    analytics: {
        viewCount: {
            type: Number,
            default: 0,
            min: [0, 'View count cannot be negative']
        },
        lastViewed: {
            type: Date,
            default: null
        },
        shareCount: {
            type: Number,
            default: 0,
            min: [0, 'Share count cannot be negative']
        }
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
    focusLevel: {
        type: Number,
        min: [1, 'Focus level must be at least 1'],
        max: [10, 'Focus level cannot exceed 10'],
        default: 5
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for verse reference
highlightSchema.virtual('verseReference').get(function () {
    if (this.endVerse && this.endVerse !== this.verse) {
        return `${this.book} ${this.chapter}:${this.verse}-${this.endVerse}`;
    }
    return `${this.book} ${this.chapter}:${this.verse}`;
});

// Virtual for verse range
highlightSchema.virtual('isVerseRange').get(function () {
    return this.endVerse && this.endVerse !== this.verse;
});

// Virtual for text selection
highlightSchema.virtual('hasTextSelection').get(function () {
    return this.selectedText && this.selectedText.length > 0;
});

// Compound indexes for efficient queries
highlightSchema.index({ userId: 1, book: 1, chapter: 1, verse: 1 });
highlightSchema.index({ userId: 1, color: 1 });
highlightSchema.index({ userId: 1, category: 1 });
highlightSchema.index({ userId: 1, createdAt: -1 });
highlightSchema.index({ userId: 1, isPublic: 1 });
highlightSchema.index({ tags: 1 });
highlightSchema.index({ userId: 1, isArchived: 1 });

// Pre-save middleware to validate verse range and positions
highlightSchema.pre('save', function (next) {
    if (this.endVerse && this.endVerse < this.verse) {
        next(new Error('End verse cannot be less than start verse'));
    }

    if (this.endPosition < this.startPosition) {
        next(new Error('End position cannot be less than start position'));
    }

    if (this.isArchived && !this.archivedAt) {
        this.archivedAt = new Date();
    }

    next();
});

// Static method to get user's highlights
highlightSchema.statics.getUserHighlights = function (userId, options = {}) {
    const query = { userId, isArchived: false };

    if (options.color) query.color = options.color;
    if (options.category) query.category = options.category;
    if (options.book) query.book = options.book;
    if (options.type) query.type = options.type;
    if (options.tags && options.tags.length > 0) {
        query.tags = { $in: options.tags };
    }
    if (options.isPublic !== undefined) query.isPublic = options.isPublic;

    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 50);
};

// Static method to get shared highlights
highlightSchema.statics.getSharedHighlights = function (userId) {
    return this.find({
        $or: [
            { 'sharedWith.userId': userId },
            { isPublic: true }
        ],
        isArchived: false
    }).populate('userId', 'firstName lastName profilePicture');
};

// Static method to search highlights
highlightSchema.statics.searchHighlights = function (userId, searchTerm) {
    return this.find({
        userId,
        isArchived: false,
        $or: [
            { notes: { $regex: searchTerm, $options: 'i' } },
            { selectedText: { $regex: searchTerm, $options: 'i' } },
            { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
    }).sort({ createdAt: -1 });
};

// Static method to get highlights by color
highlightSchema.statics.getHighlightsByColor = function (userId, color) {
    return this.find({
        userId,
        color,
        isArchived: false
    }).sort({ createdAt: -1 });
};

// Static method to get highlights by category
highlightSchema.statics.getHighlightsByCategory = function (userId, category) {
    return this.find({
        userId,
        category,
        isArchived: false
    }).sort({ createdAt: -1 });
};

// Instance method to increment view count
highlightSchema.methods.incrementViewCount = function () {
    this.analytics.viewCount += 1;
    this.analytics.lastViewed = new Date();
    return this.save();
};

// Instance method to share with user
highlightSchema.methods.shareWithUser = function (targetUserId, permission = 'view') {
    const existingShare = this.sharedWith.find(share => share.userId.toString() === targetUserId.toString());

    if (existingShare) {
        existingShare.permission = permission;
        existingShare.sharedAt = new Date();
    } else {
        this.sharedWith.push({
            userId: targetUserId,
            permission,
            sharedAt: new Date()
        });
    }

    this.isShared = true;
    this.analytics.shareCount += 1;
    return this.save();
};

// Instance method to archive highlight
highlightSchema.methods.archive = function () {
    this.isArchived = true;
    this.archivedAt = new Date();
    return this.save();
};

// Instance method to restore highlight
highlightSchema.methods.restore = function () {
    this.isArchived = false;
    this.archivedAt = null;
    return this.save();
};

// Instance method to update color
highlightSchema.methods.updateColor = function (newColor) {
    if (/^#[0-9A-F]{6}$/i.test(newColor)) {
        this.color = newColor;
        return this.save();
    }
    throw new Error('Invalid color format. Use hex color (e.g., #ffeb3b)');
};

// Instance method to add insight
highlightSchema.methods.addInsight = function (insight) {
    this.insights.push(insight);
    return this.save();
};

// Instance method to add prayer point
highlightSchema.methods.addPrayerPoint = function (prayerPoint) {
    this.prayerPoints.push(prayerPoint);
    return this.save();
};

module.exports = mongoose.model('Highlight', highlightSchema);
