import { Router, Request, Response } from 'express';
import { AppointmentService } from '../services/appointmentService';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Create appointment (admin, therapist)
router.post('/', authenticateToken, requireRole(['ADMIN', 'THERAPIST']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.tenant_id) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const appointmentData = {
      ...req.body,
      tenant_id: req.tenant_id
    };

    // If the user is a therapist, automatically set them as the therapist_id
    // If the user is an admin, they can specify any therapist_id
    if (req.user?.role === 'THERAPIST') {
      appointmentData.therapist_id = req.user.userId;
    }

    const auditContext: { user_id?: string; ip_address?: string; user_agent?: string } = {};
    if (req.user?.userId) auditContext.user_id = req.user.userId;
    if (req.ip) auditContext.ip_address = req.ip;
    const userAgent = req.get('User-Agent');
    if (userAgent) auditContext.user_agent = userAgent;

    const appointment = await AppointmentService.createAppointment(
      appointmentData,
      auditContext
    );

    res.status(201).json(appointment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get appointments
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenant_id = req.tenant_id;
    
    const appointments = await AppointmentService.getAppointmentsByTenant(
      tenant_id as string,
      req.user?.userId,
      req.user?.role,
    );
    
    res.json(appointments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointment by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenant_id = req.tenant_id;

    const appointment = await AppointmentService.getAppointmentById(
      id!!,
      tenant_id!!,
      req.user?.userId,
      req.user?.role
    );

    res.json(appointment);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Update appointment (admin, therapist)
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'THERAPIST']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenant_id = req.tenant_id;
    const updates = req.body;

    const appointment = await AppointmentService.updateAppointment(
      id!!,
      tenant_id!!,
      updates,
      {
        user_id: req.user?.userId,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      },
      req.user?.userId,
      req.user?.role
    );

    res.json(appointment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Start televisit (admin, therapist)
router.post('/:id/startTelevisit', authenticateToken, requireRole(['ADMIN', 'THERAPIST']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenant_id = req.tenant_id;

    const result = await AppointmentService.startTelevisit(
      id!!,
      tenant_id!!,
      {
        user_id: req.user?.userId,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      }
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete appointment (admin only)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenant_id = req.tenant_id;

    const result = await AppointmentService.deleteAppointment(
      id!!,
      tenant_id!!,
      {
        user_id: req.user?.userId,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      }
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router; 