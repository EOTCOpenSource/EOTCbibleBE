import { Router } from 'express';
import {
    getHighlights,
    getHighlightById,
    createHighlight,
    updateHighlight,
    deleteHighlight
} from '../controllers/highlight.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All highlight routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/highlights:
 *   get:
 *     summary: Get all highlights for the authenticated user
 *     tags: [Highlights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Highlights retrieved successfully
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
 *                   example: "Highlights retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     highlights:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Highlight'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getHighlights);

/**
 * @swagger
 * /api/v1/highlights/{id}:
 *   get:
 *     summary: Get a specific highlight by ID
 *     tags: [Highlights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Highlight ID
 *     responses:
 *       200:
 *         description: Highlight retrieved successfully
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
 *                   example: "Highlight retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     highlight:
 *                       $ref: '#/components/schemas/Highlight'
 *       404:
 *         description: Highlight not found
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
router.get('/:id', getHighlightById);

/**
 * @swagger
 * /api/v1/highlights:
 *   post:
 *     summary: Create a new highlight
 *     tags: [Highlights]
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
 *               - color
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
 *               color:
 *                 type: string
 *                 enum: [yellow, green, blue, pink, purple, orange]
 *                 description: Highlight color
 *                 example: "yellow"
 *     responses:
 *       201:
 *         description: Highlight created successfully
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
 *                   example: "Highlight created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     highlight:
 *                       $ref: '#/components/schemas/Highlight'
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
router.post('/', createHighlight);

/**
 * @swagger
 * /api/v1/highlights/{id}:
 *   put:
 *     summary: Update a highlight by ID
 *     tags: [Highlights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Highlight ID
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
 *               color:
 *                 type: string
 *                 enum: [yellow, green, blue, pink, purple, orange]
 *                 description: Highlight color
 *                 example: "green"
 *     responses:
 *       200:
 *         description: Highlight updated successfully
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
 *                   example: "Highlight updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     highlight:
 *                       $ref: '#/components/schemas/Highlight'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Highlight not found
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
router.put('/:id', updateHighlight);

/**
 * @swagger
 * /api/v1/highlights/{id}:
 *   delete:
 *     summary: Delete a highlight by ID
 *     tags: [Highlights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Highlight ID
 *     responses:
 *       200:
 *         description: Highlight deleted successfully
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
 *                   example: "Highlight deleted successfully"
 *       404:
 *         description: Highlight not found
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
router.delete('/:id', deleteHighlight);

export default router;

