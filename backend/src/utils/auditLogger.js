import prisma from './prisma.js';

export const logAction = async (userId, action, ipAddress = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        ipAddress
      }
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};
