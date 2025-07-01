import { Router, Request, Response } from 'express';
import { PatientService } from '../services/patientService';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Create patient (admin, therapist)
router.post('/', authenticateToken, requireRole(['admin', 'therapist']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const patientData = {
      ...req.body,
      tenant_id: req.tenant_id
    };

    const auditContext: { userId?: string; ipAddress?: string; userAgent?: string } = {};
    if (req.user?.userId) auditContext.userId = req.user.userId;
    if (req.ip) auditContext.ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    if (userAgent) auditContext.userAgent = userAgent;

    const patient = await PatientService.createPatient(
      patientData,
      auditContext
    );

    res.status(201).json(patient);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get patients
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { search, user_id } = req.query;

    const patients = await PatientService.getPatientsByTenant(
      req.tenant_id,
      {
        search: search as string,
        userId: user_id as string
      }
    );

    res.json(patients);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { id } = req.params;

    const patient = await PatientService.getPatientById(
      id!!,
      req.tenant_id
    );

    res.json(patient);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Update patient (admin, therapist)
router.put('/:id', authenticateToken, requireRole(['admin', 'therapist']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { id } = req.params;
    const updates = req.body;

    const auditContext: { userId?: string; ipAddress?: string; userAgent?: string } = {};
    if (req.user?.userId) auditContext.userId = req.user.userId;
    if (req.ip) auditContext.ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    if (userAgent) auditContext.userAgent = userAgent;

    const patient = await PatientService.updatePatient(
      id!!,
      req.tenant_id,
      updates,
      auditContext
    );

    res.json(patient);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete patient (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { id } = req.params;

    const auditContext: { userId?: string; ipAddress?: string; userAgent?: string } = {};
    if (req.user?.userId) auditContext.userId = req.user.userId;
    if (req.ip) auditContext.ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    if (userAgent) auditContext.userAgent = userAgent;

    const result = await PatientService.deletePatient(
      id!!,
      req.tenant_id,
      auditContext
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router; 