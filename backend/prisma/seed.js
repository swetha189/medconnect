import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.consentGrant.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.labReport.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.department.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding Apollo Hospital...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Single Apollo Hospital
  const apollo = await prisma.hospital.create({
    data: {
      name: 'Apollo Hospitals',
      address: 'No. 21, Greams Lane, Off Greams Road, Chennai - 600006',
      phone: '044-28293333',
      latitude: 13.0607,
      longitude: 80.2565,
      totalBeds: 500,
      icuBeds: 80,
      emergencyBeds: 60,
      nicuBeds: 20,
      availableBeds: 320,
      availableIcuBeds: 45,
      availableEmergencyBeds: 38,
      availableNicuBeds: 12,
    },
  });

  console.log('Seeding Departments...');
  await prisma.department.createMany({
    data: [
      { hospitalId: apollo.id, name: 'Cardiology', description: 'Heart and vascular care' },
      { hospitalId: apollo.id, name: 'Pediatrics', description: 'Child and infant care' },
      { hospitalId: apollo.id, name: 'Gynecology', description: "Women's health and obstetrics" },
      { hospitalId: apollo.id, name: 'Orthopedics', description: 'Bone, joint and muscle care' },
      { hospitalId: apollo.id, name: 'Neurology', description: 'Brain and nervous system care' },
      { hospitalId: apollo.id, name: 'General Medicine', description: 'General health consultations' },
      { hospitalId: apollo.id, name: 'Dermatology', description: 'Skin, hair and nail care' },
      { hospitalId: apollo.id, name: 'Psychiatry', description: 'Mental health and wellness' },
      { hospitalId: apollo.id, name: 'Ophthalmology', description: 'Eye care and vision' },
      { hospitalId: apollo.id, name: 'Emergency Medicine', description: '24/7 Emergency and trauma care' },
    ],
  });

  console.log('Seeding Users...');

  // ─── Super Admin ────────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      email: 'admin@medconnect.com',
      passwordHash,
      role: 'SUPER_ADMIN',
      firstName: 'Arulmozhi',
      lastName: 'Selvan',
      phone: '9444100001',
    },
  });

  // ─── Hospital Admin ──────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      email: 'hadmin@medconnect.com',
      passwordHash,
      role: 'HOSPITAL_ADMIN',
      firstName: 'Selvakumar',
      lastName: 'Natarajan',
      phone: '9444100002',
    },
  });

  // ─── Lab Technician ──────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      email: 'labtech@medconnect.com',
      passwordHash,
      role: 'LAB_TECHNICIAN',
      firstName: 'Anandhi',
      lastName: 'Krishnaswamy',
      phone: '9444100003',
    },
  });

  // ─── Pharmacist ──────────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      email: 'pharmacist@medconnect.com',
      passwordHash,
      role: 'PHARMACIST',
      firstName: 'Palaniswamy',
      lastName: 'Govindarajan',
      phone: '9444100004',
    },
  });

  // ─── Patients ─────────────────────────────────────────────────────────────────
  const patientUser1 = await prisma.user.create({
    data: {
      email: 'patient@medconnect.com',
      passwordHash,
      role: 'PATIENT',
      firstName: 'Swethalakshmi',
      lastName: 'Rajan',
      phone: '9444200001',
      patient: {
        create: {
          dateOfBirth: '1998-04-12',
          gender: 'Female',
          bloodGroup: 'O+',
          allergies: 'Penicillin, Dust',
          emergencyContactName: 'Rajendran Rajan',
          emergencyContactPhone: '9444200099',
        },
      },
    },
  });

  const patientUser2 = await prisma.user.create({
    data: {
      email: 'kannan@medconnect.com',
      passwordHash,
      role: 'PATIENT',
      firstName: 'Kannan',
      lastName: 'Murugesan',
      phone: '9444200002',
      patient: {
        create: {
          dateOfBirth: '1985-08-20',
          gender: 'Male',
          bloodGroup: 'A-',
          allergies: 'Peanuts',
          emergencyContactName: 'Saraswathi Kannan',
          emergencyContactPhone: '9444200098',
        },
      },
    },
  });

  // ─── 10 Doctors (Tamil Names, APPROVED) ──────────────────────────────────────
  const doctorData = [
    {
      firstName: 'Arunachalam', lastName: 'Subramaniam',
      email: 'doctor@medconnect.com',
      specialization: 'Cardiology',
      qualification: 'MD, DM (Cardiology) - Madras Medical College',
      experienceYears: 18, consultationFee: 800,
      slots: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    },
    {
      firstName: 'Meenakshi', lastName: 'Sundaram',
      email: 'meenakshi@medconnect.com',
      specialization: 'Pediatrics',
      qualification: 'MD (Pediatrics) - Stanley Medical College',
      experienceYears: 12, consultationFee: 600,
      slots: ['10:00', '11:00', '12:00', '15:00', '16:00'],
    },
    {
      firstName: 'Rajalakshmi', lastName: 'Krishnan',
      email: 'rajalakshmi@medconnect.com',
      specialization: 'Gynecology',
      qualification: 'MS (OBG) - Kilpauk Medical College',
      experienceYears: 15, consultationFee: 700,
      slots: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    },
    {
      firstName: 'Senthilkumar', lastName: 'Murugan',
      email: 'senthilkumar@medconnect.com',
      specialization: 'Orthopedics',
      qualification: 'MS (Orthopaedics) - Madurai Medical College',
      experienceYears: 10, consultationFee: 650,
      slots: ['09:00', '10:00', '14:00', '15:00', '16:00'],
    },
    {
      firstName: 'Kavitha', lastName: 'Balakrishnan',
      email: 'kavitha@medconnect.com',
      specialization: 'Neurology',
      qualification: 'MD, DM (Neurology) - Government General Hospital, Chennai',
      experienceYears: 14, consultationFee: 850,
      slots: ['10:00', '11:00', '14:00', '15:00'],
    },
    {
      firstName: 'Ramamoorthy', lastName: 'Pillai',
      email: 'ramamoorthy@medconnect.com',
      specialization: 'General Medicine',
      qualification: 'MBBS, MD (General Medicine) - Coimbatore Medical College',
      experienceYears: 20, consultationFee: 500,
      slots: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'],
    },
    {
      firstName: 'Vijayalakshmi', lastName: 'Narayanan',
      email: 'vijayalakshmi@medconnect.com',
      specialization: 'Dermatology',
      qualification: 'MD (Dermatology) - Sri Ramachandra Medical College',
      experienceYears: 9, consultationFee: 600,
      slots: ['10:00', '11:00', '14:00', '15:00', '16:00'],
    },
    {
      firstName: 'Anbazhagan', lastName: 'Veluchamy',
      email: 'anbazhagan@medconnect.com',
      specialization: 'Psychiatry',
      qualification: 'MD (Psychiatry) - NIMHANS, Bengaluru',
      experienceYears: 13, consultationFee: 750,
      slots: ['10:00', '11:00', '14:00', '15:00'],
    },
    {
      firstName: 'Ponnammal', lastName: 'Raghunathan',
      email: 'ponnammal@medconnect.com',
      specialization: 'Ophthalmology',
      qualification: 'MS (Ophthalmology) - Aravind Eye Hospital, Madurai',
      experienceYears: 16, consultationFee: 650,
      slots: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    },
    {
      firstName: 'Murugesan', lastName: 'Thangaraj',
      email: 'murugesan@medconnect.com',
      specialization: 'Emergency Medicine',
      qualification: 'MD (Emergency Medicine) - Chennai Medical College',
      experienceYears: 11, consultationFee: 700,
      slots: ['08:00', '09:00', '10:00', '14:00', '15:00', '20:00', '21:00'],
    },
  ];

  const createdDoctors = [];
  for (const d of doctorData) {
    const userWithDoctor = await prisma.user.create({
      data: {
        email: d.email,
        passwordHash,
        role: 'DOCTOR',
        firstName: d.firstName,
        lastName: d.lastName,
        phone: `944430000${doctorData.indexOf(d) + 1}`,
        doctor: {
          create: {
            hospitalId: apollo.id,
            specialization: d.specialization,
            qualification: d.qualification,
            experienceYears: d.experienceYears,
            consultationFee: d.consultationFee,
            availabilitySchedule: JSON.stringify(d.slots),
            approvalStatus: 'APPROVED',
          },
        },
      },
      include: { doctor: true },
    });
    createdDoctors.push(userWithDoctor);
  }

  console.log('Seeding sample appointment and EHR data...');

  const patient1 = await prisma.patient.findUnique({ where: { userId: patientUser1.id } });
  const doctor1 = createdDoctors[0].doctor; // Arunachalam - Cardiology

  // Completed past appointment
  await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      hospitalId: apollo.id,
      date: '2026-06-20',
      slotTime: '10:00',
      status: 'COMPLETED',
      notes: 'Routine cardiac checkup – mild chest discomfort reported.',
    },
  });

  // Medical record + prescription
  const record = await prisma.medicalRecord.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      visitDate: '2026-06-20',
      diagnosis: 'Mild hypertension with occasional palpitations',
      treatmentPlan: 'Reduce salt intake. Monitor BP twice daily. Avoid caffeine and stress.',
      followUpNotes: 'Return in 2 weeks. Refer to Neurology if headaches persist.',
    },
  });

  await prisma.prescription.create({
    data: {
      medicalRecordId: record.id,
      patientId: patient1.id,
      doctorId: doctor1.id,
      status: 'COMPLETED',
      items: {
        create: [
          { medicineName: 'Amlodipine', dosage: '5mg', frequency: 'Once daily (morning)', duration: '30 days' },
          { medicineName: 'Atenolol', dosage: '25mg', frequency: 'Once daily (night)', duration: '14 days' },
        ],
      },
    },
  });

  // Upcoming confirmed appointment
  const doctor2 = createdDoctors[4].doctor; // Kavitha - Neurology
  await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor2.id,
      hospitalId: apollo.id,
      date: '2026-07-02',
      slotTime: '11:00',
      status: 'CONFIRMED',
      notes: 'Follow-up for persistent headaches – referred by Cardiology.',
    },
  });

  console.log('');
  console.log('✅ Seeding completed successfully!');
  console.log('');
  console.log('Demo accounts (password: password123):');
  console.log('  👤 Patient     → patient@medconnect.com');
  console.log('  🩺 Doctor      → doctor@medconnect.com  (Arunachalam – Cardiology)');
  console.log('  🏥 Hosp Admin  → hadmin@medconnect.com');
  console.log('  🔬 Lab Tech    → labtech@medconnect.com');
  console.log('  💊 Pharmacist  → pharmacist@medconnect.com');
  console.log('  🛡️  Super Admin → admin@medconnect.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
