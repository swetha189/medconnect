import prisma from '../utils/prisma.js';
import { logAction } from '../utils/auditLogger.js';
import { sendNotification } from '../utils/notificationHelper.js';

export const createMedicalRecord = async (req, res) => {
  const doctorId = req.user.doctorId;
  if (!doctorId) {
    return res.status(403).json({ error: 'Only doctors can add medical records' });
  }

  const { patientId, diagnosis, treatmentPlan, followUpNotes, prescriptionItems } = req.body;

  if (!patientId || !diagnosis || !treatmentPlan) {
    return res.status(400).json({ error: 'Patient ID, diagnosis, and treatment plan are required' });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) },
      include: { user: true }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Create record and prescription in a transaction
    const record = await prisma.$transaction(async (tx) => {
      const newRecord = await tx.medicalRecord.create({
        data: {
          patientId: parseInt(patientId),
          doctorId,
          visitDate: new Date().toISOString().split('T')[0],
          diagnosis,
          treatmentPlan,
          followUpNotes
        }
      });

      if (prescriptionItems && prescriptionItems.length > 0) {
        await tx.prescription.create({
          data: {
            medicalRecordId: newRecord.id,
            patientId: parseInt(patientId),
            doctorId,
            items: {
              create: prescriptionItems.map(item => ({
                medicineName: item.medicineName,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration
              }))
            }
          }
        });
      }

      return newRecord;
    });

    await logAction(req.user.id, `Created medical record ID ${record.id} for patient ${patientId}`, req.ip);
    await sendNotification(patient.userId, `A new medical record has been added to your profile by Dr. ${req.user.firstName} ${req.user.lastName}.`, 'RECORD');

    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating medical record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPatientRecords = async (req, res) => {
  const { patientId } = req.params;
  const user = req.user;

  try {
    const targetPatientId = parseInt(patientId);

    // Access Control check
    let hasAccess = false;

    if (user.role === 'PATIENT' && user.patientId === targetPatientId) {
      hasAccess = true;
    } else if (user.role === 'DOCTOR') {
      // 1. Doctor created the record (we'll fetch records, but let's check general access first)
      // 2. Doctor has active consent from this patient
      const patient = await prisma.patient.findUnique({
        where: { id: targetPatientId }
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Check active consent
      const nowStr = new Date().toISOString();
      const activeConsent = await prisma.consentGrant.findFirst({
        where: {
          patientId: targetPatientId,
          targetUserId: user.id,
          expiresAt: { gte: nowStr },
          revokedAt: null
        }
      });

      // Check if this doctor has previously treated them (has created a record or has an appointment)
      const previousTreatment = await prisma.appointment.findFirst({
        where: {
          patientId: targetPatientId,
          doctorId: user.doctorId,
          status: 'COMPLETED'
        }
      });

      if (activeConsent || previousTreatment) {
        hasAccess = true;
      }
    } else if (user.role === 'SUPER_ADMIN') {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied: You do not have consent to view this patient\'s records.' });
    }

    // Fetch records
    const records = await prisma.medicalRecord.findMany({
      where: { patientId: targetPatientId },
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        },
        prescriptions: {
          include: {
            items: true
          }
        }
      },
      orderBy: { visitDate: 'desc' }
    });

    res.json(records);
  } catch (error) {
    console.error('Error fetching patient records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const listAllPrescriptions = async (req, res) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } }
          }
        },
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(prescriptions);
  } catch (error) {
    console.error('Error listing prescriptions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePrescriptionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // PENDING, DISPATCHED, COMPLETED

  if (!['PENDING', 'DISPATCHED', 'COMPLETED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid prescription status' });
  }

  try {
    const updated = await prisma.prescription.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        patient: true
      }
    });

    await logAction(req.user.id, `Updated prescription ID ${id} status to ${status}`, req.ip);
    await sendNotification(updated.patient.userId, `Your prescription status has been updated to: ${status}.`, 'RECORD');

    res.json(updated);
  } catch (error) {
    console.error('Error updating prescription status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
