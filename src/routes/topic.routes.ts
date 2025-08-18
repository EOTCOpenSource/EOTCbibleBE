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

// Basic CRUD operations
// POST /api/v1/topics - Create a new topic
router.post('/', createTopic);

// GET /api/v1/topics - Get all topics for user (with search and sorting)
router.get('/', getTopics);

// GET /api/v1/topics/stats - Get topic statistics
router.get('/stats', getTopicStats);

// GET /api/v1/topics/verse - Get topics containing a specific verse
router.get('/verse', getTopicsByVerse);

// GET /api/v1/topics/:id - Get a specific topic
router.get('/:id', getTopic);

// PUT /api/v1/topics/:id - Update topic name (rename)
router.put('/:id', updateTopic);

// DELETE /api/v1/topics/:id - Delete a topic
router.delete('/:id', deleteTopic);

// Verse management operations
// POST /api/v1/topics/:id/verses - Add verses to a topic
router.post('/:id/verses', addVerses);

// DELETE /api/v1/topics/:id/verses - Remove verses from a topic
router.delete('/:id/verses', removeVerses);

export default router;
