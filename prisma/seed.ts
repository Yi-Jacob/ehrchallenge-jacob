import { PrismaClient, UserRole, AppointmentStatus, ClinicalNoteType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { EncryptionService } from '../src/utils/encryption';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create a tenant
  console.log('1. Creating tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      name: 'MentalSpace Demo',
      domain: 'demo.mentalspace.com',
    },
  });
  console.log('✅ Created tenant:', tenant.name);

  // Create admin user
  console.log('2. Creating admin user...');
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: EncryptionService.encrypt('admin@mentalspace.com'),
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  });
  console.log('✅ Created admin user:', adminUser.email);

  // Create therapist users
  console.log('3. Creating therapist users...');
  const therapist1 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: EncryptionService.encrypt('dr.smith@mentalspace.com'),
      passwordHash: await bcrypt.hash('therapist123', 12),
      firstName: 'Dr. Sarah',
      lastName: 'Smith',
      role: 'THERAPIST',
      isActive: true,
    },
  });
  await prisma.therapistProfile.create({
    data: {
      userId: therapist1.id,
      licenseNumber: 'PSY12345',
      specialization: 'Clinical Psychology',
      phone: '555-0101',
      email: 'dr.smith@mentalspace.com',
      bio: 'Experienced clinical psychologist.'
    },
  });
  const therapist2 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: EncryptionService.encrypt('dr.johnson@mentalspace.com'),
      passwordHash: await bcrypt.hash('therapist123', 12),
      firstName: 'Dr. Michael',
      lastName: 'Johnson',
      role: 'THERAPIST',
      isActive: true,
    },
  });
  await prisma.therapistProfile.create({
    data: {
      userId: therapist2.id,
      licenseNumber: 'PSY67890',
      specialization: 'Psychiatry',
      phone: '555-0102',
      email: 'dr.johnson@mentalspace.com',
      bio: 'Board-certified psychiatrist.'
    },
  });
  console.log('✅ Created therapist users');

  // Create client users
  console.log('4. Creating client users...');
  const clientPasswordHash = await bcrypt.hash('client123', 12);
  
  const client1 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: EncryptionService.encrypt('john.doe@example.com'),
      passwordHash: clientPasswordHash,
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CLIENT,
    },
  });

  const client2 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: EncryptionService.encrypt('jane.smith@example.com'),
      passwordHash: clientPasswordHash,
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.CLIENT,
    },
  });

  const client3 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: EncryptionService.encrypt('bob.wilson@example.com'),
      passwordHash: clientPasswordHash,
      firstName: 'Bob',
      lastName: 'Wilson',
      role: UserRole.CLIENT,
    },
  });
  console.log('✅ Created client users');

  // Create patients
  console.log('5. Creating patients...');
  const patient1 = await prisma.patient.create({
    data: {
      tenantId: tenant.id,
      userId: client1.id,
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1985-03-15'),
      gender: 'Male',
      phone: EncryptionService.encrypt('555-0201'),
      email: EncryptionService.encrypt('john.doe@example.com'),
      address: EncryptionService.encrypt('123 Main St, Anytown, USA'),
      emergencyContactName: EncryptionService.encrypt('Mary Doe'),
      emergencyContactPhone: EncryptionService.encrypt('555-0202'),
      insuranceInfo: EncryptionService.encrypt('Blue Cross Blue Shield'),
      medicalHistory: 'Anxiety, Depression',
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      tenantId: tenant.id,
      userId: client2.id,
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: new Date('1990-07-22'),
      gender: 'Female',
      phone: EncryptionService.encrypt('555-0203'),
      email: EncryptionService.encrypt('jane.smith@example.com'),
      address: EncryptionService.encrypt('456 Oak Ave, Somewhere, USA'),
      emergencyContactName: EncryptionService.encrypt('Tom Smith'),
      emergencyContactPhone: EncryptionService.encrypt('555-0204'),
      insuranceInfo: EncryptionService.encrypt('Aetna'),
      medicalHistory: 'PTSD',
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      tenantId: tenant.id,
      userId: client3.id,
      firstName: 'Bob',
      lastName: 'Wilson',
      dateOfBirth: new Date('1978-11-08'),
      gender: 'Male',
      phone: EncryptionService.encrypt('555-0205'),
      email: EncryptionService.encrypt('bob.wilson@example.com'),
      address: EncryptionService.encrypt('789 Pine Rd, Elsewhere, USA'),
      emergencyContactName: EncryptionService.encrypt('Alice Wilson'),
      emergencyContactPhone: EncryptionService.encrypt('555-0206'),
      insuranceInfo: EncryptionService.encrypt('Cigna'),
      medicalHistory: 'Bipolar Disorder',
    },
  });
  console.log('✅ Created patients');

  // Create appointments
  console.log('6. Creating appointments...');
  const appointment1 = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      patientId: patient1.id,
      therapistId: therapist1.id,
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      durationMinutes: 60,
      status: 'SCHEDULED',
      notes: 'Initial consultation',
    },
  });

  const appointment2 = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      patientId: patient2.id,
      therapistId: therapist2.id,
      appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      durationMinutes: 90,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Follow-up session',
    },
  });
  console.log('✅ Created appointments');

  // Create clinical notes
  console.log('7. Creating clinical notes...');
  const note1 = await prisma.clinicalNote.create({
    data: {
      tenantId: tenant.id,
      patientId: patient1.id,
      therapistId: therapist1.id,
      appointmentId: appointment1.id,
      noteType: 'SOAP',
      subjective: 'Patient reports feeling anxious and having trouble sleeping for the past 2 weeks.',
      objective: 'Patient appears alert and oriented. Speech is clear and coherent. No signs of psychosis.',
      assessment: 'Generalized Anxiety Disorder, mild to moderate severity.',
      plan: 'Start CBT therapy sessions weekly. Consider medication if symptoms persist.',
    },
  });

  // Sign the first note
  await prisma.clinicalNote.update({
    where: { id: note1.id },
    data: {
      isSigned: true,
      signedAt: new Date(),
    },
  });

  const note2 = await prisma.clinicalNote.create({
    data: {
      tenantId: tenant.id,
      patientId: patient2.id,
      therapistId: therapist2.id,
      appointmentId: appointment2.id,
      noteType: ClinicalNoteType.SOAP,
      subjective: 'Patient continues to experience flashbacks and nightmares related to past trauma.',
      objective: 'Patient shows signs of hypervigilance and startle response. Affect is constricted.',
      assessment: 'Post-Traumatic Stress Disorder, moderate severity.',
      plan: 'Continue EMDR therapy. Increase session frequency to twice weekly.',
    },
  });
  console.log('✅ Created clinical notes');

  // Create some audit logs
  console.log('8. Creating audit logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: tenant.id,
        userId: adminUser.id,
        action: 'CREATE',
        tableName: 'users',
        recordId: adminUser.id,
        newValues: { email: adminUser.email, role: adminUser.role },
        ipAddress: '127.0.0.1',
        userAgent: 'Seeder',
      },
      {
        tenantId: tenant.id,
        userId: adminUser.id,
        action: 'CREATE',
        tableName: 'patients',
        recordId: patient1.id,
        newValues: { firstName: patient1.firstName, lastName: patient1.lastName },
        ipAddress: '127.0.0.1',
        userAgent: 'Seeder',
      },
      {
        tenantId: tenant.id,
        userId: therapist1.id,
        action: 'SIGN',
        tableName: 'clinical_notes',
        recordId: note1.id,
        newValues: { isSigned: true, signedAt: new Date() },
        ipAddress: '127.0.0.1',
        userAgent: 'Seeder',
      },
    ],
  });
  console.log('✅ Created audit logs');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Sample Data Summary:');
  console.log(`- Tenant: ${tenant.name}`);
  console.log(`- Admin: ${adminUser.email} (password: admin123)`);
  console.log(`- Therapists: ${therapist1.email}, ${therapist2.email} (password: therapist123)`);
  console.log(`- Clients: ${client1.email}, ${client2.email}, ${client3.email} (password: client123)`);
  console.log(`- Patients: ${patient1.firstName} ${patient1.lastName}, ${patient2.firstName} ${patient2.lastName}, ${patient3.firstName} ${patient3.lastName}`);
  console.log(`- Appointments: 2 scheduled`);
  console.log(`- Clinical Notes: 2 created (1 signed)`);
  console.log(`- Audit Logs: 3 entries created`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 