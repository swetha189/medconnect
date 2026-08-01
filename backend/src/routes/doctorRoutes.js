import express from 'express';
import {
  getAllDoctors,
  getDoctorById,
  updateAvailability,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor
} from '../controllers/doctorController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public
router.get('/', getAllDoctors);                       // Only returns APPROVED doctors
router.get('/:id', getDoctorById);

// Doctor self-manage
router.patch('/availability', authenticateToken, requireRoles('DOCTOR'), updateAvailability);

// Hospital Admin / Super Admin only
router.get('/admin/pending', authenticateToken, requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), getPendingDoctors);
router.patch('/admin/:id/approve', authenticateToken, requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), approveDoctor);
router.patch('/admin/:id/reject', authenticateToken, requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), rejectDoctor);

export default router;
