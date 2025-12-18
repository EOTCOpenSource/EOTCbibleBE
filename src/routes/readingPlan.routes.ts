import express from 'express';
import { protect } from '../middleware/auth.middleware';
import {
    createPlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan,
    markDayComplete,
    getPlanProgress
} from '../controllers/readingPlan.controller';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

router.route('/')
    .post(createPlan)
    .get(getPlans);

router.route('/:id')
    .get(getPlanById)
    .put(updatePlan)
    .delete(deletePlan);

router.route('/:id/days/:dayNumber/complete')
    .patch(markDayComplete);

router.route('/:id/progress')
    .get(getPlanProgress);

export default router;
