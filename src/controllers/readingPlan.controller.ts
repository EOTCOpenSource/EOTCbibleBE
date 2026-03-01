import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ReadingPlan } from '../models';
import { distributeReadings } from '../utils/readingPlanAlgorithm';
import { validateRange } from '../utils/bibleData';
import { parsePaginationQuery, createPaginationResult, PaginationQuery } from '../utils/pagination';
import cache from '../utils/cache';


interface CreatePlanRequest {
    name: string;
    startBook: string;
    startChapter: number;
    endBook: string;
    endChapter?: number;
    startDate: string; // ISO date string
    durationInDays: number;
    isPublic?: boolean;
    sharedWith?: string[];
}

// Create a new reading plan
export const createPlan = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const {
            name,
            startBook,
            startChapter = 1,
            endBook,
            endChapter,
            startDate,
            durationInDays,
            isPublic = false,
            sharedWith = []
        }: CreatePlanRequest = req.body;

        // Validation
        if (!name || !startBook || !endBook || !startDate || !durationInDays) {
            res.status(400).json({ success: false, message: 'Missing required fields' });
            return;
        }

        // Validate range using bibleData
        const rangeValidation = validateRange(startBook, startChapter, endBook, endChapter);
        if (!rangeValidation.valid) {
            res.status(400).json({ success: false, message: rangeValidation.error });
            return;
        }

        // Generate readings distribution
        const distribution = distributeReadings(startBook, startChapter, endBook, endChapter, durationInDays);

        if (distribution.length === 0) {
            res.status(400).json({ success: false, message: 'Could not generate plan from given range' });
            return;
        }

        // Prepare daily readings with dates
        const startDateTime = new Date(startDate);
        const dailyReadings = distribution.map(d => ({
            dayNumber: d.dayNumber,
            date: new Date(startDateTime.getTime() + (d.dayNumber - 1) * 24 * 60 * 60 * 1000),
            readings: d.readings,
            isCompleted: false
        }));

        const newPlan = new ReadingPlan({
            userId: user._id,
            name: name.trim(),
            startBook,
            startChapter,
            endBook,
            endChapter,
            startDate: startDateTime,
            durationInDays,
            dailyReadings,
            isPublic,
            sharedWith: sharedWith.map(id => new mongoose.Types.ObjectId(id))
        });

        const savedPlan = await newPlan.save();

        // Invalidate list cache for this user
        await cache.deleteCacheByPattern(`plans:list:${user._id}:*`);
        // If public, we might want to invalidate ALL public plan lists, but pattern for multiple users is tricky. 
        // For now, simpler: clear owner and public pattern.
        await cache.deleteCacheByPattern('plans:list:*:*');

        res.status(201).json({
            success: true,
            message: 'Reading plan created successfully',
            data: { plan: savedPlan }
        });

    } catch (error) {
        console.error('Create plan error:', error);
        res.status(500).json({ success: false, message: 'Internal server error while creating plan' });
    }
};

