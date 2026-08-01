import express from 'express';
import { bookAppointment, listAppointments, updateStatus, rescheduleAppointment } from '../controllers/appointmentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken); // All appointment routes require authentication

router.get('/', listAppointments);
router.post('/', bookAppointment);
router.patch('/:id/status', updateStatus);
router.patch('/:id/reschedule', rescheduleAppointment);

export default router;
