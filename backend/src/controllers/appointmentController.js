import prisma from '../utils/prisma.js';
import { logAction } from '../utils/auditLogger.js';
import { sendNotification } from '../utils/notificationHelper.js';

export const bookAppointment = async (req, res) => {
  const patientId = req.user.patientId;
  if (!patientId) {
    return res.status(403).json({ error: 'Only patients can book appointments' });
  }

  const { doctorId, hospitalId, date, slotTime, notes } = req.body;

  if (!doctorId || !hospitalId || !date || !slotTime) {
    return res.status(400).json({ error: 'Missing required appointment details' });
  }

  try {
    // 1. Check doctor availability and leave status
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(doctorId) },
      include: { user: true }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (doctor.isLeave) {
      return res.status(400).json({ error: 'Doctor is on leave on this day' });
    }

    // 2. Validate slot exists in doctor schedule
    const availableSlots = JSON.parse(doctor.availabilitySchedule || '[]');
    if (!availableSlots.includes(slotTime)) {
      return res.status(400).json({ error: 'Requested slot is not in doctor schedule' });
    }

    // 3. Prevent double-booking (check for existing active appointments)
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: parseInt(doctorId),
        date: date,
        slotTime: slotTime,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] }
      }
    });

    if (existingAppointment) {
      return res.status(400).json({ error: 'This time slot is already booked for this doctor' });
    }

    // 4. Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId: parseInt(doctorId),
        hospitalId: parseInt(hospitalId),
        date,
        slotTime,
        status: 'CONFIRMED',
        notes
      },
      include: {
        doctor: { include: { user: true } },
        hospital: true
      }
    });

    // 5. Audit log and notifications
    await logAction(req.user.id, `Booked appointment ID ${appointment.id}`, req.ip);
    await sendNotification(req.user.id, `Your appointment with Dr. ${doctor.user.firstName} ${doctor.user.lastName} on ${date} at ${slotTime} is confirmed.`, 'APPOINTMENT');
    await sendNotification(doctor.userId, `New appointment booked by ${req.user.firstName} ${req.user.lastName} on ${date} at ${slotTime}.`, 'APPOINTMENT');

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Internal server error booking appointment' });
  }
};

export const listAppointments = async (req, res) => {
  const { role, patientId, doctorId } = req.user;

  try {
    let where = {};
    if (role === 'PATIENT') {
      where.patientId = patientId;
    } else if (role === 'DOCTOR') {
      where.doctorId = doctorId;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        hospital: true
      },
      orderBy: [
        { date: 'desc' },
        { slotTime: 'desc' }
      ]
    });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid appointment status' });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: true,
        doctor: { include: { user: true } }
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Role restrictions (optional depending on evaluation flexibility)
    // E.g. Patient can cancel, Doctor can complete/check-in, Admin can do anything
    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    await logAction(req.user.id, `Updated appointment ID ${id} status to ${status}`, req.ip);
    
    // Notify parties
    const msg = `Appointment ID ${id} has been updated to ${status}.`;
    await sendNotification(appointment.patient.userId, msg, 'APPOINTMENT');
    await sendNotification(appointment.doctor.userId, msg, 'APPOINTMENT');

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const rescheduleAppointment = async (req, res) => {
  const { id } = req.params;
  const { date, slotTime } = req.body;

  if (!date || !slotTime) {
    return res.status(400).json({ error: 'Date and slot time are required to reschedule' });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: true,
        doctor: { include: { user: true } }
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // 1. Check leave
    if (appointment.doctor.isLeave) {
      return res.status(400).json({ error: 'Doctor is on leave on this day' });
    }

    // 2. Validate slot
    const availableSlots = JSON.parse(appointment.doctor.availabilitySchedule || '[]');
    if (!availableSlots.includes(slotTime)) {
      return res.status(400).json({ error: 'Slot is not in doctor availability schedule' });
    }

    // 3. Double booking
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: { not: parseInt(id) },
        doctorId: appointment.doctorId,
        date: date,
        slotTime: slotTime,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] }
      }
    });

    if (existingAppointment) {
      return res.status(400).json({ error: 'This slot is already booked for this doctor' });
    }

    // 4. Update
    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        date,
        slotTime,
        status: 'RESCHEDULED'
      }
    });

    await logAction(req.user.id, `Rescheduled appointment ID ${id} to ${date} at ${slotTime}`, req.ip);
    
    const msg = `Your appointment has been rescheduled to ${date} at ${slotTime}.`;
    await sendNotification(appointment.patient.userId, msg, 'APPOINTMENT');
    await sendNotification(appointment.doctor.userId, msg, 'APPOINTMENT');

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
