import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadLabReport, listLabReports, bookLabTest } from '../controllers/labController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `test-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

const router = express.Router();

router.use(authenticateToken);

router.get('/reports', listLabReports);
router.post('/upload', requireRoles('LAB_TECHNICIAN'), upload.single('reportFile'), uploadLabReport);
router.post('/book', requireRoles('PATIENT'), bookLabTest);

export default router;
