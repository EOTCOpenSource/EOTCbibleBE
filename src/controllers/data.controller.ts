import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User, Bookmark, Note, Highlight, Progress, Topic } from '../models';

// Delete all user data except the user document itself
export const deleteAllUserData = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        // Delete all data collections for this user
        const deletePromises = [
            Bookmark.deleteMany({ userId }),
            Note.deleteMany({ userId }),
            Highlight.deleteMany({ userId }),
            Progress.deleteMany({ userId }),
            Topic.deleteMany({ userId })
        ];

        const results = await Promise.all(deletePromises);

        // Calculate total deleted documents
        const totalDeleted = results.reduce((sum, result) => sum + result.deletedCount, 0);

        res.status(200).json({
            success: true,
            message: 'All user data deleted successfully',
            data: {
                deletedCount: totalDeleted,
                collections: {
                    bookmarks: results[0]?.deletedCount || 0,
                    notes: results[1]?.deletedCount || 0,
                    highlights: results[2]?.deletedCount || 0,
                    progress: results[3]?.deletedCount || 0,
                    topics: results[4]?.deletedCount || 0
                }
            }
        });

    } catch (error) {
        console.error('Error deleting all user data:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting user data'
        });
    }
};

// Delete specific data type for the user
export const deleteUserDataByType = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        if (!type) {
            res.status(400).json({
                success: false,
                message: 'Data type is required'
            });
            return;
        }

        let Model: any;
        let collectionName: string;

        // Map type to model and collection name
        switch (type.toLowerCase()) {
            case 'bookmarks':
                Model = Bookmark;
                collectionName = 'bookmarks';
                break;
            case 'notes':
                Model = Note;
                collectionName = 'notes';
                break;
            case 'highlights':
                Model = Highlight;
                collectionName = 'highlights';
                break;
            case 'progress':
                Model = Progress;
                collectionName = 'progress';
                break;
            case 'topics':
                Model = Topic;
                collectionName = 'topics';
                break;
            default:
                res.status(400).json({
                    success: false,
                    message: 'Invalid data type. Supported types: bookmarks, notes, highlights, progress, topics'
                });
                return;
        }

        // Delete all documents of the specified type for this user
        const result = await Model.deleteMany({ userId });

        res.status(200).json({
            success: true,
            message: `${collectionName} deleted successfully`,
            data: {
                type: collectionName,
                deletedCount: result.deletedCount
            }
        });

    } catch (error) {
        console.error('Error deleting user data by type:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting user data'
        });
    }
};
