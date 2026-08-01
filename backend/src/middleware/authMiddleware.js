import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'medconnect_super_secret_key_123');
    
    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        patient: true,
        doctor: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Attach minimal user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      patientId: user.patient?.id || null,
      doctorId: user.doctor?.id || null
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
