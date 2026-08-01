import prisma from '../utils/prisma.js';
import { logAction } from '../utils/auditLogger.js';
import { sendNotification } from '../utils/notificationHelper.js';

export const uploadLabReport = async (req, res) => {
  const { patientId, testName, isCritical } = req.body;
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : req.body.fileUrl; // Fallback for testing if needed

  if (!patientId || !testName || !fileUrl) {
    return res.status(400).json({ error: 'Missing required report details or file' });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) },
      include: { user: true }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const report = await prisma.labReport.create({
      data: {
        patientId: parseInt(patientId),
        testName,
        fileUrl,
        uploadedBy: req.user.id,
        isCritical: isCritical === true || isCritical === 'true',
        status: 'COMPLETED',
        criticalAlertSent: isCritical === true || isCritical === 'true'
      }
    });

    await logAction(req.user.id, `Uploaded lab report ID ${report.id} for patient ${patientId}`, req.ip);

    // Notify patient
    const msg = `Your lab report for "${testName}" has been uploaded.`;
    await sendNotification(patient.userId, msg, 'RECORD');

    if (report.isCritical) {
      const alertMsg = `CRITICAL ALERT: Your lab report for "${testName}" shows a critical result. Please contact your doctor immediately.`;
      await sendNotification(patient.userId, alertMsg, 'SYSTEM');
      
      // Also notify their primary treating doctor (find their last completed appointment doctor)
      const lastApp = await prisma.appointment.findFirst({
        where: { patientId: patient.id, status: 'COMPLETED' },
        orderBy: { date: 'desc' }
      });
      if (lastApp) {
        const doc = await prisma.doctor.findUnique({ where: { id: lastApp.doctorId } });
        if (doc) {
          await sendNotification(doc.userId, `CRITICAL ALERT: Patient ${patient.user.firstName} ${patient.user.lastName} has a critical lab report for "${testName}".`, 'SYSTEM');
        }
      }
    }

    res.status(201).json(report);
  } catch (error) {
    console.error('Error uploading lab report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const listLabReports = async (req, res) => {
  const { role, patientId } = req.user;

  try {
    let where = {};
    if (role === 'PATIENT') {
      where.patientId = patientId;
    } else if (role === 'LAB_TECHNICIAN') {
      where = {}; // Lab techs see everything
    } else if (role === 'DOCTOR') {
      // Show reports where doctor has consent
      const nowStr = new Date().toISOString();
      const consents = await prisma.consentGrant.findMany({
        where: {
          targetUserId: req.user.id,
          expiresAt: { gte: nowStr },
          revokedAt: null
        },
        select: { patientId: true }
      });
      const consentedPatientIds = consents.map(c => c.patientId);
      
      // Also include patients who have had appointments with them
      const apps = await prisma.appointment.findMany({
        where: { doctorId: req.user.doctorId },
        select: { patientId: true }
      });
      const treatedPatientIds = apps.map(a => a.patientId);

      const allAllowedPatientIds = [...new Set([...consentedPatientIds, ...treatedPatientIds])];
      where.patientId = { in: allAllowedPatientIds };
    }

    const reports = await prisma.labReport.findMany({
      where,
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    console.error('Error listing lab reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const bookLabTest = async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) {
    return res.status(403).json({ error: 'Only patients can book lab tests' });
  }

  const { testName } = req.body;
  if (!testName) {
    return res.status(400).json({ error: 'Test name is required' });
  }

  try {
    // Generate a mock booking notification for technicians
    await sendNotification(req.user.id, `You have successfully booked the "${testName}" lab test. Please visit the lab to provide samples.`, 'SYSTEM');
    
    res.status(201).json({ message: 'Lab test booked successfully', testName });
  } catch (error) {
    console.error('Error booking lab test:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
