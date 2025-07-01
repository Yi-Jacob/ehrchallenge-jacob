import { Router, Request, Response } from 'express';
import { AuditService } from '../services/auditService';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Get audit logs by tenant (admin only)
router.get('/', authenticateToken, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { 
      tableName, 
      action, 
      userId, 
      startDate, 
      endDate, 
      limit, 
      offset 
    } = req.query;

    const filters: {
      tableName?: string;
      action?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {};

    if (tableName) filters.tableName = tableName as string;
    if (action) filters.action = action as string;
    if (userId) filters.userId = userId as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (limit) filters.limit = parseInt(limit as string);
    if (offset) filters.offset = parseInt(offset as string);

    const auditLogs = await AuditService.getAuditLogsByTenant(req.tenant_id, filters);
    res.json(auditLogs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit logs by record (admin only)
router.get('/record/:tableName/:recordId', authenticateToken, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { tableName, recordId } = req.params;

    if (!tableName || !recordId) {
      return res.status(400).json({ error: 'Table name and record ID are required' });
    }

    const auditLogs = await AuditService.getAuditLogsByRecord(req.tenant_id, tableName, recordId);
    res.json(auditLogs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit log by ID (admin only)
router.get('/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Audit log ID is required' });
    }

    const auditLog = await AuditService.getAuditLogById(id, req.tenant_id);
    if (!auditLog) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json(auditLog);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 