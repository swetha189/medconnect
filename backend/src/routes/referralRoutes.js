import express from 'express';
import { createReferral, listReferrals, updateReferralStatus } from '../controllers/referralController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', listReferrals);
router.post('/', createReferral);
router.patch('/:id/status', updateReferralStatus);

export default router;
