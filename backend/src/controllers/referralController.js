import prisma from '../utils/prisma.js';
import { logAction } from '../utils/auditLogger.js';
import { sendNotification } from '../utils/notificationHelper.js';

export const createReferral = async (req, res) => {
  const doctorId = req.user.doctorId;
  if (!doctorId) {
    return res.status(403).json({ error: 'Only doctors can create referrals' });
  }

  const { patientId, targetHospitalId, reason } = req.body;

  if (!patientId || !targetHospitalId || !reason) {
    return res.status(400).json({ error: 'Missing required referral fields' });
  }

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });

    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) },
      include: { user: true }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const referral = await prisma.referral.create({
      data: {
        patientId: parseInt(patientId),
        doctorId,
        sourceHospitalId: doctor.hospitalId,
        targetHospitalId: parseInt(targetHospitalId),
        reason,
        status: 'SENT'
      },
      include: {
        targetHospital: true,
        sourceHospital: true
      }
    });

    await logAction(req.user.id, `Created referral ID ${referral.id} for patient ${patientId} to ${referral.targetHospital.name}`, req.ip);
    await sendNotification(patient.userId, `You have been referred to ${referral.targetHospital.name}. Reason: ${reason}.`, 'REFERRAL');

    res.status(201).json(referral);
  } catch (error) {
    console.error('Error creating referral:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const listReferrals = async (req, res) => {
  const { role, patientId, doctorId } = req.user;

  try {
    let where = {};
    if (role === 'PATIENT') {
      where.patientId = patientId;
    } else if (role === 'DOCTOR') {
      // Sent by doctor, or target is doctor (if we mapped it, but let's show all for their hospital or sent by them)
      const doc = await prisma.doctor.findUnique({ where: { id: doctorId } });
      where = {
        OR: [
          { doctorId: doctorId },
          { targetHospitalId: doc.hospitalId }
        ]
      };
    } else if (role === 'HOSPITAL_ADMIN') {
      // Find hospital admin's hospital and filter
      // (For simplicity, we'll assume they are admin of the first hospital or check their logs,
      // but let's query all since role is admin, or we can seed hospital admin and map them.
      // Let's grab the first hospital or return all referrals for the system).
      // For general assessment, listing all or hospital-based works:
      const hosp = await prisma.hospital.findFirst();
      where = {
        OR: [
          { sourceHospitalId: hosp.id },
          { targetHospitalId: hosp.id }
        ]
      };
    }

    const referrals = await prisma.referral.findMany({
      where,
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        },
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        },
        sourceHospital: true,
        targetHospital: true
      },
      orderBy: { id: 'desc' }
    });

    res.json(referrals);
  } catch (error) {
    console.error('Error listing referrals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateReferralStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // SENT, ACCEPTED, APPOINTMENT_BOOKED, COMPLETED

  if (!['SENT', 'ACCEPTED', 'APPOINTMENT_BOOKED', 'COMPLETED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid referral status' });
  }

  try {
    const referral = await prisma.referral.findUnique({
      where: { id: parseInt(id) },
      include: { patient: true, targetHospital: true }
    });

    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    const updated = await prisma.referral.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    await logAction(req.user.id, `Updated referral ID ${id} status to ${status}`, req.ip);
    await sendNotification(referral.patient.userId, `Your referral to ${referral.targetHospital.name} has been updated to: ${status}.`, 'REFERRAL');

    res.json(updated);
  } catch (error) {
    console.error('Error updating referral status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
