import { Router, Request, Response } from 'express';
import { UserService } from '../services/userService';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Login endpoint
router.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    
    const { email, password, tenant_domain } = req.body;
    
    if (!email || !password || !tenant_domain) {
      return res.status(400).json({ error: 'Email, password, and tenant_id are required' });
    }

    const result = await UserService.login({ email, password, tenant_domain });
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// Create user (admin only)
router.post('/users', authenticateToken, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, first_name, last_name, role } = req.body;
    const tenant_id = req.tenant_id;

    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['admin', 'therapist', 'client'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await UserService.createUser(
      { tenantId: tenant_id!!, email, password, firstName:first_name, lastName:last_name, role },
      {
        userId: req.user?.userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get users (admin only)
router.get('/users', authenticateToken, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await UserService.getUsersByTenant(req.tenant_id!!);

    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/users/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenant_id = req.tenant_id;

    const user = await UserService.getUserById(id!!, tenant_id!!);
    res.json(user);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Update user
router.put('/users/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenant_id = req.tenant_id;
    const updates = req.body;

    // Only admins can update other users, or users can update themselves
    if (req.user?.role !== 'admin' && req.user?.userId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await UserService.updateUser(
      id!!,
      tenant_id!!,
      updates,
      {
        userId: req.user?.userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get users by role (therapist/patient access)
router.get('/usersbyrole', authenticateToken, requireRole(['ADMIN', 'THERAPIST', 'CLIENT']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenant_id = req.tenant_id;
    let { role } = req.query;
    if (!role || typeof role !== 'string') {
      return res.status(400).json({ error: 'Role is required' });
    }
    role = role.toUpperCase(); // Ensure role is uppercase

    // Validate that role is a valid UserRole
    const validRoles = ['ADMIN', 'THERAPIST', 'CLIENT'] as const;
    type UserRole = typeof validRoles[number];
    if (!validRoles.includes(role as UserRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const users = await UserService.getUsersByTenant(tenant_id!!, role as UserRole);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 