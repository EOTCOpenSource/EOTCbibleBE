const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Topic name is required'],
        trim: true,
        maxlength: [100, 'Topic name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    category: {
        type: String,
        enum: ['doctrine', 'character', 'relationship', 'prayer', 'worship', 'service', 'mission', 'prophecy', 'history', 'wisdom', 'other'],
        default: 'other'
    },
    subcategory: {
        type: String,
        trim: true,
        maxlength: [50, 'Subcategory cannot exceed 50 characters']
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [50, 'Tag cannot exceed 50 characters']
    }],
    color: {
        type: String,
        default: '#6c757d',
        match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color']
    },
    icon: {
        type: String,
        default: 'tag',
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
    parentTopic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        default: null
    },
    childTopics: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic'
    }],
    relatedTopics: [{
        topicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Topic'
        },
        relationship: {
            type: String,
            enum: ['similar', 'opposite', 'prerequisite', 'follows', 'complements', 'other'],
            default: 'similar'
        }
    }],
    verses: [{
        book: String,
        chapter: Number,
        verse: Number,
        relevance: {
            type: String,
            enum: ['primary', 'secondary', 'supporting', 'cross-reference'],
            default: 'primary'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    notes: [{
        content: {
            type: String,
            trim: true,
            maxlength: [1000, 'Note content cannot exceed 1000 characters']
        },
        type: {
            type: String,
            enum: ['definition', 'explanation', 'application', 'question', 'insight', 'other'],
            default: 'explanation'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    studyResources: [{
        title: {
            type: String,
            trim: true,
            maxlength: [200, 'Resource title cannot exceed 200 characters']
        },
        type: {
            type: String,
            enum: ['commentary', 'concordance', 'dictionary', 'map', 'timeline', 'article', 'video', 'audio', 'book', 'other'],
            default: 'other'
        },
        url: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true,
            maxlength: [300, 'Resource description cannot exceed 300 characters']
        },
        author: {
            type: String,
            trim: true,
            maxlength: [100, 'Author name cannot exceed 100 characters']
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    questions: [{
        question: {
            type: String,
            trim: true,
            maxlength: [300, 'Question cannot exceed 300 characters']
        },
        answer: {
            type: String,
            trim: true,
            maxlength: [1000, 'Answer cannot exceed 1000 characters']
        },
        type: {
            type: String,
            enum: ['theological', 'practical', 'historical', 'personal', 'other'],
            default: 'theological'
        },
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'intermediate'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    applications: [{
        title: {
            type: String,
            trim: true,
            maxlength: [200, 'Application title cannot exceed 200 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Application description cannot exceed 500 characters']
        },
        category: {
            type: String,
            enum: ['personal', 'family', 'work', 'church', 'community', 'other'],
            default: 'personal'
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium'
        },
        timeRequired: {
            type: String,
            enum: ['minutes', 'hours', 'days', 'weeks', 'ongoing'],
            default: 'ongoing'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    prayerPoints: [{
        content: {
            type: String,
            trim: true,
            maxlength: [300, 'Prayer point cannot exceed 300 characters']
        },
        type: {
            type: String,
            enum: ['thanksgiving', 'confession', 'petition', 'intercession', 'praise', 'other'],
            default: 'petition'
        },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'as_needed'],
            default: 'as_needed'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    insights: [{
        content: {
            type: String,
            trim: true,
            maxlength: [500, 'Insight cannot exceed 500 characters']
        },
        source: {
            type: String,
            enum: ['personal', 'study', 'sermon', 'book', 'conversation', 'other'],
            default: 'personal'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    language: {
        type: String,
        enum: ['en', 'am', 'or'],
        default: 'en'
    },
    importance: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
    },
    estimatedStudyTime: {
        type: Number, // in minutes
        min: [0, 'Estimated study time cannot be negative'],
        default: 0
    },
    completionStatus: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'reviewing'],
        default: 'not_started'
    },
    progress: {
        type: Number,
        min: [0, 'Progress cannot be negative'],
        max: [100, 'Progress cannot exceed 100'],
        default: 0
    },
    lastStudied: {
        type: Date,
        default: null
    },
    nextReview: {
        type: Date,
        default: null
    },
    reminder: {
        enabled: {
            type: Boolean,
            default: false
        },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'custom'],
            default: 'weekly'
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
        studyTime: {
            type: Number, // in minutes
            default: 0,
            min: [0, 'Study time cannot be negative']
        },
        shareCount: {
            type: Number,
            default: 0,
            min: [0, 'Share count cannot be negative']
        }
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

// Virtual for full topic path
topicSchema.virtual('topicPath').get(function () {
    // This would need to be populated with parent topics
    return this.name;
});

// Virtual for verse count
topicSchema.virtual('verseCount').get(function () {
    return this.verses.length;
});

// Virtual for note count
topicSchema.virtual('noteCount').get(function () {
    return this.notes.length;
});

// Virtual for question count
topicSchema.virtual('questionCount').get(function () {
    return this.questions.length;
});

// Compound indexes for efficient queries
topicSchema.index({ userId: 1, name: 1 });
topicSchema.index({ userId: 1, category: 1 });
topicSchema.index({ userId: 1, createdAt: -1 });
topicSchema.index({ userId: 1, isPublic: 1 });
topicSchema.index({ tags: 1 });
topicSchema.index({ userId: 1, isArchived: 1 });
topicSchema.index({ parentTopic: 1 });

// Pre-save middleware to validate and set archived date
topicSchema.pre('save', function (next) {
    if (this.isArchived && !this.archivedAt) {
        this.archivedAt = new Date();
    }
    next();
});

// Static method to get user's topics
topicSchema.statics.getUserTopics = function (userId, options = {}) {
    const query = { userId, isArchived: false };

    if (options.category) query.category = options.category;
    if (options.parentTopic) query.parentTopic = options.parentTopic;
    if (options.tags && options.tags.length > 0) {
        query.tags = { $in: options.tags };
    }
    if (options.isPublic !== undefined) query.isPublic = options.isPublic;
    if (options.completionStatus) query.completionStatus = options.completionStatus;

    return this.find(query)
        .populate('parentTopic', 'name')
        .populate('childTopics', 'name')
        .sort({ createdAt: -1 })
        .limit(options.limit || 50);
};

// Static method to get shared topics
topicSchema.statics.getSharedTopics = function (userId) {
    return this.find({
        $or: [
            { 'sharedWith.userId': userId },
            { isPublic: true }
        ],
        isArchived: false
    }).populate('userId', 'firstName lastName profilePicture');
};

// Static method to search topics
topicSchema.statics.searchTopics = function (userId, searchTerm) {
    return this.find({
        userId,
        isArchived: false,
        $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
    }).sort({ createdAt: -1 });
};

// Static method to get topic hierarchy
topicSchema.statics.getTopicHierarchy = function (userId) {
    return this.find({
        userId,
        isArchived: false
    }).populate('parentTopic', 'name')
        .populate('childTopics', 'name')
        .sort({ name: 1 });
};

// Instance method to increment view count
topicSchema.methods.incrementViewCount = function () {
    this.analytics.viewCount += 1;
    this.analytics.lastViewed = new Date();
    return this.save();
};

// Instance method to share with user
topicSchema.methods.shareWithUser = function (targetUserId, permission = 'view') {
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

// Instance method to add verse
topicSchema.methods.addVerse = function (book, chapter, verse, relevance = 'primary') {
    this.verses.push({
        book,
        chapter,
        verse,
        relevance,
        addedAt: new Date()
    });
    return this.save();
};

// Instance method to add note
topicSchema.methods.addNote = function (content, type = 'explanation') {
    this.notes.push({
        content,
        type,
        createdAt: new Date()
    });
    return this.save();
};

// Instance method to add question
topicSchema.methods.addQuestion = function (question, answer = null, type = 'theological', difficulty = 'intermediate') {
    this.questions.push({
        question,
        answer,
        type,
        difficulty,
        createdAt: new Date()
    });
    return this.save();
};

// Instance method to add application
topicSchema.methods.addApplication = function (title, description, category = 'personal', difficulty = 'medium', timeRequired = 'ongoing') {
    this.applications.push({
        title,
        description,
        category,
        difficulty,
        timeRequired,
        createdAt: new Date()
    });
    return this.save();
};

// Instance method to add prayer point
topicSchema.methods.addPrayerPoint = function (content, type = 'petition', frequency = 'as_needed') {
    this.prayerPoints.push({
        content,
        type,
        frequency,
        createdAt: new Date()
    });
    return this.save();
};

// Instance method to add insight
topicSchema.methods.addInsight = function (content, source = 'personal') {
    this.insights.push({
        content,
        source,
        createdAt: new Date()
    });
    return this.save();
};

// Instance method to update progress
topicSchema.methods.updateProgress = function (newProgress) {
    if (newProgress >= 0 && newProgress <= 100) {
        this.progress = newProgress;
        this.lastStudied = new Date();

        if (newProgress === 100) {
            this.completionStatus = 'completed';
        } else if (newProgress > 0) {
            this.completionStatus = 'in_progress';
        }

        return this.save();
    }
    throw new Error('Progress must be between 0 and 100');
};

// Instance method to archive topic
topicSchema.methods.archive = function () {
    this.isArchived = true;
    this.archivedAt = new Date();
    return this.save();
};

// Instance method to restore topic
topicSchema.methods.restore = function () {
    this.isArchived = false;
    this.archivedAt = null;
    return this.save();
};

module.exports = mongoose.model('Topic', topicSchema);
