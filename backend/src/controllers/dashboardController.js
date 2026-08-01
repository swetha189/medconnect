import prisma from '../utils/prisma.js';

export const getAdminMetrics = async (req, res) => {
  try {
    const patientsCount = await prisma.patient.count();
    const approvedDoctorsCount = await prisma.doctor.count({ where: { approvalStatus: 'APPROVED' } });
    const pendingDoctorsCount = await prisma.doctor.count({ where: { approvalStatus: 'PENDING' } });
    const appointmentsCount = await prisma.appointment.count();
    const referralsCount = await prisma.referral.count();

    // Apollo hospital bed summary
    const hospitals = await prisma.hospital.findMany();
    const bedSummary = hospitals.reduce((acc, h) => {
      acc.totalBeds += h.totalBeds;
      acc.availableBeds += h.availableBeds;
      acc.totalIcuBeds += h.icuBeds;
      acc.availableIcuBeds += h.availableIcuBeds;
      acc.totalEmergencyBeds += h.emergencyBeds;
      acc.availableEmergencyBeds += h.availableEmergencyBeds;
      acc.totalNicuBeds += h.nicuBeds;
      acc.availableNicuBeds += h.availableNicuBeds;
      return acc;
    }, {
      totalBeds: 0,
      availableBeds: 0,
      totalIcuBeds: 0,
      availableIcuBeds: 0,
      totalEmergencyBeds: 0,
      availableEmergencyBeds: 0,
      totalNicuBeds: 0,
      availableNicuBeds: 0
    });

    // Recent activity log
    const recentLogs = await prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, role: true } }
      }
    });

    res.json({
      patientsCount,
      doctorsCount: approvedDoctorsCount,
      pendingDoctorsCount,
      appointmentsCount,
      referralsCount,
      bedSummary,
      recentLogs
    });
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
