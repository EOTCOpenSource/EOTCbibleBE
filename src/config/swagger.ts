import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'EOTC Bible API',
            version: '1.0.0',
            description: 'A comprehensive API for managing bookmarks, notes, highlights, progress tracking, topics, and user data management.',
            contact: {
                name: 'API Support',
                email: 'support@example.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            },
            {
                url: 'https://api.example.com',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT token for authentication'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'User ID'
                        },
                        name: {
                            type: 'string',
                            description: 'User name'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email'
                        },
                        streak: {
                            type: 'object',
                            properties: {
                                current: {
                                    type: 'number',
                                    description: 'Current reading streak'
                                },
                                longest: {
                                    type: 'number',
                                    description: 'Longest reading streak'
                                },
                                lastDate: {
                                    type: 'string',
                                    format: 'date',
                                    description: 'Last reading date'
                                }
                            }
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Bookmark: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Bookmark ID'
                        },
                        userId: {
                            type: 'string',
                            description: 'User ID'
                        },
                        bookId: {
                            type: 'string',
                            description: 'Book identifier'
                        },
                        chapter: {
                            type: 'number',
                            description: 'Chapter number'
                        },
                        verseStart: {
                            type: 'number',
                            description: 'Starting verse number'
                        },
                        verseCount: {
                            type: 'number',
                            description: 'Number of verses'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Note: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Note ID'
                        },
                        userId: {
                            type: 'string',
                            description: 'User ID'
                        },
                        bookId: {
                            type: 'string',
                            description: 'Book identifier'
                        },
                        chapter: {
                            type: 'number',
                            description: 'Chapter number'
                        },
                        verseStart: {
                            type: 'number',
                            description: 'Starting verse number'
                        },
                        verseCount: {
                            type: 'number',
                            description: 'Number of verses'
                        },
                        content: {
                            type: 'string',
                            description: 'Note content'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Highlight: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Highlight ID'
                        },
                        userId: {
                            type: 'string',
                            description: 'User ID'
                        },
                        bookId: {
                            type: 'string',
                            description: 'Book identifier'
                        },
                        chapter: {
                            type: 'number',
                            description: 'Chapter number'
                        },
                        verseStart: {
                            type: 'number',
                            description: 'Starting verse number'
                        },
                        verseCount: {
                            type: 'number',
                            description: 'Number of verses'
                        },
                        color: {
                            type: 'string',
                            enum: ['yellow', 'green', 'blue', 'pink', 'purple', 'orange'],
                            description: 'Highlight color'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Progress: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Progress ID'
                        },
                        userId: {
                            type: 'string',
                            description: 'User ID'
                        },
                        chaptersRead: {
                            type: 'object',
                            description: 'Map of book:chapter to verses read'
                        },
                        totalChaptersRead: {
                            type: 'number',
                            description: 'Total number of chapters read'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Topic: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Topic ID'
                        },
                        userId: {
                            type: 'string',
                            description: 'User ID'
                        },
                        name: {
                            type: 'string',
                            description: 'Topic name'
                        },
                        description: {
                            type: 'string',
                            description: 'Topic description'
                        },
                        verses: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    bookId: {
                                        type: 'string',
                                        description: 'Book identifier'
                                    },
                                    chapter: {
                                        type: 'number',
                                        description: 'Chapter number'
                                    },
                                    verseStart: {
                                        type: 'number',
                                        description: 'Starting verse number'
                                    },
                                    verseCount: {
                                        type: 'number',
                                        description: 'Number of verses'
                                    }
                                }
                            }
                        },
                        totalVerses: {
                            type: 'number',
                            description: 'Total number of verses in topic'
                        },
                        uniqueBooks: {
                            type: 'number',
                            description: 'Number of unique books in topic'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            description: 'Error message'
                        }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            description: 'Success message'
                        },
                        data: {
                            type: 'object',
                            description: 'Response data'
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: [
        './src/routes/*.ts',
        './src/controllers/*.ts',
        './src/index.ts'
    ]
};

export default options;