// Get plans (User's plans + Public plans + Shared with user)
export const getPlans = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        // pagination params
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const paginationOptions = parsePaginationQuery(req.query as PaginationQuery, 10, 50);

        // Filter: Own plans OR Public plans OR Shared with user
        const filter = {
            $or: [
                { userId: user._id },
                { isPublic: true },
                { sharedWith: user._id }
            ]
        };

        const sortObj = { createdAt: -1 } as const;

        // Populate specific fields if needed, e.g. creator info for public plans?
        // For now standard pagination.

        // Get total count for pagination
        // Create cache key
        const cacheKey = `plans:list:${user._id}:${JSON.stringify(req.query)}:${paginationOptions.page}:${paginationOptions.limit}`;

        // Try to get from cache
        const cachedResult = await cache.getCache<any>(cacheKey);
        if (cachedResult) {
            res.status(200).json({
                success: true,
                message: 'Reading plans retrieved successfully (from cache)',
                data: cachedResult
            });
            return;
        }

        const totalItems = await ReadingPlan.countDocuments(filter);

        // Get paginated plans
        const plans = await ReadingPlan.find(filter)
            .sort(sortObj)
            .skip(paginationOptions.skip)
            .limit(paginationOptions.limit)
            .lean();

        const paginationResult = createPaginationResult(
            plans,
            totalItems,
            paginationOptions.page,
            paginationOptions.limit
        );

        // Cache for 15 minutes
        await cache.setCache(cacheKey, paginationResult, 900);

        res.status(200).json({
            success: true,
            message: 'Plans retrieved successfully',
            data: paginationResult
        });

    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getPlanById = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user as any;
        if (!user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const { id } = req.params;

        const cacheKey = `plans:single:${id}:${user._id}`;
        const cachedPlan = await cache.getCache<any>(cacheKey);

        if (cachedPlan) {
            res.status(200).json({
                success: true,
                message: 'Plan retrieved successfully (from cache)',
                data: { plan: cachedPlan }
            });
            return;
        }

        const plan = await ReadingPlan.findById(id).lean();

        if (!plan) {
            res.status(404).json({ success: false, message: 'Plan not found' });
            return;
        }

        // Access check
        const isOwner = plan.userId.toString() === user._id.toString();
        const isPublic = plan.isPublic;
        const isShared = plan.sharedWith && plan.sharedWith.some((uid: any) => uid.toString() === user._id.toString());

        if (!isOwner && !isPublic && !isShared) {
            res.status(403).json({ success: false, message: 'Access denied' });
            return;
        }

        // Cache for 30 minutes
        await cache.setCache(cacheKey, plan, 1800);

        res.status(200).json({
            success: true,
            message: 'Plan retrieved successfully',
            data: { plan }
        });

    } catch (error) {
        console.error('Get plan error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updatePlan = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const { id } = req.params;
        const updates = req.body;

        const plan = await ReadingPlan.findOne({ _id: id, userId: user._id });
        if (!plan) {
            res.status(404).json({ success: false, message: 'Plan not found or access denied' });
            return;
        }

        // Allow updating name, status, visibility
        if (updates.name) plan.name = updates.name;
        if (updates.status) plan.status = updates.status;
        if (updates.isPublic !== undefined) plan.isPublic = updates.isPublic;
        // Updating startDate or duration would require re-calculating everything, blocking for now unless requested.

        await plan.save();

        // Invalidate caches
        await cache.deleteCache(`plans:single:${id}:${user._id}`);
        await cache.deleteCacheByPattern(`plans:list:*:*`);

        res.status(200).json({
            success: true,
            message: 'Plan updated successfully',
            data: { plan }
        });

    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deletePlan = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const { id } = req.params;

        const deleted = await ReadingPlan.findOneAndDelete({ _id: id, userId: user._id });

        if (!deleted) {
            res.status(404).json({ success: false, message: 'Plan not found or access denied' });
            return;
        }

        // Invalidate caches
        await cache.deleteCache(`plans:single:${id}:${user._id}`);
        await cache.deleteCacheByPattern(`plans:list:*:*`);

        res.status(200).json({
            success: true,
            message: 'Plan deleted successfully',
            data: { plan: deleted }
        });

    } catch (error) {
        console.error('Delete plan error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const markDayComplete = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const { id, dayNumber } = req.params;
        if (!dayNumber) {
            res.status(400).json({ success: false, message: 'Day number required' });
            return;
        }
        const dayNum = parseInt(dayNumber);

        const plan = await ReadingPlan.findOne({ _id: id, userId: user._id });
        if (!plan) {
            res.status(404).json({ success: false, message: 'Plan not found' });
            return;
        }

        const day = plan.dailyReadings.find(d => d.dayNumber === dayNum);
        if (!day) {
            res.status(404).json({ success: false, message: 'Day not found in plan' });
            return;
        }

        day.isCompleted = true;
        day.completedAt = new Date();

        // Check if all days completed
        const allComplete = plan.dailyReadings.every(d => d.isCompleted);
        if (allComplete) {
            plan.status = 'completed';
        }

        await plan.save();

        // Invalidate caches
        await cache.deleteCache(`plans:single:${id}:${user._id}`);
        await cache.deleteCacheByPattern(`plans:list:*:*`);

        res.status(200).json({
            success: true,
            message: 'Day marked as complete',
            data: { plan }
        });

    } catch (error) {
        console.error('Mark day complete error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getPlanProgress = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user as any;
        if (!user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const { id } = req.params;
        const plan = await ReadingPlan.findById(id).lean();

        if (!plan) {
            res.status(404).json({ success: false, message: 'Plan not found' });
            return;
        }

        // Access check (any viewer can see progress? or just owner? Owner mostly.)
        if (plan.userId.toString() !== user._id.toString()) {
            res.status(403).json({ success: false, message: 'Access denied' });
            return;
        }

        const totalDays = plan.durationInDays;
        const completedDays = plan.dailyReadings.filter(d => d.isCompleted).length;
        const percentage = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

        // More detailed: chapters read
        let totalChapters = 0;
        let completedChapters = 0;

        plan.dailyReadings.forEach(d => {
            const dayChaps = d.readings.reduce((sum, r) => sum + (r.endChapter - r.startChapter + 1), 0);
            totalChapters += dayChaps;
            if (d.isCompleted) {
                completedChapters += dayChaps;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                totalDays,
                completedDays,
                percentDays: Math.round(percentage * 100) / 100,
                totalChapters,
                completedChapters,
                percentChapters: totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 10000) / 100 : 0,
                status: plan.status
            }
        });

    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
