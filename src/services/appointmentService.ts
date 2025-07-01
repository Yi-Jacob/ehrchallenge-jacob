import prisma from '../database/connection';
import { AuditService } from './auditService';

export interface CreateAppointmentRequest {
  tenant_id: string;
  patient_id: string;
  therapist_id: string;
  appointment_date: string;
  duration_minutes?: number;
  notes?: string;
}

export class AppointmentService {
  static async createAppointment(appointmentData: CreateAppointmentRequest, auditContext: { user_id?: string | undefined; ip_address?: string | undefined; user_agent?: string | undefined }) {
    const {
      tenant_id,
      patient_id,
      therapist_id,
      appointment_date,
      duration_minutes = 60,
      notes
    } = appointmentData;

    // Verify patient and therapist exist and belong to the same tenant
    const patientResult = await prisma.$queryRaw<any[]>`SELECT id FROM patients WHERE id = ${patient_id} AND tenant_id = ${tenant_id}`;

    if ((patientResult as any[]).length === 0) {
      throw new Error('Patient not found');
    }
    const therapistResult = await prisma.$queryRaw<any[]>`SELECT id FROM users WHERE id = ${therapist_id} AND tenant_id = ${tenant_id} AND role = 'THERAPIST'`;

    if ((therapistResult as any[]).length === 0) {
      throw new Error('Therapist not found');
    }
    
    const result = await prisma.$queryRaw<any[]>`INSERT INTO appointments (id, tenant_id, patient_id, therapist_id, appointment_date, duration_minutes, status, notes, created_at, updated_at)
      VALUES (gen_random_uuid(), ${tenant_id}, ${patient_id}, ${therapist_id}, ${appointment_date}::timestamp, ${duration_minutes}, 'SCHEDULED', ${notes}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`;
    
    const appointment = (result as any[])[0];

    // Audit log
    await AuditService.log({
      tenantId: tenant_id,
      userId: auditContext.user_id,
      action: 'CREATE',
      tableName: 'appointments',
      recordId: appointment.id,
      newValues: appointment,
      ipAddress: auditContext.ip_address,
      userAgent: auditContext.user_agent
    });

    return appointment;
  }

  static async getAppointmentById(appointmentId: string, tenantId: string, currentUserId?: string, currentUserRole?: string) {
    const result = await prisma.$queryRaw<any[]>`
      SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name,
             t.first_name as therapist_first_name, t.last_name as therapist_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users t ON a.therapist_id = t.id AND t.role = 'THERAPIST'
      WHERE a.id = ${appointmentId} AND a.tenant_id = ${tenantId}
    `;

    if ((result as any[]).length === 0) {
      throw new Error('Appointment not found');
    }

    const appointment = (result as any[])[0];

    // RBAC: Clients can only access their own appointments
    if (currentUserRole === 'client') {
      const patientResult = await prisma.$queryRaw<any[]>`SELECT user_id FROM patients WHERE id = ${appointment.patient_id}`;
      
      if ((patientResult as any[])[0]?.user_id !== currentUserId) {
        throw new Error('Access denied');
      }
    }

    return appointment;
  }

  static async getAppointmentsByTenant(
    tenantId: string,
    currentUserId?: string,
    currentUserRole?: string,
  ) {
    let whereClause = 'WHERE a.tenant_id = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;
    let rawQuery = '';

    if (currentUserRole === 'CLIENT' && currentUserId) {
      // Get patient_id for this user
      const patientResult = await prisma.$queryRaw<any[]>`SELECT id FROM patients WHERE user_id = ${currentUserId} AND tenant_id = ${tenantId}`;

      
      if (!patientResult.length) {
        throw new Error('Patient not found for this user');
      }
      const patientId = patientResult[0].id;
      whereClause += ` AND a.patient_id = $${paramIndex}`;
      params.push(patientId);
      paramIndex++;
      rawQuery = `SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name,
             t.first_name as therapist_first_name, t.last_name as therapist_last_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users t ON a.therapist_id = t.id AND t.role = 'THERAPIST'
        ${whereClause}
        ORDER BY a.appointment_date ASC`;
    } else if (currentUserRole === 'THERAPIST' && currentUserId) {
      // therapist_id is the user id
      whereClause += ` AND a.therapist_id = $${paramIndex}`;
      params.push(currentUserId);
      paramIndex++;
      rawQuery = `SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        ${whereClause}
        ORDER BY a.appointment_date ASC`;
    } else {
      // ADMIN or other roles: show all
      rawQuery = `SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name,
             t.first_name as therapist_first_name, t.last_name as therapist_last_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users t ON a.therapist_id = t.id AND t.role = 'THERAPIST'
        ${whereClause}
        ORDER BY a.appointment_date ASC`;
    }

    const result = await prisma.$queryRawUnsafe<any[]>(rawQuery, ...params);
    
    return result as any[];
  }

