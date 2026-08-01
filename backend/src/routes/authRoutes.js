import express from 'express';
import { register, registerDoctor, login, getProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);             // Patient self-registration
router.post('/register/doctor', registerDoctor); // Doctor registration (requires admin approval)
router.post('/login', login);                   // All roles login
router.get('/profile', authenticateToken, getProfile);

export default router;
