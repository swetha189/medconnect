import prisma from './prisma.js';

export const sendNotification = async (userId, message, type = 'SYSTEM') => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        message,
        type
      }
    });
    // In a production system, this is where SMS or Email CDNs would be called.
    console.log(`[Notification Sim] User ${userId} [${type}]: ${message}`);
  } catch (error) {
    console.error('Notification failed to create:', error);
  }
};
