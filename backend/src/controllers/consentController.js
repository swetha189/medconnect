import prisma from '../utils/prisma.js';
import { logAction } from '../utils/auditLogger.js';
import { sendNotification } from '../utils/notificationHelper.js';

export const grantConsent = async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) {
    return res.status(403).json({ error: 'Only patients can grant record access consent' });
  }

  const { targetUserId, accessType, durationDays } = req.body;

  if (!targetUserId || !accessType || !durationDays) {
    return res.status(400).json({ error: 'Missing required consent parameters' });
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(targetUserId) }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays));

    const grant = await prisma.consentGrant.create({
      data: {
        patientId,
        targetUserId: parseInt(targetUserId),
        accessType,
        expiresAt: expiresAt.toISOString()
      },
      include: {
        targetUser: {
          select: { firstName: true, lastName: true, role: true }
        }
      }
    });

    await logAction(req.user.id, `Granted record access to user ID ${targetUserId} until ${expiresAt.toDateString()}`, req.ip);
    await sendNotification(targetUserId, `You have been granted access to view medical records for patient ${req.user.firstName} ${req.user.lastName} until ${expiresAt.toDateString()}.`, 'SYSTEM');

    res.status(201).json(grant);
  } catch (error) {
    console.error('Error granting consent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const revokeConsent = async (req, res) => {
  const { id } = req.params;
  const patientId = req.user.patientId;

  if (!patientId) {
    return res.status(403).json({ error: 'Only patients can revoke consent' });
  }

  try {
    const grant = await prisma.consentGrant.findUnique({
      where: { id: parseInt(id) }
    });

    if (!grant) {
      return res.status(404).json({ error: 'Consent grant not found' });
    }

    if (grant.patientId !== patientId) {
      return res.status(403).json({ error: 'You are not authorized to revoke this consent' });
    }

    const updated = await prisma.consentGrant.update({
      where: { id: parseInt(id) },
      data: {
        revokedAt: new Date().toISOString()
      }
    });

    await logAction(req.user.id, `Revoked record access grant ID ${id}`, req.ip);
    await sendNotification(grant.targetUserId, `Your access to view medical records for patient ID ${patientId} has been revoked.`, 'SYSTEM');

    res.json(updated);
  } catch (error) {
    console.error('Error revoking consent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const listGrants = async (req, res) => {
  const { role, patientId, id } = req.user;

  try {
    let grants;
    if (role === 'PATIENT') {
      // Patients view who they granted access to
      grants = await prisma.consentGrant.findMany({
        where: { patientId },
        include: {
          targetUser: {
            select: { firstName: true, lastName: true, role: true, email: true }
          }
        },
        orderBy: { expiresAt: 'desc' }
      });
    } else {
      // Doctors/others view what grants they received
      grants = await prisma.consentGrant.findMany({
        where: { targetUserId: id },
        include: {
          patient: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          }
        },
        orderBy: { expiresAt: 'desc' }
      });
    }

    res.json(grants);
  } catch (error) {
    console.error('Error listing consent grants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
