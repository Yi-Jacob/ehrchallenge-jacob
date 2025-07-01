import { prisma } from '../database/connection';
import { AuditLog } from '@prisma/client';

export interface AuditLogEntry {
  tenantId: string;
  userId?: string | undefined;
  action: string;
  tableName: string;
  recordId?: string | undefined;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export class AuditService {
  static async log(auditData: AuditLogEntry): Promise<AuditLog> {
    return await prisma.auditLog.create({
      data: {
        tenantId: auditData.tenantId,
        userId: auditData.userId ?? null,
        action: auditData.action,
        tableName: auditData.tableName,
        recordId: auditData.recordId ?? null,
        oldValues: auditData.oldValues,
        newValues: auditData.newValues,
        ipAddress: auditData.ipAddress ?? null,
        userAgent: auditData.userAgent ?? null,
      },
    });
  }

  static async getAuditLogsByTenant(tenantId: string, filters: {
    tableName?: string;
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<AuditLog[]> {
    const where: any = {
      tenantId,
    };

    if (filters.tableName) {
      where.tableName = filters.tableName;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });
  }

  static async getAuditLogsByRecord(tenantId: string, tableName: string, recordId: string): Promise<AuditLog[]> {
    return await prisma.auditLog.findMany({
      where: {
        tenantId,
        tableName,
        recordId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async getAuditLogById(id: string, tenantId: string): Promise<AuditLog | null> {
    return await prisma.auditLog.findFirst({
      where: {
        id,
        tenantId,
      },
    });
  }
} 