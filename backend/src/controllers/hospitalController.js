import prisma from '../utils/prisma.js';
import { logAction } from '../utils/auditLogger.js';

export const getAllHospitals = async (req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      include: {
        departments: true
      }
    });
    res.json(hospitals);
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getHospitalById = async (req, res) => {
  const { id } = req.params;
  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: parseInt(id) },
      include: {
        departments: true,
        doctors: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    res.json(hospital);
  } catch (error) {
    console.error('Error fetching hospital:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateBeds = async (req, res) => {
  const { id } = req.params;
  const { 
    availableBeds, 
    availableIcuBeds, 
    availableEmergencyBeds, 
    availableNicuBeds 
  } = req.body;

  try {
    const updatedHospital = await prisma.hospital.update({
      where: { id: parseInt(id) },
      data: {
        availableBeds: availableBeds !== undefined ? parseInt(availableBeds) : undefined,
        availableIcuBeds: availableIcuBeds !== undefined ? parseInt(availableIcuBeds) : undefined,
        availableEmergencyBeds: availableEmergencyBeds !== undefined ? parseInt(availableEmergencyBeds) : undefined,
        availableNicuBeds: availableNicuBeds !== undefined ? parseInt(availableNicuBeds) : undefined,
      }
    });

    await logAction(req.user.id, `Updated bed capacity for hospital ID ${id}`, req.ip);

    res.json(updatedHospital);
  } catch (error) {
    console.error('Error updating beds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
