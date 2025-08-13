const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
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
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    category: {
        type: String,
        enum: ['favorite', 'study', 'prayer', 'inspiration', 'teaching', 'personal', 'other'],
        default: 'favorite'
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [50, 'Tag cannot exceed 50 characters']
    }],
    color: {
        type: String,
        default: '#007bff',
        match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color']
    },
    icon: {
        type: String,
        default: 'bookmark',
        maxlength: [50, 'Icon name cannot exceed 50 characters']
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
    notes: {
        type: String,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    personalReflection: {
        type: String,
        maxlength: [2000, 'Personal reflection cannot exceed 2000 characters']
    },
    application: {
        type: String,
        maxlength: [1000, 'Application cannot exceed 1000 characters']
    },
    prayerPoints: [{
        type: String,
        trim: true,
        maxlength: [200, 'Prayer point cannot exceed 200 characters']
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
    studyNotes: [{
        topic: {
            type: String,
            trim: true,
            maxlength: [100, 'Topic cannot exceed 100 characters']
        },
        content: {
            type: String,
            trim: true,
            maxlength: [500, 'Study note content cannot exceed 500 characters']
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
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
    reviewCount: {
        type: Number,
        default: 0,
        min: [0, 'Review count cannot be negative']
    },
    importance: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    mood: {
        type: String,
        enum: ['inspired', 'challenged', 'comforted', 'convicted', 'grateful', 'other'],
        default: 'other'
    },
    context: {
        type: String,
        enum: ['personal_study', 'group_study', 'sermon', 'devotional', 'counseling', 'other'],
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
    audioUrl: {
        type: String,
        default: null
    },
    videoUrl: {
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
        shareCount: {
            type: Number,
            default: 0,
            min: [0, 'Share count cannot be negative']
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for verse reference
bookmarkSchema.virtual('verseReference').get(function () {
    if (this.endVerse && this.endVerse !== this.verse) {
        return `${this.book} ${this.chapter}:${this.verse}-${this.endVerse}`;
    }
    return `${this.book} ${this.chapter}:${this.verse}`;
});

// Virtual for verse range
bookmarkSchema.virtual('isVerseRange').get(function () {
    return this.endVerse && this.endVerse !== this.verse;
});

// Compound indexes for efficient queries
bookmarkSchema.index({ userId: 1, book: 1, chapter: 1, verse: 1 });
bookmarkSchema.index({ userId: 1, category: 1 });
bookmarkSchema.index({ userId: 1, createdAt: -1 });
bookmarkSchema.index({ userId: 1, isPublic: 1 });
bookmarkSchema.index({ tags: 1 });

// Pre-save middleware to validate verse range
bookmarkSchema.pre('save', function (next) {
    if (this.endVerse && this.endVerse < this.verse) {
        next(new Error('End verse cannot be less than start verse'));
    }
    next();
});

// Static method to get user's bookmarks
bookmarkSchema.statics.getUserBookmarks = function (userId, options = {}) {
    const query = { userId };

    if (options.category) query.category = options.category;
    if (options.book) query.book = options.book;
    if (options.tags && options.tags.length > 0) {
        query.tags = { $in: options.tags };
    }
    if (options.isPublic !== undefined) query.isPublic = options.isPublic;

    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 50);
};

// Static method to get shared bookmarks
bookmarkSchema.statics.getSharedBookmarks = function (userId) {
    return this.find({
        $or: [
            { 'sharedWith.userId': userId },
            { isPublic: true }
        ]
    }).populate('userId', 'firstName lastName profilePicture');
};

// Static method to search bookmarks
bookmarkSchema.statics.searchBookmarks = function (userId, searchTerm) {
    return this.find({
        userId,
        $or: [
            { title: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { notes: { $regex: searchTerm, $options: 'i' } },
            { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
    }).sort({ createdAt: -1 });
};

// Instance method to increment view count
bookmarkSchema.methods.incrementViewCount = function () {
    this.analytics.viewCount += 1;
    this.analytics.lastViewed = new Date();
    return this.save();
};

// Instance method to share with user
bookmarkSchema.methods.shareWithUser = function (targetUserId, permission = 'view') {
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

// Instance method to remove share
bookmarkSchema.methods.removeShare = function (targetUserId) {
    this.sharedWith = this.sharedWith.filter(share => share.userId.toString() !== targetUserId.toString());
    this.isShared = this.sharedWith.length > 0;
    return this.save();
};

// Instance method to add study note
bookmarkSchema.methods.addStudyNote = function (topic, content) {
    this.studyNotes.push({
        topic,
        content,
        createdAt: new Date()
    });
    return this.save();
};

module.exports = mongoose.model('Bookmark', bookmarkSchema);
