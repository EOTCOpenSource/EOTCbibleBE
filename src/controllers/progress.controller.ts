import { Request, Response } from 'express';
import { Progress, User } from '../models';

// Log reading progress and update streak
export const logReading = async (req: Request, res: Response): Promise<void> => {
    try {
        const { bookId, chapter } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        // Validate required fields
        if (!bookId || chapter === undefined || chapter === null) {
            res.status(400).json({
                success: false,
                message: 'bookId and chapter are required'
            });
            return;
        }

        // Validate chapter is a positive number
        if (typeof chapter !== 'number' || chapter < 1) {
            res.status(400).json({
                success: false,
                message: 'chapter must be a positive number'
            });
            return;
        }

        // Find or create progress document
        let progress = await Progress.findOne({ userId });
        if (!progress) {
            progress = new Progress({ userId, chaptersRead: new Map() });
        }

        // Add chapter to chaptersRead
        const key = `${bookId}:${chapter}`;
        if (!progress.chaptersRead.has(key)) {
            progress.chaptersRead.set(key, []);
        }

        // Find user document for streak updates
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        // Get today's date (start of day for comparison)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get last reading date (start of day for comparison)
        const lastDate = user.streak.lastDate ? new Date(user.streak.lastDate) : null;
        const lastDateStart = lastDate ? new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()) : null;

        // Calculate yesterday (start of day)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Update streak logic
        if (!lastDateStart) {
            // First time reading - start streak at 1
            user.streak.current = 1;
            user.streak.longest = Math.max(user.streak.longest, 1);
        } else if (lastDateStart.getTime() === today.getTime()) {
            // Already read today - don't change streak
            // This prevents multiple reads on same day from affecting streak
        } else if (lastDateStart.getTime() === yesterday.getTime()) {
            // Read yesterday - increment streak
            user.streak.current += 1;
            user.streak.longest = Math.max(user.streak.longest, user.streak.current);
        } else if (lastDateStart.getTime() < yesterday.getTime()) {
            // Read before yesterday - reset streak to 1
            user.streak.current = 1;
            user.streak.longest = Math.max(user.streak.longest, 1);
        }

        // Update lastDate to today
        user.streak.lastDate = today;

        // Save both documents
        await Promise.all([
            progress.save(),
            user.save()
        ]);

        res.status(200).json({
            success: true,
            message: 'Reading progress logged successfully',
            data: {
                progress: {
                    userId: progress.userId,
                    chaptersRead: Object.fromEntries(progress.chaptersRead),
                    totalChaptersRead: progress.totalChaptersRead
                },
                streak: {
                    current: user.streak.current,
                    longest: user.streak.longest,
                    lastDate: user.streak.lastDate
                }
            }
        });

    } catch (error) {
        console.error('Error logging reading progress:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while logging reading progress'
        });
    }
};

// Get user's reading progress
export const getProgress = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        const progress = await Progress.findOne({ userId });
        const user = await User.findById(userId).select('streak');

        if (!progress) {
            res.status(200).json({
                success: true,
                message: 'No progress found',
                data: {
                    progress: {
                        userId,
                        chaptersRead: {},
                        totalChaptersRead: 0
                    },
                    streak: user?.streak || {
                        current: 0,
                        longest: 0,
                        lastDate: null
                    }
                }
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Progress retrieved successfully',
            data: {
                progress: {
                    userId: progress.userId,
                    chaptersRead: Object.fromEntries(progress.chaptersRead),
                    totalChaptersRead: progress.totalChaptersRead
                },
                streak: user?.streak || {
                    current: 0,
                    longest: 0,
                    lastDate: null
                }
            }
        });

    } catch (error) {
        console.error('Error retrieving progress:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving progress'
        });
    }
};

// Get progress for a specific book
export const getBookProgress = async (req: Request, res: Response): Promise<void> => {
    try {
        const { bookId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        if (!bookId || bookId.trim() === '') {
            res.status(400).json({
                success: false,
                message: 'bookId is required'
            });
            return;
        }

        const progress = await Progress.findOne({ userId });

        if (!progress) {
            res.status(200).json({
                success: true,
                message: 'No progress found for this book',
                data: {
                    bookId,
                    chaptersRead: {},
                    totalChaptersRead: 0
                }
            });
            return;
        }

        const bookChapters = progress.getChaptersForBook(bookId);
        const totalChaptersRead = Object.values(bookChapters).reduce((total, verses: number[]) => total + verses.length, 0);

        res.status(200).json({
            success: true,
            message: 'Book progress retrieved successfully',
            data: {
                bookId,
                chaptersRead: bookChapters,
                totalChaptersRead
            }
        });

    } catch (error) {
        console.error('Error retrieving book progress:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving book progress'
        });
    }
};
