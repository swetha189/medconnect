import express from 'express';
import { createMedicalRecord, getPatientRecords, listAllPrescriptions, updatePrescriptionStatus } from '../controllers/ehrController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/records', requireRoles('DOCTOR'), createMedicalRecord);
router.get('/patient/:patientId', getPatientRecords);
router.get('/prescriptions', requireRoles('PHARMACIST', 'SUPER_ADMIN'), listAllPrescriptions);
router.patch('/prescriptions/:id/status', requireRoles('PHARMACIST'), updatePrescriptionStatus);

export default router;
