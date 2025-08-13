const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
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
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
        maxlength: [10000, 'Content cannot exceed 10000 characters']
    },
    type: {
        type: String,
        enum: ['personal', 'study', 'sermon', 'devotional', 'prayer', 'application', 'question', 'insight', 'other'],
        default: 'personal'
    },
    category: {
        type: String,
        enum: ['doctrine', 'history', 'prophecy', 'wisdom', 'gospel', 'epistle', 'psalms', 'other'],
        default: 'other'
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [50, 'Tag cannot exceed 50 characters']
    }],
    color: {
        type: String,
        default: '#28a745',
        match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color']
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
    questions: [{
        type: String,
        trim: true,
        maxlength: [300, 'Question cannot exceed 300 characters']
    }],
    insights: [{
        type: String,
        trim: true,
        maxlength: [500, 'Insight cannot exceed 500 characters']
    }],
    applications: [{
        type: String,
        trim: true,
        maxlength: [500, 'Application cannot exceed 500 characters']
    }],
    personalReflection: {
        type: String,
        maxlength: [2000, 'Personal reflection cannot exceed 2000 characters']
    },
    historicalContext: {
        type: String,
        maxlength: [1000, 'Historical context cannot exceed 1000 characters']
    },
    culturalContext: {
        type: String,
        maxlength: [1000, 'Cultural context cannot exceed 1000 characters']
    },
    theologicalImplications: {
        type: String,
        maxlength: [1000, 'Theological implications cannot exceed 1000 characters']
    },
    crossReferences: [{
        book: String,
        chapter: Number,
        verse: Number,
        relationship: {
            type: String,
            enum: ['fulfillment', 'parallel', 'quotation', 'allusion', 'theme', 'other'],
            default: 'theme'
        }
    }],
    wordStudies: [{
        word: {
            type: String,
            trim: true,
            maxlength: [100, 'Word cannot exceed 100 characters']
        },
        originalLanguage: {
            type: String,
            enum: ['hebrew', 'greek', 'aramaic'],
            default: 'greek'
        },
        meaning: {
            type: String,
            trim: true,
            maxlength: [500, 'Meaning cannot exceed 500 characters']
        },
        significance: {
            type: String,
            trim: true,
            maxlength: [500, 'Significance cannot exceed 500 characters']
        }
    }],
    audioUrl: {
        type: String,
        default: null
    },
    imageUrl: {
        type: String,
        default: null
    },
    externalLinks: [{
        title: {
            type: String,
            trim: true,
            maxlength: [100, 'Link title cannot exceed 100 characters']
        },
        url: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true,
            maxlength: [200, 'Link description cannot exceed 200 characters']
        }
    }],
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
        editCount: {
            type: Number,
            default: 0,
            min: [0, 'Edit count cannot be negative']
        },
        lastEdited: {
            type: Date,
            default: null
        },
        shareCount: {
            type: Number,
            default: 0,
            min: [0, 'Share count cannot be negative']
        }
    },
    version: {
        type: Number,
        default: 1,
        min: [1, 'Version must be at least 1']
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
noteSchema.virtual('verseReference').get(function () {
    if (this.endVerse && this.endVerse !== this.verse) {
        return `${this.book} ${this.chapter}:${this.verse}-${this.endVerse}`;
    }
    return `${this.book} ${this.chapter}:${this.verse}`;
});

// Virtual for verse range
noteSchema.virtual('isVerseRange').get(function () {
    return this.endVerse && this.endVerse !== this.verse;
});

// Virtual for word count
noteSchema.virtual('wordCount').get(function () {
    return this.content.split(/\s+/).filter(word => word.length > 0).length;
});

// Compound indexes for efficient queries
noteSchema.index({ userId: 1, book: 1, chapter: 1, verse: 1 });
noteSchema.index({ userId: 1, type: 1 });
noteSchema.index({ userId: 1, category: 1 });
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, isPublic: 1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ userId: 1, isArchived: 1 });

// Pre-save middleware to validate verse range and increment version
noteSchema.pre('save', function (next) {
    if (this.endVerse && this.endVerse < this.verse) {
        next(new Error('End verse cannot be less than start verse'));
    }

    if (this.isModified('content') || this.isModified('title')) {
        this.version += 1;
        this.analytics.editCount += 1;
        this.analytics.lastEdited = new Date();
    }

    if (this.isArchived && !this.archivedAt) {
        this.archivedAt = new Date();
    }

    next();
});

// Static method to get user's notes
noteSchema.statics.getUserNotes = function (userId, options = {}) {
    const query = { userId, isArchived: false };

    if (options.type) query.type = options.type;
    if (options.category) query.category = options.category;
    if (options.book) query.book = options.book;
    if (options.tags && options.tags.length > 0) {
        query.tags = { $in: options.tags };
    }
    if (options.isPublic !== undefined) query.isPublic = options.isPublic;

    return this.find(query)
        .sort({ updatedAt: -1 })
        .limit(options.limit || 50);
};

// Static method to get shared notes
noteSchema.statics.getSharedNotes = function (userId) {
    return this.find({
        $or: [
            { 'sharedWith.userId': userId },
            { isPublic: true }
        ],
        isArchived: false
    }).populate('userId', 'firstName lastName profilePicture');
};

// Static method to search notes
noteSchema.statics.searchNotes = function (userId, searchTerm) {
    return this.find({
        userId,
        isArchived: false,
        $or: [
            { title: { $regex: searchTerm, $options: 'i' } },
            { content: { $regex: searchTerm, $options: 'i' } },
            { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
    }).sort({ updatedAt: -1 });
};

// Instance method to increment view count
noteSchema.methods.incrementViewCount = function () {
    this.analytics.viewCount += 1;
    this.analytics.lastViewed = new Date();
    return this.save();
};

// Instance method to share with user
noteSchema.methods.shareWithUser = function (targetUserId, permission = 'view') {
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

// Instance method to archive note
noteSchema.methods.archive = function () {
    this.isArchived = true;
    this.archivedAt = new Date();
    return this.save();
};

// Instance method to restore note
noteSchema.methods.restore = function () {
    this.isArchived = false;
    this.archivedAt = null;
    return this.save();
};

// Instance method to add word study
noteSchema.methods.addWordStudy = function (word, originalLanguage, meaning, significance) {
    this.wordStudies.push({
        word,
        originalLanguage,
        meaning,
        significance
    });
    return this.save();
};

module.exports = mongoose.model('Note', noteSchema);