  static async updateAppointment(
    appointmentId: string,
    tenantId: string,
    updates: any,
    auditContext: { user_id?: string | undefined; ip_address?: string | undefined; user_agent?: string | undefined },
    currentUserId?: string,
    currentUserRole?: string
  ) {
    // Get current appointment data
    const currentAppointment = await this.getAppointmentById(appointmentId, tenantId, currentUserId, currentUserRole);

    // Prepare update fields
    const updateFields: string[] = [];
    const updateValues: any[] = [appointmentId, tenantId];
    let paramIndex = 3;

    if (updates.appointment_date !== undefined) {
      updateFields.push(`appointment_date = $${paramIndex}`);
      updateValues.push(updates.appointment_date);
      paramIndex++;
    }

    if (updates.duration_minutes !== undefined) {
      updateFields.push(`duration_minutes = $${paramIndex}`);
      updateValues.push(updates.duration_minutes);
      paramIndex++;
    }

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      updateValues.push(updates.status);
      paramIndex++;
    }

    if (updates.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex}`);
      updateValues.push(updates.notes);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const result = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE appointments SET ${updateFields.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      ...updateValues
    );

    if ((result as any[]).length === 0) {
      throw new Error('Appointment not found');
    }

    const updatedAppointment = (result as any[])[0];

    // Audit log
    await AuditService.log({
      tenantId,
      userId: auditContext.user_id,
      action: 'UPDATE',
      tableName: 'appointments',
      recordId: appointmentId,
      oldValues: currentAppointment,
      newValues: updatedAppointment,
      ipAddress: auditContext.ip_address,
      userAgent: auditContext.user_agent
    });

    return updatedAppointment;
  }

  static async startTelevisit(
    appointmentId: string,
    tenantId: string,
    auditContext: { user_id?: string | undefined; ip_address?: string | undefined; user_agent?: string | undefined }
  ) {
    // Get current appointment
    const currentAppointment = await this.getAppointmentById(appointmentId, tenantId);

    // Check if appointment is in a valid state to start
    if (currentAppointment.status !== 'confirmed' && currentAppointment.status !== 'scheduled') {
      throw new Error('Appointment must be confirmed or scheduled to start televisit');
    }

    // Update appointment status to in_progress
    const result = await prisma.$queryRaw<any[]>`UPDATE appointments SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP 
       WHERE id = ${appointmentId} AND tenant_id = ${tenantId} RETURNING *`;

    if ((result as any[]).length === 0) {
      throw new Error('Appointment not found');
    }

    const updatedAppointment = (result as any[])[0];

    // Audit log
    await AuditService.log({
      tenantId,
      userId: auditContext.user_id,
      action: 'START_TELEVISIT',
      tableName: 'appointments',
      recordId: appointmentId,
      oldValues: currentAppointment,
      newValues: updatedAppointment,
      ipAddress: auditContext.ip_address,
      userAgent: auditContext.user_agent
    });

    return {
      ...updatedAppointment,
      televisit_url: `https://televisit.mentalspace.com/${appointmentId}`,
      room_id: appointmentId
    };
  }

  static async deleteAppointment(
    appointmentId: string,
    tenantId: string,
    auditContext: { user_id?: string | undefined; ip_address?: string | undefined; user_agent?: string | undefined }
  ) {
    // Get appointment before deletion for audit
    const appointment = await this.getAppointmentById(appointmentId, tenantId);

    const result = await prisma.$queryRaw<any[]>`DELETE FROM appointments WHERE id = ${appointmentId} AND tenant_id = ${tenantId} RETURNING *`;

    if ((result as any[]).length === 0) {
      throw new Error('Appointment not found');
    }

    // Audit log
    await AuditService.log({
      tenantId,
      userId: auditContext.user_id,
      action: 'DELETE',
      tableName: 'appointments',
      recordId: appointmentId,
      oldValues: appointment,
      ipAddress: auditContext.ip_address,
      userAgent: auditContext.user_agent
    });

    return { message: 'Appointment deleted successfully' };
  }
} 