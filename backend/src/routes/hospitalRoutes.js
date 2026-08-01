import express from 'express';
import { getAllHospitals, getHospitalById, updateBeds } from '../controllers/hospitalController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', getAllHospitals);
router.get('/:id', getHospitalById);
router.patch('/:id/beds', authenticateToken, requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), updateBeds);

export default router;
