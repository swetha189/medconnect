import express from 'express';
import { getMyNotifications, markAsRead } from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getMyNotifications);
router.patch('/:id/read', markAsRead);

export default router;
