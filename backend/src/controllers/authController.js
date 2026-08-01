import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { logAction } from '../utils/auditLogger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'medconnect_super_secret_key_123';

// ─── Patient Registration ─────────────────────────────────────────────────────
export const register = async (req, res) => {
  const { 
    email, password, firstName, lastName, phone, 
    dateOfBirth, gender, bloodGroup, allergies, 
    emergencyContactName, emergencyContactPhone 
  } = req.body;

  if (!email || !password || !firstName || !lastName || !dateOfBirth || !gender) {
    return res.status(400).json({ error: 'Missing required registration fields' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'PATIENT',
          firstName,
          lastName,
          phone,
          patient: {
            create: {
              dateOfBirth,
              gender,
              bloodGroup,
              allergies,
              emergencyContactName,
              emergencyContactPhone
            }
          }
        },
        include: { patient: true }
      });
      return user;
    });

    await logAction(newUser.id, 'Patient account registered', req.ip);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        patientId: newUser.patient.id
      }
    });
  } catch (error) {
    console.error('Patient registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};

// ─── Doctor Registration (Requires Hospital Admin Approval) ───────────────────
export const registerDoctor = async (req, res) => {
  const {
    email, password, firstName, lastName, phone,
    specialization, qualification, experienceYears, consultationFee
  } = req.body;

  if (!email || !password || !firstName || !lastName || !specialization || !qualification) {
    return res.status(400).json({ error: 'Missing required doctor registration fields' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Apollo is the only hospital — auto-assign
    const hospital = await prisma.hospital.findFirst();
    if (!hospital) {
      return res.status(500).json({ error: 'No hospital configured in the system' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'DOCTOR',
          firstName,
          lastName,
          phone,
          doctor: {
            create: {
              hospitalId: hospital.id,
              specialization,
              qualification,
              experienceYears: parseInt(experienceYears) || 0,
              consultationFee: parseFloat(consultationFee) || 0,
              availabilitySchedule: JSON.stringify(['09:00', '10:00', '11:00', '14:00', '15:00']),
              approvalStatus: 'PENDING', // Requires Hospital Admin approval
            }
          }
        },
        include: { doctor: true }
      });
      return user;
    });

    await logAction(newUser.id, `Doctor registration submitted – awaiting approval (${specialization})`, req.ip);

    // Notify all Hospital Admins about the new pending doctor
    const admins = await prisma.user.findMany({ where: { role: { in: ['HOSPITAL_ADMIN', 'SUPER_ADMIN'] } } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          message: `New doctor registration pending approval: Dr. ${firstName} ${lastName} (${specialization})`,
          type: 'SYSTEM'
        }
      });
    }

    res.status(201).json({
      message: 'Doctor registration submitted successfully. Your account is pending approval by the Hospital Administrator. You will be able to log in once approved.',
      pending: true
    });
  } catch (error) {
    console.error('Doctor registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};

// ─── Login (All Roles) ────────────────────────────────────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        patient: true,
        doctor: true
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // ── Block doctors who are not yet approved ────────────────────────────────
    if (user.role === 'DOCTOR' && user.doctor) {
      if (user.doctor.approvalStatus === 'PENDING') {
        return res.status(403).json({
          error: 'Your account is pending approval by the Hospital Administrator. Please wait for approval before logging in.',
          approvalStatus: 'PENDING'
        });
      }
      if (user.doctor.approvalStatus === 'REJECTED') {
        return res.status(403).json({
          error: 'Your doctor registration has been rejected. Please contact the hospital administration for more information.',
          approvalStatus: 'REJECTED'
        });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logAction(user.id, 'User logged in', req.ip);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        patientId: user.patient?.id || null,
        doctorId: user.doctor?.id || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

// ─── Get Profile ──────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        patient: true,
        doctor: {
          include: { hospital: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error fetching profile' });
  }
};
