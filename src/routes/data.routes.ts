import { Router } from 'express';
import {
    deleteAllUserData,
    deleteUserDataByType
} from '../controllers/data.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All data routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/data/all:
 *   delete:
 *     summary: Delete all user data except the user document itself
 *     tags: [Data Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All user data deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "All user data deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: number
 *                       description: Total number of documents deleted
 *                       example: 15
 *                     collections:
 *                       type: object
 *                       properties:
 *                         bookmarks:
 *                           type: number
 *                           description: Number of bookmarks deleted
 *                           example: 5
 *                         notes:
 *                           type: number
 *                           description: Number of notes deleted
 *                           example: 3
 *                         highlights:
 *                           type: number
 *                           description: Number of highlights deleted
 *                           example: 4
 *                         progress:
 *                           type: number
 *                           description: Number of progress records deleted
 *                           example: 1
 *                         topics:
 *                           type: number
 *                           description: Number of topics deleted
 *                           example: 2
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/all', deleteAllUserData);

/**
 * @swagger
 * /api/v1/data/{type}:
 *   delete:
 *     summary: Delete specific data type for the user
 *     tags: [Data Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [bookmarks, notes, highlights, progress, topics]
 *         description: Type of data to delete
 *         example: "bookmarks"
 *     responses:
 *       200:
 *         description: Data deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "bookmarks deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       description: Type of data that was deleted
 *                       example: "bookmarks"
 *                     deletedCount:
 *                       type: number
 *                       description: Number of documents deleted
 *                       example: 5
 *       400:
 *         description: Bad request - invalid data type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:type', deleteUserDataByType);

export default router;
