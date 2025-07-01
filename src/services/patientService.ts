import { prisma } from '../database/connection';
import { Patient } from '@prisma/client';
import { AuditService } from './auditService';
import { EncryptionService, ENCRYPTED_FIELDS } from '../utils/encryption';

export interface CreatePatientRequest {
  tenantId: string;
  userId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceInfo?: string;
  medicalHistory?: string;
}

export interface UpdatePatientRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceInfo?: string;
  medicalHistory?: string;
}

export interface AuditLogEntry {
  tenantId: string;
  userId?: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class PatientService {
 static async createPatient(patientData: CreatePatientRequest, auditContext: { userId?: string; ipAddress?: string; userAgent?: string }): Promise<Patient> {
    // Encrypt PII fields before storing
    const encryptedData = EncryptionService.encryptObject(patientData, ENCRYPTED_FIELDS.patients);
    
    const patient = await prisma.patient.create({
      data: {
        tenantId: patientData.tenantId,
        userId: patientData.userId ?? null,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        dateOfBirth: patientData.dateOfBirth,
        gender: patientData.gender ?? null,
        phone: encryptedData.phone ?? null,
        email: encryptedData.email ?? null,
        address: encryptedData.address ?? null,
        emergencyContactName: encryptedData.emergencyContactName ?? null,
        emergencyContactPhone: encryptedData.emergencyContactPhone ?? null,
        insuranceInfo: encryptedData.insuranceInfo ?? null,
        medicalHistory: patientData.medicalHistory ?? null,
      },
    });

    // Audit log
    await AuditService.log({
      tenantId: patientData.tenantId,
      userId: auditContext.userId,
      action: 'CREATE',
      tableName: 'patients',
      recordId: patient.id,
      newValues: patient,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
    });

    return patient;
  }

 static async getPatientById(id: string, tenantId: string): Promise<Patient | null> {
    const patient = await prisma.patient.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (patient) {
      // Decrypt PII fields before returning
      return EncryptionService.decryptObject(patient, ENCRYPTED_FIELDS.patients) as Patient;
    }

    return patient;
  }

 static async getPatientsByTenant(tenantId: string, filters: {
    search?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Patient[]> {
    const where: any = {
      tenantId,
    };

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        // Note: Can't search encrypted email field directly
      ];
    }

    const patients = await prisma.patient.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });

    // Decrypt PII fields for all patients
    return patients.map(patient => 
      EncryptionService.decryptObject(patient, ENCRYPTED_FIELDS.patients) as Patient
    );
  }

 static async updatePatient(id: string, tenantId: string, updates: UpdatePatientRequest, auditContext: { userId?: string; ipAddress?: string; userAgent?: string }): Promise<Patient | null> {
    // Get current patient for audit
    const currentPatient = await this.getPatientById(id, tenantId);
    if (!currentPatient) {
      throw new Error('Patient not found');
    }

    // Encrypt PII fields before updating
    const encryptedUpdates = EncryptionService.encryptObject(updates, ENCRYPTED_FIELDS.patients);

    // Update patient
    const updatedPatient = await prisma.patient.update({
      where: {
        id,
        tenantId,
      },
      data: encryptedUpdates,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Audit log
    await AuditService.log({
      tenantId,
      userId: auditContext.userId,
      action: 'UPDATE',
      tableName: 'patients',
      recordId: id,
      oldValues: currentPatient,
      newValues: updatedPatient,
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
    });

    return updatedPatient;
  }

 static async deletePatient(id: string, tenantId: string, auditContext: { userId?: string; ipAddress?: string; userAgent?: string }): Promise<boolean> {
    try {
      await prisma.patient.delete({
        where: {
          id,
          tenantId,
        },
      });

      // Audit log
      await AuditService.log({
        tenantId,
        userId: auditContext.userId,
        action: 'DELETE',
        tableName: 'patients',
        recordId: id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      });

      return true;
    } catch (error) {
      return false;
    }
  }

 static async getPatientByUserId(userId: string, tenantId: string): Promise<Patient | null> {
    return await prisma.patient.findFirst({
      where: {
        userId,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

 static async getPatientStats(tenantId: string): Promise<{
    total: number;
    withUserAccounts: number;
    withoutUserAccounts: number;
  }> {
    const [total, withUserAccounts] = await Promise.all([
      prisma.patient.count({
        where: { tenantId },
      }),
      prisma.patient.count({
        where: {
          tenantId,
          userId: { not: null },
        },
      }),
    ]);

    return {
      total,
      withUserAccounts,
      withoutUserAccounts: total - withUserAccounts,
    };
  }
} 