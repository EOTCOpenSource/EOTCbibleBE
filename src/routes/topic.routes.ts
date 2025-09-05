import { Router } from 'express';
import {
    createTopic,
    getTopics,
    getTopic,
    updateTopic,
    deleteTopic,
    addVerses,
    removeVerses,
    getTopicsByVerse,
    getTopicStats
} from '../controllers/topic.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All topic routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/topics:
 *   post:
 *     summary: Create a new topic
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Topic name
 *                 example: "Faith and Trust"
 *               description:
 *                 type: string
 *                 description: Topic description (optional)
 *                 example: "Verses about having faith and trust in God"
 *               verses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     bookId:
 *                       type: string
 *                       description: Book identifier
 *                       example: "Genesis"
 *                     chapter:
 *                       type: number
 *                       description: Chapter number
 *                       example: 1
 *                     verseStart:
 *                       type: number
 *                       description: Starting verse number
 *                       example: 1
 *                     verseCount:
 *                       type: number
 *                       description: Number of verses
 *                       example: 3
 *     responses:
 *       201:
 *         description: Topic created successfully
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
 *                   example: "Topic created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     topic:
 *                       $ref: '#/components/schemas/Topic'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - topic name already exists
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
router.post('/', createTopic);

/**
 * @swagger
 * /api/v1/topics:
 *   get:
 *     summary: Get all topics for user (with search and sorting)
 *     tags: [Topics]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for topic names
 *         example: "faith"
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, createdAt, totalVerses]
 *         description: Sort field
 *         example: "name"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *         example: "asc"
 *     responses:
 *       200:
 *         description: Topics retrieved successfully
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
 *                   example: "Topics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Topic'
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
router.get('/', getTopics);

/**
 * @swagger
 * /api/v1/topics/stats:
 *   get:
 *     summary: Get topic statistics
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Topic statistics retrieved successfully
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
 *                   example: "Topic statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTopics:
 *                       type: number
 *                       description: Total number of topics
 *                       example: 10
 *                     totalVerses:
 *                       type: number
 *                       description: Total number of verses across all topics
 *                       example: 150
 *                     averageVersesPerTopic:
 *                       type: number
 *                       description: Average verses per topic
 *                       example: 15
 *                     mostUsedBooks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           bookId:
 *                             type: string
 *                             description: Book identifier
 *                           count:
 *                             type: number
 *                             description: Number of verses from this book
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', getTopicStats);

/**
 * @swagger
 * /api/v1/topics/verse:
 *   get:
 *     summary: Get topics containing a specific verse
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *         description: Book identifier
 *         example: "Genesis"
 *       - in: query
 *         name: chapter
 *         required: true
 *         schema:
 *           type: number
 *         description: Chapter number
 *         example: 1
 *       - in: query
 *         name: verseStart
 *         required: true
 *         schema:
 *           type: number
 *         description: Starting verse number
 *         example: 1
 *       - in: query
 *         name: verseEnd
 *         schema:
 *           type: number
 *         description: Ending verse number (optional)
 *         example: 3
 *     responses:
 *       200:
 *         description: Topics containing the verse retrieved successfully
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
 *                   example: "Topics containing verse retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     topics:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Topic'
 *       400:
 *         description: Bad request - missing required parameters
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
router.get('/verse', getTopicsByVerse);

/**
 * @swagger
 * /api/v1/topics/{id}:
 *   get:
 *     summary: Get a specific topic
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Topic ID
 *     responses:
 *       200:
 *         description: Topic retrieved successfully
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
 *                   example: "Topic retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     topic:
 *                       $ref: '#/components/schemas/Topic'
 *       404:
 *         description: Topic not found
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
router.get('/:id', getTopic);

/**
 * @swagger
 * /api/v1/topics/verse:
 *   get:
 *     summary: Get topics containing a specific verse
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *         description: Book identifier
 *         example: "Genesis"
 *       - in: query
 *         name: chapter
 *         required: true
 *         schema:
 *           type: number
 *         description: Chapter number
 *         example: 1
 *       - in: query
 *         name: verseStart
 *         required: true
 *         schema:
 *           type: number
 *         description: Starting verse number
 *         example: 1
 *       - in: query
 *         name: verseEnd
 *         schema:
 *           type: number
 *         description: Ending verse number (optional)
 *         example: 3
 *     responses:
 *       200:
 *         description: Topics containing the verse retrieved successfully
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
 *                   example: "Topics containing verse retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     topics:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Topic'
 *       400:
 *         description: Bad request - missing required parameters
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

/**
 * @swagger
 * /api/v1/topics/{id}:
 *   put:
 *     summary: Update topic name (rename)
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Topic ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: New topic name
 *                 example: "Faith and Trust in God"
 *               description:
 *                 type: string
 *                 description: New topic description (optional)
 *                 example: "Updated description about faith and trust"
 *     responses:
 *       200:
 *         description: Topic updated successfully
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
 *                   example: "Topic updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     topic:
 *                       $ref: '#/components/schemas/Topic'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Topic not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - topic name already exists
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
router.put('/:id', updateTopic);

/**
 * @swagger
 * /api/v1/topics/{id}:
 *   delete:
 *     summary: Delete a topic
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Topic ID
 *     responses:
 *       200:
 *         description: Topic deleted successfully
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
 *                   example: "Topic deleted successfully"
 *       404:
 *         description: Topic not found
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
router.delete('/:id', deleteTopic);

/**
 * @swagger
 * /api/v1/topics/{id}/verses:
 *   post:
 *     summary: Add verses to a topic
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Topic ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - verses
 *             properties:
 *               verses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - bookId
 *                     - chapter
 *                     - verseStart
 *                     - verseCount
 *                   properties:
 *                     bookId:
 *                       type: string
 *                       description: Book identifier
 *                       example: "Genesis"
 *                     chapter:
 *                       type: number
 *                       description: Chapter number
 *                       example: 1
 *                     verseStart:
 *                       type: number
 *                       description: Starting verse number
 *                       example: 1
 *                     verseCount:
 *                       type: number
 *                       description: Number of verses
 *                       example: 3
 *     responses:
 *       200:
 *         description: Verses added to topic successfully
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
 *                   example: "Verses added to topic successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     topic:
 *                       $ref: '#/components/schemas/Topic'
 *                     addedVerses:
 *                       type: array
 *                       description: Array of verses that were added
 *                       items:
 *                         type: object
 *                         properties:
 *                           bookId:
 *                             type: string
 *                           chapter:
 *                             type: number
 *                           verseStart:
 *                             type: number
 *                           verseCount:
 *                             type: number
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Topic not found
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
router.post('/:id/verses', addVerses);

/**
 * @swagger
 * /api/v1/topics/{id}/verses:
 *   delete:
 *     summary: Remove verses from a topic
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Topic ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - verses
 *             properties:
 *               verses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - bookId
 *                     - chapter
 *                     - verseStart
 *                     - verseCount
 *                   properties:
 *                     bookId:
 *                       type: string
 *                       description: Book identifier
 *                       example: "Genesis"
 *                     chapter:
 *                       type: number
 *                       description: Chapter number
 *                       example: 1
 *                     verseStart:
 *                       type: number
 *                       description: Starting verse number
 *                       example: 1
 *                     verseCount:
 *                       type: number
 *                       description: Number of verses
 *                       example: 3
 *     responses:
 *       200:
 *         description: Verses removed from topic successfully
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
 *                   example: "Verses removed from topic successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     topic:
 *                       $ref: '#/components/schemas/Topic'
 *                     removedVerses:
 *                       type: array
 *                       description: Array of verses that were removed
 *                       items:
 *                         type: object
 *                         properties:
 *                           bookId:
 *                             type: string
 *                           chapter:
 *                             type: number
 *                           verseStart:
 *                             type: number
 *                           verseCount:
 *                             type: number
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Topic not found
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
router.delete('/:id/verses', removeVerses);

export default router;
