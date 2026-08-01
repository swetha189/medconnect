import prisma from '../utils/prisma.js';
import { logAction } from '../utils/auditLogger.js';

// ─── List All Approved Doctors ────────────────────────────────────────────────
export const getAllDoctors = async (req, res) => {
  const { specialization } = req.query;
  const where = { approvalStatus: 'APPROVED' }; // Only show approved doctors
  if (specialization) where.specialization = specialization;

  try {
    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        hospital: true,
        user: {
          select: { firstName: true, lastName: true, email: true, phone: true }
        }
      }
    });
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Get Single Doctor ────────────────────────────────────────────────────────
export const getDoctorById = async (req, res) => {
  const { id } = req.params;
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(id) },
      include: {
        hospital: true,
        user: {
          select: { firstName: true, lastName: true, email: true, phone: true }
        }
      }
    });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Update Doctor Availability / Leave ──────────────────────────────────────
export const updateAvailability = async (req, res) => {
  const doctorId = req.user.doctorId;
  if (!doctorId) {
    return res.status(403).json({ error: 'Only doctors can update their availability' });
  }

  const { availabilitySchedule, isLeave } = req.body;

  try {
    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        availabilitySchedule: availabilitySchedule ? JSON.stringify(availabilitySchedule) : undefined,
        isLeave: isLeave !== undefined ? isLeave : undefined
      }
    });

    await logAction(req.user.id, `Updated availability schedule or leave status`, req.ip);

    res.json({
      ...updatedDoctor,
      availabilitySchedule: JSON.parse(updatedDoctor.availabilitySchedule)
    });
  } catch (error) {
    console.error('Error updating doctor availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── List Pending Doctors (Hospital Admin / Super Admin only) ─────────────────
export const getPendingDoctors = async (req, res) => {
  try {
    const pendingDoctors = await prisma.doctor.findMany({
      where: { approvalStatus: 'PENDING' },
      include: {
        hospital: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true }
        }
      },
      orderBy: { id: 'desc' }
    });
    res.json(pendingDoctors);
  } catch (error) {
    console.error('Error fetching pending doctors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Approve a Doctor ─────────────────────────────────────────────────────────
export const approveDoctor = async (req, res) => {
  const { id } = req.params;

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(id) },
      include: { user: true }
    });

    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    const updated = await prisma.doctor.update({
      where: { id: parseInt(id) },
      data: { approvalStatus: 'APPROVED' }
    });

    // Notify the doctor
    await prisma.notification.create({
      data: {
        userId: doctor.userId,
        message: `Congratulations! Your doctor registration for ${doctor.specialization} has been approved. You can now log in to Apollo Hospitals MedConnect.`,
        type: 'SYSTEM'
      }
    });

    await logAction(req.user.id, `Approved doctor ID ${id}: Dr. ${doctor.user.firstName} ${doctor.user.lastName} (${doctor.specialization})`, req.ip);

    res.json({ message: 'Doctor approved successfully', doctor: updated });
  } catch (error) {
    console.error('Error approving doctor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Reject a Doctor ──────────────────────────────────────────────────────────
export const rejectDoctor = async (req, res) => {
  const { id } = req.params;

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(id) },
      include: { user: true }
    });

    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    const updated = await prisma.doctor.update({
      where: { id: parseInt(id) },
      data: { approvalStatus: 'REJECTED' }
    });

    // Notify the doctor
    await prisma.notification.create({
      data: {
        userId: doctor.userId,
        message: `Your doctor registration for ${doctor.specialization} has been reviewed. Unfortunately, it was not approved at this time. Please contact the hospital administration for more details.`,
        type: 'SYSTEM'
      }
    });

    await logAction(req.user.id, `Rejected doctor ID ${id}: Dr. ${doctor.user.firstName} ${doctor.user.lastName} (${doctor.specialization})`, req.ip);

    res.json({ message: 'Doctor registration rejected', doctor: updated });
  } catch (error) {
    console.error('Error rejecting doctor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
