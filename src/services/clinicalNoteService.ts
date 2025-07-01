import { AuditService } from './auditService';
import { PrismaClient, ClinicalNoteType } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateClinicalNoteRequest {
  tenant_id: string;
  patient_id: string;
  therapist_id: string;
  appointment_id?: string;
  note_type?: ClinicalNoteType;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export class ClinicalNoteService {
  static async createClinicalNote(noteData: CreateClinicalNoteRequest, auditContext: { user_id?: string; ip_address?: string; user_agent?: string }) {
    const {
      tenant_id,
      patient_id,
      therapist_id,
      appointment_id,
      note_type = 'SOAP',
      subjective,
      objective,
      assessment,
      plan
    } = noteData;

    // Verify patient and therapist exist and belong to the same tenant
    const patientResult = await prisma.$queryRaw<any[]>`SELECT id FROM patients WHERE id = ${patient_id} AND tenant_id = ${tenant_id}`;
    if ((patientResult as any[]).length === 0) {
      throw new Error('Patient not found');
    }

    const therapistResult = await prisma.$queryRaw<any[]>`SELECT id FROM users WHERE id = ${therapist_id} AND tenant_id = ${tenant_id} AND role = 'THERAPIST'`;
    if ((therapistResult as any[]).length === 0) {
      throw new Error('Therapist not found');
    }

    // Verify appointment if provided
    if (appointment_id) {
      const appointmentResult = await prisma.$queryRaw<any[]>`SELECT id FROM appointments WHERE id = ${appointment_id} AND tenant_id = ${tenant_id}`;
      if ((appointmentResult as any[]).length === 0) {
        throw new Error('Appointment not found');
      }
    }

    const note = await prisma.clinicalNote.create({
      data: {
        tenantId: tenant_id,
        patientId: patient_id,
        therapistId: therapist_id,
        appointmentId: appointment_id || null,
        noteType: note_type,
        subjective: subjective || null,
        objective: objective || null,
        assessment: assessment || null,
        plan: plan || null
      }
    });

    // Audit log
    await AuditService.log({
      tenantId: tenant_id,
      userId: auditContext.user_id,
      action: 'CREATE',
      tableName: 'clinical_notes',
      recordId: note.id,
      newValues: note,
      ipAddress: auditContext.ip_address,
      userAgent: auditContext.user_agent
    });

    return note;
  }

  static async getClinicalNoteById(noteId: string, tenantId: string, currentUserId?: string, currentUserRole?: string) {
    const result = await prisma.$queryRaw<any[]>`
      SELECT cn.*, p.first_name as patient_first_name, p.last_name as patient_last_name,
             t.first_name as therapist_first_name, t.last_name as therapist_last_name
      FROM clinical_notes cn
      JOIN patients p ON cn.patient_id = p.id
      JOIN users t ON cn.therapist_id = t.id AND t.role = 'THERAPIST'
      WHERE cn.id = ${noteId} AND cn.tenant_id = ${tenantId}
    `;

    if ((result as any[]).length === 0) {
      throw new Error('Clinical note not found');
    }

    const note = (result as any[])[0];

    // RBAC: Clients can only access their own notes and only if signed
    if (currentUserRole === 'client') {
      const patientResult = await prisma.$queryRaw<any[]>`SELECT user_id FROM patients WHERE id = ${note.patient_id}`;
      
      if ((patientResult as any[])[0]?.user_id !== currentUserId) {
        throw new Error('Access denied');
      }

      if (!note.is_signed) {
        throw new Error('Note not yet signed by therapist');
      }
    }

    return note;
  }

  static async getClinicalNotesByPatient(
    patientId: string,
    tenantId: string,
    currentUserId?: string,
    currentUserRole?: string,
    filters: { note_type?: string; is_signed?: boolean } = {}
  ) {
    // Verify patient exists and user has access
    const patientResult = await prisma.$queryRaw<any[]>`SELECT id, user_id FROM patients WHERE id = ${patientId} AND tenant_id = ${tenantId}`;

    if ((patientResult as any[]).length === 0) {
      throw new Error('Patient not found');
    }

    const patient = (patientResult as any[])[0];

    // RBAC: Clients can only access their own notes
    if (currentUserRole === 'client' && patient.user_id !== currentUserId) {
      throw new Error('Access denied');
    }

    let whereClause = 'WHERE cn.tenant_id = $1 AND cn.patient_id = $2';
    const params: any[] = [tenantId, patientId];
    let paramIndex = 3;

    if (filters.note_type) {
      whereClause += ` AND cn.note_type = $${paramIndex}`;
      params.push(filters.note_type);
      paramIndex++;
    }

    if (filters.is_signed !== undefined) {
      whereClause += ` AND cn.is_signed = $${paramIndex}`;
      params.push(filters.is_signed);
      paramIndex++;
    }

    // For clients, only show signed notes
    if (currentUserRole === 'client') {
      whereClause += ` AND cn.is_signed = true`;
    }

    const rawQuery = `SELECT cn.*, p.first_name as patient_first_name, p.last_name as patient_last_name,
             t.first_name as therapist_first_name, t.last_name as therapist_last_name
      FROM clinical_notes cn
      JOIN patients p ON cn.patient_id = p.id
      JOIN users t ON cn.therapist_id = t.id AND t.role = 'THERAPIST'
      ${whereClause}
      ORDER BY cn.created_at DESC`;
    const result = await prisma.$queryRawUnsafe<any[]>(rawQuery, ...params);

    return result as any[];
  }

  static async updateClinicalNote(
    noteId: string,
    tenantId: string,
    updates: any,
    auditContext: { user_id?: string; ip_address?: string; user_agent?: string },
    currentUserId?: string,
    currentUserRole?: string
  ) {
    // Get current note data
    const currentNote = await this.getClinicalNoteById(noteId, tenantId, currentUserId, currentUserRole);

    // Only therapists and admins can update notes
    if (currentUserRole === 'client') {
      throw new Error('Clients cannot update clinical notes');
    }

    // Cannot update signed notes
    if (currentNote.is_signed) {
      throw new Error('Cannot update signed notes');
    }

    // Prepare update fields
    const updateFields: string[] = [];
    const updateValues: any[] = [noteId, tenantId];
    let paramIndex = 3;

    if (updates.subjective !== undefined) {
      updateFields.push(`subjective = $${paramIndex}`);
      updateValues.push(updates.subjective);
      paramIndex++;
    }

    if (updates.objective !== undefined) {
      updateFields.push(`objective = $${paramIndex}`);
      updateValues.push(updates.objective);
      paramIndex++;
    }

    if (updates.assessment !== undefined) {
      updateFields.push(`assessment = $${paramIndex}`);
      updateValues.push(updates.assessment);
      paramIndex++;
    }

    if (updates.plan !== undefined) {
      updateFields.push(`plan = $${paramIndex}`);
      updateValues.push(updates.plan);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const result = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE clinical_notes SET ${updateFields.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      ...updateValues
    );

    if ((result as any[]).length === 0) {
      throw new Error('Clinical note not found');
    }

    const updatedNote = (result as any[])[0];

    // Audit log
    await AuditService.log({
      tenantId,
      userId: auditContext.user_id,
      action: 'UPDATE',
      tableName: 'clinical_notes',
      recordId: noteId,
      oldValues: currentNote,
      newValues: updatedNote,
      ipAddress: auditContext.ip_address,
      userAgent: auditContext.user_agent
    });

    return updatedNote;
  }

  static async signClinicalNote(
    noteId: string,
    tenantId: string,
    auditContext: { user_id?: string; ip_address?: string; user_agent?: string },
    currentUserId?: string,
    currentUserRole?: string
  ) {
    // Get current note data
    const currentNote = await this.getClinicalNoteById(noteId, tenantId, currentUserId, currentUserRole);

    // Only therapists and admins can sign notes
    if (currentUserRole === 'client') {
      throw new Error('Clients cannot sign clinical notes');
    }

    // Cannot sign already signed notes
    if (currentNote.is_signed) {
      throw new Error('Note is already signed');
    }

    // Verify the user is the provider who created the note or an admin
    if (currentUserRole !== 'admin' && currentNote.therapist_id !== currentUserId) {
      throw new Error('Only the provider who created the note can sign it');
    }

    const result = await prisma.$queryRaw<any[]>`UPDATE clinical_notes SET is_signed = true, signed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ${noteId} AND tenant_id = ${tenantId} RETURNING *`;

    if ((result as any[]).length === 0) {
      throw new Error('Clinical note not found');
    }

    const signedNote = (result as any[])[0];

    // Audit log
    await AuditService.log({
      tenantId,
      userId: auditContext.user_id,
      action: 'SIGN',
      tableName: 'clinical_notes',
      recordId: noteId,
      oldValues: currentNote,
      newValues: signedNote,
      ipAddress: auditContext.ip_address,
      userAgent: auditContext.user_agent
    });

    return signedNote;
  }

  static async deleteClinicalNote(
    noteId: string,
    tenantId: string,
    auditContext: { user_id?: string; ip_address?: string; user_agent?: string }
  ) {
    // Get note before deletion for audit
    const note = await this.getClinicalNoteById(noteId, tenantId);

    const result = await prisma.$queryRaw<any[]>`DELETE FROM clinical_notes WHERE id = ${noteId} AND tenant_id = ${tenantId} RETURNING *`;

    if ((result as any[]).length === 0) {
      throw new Error('Clinical note not found');
    }

    // Audit log
    await AuditService.log({
      tenantId,
      userId: auditContext.user_id,
      action: 'DELETE',
      tableName: 'clinical_notes',
      recordId: noteId,
      oldValues: note,
      ipAddress: auditContext.ip_address,
      userAgent: auditContext.user_agent
    });

    return { message: 'Clinical note deleted successfully' };
  }

  static async getClinicalNotesByTenant(
    tenantId: string,
    currentUserId?: string,
    currentUserRole?: string,
  ) {
    let whereClause = 'WHERE cn.tenant_id = $1';
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
      whereClause += ` AND cn.patient_id = $${paramIndex}`;
      params.push(patientId);
      paramIndex++;
      rawQuery = `SELECT cn.*, p.first_name as patient_first_name, p.last_name as patient_last_name,
             t.first_name as therapist_first_name, t.last_name as therapist_last_name
        FROM clinical_notes cn
        JOIN patients p ON cn.patient_id = p.id
        JOIN users t ON cn.therapist_id = t.id AND t.role = 'THERAPIST'
        ${whereClause}
        ORDER BY cn.created_at DESC`;
    } else if (currentUserRole === 'THERAPIST' && currentUserId) {
      whereClause += ` AND cn.therapist_id = $${paramIndex}`;
      params.push(currentUserId);
      paramIndex++;
      rawQuery = `SELECT cn.*, p.first_name as patient_first_name, p.last_name as patient_last_name
        FROM clinical_notes cn
        LEFT JOIN patients p ON cn.patient_id = p.id
        ${whereClause}
        ORDER BY cn.created_at DESC`;
    } else {
      // ADMIN or other roles: show all
      rawQuery = `SELECT cn.*, p.first_name as patient_first_name, p.last_name as patient_last_name,
             t.first_name as therapist_first_name, t.last_name as therapist_last_name
        FROM clinical_notes cn
        JOIN patients p ON cn.patient_id = p.id
        JOIN users t ON cn.therapist_id = t.id AND t.role = 'THERAPIST'
        ${whereClause}
        ORDER BY cn.created_at DESC`;
    }

    const result = await prisma.$queryRawUnsafe<any[]>(rawQuery, ...params);
    return result as any[];
  }
} 