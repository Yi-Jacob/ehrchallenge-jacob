import { Request } from 'express';

// Re-export Prisma types for convenience
export type {
  User,
  Patient,
  Appointment,
  ClinicalNote,
  AuditLog,
  Tenant,
  UserRole,
  AppointmentStatus,
  ClinicalNoteType,
} from '@prisma/client';

// Custom types for API requests/responses
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
  };
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceInfo?: string;
  medicalHistory?: string;
}

export interface CreateAppointmentRequest {
  patientId: string;
  therapistId: string;
  appointmentDate: string;
  durationMinutes?: number;
  notes?: string;
}

export interface CreateClinicalNoteRequest {
  patientId: string;
  therapistId: string;
  appointmentId?: string;
  noteType?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export interface UpdateClinicalNoteRequest {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export interface AuditLogEntry {
  action: string;
  tableName: string;
  recordId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  iat?: number;
  exp?: number;
}

// Request with user context
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  tenantId?: string;
}

// Database query types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SearchParams {
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
} 