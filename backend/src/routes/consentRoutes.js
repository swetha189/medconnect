import express from 'express';
import { grantConsent, revokeConsent, listGrants } from '../controllers/consentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', listGrants);
router.post('/', grantConsent);
router.delete('/:id', revokeConsent);

export default router;
