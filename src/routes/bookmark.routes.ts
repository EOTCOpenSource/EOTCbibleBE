import { Router } from 'express';
import {
    getBookmarks,
    getBookmarkById,
    createBookmark,
    updateBookmark,
    deleteBookmark
} from '../controllers/bookmark.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All bookmark routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/bookmarks:
 *   get:
 *     summary: Get all bookmarks for the authenticated user
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: bookId
 *         schema:
 *           type: string
 *         description: Filter by book ID
 *       - in: query
 *         name: chapter
 *         schema:
 *           type: integer
 *         description: Filter by chapter number
 *     responses:
 *       200:
 *         description: Bookmarks retrieved successfully
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
 *                   example: "Bookmarks retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Bookmark'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         totalItems:
 *                           type: integer
 *                           example: 50
 *                         itemsPerPage:
 *                           type: integer
 *                           example: 10
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getBookmarks);

/**
 * @swagger
 * /api/v1/bookmarks/{id}:
 *   get:
 *     summary: Get a specific bookmark by ID
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bookmark ID
 *     responses:
 *       200:
 *         description: Bookmark retrieved successfully
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
 *                   example: "Bookmark retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookmark:
 *                       $ref: '#/components/schemas/Bookmark'
 *       404:
 *         description: Bookmark not found
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
 */
router.get('/:id', getBookmarkById);

/**
 * @swagger
 * /api/v1/bookmarks:
 *   post:
 *     summary: Create a new bookmark
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookId
 *               - chapter
 *               - verseStart
 *               - verseCount
 *             properties:
 *               bookId:
 *                 type: string
 *                 description: Book identifier
 *                 example: "Genesis"
 *               chapter:
 *                 type: number
 *                 description: Chapter number
 *                 example: 1
 *               verseStart:
 *                 type: number
 *                 description: Starting verse number
 *                 example: 1
 *               verseCount:
 *                 type: number
 *                 description: Number of verses
 *                 example: 3
 *     responses:
 *       201:
 *         description: Bookmark created successfully
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
 *                   example: "Bookmark created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookmark:
 *                       $ref: '#/components/schemas/Bookmark'
 *       400:
 *         description: Bad request - validation error
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
 */
router.post('/', createBookmark);

/**
 * @swagger
 * /api/v1/bookmarks/{id}:
 *   put:
 *     summary: Update a bookmark by ID
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bookmark ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookId:
 *                 type: string
 *                 description: Book identifier
 *                 example: "Genesis"
 *               chapter:
 *                 type: number
 *                 description: Chapter number
 *                 example: 1
 *               verseStart:
 *                 type: number
 *                 description: Starting verse number
 *                 example: 1
 *               verseCount:
 *                 type: number
 *                 description: Number of verses
 *                 example: 3
 *     responses:
 *       200:
 *         description: Bookmark updated successfully
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
 *                   example: "Bookmark updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookmark:
 *                       $ref: '#/components/schemas/Bookmark'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Bookmark not found
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
 */
router.put('/:id', updateBookmark);

/**
 * @swagger
 * /api/v1/bookmarks/{id}:
 *   delete:
 *     summary: Delete a bookmark by ID
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bookmark ID
 *     responses:
 *       200:
 *         description: Bookmark deleted successfully
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
 *                   example: "Bookmark deleted successfully"
 *       404:
 *         description: Bookmark not found
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
 */
router.delete('/:id', deleteBookmark);

export default router;
