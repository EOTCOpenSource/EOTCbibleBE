import { Router } from 'express';
import {
    getNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
    getPublicNotes,
    getPublicNotesByVerse,
    getPublicNoteById
} from '../controllers/note.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Public note routes (no authentication required)
/**
 * @swagger
 * /api/v1/notes/public:
 *   get:
 *     summary: Get all public notes
 *     tags: [Notes]
 *     parameters:
 *       - in: query
 *         name: bookId
 *         schema:
 *           type: string
 *         description: Filter by book ID
 *       - in: query
 *         name: chapter
 *         schema:
 *           type: number
 *         description: Filter by chapter number
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [private, public]
 *         description: Filter by note visibility
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in note content
 *     responses:
 *       200:
 *         description: Public notes retrieved successfully
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
 *                   example: "Public notes retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     notes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Note'
 *                     count:
 *                       type: number
 *                       example: 5
 */
router.get('/public', getPublicNotes);

/**
 * @swagger
 * /api/v1/notes/public/verse:
 *   get:
 *     summary: Get public notes for a specific verse range
 *     tags: [Notes]
 *     parameters:
 *       - in: query
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *       - in: query
 *         name: chapter
 *         required: true
 *         schema:
 *           type: number
 *         description: Chapter number
 *       - in: query
 *         name: verseStart
 *         required: true
 *         schema:
 *           type: number
 *         description: Starting verse number
 *       - in: query
 *         name: verseEnd
 *         required: true
 *         schema:
 *           type: number
 *         description: Ending verse number
 *     responses:
 *       200:
 *         description: Public notes for verse range retrieved successfully
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
 *                   example: "Public notes for verse range retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     notes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Note'
 *                     count:
 *                       type: number
 *                       example: 3
 *       400:
 *         description: Bad request - missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/public/verse', getPublicNotesByVerse);

/**
 * @swagger
 * /api/v1/notes/public/{id}:
 *   get:
 *     summary: Get a specific public note by ID
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Public note retrieved successfully
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
 *                   example: "Public note retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     note:
 *                       $ref: '#/components/schemas/Note'
 *       404:
 *         description: Public note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/public/:id', getPublicNoteById);

// Private note routes (authentication required)
router.use(protect);

/**
 * @swagger
 * /api/v1/notes:
 *   get:
 *     summary: Get all notes for the authenticated user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notes retrieved successfully
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
 *                   example: "Notes retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     notes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Note'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getNotes);

/**
 * @swagger
 * /api/v1/notes/{id}:
 *   get:
 *     summary: Get a specific note by ID
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Note retrieved successfully
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
 *                   example: "Note retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     note:
 *                       $ref: '#/components/schemas/Note'
 *       404:
 *         description: Note not found
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
router.get('/:id', getNoteById);

/**
 * @swagger
 * /api/v1/notes:
 *   post:
 *     summary: Create a new note
 *     tags: [Notes]
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
 *               - content
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
 *               content:
 *                 type: string
 *                 description: Note content
 *                 example: "This verse speaks about the beginning of creation"
 *               visibility:
 *                 type: string
 *                 enum: [private, public]
 *                 description: Note visibility setting
 *                 example: "private"
 *                 default: "private"
 *     responses:
 *       201:
 *         description: Note created successfully
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
 *                   example: "Note created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     note:
 *                       $ref: '#/components/schemas/Note'
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
router.post('/', createNote);

/**
 * @swagger
 * /api/v1/notes/{id}:
 *   put:
 *     summary: Update a note by ID
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
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
 *               content:
 *                 type: string
 *                 description: Note content
 *                 example: "Updated note content"
 *               visibility:
 *                 type: string
 *                 enum: [private, public]
 *                 description: Note visibility setting
 *                 example: "public"
 *     responses:
 *       200:
 *         description: Note updated successfully
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
 *                   example: "Note updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     note:
 *                       $ref: '#/components/schemas/Note'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Note not found
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
router.put('/:id', updateNote);

/**
 * @swagger
 * /api/v1/notes/{id}:
 *   delete:
 *     summary: Delete a note by ID
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Note deleted successfully
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
 *                   example: "Note deleted successfully"
 *       404:
 *         description: Note not found
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
router.delete('/:id', deleteNote);

export default router;
