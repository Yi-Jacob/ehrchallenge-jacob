import { Router, Request, Response } from 'express';
import { ClinicalNoteService } from '../services/clinicalNoteService';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Create clinical note (admin, therapist)
router.post('/', authenticateToken, requireRole(['ADMIN', 'THERAPIST']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const noteData = {
      ...req.body,
      tenant_id: req.tenant_id,
      therapist_id: req.user?.userId
    };

    const auditContext: { user_id?: string; ip_address?: string; user_agent?: string } = {};
    if (req.user?.userId) auditContext.user_id = req.user.userId;
    if (req.ip) auditContext.ip_address = req.ip;
    const userAgent = req.get('User-Agent');
    if (userAgent) auditContext.user_agent = userAgent;

    const note = await ClinicalNoteService.createClinicalNote(
      noteData,
      auditContext
    );

    res.status(201).json(note);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get clinical notes by patient
router.get('/patient/:patientId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { patientId } = req.params;
    const { note_type, is_signed } = req.query;

    const notes = await ClinicalNoteService.getClinicalNotesByPatient(
      patientId!!,
      req.tenant_id,
      req.user?.userId,
      req.user?.role,
      {
        note_type: note_type as string,
        is_signed: is_signed === 'true'
      }
    );

    res.json(notes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get clinical note by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { id } = req.params;

    const note = await ClinicalNoteService.getClinicalNoteById(
      id!!,
      req.tenant_id,
      req.user?.userId,
      req.user?.role
    );

    res.json(note);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Update clinical note (admin, therapist)
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'THERAPIST']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { id } = req.params;
    const updates = req.body;

    const auditContext: { user_id?: string; ip_address?: string; user_agent?: string } = {};
    if (req.user?.userId) auditContext.user_id = req.user.userId;
    if (req.ip) auditContext.ip_address = req.ip;
    const userAgent = req.get('User-Agent');
    if (userAgent) auditContext.user_agent = userAgent;

    const note = await ClinicalNoteService.updateClinicalNote(
      id!!,
      req.tenant_id,
      updates,
      auditContext,
      req.user?.userId,
      req.user?.role
    );

    res.json(note);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Sign clinical note (admin, therapist)
router.post('/:id/sign', authenticateToken, requireRole(['ADMIN', 'THERAPIST']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { id } = req.params;

    const auditContext: { user_id?: string; ip_address?: string; user_agent?: string } = {};
    if (req.user?.userId) auditContext.user_id = req.user.userId;
    if (req.ip) auditContext.ip_address = req.ip;
    const userAgent = req.get('User-Agent');
    if (userAgent) auditContext.user_agent = userAgent;

    const note = await ClinicalNoteService.signClinicalNote(
      id!!,
      req.tenant_id,
      auditContext,
      req.user?.userId,
      req.user?.role
    );

    res.json(note);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete clinical note (admin only)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { id } = req.params;

    const auditContext: { user_id?: string; ip_address?: string; user_agent?: string } = {};
    if (req.user?.userId) auditContext.user_id = req.user.userId;
    if (req.ip) auditContext.ip_address = req.ip;
    const userAgent = req.get('User-Agent');
    if (userAgent) auditContext.user_agent = userAgent;

    const result = await ClinicalNoteService.deleteClinicalNote(
      id!!,
      req.tenant_id,
      auditContext
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Add this route for flat, role-based notes fetching
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const userId = req.user?.userId;
    const role = req.user?.role;
    const notes = await ClinicalNoteService.getClinicalNotesByTenant(req.tenant_id, userId, role);
    res.json(notes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 