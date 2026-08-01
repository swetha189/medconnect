import express from 'express';
import { getAdminMetrics } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/metrics', requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), getAdminMetrics);

export default router;
